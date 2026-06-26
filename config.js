/**
 * SIPAK Configuration
 *
 * Konfigurasi utama aplikasi SIPAK.
 * Ubah nilai-nilai di bawah ini sesuai dengan kebutuhan instansi.
 */

const CONFIG = {
    // ============================================
    // IDENTITAS INSTANSI
    // ============================================
    instans: {
        nama: 'Kecamatan Gading Rejo',
        kabupaten: 'Kabupaten Pringsewu',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Lambang_Kabupaten_Pringsewu.png', // URL ke logo instansi (opsional), contoh: './assets/logo.png'
    },

    // ============================================
    // DATA SOURCE CONFIGURATION
    // ============================================
    // PILIH SALAH SATU METODE DI BAWAH INI:
    //
    // METODE 1: Sample Data (UNTUK TESTING UI)
    // Aktifkan mode ini untuk mencoba aplikasi tanpa setup data source.
    // Data akan menggunakan sample dan tidak memerlukan koneksi internet.
    //
    // METODE 2: Google Apps Script (RECOMMENDED - Mengatasi CORS)
    // Buat Apps Script dan deploy sebagai web app, lalu masukkan URL-nya di bawah
    // Lihat panduan di: https://github.com/ClaudeMundus/sipak#setup-google-apps-script
    //
    // METODE 3: Google Sheets Langsung (CORS akan terblokir di browser)
    // ============================================

    dataSource: {
        // Jenis data source: 'sample', 'appsscript', atau 'csv'
        type: 'appsscript', // <-- GANTI KE 'appsscript' SETELAH SETUP

        // --- Untuk Google Apps Script ---
        appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwv4YuWRm1Ag7q8HyzR_fxfz3f3kxYbuCU7GaI-qR9LaiLqY4BbDmkxVNDU6nbETtbF/exec',
        spreadsheetId: '13o8EeMMPsX0ePDuWmyzsEOWhghS2PzFh9QofWBaLAmQ',
        sheetId: 0,
    },

    // ============================================
    // PENGATURAN TAMPILAN
    // ============================================
    display: {
        // Mata uang yang digunakan
        mataUang: 'IDR',
        simbol: 'Rp',

        // Format tanggal
        locale: 'id-ID',

        // Nama bulan dalam bahasa Indonesia
        namaBulan: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    },

    // ============================================
    // PENGATURAN STATUS ANGGARAN
    // ============================================
    status: {
        // Ambang batas persentase (%)
        // Di bawah 70%: Status Hijau (Dana Tersedia)
        hijauMin: 0,
        hijauMax: 70,

        // 70% - 90%: Status Kuning (Perhatian)
        kuningMin: 70,
        kuningMax: 90,

        // Di atas 90%: Status Merah (Kritis)
        merahMin: 90,
        merahMax: 100,
    },

    // ============================================
    // PENGATURAN APLIKASI
    // ============================================
    app: {
        // Nama aplikasi
        nama: 'SIPAK',
        judul: 'Sistem Pencarian Anggaran Kegiatan',

        // Apakah debug mode aktif? (akan menampilkan log di console)
        debug: true,

        // Timeout fetch data (ms)
        fetchTimeout: 15000,
    }
};

/**
 * Helper untuk mendapatkan URL data
 * @returns {string} URL untuk fetch
 */
CONFIG.getDataUrl = function() {
    if (this.dataSource.type === 'appsscript') {
        return this.dataSource.appsScriptUrl;
    }
    // Fallback ke CSV (akan mengalami CORS)
    return `https://docs.google.com/spreadsheets/d/${this.dataSource.spreadsheetId}/export?format=csv&gid=${this.dataSource.sheetId}`;
};

/**
 * Inisialisasi konfigurasi dari URL parameters (untuk deep linking dari QR Code)
 */
CONFIG.initFromUrl = function() {
    const params = new URLSearchParams(window.location.search);

    // Cek apakah ada parameter kode di URL (dari QR Code)
    if (params.has('kode')) {
        const kode = params.get('kode').toUpperCase();
        if (CONFIG.app.debug) {
            console.log('[SIPAK] QR Code detected, kode:', kode);
        }
        return kode;
    }

    return null;
};
