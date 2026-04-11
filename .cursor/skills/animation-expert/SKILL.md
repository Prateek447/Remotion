---
name: animation-expert
description: Apply professional animation principles to educational explainer videos in Remotion. Covers choreography, easing, visual hierarchy, spotlight patterns, smooth state transitions, and pacing for data structure and algorithm visualizations. Use when building animated code walkthroughs, data structure diagrams, or any Remotion scene that needs to feel polished and intentional.
---

# Animation Expert for Educational Videos

Think like a motion designer, not a programmer. Every animation decision should serve **comprehension** -- guide the viewer's eye, signal what changed, and give time to absorb.

## Core Principles

### 1. Choreography: Order of Operations

Never animate everything at once. Stagger changes to create a narrative:

```
Step arrives →
  1. Dim non-relevant elements (100ms)
  2. Highlight bar slides to new code line (200ms overlap)
  3. Diagram element animates (node moves, arrow appears)
  4. Caption fades in (slight delay after diagram settles)
  5. Brief hold for comprehension (300-500ms of stillness)
```

In Remotion terms, use `delay` offsets within a single step to create this cascade. A step isn't "frame 50: everything changes" -- it's "frame 50-90: a choreographed sequence unfolds."

### 2. Visual Hierarchy via Dimming (Spotlight Pattern)

The viewer should always know "what changed." Dim everything that didn't change:

- **Focused elements**: full opacity, possibly slight scale-up (1.02-1.05x)
- **Context elements**: 40-60% opacity, slightly desaturated
- **Exited elements**: 15-20% opacity, grayscale

```ts
const isFocused = node.highlight !== "none";
const contextOpacity = isFocused ? 1 : 0.45;
const contextScale = isFocused ? 1.03 : 0.98;
```

Apply the same pattern to code lines: highlighted lines at full brightness, others dimmed to 40% opacity.

### 3. Easing Selection

Different motion types need different easing:

| Motion type | Spring config | Why |
|---|---|---|
| Element entering | `damping: 12, stiffness: 100, mass: 0.8` | Slight overshoot, feels alive |
| Pointer moving | `damping: 20, stiffness: 200` | Snappy, precise, no bounce |
| Highlight bar sliding | `damping: 22, stiffness: 150` | Smooth glide, no wobble |
| Element exiting (shrink) | `damping: 18, stiffness: 80` | Gentle collapse |
| Emphasis pulse | `damping: 8, stiffness: 60` | Bouncy, draws attention |
| Caption appearing | `damping: 25, stiffness: 100` | Subtle, doesn't distract |

Never use the same spring config for everything.

### 4. Smooth State Transitions (Not Snap Changes)

The biggest mistake: treating step changes as instant swaps. Instead, **interpolate between the previous and current step** based on a transition spring.

```ts
const stepIndex = getStepIndex(steps, frame);
const stepStartFrame = steps[stepIndex].startFrame;
const transitionProgress = spring({
  frame: frame - stepStartFrame,
  fps,
  config: { damping: 16, stiffness: 120 },
});
```

Use `transitionProgress` to:
- Lerp node positions from old to new
- Crossfade highlight colors
- Slide the highlight bar's Y position
- Fade captions in/out

### 5. Pacing: Breathe Between Steps

Steps need unequal timing based on complexity:

| Change type | Minimum frames at 30fps |
|---|---|
| Simple highlight move | 30 frames (1s) |
| Node creation/deletion | 45 frames (1.5s) |
| Pointer reassignment | 40 frames (1.3s) |
| Multi-element rearrangement (reverse) | 50-60 frames (2s) |
| "Result" or "done" step | 60 frames (2s, let it sink in) |

Add 10-15 "hold" frames after the transition completes before the next step starts.

### 6. Enter/Exit/Emphasis: Three Animation Categories

**Enter** (element appears):
- Fade in + scale from 0.7 to 1.0 + slide from offset
- Duration: 12-18 frames
- Slight overshoot on scale (spring with low damping)

**Exit** (element removed):
- Scale to 0.5 + fade out + optional slide away
- Color shifts to red/gray as it exits
- Duration: 10-14 frames, should feel quicker than enter

**Emphasis** (element highlighted):
- Brief scale pulse: 1.0 -> 1.08 -> 1.0 over 15 frames
- Color transition to highlight color
- Glow/shadow intensifies
- Should NOT loop indefinitely -- one pulse when the step arrives, then settle

---

## Remotion-Specific Patterns

### Interpolating Between Steps

Instead of hard-cutting between snapshot states, compute interpolated values:

```tsx
function useStepTransition(steps: SceneStep[], frame: number, fps: number) {
  const idx = getStepIndex(steps, frame);
  const step = steps[idx];
  const prevStep = idx > 0 ? steps[idx - 1] : step;
  const localFrame = frame - step.startFrame;

  const t = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  return { current: step, previous: prevStep, t, localFrame };
}
```

Use `t` (0->1) to lerp positions, colors, opacities between `previous` and `current`.

### Animated Highlight Bar

The highlight bar should **slide** between positions, not teleport:

```tsx
const prevY = padding + prevStep.highlightLines.startLine * lineH;
const currY = padding + currentStep.highlightLines.startLine * lineH;
const highlightY = interpolate(t, [0, 1], [prevY, currY]);

const prevHeight = (prevStep.highlightLines.endLine - prevStep.highlightLines.startLine + 1) * lineH;
const currHeight = (currentStep.highlightLines.endLine - currentStep.highlightLines.startLine + 1) * lineH;
const highlightHeight = interpolate(t, [0, 1], [prevHeight, currHeight]);
```

### Code Line Dimming

Lines not in the highlight range should dim:

```tsx
const isHighlighted = i >= startLine && i <= endLine;
const targetDim = isHighlighted ? 1 : 0.35;
const lineOpacity = interpolate(dimProgress, [0, 1], [prevDim, targetDim]);
```

### Node Position Lerping

When a node moves (e.g., list rearranges), lerp its position:

```tsx
const prevPos = getNodePosition(prevIdx, prevNodes.length, ...);
const currPos = getNodePosition(currIdx, currNodes.length, ...);
const x = interpolate(t, [0, 1], [prevPos.x, currPos.x]);
const y = interpolate(t, [0, 1], [prevPos.y, currPos.y]);
```

### Caption Crossfade

```tsx
const captionChanged = prevStep.snapshot.caption !== currentStep.snapshot.caption;
const captionOpacity = captionChanged
  ? interpolate(localFrame, [0, 8, 12, 999], [0, 0, 1, 1], { extrapolateRight: "clamp" })
  : 1;
```

---

## Anti-Patterns

| Don't | Do Instead |
|---|---|
| Same spring config everywhere | Match easing to motion intent (see table above) |
| Snap between step states | Interpolate with a transition spring |
| Everything at full opacity | Dim non-relevant elements to 35-45% |
| Uniform step timing | Vary duration by complexity |
| Looping pulse on highlighted nodes | Single pulse on emphasis, then settle |
| All animations start simultaneously | Stagger by 3-8 frames within a step |
| Nodes re-enter from scratch each step | Only animate nodes that changed |
| No hold time after transitions | Add 10-15 frames of stillness |
| Caption appears/disappears instantly | Crossfade with 8-12 frame transition |

---

## Checklist Before Finalizing a Scene

- [ ] Each step has a clear choreography order (what moves first, second, third)
- [ ] Non-relevant elements are dimmed
- [ ] Highlight bar slides (doesn't teleport)
- [ ] Spring configs vary by motion intent
- [ ] Enter animations have slight overshoot
- [ ] Exit animations are faster than enters
- [ ] At least 10 hold frames after each transition settles
- [ ] Caption transitions are smooth
- [ ] The viewer can tell "what changed" at every step without reading the caption

For detailed code recipes and reusable hooks, see [reference.md](reference.md).
