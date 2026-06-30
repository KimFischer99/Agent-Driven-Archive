#!/usr/bin/env node

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const config = readConfig();
const workspaceRoot = path.join(root, config.workspaceRoot);
const generatedDir = path.join(root, config.generatedDir);

const manifest = {
  generated_at: new Date().toISOString(),
  site: config.site,
  workspace_root: config.workspaceRoot,
  domains: {},
};

for (const [domainName, domainConfig] of Object.entries(config.domains)) {
  const absoluteDir = path.join(workspaceRoot, domainConfig.contentDir);
  const files = listMarkdownFiles(absoluteDir).map((filePath) => {
    const relativePath = path.relative(workspaceRoot, filePath);
    const raw = readFileSync(filePath, "utf8");
    const title = frontmatterField(raw, "title") || stripExtension(path.basename(filePath));
    const slug = frontmatterField(raw, "slug") || stripExtension(path.basename(filePath));
    const stats = statSync(filePath);

    return {
      title,
      slug,
      relative_path: relativePath,
      route: `${domainConfig.routeBase}/${slug}`,
      updated_at: stats.mtime.toISOString(),
    };
  });

  manifest.domains[domainName] = {
    content_dir: domainConfig.contentDir,
    count: files.length,
    files,
  };
}

mkdirSync(generatedDir, { recursive: true });
const outputPath = path.join(generatedDir, "source-manifest.json");
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify({
  ok: true,
  output: path.relative(root, outputPath),
  domain_counts: Object.fromEntries(
    Object.entries(manifest.domains).map(([domainName, data]) => [domainName, data.count])
  ),
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
    return readdirSync(dir, { withFileTypes: true })
      .flatMap((entry) => {
        const nextPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return listMarkdownFiles(nextPath);
        return entry.isFile() && entry.name.endsWith(".md") ? [nextPath] : [];
      })
      .sort();
  } catch {
    return [];
  }
}

function frontmatterField(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return match ? match[1].trim().replace(/^"|"$/g, "") : "";
}

function stripExtension(fileName) {
  return fileName.replace(/\.md$/, "");
}

