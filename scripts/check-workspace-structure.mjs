#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspaceRoot = path.join(root, "workspace");

const requiredPaths = [
  "Primary_Sources/Raw_Materials",
  "Primary_Sources/Images",
  "References",
  "Vault/Agent_Workspace",
  "Vault/Agent_Workspace/sources_index",
  "Vault/Agent_Workspace/controlled_tags",
  "Vault/Agent_Workspace/schemas",
  "Vault/Agent_Workspace/templates",
  "Vault/Agent_Workspace/derived_sqlite",
  "Vault/Archive/OCR",
  "Vault/Archive/Cleaned_Data",
  "Vault/Archive/Translation",
  "Vault/Archive/SQLite",
  "Vault/Blog/Posts",
  "Vault/Blog/SQLite",
  "Vault/Timeline_Map/OCR",
  "Vault/Timeline_Map/Cleaned_Data",
  "Vault/Timeline_Map/Events_Anchors",
  "Vault/Timeline_Map/SQLite",
  "Vault/Knowledge_Graph",
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

