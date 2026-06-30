#!/usr/bin/env python3
"""Render page images from a PDF for archive-viewer style interfaces."""

from __future__ import annotations

import argparse
from pathlib import Path

import fitz
from PIL import Image


def render_pdf_images(pdf_path: Path, output_dir: Path, scale: float, quality: int, force: bool) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf = fitz.open(pdf_path)
    for index in range(pdf.page_count):
        out_path = output_dir / f"page-{index + 1:03d}.jpg"
        if out_path.exists() and not force:
            continue
        pix = pdf[index].get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        mode = "RGB" if pix.n < 4 else "RGBA"
        image = Image.frombytes(mode, (pix.width, pix.height), pix.samples)
        if image.mode != "RGB":
            image = image.convert("RGB")
        image.save(out_path, "JPEG", quality=quality, optimize=True)
    page_count = pdf.page_count
    pdf.close()
    return page_count


def main() -> int:
    parser = argparse.ArgumentParser(description="Render archive-viewer page images from a PDF.")
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--scale", type=float, default=1.35)
    parser.add_argument("--quality", type=int, default=82)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    count = render_pdf_images(args.pdf, args.output_dir, args.scale, args.quality, args.force)
    print({"ok": True, "pages": count, "output_dir": str(args.output_dir)})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

