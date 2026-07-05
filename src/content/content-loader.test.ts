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

  it("loads Alipay guide frontmatter and optional deep modules", () => {
    const guides = getAllGuides();
    const alipay = getGuideByRoute("money", "alipay");

    expect(guides).toHaveLength(1);
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
