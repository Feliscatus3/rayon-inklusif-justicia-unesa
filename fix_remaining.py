#!/usr/bin/env python3
"""Fix remaining asset issues."""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))

def process(path, replacements):
    rel = os.path.relpath(path, ROOT)
    try:
        content = open(path, encoding='utf-8', errors='ignore').read()
    except Exception as e:
        print(f'ERROR reading {rel}: {e}')
        return
    orig = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != orig:
        try:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'FIXED: {rel}')
        except Exception as e:
            print(f'ERROR writing {rel}: {e}')
    else:
        print(f'NO CHANGE: {rel}')

# 1. publikasi.js - fix double asset path
publikasi = os.path.join(ROOT, 'public', 'assets', 'js', 'publikasi.js')
process(publikasi, [
    ('href="./assets/file/${item.file}"', 'href="${item.file}"'),
])

# 2. Fix hai.png og:image references to real logo RAYON.png
for root, dirs, files in os.walk(os.path.join(ROOT, 'public')):
    for f in files:
        if not f.endswith('.html'):
            continue
        path = os.path.join(root, f)
        process(path, [
            ('./assets/img/hai.png', './assets/img/logo/RAYON.png'),
            ('../assets/img/hai.png', '../assets/img/logo/RAYON.png'),
        ])

print('DONE')
