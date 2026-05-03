# Linked List Remotion

Programmatic videos for data-structure tutorials, built with [Remotion](https://www.remotion.dev/). Includes both YouTube (16:9) and Instagram Reel (9:16) compositions for each topic, with synchronized AI voiceover and an After Effects-grade render pipeline.

---

## Quick start

```bash
# install
npm install

# open Remotion Studio (live preview at http://localhost:3000)
npm run studio
```

---

## Rendering videos

We use a **two-step pipeline** designed to match After Effects-quality exports:

1. **Step 1 — ProRes 4444 master at 2× scale (4K)** — lossless, intra-frame, 12-bit per channel
2. **Step 2 — Lanczos downscale → H.265 10-bit, CRF 18** — kills banding in soft glow gradients

Combined with a subtle dithering noise overlay applied at render time (see `src/components/NoiseOverlay.tsx`), this matches what AE/Resolve produce.

### Common commands

```bash
# Recommended: 10-bit H.265 (best quality, smaller file)
npm run render <CompositionId>

# Fallback: 8-bit H.264 high profile (re-uses existing ProRes master if present)
npm run render:h264 <CompositionId>
```

### Examples

```bash
npm run render Reel-DetectCycle          # Instagram Reel — Detect Cycle
npm run render Video-Reverse             # YouTube 16:9 — Reverse Linked List
npm run render Reel-RemoveNthFromEnd     # Instagram Reel — Remove Nth from End
```

Output:

| File | Description |
|------|-------------|
| `out/<CompositionId>.master.mov` | ProRes 4444 4K archival master (~5–10 GB; keep or delete) |
| `out/<CompositionId>.mp4` | Final delivery, native resolution, H.265 10-bit (~30–80 MB) |

The master file is reusable — `render:h264` will skip Step 1 if the master already exists, so you can produce both H.265 and H.264 deliverables from one render.

### Why this pipeline

| Problem | Cause | Fix |
|---------|-------|-----|
| Glow halos look banded after export | H.264 8-bit quantizes flat gradients into ~256 levels | 10-bit H.265 (1024 levels) + dithering noise |
| Color halos blurry on edges | `yuv420p` chroma subsampling | Render at 4K, downscale with Lanczos so chroma keeps detail |
| Encoder strips fine bloom | H.264 sees low-frequency areas as "flat" and crushes them | Subtle 2.5%-opacity noise overlay (`NoiseOverlay`) breaks flatness |
| Studio preview looks better than export | Live preview = local Chrome GPU; export = headless Chromium 8-bit | ProRes master preserves source pixels at full bit depth |

---

## Available compositions

### Reels (1080×1920, 9:16)

```
Reel-InsertHead       Reel-DeleteHead        Reel-Reverse
Reel-InsertTail       Reel-DeleteMiddle      Reel-DetectCycle
Reel-DeleteNode       Reel-DeleteTail        Reel-MergeLists
Reel-RemoveNthFromEnd
```

### YouTube videos (1920×1080, 16:9)

```
Video-InsertHead      Video-DeleteNode       Video-Reverse
Video-InsertTail      Video-SearchNode       Video-DetectCycle
Video-Traverse        Video-RemoveNthFromEnd Video-MergeLists
```

### Other

```
TitleIntro            FullVideo              Scenes/* (dev-only scene compositions)
```

---

## Generating narration audio

Voiceover is generated locally with `edge-tts` (no API key needed). Per-step audio files are committed under `public/narration/<scene-id>/step-N.mp3` along with `durations.json`.

```bash
# (re)generate audio for all scenes
node scripts/generate-narration.mjs

# update durations.json after re-recording
node scripts/update-durations.mjs
```

Edit narration text in `src/data/narration-scripts.ts`. Each line maps to one `step-N.mp3` file. After regenerating, the `durations` map auto-feeds the `startFrame` calculations in each scene file.

---

## Project structure

```
src/
├── Root.tsx                   # All Remotion <Composition> entries
├── index.ts                   # registerRoot()
├── components/                # NodeBox, Pointer, Arrow, layouts, NoiseOverlay …
├── scenes/                    # One file per algorithm: InsertHead, Reverse, DetectCycle …
├── standalone/                # Scene + title + outro wrappers (Video-* and Reel-*)
├── data/                      # Code snippets and narration scripts
└── lib/                       # Theme, types, scene-step helpers

public/
└── narration/                 # AI-generated voiceover per scene/step

scripts/
├── render.sh                  # 2-step ProRes → H.265 10-bit pipeline
├── render-h264.sh             # Same, but H.264 final (re-uses master)
├── generate-narration.mjs     # edge-tts voiceover generator
└── update-durations.mjs       # Audio duration syncer
```

---

## Troubleshooting

### `TimeoutError: Timed out after 25000 ms while trying to connect to the browser`

A previous render didn't shut down cleanly and is holding Chrome workers. Clean up the orphans:

```bash
pkill -f "remotion render"
pkill -f "chrome-headless-shell"
pkill -f "compositor-darwin-arm64/remotion"
```

Then retry. The Remotion Studio (`npm run studio`) can keep running — it owns separate workers.

### `The "prores" codec does not support the --crf option`

`remotion.config.ts` must NOT call `Config.setCrf()` globally — ProRes is intra-frame and rejects CRF. Each render command/script sets its own CRF if applicable. The current config is correct; this error appears only if someone re-adds the global default.

### Render is very slow

Each render runs at 2× supersample (1080p → 4K). Expect ~30–50 minutes for a 2-minute composition on an M-series Mac. To speed things up:

- Stop the studio (`Ctrl+C` in its terminal) — it competes for CPU/GPU
- Quit other Chrome browsers (they share the v8 isolate cache pool)
- Don't queue multiple renders; one at a time

### Audio out of sync after editing a scene

`startFrame` values in each scene file are derived from `public/narration/<scene>/durations.json`. If you re-record audio without rerunning `scripts/update-durations.mjs`, the visual steps drift. Always run that script after regenerating any audio.

### Banding still visible in final MP4

1. Confirm you used `npm run render` (the H.265 10-bit pipeline), not the legacy `render:hq` / `render:4k` scripts.
2. If the banding is only visible after uploading to YouTube/Instagram, that's the platform re-encoding to their own H.264 spec. Hand them a cleaner source — the H.265 10-bit file from this pipeline is about as clean as a delivery file can get.
3. If it's visible in the local file, increase the `NoiseOverlay` opacity from `0.025` to `0.04` (still imperceptible to viewers).

---

## Tech stack

- **[Remotion 4](https://www.remotion.dev/)** — React-based programmatic video
- **[Shiki](https://shiki.matsu.io/)** — syntax-highlighted code rendering with one-dark-pro theme
- **[edge-tts](https://github.com/rany2/edge-tts)** — Microsoft Edge TTS for narration (free, no API key)
- **ffmpeg + libx265 + libx264** — final encoding (ensure ffmpeg is built with `--enable-libx265`)
- **TailwindCSS** — utility-first styling (only used in some components)

---

## License

ISC
