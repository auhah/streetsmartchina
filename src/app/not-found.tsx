import Link from "next/link";

import { clusterConfigs } from "@/config/site";

export default function NotFound() {
  return (
    <main className="wrap page-shell not-found">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>
        This StreetSmartChina page is not published yet. Start from one of the
        launch clusters.
      </p>
      <div className="not-found__links">
        {clusterConfigs.map((cluster) => (
          <Link href={cluster.href} key={cluster.cluster}>
            {cluster.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
