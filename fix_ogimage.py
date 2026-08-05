#!/usr/bin/env python3
"""Fix og:image / twitter:image references in nested pages."""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(ROOT, 'public')

def process(path):
    rel = os.path.relpath(path, ROOT)
    try:
        content = open(path, encoding='utf-8', errors='ignore').read()
    except Exception as e:
        print(f'ERROR reading {rel}: {e}')
        return
    orig = content
    content = content.replace(
        'content="./assets/img/', 'content="../assets/img/'
    )
    content = content.replace(
        'content="./assets/', 'content="../assets/'
    )
    if content != orig:
        try:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'FIXED: {rel}')
        except Exception as e:
            print(f'ERROR writing {rel}: {e}')
    else:
        print(f'NO CHANGE: {rel}')

for sub in ['pages', 'berita']:
    d = os.path.join(PUBLIC, sub)
    if not os.path.isdir(d):
        continue
    for f in os.listdir(d):
        if f.endswith('.html'):
            process(os.path.join(d, f))

print('DONE')
