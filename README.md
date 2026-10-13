# Arjun Patel — Industrial Engineering Portfolio

Live at https://arjunengineers.github.io

A static portfolio site: plain HTML, CSS, and a little JavaScript. There is no build step,
no framework, no server code, and nothing to install.

- **Plan and requirements:** `project-portfolio.md` (kept outside this folder)
- **Content source:** the portfolio content and visual handoff (kept outside this folder; its
  agent notes and source reports are private and must never be added here)
- **Design:** the "warm field, cool signal" redesign brief of 13 Oct 2026 (kept outside this folder)

## Preview

Double-click `index.html`. Links between pages work straight from disk.

Two things differ from the hosted site when you open files from disk:

- **Fonts.** Chrome and Firefox block web fonts loaded from `file://`, so they show fallback
  fonts. Safari shows the real ones. For an accurate preview in any browser, serve the folder:
  run `python3 -m http.server` inside it and open `http://localhost:8000`.
- **`404.html`** uses root-absolute paths (`/assets/…`) because GitHub Pages serves it for any
  missing address, so it only looks right once hosted (or through the local server above).

## Structure

```
index.html                    Home
work/index.html               All six projects, with a discipline filter (?tag=)
work/<slug>/index.html        One case study per project
about/  experience/  education/  privacy/
404.html
assets/css/tokens.css         Design tokens: colour, type, space, shape, motion
assets/css/fonts.css          @font-face rules for the self-hosted fonts
assets/css/site.css           Everything else, in cascade layers:
                              reset, base, layout, components, pages, utilities
assets/js/theme.js            Applies a saved Light/Dark choice before the page paints
assets/js/site.js             Menu, theme switch, filter, scroll reveal, metric "settle",
                              table-of-contents highlight, copy-email, local-preview links
assets/fonts/                 Fraunces, Roboto Flex, JetBrains Mono (WOFF2) + their OFL licences
assets/img/                   Figures (WebP; PNG for full-size analysis figures)
favicon.svg  robots.txt  .nojekyll
```

## Design tokens

Colours, type sizes, spacing, radii, and motion all live in `assets/css/tokens.css`.

- **Three themes of behaviour:** light is the default; dark applies when the visitor's device is
  set to dark, or when they pick Dark in the header switch. The dark values are written twice in
  `tokens.css` (once for the device setting, once for the switch). Keep the two blocks identical.
- **Contrast is checked.** Every text colour passes WCAG 2.2 AA (4.5:1) on the surfaces it is
  used on, and control borders and chart marks pass 3:1. Re-check before changing any colour.
- **Colour rules:** links are sea blue and underlined; terracotta is for the name, the
  emphasised word, and the active-nav underline; on tinted panels use only `--color-text` and
  `--color-text-muted`; chart marks sit only on `--color-surface` or `--color-bg`.
- **Disciplines:** each filter tag has an accent, a tint, and a chart-mark colour
  (`--hf-*` human-factors, `--op-*` optimization, `--md-*` mechanical-design,
  `--qi-*` quality-improvement). An element with `data-discipline="<tag>"` gets them as
  `--accent-local`, `--tint-local`, `--mark-local`.

## Fonts

All three families are self-hosted under the SIL Open Font License 1.1 (licence texts are in
`assets/fonts/`). They are Latin subsets of the variable fonts from `github.com/google/fonts`,
337 KB in total. The axis ranges kept in each file are listed at the top of `fonts.css`; a value
outside a range is clamped by the browser.

To add characters or widen a range, re-run `fonttools varLib.instancer` and `pyftsubset` on the
original `.ttf` files. This is a one-time asset step, not a build step.

## Editing

Every page is a complete HTML file. The header, navigation, contact band, and footer are repeated
in each one, so a change to any of them has to be made in all 13 pages (find-and-replace across
the folder). `404.html` uses `/`-rooted paths; every other page uses relative ones.

**Change text:** edit the page's HTML directly.

**Add a project:**
1. Copy an existing `work/<slug>/` folder, rename it, and edit its `index.html`
   (title, description, spec sheet, sections, scope note, "Next project" link).
2. Set the case study's discipline: `<body data-discipline="…">` with one of `human-factors`,
   `optimization`, `mechanical-design`, `quality-improvement`. This colours its eyebrow, section
   numbers, callout, and highlighted chart marks.
3. Add a card for it in `work/index.html`, and in `index.html` if it should be featured.
   The list item carries `data-tags`, and the card carries the same value in `data-discipline`.
4. Point the previous project's "Next project" link at it, with its discipline tag.

**Add a figure:** save a WebP in `assets/img/`, then copy an existing `<figure class="figure">`
block and set `src`, `width`, `height`, and a real `alt` description. Strip metadata first.

**Change a chart:** bar lengths are the `width="…%"` attributes on the bars
(value ÷ axis maximum). Update the label, the hidden text, and the data table beside it too.
On the Asheville coverage chart the label weight follows the value (400 at 40% up to 800 at
60%), set by the `plot__value--w…` classes in `site.css`.

## Security and privacy rules

The pages carry a strict Content-Security-Policy in a `<meta>` tag. To keep it working:

- no `style="…"` attributes, no `<style>` blocks, no inline scripts or `onclick`-style handlers;
- nothing loaded from another site (scripts, fonts, images, embeds);
- no network calls from JavaScript (`connect-src 'none'`);
- no `innerHTML`, `eval`, or similar in JavaScript. Supporting browsers enforce this through
  Trusted Types and will stop a script that tries.

The policy starts from `default-src 'none'` and allows only same-site scripts, styles, images,
and fonts. To add a new kind of resource (a video, a web manifest), add its directive to the
policy on every page.

GitHub Pages cannot send HTTP security headers, so clickjacking protection (`frame-ancestors`)
is not available; the site has no forms or logins for that to matter.

The site sets no cookies and runs no analytics. The only thing stored in a visitor's browser is
their Light/Dark choice, as the Privacy page states.

## Not yet on the site

These are absent on purpose, not broken. Nothing was invented to fill them.

| Missing | Needed from you |
|---|---|
| GitHub link and "Source code" footer link | Whether you want them shown |
| Résumé download | A redacted, metadata-cleaned PDF |
| Role, availability, and location line in the hero | The wording you want |
| Canonical URLs, `og:image`, sitemap, `security.txt` | A go-ahead; the address is now known |

Also worth a decision: permission to publish figures taken from academic reports.

The contact block (email, LinkedIn) sits above the footer on every page. To change the address,
find-and-replace it across the folder; it appears three times per page.

## Deploy

The site is published by GitHub Pages from the `main` branch of `arjunengineers.github.io`,
root folder. Any change pushed or uploaded to `main` goes live within a minute or two.
`.nojekyll` tells GitHub Pages to serve the files as they are.

## Where this departs from the plan

`project-portfolio.md` proposes Astro (ADR-002, status "Proposed"). This build is hand-written
static HTML instead, chosen on 10 Oct 2026 because it needs no toolchain. What that changes:

- No content collections or schema validation; pages are edited by hand.
- No build-time image pipeline; figures are pre-converted WebP at a single size.
- The CSP is a hand-written `<meta>` tag. It needs no hashes because there are no inline
  scripts or styles.
- The CI checks in the plan (Playwright, axe, Lighthouse) are not set up; they need Node.

The look follows the 13 Oct 2026 redesign brief, not the plan's original dark-first tokens:
sandstone paper, sea-blue links, terracotta emphasis, Fraunces headings, Roboto Flex text.
Navigation labels follow the content handoff (Work, About, Experience, Education), so there is
no Writing or Résumé page yet.
