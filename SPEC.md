# SIPAK - Spesifikasi Desain & Technical

## 1. Design Vision

SIPAK mengadopsi filosofi **"Government Meets Modernity"** — menggabungkan kesan profesional dan resmi pemerintahan dengan estetika mobile app modern seperti aplikasi fintech atau super-app Indonesia masa kini. Desain ini harus terasa premium, bersih, dan memberikan kepercayaan bahwa data yang ditampilkan akurat dan official.

**Referensi Visual:** Grab, Gojek, BCA, DANA — aplikasi yang dikenal luas oleh pengguna Indonesia.

---

## 2. Screen Architecture

### 2.1 Screen Flow

```
┌─────────────────┐
│  SPLASH SCREEN  │  (1.5 detik)
│    Logo Anim    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LANDING PAGE   │  ◄─────────────────┐
│  - Hero Text    │                    │
│  - Search CTA   │                    │
│  - How It Works │                    │
│  - Features     │                    │
│  - Status Guide │                    │
└────────┬────────┘                    │
         │                              │
         ▼                              │
┌─────────────────┐    ┌──────────────┐  │
│  MAIN APP PAGE  │───►│   BACK BTN   │──┘
│  - Search Input │    └──────────────┘
│  - Result Card │
│  - Footer      │
└─────────────────┘
```

### 2.2 Screen Specifications

| Screen | Fungsi | Trigger |
|--------|--------|---------|
| Splash | Brand impression, loading | Auto (1.5s on start) |
| Landing | Onboarding, info, entry point | After splash |
| Main App | Pencarian data anggaran | Click "Mulai Pencarian" atau search di landing |

---

## 3. Design Language

### Aesthetic Direction
- **Style:** Neo-brutalist minimal dengan sentuhan glassmorphism
- **Mood:** Profesional, terpercaya, modern, mobile-first
- **Character:** Clean surfaces, bold typography, subtle gradients, generous whitespace

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `dark-900` | `#0F172A` | Primary dark background, text |
| `dark-800` | `#1E293B` | Card backgrounds (dark mode) |
| `dark-700` | `#334155` | Borders, secondary elements |
| `accent-blue` | `#3B82F6` | Primary accent, CTAs |
| `accent-purple` | `#8B5CF6` | Secondary accent, gradients |
| `accent-cyan` | `#06B6D4` | Tertiary accent |
| `success` | `#10B981` | Positive status, available funds |
| `warning` | `#F59E0B` | Caution status, moderate usage |
| `danger` | `#EF4444` | Alert status, high usage |

### Typography

**Font Family:** Plus Jakarta Sans (Google Fonts)

| Style | Weight | Size | Line Height |
|-------|--------|------|-------------|
| Display | 800 (ExtraBold) | 3xl (30px) | 1.2 |
| Heading | 700 (Bold) | xl (20px) | 1.3 |
| Subheading | 600 (SemiBold) | lg (18px) | 1.4 |
| Body | 500 (Medium) | base (16px) | 1.5 |
| Caption | 400 (Regular) | sm (14px) | 1.5 |
| Micro | 600 (SemiBold) | xs (12px) | 1.4 |
| Kode | 500 (Medium) | base (16px) | mono |

### Motion Philosophy

All animations use **cubic-bezier(0.16, 1, 0.3, 1)** — a smooth deceleration curve.

| Animation | Duration | Purpose |
|-----------|----------|---------|
| Splash → Landing | 500ms fade | Screen transition |
| Landing → Main | 300ms fade | Navigation |
| Card entrance | 600ms | Content reveal |
| Progress fill | 1000ms | Data visualization |
| Splash duration | 1500ms | Brand moment |

---

## 4. Component Specifications

### 4.1 Splash Screen

- **Background:** Dark gradient (#0F172A)
- **Content:** Centered logo + app name + "Memuat..."
- **Animation:** Logo bounce-in, pulse ring effect
- **Duration:** 1.5 seconds
- **Exit:** Fade out 500ms

### 4.2 Landing Page

**Header Section:**
- Dark background (#0F172A) dengan gradient accents
- Logo dengan pulse animation
- Hero text: "Cek Anggaran dalam Genggaman"
- Subtitle explaining the app

**Search CTA Card:**
- Positioned at top of content (-mt-10 overlap)
- Glow effect on hover
- Input + Arrow button

**Features Grid:**
- 3-column layout
- Cards: Real-time, Aman, Mobile
- Each with icon + title + description

**How It Works:**
- Step-by-step numbered cards
- Icons for each step
- Clear description

**Status Legend:**
- Color-coded status explanation
- Green/Yellow/Red with descriptions

**CTA Button:**
- Full-width "Mulai Pencarian" button
- Gradient background
- Arrow icon

### 4.3 Main App Page

**Header:**
- Back button (left)
- Title "Cek Anggaran"
- Live indicator badge (right)
- Backdrop blur effect

**Search Input:**
- Same design as landing
- Clear button appears when filled
- Enter hint text

**Result Card:**
- Multi-part card design
- Header with code + badge
- Stats grid (Pagu, Realisasi)
- Sisa card with gradient
- Progress bar with glow

### 4.4 Navigation

**Back Button Flow:**
- Landing → Main: "Mulai Pencarian" button
- Main → Landing: Back arrow button
- Fade transition (300ms)

---

## 5. Data Flow

### 5.1 Search Flow

```
User Input → Validate (min 3 chars) → Loading State
    │
    ▼
SheetsHandler.findByKode(kode)
    │
    ├── Cache Hit → Return cached data
    │
    └── Cache Miss → Fetch from data source
                         │
                         ├── 'sample' mode → Return demo data
                         ├── 'appsscript' → Fetch from Apps Script
                         └── 'csv' → Fetch from Google Sheets (CORS issue)
    │
    ▼
Data Found → Show Result Card
    │
    ▼
Data Not Found → Show Error Alert
```

### 5.2 Data Source Modes

| Mode | Use Case | Pros | Cons |
|------|----------|------|------|
| `sample` | Demo/Testing | No setup, works offline | Static data |
| `appsscript` | Production | CORS-free, secure | Needs setup |
| `csv` | Quick test | Simple | CORS blocked |

---

## 6. Technical Approach

### Stack
- **HTML5** — Semantic markup
- **Tailwind CSS** — via CDN
- **Vanilla JavaScript** — ES6+, no build step
- **Google Fonts** — Plus Jakarta Sans

### File Structure
```
sipak/
├── index.html           # Main entry (all screens)
├── config.js           # Configuration
├── css/
│   └── custom.css      # Animations & styles
├── js/
│   ├── app.js          # UI Controller + Navigation
│   ├── sheets.js       # Data fetching
│   └── utils.js        # Helpers
├── SPEC.md
└── README.md
```

### Data Schema

| Column | Aliases | Type |
|--------|---------|------|
| KODE | KODE_KEGIATAN | string |
| NAMA_KEGIATAN | NAMA, KEGIATAN | string |
| RINCIAN | NAMA_ACARA, ACARA, KETERANGAN | string |
| SATUAN | - | string |
| VOL | VOLUME | number |
| JENIS_PENGADAAN | JENIS | string |
| PAGU | PAGU_ANGGARAN, ANGGARAN | number |
| REALISASI | REALISASI_ANGGARAN | number |
| SISA_ANGGARAN | SISA | number |

---

## 7. Responsive Design

| Breakpoint | Behavior |
|------------|----------|
| `< 640px` | Full mobile experience |
| `640px+` | Centered container, max-w-lg |
| `1024px+` | Desktop enhancements |

---

## 8. Status Thresholds

| Percentage | Status | Color | Label |
|-----------|--------|-------|-------|
| 0-70% | Success | Green | Dana Tersedia |
| 70-90% | Warning | Yellow | Perhatian |
| 90-100% | Danger | Red | Penyerapan Tinggi |

---

## 9. Browser Support

- Chrome 90+
- Safari 14+
- Firefox 90+
- Edge 90+
- Samsung Internet 14+

---

## 10. Future Enhancements

- [ ] History of recent searches
- [ ] Share result as image
- [ ] Dark mode toggle
- [ ] Multiple sheet support
- [ ] Offline mode with cached data
- [ ] QR scanner integration
- [ ] Push notifications for budget alerts
