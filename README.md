# Story App

Aplikasi berbagi cerita yang dibangun dengan Vite + JavaScript.

## Fitur

- 📱 **Responsive Design** - Tampilan yang optimal di berbagai perangkat
- ⚡ **Cepat** - Dibangun dengan Vite untuk performa optimal
- 📦 **PWA** - Dapat diinstal dan berfungsi offline
- 🔐 **Autentikasi** - Login dan registrasi pengguna
- 🗺️ **Integrasi Peta** - Menampilkan lokasi cerita

## Teknologi

- [Vite](https://vitejs.dev/) - Build tool
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) - Bahasa pemrograman
- [PWA](https://web.dev/progressive-web-apps/) - Progressive Web App

## Cara Instalasi

1. Clone repositori ini:
   ```bash
   git clone [URL_REPOSITORY]
   cd Projecttt5
   ```

2. Install dependensi:
   ```bash
   npm install
   ```

3. Buat file `.env` di root project dan isi dengan konfigurasi yang diperlukan:
   ```env
   VITE_API_BASE_URL=https://story-api.dicoding.dev/v1
   ```

4. Jalankan aplikasi di mode pengembangan:
   ```bash
   npm run dev
   ```

5. Build untuk produksi:
   ```bash
   npm run build
   ```

## Cara Deploy

### GitHub Pages
1. Pastikan konfigurasi `vite.config.js` memiliki `base: '/nama-repo/'`
2. Jalankan:
   ```bash
   npm run deploy:github
   ```

### Firebase Hosting
1. Login ke Firebase:
   ```bash
   firebase login
   ```
2. Inisialisasi Firebase (jika belum):
   ```bash
   firebase init
   ```
3. Deploy:
   ```bash
   npm run deploy:firebase
   ```

### Netlify
1. Login ke Netlify:
   ```bash
   netlify login
   ```
2. Deploy:
   ```bash
   npm run deploy:netlify
   ```

## Kontribusi

1. Fork repositori ini
2. Buat branch fitur baru (`git checkout -b fitur/namafitur`)
3. Commit perubahan (`git commit -m 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur/namafitur`)
5. Buat Pull Request

## Lisensi

Dibuat untuk memenuhi tugas submission Dicoding.
