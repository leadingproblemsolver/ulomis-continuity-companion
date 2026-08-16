# Ulomis company site

Static, single-page marketing site ("Ulomis for households"). Separate from the
interactive product demo served by the main app in `src/`.

- `index.html` — fully self-contained (inline CSS/JS, Sora/Manrope embedded as
  base64 `@font-face` data URIs, no external requests, no build step). Open
  directly or serve as-is from any static host (Netlify, GitHub Pages, S3, etc.).
- Copy, palette, and typography match the brand system defined in the root
  `README.md` (Primary blue `#315FDD`, Sora/Manrope, light + dark mode).

## Deploy

Drag-and-drop the folder onto Netlify, or point any static host at
`company-site/` as the publish directory. No environment variables or build
command required.

The CTA buttons currently link to the in-page demo (`#demo`). Point them at
the live product URL once one is chosen for this domain.
