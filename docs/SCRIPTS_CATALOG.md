# Scripts Catalog

## Included And Reusable Now

### Starter Automation

- `scripts/check-workspace-structure.mjs`
  Validates the reusable workspace skeleton.
- `scripts/export-source-manifest.mjs`
  Scans Markdown files and emits a source manifest.
- `scripts/build-search-index.mjs`
  Generates a starter JSON search index from Markdown content.

### OCR / PDF Helpers

- `scripts/ocr_raw_markdown.py`
  Remote OCR for table-heavy or layout-sensitive PDFs, emitting raw Markdown.
- `scripts/ocr_chunked_pdf.py`
  Splits a scanned PDF into chunks, OCRs each chunk, and combines the Markdown.
- `scripts/render_pdf_page_images.py`
  Renders page images from a PDF for viewer-oriented public interfaces.

### Sanitized Skill Scripts

- `skills/paddle-ocr-markdown/scripts/paddle_ocr_markdown.py`
  OCR + deterministic cleanup + optional local AI cleanup.
- `skills/pdf-translation-local/scripts/translate_dual_pdf.sh`
  Local dual-PDF translation orchestration.

## Included But Still Starter-Level

- `scripts/build-search-index.mjs`
  Currently emits JSON, not a full SQLite FTS layer.
- `scripts/export-source-manifest.mjs`
  Emits content inventory, not full archive/export databases.

## Not Yet Extracted Because They Are Too Corpus-Specific

These exist in the source project but are not yet suitable for direct public reuse:

- corpus-specific TOC repair scripts
- corpus-specific page-number cleanup scripts
- corpus-specific archive-viewer preparation scripts
- corpus-specific timeline extraction scripts
- corpus-specific domain SQLite exporters

They should be refactored before being added to the reusable repo.

## Priority Refactor Targets

1. generic domain-export pipeline
2. generic archive-viewer bundle/export pipeline
3. generic timeline normalization pipeline
4. generic SQLite validation scripts

