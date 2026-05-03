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

interface TitleCardProps {
  title: string;
  subtitle?: string;
  complexity?: string;
}

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  complexity,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleP = spring({ frame, fps, config: springPresets.enter });
  const titleOpacity = interpolate(titleP, [0, 1], [0, 1]);
  const titleY = interpolate(titleP, [0, 0.5, 1], [50, -3, 0]);
  const titleScale = interpolate(titleP, [0, 0.6, 1], [0.92, 1.01, 1]);

  const badgeP = spring({ frame, fps, delay: 10, config: springPresets.emphasis });
  const badgeOpacity = interpolate(badgeP, [0, 1], [0, 1]);
  const badgeScale = interpolate(badgeP, [0, 0.5, 1], [0.6, 1.06, 1]);

  const subP = spring({ frame, fps, delay: 16, config: springPresets.gentle });
  const subOpacity = interpolate(subP, [0, 1], [0, 1]);
  const subY = interpolate(subP, [0, 1], [10, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at 50% 50%, #0a0a0a 0%, #000000 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
      }}
    >
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 84,
          fontWeight: 800,
          color: colors.text,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px) scale(${titleScale})`,
          letterSpacing: -1.5,
        }}
      >
        {title}
      </div>

      {complexity && (
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 30,
            color: colors.green,
            background: `${colors.green}10`,
            padding: "6px 22px",
            borderRadius: 40,
            border: `1px solid ${colors.green}30`,
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            boxShadow: `0 0 20px ${colors.green}15`,
          }}
        >
          {complexity}
        </div>
      )}

      {subtitle && (
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 26,
            color: colors.subtext0,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            letterSpacing: 0.5,
          }}
        >
          {subtitle}
        </div>
      )}

      <NoiseOverlay />
    </AbsoluteFill>
  );
};
