import type { Metadata } from "next";

import { SiteShell } from "@/components/SiteShell";
import {
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  siteConfig,
} from "@/config/site";
import { getContentPage } from "@/content/content-loader";
import {
  siteFormatDetectionMetadata,
  siteIconMetadata,
} from "@/modules/seo/public-pages";

import "./globals.css";

const homePage = getContentPage("home");
const googleAnalyticsScriptSrc = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
)}`;
const googleAnalyticsInlineScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_MEASUREMENT_ID}');
`.trim();

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
      <head>
        <script async src={googleAnalyticsScriptSrc} />
        <script
          dangerouslySetInnerHTML={{ __html: googleAnalyticsInlineScript }}
        />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
