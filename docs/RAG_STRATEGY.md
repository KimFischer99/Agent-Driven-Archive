# RAG Strategy

## Why RAG Matters Here

An agent-driven online archive should not rely on a generic chat layer alone. It needs retrieval grounded in:

- source-near records
- page-level selections
- structured metadata
- contextual essays
- explicit provenance

Without that layer, the assistant becomes a generic interface rather than a research-aware archive companion.

## Recommended Retrieval Layers

### Layer 1: Direct User Context

Highest priority context should come from what the user explicitly attaches:

- selected text
- selected page
- quoted passage
- linked record

This is the most trustworthy retrieval signal.

### Layer 2: Local Structured Retrieval

Use lightweight local retrieval over:

- Archive records
- Blog records
- Timeline/Map records when the project scope allows it
- source metadata
- explicit graph relations

Possible implementations:

- JSON lookup
- SQLite lookup
- keyword search
- FTS

This layer should exist even if no embedding-based RAG is deployed.

### Layer 3: Semantic Retrieval

For larger corpora, add semantic retrieval over:

- cleaned Markdown
- page chunks
- structured notes
- citation anchors

Possible implementations:

- LightRAG
- vector database
- embedding-backed local retrieval
- local embedding model plus local vector index

This is the layer that should support cross-document discovery, theme clustering, and semantically related passage retrieval.

## Local Embedding Recommendation

For many archive projects, the most practical first semantic-retrieval setup is:

```text
cleaned Markdown / page chunks
-> local embedding generation
-> local vector index
-> route-aware retrieval
-> citation-grounded answer synthesis
```

This keeps the retrieval layer deployable on one machine or one self-managed server, and avoids making a hosted embedding service a hard requirement.

Typical components:

- a local embedding model or self-hosted embedding endpoint
- chunked source text with stable source/page anchors
- a local vector store or vector-capable database
- metadata filters for route, source type, language, or collection

This setup is often a better first step than jumping directly into a more complex graph-RAG stack.

## Recommended Progression

### Stage A: No-RAG Starter

Use:

- direct attachments
- route-aware scope
- local manifest/search index
- explicit citation anchors

This is enough for early archive prototypes.

### Stage B: Local Retrieval + FTS

Add:

- SQLite or JSON search index
- domain-specific filters
- route-aware retrieval constraints

This is the minimum practical archive-assistant layer.

### Stage C: Local Embedding RAG

Add:

- local embeddings
- chunk-level vector retrieval
- metadata-filtered search
- citation-anchor preservation

This is the recommended semantic-retrieval stage for many small and medium archive projects.

### Stage D: Full Semantic RAG

Add:

- embeddings
- chunk-level retrieval
- cross-domain retrieval policies
- grounding and citation checks
- optional graph-aware retrieval

This stage can be implemented with local embeddings, LightRAG, or another larger retrieval stack depending on project scale.

This is the target for larger research archives.

## LightRAG In This Repo

LightRAG is a planned extension, not a completed default.

The intended role of LightRAG here is:

- semantic retrieval across archive corpora
- support for multi-hop contextual discovery
- better related-record suggestions
- stronger agent grounding for research queries

It should be integrated as an optional retrieval layer, not as a hard dependency of the whole repository.

## Local Embedding + LightRAG Relationship

These two paths should not be treated as mutually exclusive:

- `local embedding retrieval`
  Good default for early semantic search, local deployment, and smaller teams.
- `LightRAG`
  Better suited when the project needs graph-aware retrieval, richer relation traversal, or more advanced multi-hop discovery.

A practical progression is:

1. start with local manifest / FTS retrieval
2. add local embeddings and vector retrieval
3. add LightRAG only if the archive truly benefits from graph-aware semantic discovery

## Public References For This Layer

- [LightRAG](https://github.com/HKUDS/LightRAG)
  Graph-aware semantic retrieval reference.
- [Chroma](https://www.trychroma.com/)
  Local or self-hosted vector retrieval reference.
- [Qwen3-Embedding-8B](https://huggingface.co/Qwen/Qwen3-Embedding-8B)
  One local/self-hosted embedding model option.
- [BGE-M3](https://bge-model.com/bge/bge_m3.html)
  One multilingual embedding model option for archive retrieval.

## Retrieval Constraints

- keep user-attached text highest priority
- prefer source-near evidence over distant summaries
- preserve citation anchors whenever possible
- avoid blending unrelated documents into one answer without explicit grounding
- do not present generated synthesis as archival fact without source support

## Output Expectations For Archive Agents

A RAG-enabled archive assistant should be able to:

- answer from attached selections first
- cite the exact page or source anchor when available
- distinguish direct evidence from inference
- suggest related records without fabricating provenance
- stay within the active domain scope unless the user expands it
