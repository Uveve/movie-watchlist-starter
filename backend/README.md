# FilmLog Backend

Tahap pertama menyediakan fondasi HTTP API menggunakan Node.js dan Express. Endpoint yang tersedia saat ini adalah `GET /api/health`. Database, autentikasi, watchlist, ulasan, dan Gemini menjadi pekerjaan tahap berikutnya.

## Menjalankan

Gunakan Node.js 24 atau lebih baru. Buka terminal di folder `backend`, lalu jalankan perintah berikut.

```cmd
npm ci
copy .env.example .env
npm run dev
```

`npm run dev` memulai ulang server ketika kode berubah. Gunakan `npm start` untuk menjalankan server sekali tanpa pemantauan perubahan.

Buka [health endpoint](http://localhost:8000/api/health). Respons berhasil memiliki status HTTP 200 dan body berikut.

```json
{"status":"ok","service":"filmlog-api"}
```

Jika port 8000 sedang dipakai aplikasi lain, hentikan aplikasi tersebut atau ganti `PORT` di `.env`. `CORS_ORIGIN` mengatur origin frontend yang diizinkan membaca respons API dari browser. Beberapa origin dapat dipisahkan dengan koma.

## Struktur dan alur request

```text
backend/
  src/
    config/env.js
    middleware/error-handler.js
    routes/health.routes.js
    app.js
    server.js
  .env.example
  package.json
  package-lock.json
```

`server.js` membuka port HTTP dan mengatur penghentian server. `app.js` menyusun middleware dan route, sehingga aplikasi dapat diimpor untuk pengujian tanpa langsung membuka port. `config/env.js` membaca serta memeriksa konfigurasi lingkungan. `routes/health.routes.js` menangani pemeriksaan kesehatan proses server.

Request melewati CORS dan parser JSON, kemudian dicocokkan dengan route. URL yang belum tersedia menghasilkan 404. JSON rusak menghasilkan 400, dan body di atas 16 KB menghasilkan 413. Error tak terduga menghasilkan 500 dengan pesan umum, sedangkan detailnya dicatat di terminal server.

Health endpoint saat ini memeriksa bahwa proses HTTP merespons. Pemeriksaan koneksi database akan dibahas ketika database ditambahkan.
