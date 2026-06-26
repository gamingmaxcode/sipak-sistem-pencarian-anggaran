📄 Product Requirement Document (PRD)
Nama Project: Sistem Informasi Pencarian Anggaran Kegiatan (SIPAK) Berbasis QR Code

Instansi Pengguna: Pemerintah Tingkat Kecamatan / Kabupaten

Status Dokumen: Terbuka (Draft Pembuatan via Claude Code)

1. Latar Belakang & Tujuan
Instansi pemerintahan dituntut untuk menjaga transparansi dan akuntabilitas anggaran operasional. Seringkali pegawai lapangan atau penanggung jawab kegiatan kesulitan mengecek sisa anggaran secara real-time tanpa harus membuka dokumen fisik atau bertanya ke bagian keuangan.

SIPAK hadir sebagai solusi web berbasis mobile-first yang ringkas. Pegawai cukup memindai QR Code yang ditempel di ruang kerja atau berkas, memasukkan Kode Kegiatan, dan sistem akan langsung menampilkan sisa anggaran yang bersumber langsung dari Google Sheets instansi secara real-time.

2. Pengguna Utama (User Persona)
Pegawai / Pelaksana Kegiatan: Mengecek ketersediaan dana sebelum mengeksekusi program lapangan.

Camat / Kepala Bagian: Memonitoring sisa anggaran secara cepat melalui ponsel pintar saat rapat koordinasi.

Bagian Keuangan (Admin): Hanya perlu memperbarui data di Google Sheets tanpa perlu menyentuh sistem web sama sekali.

3. Ruang Lingkup Fitur (Feature Scope)

A. Antarmuka Pengguna (Frontend - Mobile First)
Desain Bersih & Responsif: Menggunakan Tailwind CSS dengan pendekatan mobile-first (optimal di layar HP).

Identitas Instansi: Menyediakan ruang untuk Logo Kabupaten/Kecamatan, Nama Instansi, dan Judul Aplikasi yang dinamis.

Form Pencarian Pintar: Input text untuk Kode Kegiatan yang dilengkapi dengan validasi otomatis (misal: otomatis mengubah input menjadi huruf kapital).

B. Manajemen Data (Backend & Integrasi)
Tanpa Database Rumit: Memanfaatkan Google Sheets API / Publikasi CSV sebagai single source of truth.

Keamanan Data: Web hanya bersifat Read-Only (membaca data). Tidak ada fitur untuk mengubah atau menghapus data dari sisi web.

C. Alur Pengalaman Pengguna (User Journey)User melakukan scan QR Code via kamera HP $\rightarrow$ Terarah ke URL Website SIPAK.User memasukkan Kode Kegiatan (Contoh: KC-001) pada kolom pencarian $\rightarrow$ Klik tombol "Cari Anggaran".Kondisi Berhasil: Sistem menampilkan Card informasi berisi: Nama Kegiatan, Pagu Anggaran, Realisasi, Sisa Anggaran, dan status persentase penyerapan anggaran dengan animasi transisi yang halus.Kondisi Gagal: Jika kode tidak ditemukan, muncul pesan error alert yang informatif: "Maaf, Kode Kegiatan tidak ditemukan atau salah input."

4. Kebutuhan Non-Fungsional (Non-Functional Requirements)
Kecepatan (Performance): Proses pencarian data dari Google Sheets harus di bawah 2 detik setelah tombol diklik.

Aksesibilitas: Kompatibel dengan semua peramban seluler (Google Chrome Mobile, Safari, Samsung Internet).

Kemudahan Deployment: Kode harus bersifat serverless (static web) agar bisa di-host secara gratis di Vercel, Netlify, atau GitHub Pages.