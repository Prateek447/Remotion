import React from "react";
import { AbsoluteFill } from "remotion";
import { NoiseOverlay } from "./NoiseOverlay";

// Height of the diagram region within the reel canvas (1080×1920).
// Scenes pass this as areaHeight when format === "reel-anim".
export const ANIM_DIAGRAM_HEIGHT = 900;

// Uniform scale applied to the whole diagram so it stays within Instagram's
// horizontal safe area without changing arrow/node proportions.
export const ANIM_SAFE_SCALE = 0.889; // (1080 - 120) / 1080

interface AnimationOnlyLayoutProps {
  children: React.ReactNode;
}

export const AnimationOnlyLayout: React.FC<AnimationOnlyLayoutProps> = ({ children }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        height: ANIM_DIAGRAM_HEIGHT,
        transform: `translateY(-50%) scale(${ANIM_SAFE_SCALE})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
    <NoiseOverlay />
  </AbsoluteFill>
);
