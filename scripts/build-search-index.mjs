#!/usr/bin/env node

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const config = readConfig();
const workspaceRoot = path.join(root, config.workspaceRoot);
const generatedDir = path.join(root, config.generatedDir);

const documents = [];

for (const [domainName, domainConfig] of Object.entries(config.domains)) {
  const routeBase = normalizeRouteBase(domainConfig.routeBase);
  const absoluteDir = path.join(workspaceRoot, domainConfig.contentDir);
  for (const filePath of listMarkdownFiles(absoluteDir)) {
    const raw = readFileSync(filePath, "utf8");
    const body = stripFrontmatter(raw);
    const title = frontmatterField(raw, "title") || stripExtension(path.basename(filePath));
    const slug = frontmatterField(raw, "slug") || stripExtension(path.basename(filePath));
    const tags = frontmatterList(raw, "tags");
    const stats = statSync(filePath);

    documents.push({
      id: `${domainName}:${slug}`,
      domain: domainName,
      title,
      slug,
      route: buildRoute(routeBase, slug),
      snippet: makeSnippet(body),
      body,
      tags,
      relative_path: path.relative(workspaceRoot, filePath),
      updated_at: stats.mtime.toISOString(),
    });
  }
}

mkdirSync(generatedDir, { recursive: true });
const outputPath = path.join(generatedDir, "search-index.json");
writeFileSync(outputPath, `${JSON.stringify({
  generated_at: new Date().toISOString(),
  site: config.site,
  document_count: documents.length,
  documents,
}, null, 2)}\n`);

console.log(JSON.stringify({
  ok: true,
  output: path.relative(root, outputPath),
  document_count: documents.length,
}, null, 2));

function readConfig() {
  const preferred = path.join(root, "archive.config.json");
  const fallback = path.join(root, "archive.config.example.json");
  const configPath = fileExists(preferred) ? preferred : fallback;
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function fileExists(filePath) {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function listMarkdownFiles(dir) {
  try {
    return readDirRecursive(dir).sort();
  } catch {
    return [];
  }
}

function readDirRecursive(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return readDirRecursive(nextPath);
    return entry.isFile() && entry.name.endsWith(".md") ? [nextPath] : [];
  });
}

function stripFrontmatter(text) {
  return text.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}

function frontmatterField(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return match ? match[1].trim().replace(/^"|"$/g, "") : "";
}

function frontmatterList(text, key) {
  const block = text.match(new RegExp(`^${key}:\\s*\\n([\\s\\S]*?)(?=\\n\\w|$)`, "m"));
  if (!block) return [];
  return block[1]
    .split("\n")
    .map((line) => line.replace(/^\s*-\s*/, "").trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

function makeSnippet(text, maxLength = 220) {
  const clean = text
    .replace(/^#{1,6}\s+.+$/gm, " ")
    .replace(/\[\^[^\]]+\]/g, " ")
    .replace(/^\[\^[^\]]+\]:.*$/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength).trim()}…` : clean;
}

function stripExtension(fileName) {
  return fileName.replace(/\.md$/, "");
}

function normalizeRouteBase(routeBase) {
  const raw = String(routeBase || "").trim();
  if (!raw.startsWith("/")) {
    throw new Error(`routeBase must start with '/': ${routeBase}`);
  }
  if (raw === "/") return "/";
  return raw.replace(/\/+$/u, "");
}

function buildRoute(routeBase, slug) {
  return routeBase === "/" ? `/${slug}` : `${routeBase}/${slug}`;
}
