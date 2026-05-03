import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { useStepTransition } from "../lib/useStepTransition";
import { colors, fonts, springPresets } from "../lib/theme";

interface CodeBlockProps {
  tokens: ThemedToken[][];
  steps: SceneStep[];
  fontSize?: number;
  lineHeight?: number;
  padding?: number;
  centered?: boolean;
  centerWidth?: number; // override canvas width for centering (e.g. safe area width)
}

// JetBrains Mono character width ratio (width / fontSize)
const CHAR_W_RATIO = 0.601;
const LINE_NUM_W = 0;
const PILL_PAD = 10; // breathing room on left & right inside the pill

const COLOR_REMAP: Record<string, string> = {
  "#e06c75": "#61AFEF", // red → blue
  "#E06C75": "#61AFEF",
  "#61afef": "#E06C75", // blue → red
  "#61AFEF": "#E06C75",
};

function remapTokenColor(hex: string): string {
  if (COLOR_REMAP[hex]) return COLOR_REMAP[hex];
  const c = hex.replace("#", "");
  if (c.length < 6) return hex;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  if (r > 180 && g > 140 && b < 140) return "#E0E0E0"; // yellow → white
  return hex;
}

function maxCharsInRange(tokens: ThemedToken[][], start: number, end: number): number {
  let max = 0;
  for (let i = start; i <= end; i++) {
    if (!tokens[i]) continue;
    const chars = tokens[i].reduce((acc, tok) => acc + tok.content.length, 0);
    if (chars > max) max = chars;
  }
  return max;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  tokens,
  steps,
  fontSize = 24,
  lineHeight = 1.75,
  padding = 40,
  centered = false,
  centerWidth,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth } = useVideoConfig();
  const lineH = fontSize * lineHeight;
  const charW = fontSize * CHAR_W_RATIO;

  // When centered, compute left padding so the longest line sits in the middle
  const referenceWidth = centerWidth ?? canvasWidth;
  const longestLineChars = tokens.reduce(
    (max, line) => Math.max(max, line.reduce((acc, tok) => acc + tok.content.length, 0)),
    0,
  );
  const contentWidth = longestLineChars * charW + PILL_PAD * 2;
  const centeredLeft = Math.max(padding, (referenceWidth - contentWidth) / 2);
  const pLeft = centered ? centeredLeft : padding;

  const { current, previous, t, localFrame } = useStepTransition(steps);

  const prevStart = previous.highlightLines.startLine;
  const prevEnd = previous.highlightLines.endLine;
  const currStart = current.highlightLines.startLine;
  const currEnd = current.highlightLines.endLine;

  // Pill vertical position & height
  const pillTop = interpolate(t, [0, 1], [
    padding + prevStart * lineH,
    padding + currStart * lineH,
  ]);
  const pillHeight = interpolate(t, [0, 1], [
    (prevEnd - prevStart + 1) * lineH,
    (currEnd - currStart + 1) * lineH,
  ]);

  // Pill width: starts at first character, sized to widest highlighted line
  const currW = PILL_PAD + LINE_NUM_W + maxCharsInRange(tokens, currStart, currEnd) * charW + PILL_PAD;
  const prevW = PILL_PAD + LINE_NUM_W + maxCharsInRange(tokens, prevStart, prevEnd) * charW + PILL_PAD;
  const pillWidth = interpolate(t, [0, 1], [prevW, currW]);

  const pillOpacity = spring({
    frame: localFrame,
    fps,
    config: springPresets.gentle,
  });

  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize,
        background: "transparent",
        padding,
        paddingLeft: pLeft,
        height: "100%",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Neon pill — starts at first character */}
      {currStart >= 0 && (
        <div
          style={{
            position: "absolute",
            left: pLeft - PILL_PAD,
            width: pillWidth,
            top: pillTop,
            height: pillHeight,
            background: "rgba(110,155,255,0.08)",
            border: "1px solid rgba(110,155,255,0.35)",
            borderRadius: 8,
            boxShadow:
              "0 0 12px rgba(110,155,255,0.30), 0 0 36px rgba(110,155,255,0.10), inset 0 0 14px rgba(110,155,255,0.06)",
            pointerEvents: "none",
            opacity: pillOpacity,
          }}
        />
      )}

      {tokens.map((lineTokens, i) => {
        const currVisible = current.visibleLines;
        const prevVisible = previous.visibleLines;
        const hasRevealControl = currVisible !== undefined;

        const isVisible = !hasRevealControl || i < currVisible;
        const wasVisible = !hasRevealControl || prevVisible === undefined || i < prevVisible;
        const isNewlyRevealed = hasRevealControl && isVisible && !wasVisible;

        if (!isVisible) {
          return (
            <div key={i} style={{ whiteSpace: "pre", lineHeight: `${lineHeight}`, opacity: 0, height: lineH }}>
              {"\u200b"}
            </div>
          );
        }

        const revealProgress = isNewlyRevealed
          ? spring({ frame: localFrame, fps, delay: (i - (prevVisible ?? 0)) * 3, config: springPresets.enter })
          : spring({ frame, fps, delay: i * 2, config: springPresets.enter });
        const revealOpacity = interpolate(revealProgress, [0, 1], [0, 1]);
        const revealX = interpolate(revealProgress, [0, 1], [24, 0]);

        const isHighlighted = i >= currStart && i <= currEnd;
        const wasHighlighted = i >= prevStart && i <= prevEnd;
        const dimTarget = isHighlighted ? 1 : colors.dimmed;
        const dimFrom = wasHighlighted ? 1 : colors.dimmed;
        const lineDim = interpolate(t, [0, 1], [dimFrom, dimTarget]);

        return (
          <div
            key={i}
            style={{
              whiteSpace: "pre",
              lineHeight: `${lineHeight}`,
              opacity: revealOpacity * lineDim,
              transform: `translateX(${revealX}px)`,
              display: "flex",
              alignItems: "center",
            }}
          >
            <span>
              {lineTokens.map((tok, j) => {
                const rawColor = tok.color ?? colors.text;
                const tokenColor = remapTokenColor(rawColor);

                const tokenGlowP = isHighlighted
                  ? spring({
                      frame: localFrame,
                      fps,
                      delay: j * 3,
                      config: { damping: 12, stiffness: 160 },
                    })
                  : 0;
                const tg = interpolate(tokenGlowP, [0, 1], [0, 1], {
                  extrapolateRight: "clamp",
                });

                const textShadow =
                  tg > 0.04
                    ? `0 0 ${tg * 7}px ${tokenColor}, 0 0 ${tg * 20}px ${tokenColor}77`
                    : undefined;

                return (
                  <span key={j} style={{ color: tokenColor, textShadow }}>
                    {tok.content}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
};
