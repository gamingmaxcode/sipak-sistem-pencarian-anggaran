/**
 * SIPAK - Google Sheets Handler
 *
 * Module untuk mengambil dan memproses data dari Google Sheets.
 * Mendukung Google Apps Script sebagai proxy untuk menghindari CORS.
 */

const SheetsHandler = {
    // Cache untuk menyimpan data sementara
    cache: null,
    cacheTimestamp: null,
    CACHE_DURATION: 60000, // 1 menit

    /**
     * Ambil data dari sumber data
     * @returns {Promise<Array>} Array of objects
     */
    fetchData: async function() {
        // Cek cache dulu
        if (this.isCacheValid()) {
            Utils.debug('Menggunakan data dari cache');
            return this.cache;
        }

        // Jika mode sample, gunakan data sample
        if (CONFIG.dataSource.type === 'sample') {
            Utils.debug('Mode sample - menggunakan data demo');
            const sampleData = this.generateSampleData();
            this.cache = sampleData;
            this.cacheTimestamp = Date.now();
            return sampleData;
        }

        const dataUrl = CONFIG.getDataUrl();
        Utils.debug('Fetch data dari:', dataUrl);
        Utils.debug('Data source type:', CONFIG.dataSource.type);

        try {
            let data;

            if (CONFIG.dataSource.type === 'appsscript') {
                data = await this.fetchFromAppsScript(dataUrl);
            } else {
                data = await this.fetchFromCSV(dataUrl);
            }

            // Simpan ke cache
            this.cache = data;
            this.cacheTimestamp = Date.now();

            Utils.debug('Data berhasil di-parse:', data.length, 'records');
            return data;
        } catch (error) {
            Utils.debug('Error fetching data:', error);
            throw error;
        }
    },

    /**
     * Fetch dari Google Apps Script
     * @param {string} url - URL Apps Script
     * @returns {Promise<Array>} Array of objects
     */
    fetchFromAppsScript: async function(url) {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        Utils.debug('Apps Script response:', result);

        // Handle response dari Apps Script
        if (result.status === 'success' && Array.isArray(result.data)) {
            return result.data;
        } else if (Array.isArray(result)) {
            // Response langsung array
            return result;
        } else {
            throw new Error(result.message || 'Format response tidak valid');
        }
    },

    /**
     * Fetch CSV langsung (akan mengalami CORS jika tidak menggunakan proxy)
     * @param {string} url - URL CSV
     * @returns {Promise<Array>} Array of objects
     */
    fetchFromCSV: async function(url) {
        try {
            const response = await this.fetchWithTimeout(url, CONFIG.app.fetchTimeout);

            if (!response) {
                throw new Error('Gagal mengambil data dari Google Sheets');
            }

            return this.parseCSV(response);
        } catch (error) {
            // CORS error detection
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error(
                    'Tidak dapat mengakses Google Sheets langsung dari browser. ' +
                    'Gunakan Google Apps Script sebagai proxy. ' +
                    'Lihat README.md untuk panduan setup.'
                );
            }
            throw error;
        }
    },

    /**
     * Fetch dengan timeout
     * @param {string} url - URL untuk fetch
     * @param {number} timeout - Timeout dalam ms
     * @returns {Promise<string>} Response text
     */
    fetchWithTimeout: async function(url, timeout = 15000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'text/csv',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Handle redirect (307)
            const finalUrl = response.url;
            if (finalUrl !== url && finalUrl.includes('accounts.google.com')) {
                throw new Error('Spreadsheet belum dipublikasi. Pastikan spreadsheet dipublikasi ke web.');
            }

            return await response.text();
        } finally {
            clearTimeout(timeoutId);
        }
    },

    /**
     * Parse CSV string ke array of objects
     * @param {string} csvText - Raw CSV text
     * @returns {Array} Array of objects
     */
    parseCSV: function(csvText) {
        if (!csvText || typeof csvText !== 'string') {
            return [];
        }

        const lines = csvText.trim().split(/\r?\n/);

        if (lines.length < 2) {
            Utils.debug('CSV tidak memiliki header dan data');
            return [];
        }

        // Parse header
        const headers = this.parseCSVLine(lines[0]);

        // Normalize header names
        const normalizedHeaders = headers.map(h => this.normalizeHeader(h));

        Utils.debug('Headers terdeteksi:', normalizedHeaders);

        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = this.parseCSVLine(line);
            const row = {};

            normalizedHeaders.forEach((header, index) => {
                let value = values[index] || '';

                // Convert numeric values
                if (header === 'pagu' || header === 'realisasi' || header === 'sisa_anggaran') {
                    value = Utils.parseUang(value);
                }

                row[header] = value;
            });

            // Skip empty rows
            if (row.kode || row.nama_kegiatan) {
                data.push(row);
            }
        }

        return data;
    },

    /**
     * Parse satu baris CSV (handle quoted values)
     * @param {string} line - Satu baris CSV
     * @returns {Array} Array of values
     */
    parseCSVLine: function(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (inQuotes) {
                if (char === '"' && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++;
                } else if (char === '"') {
                    // End of quoted value
                    inQuotes = false;
                } else {
                    current += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
        }

        result.push(current.trim());
        return result;
    },

    /**
     * Normalize header name untuk konsistensi
     * @param {string} header - Original header
     * @returns {string} Normalized header
     */
    normalizeHeader: function(header) {
        if (!header) return '';

        const h = header.toString()
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Hapus special chars
            .replace(/\s+/g, '_')         // Spasi ke underscore
            .trim();

        // Mapping untuk nama kolom yang umum
        const mappings = {
            'kode': 'kode',
            'kode_kegiatan': 'kode',
            'kodekegiatan': 'kode',
            'nama': 'nama_kegiatan',
            'nama_kegiatan': 'nama_kegiatan',
            'namakegiatan': 'nama_kegiatan',
            'kegiatan': 'nama_kegiatan',
            'rincian': 'rincian',
            'nama_acara': 'rincian',
            'acara': 'rincian',
            'keterangan': 'rincian',
            'pagu': 'pagu',
            'pagu_anggaran': 'pagu',
            'paguanggaran': 'pagu',
            'anggaran': 'pagu',
            'realisasi': 'realisasi',
            'realisasi_anggaran': 'realisasi',
            'realisasianggaran': 'realisasi',
            'terpakai': 'realisasi',
            'sisa_anggaran': 'sisa_anggaran',
            'sisaanggar': 'sisa_anggaran',
            'sisa': 'sisa_anggaran',
        };

        return mappings[h] || h;
    },

    /**
     * Cari kegiatan berdasarkan kode
     * Mendukung struktur One-to-Many: satu Kode Kegiatan bisa memiliki banyak baris Acara
     * @param {string} kode - Kode kegiatan
     * @returns {Promise<Object|null>} Objek dengan data terakumulasi atau null
     */
    findByKode: async function(kode) {
        const normalizedKode = Utils.normalisasiKode(kode);

        Utils.debug('Mencari kegiatan dengan kode:', normalizedKode);

        try {
            const data = await this.fetchData();

            // Filter semua baris yang cocok dengan kode (One-to-Many)
            const matchedRows = data.filter(item => {
                const itemKode = item.kode ? item.kode.toString().toUpperCase().trim() : '';
                return itemKode === normalizedKode;
            });

            if (matchedRows.length === 0) {
                Utils.debug('Kegiatan tidak ditemukan untuk kode:', normalizedKode);
                return null;
            }

            // Ambil nama_kegiatan dari baris pertama
            const namaKegiatan = matchedRows[0].nama_kegiatan || '-';

            // Akumulasi total dari semua baris
            let totalPagu = 0;
            let totalRealisasi = 0;

            // Build array acara (breakdown per baris)
            const acaraList = matchedRows.map(row => {
                const pagu = row.pagu || 0;
                const realizations = row.realisasi || 0;
                // Gunakan sisa_anggaran jika ada, jika tidak hitung dari pagu - realizations
                const sisa = row.sisa_anggaran !== undefined ? row.sisa_anggaran : (pagu - realizations);

                totalPagu += pagu;
                totalRealisasi += realizations;

                return {
                    nama_acara: row.rincian || row.nama_acara || row.acara || row.keterangan || '-',
                    pagu: pagu,
                    realisasi: realizations,
                    sisa: sisa
                };
            });

            const result = {
                kode: normalizedKode,
                nama_kegiatan: namaKegiatan,
                totalPagu: totalPagu,
                totalRealisasi: totalRealisasi,
                totalSisa: totalPagu - totalRealisasi,
                percentage: Utils.hitungPersentase(totalRealisasi, totalPagu),
                acara: acaraList,
                rowCount: matchedRows.length
            };

            Utils.debug('Kegiatan ditemukan:', result);
            return result;
        } catch (error) {
            Utils.debug('Error saat mencari:', error);
            throw error;
        }
    },

    /**
     * Cek apakah cache masih valid
     * @returns {boolean}
     */
    isCacheValid: function() {
        if (!this.cache || !this.cacheTimestamp) return false;
        return (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
    },

    /**
     * Clear cache
     */
    clearCache: function() {
        this.cache = null;
        this.cacheTimestamp = null;
        Utils.debug('Cache cleared');
    },

    /**
     * Get last updated time
     * @returns {Date|null}
     */
    getLastUpdated: function() {
        return this.cacheTimestamp ? new Date(this.cacheTimestamp) : null;
    },

    /**
     * Generate sample data untuk testing
     * Data ini akan digunakan saat mode adalah 'sample'
     * Mendukung struktur One-to-Many: satu Kode Kegiatan bisa memiliki banyak baris Acara
     * @returns {Array} Sample data
     */
    generateSampleData: function() {
        return [
            // KC-001: 3 acara
            {
                kode: 'KC-001',
                nama_kegiatan: 'Pembangunan Gedung Serba Guna',
                rincian: 'Pembangunan Fisik Gedung',
                pagu: 100000000,
                realisasi: 65000000,
                sisa_anggaran: 35000000,
            },
            {
                kode: 'KC-001',
                nama_kegiatan: 'Pembangunan Gedung Serba Guna',
                rincian: 'Pengawasan Konstruksi',
                pagu: 30000000,
                realisasi: 19500000,
                sisa_anggaran: 10500000,
            },
            {
                kode: 'KC-001',
                nama_kegiatan: 'Pembangunan Gedung Serba Guna',
                rincian: 'Administrasi & Dokumentasi',
                pagu: 20000000,
                realisasi: 13000000,
                sisa_anggaran: 7000000,
            },
            // KC-002: 2 acara
            {
                kode: 'KC-002',
                nama_kegiatan: 'Pengadaan Alat Tulis Kantor',
                rincian: 'Pengadaan ATK Kantor Pusat',
                pagu: 15000000,
                realisasi: 11700000,
                sisa_anggaran: 3300000,
            },
            {
                kode: 'KC-002',
                nama_kegiatan: 'Pengadaan Alat Tulis Kantor',
                rincian: 'Pengadaan ATK Kantor Lapangan',
                pagu: 10000000,
                realisasi: 7800000,
                sisa_anggaran: 2200000,
            },
            // KC-003: 1 acara
            {
                kode: 'KC-003',
                nama_kegiatan: 'Pelatihan Teknologi Informasi',
                rincian: 'Pelatihan Komputer Dasar',
                pagu: 50000000,
                realisasi: 48000000,
                sisa_anggaran: 2000000,
            },
            // KC-004: 2 acara
            {
                kode: 'KC-004',
                nama_kegiatan: 'Perbaikan Jalan Desa',
                rincian: 'Perbaikan Jalan Utama',
                pagu: 150000000,
                realisasi: 93750000,
                sisa_anggaran: 56250000,
            },
            {
                kode: 'KC-004',
                nama_kegiatan: 'Perbaikan Jalan Desa',
                rincian: 'Pemasangan Drainase',
                pagu: 50000000,
                realisasi: 31250000,
                sisa_anggaran: 18750000,
            },
            // KC-005: 1 acara
            {
                kode: 'KC-005',
                nama_kegiatan: 'Penyuluhan Kesehatan Masyarakat',
                rincian: 'Penyuluhan PHBS',
                pagu: 35000000,
                realisasi: 28700000,
                sisa_anggaran: 6300000,
            },
            // KC-006: 1 acara
            {
                kode: 'KC-006',
                nama_kegiatan: 'Pengadaan Bibit Tanaman Holtikultura',
                rincian: 'Pengadaan & Penanaman Bibit',
                pagu: 75000000,
                realisasi: 45000000,
                sisa_anggaran: 30000000,
            },
            // KC-007: 1 acara
            {
                kode: 'KC-007',
                nama_kegiatan: 'Pemeliharaan Gedung Kantor',
                rincian: 'Pemeliharaan Rutin Kantor',
                pagu: 100000000,
                realisasi: 92500000,
                sisa_anggaran: 7500000,
            },
        ];
    },
};
