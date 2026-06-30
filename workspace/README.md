# Workspace Skeleton

This folder provides a reusable archive-workspace layout for new projects.

It can also be used directly as an Obsidian vault or as a subfolder inside an existing Obsidian vault.

## Recommended Shape

```text
workspace/
  Primary_Sources/
  References/
  sources_index/
  Archive/
    01_OCR/
    02_Cleaned_Data/
    03_Translation/
    05_SQLite/
  Blog/
    02_Research_Blogs/
    05_SQLite/
  Timeline_Map/
    01_OCR/
    02_Cleaned_Data/
    03_Events_Anchors/
    04_SQLite/
  Knowledge_Graph/
```

## Principle

Keep external sources, editable records, generated outputs, and public app code separate.

## Obsidian Workflow Recommendation

If you manage the project in Obsidian, a practical setup is:

- use `Templater` for source-note, record, and project-log templates
- use `Dataview` for status tables, source dashboards, and workflow overviews
- keep frontmatter fields stable so scripts and vault queries can share the same metadata
