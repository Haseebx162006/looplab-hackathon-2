# Video Web Conversion — ffmpeg Reference

Complete ffmpeg recipes for converting AI-generated video clips to web-optimized formats
for use in scroll animations. Covers MP4, WebM, image sequences, and format tradeoffs.

**ffmpeg available at:** `/usr/bin/ffmpeg` (v6.1.1)

## Table of Contents
1. [Format Decision Guide](#1-format-decision-guide)
2. [MP4 Web Optimization](#2-mp4-web-optimization)
3. [WebM Conversion](#3-webm-conversion)
4. [Image Sequence Extraction](#4-image-sequence-extraction)
5. [Audio Removal](#5-audio-removal)
6. [Resize & Crop](#6-resize--crop)
7. [Batch Processing](#7-batch-processing)
8. [Quality vs File Size Reference](#8-quality-vs-file-size-reference)
9. [Transparency Caveat](#9-transparency-caveat)
10. [Verification Commands](#10-verification-commands)

---

## 1. Format Decision Guide

| Format | Use when | Pros | Cons |
|--------|----------|------|------|
| **MP4 (H.264)** | Maximum compatibility | Works everywhere, hardware decode | Largest file size |
| **MP4 (H.265/HEVC)** | Safari/iOS focus | 40% smaller than H.264 | No Firefox support |
| **WebM (VP9)** | Chrome/Firefox, smaller files | 30% smaller than H.264 | Limited Safari support |
| **WebM (AV1)** | Modern browsers, best compression | Smallest size | Slow to encode, limited hardware decode |
| **JPEG sequence** | Image sequence scroll animation | Fast draw, wide support | Large total size (~3–10x video) |
| **WebP sequence** | Image sequence, smaller | 30% smaller than JPEG | Some older browser gaps |

**Recommended for scroll animations:**
- **Desktop hero (video scrub):** MP4 H.264 + WebM VP9 with `<source>` fallback
- **Image sequence:** JPEG quality 75–80 (WebP if targeting modern browsers only)
- **Mobile fallback:** Lower-res MP4 with `autoplay loop`

---

## 2. MP4 Web Optimization

### Standard Web-Ready MP4
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -crf 23 \           # quality: 18=lossless, 23=default, 28=lower quality; 20-24 is sweet spot for web
  -preset medium \    # encode speed: ultrafast/fast/medium/slow (slower = smaller file)
  -movflags +faststart \  # moves metadata to start — CRITICAL for web streaming
  -an \               # strip audio (scroll animations don't use audio)
  output-web.mp4
```

### High Quality (production hero)
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -crf 18 \
  -preset slow \
  -movflags +faststart \
  -an \
  output-hq.mp4
```

### Mobile-Optimized (smaller file)
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -crf 28 \
  -preset medium \
  -vf scale=1280:-2 \   # scale to 720p (1280 wide, height auto-calculated)
  -movflags +faststart \
  -an \
  output-mobile.mp4
```

### H.265 (HEVC) — Safari/iOS
```bash
ffmpeg -i input.mp4 \
  -c:v libx265 \
  -crf 23 \
  -preset medium \
  -tag:v hvc1 \         # required for Safari compatibility
  -movflags +faststart \
  -an \
  output-hevc.mp4
```

---

## 3. WebM Conversion

### VP9 WebM (Best compatibility)
```bash
ffmpeg -i input.mp4 \
  -c:v libvpx-vp9 \
  -crf 30 \
  -b:v 0 \             # VBR mode (crf controls quality)
  -an \
  output-web.webm
```

### AV1 WebM (Best compression, slow encode)
```bash
ffmpeg -i input.mp4 \
  -c:v libaom-av1 \
  -crf 30 \
  -b:v 0 \
  -an \
  output-av1.webm
```

### HTML Multi-Source Pattern
Use both formats with `<source>` for optimal browser coverage:
```html
<video id="hero-video" preload="auto" muted playsinline>
  <source src="/videos/hero-web.webm" type="video/webm">
  <source src="/videos/hero-web.mp4" type="video/mp4">
</video>
```

---

## 4. Image Sequence Extraction

### JPEG Sequence (Recommended — fast, well-supported)
```bash
mkdir -p frames/

# All frames at original FPS
ffmpeg -i input.mp4 \
  -q:v 3 \              # JPEG quality: 2=best, 5=good, 10=low. Use 2-4 for scroll animations
  frames/frame-%04d.jpg

# Every other frame (halve frame count for performance)
ffmpeg -i input.mp4 \
  -vf "select=not(mod(n\,2))" \
  -vsync vfr \
  -q:v 3 \
  frames/frame-%04d.jpg

# Target specific FPS (e.g., 24fps from 60fps source)
ffmpeg -i input.mp4 \
  -vf fps=24 \
  -q:v 3 \
  frames/frame-%04d.jpg
```

### WebP Sequence (Smaller files)
```bash
ffmpeg -i input.mp4 \
  -vf fps=24 \
  -q:v 80 \             # WebP quality 0-100, 80 is a good balance
  frames/frame-%04d.webp
```

### Count Frames Before Extracting
```bash
# Get total frame count and duration
ffprobe -v error -select_streams v:0 \
  -count_packets -show_entries stream=nb_read_packets \
  -of csv=p=0 input.mp4

# Or get FPS and duration, calculate manually
ffprobe -v quiet -print_format json -show_streams input.mp4 | \
  jq '.streams[0] | {fps: .r_frame_rate, duration: .duration, nb_frames}'
```

### Frame Count Optimization
| Video | FPS | Duration | Frames @ 24fps | Frames @ 12fps |
|-------|-----|----------|----------------|----------------|
| 4 second clip | 30 | 4s | 96 | 48 |
| 6 second clip | 30 | 6s | 144 | 72 |
| 8 second clip | 30 | 8s | 192 | 96 |
| 10 second clip | 30 | 10s | 240 | 120 |

**Recommendation:** Extract at 24fps for smooth animation. If frame count > 200, consider 12fps (still smooth enough for most scroll speeds).

---

## 5. Audio Removal

Scroll animations should always be silent.

```bash
# Remove audio track (copy video stream, no audio)
ffmpeg -i input.mp4 -c:v copy -an output-silent.mp4

# Verify no audio track
ffprobe -v error -show_streams output-silent.mp4 | grep codec_type
# Should only show: codec_type=video
```

---

## 6. Resize & Crop

### Scale to Specific Width (maintain aspect ratio)
```bash
ffmpeg -i input.mp4 -vf scale=1920:-2 output-1080p.mp4
# -2 = auto-calculate height, keep divisible by 2 (required for H.264)
```

### Scale to Fit Within Bounds
```bash
ffmpeg -i input.mp4 -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" output.mp4
```

### Crop to 16:9 (from 21:9 or 9:16)
```bash
# Center crop to 16:9
ffmpeg -i input.mp4 -vf "crop=ih*16/9:ih" output-16x9.mp4

# Center crop to 9:16 (mobile)
ffmpeg -i input.mp4 -vf "crop=iw:iw*16/9" output-9x16.mp4
```

### Square Crop (1:1)
```bash
ffmpeg -i input.mp4 -vf "crop=min(iw\,ih):min(iw\,ih)" output-square.mp4
```

---

## 7. Batch Processing

### Process Multiple Clips
```bash
#!/bin/bash
# batch-convert.sh — web-optimize all MP4s in current dir
mkdir -p output/

for f in *.mp4; do
  name="${f%.mp4}"
  echo "Processing: $f"
  
  # MP4 web version
  ffmpeg -i "$f" -c:v libx264 -crf 23 -preset medium \
    -movflags +faststart -an \
    "output/${name}-web.mp4"
  
  # WebM version
  ffmpeg -i "$f" -c:v libvpx-vp9 -crf 30 -b:v 0 -an \
    "output/${name}-web.webm"
  
  echo "Done: $name"
done
echo "All clips processed."
```

### Extract Frames from Multiple Clips
```bash
#!/bin/bash
# batch-frames.sh — extract frames from all clips
for f in *.mp4; do
  name="${f%.mp4}"
  mkdir -p "frames/${name}/"
  ffmpeg -i "$f" -vf fps=24 -q:v 3 "frames/${name}/frame-%04d.jpg"
  count=$(ls "frames/${name}/" | wc -l)
  echo "${name}: ${count} frames extracted"
done
```

---

## 8. Quality vs File Size Reference

For a typical 6-second, 1920×1080, 30fps input:

| Format | CRF/Quality | Approx Size | Notes |
|--------|-------------|-------------|-------|
| MP4 H.264 | CRF 18 | ~15–30 MB | High quality, desktop hero |
| MP4 H.264 | CRF 23 | ~8–15 MB | Good quality, balanced |
| MP4 H.264 | CRF 28 | ~4–8 MB | Mobile-optimized |
| WebM VP9 | CRF 30 | ~5–10 MB | Smaller than H.264 |
| JPEG frames (24fps) | q:v 3 | ~30–60 MB total | 144 frames × ~200–400KB each |
| JPEG frames (12fps) | q:v 3 | ~15–30 MB total | 72 frames × ~200–400KB each |
| WebP frames (24fps) | q:v 80 | ~20–40 MB total | ~30% smaller than JPEG |

**File size target for web:**
- Video: < 10 MB for heroes (use WebM VP9 if needed)
- Image sequence: Serve from CDN with aggressive caching

---

## 9. Transparency Caveat

⚠️ **AI video cannot produce transparent/alpha-channel output. This is a hard constraint.**

- Higgsfield, Kling, Sora, WAN — all output opaque video (no alpha channel)
- WebM does support alpha channel (VP8/VP9), but AI models don't output it
- PNG/WebP sequences can carry alpha, but AI generation doesn't produce transparency

**Workarounds for compositing effects:**
```css
/* CSS blend modes work on video elements */
video { mix-blend-mode: screen; }    /* white background disappears */
video { mix-blend-mode: multiply; }  /* dark backgrounds blend */
video { mix-blend-mode: luminosity; }

/* CSS color manipulation */
video { filter: invert(1); }
video { filter: hue-rotate(180deg); }

/* Isolation layer approach */
.video-container {
  isolation: isolate;
  mix-blend-mode: screen;
}
```

**For true cutouts:** Use a dark/black solid background in the AI video prompt, then use
`mix-blend-mode: screen` in CSS to make the black background "disappear."
This works for light-on-black subjects (particles, glows, smoke, fire).

---

## 10. Verification Commands

```bash
# Verify output file is valid and check metadata
ffprobe -v quiet -print_format json -show_streams output-web.mp4 | \
  jq '.streams[] | {codec_name, codec_type, width, height, r_frame_rate, duration, bit_rate}'

# Confirm no audio stream
ffprobe -v error -show_streams -of csv=p=0 output-web.mp4 | grep audio
# → empty output = no audio ✅

# Check faststart flag (moov atom at start)
ffprobe -v trace -i output-web.mp4 2>&1 | grep -i moov | head -5
# → should see moov atom early in file

# Count extracted frames
ls frames/ | wc -l

# Check total frame dir size
du -sh frames/

# Verify image sequence is loadable
identify frames/frame-0001.jpg 2>/dev/null || file frames/frame-0001.jpg
```
