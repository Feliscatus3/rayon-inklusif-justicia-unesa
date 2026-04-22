// Data berita - array berisi semua berita (diurutkan berdasarkan uploadDate terbaru)
const beritaData = [
  {
    id: 1,
    title: "Studi Banding Kolaborasi Rayon Hukum: Merajut Sinergi, Menguatkan Gerakan Progresif",
    excerpt: "Kegiatan Studi Banding Kolaborasi sukses gelar sebagai ruang temu lintas rayon hukum yang mempertemukan PMII Rayon Justicia UNESA, RASYA UINSA, Hukum UNAIR, dan Hukum UPNVJT.",
    date: "Jumat, 31 Oktober 2025",
    uploadDate: "2025-10-31",
    image: "/assets/img/foto/STUDI_BANDING_KOLABORARI.webp",
    link: "/berita/studi-banding-pmii-hukum-surabaya.html",
    featured: true
  },
  {
    id: 2,
    title: "RTAR 1 \"Inklusif\" Justicia: Dari Evaluasi Menuju Aksi",
    excerpt: "Rapat Kerja dan Evaluasi Rayon (RTAR) I PMII Rayon \"Inklusif\" Justicia UNESA berlangsung produktif dengan agenda evaluasi kinerja kepengurusan dan perencanaan strategis ke depan.",
    date: "29-30 Januari 2026",
    uploadDate: "2026-01-30",
    image: "/assets/img/foto/RTAR I_20260225_180804_0020.webp",
    link: "/berita/rtar-1-rayon-inklusif-justicia.html",
    featured: true
  },
  {
    id: 3,
    title: "Safari Religi 2: Ziarah dan Refleksi Spiritual",
    excerpt: "Kegiatan safari religi kedua untuk memperdalam spiritualitas dan memperkuat nilai-nilai keislaman kader PMII.",
    date: "22 April 2026",
    uploadDate: "2026-04-22",
    image: "/assets/img/foto/SAFARI_RELIGI_2_20260422_175157_0005.webp",
    link: "/berita/safari-religi-2.html",
    featured: true
  },
  {
    id: 4,
    title: "Simposium Sekolah Kaderisasi Nasional: Merajut Kaderisasi, Memperkuat Pergerakan",
    excerpt: "Simposium Sekolah Kaderisasi Nasional yang mengusung tema \"Merajut Kaderisasi, Memperkuat Pergerakan\" berlangsung dengan diskusi mendalam tentang penguatan sistem kaderisasi PMII.",
    date: "15-17 Agustus 2025",
    uploadDate: "2025-08-17",
    image: "/assets/img/foto/SIMPOSIUM_20260225_180803_0017.webp",
    link: "/berita/simposium-sekolah-kaderisasi-nasional.html",
    featured: true
  },
  {
    id: 5,
    title: "Rapat Kerja Rayon Justicia UNESA 2026",
    excerpt: "Rapat kerja untuk perencanaan program dan evaluasi kinerja kepengurusan rayon tahun 2026.",
    date: "8 Maret 2026",
    uploadDate: "2026-01-01",
    image: "/assets/img/foto/RAKER1.webp",
    link: "/berita/rapat-kerja-rayon-justicia-unesa-2026.html",
    featured: false
  },
  {
    id: 6,
    title: "Kajian Intelektual: Menggali Ilmu dan Pemikiran",
    excerpt: "Kajian intelektual untuk mengembangkan kapasitas intelektual kader PMII.",
    date: "22 April 2026",
    uploadDate: "2026-02-01",
    image: "/assets/img/foto/KAJIAN_INTELEK.webp",
    link: "/berita/kajian-intelektual.html",
    featured: false
  },
  {
    id: 7,
    title: "Harlah 66 & Halal Bihalal Rayon Justicia",
    excerpt: "Peringatan Harlah PMII ke-66 dan halal bihalal bersama seluruh kader.",
    date: "17 April 2026",
    uploadDate: "2026-03-01",
    image: "/assets/img/foto/HARLAH2.webp",
    link: "/berita/harlah-66-halal-bihalal.html",
    featured: false
  },
  {
    id: 8,
    title: "Bagi Takjil Sahur On The Road",
    excerpt: "Kegiatan bagi-bagi takjil dan sahur on the road untuk berbagi di bulan suci Ramadan.",
    date: "12-13 Maret 2026",
    uploadDate: "2026-03-15",
    image: "/assets/img/foto/BAGIBAGI.webp",
    link: "/berita/bagi-takjil-sahur-on-the-road.html",
    featured: false
  },
  {
    id: 9,
    title: "MAPABA PMII Rayon Persiapan Justicia: Menyambut Generasi Baru",
    excerpt: "MAPABA (Masa Penerimaan Anggota Baru) PMII Rayon Persiapan Justicia UNESA berlangsung dengan antusiasme tinggi dari calon anggota baru.",
    date: "14-16 November 2025",
    uploadDate: "2025-11-16",
    image: "/assets/img/foto/MAPABA 1 (2)_20260225_180801_0014.webp",
    link: "/berita/mapaba-1-rayon-inklusif-justicia-unesa.html",
    featured: false
  },
  {
    id: 10,
    title: "Harmoni Pergerakan: Menyatukan Suara, Menguatkan Solidaritas",
    excerpt: "Kegiatan Harmoni Pergerakan yang menggabungkan seni dan pergerakan untuk memperkuat solidaritas antar kader PMII Rayon Justicia.",
    date: "20 September 2025",
    uploadDate: "2025-09-20",
    image: "/assets/img/foto/HARMONI PERGERAKAN_20260225_180759_0010.webp",
    link: "/berita/harmoni-pergerakan-1.html",
    featured: false
  },
  {
    id: 11,
    title: "Sekolah Kaderisasi: Membentuk Kader yang Berdaya",
    excerpt: "Program Sekolah Kaderisasi untuk membentuk kader-kader PMII yang memiliki kapasitas intelektual, spiritual, dan organisasi yang kuat.",
    date: "5-7 Juli 2025",
    uploadDate: "2025-07-07",
    image: "/assets/img/foto/SEKOLAH KADERISASI_20260225_180803_0016.webp",
    link: "/berita/sekolah-kaderisasi-1.html",
    featured: false
  },
  {
    id: 12,
    title: "Safari Religi Ziarah Sunan Ampel: Menyentuh Akar Spiritual",
    excerpt: "Kegiatan safari religi dengan ziarah ke makam Sunan Ampel untuk memperkuat spiritualitas dan kecintaan terhadap para ulama.",
    date: "10 Mei 2025",
    uploadDate: "2025-05-10",
    image: "/assets/img/foto/SAFARI RELIGI_20260225_180754_0000.webp",
    link: "/berita/safari-religi-ziarah-sunan-ampel.html",
    featured: false
  },
  {
    id: 13,
    title: "Rapat Kerja dan Buka Bersama: Optimalisasi Pergerakan",
    excerpt: "Rapat kerja kepengurusan disertai buka bersama untuk evaluasi program dan memperkuat silaturahmi antar pengurus.",
    date: "25 Maret 2025",
    uploadDate: "2025-03-25",
    image: "/assets/img/foto/RAKER & BUKBER_20260225_180755_0003.webp",
    link: "/berita/rapat-kerja-dan-buka-bersama-optimalisasi-pergerakan.html",
    featured: false
  },
  {
    id: 14,
    title: "Pesantren Pergerakan Vol. 1: Memperkuat Basis Keagamaan",
    excerpt: "Kegiatan pesantren pergerakan untuk memperkuat pemahaman keagamaan dan nilai-nilai pergerakan PMII.",
    date: "15 Februari 2025",
    uploadDate: "2025-02-15",
    image: "/assets/img/foto/PESANTREN PERGERAKAN_20260225_180756_0008.webp",
    link: "/berita/pesantren-pergerakan-vol-1.html",
    featured: false
  },
  {
    id: 15,
    title: "Ngobrol Perkara Islam: Gerakan Purifikasi",
    excerpt: "Diskusi santai tentang perkembangan Islam dan tantangan yang dihadapi umat Islam di era modern.",
    date: "8 Januari 2025",
    uploadDate: "2025-01-08",
    image: "/assets/img/foto/NGOPI_20260225_180756_0006.webp",
    link: "/berita/ngobrol-perkara-islam-gerakan-purifikasi.html",
    featured: false
  },
  {
    id: 16,
    title: "Kajian Cipayung FH UNESA: Neo Orba dan Demokrasi",
    excerpt: "Kajian kritis tentang Neo Orba dan tantangan demokrasi di Indonesia yang diadakan di Fakultas Hukum UNESA.",
    date: "20 Desember 2024",
    uploadDate: "2024-12-20",
    image: "/assets/img/foto/KAJIAN CIPAYUNG FH UNESA_20260225_180755_0002.webp",
    link: "/berita/kajian-cipayung-fh-unesa-neo-orba.html",
    featured: false
  },
  {
    id: 17,
    title: "Akademi Pergerakan 1: Overcoming Stage Fright",
    excerpt: "Pelatihan public speaking dan mengatasi rasa takut berbicara di depan umum untuk kader PMII.",
    date: "5 November 2024",
    uploadDate: "2024-11-05",
    image: "/assets/img/foto/AKADEMI PERGERAKAN 1_20260225_180755_0001.webp",
    link: "/berita/akademi-pergerakan-1-overcoming-stage-fright.html",
    featured: false
  },
  {
    id: 18,
    title: "Harlah PMII 65: Halal Bihalal Rayon Justicia Sosial UNESA",
    excerpt: "Peringatan Harlah PMII ke-65 dan halal bihalal bersama seluruh kader PMII Rayon Justicia Sosial UNESA.",
    date: "10 Oktober 2024",
    uploadDate: "2024-10-10",
    image: "/assets/img/foto/HARLAH PMII & HALAL BIHALAL_20260225_180755_0005.webp",
    link: "/berita/harlah-pmii-65-halal-bihalal-rayon-justicia-sosial-unesa.html",
    featured: false
  },
  {
    id: 19,
    title: "Diskusi Panel Jejak Kartini: Perempuan dan Pergerakan",
    excerpt: "Diskusi panel tentang peran perempuan dalam pergerakan mahasiswa mengikuti jejak Kartini.",
    date: "21 April 2024",
    uploadDate: "2024-04-21",
    image: "/assets/img/foto/HARMONI PERGERAKAN (2)_20260225_180800_0011.webp",
    link: "/berita/diskusi-panel-jejak-kartini.html",
    featured: false
  },
  {
    id: 20,
    title: "Sekolah Digital Jilid 1: Penguatan Kapasitas Digital",
    excerpt: "Program Sekolah Digital untuk meningkatkan kapasitas digital kader dalam menghadapi era teknologi.",
    date: "15 Maret 2024",
    uploadDate: "2024-03-15",
    image: "/assets/img/foto/SEKOLAH DIGITAL_20260225_180756_0007.webp",
    link: "/berita/sekolah-digital-jilid-1.html",
    featured: false
  },
  {
    id: 21,
    title: "Kajian Inspiratif: Membangun Mentalitas Kader",
    excerpt: "Kajian inspiratif untuk membangun mentalitas dan karakter kader PMII yang tangguh dan berintegritas.",
    date: "10 Februari 2024",
    uploadDate: "2024-02-10",
    image: "/assets/img/foto/KAJIAN INSPIRATIF_20260225_180756_0009.webp",
    link: "/berita/diskusi-panel-jejak-kartini.html",
    featured: false
  },
  {
    id: 22,
    title: "Harmoni Pergerakan 2: Solidaritas dan Kreativitas",
    excerpt: "Kegiatan Harmoni Pergerakan kedua untuk memperkuat solidaritas dan mengekspresikan kreativitas kader.",
    date: "20 November 2023",
    uploadDate: "2023-11-20",
    image: "/assets/img/foto/HARMONI PERGERAKAN (3)_20260225_180800_0012.webp",
    link: "/berita/harmoni-pergerakan-1.html",
    featured: false
  },
  {
    id: 23,
    title: "Studi Banding Kolaborasi: Memperkuat Jaringan",
    excerpt: "Studi banding dengan rayon hukum lain untuk memperkuat jaringan dan kolaborasi antar pergerakan.",
    date: "10 Oktober 2023",
    uploadDate: "2023-10-10",
    image: "/assets/img/foto/STUBA KOLABORASI (2)_20260225_180804_0019.webp",
    link: "/berita/studi-banding-pmii-hukum-surabaya.html",
    featured: false
  }
];

// Fungsi untuk mengurutkan berita berdasarkan uploadDate (terbaru di atas)
function sortBeritaByUploadDate(data) {
  return [...data].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
}



// Konfigurasi pagination
const itemsPerPage = 6;
let currentPage = 1;



// Fungsi untuk mendapatkan berita non-featured (untuk daftar berita) - diurutkan berdasarkan uploadDate terbaru
function getNonFeaturedBerita() {
  const nonFeatured = beritaData.filter(berita => !berita.featured);
  return sortBeritaByUploadDate(nonFeatured);
}

// Fungsi untuk mendapatkan berita featured (untuk hero section) - diurutkan berdasarkan uploadDate terbaru
function getFeaturedBerita() {
  const featured = beritaData.filter(berita => berita.featured);
  return sortBeritaByUploadDate(featured);
}

// Fungsi untuk menampilkan berita pada halaman tertentu
function displayBerita(page) {
  const beritaContainer = document.getElementById('berita-list');
  if (!beritaContainer) return;
  
  const nonFeaturedBerita = getNonFeaturedBerita();
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const beritaToShow = nonFeaturedBerita.slice(startIndex, endIndex);
  
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
  
  const nonFeaturedBerita = getNonFeaturedBerita();
  const totalPages = Math.ceil(nonFeaturedBerita.length / itemsPerPage);
  
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
  const nonFeaturedBerita = getNonFeaturedBerita();
  const totalPages = Math.ceil(nonFeaturedBerita.length / itemsPerPage);
  
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
  const featuredBerita = getFeaturedBerita();
  
  // Main featured (berita pertama)
  const mainFeatured = featuredBerita[0];
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
  const sideFeatured = featuredBerita.slice(1, 3);
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


// Konfigurasi auto-pagination (infinite scroll) - default OFF
let isAutoPaginationEnabled = false; // Default: pagination manual
let isLoadingMore = false; // Flag untuk mencegah loading ganda

// Fungsi untuk infinite scroll / auto-pagination
function setupInfiniteScroll() {
  const sentinel = document.getElementById('pagination-sentinel');
  if (!sentinel) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && isAutoPaginationEnabled && !isLoadingMore) {
        const nonFeatured = getNonFeaturedBerita();
        const totalPages = Math.ceil(nonFeatured.length / itemsPerPage);
        
        if (currentPage < totalPages) {
          loadNextPage();
        }
      }
    });
  }, {
    rootMargin: '100px', // Mulai load 100px sebelum mencapai sentinel
    threshold: 0.1
  });
  
  observer.observe(sentinel);
}

// Fungsi untuk memuat halaman berikutnya secara otomatis
function loadNextPage() {
  const nonFeatured = getNonFeaturedBerita();
  const totalPages = Math.ceil(nonFeatured.length / itemsPerPage);
  
  if (currentPage >= totalPages) {
    // Sembunyikan sentinel jika sudah di halaman terakhir
    const sentinel = document.getElementById('pagination-sentinel');
    if (sentinel) sentinel.style.display = 'none';
    return;
  }
  
  isLoadingMore = true;
  currentPage++;
  
  const beritaContainer = document.getElementById('berita-list');
  if (!beritaContainer) return;
  
  const startIndex = (currentPage - 1) * itemsPerPage;
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
  
  // Append konten baru ke konten yang sudah ada
  beritaContainer.insertAdjacentHTML('beforeend', html);
  
  // Update pagination buttons untuk menunjukkan halaman saat ini
  updatePaginationHighlight();
  
  // Update total pages di pagination container
  updatePaginationTotal();
  
  isLoadingMore = false;
}

// Fungsi untuk update highlight pagination
function updatePaginationHighlight() {
  const paginationContainer = document.getElementById('pagination-container');
  if (!paginationContainer) return;
  
  const pageItems = paginationContainer.querySelectorAll('.page-item');
  pageItems.forEach((item, index) => {
    if (index === currentPage) {
      item.classList.add('active');
      item.setAttribute('aria-current', 'page');
    } else {
      item.classList.remove('active');
      item.removeAttribute('aria-current');
    }
  });
  
  // Update tombol Previous/Next
  const prevBtn = paginationContainer.querySelector('.page-item:first-child');
  const nextBtn = paginationContainer.querySelector('.page-item:last-child');
  const nonFeatured = getNonFeaturedBerita();
  const totalPages = Math.ceil(nonFeatured.length / itemsPerPage);
  
  if (prevBtn) {
    if (currentPage === 1) {
      prevBtn.classList.add('disabled');
      prevBtn.querySelector('a').setAttribute('tabindex', '-1');
      prevBtn.querySelector('a').setAttribute('aria-disabled', 'true');
    } else {
      prevBtn.classList.remove('disabled');
      prevBtn.querySelector('a').removeAttribute('tabindex');
      prevBtn.querySelector('a').removeAttribute('aria-disabled');
    }
  }
  
  if (nextBtn) {
    if (currentPage >= totalPages) {
      nextBtn.classList.add('disabled');
      nextBtn.querySelector('a').setAttribute('tabindex', '-1');
      nextBtn.querySelector('a').setAttribute('aria-disabled', 'true');
    } else {
      nextBtn.classList.remove('disabled');
      nextBtn.querySelector('a').removeAttribute('tabindex');
      nextBtn.querySelector('a').removeAttribute('aria-disabled');
    }
  }
}

// Fungsi untuk update total pages
function updatePaginationTotal() {
  const paginationContainer = document.getElementById('pagination-container');
  if (!paginationContainer) return;
  
  const nonFeatured = getNonFeaturedBerita();
  const totalPages = Math.ceil(nonFeatured.length / itemsPerPage);
  
  // Update onclick untuk semua page numbers
  const pageLinks = paginationContainer.querySelectorAll('.page-item:not(:first-child):not(:last-child) .page-link');
  pageLinks.forEach((link, index) => {
    link.onclick = (e) => {
      e.preventDefault();
      goToPage(index + 1);
    };
  });
  
  // Update onclick untuk Previous/Next
  const prevLink = paginationContainer.querySelector('.page-item:first-child .page-link');
  const nextLink = paginationContainer.querySelector('.page-item:last-child .page-link');
  
  if (prevLink) {
    prevLink.onclick = (e) => {
      e.preventDefault();
      goToPage(currentPage - 1);
    };
  }
  
  if (nextLink) {
    nextLink.onclick = (e) => {
      e.preventDefault();
      goToPage(currentPage + 1);
    };
  }
}

// Fungsi untuk toggle auto-pagination
function toggleAutoPagination() {
  isAutoPaginationEnabled = !isAutoPaginationEnabled;
  const toggleBtn = document.getElementById('auto-pagination-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = isAutoPaginationEnabled ? 'Auto: ON' : 'Auto: OFF';
    toggleBtn.classList.toggle('btn-success', isAutoPaginationEnabled);
    toggleBtn.classList.toggle('btn-secondary', !isAutoPaginationEnabled);
  }
  localStorage.setItem('autoPaginationEnabled', isAutoPaginationEnabled);
}

// Inisialisasi pagination saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
  // Cek apakah kita berada di halaman kegiatan
  if (document.getElementById('berita-list')) {
    // Load setting auto-pagination dari localStorage
    const savedSetting = localStorage.getItem('autoPaginationEnabled');
    if (savedSetting !== null) {
      isAutoPaginationEnabled = savedSetting === 'true';
    }
    
    displayFeaturedBerita();
    displayBerita(currentPage);
    generatePagination();
    
    // Setup infinite scroll
    setupInfiniteScroll();
  }
});
