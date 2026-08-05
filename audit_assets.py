#!/usr/bin/env python3
"""
Complete Asset Audit Script
Scans all HTML, CSS, JS for image references and verifies existence.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
IGNORE_DIRS = {'node_modules', '.git', 'sql', 'lib', 'api', 'scripts'}
EXTENSIONS = ('.html', '.css', '.js')
IMAGE_EXT = re.compile(r'\.(?:png|jpe?g|gif|svg|webp|ico|avif|bmp|file)', re.I)

# Patterns to find image references
PATTERNS = [
    # src="..." / href="..." / content="..."
    re.compile(r'(?:src|href|content|data-src|poster)\s*=\s*["\']([^"\']+)["\']', re.I),
    # url(...)
    re.compile(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)', re.I),
    # JS fetch/string of image paths
    re.compile(r'["\'](/[^"\']*\.(?:png|jpe?g|gif|svg|webp|ico))["\']', re.I),
]

def collect_refs():
    """Collect all image references across project."""
    refs = []  # (file_path, ref, pattern_type)
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
            for pat in PATTERNS:
                for m in pat.finditer(content):
                    ref = m.group(1).strip()
                    if not IMAGE_EXT.search(ref):
                        continue
                    refs.append((rel, ref))
    return refs

def resolve_path(base_file, ref):
    """Resolve a reference to a filesystem path."""
    if ref.startswith(('http://', 'https://', '//', 'data:')):
        return None, 'EXTERNAL'
    # Strip query/hash
    ref = ref.split('?')[0].split('#')[0]
    if not ref:
        return None, 'EMPTY'
    if ref.startswith('/'):
        # Absolute from public root
        candidate = os.path.join(ROOT, 'public', ref.lstrip('/'))
        if os.path.exists(candidate):
            return candidate, 'OK'
        return candidate, 'MISSING'
    # Relative
    base_dir = os.path.dirname(os.path.join(ROOT, base_file))
    candidate = os.path.normpath(os.path.join(base_dir, ref))
    if os.path.exists(candidate):
        return candidate, 'OK'
    return candidate, 'MISSING'

def main():
    refs = collect_refs()
    unique = sorted(set(refs))
    print("=" * 80)
    print("COMPLETE ASSET AUDIT")
    print(f"Total unique image references: {len(unique)}")
    print("=" * 80)

    broken = []
    ok = 0
    external = 0
    for base, ref in unique:
        cand, status = resolve_path(base, ref)
        if status == 'EXTERNAL':
            external += 1
            continue
        if status == 'OK':
            ok += 1
        else:
            broken.append((base, ref, cand))
            print(f"BROKEN: [{base}] -> {ref}")
            print(f"        expected at: {cand}")

    print("=" * 80)
    print(f"OK: {ok}, EXTERNAL: {external}, BROKEN: {len(broken)}")
    if broken:
        print("\n--- BROKEN LIST ---")
        for base, ref, cand in broken:
            print(f"{base}|{ref}")
    return 0 if not broken else 1

if __name__ == '__main__':
    sys.exit(main())

