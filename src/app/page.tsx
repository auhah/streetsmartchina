import type { Metadata } from "next";
import Link from "next/link";

import { LastVerifiedBadge } from "@/components/LastVerifiedBadge";
import { MarkdownBody } from "@/components/MarkdownBody";
import { clusterConfigs, siteConfig } from "@/config/site";
import { getContentPage, getGuidesByCluster } from "@/content/content-loader";
import { buildPageMetadata } from "@/modules/seo/public-pages";

const page = getContentPage("home");

export const metadata: Metadata = buildPageMetadata({
  description: page.description,
  path: page.path,
  title: page.title,
});

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">China travel, without guesswork</p>
            <h1>{page.h1}</h1>
            <p className="hero__lede">{siteConfig.tagline}</p>
            <LastVerifiedBadge date={page.lastVerified} />
          </div>
          <div aria-label="StreetSmartChina launch scope" className="hero-panel">
            <p className="hero-panel__label">MVP guide desk</p>
            <dl>
              <div>
                <dt>4</dt>
                <dd>Launch clusters</dd>
              </div>
              <div>
                <dt>1</dt>
                <dd>Money guide ready</dd>
              </div>
              <div>
                <dt>0</dt>
                <dd>DNS assumptions</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <MarkdownBody markdown={page.body} />
      </section>

      <section aria-labelledby="clusters-heading" className="wrap section">
        <div className="section-heading">
          <p className="eyebrow">Start with a cluster</p>
          <h2 id="clusters-heading">Operator manual sections</h2>
        </div>
        <div className="cluster-grid">
          {clusterConfigs.map((cluster) => {
            const guideCount = getGuidesByCluster(cluster.cluster).length;

            return (
              <Link className="cluster-card" href={cluster.href} key={cluster.cluster}>
                <span className="cluster-card__label">{cluster.label}</span>
                <span>{cluster.description}</span>
                <span className="cluster-card__meta">
                  {guideCount} guide{guideCount === 1 ? "" : "s"} drafted
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
