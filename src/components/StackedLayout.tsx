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
  contentPaddingTop?: number;
}

export const StackedLayout: React.FC<StackedLayoutProps> = ({ top, bottom, safeArea, topRatio, contentPaddingTop = 36 }) => {
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

        {/* Code panel — card background */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            top: topPct,
          }}
        >
          {/* Card face */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(6, 6, 16, 0.78)",
              borderTop: "1.5px solid rgba(0, 150, 255, 0.22)",
              borderLeft: "1px solid rgba(255,255,255,0.055)",
              borderRight: "1px solid rgba(255,255,255,0.055)",
              borderRadius: "22px 22px 0 0",
              boxShadow: "0 -8px 40px rgba(0,150,255,0.06)",
            }}
          />
          {/* Content */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: `${contentPaddingTop}px 20px 20px`,
              boxSizing: "border-box",
            }}
          >
            {bottom}
          </div>
        </div>
      </div>

      <NoiseOverlay />
    </AbsoluteFill>
  );
};
