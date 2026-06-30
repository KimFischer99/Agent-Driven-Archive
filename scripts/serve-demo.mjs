#!/usr/bin/env node

import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";

const root = process.cwd();
const distRoot = path.join(root, "demo-dist");
const port = Number(process.env.PORT || 4173);

if (!existsSync(distRoot)) {
  console.error("Missing demo-dist. Run `npm run demo:render` first.");
  process.exit(1);
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let filePath = path.join(distRoot, decodeURIComponent(url.pathname));
  if (url.pathname.endsWith("/")) filePath = path.join(filePath, "index.html");
  if (!path.extname(filePath)) filePath = `${filePath}.html`;
  if (!existsSync(filePath)) {
    const maybeIndex = path.join(path.join(distRoot, decodeURIComponent(url.pathname)), "index.html");
    if (existsSync(maybeIndex)) filePath = maybeIndex;
  }
  if (!existsSync(filePath)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  const stat = statSync(filePath);
  if (stat.isDirectory()) filePath = path.join(filePath, "index.html");

  const contentType = mimeTypes[path.extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "content-type": contentType });
  createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`Demo server running at http://127.0.0.1:${port}`);
});
