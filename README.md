# SIPAK - Sistem Informasi Pencarian Anggaran Kegiatan

Sistem web statis berbasis mobile-first untuk pencarian anggaran kegiatan Instansi Pemerintahan melalui QR Code atau Kode Kegiatan.

## ⚠️ Penting: Setup Data Source

Karena **CORS Policy** browser, Google Sheets tidak bisa di-fetch langsung. Anda perlu menggunakan **Google Apps Script** sebagai proxy.

Ikuti panduan di bawah ini untuk setup lengkap.

---

## 🚀 Cara Setup Lengkap

### Langkah 1: Setup Google Sheets

1. Buat spreadsheet baru di Google Sheets
2. Tambahkan kolom dengan header berikut:

| KODE | NAMA_KEGIATAN | RINCIAN | PAGU | REALISASI | SISA ANGGARAN |
|------|---------------|---------|------|-----------|---------------|
| KC-001 | Pembangunan Gedung | Pembangunan Fisik | 100000000 | 65000000 | 35000000 |
| KC-001 | Pembangunan Gedung | Pengawasan | 30000000 | 19500000 | 10500000 |
| KC-001 | Pembangunan Gedung | Administrasi | 20000000 | 13000000 | 7000000 |

> **Catatan:** Satu KODE bisa memiliki beberapa baris dengan RINCIAN berbeda. Kolom SISA ANGGARAN bisa dihitung otomatis atau diinput manual.

3. **CATAT:** Spreadsheet ID ada di URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### Langkah 2: Buat Google Apps Script

1. Buka https://script.google.com
2. Klik **New Project**
3. Hapus kode default, paste kode berikut:

```javascript
function doGet(e) {
  // ============================================
  // KONFIGURASI - GANTI NILAI DI BAWAH INI
  // ============================================

  // GANTI DENGAN SPREADSHEET ID ANDA
  const SPREADSHEET_ID = 'MASUKKAN_SPREADSHEET_ID_ANDA_DISINI';

  // GANTI DENGAN NAMA SHEET ANDA (default: Sheet1)
  const SHEET_NAME = 'Sheet1';

  // ============================================
  // LOGIKA - TIDAK PERLU DIUBAH
  // ============================================

  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];
    const data = sheet.getDataRange().getValues();

    // Convert to array of objects
    const headers = data[0];
    const result = [];

    for (let i = 1; i < data.length; i++) {
      const row = {};
      headers.forEach((header, index) => {
        // Normalize header: lowercase, hapus spasi, ganti spasi dengan underscore
        const normalizedHeader = header.toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');

        row[normalizedHeader] = data[i][index];
      });

      // Convert numeric values untuk PAGU, REALISASI, SISA_ANGGARAN
      if (row.pagu !== undefined) {
        row.pagu = Number(row.pagu) || 0;
      }
      if (row.realisasi !== undefined) {
        row.realisasi = Number(row.realisasi) || 0;
      }
      if (row.sisa_anggaran !== undefined) {
        row.sisa_anggaran = Number(row.sisa_anggaran) || 0;
      }

      // Skip empty rows (tanpa kode)
      if (row.kode) {
        result.push(row);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        data: result
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

**Penjelasan Header Mapping:**

| Header di Sheets | Property di JavaScript |
|------------------|----------------------|
| KODE | `kode` |
| NAMA_KEGIATAN | `nama_kegiatan` |
| RINCIAN | `rincian` (digunakan sebagai `nama_acara`) |
| PAGU | `pagu` |
| REALISASI | `realisasi` |
| SISA ANGGARAN | `sisa_anggaran` (opsional - bisa dihitung otomatis)

4. Klik **Save** (Ctrl+S)
5. Klik **Deploy** → **New deployment**
6. Klik **Select type** → **Web app**
7. Konfigurasi:
   - **Description:** SIPAK Data API
   - **Execute as:** Me
   - **Who has access:** Anyone
8. Klik **Deploy**
9. **COPY URL** yang diberikan (format: `https://script.google.com/macros/s/.../exec`)

### Langkah 3: Konfigurasi Aplikasi

1. Buka file `config.js`
2. Edit bagian berikut:

```javascript
dataSource: {
    type: 'appsscript',
    appsScriptUrl: 'URL_GOOGLE_APPS_SCRIPT_ANDA',
    spreadsheetId: 'SPREADSHEET_ID_ANDA',
    sheetId: 0,
},
```

3. Contoh:

```javascript
dataSource: {
    type: 'appsscript',
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycbx.../exec',
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    sheetId: 0,
},
```

### Langkah 4: Testing

1. Buka `index.html` di browser
2. Masukkan kode kegiatan (contoh: KC-001)
3. Klik Cari atau tekan Enter
4. Data seharusnya muncul

---

## 📱 Cara Deployment

### Vercel (Recommended)

1. Buat repository baru di GitHub
2. Upload semua file project
3. Import project di [vercel.com](https://vercel.com)
4. Deploy!

### Netlify

1. Drag & drop folder project ke [app.netlify.com](https://app.netlify.com)
2. Done!

### GitHub Pages

1. Push ke GitHub repository
2. Settings → Pages → Enable
3. Pilih branch `main`

---

## 🔧 Troubleshooting

### Error: "Tidak dapat mengakses Google Sheets"

**Penyebab:** CORS policy memblokir fetch langsung.

**Solusi:** Gunakan Google Apps Script sebagai proxy (lihat Langkah 2 di atas).

### Error: "Script function not found"

**Penyebab:** Apps Script belum di-deploy dengan benar.

**Solusi:**
1. Buka Apps Script
2. Deploy → Manage deployments
3. Pastikan ada deployment aktif
4. Copy URL deployment baru jika ada

### Error: "Spreadsheet belum dipublikasi"

**Penyebab:** Spreadsheet tidak bisa diakses oleh Apps Script.

**Solusi:** Pastikan Apps Script memiliki akses ke spreadsheet:
1. Bagikan spreadsheet dengan email Apps Script (lihat di Project Settings)
2. Atau buat spreadsheet di folder yang sama dengan Google Drive

### Data tidak muncul

**Cek:**
1. Header kolom sudah benar (KODE, NAMA_KEGIATAN, PAGU, REALISASI)
2. Apps Script URL sudah benar
3. Spreadsheet ID sudah benar
4. Apps Script sudah di-deploy
5. Buka console browser (F12) untuk melihat error

---

## 📂 Struktur File

```
sipak/
├── index.html           # Halaman utama
├── config.js           # Konfigurasi aplikasi ⚠️ EDIT INI
├── css/
│   └── custom.css      # Styles kustom
├── js/
│   ├── app.js          # Logic utama
│   ├── sheets.js       # Handler data
│   └── utils.js       # Helper functions
├── SPEC.md             # Dokumentasi spesifikasi
└── README.md           # Dokumentasi (ini)
```

---

## 🎨 Kustomisasi

### Nama Instansi

Edit di `config.js`:

```javascript
instans: {
    nama: 'Kecamatan Anda',
    kabupaten: 'Kabupaten Anda',
    logo: null, // URL ke logo (opsional)
},
```

### Status Thresholds

Edit di `config.js`:

```javascript
status: {
    hijauMin: 0,    // <70% = hijau (Dana Tersedia)
    hijauMax: 70,
    kuningMin: 70,  // 70-90% = kuning (Perhatian)
    kuningMax: 90,
    merahMin: 90,   // >90% = merah (Kritis)
    merahMax: 100,
},
```

---

## 🔒 Keamanan

- Aplikasi ini **read-only** — tidak ada modify/delete data
- Data bersumber dari Google Sheets
- Google Apps Script menjalankan dengan permission pemilik
- Pastikan spreadsheet tidak berisi data sensitif yang tidak ingin dishare

---

## 📄 Lisensi

MIT License - Bebas digunakan untuk keperluan instansi pemerintahan.
# sipak-sistem-pencarian-anggaran
