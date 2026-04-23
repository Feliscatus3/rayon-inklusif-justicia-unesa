// =======================
// INIT SEARCH
// =======================
function initSearch() {
  const searchForm = document.querySelector('form[role="search"]');
  const searchInput = searchForm ? searchForm.querySelector('input[type="search"]') : null;

  if (!searchForm || !searchInput) return;

  // SUBMIT
  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    handleSearch(searchInput);
  });

  // INPUT (LIVE SEARCH)
  searchInput.addEventListener('input', function() {
    if (searchInput.value.trim().length >= 2 || searchInput.value.length === 0) {
      handleSearch(searchInput);
    }
  });
}

// =======================
// HANDLE SEARCH (SATU PINTU)
// =======================
function handleSearch(searchInput) {
  const query = searchInput.value.toLowerCase().trim();

  // RESET KE DEFAULT
  if (query === '') {
    currentPage = 1;

    const heroFeaturedContainer = document.getElementById('hero-featured');
    const featuredContainer = document.getElementById('main-featured');
    const sideFeaturedContainer = document.getElementById('side-featured');

    if (heroFeaturedContainer) heroFeaturedContainer.style.display = '';
    if (featuredContainer) featuredContainer.style.display = '';
    if (sideFeaturedContainer) sideFeaturedContainer.style.display = '';

    displayFeaturedBerita();
    displayBerita(currentPage);
    generatePagination();
    return;
  }

  const results = filterAndSortBerita(query);
  displaySearchResults(results, query);
}

// =======================
// FILTER + SORT BERITA
// =======================
function filterAndSortBerita(query) {
  const keywords = query.split(' ');

  return beritaData
    .map(berita => {
      const text = (berita.title + ' ' + berita.excerpt).toLowerCase();
      let score = 0;

      keywords.forEach(k => {
        if (berita.title.toLowerCase().includes(k)) score += 3;
        if (berita.excerpt.toLowerCase().includes(k)) score += 1;
      });

      return { ...berita, score };
    })
    .filter(b => b.score > 0)
    .sort((a, b) => {
      // prioritas relevance dulu, lalu tanggal terbaru
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.uploadDate) - new Date(a.uploadDate);
    });
}

// =======================
// DISPLAY HASIL SEARCH
// =======================
function displaySearchResults(results, query) {
  const beritaContainer = document.getElementById('berita-list');
  if (!beritaContainer) return;

  // SEMBUNYIKAN FEATURED
  const heroFeaturedContainer = document.getElementById('hero-featured');
  const featuredContainer = document.getElementById('main-featured');
  const sideFeaturedContainer = document.getElementById('side-featured');

  if (heroFeaturedContainer) heroFeaturedContainer.style.display = 'none';
  if (featuredContainer) featuredContainer.style.display = 'none';
  if (sideFeaturedContainer) sideFeaturedContainer.style.display = 'none';

  // JIKA TIDAK ADA HASIL
  if (results.length === 0) {
    beritaContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-search fs-1 text-muted"></i>
        <h4 class="mt-3">Tidak ada hasil untuk "${query}"</h4>
        <p class="text-muted">Coba kata kunci lain yang lebih spesifik</p>
      </div>
    `;

    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // RENDER HASIL
  let html = '';
  results.forEach(berita => {
    html += `
      <div class="col-sm-6">
        <div class="card border-0">
          <a href="${berita.link}" class="text-decoration-none text-news">
            <img src="${berita.image}" class="card-img-top img-news rounded" alt="${berita.title}">
            <div class="card-body ps-0">
              <h3 class="card-title">${berita.title}</h3>
          </a>
              <p class="card-text">${berita.excerpt}</p>
              <p class="text-muted">
                <i class="bi bi-calendar-event me-2"></i>${berita.date}
              </p>
          </div>
        </div>
      </div>
    `;
  });

  beritaContainer.innerHTML = html;

  // HAPUS PAGINATION SAAT SEARCH
  const paginationContainer = document.getElementById('pagination-container');
  if (paginationContainer) paginationContainer.innerHTML = '';
}

// =======================
// INIT SAAT LOAD
// =======================
document.addEventListener('DOMContentLoaded', function() {
  initSearch();
});