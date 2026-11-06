# Arjun Patel — Industrial Engineering Portfolio

Live address: https://arjunengineers.github.io (GitHub Pages, repository `arjunengineers.github.io`, branch `main`, root folder).

Plain HTML and one CSS file. No JavaScript, no build step, nothing to install.

## Preview on your Mac

Double-click `index.html`. Links between pages work from disk because every link names the
file it opens (for example `work/hfes-uxtg-portal/index.html`, not `work/hfes-uxtg-portal/`).
Keep writing links that way: a link that ends in `/` opens an empty folder from disk, and the
check below reports it.

- Safari shows the real fonts. Chrome blocks fonts opened from disk and shows a fallback font.
- `404.html` uses addresses that start with `/`, so it only looks right once it is online.

## What is where

```
index.html                    Home: hero, projects, about, experience and skills, contact
work/<project>/index.html     The six project pages (same addresses as before)
work/  about/  experience/  education/
                              Small redirect pages: old addresses jump to the right home section
privacy/index.html            Privacy page
404.html                      Shown by GitHub Pages for any missing address
assets/css/site.css           All styling, for every page
assets/fonts/                 Instrument Sans and JetBrains Mono (WOFF2) and their SIL OFL licences
assets/img/                   Project figures (WebP, plus full-size PNGs linked from project pages)
assets/img/scene/             The painted landscapes, in several sizes
assets/img/cover/             One 4:3 cover per project, cut from the paintings (480 and 800 wide)
assets/img/og-image.jpg       Preview picture used when the site is shared on LinkedIn
favicon.svg  robots.txt  sitemap.xml  .nojekyll
tests/check_site.py           Safety and quality check (see below)
```

The header and footer are repeated in every page. A change to them (for example the email
address) must be made in every HTML file: use find-and-replace across the folder.

## Editing

**Change text.** Open the HTML file in a text editor (TextEdit in plain-text mode, or VS Code)
and edit the words between the tags. Keep facts and scope notes accurate; every project page
states what its result does not show.

**Add a project.**
1. Copy a folder in `work/`, rename it, and edit its `index.html`: title, description,
   canonical address, heading, details box and sections.
2. Copy one `<li>…</li>` project card on `index.html` and edit it. Keep the cover text short:
   one value (a few characters) and a caption of about 50 characters, so it stays in the dark
   part of the sky.
3. Update the "Next project" link on the page before it, and add the address to `sitemap.xml`.
4. Run the check (below).

**Change a figure.** Save a WebP in `assets/img/`, then copy an existing `<figure>` block and set
`src`, `width`, `height`, and an `alt` text that describes what the figure shows. Remove
photo metadata before adding any image.

**Paintings.** Text sits on a solid sky colour, and the painting is pulled up behind it by an
amount (`--s` in `site.css`) measured for each painting. That measurement keeps all text at
4.5:1 contrast or better, so it never lands on mountains, cliffs or the sunset glow. If you
swap a painting for a different one, the `--s` and `--sky` values must be measured again. Ask
for help rather than guessing them.

Which painting goes where: alpine valley for the home page and the optimization projects;
oak meadow for contact and human factors; mesas for mechanical design; sandstone cove for
quality improvement. Each project cover is a window cut from its discipline's painting, chosen
so the cover text sits on sky that keeps white text at 4.5:1 or better.

## Design system (keep it consistent)

- **Colours:** warm-white canvas, navy ink, cobalt links. Gold is used only on dark skies.
- **Type:** Instrument Sans for everything; JetBrains Mono only for dates and numbers.
- **Corners:** chips 8 px, buttons 12 px, cards 18 px, panels 28 px.
- **Panels:** paintings, the About section and the contact band are rounded panels set 12 px
  in from the screen edge.
- **Buttons:** white for the main action, glass (outlined) for the second one. One main action
  per area.
- **Section headers:** a small numbered label, one large headline, an optional short lead.
- **Navigation:** a floating liquid-glass bar with a small round crop of the alpine painting as
  the logo (`assets/img/brand-mark.webp`). Over the dark paintings it is nearly clear with white
  text and a cool glow; over light sections it is frosted with dark text and a warm glow. Panels
  marked `nav-dark` (top) and `nav-dark-end` (bottom) tell it where the dark paintings are.
  Browsers without scroll-linked styles show the frosted bar everywhere, which stays legible.
- **One-screen panels:** on desktop screens the home hero (from 1200 px wide) and the contact
  panel (from 1360 px wide) fill exactly one screen, so the whole painting is visible. Smaller
  or narrower screens use the stacked layout, where text always sits above the painting.
- **Experience:** a light panel washed from morning sky to sand, with white cards; each internship
  shows its reported results as four large numbers above the original bullet points. Keep the
  numbers and the bullets in step if you edit either.
- **No animation** other than gentle hover effects, which switch off for visitors who ask their
  device for reduced motion.

## Check before publishing

In Terminal, inside this folder:

```
python3 tests/check_site.py
```

It should end with `PASS: all checks`. It checks that every page has the security policy;
that there are no inline styles or scripts and nothing loaded from other sites or over
`http://`; that all links, images and `#anchors` exist; alt text; heading order; likely
secrets or phone numbers; and colour contrast. Add `--contrast` to see each contrast ratio.

## Publishing (GitHub website)

Nothing here goes live until you do these steps. Uploading adds and overwrites files, but it
never deletes old ones, so the old design's files must be removed first.

1. **Back up the live site.** Open https://github.com/arjunengineers/arjunengineers.github.io,
   click the green **Code** button, then **Download ZIP**. Keep the ZIP.
   *Check:* open the ZIP; it contains `index.html` and an `assets` folder.
2. **Remove the old files.** In the repository, open the `assets` folder, click the **…** menu
   at the top right of the file list, and choose **Delete directory**. Commit with the
   message "Remove old design files". Do the same for the `tests` folder, then open
   `CREDITS.md` and delete it with the trash-can icon.
   *Expect:* the live site looks unstyled for a few minutes. That is normal until step 3.
3. **Upload the new site.** Click **Add file → Upload files**. In Finder, open this folder,
   press ⌘A to select everything inside it (not the folder itself), and drag it onto the
   page. Commit with the message "New portfolio design".
4. **Check it.** Open the repository's **Actions** tab and wait for "pages build and
   deployment" to show a green tick (about one to two minutes). Then open
   https://arjunengineers.github.io and refresh. Check the home page, one project page, an old
   address such as https://arjunengineers.github.io/about/ (it should jump to the About
   section), and a made-up address such as `/nothing` (it should show the 404 page).
5. **If something is wrong (undo).** Repeat step 2, then upload the contents of the ZIP from
   step 1 in the same way as step 3. The previous design comes back. Every earlier version
   also stays in the repository's commit history.

`.nojekyll` is already in the repository, so it does not need uploading again (Finder hides
files whose names start with a dot).

## Security and privacy

- **No JavaScript.** Every page carries a Content-Security-Policy that blocks all scripts, all
  connections, forms, plugins and anything from other sites. Only this site's own styles,
  fonts and images can load. Keep it that way: no `style="…"`, no `<style>`, no `<script>`
  (except the `application/ld+json` data block on the home page), and no embeds.
- **No data collected.** No cookies, analytics, forms, or tracking. If you ever add a contact
  form, analytics or an embed, the policy and the Privacy page both need changing, and the
  provider should be checked first.
- **Nothing secret belongs here.** Everything in this folder is public once uploaded,
  including this file and its history. Never add passwords, keys, tokens, your phone number,
  your address, or private reports. If something private is ever uploaded by mistake, deleting
  it is not enough: it stays in the commit history, so ask for help removing it, and change any
  password or key that was exposed.
- **What GitHub Pages cannot do.** It cannot send custom security headers, so protection
  against the site being framed by another site (`frame-ancestors`) is not available. With no
  logins, forms or actions on the site, the risk is low. GitHub already sends HTTPS with HSTS.
- **Your accounts are the real perimeter.** Use a passkey or security key for GitHub, keep the
  repository with no other collaborators unless needed, and review **Settings → Pages →
  Enforce HTTPS** (should be ticked).

## Not on the site yet (needs your decision)

| Missing | Needed from you |
|---|---|
| Résumé download | A public PDF without phone number or home address, with metadata removed |
| GitHub profile link | Whether you want it shown |
| Location or availability line in the hero | The exact wording you want |
| Permission notes for academic report figures | Confirmation you may publish them |

## Image notes

The four landscape paintings were supplied by Arjun (November 2026). They were resized and
re-encoded to WebP with all metadata removed. If they came from an image generator or a stock
site, keep a note of the source and its licence terms.
