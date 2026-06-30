# Contributing

Thank you for contributing to `Agent-Driven-Archive`.

## Scope

This repository is intended to stay:

- reusable across archive topics
- deployment-agnostic
- suitable for public release
- workflow-first rather than UI-only

Contributions that introduce topic-specific content, personal data, machine-local paths, or one-off deployment assumptions are likely to be rejected.

## Good Contribution Targets

- workflow improvements
- starter script fixes
- documentation clarifications
- generic archive data contracts
- retrieval/RAG integration improvements
- contribution-agent improvements
- publication-readiness hardening
- portability improvements

## Before You Submit

1. keep changes minimal and reusable
2. avoid adding secrets, personal information, or local absolute paths
3. avoid hard-coding one host, proxy, scheduler, or runtime supervisor
4. document new commands or behaviors in the relevant README or `docs/`
5. run the smallest relevant validation locally

## Suggested Checks

```bash
npm run build:all
npm run demo:render
node --check server/contribution-agent-lib.mjs
node --check server/contribution-agent-server.mjs
```

If your change touches Python scripts, also run the smallest syntax or smoke check relevant to that file.

## Pull Request Guidance

- explain the user-facing goal
- explain why the change is reusable
- note any publication-readiness considerations
- note any deferred follow-up work

## Documentation Rule

If you add or change:

- a workflow step
- a script
- a folder contract
- a required environment variable

update the relevant file in `README.md`, `README.zh.md`, or `docs/`.

## Security

Do not open public issues containing secrets, private datasets, tokens, credentials, or internal infrastructure details. Report security-sensitive issues through the process described in [SECURITY.md](./SECURITY.md).
