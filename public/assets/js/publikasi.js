// Publikasi Page JS - List PDFs from assets/file/, search & pagination

// Sample publikasi data (hardcoded with real file + mocks for demo)
const publikasiData = [
  {
    id: 1,
    title: 'MODUL MAPABA 1 Rayon Justicia',
    category: 'modul',
    description: 'Modul Mapaba 1 untuk pengenalan organisasi PMII.',
    file: 'MODUL_MAPABA_1_RAYON_JUSTICIA.pdf',
    uploadDate: '2025-11-15',
    size: '2.4 MB'
  },
  {
    id: 2,
    title: 'MODUL PKD 1 Rayon Justicia (Soon)',
    category: 'modul',
    description: 'Modul PKD 1 untuk pendalaman organisasi PMII.',
    file: '#',
    uploadDate: 'Coming Soon',
    size: '$ MB'
  }
];

// Konfigurasi pagination
let currentPage = 1;
const itemsPerPage = 6;

// DOM elements
const publikasiGrid = document.getElementById('publikasi-grid');
const publikasiPagination = document.getElementById('publikasi-pagination');
const publikasiSearch = document.getElementById('publikasi-search');

// Category icons
const categoryIcons = {
  buku: 'bi-journal-bookmark',
  modul: 'bi-file-earmark-text',
  handbook: 'bi-book-half'
};

// Init
document.addEventListener('DOMContentLoaded', function() {
  renderPublikasi();
  setupSearch();
  setupUploadZone(); // Keep UI interactive even without server
});

// Render publikasi grid for current page
function renderPublikasi(data = publikasiData) {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = data.slice(start, end);
  
  let html = '';
  pageData.forEach(item => {
    const icon = categoryIcons[item.category] || 'bi-file-earmark-pdf';
    html += `
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card h-100 publikasi-card shadow-sm">
          <div class="card-body d-flex flex-column">
            <div class="publikasi-icon">
              <i class="bi ${icon} fs-1"></i>
            </div>
            <h5 class="card-title">${item.title}</h5>
            <span class="badge category-${item.category} mb-2">${item.category.toUpperCase()}</span>
            <p class="card-text text-muted flex-grow-1">${item.description}</p>
            <div class="d-flex justify-content-between align-items-center small text-muted mb-2">
              <span>${item.size}</span>
              <span>${new Date(item.uploadDate).toLocaleDateString('id-ID')}</span>
            </div>
            <a href="./assets/file/${item.file}" class="btn btn-primary w-100" download>
              <i class="bi bi-download me-1"></i>Download PDF
            </a>
          </div>
        </div>
      </div>
    `;
  });
  
  publikasiGrid.innerHTML = html;
  generatePagination(data.length);
}

// Generate pagination
function generatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) {
    publikasiPagination.innerHTML = '';
    return;
  }
  
  let html = `
    <nav aria-label="Publikasi pagination">
      <ul class="pagination justify-content-center">
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="goToPage(${currentPage - 1})">Previous</a>
        </li>
  `;
  
  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${i})">${i}</a>
    </li>`;
  }
  
  html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="goToPage(${currentPage + 1})">Next</a>
        </li>
      </ul>
    </nav>
  `;
  
  publikasiPagination.innerHTML = html;
}

// Go to page
function goToPage(page) {
  const totalPages = Math.ceil(publikasiData.length / itemsPerPage);
  if (page < 1 || page > totalPages || page === currentPage) return;
  
  currentPage = page;
  renderPublikasi();
}

// Search
function setupSearch() {
  const searchForm = publikasiSearch.closest('form');
  if (!searchForm || !publikasiSearch) return;
  
  function handleSearch() {
    const query = publikasiSearch.value.toLowerCase().trim();
    let filtered = publikasiData.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.includes(query)
    );
    
    currentPage = 1;
    renderPublikasi(filtered);
  }
  
  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    handleSearch();
  });
  
  publikasiSearch.addEventListener('input', () => {
    if (publikasiSearch.value.length >= 2 || publikasiSearch.value.length === 0) {
      handleSearch();
    }
  });
}

