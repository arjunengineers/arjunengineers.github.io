#!/usr/bin/env python3
"""Regression checks for the static site. Needs only Python 3. Run from anywhere:
       python3 tests/check_site.py
   Exits non-zero and lists problems if a page breaks a rule below."""
import re, sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ['hfes-uxtg-portal', 'asheville-park-access', 'bell407-rotor-analysis',
            'outpatient-clinic-routing', 'automotive-dmaic-review', 'passive-solar-array']
ROUTES = ['index.html', 'work/index.html', 'experience/index.html', 'about/index.html', 'privacy/index.html',
          'education/index.html', '404.html'] + [f'work/{p}/index.html' for p in PROJECTS]
SCENE_IMAGES = ['newton', 'apple', 'balloon', 'paris', 'wright', 'moon', 'earth', 'starship', 'hero-group', 'sky', 'night', 'cloud']
VOID = {'meta', 'link', 'img', 'br', 'hr', 'input', 'source', 'circle', 'rect', 'path', 'line', 'polyline'}
problems = []


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.ids, self.refs, self.links, self.assets, self.imgs, self.heads = [], [], [], [], [], [], []
        self.inline, self.csp, self.errors = 0, [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag not in VOID:
            self.stack.append(tag)
        if 'id' in a:
            self.ids.append(a['id'])
        for k in ('aria-labelledby', 'aria-controls'):
            self.refs += a.get(k, '').split()
        if 'style' in a or tag == 'style' or any(k.startswith('on') for k in a):
            self.inline += 1
        if tag == 'script':
            if a.get('src'):
                self.assets.append(a['src'])
            elif a.get('type') != 'application/ld+json':
                self.inline += 1
        if tag == 'a' and 'href' in a:
            self.links.append((a['href'], a.get('rel', '')))
        if tag == 'link' and a.get('rel') != 'canonical':
            self.assets.append(a['href'])
        if tag == 'img':
            self.imgs.append(a)
            self.assets.append(a['src'])
            self.assets += [s.split()[0] for s in a.get('srcset', '').split(',') if s.strip()]
        if tag == 'meta' and a.get('http-equiv') == 'Content-Security-Policy':
            self.csp.append(a['content'])
        if re.fullmatch('h[1-6]', tag):
            self.heads.append(int(tag[1]))
        if tag == 'button' and a.get('type') != 'button':
            self.errors.append('button without type')

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        else:
            self.errors.append(f'mismatched </{tag}>')


def load(rel):
    page = Page()
    page.feed((ROOT / rel).read_text(encoding='utf-8'))
    return page


def target(page_rel, path):
    base = ROOT if path.startswith('/') else (ROOT / page_rel).parent
    t = (base / path.lstrip('/')).resolve()
    return t / 'index.html' if path.endswith('/') or t.is_dir() else t


pages = {r: load(r) for r in ROUTES}
found = sorted(str(p.relative_to(ROOT)) for p in ROOT.rglob('*.html') if '.claude' not in p.parts)
if found != sorted(ROUTES):
    problems.append(f'pages differ from the expected routes: {set(found) ^ set(ROUTES)}')
csps = set()
for rel, p in pages.items():
    bad = lambda m, rel=rel: problems.append(f'{rel}: {m}')
    if p.errors or p.stack:
        bad(f'malformed HTML {p.errors[:3]} {p.stack}')
    if rel != 'education/index.html' and p.heads.count(1) != 1:
        bad('needs exactly one h1')
    if any(b > a + 1 for a, b in zip(p.heads, p.heads[1:])):
        bad(f'heading level skipped {p.heads}')
    if p.inline:
        bad('inline style, script or handler (blocked by the CSP)')
    if len(set(p.ids)) != len(p.ids):
        bad('duplicate ids')
    if [r for r in p.refs if r not in p.ids]:
        bad('aria reference to a missing id')
    if len(p.csp) != 1 or "default-src 'none'" not in p.csp[0] or 'unsafe' in p.csp[0]:
        bad('missing or weakened Content-Security-Policy')
    csps.update(p.csp)
    for im in p.imgs:
        if 'alt' not in im or not im.get('width') or not im.get('height'):
            bad(f'image needs alt, width and height: {im.get("src")}')
    for ref in p.assets:
        if re.match(r'[a-z]+:|//', ref):
            bad(f'third-party or insecure asset: {ref}')
        elif not target(rel, ref).is_file():
            bad(f'missing asset: {ref}')
    for href, rel_attr in p.links:
        if href.startswith('#'):
            if href[1:] not in p.ids:
                bad(f'broken anchor {href}')
        elif href.startswith('https://'):
            if 'noopener' not in rel_attr or 'noreferrer' not in rel_attr:
                bad(f'external link needs rel="noopener noreferrer": {href}')
        elif href.startswith('mailto:'):
            continue
        elif re.match(r'[a-z]+:', href):
            bad(f'unexpected or insecure link: {href}')
        else:
            path, _, frag = href.partition('#')
            path = path.split('?')[0]
            t = target(rel, path) if path else ROOT / rel
            if not t.is_file():
                bad(f'broken link {href}')
            elif frag and t.suffix == '.html' and frag not in load(str(t.relative_to(ROOT))).ids:
                bad(f'broken anchor {href}')
if len(csps) != 1:
    problems.append('Content-Security-Policy differs between pages')

home = (ROOT / 'index.html').read_text(encoding='utf-8')
work = (ROOT / 'work/index.html').read_text(encoding='utf-8')
credits = (ROOT / 'CREDITS.md').read_text(encoding='utf-8')
for slug in PROJECTS:
    if f'work/{slug}/' not in work:
        problems.append(f'work page does not link {slug}')
if home.count('<span class="kicker">') != 5 or home.count('class="scene ') != 6:
    problems.append('homepage should tell five story chapters after the hero')
for line in ('Understanding why things fall.', 'Humans begin to rise.', 'Taking control of flight.',
             'Setting foot on another world.', 'Building toward the next frontier.'):
    if line not in home:
        problems.append(f'chapter caption missing: {line}')
if home.count('class="tag"') != 12:
    problems.append('all six projects must keep their status label in a chapter and in the index')
if 'not a ranking' not in home or 'Skip the story' not in home:
    problems.append('story must stay labelled as a selection and stay skippable')
if home.index('View projects') > home.index('id="work"'):
    problems.append('View projects must stay in the introduction')
for name in SCENE_IMAGES:
    if name not in credits.lower():
        problems.append(f'CREDITS.md has no entry for {name}')
    if not list((ROOT / 'assets/img/scene').glob(f'{name}*.webp')):
        problems.append(f'scene image missing: {name}')

js = re.sub(r'/\*.*?\*/', '', (ROOT / 'assets/site.js').read_text(encoding='utf-8'), flags=re.S)
for banned in ('innerHTML', 'outerHTML', 'eval(', 'document.write', 'fetch(', 'XMLHttpRequest', 'localStorage', 'document.cookie'):
    if banned in js:
        problems.append(f'assets/site.js uses {banned}')

used = ''.join(p.read_text(encoding='utf-8') for p in ROOT.rglob('*.html') if '.claude' not in p.parts) + (ROOT / 'assets/site.css').read_text(encoding='utf-8')
for f in list((ROOT / 'assets/img').rglob('*.*')) + list((ROOT / 'assets/fonts').glob('*.woff2')):
    if f.name not in used:
        problems.append(f'unused asset: {f.relative_to(ROOT)}')
for f in ROOT.rglob('.DS_Store'):
    problems.append(f'remove before uploading: {f.relative_to(ROOT)}')

print(f'{len(pages)} pages checked.')
for p in problems:
    print(' -', p)
print('FAILED' if problems else 'All checks passed.')
sys.exit(1 if problems else 0)
