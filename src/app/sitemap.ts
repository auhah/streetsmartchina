import type { MetadataRoute } from "next";

import {
  getAllContentPages,
  getAllGuides,
  toDateOnlyDate,
} from "@/content/content-loader";
import { buildSiteUrl } from "@/modules/seo/public-pages";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = getAllContentPages().map((page) => ({
    url: buildSiteUrl(page.path),
    lastModified: toDateOnlyDate(page.lastVerified),
    changeFrequency: "weekly" as const,
    priority: page.path === "/" ? 1 : 0.8,
  }));

  const guides = getAllGuides().map((guide) => ({
    url: buildSiteUrl(guide.path),
    lastModified: toDateOnlyDate(guide.lastVerified),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...pages, ...guides];
}
