#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { siteHost, siteUrl } from "./site-config.mjs";

const DEFAULT_ENDPOINT = "https://www.bing.com/indexnow";
const DEFAULT_HOST = siteHost();
const DEFAULT_KEY = "streetsmartchina-indexnow-key-placeholder";
const DEFAULT_SITEMAP_URL = new URL("/sitemap.xml", siteUrl()).toString();
const DEFAULT_BATCH_SIZE = 10000;
const MAX_BATCH_SIZE = 10000;

const VALUE_FLAGS = new Set([
  "--batch-size",
  "--endpoint",
  "--host",
  "--key",
  "--sitemap-url",
]);

function getFlagValue(args, flagName, fallback) {
  const index = args.indexOf(flagName);
  if (index < 0) {
    return fallback;
  }

  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`${flagName} requires a value.`);
  }

  return value;
}

function hasFlag(args, flagName) {
  return args.includes(flagName);
}

function getUnexpectedArgs(args) {
  return args.filter((arg, index) => {
    if (arg.startsWith("-")) {
      return !VALUE_FLAGS.has(arg) && arg !== "--dry-run";
    }

    const previous = args[index - 1];
    return !previous || !VALUE_FLAGS.has(previous);
  });
}

function parsePositiveInteger(value, fallback) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseHttpUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid absolute URL: ${value}`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`${label} must use http or https: ${value}`);
  }

  return url;
}

function normalizeHost(value) {
  const rawHost = value.trim();
  if (rawHost.length === 0) {
    throw new Error("IndexNow host must not be empty.");
  }

  const hostSource = rawHost.includes("://")
    ? rawHost
    : `https://${rawHost.replace(/^\/+/, "")}`;
  const parsed = parseHttpUrl(hostSource, "IndexNow host");

  return parsed.hostname.toLowerCase();
}

function getConfig(args, env = process.env) {
  const unexpectedArgs = getUnexpectedArgs(args);
  if (unexpectedArgs.length > 0) {
    throw new Error(`Unexpected argument(s): ${unexpectedArgs.join(", ")}`);
  }

  const endpoint = parseHttpUrl(
    getFlagValue(args, "--endpoint", env.INDEXNOW_ENDPOINT ?? DEFAULT_ENDPOINT),
    "IndexNow endpoint",
  );
  const sitemapUrl = parseHttpUrl(
    getFlagValue(
      args,
      "--sitemap-url",
      env.INDEXNOW_SITEMAP_URL ?? DEFAULT_SITEMAP_URL,
    ),
    "Sitemap URL",
  );
  const host = normalizeHost(
    getFlagValue(args, "--host", env.INDEXNOW_HOST ?? DEFAULT_HOST),
  );
  const key = getFlagValue(args, "--key", env.INDEXNOW_KEY ?? DEFAULT_KEY);
  const batchSize = Math.min(
    parsePositiveInteger(
      getFlagValue(
        args,
        "--batch-size",
        env.INDEXNOW_BATCH_SIZE ?? String(DEFAULT_BATCH_SIZE),
      ),
      DEFAULT_BATCH_SIZE,
    ),
    MAX_BATCH_SIZE,
  );

  if (key.trim().length === 0) {
    throw new Error("IndexNow key must not be empty.");
  }

  return {
    batchSize,
    dryRun: hasFlag(args, "--dry-run") || env.INDEXNOW_DRY_RUN === "1",
    endpoint,
    host,
    key: key.trim(),
    sitemapUrl,
  };
}

function decodeXmlText(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function extractSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    decodeXmlText(match[1].trim()),
  );
}

function collectSubmitUrls(locs, host) {
  const invalidUrls = [];
  const outsideHostUrls = [];
  const seen = new Set();
  const urls = [];

  for (const loc of locs) {
    let url;
    try {
      url = new URL(loc);
    } catch {
      invalidUrls.push(loc);
      continue;
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      invalidUrls.push(loc);
      continue;
    }

    if (url.hostname.toLowerCase() !== host) {
      outsideHostUrls.push(loc);
      continue;
    }

    const normalizedUrl = url.toString();
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      urls.push(normalizedUrl);
    }
  }

  return { invalidUrls, outsideHostUrls, urls };
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function fetchSitemapXml(sitemapUrl) {
  const response = await fetch(sitemapUrl, {
    headers: {
      accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
      "user-agent": "streetsmartchina-indexnow/1.0",
    },
  });

  if (response.status !== 200) {
    throw new Error(
      `Expected sitemap to return 200, got ${response.status} from ${sitemapUrl.toString()}.`,
    );
  }

  return response.text();
}

async function submitBatch({ endpoint, host, key, urls }) {
  const response = await fetch(endpoint, {
    body: JSON.stringify({
      host,
      key,
      urlList: urls,
    }),
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    method: "POST",
  });
  const responseText = await response.text();

  if (response.status !== 200 && response.status !== 202) {
    const reason = responseText.trim();
    throw new Error(
      `IndexNow returned ${response.status}${reason ? `: ${reason}` : ""}.`,
    );
  }

  return response.status;
}

async function run(args = process.argv.slice(2), env = process.env) {
  const config = getConfig(args, env);
  const sitemapXml = await fetchSitemapXml(config.sitemapUrl);
  const locs = extractSitemapLocs(sitemapXml);

  if (locs.length === 0) {
    throw new Error(
      `No <loc> entries found in ${config.sitemapUrl.toString()}.`,
    );
  }

  const { invalidUrls, outsideHostUrls, urls } = collectSubmitUrls(
    locs,
    config.host,
  );

  for (const invalidUrl of invalidUrls) {
    console.warn(`Skipping malformed sitemap URL: ${invalidUrl}`);
  }

  for (const outsideHostUrl of outsideHostUrls) {
    console.warn(`Skipping URL outside ${config.host}: ${outsideHostUrl}`);
  }

  if (urls.length === 0) {
    throw new Error(
      `No URLs from ${config.sitemapUrl.toString()} matched host ${config.host}.`,
    );
  }

  const batches = chunk(urls, config.batchSize);

  if (config.dryRun) {
    console.info(
      `IndexNow dry run: ${urls.length} URL(s), ${batches.length} batch(es), endpoint ${config.endpoint.toString()}.`,
    );
    return {
      batchCount: batches.length,
      submittedUrlCount: urls.length,
    };
  }

  const statuses = [];
  for (const urlsBatch of batches) {
    const status = await submitBatch({
      endpoint: config.endpoint,
      host: config.host,
      key: config.key,
      urls: urlsBatch,
    });
    statuses.push(status);
  }

  console.info(
    `IndexNow submitted ${urls.length} URL(s) in ${batches.length} batch(es). Statuses: ${statuses.join(", ")}.`,
  );

  return {
    batchCount: batches.length,
    submittedUrlCount: urls.length,
  };
}

const entrypoint = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;

if (import.meta.url === entrypoint) {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`IndexNow submission failed: ${message}`);
    process.exitCode = 1;
  }
}

export { collectSubmitUrls, extractSitemapLocs, getConfig, run };
