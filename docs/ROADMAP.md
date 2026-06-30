# Roadmap

## Theme

This repository supports the broader theme:

**Agent-Driven Online Archive Building and Maintenance**

## Current Scope

- reusable workflow documentation
- reusable workspace structure
- reusable content templates
- extraction map from a working archive project

## Next Planned Milestones

### M1. Generic Export Pipeline

- abstract the current export scripts
- remove corpus-specific assumptions
- document expected input/output contracts

### M2. Public Demo Starter

- provide a minimal Next.js starter
- connect archive/blog/timeline domains
- document how to swap in new topic data

### M3. Citation Infrastructure

- generate stable source IDs
- expose reusable citation helpers
- support APA / Chicago / MLA output

### M4. LightRAG Integration

- test a reusable semantic retrieval layer
- define what belongs in local FTS vs LightRAG
- document indexing and refresh workflow
- define grounding and citation behavior for archive assistants
- support page-chunk retrieval rather than only document-level retrieval

### M5. Server Agent Hosting

- define a hosted maintenance-agent model
- support contribution ingestion and triage
- support scheduled validation and export jobs

### M6. Deployment Kit

- package reverse proxy and process-manager examples
- provide deploy docs for low-cost self-hosting
- document safe secrets handling

## Explicitly Deferred

- production-ready LightRAG implementation
- generalized server-side agent orchestration
- one-command installer
- full multi-tenant admin system

## Related Docs

- `docs/RAG_STRATEGY.md`
- `docs/AI_SIDEBAR_NOTES.md`

## Success Condition

Another team should be able to:

1. choose a new topic
2. add new primary sources
3. run the same workflow
4. publish a structurally similar archive site
5. maintain it with agent assistance
