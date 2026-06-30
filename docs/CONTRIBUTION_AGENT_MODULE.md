# Contribution Agent Module

## Goal

This module provides a deployment-agnostic starter for handling public archive contributions through a server-side agent workflow.

The intended flow is:

```text
web JSON submission
-> HTTP intake endpoint
-> SQLite queue
-> immediate feedback email
-> cron-based agent review
-> digest/report mail to project manager
```

## Included Files

- `server/contribution-agent-server.mjs`
- `server/contribution-agent-lib.mjs`
- `scripts/init-contribution-agent-db.mjs`
- `scripts/send-contribution-mails.mjs`
- `scripts/review-contribution-queue.mjs`

## HTTP Intake

The starter HTTP server exposes:

- `POST /api/contributions`
- `GET /health`

Expected JSON fields:

- `material_title`
- `contributor_name`
- `contributor_email`
- `institutional_affiliations`
- `external_link`
- `description`
- `rights_note`
- `source_date`
- `source_type`

## SQLite Storage

The module stores:

- contributions
- contribution event log
- outgoing mail queue

Default database location:

```text
runtime/contribution-agent.sqlite
```

Override with:

```bash
CONTRIB_DB_PATH=/path/to/contribution-agent.sqlite
```

## Immediate Feedback Mail

When a contribution is received, the server immediately queues an acknowledgment mail to the contributor.

Send queued mail with:

```bash
node scripts/send-contribution-mails.mjs
```

Supported transports:

- `stdout`
  Safe local default for demos
- `sendmail`
  Generic server-side mail handoff

Environment variables:

- `CONTRIB_MAIL_TRANSPORT=stdout|sendmail`
- `CONTRIB_MAIL_FROM=archive-bot@example.org`
- `CONTRIB_SENDMAIL_CMD="sendmail -t -i"`

## Agent Review

Review pending submissions with:

```bash
node scripts/review-contribution-queue.mjs
```

Default mode:

- heuristic review

Optional external reviewer:

```bash
CONTRIB_AGENT_REVIEW_CMD='python3 reviewer.py'
```

The external reviewer should read one JSON payload from stdin and return JSON like:

```json
{
  "status": "approved_agent",
  "summary": "Useful source with enough metadata for preliminary approval."
}
```

Allowed statuses:

- `approved_agent`
- `needs_human_review`
- `rejected_agent`

## Manager Digest

After a review batch, the worker queues one digest/report mail to the project manager when:

```bash
CONTRIB_MANAGER_EMAIL=maintainer@example.org
```

Then send it with:

```bash
node scripts/send-contribution-mails.mjs
```

## Cron Pattern

One generic deployment pattern is:

1. keep the HTTP intake service always reachable
2. run `review-contribution-queue.mjs` on a schedule
3. run `send-contribution-mails.mjs` on a schedule

Example cron entries:

```cron
*/5 * * * * cd /path/to/Agent-Driven-Archive && node scripts/send-contribution-mails.mjs
0 * * * * cd /path/to/Agent-Driven-Archive && node scripts/review-contribution-queue.mjs
```

These are examples only. The repo does not require cron specifically; any scheduler is acceptable.

## Minimal Local Demo

1. `node scripts/init-contribution-agent-db.mjs`
2. `CONTRIB_MAIL_TRANSPORT=stdout node server/contribution-agent-server.mjs`
3. send a POST request to `/api/contributions`
4. `CONTRIB_MAIL_TRANSPORT=stdout node scripts/send-contribution-mails.mjs`
5. `CONTRIB_MANAGER_EMAIL=maintainer@example.org node scripts/review-contribution-queue.mjs`
6. `CONTRIB_MAIL_TRANSPORT=stdout CONTRIB_MANAGER_EMAIL=maintainer@example.org node scripts/send-contribution-mails.mjs`
