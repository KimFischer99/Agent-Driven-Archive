#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspaceRoot = path.join(root, "workspace");

const requiredPaths = [
  "Primary_Sources",
  "References",
  "sources_index",
  "Archive/OCR",
  "Archive/Cleaned_Data",
  "Archive/Translation",
  "Archive/SQLite",
  "Blog/Posts",
  "Blog/SQLite",
  "Timeline_Map/OCR",
  "Timeline_Map/Cleaned_Data",
  "Timeline_Map/Events_Anchors",
  "Timeline_Map/SQLite",
  "Knowledge_Graph",
];

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

