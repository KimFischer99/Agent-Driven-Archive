# Architecture

## Design Principle

The architecture follows a five-layer source-derived pipeline (Zhou & Dingir, 2026). Raw materials enter at the Source layer and remain separate from the public site. At each following layer, data is transformed through inspectable, editable, or generated stages until it reaches the public interface.

| Layer | Role |
|-------|------|
| **Source** | Raw scans, PDFs, images, and source inventory kept separate from the public site. |
| **Editorial** | OCR and cleaned or translated Markdown remain human-readable and agent-editable. |
| **Export** | Scripts generate manifests, SQLite databases, search indexes, and viewer assets. |
| **Application** | Web app renders catalogue, viewer, blog, timeline map, and search modules. |
| **Agent** | Building, server, and semi-agent roles support construction, maintenance, and reader assistance. |

## Five-Layer Pipeline

### 1. Source Layer

Raw materials isolated from the public site and Obsidian vault:

- PDFs, scans, images, and born-digital documents
- Source inventory with stable `source_id` values
- Rights, provenance, and editorial status tracking
- This layer stays in `workspace/Primary_Sources/` — never published directly

### 2. Editorial Layer

Human-editable and agent-editable Markdown materials:

- OCR Markdown (page-scoped, preserves original language/script)
- Cleaned records with frontmatter, tags, and source anchors
- Translation Markdown when needed
- Blog drafts, timeline/map events, and graph relations
- Controlled vocabulary and editorial status tracking

The editorial layer is designed to integrate naturally with Obsidian: the workspace is a plain Markdown folder structure that Obsidian opens directly, and agents read and write the same Markdown files — the human workspace and the agent workspace are the same workspace.

### 3. Export Layer

Generated outputs derived from the editorial layer (machine-output only, not hand-edited):

- JSON manifests
- SQLite databases (domain-specific: Archive, Blog, Timeline_Map)
- Search indexes
- Static assets prepared for the application

### 4. Application Layer

Public-facing web application:

- Next.js + React + TypeScript + Tailwind CSS
- Markdown rendering
- Optional map/timeline modules (Leaflet)
- AI sidebar as a first-class archive module, not a decorative chatbot
- Citation tools and route-aware contextual assistance

### 5. Agent Layer

Agent roles run across all pipeline stages:

| Agent | Role | Examples |
|-------|------|----------|
| **Building Agent (1)** | Coding, content processing, UI development, export pipelines | `Claude Code`, `Codex`, `Cursor` |
| **Server Agent (1)** | Scheduled maintenance, contribution intake, automated review | `OpenClaw`, `Hermes` |
| **Semi-Agent (0.5)** | In-app assistant for public readers — document-first, selection-aware, retrieval-grounded | `AI Sidebar` |

The division of agent labor avoids two risks: over-agentification (every task becoming its own autonomous role) and the generic chatbot problem (an archive with an unmoored AI widget). The semi-agent is document-first: selected text is normalized and attached to requests, local full-text search notes are added only when selection context exists, and the prompt instructs the assistant to treat attached selections as primary evidence and avoid invented citations.

## Deployment / Runtime

Recommended requirements for hosting the application layer:

- A host capable of serving the public app (Linux VPS, home server, container host, or managed platform)
- A reverse proxy (Caddy, Nginx, or equivalent)
- A process manager (systemd, pm2, Docker, or equivalent)
- A reproducible deploy/update workflow

These are examples, not fixed requirements. This repository does not bind to a single deployment approach.

## Domain Model

```text
Archive
  cleaned source-near texts

Blog
  contextual and interpretive essays

Timeline_Map
  normalized events, places, and temporal anchors

Knowledge_Graph
  structured relations with evidence
```

## Public UI Modules

- Home / introduction
- Archive catalogue
- Archive viewer
- Blog
- Timeline & Map
- AI sidebar
- Citation tools

The AI sidebar should be treated as a first-class archive module, not a decorative chatbot. Its interaction model is closer to document-assistance interfaces than to a generic site support widget.

## Extraction Priorities

Derived from the extraction map that separates reusable workflow from project-specific content.

### Reusable Now

- Workflow shape and domain separation
- Markdown templates
- Source-anchor model
- Source inventory conventions
- Archive/Blog/Timeline_Map split

### Reusable With Refactor

- Export scripts
- Archive viewer contracts
- Citation utilities
- AI sidebar injection flow

### Project-Specific (Not For Direct Reuse)

- Subject-matter prose
- Topic-specific essays
- Branded visuals
- Hard-coded corpus assumptions
