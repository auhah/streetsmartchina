#!/usr/bin/env node

import { createHash, randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { gscSiteProperty, siteUrl } from "./site-config.mjs";

const DEFAULT_SITE_URL = gscSiteProperty();
const DEFAULT_CREDENTIALS_DIR = ".gsc";
const DEFAULT_CLIENT_FILE = path.join(
  DEFAULT_CREDENTIALS_DIR,
  "oauth-client.json",
);
const DEFAULT_TOKEN_FILE = path.join(DEFAULT_CREDENTIALS_DIR, "token.json");
const DEFAULT_AUTH_PORT = 53682;
const AUTH_CALLBACK_TIMEOUT_MS = 5 * 60_000;
const TOKEN_EXPIRY_SAFETY_MS = 60_000;

const SCOPE_READONLY = "https://www.googleapis.com/auth/webmasters.readonly";
const SCOPE_WRITE = "https://www.googleapis.com/auth/webmasters";

const COMMANDS = new Set([
  "auth",
  "help",
  "inspect",
  "performance",
  "sitemaps",
  "sites",
  "summary",
]);

// Flags that consume the next argument as their value, so a positional arg
// (e.g. the inspect URL) is not mistaken for a flag value, and a flag value is
// not mistaken for a positional arg — even when boolean flags like --write are
// present.
const VALUE_FLAGS = new Set([
  "--client-file",
  "--dimensions",
  "--end-date",
  "--limit",
  "--port",
  "--site",
  "--start-date",
  "--token-file",
  "--url",
]);

function getCommand() {
  const maybeCommand = process.argv[2];
  if (!maybeCommand || maybeCommand.startsWith("-")) {
    return "help";
  }

  return COMMANDS.has(maybeCommand) ? maybeCommand : "help";
}

function getCommandArgs() {
  const command = getCommand();
  return command === "help" ? process.argv.slice(2) : process.argv.slice(3);
}

function getFlagValue(args, flagName, fallback) {
  const index = args.indexOf(flagName);
  if (index < 0) {
    return fallback;
  }

  const value = args[index + 1];
  return value && !value.startsWith("-") ? value : fallback;
}

function hasFlag(args, flagName) {
  return args.includes(flagName);
}

function getPositionalArgs(args) {
  return args.filter((arg, index) => {
    if (arg.startsWith("-")) {
      return false;
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

function requireString(value, reason) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(reason);
  }

  return value;
}

async function readJson(filePath, reason) {
  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`${reason}: ${error.message}`);
    }
    throw error;
  }

  const parsed = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${filePath} must contain a JSON object.`);
  }

  return parsed;
}

async function writeJson(filePath, value) {
  // Token files hold long-lived OAuth secrets, so keep the dir and file
  // owner-only (0700/0600) instead of inheriting a world-readable umask.
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600,
  });
  await rename(tmpPath, filePath);
  await chmod(filePath, 0o600);
}

function parseJsonOrEmpty(text) {
  if (text.length === 0) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function readOAuthClientFromJson(json, filePath) {
  const candidate = "installed" in json ? json.installed : json.web;
  if (
    typeof candidate !== "object" ||
    candidate === null ||
    Array.isArray(candidate)
  ) {
    throw new Error(
      `${filePath} must be a Google OAuth client JSON file with an installed or web object.`,
    );
  }

  return {
    clientId: requireString(
      candidate.client_id,
      `${filePath} is missing client_id.`,
    ),
    clientSecret:
      typeof candidate.client_secret === "string"
        ? candidate.client_secret
        : "",
  };
}

async function readOAuthClient(args) {
  const clientFile = getFlagValue(args, "--client-file", DEFAULT_CLIENT_FILE);
  const json = await readJson(
    clientFile,
    `Cannot read OAuth client file at ${clientFile}. Download it from Google Cloud and save it there`,
  );

  return readOAuthClientFromJson(json, clientFile);
}

function base64Url(buffer) {
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function createCodeVerifier() {
  return base64Url(randomBytes(64));
}

function createCodeChallenge(codeVerifier) {
  return base64Url(createHash("sha256").update(codeVerifier).digest());
}

function createAuthUrl({ clientId, codeChallenge, redirectUri, scope, state }) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url;
}

async function waitForOAuthCode({ authUrl, port, state }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (finish, value) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      server.close();
      finish(value);
    };

    const server = createServer((request, response) => {
      const requestUrl = new URL(
        request.url ?? "/",
        `http://127.0.0.1:${port}`,
      );

      if (requestUrl.pathname !== "/oauth2callback") {
        response.writeHead(404, { "content-type": "text/plain" });
        response.end("Not found");
        return;
      }

      const returnedState = requestUrl.searchParams.get("state");
      const error = requestUrl.searchParams.get("error");
      const code = requestUrl.searchParams.get("code");

      if (error) {
        response.writeHead(400, { "content-type": "text/plain" });
        response.end(`Authorization failed: ${error}`);
        settle(reject, new Error(`OAuth authorization failed: ${error}`));
        return;
      }

      if (returnedState !== state || !code) {
        response.writeHead(400, { "content-type": "text/plain" });
        response.end("Invalid OAuth callback.");
        settle(reject, new Error("OAuth callback state or code was invalid."));
        return;
      }

      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(
        "<h1>GSC auth complete</h1><p>You can close this tab and return to the terminal.</p>",
      );
      settle(resolve, code);
    });

    const timer = setTimeout(() => {
      settle(
        reject,
        new Error(
          "Timed out after 5 minutes waiting for the Google OAuth callback. Run npm run gsc:auth again.",
        ),
      );
    }, AUTH_CALLBACK_TIMEOUT_MS);
    timer.unref?.();

    server.once("error", (error) => settle(reject, error));
    server.listen(port, "127.0.0.1", () => {
      console.info("");
      console.info("Open this URL in your browser to authorize GSC access:");
      console.info(authUrl.toString());
      console.info("");
      console.info(
        `Waiting for Google OAuth callback on http://127.0.0.1:${port}/oauth2callback ...`,
      );
    });
  });
}

async function postForm(url, form) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  const text = await response.text();
  const json = parseJsonOrEmpty(text);

  if (!response.ok) {
    const message =
      typeof json.error_description === "string"
        ? json.error_description
        : text;
    throw new Error(`Google token request failed: ${message}`);
  }

  return json;
}

async function exchangeCodeForToken({
  client,
  code,
  codeVerifier,
  redirectUri,
}) {
  const form = new URLSearchParams({
    client_id: client.clientId,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  if (client.clientSecret) {
    form.set("client_secret", client.clientSecret);
  }

  return postForm("https://oauth2.googleapis.com/token", form);
}

async function refreshToken({ client, refreshTokenValue }) {
  const form = new URLSearchParams({
    client_id: client.clientId,
    grant_type: "refresh_token",
    refresh_token: refreshTokenValue,
  });

  if (client.clientSecret) {
    form.set("client_secret", client.clientSecret);
  }

  return postForm("https://oauth2.googleapis.com/token", form);
}

function toStoredToken(tokenResponse, existingToken, scope) {
  const expiresInSeconds =
    typeof tokenResponse.expires_in === "number"
      ? tokenResponse.expires_in
      : 3600;

  const refreshTokenValue =
    typeof tokenResponse.refresh_token === "string"
      ? tokenResponse.refresh_token
      : existingToken?.refresh_token;

  if (typeof refreshTokenValue !== "string" || refreshTokenValue.length === 0) {
    throw new Error(
      "Google did not return a refresh token. Run auth again; keep prompt=consent and use the same test user.",
    );
  }

  return {
    access_token: requireString(
      tokenResponse.access_token,
      "Google token response is missing access_token.",
    ),
    expires_at: Date.now() + expiresInSeconds * 1000,
    refresh_token: refreshTokenValue,
    scope,
    token_type:
      typeof tokenResponse.token_type === "string"
        ? tokenResponse.token_type
        : "Bearer",
  };
}

async function readStoredToken(args) {
  const tokenFile = getFlagValue(args, "--token-file", DEFAULT_TOKEN_FILE);
  const token = await readJson(
    tokenFile,
    `Cannot read token file at ${tokenFile}. Run npm run gsc:auth first`,
  );

  return { token, tokenFile };
}

function requiresFreshToken(token) {
  return (
    typeof token.access_token !== "string" ||
    typeof token.expires_at !== "number" ||
    Date.now() + TOKEN_EXPIRY_SAFETY_MS >= token.expires_at
  );
}

async function getAccessToken(args) {
  const client = await readOAuthClient(args);
  const { token, tokenFile } = await readStoredToken(args);

  if (!requiresFreshToken(token)) {
    return token.access_token;
  }

  const refreshTokenValue = requireString(
    token.refresh_token,
    "Stored token is missing refresh_token. Run npm run gsc:auth again.",
  );
  const refreshedToken = await refreshToken({ client, refreshTokenValue });
  const storedToken = toStoredToken(refreshedToken, token, token.scope);
  await writeJson(tokenFile, storedToken);
  return storedToken.access_token;
}

function getSiteUrl(args) {
  return getFlagValue(args, "--site", DEFAULT_SITE_URL);
}

function encodeSiteUrl(siteUrl) {
  return encodeURIComponent(siteUrl);
}

async function fetchJson(args, url, options = {}) {
  const accessToken = await getAccessToken(args);
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  const json = parseJsonOrEmpty(text);

  if (!response.ok) {
    const message =
      typeof json.error?.message === "string" ? json.error.message : text;
    throw new Error(
      `Google API request failed (${response.status}): ${message}`,
    );
  }

  return json;
}

function isoDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function getPerformanceDates(args) {
  const endDate = getFlagValue(args, "--end-date", isoDateDaysAgo(3));
  const startDate = getFlagValue(args, "--start-date", isoDateDaysAgo(31));
  return { endDate, startDate };
}

function getDimensions(args) {
  const raw = getFlagValue(args, "--dimensions", "query,page");
  return raw
    .split(",")
    .map((dimension) => dimension.trim())
    .filter((dimension) => dimension.length > 0);
}

function getRowLimit(args) {
  return parsePositiveInteger(getFlagValue(args, "--limit", "20"), 20);
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatPosition(value) {
  return value.toFixed(1);
}

function printRows(rows, columns) {
  if (rows.length === 0) {
    console.info("No rows returned.");
    return;
  }

  const widths = columns.map((column) => {
    const maxCellWidth = rows.reduce((max, row) => {
      const value = row[column.key] ?? "";
      return Math.max(max, String(value).length);
    }, column.label.length);
    return Math.min(Math.max(maxCellWidth, column.minWidth ?? 0), 80);
  });

  const formatCell = (value, width) => {
    const text = String(value ?? "");
    const clipped = text.length > width ? `${text.slice(0, width - 1)}…` : text;
    return clipped.padEnd(width, " ");
  };

  console.info(
    columns
      .map((column, index) => formatCell(column.label, widths[index]))
      .join("  "),
  );
  console.info(widths.map((width) => "-".repeat(width)).join("  "));

  for (const row of rows) {
    console.info(
      columns
        .map((column, index) => formatCell(row[column.key], widths[index]))
        .join("  "),
    );
  }
}

async function runAuth(args) {
  const client = await readOAuthClient(args);
  const tokenFile = getFlagValue(args, "--token-file", DEFAULT_TOKEN_FILE);
  const port = parsePositiveInteger(
    getFlagValue(args, "--port", String(DEFAULT_AUTH_PORT)),
    DEFAULT_AUTH_PORT,
  );
  const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
  const codeVerifier = createCodeVerifier();
  const state = base64Url(randomBytes(24));
  const scope = hasFlag(args, "--write") ? SCOPE_WRITE : SCOPE_READONLY;
  const authUrl = createAuthUrl({
    clientId: client.clientId,
    codeChallenge: createCodeChallenge(codeVerifier),
    redirectUri,
    scope,
    state,
  });

  const code = await waitForOAuthCode({ authUrl, port, state });
  const tokenResponse = await exchangeCodeForToken({
    client,
    code,
    codeVerifier,
    redirectUri,
  });
  const storedToken = toStoredToken(tokenResponse, undefined, scope);
  await writeJson(tokenFile, storedToken);

  console.info(`GSC token saved to ${tokenFile}.`);
  console.info(
    scope === SCOPE_WRITE
      ? "Scope: read/write Search Console access."
      : "Scope: read-only Search Console access.",
  );
}

async function runSites(args) {
  const json = await fetchJson(
    args,
    "https://www.googleapis.com/webmasters/v3/sites",
  );
  const siteEntries = Array.isArray(json.siteEntry) ? json.siteEntry : [];

  printRows(
    siteEntries.map((site) => ({
      permission: site.permissionLevel ?? "",
      siteUrl: site.siteUrl ?? "",
    })),
    [
      { key: "siteUrl", label: "siteUrl", minWidth: 24 },
      { key: "permission", label: "permission", minWidth: 12 },
    ],
  );
}

async function runSitemaps(args) {
  const siteUrl = getSiteUrl(args);
  const json = await fetchJson(
    args,
    `https://www.googleapis.com/webmasters/v3/sites/${encodeSiteUrl(siteUrl)}/sitemaps`,
  );
  const sitemapEntries = Array.isArray(json.sitemap) ? json.sitemap : [];

  printRows(
    sitemapEntries.map((sitemap) => ({
      errors: sitemap.errors ?? "",
      isPending: sitemap.isPending ?? "",
      lastDownloaded: sitemap.lastDownloaded ?? "",
      path: sitemap.path ?? "",
      type: sitemap.type ?? "",
      warnings: sitemap.warnings ?? "",
    })),
    [
      { key: "path", label: "path", minWidth: 32 },
      { key: "type", label: "type", minWidth: 8 },
      { key: "lastDownloaded", label: "lastDownloaded", minWidth: 14 },
      { key: "isPending", label: "pending", minWidth: 7 },
      { key: "errors", label: "errors", minWidth: 6 },
      { key: "warnings", label: "warnings", minWidth: 8 },
    ],
  );
}

async function runPerformance(args) {
  const siteUrl = getSiteUrl(args);
  const dimensions = getDimensions(args);
  const { endDate, startDate } = getPerformanceDates(args);
  const rowLimit = getRowLimit(args);
  const json = await fetchJson(
    args,
    `https://www.googleapis.com/webmasters/v3/sites/${encodeSiteUrl(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        dataState: "final",
        dimensions,
        endDate,
        rowLimit,
        startDate,
      }),
    },
  );
  const rows = Array.isArray(json.rows) ? json.rows : [];

  console.info(
    `Search performance for ${siteUrl}, ${startDate} to ${endDate}, dimensions: ${dimensions.join(", ")}`,
  );
  printRows(
    rows.map((row) => ({
      clicks: row.clicks ?? 0,
      ctr: formatPercent(row.ctr ?? 0),
      impressions: row.impressions ?? 0,
      keys: Array.isArray(row.keys) ? row.keys.join(" | ") : "",
      position: formatPosition(row.position ?? 0),
    })),
    [
      { key: "keys", label: dimensions.join(" / "), minWidth: 32 },
      { key: "clicks", label: "clicks", minWidth: 6 },
      { key: "impressions", label: "impressions", minWidth: 11 },
      { key: "ctr", label: "ctr", minWidth: 6 },
      { key: "position", label: "position", minWidth: 8 },
    ],
  );
}

async function runInspect(args) {
  const positionalArgs = getPositionalArgs(args);
  const inspectionUrl =
    getFlagValue(args, "--url", undefined) ?? positionalArgs[0];
  if (!inspectionUrl) {
    throw new Error(
      `Missing URL. Usage: npm run gsc:inspect -- ${siteUrl()}/`,
    );
  }

  const siteUrl = getSiteUrl(args);
  const json = await fetchJson(
    args,
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        inspectionUrl,
        languageCode: "en-US",
        siteUrl,
      }),
    },
  );

  const result = json.inspectionResult ?? {};
  const indexStatus = result.indexStatusResult ?? {};
  const mobileUsability = result.mobileUsabilityResult ?? {};
  const richResults = result.richResultsResult ?? {};

  printRows(
    [
      { field: "inspectionUrl", value: inspectionUrl },
      { field: "siteUrl", value: siteUrl },
      { field: "verdict", value: indexStatus.verdict ?? "" },
      { field: "coverageState", value: indexStatus.coverageState ?? "" },
      { field: "indexingState", value: indexStatus.indexingState ?? "" },
      { field: "robotsTxtState", value: indexStatus.robotsTxtState ?? "" },
      { field: "lastCrawlTime", value: indexStatus.lastCrawlTime ?? "" },
      {
        field: "pageFetchState",
        value: indexStatus.pageFetchState ?? "",
      },
      {
        field: "mobileUsability",
        value: mobileUsability.verdict ?? "",
      },
      {
        field: "richResults",
        value: richResults.verdict ?? "",
      },
    ],
    [
      { key: "field", label: "field", minWidth: 18 },
      { key: "value", label: "value", minWidth: 32 },
    ],
  );
}

async function runSummary(args) {
  await runSitemaps(args);
  console.info("");
  await runPerformance(args);
}

function printHelp() {
  console.info(`GSC local helper for StreetSmartChina

Setup:
  1. Download Google OAuth Desktop client JSON to .gsc/oauth-client.json
  2. Run: npm run gsc:auth

Commands:
  npm run gsc:auth
  npm run gsc:sites
  npm run gsc:sitemaps
  npm run gsc:performance -- --dimensions query,page --limit 20
  npm run gsc:inspect -- ${siteUrl()}/
  npm run gsc:summary

Options:
  --site <siteUrl>             Default: ${DEFAULT_SITE_URL}
  --client-file <path>         Default: ${DEFAULT_CLIENT_FILE}
  --token-file <path>          Default: ${DEFAULT_TOKEN_FILE}
  --start-date YYYY-MM-DD      performance only
  --end-date YYYY-MM-DD        performance only
  --dimensions query,page      performance only
  --limit <number>             performance only
  --write                      auth only; requests read/write GSC scope
`);
}

async function main() {
  const command = getCommand();
  const args = getCommandArgs();

  if (command === "auth") {
    await runAuth(args);
    return;
  }
  if (command === "inspect") {
    await runInspect(args);
    return;
  }
  if (command === "performance") {
    await runPerformance(args);
    return;
  }
  if (command === "sitemaps") {
    await runSitemaps(args);
    return;
  }
  if (command === "sites") {
    await runSites(args);
    return;
  }
  if (command === "summary") {
    await runSummary(args);
    return;
  }

  printHelp();
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
