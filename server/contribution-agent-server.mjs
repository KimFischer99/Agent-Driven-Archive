#!/usr/bin/env node

import http from "node:http";
import {
  insertContribution,
  openContributionDb,
  resolveAgentConfig,
  validateContributionPayload,
} from "./contribution-agent-lib.mjs";

const config = resolveAgentConfig();
const db = openContributionDb(config);

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS" && req.url === "/api/contributions") {
    return sendJson(res, 204, null, req);
  }

  if (req.method === "GET" && req.url === "/health") {
    return sendJson(res, 200, { ok: true }, req);
  }

  if (req.method === "POST" && req.url === "/api/contributions") {
    try {
      const body = await readJsonBody(req);
      const validation = validateContributionPayload(body);
      if (!validation.ok) return sendJson(res, 400, { ok: false, error: validation.error }, req);
      const saved = insertContribution(db, body, config);
      return sendJson(res, 201, {
        ok: true,
        id: saved.id,
        status: saved.status,
        message: "Contribution stored and queued for agent review.",
      }, req);
    } catch (error) {
      return sendJson(res, 500, { ok: false, error: explainError(error) }, req);
    }
  }

  return sendJson(res, 404, { ok: false, error: "Not found" }, req);
});

server.listen(config.port, config.host, () => {
  console.log(`Contribution agent server running at http://${config.host}:${config.port}`);
});

function sendJson(res, status, payload, req) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, GET, OPTIONS",
  };
  const origin = req?.headers.origin;
  if (isAllowedOrigin(origin, req, config)) {
    headers["access-control-allow-origin"] = origin;
    headers.vary = "Origin";
  }
  res.writeHead(status, headers);
  if (payload === null) {
    res.end();
    return;
  }
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error("Payload too large."));
    });
    req.on("end", () => resolve(JSON.parse(body || "{}")));
    req.on("error", reject);
  });
}

function explainError(error) {
  return error instanceof Error ? error.message : String(error);
}

function isAllowedOrigin(origin, req, config) {
  if (!origin) return true;
  const allowedOrigins = parseAllowedOrigins(config);
  if (allowedOrigins.length > 0) {
    return allowedOrigins.includes(origin);
  }

  try {
    const parsed = new URL(origin);
    const localhostHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
    return localhostHosts.has(parsed.hostname);
  } catch {
    return false;
  }
}

function parseAllowedOrigins(config) {
  const raw = process.env.CONTRIB_ALLOWED_ORIGINS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
