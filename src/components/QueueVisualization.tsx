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

const GAP = 12;

const QUEUE_PALETTE: Record<HL, { color: string; opacity: number }> = {
  active:  { color: "#0096FF", opacity: 1.0  },
  new:     { color: "#40c057", opacity: 1.0  },
  visited: { color: "#0096FF", opacity: 0.28 },
  none:    { color: "#0096FF", opacity: 0.55 },
};

// ─── circle card (Queue panel) ────────────────────────────────────────────────
const CircleCard: React.FC<{
  item:         QueueItem;
  size:         number;
  localFrame:   number;
  isLeaving?:   boolean;
  isEntering?:  boolean;
  transitionT?: number;
  enterDelay?:  number;
}> = ({
  item,
  size,
  localFrame,
  isLeaving   = false,
  isEntering  = false,
  transitionT = 1,
  enterDelay  = 0,
}) => {
  const { fps } = useVideoConfig();
  const hl = item.highlight ?? "none";

  const isNew   = !isLeaving && isEntering;
  const ef      = Math.max(0, localFrame - enterDelay);
  const enterP  = spring({ frame: ef, fps, config: springPresets.bouncy });
  const enterTX = isNew ? interpolate(enterP, [0, 1], [size + GAP * 2, 0]) : 0;
  const enterSc = isNew ? interpolate(enterP, [0, 1], [0.4, 1])            : 1;
  const enterOp = isNew ? interpolate(enterP, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }) : 1;

  const exitTX     = isLeaving ? interpolate(transitionT, [0, 1], [0, -(size + GAP * 2)]) : 0;
  const exitGravY  = isLeaving ? interpolate(transitionT * transitionT, [0, 1], [0, 28])  : 0;
  const exitSc     = isLeaving ? interpolate(transitionT, [0, 1], [1, 0.55])              : 1;
  const exitOp     = isLeaving ? interpolate(transitionT, [0, 0.55, 1], [1, 0.25, 0])     : 1;
  const exitTumble = isLeaving ? interpolate(transitionT, [0, 1], [0, -18])               : 0;

  const isActive     = !isLeaving && hl === "active";
  const wobbleDecay  = isActive ? Math.exp(-localFrame * 0.07) : 0;
  const wobbleSin    = Math.sin(localFrame * 0.55);
  const wobbleShiftX = wobbleDecay * 5 * wobbleSin;
  const wobbleAngle  = wobbleDecay * 1.5 * wobbleSin;

  const palette      = QUEUE_PALETTE[hl];
  const glowStrength = (hl === "active" || hl === "new") ? 1.0 : hl === "visited" ? 0.2 : 0.35;
  const boxShadow    = `0 0 ${10 + glowStrength * 14}px ${palette.color}66, 0 0 ${22 + glowStrength * 20}px ${palette.color}22`;

  return (
    <div
      style={{
        position:       "relative",
        width:          size,
        height:         size,
        borderRadius:   "50%",
        background:     palette.color,
        border:         `3px solid ${palette.color}`,
        boxShadow,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
        transform:      `translateX(${enterTX + exitTX + wobbleShiftX}px) translateY(${exitGravY}px) scale(${enterSc * exitSc}) rotate(${exitTumble + wobbleAngle}deg)`,
        opacity:        enterOp * exitOp * palette.opacity,
      }}
    >
      <span
        style={{
          fontFamily:    fonts.mono,
          fontSize:      Math.round(size * 0.38),
          fontWeight:    800,
          color:         "#fff",
          textShadow:    "0 0 8px rgba(255,255,255,0.18)",
          lineHeight:    1,
          letterSpacing: -0.5,
        }}
      >
        {item.value}
      </span>
    </div>
  );
};

// ─── rectangle card (NextQ list) — solid fill, white text, same style as nodes
const RectCard: React.FC<{
  item:         QueueItem;
  size:         number;
  localFrame:   number;
  isLeaving?:   boolean;
  isEntering?:  boolean;
  transitionT?: number;
  enterDelay?:  number;
}> = ({
  item,
  size,
  localFrame,
  isLeaving   = false,
  isEntering  = false,
  transitionT = 1,
  enterDelay  = 0,
}) => {
  const { fps } = useVideoConfig();

  const itemW = Math.round(size * 1.1);
  const itemH = Math.round(size * 0.72);

  const isNew   = !isLeaving && isEntering;
  const ef      = Math.max(0, localFrame - enterDelay);
  const enterP  = spring({ frame: ef, fps, config: springPresets.enter });
  const enterSc = isNew ? interpolate(enterP, [0, 1], [0.5, 1])                                 : 1;
  const enterOp = isNew ? interpolate(enterP, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }) : 1;

  const exitSc  = isLeaving ? interpolate(transitionT, [0, 1], [1, 0.5])             : 1;
  const exitOp  = isLeaving ? interpolate(transitionT, [0, 0.6, 1], [1, 0.3, 0])     : 1;

  const isHighlighted = item.highlight === "new";
  const opacity       = isHighlighted ? 1.0 : 0.6;
  const glowStrength  = isHighlighted ? 1.0 : 0.3;
  const boxShadow     = `0 0 ${10 + glowStrength * 14}px #FFE50066, 0 0 ${22 + glowStrength * 20}px #FFE50022`;

  return (
    <div
      style={{
        width:          itemW,
        height:         itemH,
        borderRadius:   8,
        background:     "#FFE500",
        border:         "3px solid #FFE500",
        boxShadow,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
        transform:      `scale(${enterSc * exitSc})`,
        opacity:        (enterOp * exitOp) * opacity,
      }}
    >
      <span
        style={{
          fontFamily:    fonts.mono,
          fontSize:      Math.round(size * 0.36),
          fontWeight:    800,
          color:         "#000",
          textShadow:    "none",
          lineHeight:    1,
          letterSpacing: -0.5,
        }}
      >
        {item.value}
      </span>
    </div>
  );
};

// ─── collapsing slot wrapper (shared by both panels) ─────────────────────────
const LeavingSlot: React.FC<{
  item:        QueueItem;
  size:        number;
  localFrame:  number;
  transitionT: number;
  variant:     "circle" | "rect";
}> = ({ item, size, localFrame, transitionT, variant }) => {
  const slotW = interpolate(transitionT, [0, 1], [size + GAP, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width:      slotW,
        height:     size,
        flexShrink: 0,
        overflow:   "visible",
        position:   "relative",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0 }}>
        {variant === "circle" ? (
          <CircleCard item={item} size={size} localFrame={localFrame} isLeaving transitionT={transitionT} />
        ) : (
          <RectCard item={item} size={size} localFrame={localFrame} isLeaving transitionT={transitionT} />
        )}
      </div>
    </div>
  );
};

// ─── Queue panel (circles, no arrows) ────────────────────────────────────────
const QueuePanel: React.FC<{
  currItems:   QueueItem[];
  prevItems:   QueueItem[];
  t:           number;
  localFrame:  number;
  itemSize:    number;
}> = ({ currItems, prevItems, t, localFrame, itemSize }) => {
  const leavingItems = prevItems.filter(
    (pi) => !currItems.some((ci) => ci.value === pi.value),
  );
  const enteringSet = new Set(
    currItems
      .filter((ci) => !prevItems.some((pi) => pi.value === ci.value))
      .map((ci) => ci.value),
  );
  const enterDelays = new Map<number, number>();
  let si = 0;
  currItems.forEach((ci) => {
    if (enteringSet.has(ci.value)) { enterDelays.set(ci.value, si++ * 5); }
  });

  const hasItems  = currItems.length > 0 || leavingItems.length > 0;
  const itemCount = currItems.length;
  const labelSize = Math.round(itemSize * 0.26);
  const badgeSize = Math.round(itemSize * 0.22);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontFamily:    fonts.sans,
            fontSize:      labelSize,
            fontWeight:    800,
            color:         "#0096FF",
            textShadow:    "0 0 18px #0096FFBB, 0 0 40px #0096FF44",
            letterSpacing: 3,
            textTransform: "uppercase",
            lineHeight:    1,
          }}
        >
          Queue
        </span>
        <div
          style={{
            background:   "rgba(0,150,255,0.18)",
            border:       "1.5px solid rgba(0,150,255,0.55)",
            borderRadius: 20,
            padding:      `${Math.round(badgeSize * 0.2)}px ${Math.round(badgeSize * 0.6)}px`,
            fontSize:     badgeSize,
            fontWeight:   800,
            fontFamily:   fonts.mono,
            color:        "#0096FF",
            lineHeight:   1,
            textShadow:   "0 0 8px #0096FF88",
          }}
        >
          {itemCount}
        </div>
      </div>

      {/* Container */}
      <div
        style={{
          display:      "flex",
          alignItems:   "center",
          padding:      `${Math.round(itemSize * 0.18)}px ${Math.round(itemSize * 0.28)}px`,
          background:   "linear-gradient(135deg, rgba(0,150,255,0.09) 0%, rgba(0,100,180,0.05) 100%)",
          border:       "2.5px solid rgba(0,150,255,0.55)",
          borderRadius: 12,
          boxShadow:    "0 0 40px rgba(0,150,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {hasItems ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            {leavingItems.map((item) => (
              <LeavingSlot
                key={`leaving-${item.value}`}
                item={item}
                size={itemSize}
                localFrame={localFrame}
                transitionT={t}
                variant="circle"
              />
            ))}
            {currItems.map((item, i) => (
              <React.Fragment key={item.value}>
                {(i > 0 || leavingItems.length > 0) && <div style={{ width: GAP, flexShrink: 0 }} />}
                <CircleCard
                  item={item}
                  size={itemSize}
                  localFrame={localFrame}
                  isEntering={enteringSet.has(item.value)}
                  enterDelay={enterDelays.get(item.value) ?? 0}
                />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div
            style={{
              width:          itemSize * 1.4,
              height:         itemSize,
              border:         "1.5px dashed rgba(255,255,255,0.15)",
              borderRadius:   12,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily:    fonts.sans,
                fontSize:      Math.round(itemSize * 0.2),
                fontWeight:    600,
                color:         "rgba(255,255,255,0.3)",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              empty
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── NextQ list panel (rectangles + brackets, looks like a list variable) ─────
const NextQListPanel: React.FC<{
  currItems:  QueueItem[];
  prevItems:  QueueItem[];
  t:          number;
  localFrame: number;
  itemSize:   number;
}> = ({ currItems, prevItems, t, localFrame, itemSize }) => {
  const leavingItems = prevItems.filter(
    (pi) => !currItems.some((ci) => ci.value === pi.value),
  );
  const enteringSet = new Set(
    currItems
      .filter((ci) => !prevItems.some((pi) => pi.value === ci.value))
      .map((ci) => ci.value),
  );
  const enterDelays = new Map<number, number>();
  let si = 0;
  currItems.forEach((ci) => {
    if (enteringSet.has(ci.value)) { enterDelays.set(ci.value, si++ * 5); }
  });

  const hasItems  = currItems.length > 0 || leavingItems.length > 0;
  const labelSize = Math.round(itemSize * 0.26);
  const bracketSz = Math.round(itemSize * 0.7);
  const ITEM_GAP  = 8;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {/* Label: nextQ in code font */}
      <span
        style={{
          fontFamily:    fonts.mono,
          fontSize:      labelSize,
          fontWeight:    700,
          color:         "#FFE500",
          textShadow:    "0 0 18px #FFE500BB, 0 0 40px #FFE50044",
          letterSpacing: 1,
          lineHeight:    1,
        }}
      >
        nextQ
      </span>

      {/* [ items ] */}
      <div
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:         6,
          background:  "linear-gradient(135deg, rgba(255,229,0,0.07) 0%, rgba(255,229,0,0.03) 100%)",
          border:      "1.5px solid rgba(255,229,0,0.30)",
          borderRadius: 16,
          padding:     `${Math.round(itemSize * 0.2)}px ${Math.round(itemSize * 0.22)}px`,
          boxShadow:   "0 0 30px rgba(255,229,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Opening bracket */}
        <span
          style={{
            fontFamily:  fonts.mono,
            fontSize:    bracketSz,
            fontWeight:  300,
            color:       "rgba(255,229,0,0.7)",
            lineHeight:  1,
            userSelect:  "none",
          }}
        >
          [
        </span>

        {/* Items */}
        {hasItems ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            {leavingItems.map((item) => (
              <LeavingSlot
                key={`leaving-${item.value}`}
                item={item}
                size={itemSize}
                localFrame={localFrame}
                transitionT={t}
                variant="rect"
              />
            ))}
            {currItems.map((item, i) => (
              <React.Fragment key={item.value}>
                {(i > 0 || leavingItems.length > 0) && <div style={{ width: ITEM_GAP, flexShrink: 0 }} />}
                <RectCard
                  item={item}
                  size={itemSize}
                  localFrame={localFrame}
                  isEntering={enteringSet.has(item.value)}
                  enterDelay={enterDelays.get(item.value) ?? 0}
                />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <span
            style={{
              fontFamily:    fonts.mono,
              fontSize:      Math.round(itemSize * 0.25),
              color:         "rgba(255,229,0,0.25)",
              letterSpacing: 2,
              padding:       `0 ${Math.round(itemSize * 0.3)}px`,
            }}
          >
            empty
          </span>
        )}

        {/* Closing bracket */}
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize:   bracketSz,
            fontWeight: 300,
            color:      "rgba(255,229,0,0.7)",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          ]
        </span>
      </div>
    </div>
  );
};

// ─── connector between panels ─────────────────────────────────────────────────
const PanelConnector: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      display:        "flex",
      alignItems:     "center",
      alignSelf:      "flex-end",
      marginBottom:   Math.round(size * 0.36),
      opacity:        0.5,
      paddingBottom:  4,
    }}
  >
    <span
      style={{
        fontSize:   Math.round(size * 0.44),
        color:      "rgba(255,255,255,0.55)",
        lineHeight: 1,
        fontWeight: 300,
      }}
    >
      →
    </span>
  </div>
);

// ─── main component ───────────────────────────────────────────────────────────
interface QueueVisualizationProps {
  steps:     SceneStep[];
  itemSize?: number;
  style?:    React.CSSProperties;
}

export const QueueVisualization: React.FC<QueueVisualizationProps> = ({
  steps,
  itemSize = 68,
  style,
}) => {
  const { current, previous, t, localFrame } = useStepTransition(steps);
  const currItems = (current.snapshot.queueItems   ?? []) as QueueItem[];
  const prevItems = (previous.snapshot.queueItems  ?? []) as QueueItem[];
  const currNextQ = (current.snapshot.nextQItems   ?? []) as QueueItem[];
  const prevNextQ = (previous.snapshot.nextQItems  ?? []) as QueueItem[];

  const isComplexityStep = !!current.snapshot.complexityInfo;
  const queueOpacity = isComplexityStep
    ? interpolate(t, [0, 0.65], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  const hasNextQ = currNextQ.length > 0 || prevNextQ.length > 0;

  return (
    <div
      style={{
        display:       "flex",
        alignItems:    "flex-start",
        gap:           hasNextQ ? 12 : 0,
        ...style,
        opacity:       queueOpacity,
        pointerEvents: isComplexityStep ? "none" : "auto",
      }}
    >
      <QueuePanel
        currItems={currItems}
        prevItems={prevItems}
        t={t}
        localFrame={localFrame}
        itemSize={itemSize}
      />

      {hasNextQ && (
        <>
          <PanelConnector size={itemSize} />
          <NextQListPanel
            currItems={currNextQ}
            prevItems={prevNextQ}
            t={t}
            localFrame={localFrame}
            itemSize={itemSize}
          />
        </>
      )}
    </div>
  );
};
