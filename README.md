# Arjun Patel — Industrial Engineering Portfolio

A static portfolio site: plain HTML, CSS, and a few lines of JavaScript. There is no build step,
no framework, no server code, and nothing to install.

- **Plan and requirements:** `project-portfolio.md` (kept outside this folder)
- **Content source:** the portfolio content and visual handoff (kept outside this folder; its
  agent notes and source reports are private and must never be added here)

## Preview

Double-click `index.html`. Links between pages work straight from disk.

`404.html` is the one exception: it uses root-absolute paths (`/assets/…`) because GitHub Pages
serves it for any missing address, so it only looks right once the site is hosted.

## Structure

```
index.html                    Home
work/index.html               All six projects, with a discipline filter
work/<slug>/index.html        One case study per project
about/  experience/  education/  privacy/
404.html
assets/css/tokens.css         Design tokens: colour, type, spacing (spec §3.3, A.12)
assets/css/site.css           Components and layout
assets/js/theme.js            Applies a saved dark-mode choice before the page paints
assets/js/site.js             Filter, theme toggle, scroll reveal, copy-email, local-preview links
assets/img/                   Figures (WebP; PNG for full-size analysis figures)
favicon.svg  robots.txt  .nojekyll
```

## Editing

Every page is a complete HTML file. The header, navigation, and footer are repeated in each one,
so a change to the navigation has to be made in all 13 pages (find-and-replace across the folder).

**Change text:** edit the page's HTML directly.

**Add a project:**
1. Copy an existing `work/<slug>/` folder, rename it, and edit its `index.html`
   (title, description, spec sheet, sections, scope note, "Next project" link).
2. Add a card for it in `work/index.html`, and in `index.html` if it should be featured.
   The card's list item carries `data-tags`; use one of the filter chips' `data-tag` values.
3. Point the previous project's "Next project" link at it.

**Add a figure:** save a WebP in `assets/img/`, then copy an existing `<figure class="figure">`
block and set `src`, `width`, `height`, and a real `alt` description. Strip metadata first.

**Change a chart:** bar lengths are the `width="…%"` attributes on the bars
(value ÷ axis maximum). Update the label, the hidden text, and the data table beside it too.

Rules the pages follow, so the Content-Security-Policy keeps working: no `style="…"` attributes,
no `<style>` blocks, no inline scripts, and no files loaded from other sites.

## Before you publish

These are absent on purpose, not broken. Nothing was invented to fill them.

| Missing | Needed from you | Unlocks |
|---|---|---|
| GitHub link and "Source code" footer link | Your GitHub URL | FR-08 |
| Résumé download | A redacted, metadata-cleaned PDF | FR-06 |
| Role, availability, and location line in the hero | The wording you want | FR-01 |
| Canonical URLs, `og:image`, sitemap, breadcrumb data, `security.txt` | The final site address | NFR-10, FR-13, A.22 |
| Self-hosted Inter and JetBrains Mono | Font files in `assets/fonts/` plus `@font-face` rules | BL-30 (system fonts are used until then) |

Also worth a decision before launch: permission to publish figures taken from academic reports.

The contact block (email, LinkedIn) sits above the footer on every page. To change the address,
find-and-replace it across the folder; it appears three times per page.

## Deploy to GitHub Pages

1. Create a public repository named `<username>.github.io` and push the contents of this folder
   to `main`, so `index.html` sits at the repository root.
2. Repository **Settings → Pages**: Source "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Turn on **Enforce HTTPS**.

`.nojekyll` tells GitHub Pages to serve the files as they are.

## Where this departs from the plan

`project-portfolio.md` proposes Astro (ADR-002, status "Proposed"). This build is hand-written
static HTML instead, chosen on 10 Oct 2026 because it needs no toolchain. What that changes:

- No content collections or schema validation; pages are edited by hand.
- No build-time image pipeline; figures are pre-converted WebP at a single size.
- The CSP is a hand-written `<meta>` tag. It needs no hashes because there are no inline
  scripts or styles.
- The CI checks in the plan (Playwright, axe, Lighthouse) are not set up; they need Node.

The look also departs from the plan's dark default: on 10 Oct 2026 it moved to a warm light
"paper" theme (ivory and oat bands, serif headings, tinted panels) with dark mode as an opt-in
toggle. That choice is stored in the visitor's own browser only, as the Privacy page states.

The components, accessibility rules, privacy constraints, and page structure follow the plan. Navigation labels follow the content handoff (Work, About, Experience,
Education), so there is no Writing or Résumé page yet.
