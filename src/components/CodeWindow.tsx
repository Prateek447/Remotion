import React from "react";
import { colors, fonts } from "../lib/theme";

interface CodeWindowProps {
  title?: string;
  hideTitle?: boolean;
  children: React.ReactNode;
}

export const CodeWindow: React.FC<CodeWindowProps> = ({
  title = "LinkedList.java",
  hideTitle = false,
  children,
}) => {
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "transparent",
      }}
    >
      {!hideTitle && (
        <div
          style={{
            background: "transparent",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 7,
            flexShrink: 0,
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3a" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3a" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3a" }} />
          <span
            style={{
              marginLeft: 8,
              color: colors.overlay0,
              fontSize: 12,
              fontFamily: fonts.sans,
              letterSpacing: 0.3,
            }}
          >
            {title}
          </span>
        </div>
      )}
      <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
    </div>
  );
};
