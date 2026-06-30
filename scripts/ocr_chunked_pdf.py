#!/usr/bin/env python3
"""Chunk a scanned PDF, OCR each chunk through a remote provider, and combine the Markdown output."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import time
from pathlib import Path

import fitz
import requests

DEFAULT_REQUEST_CONFIG = Path("skills/paddle-ocr-markdown/request.json")

DOCUMENT_PAYLOAD = {
    "useDocOrientationClassify": False,
    "useDocUnwarping": False,
    "useLayoutDetection": True,
    "useChartRecognition": False,
    "temperature": 0.0,
    "topP": 0.7,
    "repetitionPenalty": 1.2,
}


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).astimezone().isoformat(timespec="seconds")


def request_with_retries(method: str, url: str, *, retries: int, timeout: int, **kwargs):
    last_error = None
    for attempt in range(retries + 1):
        try:
            response = requests.request(method, url, timeout=timeout, **kwargs)
            if response.status_code not in {429, 500, 502, 503, 504}:
                return response
            last_error = RuntimeError(f"HTTP {response.status_code}: {response.text[:500]}")
        except requests.RequestException as exc:
            last_error = exc
        if attempt < retries:
            time.sleep(min(2 ** attempt, 10))
    raise last_error


def load_config(path: Path) -> dict:
    config = json.loads(path.expanduser().read_text(encoding="utf-8"))
    payload = {**config.get("optional_payload", {}), **DOCUMENT_PAYLOAD}
    return {**config, "optional_payload": payload}


def split_pdf(pdf_path: Path, output_dir: Path, chunk_pages: int) -> list[dict]:
    output_dir.mkdir(parents=True, exist_ok=True)
    source = fitz.open(pdf_path)
    chunks = []
    stem = slug(pdf_path.stem)
    for start in range(0, source.page_count, chunk_pages):
        end = min(start + chunk_pages, source.page_count)
        chunk_path = output_dir / f"{stem}_p{start + 1:03d}-{end:03d}.pdf"
        if not chunk_path.exists():
            doc = fitz.open()
            doc.insert_pdf(source, from_page=start, to_page=end - 1)
            doc.save(chunk_path)
            doc.close()
        chunks.append({"pdf": chunk_path, "start_page": start + 1, "end_page": end})
    source.close()
    return chunks


def slug(value: str) -> str:
    value = re.sub(r"\s+", "_", value.strip().lower())
    value = re.sub(r"[^0-9a-zA-Z_\-\u3400-\u9fff]+", "", value)
    return value or "document"


def submit_job(pdf_path: Path, config: dict, args) -> str:
    headers = {"Authorization": f"bearer {config['token']}"}
    with pdf_path.open("rb") as file:
        response = request_with_retries(
            "POST",
            config["api_url"],
            headers=headers,
            data={
                "model": config["model"],
                "optionalPayload": json.dumps(config.get("optional_payload", {}), ensure_ascii=False),
            },
            files={"file": file},
            retries=args.retries,
            timeout=args.request_timeout,
        )
    if response.status_code != 200:
        raise RuntimeError(f"upload failed HTTP {response.status_code}: {response.text[:1000]}")
    return response.json()["data"]["jobId"]


def poll_job(job_id: str, config: dict, args) -> str:
    headers = {"Authorization": f"bearer {config['token']}"}
    deadline = time.time() + args.poll_timeout
    while time.time() < deadline:
        response = request_with_retries(
            "GET",
            f"{config['api_url']}/{job_id}",
            headers=headers,
            retries=args.retries,
            timeout=args.request_timeout,
        )
        if response.status_code != 200:
            raise RuntimeError(f"poll failed HTTP {response.status_code}: {response.text[:1000]}")
        data = response.json()["data"]
        if data.get("state") == "done":
            return data["resultUrl"]["jsonUrl"]
        if data.get("state") == "failed":
            raise RuntimeError(data.get("errorMsg") or "remote OCR failed")
        time.sleep(args.poll_interval)
    raise TimeoutError(f"poll timeout after {args.poll_timeout}s")


def fetch_pages(jsonl_url: str, args) -> list[str]:
    response = request_with_retries("GET", jsonl_url, retries=args.retries, timeout=args.request_timeout)
    response.raise_for_status()
    pages = []
    for line in response.text.splitlines():
        if not line.strip():
            continue
        result = json.loads(line).get("result", {})
        entries = result.get("layoutParsingResults")
        if entries:
            for entry in entries:
                text = ((entry.get("markdown") or {}).get("text") or "").strip()
                pages.append(text)
        else:
            text = ((result.get("markdown") or {}).get("text") or "").strip()
            pages.append(text)
    return pages


def write_chunk_markdown(output_path: Path, source_pdf: Path, start_page: int, pages: list[str]) -> None:
    lines = [
        "---",
        f"source_pdf: {source_pdf.name}",
        f"source_pages: {start_page}-{start_page + len(pages) - 1}",
        f"created_at: {now_iso()}",
        "ocr_mode: chunked_remote_ocr",
        "---",
        "",
        f"# {source_pdf.stem}",
        "",
    ]
    for index, text in enumerate(pages, start=start_page):
        lines.extend([f"## Page {index}", "", text.strip() or "[[OCR_EMPTY_PAGE]]", ""])
    output_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def ocr_pdf(pdf_path: Path, output_path: Path, start_page: int, config: dict, args) -> dict:
    started = time.time()
    job_id = submit_job(pdf_path, config, args)
    jsonl_url = poll_job(job_id, config, args)
    pages = fetch_pages(jsonl_url, args)
    write_chunk_markdown(output_path, pdf_path, start_page, pages)
    return {
        "source_pdf": str(pdf_path),
        "output_md": str(output_path),
        "created_at": now_iso(),
        "status": "ok",
        "job_id": job_id,
        "source_pages": [start_page, start_page + len(pages) - 1],
        "pages": len(pages),
        "chars": sum(len(page) for page in pages),
        "duration_seconds": round(time.time() - started, 2),
    }


def append_log(log_path: Path, record: dict) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as file:
        file.write(json.dumps(record, ensure_ascii=False) + "\n")


def combine_chunks(chunk_dir: Path, combined_output: Path) -> dict:
    chunks = sorted(chunk_dir.glob("*.md"))
    page_blocks = {}
    page_char_counts = {}
    body = []
    for chunk in chunks:
        text = chunk.read_text(encoding="utf-8")
        content = re.sub(r"^---\n[\s\S]*?\n---\n+", "", text).strip()
        matches = list(re.finditer(r"^## Page (\d+)\s*$", content, re.M))
        for idx, match in enumerate(matches):
            page = int(match.group(1))
            start = match.start()
            end = matches[idx + 1].start() if idx + 1 < len(matches) else len(content)
            block = content[start:end].strip()
            page_blocks.setdefault(page, block)
            page_char_counts[page] = len(re.sub(r"^## Page \d+\s*", "", block).strip())
    for page in sorted(page_blocks):
        body.extend([page_blocks[page], ""])
    combined_output.write_text("\n".join(body).rstrip() + "\n", encoding="utf-8")
    return {
        "pages": len(page_blocks),
        "page_char_counts": page_char_counts,
        "chunk_files": [chunk.name for chunk in chunks],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Chunked remote OCR workflow for scanned PDFs.")
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--request-config", type=Path, default=DEFAULT_REQUEST_CONFIG)
    parser.add_argument("--chunk-pages", type=int, default=10)
    parser.add_argument("--workdir", type=Path)
    parser.add_argument("--request-timeout", type=int, default=120)
    parser.add_argument("--poll-timeout", type=int, default=600)
    parser.add_argument("--poll-interval", type=int, default=5)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--combine-only", action="store_true")
    args = parser.parse_args()

    if not args.request_config.exists():
        raise FileNotFoundError(
            f"Missing request config: {args.request_config}. Create it from skills/paddle-ocr-markdown/request.template.json."
        )

    workdir = args.workdir or args.pdf.with_suffix("")
    chunk_pdf_dir = workdir / "chunks_pdf"
    chunk_md_dir = workdir / "chunks_md"
    combined_output = workdir / f"{args.pdf.stem}.combined.md"
    log_path = workdir / "_ocr_chunk_log.jsonl"
    chunk_md_dir.mkdir(parents=True, exist_ok=True)

    if not args.combine_only:
        config = load_config(args.request_config)
        for chunk in split_pdf(args.pdf, chunk_pdf_dir, args.chunk_pages):
            output_path = chunk_md_dir / f"{chunk['pdf'].stem}.md"
            record = ocr_pdf(chunk["pdf"], output_path, chunk["start_page"], config, args)
            append_log(log_path, record)

    combined = combine_chunks(chunk_md_dir, combined_output)
    print(json.dumps({
        "ok": True,
        "combined_output": str(combined_output),
        **combined,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

