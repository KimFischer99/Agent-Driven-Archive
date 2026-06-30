# Agent Driven Archive

[中文说明](./README.zh.md)

`Agent Driven Archive` is a reusable workflow for building and maintaining a topic-specific online archive through deep collaboration between researchers and AI agents. It is designed for low-cost, low-barrier digital humanities platform construction.

It covers the full pipeline from primary sources to a public-facing online archive, with a reusable base architecture. Fork it, extend it, and publish — without starting from scratch.

This repository is the final outcome of the course [Digital Humanities and Data Sustainability](https://14141-dh-sustainability.github.io/), Summer Semester 2026, Freie Universität Berlin. A digital humanities project **Stylus Nexus (Beta vO.1.1)**, constructed from this repository, is already live and accessible.

A preprint paper describing the design and rationale behind this workflow is included in this repository: **[Stylus Nexus: Agent-Driven Online Archive Building and Maintenance](./Stylus%20Nexus_Agent-Driven%20Online%20Archive%20Building%20and%20Maintenance_Report.pdf)** (Zhou & Dingir, 2026).

## Design Intent

The goal is to make personal online digital-humanities projects cheaper, easier to build, and more sustainable through deep AI-agent collaboration. This repository follows a **template-instance design pattern**: the workflow, scripts, workspace skeleton, and templates are reusable across topics, while corpus-specific content stays in the project instance (such as the Stylus Nexus archive).

The architecture is a five-layer source-derived pipeline:

| Layer | Role |
|-------|------|
| **Source** | Raw scans, PDFs, images, and source inventory kept separate from the public site |
| **Editorial** | OCR and cleaned or translated Markdown, human-readable and agent-editable |
| **Export** | Scripts generate manifests, SQLite databases, search indexes, and viewer assets |
| **Application** | Web app renders catalogue, viewer, blog, timeline map, and search modules |
| **Agent** | Building, server, and semi-agent roles support construction, maintenance, and reader assistance |

The expected characteristics of a project that adopts this pipeline:

- Low technical threshold for humanities and social-science researchers, curators, and small-project maintainers
- Aside from server costs and AI token/subscription costs, the overall workflow is close to zero-cost. Server costs can often be minimized or made free through student credits, educational offers, or low-cost hosting
- A single person can handle the full build + maintenance pipeline through AI-agent collaboration, with customisable agent behaviour, greatly reducing labour and communication overhead
- A public-facing archive can still provide useful AI-assisted exploration through a constrained semi-agent layer that stays closer to citations and retrieval grounding, while keeping token usage and hallucination risk more controlled
- All public records are source-derived: every record must trace back to a primary source file, a cleaned Markdown document, a translation, or a structured event record. Generated data files are outputs, not editorial ground truth

## Project Purpose

This repository serves the following pipeline:

1. Collecting and organising primary sources
2. Collaborating with agents — using skills, scripts, and tools — to convert scans or source files into editable Markdown, then cleaning, normalising, and structuring content records
3. Organising outputs into reusable content modules such as source records, interpretive writing, event or place materials, and relationship data
4. Generating manifests, search indexes, and SQLite-ready data
5. Building and publishing a publicly accessible archive
6. Extending the archive with AI-assisted maintenance workflows

The focus is on the full pipeline: content processing, structuring, export, and presentation.

## Who This Is For

- Humanities and social-science researchers (primary)
- Curators
- Archivists
- Solo maintainers building knowledge sites around a focused corpus

## What This Repository Includes

- A reusable workspace skeleton under `workspace/`
- Markdown templates for source records, essays, spatiotemporal materials, and relationship data
- Starter scripts for validation, manifest export, and search index generation
- Reusable local workflow skill examples for OCR and PDF translation
- A zero-dependency demo site generator and local preview server
- A SQLite-backed contribution-agent starter
- Workflow, architecture, RAG, release-preparation, and tool documentation under `docs/`

## Core Stack

### Base Workflow Layer

- Node.js 22+
- Python 3.11+
- Obsidian
- Markdown + YAML frontmatter
- JSON
- SQLite

### Agents Workflow Layer

In practice, a minimum of **2.5 agents** can carry the full workflow:

- One building-side coding agent
  Examples: `Claude Code`, `Codex`, `Cursor`
- One server-side assistant agent
  Examples: `OpenClaw`, `Hermes`
- One internal semi-agent in the product UI — a chatbot-like assistant that can call APIs/proxies, custom prompts, skills, and tools. In this workflow: `AI Sidebar`

The `AI Sidebar` focuses on citation-aware, retrieval-aware, and translation-aware assistance inside the archive interface.

### Public App Pattern

- Next.js
- React
- TypeScript
- Tailwind CSS

### Optional Extensions

- Dataview Plugin + Templater Plugin
- OCR workflow based on local/cloud OCR models
- Data translation workflow based on local/cloud translation models
- LightRAG or another retrieval-layer RAG workflow based on local/cloud embedding models
- Map/timeline modules such as Leaflet

This repository is not bound to any single deployment approach. Reverse proxy, scheduler, process manager, and hosting provider are all replaceable.

## Repository Structure

```text
docs/                    project documentation, workflow notes, architecture, and roadmap
templates/               reusable content templates
workspace/               starter content workspace
scripts/                 validation, export, demo, OCR, and utility scripts
skills/                  local workflow skill examples
server/                  contribution-agent starter
generated/               generated outputs
runtime/                 local runtime artifacts
```

## Quick Start

### 1. Install Prerequisites

- Node.js 22 or newer
- Python 3.11 or newer
- A coding agent — `Codex` is recommended. The Desktop App works out of the box and can be invoked via CLI/plugin from VS Code and other terminals
- If you plan to deploy automated maintenance workflows, you also need a server-side assistant agent — `Hermes` is recommended, lightweight, and manageable via WeChat

### 2. Start the Demo

```bash
npm run demo:start
```

This will run the following in sequence:

1. Validate the workspace structure
2. Generate a source manifest
3. Build a starter search index
4. Render a static demo site
5. Serve the demo locally

### 3. Replace the Example Content

Replace the example files under `workspace/` with your own corpus materials.

You can adapt the workspace layout to fit your project. When you do, update `workspaceValidation.requiredPaths` in `archive.config.json` or `archive.config.example.json` so `npm run check:workspace` validates your own structure. If you also change `routeBase`, keep it as a rooted subpath such as `/archive/viewer` without a trailing slash; the starter demo homepage already uses `/`. Common content types include:

- Source records and cleaned texts
- Essays, notes, or interpretive writing
- Event or place materials
- Relationship or graph data
- Source inventory and metadata

### 4. Rebuild After Content Updates

```bash
npm run build:all
npm run demo:render
```

## Main Commands

```bash
npm run check:workspace
npm run export:manifest
npm run build:search
npm run build:all
npm run demo:render
npm run demo:serve
npm run demo:start
npm run contrib:init-db
npm run contrib:serve
npm run contrib:review
npm run contrib:mail
```

## Usage Guide

### Build a New Archive Topic

1. Define the topic, scope, and source types
2. Place primary sources into your own intake pipeline
3. Convert source materials into Markdown records
4. Clean texts and normalise metadata
5. Prepare the content modules your project needs — e.g. essays, event-place materials, or relationship records
6. Export manifest and search data
7. Preview the archive locally
8. Deploy the public app with your own stack

### Add AI-Assisted Workflows

This starter already reserves structure for:

- The 2.5-agent workflow setup
- OCR cleanup
- Translation support
- Citation-aware sidebar interaction
- Contribution intake and review
- Local embedding-based retrieval planning
- Retrieval-oriented extension

For project-document management without writing custom code, `Obsidian App + Dataview & Templater Plugins` is also a recommended workflow layer — low-code, more intuitive to operate, and agents can directly plug into it for a real-time closed loop.

See:

- [docs/WORKFLOW.md](./docs/WORKFLOW.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/RAG_STRATEGY.md](./docs/RAG_STRATEGY.md)
- [docs/CONTRIBUTION_AGENT_MODULE.md](./docs/CONTRIBUTION_AGENT_MODULE.md)

## Documentation Map

- [docs/WORKFLOW.md](./docs/WORKFLOW.md): End-to-end workflow
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md): Recommended module boundaries
- [docs/DEPENDENCY_MATRIX.md](./docs/DEPENDENCY_MATRIX.md): Required vs optional dependencies
- [docs/SCRIPTS_CATALOG.md](./docs/SCRIPTS_CATALOG.md): Script inventory
- [docs/SANITIZATION.md](./docs/SANITIZATION.md): Open-source release preparation rules
- [docs/TOOLS_AND_REFERENCES.md](./docs/TOOLS_AND_REFERENCES.md): Tools and reference stack
- [docs/RAG_STRATEGY.md](./docs/RAG_STRATEGY.md): Retrieval / RAG direction
- [docs/AI_SIDEBAR_NOTES.md](./docs/AI_SIDEBAR_NOTES.md): Sidebar interaction model
- [docs/ROADMAP.md](./docs/ROADMAP.md): Deferred work and roadmap

## Open-Source Collaboration

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [SECURITY.md](./SECURITY.md)
