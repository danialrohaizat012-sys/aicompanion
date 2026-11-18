"""Stamp a content hash on the site's CSS and JavaScript URLs so browsers and the GitHub Pages cache
never mix a new page with old scripts. Run before committing (tools/build-ms.py runs it too)."""
import glob, hashlib, os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
files = sorted(glob.glob(os.path.join(ROOT, 'assets', '*.js')) + [os.path.join(ROOT, 'assets', 'site.css')])
strip = lambda t: re.sub(r'\?v=[0-9a-f]+', '', t)
h = hashlib.sha1(b''.join(strip(open(f, encoding='utf-8').read()).encode() for f in files)).hexdigest()[:8]
for f in glob.glob(os.path.join(ROOT, 'assets', '*.js')):
    s = open(f, encoding='utf-8').read()
    n = re.sub(r"""(from\s+['"]\./[\w-]+\.js)(\?v=[0-9a-f]+)?(['"])""", rf'\1?v={h}\3', s)
    if n != s: open(f, 'w', encoding='utf-8').write(n)
for f in ['index.html', 'configure.html', '404.html']:
    p = os.path.join(ROOT, f); s = open(p, encoding='utf-8').read()
    n = re.sub(r'((?:src|href)="/?assets/(?:[\w-]+\.js|site\.css))(\?v=[0-9a-f]+)?"', rf'\1?v={h}"', s)
    if n != s: open(p, 'w', encoding='utf-8').write(n)
print('version', h)
