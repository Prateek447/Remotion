import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../lib/theme";

const TEAL  = "#5CE8D4";
const GREEN = "#40C057";
const BLUE  = "#0096FF";

// ── Tree geometry ─────────────────────────────────────────────────────────────
// 7-node complete binary tree, centred on 1080-wide canvas
// Levels: 0→y=840, 1→y=1080, 2→y=1320

const NODES = [
  { id: 1, cx: 540,  cy: 840  },   // root
  { id: 2, cx: 280,  cy: 1080 },   // level 1
  { id: 3, cx: 800,  cy: 1080 },
  { id: 4, cx: 130,  cy: 1320 },   // level 2
  { id: 5, cx: 415,  cy: 1320 },
  { id: 6, cx: 665,  cy: 1320 },
  { id: 7, cx: 950,  cy: 1320 },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2],
  [1, 3], [1, 4],
  [2, 5], [2, 6],
];

const R = 54;   // node radius

const NODE_STYLE = [
  { fill: TEAL,  glow: TEAL  },   // root
  { fill: GREEN, glow: GREEN },   // level 1
  { fill: GREEN, glow: GREEN },
  { fill: BLUE,  glow: BLUE  },   // level 2
  { fill: BLUE,  glow: BLUE  },
  { fill: BLUE,  glow: BLUE  },
  { fill: BLUE,  glow: BLUE  },
];

// ── Topics shown on this thumbnail ───────────────────────────────────────────
const TOPICS = [
  { label: "BST Insert",   color: TEAL  },
  { label: "Level Order",  color: GREEN },
  { label: "Top View",     color: BLUE  },
  { label: "Left View",    color: BLUE  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const BinaryTreeThumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: "#000", overflow: "hidden", fontFamily: fonts.sans }}>

    {/* ── Ambient glows ──────────────────────────────────────────────────── */}
    <div style={{
      position: "absolute", inset: 0,
      background: `
        radial-gradient(ellipse 860px 500px at 50% 8%,  ${TEAL}20  0%, transparent 60%),
        radial-gradient(ellipse 700px 700px at 15% 65%, ${GREEN}16 0%, transparent 58%),
        radial-gradient(ellipse 640px 640px at 85% 72%, ${BLUE}16  0%, transparent 58%)
      `,
    }} />

    {/* ── Text block ─────────────────────────────────────────────────────── */}
    <div style={{
      position:      "absolute",
      top:           152,
      left:          0,
      right:         0,
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
    }}>
      {/* Category chip */}
      <div style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          10,
        background:   `${TEAL}18`,
        border:       `1px solid ${TEAL}50`,
        borderRadius: 100,
        padding:      "7px 22px",
        marginBottom: 32,
      }}>
        <div style={{
          width: 9, height: 9, borderRadius: "50%",
          background: TEAL, boxShadow: `0 0 10px ${TEAL}`,
        }} />
        <span style={{
          fontFamily:    fonts.mono,
          fontSize:      15,
          fontWeight:    700,
          letterSpacing: 4,
          color:         TEAL,
          textTransform: "uppercase" as const,
        }}>
          Binary Tree
        </span>
      </div>

      {/* BINARY */}
      <div style={{
        fontSize:      178,
        fontWeight:    900,
        lineHeight:    0.86,
        color:         "#ffffff",
        letterSpacing: -7,
      }}>
        BINARY
      </div>

      {/* TREE — teal */}
      <div style={{
        fontSize:      178,
        fontWeight:    900,
        lineHeight:    0.86,
        letterSpacing: -7,
        color:         TEAL,
        filter:        `drop-shadow(0 0 44px ${TEAL}99)`,
      }}>
        TREE
      </div>

      {/* Divider rule */}
      <div style={{
        marginTop:  30,
        height:     2,
        width:      640,
        background: `linear-gradient(90deg, transparent 0%, ${TEAL}70 28%, ${TEAL}70 72%, transparent 100%)`,
      }} />

      {/* Subtitle */}
      <div style={{
        marginTop:     16,
        fontSize:      22,
        fontWeight:    500,
        color:         "rgba(255,255,255,0.38)",
        letterSpacing: 1.8,
        textTransform: "uppercase" as const,
      }}>
        Traversals &amp; Operations
      </div>
    </div>

    {/* ── Tree SVG ───────────────────────────────────────────────────────── */}
    <svg
      style={{ position: "absolute", inset: 0, width: 1080, height: 1920, overflow: "visible" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Edges */}
      {EDGES.map(([fi, ti], idx) => {
        const a = NODES[fi];
        const b = NODES[ti];
        const dx = b.cx - a.cx;
        const dy = b.cy - a.cy;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len;
        const uy = dy / len;
        return (
          <line
            key={idx}
            x1={a.cx + ux * R}
            y1={a.cy + uy * R}
            x2={b.cx - ux * R}
            y2={b.cy - uy * R}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}

      {/* Nodes */}
      {NODES.map((node, i) => {
        const { fill, glow } = NODE_STYLE[i];
        return (
          <g key={node.id} style={{ filter: `drop-shadow(0 0 18px ${glow}99)` }}>
            <circle cx={node.cx} cy={node.cy} r={R} fill={fill} />
            <text
              x={node.cx} y={node.cy + 12}
              textAnchor="middle"
              fill="#06100a"
              fontSize={32}
              fontWeight={900}
              fontFamily={fonts.mono}
            >
              {node.id}
            </text>
          </g>
        );
      })}
    </svg>

    {/* ── Topic badges row ───────────────────────────────────────────────── */}
    <div style={{
      position:       "absolute",
      bottom:         400,
      left:           0,
      right:          0,
      display:        "flex",
      justifyContent: "center",
      gap:            16,
      flexWrap:       "wrap" as const,
      paddingLeft:    40,
      paddingRight:   40,
    }}>
      {TOPICS.map(({ label, color }) => (
        <div
          key={label}
          style={{
            background:   `${color}14`,
            border:       `1px solid ${color}44`,
            borderRadius: 10,
            padding:      "8px 18px",
            fontFamily:   fonts.mono,
            fontSize:     17,
            fontWeight:   700,
            color,
            letterSpacing: 0.5,
          }}
        >
          {label}
        </div>
      ))}
    </div>

  </AbsoluteFill>
);
