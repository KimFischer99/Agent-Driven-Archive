# Agent Workflow

This workspace stores reusable archive rules, schemas, tags, templates, and agent-facing metadata. It is not public UI content.

## Domain Flow

```text
external source
→ Archive OCR Markdown and/or Archive dual-language translation Markdown
→ cleaned / tagged / structured Markdown
→ knowledge graph extraction
→ domain SQLite
→ API / UI
```

## Rules

- External PDFs, images, and scans are indexed in `sources_index/`; do not edit them here.
- For `Archive` batch processing, OCR Markdown or dual-language translation Markdown can serve as the first editable layer.
- Tags are applied in domain `Cleaned_Data` frontmatter.
- `controlled_tags/` stores the vocabulary only.
- Knowledge Graph stores explicit relationships with source anchors.
- SQLite files are generated output and should not be hand-edited.
- Timeline / Map data is excluded from AI retrieval context by default.
- Public UI must not expose internal review fields or debug metadata.

## Operations

### Ingest

1. Register the external source in `sources_index/`.
2. Run OCR for the relevant domain, and run PDF translation when `Archive` batch processing needs a dual-language layer.
3. Place OCR Markdown into the relevant domain `OCR/`. Place translation Markdown only into `Archive/Translation/`.
4. Create or update cleaned Markdown using templates.
5. Update `archive_manifest.md`, `hot.md`, and `activity_log.md`.

### Clean

1. Preserve source wording unless correction is evidence-based.
2. Add frontmatter, tags, anchors, and review state.
3. Move uncertain claims into notes inside the cleaned file, not public UI fields.

### Export

1. Regenerate domain SQLite from cleaned Markdown and graph files.
2. Run data checks.
3. Run typecheck and build before demo review.
