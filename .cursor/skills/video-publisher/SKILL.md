---
name: video-publisher
description: Render and publish Remotion videos for YouTube and Instagram. Covers multi-format rendering (16:9, 9:16, 1:1), compression settings, platform-specific requirements, content adaptation for short-form vs long-form, and metadata optimization. Use when rendering final output, adapting a video for different platforms, or optimizing file size.
---

# Video Publisher for YouTube & Instagram

One video concept, multiple platform outputs. This skill covers rendering, formatting, and publishing.

## Platform Specifications

### YouTube (Long-Form)

| Property | Value |
|---|---|
| Aspect ratio | 16:9 |
| Resolution | 1920x1080 (1080p) or 3840x2160 (4K) |
| Frame rate | 30fps (standard) or 60fps (smooth animations) |
| Max duration | 12 hours |
| Ideal duration | 3-10 minutes for educational |
| Format | MP4 (H.264) |
| Max file size | 256GB |
| Audio | AAC, 48kHz recommended |

### YouTube Shorts

| Property | Value |
|---|---|
| Aspect ratio | 9:16 |
| Resolution | 1080x1920 |
| Frame rate | 30fps |
| Max duration | 60 seconds |
| Ideal duration | 15-45 seconds |
| Format | MP4 (H.264) |

### Instagram Reels

| Property | Value |
|---|---|
| Aspect ratio | 9:16 |
| Resolution | 1080x1920 |
| Frame rate | 30fps |
| Max duration | 90 seconds |
| Ideal duration | 15-30 seconds |
| Format | MP4 (H.264) |
| Max file size | 250MB |

### Instagram Feed Post (Video)

| Property | Value |
|---|---|
| Aspect ratio | 1:1 or 4:5 |
| Resolution | 1080x1080 or 1080x1350 |
| Max duration | 60 seconds |
| Format | MP4 (H.264) |

---

## Remotion Render Commands

### Standard YouTube Render (1080p)

```bash
npx remotion render src/index.ts FullVideo --codec h264 \
  --image-format jpeg --quality 80 \
  --output out/youtube-full.mp4
```

### YouTube Shorts / Instagram Reels (9:16)

Requires a separate `Composition` with 1080x1920 dimensions:

```tsx
<Composition
  id="FullVideoVertical"
  component={FullVideoVertical}
  width={1080}
  height={1920}
  fps={30}
  durationInFrames={FULL_VIDEO_DURATION}
/>
```

```bash
npx remotion render src/index.ts FullVideoVertical --codec h264 \
  --output out/reel.mp4
```

### Instagram Feed (1:1)

```tsx
<Composition
  id="FullVideoSquare"
  component={FullVideoSquare}
  width={1080}
  height={1080}
  fps={30}
  durationInFrames={FULL_VIDEO_DURATION}
/>
```

---

## Adapting Layout for Vertical (9:16)

The standard 55/45 split layout doesn't work vertically. Use a **stacked layout**:

```
┌─────────────────┐
│                  │
│   Code Block     │  40% height
│                  │
├─────────────────┤
│                  │
│   Diagram        │  45% height
│                  │
├─────────────────┤
│   Caption        │  15% height
└─────────────────┘
```

### Vertical Layout Component

```tsx
const VerticalLayout: React.FC<{ top: ReactNode; bottom: ReactNode }> = ({ top, bottom }) => (
  <AbsoluteFill style={{ background: "#000", flexDirection: "column" }}>
    <div style={{ height: "40%", padding: 24 }}>{top}</div>
    <div style={{ height: "45%", position: "relative" }}>{bottom}</div>
    <div style={{ height: "15%" }}>{/* caption area */}</div>
  </AbsoluteFill>
);
```

### Vertical Adaptations

- **Code font size**: reduce to 18-20px (narrower width)
- **Node size**: reduce to 70x40 (less horizontal space)
- **Max nodes visible**: 4-5 (vs 7-8 in landscape)
- **Pointers**: place beside nodes instead of above (to save vertical space)
- **Title card font**: 56px (vs 84px in landscape)

---

## Adapting for Square (1:1)

Compromise between landscape and vertical:

```
┌──────────────────────┐
│   Code (top 45%)     │
├──────────────────────┤
│   Diagram (bot 55%)  │
└──────────────────────┘
```

- Code font: 20-22px
- Nodes: 80x46
- Max nodes: 5-6

---

## Compression & Quality

### Remotion Codec Options

| Codec | Use Case | Quality | File Size |
|---|---|---|---|
| `h264` | YouTube, Instagram | Good | Medium |
| `h265` | Storage, high quality | Excellent | Small |
| `vp8` / `vp9` | Web embedding | Good | Small |
| `prores` | Editing (Final Cut) | Lossless | Large |

### Recommended Settings

```bash
# High quality for YouTube upload (YouTube re-encodes anyway)
--codec h264 --image-format jpeg --quality 85 --crf 18

# Smaller file for Instagram (stricter size limits)
--codec h264 --image-format jpeg --quality 75 --crf 23

# Maximum quality archive
--codec prores --prores-profile 4444
```

### File Size Estimates (1080p, 30fps)

| Duration | CRF 18 | CRF 23 |
|---|---|---|
| 30s | ~8MB | ~4MB |
| 1min | ~15MB | ~8MB |
| 5min | ~70MB | ~35MB |
| 10min | ~140MB | ~70MB |

---

## Content Adaptation Strategy

### From Long to Short

When adapting a full explainer (3-10min) to a Reel/Short (15-60s):

1. **Pick ONE operation** (not all 8)
2. **Remove the intro title card** (jump straight into the hook)
3. **Reduce to 3-5 key steps** (skip repetitive iterations)
4. **Add text overlay hook** at frame 0 ("Watch how linked list reversal works")
5. **Faster pacing**: 35-40 frames per step instead of 50
6. **End with CTA**: "Follow for more data structures" overlay

### Scene Selection for Shorts

Best operations for short-form (visually interesting + quick):
- Insert at head (simple, satisfying)
- Reverse (dramatic transformation)
- Detect cycle (two pointers racing)

Worst for short-form (too many steps):
- Merge sorted lists (7+ nodes, many steps)
- Full traversal (repetitive)

---

## Metadata Templates

### YouTube Title Patterns
- "[Data Structure] [Operation] Explained Visually"
- "How [Algorithm] Works | Animated Code Explanation"
- "[Problem Name] - Visual Walkthrough in [Language]"

### YouTube Description Template
```
[Operation] explained with animated diagrams and Java code.

Timestamps:
0:00 - Introduction
0:03 - Insert at Head
0:12 - Insert at Tail
...

#datastructures #algorithms #coding #linkedlist #java
```

### Instagram Caption Template
```
[Operation] in [n] seconds 🔥

[One-line explanation]

Save this for your coding interview prep!

#coding #programming #datastructures #algorithms #leetcode #java
```

---

## Publishing Checklist

- [ ] Rendered at correct resolution for target platform
- [ ] File size under platform limit
- [ ] Audio present and audible
- [ ] First frame is visually compelling (YouTube hover preview)
- [ ] Title card appears within first 3 seconds
- [ ] No frames with rendering artifacts
- [ ] Metadata (title, description, tags) prepared
- [ ] Thumbnail generated (see thumbnail-designer skill)
