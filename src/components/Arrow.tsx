import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors, springPresets } from "../lib/theme";

interface ArrowProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  dashed?: boolean;
  highlight?: boolean;
  delay?: number;
  opacity?: number;
}

export const Arrow: React.FC<ArrowProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  dashed = false,
  highlight = false,
  delay = 0,
  opacity: opacityOverride,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drawProgress = spring({
    frame,
    fps,
    delay,
    config: springPresets.slide,
  });

  const color = highlight ? colors.arrowActive : colors.arrowDefault;
  const glowColor = highlight ? colors.arrowActive : "rgba(255,255,255,0.5)";
  const glowFilter = highlight
    ? `drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 10px ${glowColor}88)`
    : `drop-shadow(0 0 2px ${glowColor})`;
  const dashCrawl = dashed && highlight ? -(frame * 0.5) % 13 : 0;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;

  const dashOffset = interpolate(drawProgress, [0, 1], [len, 0]);
  const headOpacity = interpolate(drawProgress, [0.6, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ux = dx / len;
  const uy = dy / len;

  const headLen = 10;
  const headSpread = 5;
  const tipX = toX;
  const tipY = toY;
  const wing1X = tipX - headLen * ux + headSpread * uy;
  const wing1Y = tipY - headLen * uy - headSpread * ux;
  const wing2X = tipX - headLen * ux - headSpread * uy;
  const wing2Y = tipY - headLen * uy + headSpread * ux;

  const pad = 30;
  const minX = Math.min(fromX, toX) - pad;
  const minY = Math.min(fromY, toY) - pad;
  const svgW = Math.abs(dx) + pad * 2;
  const svgH = Math.max(Math.abs(dy), 20) + pad * 2;

  const ox = -minX;
  const oy = -minY;

  const strokeW = 3;

  return (
    <svg
      style={{
        position: "absolute",
        left: minX,
        top: minY,
        width: svgW,
        height: svgH,
        pointerEvents: "none",
        overflow: "visible",
        filter: glowFilter,
        opacity: opacityOverride ?? 1,
      }}
    >
      <line
        x1={fromX + ox}
        y1={fromY + oy}
        x2={toX + ox}
        y2={toY + oy}
        stroke={color}
        strokeWidth={strokeW}
        strokeDasharray={dashed ? "8 5" : `${len}`}
        strokeDashoffset={dashed ? dashCrawl : dashOffset}
        strokeLinecap="round"
        opacity={dashed ? drawProgress : 1}
      />
      <polyline
        points={`${wing1X + ox},${wing1Y + oy} ${tipX + ox},${tipY + oy} ${wing2X + ox},${wing2Y + oy}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={headOpacity}
      />
    </svg>
  );
};
