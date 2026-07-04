import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "../..");
const SITE_CONFIG_PATH = path.join(ROOT_DIR, "src/config/site.ts");
const SITE_URL_PATTERN = /export const SITE_URL = "([^"]+)";/;

export function siteUrl() {
  const source = readFileSync(SITE_CONFIG_PATH, "utf8");
  const match = source.match(SITE_URL_PATTERN);
  const value = match?.[1];

  if (!value) {
    throw new Error(`Could not read SITE_URL from ${SITE_CONFIG_PATH}.`);
  }

  return new URL(value).toString().replace(/\/$/, "");
}

export function siteHost() {
  return new URL(siteUrl()).hostname;
}

export function gscSiteProperty() {
  return `sc-domain:${siteHost()}`;
}
