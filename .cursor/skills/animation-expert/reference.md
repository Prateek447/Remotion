# Animation Expert -- Detailed Recipes

## Reusable Hook: useStepTransition

Central hook that all components consume for smooth step-to-step interpolation:

```tsx
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { SceneStep } from "../lib/types";

interface StepTransition {
  current: SceneStep;
  previous: SceneStep;
  t: number;            // 0->1 transition progress (spring)
  localFrame: number;   // frames since current step started
  stepIndex: number;
}

export function useStepTransition(steps: SceneStep[]): StepTransition {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let stepIndex = 0;
  for (let i = steps.length - 1; i >= 0; i--) {
    if (frame >= steps[i].startFrame) {
      stepIndex = i;
      break;
    }
  }

  const step = steps[stepIndex];
  const prevStep = stepIndex > 0 ? steps[stepIndex - 1] : step;
  const localFrame = frame - step.startFrame;

  const t = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  return { current: step, previous: prevStep, t, localFrame, stepIndex };
}
```

---

## Animated Highlight Bar (Slides Between Lines)

Replace the teleporting highlight bar with one that smoothly glides:

```tsx
interface AnimatedHighlightProps {
  steps: SceneStep[];
  lineHeight: number;
  padding: number;
  color?: string;
  borderColor?: string;
}

const AnimatedHighlightBar: React.FC<AnimatedHighlightProps> = ({
  steps, lineHeight, padding, color, borderColor,
}) => {
  const { current, previous, t } = useStepTransition(steps);

  const prevStart = previous.highlightLines.startLine;
  const prevEnd = previous.highlightLines.endLine;
  const currStart = current.highlightLines.startLine;
  const currEnd = current.highlightLines.endLine;

  const topY = interpolate(t, [0, 1], [
    padding + prevStart * lineHeight,
    padding + currStart * lineHeight,
  ]);

  const height = interpolate(t, [0, 1], [
    (prevEnd - prevStart + 1) * lineHeight,
    (currEnd - currStart + 1) * lineHeight,
  ]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: topY,
        height,
        background: color || "rgba(137, 180, 250, 0.12)",
        borderLeft: `3px solid ${borderColor || "#89b4fa"}`,
        pointerEvents: "none",
      }}
    />
  );
};
```

---

## Code Line Dimming

Lines outside the highlight range should dim to create visual focus:

```tsx
const CodeLineWithDimming: React.FC<{
  lineIndex: number;
  highlightStart: number;
  highlightEnd: number;
  transitionProgress: number;
  children: React.ReactNode;
}> = ({ lineIndex, highlightStart, highlightEnd, transitionProgress, children }) => {
  const isHighlighted = lineIndex >= highlightStart && lineIndex <= highlightEnd;
  const opacity = isHighlighted
    ? interpolate(transitionProgress, [0, 1], [0.5, 1])
    : interpolate(transitionProgress, [0, 1], [1, 0.35]);

  return (
    <div style={{ opacity, transition: "none" }}>
      {children}
    </div>
  );
};
```

---

## Node Emphasis Pulse

A single-fire pulse when a node becomes highlighted (not an infinite loop):

```tsx
function useEmphasisPulse(
  isEmphasized: boolean,
  localFrame: number,
  fps: number
): { scale: number; glowOpacity: number } {
  if (!isEmphasized) return { scale: 1, glowOpacity: 0 };

  const pulseProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 8, stiffness: 60, mass: 0.6 },
  });

  const scale = interpolate(pulseProgress, [0, 0.5, 1], [1, 1.08, 1.02]);
  const glowOpacity = interpolate(pulseProgress, [0, 0.3, 1], [0, 0.8, 0.3]);

  return { scale, glowOpacity };
}
```

---

## Node Enter/Exit Animations

### Enter: scale up + fade in + slide from offset

```tsx
function useNodeEnter(delay: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = spring({
    frame, fps, delay,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });

  return {
    opacity: interpolate(p, [0, 1], [0, 1]),
    scale: interpolate(p, [0, 0.6, 1], [0.6, 1.05, 1]),
    translateY: interpolate(p, [0, 1], [-20, 0]),
  };
}
```

### Exit: faster, shrink + fade + optional color shift

```tsx
function useNodeExit(startFrame: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - startFrame);
  const p = spring({
    frame: localFrame, fps,
    config: { damping: 18, stiffness: 80 },
  });

  return {
    opacity: interpolate(p, [0, 1], [1, 0]),
    scale: interpolate(p, [0, 1], [1, 0.5]),
    translateY: interpolate(p, [0, 1], [0, 30]),
  };
}
```

---

## Caption Crossfade

Smooth caption transitions when text changes between steps:

```tsx
const CaptionWithCrossfade: React.FC<{
  steps: SceneStep[];
}> = ({ steps }) => {
  const { current, previous, localFrame } = useStepTransition(steps);
  const captionChanged = previous.snapshot.caption !== current.snapshot.caption;

  const outOpacity = captionChanged
    ? interpolate(localFrame, [0, 6], [1, 0], { extrapolateRight: "clamp" })
    : 0;

  const inOpacity = captionChanged
    ? interpolate(localFrame, [6, 14], [0, 1], { extrapolateRight: "clamp" })
    : 1;

  const inY = captionChanged
    ? interpolate(localFrame, [6, 14], [8, 0], { extrapolateRight: "clamp" })
    : 0;

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      {captionChanged && previous.snapshot.caption && (
        <div style={{ opacity: outOpacity, position: "absolute", width: "100%" }}>
          {previous.snapshot.caption}
        </div>
      )}
      {current.snapshot.caption && (
        <div style={{ opacity: inOpacity, transform: `translateY(${inY}px)` }}>
          {current.snapshot.caption}
        </div>
      )}
    </div>
  );
};
```

---

## Pointer Position Lerping

Pointers should slide smoothly when their target node changes:

```tsx
function usePointerPosition(
  steps: SceneStep[],
  pointerLabel: string,
  getNodeX: (nodeId: string, snapshot: ListSnapshot) => number,
) {
  const { current, previous, t } = useStepTransition(steps);

  const prevPtr = previous.snapshot.pointers.find(p => p.label === pointerLabel);
  const currPtr = current.snapshot.pointers.find(p => p.label === pointerLabel);

  if (!currPtr?.targetNodeId) return null;

  const prevX = prevPtr?.targetNodeId
    ? getNodeX(prevPtr.targetNodeId, previous.snapshot)
    : getNodeX(currPtr.targetNodeId, current.snapshot);

  const currX = getNodeX(currPtr.targetNodeId, current.snapshot);

  return {
    x: interpolate(t, [0, 1], [prevX, currX]),
    entering: !prevPtr,
    exiting: false,
  };
}
```

---

## Arrow Draw-On Animation

Arrows should "draw on" from start to end rather than fading in:

```tsx
const DrawOnArrow: React.FC<{
  fromX: number; fromY: number;
  toX: number; toY: number;
  progress: number;
  color?: string;
}> = ({ fromX, fromY, toX, toY, progress, color = "#6c7086" }) => {
  const currentToX = interpolate(progress, [0, 1], [fromX, toX]);
  const currentToY = interpolate(progress, [0, 1], [fromY, toY]);

  const len = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
  const dashOffset = interpolate(progress, [0, 1], [len, 0]);

  return (
    <svg style={{ position: "absolute", overflow: "visible", pointerEvents: "none" }}>
      <line
        x1={fromX} y1={fromY} x2={toX} y2={toY}
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={len}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
      {progress > 0.8 && (
        <ArrowHead x={currentToX} y={currentToY} angle={Math.atan2(toY - fromY, toX - fromX)} color={color} />
      )}
    </svg>
  );
};
```

---

## Spring Config Presets

Reusable configs for consistent motion character:

```ts
export const springPresets = {
  enter:    { damping: 12, stiffness: 100, mass: 0.8 },
  exit:     { damping: 18, stiffness: 80 },
  snappy:   { damping: 20, stiffness: 200 },
  slide:    { damping: 22, stiffness: 150 },
  emphasis: { damping: 8,  stiffness: 60, mass: 0.6 },
  gentle:   { damping: 25, stiffness: 100 },
  bouncy:   { damping: 6,  stiffness: 80, mass: 0.5 },
} as const;
```

Usage:
```ts
spring({ frame, fps, config: springPresets.enter });
spring({ frame, fps, config: springPresets.snappy });
```

---

## Timing Budget Template

When planning a scene, allocate frames per step:

```ts
// For a 5-step scene at 30fps:
const TRANSITION = 15;   // spring transition time
const HOLD = 12;         // still time for comprehension
const TOTAL_PER_STEP = TRANSITION + HOLD + 15; // ~42 frames = 1.4s

const steps = [
  { startFrame: 0,   ... },   // Step 1: intro
  { startFrame: 50,  ... },   // Step 2: first action (extra hold for context)
  { startFrame: 92,  ... },   // Step 3: second action
  { startFrame: 134, ... },   // Step 4: third action
  { startFrame: 180, ... },   // Step 5: result (extra hold)
];
```

Complex changes (node deletion, pointer reversal) get 50-60 frames. Simple highlights get 35-40.
