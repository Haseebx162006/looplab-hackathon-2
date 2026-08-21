---
name: ai-video-scroll-animation
description: >
  Create scroll-stopping website hero and section animations using AI-generated video clips (Higgsfield, Kling, Sora, WAN). Covers the full pipeline: browser-driven generation on Higgsfield, prompt and model selection, variation strategy, quality/export/download, ffmpeg web conversion, and wiring the resulting clips into GSAP ScrollTrigger scroll-synced animations (Apple-style video scrubbing and image-sequence playback). Use when the user wants to: (1) generate cinematic AI video for website hero sections, (2) build Apple-style scroll-synced video animations, (3) set up a Higgsfield generation workflow via browser, (4) convert AI video for web use, (5) wire video into GSAP/ScrollTrigger. Related: browser-automation (login), video-frames (frame extraction), canvas-design (visual design).
---

# AI Video Scroll Animation

Full pipeline: **AI video generation → web conversion → scroll-synced animation**.

## Table of Contents

1. [Quick Decision: Which Approach?](#1-quick-decision-which-approach)
2. [Higgsfield Browser Workflow](#2-higgsfield-browser-workflow)
3. [Prompt & Model Selection](#3-prompt--model-selection)
4. [Generation Count & Variation Strategy](#4-generation-count--variation-strategy)
5. [Quality, Export & Download](#5-quality-export--download)
6. [Web Conversion (ffmpeg)](#6-web-conversion-ffmpeg)
7. [GSAP ScrollTrigger Wiring](#7-gsap-scrolltrigger-wiring)
8. [Validation Loop](#8-validation-loop)

See reference files for deep detail:
- [`references/higgsfield-browser-flow.md`](references/higgsfield-browser-flow.md) — step-by-step Higgsfield session
- [`references/gsap-scroll-wiring.md`](references/gsap-scroll-wiring.md) — ScrollTrigger patterns + code
- [`references/video-web-conversion.md`](references/video-web-conversion.md) — ffmpeg recipes + format tradeoffs
- [`assets/scroll-video-hero-template/`](assets/scroll-video-hero-template/) — drop-in HTML/JS template

---

## 1. Quick Decision: Which Approach?

| Goal | Approach |
|------|----------|
| Smooth scroll-scrubbed cinematic clip | Video scrub (MP4 + `currentTime` seek) |
| Maximum frame control (like Apple) | Image sequence (extract frames with ffmpeg) |
| Parallax background with subtle motion | Autoplay loop (muted, `preload=auto`) |
| Section transition between scenes | Pinned section with GSAP timeline |

**Apple-style means image sequence**, not video scrub. Video scrub is easier to implement but has seek latency on mobile. Image sequences are larger but frame-perfect. Pick based on clip length and performance budget.

---

## 2. Higgsfield Browser Workflow

**Prerequisites:** Higgsfield account must be logged in via the `openclaw` browser profile. See `browser-automation` skill for login flow. Higgsfield auth is Clerk-based (~30 day session).

### Quick Flow

```
1. Verify login at https://higgsfield.ai/create/video
2. Select model (see §3)
3. Write prompt (see §3)
4. Configure settings: duration, aspect ratio, quality tier
5. Generate → wait for completion (30s–5min depending on model/tier)
6. Download MP4 from the result card
7. Close tab
```

**Full step-by-step browser automation playbook:** see [`references/higgsfield-browser-flow.md`](references/higgsfield-browser-flow.md).

⚠️ **Honest caveat:** Higgsfield does not expose a public API. All generation is browser-driven. Direct download automation may be blocked if the download triggers a protected URL — in that case, ask the user to manually download and provide the file path.

---

## 3. Prompt & Model Selection

### Model Picker

| Model | Best for | Duration | Notes |
|-------|----------|----------|-------|
| **Kling 3.0 Motion Control** | Character action, precise motion | up to 30s | Best for hero clips with controlled motion |
| **Kling 2.6** | Cinematic quality + audio | 5–10s | Use when audio texture adds to the scene |
| **WAN 2.5** | Image-to-video, filmic | 4–8s | Best for transforming a brand image into motion |
| **Sora 2 MAX** | Highest fidelity, complex scenes | 5–20s | Slowest, most expensive, best output quality |
| **Minimax Video-01** | Fast iteration, realistic motion | 6s | Good for quick variation cycles |

**Default recommendation for scroll animations:** Start with **Kling 3.0** for hero clips (controlled, cinematic). Use **Sora 2 MAX** for the final production version of hero clips where quality matters most.

### Prompt Formula for Scroll-Stop Motion

```
[Subject + visual style] [Camera motion] [Lighting/mood] [Action/motion detail]
```

**Examples:**
- `"Cinematic wide shot of abstract liquid metal rippling outward in slow motion. Ultra-smooth camera push-in. Moonlit blue and chrome highlights. 4K film texture, no text."`
- `"Close-up of a glowing glass sphere refracting light, rotating very slowly. Macro lens bokeh. Warm amber gradient background. Seamless loop motion."`
- `"Aerial flyover of a futuristic city at dusk. Slow dolly-up camera. Neon reflections on wet streets. Cinematic 2.39:1 aspect ratio."`

### Prompt Anti-Patterns (avoid these)
- Generic verbs: "moving," "animated," "cool" → too vague, produces mediocre results
- Conflicting motion cues: "zoom in AND zoom out" → model gets confused
- Text in scene: AI video text is almost always garbled
- Transparency request: AI video cannot produce transparent/alpha-channel video — don't ask for it

---

## 4. Generation Count & Variation Strategy

**Minimum: 3 generations per concept.** AI video has high variance — you need options.

**Strategy:**
1. **Round 1 (3 gens):** Same prompt, same model, different seeds. Pick the strongest.
2. **Round 2 (2 gens):** Tweak the winner's prompt (adjust camera motion or lighting). Compare.
3. **Round 3 (1 gen):** Upscale/enhance the final pick using Higgsfield Enhancer.

**Credit budget estimate:**
- Kling 3.0: ~4–6 credits/gen
- Sora 2 MAX: ~15–25 credits/gen
- For a hero section: budget 15–30 credits to reach a strong result

**Aspect ratios for web:**
- `16:9` — standard desktop hero
- `9:16` — mobile full-screen hero
- `21:9` (CinemaScope) — ultra-wide cinematic hero, dramatic effect
- `1:1` — square section accent

---

## 5. Quality, Export & Download

### Higgsfield Quality Tiers
- **Standard** — fast, lower fidelity. Good for round 1 iteration.
- **Pro** — better detail, costs more credits. Use for round 2+.
- **Max** — highest quality (Sora 2 MAX or Kling enhanced). Final production only.

### Download Steps
1. Generation completes → result appears in the feed/gallery card
2. Click the 3-dot menu or hover the result card
3. Look for **"Download"** or the download icon
4. Downloads as `.mp4` (H.264, typically 720p or 1080p)
5. If download is blocked: right-click the video element → "Save video as..."
6. Rename to a descriptive slug: `hero-liquid-metal-v1.mp4`

### Upscale/Enhance (Optional but Recommended)
- Higgsfield Enhancer: navigate to `/upscale`, upload the downloaded clip
- Upscales to 1080p–4K and improves sharpness
- Worth doing for the final hero production clip

---

## 6. Web Conversion (ffmpeg)

**Full ffmpeg recipes:** see [`references/video-web-conversion.md`](references/video-web-conversion.md).

### Quick Reference

```bash
# Standard web-ready MP4 (H.264, fast start for streaming)
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium \
  -movflags +faststart -an output-web.mp4

# WebM VP9 (smaller, great for Chrome/Firefox)
ffmpeg -i input.mp4 -c:v libvpx-9 -crf 30 -b:v 0 \
  -an output-web.webm

# Strip audio (scroll animations don't need audio)
ffmpeg -i input.mp4 -c:v copy -an output-silent.mp4

# Extract image sequence for frame-perfect scroll (Apple style)
# Creates frame-0001.jpg, frame-0002.jpg, etc.
ffmpeg -i input.mp4 -q:v 3 frames/frame-%04d.jpg

# Resize to 1920×1080
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:v libx264 -crf 23 output-1080p.mp4
```

⚠️ **Transparency caveat:** AI-generated video **cannot produce transparent (alpha channel) output**. All Higgsfield/Kling/Sora outputs are opaque MP4. If you need compositing effects, achieve them with CSS `mix-blend-mode`, `filter`, or overlay elements — not video alpha.

---

## 7. GSAP ScrollTrigger Wiring

**Full patterns + working code:** see [`references/gsap-scroll-wiring.md`](references/gsap-scroll-wiring.md).

**Drop-in template:** see [`assets/scroll-video-hero-template/`](assets/scroll-video-hero-template/).

### Method A: Video Scrub (easiest)

Wire scroll position to `video.currentTime`. Works great for 2–8 second clips.

```javascript
gsap.registerPlugin(ScrollTrigger);

const video = document.querySelector('#hero-video');

// Preload
video.load();

ScrollTrigger.create({
  trigger: '#hero-section',
  start: 'top top',
  end: 'bottom bottom',
  pin: true,
  scrub: 0.5,
  onUpdate: (self) => {
    if (video.duration) {
      video.currentTime = self.progress * video.duration;
    }
  }
});
```

### Method B: Image Sequence (Apple-style)

More performant on mobile, frame-perfect.

```javascript
gsap.registerPlugin(ScrollTrigger);

const canvas = document.querySelector('#hero-canvas');
const ctx = canvas.getContext('2d');
const frameCount = 120; // number of extracted frames
const frames = [];

// Preload all frames
const loadFrames = async () => {
  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = `/frames/frame-${String(i).padStart(4, '0')}.jpg`;
    frames.push(img);
    await new Promise(r => img.onload = r);
  }
};

loadFrames().then(() => {
  ScrollTrigger.create({
    trigger: '#hero-section',
    start: 'top top',
    end: '+=300%', // scroll distance
    pin: true,
    scrub: 0.5,
    onUpdate: (self) => {
      const idx = Math.min(
        Math.floor(self.progress * (frameCount - 1)),
        frameCount - 1
      );
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[idx], 0, 0, canvas.width, canvas.height);
    }
  });
});
```

### Critical Implementation Rules
- **Always mute scroll-scrubbed video** — audio at arbitrary seek positions is jarring
- **Set `preload="auto"`** on video elements so playback is immediate
- **Pin the section** with `pin: true` — scroll inside the section advances the animation
- **Use `scrub: 0.5–1`** not `scrub: true` (numeric = smoother lag following)
- **Test on mobile** — video scrub seek latency is real on Safari/iOS
- **Before/after screenshot** is mandatory before calling this done (see §8)

---

## 8. Validation Loop

**Never call this done without visual confirmation.** The rule from AGENTS.md applies:

```
1. Implement scroll animation
2. Start dev server
3. Screenshot the hero section
4. Scroll slowly — does the video advance correctly?
5. Check: no flicker, no dark overlay ghosts, no layout jump when pinning
6. Check mobile (375px viewport)
7. If anything looks off → fix → repeat from step 2
```

### Common Failure Modes
- **Pinning causes layout jump** → set `anticipatePin: 1` on ScrollTrigger
- **Video stutters on seek** → switch to image sequence, or reduce video resolution
- **Dark grey box on load** → video poster frame is black; set `poster` attribute or preload first frame
- **Animation fires too early** → check `start` offset, add `invalidateOnRefresh: true`
- **Mobile Safari doesn't seek** → use image sequence; `currentTime` seeking is unreliable in inline video on iOS

### Verification Command
```bash
# Check frame count extracted correctly
ls frames/ | wc -l

# Check video metadata
ffprobe -v quiet -print_format json -show_streams output-web.mp4 | jq '.streams[0] | {codec_name, width, height, r_frame_rate, duration}'
```
