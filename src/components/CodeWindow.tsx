import React from "react";
import { colors, fonts } from "../lib/theme";

interface CodeWindowProps {
  title?: string;
  hideTitle?: boolean;
  noHeader?: boolean;
  children: React.ReactNode;
}

export const CodeWindow: React.FC<CodeWindowProps> = ({
  title = "LinkedList.java",
  hideTitle = false,
  noHeader = false,
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
      {!noHeader && hideTitle ? (
        /* Reel — minimal header: glowing dot + filename */
        <div
          style={{
            padding: "12px 20px 10px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#0096FF",
              boxShadow: "0 0 8px #0096FFBB, 0 0 18px #0096FF55",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: "rgba(160, 160, 184, 0.55)",
              fontSize: 14,
              fontFamily: fonts.mono,
              letterSpacing: 0.8,
            }}
          >
            {title}
          </span>
        </div>
      ) : !noHeader ? (
        /* YouTube — Mac-style traffic-light header */
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
      ) : null}
      <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
    </div>
  );
};
