/**
 * SIPAK - Main Application Logic (Modern UI with Landing Page)
 *
 * Module utama untuk controlling UI dan interaksi pengguna.
 */

const App = {
    // DOM Elements
    elements: {},
    alertTimeout: null,
    currentPage: 'landing', // 'landing' atau 'main'

    /**
     * Inisialisasi aplikasi
     */
    init: function() {
        Utils.debug('Inisialisasi SIPAK...');

        // Cache DOM elements
        this.cacheElements();

        // Setup event listeners
        this.setupEventListeners();

        // Apply custom configuration
        this.applyConfig();

        // Check untuk deep link dari QR Code
        this.checkDeepLink();

        // Start with splash screen then show landing
        this.showLandingPage();

        Utils.debug('SIPAK siap digunakan');
    },

    /**
     * Cache DOM elements untuk performance
     */
    cacheElements: function() {
        this.elements = {
            // Screens
            splashScreen: document.getElementById('splash-screen'),
            landingPage: document.getElementById('landing-page'),
            mainPage: document.getElementById('main-page'),

            // Logo Containers
            splashLogoContainer: document.getElementById('splash-logo-container'),
            landingLogoContainer: document.getElementById('landing-logo-container'),
            mainLogoContainer: document.getElementById('main-logo-container'),
            footerLogoContainer: document.getElementById('footer-logo-container'),
            landingFooterLogoContainer: document.getElementById('landing-footer-logo-container'),

            // Header & Footer
            namaInstansi: document.getElementById('nama-instansi'),
            footerInstansi: document.getElementById('footer-instansi'),
            landingFooterInstansi: document.getElementById('landing-footer-instansi'),

            // Landing Search
            landingSearchForm: document.getElementById('landing-search-form'),
            landingKodeInput: document.getElementById('landing-kode-kegiatan'),
            goToSearchBtn: document.getElementById('go-to-search'),
            backToLandingBtn: document.getElementById('back-to-landing'),

            // Main Search Form
            searchForm: document.getElementById('search-form'),
            kodeInput: document.getElementById('kode-kegiatan'),
            searchBtn: document.getElementById('search-btn'),
            searchIcon: document.getElementById('search-icon'),
            loadingIcon: document.getElementById('loading-icon'),
            clearBtn: document.getElementById('clear-btn'),
            inputHint: document.getElementById('input-hint'),

            // Initial State
            initialState: document.getElementById('initial-state'),

            // Alert
            alertContainer: document.getElementById('alert-container'),
            alertBanner: document.getElementById('alert-banner'),
            alertMessage: document.getElementById('alert-message'),
            alertClose: document.getElementById('alert-close'),

            // Result Section
            resultSection: document.getElementById('result-section'),
            resultSkeleton: document.getElementById('result-skeleton'),
            resultCard: document.getElementById('result-card'),
            cardKode: document.getElementById('card-kode'),
            cardNama: document.getElementById('card-nama'),
            cardPagu: document.getElementById('card-pagu'),
            cardRealisasi: document.getElementById('card-realisasi'),
            cardSisa: document.getElementById('card-sisa'),
            cardPersentase: document.getElementById('card-persentase'),
            cardProgressBar: document.getElementById('card-progress-bar'),
            progressGlow: document.getElementById('progress-glow'),
            cardStatusIcon: document.getElementById('card-status-icon'),
            cardIconContainer: document.getElementById('card-icon-container'),
            statusBadge: document.getElementById('status-badge'),
            statusBadgeText: document.getElementById('status-badge-text'),
            statusLabel: document.getElementById('status-label'),
            cardSisaIcon: document.getElementById('card-sisa-icon'),
            lastUpdated: document.getElementById('last-updated'),
        };
    },

    /**
     * Setup event listeners
     */
    setupEventListeners: function() {
        // Landing page search
        this.elements.landingSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const kode = this.elements.landingKodeInput.value;
            if (kode.trim()) {
                this.navigateToMain(kode);
            }
        });

        // Landing page "Mulai Pencarian" button
        this.elements.goToSearchBtn.addEventListener('click', () => {
            this.navigateToMain();
        });

        // Back to landing button
        this.elements.backToLandingBtn.addEventListener('click', () => {
            this.navigateToLanding();
        });

        // Main page input events
        this.elements.kodeInput.addEventListener('input', () => this.handleInputChange());
        this.elements.kodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSearch();
            }
        });

        // Form submit
        this.elements.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Clear button
        this.elements.clearBtn.addEventListener('click', () => this.handleClear());

        // Alert close
        this.elements.alertClose.addEventListener('click', () => this.hideAlert());
    },

    /**
     * Apply custom configuration dari config.js
     */
    applyConfig: function() {
        // Nama Instansi
        if (CONFIG.instans.nama) {
            const fullName = `${CONFIG.instans.nama}, ${CONFIG.instans.kabupaten}`;

            if (this.elements.namaInstansi) {
                this.elements.namaInstansi.textContent = CONFIG.instans.nama;
            }
            if (this.elements.footerInstansi) {
                this.elements.footerInstansi.textContent = fullName;
            }
            if (this.elements.landingFooterInstansi) {
                this.elements.landingFooterInstansi.textContent = fullName;
            }
        }

        // Apply custom logo if provided
        this.applyCustomLogo();
    },

    /**
     * Apply custom logo dari config
     */
    applyCustomLogo: function() {
        const logoUrl = CONFIG.instans.logo;

        if (!logoUrl) {
            Utils.debug('No custom logo provided, using default');
            return;
        }

        Utils.debug('Applying custom logo:', logoUrl);

        // Preload image to check if it exists
        const preloadImg = new Image();
        preloadImg.onload = () => {
            Utils.debug('Logo loaded successfully');
            this.replaceLogosWithImages(logoUrl);
        };
        preloadImg.onerror = () => {
            Utils.debug('Logo failed to load');
        };
        preloadImg.src = logoUrl;
    },

    /**
     * Replace all default logos with custom image
     */
    replaceLogosWithImages: function(logoUrl) {
        // Logo wrapper configurations - each has an ID and the element to replace
        const logoReplacements = [
            { wrapperId: 'landing-logo-wrapper', wrapperClass: 'w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden' },
            { wrapperId: 'splash-logo-wrapper', wrapperClass: 'w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-2xl shadow-accent-blue/30 overflow-hidden' },
            { wrapperId: 'main-logo-wrapper', wrapperClass: 'w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden' },
            { wrapperId: 'footer-logo-wrapper', wrapperClass: 'w-8 h-8 rounded-xl bg-white flex items-center justify-center overflow-hidden' },
            { wrapperId: 'landing-footer-logo-wrapper', wrapperClass: 'w-8 h-8 rounded-xl bg-white flex items-center justify-center overflow-hidden' },
        ];

        logoReplacements.forEach(config => {
            const wrapper = document.getElementById(config.wrapperId);
            if (!wrapper) {
                Utils.debug('Wrapper not found:', config.wrapperId);
                return;
            }

            // Clear existing content
            wrapper.innerHTML = '';

            // Remove gradient background and add white background
            wrapper.className = config.wrapperClass;

            // Create image element
            const img = document.createElement('img');
            img.src = logoUrl;
            img.alt = 'Logo';
            img.className = 'w-full h-full object-contain';

            wrapper.appendChild(img);
        });

        // Remove pulse ring from landing logo container since it may not look good with custom logo
        const landingLogoContainer = document.getElementById('landing-logo-container');
        if (landingLogoContainer) {
            const pulseRing = landingLogoContainer.querySelector('.animate-pulse-ring');
            if (pulseRing) {
                pulseRing.style.display = 'none';
            }
        }
    },

    /**
     * Check untuk deep link dari QR Code
     */
    checkDeepLink: function() {
        const kodeFromUrl = CONFIG.initFromUrl();

        if (kodeFromUrl) {
            // Auto-navigate to main page and search
            setTimeout(() => {
                this.navigateToMain(kodeFromUrl);
            }, 100);
        }
    },

    /**
     * Tampilkan landing page
     */
    showLandingPage: function() {
        // Show splash screen first
        this.elements.splashScreen.classList.remove('hidden');

        // After 1.5s, hide splash and show landing
        setTimeout(() => {
            // Fade out splash
            this.elements.splashScreen.style.opacity = '0';
            this.elements.splashScreen.style.transition = 'opacity 0.5s ease';

            setTimeout(() => {
                this.elements.splashScreen.classList.add('hidden');
                this.elements.splashScreen.style.opacity = '';

                // Show landing page
                this.elements.landingPage.classList.remove('hidden');
                this.currentPage = 'landing';
            }, 500);
        }, 1500);
    },

    /**
     * Navigasi ke halaman utama
     */
    navigateToMain: function(prefillKode = null) {
        // Fade out landing
        this.elements.landingPage.style.opacity = '0';
        this.elements.landingPage.style.transition = 'opacity 0.3s ease';

        setTimeout(() => {
            this.elements.landingPage.classList.add('hidden');
            this.elements.landingPage.style.opacity = '';

            // Show main page
            this.elements.mainPage.classList.remove('hidden');
            this.currentPage = 'main';

            // If there's a kode to search
            if (prefillKode) {
                this.elements.kodeInput.value = prefillKode;
                this.handleInputChange();
                setTimeout(() => {
                    this.handleSearch();
                }, 300);
            } else {
                // Focus input
                setTimeout(() => {
                    this.elements.kodeInput.focus();
                }, 100);
            }
        }, 300);
    },

    /**
     * Navigasi kembali ke landing page
     */
    navigateToLanding: function() {
        // Clear search
        this.handleClear();

        // Fade out main
        this.elements.mainPage.style.opacity = '0';
        this.elements.mainPage.style.transition = 'opacity 0.3s ease';

        setTimeout(() => {
            this.elements.mainPage.classList.add('hidden');
            this.elements.mainPage.style.opacity = '';

            // Show landing page
            this.elements.landingPage.classList.remove('hidden');
            this.currentPage = 'landing';

            // Clear landing input
            if (this.elements.landingKodeInput) {
                this.elements.landingKodeInput.value = '';
            }
        }, 300);
    },

    /**
     * Handle input change
     */
    handleInputChange: function() {
        const value = this.elements.kodeInput.value;

        // Normalisasi ke uppercase dengan cursor preservation
        if (value !== value.toUpperCase()) {
            const start = this.elements.kodeInput.selectionStart;
            const end = this.elements.kodeInput.selectionEnd;
            this.elements.kodeInput.value = value.toUpperCase();
            this.elements.kodeInput.setSelectionRange(start, end);
        }

        // Toggle button state
        const hasValue = value.trim().length >= 3;
        this.elements.searchBtn.disabled = !hasValue;

        // Show/hide clear button dengan animasi
        if (hasValue) {
            this.elements.clearBtn.classList.remove('opacity-0', 'scale-75');
            this.elements.clearBtn.classList.add('opacity-100', 'scale-100');
        } else {
            this.elements.clearBtn.classList.remove('opacity-100', 'scale-100');
            this.elements.clearBtn.classList.add('opacity-0', 'scale-75');
        }

        // Show/hide hint
        if (hasValue) {
            this.elements.inputHint.classList.remove('opacity-0');
            this.elements.inputHint.classList.add('opacity-100');
        } else {
            this.elements.inputHint.classList.remove('opacity-100');
            this.elements.inputHint.classList.add('opacity-0');
        }
    },

    /**
     * Handle clear button click
     */
    handleClear: function() {
        this.elements.kodeInput.value = '';
        this.elements.kodeInput.focus();
        this.handleInputChange();
        this.hideResult();
        this.hideAlert();
        this.elements.initialState.classList.remove('hidden');

        // Haptic feedback simulation via animation
        this.elements.kodeInput.classList.add('scale-105');
        setTimeout(() => {
            this.elements.kodeInput.classList.remove('scale-105');
        }, 150);
    },

    /**
     * Handle search submission
     */
    handleSearch: async function() {
        const kode = Utils.normalisasiKode(this.elements.kodeInput.value);

        if (!Utils.validasiKode(kode)) {
            this.showAlert('minimal 3 karakter');
            this.shakeInput();
            return;
        }

        // Start loading state
        this.setLoading(true);
        this.hideAlert();

        // Hide initial state
        this.elements.initialState.classList.add('hidden');

        // Minimum loading time untuk UX
        const minLoadingTime = Utils.sleep(300);

        try {
            // Fetch data
            const kegiatan = await SheetsHandler.findByKode(kode);

            // Wait for minimum loading time
            await minLoadingTime;

            if (kegiatan) {
                this.showResult(kegiatan);
            } else {
                this.showAlert();
                this.shakeInput();
            }
        } catch (error) {
            await minLoadingTime;
            Utils.debug('Search error:', error);
            this.showAlert('Gagal mengambil data. Periksa koneksi internet.');
            this.shakeInput();
        } finally {
            this.setLoading(false);
        }
    },

    /**
     * Shake input animation untuk feedback
     */
    shakeInput: function() {
        this.elements.kodeInput.classList.add('animate-shake');
        setTimeout(() => {
            this.elements.kodeInput.classList.remove('animate-shake');
        }, 500);
    },

    /**
     * Set loading state
     * @param {boolean} isLoading
     */
    setLoading: function(isLoading) {
        this.elements.searchBtn.disabled = isLoading;
        this.elements.kodeInput.disabled = isLoading;

        if (isLoading) {
            this.elements.searchBtn.classList.add('btn-loading');
            this.elements.searchBtn.classList.add('scale-95');
            this.elements.searchIcon.classList.add('hidden');
            this.elements.loadingIcon.classList.remove('hidden');
            this.elements.clearBtn.classList.add('hidden');
        } else {
            this.elements.searchBtn.classList.remove('btn-loading');
            this.elements.searchBtn.classList.remove('scale-95');
            this.elements.searchIcon.classList.remove('hidden');
            this.elements.loadingIcon.classList.add('hidden');
            this.elements.clearBtn.classList.remove('hidden');

            // Re-enable search button if valid input
            const hasValue = this.elements.kodeInput.value.trim().length >= 3;
            this.elements.searchBtn.disabled = !hasValue;
        }
    },

    /**
     * Show result card
     * @param {Object} kegiatan - Data kegiatan dengan struktur One-to-Many
     */
    showResult: function(kegiatan) {
        // Extract data dari struktur One-to-Many
        const pagu = kegiatan.totalPagu || 0;
        const real = kegiatan.totalRealisasi || 0;
        const sisa = kegiatan.totalSisa || (pagu - real);
        const percentage = kegiatan.percentage || Utils.hitungPersentase(real, pagu);
        const status = Utils.getStatus(percentage);
        const acaraList = kegiatan.acara || [];

        // Update card content
        this.elements.cardKode.textContent = Utils.escapeHtml(kegiatan.kode || '-');
        this.elements.cardNama.textContent = Utils.escapeHtml(kegiatan.nama_kegiatan || '-');
        this.elements.cardPagu.textContent = Utils.formatUang(pagu);
        this.elements.cardRealisasi.textContent = Utils.formatUang(real);
        this.elements.cardSisa.textContent = Utils.formatUang(sisa);
        this.elements.cardPersentase.textContent = `${percentage}%`;

        // Update status badge
        this.elements.statusBadge.className = 'px-3 py-1.5 rounded-full';
        this.elements.statusBadge.style.backgroundColor = status.bgColor;
        this.elements.statusBadgeText.textContent = status.label;
        this.elements.statusBadgeText.style.color = status.color;

        // Update status icon
        this.elements.cardStatusIcon.innerHTML = status.icon;
        this.elements.cardStatusIcon.style.backgroundColor = status.bgColor;
        this.elements.cardStatusIcon.style.color = status.color;

        // Update sisa card icon and gradient
        this.elements.cardSisaIcon.innerHTML = status.icon;

        // Update label
        this.elements.statusLabel.textContent = status.label;
        this.elements.statusLabel.style.color = status.color;

        // Update icon gradient based on status
        const iconGradient = this.getIconGradient(status.type);
        this.elements.cardIconContainer.style.background = iconGradient;

        // Update progress bar
        this.elements.cardProgressBar.className = `h-full rounded-full transition-all duration-1000 ease-out ${status.progressClass}`;
        if (status.type === 'success') {
            this.elements.cardProgressBar.style.background = 'linear-gradient(90deg, #10B981, #34D399, #6EE7B7)';
        } else if (status.type === 'warning') {
            this.elements.cardProgressBar.style.background = 'linear-gradient(90deg, #F59E0B, #FBBF24, #FCD34D)';
        } else {
            this.elements.cardProgressBar.style.background = 'linear-gradient(90deg, #EF4444, #F87171, #FCA5A5)';
        }

        // Build acara breakdown list (akordeon)
        this.buildAcaraBreakdown(acaraList, percentage);

        // Show section with animation
        this.elements.resultSection.classList.remove('hidden');

        // Reset animation
        this.elements.resultCard.style.opacity = '0';
        this.elements.resultCard.style.transform = 'translateY(40px) scale(0.96)';

        // Trigger reflow
        void this.elements.resultCard.offsetWidth;

        // Animate in
        this.elements.resultCard.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        this.elements.resultCard.style.opacity = '1';
        this.elements.resultCard.style.transform = 'translateY(0) scale(1)';

        // Animate progress bar
        setTimeout(() => {
            this.elements.cardProgressBar.style.width = `${Math.min(percentage, 100)}%`;

            // Show and animate glow
            this.elements.progressGlow.style.opacity = '1';
            this.elements.progressGlow.style.right = `${Math.min(percentage, 99)}%`;
        }, 100);

        // Update last updated
        const lastUpdated = SheetsHandler.getLastUpdated();
        if (lastUpdated) {
            this.elements.lastUpdated.querySelector('span').textContent = `Pembaruan: ${Utils.formatTanggal(lastUpdated, true)}`;
        }

        // Scroll to result
        setTimeout(() => {
            this.elements.resultSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    },

    /**
     * Build acara breakdown list (akordeon)
     * @param {Array} acaraList - Array of acara objects
     * @param {number} totalPercentage - Total percentage for overall status
     */
    buildAcaraBreakdown: function(acaraList, totalPercentage) {
        const container = document.getElementById('acara-breakdown-container');
        const listContainer = document.getElementById('acara-list');

        if (!container || !listContainer) return;

        // Clear existing content
        listContainer.innerHTML = '';

        // Hide container if no acara or only one (show main card only)
        if (!acaraList || acaraList.length <= 1) {
            container.classList.add('hidden');
            return;
        }

        // Show container
        container.classList.remove('hidden');

        // Update header info
        const countEl = document.getElementById('acara-count');
        if (countEl) {
            countEl.textContent = acaraList.length;
        }

        // Build each acara item
        acaraList.forEach((acara, index) => {
            const acaraPercentage = Utils.hitungPersentase(acara.realisasi || 0, acara.pagu || 0);
            const acaraStatus = Utils.getStatus(acaraPercentage);

            const item = document.createElement('div');
            item.className = 'border-b border-slate-100 dark:border-dark-700 last:border-b-0';
            item.innerHTML = `
                <button
                    class="acara-accordion-btn w-full flex items-center justify-between py-4 px-1 text-left hover:bg-slate-50 dark:hover:bg-dark-700/30 transition-colors duration-200 rounded-xl"
                    data-index="${index}"
                    aria-expanded="false"
                >
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-dark-900 dark:text-white break-words">${Utils.escapeHtml(acara.nama_acara || '-')}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            ${Utils.formatUang(acara.pagu || 0)} pagu
                        </p>
                    </div>
                    <div class="flex items-center gap-3 flex-shrink-0">
                        <div class="text-right">
                            <p class="text-sm font-semibold" style="color: ${acaraStatus.color}">
                                ${Utils.formatUang(acara.sisa || 0)}
                            </p>
                            <p class="text-[10px] text-slate-400">sisa</p>
                        </div>
                        <svg class="acara-chevron w-5 h-5 text-slate-400 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                </button>
                <div class="acara-accordion-content hidden pb-4">
                    <div class="bg-slate-50 dark:bg-dark-700/50 rounded-xl p-4 ml-0">
                        <div class="grid grid-cols-3 gap-3">
                            <div class="text-center">
                                <p class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pagu</p>
                                <p class="text-sm font-bold text-dark-900 dark:text-white">${Utils.formatUang(acara.pagu || 0)}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Realisasi</p>
                                <p class="text-sm font-bold text-dark-900 dark:text-white">${Utils.formatUang(acara.realisasi || 0)}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Sisa</p>
                                <p class="text-sm font-bold" style="color: ${acaraStatus.color}">${Utils.formatUang(acara.sisa || 0)}</p>
                            </div>
                        </div>
                        <div class="mt-3">
                            <div class="flex justify-between text-xs mb-1">
                                <span class="text-slate-500">Penyerapan</span>
                                <span class="font-semibold" style="color: ${acaraStatus.color}">${acaraPercentage}%</span>
                            </div>
                            <div class="h-2 bg-slate-200 dark:bg-dark-600 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500" style="width: ${Math.min(acaraPercentage, 100)}%; background: ${acaraStatus.color}"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add click handler for accordion
            const btn = item.querySelector('.acara-accordion-btn');
            const content = item.querySelector('.acara-accordion-content');
            const chevron = item.querySelector('.acara-chevron');

            btn.addEventListener('click', () => {
                const isExpanded = btn.getAttribute('aria-expanded') === 'true';

                // Close all others first (optional - for single open behavior)
                // document.querySelectorAll('.acara-accordion-content').forEach(el => el.classList.add('hidden'));
                // document.querySelectorAll('.acara-accordion-btn').forEach(el => el.setAttribute('aria-expanded', 'false'));
                // document.querySelectorAll('.acara-chevron').forEach(el => el.classList.remove('rotate-180'));

                if (isExpanded) {
                    content.classList.add('hidden');
                    btn.setAttribute('aria-expanded', 'false');
                    chevron.classList.remove('rotate-180');
                } else {
                    content.classList.remove('hidden');
                    btn.setAttribute('aria-expanded', 'true');
                    chevron.classList.add('rotate-180');
                }
            });

            listContainer.appendChild(item);
        });
    },

    /**
     * Get gradient class for icon based on status
     * @param {string} type
     * @returns {string}
     */
    getIconGradient: function(type) {
        switch(type) {
            case 'warning':
                return 'linear-gradient(135deg, #F59E0B, #FBBF24)';
            case 'danger':
                return 'linear-gradient(135deg, #EF4444, #F87171)';
            default:
                return 'linear-gradient(135deg, #3B82F6, #8B5CF6)';
        }
    },

    /**
     * Hide result card
     */
    hideResult: function() {
        // Animate out
        this.elements.resultCard.style.opacity = '0';
        this.elements.resultCard.style.transform = 'translateY(20px) scale(0.98)';

        setTimeout(() => {
            this.elements.resultSection.classList.add('hidden');
            this.elements.initialState.classList.remove('hidden');
            this.elements.cardProgressBar.style.width = '0%';
        }, 300);
    },

    /**
     * Show alert message
     * @param {string} customMessage
     */
    showAlert: function(customMessage = null) {
        const message = customMessage || 'Maaf, Kode Kegiatan tidak ditemukan atau salah input.';
        this.elements.alertMessage.textContent = message;

        this.elements.alertContainer.classList.remove('hidden');

        // Animate in
        this.elements.alertBanner.style.opacity = '0';
        this.elements.alertBanner.style.transform = 'translateY(-10px)';
        void this.elements.alertBanner.offsetWidth;
        this.elements.alertBanner.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        this.elements.alertBanner.style.opacity = '1';
        this.elements.alertBanner.style.transform = 'translateY(0)';

        // Clear existing timeout
        if (this.alertTimeout) {
            clearTimeout(this.alertTimeout);
        }

        // Auto dismiss after 5 seconds
        this.alertTimeout = setTimeout(() => {
            this.hideAlert();
        }, 5000);

        // Scroll to alert
        setTimeout(() => {
            this.elements.alertContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    },

    /**
     * Hide alert message
     */
    hideAlert: function() {
        // Animate out
        this.elements.alertBanner.style.opacity = '0';
        this.elements.alertBanner.style.transform = 'translateY(-10px)';

        setTimeout(() => {
            this.elements.alertContainer.classList.add('hidden');
        }, 300);

        if (this.alertTimeout) {
            clearTimeout(this.alertTimeout);
            this.alertTimeout = null;
        }
    },
};

// Add shake animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
        20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
    .animate-shake {
        animation: shake 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
