import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FaqSection } from "@/components/FaqSection";
import { LastVerifiedBadge } from "@/components/LastVerifiedBadge";
import { MarkdownBody } from "@/components/MarkdownBody";
import { OfficialSources } from "@/components/OfficialSources";
import { StepByStep } from "@/components/StepByStep";
import { TroubleshootingTable } from "@/components/TroubleshootingTable";
import { getClusterConfig, isCluster } from "@/config/site";
import {
  getAllGuides,
  getGuideByRoute,
  type Guide,
} from "@/content/content-loader";
import { buildPageMetadata } from "@/modules/seo/public-pages";

export const dynamicParams = false;

type GuidePageProps = {
  params: Promise<{
    cluster: string;
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getAllGuides().map((guide) => ({
    cluster: guide.cluster,
    slug: guide.slug,
  }));
}

async function loadGuide(params: GuidePageProps["params"]): Promise<Guide> {
  const { cluster, slug } = await params;
  if (!isCluster(cluster)) {
    notFound();
  }

  const guide = getGuideByRoute(cluster, slug);
  if (!guide) {
    notFound();
  }

  return guide;
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const guide = await loadGuide(params);

  return buildPageMetadata({
    description: guide.description,
    path: guide.path,
    title: guide.title,
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const guide = await loadGuide(params);
  const cluster = getClusterConfig(guide.cluster);

  return (
    <main className="wrap page-shell">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={cluster.href}>{cluster.shortLabel}</Link>
      </nav>

      <article className="guide-layout">
        <header className="guide-header">
          <p className="eyebrow">{cluster.label}</p>
          <h1>{guide.h1}</h1>
          <p>{guide.description}</p>
          <LastVerifiedBadge date={guide.lastVerified} />
        </header>

        <div className="guide-content">
          <MarkdownBody markdown={guide.body} />
          <StepByStep steps={guide.steps} />
          <TroubleshootingTable rows={guide.troubleshooting} />
          <FaqSection faq={guide.faq} />
        </div>

        <OfficialSources sources={guide.sources} />
      </article>
    </main>
  );
}
