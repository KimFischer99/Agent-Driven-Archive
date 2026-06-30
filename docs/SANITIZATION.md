# Sanitization

## Goal

Before releasing workflow artifacts publicly, remove or generalize information that is specific to one private or academic project.

## Must Remove Or Generalize

- personal contact information unless intentionally public
- course-specific framing
- institution-specific internal notes
- unpublished server credentials or paths
- private domain names not meant for public reuse
- project-specific source content
- non-public operational notes

## Keep

- general workflow logic
- generic field schemas
- reusable templates
- public tool references
- public documentation links
- architecture decisions that others can adapt

## Rewrite Instead Of Copying Verbatim

- landing-page copy
- acknowledgments
- topic framing
- contributor instructions tied to one corpus
- internal QA notes

## Repository Boundary

Open-source repo contents should prefer:

- placeholders
- examples with neutral topic names
- reusable schemas
- configurable domain names
- modular deployment notes

## Safe Public Examples

Use examples like:

- `topic = Local Religious Print Culture`
- `source_id = sample-gazette-1924`
- `place = Example City`

Avoid examples like:

- unpublished personal projects
- private contributor records
- identifiable course submission notes

## Review Checklist

Before publishing a file, verify:

1. Does it reveal a private person, unpublished workflow detail, or non-public infrastructure?
2. Does it encode one topic so strongly that reuse becomes misleading?
3. Does it expose source data that should stay in the original project only?
4. Can the same idea be expressed with a neutral placeholder instead?

