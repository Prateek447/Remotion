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
}

export const Pointer: React.FC<PointerProps> = ({
  label,
  x,
  y,
  color = "#b4befe",
  delay = 0,
  stackIndex = 0,
  scale = 1,
  exitProgress,
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
  const arrowLen = 22 + stackIndex * spacing.pointerStackOffset;
  const arrowheadH = 9;
  const gap = 4;

  const totalH = labelH + gap + arrowLen + arrowheadH;
  const pointerTop = y - totalH;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: pointerTop,
        transform: `translateX(-50%) translateY(${translateY + exitTranslateY}px)`,
        opacity: opacity * exitOpacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 15 - stackIndex,
      }}
    >
      {/* Solid colored label */}
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: labelFontSize,
          fontWeight: 700,
          color: "#fff",
          background: color,
          padding: `${labelPadV}px ${labelPadH}px`,
          borderRadius: 5,
          whiteSpace: "nowrap",
          letterSpacing: 0.3,
          lineHeight: `${labelFontSize + 4}px`,
          boxShadow: `0 0 6px ${color}88, 0 0 14px ${color}33`,
        }}
      >
        {label}
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
          strokeWidth="2"
        />
        <polygon
          points={`6,${gap + arrowLen + arrowheadH} 1,${gap + arrowLen} 11,${gap + arrowLen}`}
          fill={color}
        />
      </svg>
    </div>
  );
};
