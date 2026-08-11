/* ============================================
   Kalender Kegiatan — Public
   Data: GET /api/events (public, no session)
   ============================================ */
(function () {
  'use strict';

  var MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  var DEFAULT_COLORS = { PMII: '#d32f2f', Rayon: '#1a237e', Komisariat: '#2e7d32', BEM: '#e65100', DPM: '#6a1b9a', Faculty: '#00695c', University: '#37474f', External: '#c62828' };

  var today = new Date();
  var current = new Date(today.getFullYear(), today.getMonth(), 1);
  var allEvents = [];
  var activeCat = '';

  function getEl(id) { return document.getElementById(id); }

  function pad(n) { return String(n).padStart(2, '0'); }

  function dateStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function colorOf(e) {
    if (e && e.color) return e.color;
    if (e && e.category && DEFAULT_COLORS[e.category]) return DEFAULT_COLORS[e.category];
    return '#1a237e';
  }

  function fmtDate(iso) {
    try {
      var d = new Date(iso);
      return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    } catch (e) { return iso; }
  }

  function fmtTime(t) {
    if (!t) return '--:--';
    return String(t).substring(0, 5);
  }

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function filtered() {
    return activeCat ? allEvents.filter(function (e) { return e.category === activeCat; }) : allEvents;
  }

  async function load() {
    var grid = getEl('k-grid');
    var evBox = getEl('k-events');
    grid.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-hourglass-split me-2"></i>Memuat kalender...</div>';
    evBox.innerHTML = '';
    try {
      var month = current.getMonth() + 1;
      var year = current.getFullYear();
      var r = await fetch('/api/events?month=' + month + '&year=' + year, { credentials: 'same-origin' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      allEvents = await r.json();
      renderFilters();
      render();
    } catch (err) {
      grid.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-exclamation-triangle me-2"></i>Gagal memuat kalender. Coba lagi nanti.</div>';
    }
  }

  function renderFilters() {
    var wrap = getEl('k-cat-filter');
    var cats = [];
    allEvents.forEach(function (e) { if (e.category && cats.indexOf(e.category) < 0) cats.push(e.category); });
    cats.sort();
    var h = '<span class="fw-semibold me-1"><i class="bi bi-funnel me-1"></i>Kategori:</span>';
    h += '<button class="btn btn-sm ' + (activeCat === '' ? 'btn-primary' : 'btn-outline-primary') + '" data-cat="">Semua</button>';
    for (var i = 0; i < cats.length; i++) {
      h += '<button class="btn btn-sm ' + (activeCat === cats[i] ? 'btn-primary' : 'btn-outline-primary') + '" data-cat="' + esc(cats[i]) + '">' + esc(cats[i]) + '</button>';
    }
    wrap.innerHTML = h;
    var btns = wrap.querySelectorAll('[data-cat]');
    for (var j = 0; j < btns.length; j++) {
      btns[j].addEventListener('click', function () {
        activeCat = this.getAttribute('data-cat');
        renderFilters();
        render();
      });
    }
  }

  function render() {
    var grid = getEl('k-grid');
    var label = getEl('k-month-label');
    var y = current.getFullYear();
    var m = current.getMonth();
    label.textContent = MONTHS[m] + ' ' + y;
    label.className = 'text-uppercase fw-bold fs-4 mb-0';

    var events = filtered();
    var firstDay = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var daysInPrev = new Date(y, m, 0).getDate();
    var todayStr = dateStr(today);

    var h = '<div class="k-head">Min</div><div class="k-head">Sen</div><div class="k-head">Sel</div><div class="k-head">Rab</div><div class="k-head">Kam</div><div class="k-head">Jum</div><div class="k-head">Sab</div>';

    for (var i = firstDay - 1; i >= 0; i--) {
      h += '<div class="k-cell k-muted"><div class="k-num">' + (daysInPrev - i) + '</div></div>';
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var ds = y + '-' + pad(m + 1) + '-' + pad(d);
      var dayEvents = events.filter(function (e) { return String(e.event_date) === ds; });
      var isToday = (ds === todayStr);
      h += '<div class="k-cell' + (isToday ? ' k-today' : '') + '">';
      h += '<div class="k-num">' + d + '</div>';
      for (var j = 0; j < Math.min(dayEvents.length, 2); j++) {
        h += '<button class="k-chip" style="background:' + colorOf(dayEvents[j]) + '" data-id="' + dayEvents[j].id + '" type="button">' + esc(dayEvents[j].title) + '</button>';
      }
      if (dayEvents.length > 2) h += '<div class="k-more">+' + (dayEvents.length - 2) + ' lagi</div>';
      h += '</div>';
    }

    var totalCells = firstDay + daysInMonth;
    var trailing = (7 - (totalCells % 7)) % 7;
    for (var k = 1; k <= trailing; k++) {
      h += '<div class="k-cell k-muted"><div class="k-num">' + k + '</div></div>';
    }

    grid.innerHTML = h;

    var chips = grid.querySelectorAll('.k-chip');
    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener('click', function () { showDetail(this.getAttribute('data-id')); });
    }

    renderUpcoming(events);
  }

  function renderUpcoming(events) {
    var box = getEl('k-events');
    var todayStr = dateStr(today);
    var upcoming = events.filter(function (e) { return String(e.event_date) >= todayStr; })
      .sort(function (a, b) { return a.event_date > b.event_date ? 1 : (a.event_date < b.event_date ? -1 : 0); });

    var h = '<h3 class="mb-3"><i class="bi bi-calendar-event me-2"></i>Agenda Mendatang</h3>';
    if (upcoming.length === 0) {
      h += '<p class="text-muted">Tidak ada agenda mendatang pada kategori ini.</p>';
    } else {
      h += '<div class="row g-3">';
      for (var i = 0; i < Math.min(upcoming.length, 6); i++) {
        var e = upcoming[i];
        h += '<div class="col-md-6 col-lg-4">';
        h += '<div class="card h-100 border-0 shadow k-upc">';
        h += '<div class="k-up-badge" style="background:' + colorOf(e) + '"></div>';
        h += '<div class="card-body">';
        h += '<div class="mb-2"><span class="badge text-bg-light border">' + esc(e.category) + '</span></div>';
        h += '<h5 class="card-title">' + esc(e.title) + '</h5>';
        h += '<p class="card-text small mb-1"><i class="bi bi-calendar me-1"></i>' + fmtDate(e.event_date) + ' &middot; ' + fmtTime(e.event_time) + '</p>';
        if (e.location) h += '<p class="card-text small mb-1"><i class="bi bi-geo-alt me-1"></i>' + esc(e.location) + '</p>';
        if (e.description) h += '<p class="card-text text-muted small">' + esc(e.description.length > 90 ? e.description.substring(0, 90) + '...' : e.description) + '</p>';
        h += '</div></div></div>';
      }
      h += '</div>';
    }
    box.innerHTML = h;
  }

  function showDetail(id) {
    var e = null;
    for (var i = 0; i < allEvents.length; i++) { if (String(allEvents[i].id) === String(id)) { e = allEvents[i]; break; } }
    if (!e) return;
    var modal = document.createElement('div');
    modal.className = 'modal fade show d-block';
    modal.style.background = 'rgba(0,0,0,.5)';
    modal.innerHTML =
      '<div class="modal-dialog modal-dialog-centered">' +
      '<div class="modal-content">' +
      '<div class="modal-header" style="border-bottom:4px solid ' + colorOf(e) + '">' +
      '<h5 class="modal-title">' + esc(e.title) + '</h5>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button>' +
      '</div>' +
      '<div class="modal-body">' +
      '<p class="mb-1"><i class="bi bi-calendar me-2"></i>' + fmtDate(e.event_date) + ' &middot; ' + fmtTime(e.event_time) + '</p>' +
      '<p class="mb-1"><i class="bi bi-tag me-2"></i><span class="badge text-bg-light border">' + esc(e.category) + '</span></p>' +
      (e.location ? '<p class="mb-1"><i class="bi bi-geo-alt me-2"></i>' + esc(e.location) + '</p>' : '') +
      (e.description ? '<hr><p class="mb-0">' + esc(e.description) + '</p>' : '') +
      '</div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button></div>' +
      '</div></div>';
    document.body.appendChild(modal);
    function close() { modal.remove(); document.removeEventListener('keydown', escKey, true); }
    function escKey(ev) { if (ev.key === 'Escape') close(); }
    modal.addEventListener('click', function (ev) { if (ev.target === modal) close(); });
    modal.querySelector('.btn-close').addEventListener('click', close);
    modal.querySelector('.modal-footer .btn').addEventListener('click', close);
    document.addEventListener('keydown', escKey, true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    getEl('k-prev').addEventListener('click', function () {
      current.setMonth(current.getMonth() - 1);
      load();
    });
    getEl('k-next').addEventListener('click', function () {
      current.setMonth(current.getMonth() + 1);
      load();
    });
    getEl('k-today').addEventListener('click', function () {
      current = new Date(today.getFullYear(), today.getMonth(), 1);
      load();
    });
    load();
  });
})();
