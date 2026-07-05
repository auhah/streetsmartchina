# StreetSmartChina

The DIY traveler's operator manual for China: payments, connectivity, visas, and
trains, verified and kept fresh.

Domain target: `https://streetsmartchina.com` (registration and DNS are still
pending, so local build and validation must not require the domain to resolve).

## Development

```bash
npm install
npm run dev
npm run lint
npm run type-check
npm run check:content
npm run build
```

Static export output is written to `out/`. Preview it with:

```bash
npm run preview:static
```

## Content

Add guide pages under `content/guides/*.md`. The required frontmatter is
documented in `content/README.md`, and `lastVerified` is required because
it drives visible freshness badges and sitemap `<lastmod>` dates.

The first production guide is published at `/money/alipay/`.

Managed under `project-base`; see `../projects.yaml`.
