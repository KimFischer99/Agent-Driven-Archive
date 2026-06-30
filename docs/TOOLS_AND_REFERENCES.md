# Tools And References

## Why This Document Exists

This document records the public products, projects, websites, and documentation sources that informed the archive-building workflow.

It also clarifies where different kinds of references belong inside this repository.

## Where Different References Belong

- `README.md` / `README.zh.md`
  Course context, project purpose, cost model, and core stack.
- `docs/WORKFLOW.md`
  Workflow stages, the `2.5 Agents` model, and practical role assignment.
- `docs/RAG_STRATEGY.md`
  Retrieval architecture, local embedding strategy, vector retrieval, and LightRAG direction.
- `docs/TOOLS_AND_REFERENCES.md`
  External reference links for design, archive examples, OCR, deployment, embedding, and project-management workflows.

## Recommended Agent Stack

- `Building Agent`: `Codex`
- `Server Agent`: `Hermes`
- `Semi-Agent`: `AI Sidebar`

For the full `2.5 Agents` role split and alternatives such as `Claude Code`, `Cursor`, or `OpenClaw`, see `docs/WORKFLOW.md`.

## Content And Project-Management Workflow

- [Obsidian](https://obsidian.md/)
- [Dataview](https://blacksmithgu.github.io/obsidian-dataview/)
- [Templater](https://silentvoid13.github.io/Templater/)
- [Obsidian Community](https://community.obsidian.md/)
- [claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian) — Claude Code integration for Obsidian vaults; useful reference for agent-vault workflow patterns

For many humanities and social-science archive projects, `Obsidian + Dataview + Templater` is a strong no-code or low-code workflow for:

- managing project documentation
- generating source-note templates
- tracking editorial status
- building dashboard-style overviews
- keeping source inventory and work notes inside the same vault

## UI, Visual, And Interaction References

- [Motion Sites](https://motionsites.ai/)
- [recent.design](https://recent.design/)
- [Figma](https://www.figma.com/)
- [Radix UI](https://www.radix-ui.com/)
- [open-design](https://github.com/nexu-io/open-design)
- [21st.dev](https://21st.dev/)
- [Three.js](https://threejs.org/)
- [Google Fonts](https://fonts.google.com/)
- [Shopify Editions Winter 2026](https://www.shopify.com/editions/winter2026)
- [Google Labs design.md](https://github.com/google-labs-code/design.md)

These are useful when shaping:

- the public archive interface
- the AI sidebar interaction layer
- motion, layout, and component direction
- design-system and typography decisions

## Archive, Catalogue, And Corpus References

- [sourcelibrary-v2](https://github.com/Embassy-of-the-Free-Mind/sourcelibrary-v2)
- [Cave17 e-Dunhuang](https://cave17.e-dunhuang.com/)
- [吾与点](https://www.wuyudian.net/)
- [識典古籍](https://edit.shidianguji.com/)
- [OpenITI](https://openiti.org/)
- [Honkoku](https://honkoku.org/index_en.html)
- [國家圖書館古籍資源庫](https://guji.nlc.cn/)
- [Google Knowledge Catalog](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main)
- [資治通鑑示例](https://github.com/JY0284/zizhitongjian)
- [史记知识库示例](https://github.com/baojie/shiji-kb)
- [llm_wiki](https://github.com/nashsu/llm_wiki)

These are useful when designing:

- archive catalogue patterns
- document-viewer expectations
- corpus navigation
- source metadata display
- knowledge-graph or wiki-like linking

## OCR, Document Extraction, And Translation References

- [MinerU](https://github.com/opendatalab/MinerU)
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
- [Mistral OCR 4](https://mistral.ai/news/ocr-4/)
- [MarkItDown](https://github.com/microsoft/markitdown)
- [HY-MT2 model collection](https://huggingface.co/collections/tencent/hy-mt2)

These are useful for:

- PDF extraction
- OCR pipeline comparison
- document parsing quality benchmarks
- optional local translation workflows

## Retrieval, Embedding, And Agent References

- [LightRAG](https://github.com/HKUDS/LightRAG)
- [Chroma](https://www.trychroma.com/)
- [Qwen3-Embedding-8B](https://huggingface.co/Qwen/Qwen3-Embedding-8B)
- [BGE-M3](https://bge-model.com/bge/bge_m3.html)
- [LangChain](https://www.langchain.com/)
- [Dify](https://dify.ai/)
- [腾讯元器 / Agent Platform](https://agent.qq.com/)

These are useful for:

- local embedding retrieval
- vector search
- graph-aware retrieval
- agent platform comparison and building
- archive-assistant RAG design

## Infrastructure, Hosting, And Deployment References

- [localhost.cc](https://localhost.cc/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Namecheap](https://www.namecheap.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)

These are useful for:

- tunnel/domain experiments
- lightweight API serving
- low-cost hosting
- static or hybrid app deployment

## Map And Spatial References

- [OpenStreetMap](https://www.openstreetmap.org/)

Use this when the archive includes:

- place entities
- map-based browsing
- timeline and spatial overlays

## Additional Open Standards And Scholarly References

- [Dublin Core](https://www.dublincore.org/)
- [IIIF](https://iiif.io/)
- [OpenAlex](https://openalex.org/)
- [Zotero](https://www.zotero.org/)

These are useful for:

- metadata design
- interoperable image/document delivery
- contextual scholarly linking
- citation workflow integration

## Notes

- Keep the tool list public and auditable.
- Separate “used directly” from “consulted as reference” when needed.
- Do not present speculative integrations as already working.
- Do not hard-code one deployment stack as mandatory unless the repo truly depends on it.
- Treat document workflow, OCR, retrieval, and hosting as separate decision layers.
