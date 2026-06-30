#!/usr/bin/env node

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspaceRoot = path.join(root, "workspace");
const distRoot = path.join(root, "demo-dist");
const config = readConfig();

const archiveDocs = loadDocs(path.join(workspaceRoot, "Archive", "Cleaned_Data"), "/archive");
const blogDocs = loadDocs(path.join(workspaceRoot, "Blog", "Posts"), "/blog");
const timelineDocs = loadDocs(path.join(workspaceRoot, "Timeline_Map", "Cleaned_Data"), "/timeline-map");

writePage(
  path.join(distRoot, "index.html"),
  renderLayout(
    "Agent-Driven Archive Starter",
    `
      <section class="hero">
        <p class="eyebrow">Agent-Driven Online Archive Building and Maintenance</p>
        <h1>${escapeHtml(config.site.title)}</h1>
        <p class="lead">A starter repository for building topic-specific online archives with a structured content workspace, export scripts, retrieval hooks, and AI-assisted maintenance workflows.</p>
        <div class="hero-links">
          <a href="/archive/">Browse Archive</a>
          <a href="/blog/">Read Blog</a>
          <a href="/timeline-map/">View Timeline</a>
        </div>
      </section>
      <section class="grid">
        ${renderCard("Archive", `${archiveDocs.length} record(s)`, "Source-near records and cleaned texts.", "/archive/")}
        ${renderCard("Blog", `${blogDocs.length} post(s)`, "Contextual essays and methodological notes.", "/blog/")}
        ${renderCard("Timeline", `${timelineDocs.length} event file(s)`, "Normalized events, dates, and places.", "/timeline-map/")}
      </section>
      <section class="panel">
        <h2>Starter Workflow</h2>
        <ol>
          <li>Place sources in <code>workspace/Primary_Sources/</code>.</li>
          <li>Create cleaned and structured Markdown records.</li>
          <li>Run <code>npm run build:all</code> to regenerate starter outputs.</li>
          <li>Run <code>npm run demo:start</code> to serve this demo site.</li>
        </ol>
      </section>
    `
  )
);

writePage(
  path.join(distRoot, "archive", "index.html"),
  renderListingPage("Archive", "Source-near records and cleaned documents.", archiveDocs, "/archive")
);

writePage(
  path.join(distRoot, "blog", "index.html"),
  renderListingPage("Blog", "Contextual and methodological writing.", blogDocs, "/blog")
);

writePage(
  path.join(distRoot, "timeline-map", "index.html"),
  renderListingPage("Timeline & Map", "Normalized events and place/date notes.", timelineDocs, "/timeline-map")
);

for (const doc of archiveDocs) {
  writePage(
    path.join(distRoot, "archive", doc.slug, "index.html"),
    renderDocPage("Archive", doc, "/archive/")
  );
}

for (const doc of blogDocs) {
  writePage(
    path.join(distRoot, "blog", doc.slug, "index.html"),
    renderDocPage("Blog", doc, "/blog/")
  );
}

for (const doc of timelineDocs) {
  writePage(
    path.join(distRoot, "timeline-map", doc.slug, "index.html"),
    renderDocPage("Timeline & Map", doc, "/timeline-map/")
  );
}

console.log(JSON.stringify({
  ok: true,
  output: path.relative(root, distRoot),
  counts: {
    archive: archiveDocs.length,
    blog: blogDocs.length,
    timeline_map: timelineDocs.length,
  },
}, null, 2));

function readConfig() {
  const preferred = path.join(root, "archive.config.json");
  const fallback = path.join(root, "archive.config.example.json");
  const configPath = fileExists(preferred) ? preferred : fallback;
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function fileExists(filePath) {
  try {
    readFileSync(filePath, "utf8");
    return true;
  } catch {
    return false;
  }
}

function loadDocs(dir, routeBase) {
  const files = listMarkdownFiles(dir);
  return files.map((filePath) => {
    const raw = readFileSync(filePath, "utf8");
    const frontmatter = parseFrontmatter(raw);
    const body = stripFrontmatter(raw);
    const slug = frontmatter.slug || stripExtension(path.basename(filePath));
    return {
      slug,
      title: frontmatter.title || slug,
      summary: frontmatter.summary || firstParagraph(body),
      body,
      route: `${routeBase}/${slug}/`,
      sourcePath: path.relative(root, filePath),
      frontmatter,
    };
  });
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

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;
    data[field[1]] = field[2].trim().replace(/^"|"$/g, "");
  }
  return data;
}

function stripFrontmatter(text) {
  return text.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}

function firstParagraph(text) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.replace(/^#+\s+/gm, "").trim())
    .find(Boolean) || "";
}

function stripExtension(fileName) {
  return fileName.replace(/\.md$/, "");
}

function renderListingPage(sectionTitle, description, docs, backHref) {
  return renderLayout(
    sectionTitle,
    `
      <section class="panel">
        <p class="eyebrow">${escapeHtml(sectionTitle)}</p>
        <h1>${escapeHtml(sectionTitle)}</h1>
        <p class="lead">${escapeHtml(description)}</p>
        <p><a href="/">Back Home</a></p>
      </section>
      <section class="list">
        ${docs.map((doc) => `
          <article class="item">
            <h2><a href="${doc.route}">${escapeHtml(doc.title)}</a></h2>
            <p>${escapeHtml(doc.summary)}</p>
            <small>${escapeHtml(doc.sourcePath)}</small>
          </article>
        `).join("") || `<p class="empty">No records yet. Add Markdown files under <code>workspace/</code> and rerun <code>npm run build:all</code>.</p>`}
      </section>
    `
  );
}

function renderDocPage(sectionTitle, doc, backHref) {
  return renderLayout(
    doc.title,
    `
      <section class="panel">
        <p class="eyebrow">${escapeHtml(sectionTitle)}</p>
        <h1>${escapeHtml(doc.title)}</h1>
        <p><a href="${backHref}">Back to ${escapeHtml(sectionTitle)}</a></p>
      </section>
      <section class="panel markdown">
        ${renderMarkdown(doc.body)}
      </section>
      <section class="panel meta">
        <h2>Source File</h2>
        <p><code>${escapeHtml(doc.sourcePath)}</code></p>
      </section>
    `
  );
}

function renderCard(title, stat, description, href) {
  return `
    <article class="card">
      <p class="eyebrow">${escapeHtml(title)}</p>
      <h2>${escapeHtml(stat)}</h2>
      <p>${escapeHtml(description)}</p>
      <a href="${href}">Open</a>
    </article>
  `;
}

function renderMarkdown(markdown) {
  return markdown
    .split(/\n\s*\n/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^#\s+/.test(trimmed)) return `<h1>${escapeHtml(trimmed.replace(/^#\s+/, ""))}</h1>`;
      if (/^##\s+/.test(trimmed)) return `<h2>${escapeHtml(trimmed.replace(/^##\s+/, ""))}</h2>`;
      if (/^###\s+/.test(trimmed)) return `<h3>${escapeHtml(trimmed.replace(/^###\s+/, ""))}</h3>`;
      if (/^(?:-\s+.+\n?)+$/.test(trimmed)) {
        const items = trimmed.split("\n").map((line) => `<li>${escapeHtml(line.replace(/^-+\s+/, ""))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${escapeHtml(trimmed).replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

function renderLayout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; --bg:#f7f4ef; --ink:#161616; --muted:#5e5b56; --accent:#8f1d22; --panel:#ffffff; --line:rgba(22,22,22,0.1); }
    * { box-sizing:border-box; }
    body { margin:0; font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:linear-gradient(180deg,#fbfaf8 0%,#f2ede4 100%); color:var(--ink); }
    main { max-width:980px; margin:0 auto; padding:48px 24px 80px; }
    a { color:var(--accent); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .hero, .panel, .card, .item { background:rgba(255,255,255,0.82); backdrop-filter: blur(10px); border:1px solid var(--line); border-radius:24px; box-shadow:0 16px 50px rgba(0,0,0,0.05); }
    .hero, .panel { padding:32px; }
    .hero { margin-bottom:24px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:20px; margin-bottom:24px; }
    .card, .item { padding:24px; }
    .list { display:grid; gap:16px; }
    .eyebrow { margin:0 0 12px; color:var(--accent); text-transform:uppercase; letter-spacing:0.14em; font-size:0.75rem; font-weight:700; }
    h1 { margin:0 0 16px; font-size:clamp(2.3rem,7vw,4.2rem); line-height:0.95; }
    h2 { margin:0 0 14px; font-size:1.45rem; }
    h3 { margin:24px 0 10px; font-size:1.08rem; }
    p, li, small, code { line-height:1.7; }
    .lead { max-width:54rem; color:var(--muted); font-size:1.05rem; }
    .hero-links { display:flex; flex-wrap:wrap; gap:12px; margin-top:22px; }
    .hero-links a { display:inline-flex; padding:10px 14px; border-radius:999px; border:1px solid rgba(143,29,34,0.16); background:rgba(143,29,34,0.06); }
    code { background:#f3ede5; padding:2px 6px; border-radius:6px; }
    ul, ol { padding-left:20px; }
    .markdown h1 { font-size:2rem; }
    .markdown h2 { margin-top:28px; }
    .empty { color:var(--muted); }
    @media (max-width: 640px) { main { padding:24px 16px 64px; } .hero, .panel, .card, .item { border-radius:18px; } }
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`;
}

function writePage(filePath, html) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, html);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
