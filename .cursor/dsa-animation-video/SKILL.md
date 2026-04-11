---
name: dsa-animation-video
description: Create animated DSA explanation videos with Remotion for YouTube (16:9) and Instagram Reels (9:16). Covers scene authoring (steps, snapshots, code highlights), narration generation with edge-tts, layout selection (SplitLayout/StackedLayout), safe areas, and composition wiring. Use when creating linked list or data structure animation scenes, adding new DSA operations, generating narration audio, or working on the linked-list-remotion project.
---

# DSA Animation Video

## Project Location

`~/personal/linked-list-remotion/`

## Architecture

```
src/
  scenes/          # One file per DSA operation (InsertHead.tsx, DeleteNode.tsx, etc.)
  components/      # Reusable: LinkedListDiagram, CodeBlock, NodeBox, Arrow, Pointer, layouts
  data/            # code-snippets.ts (Java code), narration-scripts.ts (text + durations)
  standalone/      # Thin wrappers: XxxVideo + XxxReel exports
  lib/             # types.ts, theme.ts, highlight.ts, useStepTransition.ts
  Root.tsx          # All compositions registered here
scripts/
  generate-narration.mjs   # edge-tts audio generation
  update-durations.mjs     # ffprobe duration measurement
public/narration/<sceneId>/  # step-N.mp3 + durations.json per scene
```

## Creating a New Scene — Step by Step

### 1. Add the code snippet

In `src/data/code-snippets.ts`, export a template literal with the Java method. Lines are 0-indexed for `highlightLines`.

```ts
export const myOperationCode = `public void myOp(int val) {
    // line 0 is the signature
    // ...
}`;
```

### 2. Create the scene file

In `src/scenes/MyOperation.tsx`, follow this exact pattern:

```ts
import React from "react";
import { useVideoConfig } from "remotion";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { SplitLayout } from "../components/SplitLayout";
import { StackedLayout, type SafeArea } from "../components/StackedLayout";
import { LinkedListDiagram } from "../components/LinkedListDiagram";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";
```

### 3. Define the steps array

Each step = one narration beat + one visual state.

```ts
const steps: SceneStep[] = [
  {
    startFrame: 0,               // Calculated after audio generation
    highlightLines: { startLine: 0, endLine: 0 },  // 0-indexed code lines
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7, highlight: "active" },  // "active" | "found" | "removing" | "new" | "error" | "none"
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: "#2196F3" },
        { label: "curr", targetNodeId: "n7", color: "#2E7D32" },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9", dashed: true, highlight: true },  // dashed for new connections
      ],
      newNode: { id: "n1", value: 1, highlight: "new" },  // Optional floating node
    },
  },
  // ... more steps
];
```

**startFrame calculation:** `startFrame[n] = startFrame[n-1] + audioFrames[n-1] + 10` (10-frame buffer).

### 4. Scene storyboard template

Every scene should follow this narrative arc (non-tech friendly):

1. **Context** — Show the data structure, explain the goal
2. **Edge case** — Empty list / single element (simple, handle first)
3. **Main cases** — Walk through each case with traversal animations
4. **Complexity** — O(1) vs O(n), explained simply
5. **Recap** — Summarize the key steps
6. **CTA** — Subscribe prompt

### 5. Add format prop and dual layout

```ts
const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 60, right: 160 };

export interface MyOperationProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const MyOperation: React.FC<MyOperationProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel";
  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;

  const diagramAreaW = isReel ? safeW : width * 0.62;
  const diagramAreaH = isReel ? Math.round(safeH * reelTopRatio) : height;
  const nodeScale = isReel ? 1.2 : 1;
  const codeFontSize = isReel ? /* see sizing guide */ : 24;
```

**Reel topRatio sizing guide** (based on code line count):

| Code lines | topRatio | codeFontSize |
|-----------|----------|-------------|
| 6 or fewer | 0.55 (default) | 30 |
| 7–12 | 0.45 | 26 |
| 13–15 | 0.42 | 24 |

### 6. Add narration script

In `src/data/narration-scripts.ts`:

1. Add a `SceneNarration` object with `sceneId` and `lines[]`
2. Add it to `allNarrations` array
3. Add placeholder `NarrationDuration[]` (replaced after generation)
4. Add entry to `narrationDurationsByScene`

### 7. Add narration lines to generator

In `scripts/generate-narration.mjs`, add a `const myOperationLines = [...]` array and add `{ sceneId: "my-operation", lines: myOperationLines }` to `allNarrations`.

### 8. Generate audio

```bash
cd ~/personal/linked-list-remotion
node scripts/generate-narration.mjs
```

This runs `edge-tts` with voice `en-US-BrianMultilingualNeural` at `+10%` rate, outputs `step-N.mp3` + `durations.json` to `public/narration/<sceneId>/`.

### 9. Update startFrame values

Read `public/narration/<sceneId>/durations.json` and compute cumulative frames:

```
step 0: startFrame = 0
step 1: startFrame = frames[0] + 10
step 2: startFrame = frames[0] + frames[1] + 20
...
```

Update `deleteNodeDurations` (or equivalent) in `narration-scripts.ts` with real values from `durations.json`.

### 10. Wire up compositions

**`src/standalone/index.tsx`** — add two exports:

```ts
export const MyOperationVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="My Operation" complexity="O(n)" sceneFrames={TOTAL} nextTopic="Next Topic">
    <MyOperation tokens={tokens} />
  </StandaloneVideo>
);

export const MyOperationReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="My Operation" complexity="O(n)" sceneFrames={TOTAL} nextTopic="Next Topic">
    <MyOperation tokens={tokens} format="reel" />
  </StandaloneVideo>
);
```

**`src/Root.tsx`** — add to imports, then:
- `Folder "Standalone"`: `Video-MyOperation` (1920x1080)
- `Folder "Reels"`: `Reel-MyOperation` (1080x1920)

Both use `standaloneDuration(SCENE_FRAMES)` and `makeCalcMetadata(myOperationCode)`.

## Narration Writing Style

Write like explaining to a friend, not lecturing:
- Short sentences, natural pauses
- Use concrete values: "three, seven, nine" not "the nodes"
- Explain the "why" before the "how"
- Show wrong approaches first when relevant
- No jargon without immediate plain-english follow-up
- Each step line is standalone (generates as separate audio clip)
- Optional `rate: "+5%"` on longer/more technical lines

## Node Highlight Colors

| Highlight | Color | Use for |
|-----------|-------|---------|
| `"active"` | Green (#2E7D32) | Currently being visited/processed |
| `"found"` | Blue (#2196F3) | Success state, recap, done |
| `"removing"` | Pink (#f38ba8) | About to be deleted |
| `"new"` | Purple (#9C6ADE) | Newly created node |
| `"error"` | Pink (#f38ba8) | Wrong approach demonstration |
| `"none"` | Default gray | Inactive nodes |

## Layout Reference

- **YouTube (SplitLayout):** 62% diagram left, 38% code right, grid background
- **Reel (StackedLayout):** diagram top, code bottom, pure black background, glowing divider
- **Reel safe area:** `{ top: 150, bottom: 380, left: 60, right: 160 }` (Instagram UI overlay)

## Checklist for New Scene

- [ ] Code snippet added to `code-snippets.ts`
- [ ] Scene file created with `steps[]`, `format` prop, dual layout
- [ ] Narration text added to `narration-scripts.ts` + `generate-narration.mjs`
- [ ] Audio generated with `node scripts/generate-narration.mjs`
- [ ] `startFrame` values calculated from `durations.json`
- [ ] Duration arrays updated in `narration-scripts.ts`
- [ ] Standalone exports added (`XxxVideo` + `XxxReel`)
- [ ] Compositions registered in `Root.tsx` (Standalone + Reels folders)
- [ ] Scene frame count exported and consistent everywhere
