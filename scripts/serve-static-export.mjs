#!/usr/bin/env node

import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_HOSTNAME = "0.0.0.0";
const DEFAULT_PORT = 3030;
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const OUT_DIR = path.join(ROOT_DIR, "out");

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".xml", "application/xml; charset=utf-8"],
]);

function readArgValue(args, shortName, longName, fallback) {
  const shortIndex = args.indexOf(shortName);
  if (shortIndex >= 0) {
    return args[shortIndex + 1] ?? fallback;
  }

  const longIndex = args.indexOf(longName);
  if (longIndex >= 0) {
    return args[longIndex + 1] ?? fallback;
  }

  const equalsPrefix = `${longName}=`;
  const equalsArg = args.find((arg) => arg.startsWith(equalsPrefix));
  return equalsArg ? equalsArg.slice(equalsPrefix.length) : fallback;
}

function readRedirects() {
  const redirectsPath = path.join(OUT_DIR, "_redirects");
  if (!existsSync(redirectsPath)) {
    return [];
  }

  return readFileSync(redirectsPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const [source, destination, status] = line.split(/\s+/);
      return {
        destination,
        source,
        status: Number.parseInt(status ?? "301", 10),
      };
    });
}

function redirectFor(pathname, redirects) {
  return redirects.find((redirect) => redirect.source === pathname);
}

function fileForPathname(pathname) {
  const decodedPathname = decodeURIComponent(pathname);
  const relativePath = decodedPathname.replace(/^\/+/, "");
  const candidate = path.normalize(path.join(OUT_DIR, relativePath));
  const relativeCandidate = path.relative(OUT_DIR, candidate);

  if (relativeCandidate.startsWith("..") || path.isAbsolute(relativeCandidate)) {
    return null;
  }

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }

  const indexCandidate = path.join(candidate, "index.html");
  if (existsSync(indexCandidate) && statSync(indexCandidate).isFile()) {
    return indexCandidate;
  }

  return null;
}

function sendFile(response, filePath, statusCode = 200) {
  const extension = path.extname(filePath);
  const contentType = MIME_TYPES.get(extension) ?? "application/octet-stream";

  response.writeHead(statusCode, {
    "Content-Type": contentType,
  });
  createReadStream(filePath).pipe(response);
}

function getLanUrls(port) {
  return Object.values(networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter(
      (entry) =>
        entry.family === "IPv4" && !entry.internal && entry.address.length > 0,
    )
    .map((entry) => `http://${entry.address}:${port}`);
}

const args = process.argv.slice(2);
const hostname = readArgValue(args, "-H", "--hostname", DEFAULT_HOSTNAME);
const portValue = readArgValue(args, "-p", "--port", String(DEFAULT_PORT));
const port = Number.parseInt(portValue, 10);

if (!existsSync(OUT_DIR)) {
  console.error("Missing static export directory. Run `npm run build` first.");
  process.exit(1);
}

const redirects = readRedirects();
const notFoundPath = path.join(OUT_DIR, "404.html");

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${hostname}:${port}`);
  const redirect = redirectFor(requestUrl.pathname, redirects);

  if (redirect) {
    response.writeHead(redirect.status, {
      Location: redirect.destination,
    });
    response.end();
    return;
  }

  const filePath = fileForPathname(requestUrl.pathname);
  if (filePath) {
    sendFile(response, filePath);
    return;
  }

  if (existsSync(notFoundPath)) {
    sendFile(response, notFoundPath, 404);
    return;
  }

  response.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end("Not found");
});

server.listen(port, hostname, () => {
  console.info(`Serving static export from ${OUT_DIR}`);
  console.info(`Local: http://127.0.0.1:${port}`);

  if (hostname === "0.0.0.0") {
    for (const lanUrl of getLanUrls(port)) {
      console.info(`Network: ${lanUrl}`);
    }
  } else {
    console.info(`Host: http://${hostname}:${port}`);
  }
});
