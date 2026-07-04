import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { buildSiteUrl } from "@/modules/seo/public-pages";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: buildSiteUrl("/sitemap.xml"),
    host: siteConfig.siteUrl,
  };
}
