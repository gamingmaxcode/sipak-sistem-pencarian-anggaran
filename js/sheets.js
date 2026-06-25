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
                if (header === 'pagu' || header === 'realisasi') {
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

        const h = header.toLowerCase()
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
            'pagu': 'pagu',
            'pagu_anggaran': 'pagu',
            'paguanggaran': 'pagu',
            'anggaran': 'pagu',
            'realisasi': 'realisasi',
            'realisasi_anggaran': 'realisasi',
            'realisasianggaran': 'realisasi',
            'terpakai': 'realisasi',
        };

        return mappings[h] || h;
    },

    /**
     * Cari kegiatan berdasarkan kode
     * @param {string} kode - Kode kegiatan
     * @returns {Promise<Object|null>} Data kegiatan atau null
     */
    findByKode: async function(kode) {
        const normalizedKode = Utils.normalisasiKode(kode);

        Utils.debug('Mencari kegiatan dengan kode:', normalizedKode);

        try {
            const data = await this.fetchData();

            // Case-insensitive search
            const result = data.find(item => {
                const itemKode = item.kode ? item.kode.toString().toUpperCase().trim() : '';
                return itemKode === normalizedKode;
            });

            if (result) {
                Utils.debug('Kegiatan ditemukan:', result);
            } else {
                Utils.debug('Kegiatan tidak ditemukan untuk kode:', normalizedKode);
            }

            return result || null;
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
     * @returns {Array} Sample data
     */
    generateSampleData: function() {
        return [
            {
                kode: 'KC-001',
                nama_kegiatan: 'Pembangunan Gedung Serba Guna',
                pagu: 150000000,
                realizations: 97500000, // 65% - Hijau
            },
            {
                kode: 'KC-002',
                nama_kegiatan: 'Pengadaan Alat Tulis Kantor',
                pagu: 25000000,
                realizations: 19500000, // 78% - Kuning
            },
            {
                kode: 'KC-003',
                nama_kegiatan: 'Pelatihan Teknologi Informasi',
                pagu: 50000000,
                realizations: 48000000, // 96% - Merah
            },
            {
                kode: 'KC-004',
                nama_kegiatan: 'Perbaikan Jalan Desa',
                pagu: 200000000,
                realizations: 125000000, // 62.5% - Hijau
            },
            {
                kode: 'KC-005',
                nama_kegiatan: 'Penyuluhan Kesehatan Masyarakat',
                pagu: 35000000,
                realizations: 28700000, // 82% - Kuning
            },
            {
                kode: 'KC-006',
                nama_kegiatan: 'Pengadaan Bibit Tanaman Holtikultura',
                pagu: 75000000,
                realizations: 45000000, // 60% - Hijau
            },
            {
                kode: 'KC-007',
                nama_kegiatan: 'Pemeliharaan Gedung Kantor',
                pagu: 100000000,
                realizations: 92500000, // 92.5% - Merah
            },
        ];
    },
};
