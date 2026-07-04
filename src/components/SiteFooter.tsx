import Link from "next/link";

import { clusterConfigs, siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <div>
          <p className="site-footer__brand">{siteConfig.name}</p>
          <p>{siteConfig.tagline}</p>
        </div>
        <nav aria-label="Footer">
          {clusterConfigs.map((cluster) => (
            <Link href={cluster.href} key={cluster.cluster}>
              {cluster.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
