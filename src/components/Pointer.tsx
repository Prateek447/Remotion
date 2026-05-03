import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { fonts, springPresets, spacing } from "../lib/theme";

interface PointerProps {
  label: string;
  x: number;
  y: number;
  color?: string;
  delay?: number;
  stackIndex?: number;
  scale?: number;
  exitProgress?: number;
  // Pendulum tilt in degrees. Positive = leaning right (moving right), negative
  // = leaning left. The rotation pivots around the arrow tip so the pointer
  // swings like a weight hanging from the node it's attached to.
  tilt?: number;
  // Extra pixels to add to the arrow's line length while the pointer is in
  // motion. Produces a rubber-band stretch: the arrow tip stays pinned to the
  // node, the line elongates upward, and the label is pushed away from the
  // tip — then everything snaps back as the spring settles.
  stretch?: number;
}

export const Pointer: React.FC<PointerProps> = ({
  label,
  x,
  y,
  color = "#2563EB",
  delay = 0,
  stackIndex = 0,
  scale = 1,
  exitProgress,
  tilt = 0,
  stretch = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterP = spring({ frame, fps, delay, config: springPresets.snappy });
  const opacity = interpolate(enterP, [0, 1], [0, 1]);
  const translateY = interpolate(enterP, [0, 1], [-12, 0]);

  const exitOpacity = exitProgress !== undefined
    ? interpolate(exitProgress, [0, 0.6], [1, 0], { extrapolateRight: "clamp" })
    : 1;
  const exitTranslateY = exitProgress !== undefined
    ? interpolate(exitProgress, [0, 1], [0, 20])
    : 0;

  const labelFontSize = Math.round(15 * scale);
  const labelPadV = Math.round(5 * scale);
  const labelPadH = Math.round(16 * scale);
  const labelH = labelFontSize + labelPadV * 2 + 4;
  const baseArrowLen = 22 + stackIndex * spacing.pointerStackOffset;
  // Rubber-band elongation while moving; rest length otherwise.
  const arrowLen = baseArrowLen + stretch;
  const arrowheadH = 9;
  const gap = 4;

  // Subtle volume-preserving thinning: the more the arrow stretches, the
  // slightly thinner it becomes — just like a rubber band under tension.
  const stretchRatio = stretch > 0 ? stretch / Math.max(1, baseArrowLen) : 0;
  const lineThickness = Math.max(1.4, 2 - stretchRatio * 0.5);

  const totalH = labelH + gap + arrowLen + arrowheadH;
  const pointerTop = y - totalH;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: pointerTop,
        transform: `translateX(-50%) translateY(${translateY + exitTranslateY}px) rotate(${tilt}deg)`,
        // Pivot at the bottom-center of the div, which is exactly the arrow
        // tip at the node. Rotation therefore swings the label like a pendulum
        // hanging off the node instead of rotating around the label centre.
        transformOrigin: "50% 100%",
        opacity: opacity * exitOpacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        // Lower-stacked pointers render ON TOP so that upper pointers' long
        // arrow lines pass BEHIND them — otherwise the arrow would visibly
        // cut across the lower pointer's label box.
        zIndex: 20 - stackIndex,
      }}
    >
      {/* Solid colored label with bloom halo */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: -14,
            background: color,
            borderRadius: 12,
            filter: "blur(20px)",
            opacity: 0.55,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: -4,
            background: color,
            borderRadius: 8,
            filter: "blur(6px)",
            opacity: 0.6,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            fontFamily: fonts.mono,
            fontSize: labelFontSize,
            fontWeight: 700,
            color: "#fff",
            // Subtle 3-stop gradient — body stays saturated, only the
            // top-left lifts a touch. The outer bloom layers do the
            // visible glow work; we don't need to wash this out too.
            background: `linear-gradient(160deg, color-mix(in srgb, ${color} 75%, white) 0%, ${color} 55%, color-mix(in srgb, ${color} 75%, black) 100%)`,
            padding: `${labelPadV}px ${labelPadH}px`,
            borderRadius: 5,
            whiteSpace: "nowrap",
            letterSpacing: 0.3,
            lineHeight: `${labelFontSize + 4}px`,
            border: `1px solid color-mix(in srgb, ${color} 75%, white)`,
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -1px 2px rgba(0,0,0,0.30)",
            textShadow: "0 1px 2px rgba(0,0,0,0.45)",
          }}
        >
          {label}
        </div>
      </div>

      {/* Downward arrow line + head */}
      <svg
        width="12"
        height={arrowLen + arrowheadH + gap}
        style={{ marginTop: 0, filter: `drop-shadow(0 0 2px ${color}99)` }}
      >
        <line
          x1="6"
          y1={gap}
          x2="6"
          y2={gap + arrowLen}
          stroke={color}
          strokeWidth={lineThickness}
        />
        <polygon
          points={`6,${gap + arrowLen + arrowheadH} 1,${gap + arrowLen} 11,${gap + arrowLen}`}
          fill={color}
        />
      </svg>
    </div>
  );
};
