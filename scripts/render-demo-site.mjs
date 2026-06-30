#!/usr/bin/env node

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const config = readConfig();
const workspaceRoot = path.join(root, config.workspaceRoot);
const distRoot = path.join(root, "demo-dist");
rmSync(distRoot, { recursive: true, force: true });
const domainSpecs = [
  {
    key: "archive",
    title: "Archive",
    description: "Source-near records and cleaned documents.",
    statLabel: "record(s)",
    cardDescription: "Source-near records and cleaned texts.",
  },
  {
    key: "blog",
    title: "Blog",
    description: "Contextual and methodological writing.",
    statLabel: "post(s)",
    cardDescription: "Contextual essays and methodological notes.",
  },
  {
    key: "timeline_map",
    title: "Timeline & Map",
    description: "Normalized events and place/date notes.",
    statLabel: "event file(s)",
    cardDescription: "Normalized events, dates, and places.",
  },
];

const domains = domainSpecs.map((spec) => {
  const domainConfig = config.domains[spec.key];
  const routeBase = normalizeRouteBase(domainConfig.routeBase);
  const docs = loadDocs(path.join(workspaceRoot, domainConfig.contentDir), routeBase);
  return {
    ...spec,
    ...domainConfig,
    routeBase,
    routeBaseDir: routeToDir(routeBase),
    docs,
  };
});

const archiveDomain = domains.find((domain) => domain.key === "archive");
const blogDomain = domains.find((domain) => domain.key === "blog");
const timelineDomain = domains.find((domain) => domain.key === "timeline_map");

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
          <a href="${archiveDomain.routeBase}/">Browse Archive</a>
          <a href="${blogDomain.routeBase}/">Read Blog</a>
          <a href="${timelineDomain.routeBase}/">View Timeline</a>
        </div>
      </section>
      <section class="grid">
        ${renderCard("Archive", `${archiveDomain.docs.length} ${archiveDomain.statLabel}`, archiveDomain.cardDescription, `${archiveDomain.routeBase}/`)}
        ${renderCard("Blog", `${blogDomain.docs.length} ${blogDomain.statLabel}`, blogDomain.cardDescription, `${blogDomain.routeBase}/`)}
        ${renderCard("Timeline", `${timelineDomain.docs.length} ${timelineDomain.statLabel}`, timelineDomain.cardDescription, `${timelineDomain.routeBase}/`)}
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

for (const domain of domains) {
  writePage(
    path.join(distRoot, domain.routeBaseDir, "index.html"),
    renderListingPage(domain.title, domain.description, domain.docs)
  );

  for (const doc of domain.docs) {
    writePage(
      path.join(distRoot, domain.routeBaseDir, doc.slug, "index.html"),
      renderDocPage(domain.title, doc, `${domain.routeBase}/`)
    );
  }
}

console.log(JSON.stringify({
  ok: true,
  output: path.relative(root, distRoot),
  counts: {
    archive: archiveDomain.docs.length,
    blog: blogDomain.docs.length,
    timeline_map: timelineDomain.docs.length,
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

function normalizeRouteBase(routeBase) {
  const normalized = String(routeBase || "").trim().replace(/\/+$/u, "");
  if (!normalized.startsWith("/")) {
    throw new Error(`routeBase must start with '/': ${routeBase}`);
  }
  return normalized || "/";
}

function routeToDir(routeBase) {
  return routeBase.replace(/^\/+/u, "");
}

function renderListingPage(sectionTitle, description, docs) {
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
