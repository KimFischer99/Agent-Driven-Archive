# SPEC.md

Last updated: 2026-06-30

This file is the template specification for a project built on the Agent-Driven-Archive workflow. Copy it into your own project and fill in the values.

## 1. Goal

Describe your archive in one sentence. What is the topic, period, and source base?

Canonical flow:

```text
external sources
→ OCR Markdown
→ cleaned / tagged / translated Markdown
→ domain SQLite
→ public UI + API
```

## 2. Product Boundary

- Primary UI language:
- Multilingual support:
- Target devices:
- Homepage structure:

```text
e.g. Welcome → Introduction → Archive → Timeline & Map → Blog
```

- Key page layouts:
  - Archive Viewer:
  - Timeline/Map:
  - Blog:

## 3. AI Boundary

- AI model / provider:
- Embedding pipeline: [on / off]
- Vector database: [on / off]
- Runtime RAG service: [on / off]
- AI sidebar modes: [chat, translate, search, web search]
- Rate limiting: [requests per IP per day]
- Backend concurrency cap:

## 4. Tech Stack

```text
Next.js [version] App Router
React [version]
TypeScript [version]
Tailwind CSS [version]
[additional libraries — Leaflet, react-markdown, etc.]
SQLite via node:sqlite
```

AI provider:

```text
[provider name / API endpoint]
```

Primary env vars:

```text
[API_KEY]
[BASE_URL]
[MODEL]
```

Local dev URL:

```text
http://localhost:<port>
```

## 5. Routes

```text
/                         homepage
/archive                  archive catalogue
/archive/viewer/[id]      archive viewer
/blog                     blog index
/blog/[slug]              blog post
/timeline-map             timeline and map page
/search                   search overlay
/api/ai                   AI sidebar endpoint
/api/contributions        contribution intake endpoint
```

## 6. Data Boundaries

- All content is source-derived. Do not fabricate records.
- Archive records carry source provenance metadata.
- Blog posts cite their primary sources.
- Timeline events reference source anchors.
- Knowledge graph relations carry confidence levels.

## 7. Deployment

```text
Hosting:
Domain:
Reverse proxy:
Process manager:
CI/CD:
```

## 8. Repository Mapping

```text
agent-driven-archive/     → workflow, workspace, scripts, templates
[your-app]/               → Next.js frontend application
[your-vault]/             → Obsidian vault (content store)
```
