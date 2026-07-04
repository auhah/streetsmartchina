import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LastVerifiedBadge } from "@/components/LastVerifiedBadge";
import { MarkdownBody } from "@/components/MarkdownBody";
import { CLUSTERS, getClusterConfig, isCluster } from "@/config/site";
import {
  type ClusterContentPage,
  getContentPage,
  getGuidesByCluster,
} from "@/content/content-loader";
import { buildPageMetadata } from "@/modules/seo/public-pages";

export const dynamicParams = false;

type ClusterPageProps = {
  params: Promise<{
    cluster: string;
  }>;
};

export function generateStaticParams() {
  return CLUSTERS.map((cluster) => ({ cluster }));
}

async function loadPage(
  params: ClusterPageProps["params"],
): Promise<ClusterContentPage> {
  const { cluster } = await params;
  if (!isCluster(cluster)) {
    notFound();
  }

  return getContentPage(cluster);
}

export async function generateMetadata({
  params,
}: ClusterPageProps): Promise<Metadata> {
  const page = await loadPage(params);

  return buildPageMetadata({
    description: page.description,
    path: page.path,
    title: page.title,
  });
}

export default async function ClusterPage({ params }: ClusterPageProps) {
  const page = await loadPage(params);
  const config = getClusterConfig(page.slug);
  const guides = getGuidesByCluster(page.slug);

  return (
    <main className="wrap page-shell">
      <div className="page-intro">
        <p className="eyebrow">{config.shortLabel} cluster</p>
        <h1>{page.h1}</h1>
        <p>{page.description}</p>
        <LastVerifiedBadge date={page.lastVerified} />
      </div>

      <MarkdownBody markdown={page.body} />

      <section aria-labelledby="cluster-guides-heading" className="section">
        <div className="section-heading">
          <p className="eyebrow">Guide queue</p>
          <h2 id="cluster-guides-heading">Published guides</h2>
        </div>
        {guides.length > 0 ? (
          <div className="guide-list">
            {guides.map((guide) => (
              <Link className="guide-card" href={guide.path} key={guide.slug}>
                <span className="guide-card__title">{guide.h1}</span>
                <span>{guide.description}</span>
                <span className="guide-card__date">
                  Last verified {guide.lastVerified}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            This hub is scaffolded. Add Markdown files in{" "}
            <code>content/guides/</code> with <code>cluster: {page.slug}</code>{" "}
            to publish the first guide.
          </p>
        )}
      </section>
    </main>
  );
}
