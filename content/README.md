# Guide Content Model

Add publishable guides as Markdown files in `content/guides/`. The filename
becomes the slug, so `alipay-setup.md` publishes at `/money/alipay-setup/` when
its frontmatter has `cluster: "money"`.

Required guide frontmatter fields:

- `title`
- `description`
- `h1`
- `cluster`: `money`, `connect`, `visa`, or `trains`
- `lastVerified`: `YYYY-MM-DD`
- `sources`: list of `{ label, url }`
- `faq`: list of `{ q, a }`

Optional fields used by the sample page:

- `steps`: list of `{ title, body, image?: { src, alt, caption } }`
- `troubleshooting`: list of `{ problem, cause, fix }`

Run `npm run check:content` before opening a content PR.
