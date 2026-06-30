# Skills

This folder stores reusable skill examples extracted from the local build environment.

These are **reference implementations**, not guaranteed plug-and-play packages for every machine.

## Included

- `markitdown-converter/`
  经由 MarkItDown 组件将已电子化的 PDF 和 Word (DOCX) 文档快速转换为 agent-readable Markdown，保留完整文本内容和结构层级。适用于已有文本层的电子文档，非扫描件 OCR。
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
