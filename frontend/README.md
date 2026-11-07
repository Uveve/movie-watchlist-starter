# FilmLog — Frontend Companion

Aplikasi frontend sederhana bertema **Letterboxd / IMDb** yang dirancang sebagai antarmuka pengujian bagi peserta penugasan Backend GDGoC.

Frontend ini dibuat **Zero-Build & Standalone** (menggunakan Tailwind CSS CDN dan Vanilla Modern JS). Peserta **tidak perlu** menginstall `npm` dependencies apa pun untuk menjalankannya.

---

## Menjalankan frontend

Frontend disajikan oleh Express bersama API. Dari folder utama repositori, jalankan perintah berikut.

```cmd
cd backend
npm ci
npm run dev
```

Ikuti konfigurasi awal di [README backend](../backend/README.md), lalu buka [FilmLog](http://localhost:8000/).

---

## ⚙️ Mengarahkan ke Backend Anda
Secara default, frontend memanggil API pada origin halaman yang sedang dibuka dengan akhiran `/api`. Pengaturan URL yang tersimpan di browser tetap dipakai.

Jika backend Anda berjalan di port lain (misal `:3000`, `:5000`, atau live URL Render):
1. Buka web frontend di browser.
2. Klik tombol indikator endpoint di pojok kanan atas (`⚙️ Settings`).
3. Ubah **API Base URL** ke port/URL backend Anda, lalu klik **Save & Reconnect**.

> 💡 **Penting (CORS):** Pastikan backend Anda mengaktifkan middleware **CORS** (`Access-Control-Allow-Origin: *` atau izinkan origin frontend Anda) agar browser tidak memblokir HTTP request.

---

## 📋 Fitur yang Tersedia di Frontend

1. **🎬 Discover Movies (`GET /api/movies`)**:
   - Menampilkan poster, rating, sutradara, genre.
   - Filter pencarian judul dan filter pill genre.
   - Tombol **Shuffle / Randomize** untuk mengacak tampilan film.
2. **🔍 Detail Film (`GET /api/movies/:id`)**:
   - Modal informasi lengkap (sinopsis, durasi, sutradara, pemeran/cast).
3. **🔐 Autentikasi (`POST /api/auth/register` & `POST /api/auth/login`)**:
   - Login & Register modal.
   - Token JWT disimpan di `localStorage` dan otomatis dikirimkan di header `Authorization: Bearer <token>` pada setiap protected request.
4. **📌 Watchlist (`GET /api/watchlist`, `POST /api/watchlist`, `DELETE /api/watchlist/:id`)**:
   - Menambah dan menghapus film dari daftar tontonan pengguna yang sedang login.
5. **⭐ Watched & Reviews (`GET /api/watched`, `POST /api/watched`)**:
   - Mencatat film yang telah ditonton dengan rating bintang (1-5) dan catatan opini/review.
6. **🤖 AI Movie Recommendation (`POST /api/movies/recommend`)**:
   - Meminta rekomendasi film berdasarkan deskripsi/mood pengguna.
   - Backend harus memanfaatkan Gemini API untuk memilihkan film **yang tersedia di database lokal** beserta alasan logisnya.
7. **📡 API Inspector (Drawer di bagian bawah)**:
   - Mencatat setiap HTTP method, URL, status code (200, 401, 500, dll.), dan durasi request secara *real-time* untuk mempermudah debugging backend.
