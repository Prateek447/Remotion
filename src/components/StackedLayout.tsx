import React from "react";
import { AbsoluteFill } from "remotion";
import { NoiseOverlay } from "./NoiseOverlay";

export const STACKED_TOP_RATIO = 0.55;

export interface SafeArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface StackedLayoutProps {
  top: React.ReactNode;
  bottom: React.ReactNode;
  safeArea?: SafeArea;
  topRatio?: number;
}

export const StackedLayout: React.FC<StackedLayoutProps> = ({ top, bottom, safeArea, topRatio }) => {
  const ratio = topRatio ?? STACKED_TOP_RATIO;
  const topPct = `${ratio * 100}%`;

  const sa = safeArea ?? { top: 0, bottom: 0, left: 0, right: 0 };

  return (
    <AbsoluteFill
      style={{
        background: "#000",
      }}
    >
      {/* Safe area inner box — all content lives here */}
      <div
        style={{
          position: "absolute",
          top: sa.top,
          bottom: sa.bottom,
          left: sa.left,
          right: sa.right,
        }}
      >
        {/* Diagram panel */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: topPct,
          }}
        >
          {top}
        </div>

        {/* Glowing divider */}
        <div
          style={{
            position: "absolute",
            top: topPct,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(137,180,250,0.35) 20%, rgba(203,166,247,0.5) 50%, rgba(137,180,250,0.35) 80%, transparent 100%)",
            zIndex: 10,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: topPct,
            left: "10%",
            right: "10%",
            height: 8,
            marginTop: -3,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(137,180,250,0.25) 0%, transparent 70%)",
            zIndex: 9,
            pointerEvents: "none",
          }}
        />

        {/* Code panel */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            top: topPct,
            padding: 20,
            boxSizing: "border-box",
          }}
        >
          {bottom}
        </div>
      </div>

      <NoiseOverlay />
    </AbsoluteFill>
  );
};
