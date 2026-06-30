# Dependency Matrix

## Goal

This document separates:

- **required** dependencies for the core workflow
- **optional** dependencies for specific modules
- **replaceable** infrastructure choices that should not be treated as fixed

## Required For The Core Workflow

### Baseline Tools

- `Git`
  For versioning, collaboration, and reproducible workflow changes.
- `Node.js >= 22`
  Required for the starter manifest/search scripts and a Next.js-based public app starter.
- `Python 3.11+`
  Required for OCR-related scripts and PDF processing helpers.
- `Markdown`
  The editable intermediate layer of the archive workflow.
- `JSON`
  Used for config, manifests, logs, and generated data.
- `YAML frontmatter`
  Used for record metadata in Markdown files.

### Editorial/Data Layer

- file system workspace
- source inventory
- cleaned Markdown records
- generated manifest/search outputs

These are structural requirements even if the surrounding app stack changes.

### Agent Environment Layer

- one building-side code agent
- one server-side assistant agent if deployed maintenance is needed
- one internal semi-agent if the public app includes an archive assistant

In the recommended `2.5 Agents` setup, these correspond to:

- `Building Agent`
  Examples: `Claude Code`, `Codex`, `Cursor`
- `Server Agent`
  Examples: `OpenClaw`, `Hermes`
- `Semi-Agent`
  Example in this project: `AI Sidebar`

These are workflow-level prerequisites rather than package dependencies, but they are still part of the practical environment setup for this repository.

## Required If You Reuse The Same Public App Pattern

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [react-markdown](https://github.com/remarkjs/react-markdown)
- [remark-gfm](https://github.com/remarkjs/remark-gfm)

If you do not use the same public UI pattern, these are replaceable.

## Required For OCR Automation

- [requests](https://pypi.org/project/requests/)

If you want to OCR scanned PDFs through the included remote-OCR helpers, `requests` is the minimum Python package dependency.

## Required For Scan/Image Rendering

- [PyMuPDF / fitz](https://pymupdf.readthedocs.io/)
- [Pillow](https://python-pillow.org/)

These are needed if you want to:

- split PDFs into OCR chunks
- render page images for an archive viewer

## Optional But Important

### Mapping / Timeline

- [Leaflet](https://leafletjs.com/)

Only needed if your public app includes an interactive map.

### Chinese Romanization / Date Normalization

- [pypinyin](https://pypi.org/project/pypinyin/)
- [lunardate](https://pypi.org/project/lunardate/)

Useful for Chinese historical timeline/map normalization. Not required for every archive topic.

### Local AI Cleanup

- a local AI CLI or API-compatible assistant

In the source project this role was used for:

- OCR cleanup
- translation support
- archive-maintenance assistance

But the exact tool is replaceable.

### Local PDF Translation

- BabelDOC
- a local or self-managed OpenAI-compatible model endpoint

This is an optional extension, not a core requirement of the base archive workflow.

### Local Semantic Retrieval / Embedding

- a local embedding model or self-hosted embedding endpoint
- a local vector store or vector-capable database

Useful when you want:

- semantic retrieval over archive records
- cross-document discovery
- retrieval without depending on a hosted embedding API
- a practical intermediate stage before adopting LightRAG or another graph-RAG layer

## Replaceable Infrastructure Choices

These should **not** be treated as fixed requirements:

- Caddy
- Nginx
- Apache
- systemd
- pm2
- Docker
- VPS vs home server
- rsync vs another deploy mechanism
- one temporary tunnel domain vs another public URL

The reusable repo should stay deployment-agnostic. What matters is:

- you can host the public app
- you can serve static and dynamic content
- you can manage restarts
- you can configure a domain or reachable URL

## Practical Minimum Profiles

### Profile A: Workflow Only

Use this if you only want the archive-building workflow without a full public app:

- Git
- Node.js
- Python
- Markdown/YAML/JSON
- requests

### Profile B: Archive Site Builder

Use this if you want a full online archive similar to the source project:

- Profile A
- Next.js/React/TypeScript/Tailwind
- PyMuPDF
- Pillow
- optional Leaflet

### Profile C: Extended AI-Assisted Archive

Use this if you also want OCR cleanup and local PDF translation:

- Profile B
- local AI CLI or endpoint
- BabelDOC
- OpenAI-compatible local model endpoint

### Profile D: Retrieval-Enhanced Archive

Use this if you want semantic archive search and a stronger in-app assistant:

- Profile B
- local embedding model or embedding endpoint
- local vector store or vector-capable database
- chunking and metadata-filtering workflow
- optional LightRAG for graph-aware retrieval
