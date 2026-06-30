# Workspace Skeleton

This folder provides a reusable archive-workspace layout for new projects.

It can also be used directly as an Obsidian vault or as a subfolder inside an existing Obsidian vault.

## Recommended Shape

```text
workspace/
  Agent_Workspace/
    sources_index/
    templates/
    schemas/
    controlled_tags/
    derived_sqlite/
    workflow.md
    activity_log.md
    hot.md
    archive_manifest.md
  Primary_Sources/
  References/
  Archive/
    OCR/
    Cleaned_Data/
    Translation/
    SQLite/
  Blog/
    Posts/
    SQLite/
  Timeline_Map/
    OCR/
    Cleaned_Data/
    Events_Anchors/
    SQLite/
  Knowledge_Graph/
```

## Principle

Keep external sources, editable records, generated outputs, and public app code separate.

## Obsidian Workflow Recommendation

If you manage the project in Obsidian, a practical setup is:

- use `Templater` for source-note, record, and project-log templates
- use `Dataview` for status tables, source dashboards, and workflow overviews
- keep frontmatter fields stable so scripts and vault queries can share the same metadata
