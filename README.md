# MBG Kandungan Gizi V3

Website publik:
- index.html

Dashboard admin:
- admin/index.html

Konfigurasi:
- assets/js/config.js

## Sebelum dipakai
1. Isi `SUPABASE_ANON_KEY` dengan Publishable/Anon Key Supabase.
2. Jangan pernah memasukkan service_role/secret key ke frontend.
3. Jalankan menggunakan VS Code + Live Server saat testing.
4. Pastikan SQL GRANT di database sudah dijalankan.

## Alur
QR permanen -> halaman publik -> menu berdasarkan tanggal hari ini -> kandungan gizi berdasarkan jenis porsi.

Admin mengelola menu dan 5 jenis porsi:
- Sekolah — Porsi Kecil
- Sekolah — Porsi Besar
- 3B — Balita
- 3B — Bumil
- 3B — Busui
