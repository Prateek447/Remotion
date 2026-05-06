import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { NodeHighlight } from "../lib/types";
import { colors, fonts, spacing, springPresets } from "../lib/theme";

interface TreeNodeCircleProps {
  value: number | string;
  highlight?: NodeHighlight;
  prevHighlight?: NodeHighlight;
  transitionT?: number;
  x: number;
  y: number;
  size: number;
  delay?: number;
  localStepFrame?: number;
  showRing?: boolean;
}

const highlightColorMap: Record<NodeHighlight, { bg: string; border: string }> = {
  active:   { bg: "#1F5FAE", border: "#4A86C8" },
  found:    { bg: "#2E7D32", border: "#66BB6A" },
  removing: { bg: "#1F5FAE", border: "#4A86C8" },
  error:    { bg: "#1F5FAE", border: "#4A86C8" },
  new:      { bg: "#1F5FAE", border: "#4A86C8" },
  visited:  { bg: "#1F3552", border: "#2B5C8A" },
  none:     { bg: colors.nodeDefault, border: "#64B5F6" },
};

function lerpHex(from: string, to: string, t: number): string {
  const fr = parseInt(from.slice(1, 3), 16);
  const fg = parseInt(from.slice(3, 5), 16);
  const fb = parseInt(from.slice(5, 7), 16);
  const tr = parseInt(to.slice(1, 3), 16);
  const tg = parseInt(to.slice(3, 5), 16);
  const tb = parseInt(to.slice(5, 7), 16);
  const r = Math.round(fr + (tr - fr) * t);
  const g = Math.round(fg + (tg - fg) * t);
  const b = Math.round(fb + (tb - fb) * t);
  return `rgb(${r},${g},${b})`;
}

function spotlightOpacityFor(h: NodeHighlight): number {
  if (h === "active" || h === "found" || h === "new") return 1.0;
  if (h === "visited") return 0.52;
  if (h === "removing" || h === "error") return 0.85;
  return 0.38; // "none" — dimmed
}

// ─── ring helpers ────────────────────────────────────────────────────────────
function ringColorFor(h: NodeHighlight): string {
  if (h === "found")   return "#66BB6A";
  if (h === "active")  return "#4A86C8";
  if (h === "visited") return "#2B5C8A";
  return "#89b4fa";
}
function ringOpacityFor(h: NodeHighlight): number {
  if (h === "found")   return 0.92;
  if (h === "active")  return 0.80;
  if (h === "visited") return 0.22;
  return 0.48;
}
function ringWidthFor(h: NodeHighlight): number {
  return (h === "found" || h === "active") ? 2.8 : 2;
}

export const TreeNodeCircle: React.FC<TreeNodeCircleProps> = ({
  value,
  highlight = "none",
  prevHighlight = "none",
  transitionT = 1,
  x,
  y,
  size,
  delay = 0,
  localStepFrame = 0,
  showRing = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. BOUNCY ENTRY — underdamped spring overshoots for pop-in bounce
  const enterP = spring({ frame, fps, delay, config: springPresets.bouncy });
  const enterOpacity = interpolate(enterP, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });
  const enterScale  = interpolate(enterP, [0, 1], [0.55, 1]); // natural overshoot above 1
  const enterY      = interpolate(enterP, [0, 1], [-28, 0]);

  // Single-fire emphasis pulse when this node becomes active/found
  const isEmphasized = highlight === "active" || highlight === "found" || highlight === "new";
  const emphasisP = isEmphasized
    ? spring({ frame: Math.max(0, localStepFrame), fps, config: springPresets.emphasis })
    : 0;
  const emphasisScale = isEmphasized
    ? interpolate(emphasisP, [0, 0.5, 1], [1, 1.12, 1.02])
    : 1;

  // 2. DAMPED OSCILLATION WOBBLE — decaying side-to-side shake on highlight change
  const wobbleDecay  = isEmphasized ? Math.exp(-localStepFrame * 0.07) : 0;
  const wobbleSin    = Math.sin(localStepFrame * 0.55);
  const wobbleX      = wobbleDecay * 6 * wobbleSin;
  const wobbleRotate = wobbleDecay * 1.8 * wobbleSin; // subtle tilt in phase with displacement

  // Spotlight: interpolate opacity from previous to current dim level
  const targetOpacity  = spotlightOpacityFor(highlight);
  const prevOpacity    = spotlightOpacityFor(prevHighlight);
  const spotlightOpacity = interpolate(transitionT, [0, 1], [prevOpacity, targetOpacity]);

  // Color crossfade between prev and current state
  const prevPalette = highlightColorMap[prevHighlight];
  const currPalette = highlightColorMap[highlight];
  const bg          = lerpHex(prevPalette.bg, currPalette.bg, transitionT);
  const borderColor = lerpHex(prevPalette.border, currPalette.border, transitionT);

  // Glow intensity crossfade
  const currGlow = isEmphasized ? 1.0 : highlight === "visited" ? 0.2 : 0.35;
  const prevGlow = (prevHighlight === "active" || prevHighlight === "found" || prevHighlight === "new")
    ? 1.0 : prevHighlight === "visited" ? 0.2 : 0.35;
  const glowStrength = interpolate(transitionT, [0, 1], [prevGlow, currGlow]);
  const glowColor    = lerpHex(prevPalette.border, currPalette.border, transitionT);
  const boxShadow    = `0 0 ${10 + glowStrength * 14}px ${glowColor}66, 0 0 ${22 + glowStrength * 20}px ${glowColor}22`;

  // ── Dashed ring for left-view nodes ──────────────────────────────────────
  const ringPad    = Math.round(size * 0.22);        // gap between node edge and ring
  const svgSize    = size + ringPad * 2;
  const ringR      = svgSize / 2 - 1.5;
  const ringColor  = lerpHex(ringColorFor(prevHighlight),   ringColorFor(highlight),   transitionT);
  const ringOpacity = interpolate(transitionT, [0, 1], [ringOpacityFor(prevHighlight), ringOpacityFor(highlight)]);
  const ringWidth  = interpolate(transitionT, [0, 1], [ringWidthFor(prevHighlight),    ringWidthFor(highlight)]);
  // slow rotation — 0.45°/frame so one full turn ≈ 800 frames
  const ringRotation = (frame * 0.45) % 360;

  return (
    <div
      style={{
        position: "absolute",
        left: x + wobbleX,
        top: y + enterY,
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        border: `3px solid ${borderColor}`,
        boxShadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${enterScale * emphasisScale}) rotate(${wobbleRotate}deg)`,
        opacity: enterOpacity * spotlightOpacity,
      }}
    >
      {/* Rotating dashed ring — visible on left-view nodes */}
      {showRing && (
        <svg
          width={svgSize}
          height={svgSize}
          style={{
            position:      "absolute",
            left:          "50%",
            top:           "50%",
            transform:     `translate(-50%, -50%) rotate(${ringRotation}deg)`,
            pointerEvents: "none",
            overflow:      "visible",
          }}
        >
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={ringR}
            fill="none"
            stroke={ringColor}
            strokeWidth={ringWidth}
            strokeDasharray="7 4.5"
            strokeLinecap="round"
            opacity={ringOpacity}
          />
        </svg>
      )}

      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: Math.max(24, size * 0.35),
          fontWeight: 800,
          color: "#fff",
          textShadow: "0 0 8px rgba(255,255,255,0.18)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
};
