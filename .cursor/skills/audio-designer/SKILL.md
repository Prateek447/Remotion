---
name: audio-designer
description: Design and implement audio for educational Remotion videos -- sound effects, background music, and TTS narration. Covers Remotion Audio API, SFX event mapping, music layering, volume balancing, and text-to-speech integration. Use when adding or improving audio in any Remotion video project.
---

# Audio Designer for Educational Videos

Audio transforms a silent animation into a polished video. Three layers work together: **SFX**, **music**, and **narration**.

## Remotion Audio API

```tsx
import { Audio, Sequence, staticFile } from "remotion";

// Play at a specific frame
<Sequence from={50} durationInFrames={30}>
  <Audio src={staticFile("sfx/pop.mp3")} volume={0.5} />
</Sequence>

// Background music with fade
<Audio
  src={staticFile("music/ambient.mp3")}
  volume={(f) => interpolate(f, [0, 30, totalFrames - 30, totalFrames], [0, 0.15, 0.15, 0], { extrapolateRight: "clamp" })}
/>
```

Key points:
- `staticFile()` serves from `public/` directory
- `volume` can be a number OR a function of frame for dynamic fading
- `startFrom` skips into the audio file (useful for trimming silence)
- Audio files must be `.mp3` or `.wav` (mp3 preferred for size)
- Place `<Audio>` inside `<Sequence>` for frame-accurate triggering

---

## Layer 1: Sound Effects (SFX)

### Event-to-Sound Mapping

The `SfxLayer` component auto-detects step types by diffing consecutive snapshots:

| Event | Sound | Duration | Volume | Detection Logic |
|---|---|---|---|---|
| Step transition | tick | 0.05s | 0.25 | Default for every step change |
| Node appear | pop | 0.08s | 0.45 | `snapshot.newNode` exists or node count increased |
| Node highlight | ding | 0.12s | 0.40 | A node's highlight changed to non-"none" |
| Arrow draw | swoosh | 0.15s | 0.30 | New arrow appears in snapshot |
| Completion | success | 0.40s | 0.50 | Last step in the array |
| Title card | whoosh | 0.25s | 0.35 | Separate `TitleSfx` component |

### Generating SFX with ffmpeg

Simple tones and noise bursts work well for UI sounds:

```bash
# Pop: short sine burst
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.08" \
  -af "afade=t=in:st=0:d=0.01,afade=t=out:st=0.04:d=0.04,volume=0.6" pop.mp3

# Tick: very short high click
ffmpeg -f lavfi -i "sine=frequency=1800:duration=0.05" \
  -af "afade=t=in:st=0:d=0.005,afade=t=out:st=0.02:d=0.03,volume=0.35" tick.mp3

# Whoosh: pink noise sweep
ffmpeg -f lavfi -i "anoisesrc=d=0.25:c=pink:a=0.3" \
  -af "afade=t=in:st=0:d=0.05,afade=t=out:st=0.1:d=0.15,lowpass=f=2000,volume=0.5" whoosh.mp3

# Ding: medium sine tone
ffmpeg -f lavfi -i "sine=frequency=1400:duration=0.12" \
  -af "afade=t=in:st=0:d=0.01,afade=t=out:st=0.06:d=0.06,volume=0.5" ding.mp3

# Success: two-tone chord
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.4" \
  -f lavfi -i "sine=frequency=1320:duration=0.4" \
  -filter_complex "[0][1]amix=inputs=2,afade=t=in:st=0:d=0.02,afade=t=out:st=0.2:d=0.2,volume=0.5" success.mp3
```

### SFX Anti-Patterns

- **Don't play SFX on every single frame change** -- only on step transitions
- **Don't use loud/harsh sounds** -- keep everything gentle and subtle
- **Don't stack multiple SFX at the same frame** -- pick the most important one
- **Don't use SFX longer than 0.5s** -- they overlap with the next step

---

## Layer 2: Background Music

### Selection Guidelines

- **Genre**: Lo-fi, ambient, minimal electronic, or soft piano
- **Tempo**: 70-100 BPM for explanation videos (matches reading pace)
- **No lyrics**: vocals compete with narration and distract from code
- **Loop-friendly**: should sound good when looped for variable-length videos

### Volume Balancing

Background music must be quiet enough to not compete with SFX or narration:

| Layer | Volume | Priority |
|---|---|---|
| Narration (TTS) | 0.8-1.0 | Highest |
| SFX | 0.25-0.50 | Medium |
| Background music | 0.08-0.15 | Lowest |

### Music Ducking

When narration is playing, lower the music volume further:

```tsx
const musicVolume = (frame: number) => {
  const baseVol = 0.12;
  const isNarrating = narrationRanges.some(
    ([start, end]) => frame >= start && frame <= end
  );
  return isNarrating ? baseVol * 0.4 : baseVol;
};
```

### Fade In/Out

Always fade music at video boundaries:
- **Fade in**: 1 second (30 frames) at start
- **Fade out**: 1.5 seconds (45 frames) at end

```tsx
<Audio
  src={staticFile("music/ambient.mp3")}
  volume={(f) => {
    const fadeIn = interpolate(f, [0, 30], [0, 0.12], { extrapolateRight: "clamp" });
    const fadeOut = interpolate(f, [total - 45, total], [0.12, 0], { extrapolateLeft: "clamp" });
    return Math.min(fadeIn, fadeOut);
  }}
/>
```

### Sourcing Music

- **Pixabay Music**: Free, no attribution needed for most tracks
- **YouTube Audio Library**: Free for YouTube uploads
- **Epidemic Sound / Artlist**: Paid, higher quality, proper licensing

---

## Layer 3: TTS Narration

### TTS Providers

| Provider | Quality | Cost | API |
|---|---|---|---|
| ElevenLabs | Excellent | Paid ($5+/mo) | REST API, many voices |
| Google Cloud TTS | Good | Free tier + paid | REST API |
| OpenAI TTS | Good | Pay per character | REST API |
| Edge TTS (free) | Decent | Free | `edge-tts` npm package |
| macOS `say` | Basic | Free | CLI command |

### Workflow for Pre-Rendered Narration

1. Write narration script per step (see script-writer skill)
2. Generate audio files: `narration-step-0.mp3`, `narration-step-1.mp3`, etc.
3. Place in `public/narration/`
4. Add to scene:

```tsx
{steps.map((step, i) => (
  <Sequence key={i} from={step.startFrame} durationInFrames={step.narrationDuration}>
    <Audio src={staticFile(`narration/scene-step-${i}.mp3`)} volume={0.9} />
  </Sequence>
))}
```

### Workflow for Edge TTS (Free)

```bash
npx edge-tts --text "First, create a new node with value 1." \
  --voice "en-US-GuyNeural" --write-media public/narration/step-1.mp3
```

Good voices for code explanations:
- `en-US-GuyNeural` -- clear male, good for technical
- `en-US-AriaNeural` -- clear female, natural pace
- `en-GB-RyanNeural` -- British male, professional tone

### Timing Narration to Steps

Measure each narration audio file duration, then set step `startFrame` values to ensure the narration finishes before the next step:

```ts
const WORDS_PER_SECOND = 3;
const narrationFrames = (text: string, fps: number) =>
  Math.ceil((text.split(" ").length / WORDS_PER_SECOND) * fps) + 10; // +10 buffer
```

---

## File Organization

```
public/
  sfx/
    pop.mp3
    tick.mp3
    ding.mp3
    swoosh.mp3
    whoosh.mp3
    success.mp3
  music/
    ambient-loop.mp3
  narration/
    insert-head-0.mp3
    insert-head-1.mp3
    ...
```

---

## Audio Checklist

- [ ] SFX plays at each step transition (via SfxLayer)
- [ ] SFX type matches the event (pop for new node, ding for highlight, etc.)
- [ ] No two SFX overlap at the same frame
- [ ] Background music at <=0.15 volume, fades in/out
- [ ] Music ducks during narration
- [ ] Narration finishes before next step starts
- [ ] All audio files are .mp3, reasonable file size (<100KB for SFX)
- [ ] Total audio doesn't clip (no combined volume >1.0)
