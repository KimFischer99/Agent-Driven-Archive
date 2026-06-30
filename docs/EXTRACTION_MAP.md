# Extraction Map

## Purpose

This document maps parts of the source archive project into reusable categories for extraction. The extraction map is one of the key outputs of this project: it records what can travel from one archive to another, separating reusable workflow from corpus-specific content (Zhou & Dingir, 2026).

## Reusable Now

Components that transfer directly to a new archive topic without modification:

- Domain split: Archive / Blog / Timeline_Map / Knowledge_Graph
- Workspace skeleton under `workspace/`
- Markdown templates for source records, essays, spatiotemporal materials, and relationship data
- Source-anchor and metadata discipline
- Source inventory conventions
- Contribution queue pattern

## Reusable With Refactor

Components that carry the right structure but need adaptation for a new corpus:

- Export scripts currently tied to one corpus
- Archive viewer data adapters
- Citation and selection utilities
- AI sidebar injection flow
- Timeline normalization scripts

## Project-Specific

Components tied to the Stylus Nexus instance and not intended for direct reuse:

- Daoyuan prose and topic-specific essays
- Branded visuals and site-specific design
- Fixed corpus assumptions (Republican-period spirit-writing materials)
- Acknowledgments and course-specific framing
- Personal links

## Deferred Extension

Components identified as valuable for future packaging but not yet extracted:

- Generic domain export package (archive-export-core)
- Stable citation helper library
- Server agent hosting and deployment kit
- Standardized contribution intake module

## Candidate Future Packages

### `archive-workspace-core`

- Source inventory conventions
- Markdown templates
- Workflow rules

### `archive-export-core`

- JSON/SQLite export pipeline
- Validation scripts
- Search-index generation

### `archive-ui-starter`

- Catalogue
- Viewer
- Blog pages
- Timeline/map starter
- AI sidebar shell

### `archive-agent-playbooks`

- Builder-agent instructions
- Maintenance-agent instructions
- Contribution triage flows
