/**
 * SIPAK - Utility Functions
 *
 * Helper functions untuk formatting, validasi, dan utility umum.
 */

const Utils = {
    /**
     * Format angka menjadi format mata uang Indonesia
     * @param {number} amount - Jumlah angka
     * @param {string} simbol - Simbol mata uang (default: Rp)
     * @param {string} locale - Locale untuk formatting (default: id-ID)
     * @returns {string} String mata uang yang terformat
     */
    formatUang: function(amount, simbol = 'Rp', locale = 'id-ID') {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return `${simbol} 0`;
        }

        const number = Number(amount);
        const formatted = new Intl.NumberFormat(locale, {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number);

        return `${simbol} ${formatted}`;
    },

    /**
     * Parse string mata uang menjadi number
     * @param {string} str - String mata uang (contoh: "Rp 10.000.000")
     * @returns {number} Number
     */
    parseUang: function(str) {
        if (typeof str === 'number') return str;
        if (!str) return 0;

        // Hapus semua karakter non-angka
        const cleaned = str.toString().replace(/[^0-9]/g, '');
        return parseInt(cleaned, 10) || 0;
    },

    /**
     * Format tanggal ke format Indonesia
     * @param {Date|string|number} date - Tanggal
     * @param {boolean} includeTime - Sertakan waktu
     * @returns {string} Tanggal terformat
     */
    formatTanggal: function(date, includeTime = false) {
        const d = new Date(date);

        if (isNaN(d.getTime())) {
            return 'Tanggal tidak valid';
        }

        const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const bulan = CONFIG.display.namaBulan;

        const dayName = hari[d.getDay()];
        const day = d.getDate();
        const month = bulan[d.getMonth()];
        const year = d.getFullYear();

        let result = `${dayName}, ${day} ${month} ${year}`;

        if (includeTime) {
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            result += `, ${hours}:${minutes} WIB`;
        }

        return result;
    },

    /**
     * Format tanggal singkat Indonesia
     * @param {Date|string|number} date - Tanggal
     * @returns {string} Tanggal terformat singkat
     */
    formatTanggalSingkat: function(date) {
        const d = new Date(date);

        if (isNaN(d.getTime())) {
            return '-';
        }

        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();

        return `${day.toString().padStart(2, '0')} ${CONFIG.display.namaBulan[d.getMonth()]} ${year}`;
    },

    /**
     * Hitung persentase
     * @param {number} nilai - Nilai yang dicapai
     * @param {number} total - Total nilai
     * @returns {number} Persentase (0-100)
     */
    hitungPersentase: function(nilai, total) {
        if (!total || total === 0) return 0;
        const percentage = (nilai / total) * 100;
        return Math.round(percentage * 100) / 100; // 2 desimal
    },

    /**
     * Dapatkan status berdasarkan persentase penyerapan
     * @param {number} persentase - Persentase penyerapan
     * @returns {object} Objek dengan type, label, dan warna
     */
    getStatus: function(persentase) {
        const status = CONFIG.status;

        if (persentase >= status.merahMin && persentase <= status.merahMax) {
            return {
                type: 'danger',
                label: 'Penyerapan Tinggi',
                color: '#ef4444',
                bgColor: 'rgba(239, 68, 68, 0.1)',
                icon: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>`,
                progressClass: 'progress-danger',
            };
        } else if (persentase >= status.kuningMin && persentase < status.kuningMax) {
            return {
                type: 'warning',
                label: 'Perhatian',
                color: '#f59e0b',
                bgColor: 'rgba(245, 158, 11, 0.1)',
                icon: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>`,
                progressClass: 'progress-warning',
            };
        } else {
            return {
                type: 'success',
                label: 'Dana Tersedia',
                color: '#10b981',
                bgColor: 'rgba(16, 185, 129, 0.1)',
                icon: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>`,
                progressClass: 'progress-success',
            };
        }
    },

    /**
     * Validasi kode kegiatan
     * @param {string} kode - Kode kegiatan
     * @returns {boolean} Apakah valid
     */
    validasiKode: function(kode) {
        if (!kode || typeof kode !== 'string') return false;

        // Minimal 3 karakter
        if (kode.length < 3) return false;

        // Hanya alphanumeric, dash, dan spasi
        const validPattern = /^[A-Za-z0-9\-\s]+$/;
        return validPattern.test(kode);
    },

    /**
     * Normalisasi kode kegiatan (uppercase, trim)
     * @param {string} kode - Kode kegiatan
     * @returns {string} Kode normalisasi
     */
    normalisasiKode: function(kode) {
        if (!kode) return '';
        return kode.toString().toUpperCase().trim().replace(/\s+/g, ' ');
    },

    /**
     * Debounce function
     * @param {function} func - Function yang akan di-debounce
     * @param {number} wait - Waktu tunggu dalam ms
     * @returns {function} Function yang di-debounce
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Sleep/delay function
     * @param {number} ms - Waktu dalam ms
     * @returns {Promise} Promise yang resolve setelah ms
     */
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Log debug message
     * @param {...any} args - Arguments untuk console.log
     */
    debug: function(...args) {
        if (CONFIG.app.debug) {
            console.log('[SIPAK Debug]', ...args);
        }
    },

    /**
     * Escape HTML untuk mencegah XSS
     * @param {string} text - Text yang akan di-escape
     * @returns {string} Text yang sudah di-escape
     */
    escapeHtml: function(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    },

    /**
     * Generate QR code URL untuk deep linking
     * @param {string} kode - Kode kegiatan
     * @returns {string} URL dengan parameter kode
     */
    generateQrUrl: function(kode) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?kode=${encodeURIComponent(kode)}`;
    },
};

// Freeze CONFIG untuk prevent accidental modification
if (typeof Object.freeze === 'function') {
    Object.freeze(CONFIG);
    Object.freeze(CONFIG.status);
    Object.freeze(CONFIG.display);
    Object.freeze(CONFIG.app);
    Object.freeze(CONFIG.sheets);
    Object.freeze(CONFIG.instans);
}
