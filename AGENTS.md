# AGENTS.md

Project-level rules for coding agents working on this repository. Treat this as the repo-scoped extension of the global `CLAUDE.md` — it defines what agents must know about this specific project.

Keep this file concise: only always-relevant behavior, project norms, and safety boundaries.

**Tradeoff:** Prefer correctness, minimal diffs, and verified results over speed. For trivial tasks, use judgment.

## 0. Repository Role

This is a **workflow and starter repository** — not the deployed public application. It provides the content pipeline, workspace skeleton, scripts, skills, templates, and contribution-agent server. The frontend application lives in a separate project.

## 1. Language and Output Style

- Keep code, identifiers, API names, errors, technical terms, and academic terms in English.
- Output solutions, code, commands, and results directly.
- Be precise and concise. Avoid filler, greetings, apologies, status phrases, and unnecessary comments.

## 2. Reasoning and Scope

Think thoroughly before coding. Before implementing:

- Base claims on code, logs, config, docs, command output, or reproducible behavior.
- Prefer the simpler approach; push back on overcomplicated changes.
- If behavior, scope, or file-change count expands unexpectedly, stop and ask for confirmation.
- Scale process to risk: small edits proceed directly; multi-file work → brief plan; security, config, deps, or irreversible changes → get confirmation first.

## 3. Simplicity First

- All automation scripts use Node.js 22+ **built-in modules only** — zero npm dependencies. Do not introduce `package.json` dependencies.
- Python scripts target 3.11+; declare optional deps in `requirements-optional.txt` only.
- Before adding any dependency, check the standard library and existing project utilities first.
- No speculative features, single-use abstractions, or unrequested configurability.

## 4. Surgical Changes

- Touch only what is required. Do not improve adjacent code, comments, formatting, or unrelated structure.
- Match existing style. Every changed line should trace directly to the user's request.
- When a change creates orphans (imports, variables, functions), remove them. Do not remove pre-existing dead code unless asked.

## 5. Goal-Driven Execution

Define success criteria. Loop until verified. For multi-step tasks:

```text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

- Never claim verification unless it actually ran.
- If a check fails, state the exact command and outcome.
- If the same approach fails twice, stop patching and return to root-cause analysis.

## 6. Content Boundaries

- All archive content lives in `workspace/` as Markdown + YAML frontmatter.
- Agents may read, clean, and generate workspace content — but **must not fabricate** source records, event data, relationship claims, or blog content.
- Every record must trace back to a primary source or explicit reference.
- `generated/` is machine-output only. Do not edit by hand.
- Scripts write to `generated/` or domain `SQLite/` directories. They must not write into content directories.

## 7. Agent Model (reference)

The recommended minimum is **2.5 Agents**:

| Agent | Role | Examples |
|-------|------|----------|
| Building Agent | Coding, content processing, UI development | `Claude Code`, `Codex`, `Cursor` |
| Server Agent | Scheduled maintenance, contribution intake, automated review | `OpenClaw`, `Hermes` |
| Semi-Agent (0.5) | In-app assistant for public users | `AI Sidebar` |

## 8. Workspace Structure

```
workspace/
├── Primary_Sources/          # Isolated — raw materials, not in Obsidian vault
│   ├── Raw_Materials/        # Raw PDFs, documents, scans
│   └── Images/               # Image files
├── References/               # Isolated — reference materials
├── Vault/                    # Obsidian-compatible vault (open this in Obsidian)
│   ├── Agent_Workspace/
│   │   ├── sources_index/    # Source inventory
│   │   ├── templates/        # Content templates
│   │   ├── schemas/          # Frontmatter, SQLite, graph schemas
│   │   ├── controlled_tags/  # Controlled vocabulary
│   │   ├── derived_sqlite/   # Runtime SQLite databases
│   │   ├── workflow.md       # Agent workflow instructions
│   │   ├── activity_log.md   # Agent activity tracking
│   │   ├── hot.md            # Current project state
│   │   └── archive_manifest.md # Domain & source policy
│   ├── Archive/
│   │   ├── OCR/              # Raw OCR output
│   │   ├── Cleaned_Data/     # Cleaned Markdown → feeds demo site
│   │   ├── Translation/      # Translated records
│   │   └── SQLite/           # SQLite exports
│   ├── Blog/
│   │   ├── Posts/            # Published blog posts
│   │   └── SQLite/
│   ├── Timeline_Map/
│   │   ├── OCR/
│   │   ├── Cleaned_Data/     # Cleaned event records
│   │   ├── Events_Anchors/   # Temporal anchors
│   │   └── SQLite/
│   └── Knowledge_Graph/      # Structured relation records
```

## 9. Permission Protocol

Routine operations proceed without pause: read/write/edit workspace content, run scripts, serve demo, review contributions, safe git inspection.

Before these operations, stop and list the pending operation for user confirmation:

- Delete or overwrite primary source files in `Primary_Sources/`.
- Modify `archive.config.json` or environment variables.
- Push to a remote (no remote is configured by default).
- Install system packages or change the Node.js/Python runtime.
- Run `git commit` unless explicitly requested.
- Run `git push`, `git force-push`, `git reset --hard`, or `git rebase`.
- Affect production, real user data, external services, or paid resources.

## 10. Quick Commands

```bash
npm run check:workspace    # Validate workspace structure
npm run build:all          # Full build: check + manifest + search index
npm run demo:start         # Build and serve the demo site
npm run contrib:serve      # Start contribution intake server
npm run contrib:review     # Review pending contributions
```
