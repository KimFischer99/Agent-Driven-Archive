# AI Sidebar Notes

## Origin

The AI sidebar pattern in the source project should be understood as part of a broader **document-first assistance model**, not as a generic floating chatbot.

This is important because the archive sidebar should inherit the same core principle:

**the assistant starts from user-scoped document context, not from a free-floating global prompt.**

## Transferable Interaction Patterns

The following interaction patterns are reusable for archive interfaces:

- attach current selection into the assistant context
- keep a read-oriented default boundary
- support quoted context instead of raw global ingestion
- keep the assistant close to the active document or page
- prioritize contextual explanation, rewriting, translation, and citation support

## What Changes In An Archive Context

Unlike a Word add-in, an archive UI also needs:

- record-aware routing
- page-level provenance
- archive/blog/timeline domain separation
- retrieval-aware citation grounding
- optional web search for broader context when local materials are insufficient
- public-reader-safe context boundaries

## Recommended Sidebar Contract

An archive AI sidebar should ideally support:

- `@`-style selection injection
- route-aware context labels
- optional citation-copy actions
- translation mode for attached selections
- retrieval from local archive indexes
- web search mode for supplementing local context with external sources
- explicit distinction between attached evidence, retrieved context, and web search results

## What Not To Hard-Code

- one model provider
- one deployment shape
- one cookie/proxy architecture
- one UI framework

The reusable part is the **document-context interaction model**, not one exact provider implementation.
