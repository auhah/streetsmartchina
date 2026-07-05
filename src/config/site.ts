export const SITE_URL = "https://streetsmartchina.com";

export const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-LWTHST46EV";

export const CLUSTERS = ["money", "connect", "visa", "trains"] as const;

export type Cluster = (typeof CLUSTERS)[number];

export type ClusterConfig = {
  cluster: Cluster;
  description: string;
  href: `/${Cluster}/`;
  label: string;
  shortLabel: string;
};

export const siteConfig = {
  name: "StreetSmartChina",
  siteUrl: SITE_URL,
  tagline: "A DIY traveler's operator manual for China.",
  description:
    "Practical China travel guides for payments, connectivity, visas, and high-speed trains, built around current checks and official sources.",
  locale: "en_US",
  contactEmail: "hello@streetsmartchina.com",
  socialImagePath: "/social/streetsmartchina-card.svg",
} as const;

export const clusterConfigs: readonly ClusterConfig[] = [
  {
    cluster: "money",
    description:
      "Payments, wallets, cash fallback plans, and what to do when checkout fails.",
    href: "/money/",
    label: "Money in China",
    shortLabel: "Money",
  },
  {
    cluster: "connect",
    description:
      "Maps, eSIMs, apps, messaging, and the connectivity setup that actually works on arrival.",
    href: "/connect/",
    label: "Connect in China",
    shortLabel: "Connect",
  },
  {
    cluster: "visa",
    description:
      "Visa eligibility, transit rules, photo requirements, and official policy checkpoints.",
    href: "/visa/",
    label: "China Visa Basics",
    shortLabel: "Visa",
  },
  {
    cluster: "trains",
    description:
      "High-speed rail, station routines, tickets, classes, and route planning.",
    href: "/trains/",
    label: "China Trains",
    shortLabel: "Trains",
  },
] as const;

export function isCluster(value: string): value is Cluster {
  return CLUSTERS.includes(value as Cluster);
}

export function getClusterConfig(cluster: Cluster): ClusterConfig {
  const config = clusterConfigs.find((candidate) => candidate.cluster === cluster);

  if (!config) {
    throw new Error(`Unknown cluster: ${cluster}`);
  }

  return config;
}
