import React from "react";
import { AbsoluteFill } from "remotion";
import { NoiseOverlay } from "./NoiseOverlay";

interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({
  left,
  right,
  leftWidth = "62%",
}) => {
  return (
    <AbsoluteFill
      style={{
        background: "#000",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {left}
      </div>

      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: `calc(100% - ${leftWidth})`,
          padding: 16,
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      >
        {right}
      </div>

      <NoiseOverlay />
    </AbsoluteFill>
  );
};
