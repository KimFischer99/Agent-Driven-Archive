#!/usr/bin/env python3
"""Batch PDF OCR via PaddleOCR API, optional minimum-edit cleanup with Claude Code."""
import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

import requests

REQUEST_CONFIG_PATH = Path(__file__).resolve().parent.parent / "request.json"

HTML_RE = re.compile(r"<div[^>]*>.*?</div>|<img[^>]*\/?>|!\[.*?\]\(.*?\)", re.S)
SPACE_RE = re.compile(r"[ \t\r\f\v]+")
BLANK_RE = re.compile(r"\n{3,}")
FENCE_RE = re.compile(r"^```(?:markdown|md|text)?\s*\n|\n```\s*$", re.I)
SENTENCE_END_RE = re.compile(r"([。！？!?；;])")
SOFT_BREAK_RE = re.compile(r"([，、,：:])")
CLEAN_RE = re.compile(r"<clean>(.*?)</clean>", re.S | re.I)
META_LINE_RE = re.compile(
    r"(?m)^\s*(?:以下是|下面是|Here is|The following|"
    r"\*\*(?:更動記錄|修改說明|保存提醒|Change log|Notes?)[:：]\*\*).*$"
)
EDGE_END_CLOSER_RE = re.compile(r"[。！？!?；;：:，、】【\"'”’」』）)]+$")
EDGE_START_PUNCT_RE = re.compile(r"^[。！？!?；;：:，、]+")
CLAUDE_SYSTEM_PROMPT = (
    "You are a strict OCR text filter. Return only cleaned source text wrapped in "
    "<clean>...</clean>. No explanations, notes, change logs, reminders, questions, "
    "headings, bullets, or commentary outside the source text."
)


@dataclass
class Page:
    page_no: int
    raw_text: str = ""
    script_text: str = ""
    llm_text: str = ""
    final_text: str = ""
    llm_used: bool = False
    llm_fallback: bool = False
    error: str | None = None
    llm_calls: list[dict] = field(default_factory=list)


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).astimezone().isoformat(timespec="seconds")


def load_request_config(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    required = ("api_url", "token", "model")
    missing = [key for key in required if not data.get(key)]
    if missing:
        raise RuntimeError(f"request config missing fields: {', '.join(missing)}")
    optional_payload = data.get("optional_payload")
    if optional_payload is None:
        data["optional_payload"] = {}
    elif not isinstance(optional_payload, dict):
        raise RuntimeError("request config optional_payload must be an object")
    return data


def request_with_retries(method: str, url: str, *, retries: int, timeout: int, **kwargs):
    last_error = None
    for attempt in range(retries + 1):
        try:
            resp = requests.request(method, url, timeout=timeout, **kwargs)
            if resp.status_code not in {429, 500, 502, 503, 504}:
                return resp
            last_error = RuntimeError(f"HTTP {resp.status_code}: {resp.text[:500]}")
        except requests.RequestException as exc:
            last_error = exc
        if attempt < retries:
            time.sleep(min(2 ** attempt, 10))
    raise last_error


def submit_job(pdf_path: Path, args) -> str:
    headers = {"Authorization": f"bearer {args.request_config_data['token']}"}
    with pdf_path.open("rb") as f:
        data = {
            "model": args.request_config_data["model"],
            "optionalPayload": json.dumps(args.request_config_data["optional_payload"]),
        }
        files = {"file": f}
        resp = request_with_retries(
            "POST", args.request_config_data["api_url"], headers=headers, data=data, files=files,
            retries=args.retries, timeout=args.request_timeout,
        )
    if resp.status_code != 200:
        raise RuntimeError(f"upload failed HTTP {resp.status_code}: {resp.text[:1000]}")
    return resp.json()["data"]["jobId"]


def poll_job(job_id: str, args) -> str:
    headers = {"Authorization": f"bearer {args.request_config_data['token']}"}
    deadline = time.time() + args.poll_timeout
    while time.time() < deadline:
        resp = request_with_retries(
            "GET", f"{args.request_config_data['api_url']}/{job_id}", headers=headers,
            retries=args.retries, timeout=args.request_timeout,
        )
        if resp.status_code != 200:
            raise RuntimeError(f"poll failed HTTP {resp.status_code}: {resp.text[:1000]}")
        data = resp.json()["data"]
        state = data.get("state")
        if state == "done":
            return data["resultUrl"]["jsonUrl"]
        if state == "failed":
            raise RuntimeError(data.get("errorMsg") or "remote OCR failed")
        time.sleep(args.poll_interval)
    raise TimeoutError(f"poll timeout after {args.poll_timeout}s")


def strip_noise(text: str) -> str:
    tagged = CLEAN_RE.search(text)
    if tagged:
        text = tagged.group(1)
    text = HTML_RE.sub("", text)
    text = META_LINE_RE.sub("", text)
    text = re.sub(r"(?m)^\s{0,3}#{1,6}\s+", "", text)
    text = SPACE_RE.sub(" ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = BLANK_RE.sub("\n\n", text)
    return text.strip()


def merge_single_char_lines(text: str) -> str:
    lines = [line.strip() for line in text.splitlines()]
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if len(line) == 1 and "一" <= line <= "鿿":
            chars = [line]
            j = i + 1
            while j < len(lines):
                nxt = lines[j].strip()
                if not nxt:
                    j += 1
                    continue
                if len(nxt) == 1 and "一" <= nxt <= "鿿":
                    chars.append(nxt)
                    j += 1
                    continue
                break
            if len(chars) >= 2:
                out.append("".join(chars))
                i = j
                continue
        out.append(line)
        i += 1
    return "\n".join(out)


def split_on_marks(block: str, marks_re: re.Pattern, min_len: int) -> list[str]:
    parts = [p for p in marks_re.split(block) if p]
    out = []
    current = ""
    for part in parts:
        current += part
        if marks_re.fullmatch(part) and len(current) >= min_len:
            out.append(current.strip())
            current = ""
    if current.strip():
        out.append(current.strip())
    return out


def split_long_paragraphs(text: str, limit: int = 180) -> str:
    blocks = [block.strip() for block in re.split(r"\n\s*\n", text) if block.strip()]
    out = []
    for block in blocks:
        block = re.sub(r"\s*\n\s*", "", block)
        if len(block) <= limit:
            out.append(block)
            continue
        strong_parts = split_on_marks(block, SENTENCE_END_RE, 60)
        for part in strong_parts:
            if len(part) <= limit:
                out.append(part)
            else:
                out.extend(split_on_marks(part, SOFT_BREAK_RE, 80))
    return "\n\n".join(out)


def basic_clean(text: str) -> str:
    return split_long_paragraphs(merge_single_char_lines(strip_noise(text)))


def split_blocks(text: str) -> list[str]:
    return [block.strip() for block in re.split(r"\n\s*\n", text) if block.strip()]


def normalize_boundary_title(block: str) -> str:
    text = re.sub(r"\s+", "", block)
    text = re.sub(r"^[0-9０-９一二三四五六七八九十百千]+", "", text)
    text = re.sub(r"[0-9０-９一二三四五六七八九十百千]+$", "", text)
    text = re.sub(r"[．.、,，:：;；\-—_()（）【】\[\]「」『』\"'“”‘’]+", "", text)
    return text


def strip_repeated_boundary_titles(pages: list[Page], attr_name: str):
    counts: dict[str, int] = {}
    for page in pages:
        blocks = split_blocks(getattr(page, attr_name))
        if not blocks:
            continue
        for block in (blocks[0], blocks[-1]):
            key = normalize_boundary_title(block)
            if 6 <= len(key) <= 24:
                counts[key] = counts.get(key, 0) + 1
    repeated = {key for key, count in counts.items() if count >= 2}
    if not repeated:
        return
    for page in pages:
        old_text = getattr(page, attr_name)
        blocks = split_blocks(old_text)
        if not blocks:
            continue
        if page.page_no > 1 and normalize_boundary_title(blocks[0]) in repeated:
            blocks = blocks[1:]
        if blocks and page.page_no < len(pages) and normalize_boundary_title(blocks[-1]) in repeated:
            blocks = blocks[:-1]
        new_text = "\n\n".join(blocks).strip()
        setattr(page, attr_name, new_text)
        if attr_name == "script_text" and page.final_text == old_text:
            page.final_text = new_text


def needs_llm_retry(text: str) -> bool:
    blocks = split_blocks(text)
    if len(blocks) >= 4:
        return False
    for block in blocks:
        dense = re.sub(r"\s+", "", block)
        cjk_chars = len(re.findall(r"[\u3400-\u9fff]", block))
        sentence_marks = len(re.findall(r"[。！？；]", block))
        if len(dense) >= 520:
            return True
        if len(dense) >= 380 and sentence_marks == 0:
            return True
        if cjk_chars >= 220 and sentence_marks == 0:
            return True
    return False


def needs_claude(page_text: str, args) -> bool:
    if args.llm == "off":
        return False
    return True


def make_page(page_no: int, raw_text: str) -> Page:
    script_text = basic_clean(raw_text)
    return Page(
        page_no=page_no,
        raw_text=raw_text,
        script_text=script_text,
        final_text=script_text,
    )


def fetch_pages(jsonl_url: str, args) -> list[Page]:
    resp = request_with_retries("GET", jsonl_url, retries=args.retries, timeout=args.request_timeout)
    resp.raise_for_status()
    pages = []
    page_no = 0
    for line in resp.text.splitlines():
        line = line.strip()
        if not line:
            continue
        result = json.loads(line).get("result", {})
        entries = result.get("layoutParsingResults", [])
        if entries:
            for entry in entries:
                page_no += 1
                pages.append(make_page(page_no, entry.get("markdown", {}).get("text", "")))
        else:
            text = result.get("markdown", {}).get("text", "")
            if text:
                page_no += 1
                pages.append(make_page(page_no, text))
    strip_repeated_boundary_titles(pages, "script_text")
    return pages


def empty_llm_stats(page_no: int, retry: bool = False) -> dict:
    return {
        "page": page_no,
        "retry": retry,
        "input_tokens": 0,
        "output_tokens": 0,
        "cache_read_input_tokens": 0,
        "cache_creation_input_tokens": 0,
        "cost_usd": 0.0,
        "duration_ms": 0,
        "model_usage": {},
    }


def add_llm_stats(total: dict, call: dict):
    total["calls"] += 1
    total["input_tokens"] += call.get("input_tokens", 0) or 0
    total["output_tokens"] += call.get("output_tokens", 0) or 0
    total["cache_read_input_tokens"] += call.get("cache_read_input_tokens", 0) or 0
    total["cache_creation_input_tokens"] += call.get("cache_creation_input_tokens", 0) or 0
    total["cost_usd"] += call.get("cost_usd", 0.0) or 0.0
    total["duration_ms"] += call.get("duration_ms", 0) or 0
    total["call_details"].append(call)


def run_claude(prompt: str, page_no: int, args, *, retry: bool = False) -> tuple[str, dict]:
    cmd = [
        args.claude_cmd,
        "-p",
        "--safe-mode",
        "--no-session-persistence",
        "--permission-mode", "dontAsk",
        "--tools", "",
        "--system-prompt", CLAUDE_SYSTEM_PROMPT,
        "--output-format", "json",
    ]
    if args.claude_effort:
        cmd += ["--effort", args.claude_effort]
    if args.claude_model:
        cmd += ["--model", args.claude_model]
    if args.max_budget_usd:
        cmd += ["--max-budget-usd", str(args.max_budget_usd)]
    proc = subprocess.run(
        cmd, input=prompt, text=True, capture_output=True, timeout=args.llm_timeout
    )
    if proc.returncode != 0:
        raise RuntimeError(f"claude failed on page {page_no}: {proc.stderr.strip() or proc.stdout.strip()}")
    stats = empty_llm_stats(page_no, retry=retry)
    try:
        result = json.loads(proc.stdout)
        text = result.get("result", "")
        usage = result.get("usage", {}) or {}
        stats.update({
            "input_tokens": usage.get("input_tokens", 0) or 0,
            "output_tokens": usage.get("output_tokens", 0) or 0,
            "cache_read_input_tokens": usage.get("cache_read_input_tokens", 0) or 0,
            "cache_creation_input_tokens": usage.get("cache_creation_input_tokens", 0) or 0,
            "cost_usd": result.get("total_cost_usd", 0.0) or 0.0,
            "duration_ms": result.get("duration_ms", 0) or 0,
            "model_usage": result.get("modelUsage", {}) or {},
        })
    except json.JSONDecodeError:
        text = proc.stdout.strip()
    text = FENCE_RE.sub("", text).strip()
    return strip_noise(text), stats


def preserve_page_break_edges(source_text: str, cleaned_text: str, page_no: int, total_pages: int) -> str:
    text = cleaned_text
    if page_no > 1:
        src = source_text.lstrip()
        out = text.lstrip()
        if src and out and out[0] in "。！？!?；;：:，、" and src[0] not in "。！？!?；;：:，、":
            leading_ws = text[: len(text) - len(text.lstrip())]
            text = leading_ws + EDGE_START_PUNCT_RE.sub("", out)
    if page_no < total_pages:
        src = source_text.rstrip()
        out = text.rstrip()
        if src and out and src[-1] not in "。！？!?；;：:，、】【\"'”’」』）)]" and out[-1] in "。！？!?；;：:，、】【\"'”’」』）)]":
            trailing_ws = text[len(text.rstrip()):]
            text = EDGE_END_CLOSER_RE.sub("", out) + trailing_ws
    return text


def claude_clean(page_text: str, page_no: int, total_pages: int, args) -> tuple[str, list[dict]]:
    if not page_text.strip():
        return "", []
    boundary_rule = (
        "The start and end of this page may be cut by page breaks. "
        "Do not add punctuation at the page start or page end just to complete a boundary fragment. "
    )
    if page_no < total_pages:
        boundary_rule += "Assume the text may continue on the next page unless the source already clearly closes."
    else:
        boundary_rule += "Only add final punctuation where the source clearly ends."
    prompt = (
        "OCR minimum edit. Preserve original language(s), script, wording, order. "
        "No translation, explanation, expansion, summary, modernization, inferred names, or added content. "
        "Add sentence punctuation and paragraph breaks across the whole page; do not leave long OCR run-ons. "
        f"{boundary_rule} "
        "Only fix obvious OCR errors, whitespace, clear page numbers/running headers. "
        "If unsure, keep OCR text. Output only <clean>cleaned text</clean>; no notes or change logs.\n\n"
        f"Page {page_no} OCR:\n{page_text}"
    )
    text, first_stats = run_claude(prompt, page_no, args)
    calls = [first_stats]
    if needs_llm_retry(text):
        print(f"  Claude retry page {page_no}: long run-on text remains")
        retry_prompt = (
            "The OCR page is still under-segmented. Minimum edit only: preserve all original language(s), "
            "wording, and order. Add sentence punctuation and paragraph breaks throughout the page. "
            "Do not translate, explain, summarize, expand, or add content. "
            "Do not force punctuation at the page start or page end if the source looks cut by a page break. "
            "If uncertain, keep the text. "
            "Output only <clean>cleaned text</clean>; no notes or change logs.\n\n"
            f"Page {page_no} text:\n{text}"
        )
        text, retry_stats = run_claude(retry_prompt, page_no, args, retry=True)
        calls.append(retry_stats)
    return preserve_page_break_edges(page_text, text, page_no, total_pages), calls


def init_llm_total() -> dict:
    return {
        "mode": None,
        "pages": [],
        "retried_pages": [],
        "fallback_pages": [],
        "failed_pages": [],
        "calls": 0,
        "input_tokens": 0,
        "output_tokens": 0,
        "cache_read_input_tokens": 0,
        "cache_creation_input_tokens": 0,
        "cost_usd": 0.0,
        "duration_ms": 0,
        "page_details": [],
        "call_details": [],
        "warnings": [],
    }


def finalize_page(page: Page, pages_total: int, llm_total: dict, args):
    if not needs_claude(page.script_text, args):
        llm_total["page_details"].append({
            "page": page.page_no,
            "llm_used": False,
            "fallback": False,
            "error": None,
            "chars": len(page.final_text),
        })
        return
    print(f"  Claude cleanup page {page.page_no}/{pages_total}")
    llm_total["pages"].append(page.page_no)
    page.llm_used = True
    try:
        page.llm_text, page.llm_calls = claude_clean(page.script_text, page.page_no, pages_total, args)
        page.final_text = page.llm_text or page.script_text
        for call in page.llm_calls:
            add_llm_stats(llm_total, call)
            if call.get("retry"):
                llm_total["retried_pages"].append(page.page_no)
            print(
                "    usage:"
                f" in={call.get('input_tokens', 0)}"
                f" out={call.get('output_tokens', 0)}"
                f" cost=${call.get('cost_usd', 0.0):.6f}"
            )
        if needs_llm_retry(page.final_text):
            llm_total["warnings"].append(f"page {page.page_no}: long text remains after Claude")
    except Exception as exc:
        page.error = str(exc)
        page.llm_fallback = True
        page.final_text = page.script_text
        llm_total["fallback_pages"].append(page.page_no)
        llm_total["failed_pages"].append(page.page_no)
        llm_total["warnings"].append(f"page {page.page_no}: Claude failed, used script fallback")
        print(f"    fallback: {page.error}")
    llm_total["page_details"].append({
        "page": page.page_no,
        "llm_used": page.llm_used,
        "fallback": page.llm_fallback,
        "error": page.error,
        "chars": len(page.final_text),
    })


def build_markdown(pdf_path: Path, pages: list[Page], args) -> tuple[str, dict]:
    title = pdf_path.stem
    llm_total = init_llm_total()
    llm_total["mode"] = args.llm
    body = [
        "---",
        f"source_pdf: {pdf_path.name}",
        f"created_at: {now_iso()}",
        "---",
        "",
        f"# {title}",
        "",
    ]
    for page in pages:
        finalize_page(page, len(pages), llm_total, args)
    strip_repeated_boundary_titles(pages, "final_text")
    for page in pages:
        body += [f"### Page {page.page_no}", "", page.final_text.strip(), ""]
    llm_total["pages"] = sorted(set(llm_total["pages"]))
    llm_total["retried_pages"] = sorted(set(llm_total["retried_pages"]))
    llm_total["fallback_pages"] = sorted(set(llm_total["fallback_pages"]))
    llm_total["failed_pages"] = sorted(set(llm_total["failed_pages"]))
    return ("\n".join(body).strip() + "\n"), llm_total


def append_log(pdf_path: Path, record: dict):
    log_path = pdf_path.parent / "_ocr_batch_log.jsonl"
    with log_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def process_pdf(pdf_path: Path, args) -> dict:
    out_path = pdf_path.with_suffix(".md")
    record = {
        "source_pdf": str(pdf_path),
        "output_md": str(out_path),
        "created_at": now_iso(),
        "status": None,
    }
    if out_path.exists() and not args.overwrite:
        record["status"] = "skipped"
        record["reason"] = "output exists"
        append_log(pdf_path, record)
        return record
    try:
        print(f"PDF: {pdf_path}")
        job_id = submit_job(pdf_path, args)
        record["job_id"] = job_id
        jsonl_url = poll_job(job_id, args)
        pages = fetch_pages(jsonl_url, args)
        content, llm_total = build_markdown(pdf_path, pages, args)
        tmp_path = out_path.with_suffix(out_path.suffix + ".tmp")
        tmp_path.write_text(content, encoding="utf-8")
        tmp_path.replace(out_path)
        record.update({
            "status": "ok",
            "pages": len(pages),
            "chars": len(content),
            "llm": llm_total,
        })
        print(f"  ok: {out_path} ({len(content)} chars)")
        if llm_total["calls"]:
            print(
                "  Claude total:"
                f" calls={llm_total['calls']}"
                f" pages={llm_total['pages']}"
                f" retries={llm_total['retried_pages']}"
                f" input={llm_total['input_tokens']}"
                f" output={llm_total['output_tokens']}"
                f" cost=${llm_total['cost_usd']:.6f}"
            )
    except Exception as exc:
        record.update({"status": "failed", "error": str(exc)})
        print(f"  failed: {exc}")
    append_log(pdf_path, record)
    return record


def collect_targets(paths: list[str], recursive: bool) -> list[Path]:
    if not paths:
        paths = ["OCR"] if Path("OCR").is_dir() else ["."]
    targets = []
    for item in paths:
        path = Path(item).expanduser().resolve()
        if path.is_file() and path.suffix.lower() == ".pdf":
            targets.append(path)
        elif path.is_dir():
            globber = path.rglob if recursive else path.glob
            targets.extend(sorted(globber("*.pdf")))
        else:
            print(f"skip non-PDF: {item}")
    return sorted(dict.fromkeys(targets))


def parse_args():
    parser = argparse.ArgumentParser(description="Batch OCR PDFs with PaddleOCR API and Claude Code cleanup.")
    parser.add_argument("paths", nargs="*", help="PDF file(s) or directory/directories. Default: OCR/ if present, else cwd.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing .md outputs. Default: skip.")
    parser.add_argument("--recursive", action="store_true", help="Find PDFs recursively in directories.")
    parser.add_argument(
        "--llm",
        choices=("always", "off"),
        default="always",
        help="Claude cleanup mode. always sends every page after script cleanup; off is fallback when Claude cleanup is unavailable.",
    )
    parser.add_argument("--no-llm", dest="llm", action="store_const", const="off", help="Fallback mode when Claude cleanup is unavailable.")
    parser.add_argument("--claude-cmd", default=os.environ.get("CLAUDE_CMD", "claude"), help="Claude Code CLI command.")
    parser.add_argument("--claude-model", default=os.environ.get("CLAUDE_MODEL"), help="Optional Claude model/alias.")
    parser.add_argument("--claude-effort", default=os.environ.get("CLAUDE_EFFORT", "low"), help="Claude Code effort level. Default: low.")
    parser.add_argument(
        "--request-config",
        default=os.environ.get("PADDLE_OCR_REQUEST_CONFIG", str(REQUEST_CONFIG_PATH)),
        help="Path to PaddleOCR request JSON.",
    )
    parser.add_argument("--max-budget-usd", type=float, default=None, help="Optional Claude CLI budget per page.")
    parser.add_argument("--request-timeout", type=int, default=60)
    parser.add_argument("--poll-timeout", type=int, default=900)
    parser.add_argument("--poll-interval", type=int, default=5)
    parser.add_argument("--llm-timeout", type=int, default=240)
    parser.add_argument("--retries", type=int, default=2)
    return parser.parse_args()


def main():
    args = parse_args()
    args.request_config_data = load_request_config(Path(args.request_config).expanduser().resolve())
    targets = collect_targets(args.paths, args.recursive)
    if not targets:
        print("No PDF files found.")
        return 0
    print(f"Found {len(targets)} PDF file(s). LLM cleanup: {args.llm}")
    records = [process_pdf(pdf, args) for pdf in targets]
    ok = sum(r["status"] == "ok" for r in records)
    skipped = sum(r["status"] == "skipped" for r in records)
    failed = sum(r["status"] == "failed" for r in records)
    print(f"Done. ok={ok} skipped={skipped} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
