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

    expect(pages.map((page) => page.slug)).toEqual([
      "home",
      "money",
      "connect",
      "visa",
      "trains",
    ]);
    expect(pages.every((page) => page.lastVerified.length === 10)).toBe(true);
  });

  it("loads sample guide frontmatter and optional deep modules", () => {
    const guides = getAllGuides();
    const sample = getGuideByRoute("money", "sample-guide");

    expect(guides).toHaveLength(1);
    expect(sample).toMatchObject({
      cluster: "money",
      lastVerified: "2026-07-04",
      path: "/money/sample-guide/",
      slug: "sample-guide",
    });
    expect(sample?.sources.length).toBeGreaterThan(0);
    expect(sample?.faq.length).toBeGreaterThan(0);
    expect(sample?.steps.length).toBeGreaterThan(0);
    expect(sample?.troubleshooting.length).toBeGreaterThan(0);
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
