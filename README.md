# Arjun Patel — Industrial Engineering Portfolio

Live at https://arjunengineers.github.io

A static site: plain HTML, one stylesheet, one small script. No framework, build step, server, or
dependencies.

## Preview

```bash
cd ~/Desktop/Resumes/arjun-patel-portfolio
python3 -m http.server 8000
```

Open http://localhost:8000 and press Ctrl+C in Terminal to stop. A server shows fonts and `404.html`
exactly as they appear online; double-clicking `index.html` also works for a quick look.

## Check before publishing

```bash
python3 tests/check_site.py
```

Needs only Python. It checks links, anchors, assets, headings, alt text, the security policy, the
six projects, the five story chapters, image credits, and unused or stray files.

## Structure

```
index.html              Home: hero, the five chapters, projects, approach, experience
work/index.html         All six projects, with a discipline filter (?tag=)
work/<slug>/index.html  One case study per project
experience/  about/  privacy/  404.html
education/index.html    Redirect to experience/#education, so old links keep working
assets/site.css         All styles
assets/site.js          Local-preview links, the filter, the home page stage, copy email
assets/fonts/           Cormorant, Instrument Sans, JetBrains Mono, and their licences
assets/img/             Project figures and the social image
assets/img/scene/       The hero and chapter art
tests/check_site.py     Regression checks
CREDITS.md              Image and font sources, licences, and changes
favicon.svg  robots.txt  sitemap.xml  .nojekyll
```

Why the CSS and JavaScript are separate files: the site's Content-Security-Policy blocks inline
styles and scripts, and 12 other pages share them. Moving them into `index.html` would mean
weakening that policy and copying the code into every page.

## Editing

Each page is a complete HTML file. The header, contact section, and footer are repeated in each, so
change them with find-and-replace across the folder. `404.html` uses `/`-rooted paths; every other
page uses relative ones.

- **Text:** edit the page's HTML.
- **Colours:** the variables at the top of `site.css`. Re-check contrast after changing one (text 4.5:1, control borders 3:1).
- **Add a project:** copy a `work/<slug>/` folder and edit it; copy a `<li class="project">` row in
  `work/index.html` and set `data-tags` to a filter button's `data-tag`; update the previous
  project's "Next project" link, `sitemap.xml`, and `PROJECTS` in `tests/check_site.py`.
- **Add an image:** use your own or a licensed WebP with `width`, `height`, and real `alt` text.
  Strip metadata first, and record third-party images in `CREDITS.md`.
- **Add a résumé:** use a public version with phone and address removed, for example
  `assets/Arjun-Patel-Resume.pdf`, then link it from the intro on `index.html`.

## Motion

The home page is six scenes. `site.js` pins one scene at a time, sets a `--p` value from 0 to 1 as the
visitor scrolls, and paints the pixel dissolve between scenes on a small canvas. `site.css` turns `--p`
into the falling apple, the rising balloon and the climbing rocket. Scrolling is always native.

To change a scene: its text is in `index.html`, its art positions are under "Scene art" in `site.css`,
and how long it stays pinned is `.stage .home .scene { height }`.

The page stays complete without the stage. With JavaScript off, with reduced motion, or when text
would not fit a pinned screen (a phone held sideways, greatly enlarged text), the scenes become
ordinary sections.

## Security

- Static hosting, no cookies, no analytics, no forms, no third-party requests, and no secrets.
- Every page carries the same strict Content-Security-Policy in a `<meta>` tag. Keep it working:
  no `style="…"`, no `<style>`, no inline scripts or `onclick`, no `innerHTML` or `eval`, and nothing
  loaded from another site.
- GitHub Pages cannot send custom response headers, so `frame-ancestors`, `X-Frame-Options`,
  `X-Content-Type-Options`, and `Permissions-Policy` are not available. The risk is low because the
  site has no logins, forms, or actions to hijack. HTTPS comes from GitHub (`*.github.io`).

## Deploy

GitHub Pages publishes the `main` branch of `arjunengineers.github.io` from the root folder; changes
go live within a couple of minutes. This folder is not a git clone, so changes are uploaded through
the GitHub website with **Add file → Upload files**. Uploading never deletes, so remove old files
from the repository by hand.
