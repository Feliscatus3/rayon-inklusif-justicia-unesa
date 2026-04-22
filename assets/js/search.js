// Fungsi pencarian berita
function initSearch() {
  const searchForm = document.querySelector('form[role="search"]');
  const searchInput = searchForm ? searchForm.querySelector('input[type="search"]') : null;
  
  if (!searchForm || !searchInput) return;
  
  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = searchInput.value.toLowerCase().trim();
    
    if (query === '') {
      currentPage = 1;
      // Show featured berita again when search is cleared
      const heroFeaturedContainer = document.getElementById('hero-featured');
      if (heroFeaturedContainer) heroFeaturedContainer.style.display = '';
      displayFeaturedBerita();
      displayBerita(currentPage);
      generatePagination();
      return;
    }
    
    const filteredBerita = beritaData.filter(berita => {
      return berita.title.toLowerCase().includes(query) || 
             berita.excerpt.toLowerCase().includes(query);
    });
    
    displaySearchResults(filteredBerita, query);
  });
  
  searchInput.addEventListener('input', function() {
    const query = searchInput.value.toLowerCase().trim();
    if (query.length >= 3) {
      const filteredBerita = beritaData.filter(berita => {
        return berita.title.toLowerCase().includes(query) || 
               berita.excerpt.toLowerCase().includes(query);
      });
      displaySearchResults(filteredBerita, query);
    } else if (query.length === 0) {
      currentPage = 1;
      // Show featured berita again when search is cleared
      const heroFeaturedContainer = document.getElementById('hero-featured');
      if (heroFeaturedContainer) heroFeaturedContainer.style.display = '';
      displayFeaturedBerita();
      displayBerita(currentPage);
      generatePagination();
    }
  });
}

function displaySearchResults(results, query) {
  const beritaContainer = document.getElementById('berita-list');
  if (!beritaContainer) return;
  
  // Hide only the featured berita row, keep title row visible
  const heroFeaturedContainer = document.getElementById('hero-featured');
  const featuredContainer = document.getElementById('main-featured');
  const sideFeaturedContainer = document.getElementById('side-featured');
  
  // Hide only the featured berita row (contains the images)
  if (heroFeaturedContainer) heroFeaturedContainer.style.display = 'none';
  // Also hide the individual featured containers as fallback
  if (featuredContainer) featuredContainer.style.display = 'none';
  if (sideFeaturedContainer) sideFeaturedContainer.style.display = 'none';
  
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
  
  const paginationContainer = document.getElementById('pagination-container');
  if (paginationContainer) paginationContainer.innerHTML = '';
}

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initSearch();
});
