# RasaKampus — Frontend

Frontend React + TypeScript + Vite untuk aplikasi Review Kantin. Pembaruan ini berfokus pada desain antarmuka dan pengalaman pengguna; kontrak endpoint, autentikasi JWT, serta aturan otorisasi backend tetap dipertahankan.

## Teknologi
- React 19 + TypeScript
- Vite
- React Router
- Axios
- lucide-react untuk ikon

## Menjalankan aplikasi
1. Pastikan backend dan database aktif.
2. Masuk ke folder `frontend`.
3. Jalankan `npm install`.
4. Pastikan `.env` berisi `VITE_API_BASE_URL=/api` (atau URL API yang sesuai).
5. Jalankan `npm run dev`, lalu buka `http://localhost:5173`.

Build produksi: `npm run build`.

## Peta halaman
- `/` — direktori kantin, pencarian, filter kategori, dan kartu informasi.
- `/stalls/:id` — informasi kantin, menu, pemilik, dan ulasan.
- `/login` — autentikasi pengguna.
- `/register` — registrasi customer.
- `/dashboard` — ringkasan dan pengelolaan data kantin sesuai role.
- `/unauthorized` — halaman ketika role tidak memiliki akses.

## Integrasi backend
Frontend menggunakan modul API yang sudah tersedia:
- `GET /api/stalls`
- `GET /api/stalls/:id`
- `POST /api/stalls`
- `PUT /api/stalls/:id`
- `DELETE /api/stalls/:id`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

Tidak ada perubahan pada struktur payload maupun endpoint. Registrasi publik tetap mengikuti aturan backend dan tidak mengirim role dari frontend. Pembatasan tombol di antarmuka hanya untuk pengalaman pengguna; backend tetap menjadi sumber otoritatif untuk validasi hak akses.

## Catatan
- Token JWT tetap disimpan pada `localStorage` dengan key `rk_token`.
- Proxy Vite meneruskan `/api` ke `http://localhost:3000` saat development.
- Untuk production, sesuaikan reverse proxy/API base URL dan konfigurasi HTTPS.
