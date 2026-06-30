---
name: paddle-ocr-markdown
description: Convert scanned PDFs to Markdown with a PaddleOCR-compatible API, then optionally apply minimum-edit local AI cleanup page by page.
---

# PaddleOCR Markdown Skill

Use the script. Do not hand-build the OCR pipeline unless you are changing the workflow itself.

## Run

```bash
python3 ./scripts/paddle_ocr_markdown.py [PDF_OR_DIR ...]
```

## Request Config

Create a real config from the template:

```bash
cp request.template.json request.json
```

Then fill in:

- `api_url`
- `token`
- `model`
- any provider-specific optional payload fields

## Defaults

- no path: process `OCR/` if present, otherwise current directory
- output: same directory, same basename, `.md`
- existing `.md`: skip unless `--overwrite`
- batch log: append `_ocr_batch_log.jsonl` beside processed PDFs
- LLM cleanup: `--llm always` by default

## Division Of Labor

The script performs deterministic cleanup first:

- HTML/image removal
- single-character line merge
- page splitting
- whitespace cleanup
- heading/list cleanup
- existing-punctuation splitting
- repeated boundary-title filtering
- output assembly

Then an optional local AI CLI performs page-by-page minimum-edit cleanup:

- punctuation restoration
- paragraphing
- obvious OCR error correction
- page-scoped fallback on failure

## Cleanup Rule

Minimum edits only:

- preserve original language(s), scripts, wording, and order
- do not translate
- do not summarize
- do not infer missing names or facts
- do not add commentary

## Useful Flags

- `--overwrite`
- `--recursive`
- `--llm always|off`
- `--claude-model <alias>`
- `--claude-effort <level>`
- `--request-config <path>`
- `--max-budget-usd <n>`

## Notes

This sanitized skill preserves the workflow and script behavior, but the live PaddleOCR credentials and machine-local setup have been removed.

