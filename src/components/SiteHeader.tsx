import Link from "next/link";

import { clusterConfigs, siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav aria-label="Primary" className="wrap site-header__inner">
        <Link className="site-logo" href="/">
          {siteConfig.name}
        </Link>
        <div className="site-nav">
          {clusterConfigs.map((cluster) => (
            <Link href={cluster.href} key={cluster.cluster}>
              {cluster.shortLabel}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
