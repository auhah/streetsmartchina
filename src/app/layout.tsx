import type { Metadata } from "next";

import { SiteShell } from "@/components/SiteShell";
import { siteConfig } from "@/config/site";
import { getContentPage } from "@/content/content-loader";
import {
  siteFormatDetectionMetadata,
  siteIconMetadata,
} from "@/modules/seo/public-pages";

import "./globals.css";

const homePage = getContentPage("home");

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  formatDetection: siteFormatDetectionMetadata,
  title: {
    default: homePage.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: homePage.description,
  icons: siteIconMetadata,
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        alt: `${siteConfig.name} social preview card`,
        height: 630,
        type: "image/svg+xml",
        url: siteConfig.socialImagePath,
        width: 1200,
      },
    ],
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: "website",
    url: siteConfig.siteUrl,
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
