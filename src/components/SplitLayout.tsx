import React from "react";
import { AbsoluteFill } from "remotion";

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
        background: [
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          "#000",
        ].join(", "),
        backgroundSize: "60px 60px, 60px 60px, 100% 100%",
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
    </AbsoluteFill>
  );
};
