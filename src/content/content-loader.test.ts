import { describe, expect, it } from "vitest";

import {
  getAllContentPages,
  getAllGuides,
  getGuideByRoute,
  validateGuideFrontmatter,
} from "./content-loader";

describe("content loader", () => {
  it("loads and validates content pages", () => {
    const pages = getAllContentPages();
    const money = pages.find((page) => page.slug === "money");

    expect(pages.map((page) => page.slug)).toEqual([
      "home",
      "money",
      "connect",
      "visa",
      "trains",
    ]);
    expect(pages.every((page) => page.lastVerified.length === 10)).toBe(true);
    expect(money).toMatchObject({
      cluster: "money",
      path: "/money/",
      slug: "money",
    });
    expect(money?.faq.length).toBeGreaterThan(0);
    expect(money?.sources.length).toBeGreaterThan(0);
  });

  it("loads money guide frontmatter and optional deep modules", () => {
    const guides = getAllGuides();
    const alipay = getGuideByRoute("money", "alipay");
    const applePay = getGuideByRoute("money", "apple-pay");
    const cards = getGuideByRoute("money", "cards");
    const cash = getGuideByRoute("money", "cash");
    const esim = getGuideByRoute("connect", "esim");
    const esimVsSim = getGuideByRoute("connect", "esim-vs-sim");
    const googleMaps = getGuideByRoute("connect", "google-maps");
    const mapsApps = getGuideByRoute("connect", "maps-apps");
    const wechatPay = getGuideByRoute("money", "wechat-pay");

    expect(guides).toHaveLength(9);
    expect(alipay).toMatchObject({
      cluster: "money",
      lastVerified: "2026-07-04",
      path: "/money/alipay/",
      slug: "alipay",
    });
    expect(alipay?.sources.length).toBeGreaterThan(0);
    expect(alipay?.faq.length).toBe(6);
    expect(alipay?.steps.length).toBe(7);
    expect(alipay?.troubleshooting.length).toBeGreaterThanOrEqual(6);
    expect(applePay).toMatchObject({
      cluster: "money",
      lastVerified: "2026-07-04",
      path: "/money/apple-pay/",
      slug: "apple-pay",
    });
    expect(applePay?.sources.length).toBeGreaterThanOrEqual(5);
    expect(applePay?.faq.length).toBeGreaterThanOrEqual(4);
    expect(applePay?.steps).toHaveLength(0);
    expect(applePay?.troubleshooting).toHaveLength(0);
    expect(cards).toMatchObject({
      cluster: "money",
      lastVerified: "2026-07-04",
      path: "/money/cards/",
      slug: "cards",
    });
    expect(cards?.sources.length).toBeGreaterThanOrEqual(5);
    expect(cards?.faq.length).toBeGreaterThanOrEqual(5);
    expect(cards?.steps).toHaveLength(0);
    expect(cards?.troubleshooting).toHaveLength(0);
    expect(cash).toMatchObject({
      cluster: "money",
      lastVerified: "2026-07-04",
      path: "/money/cash/",
      slug: "cash",
    });
    expect(cash?.steps).toHaveLength(0);
    expect(cash?.troubleshooting).toHaveLength(0);
    expect(esim).toMatchObject({
      cluster: "connect",
      lastVerified: "2026-07-04",
      path: "/connect/esim/",
      slug: "esim",
    });
    expect(esim?.decisionTree).toBeNull();
    expect(esim?.faq.length).toBe(5);
    expect(esimVsSim).toMatchObject({
      cluster: "connect",
      lastVerified: "2026-07-04",
      path: "/connect/esim-vs-sim/",
      slug: "esim-vs-sim",
    });
    expect(esimVsSim?.decisionTree?.items).toHaveLength(2);
    expect(esimVsSim?.decisionTree?.items[0]?.children).toHaveLength(2);
    expect(esimVsSim?.faq.length).toBe(4);
    expect(googleMaps).toMatchObject({
      cluster: "connect",
      lastVerified: "2026-07-04",
      path: "/connect/google-maps/",
      slug: "google-maps",
    });
    expect(googleMaps?.faq.length).toBe(5);
    expect(mapsApps).toMatchObject({
      cluster: "connect",
      lastVerified: "2026-07-04",
      path: "/connect/maps-apps/",
      slug: "maps-apps",
    });
    expect(mapsApps?.faq.length).toBe(4);
    expect(wechatPay).toMatchObject({
      cluster: "money",
      lastVerified: "2026-07-04",
      path: "/money/wechat-pay/",
      slug: "wechat-pay",
    });
    expect(wechatPay?.faq.length).toBeGreaterThanOrEqual(5);
    expect(wechatPay?.steps.length).toBe(6);
    expect(wechatPay?.troubleshooting.length).toBeGreaterThanOrEqual(5);
  });

  it("fails when required guide fields are missing", () => {
    expect(() =>
      validateGuideFrontmatter(
        {
          cluster: "money",
          description: "Description",
          faq: [{ a: "Answer", q: "Question?" }],
          h1: "H1",
          sources: [{ label: "Official", url: "https://example.com/" }],
          title: "Title",
        },
        "missing-last-verified.md",
      ),
    ).toThrow(/lastVerified/);
  });
});
