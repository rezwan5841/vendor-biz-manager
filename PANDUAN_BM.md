# Vendor Biz Manager + Supabase: Panduan Ringkas

## Status sebenar (sila baca dahulu)
- **Telah diuji di sini:** semakan sintaks kod, 14 ujian pengiraan, dan 6 ujian logik giliran penyegerakan/pemetaan data (dijalankan dalam Node).
- **BELUM diuji:** SQL dalam pangkalan data Supabase sebenar, RLS, log masuk, penyegerakan sebenar, pemasangan PWA di Android, sandaran dan pemulihan. Tiada akses Supabase atau internet di sini. Anda **mesti** lalu Senarai Semak Ujian (bahagian 7) sebelum memasukkan data sebenar.
- Jika ada ralat SQL semasa langkah 2, salin mesej ralat itu ke saya (bukan kunci rahsia).

## 1. Cipta projek Supabase
1. Daftar di supabase.com, pilih **New project**. Pilih rantau **Singapore**. Simpan kata laluan pangkalan data di tempat selamat.
2. **Authentication > Sign In / Providers > Email**: matikan pilihan **Allow new users to sign up** (hanya pemilik boleh log masuk). Nama menu boleh berbeza sedikit.
3. **Authentication > Users > Add user > Create new user**: isi emel dan kata laluan anda, tandakan auto confirm.

## 2. Pasang pangkalan data
1. Buka **SQL Editor > New query**.
2. Salin seluruh fail `supabase/migrations/001_skema.sql`, tampal, tekan **Run**. Mesti keluar "Success".
   Kemudian ulang untuk fail `` (kategori kos baharu). Jalankan mengikut urutan 001 dahulu, kemudian 002. Jika projek anda sudah menjalankan 001, jalankan 002 sahaja. 002 tidak memadam data.
3. Jalankan ujian RLS: buat 2 pengguna ujian, ikut arahan dalam `supabase/tests/ujian_rls.sql`. Semua baris mesti LULUS. Padam pengguna ujian selepas itu.

## 3. Kunci dan pembolehubah persekitaran
Di **Project Settings > API** ada dua kunci:
- **anon / public key**: BOLEH digunakan dalam aplikasi. Ia dilindungi oleh RLS.
- **service_role key**: **JANGAN gunakan, jangan tampal di mana-mana, jangan hantar kepada sesiapa** (termasuk saya).

Anda perlukan dua nilai: `VITE_SUPABASE_URL` (Project URL) dan `VITE_SUPABASE_ANON_KEY` (anon key). Masukkan hanya di Cloudflare (langkah 4), bukan dalam kod.

## 4. Deploy ke Cloudflare Pages (HTTPS percuma)
1. Letak folder projek ini di GitHub (repositori **Private**). Fail `.env` tidak dimuat naik (sudah dalam `.gitignore`).
2. Cloudflare Dashboard > **Workers & Pages > Create > Pages > Connect to Git**, pilih repositori.
3. Build command: `npm run build`. Build output directory: `dist`.
4. **Environment variables** (Production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan `NODE_VERSION` = `20`.
5. **Save and Deploy**. Anda dapat alamat `https://nama-anda.pages.dev` (HTTPS automatik).
6. Di Supabase **Authentication > URL Configuration**, letak alamat itu sebagai **Site URL**.
7. Jika tukar pembolehubah, tekan **Retry deployment** kerana nilai dimasukkan semasa build.

## 5. Pasang di Android
1. Buka alamat Pages dalam **Chrome**, log masuk.
2. Menu Chrome (tiga titik) > **Pasang aplikasi** / **Tambah ke skrin utama**.
3. Buka dari ikon. Tukar telefon: pasang semula dengan cara sama dan log masuk. Data dimuat turun dari Supabase.
4. Luar talian: aplikasi dibuka dan perubahan disimpan di telefon. Bar atas menunjukkan **"belum disegerak"** (oren) sehingga pelayan mengesahkan, baru **"Disegerakkan"** (hijau).
   Penting: log masuk dan muat data sekali dalam talian dahulu sebelum guna luar talian.

## 6. Sandaran dan pemulihan
**Lapisan 1, Supabase Pro**: sandaran harian automatik (Dashboard > Database > Backups). Pro menyimpan sandaran terbaru beberapa hari sahaja (semak skrin semasa). Memulihkan menggantikan seluruh pangkalan data, jadi buat hanya jika perlu.
**Lapisan 2, luar tapak (anda buat sendiri)**: setiap minggu/selepas acara besar, **Tetapan > Muat turun sandaran penuh (JSON)**, kemudian hantar fail ke Google Drive atau emel. Muat turun juga CSV untuk laporan.
**Pemulihan daripada JSON**: Tetapan > Pulihkan daripada fail sandaran > pilih fail > sahkan. Rekod dengan ID sama ditimpa, rekod lain tidak dipadam. Aplikasi kemudian menyegerak ke Supabase.
**Latihan pemulihan (wajib sebelum data sebenar; belum diuji oleh saya):**
1. Cipta projek Supabase percuma kedua sebagai ujian, jalankan SQL yang sama, cipta pengguna.
2. Dengan aplikasi sebenar, muat turun sandaran JSON.
3. Log masuk ke aplikasi yang disambungkan ke projek ujian, pulihkan fail itu.
4. Bandingkan bilangan acara, jumlah jualan dan untung dengan aplikasi asal. Jika sama, prosedur berfungsi.
5. Catat tarikh ujian. Ulang selepas sebarang perubahan besar.

## 7. Senarai semak ujian
- [ ] SQL berjaya dijalankan tanpa ralat
- [ ] Ujian RLS: semua LULUS
- [ ] Pendaftaran umum dimatikan (cuba daftar emel baharu: mesti ditolak)
- [ ] Log masuk betul berjaya; kata laluan salah diberi mesej Bahasa Melayu
- [ ] Tambah menu, edit harga, nyahaktifkan: data kekal selepas muat semula
- [ ] Cipta acara, pilih menu, isi jualan, kos A, tukar ke B: untung betul
- [ ] Log masuk di telefon kedua: data sama
- [ ] Mod pesawat: tambah rekod, bar oren "belum disegerak"; matikan mod pesawat: jadi hijau selepas pelayan sahkan
- [ ] Ubah rekod sama di dua telefon (satu luar talian): muncul **Konflik** di Tetapan, kedua-dua pilihan berfungsi
- [ ] Arkib, pulihkan, padam kekal acara
- [ ] CSV dibuka dalam Excel/Sheets dengan betul; sandaran JSON dimuat turun
- [ ] Latihan pemulihan (bahagian 6) lulus
- [ ] Ikon dan pemasangan PWA di Android berfungsi
