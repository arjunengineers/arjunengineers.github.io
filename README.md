# Arjun Patel — Industrial Engineering Portfolio

Live at https://arjunengineers.github.io

A static portfolio site: plain HTML, CSS, and a little JavaScript. There is no build step,
no framework, no server code, and nothing to install.

The look is "an engineer's classical archive": near-black and ivory with antique gold, oversized
Cormorant type, Rembrandt and Piranesi plates, and restrained scroll scenes. Art and font sources
are in `CREDITS.md`.

## Preview

Serve the folder, so fonts and every link behave as they do online:

```bash
cd ~/Desktop/Resumes/arjun-patel-portfolio
python3 -m http.server 8000
```

Then open http://localhost:8000. Press Ctrl+C in Terminal to stop.

Double-clicking `index.html` also works, but Chrome and Firefox block web fonts from disk, and
`404.html` needs a server because it uses `/`-rooted paths.

## Structure

```
index.html                    Home
work/index.html               Projects: all six, with a discipline filter (?tag=)
work/<slug>/index.html        One case study per project
experience/index.html         Internships, education, community (with #anchors)
about/  privacy/  404.html
education/index.html          Redirect to experience/#education, so old links keep working
assets/css/tokens.css         Design tokens: colour, type, space, motion
assets/css/fonts.css          @font-face rules
assets/css/site.css           Everything else, in cascade layers:
                              reset, base, layout, components, pages, utilities
assets/js/boot.js             Runs before paint: enables the script-only styles
assets/js/site.js             Menu, filter, scroll scenes, reveal, chapter rail, contents
                              highlight, copy-email, local-preview links
assets/fonts/                 Cormorant, Instrument Sans, JetBrains Mono + their OFL licences
assets/img/                   Plates, project figures, the social image
favicon.svg  robots.txt  sitemap.xml  .nojekyll  CREDITS.md
```

## Editing

Every page is a complete HTML file. The header, contact section, and footer are repeated in each
one, so a change to them has to be made in all pages (find-and-replace across the folder).
`404.html` uses `/`-rooted paths; every other page uses relative ones.

**Change text:** edit the page's HTML directly. Homepage scenes use real text in the HTML, so
editing it needs no other step.

**Change a colour:** edit `tokens.css`, then re-check contrast (text 4.5:1, controls 3:1).

**Add a project:**
1. Copy an existing `work/<slug>/` folder, rename it, and edit its `index.html`.
2. Add a row to the index in `work/index.html`: copy an `<li class="index__item">`, and set
   `data-tags` to one of the filter chips' `data-tag` values. To show a figure in the row, copy
   the `<div class="index__fig">` block from an existing row.
3. Add the same row to `index.html` if it should be featured. Do not add images there: the
   homepage is deliberately text-led.
4. Update the previous project's "Next project" link, and add the new page to `sitemap.xml`.

**Add a figure:** save a WebP in `assets/img/`, then copy an existing `<figure class="figure">`
block and set `src`, `width`, `height`, and a real `alt` description. Strip metadata first.

**Change a chart:** bar lengths are the `width="…%"` attributes (value ÷ axis maximum). Update
the label, the hidden text, and the data table beside it too.

## Motion

Scroll scenes only read the normal scroll position; nothing locks or hijacks scrolling.

- `boot.js` adds `.motion` only when the visitor has not asked for reduced motion. All scenes are
  gated by that class, so without it (or without JavaScript) the page is simply static.
- `[data-scrub="pin"]` and `[data-scrub="pass"]` receive a `--p` value from 0 to 1 for CSS to use.
- `[data-words]` lights a statement word by word. `[data-reveal]` eases a block in once.

## Security and privacy rules

Every page carries a strict Content-Security-Policy in a `<meta>` tag. To keep it working:

- no `style="…"` attributes, no `<style>` blocks, no inline scripts or `onclick`-style handlers;
- nothing loaded from another site (scripts, fonts, images, embeds);
- no network calls from JavaScript, and no `innerHTML` or `eval`.

The site sets no cookies, stores nothing in the browser, and runs no analytics. GitHub Pages
cannot send HTTP security headers, so clickjacking protection is not available; the site has no
forms or logins for that to matter.

## Not yet on the site

Absent on purpose, not broken. Nothing was invented to fill them.

| Missing | Needed |
|---|---|
| Résumé download | A public version of the PDF with phone and address removed |
| GitHub link | Whether you want it shown |
| Target role, availability, location | The wording you want |

## Deploy

The site is published by GitHub Pages from the `main` branch of `arjunengineers.github.io`, root
folder. Anything added to `main` goes live within a couple of minutes. This folder is not a git
clone, so changes are uploaded through the GitHub website (**Add file → Upload files**). An upload
never deletes old files; remove those from the repository by hand.

## Where this departs from `project-portfolio.md`

The plan proposed Astro and a light/dark theme pair. The site is hand-written static HTML because
this Mac has no Node toolchain, and the redesign of 30 Oct 2026 is dark only by design. The CI
checks in the plan (Playwright, axe, Lighthouse) are not set up, because they need Node.
