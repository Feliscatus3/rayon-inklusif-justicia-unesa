#!/usr/bin/env python3
"""
Comprehensive Asset Path Repair Script
Fixes all `/public/...` references in HTML/CSS/JS files.

On Vercel, the `public/` directory is the web root, so:
- /public/assets/img/...  ->  /assets/img/...  (correct)
- /public/pages/...       ->  /pages/...       (correct)
- /public/css/...         ->  /css/...         (correct)
- /public/js/...          ->  /js/...          (correct)
- /public/berita/...      ->  /berita/...      (correct)
- /public/uploads/...     ->  /uploads/...     (correct)

Also removes `./public/` and `public/` relative prefixes.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
IGNORE_DIRS = {'node_modules', '.git', 'sql', 'lib'}
EXTENSIONS = ('.html', '.css', '.js', '.json')

# Patterns to fix: /public/... in src, href, url(), content, JS strings
PATTERNS = [
    (re.compile(r'(["\'(=:\s])/public/(assets|pages|css|js|berita|uploads|files?)/'), r'\1/\2/'),
    (re.compile(r'(["\'(=:\s])\./public/(assets|pages|css|js|berita|uploads|files?)/'), r'\1/\2/'),
    (re.compile(r'(["\'(=:\s])public/(assets|pages|css|js|berita|uploads|files?)/'), r'\1/\2/'),
]

changed_files = []
total_fixes = 0

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
    for fname in files:
        if not fname.lower().endswith(EXTENSIONS):
            continue
        fpath = os.path.join(root, fname)
        rel = os.path.relpath(fpath, ROOT)
        try:
            content = open(fpath, encoding='utf-8', errors='ignore').read()
        except Exception:
            continue

        orig = content
        fix_count = 0
        for pat, repl in PATTERNS:
            content, n = pat.subn(repl, content)
            fix_count += n

        if content != orig:
            try:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(content)
                changed_files.append((rel, fix_count))
                total_fixes += fix_count
                print(f'FIXED ({fix_count}): {rel}')
            except Exception as e:
                print(f'ERROR: {rel}: {e}')

print('=' * 70)
print(f'TOTAL FIXES: {total_fixes}')
print(f'FILES CHANGED: {len(changed_files)}')
for rel, n in changed_files:
    print(f'  {n}x {rel}')

