import React, { useMemo } from "react";
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from "remotion";
import type { KeyedTokensInfo, KeyedToken } from "../lib/magic-move";
import { fonts } from "../lib/theme";

interface CodeMagicMoveProps {
  fromInfo: KeyedTokensInfo;
  toInfo: KeyedTokensInfo;
}

const FONT_SIZE = 24;
const LINE_HEIGHT = 1.75;
const CHAR_WIDTH = FONT_SIZE * 0.602;
const LINE_H = FONT_SIZE * LINE_HEIGHT;
const PAD_Y = 60;
const PAD_X = 40;

interface TokenPos {
  key: string;
  content: string;
  color?: string;
  x: number;
  y: number;
}

function buildLayout(info: KeyedTokensInfo): Map<string, TokenPos> {
  const map = new Map<string, TokenPos>();
  let line = 0;
  let col = 0;

  for (const token of info.tokens as KeyedToken[]) {
    if (token.content === "\n") {
      line++;
      col = 0;
      continue;
    }

    map.set(token.key, {
      key: token.key,
      content: token.content,
      color: token.color,
      x: PAD_X + col * CHAR_WIDTH,
      y: PAD_Y + line * LINE_H,
    });

    col += token.content.length;
  }

  return map;
}

export const CodeMagicMove: React.FC<CodeMagicMoveProps> = ({
  fromInfo,
  toInfo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fromLayout = useMemo(() => buildLayout(fromInfo), [fromInfo]);
  const toLayout = useMemo(() => buildLayout(toInfo), [toInfo]);

  const progress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 80, mass: 0.8 },
  });

  const elements: React.ReactNode[] = [];
  const renderedFromKeys = new Set<string>();

  toLayout.forEach((to, key) => {
    const from = fromLayout.get(key);

    if (from) {
      renderedFromKeys.add(key);
      const x = interpolate(progress, [0, 1], [from.x, to.x]);
      const y = interpolate(progress, [0, 1], [from.y, to.y]);

      const fromColor = from.color || "#abb2bf";
      const toColor = to.color || "#abb2bf";
      const color = progress < 0.5 ? fromColor : toColor;

      elements.push(
        <span
          key={`m-${key}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            color,
            fontFamily: fonts.mono,
            fontSize: FONT_SIZE,
            lineHeight: `${LINE_HEIGHT}`,
            whiteSpace: "pre",
          }}
        >
          {to.content}
        </span>,
      );
    } else {
      const fadeIn = interpolate(progress, [0.35, 0.85], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const slideY = interpolate(progress, [0.35, 0.85], [12, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      elements.push(
        <span
          key={`in-${key}`}
          style={{
            position: "absolute",
            left: to.x,
            top: to.y + slideY,
            color: to.color || "#abb2bf",
            fontFamily: fonts.mono,
            fontSize: FONT_SIZE,
            lineHeight: `${LINE_HEIGHT}`,
            whiteSpace: "pre",
            opacity: fadeIn,
          }}
        >
          {to.content}
        </span>,
      );
    }
  });

  fromLayout.forEach((from, key) => {
    if (renderedFromKeys.has(key)) return;

    const fadeOut = interpolate(progress, [0, 0.45], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const slideY = interpolate(progress, [0, 0.45], [0, -10], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    elements.push(
      <span
        key={`out-${key}`}
        style={{
          position: "absolute",
          left: from.x,
          top: from.y + slideY,
          color: from.color || "#abb2bf",
          fontFamily: fonts.mono,
          fontSize: FONT_SIZE,
          lineHeight: `${LINE_HEIGHT}`,
          whiteSpace: "pre",
          opacity: fadeOut,
        }}
      >
        {from.content}
      </span>,
    );
  });

  const titleOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("sfx/codeslide.mp3")} volume={0.25} />
      <Audio src={staticFile("sfx/swoosh.mp3")} volume={0.15} startFrom={4} />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "55%",
          height: "70%",
          overflow: "hidden",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {elements}
        </div>
      </div>
    </AbsoluteFill>
  );
};
