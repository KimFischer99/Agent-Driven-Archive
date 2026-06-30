#!/usr/bin/env python3
"""Batch convert PDF and DOCX to agent-readable Markdown via MarkItDown."""
import argparse
import os
import re
from pathlib import Path

from markitdown import MarkItDown


def strip_non_text(content: str) -> str:
    """Remove image references and other non-text artifacts."""
    content = re.sub(r'!\[.*?\]\(.*?\)', '', content)
    content = re.sub(r'<img[^>]*>', '', content)
    content = re.sub(r'\[image\]', '', content, flags=re.IGNORECASE)
    return content


def convert_file(file_path: Path, overwrite: bool = False) -> dict:
    """Convert a single PDF or DOCX file to Markdown."""
    ext = file_path.suffix.lower()
    out_path = file_path.with_suffix(".md")
    record = {
        "source": str(file_path),
        "output": str(out_path),
        "status": None,
    }

    if out_path.exists() and not overwrite:
        record["status"] = "skipped"
        record["reason"] = "output exists"
        return record

    try:
        md = MarkItDown()
        result = md.convert(str(file_path))
        content = result.text_content

        if not content or len(content.strip()) < 10:
            record["status"] = "failed"
            record["error"] = "empty or near-empty output"
            return record

        content = strip_non_text(content)
        tmp_path = out_path.with_suffix(out_path.suffix + ".tmp")
        tmp_path.write_text(content, encoding="utf-8")
        tmp_path.replace(out_path)

        record["status"] = "ok"
        record["words"] = len(content.split())
        record["chars"] = len(content)
    except Exception as exc:
        record["status"] = "failed"
        record["error"] = str(exc)

    return record


def collect_targets(paths: list[str], recursive: bool) -> list[Path]:
    """Collect PDF and DOCX files from given paths."""
    extensions = {".pdf", ".docx"}
    if not paths:
        paths = ["."]

    targets = []
    for item in paths:
        path = Path(item).expanduser().resolve()
        if path.is_file() and path.suffix.lower() in extensions:
            targets.append(path)
        elif path.is_dir():
            globber = path.rglob if recursive else path.glob
            for ext in extensions:
                targets.extend(sorted(globber(f"*{ext}")))
        else:
            print(f"skip: {item}")

    return sorted(dict.fromkeys(targets))


def parse_args():
    parser = argparse.ArgumentParser(
        description="Batch convert PDF and DOCX to Markdown via MarkItDown."
    )
    parser.add_argument(
        "paths", nargs="*",
        help="PDF/DOCX file(s) or directory/directories. Default: current directory.",
    )
    parser.add_argument(
        "--overwrite", action="store_true",
        help="Overwrite existing .md outputs. Default: skip.",
    )
    parser.add_argument(
        "--recursive", action="store_true",
        help="Find files recursively in directories.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    targets = collect_targets(args.paths, args.recursive)

    if not targets:
        print("No PDF or DOCX files found.")
        return 0

    print(f"Found {len(targets)} file(s).")
    records = [convert_file(f, args.overwrite) for f in targets]

    ok = sum(r["status"] == "ok" for r in records)
    skipped = sum(r["status"] == "skipped" for r in records)
    failed = sum(r["status"] == "failed" for r in records)

    for r in records:
        if r["status"] == "ok":
            print(f"  ok: {r['output']} ({r['words']} words)")
        elif r["status"] == "skipped":
            print(f"  skip: {r['output']} ({r['reason']})")
        else:
            print(f"  fail: {r['source']} — {r['error']}")

    print(f"Done. ok={ok} skipped={skipped} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
