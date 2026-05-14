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
  bend?: number;
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
  bend = 0,
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
          left: 0,
          top: 0,
          width: svgW,
          height: svgH,
          pointerEvents: "none",
          overflow: "visible",
          filter: glowFilter,
          opacity: opacityOverride ?? 1,
          willChange: "transform",
          transform: `translate(${minXc}px, ${minYc}px)`,
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
          fontSize={20}
          fontWeight={700}
          fontFamily="monospace"
          opacity={headOpacity}
          style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.9))" }}
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

  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular unit vector (rotated 90° CCW)
  const px = -uy;
  const py =  ux;

  // Quadratic bezier control point — offset perpendicularly by `bend`
  const cx = (fromX + toX) / 2 + px * bend;
  const cy = (fromY + toY) / 2 + py * bend;

  // Arrowhead direction = tangent of bezier at t=1: from control point toward tip
  const headDx = toX - cx;
  const headDy = toY - cy;
  const headLen2 = Math.hypot(headDx, headDy) || 1;
  const hux = headDx / headLen2;
  const huy = headDy / headLen2;

  const headLen = 10;
  const headSpread = 5;
  const tipX = toX;
  const tipY = toY;
  const wing1X = tipX - headLen * hux + headSpread * huy;
  const wing1Y = tipY - headLen * huy - headSpread * hux;
  const wing2X = tipX - headLen * hux - headSpread * huy;
  const wing2Y = tipY - headLen * huy + headSpread * hux;

  const pad = Math.abs(bend) + 30;
  const minX = Math.min(fromX, toX, cx) - pad;
  const minY = Math.min(fromY, toY, cy) - pad;
  const svgW = Math.max(Math.abs(dx), Math.abs(cx - fromX), Math.abs(cx - toX)) + pad * 2;
  const svgH = Math.max(Math.abs(dy), Math.abs(cy - fromY), Math.abs(cy - toY), 20) + pad * 2;

  const ox = -minX;
  const oy = -minY;

  const headOpacity = interpolate(drawProgress, [0.6, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Use pathLength for dash animation so it works for both straight and curved paths
  const pathD = `M ${fromX + ox} ${fromY + oy} Q ${cx + ox} ${cy + oy} ${toX + ox} ${toY + oy}`;
  const dashOffset = interpolate(drawProgress, [0, 1], [1, 0]);

  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: svgW,
        height: svgH,
        pointerEvents: "none",
        overflow: "visible",
        filter: glowFilter,
        opacity: opacityOverride ?? 1,
        willChange: "transform",
        transform: `translate(${minX}px, ${minY}px)`,
      }}
    >
      <path
        d={pathD}
        stroke={baseColor}
        strokeWidth={strokeW}
        fill="none"
        pathLength={1}
        strokeDasharray={dashed ? "0.12 0.08" : "1"}
        strokeDashoffset={dashed ? dashCrawl / len : dashOffset}
        strokeLinecap="round"
        strokeLinejoin="round"
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
