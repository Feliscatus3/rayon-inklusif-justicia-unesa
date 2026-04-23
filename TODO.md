# TODO: Implementasi Pagination JavaScript untuk Halaman Kegiatan

## Task List:
- [x] 1. Buat file JavaScript pagination (`assets/js/pagination.js`)
- [x] 2. Modifikasi `page/kegiatan.html` untuk menggunakan pagination JS
- [x] 3. Perbaiki layout "Kegiatan Terbaru" agar teratur
- [x] 4. Hapus file `kegiatan-page-2.html` jika ada (tidak perlu lagi)

## Detail Implementasi:
- ✅ Pagination akan menampilkan 5 berita per halaman (3 halaman untuk 12 berita)

- ✅ Tombol Previous/Next akan aktif/non-aktif sesuai halaman
- ✅ Nomor halaman 1, 2, 3 akan di-generate otomatis (3 halaman)

- ✅ Tidak perlu membuat file HTML baru untuk setiap halaman
- ✅ Layout "Kegiatan Terbaru" diperbaiki dengan menambahkan class `col-md-8` dan `col-md-4`
- ✅ Total 18 kegiatan (3 featured + 15 non-featured)



## File yang Dibuat/Dimodifikasi:
1. `assets/js/pagination.js` - File JavaScript untuk pagination
2. `page/kegiatan.html` - Dimodifikasi untuk menggunakan pagination JS dan perbaikan layout
3. `page/kegiatan-page-2.html` - Dihapus (tidak perlu lagi)

## Cara Kerja:
- Data berita disimpan dalam array `beritaData` di `pagination.js`
- Berita featured (3 berita utama) ditampilkan di hero section
- Berita non-featured ditampilkan dengan pagination (6 per halaman = 3 halaman: 6+6+3)

- Tombol Previous/Next dan nomor halaman di-generate otomatis
- Tidak perlu reload halaman atau buat file HTML baru

## Status: ✅ SELESAI
