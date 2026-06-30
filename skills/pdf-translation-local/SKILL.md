---
name: pdf-translation-local
description: Local PDF-to-dual-Markdown translation workflow using BabelDOC plus a local OpenAI-compatible model endpoint. Use when `Archive` batch translation is part of the ingestion workflow and bilingual or dual-language outputs should be preserved as editable Markdown.
---

# Local PDF Translation Skill

Use this workflow to translate PDFs locally into dual-language Markdown outputs as part of the `Archive` ingestion workflow.

Default output naming:

```text
input_stem_dual.md
```

Recommended workflow position:

```text
primary sources
-> source inventory
-> Archive OCR Markdown and/or Archive dual-language translation Markdown
-> cleaned / tagged / structured Markdown
-> exports / UI
```

## What This Skill Assumes

- you already have a working BabelDOC installation
- you already have a local or self-managed OpenAI-compatible model endpoint
- you know which model should handle the translation

## Required Environment Variables

- `BABELDOC_RUNNER`
  Path to your local BabelDOC runner script.
- `OLLAMA_MODEL`
  Or any other local model name recognized by your endpoint.

Optional:

- `OLLAMA_URL`
  Set this to your local model endpoint base URL when not using the default Ollama address.

## Run

```bash
./scripts/translate_dual_pdf.sh \
  --output-dir "/absolute/path/workspace/Vault/Archive/Translation" \
  "/absolute/path/file.pdf"
```

Force retranslation:

```bash
./scripts/translate_dual_pdf.sh \
  --ignore-cache \
  --output-dir "/absolute/path/workspace/Vault/Archive/Translation" \
  "/absolute/path/file.pdf"
```

## Workflow Defaults

- recommended output directory: `workspace/Vault/Archive/Translation/`
- fallback output directory: same directory as the input PDF when no explicit output directory is provided
- output name: input stem plus `_dual.md`
- original-side pages remain unchanged
- translated-side pages should prioritize body text and suppress page furniture when supported by the runner

## How To Use It In This Repo

1. register the PDF in `sources_index/`
2. run this skill against the source PDF
3. write the resulting dual-language Markdown into `workspace/Vault/Archive/Translation/`
4. treat that translation file as an `Archive` workflow artifact that can be reviewed, cited, and cross-checked during cleaned-data production
5. do not treat the dual Markdown as a replacement for provenance, source inventory, or cleaned archive records

## Verification

- confirm the output file exists
- confirm it lands in the intended `Translation/` folder when `--output-dir` is used
- inspect the translated half of the first page
- verify that page furniture and footnotes are handled as expected by your local BabelDOC config

## Notes

This sanitized skill does not bundle BabelDOC itself. It only captures the local orchestration pattern that was used in the source project.
