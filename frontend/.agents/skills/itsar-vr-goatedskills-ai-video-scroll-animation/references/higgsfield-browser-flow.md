# Higgsfield Browser Flow — Step-by-Step Playbook

This document covers the full browser automation flow for generating AI video on Higgsfield,
including login verification, model selection, settings configuration, generation polling,
and download. All browser calls use the `openclaw` profile.

## Table of Contents
1. [Login Check](#1-login-check)
2. [Navigate to Video Creation](#2-navigate-to-video-creation)
3. [Select Model](#3-select-model)
4. [Configure Generation Settings](#4-configure-generation-settings)
5. [Enter Prompt & Generate](#5-enter-prompt--generate)
6. [Poll for Completion](#6-poll-for-completion)
7. [Download the Result](#7-download-the-result)
8. [Cleanup](#8-cleanup)
9. [Fallback: Manual Download Request](#9-fallback-manual-download-request)

---

## 1. Login Check

```python
# Start browser
browser(action="start", profile="openclaw")
browser(action="navigate", targetUrl="https://higgsfield.ai/create/video", profile="openclaw")
snap = browser(action="snapshot", compact=True, profile="openclaw")
```

**Read snapshot output:**
- If you see "Sign in", "Log in", or "Continue with Google" → **NOT logged in** → go to [Manual Login Flow](#manual-login-flow)
- If you see the video creation UI or a text area / model selector → **logged in ✅** → proceed

### Manual Login Flow (if needed)
```
1. Navigate to https://higgsfield.ai (homepage)
2. Click "Sign In" or "Start Creating"
3. Tell AR: "Higgsfield login needed. Browser is open — please log in manually and confirm when done."
4. Wait for AR confirmation
5. Snapshot to verify logged-in state (look for profile avatar top-right)
6. Update the browser-automation SKILL.md Logged-In Services table
```

⚠️ Higgsfield uses Clerk for auth. Do NOT automate Google/GitHub OAuth. Manual login only.
Session persists ~30 days in the `openclaw` browser profile user data dir.

---

## 2. Navigate to Video Creation

Higgsfield has multiple creation tools. For cinematic scroll-animation video, use:

| URL | Tool | Best for |
|-----|------|---------|
| `https://higgsfield.ai/create/video` | General video creation hub | Starting point, model picker |
| `https://higgsfield.ai/kling-3-motion-control` | Kling 3.0 | Character motion, precise control |
| `https://higgsfield.ai/kling-2-6` | Kling 2.6 | Cinematic + audio |
| `https://higgsfield.ai/create/video` (Sora option) | Sora 2 MAX | Highest fidelity |
| `https://higgsfield.ai/cinematic-video-generator` | Cinema Studio | 21:9 cinematic, storyboard |

**Recommended starting point:** `https://higgsfield.ai/create/video` — then select model from the dropdown/tabs.

```python
browser(action="navigate", targetUrl="https://higgsfield.ai/create/video", profile="openclaw")
browser(action="screenshot", type="png", profile="openclaw")  # capture initial state
```

---

## 3. Select Model

```python
snap = browser(action="snapshot", profile="openclaw")
# Look for: model selector dropdown, tabs labeled with model names, or a "Change model" button
# Ref will vary — snapshot first to find the selector
```

**Interaction (example — ref will differ):**
```python
# Click model selector
browser(action="act", profile="openclaw", request={"kind": "click", "ref": "MODEL_SELECTOR_REF"})
# snapshot again to see dropdown options
snap = browser(action="snapshot", profile="openclaw")
# Click "Kling 3.0" or desired model
browser(action="act", profile="openclaw", request={"kind": "click", "ref": "KLING_OPTION_REF"})
```

**Model selection guidance:**
- **Kling 3.0 Motion Control** → best default for scroll animations. Precise, cinematic.
- **Sora 2 MAX** → final production quality; use after iterating with Kling
- **WAN 2.5** → if starting from a reference image (image-to-video)
- **Kling 2.6** → if the scene benefits from ambient audio texture

---

## 4. Configure Generation Settings

After model selection, configure:

### Duration
```python
# Look for duration slider or input (typically 4s / 6s / 8s / 10s / 30s options)
# For scroll hero animations: 4–8 seconds is ideal (longer = larger file, harder to scrub)
```

### Aspect Ratio
```python
# Look for ratio buttons: 16:9 / 9:16 / 1:1 / 21:9
# 16:9 for desktop hero
# 9:16 for mobile full-screen
# 21:9 for cinematic wide hero (Cinema Studio)
```

### Quality Tier
```python
# Standard = fast, cheaper. Use for round 1 iteration.
# Pro/Max = higher quality, more credits. Use for final production gen.
```

### Seed (Optional)
```python
# If the model shows a seed input, leave random for round 1.
# After picking a winner, note the seed and reuse it for controlled variation.
```

---

## 5. Enter Prompt & Generate

```python
# Find the prompt textarea
snap = browser(action="snapshot", profile="openclaw")
# Fill the prompt
browser(action="act", profile="openclaw", request={
  "kind": "fill",
  "ref": "PROMPT_TEXTAREA_REF",
  "text": "Cinematic wide shot of abstract liquid metal rippling outward in slow motion. Ultra-smooth camera push-in. Moonlit blue and chrome highlights. 4K film texture, no text."
})

# Clear any cookie banners before clicking Generate
browser(action="act", profile="openclaw", request={
  "kind": "evaluate",
  "fn": """() => {
    document.querySelectorAll('[id*=cookie],[class*=cookie],[class*=consent],[id*=banner]')
      .forEach(el => el.remove());
    return 'cleared';
  }"""
})

# Click Generate
browser(action="act", profile="openclaw", request={"kind": "click", "ref": "GENERATE_BUTTON_REF"})

# Take a screenshot to confirm generation started
browser(action="screenshot", type="png", profile="openclaw")
```

**After clicking Generate:** a loading indicator or progress bar appears. Do NOT refresh or navigate away.

---

## 6. Poll for Completion

Generation takes 30 seconds to ~5 minutes depending on model and queue.

```python
import time

# Poll every 15 seconds, max 10 minutes
for attempt in range(40):
    snap = browser(action="snapshot", compact=True, profile="openclaw")
    
    # Check for completion signals:
    # - Download button appears
    # - Progress indicator disappears
    # - Video thumbnail renders in feed
    # - Text like "Ready" or "Completed" appears
    
    if "Download" in snap or "download" in snap:
        break  # done!
    
    # Wait 15 seconds before next check
    browser(action="act", profile="openclaw", request={"kind": "wait", "timeMs": 15000})
```

⚠️ Real implementation: use `process` + `yieldMs` pattern for long waits to avoid blocking main session.

**Completion signals to look for in snapshot:**
- Download icon/button visible on the result card
- Video element rendered (not a loading spinner)
- Text: "Your video is ready", "Generation complete", checkmark icon

---

## 7. Download the Result

```python
# Method 1: Click download button/icon
snap = browser(action="snapshot", profile="openclaw")
# Find download button ref
browser(action="act", profile="openclaw", request={"kind": "click", "ref": "DOWNLOAD_BTN_REF"})
# File should download to ~/Downloads/ or browser's default download dir
```

### Locating Downloaded File
```bash
# Find the most recently downloaded MP4
ls -t ~/Downloads/*.mp4 | head -1
# Or check browser download dir
ls -t /tmp/*.mp4 2>/dev/null | head -1
```

### If Download Button Is Blocked (Protected URL)
Some generation results use signed/protected download URLs that don't work via direct automation.

```python
# Method 2: Try right-click → get video src
src = browser(action="act", profile="openclaw", request={
  "kind": "evaluate",
  "fn": """() => {
    const video = document.querySelector('video');
    return video ? video.src || video.currentSrc : 'not found';
  }"""
})
# If src is a direct URL, download via exec:
# exec(command=f"wget -O ~/Downloads/higgsfield-result.mp4 '{src}'")
```

If neither works → [Manual Download Fallback](#9-fallback-manual-download-request).

---

## 8. Cleanup

Always close tabs after completing a generation task:

```python
tabs = browser(action="tabs", profile="openclaw")
# Close the Higgsfield tab(s)
for tab in tabs:
    if "higgsfield.ai" in tab.get("url", ""):
        browser(action="act", profile="openclaw", request={
          "kind": "close",
          "targetId": tab["id"]
        })
```

---

## 9. Fallback: Manual Download Request

When automated download fails, request manual download from AR/Mo:

```
"Generation is complete. The video is ready in your Higgsfield feed at https://higgsfield.ai/create/video.
Please download it manually (click the result card → download icon), rename it to:
  hero-[description]-v[N].mp4
and let me know the path. I'll continue with web conversion and GSAP wiring from there."
```

---

## Timing Reference

| Model | Typical Generation Time |
|-------|------------------------|
| Kling 3.0 (Standard) | 30–90 seconds |
| Kling 3.0 (Pro/Max) | 90–180 seconds |
| Kling 2.6 | 60–120 seconds |
| WAN 2.5 | 30–60 seconds |
| Sora 2 MAX | 2–5 minutes |
| Higgsfield Enhancer (upscale) | 1–3 minutes |

---

## Prompt Library for Scroll Animations

Copy-paste starting points. Adjust subject/style/palette for brand alignment.

```
# Hero — Abstract/Tech
"Ultra-smooth slow push-in through iridescent liquid crystal lattice structures. Macro lens, shallow depth of field. Electric blue and white light refractions. No text, seamless motion."

# Hero — Nature/Organic
"Aerial time-lapse of golden morning mist rolling over mountain ridges. Camera slowly rises. Warm amber and teal color palette. Cinematic 2.39:1, no logo or text."

# Product — Premium/Dark
"Close-up rotation of a matte black geometric object on a reflective surface. Dramatic side lighting with single highlight. Dark studio background. 4K quality, no motion blur."

# Data/Abstract
"Abstract streams of luminous data flowing through dark void, converging at center. Cool blue and white color scheme. Ultra-smooth motion, camera slowly zooms in."

# Fashion/Lifestyle
"Slow-motion fabric billowing in wind, backlit by golden hour sunlight. Silky texture detail. Dreamy bokeh background. 16:9 cinematic."
```
