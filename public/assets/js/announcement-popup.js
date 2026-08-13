/**
 * Global Announcement Popup — Kader Panel PMII Rayon Inklusif Justicia
 *
 * Reusable, self-contained client-side popup that shows the newest published
 * announcement the current (authenticated) user has not seen yet.
 *
 * - Auth:  GET /api/auth/me   (silently aborts if not authenticated)
 * - Data:  GET /api/announcements  (existing API, no new serverless functions)
 * - Read tracking: localStorage key `announcement_seen_<userId>` (per-account)
 * - Newest unseen announcement first; subsequent ones shown one at a time
 *   after the user closes the previous popup.
 * - Rich text is sanitized client-side (no script, iframe, event-handler
 *   attributes, or javascript: URLs are allowed).
 *
 * Pages include this file with a plain <script> tag. It builds its own DOM
 * using the .announcement-popup-* namespace so it never collides with the
 * existing .modal/.mc/.mod system.
 */
(function () {
  'use strict';

  var SEEN_PREFIX = 'announcement_seen_';
  var isOpen = false;
  var queue = [];
  var userId = null;
  var currentAnn = null;
  var popupEl = null;
  var contentEl = null;

  var ALLOWED_TAGS = {
    P: 1, BR: 1, B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1,
    H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1,
    UL: 1, OL: 1, LI: 1, A: 1, IMG: 1, BLOCKQUOTE: 1, CODE: 1, PRE: 1,
    SPAN: 1, DIV: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1
  };
  var DROP_TAGS = {
    SCRIPT: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, STYLE: 1, LINK: 1, META: 1,
    FORM: 1, INPUT: 1, BUTTON: 1, TEXTAREA: 1, SELECT: 1, OPTION: 1,
    VIDEO: 1, AUDIO: 1, SOURCE: 1, FRAME: 1, FRAMESET: 1, NOSCRIPT: 1
  };
  var ALLOWED_ATTR = {
    A: ['href', 'target', 'rel', 'title'],
    IMG: ['src', 'alt', 'title', 'width', 'height']
  };
  var URL_RE = /^(https?:)?\/\//i;

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /**
   * Resolve an asset URL against the site origin so relative paths
   * (e.g. "assets/img/foto/foo.webp") never 404 and never get dropped.
   * Absolute URLs (https://…) and root-relative URLs (/assets/…) are kept as-is.
   */
  function resolveAssetUrl(src) {
    if (!src) return src;
    var v = String(src).replace(/[\u0000-\u001f\u007f\s]/g, '');
    var lv = v.toLowerCase();
    if (/^https?:/i.test(lv) || lv.indexOf('//') === 0 || lv.charAt(0) === '/' || lv.charAt(0) === '#'
      || lv.indexOf('mailto:') === 0 || lv.indexOf('data:image/') === 0) {
      return v;
    }
    return window.location.origin + '/' + v;
  }

  /**
   * Given sanitized HTML, pull the first <img> out to be used as the popup's
   * hero image. Returns { src, remaining } or null when there is no image.
   */
  function extractFirstImage(html) {
    if (!html) return null;
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    var img = tpl.content.querySelector('img');
    if (!img) return null;
    var src = img.getAttribute('src');
    if (img.parentNode) img.parentNode.removeChild(img);
    var holder = document.createElement('div');
    holder.appendChild(tpl.content);
    return { src: src, remaining: holder.innerHTML };
  }

  /**
   * Whitelist-based HTML sanitizer. Parses through a <template> (inert — no
   * scripts execute there), drops dangerous elements and attributes, unwraps
   * unknown tags and returns a cleaned HTML string.
   */
  function sanitizeHtml(html) {
    if (!html) return '';
    var tpl = document.createElement('template');
    tpl.innerHTML = String(html);

    var nodes = [];
    var walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_ELEMENT, null, false);
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (el) {
      var tag = el.tagName.toUpperCase();
      if (DROP_TAGS[tag]) {
        if (el.parentNode) el.parentNode.removeChild(el);
        return;
      }
      if (!ALLOWED_TAGS[tag]) {
        var parent = el.parentNode;
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
        }
        return;
      }
      var attrs = Array.prototype.slice.call(el.attributes || []);
      var allowed = ALLOWED_ATTR[el.tagName] || [];
      attrs.forEach(function (attr) {
        var name = attr.name.toLowerCase();
        if (name.indexOf('on') === 0 || name === 'style' || name === 'srcdoc' || name === 'formaction') {
          el.removeAttribute(attr.name);
          return;
        }
        if (allowed.indexOf(name) < 0) {
          el.removeAttribute(attr.name);
          return;
        }
        if (name === 'href' || name === 'src') {
          var v = attr.value.replace(/[\u0000-\u001f\u007f\s]/g, '').toLowerCase();
          var keep = URL_RE.test(v) || v.charAt(0) === '/' || v.charAt(0) === '#'
            || v.indexOf('mailto:') === 0 || v.indexOf('data:image/') === 0;
          if (!keep && name === 'src') {
            // Relative image path (e.g. assets/img/… or ../assets/img/…) — resolve
            // against the app origin instead of dropping the image.
            el.setAttribute('src', resolveAssetUrl(attr.value));
            return;
          }
          if (!keep) el.removeAttribute(attr.name);
        }
      });
      if (el.tagName === 'A') {
        if (!el.getAttribute('href')) el.removeAttribute('target');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    });

    var holder = document.createElement('div');
    holder.appendChild(tpl.content);
    return holder.innerHTML;
  }

  function seenIds() {
    if (!userId) return [];
    try {
      var raw = localStorage.getItem(SEEN_PREFIX + userId);
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      // Normalize to numbers so string/number id comparisons never mismatch.
      return arr.map(Number).filter(function (n) { return !isNaN(n); });
    } catch (e) {
      return [];
    }
  }

  function markSeen(id) {
    if (!userId || id == null) return;
    id = Number(id);
    try {
      var arr = seenIds();
      if (arr.indexOf(id) < 0) {
        arr.push(id);
        localStorage.setItem(SEEN_PREFIX + userId, JSON.stringify(arr));
      }
    } catch (e) { /* storage unavailable — ignore */ }
  }

  function formatDate(v) {
    if (!v) return '';
    var d = new Date(v);
    if (isNaN(d.getTime())) return '';
    try {
      return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return d.toDateString();
    }
  }

  function buildPopup() {
    if (popupEl) return popupEl;

    var wrap = document.createElement('div');
    wrap.className = 'announcement-popup';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');

    var overlay = document.createElement('div');
    overlay.className = 'announcement-popup-overlay';

    var dialog = document.createElement('div');
    dialog.className = 'announcement-popup-dialog';

    var header = document.createElement('div');
    header.className = 'announcement-popup-header';
    var hTitle = document.createElement('h3');
    hTitle.innerHTML = '<i class="fas fa-bullhorn"></i> <span>Pengumuman Terbaru</span>';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'announcement-popup-close';
    closeBtn.setAttribute('aria-label', 'Tutup pengumuman');
    closeBtn.innerHTML = '&times;';
    header.appendChild(hTitle);
    header.appendChild(closeBtn);

    var body = document.createElement('div');
    body.className = 'announcement-popup-body';

    var footer = document.createElement('div');
    footer.className = 'announcement-popup-footer';
    var closeBtn2 = document.createElement('button');
    closeBtn2.type = 'button';
    closeBtn2.className = 'announcement-popup-btn';
    closeBtn2.textContent = 'Tutup';
    footer.appendChild(closeBtn2);

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    wrap.appendChild(overlay);
    wrap.appendChild(dialog);
    document.body.appendChild(wrap);

    popupEl = wrap;
    contentEl = body;

    overlay.addEventListener('click', dismiss);
    closeBtn.addEventListener('click', dismiss);
    closeBtn2.addEventListener('click', dismiss);

    return wrap;
  }

  function renderBody(ann) {
    var h = '';
    // Resolve the hero image the same way the API actually provides it:
    // there is no dedicated image column on announcements, so the image lives
    // inside the rich-text `content` as an <img> element.
    var cleanContent = sanitizeHtml(ann.content || '');
    var hero = extractFirstImage(cleanContent);
    var heroSrc = '';
    if (ann.image_url) {
      heroSrc = ann.image_url;
    } else if (ann.photo || ann.photo_url) {
      heroSrc = ann.photo || ann.photo_url;
    } else if (ann.thumbnail) {
      heroSrc = ann.thumbnail;
    } else if (ann.foto_url) {
      heroSrc = ann.foto_url;
    } else if (hero && hero.src) {
      heroSrc = hero.src;
      cleanContent = hero.remaining;
    }
    if (heroSrc) {
      h += '<img class="announcement-popup-img" src="' + escapeHtml(resolveAssetUrl(heroSrc))
        + '" alt="' + escapeHtml(ann.title || 'Pengumuman') + '">';
    }
    h += '<h2 class="announcement-popup-title">' + escapeHtml(ann.title || '') + '</h2>';
    h += '<div class="announcement-popup-meta">';
    if (ann.category) {
      h += '<span class="announcement-popup-cat">' + escapeHtml(ann.category) + '</span>';
    }
    h += '<span class="announcement-popup-date"><i class="far fa-calendar-alt"></i> '
      + escapeHtml(formatDate(ann.created_at)) + '</span>';
    h += '</div>';
    if (cleanContent && cleanContent.trim()) {
      h += '<div class="announcement-popup-content">' + cleanContent + '</div>';
    }
    return h;
  }

  function showAnn(ann) {
    var wrap = buildPopup();
    currentAnn = ann;
    contentEl.innerHTML = renderBody(ann);
    isOpen = true;
    wrap.classList.add('is-open');
    document.body.classList.add('announcement-popup-open');
  }

  function dismiss() {
    if (!popupEl || !isOpen) return;
    if (currentAnn && currentAnn.id != null) markSeen(currentAnn.id);
    isOpen = false;
    currentAnn = null;
    popupEl.classList.remove('is-open');
    document.body.classList.remove('announcement-popup-open');
    contentEl.innerHTML = '';
    setTimeout(function () {
      if (queue.length) showNext();
      else teardown();
    }, 200);
  }

  function showNext() {
    if (!queue.length) {
      teardown();
      return;
    }
    showAnn(queue.shift());
  }

  function teardown() {
    if (popupEl && popupEl.parentNode) popupEl.parentNode.removeChild(popupEl);
    popupEl = null;
    contentEl = null;
    document.body.classList.remove('announcement-popup-open');
  }

  function run() {
    if (!userId || isOpen) return;
    fetch('/api/announcements', { credentials: 'include' })
      .then(function (r) {
        if (!r.ok) throw new Error('failed to load announcements');
        return r.json();
      })
      .then(function (d) {
        var list = (d && (d.announcements || (Array.isArray(d) ? d : null))) || [];
        var seen = seenIds();
        queue = list.filter(function (a) {
          return a && a.id != null && seen.indexOf(Number(a.id)) < 0;
        });
        queue.sort(function (a, b) {
          var ta = new Date(a.created_at).getTime() || 0;
          var tb = new Date(b.created_at).getTime() || 0;
          return (tb - ta) || ((b.id || 0) - (a.id || 0));
        });
        if (queue.length) showNext();
      })
      .catch(function () { /* silent — never break the page */ });
  }

  function init() {
    var started = false;
    function start() {
      if (started) return;
      started = true;
      // Let the page finish rendering first, then check for announcements.
      setTimeout(function () {
        fetch('/api/auth/me', { credentials: 'include' })
          .then(function (r) { return r.json().catch(function () { return {}; }); })
          .then(function (d) {
            if (!d || !d.authenticated || !d.user || !d.user.id) return;
            userId = d.user.id;
            run();
          })
          .catch(function () { /* silent */ });
      }, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) dismiss();
    });
  }

  init();
})();
