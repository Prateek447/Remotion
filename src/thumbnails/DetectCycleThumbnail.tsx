import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../lib/theme";

const SLOW  = "#10B981";
const FAST  = "#8B5CF6";
const BLUE  = "#3B82F6";
const BLUE_DARK = "#1D4ED8";
const BLUE_BRIGHT = "#60A5FA";
const AMBER = "#F59E0B";

// Node geometry (full 1280-wide SVG)
// 5 nodes × 86px + 4 gaps × 20px = 430 + 80 = 510px
// Diagram area: x 630–1250 (620px wide), center nodes in it
// Start x: 630 + (620 - 510) / 2 = 685 — but let's start at 655 to give cycle arrow room
const NX = [655, 761, 867, 973, 1079]; // left-x of each node
const NW = 86;   // node width
const NVW = 60;  // value section width
const NPW = 26;  // pointer section width
const NH = 48;   // node height
const NY = 330;  // top-y of node row
const NC = NY + NH / 2; // vertical center

// Node centers
const CX = NX.map(x => x + NW / 2);

interface NodeProps {
  x: number; value: number;
  borderColor?: string;
  glow?: boolean;
  nextAddr: string;
}

const Node: React.FC<NodeProps> = ({ x, value, borderColor = BLUE, glow = false, nextAddr }) => {
  const vx = x;
  const px = x + NVW;
  const bx = x + NW / 2;

  return (
    <g style={glow ? { filter: `drop-shadow(0 0 14px ${BLUE_BRIGHT}88)` } : undefined}>
      {/* value section */}
      <rect x={vx} y={NY} width={NVW} height={NH} rx={5} fill={BLUE} />
      {/* pointer section */}
      <rect x={px} y={NY} width={NPW} height={NH} rx={5} fill={BLUE_DARK} />
      {/* cover inner corners between sections */}
      <rect x={px} y={NY} width={6} height={NH} rx={0} fill={BLUE} />
      <rect x={px + 6} y={NY} width={NPW - 6} height={NH} rx={0} fill={BLUE_DARK} />
      {/* right rounded end */}
      <rect x={x + NW - 5} y={NY} width={5} height={NH} rx={5} fill={BLUE_DARK} />
      {/* divider */}
      <line x1={px} y1={NY + 1} x2={px} y2={NY + NH - 1}
        stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
      {/* border */}
      <rect x={x} y={NY} width={NW} height={NH} rx={5}
        fill="none" stroke={borderColor} strokeWidth={glow ? 2.5 : 1.8} />
      {/* value text */}
      <text x={vx + NVW / 2} y={NC + 9} textAnchor="middle"
        fill="white" fontSize={24} fontWeight={800} fontFamily={fonts.mono}>
        {value}
      </text>
      {/* next address (rotated) */}
      <text
        x={px + NPW / 2} y={NC + 4}
        textAnchor="middle"
        fill="rgba(255,255,255,0.88)"
        fontSize={8} fontWeight={700}
        fontFamily={fonts.mono}
        transform={`rotate(-90, ${px + NPW / 2}, ${NC})`}
      >
        {nextAddr}
      </text>
    </g>
  );
};

export const DetectCycleThumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: "#000", fontFamily: fonts.sans, overflow: "hidden" }}>

    {/* Ambient glows */}
    <div style={{
      position: "absolute", inset: 0,
      background: `
        radial-gradient(ellipse 580px 580px at -2% 52%, ${SLOW}12 0%, transparent 65%),
        radial-gradient(ellipse 580px 580px at 102% 52%, ${FAST}0E 0%, transparent 65%)
      `,
    }} />

    {/* ── Left text column ─────────────────────────────────────────────── */}
    <div style={{
      position: "absolute",
      left: 64, top: 0, bottom: 0, width: 530,
      display: "flex", flexDirection: "column",
      justifyContent: "center",
    }}>
      {/* Category chip */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: `${FAST}14`,
        border: `1px solid ${FAST}44`,
        borderRadius: 100,
        padding: "5px 16px",
        width: "fit-content",
        marginBottom: 24,
      }}>
        <span style={{
          fontFamily: fonts.mono, fontSize: 12, fontWeight: 700,
          letterSpacing: 3, color: "#a78bfa", textTransform: "uppercase" as const,
        }}>
          Linked List
        </span>
      </div>

      {/* Hero title */}
      <div style={{
        fontSize: 148,
        fontWeight: 900,
        lineHeight: 0.86,
        color: "#ffffff",
        letterSpacing: -6,
      }}>
        DETECT
      </div>
      <div style={{
        fontSize: 148,
        fontWeight: 900,
        lineHeight: 0.86,
        marginTop: 6,
        letterSpacing: -6,
        background: `linear-gradient(120deg, ${SLOW} 0%, #34d399 55%, #059669 100%)`,
        WebkitBackgroundClip: "text" as const,
        WebkitTextFillColor: "transparent" as const,
        filter: `drop-shadow(0 0 28px ${SLOW}55)`,
      }}>
        CYCLE
      </div>

      {/* Rule */}
      <div style={{
        marginTop: 28,
        height: 1.5,
        width: 420,
        background: `linear-gradient(90deg, ${SLOW}70 0%, transparent 100%)`,
      }} />

      {/* Subtitle */}
      <div style={{
        marginTop: 16,
        fontSize: 22,
        fontWeight: 400,
        color: "rgba(255,255,255,0.45)",
      }}>
        Floyd's Tortoise &amp; Hare Algorithm
      </div>

      {/* Pointer + complexity badges */}
      <div style={{
        marginTop: 26,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap" as const,
      }}>
        {/* slow */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: `${SLOW}12`, border: `1px solid ${SLOW}40`,
          borderRadius: 8, padding: "8px 16px",
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: SLOW, boxShadow: `0 0 8px ${SLOW}`,
          }} />
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1.5, color: SLOW, textTransform: "uppercase" as const, fontFamily: fonts.mono }}>slow</span>
        </div>
        {/* fast */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: `${FAST}12`, border: `1px solid ${FAST}40`,
          borderRadius: 8, padding: "8px 16px",
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: FAST, boxShadow: `0 0 8px ${FAST}`,
          }} />
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1.5, color: FAST, textTransform: "uppercase" as const, fontFamily: fonts.mono }}>fast</span>
        </div>
        {/* O(n) */}
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 7, padding: "8px 14px",
          fontFamily: fonts.mono, fontSize: 13, fontWeight: 700,
        }}>
          <span style={{ color: "rgba(255,255,255,0.35)" }}>TIME </span>
          <span style={{ color: "#34d399" }}>O(n)</span>
        </div>
        {/* O(1) */}
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 7, padding: "8px 14px",
          fontFamily: fonts.mono, fontSize: 13, fontWeight: 700,
        }}>
          <span style={{ color: "rgba(255,255,255,0.35)" }}>SPACE </span>
          <span style={{ color: "#a78bfa" }}>O(1)</span>
        </div>
      </div>
    </div>

    {/* ── Vertical divider ─────────────────────────────────────────────── */}
    <div style={{
      position: "absolute",
      left: 618, top: 80,
      width: 1, height: 560,
      background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 75%, transparent)",
    }} />

    {/* ── Right diagram (full-canvas SVG) ──────────────────────────────── */}
    <svg style={{ position: "absolute", inset: 0, width: 1280, height: 720, overflow: "visible" }}>

      {/* ── Connection arrows ── */}
      {[0,1,2,3].map(i => (
        <line key={i}
          x1={NX[i] + NW} y1={NC}
          x2={NX[i+1] - 3} y2={NC}
          stroke="rgba(255,255,255,0.65)" strokeWidth={2.5}
          markerEnd="url(#arr-white)"
        />
      ))}

      {/* ── Cycle arrow: n5 bottom → down → across → n3 bottom (dashed amber) ── */}
      <path
        d={`M ${CX[4]} ${NY+NH} L ${CX[4]} 455 L ${CX[2]} 455 L ${CX[2]} ${NY+NH}`}
        stroke={AMBER} strokeWidth={2.5} fill="none"
        strokeDasharray="9 5"
        markerEnd="url(#arr-amber)"
        style={{ filter: `drop-shadow(0 0 5px ${AMBER}88)` }}
      />
      <text x={(CX[2]+CX[4])/2} y={484} textAnchor="middle"
        fill={AMBER} fontSize={15} fontWeight={700}
        fontFamily={fonts.mono} letterSpacing={2}
        style={{ filter: `drop-shadow(0 0 5px ${AMBER}88)` }}>
        cycle
      </text>

      {/* ── Arrowhead markers ── */}
      <defs>
        <marker id="arr-white" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="rgba(255,255,255,0.65)" />
        </marker>
        <marker id="arr-amber" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill={AMBER} />
        </marker>
        <marker id="arr-green" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill={SLOW} />
        </marker>
      </defs>

      {/* ── Nodes ── */}
      <Node x={NX[0]} value={1} nextAddr="3947" />
      <Node x={NX[1]} value={2} nextAddr="2716" />
      <Node x={NX[2]} value={3} nextAddr="4321" borderColor={AMBER} />
      <Node x={NX[3]} value={4} nextAddr="7687" borderColor={BLUE_BRIGHT} glow />
      <Node x={NX[4]} value={5} nextAddr="2716" borderColor={AMBER} />

      {/* ── Address labels below nodes ── */}
      {[["1028",0],["3947",1],["2716",2],["4321",3],["7687",4]].map(([addr, i]) => (
        <text key={i as number} x={CX[i as number]} y={NY + NH + 22}
          textAnchor="middle" fill="rgba(255,255,255,0.38)"
          fontSize={12} fontFamily={fonts.mono}>
          {addr}
        </text>
      ))}

      {/* ── fast badge (purple) above n4 ── */}
      <g style={{ filter: `drop-shadow(0 0 10px ${FAST}88)` }}>
        <rect x={CX[3]-34} y={228} width={68} height={30} rx={6} fill="#5B21B6" />
        <rect x={CX[3]-34} y={228} width={68} height={30} rx={6}
          fill="none" stroke={FAST} strokeWidth={1.5} />
        <text x={CX[3]} y={248} textAnchor="middle"
          fill="white" fontSize={14} fontWeight={800} fontFamily={fonts.mono}>
          fast
        </text>
      </g>

      {/* ── slow badge (green) below fast ── */}
      <g style={{ filter: `drop-shadow(0 0 10px ${SLOW}88)` }}>
        <rect x={CX[3]-34} y={266} width={68} height={30} rx={6} fill="#065F46" />
        <rect x={CX[3]-34} y={266} width={68} height={30} rx={6}
          fill="none" stroke={SLOW} strokeWidth={1.5} />
        <text x={CX[3]} y={286} textAnchor="middle"
          fill="white" fontSize={14} fontWeight={800} fontFamily={fonts.mono}>
          slow
        </text>
      </g>

      {/* Arrow from slow badge to n4 */}
      <line
        x1={CX[3]} y1={296}
        x2={CX[3]} y2={NY - 3}
        stroke={SLOW} strokeWidth={2.5}
        markerEnd="url(#arr-green)"
        style={{ filter: `drop-shadow(0 0 6px ${SLOW}88)` }}
      />

      {/* MEET! label */}
      <text x={CX[3]} y={NY - 10} textAnchor="middle"
        fill={BLUE_BRIGHT} fontSize={12} fontWeight={700}
        fontFamily={fonts.mono} letterSpacing={1}>
        MEET!
      </text>

    </svg>

  </AbsoluteFill>
);
