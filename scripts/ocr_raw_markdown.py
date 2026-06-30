#!/usr/bin/env python3
"""Fetch PaddleOCR-style markdown without cleanup for layout-sensitive PDFs."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import time
from pathlib import Path

import requests

DEFAULT_REQUEST_CONFIG = Path("skills/paddle-ocr-markdown/request.json")

TABLE_LAYOUT_PAYLOAD = {
    "useDocOrientationClassify": False,
    "useDocUnwarping": False,
    "useLayoutDetection": True,
    "useChartRecognition": False,
    "layoutThreshold": 0.1,
    "layoutNms": False,
    "layoutUnclipRatio": 1.2,
    "layoutMergeBboxesMode": "union",
    "temperature": 0.0,
    "topP": 0.7,
    "repetitionPenalty": 1.2,
}


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


def submit_job(pdf_path: Path, config: dict, args) -> str:
    headers = {"Authorization": f"bearer {config['token']}"}
    with pdf_path.open("rb") as file:
        data = {
            "model": config["model"],
            "optionalPayload": json.dumps(config.get("optional_payload", {}), ensure_ascii=False),
        }
        response = request_with_retries(
            "POST",
            config["api_url"],
            headers=headers,
            data=data,
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


def fetch_markdown(jsonl_url: str, args) -> str:
    response = request_with_retries("GET", jsonl_url, retries=args.retries, timeout=args.request_timeout)
    response.raise_for_status()
    pages: list[str] = []
    page_no = 0
    for line in response.text.splitlines():
        if not line.strip():
            continue
        result = json.loads(line).get("result", {})
        entries = result.get("layoutParsingResults") or [result]
        for entry in entries:
            text = (entry.get("markdown") or {}).get("text") or ""
            if text.strip():
                page_no += 1
                pages.append(f"### Page {page_no}\n\n{text.strip()}")
    return "\n\n".join(pages).strip()


def load_config(config_path: Path) -> dict:
    config = json.loads(config_path.expanduser().read_text(encoding="utf-8"))
    optional_payload = {**config.get("optional_payload", {}), **TABLE_LAYOUT_PAYLOAD}
    return {**config, "optional_payload": optional_payload}


def main() -> int:
    parser = argparse.ArgumentParser(description="Remote OCR raw Markdown export for layout-sensitive PDFs.")
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--request-config", type=Path, default=DEFAULT_REQUEST_CONFIG)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--request-timeout", type=int, default=120)
    parser.add_argument("--poll-timeout", type=int, default=600)
    parser.add_argument("--poll-interval", type=int, default=5)
    parser.add_argument("--retries", type=int, default=2)
    args = parser.parse_args()

    if not args.request_config.exists():
      raise FileNotFoundError(
          f"Missing request config: {args.request_config}. Create it from skills/paddle-ocr-markdown/request.template.json."
      )

    config = load_config(args.request_config)
    output = args.output or args.pdf.with_suffix(".md")
    job_id = submit_job(args.pdf, config, args)
    jsonl_url = poll_job(job_id, config, args)
    markdown = fetch_markdown(jsonl_url, args)
    if not markdown:
        raise RuntimeError("OCR provider returned empty markdown")
    header = [
        "---",
        f"source_pdf: {args.pdf.name}",
        f"created_at: {dt.datetime.now(dt.timezone.utc).astimezone().isoformat(timespec='seconds')}",
        "ocr_mode: raw_layout_markdown",
        "---",
        "",
        f"# {args.pdf.stem}",
        "",
    ]
    output.write_text("\n".join(header) + markdown + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "chars": len(markdown)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

