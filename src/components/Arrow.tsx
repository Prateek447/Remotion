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
  curved?: boolean;
  color?: string;
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
  curved = false,
  color: colorOverride,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drawProgress = spring({
    frame,
    fps,
    delay,
    config: springPresets.slide,
  });

  const baseColor = colorOverride || (highlight ? colors.arrowActive : colors.arrowDefault);
  const glowColor = colorOverride || (highlight ? colors.arrowActive : "rgba(255,255,255,0.6)");
  const glowFilter = highlight
    ? `drop-shadow(0 0 3px ${glowColor}) drop-shadow(0 0 8px ${glowColor}cc) drop-shadow(0 0 22px ${glowColor}55)`
    : `drop-shadow(0 0 2px ${glowColor}) drop-shadow(0 0 6px ${glowColor}55)`;
  const dashCrawl = dashed ? -(frame * 0.5) % 13 : 0;

  const strokeW = 3;

  if (curved) {
    const drop = 55;
    const bottomY = Math.max(fromY, toY) + drop;

    const pathD = `M ${fromX} ${fromY} L ${fromX} ${bottomY} L ${toX} ${bottomY} L ${toX} ${toY}`;

    const headLen = 10;
    const headSpread = 5;
    const w1x = toX - headSpread;
    const w1y = toY + headLen;
    const w2x = toX + headSpread;
    const w2y = toY + headLen;

    const pad = 40;
    const minXc = Math.min(fromX, toX) - pad;
    const minYc = Math.min(fromY, toY) - pad;
    const maxXc = Math.max(fromX, toX) + pad;
    const maxYc = bottomY + pad;
    const svgW = maxXc - minXc;
    const svgH = maxYc - minYc;
    const ox = -minXc;
    const oy = -minYc;

    const totalLen =
      Math.abs(bottomY - fromY) +
      Math.abs(toX - fromX) +
      Math.abs(bottomY - toY);
    const pathDrawOffset = interpolate(drawProgress, [0, 1], [totalLen, 0]);

    const headOpacity = interpolate(drawProgress, [0.6, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const labelX = (fromX + toX) / 2;
    const labelY = bottomY + 16;
    const cycleColor = colorOverride || "#FFFFFF";

    return (
      <svg
        style={{
          position: "absolute",
          left: minXc,
          top: minYc,
          width: svgW,
          height: svgH,
          pointerEvents: "none",
          overflow: "visible",
          filter: glowFilter,
          opacity: opacityOverride ?? 1,
        }}
      >
        <path
          d={`M ${fromX + ox} ${fromY + oy} L ${fromX + ox} ${bottomY + oy} L ${toX + ox} ${bottomY + oy} L ${toX + ox} ${toY + oy}`}
          stroke={baseColor}
          strokeWidth={strokeW}
          fill="none"
          strokeDasharray={dashed ? "8 5" : `${totalLen}`}
          strokeDashoffset={dashed ? dashCrawl : pathDrawOffset}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={dashed ? drawProgress : 1}
        />
        <polyline
          points={`${w1x + ox},${w1y + oy} ${toX + ox},${toY + oy} ${w2x + ox},${w2y + oy}`}
          fill="none"
          stroke={baseColor}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={headOpacity}
        />
        <text
          x={labelX + ox}
          y={labelY + oy}
          textAnchor="middle"
          fill={cycleColor}
          fontSize={14}
          fontWeight={700}
          fontFamily="monospace"
          opacity={headOpacity}
        >
          cycle
        </text>
      </svg>
    );
  }

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
        stroke={baseColor}
        strokeWidth={strokeW}
        strokeDasharray={dashed ? "8 5" : `${len}`}
        strokeDashoffset={dashed ? dashCrawl : dashOffset}
        strokeLinecap="round"
        opacity={dashed ? drawProgress : 1}
      />
      <polyline
        points={`${wing1X + ox},${wing1Y + oy} ${tipX + ox},${tipY + oy} ${wing2X + ox},${wing2Y + oy}`}
        fill="none"
        stroke={baseColor}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={headOpacity}
      />
    </svg>
  );
};
