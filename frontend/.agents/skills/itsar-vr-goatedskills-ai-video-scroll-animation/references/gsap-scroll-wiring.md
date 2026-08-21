# GSAP ScrollTrigger Wiring — Patterns & Code

Complete reference for wiring AI-generated video clips into scroll-synced website animations.
Covers both video scrub and image sequence approaches, with Apple-style hero section patterns.

## Table of Contents
1. [Dependencies & Setup](#1-dependencies--setup)
2. [Method A: Video Scrub](#2-method-a-video-scrub)
3. [Method B: Image Sequence (Apple-style)](#3-method-b-image-sequence-apple-style)
4. [Method C: Autoplay Loop (Parallax Background)](#4-method-c-autoplay-loop-parallax-background)
5. [Pinned Section Architecture](#5-pinned-section-architecture)
6. [Text + UI Layer on Scroll](#6-text--ui-layer-on-scroll)
7. [Performance Checklist](#7-performance-checklist)
8. [Mobile Considerations](#8-mobile-considerations)
9. [Common Issues & Fixes](#9-common-issues--fixes)

---

## 1. Dependencies & Setup

```bash
# Install GSAP (includes ScrollTrigger)
npm install gsap

# Or via CDN (for quick prototyping)
# <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
# <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
```

```javascript
// Always register ScrollTrigger before use
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
```

---

## 2. Method A: Video Scrub

**Best for:** Short clips (2–8s), desktop-first, when you want a real video feel.

### HTML
```html
<section id="hero-section" style="height: 400vh;">
  <div id="hero-sticky" style="position: sticky; top: 0; height: 100vh; overflow: hidden;">
    <video
      id="hero-video"
      src="/videos/hero-web.mp4"
      preload="auto"
      muted
      playsinline
      webkit-playsinline
      poster="/images/hero-poster.jpg"
      style="width: 100%; height: 100%; object-fit: cover;"
    ></video>
    <div id="hero-overlay" style="position: absolute; inset: 0; z-index: 10;">
      <!-- Text / UI layers go here -->
    </div>
  </div>
</section>
```

### JavaScript — Video Scrub
```javascript
const video = document.querySelector('#hero-video');

// Ensure video is ready before creating ScrollTrigger
const initScrollVideo = () => {
  ScrollTrigger.create({
    trigger: '#hero-section',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,          // 0.5s lag — smoother than scrub: true
    onUpdate: (self) => {
      if (video.readyState >= 2 && video.duration) {
        video.currentTime = self.progress * video.duration;
      }
    }
  });
};

// Wait for video metadata to load
if (video.readyState >= 2) {
  initScrollVideo();
} else {
  video.addEventListener('loadedmetadata', initScrollVideo);
}
```

### Variant: Scrub + Pin (true Apple-style)
```javascript
// Pin the entire section so scrolling within it drives the video
gsap.timeline({
  scrollTrigger: {
    trigger: '#hero-section',
    start: 'top top',
    end: '+=500%',        // scrolls 5x the viewport height through this section
    pin: true,
    scrub: 0.8,
    anticipatePin: 1,     // prevents layout jump on pin
  }
}).to(video, {
  // GSAP doesn't directly animate currentTime — use onUpdate instead
  // This timeline can drive OTHER animations (text, UI) in sync
  opacity: 1  // placeholder; see §6 for text animations
});

// Separate onUpdate for video scrub
ScrollTrigger.getById('video-scrub')?.kill(); // safety cleanup
const st = ScrollTrigger.create({
  trigger: '#hero-section',
  start: 'top top',
  end: '+=500%',
  scrub: 0.8,
  id: 'video-scrub',
  onUpdate: (self) => {
    if (video.duration) video.currentTime = self.progress * video.duration;
  }
});
```

---

## 3. Method B: Image Sequence (Apple-style)

**Best for:** Frame-perfect control, mobile performance, long scroll distances, high-end hero sections.
**Prerequisite:** Extract frames with ffmpeg (see `video-web-conversion.md`).

### HTML
```html
<section id="hero-section" style="height: 600vh;">
  <div id="hero-sticky" style="position: sticky; top: 0; height: 100vh; overflow: hidden;">
    <canvas
      id="hero-canvas"
      width="1920"
      height="1080"
      style="width: 100%; height: 100%; object-fit: cover;"
    ></canvas>
    <div id="hero-overlay" style="position: absolute; inset: 0; z-index: 10;">
      <!-- Text / UI layers -->
    </div>
  </div>
</section>
```

### JavaScript — Image Sequence
```javascript
const canvas = document.querySelector('#hero-canvas');
const ctx = canvas.getContext('2d');

// Config
const FRAME_COUNT = 120;   // match your actual frame count
const FRAME_PATH = (n) => `/frames/frame-${String(n).padStart(4, '0')}.jpg`;

// Preload all frames
const frames = new Array(FRAME_COUNT).fill(null);
let loadedCount = 0;

const preloadFrames = () => new Promise((resolve) => {
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (loadedCount === FRAME_COUNT) resolve();
    };
    img.onerror = () => { loadedCount++; if (loadedCount === FRAME_COUNT) resolve(); };
    img.src = FRAME_PATH(i + 1);  // frames start at frame-0001.jpg
    frames[i] = img;
  }
});

// Draw frame at index
const drawFrame = (index) => {
  const clamped = Math.max(0, Math.min(index, FRAME_COUNT - 1));
  if (frames[clamped]?.complete) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frames[clamped], 0, 0, canvas.width, canvas.height);
  }
};

// Init after preload
preloadFrames().then(() => {
  drawFrame(0);  // show first frame immediately

  ScrollTrigger.create({
    trigger: '#hero-section',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
    anticipatePin: 1,
    onUpdate: (self) => {
      const frameIndex = Math.floor(self.progress * (FRAME_COUNT - 1));
      drawFrame(frameIndex);
    }
  });
});
```

### Progressive Loading (for large frame counts)
```javascript
// Load first 10 frames immediately, rest in background
const preloadProgressively = async () => {
  // Phase 1: first 10 frames (shows content fast)
  await Promise.all(frames.slice(0, 10).map((_, i) => loadFrame(i)));
  drawFrame(0);
  initScrollTrigger();  // start listening to scroll immediately
  
  // Phase 2: rest of frames
  for (let i = 10; i < FRAME_COUNT; i++) {
    await loadFrame(i);
  }
};
```

---

## 4. Method C: Autoplay Loop (Parallax Background)

**Best for:** Subtle ambient motion background, section accents, not hero scrubbing.

```html
<section id="ambient-section" style="position: relative; height: 100vh; overflow: hidden;">
  <video
    autoplay
    loop
    muted
    playsinline
    src="/videos/ambient-loop-web.mp4"
    style="
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      z-index: 0;
    "
  ></video>
  <div style="position: relative; z-index: 1;">
    <!-- Section content -->
  </div>
</section>
```

**Optional parallax:**
```javascript
gsap.to('#ambient-section video', {
  yPercent: -20,
  ease: 'none',
  scrollTrigger: {
    trigger: '#ambient-section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true
  }
});
```

---

## 5. Pinned Section Architecture

A pinned section is the core of Apple-style scroll animation.

```
Page layout:
  ┌─────────────────┐   ← normal content above
  │                 │
  ├─────────────────┤   ← #hero-section starts (height: 400-600vh)
  │  ┌───────────┐  │   ← #hero-sticky (position: sticky; height: 100vh)
  │  │  canvas / │  │      while user scrolls 400-600vh through the section
  │  │  video    │  │      the sticky element stays at top: 0
  │  │           │  │      scroll progress = animation progress
  │  └───────────┘  │
  ├─────────────────┤   ← section ends, normal scrolling resumes
  │                 │
  └─────────────────┘
```

**Key CSS:**
```css
#hero-section {
  height: 400vh;  /* total scroll distance to drive the animation */
  position: relative;
}
#hero-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
```

**Why not use GSAP `pin: true`?** The CSS sticky approach is equally effective and avoids GSAP's
pin-spacer div injection which can cause layout issues. Use `pin: true` only when you need
GSAP to coordinate multiple elements across a complex timeline.

---

## 6. Text + UI Layer on Scroll

Layer text and UI elements that animate in sync with the video.

```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#hero-section',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5
  }
});

// Fade in headline at 20% scroll progress
tl.fromTo('#hero-headline',
  { opacity: 0, y: 40 },
  { opacity: 1, y: 0, duration: 0.2 },
  0.2  // position = 20% through the scrub timeline
)
// Fade in sub-headline at 40%
.fromTo('#hero-subhead',
  { opacity: 0, y: 20 },
  { opacity: 1, y: 0, duration: 0.2 },
  0.4
)
// Fade out everything at 80%
.to('#hero-text-group',
  { opacity: 0, duration: 0.15 },
  0.8
);
```

---

## 7. Performance Checklist

Before shipping:

- [ ] Video is compressed and web-optimized (see `video-web-conversion.md`)
- [ ] `preload="auto"` on video elements (not `lazy`)
- [ ] Canvas/video is hardware-accelerated: add `will-change: transform` to sticky container
- [ ] `scrub` value is numeric (not `true`) — `0.5` is the sweet spot
- [ ] Frame images are JPEG quality 75–80 (not PNG) for image sequences
- [ ] Frame images are served with correct `Cache-Control` headers
- [ ] ScrollTrigger `invalidateOnRefresh: true` set when layout depends on dynamic content
- [ ] `requestAnimationFrame` throttling for canvas draw when needed
- [ ] Lazy-load frame images below fold initially, preload on scroll approach
- [ ] Test in Chrome, Firefox, Safari (iOS Safari has specific video quirks)

---

## 8. Mobile Considerations

### Video Scrub on iOS Safari
`video.currentTime` seeking is unreliable on iOS Safari for inline video. Options:
1. **Use image sequence instead** (recommended for mobile-critical sites)
2. **Reduce video resolution** (720p max for mobile)
3. **Fall back to autoplay loop** on mobile:

```javascript
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
if (isMobile) {
  // Autoplay loop instead of scrub
  video.autoplay = true;
  video.loop = true;
  video.play();
} else {
  initScrollScrub();
}
```

### Canvas Sizing for Retina
```javascript
const dpr = window.devicePixelRatio || 1;
canvas.width = canvas.offsetWidth * dpr;
canvas.height = canvas.offsetHeight * dpr;
ctx.scale(dpr, dpr);
```

### Reduced Motion Respect
```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  // Show static poster image instead of animation
  canvas.style.display = 'none';
  document.querySelector('#hero-poster').style.display = 'block';
} else {
  initScrollAnimation();
}
```

---

## 9. Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Layout jumps when section pins | Add `anticipatePin: 1` to ScrollTrigger |
| Video shows black frame on load | Set `poster="/images/frame-0001.jpg"` |
| Scroll animation fires immediately | Check `start: "top top"` vs viewport position |
| Frame images slow to load | Switch to WebP format, serve from CDN |
| Safari video won't seek | Use image sequence; add `playsinline webkit-playsinline` |
| Canvas blurry on Retina | Apply DPR scaling (see §8) |
| ScrollTrigger wrong scroll distance | Add `invalidateOnRefresh: true`, call `ScrollTrigger.refresh()` after load |
| Text overlay flickers | Use `will-change: opacity` on animated text elements |
| Animation doesn't reset on scroll back | Confirm `scrub` is set (not just `onUpdate`) |
| GSAP pin leaves spacer artifacts | Use CSS sticky approach instead of GSAP `pin: true` |
