import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export type PublicRoutePath = "/" | `/${string}/`;

type PageMetadataInput = {
  description: string;
  path: PublicRoutePath;
  title: string;
};

export const siteIconMetadata = {
  icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
} satisfies NonNullable<Metadata["icons"]>;

export const siteFormatDetectionMetadata = {
  address: false,
  date: false,
  email: false,
  telephone: false,
} satisfies NonNullable<Metadata["formatDetection"]>;

export function buildSiteUrl(path: `/${string}`): string {
  return new URL(path, siteConfig.siteUrl).toString();
}

export function buildCanonicalUrl(path: PublicRoutePath): string {
  return buildSiteUrl(path);
}

export function buildPageMetadata({
  description,
  path,
  title,
}: PageMetadataInput): Metadata {
  const canonicalUrl = buildCanonicalUrl(path);
  const imageUrl = buildSiteUrl(siteConfig.socialImagePath);

  return {
    title,
    description,
    formatDetection: siteFormatDetectionMetadata,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      images: [
        {
          alt: `${siteConfig.name} social preview card`,
          height: 630,
          type: "image/svg+xml",
          url: imageUrl,
          width: 1200,
        },
      ],
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      type: "website",
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
