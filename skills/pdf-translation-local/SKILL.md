---
name: pdf-translation-local
description: Local PDF translation workflow using BabelDOC plus a local OpenAI-compatible model endpoint. Use when translating PDFs into bilingual or dual-language outputs on a self-managed machine.
---

# Local PDF Translation Skill

Use this workflow to translate PDFs locally into dual-language outputs.

Default output naming:

```text
input_stem_dual.md
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
./scripts/translate_dual_pdf.sh "/absolute/path/file.pdf"
```

Force retranslation:

```bash
./scripts/translate_dual_pdf.sh --ignore-cache "/absolute/path/file.pdf"
```

## Workflow Defaults

- output directory: same directory as the input PDF
- output name: input stem plus `_dual.md`
- original-side pages remain unchanged
- translated-side pages should prioritize body text and suppress page furniture when supported by the runner

## Verification

- confirm the output file exists
- inspect the translated half of the first page
- verify that page furniture and footnotes are handled as expected by your local BabelDOC config

## Notes

This sanitized skill does not bundle BabelDOC itself. It only captures the local orchestration pattern that was used in the source project.

