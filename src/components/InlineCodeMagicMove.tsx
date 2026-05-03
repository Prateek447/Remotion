import React, { useMemo } from "react";
import { interpolate } from "remotion";
import type { KeyedTokensInfo, KeyedToken } from "../lib/magic-move";
import { fonts } from "../lib/theme";

interface InlineCodeMagicMoveProps {
  fromInfo: KeyedTokensInfo;
  toInfo: KeyedTokensInfo;
  // Normalised progress 0..1. 0 == fully `from`, 1 == fully `to`.
  progress: number;
  fontSize?: number;
  lineHeight?: number;
  padX?: number;
  padY?: number;
}

// JetBrains Mono character advance (width / fontSize). Matches CodeBlock.
const CHAR_W_RATIO = 0.601;

interface TokenPos {
  key: string;
  content: string;
  color?: string;
  x: number;
  y: number;
}

function buildLayout(
  info: KeyedTokensInfo,
  charW: number,
  lineH: number,
  padX: number,
  padY: number,
): Map<string, TokenPos> {
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
      x: padX + col * charW,
      y: padY + line * lineH,
    });

    col += token.content.length;
  }

  return map;
}

// Inline Motion-Canvas-style code morph. Unlike CodeMagicMove which owns its
// own frame-driven spring and fullscreen layout, this version is driven by an
// external `progress` prop so the parent scene can control exactly when the
// transition fires and fits the morph inside an arbitrary container.
export const InlineCodeMagicMove: React.FC<InlineCodeMagicMoveProps> = ({
  fromInfo,
  toInfo,
  progress,
  fontSize = 22,
  lineHeight = 1.75,
  padX = 40,
  padY = 40,
}) => {
  const charW = fontSize * CHAR_W_RATIO;
  const lineH = fontSize * lineHeight;

  const fromLayout = useMemo(
    () => buildLayout(fromInfo, charW, lineH, padX, padY),
    [fromInfo, charW, lineH, padX, padY],
  );
  const toLayout = useMemo(
    () => buildLayout(toInfo, charW, lineH, padX, padY),
    [toInfo, charW, lineH, padX, padY],
  );

  const elements: React.ReactNode[] = [];
  const renderedFromKeys = new Set<string>();

  // Tokens present in both snapshots: tween position & color.
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
            fontSize,
            lineHeight: `${lineHeight}`,
            whiteSpace: "pre",
          }}
        >
          {to.content}
        </span>,
      );
    } else {
      // New token: fade + slide in during the second half of the transition.
      const fadeIn = interpolate(progress, [0.4, 0.9], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const slideY = interpolate(progress, [0.4, 0.9], [10, 0], {
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
            fontSize,
            lineHeight: `${lineHeight}`,
            whiteSpace: "pre",
            opacity: fadeIn,
          }}
        >
          {to.content}
        </span>,
      );
    }
  });

  // Tokens dropped in `to`: fade + slide out during the first half.
  fromLayout.forEach((from, key) => {
    if (renderedFromKeys.has(key)) return;

    const fadeOut = interpolate(progress, [0, 0.5], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const slideY = interpolate(progress, [0, 0.5], [0, -8], {
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
          fontSize,
          lineHeight: `${lineHeight}`,
          whiteSpace: "pre",
          opacity: fadeOut,
        }}
      >
        {from.content}
      </span>,
    );
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {elements}
    </div>
  );
};
