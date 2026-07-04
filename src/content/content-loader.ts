import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

import {
  CLUSTERS,
  type Cluster,
  getClusterConfig,
  isCluster,
} from "@/config/site";

export type DateOnly = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

export type OfficialSource = {
  label: string;
  url: string;
};

export type FaqItem = {
  a: string;
  q: string;
};

export type GuideStepImage = {
  alt: string;
  caption?: string;
  src: string;
};

export type GuideStep = {
  body: string;
  image?: GuideStepImage;
  title: string;
};

export type TroubleshootingRow = {
  cause: string;
  fix: string;
  problem: string;
};

export type GuideFrontmatter = {
  cluster: Cluster;
  description: string;
  faq: FaqItem[];
  h1: string;
  lastVerified: DateOnly;
  sources: OfficialSource[];
  steps: GuideStep[];
  title: string;
  troubleshooting: TroubleshootingRow[];
};

export type Guide = GuideFrontmatter & {
  body: string;
  path: `/${Cluster}/${string}/`;
  slug: string;
};

export type ContentPageSlug = "home" | Cluster;

export type ContentPageFrontmatter = {
  description: string;
  h1: string;
  lastVerified: DateOnly;
  title: string;
};

export type HomeContentPage = ContentPageFrontmatter & {
  body: string;
  path: "/";
  slug: "home";
};

export type ClusterContentPage = ContentPageFrontmatter & {
  body: string;
  path: `/${Cluster}/`;
  slug: Cluster;
};

export type ContentPage = HomeContentPage | ClusterContentPage;

const CONTENT_ROOT = path.join(process.cwd(), "content");
const GUIDES_DIR = path.join(CONTENT_ROOT, "guides");
const PAGES_DIR = path.join(CONTENT_ROOT, "pages");
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type ParsedMarkdown = {
  body: string;
  frontmatter: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatSource(source: string, key: string): string {
  return `${source}: frontmatter.${key}`;
}

function requireRecord(value: unknown, source: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${source}: frontmatter must be a YAML object`);
  }

  return value;
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  source: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${formatSource(source, key)} must be a non-empty string`);
  }

  return value.trim();
}

function requireDateOnly(
  record: Record<string, unknown>,
  key: string,
  source: string,
): DateOnly {
  const value = requireString(record, key, source);
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw new Error(`${formatSource(source, key)} must use YYYY-MM-DD`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${formatSource(source, key)} must be a valid calendar date`);
  }

  return value as DateOnly;
}

function requireArray(
  record: Record<string, unknown>,
  key: string,
  source: string,
): unknown[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    throw new Error(`${formatSource(source, key)} must be an array`);
  }

  return value;
}

function readOptionalArray(
  record: Record<string, unknown>,
  key: string,
  source: string,
): unknown[] {
  const value = record[key];
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${formatSource(source, key)} must be an array when present`);
  }

  return value;
}

function requireValidUrl(value: string, source: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("unsupported protocol");
    }
    return url.toString();
  } catch {
    throw new Error(`${source} must be an absolute http(s) URL`);
  }
}

function parseMarkdownFile(filePath: string): ParsedMarkdown {
  const raw = readFileSync(filePath, "utf8");
  const match = raw.match(FRONTMATTER_PATTERN);

  if (!match) {
    throw new Error(`${filePath}: expected YAML frontmatter delimited by ---`);
  }

  const frontmatterText = match[1];
  if (frontmatterText === undefined) {
    throw new Error(`${filePath}: expected YAML frontmatter body`);
  }

  const parsed = parseYaml(frontmatterText);
  const frontmatter = requireRecord(parsed, filePath);
  const body = raw.slice(match[0].length).trim();

  return {
    body,
    frontmatter,
  };
}

function validateSources(
  value: readonly unknown[],
  source: string,
): OfficialSource[] {
  if (value.length === 0) {
    throw new Error(`${source}: frontmatter.sources must include at least one item`);
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`${source}: frontmatter.sources[${index}] must be an object`);
    }

    const label = requireString(item, "label", `${source}: sources[${index}]`);
    const rawUrl = requireString(item, "url", `${source}: sources[${index}]`);

    return {
      label,
      url: requireValidUrl(rawUrl, `${source}: frontmatter.sources[${index}].url`),
    };
  });
}

function validateFaq(value: readonly unknown[], source: string): FaqItem[] {
  if (value.length === 0) {
    throw new Error(`${source}: frontmatter.faq must include at least one item`);
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`${source}: frontmatter.faq[${index}] must be an object`);
    }

    return {
      a: requireString(item, "a", `${source}: faq[${index}]`),
      q: requireString(item, "q", `${source}: faq[${index}]`),
    };
  });
}

function validateSteps(value: readonly unknown[], source: string): GuideStep[] {
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`${source}: frontmatter.steps[${index}] must be an object`);
    }

    const rawImage = item.image;
    let image: GuideStepImage | undefined;

    if (rawImage !== undefined) {
      if (!isRecord(rawImage)) {
        throw new Error(`${source}: frontmatter.steps[${index}].image must be an object`);
      }

      const captionValue = rawImage.caption;
      image = {
        alt: requireString(rawImage, "alt", `${source}: steps[${index}].image`),
        src: requireString(rawImage, "src", `${source}: steps[${index}].image`),
        ...(typeof captionValue === "string" && captionValue.trim().length > 0
          ? { caption: captionValue.trim() }
          : {}),
      };
    }

    return {
      body: requireString(item, "body", `${source}: steps[${index}]`),
      ...(image ? { image } : {}),
      title: requireString(item, "title", `${source}: steps[${index}]`),
    };
  });
}

function validateTroubleshooting(
  value: readonly unknown[],
  source: string,
): TroubleshootingRow[] {
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(
        `${source}: frontmatter.troubleshooting[${index}] must be an object`,
      );
    }

    return {
      cause: requireString(item, "cause", `${source}: troubleshooting[${index}]`),
      fix: requireString(item, "fix", `${source}: troubleshooting[${index}]`),
      problem: requireString(
        item,
        "problem",
        `${source}: troubleshooting[${index}]`,
      ),
    };
  });
}

export function validateGuideFrontmatter(
  frontmatter: Record<string, unknown>,
  source: string,
): GuideFrontmatter {
  const cluster = requireString(frontmatter, "cluster", source);
  if (!isCluster(cluster)) {
    throw new Error(
      `${formatSource(source, "cluster")} must be one of ${CLUSTERS.join(", ")}`,
    );
  }

  return {
    cluster,
    description: requireString(frontmatter, "description", source),
    faq: validateFaq(requireArray(frontmatter, "faq", source), source),
    h1: requireString(frontmatter, "h1", source),
    lastVerified: requireDateOnly(frontmatter, "lastVerified", source),
    sources: validateSources(requireArray(frontmatter, "sources", source), source),
    steps: validateSteps(readOptionalArray(frontmatter, "steps", source), source),
    title: requireString(frontmatter, "title", source),
    troubleshooting: validateTroubleshooting(
      readOptionalArray(frontmatter, "troubleshooting", source),
      source,
    ),
  };
}

export function validateContentPageFrontmatter(
  frontmatter: Record<string, unknown>,
  source: string,
): ContentPageFrontmatter {
  return {
    description: requireString(frontmatter, "description", source),
    h1: requireString(frontmatter, "h1", source),
    lastVerified: requireDateOnly(frontmatter, "lastVerified", source),
    title: requireString(frontmatter, "title", source),
  };
}

export function guidePath(cluster: Cluster, slug: string): `/${Cluster}/${string}/` {
  return `/${cluster}/${slug}/`;
}

export function contentPagePath(slug: ContentPageSlug): "/" | `/${Cluster}/` {
  return slug === "home" ? "/" : getClusterConfig(slug).href;
}

export function toDateOnlyDate(value: DateOnly): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function getAllGuides(): Guide[] {
  const files = readdirSync(GUIDES_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort();

  return files.map((file) => {
    const slug = path.basename(file, ".md");
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error(`${file}: guide filenames must be lowercase hyphenated slugs`);
    }

    const filePath = path.join(GUIDES_DIR, file);
    const parsed = parseMarkdownFile(filePath);
    const frontmatter = validateGuideFrontmatter(parsed.frontmatter, filePath);

    return {
      ...frontmatter,
      body: parsed.body,
      path: guidePath(frontmatter.cluster, slug),
      slug,
    };
  });
}

export function getGuidesByCluster(cluster: Cluster): Guide[] {
  return getAllGuides().filter((guide) => guide.cluster === cluster);
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return getAllGuides().find((guide) => guide.slug === slug);
}

export function getGuideByRoute(cluster: Cluster, slug: string): Guide | undefined {
  return getAllGuides().find(
    (guide) => guide.cluster === cluster && guide.slug === slug,
  );
}

export function getContentPage(slug: "home"): HomeContentPage;
export function getContentPage(slug: Cluster): ClusterContentPage;
export function getContentPage(slug: ContentPageSlug): ContentPage;
export function getContentPage(slug: ContentPageSlug): ContentPage {
  const filePath = path.join(PAGES_DIR, `${slug}.md`);
  const parsed = parseMarkdownFile(filePath);
  const frontmatter = validateContentPageFrontmatter(parsed.frontmatter, filePath);

  if (slug === "home") {
    return {
      ...frontmatter,
      body: parsed.body,
      path: "/",
      slug,
    };
  }

  return {
    ...frontmatter,
    body: parsed.body,
    path: getClusterConfig(slug).href,
    slug,
  };
}

export function getAllContentPages(): ContentPage[] {
  const pageSlugs: readonly ContentPageSlug[] = ["home", ...CLUSTERS];
  return pageSlugs.map((slug) => getContentPage(slug));
}
