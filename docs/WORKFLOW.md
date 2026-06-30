# Workflow

## Canonical Flow

```text
primary sources
-> source inventory
-> OCR Markdown
-> Archive-only dual-language translation Markdown when needed
-> cleaned/tagged/structured Markdown
-> knowledge graph extraction
-> domain exports
-> SQLite / search index
-> API / UI
-> maintenance loop
```

## Workflow Stages

### 1. Define Scope

- choose one topic
- define corpus boundaries
- define languages
- define output domains
- define citation and provenance requirements

### 2. Ingest Sources

- collect PDFs, scans, images, or born-digital documents
- assign stable `source_id` values
- register them in a source inventory
- record rights, provenance, and editorial status

### 2.5 Recommended Agent Setup

This project uses a `2.5 Agents` model rather than a large multi-agent tree:

- `1 Building Agent`
  The code/build-side agent that helps create and evolve the archive project itself.
- `1 Server Agent`
  The server-side assistant that handles long-running or scheduled operational tasks after deployment.
- `0.5 Semi-Agent`
  The internal archive assistant inside the product UI. It can call tools, use RAG, and search the web, but it mainly works inside the user-facing interface rather than owning the whole build or server workflow.

## Recommended Actual Agents

### `1 Building Agent`

Recommended shape:

- code agent

Typical examples:

- `Claude Code`
- `Codex`
- `Cursor`

Best fit for:

- repository setup
- schema and template definition
- OCR / import workflow scripting
- export pipelines
- search index and embedding pipeline work
- UI and sidebar implementation
- documentation and workflow updates

### `1 Server Agent`

Recommended shape:

- server-side assistant agent

Typical examples:

- `OpenClaw`
- `Hermes`

Best fit for:

- contribution intake handling
- queue processing
- scheduled review jobs
- mail feedback loops
- periodic export refresh
- deployed maintenance operations

### `0.5 Semi-Agent`

Recommended shape:

- internal in-app archive assistant

In this project, this is:

- `AI Sidebar`

Why it counts as `0.5`:

- it has agent-like capabilities
- it can call skills
- it can use RAG
- it can use web search
- it helps users interact with archive content
- it does not own the full build workflow or the server operations layer

Best fit for:

- selection-aware archive Q&A
- citation support
- translation assistance
- route-aware contextual explanation
- retrieval-grounded user interaction

## Practical Assignment

Use the `Building Agent` for:

- stages 1 to 7 of this workflow
- local scripting, structure, exports, embeddings, and UI work

Use the `Server Agent` for:

- stage 8 maintenance after deployment
- contribution review, cron-style jobs, queue handling, and operational reporting

Use the `Semi-Agent` for:

- the live archive-reading experience inside the product UI
- user-facing assistance over selected text, local retrieval, and tool-augmented interaction

### 3. OCR Or Import Text

- generate page-scoped Markdown from scans
- for `Archive` batch processing, optionally generate dual-language translation Markdown directly from source PDFs
- preserve original language/script
- keep OCR output editable
- keep archive translation output editable
- do not publish raw OCR directly

### 4. Clean And Structure

- normalize obvious OCR noise conservatively
- cross-check archive translation output against the source before using it downstream
- add frontmatter
- assign tags
- add source anchors
- preserve uncertainty in notes instead of hiding it

### 5. Produce Domain Records

- `Archive`: source-near records and cleaned texts
- `Blog`: contextual essays and research framing
- `Timeline_Map`: date/place/event normalization
- `Knowledge_Graph`: explicit relations with evidence anchors

### 6. Export Machine-Readable Data

- generate domain JSON/SQLite outputs
- build search indexes
- validate field completeness
- avoid hand-editing generated databases

### 7. Publish The Public Interface

- archive viewer
- archive catalogue
- blog/article pages
- optional timeline/map
- optional in-app AI assistant

### 8. Maintain The Archive

- process corrections
- ingest newly discovered sources
- refine metadata
- add contextual essays
- re-export and redeploy

## Agent Roles

### Building Agent

- sets up repository and workspace structure
- proposes field schemas and templates
- defines source inventory and editorial rules
- prepares OCR, cleanup, export, and embedding workflows
- implements UI and sidebar contracts
- keeps documentation and workflow contracts aligned

### Server Agent

- processes corrections and updates after deployment
- reviews contribution submissions
- runs scheduled maintenance jobs
- updates indexes and exports when needed
- assists with operational reporting and feedback loops

### Semi-Agent

- helps end users navigate the archive
- answers questions using attached selections and local retrieval
- supports citation, translation, and contextual explanation
- calls skills and tools inside the archive interface

## Rules

- do not treat raw PDFs as web-ready content
- do not hand-edit generated SQLite files
- keep provenance explicit
- preserve uncertain claims as notes
- separate public content from internal review fields
- separate corpus data from site presentation
