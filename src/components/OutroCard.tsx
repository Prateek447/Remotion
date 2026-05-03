import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { colors, fonts, springPresets } from "../lib/theme";
import { NoiseOverlay } from "./NoiseOverlay";

interface OutroCardProps {
  title: string;
  nextTopic?: string;
}

export const OutroCard: React.FC<OutroCardProps> = ({ title, nextTopic }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkP = spring({ frame, fps, config: springPresets.emphasis });
  const checkScale = interpolate(checkP, [0, 0.5, 1], [0, 1.15, 1]);
  const checkOpacity = interpolate(checkP, [0, 1], [0, 1]);

  const textP = spring({ frame, fps, delay: 8, config: springPresets.enter });
  const textOpacity = interpolate(textP, [0, 1], [0, 1]);
  const textY = interpolate(textP, [0, 1], [20, 0]);

  const nextP = spring({ frame, fps, delay: 20, config: springPresets.gentle });
  const nextOpacity = interpolate(nextP, [0, 1], [0, 1]);
  const nextY = interpolate(nextP, [0, 1], [12, 0]);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, #0a0a0a 0%, #000000 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "rgba(21,101,192,0.18)",
          border: "2px solid rgba(21,101,192,0.50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: checkOpacity,
          transform: `scale(${checkScale})`,
          boxShadow: "0 0 40px rgba(21,101,192,0.20)",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12l5 5L20 7"
            stroke="#1565C0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 42,
          fontWeight: 700,
          color: colors.text,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          letterSpacing: -0.5,
          textAlign: "center",
        }}
      >
        {title}
      </div>

      {nextTopic && (
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 22,
            color: colors.subtext0,
            opacity: nextOpacity,
            transform: `translateY(${nextY}px)`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>Up next:</span>
          <span style={{ color: "#1565C0", fontWeight: 600 }}>
            {nextTopic}
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            style={{ marginTop: 1 }}
          >
            <path
              d="M5 12h14m-6-6l6 6-6 6"
              stroke="#1565C0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      <NoiseOverlay />
    </AbsoluteFill>
  );
};
