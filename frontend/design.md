# 🎨 Won J You Studios | Premium Design System & Brand Architecture

> **Won J You Studios** is an elite UX/UI design coaching and mentorship studio. The visual identity embodies **warm editorial minimalism**, high-contrast typography, and precision spatial hierarchy.

---

## 1. Vision & Core Aesthetic

- **Design Philosophy:** Luxury Editorial Minimalism meets High-Performance Digital Product Design.
- **Visual Pillars:**
  - **High-Contrast Editorial Typography:** Pairing geometric modern sans (`Avantt`) with classic serif (`Times New Roman`) for authoritative elegance.
  - **Vibrant Accent Palette:** Powered by warm vermilion coral (`#EF5143`), cream (`#FEE9CE`), and deep obsidian black (`#0A0A0A`).
  - **Tactile Glassmorphism:** Subtle backdrop blurs (`backdrop-blur-md`), ambient layered shadows, and sleek 1px inner borders.

---

## 2. Color System & Design Tokens

The color architecture is built directly from the studio's brand assets (`frontend/public/image.png`) with complete 50–950 tonal scales, CSS Custom Properties, and Tailwind CSS mappings.

### Brand Key Colors (From Palette)

| Brand Role | Hex Code | Visual Swatch | Intent |
| :--- | :--- | :--- | :--- |
| **Primary Coral** | `#EF5143` | 🔴 Vermilion Red | Hero CTA, key focus elements, active badges |
| **Warm Cream** | `#FEE9CE` | 🍦 Cream / Beige | Light background surfaces, soft highlights |
| **Charcoal Gray** | `#4E4E4E` | 🔘 Slate Charcoal | Subtitle text, muted borders, secondary UI |
| **Deep Obsidian** | `#0A0A0A` | ⬛ Obsidian Black | Dark mode canvas, primary text, high contrast |
| **Pure White** | `#FFFFFF` | ⚪ Clean White | Surface cards, light mode canvas, crisp text |

---

### Tonal Scales (50 – 950)

#### Primary Coral (`#EF5143`)

| Shade | Hex | HSL | CSS Variable | Tailwind Class |
| :--- | :--- | :--- | :--- | :--- |
| **50** | `#FEF2F1` | `5°, 86%, 97%` | `--color-primary-50` | `bg-primary-50` |
| **100** | `#FDE2DF` | `6°, 84%, 93%` | `--color-primary-100` | `bg-primary-100` |
| **200** | `#FBCAB5` | `18°, 89%, 85%` | `--color-primary-200` | `bg-primary-200` |
| **300** | `#F89B8C` | `8°, 88%, 76%` | `--color-primary-300` | `bg-primary-300` |
| **400** | `#F4715F` | `7°, 88%, 66%` | `--color-primary-400` | `bg-primary-400` |
| **500 (Core)** | `#EF5143` | `5°, 84%, 60%` | `--color-primary-500` | `bg-primary-500` |
| **600** | `#D93628` | `5°, 73%, 50%` | `--color-primary-600` | `bg-primary-600` |
| **700** | `#B6281C` | `5°, 73%, 41%` | `--color-primary-700` | `bg-primary-700` |
| **800** | `#96241B` | `5°, 69%, 35%` | `--color-primary-800` | `bg-primary-800` |
| **900** | `#7C241C` | `5°, 63%, 30%` | `--color-primary-900` | `bg-primary-900` |
| **950** | `#440E0A` | `4°, 74%, 15%` | `--color-primary-950` | `bg-primary-950` |

#### Warm Cream (`#FEE9CE`)

| Shade | Hex | HSL | CSS Variable | Tailwind Class |
| :--- | :--- | :--- | :--- | :--- |
| **50** | `#FFFDF9` | `38°, 100%, 99%` | `--color-cream-50` | `bg-cream-50` |
| **100 (Core)** | `#FEE9CE` | `35°, 96%, 90%` | `--color-cream-100` | `bg-cream-100` |
| **200** | `#FCDCB4` | `34°, 93%, 85%` | `--color-cream-200` | `bg-cream-200` |
| **300** | `#F9C891` | `31°, 91%, 77%` | `--color-cream-300` | `bg-cream-300` |
| **400** | `#F5AD65` | `30°, 89%, 68%` | `--color-cream-400` | `bg-cream-400` |
| **500** | `#EE8E3B` | `28°, 84%, 58%` | `--color-cream-500` | `bg-cream-500` |
| **600** | `#DF701E` | `25°, 76%, 50%` | `--color-cream-600` | `bg-cream-600` |
| **700** | `#BA5317` | `22°, 78%, 41%` | `--color-cream-700` | `bg-cream-700` |
| **800** | `#944219` | `20°, 71%, 34%` | `--color-cream-800` | `bg-cream-800` |
| **900** | `#783718` | `19°, 67%, 28%` | `--color-cream-900` | `bg-cream-900` |
| **950** | `#411A0B` | `17°, 71%, 15%` | `--color-cream-950` | `bg-cream-950` |

#### Charcoal & Neutral Dark (`#4E4E4E` & `#0A0A0A`)

| Shade | Hex | Description | CSS Variable | Tailwind Class |
| :--- | :--- | :--- | :--- | :--- |
| **50** | `#FAFAFA` | Off-White Surface | `--color-neutral-50` | `bg-neutral-50` |
| **100** | `#F4F4F5` | Muted Subsurface | `--color-neutral-100` | `bg-neutral-100` |
| **200** | `#E4E4E7` | Light Border | `--color-neutral-200` | `bg-neutral-200` |
| **300** | `#D4D4D8` | Divider Lines | `--color-neutral-300` | `bg-neutral-300` |
| **400** | `#A1A1AA` | Disabled Text | `--color-neutral-400` | `bg-neutral-400` |
| **500** | `#71717A` | Placeholder / Metadata | `--color-neutral-500` | `bg-neutral-500` |
| **600 (Charcoal)**| `#4E4E4E` | Secondary Text / Borders | `--color-neutral-600` | `bg-neutral-600` |
| **700** | `#3F3F46` | Dark Card Border | `--color-neutral-700` | `bg-neutral-700` |
| **800** | `#27272A` | Elevated Dark Surface | `--color-neutral-800` | `bg-neutral-800` |
| **900** | `#18181B` | Deep Base Background | `--color-neutral-900` | `bg-neutral-900` |
| **950 (Obsidian)**| `#0A0A0A` | Core Dark Canvas | `--color-neutral-950` | `bg-neutral-950` |

#### Semantic Status Tokens

| Intent | Hex | Usage | Token Variable |
| :--- | :--- | :--- | :--- |
| **Success** | `#10B981` | Completed Milestones, Active Mentorship | `--color-success` |
| **Warning** | `#F59E0B` | Session Expiry, Limited Slots | `--color-warning` |
| **Error** | `#EF4444` | Validation Error, Booking Conflict | `--color-error` |
| **Info** | `#3B82F6` | General Announcement, Tips | `--color-info` |

---

## 3. Typography Architecture

The studio uses a high-contrast editorial pairing:
1. **Body & Clean Interface (Sans):** `Avantt` — Clean, modern geometric sans-serif (`font-['avantt']`).
2. **Editorial Display & Statements (Serif):** `Times New Roman` — Sophisticated serif for headlines, quotes, and accent metrics (`font-['Times_New_Roman']`).

```css
/* Custom Font Families */
font-family: 'avantt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
font-family: 'Times New Roman', Times, Georgia, serif;
```

### Tailwind Utilities Mapping

```tsx
// Body & Modern UI Elements
className="font-['avantt'] text-neutral-900 dark:text-neutral-50"

// Editorial Headlines & Hero Titles
className="font-['Times_New_Roman'] italic font-normal tracking-tight text-neutral-950"
```

### Font Size & Fluid Scale

| Scale Token | Size (rem / px) | Line Height | Tracking | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `xs` | `0.694rem` (11.1px) | `1.4` | `+0.02em` | Badges, Micro Labels |
| `sm` | `0.793rem` (12.7px) | `1.4` | `0em` | Captions, Metadata |
| `base` | `0.892rem` (14.2px) | `1.5` | `0em` | Primary Body Text |
| `lg` | `0.942rem` (15.0px) | `1.5` | `-0.01em` | Lead Paragraphs |
| `xl` | `0.991rem` (15.8px) | `1.4` | `-0.01em` | H4 Subheadings |
| `2xl` | `1.090rem` (17.4px) | `1.3` | `-0.02em` | H3 Section Titles |
| `3xl` | `1.586rem` (25.3px) | `1.2` | `-0.025em` | H2 Page Headers |
| `4xl` | `3.767rem` (60.2px) | `1.05` | `-0.03em` | H1 Hero Display Titles |

---

## 4. Spatial Grid & Layout System

Base grid unit is **`4px`** (`0.25rem`).

```css
:root {
  --spacing-0: 0px;
  --spacing-1: 0.25rem;  /* 4px */
  --spacing-2: 0.5rem;   /* 8px */
  --spacing-3: 0.75rem;  /* 12px */
  --spacing-4: 1.00rem;  /* 16px */
  --spacing-5: 1.25rem;  /* 20px */
  --spacing-6: 1.50rem;  /* 24px */
  --spacing-8: 2.00rem;  /* 32px */
  --spacing-12: 3.00rem; /* 48px */
  --spacing-16: 4.00rem; /* 64px */
  --spacing-24: 6.00rem; /* 96px */
}
```

### Responsive Breakpoints & Containers

- **Mobile:** `375px` (Padding: `16px`)
- **Tablet:** `768px` (Padding: `32px`)
- **Desktop:** `1280px` (Max container width: `1200px`)
- **Ultra-Wide:** `1536px` (Max container width: `1440px`)

---

## 5. Borders, Shadows & Glassmorphism

### Border Radius Tokens

| Radius Name | Value | Purpose | Tailwind |
| :--- | :--- | :--- | :--- |
| `none` | `0px` | Crisp dividers | `rounded-none` |
| `sm` | `0.3965rem` (6.3px) | Buttons, Tag Badges | `rounded-sm` |
| `md` | `0.5947rem` (9.5px) | Standard Cards, Inputs | `rounded-md` |
| `lg` | `0.75rem` (12px) | Modals, Featured Cards | `rounded-lg` |
| `xl` | `1.00rem` (16px) | Hero Containers, Floating Panels | `rounded-xl` |
| `2xl` | `1.50rem` (24px) | Feature Glass Panels | `rounded-2xl` |
| `full` | `9999px` | Avatars, Pill Buttons | `rounded-full` |

### Shadow & Elevation System

```css
:root {
  /* Subtle ambient shadow for cards */
  --shadow-sm: rgba(0, 0, 0, 0.08) 0px 4px 12px 0px;

  /* Medium elevation for dropdowns & floating UI */
  --shadow-md: rgba(0, 0, 0, 0.12) 0px 9.5px 25.3px 0px;

  /* High elevation for modals & sticky navbars */
  --shadow-lg: rgba(0, 0, 0, 0.18) 0px 20px 35px -5px;

  /* Signature Coral Brand Glow */
  --shadow-primary-glow: 0px 10px 30px -5px rgba(239, 81, 67, 0.4);
}
```

### Glassmorphism Specification

```css
/* Glass Card Dark */
.glass-card-dark {
  background: rgba(10, 10, 10, 0.75);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Glass Card Light */
.glass-card-light {
  background: rgba(254, 233, 206, 0.65); /* Warm Cream Glass */
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(239, 81, 67, 0.15);
}
```

---

## 6. Component Specs & Patterns

### 1. Primary Action Button (`Coral Hero`)

```html
<!-- Primary Button (Coral Brand) -->
<button class="font-['avantt'] bg-[#EF5143] text-white font-medium text-base px-6 py-3 rounded-md shadow-md hover:bg-[#D93628] hover:shadow-[0_10px_25px_-5px_rgba(239,81,67,0.4)] active:scale-[0.98] transition-all duration-200 ease-out flex items-center gap-2">
  <span>Book 1:1 Mentorship</span>
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
</button>
```

### 2. Secondary Editorial Button (`Cream Outline`)

```html
<!-- Secondary Button -->
<button class="font-['avantt'] bg-[#FEE9CE] text-[#0A0A0A] border border-[#4E4E4E]/20 font-medium text-base px-6 py-3 rounded-md hover:bg-[#FCDCB4] hover:border-[#EF5143] transition-all duration-200 ease-out">
  Explore Case Studies
</button>
```

### 3. Glassmorphic Mentorship Card

```html
<div class="glass-card-dark rounded-xl p-8 max-w-md border border-white/10 hover:border-[#EF5143]/50 transition-all duration-300 group">
  <div class="flex justify-between items-start mb-6">
    <span class="font-['avantt'] text-xs font-semibold uppercase tracking-wider text-[#EF5143] bg-[#EF5143]/10 px-3 py-1 rounded-full border border-[#EF5143]/20">
      1:1 Mentorship
    </span>
    <span class="font-['Times_New_Roman'] italic text-2xl text-[#FEE9CE]">$299/mo</span>
  </div>
  <h3 class="font-['Times_New_Roman'] text-3xl font-normal text-white mb-3 group-hover:text-[#EF5143] transition-colors">
    Senior UX Portfolio Mastery
  </h3>
  <p class="font-['avantt'] text-neutral-400 text-sm leading-relaxed mb-6">
    Tailored guidance to refine your portfolio, pass senior design interviews, and unlock leadership roles.
  </p>
</div>
```

---

## 7. Motion & Interaction Architecture

- **Hover Micro-Interactions:** `duration-200 ease-out` with subtle scale transforms (`hover:scale-[1.02]`).
- **Modal & Drawer Transitions:** `cubic-bezier(0.16, 1, 0.3, 1)` for smooth spring physics.
- **Scroll Reveals:** IntersectionObserver fading from `opacity: 0, translateY(20px)` to `opacity: 1, translateY(0)` over `600ms`.

---

## 8. Master Tailwind Configuration Reference

To apply these tokens across your Next.js application, add the following to `tailwind.config.ts`:

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FEF2F1',
          100: '#FDE2DF',
          200: '#FBCAB5',
          300: '#F89B8C',
          400: '#F4715F',
          500: '#EF5143', // Brand Core
          600: '#D93628',
          700: '#B6281C',
          800: '#96241B',
          900: '#7C241C',
          950: '#440E0A',
        },
        cream: {
          50: '#FFFDF9',
          100: '#FEE9CE', // Brand Warm Cream
          200: '#FCDCB4',
          300: '#F9C891',
          400: '#F5AD65',
          500: '#EE8E3B',
          600: '#DF701E',
          700: '#BA5317',
          800: '#944219',
          900: '#783718',
          950: '#411A0B',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#4E4E4E', // Brand Charcoal
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#0A0A0A', // Brand Obsidian
        },
      },
      fontFamily: {
        sans: ['avantt', 'sans-serif'],
        serif: ['Times New Roman', 'serif'],
      },
    },
  },
};

export default config;
```

---
*Created for Won J You Studios — High-End UX/UI Coaching & Mentorship Platform.*
