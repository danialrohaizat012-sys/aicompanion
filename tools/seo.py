"""SEO pass, run by tools/build-ms.py after the Bahasa Melayu pages are built.

- Writes one JSON-LD block per page (id="ld-site"): Organization, WebSite, the NURI product, and on the home
  pages a FAQPage built from that page's own FAQ, so the English and Malay pages each describe themselves.
- Rewrites sitemap.xml with lastmod dates and hreflang alternates for every English/Malay pair.
"""
import datetime, html, json, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SITE = 'https://ciptarobo.com/'
PAGES = {'index.html': SITE, 'configure.html': SITE + 'configure.html',
         'ms/index.html': SITE + 'ms/', 'ms/configure.html': SITE + 'ms/configure.html'}
PAIRS = [('index.html', 'ms/index.html'), ('configure.html', 'ms/configure.html')]


def text(fragment):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', fragment))).strip()


def meta(s, name, attr='name'):
    m = re.search(rf'<meta {attr}="{re.escape(name)}" content="([^"]*)"', s)
    return html.unescape(m.group(1)) if m else ''


def graph(page, s):
    lang = re.search(r'<html lang="([^"]+)"', s).group(1)
    url = PAGES[page]
    org = {'@type': 'Organization', '@id': SITE + '#org', 'name': 'Cipta Robo', 'url': SITE,
           'logo': SITE + 'assets/logo/icon-512.png', 'areaServed': 'MY',
           'contactPoint': {'@type': 'ContactPoint', 'contactType': 'sales', 'telephone': '+60199400004', 'availableLanguage': ['ms', 'en']}}
    site = {'@type': 'WebSite', '@id': SITE + '#website', 'url': SITE, 'name': 'Cipta Robo', 'publisher': {'@id': SITE + '#org'}, 'inLanguage': ['en', 'ms']}
    product = {'@type': 'Product', '@id': SITE + '#nuri', 'name': 'NURI', 'brand': {'@type': 'Brand', 'name': 'Cipta Robo'},
               'manufacturer': {'@id': SITE + '#org'}, 'image': SITE + 'assets/img/og.png', 'url': url,
               'description': meta(s, 'description'), 'category': 'AI companion robot'}
    items = [org, site, product]
    if page.endswith('index.html'):
        faqs = re.findall(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>', s, re.S)
        if faqs:
            items.append({'@type': 'FAQPage', '@id': url + '#faq', 'inLanguage': lang,
                          'mainEntity': [{'@type': 'Question', 'name': text(q), 'acceptedAnswer': {'@type': 'Answer', 'text': text(a)}} for q, a in faqs]})
    return {'@context': 'https://schema.org', '@graph': items}


for page in PAGES:
    p = os.path.join(ROOT, page)
    s = open(p, encoding='utf-8').read()
    s = re.sub(r'<script type="application/ld\+json"[^>]*>.*?</script>\n?', '', s, flags=re.S)   # drop old blocks
    block = '<script type="application/ld+json" id="ld-site">' + json.dumps(graph(page, s), ensure_ascii=False, separators=(',', ':')) + '</script>\n'
    s = s.replace('<link rel="icon"', block + '<link rel="icon"', 1)
    open(p, 'w', encoding='utf-8').write(s)

today = datetime.date.today().isoformat()
prio = {'index.html': '1.0', 'ms/index.html': '0.9', 'configure.html': '0.8', 'ms/configure.html': '0.7'}
out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
for en, ms in PAIRS:
    for page in (en, ms):
        out.append(f'  <url><loc>{PAGES[page]}</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq><priority>{prio[page]}</priority>'
                   f'<xhtml:link rel="alternate" hreflang="en" href="{PAGES[en]}"/><xhtml:link rel="alternate" hreflang="ms" href="{PAGES[ms]}"/>'
                   f'<xhtml:link rel="alternate" hreflang="x-default" href="{PAGES[en]}"/></url>')
out.append('</urlset>')
open(os.path.join(ROOT, 'sitemap.xml'), 'w').write('\n'.join(out) + '\n')
print('seo: json-ld for', len(PAGES), 'pages, sitemap', today)
