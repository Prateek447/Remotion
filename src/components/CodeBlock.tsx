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
            background: "rgba(137,180,250,0.07)",
            border: "1px solid rgba(137,180,250,0.32)",
            borderRadius: 8,
            boxShadow:
              "0 0 10px rgba(137,180,250,0.28), 0 0 30px rgba(137,180,250,0.12), inset 0 0 12px rgba(137,180,250,0.05)",
            pointerEvents: "none",
            opacity: pillOpacity,
          }}
        />
      )}

      {tokens.map((lineTokens, i) => {
        const revealProgress = spring({
          frame,
          fps,
          delay: i * 2,
          config: springPresets.enter,
        });
        const revealOpacity = interpolate(revealProgress, [0, 1], [0, 1]);
        const revealX = interpolate(revealProgress, [0, 1], [16, 0]);

        const isHighlighted = i >= currStart && i <= currEnd;
        const wasHighlighted = i >= prevStart && i <= prevEnd;
        const dimTarget = isHighlighted ? 1 : colors.dimmed;
        const dimFrom = wasHighlighted ? 1 : colors.dimmed;
        const lineDim = interpolate(t, [0, 1], [dimFrom, dimTarget]);

        // Glow springs in at every step transition for highlighted lines
        const glowP = isHighlighted
          ? spring({ frame: localFrame, fps, config: { damping: 10, stiffness: 120 } })
          : 0;

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
            {/* Tokens with per-token stagger glow */}
            <span>
              {lineTokens.map((tok, j) => {
                const tokenColor = tok.color ?? colors.text;

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
