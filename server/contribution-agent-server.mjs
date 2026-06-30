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
  if (req.method === "GET" && req.url === "/health") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && req.url === "/api/contributions") {
    try {
      const body = await readJsonBody(req);
      const validation = validateContributionPayload(body);
      if (!validation.ok) return sendJson(res, 400, { ok: false, error: validation.error });
      const saved = insertContribution(db, body, config);
      return sendJson(res, 201, {
        ok: true,
        id: saved.id,
        status: saved.status,
        message: "Contribution stored and queued for agent review.",
      });
    } catch (error) {
      return sendJson(res, 500, { ok: false, error: explainError(error) });
    }
  }

  return sendJson(res, 404, { ok: false, error: "Not found" });
});

server.listen(config.port, () => {
  console.log(`Contribution agent server running at http://127.0.0.1:${config.port}`);
});

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
  });
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
