#!/usr/bin/env node

import { siteUrl } from "./site-config.mjs";

const DEFAULT_BASE_URL = "http://127.0.0.1:3030";
const PRODUCTION_ORIGIN = siteUrl();

function getBaseUrl() {
  const baseUrlArgIndex = process.argv.indexOf("--base-url");
  const explicitBaseUrl =
    baseUrlArgIndex >= 0 ? process.argv[baseUrlArgIndex + 1] : undefined;
  const candidate =
    explicitBaseUrl ?? process.env.SEO_CHECK_BASE_URL ?? DEFAULT_BASE_URL;

  return new URL(candidate.endsWith("/") ? candidate : `${candidate}/`);
}

function readAttr(tag, name) {
  const match = tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return match?.[1] ?? "";
}

function extractSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function extractCanonical(html) {
  const tag = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0] ?? "";
  return readAttr(tag, "href");
}

function extractRobots(html) {
  const tag = html.match(/<meta[^>]+name=["']robots["'][^>]*>/i)?.[0] ?? "";
  return readAttr(tag, "content");
}

function normalizeComparableUrl(value) {
  const url = new URL(value);
  if (url.pathname === "/" && url.search === "" && url.hash === "") {
    return `${url.origin}/`;
  }
  return url.toString();
}

function localUrlForProductionUrl(productionUrl, baseUrl) {
  const url = new URL(productionUrl);
  return new URL(`${url.pathname}${url.search}`, baseUrl).toString();
}

function productionUrlForPath(path) {
  return new URL(path, PRODUCTION_ORIGIN).toString();
}

async function fetchWithoutRedirect(url) {
  return fetch(url, { redirect: "manual" });
}

async function checkSitemapEntries(baseUrl, errors) {
  const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
  const response = await fetchWithoutRedirect(sitemapUrl);

  if (response.status !== 200) {
    errors.push(`Expected sitemap to return 200, got ${response.status}.`);
    return 0;
  }

  const sitemapXml = await response.text();
  const locs = extractSitemapLocs(sitemapXml);

  if (locs.length === 0) {
    errors.push("Expected sitemap to contain at least one <loc> entry.");
    return 0;
  }

  for (const loc of locs) {
    const localUrl = localUrlForProductionUrl(loc, baseUrl);
    const pageResponse = await fetchWithoutRedirect(localUrl);

    if (pageResponse.status !== 200) {
      const location = pageResponse.headers.get("location");
      errors.push(
        `${loc} should return 200 without redirect; got ${pageResponse.status}${
          location ? ` Location: ${location}` : ""
        }.`,
      );
      continue;
    }

    const html = await pageResponse.text();
    const canonical = extractCanonical(html);

    if (!canonical) {
      errors.push(`${loc} is missing a canonical link.`);
      continue;
    }

    if (normalizeComparableUrl(canonical) !== normalizeComparableUrl(loc)) {
      errors.push(`${loc} canonical mismatch: ${canonical}.`);
    }
  }

  return locs.length;
}

async function checkSpecialRoutes(baseUrl, errors) {
  const queryUrl = new URL(
    "/money/alipay/?utm_source=seo-check",
    baseUrl,
  ).toString();
  const queryResponse = await fetchWithoutRedirect(queryUrl);

  if (queryResponse.status !== 200) {
    errors.push(
      `Expected Alipay guide query URL to return 200, got ${queryResponse.status}.`,
    );
  } else {
    const canonical = extractCanonical(await queryResponse.text());
    const expected = productionUrlForPath("/money/alipay/");
    if (!canonical) {
      errors.push("Alipay guide query URL is missing a canonical link.");
      return;
    }
    if (
      normalizeComparableUrl(canonical) !== normalizeComparableUrl(expected)
    ) {
      errors.push(`Alipay guide query canonical mismatch: ${canonical}.`);
    }
  }

  for (const path of ["/missing-page/"]) {
    const response = await fetchWithoutRedirect(new URL(path, baseUrl));
    if (response.status !== 404) {
      errors.push(`Expected ${path} to return 404, got ${response.status}.`);
      continue;
    }

    const robots = extractRobots(await response.text());
    if (!robots.toLowerCase().includes("noindex")) {
      errors.push(`Expected ${path} to include noindex robots metadata.`);
    }
  }
}

async function main() {
  const baseUrl = getBaseUrl();
  const errors = [];
  const checkedLocCount = await checkSitemapEntries(baseUrl, errors);
  await checkSpecialRoutes(baseUrl, errors);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`SEO launch check failed: ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.info(
    `SEO launch check passed for ${checkedLocCount} sitemap URLs against ${baseUrl.toString()}.`,
  );
}

await main();
