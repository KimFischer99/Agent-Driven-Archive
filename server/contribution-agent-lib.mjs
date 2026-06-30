import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const defaultDbPath = path.join(root, "runtime", "contribution-agent.sqlite");

export function resolveAgentConfig() {
  return {
    dbPath: process.env.CONTRIB_DB_PATH || defaultDbPath,
    projectName: process.env.CONTRIB_PROJECT_NAME || "Agent-Driven Archive",
    publicBaseUrl: process.env.CONTRIB_PUBLIC_BASE_URL || "https://archive.example.org",
    managerEmail: process.env.CONTRIB_MANAGER_EMAIL || "",
    mailFrom: process.env.CONTRIB_MAIL_FROM || "archive-bot@example.org",
    mailTransport: process.env.CONTRIB_MAIL_TRANSPORT || "stdout",
    sendmailCommand: process.env.CONTRIB_SENDMAIL_CMD || "sendmail -t -i",
    reviewerMode: process.env.CONTRIB_REVIEW_MODE || "heuristic",
    reviewerCommand: process.env.CONTRIB_AGENT_REVIEW_CMD || "",
    port: Number(process.env.PORT || 4310),
  };
}

export function openContributionDb(config = resolveAgentConfig()) {
  mkdirSync(path.dirname(config.dbPath), { recursive: true });
  const needsInit = !existsSync(config.dbPath);
  const db = new DatabaseSync(config.dbPath);
  db.exec(`PRAGMA busy_timeout = 5000;`);
  if (needsInit) {
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
    `);
    ensureSchema(db);
  } else if (!hasContributionSchema(db)) {
    ensureSchema(db);
  }
  return db;
}

function hasContributionSchema(db) {
  const row = db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'contributions'"
  ).get();
  return Boolean(row);
}

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contributions (
      id TEXT PRIMARY KEY,
      material_title TEXT NOT NULL,
      contributor_name TEXT NOT NULL,
      contributor_email TEXT NOT NULL,
      institutional_affiliations TEXT NOT NULL DEFAULT '',
      external_link TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL,
      rights_note TEXT NOT NULL DEFAULT '',
      source_date TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL DEFAULT '',
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_agent_review',
      review_summary TEXT NOT NULL DEFAULT '',
      reviewer_mode TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contribution_events (
      id TEXT PRIMARY KEY,
      contribution_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contribution_mail_outbox (
      id TEXT PRIMARY KEY,
      contribution_id TEXT,
      mail_type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      sent_at TEXT
    );
  `);
}

export function insertContribution(db, payload, config = resolveAgentConfig()) {
  const now = new Date().toISOString();
  const contributionId = `contrib_${randomUUID()}`;
  const normalized = normalizeContributionPayload(payload);

  const insert = db.prepare(`
    INSERT INTO contributions (
      id, material_title, contributor_name, contributor_email,
      institutional_affiliations, external_link, description, rights_note,
      source_date, source_type, payload_json, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_agent_review', ?, ?)
  `);

  insert.run(
    contributionId,
    normalized.material_title,
    normalized.contributor_name,
    normalized.contributor_email,
    normalized.institutional_affiliations,
    normalized.external_link,
    normalized.description,
    normalized.rights_note,
    normalized.source_date,
    normalized.source_type,
    JSON.stringify(normalized),
    now,
    now,
  );

  recordEvent(db, contributionId, "received", { payload: normalized }, now);
  enqueueMail(
    db,
    {
      contributionId,
      mailType: "contributor_ack",
      recipient: normalized.contributor_email,
      subject: `[${config.projectName}] Contribution received`,
      bodyText: buildContributorAck(config, contributionId, normalized),
    },
    now,
  );

  return { id: contributionId, payload: normalized, created_at: now, status: "pending_agent_review" };
}

export function normalizeContributionPayload(payload) {
  return {
    material_title: String(payload.material_title || "").trim(),
    contributor_name: String(payload.contributor_name || "").trim(),
    contributor_email: String(payload.contributor_email || "").trim(),
    institutional_affiliations: String(payload.institutional_affiliations || "").trim(),
    external_link: String(payload.external_link || "").trim(),
    description: String(payload.description || "").trim(),
    rights_note: String(payload.rights_note || "").trim(),
    source_date: String(payload.source_date || "").trim(),
    source_type: String(payload.source_type || "").trim(),
  };
}

export function validateContributionPayload(payload) {
  const required = ["material_title", "contributor_name", "contributor_email", "description"];
  const missing = required.filter((field) => !String(payload[field] || "").trim());
  if (missing.length) {
    return { ok: false, error: `Missing required fields: ${missing.join(", ")}` };
  }
  if (!String(payload.contributor_email).includes("@")) {
    return { ok: false, error: "Invalid contributor_email." };
  }
  return { ok: true };
}

export function pendingContributionRows(db) {
  return db.prepare(`
    SELECT * FROM contributions
    WHERE status = 'pending_agent_review'
    ORDER BY created_at ASC
  `).all();
}

export function reviewPendingContributions(db, config = resolveAgentConfig()) {
  const pending = pendingContributionRows(db);
  const reviewed = [];

  for (const row of pending) {
    const payload = JSON.parse(row.payload_json);
    const result = config.reviewerCommand
      ? runExternalReviewer(payload, config)
      : heuristicReview(payload);

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE contributions
      SET status = ?, review_summary = ?, reviewer_mode = ?, updated_at = ?
      WHERE id = ?
    `).run(result.status, result.summary, result.mode, now, row.id);

    recordEvent(db, row.id, "reviewed", result, now);
    reviewed.push({ id: row.id, payload, ...result });
  }

  if (reviewed.length && config.managerEmail) {
    enqueueMail(
      db,
      {
        contributionId: null,
        mailType: "manager_digest",
        recipient: config.managerEmail,
        subject: `[${config.projectName}] Contribution review digest (${reviewed.length})`,
        bodyText: buildManagerDigest(config, reviewed),
      },
      new Date().toISOString(),
    );
  }

  return reviewed;
}

function runExternalReviewer(payload, config) {
  const stdout = execFileSync("sh", ["-lc", config.reviewerCommand], {
    input: JSON.stringify(payload),
    encoding: "utf8",
  }).trim();
  const parsed = JSON.parse(stdout);
  return {
    status: sanitizeReviewStatus(parsed.status),
    summary: String(parsed.summary || "").trim() || "External reviewer returned no summary.",
    mode: "external-json",
  };
}

function heuristicReview(payload) {
  const longEnough = payload.description.length >= 80;
  const hasLink = Boolean(payload.external_link);
  const hasRights = Boolean(payload.rights_note);
  const score = Number(longEnough) + Number(hasLink) + Number(hasRights);

  if (score >= 2) {
    return {
      status: "approved_agent",
      summary: "Submission contains enough descriptive detail for preliminary agent approval and manager reporting.",
      mode: "heuristic",
    };
  }

  return {
    status: "needs_human_review",
    summary: "Submission is stored successfully but should be checked by a human before archive ingestion.",
    mode: "heuristic",
  };
}

function sanitizeReviewStatus(value) {
  const allowed = new Set(["approved_agent", "needs_human_review", "rejected_agent"]);
  return allowed.has(value) ? value : "needs_human_review";
}

export function sendPendingMails(db, config = resolveAgentConfig()) {
  const rows = db.prepare(`
    SELECT * FROM contribution_mail_outbox
    WHERE status = 'pending'
    ORDER BY created_at ASC
  `).all();

  const sent = [];
  const failed = [];
  for (const row of rows) {
    try {
      const rawEmail = buildRawEmail(config.mailFrom, row.recipient, row.subject, row.body_text);
      deliverMail(rawEmail, config);
      db.prepare(`
        UPDATE contribution_mail_outbox
        SET status = 'sent', attempts = attempts + 1, sent_at = ?, last_error = ''
        WHERE id = ?
      `).run(new Date().toISOString(), row.id);
      sent.push(row.id);
    } catch (error) {
      db.prepare(`
        UPDATE contribution_mail_outbox
        SET status = 'failed', attempts = attempts + 1, last_error = ?
        WHERE id = ?
      `).run(explainError(error), row.id);
      failed.push({ id: row.id, error: explainError(error) });
    }
  }

  return { sent, failed };
}

function deliverMail(rawEmail, config) {
  if (config.mailTransport === "stdout") {
    console.log(`\n---MAIL---\n${rawEmail}\n---END MAIL---\n`);
    return;
  }

  if (config.mailTransport === "sendmail") {
    execFileSync("sh", ["-lc", config.sendmailCommand], {
      input: rawEmail,
      encoding: "utf8",
      stdio: ["pipe", "ignore", "pipe"],
    });
    return;
  }

  throw new Error(`Unsupported mail transport: ${config.mailTransport}`);
}

function buildRawEmail(from, to, subject, bodyText) {
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    bodyText,
    "",
  ].join("\n");
}

function enqueueMail(db, { contributionId, mailType, recipient, subject, bodyText }, createdAt) {
  db.prepare(`
    INSERT INTO contribution_mail_outbox (
      id, contribution_id, mail_type, recipient, subject, body_text, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `mail_${randomUUID()}`,
    contributionId,
    mailType,
    recipient,
    subject,
    bodyText,
    createdAt,
  );
}

function recordEvent(db, contributionId, eventType, payload, createdAt) {
  db.prepare(`
    INSERT INTO contribution_events (
      id, contribution_id, event_type, payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    `event_${randomUUID()}`,
    contributionId,
    eventType,
    JSON.stringify(payload),
    createdAt,
  );
}

function buildContributorAck(config, contributionId, payload) {
  return [
    `Thank you for contributing to ${config.projectName}.`,
    "",
    `Submission ID: ${contributionId}`,
    `Title: ${payload.material_title}`,
    "",
    "Your submission has been stored and queued for agent review.",
    "A project maintainer may follow up if more information is needed.",
    "",
    `Reference URL: ${config.publicBaseUrl}/contributions/${contributionId}`,
  ].join("\n");
}

function buildManagerDigest(config, reviewed) {
  return [
    `Contribution review digest for ${config.projectName}`,
    "",
    ...reviewed.map((item, index) => [
      `${index + 1}. ${item.payload.material_title}`,
      `   ID: ${item.id}`,
      `   Contributor: ${item.payload.contributor_name} <${item.payload.contributor_email}>`,
      `   Status: ${item.status}`,
      `   Summary: ${item.summary}`,
    ].join("\n")),
    "",
    `Generated from ${reviewed.length} reviewed contribution(s).`,
  ].join("\n");
}

function explainError(error) {
  return error instanceof Error ? error.message : String(error);
}
