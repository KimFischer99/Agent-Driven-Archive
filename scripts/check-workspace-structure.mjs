#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const config = readConfig();
const workspaceRoot = path.join(root, config.workspaceRoot);
const requiredPaths = readRequiredPaths(config);

const missing = requiredPaths.filter((relativePath) => !existsSync(path.join(workspaceRoot, relativePath)));

if (missing.length) {
  console.error(JSON.stringify({
    ok: false,
    workspaceRoot,
    missing,
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  workspaceRoot,
  checked: requiredPaths,
}, null, 2));

function readConfig() {
  const preferred = path.join(root, "archive.config.json");
  const fallback = path.join(root, "archive.config.example.json");
  const configPath = existsSync(preferred) ? preferred : fallback;
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function readRequiredPaths(config) {
  const requiredPaths = config.workspaceValidation?.requiredPaths;
  if (!Array.isArray(requiredPaths) || requiredPaths.some((item) => typeof item !== "string")) {
    throw new Error("workspaceValidation.requiredPaths must be an array of strings.");
  }
  return requiredPaths;
}
