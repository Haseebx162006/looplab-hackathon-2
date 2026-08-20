# 🎯 HUNTR AI — Autonomous Sales Intelligence Platform Design System & Brand Architecture

> **HUNTR AI** is an enterprise-grade autonomous sales engine. The visual identity combines **futuristic glassmorphism**, **soft lavender tones (`#F5F2FA` / `#D8CBEB`)**, **deep obsidian dark surfaces (`#1E192B` / `#141118`)**, and **dynamic 3D robot storytelling animations**.

---

## 1. Vision & Visual Identity

- **Design Philosophy:** Modern SaaS High-Performance Aesthetic meets Interactive 3D Storytelling & Smooth GSAP Motion.
- **Visual Pillars:**
  - **Signature Lavender Palette:** Soft, sophisticated lavender (`#F5F2FA` background canvas, `#D8CBEB` hero card) paired with deep purple (`#7C3AED` / `#8B5CF6`) and obsidian (`#1C1921` / `#141118`).
  - **Dynamic Robot Storytelling:** Smooth GSAP ScrollTrigger timeline where the 3D Robot Hero Visual flies and transitions across page sections into Card 1 of the Autonomous Lead Engine.
  - **Tactile Glassmorphism:** Layered `backdrop-blur-xl`, subtle 1px border glows (`border-white/80`), and high-end drop shadows (`drop-shadow-[0_24px_60px_rgba(70,40,110,0.35)]`).
  - **High-Density Data Visualizations:** Recharts Area & Bar charts for conversion velocity, ROI, and CAC reduction metrics.

---

## 2. Color System & Design Tokens

### Core Color Palette

| Token Name | Hex Code | Visual Swatch | Role / Application |
| :--- | :--- | :--- | :--- |
| **Lavender Canvas** | `#F5F2FA` | 🟪 Light Lavender | Primary page background canvas |
| **Lavender Accent** | `#D8CBEB` | 🍇 Soft Lavender | Hero container background, notch accents |
| **Deep Obsidian** | `#1E192B` | ⬛ Obsidian Dark | Stats cards, dark tech containers, dark mode |
| **Midnight Tech** | `#141118` | 🖤 Deep Dark | Deep AI & Vector Architecture section background |
| **Primary Purple** | `#7C3AED` | 💜 Vibrant Purple | Active badges, primary CTA buttons, highlighted text |
| **Emerald Success** | `#10B981` | 🟩 Emerald Green | Active agent indicators, high-intent lead scores, growth badges |
| **Amber Warning** | `#F59E0B` | 🟧 Warm Amber | Caution badges, intent indicators |
| **Pure White** | `#FFFFFF` | ⚪ Crisp White | Card surfaces, pill backgrounds, crisp typography |

---

## 3. Typography Architecture

The platform uses a modern monospace & sans-serif hierarchy:
- **Display & Headings:** `Outfit`, `Geist Sans` — Crisp, bold geometric headlines with subtle letter-spacing.
- **Data & Code Indicators:** `Geist Mono` — Monospaced technical badges, status codes, HUD terminals, and percentage counters.

---

## 4. Key Component & Page Architecture

### 1. Preloader (`src/features/preloader/components/Preloader.tsx`)
- GSAP-driven editorial word-stagger curtain intro with SVG ring progress counter (0% → 100%).
- Smooth curtain slide exit (`expo.inOut`) to reveal the main landing experience.

### 2. Header & Navigation (`src/app/hero/components/Navbar.tsx`)
- Inverted concave curve white notch logo container.
- Lavender pill navigation with active tab indicator dot (`Home`, `How It Works`, `Capabilities`, `Architecture`).
- Contextual state actions (`ONBOARDING`, `LOGIN`, `DASHBOARD`).

### 3. Hero Landing Container (`src/app/hero/components/HeroSection.tsx`)
- **Robot Hero Visual (`RobotHeroVisual.tsx`):** Ambient background glow with centered 3D Robot illustration (`#hero-robot-img`).
- **Headline (`HeroHeadline.tsx`):** Large bold typography introducing autonomous sales velocity.
- **Offerings & Chart Cards (`CourseOfferingsCard.tsx`, `StudentsChartCard.tsx`):** Floating glass metrics cards.
- **Tag Cloud (`TopicTagCloud.tsx`):** Interactive pills highlighting AI capabilities.
- **Why Choose Section (`WhyChooseSection.tsx`):** 3 feature comparison cards below the main hero box.

### 4. Robot Storytelling Scroll Experience (`src/app/storytelling/components/InteractiveScrollExperience.tsx`)
- Fixed 3D robot clone (`flyingRobotRef`) that tracks scroll progress.
- As the user scrolls from Hero down to the How It Works section, GSAP interpolates bounds from `#hero-robot-img` to `#card1-image-slot`.
- The robot smoothly flies down, shrinks, and docks into Card 1 (`#card1-robot-img`).

### 5. Pinned Horizontal Scroll Engine (`src/app/how-it-works/components/HorizontalScrollSection.tsx`)
- GSAP ScrollTrigger pinned horizontal scrub track displaying the 7-step autonomous SDR pipeline:
  1. `Company Ingest & Upload`
  2. `ICP Matrix Matching`
  3. `Prospect Discovery`
  4. `Deep Intent Research`
  5. `Automated Qualification`
  6. `Omnichannel Outreach`
  7. `Zero-Touch Meeting Booking`

### 6. Capabilities Bento Grid (`src/app/bento/components/BentoGridSection.tsx`)
- 12-column responsive GSAP animated grid:
  - `Pipeline Feed Card` (7 cols)
  - `Multi-Channel Outreach Card` (5 cols)
  - `Enrichment Card` (4 cols)
  - `Meeting Scheduler Card` (4 cols)
  - `Analytics Card` (4 cols)

### 7. Empirical Analytics & Metrics (`src/app/stats/components/StatsSection.tsx`)
- 4 Animated counter metric cards (`AnimatedCounter`): Leads Processed (`4,920+`), Demo Meetings (`640+`), ROI (`14.8x`), Deliverability (`99.8%`).
- Recharts `ConversionChart` (AreaChart) & `RevenueChart` (BarChart for -92% CAC reduction).

### 8. Deep AI & Vector Architecture (`src/features/...`)
- Dark midnight tech section (`#141118`) embedding live backend capabilities:
  - **`HealthCard.tsx`:** Real-time PostgreSQL & pgvector health status.
  - **`VectorSearchDemo.tsx`:** Interactive high-dimensional cosine similarity search.
  - **`RagDemo.tsx`:** Grounded QA search, knowledge ingestion, and vector store management.

### 9. Multi-Column Brand Footer (`src/app/components/Footer.tsx`)
- Lavender gradient glow background with 6-column navigation links, social channels, copyright, and massive geometric `HUNTR` watermark.

---

## 5. Motion & Interaction Design Standards

- **GSAP ScrollTrigger:** Scrub timelines for horizontal section pinning and robot flight path.
- **Lenis Smooth Scroll:** Synchronized with GSAP ticker for 60fps jitter-free scrolling.
- **Framer Motion:** Micro-interactions for hover states, sidebar expansion (`HoverSidebar.tsx`), and badge animations.
