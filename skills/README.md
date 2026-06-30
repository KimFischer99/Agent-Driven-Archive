# Skills

This folder stores reusable skill examples extracted from the local build environment.

These are **reference implementations**, not guaranteed plug-and-play packages for every machine.

## Included

- `pdf-translation-local/`
  A local PDF-to-dual-Markdown translation workflow built around BabelDOC plus a local OpenAI-compatible LLM endpoint. In this repo it is intended to serve as the `Archive` batch-translation stage, not as a general cross-domain translation layer.
- `paddle-ocr-markdown/`
  A batch PDF-to-Markdown OCR workflow using a PaddleOCR API plus optional local AI cleanup.

## Portability Adjustments Applied

- removed personal absolute paths
- removed live tokens and private request credentials
- replaced machine-specific defaults with environment variables or templates
- preserved the workflow logic and script structure

## Expected User Work

Before using these skills, a new user will still need to:

- install the upstream toolchain
- set environment variables
- fill in request credentials
- verify model names and local runner paths
