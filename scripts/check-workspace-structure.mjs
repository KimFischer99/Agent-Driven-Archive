#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspaceRoot = path.join(root, "workspace");

const requiredPaths = [
  "Primary_Sources",
  "References",
  "sources_index",
  "Archive/01_OCR",
  "Archive/02_Cleaned_Data",
  "Archive/03_Translation",
  "Archive/05_SQLite",
  "Blog/02_Research_Blogs",
  "Blog/05_SQLite",
  "Timeline_Map/01_OCR",
  "Timeline_Map/02_Cleaned_Data",
  "Timeline_Map/03_Events_Anchors",
  "Timeline_Map/04_SQLite",
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

