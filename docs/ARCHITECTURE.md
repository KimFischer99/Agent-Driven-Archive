# Architecture

## Design Principle

The architecture should separate:

- editorial workspace
- generated data outputs
- public application
- agent workflows
- deployment/runtime

## Recommended Layers

### 1. Content Workspace

Human-editable and agent-editable materials:

- OCR Markdown
- cleaned records
- blog drafts
- timeline/map events
- graph relations
- source inventory

### 2. Export Layer

Generated outputs derived from the workspace:

- JSON
- SQLite
- search indexes
- static assets prepared for the app

### 3. Application Layer

Suggested stack based on the current build:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Markdown rendering
- optional map/timeline modules

### 4. Agent Layer

Possible agent responsibilities:

- source registration
- OCR cleanup assistance
- metadata normalization
- citation support
- contribution triage
- maintenance QA

For public-reader interaction, the in-app assistant should follow a document-first sidebar pattern:

- user-scoped selections first
- route-aware context
- explicit provenance/citation support
- retrieval-aware answering rather than generic free chat

### 5. Runtime / Hosting Layer

Recommended requirements:

- a host capable of serving the public app
- a way to reverse proxy or expose the app
- a way to restart or supervise the app process
- a reproducible deploy/update workflow

Possible implementations include, but are not limited to:

- Linux VPS
- home server
- container host
- managed platform
- reverse proxies such as Caddy or Nginx
- process managers such as systemd, pm2, Docker, or another runtime supervisor

These are examples, not fixed requirements.

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

The `AI sidebar` should be treated as a first-class archive module, not a decorative chatbot. Its interaction model is closer to document-assistance interfaces than to a generic site support widget.

## Extraction Priorities From The Source Project

### Reusable Now

- workflow shape
- content domain separation
- Markdown templates
- source-anchor model
- Archive/Blog/Timeline_Map split

### Reusable With Refactor

- export scripts
- archive viewer contracts
- citation utilities
- AI sidebar injection flow

### Project-Specific And Not For Direct Reuse

- subject-matter copy
- topic-specific essays
- branded visuals
- hard-coded corpus assumptions
