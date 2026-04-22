// Data berita - array berisi semua berita
const beritaData = [
  {
    id: 1,
    title: "Studi Banding Kolaborasi Rayon Hukum: Merajut Sinergi, Menguatkan Gerakan Progresif",
    excerpt: "Kesimpulan Kolaborasi Study Banding PMII Rayon Hukum",
    date: "Jumat, 31 Oktober 2025",
    image: "/assets/img/foto/STUDI_BANDING_KOLABORARI.webp",
    link: "/berita/studi-banding-pmii-hukum-surabaya.html",
    featured: true
  },
  {
    id: 2,
    title: "RTAR 1 Inklusif Justicia: Dari Evaluasi Menuju Aksi",
    excerpt: "Rapat Kerja dan Evaluasi Rayon PMII Rayon Inklusif Justicia UNESA",
    date: "29-30 Januari 2026",
    image: "/assets/img/foto/RTAR I_20260225_180804_0020.webp",
    link: "/berita/rtar-1-rayon-inklusif-justicia.html",
    featured: true
  },
  {
    id: 3,
    title: "Simposium Sekolah Kaderisasi Nasional: Merajut Kaderisasi, Memperkuat Pergerakan",
    excerpt: "Simposium Sekolah Kaderisasi Nasional berlangsung diskusi mendalam",
    date: "15-17 Agustus 2025",
    image: "/assets/img/foto/SIMPOSIUM_20260225_180803_0017.webp",
    link: "/berita/simposium-sekolah-kaderisasi-nasional.html",
    featured: true
  },
  {
    id: 4,
    title: "MAPABA PMII Rayon Persiapan Justicia: Menyambut Generasi Baru",
    excerpt: "Masa Penerimaan Anggota Baru PMII Rayon Persiapan Justicia UNESA",
    date: "14-16 November 2025",
    image: "/assets/img/foto/MAPABA 1 (2)_20260225_180801_0014.webp",
    link: "/berita/mapaba-1-rayon-inklusif-justicia-unesa.html",
    featured: false
  },
  {
    id: 5,
    title: "Harmoni Pergerakan: Menyatukan Suara, Menguatkan Solidaritas",
    excerpt: "Kesenian dan pergerakan memperkuat solidaritas antar kader PMII",
    date: "20 September 2025",
    image: "/assets/img/foto/HARMONI PERGERAKAN_20260225_180759_0010.webp",
    link: "/berita/harmoni-pergerakan-1.html",
    featured: false
  },
  {
    id: 6,
    title: "Sekolah Kaderisasi: Membentuk Kader yang Berdaya",
    excerpt: "Program Schools Kaderisasi untuk membentuk kader-kader PMII",
    date: "5-7 Juli 2025",
    image: "/assets/img/foto/SEKOLAH KADERISASI_20260225_180803_0016.webp",
    link: "/berita/sekolah-kaderisasi-1.html",
    featured: false
  },
  {
    id: 7,
    title: "Safari Religi Ziarah Sunan Ampel: Menyentuh Akar Spiritual",
    excerpt: "Safari religi dengan ziarah ke makam Sunan Ampel",
    date: "10 Mei 2025",
    image: "/assets/img/foto/SAFARI RELIGI_20260225_180754_0000.webp",
    link: "/berita/safari-religi-ziarah-sunan-ampel.html",
    featured: false
  },
  {
    id: 8,
    title: "Rapat Kerja dan Buka Bersama: Optimalisasi Pergerakan",
    excerpt: "Rapat kerja kepengurangan disertai buka bersama",
    date: "25 Maret 2025",
    image: "/assets/img/foto/RAKER & BUKBER_20260225_180755_0003.webp",
    link: "/berita/rapat-kerja-dan-buka-bersama-optimalisasi-pergerakan.html",
    featured: false
  },
  {
    id: 9,
    title: "Pesantren Pergerakan Vol. 1: Memperkuat Basis Keagamaan",
    excerpt: "Pesantren pergerakan untuk memperkuat pemahaman keagamaan",
    date: "15 Februari 2025",
    image: "/assets/img/foto/PESANTREN PERGERAKAN_20260225_180756_0008.webp",
    link: "/berita/pesantren-pergerakan-vol-1.html",
    featured: false
  },
  {
    id: 10,
    title: "Ngobrol Perkara Islam: Gerakan Purifikasi",
    excerpt: "Diskusi santai tentang perkembangan Islam dan tantangan modern",
    date: "8 Januari 2025",
    image: "/assets/img/foto/NGOPI_20260225_180756_0006.webp",
    link: "/berita/ngobrol-perkara-islam-gerakan-purifikasi.html",
    featured: false
  },
  {
    id: 11,
    title: "Kajian Cipayung FH UNESA: Neo Orba dan Demokrasi",
    excerpt: "Kajian kritis tentang Neo Orba dan tantangan demokrasi",
    date: "20 Desember 2024",
    image: "/assets/img/foto/KAJIAN CIPAYUNG FH UNESA_20260225_180755_0002.webp",
    link: "/berita/kajian-cipayung-fh-unesa-neo-orba.html",
    featured: false
  },
  {
    id: 12,
    title: "Akademi Pergerakan 1: Overcoming Stage Fright",
    excerpt: "Pelatihan public speaking dan mengatasi rasa takut berbicara",
    date: "5 November 2024",
    image: "/assets/img/foto/AKADEMI PERGERAKAN 1_20260225_180755_0001.webp",
    link: "/berita/akademi-pergerakan-1-overcoming-stage-fright.html",
    featured: false
  },
  {
    id: 13,
    title: "Harlah PMII 65: Halal Bihalal Rayon Justicia Sosial UNESA",
    excerpt: "Peringatan Harlah PMII ke-65 dan halal bihalal",
    date: "10 Oktober 2024",
    image: "/assets/img/foto/HARLAH PMII & HALAL BIHALAL_20260225_180755_0005.webp",
    link: "/berita/harlah-pmii-65-halal-bihalal-rayon-justicia-sosial-unesa.html",
    featured: false
  },
  {
    id: 14,
    title: "Diskusi Panel Jejak Kartini: Perempuan dan Pergerakan",
    excerpt: "Diskusi panel tentang peran perempuan dalam pergerakan",
    date: "21 April 2024",
    image: "/assets/img/foto/HARMONI PERGERAKAN (2)_20260225_180800_0011.webp",
    link: "/berita/diskusi-panel-jejak-kartini.html",
    featured: false
  },
  {
    id: 15,
    title: "Sekolah Digital Jilid 1: Penguatan Kapasitas Digital",
    excerpt: "Program Schools Digital untuk meningkatkan kapasitas digital",
    date: "15 Maret 2024",
    image: "/assets/img/foto/SEKOLAH DIGITAL_20260225_180756_0007.webp",
    link: "/berita/sekolah-digital-jilid-1.html",
    featured: false
  },
  {
    id: 16,
    title: "Kajian Inspiratif: Membangun Mentalitas Kader",
    excerpt: "Kajian inspiratif untuk membangun mentalitas kader",
    date: "10 Februari 2024",
    image: "/assets/img/foto/KAJIAN INSPIRATIF_20260225_180756_0009.webp",
    link: "/berita/diskusi-panel-jejak-kartini.html",
    featured: false
  },
  {
    id: 17,
    title: "Harmoni Pergerakan 2: Solidaritas dan Kreativitas",
    excerpt: "Harmoni Pergerakan kedua untuk memperkuat solidaritas",
    date: "20 November 2023",
    image: "/assets/img/foto/HARMONI PERGERAKAN (3)_20260225_180800_0012.webp",
    link: "/berita/harmoni-pergerakan-1.html",
    featured: false
  },
  {
    id: 18,
    title: "Studi Banding Kolaborasi: Memperkuat Jaringan",
    excerpt: "Studies banding dengan rayon hukum lain",
    date: "10 Oktober 2023",
    image: "/assets/img/foto/STUBA KOLABORASI (2)_20260225_180804_0019.webp",
    link: "/berita/studi-banding-pmii-hukum-surabaya.html",
    featured: false
  }
];

// Konfigurasi pagination
const itemsPerPage = 6;
let currentPage = 1;

// Fungsi untuk mendapatkan berita non-featured (untuk daftar berita)
function getNonFeaturedBerita() {
  return beritaData.filter(berita => !berita.featured);
}

// Fungsi untuk mendapatkan berita featured (untuk hero section)
function getFeaturedBerita() {
  return beritaData.filter(berita => berita.featured);
}

// Fungsi untuk menampilkan berita pada halaman tertentu
function displayBerita(page) {
  const beritaContainer = document.getElementById('berita-list');
  if (!beritaContainer) return;
  
  const nonFeatured = getNonFeaturedBerita();
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const beritaToShow = nonFeatured.slice(startIndex, endIndex);
  
  let html = '';
  beritaToShow.forEach(berita => {
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
}

// Fungsi untuk generate pagination buttons
function generatePagination() {
  const paginationContainer = document.getElementById('pagination-container');
  if (!paginationContainer) return;
  
  const nonFeatured = getNonFeaturedBerita();
  const totalPages = Math.ceil(nonFeatured.length / itemsPerPage);
  
  let html = `
    <nav aria-label="Page navigation">
      <ul class="pagination justify-content-center">
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link scale-up" href="#" onclick="goToPage(${currentPage - 1}); return false;" tabindex="-1" aria-disabled="${currentPage === 1 ? 'true' : 'false'}">Previous</a>
        </li>
  `;
  
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${i === currentPage ? 'active' : ''}" aria-current="${i === currentPage ? 'page' : ''}">
        <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
      </li>
    `;
  }
  
  html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link scale-up" href="#" onclick="goToPage(${currentPage + 1}); return false;">Next</a>
        </li>
      </ul>
    </nav>
  `;
  
  paginationContainer.innerHTML = html;
}

// Fungsi untuk pindah ke halaman tertentu
function goToPage(page) {
  const nonFeatured = getNonFeaturedBerita();
  const totalPages = Math.ceil(nonFeatured.length / itemsPerPage);
  
  if (page < 1 || page > totalPages) return;
  
  currentPage = page;
  displayBerita(currentPage);
  generatePagination();
  
  // Scroll ke bagian berita
  const beritaSection = document.getElementById('berita-terbaru');
  if (beritaSection) {
    beritaSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// Fungsi untuk menampilkan featured berita di hero section
function displayFeaturedBerita() {
  const featured = getFeaturedBerita();
  
  // Main featured (berita pertama)
  const mainFeatured = featured[0];
  const mainFeaturedContainer = document.getElementById('main-featured');
  if (mainFeaturedContainer && mainFeatured) {
    mainFeaturedContainer.innerHTML = `
      <div class="card text-white border-0 overflow-hidden h-100">
        <img src="${mainFeatured.image}" alt="${mainFeatured.title}" class="card-img" style="height: 500px; object-fit: cover" />
        <div class="card-img-overlay img-bg-shadow d-flex flex-column justify-content-end p-3 p-md-4">
          <h3 class="card-title news-text text-capitalize fs-2 fs-md-1 mb-2 mb-md-3">${mainFeatured.title}</h3>
          <div class="d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-calendar-event fs-6 fs-md-5"></i>
            <span class="card-subtitle fs-6 fs-md-5">${mainFeatured.date}</span>
          </div>
          <a href="${mainFeatured.link}" class="btn btn-light btn-sm text-capitalize align-self-start fs-md-5 py-2 px-3">baca selengkapnya<i class="bi bi-chevron-right ms-1"></i></a>
        </div>
      </div>
    `;
  }
  
  // Side featured (berita kedua dan ketiga)
  const sideFeatured = featured.slice(1, 3);
  const sideFeaturedContainer = document.getElementById('side-featured');
  if (sideFeaturedContainer && sideFeatured.length > 0) {
    let html = '<div class="row h-100 g-3">';
    sideFeatured.forEach(berita => {
      html += `
        <div class="col-12">
          <div class="card text-white border-0 h-100 overflow-hidden">
            <img src="${berita.image}" alt="${berita.title}" class="card-img" style="height: 240px; object-fit:cover">
            <div class="card-img-overlay img-bg-shadow d-flex flex-column justify-content-end p-3">
              <h5 class="card-title news-text fs-5 fs-md-6 mb-2">${berita.title}</h5>
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="bi bi-calendar-event fs-7 fs-md-6"></i>
                <span class="card-subbtitle fs-7 fs-md-6">${berita.date}</span>
              </div>
              <a href="${berita.link}" class="btn btn-light btn-sm align-self-start fs-md-5 py-1 px-2">Baca Selengkapnya<i class="bi bi-chevron-right ms-1"></i></a>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    sideFeaturedContainer.innerHTML = html;
  }
}

// Fungsi untuk mencari berita
function searchBerita(query) {
  const nonFeatured = getNonFeaturedBerita();
  if (!query || query.trim() === '') {
    return nonFeatured;
  }
  const lowerQuery = query.toLowerCase();
  return nonFeatured.filter(berita => 
    berita.title.toLowerCase().includes(lowerQuery) || 
    berita.excerpt.toLowerCase().includes(lowerQuery) ||
    berita.date.toLowerCase().includes(lowerQuery)
  );
}

// Fungsi untuk menangani input pencarian
function handleSearch(event) {
  const query = event.target.value;
  const beritaContainer = document.getElementById('berita-list');
  const paginationContainer = document.getElementById('pagination-container');
  
  if (!beritaContainer) return;
  
  currentPage = 1;
  const filtered = searchNewsletter(query);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  if (filtered.length === 0) {
    beritaContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <h4 class="text-muted">Tidak ada berita yang ditemukan</h4>
        <p class="text-muted">Coba gunakan kata kunci lain</p>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const beritaToShow = filtered.slice(startIndex, endIndex);
  
  let html = '';
  beritaToShow.forEach(berita => {
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
  
  if (paginationContainer && filtered.length > 0) {
    let paginationHtml = `
      <nav aria-label="Page navigation">
        <ul class="pagination justify-content-center">
          <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="searchGoToPage(${currentPage - 1}, '${query}'); return false;" tabindex="-1">Previous</a>
          </li>
    `;
    for (let i = 1; i <= totalPages; i++) {
      paginationHtml += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="searchGoToPage(${i}, '${query}'); return false;">${i}</a></li>`;
    }
    paginationHtml += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="searchGoToPage(${currentPage + 1}, '${query}'); return false;">Next</a></li></ul></nav>`;
    paginationContainer.innerHTML = paginationHtml;
  }
}

// Fungsi untuk pindah halaman saat pencarian
function searchGoToPage(page, query) {
  const filtered = searchNewsletter(query);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  const beritaContainer = document.getElementById('berita-list');
  if (!beritaContainer) return;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const beritaToShow = filtered.slice(startIndex, endIndex);
  let html = '';
  beritaToShow.forEach(berita => {
    html += `<div class="col-sm-6"><div class="card border-0"><a href="${berita.link}" class="text-decoration-none text-news"><img src="${berita.image}" class="card-img-top img-news rounded" alt="${berita.title}"><div class="card-body ps-0"><h3 class="card-title">${berita.title}</h3></a><p class="card-text">${berita.excerpt}</p><p class="text-muted"><i class="bi bi-calendar-event me-2"></i>${berita.date}</p></div></div></div>`;
  });
  beritaContainer.innerHTML = html;
  const paginationContainer = document.getElementById('pagination-container');
  if (paginationContainer) {
    let paginationHtml = `<nav aria-label="Page navigation"><ul class="pagination justify-content-center"><li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="searchGoToPage(${currentPage - 1}, '${query}'); return false;" tabindex="-1">Previous</a></li>`;
    for (let i = 1; i <= totalPages; i++) paginationHtml += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="searchGoToPage(${i}, '${query}'); return false;">${i}</a></li>`;
    paginationHtml += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="searchGoToPage(${currentPage + 1}, '${query}'); return false;">Next</a></li></ul></nav>`;
    paginationContainer.innerHTML = paginationHtml;
  }
  const beritaSection = document.getElementById('berita-terbaru');
  if (beritaSection) beritaSection.scrollIntoView({ behavior: 'smooth' });
}

// Inisialisasi pagination saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('berita-list')) {
    displayFeaturedBerita();
    displayBerita(currentPage);
    generatePagination();
  }
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
});
