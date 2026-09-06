-- Schema yang digunakan website V3.
-- Jika tabel sudah dibuat dan berjalan, TIDAK perlu menjalankan ulang schema ini.
-- Hak akses publik/admin dapat diperbaiki dengan GRANT berikut jika diperlukan.

GRANT SELECT ON TABLE public.menu_harian TO anon;
GRANT SELECT ON TABLE public.kandungan_gizi TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.menu_harian TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.kandungan_gizi TO authenticated;