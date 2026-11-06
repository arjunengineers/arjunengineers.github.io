"""Quick safety and quality check for the portfolio. Standard-library Python only; changes nothing.

Run from the site folder:   python3 tests/check_site.py
It prints PASS or FAIL lines and exits with status 1 if anything failed.

Checks: every page has the security policy and no inline styles or scripts; nothing loads over
http:// or from another site; internal links, images and #anchors exist; images have alt text;
internal links name a file (so they work when a page is opened from disk); one <h1> per page and
no skipped heading levels; no duplicate ids; no likely secrets or phone
numbers; the colour pairs used for text meet WCAG AA contrast.
"""
import html.parser
import pathlib
import re
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSP = ("default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; script-src 'none'; "
       "connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests")
PUBLIC_EMAIL = "arjunb.patel@outlook.com"
ALLOWED_EXTERNAL = ("https://www.linkedin.com/in/linkwitharjun",
                    "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement",
                    "https://arjunengineers.github.io/", "https://schema.org")
failures = []


def fail(page, msg):
    failures.append(f"FAIL {page}: {msg}")


class Page(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.imgs, self.headings, self.metas, self.scripts = [], [], [], [], [], []
        self.inline_handlers = self.style_attrs = self.style_tags = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.append(a["id"])
        if any(k.startswith("on") for k in a):
            self.inline_handlers += 1
        if "style" in a:
            self.style_attrs += 1
        if tag == "style":
            self.style_tags += 1
        if tag == "script":
            self.scripts.append(a)
        if tag == "meta":
            self.metas.append(a)
            if a.get("http-equiv") == "refresh" and "url=" in a.get("content", ""):
                self.refs.append(("a", a["content"].split("url=", 1)[1].strip()))
        if tag in ("a", "link") and a.get("href"):
            self.refs.append((tag, a["href"]))
        if tag in ("img", "source"):
            for key in ("src", "srcset"):
                if a.get(key):
                    for part in a[key].split(","):
                        self.refs.append((tag, part.strip().split(" ")[0]))
        if tag == "img":
            self.imgs.append(a)
        if re.fullmatch(r"h[1-6]", tag):
            self.headings.append(int(tag[1]))


pages = sorted(p for p in ROOT.rglob("*.html") if "tests" not in p.parts)
parsed = {}
for path in pages:
    p = Page()
    p.feed(path.read_text(encoding="utf-8"))
    parsed[path] = p

for path, p in parsed.items():
    rel = path.relative_to(ROOT).as_posix()
    text = path.read_text(encoding="utf-8")
    redirect = any(m.get("http-equiv") == "refresh" for m in p.metas)

    csp = [m.get("content") for m in p.metas if m.get("http-equiv") == "Content-Security-Policy"]
    if csp != [CSP]:
        fail(rel, "Content-Security-Policy meta tag missing or different from the standard one")
    if p.style_attrs or p.style_tags or p.inline_handlers:
        fail(rel, "inline style attribute, <style> block or on…= handler found")
    for s in p.scripts:
        if s.get("type") != "application/ld+json" or s.get("src"):
            fail(rel, "a script that would run (only application/ld+json data is allowed)")
    if re.search(r"""(src|href|srcset)=["']http://""", text):
        fail(rel, "resource or link over plain http://")

    for tag, ref in p.refs:
        if ref.startswith("mailto:"):
            if PUBLIC_EMAIL not in ref:
                fail(rel, f"unexpected email link {ref}")
            continue
        if ref.startswith("https://"):
            if not ref.startswith(ALLOWED_EXTERNAL):
                fail(rel, f"external address not on the allowed list: {ref}")
            if tag in ("img", "source") or (tag == "link" and not ref.startswith("https://arjunengineers.github.io/")):
                fail(rel, f"loads a file from another site: {ref}")
            continue
        url = urllib.parse.urlparse(ref)
        base = ROOT if url.path.startswith("/") else path.parent
        target = (base / url.path.lstrip("/")) if url.path else path
        if rel != "404.html":
            # Links must name a file, so they also work when a page is opened from disk.
            # (404.html is the exception: GitHub Pages shows it at any address, so it uses /… paths.)
            if url.path.startswith("/"):
                fail(rel, f"link starts with / and only works online: {ref}")
            elif target.is_dir() or url.path.endswith("/"):
                fail(rel, f"link points at a folder and will not open from disk; add index.html: {ref}")
        if target.is_dir() or url.path.endswith("/"):
            target = target / "index.html"
        if not target.exists():
            fail(rel, f"broken link or file: {ref}")
            continue
        if url.fragment and target.suffix == ".html":
            if url.fragment not in parsed.get(target.resolve(), parsed.get(target, Page())).ids:
                fail(rel, f"missing #anchor: {ref}")

    if not redirect:
        for img in p.imgs:
            if "alt" not in img:
                fail(rel, f"image without alt attribute: {img.get('src')}")
            if not (img.get("width") and img.get("height")):
                fail(rel, f"image without width/height (causes layout shift): {img.get('src')}")
        if p.headings.count(1) != 1:
            fail(rel, f"expected exactly one <h1>, found {p.headings.count(1)}")
        for prev, cur in zip(p.headings, p.headings[1:]):
            if cur > prev + 1:
                fail(rel, f"heading level skips from h{prev} to h{cur}")
                break
    dupes = {i for i in p.ids if p.ids.count(i) > 1}
    if dupes:
        fail(rel, f"duplicate ids: {sorted(dupes)}")

# Likely secrets or private details anywhere in the published files
SECRET = re.compile(r"(ghp_[A-Za-z0-9]{20,}|github_pat_|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|"
                    r"api[_-]?key\s*[:=]|secret\s*[:=]|password\s*[:=]|token\s*[:=])", re.I)
PHONE = re.compile(r"(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b|\+91[\s-]?\d{5}[\s-]?\d{5}")
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
for f in ROOT.rglob("*"):
    if f.is_dir() or "tests" in f.parts or f.suffix not in (".html", ".css", ".txt", ".xml", ".md", ".svg"):
        continue
    t = f.read_text(encoding="utf-8", errors="ignore")
    rel = f.relative_to(ROOT).as_posix()
    if SECRET.search(t):
        fail(rel, f"possible secret: {SECRET.search(t).group(0)!r}")
    if f.suffix in (".html", ".md") and PHONE.search(t):
        fail(rel, f"possible phone number: {PHONE.search(t).group(0)!r}")
    for e in set(EMAIL.findall(t)):
        if e != PUBLIC_EMAIL and not f.name.startswith("OFL") and e not in ("noreply@anthropic.com",):
            fail(rel, f"unexpected email address {e}")


# Contrast of the text colour pairs used in site.css (WCAG 2.2 AA: 4.5:1 for body text)
def lum(hexcol):
    c = [int(hexcol[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def blend(fg, alpha, bg):
    f = [int(fg[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(bg[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(alpha * x + (1 - alpha) * y):02x}" for x, y in zip(f, b))


css = (ROOT / "assets/css/site.css").read_text(encoding="utf-8")
tok = dict(re.findall(r"--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})", css))
skies = re.findall(r"--sky:\s*(#[0-9a-fA-F]{6})", css)
pairs = []
for bg in ("canvas", "surface", "card"):
    for fg in ("ink", "ink-2", "accent"):
        pairs.append((f"{fg} on {bg}", tok[fg], tok[bg]))
pairs += [("white on ink button", "#ffffff", tok["ink"]), ("ink on white button", tok["ink"], "#ffffff"),
          ("white on night panel", "#ffffff", tok["night"]),
          ("86% white on night panel", blend("#ffffff", 0.86, tok["night"]), tok["night"]),
          ("gold on night panel", tok["gold"], tok["night"]),
          # navigation glass: frosted (72% white) state with ink text, worst case over the darkest sky;
          # clear (7% white) state with white text, used only over the dark paintings
          ("ink on frosted nav over sky", tok["ink"], blend("#ffffff", 0.72, "#0e1c3d")),
          ("white on clear nav over sky", "#ffffff", blend("#ffffff", 0.07, "#183263"))]
for s in skies:
    pairs += [(f"white on sky {s}", "#ffffff", s), (f"86% white on sky {s}", blend("#ffffff", 0.86, s), s),
              (f"gold on sky {s}", tok["gold"], s)]
# Text over the paintings themselves is kept legible by the --s values in site.css (see README).
if "--contrast" in sys.argv:
    for name, a, b in pairs:
        print(f"  {ratio(a, b):5.2f}:1  {name}")
for name, a, b in pairs:
    if ratio(a, b) < 4.5:
        fail("assets/css/site.css", f"contrast {ratio(a, b):.2f}:1 below 4.5:1 for {name}")

print(f"Checked {len(pages)} pages.")
if failures:
    print("\n".join(failures))
    sys.exit(1)
print("PASS: all checks")
