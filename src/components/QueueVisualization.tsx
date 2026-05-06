import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import type { SceneStep } from "../lib/types";
import { useStepTransition } from "../lib/useStepTransition";
import { fonts, springPresets } from "../lib/theme";

export interface QueueItem {
  value: number;
  highlight?: "active" | "new" | "visited" | "none";
}

type HL = NonNullable<QueueItem["highlight"]>;

const PALETTE: Record<HL, { bg: string; border: string; glow: string | null }> = {
  active:  { bg: "#1F5FAE", border: "#4A86C8", glow: "#4A86C8" },
  new:     { bg: "#2E7D32", border: "#66BB6A", glow: "#66BB6A" },
  visited: { bg: "#1F3552", border: "#2B5C8A", glow: null },
  none:    { bg: "#1a2235", border: "#3A5070", glow: null },
};

const GAP = 10;

// ─── single queue node circle ────────────────────────────────────────────────
const ItemCircle: React.FC<{
  item:         QueueItem;
  size:         number;
  localFrame:   number;
  isLeaving?:   boolean;
  transitionT?: number; // spring t from useStepTransition (0→1 each new step)
  enterDelay?:  number; // frame offset for staggered entrances
}> = ({
  item,
  size,
  localFrame,
  isLeaving   = false,
  transitionT = 1,
  enterDelay  = 0,
}) => {
  const { fps } = useVideoConfig();
  const hl = item.highlight ?? "none";

  // ── Enter: slide in from the right with bounce ───────────────────────────
  const isNew    = !isLeaving && hl === "new";
  const ef       = Math.max(0, localFrame - enterDelay);
  const enterP   = spring({ frame: ef, fps, config: springPresets.bouncy });
  const enterTX  = isNew ? interpolate(enterP, [0, 1], [size + GAP * 2, 0]) : 0;
  const enterSc  = isNew ? interpolate(enterP, [0, 1], [0.4, 1])            : 1; // overshoots naturally
  const enterOp  = isNew ? interpolate(enterP, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }) : 1;

  // ── Exit: gravity + tumble out to the left ───────────────────────────────
  const exitTX     = isLeaving ? interpolate(transitionT, [0, 1], [0, -(size + GAP * 2)]) : 0;
  const exitGravY  = isLeaving ? interpolate(transitionT * transitionT, [0, 1], [0, 28])  : 0; // quadratic drop
  const exitSc     = isLeaving ? interpolate(transitionT, [0, 1], [1, 0.55])              : 1;
  const exitOp     = isLeaving ? interpolate(transitionT, [0, 0.55, 1], [1, 0.25, 0])     : 1;
  const exitTumble = isLeaving ? interpolate(transitionT, [0, 1], [0, -18])               : 0;

  // ── Emphasis pulse for the item about to be dequeued ─────────────────────
  const isActive  = !isLeaving && hl === "active";
  const emphP     = isActive ? spring({ frame: localFrame, fps, config: springPresets.emphasis }) : 0;
  const emphSc    = isActive ? interpolate(emphP as number, [0, 0.5, 1], [1, 1.18, 1]) : 1;

  // ── Damped wobble for active (about-to-dequeue) item ─────────────────────
  const wobbleDecay  = isActive ? Math.exp(-localFrame * 0.07) : 0;
  const wobbleSin    = Math.sin(localFrame * 0.55);
  const wobbleShiftX = wobbleDecay * 5 * wobbleSin;
  const wobbleAngle  = wobbleDecay * 1.5 * wobbleSin;

  const palette   = PALETTE[hl];
  const boxShadow = palette.glow
    ? `0 0 16px ${palette.glow}55, 0 0 30px ${palette.glow}1A`
    : undefined;

  return (
    <div
      style={{
        width:          size,
        height:         size,
        borderRadius:   "50%",
        background:     palette.bg,
        border:         `2.5px solid ${palette.border}`,
        boxShadow,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
        transform: `translateX(${enterTX + exitTX + wobbleShiftX}px) translateY(${exitGravY}px) scale(${enterSc * emphSc * exitSc}) rotate(${exitTumble + wobbleAngle}deg)`,
        opacity: enterOp * exitOp,
      }}
    >
      <span
        style={{
          fontFamily: fonts.mono,
          fontSize:   Math.round(size * 0.38),
          fontWeight: 800,
          color:      "#fff",
          textShadow: "0 0 8px rgba(255,255,255,0.15)",
          lineHeight: 1,
        }}
      >
        {item.value}
      </span>
    </div>
  );
};

// ─── wrapper that shrinks its width so the flex row closes the gap ────────────
// When an item exits, its slot collapses from (itemSize + GAP) → 0 so the
// remaining items shift left naturally, rather than leaving a hole.
const LeavingSlot: React.FC<{
  item:        QueueItem;
  size:        number;
  localFrame:  number;
  transitionT: number;
}> = ({ item, size, localFrame, transitionT }) => {
  const slotW = interpolate(transitionT, [0, 1], [size + GAP, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width:      slotW,
        height:     size,
        flexShrink: 0,
        overflow:   "visible",  // let the circle slide out freely — don't clip it
        position:   "relative",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0 }}>
        <ItemCircle
          item={item}
          size={size}
          localFrame={localFrame}
          isLeaving={true}
          transitionT={transitionT}
        />
      </div>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
interface QueueVisualizationProps {
  steps:     SceneStep[];
  itemSize?: number;
  style?:    React.CSSProperties;
}

export const QueueVisualization: React.FC<QueueVisualizationProps> = ({
  steps,
  itemSize = 52,
  style,
}) => {
  const { current, previous, t, localFrame } = useStepTransition(steps);
  const currItems = (current.snapshot.queueItems  ?? []) as QueueItem[];
  const prevItems = (previous.snapshot.queueItems ?? []) as QueueItem[];

  // Fade the whole queue out when transitioning into the complexity step,
  // so it's gone before the ComplexityCard slides in.
  const isComplexityStep = !!current.snapshot.complexityInfo;
  const queueOpacity = isComplexityStep
    ? interpolate(t, [0, 0.65], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  // Items that were in prev step but not in current → being dequeued (slide out left)
  const leavingItems = prevItems.filter(
    (pi) => !currItems.some((ci) => ci.value === pi.value)
  );

  // Items that are new to current step → being enqueued (slide in from right)
  const enteringSet = new Set(
    currItems
      .filter((ci) => !prevItems.some((pi) => pi.value === ci.value))
      .map((ci) => ci.value)
  );

  // Stagger: each entering item fires its spring a few frames later than the previous
  const enterDelays = new Map<number, number>();
  let staggerIdx = 0;
  currItems.forEach((ci) => {
    if (enteringSet.has(ci.value)) {
      enterDelays.set(ci.value, staggerIdx * 5);
      staggerIdx++;
    }
  });

  const hasItems  = currItems.length > 0 || leavingItems.length > 0;

  const labelBase: React.CSSProperties = {
    fontFamily:    fonts.sans,
    fontWeight:    600,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    lineHeight:    1,
    color:         "rgba(255,255,255,0.38)",
  };

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           8,
        ...style,
        opacity:       queueOpacity,   // fade out before complexity card appears
        pointerEvents: isComplexityStep ? "none" : "auto",
      }}
    >
      {/* Title */}
      <span style={{ ...labelBase, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
        Queue
      </span>

      {/* Container pill */}
      <div
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          12,
          background:   "rgba(255,255,255,0.04)",
          border:       "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding:      "10px 16px",
        }}
      >
        {/* Dequeue arrow */}
        <span style={{ ...labelBase, fontSize: 10 }}>← out</span>

        {/* Items row */}
        {hasItems ? (
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              // no gap here — leaving slots manage their own right-margin via width shrink
            }}
          >
            {/* Leaving items: slot collapses as they slide out left */}
            {leavingItems.map((item) => (
              <LeavingSlot
                key={`leaving-${item.value}`}
                item={item}
                size={itemSize}
                localFrame={localFrame}
                transitionT={t}
              />
            ))}

            {/* Current items: normal flex with gap spacers between them */}
            {currItems.map((item, i) => (
              <React.Fragment key={item.value}>
                {/* gap before each current item (first item has no spacer if no leaving items) */}
                {(i > 0 || leavingItems.length > 0) && (
                  <div style={{ width: GAP, flexShrink: 0 }} />
                )}
                <ItemCircle
                  item={item}
                  size={itemSize}
                  localFrame={localFrame}
                  enterDelay={enterDelays.get(item.value) ?? 0}
                />
              </React.Fragment>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div
            style={{
              width:          60,
              height:         itemSize,
              border:         "1.5px dashed rgba(255,255,255,0.18)",
              borderRadius:   10,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}
          >
            <span style={{ ...labelBase, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
              empty
            </span>
          </div>
        )}

        {/* Enqueue arrow */}
        <span style={{ ...labelBase, fontSize: 10 }}>in →</span>
      </div>
    </div>
  );
};
