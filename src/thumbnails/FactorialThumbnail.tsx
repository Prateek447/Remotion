import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../lib/theme";

const MAUVE = "#B07EFF";
const PINK  = "#FF7EB8";
const WHITE = "#F0F0F8";
const DIM   = "rgba(255,255,255,0.42)";

// ── Layout constants ──────────────────────────────────────────────────────────
// Canvas: 1280 × 720
// Left text column : x  56 → 556  (width 500)
// Gap              : x 556 → 640  (84px clear air)
// Right SVG diagram: x 640 → 1240 (width 600, 40px right margin)

const SVG_LEFT = 640;
const SVG_W    = 600;
const SVG_H    = 720;

// Tree node centres in SVG-local coordinates
// Width budget: 600px. Leave ~20px edge margin → usable 560px.
// ROOT  centred at 300
// L1    3 nodes,  spread [80, 300, 520]
// L2    6 nodes,  pairs under each L1 parent:
//         under 80  → [20, 140]
//         under 300 → [240, 360]
//         under 520 → [460, 580]
// L3    same x as L2, one level deeper (leaf row)
const ROOT = { x: 300, y: 80 };
const L1   = [{ x: 80, y: 228 }, { x: 300, y: 228 }, { x: 520, y: 228 }];
const L2   = [
  { x: 20,  y: 396 }, { x: 140, y: 396 },
  { x: 240, y: 396 }, { x: 360, y: 396 },
  { x: 460, y: 396 }, { x: 580, y: 396 },
];
const L3 = L2.map((n) => ({ x: n.x, y: 552 }));

const R       = 16;  // normal node radius
const R_ROOT  = 21;  // root node radius

// ── Sub-components ────────────────────────────────────────────────────────────

const NodeCircle: React.FC<{ x: number; y: number; leaf?: boolean; root?: boolean }> = (
  { x, y, leaf = false, root = false }
) => {
  const r   = root ? R_ROOT : R;
  const col = leaf ? PINK : MAUVE;
  return (
    <g>
      {leaf && (
        <circle cx={x} cy={y} r={r + 12} fill={PINK} opacity={0.10}
          style={{ filter: "blur(8px)" }} />
      )}
      <circle cx={x} cy={y} r={r}
        fill={leaf ? `${PINK}28` : `${MAUVE}18`}
        stroke={col} strokeWidth={1.6}
        style={{ filter: `drop-shadow(0 0 ${leaf ? 8 : 4}px ${col}88)` }} />
    </g>
  );
};

const Edge: React.FC<{ x1: number; y1: number; x2: number; y2: number; r1?: number; faint?: boolean }> = (
  { x1, y1, x2, y2, r1 = R, faint = false }
) => (
  <line
    x1={x1} y1={y1 + r1 + 2}
    x2={x2} y2={y2 - R  - 2}
    stroke={faint ? `${MAUVE}22` : `${MAUVE}40`}
    strokeWidth={1.2}
  />
);

// Pill badge showing the multiplier between levels
const Multiplier: React.FC<{ y: number; label: string }> = ({ y, label }) => (
  <g>
    <rect x={300 - 52} y={y - 12} width={104} height={24} rx={12}
      fill={`${MAUVE}0E`} stroke={`${MAUVE}35`} strokeWidth={1} />
    <text x={300} y={y + 5}
      textAnchor="middle" fill={`${MAUVE}CC`}
      fontSize={12} fontWeight={600} fontFamily={fonts.mono}>
      {label}
    </text>
  </g>
);

// ── Main component ────────────────────────────────────────────────────────────

export const FactorialThumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: "#000", fontFamily: fonts.sans, overflow: "hidden" }}>

    {/* Ambient glow */}
    <div style={{
      position: "absolute", inset: 0,
      background: `
        radial-gradient(ellipse 560px 580px at  0% 50%, ${MAUVE}1C 0%, transparent 62%),
        radial-gradient(ellipse 480px 460px at 100% 80%, ${PINK}14  0%, transparent 55%)
      `,
    }} />

    {/* Dot grid */}
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}>
      {Array.from({ length: 13 }, (_, i) =>
        Array.from({ length: 7 },  (_, j) => (
          <circle key={`${i}-${j}`} cx={i * 107 + 40} cy={j * 120 + 60} r={1.5} fill={MAUVE} />
        ))
      )}
    </svg>

    {/* ── Left text column ─────────────────────────────────────────── */}
    <div style={{
      position: "absolute",
      left: 56, top: 0, bottom: 0, width: 500,
      display: "flex", flexDirection: "column",
      justifyContent: "center",
    }}>
      {/* Series chip */}
      <div style={{
        display: "inline-flex", alignItems: "center",
        background: `${MAUVE}14`, border: `1px solid ${MAUVE}40`,
        borderRadius: 8, padding: "6px 18px", width: "fit-content",
        marginBottom: 28,
      }}>
        <span style={{
          fontFamily: fonts.mono, fontSize: 13, fontWeight: 600,
          letterSpacing: 3, color: MAUVE, textTransform: "uppercase" as const,
        }}>
          Big O · Time Complexity
        </span>
      </div>

      {/* "n!" hero */}
      <div style={{
        fontSize: 218,
        fontWeight: 900,
        lineHeight: 0.84,
        color: WHITE,
        letterSpacing: -10,
      }}>
        n!
      </div>

      {/* "FACTORIAL" gradient */}
      <div style={{
        fontSize: 64,
        fontWeight: 800,
        lineHeight: 1,
        marginTop: 14,
        background: `linear-gradient(100deg, ${MAUVE} 0%, ${PINK} 100%)`,
        WebkitBackgroundClip: "text" as const,
        WebkitTextFillColor: "transparent" as const,
        letterSpacing: -1,
      }}>
        FACTORIAL
      </div>

      {/* Divider */}
      <div style={{
        marginTop: 26, height: 1.5, width: 400,
        background: `linear-gradient(90deg, ${MAUVE}70 0%, transparent 100%)`,
      }} />

      {/* Subtitle */}
      <div style={{ marginTop: 18, fontSize: 23, fontWeight: 400, color: DIM }}>
        The Slowest Complexity Class
      </div>

      {/* O(n!) badge */}
      <div style={{
        marginTop: 26,
        display: "inline-flex", alignItems: "center", gap: 10,
        background: `${MAUVE}14`, border: `1.5px solid ${MAUVE}44`,
        borderRadius: 50, padding: "11px 26px", width: "fit-content",
        boxShadow: `0 0 26px ${MAUVE}20`,
      }}>
        <span style={{ fontFamily: fonts.mono, fontSize: 25, fontWeight: 700, color: MAUVE, letterSpacing: 1 }}>
          O(n!)
        </span>
        <span style={{ fontFamily: fonts.mono, fontSize: 14, fontWeight: 400, color: `${MAUVE}88` }}>
          · Permutations
        </span>
      </div>
    </div>

    {/* ── Right — recursion tree SVG ────────────────────────────────── */}
    <svg style={{
      position: "absolute",
      left: SVG_LEFT, top: 0,
      width: SVG_W, height: SVG_H,
    }}>

      {/* Edges — draw before nodes so circles sit on top */}
      {L1.map((n, i) => (
        <Edge key={`r1-${i}`} x1={ROOT.x} y1={ROOT.y} x2={n.x} y2={n.y} r1={R_ROOT} />
      ))}
      {L1.map((p, i) => [0, 1].map((j) => (
        <Edge key={`12-${i}-${j}`} x1={p.x} y1={p.y} x2={L2[i * 2 + j].x} y2={L2[i * 2 + j].y} />
      )))}
      {L2.map((p, i) => (
        <Edge key={`23-${i}`} x1={p.x} y1={p.y} x2={L3[i].x} y2={L3[i].y} faint />
      ))}

      {/* Nodes */}
      <NodeCircle {...ROOT} root />
      {L1.map((n, i) => <NodeCircle key={`l1-${i}`} {...n} />)}
      {L2.map((n, i) => <NodeCircle key={`l2-${i}`} {...n} />)}
      {L3.map((n, i) => <NodeCircle key={`l3-${i}`} {...n} leaf />)}

      {/* Multiplier pills centred between levels */}
      <Multiplier y={154}  label="× n" />
      <Multiplier y={312}  label="× (n−1)" />
      <Multiplier y={474}  label="× (n−2)" />

      {/* Row labels — left-aligned, safely inside SVG */}
      <RowLabel y={ROOT.y}  text="1"        sub="call"   />
      <RowLabel y={L1[0].y} text="n"        sub="calls"  accent />
      <RowLabel y={L2[0].y} text="n·(n−1)"  sub="calls"  />
      <RowLabel y={L3[0].y} text="n!"       sub="leaves" leaf />

      {/* Footer note */}
      <text x={300} y={640}
        textAnchor="middle" fill={`${MAUVE}50`}
        fontSize={12} fontWeight={500} fontFamily={fonts.mono} letterSpacing={0.8}>
        example: n = 3 → 3! = 6 leaf nodes
      </text>
    </svg>

  </AbsoluteFill>
);

// Row label: right-aligned at SVG right edge (x=596), never overlaps nodes
// (rightmost node is L2[5].x=580, node right edge = 580+16 = 596 — so we leave 4px gap)
const RowLabel: React.FC<{
  y: number; text: string; sub: string; accent?: boolean; leaf?: boolean;
}> = ({ y, text, sub, accent = false, leaf = false }) => {
  const col = leaf ? PINK : accent ? MAUVE : `${MAUVE}80`;
  return (
    <g>
      <text x={596} y={y + 4}
        textAnchor="end" fill={col}
        fontSize={13} fontWeight={700} fontFamily={fonts.mono}>
        {text}
      </text>
      <text x={596} y={y + 18}
        textAnchor="end" fill={`${col}99`}
        fontSize={10} fontWeight={400} fontFamily={fonts.mono}>
        {sub}
      </text>
    </g>
  );
};
