import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../lib/theme";

// ── Palette ─────────────────────────────────────────────────────────────────
const FAST        = "#F97316";
const SLOW        = "#0D9488";
const SLOW_BRIGHT = "#2DD4BF";
const NODE_BLUE_L = "#3B82F6";
const REMOVE      = "#EF4444";
const REMOVE_DARK = "#7F1D1D";
const BG          = "#000000";

// ── Node geometry ────────────────────────────────────────────────────────────
// Moved lower (NY=390) so diagram fills the canvas vertically, not top-heavy
const NW = 84;
const NH = 60;
const NY = 390;
const NC = NY + NH / 2; // 420

// 5 nodes centred in right half (x 640–1280 = 640 px)
// 5×84 + 4×16 = 484 px  →  margin = (640−484)/2 = 78  →  start = 640+78 = 718
const NX = [718, 818, 918, 1018, 1118];
const CX = NX.map(x => x + NW / 2); // [760, 860, 960, 1060, 1160]

// ── Fixed-pixel arrowhead ────────────────────────────────────────────────────
const Marker: React.FC<{ id: string; fill: string }> = ({ id, fill }) => (
  <marker id={id} markerWidth="10" markerHeight="8"
    refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse">
    <path d="M0,0.5 L0,7.5 L9,4 z" fill={fill} />
  </marker>
);

// ── Node ─────────────────────────────────────────────────────────────────────
interface NodeProps {
  x: number; value: number;
  fill?: string; stroke?: string; strokeWidth?: number;
  glow?: string; xMark?: boolean;
}

const Node: React.FC<NodeProps> = ({
  x, value,
  fill = NODE_BLUE_L,
  stroke = "rgba(255,255,255,0.15)",
  strokeWidth = 1.5,
  glow, xMark = false,
}) => {
  const cx = x + NW / 2;
  return (
    <g style={glow ? { filter: `drop-shadow(0 0 22px ${glow}99)` } : undefined}>
      <rect x={x} y={NY} width={NW} height={NH} rx={10}
        fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <text x={cx} y={NC + 10} textAnchor="middle"
        fill="white" fontSize={28} fontWeight={900}
        fontFamily={fonts.mono} opacity={xMark ? 0.28 : 1}>
        {value}
      </text>
      {xMark && (
        <>
          <line x1={x + 16} y1={NY + 13} x2={x + NW - 16} y2={NY + NH - 13}
            stroke="white" strokeWidth={4.5} strokeLinecap="round" />
          <line x1={x + NW - 16} y1={NY + 13} x2={x + 16} y2={NY + NH - 13}
            stroke="white" strokeWidth={4.5} strokeLinecap="round" />
        </>
      )}
    </g>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
export const RemoveNthThumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: BG, fontFamily: fonts.sans, overflow: "hidden" }}>

    {/* ── Ambient glows ─────────────────────────────────────────────── */}
    <div style={{
      position: "absolute", inset: 0,
      background: `
        radial-gradient(ellipse 640px 640px at -8% 55%, ${SLOW}30 0%, transparent 62%),
        radial-gradient(ellipse 520px 520px at 110% 48%, ${FAST}22 0%, transparent 58%),
        radial-gradient(ellipse 400px 400px at 86% 57%, ${REMOVE}1C 0%, transparent 55%)
      `,
    }} />

    {/* ── Left text column ─────────────────────────────────────────── */}
    <div style={{
      position: "absolute",
      left: 60, top: 0, bottom: 0, width: 540,
      display: "flex", flexDirection: "column",
      justifyContent: "center",
    }}>

      {/* Category chip */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        marginBottom: 20,
      }}>
        <div style={{
          width: 3, height: 18,
          background: SLOW_BRIGHT,
          borderRadius: 2,
          boxShadow: `0 0 8px ${SLOW_BRIGHT}`,
        }} />
        <span style={{
          fontSize: 13, fontWeight: 500, letterSpacing: 4,
          color: "rgba(255,255,255,0.55)",
          textTransform: "uppercase" as const,
          fontFamily: fonts.sans,
        }}>
          Linked List
        </span>
      </div>

      {/* REMOVE — white */}
      <div style={{
        fontSize: 136, fontWeight: 900, lineHeight: 0.88,
        color: "#ffffff", letterSpacing: -6,
      }}>
        REMOVE
      </div>

      {/* NTH — solid teal with glow.
          NOTE: WebkitBackgroundClip:"text" produces a solid rectangle in
          Remotion's Chromium renderer. Using a plain colour + drop-shadow. */}
      <div style={{
        fontSize: 136, fontWeight: 900, lineHeight: 0.88,
        marginTop: 4, letterSpacing: -6,
        color: SLOW_BRIGHT,
        filter: `drop-shadow(0 0 32px ${SLOW}cc)`,
      }}>
        NTH
      </div>

      {/* FROM END — raised opacity so it's actually readable */}
      <div style={{
        fontSize: 58, fontWeight: 800, lineHeight: 1,
        marginTop: 10, letterSpacing: -2,
        color: "rgba(255,255,255,0.45)",
      }}>
        FROM END
      </div>

      {/* Rule */}
      <div style={{
        marginTop: 22, height: 2, width: 400,
        background: `linear-gradient(90deg, ${SLOW}88 0%, transparent 100%)`,
      }} />

      {/* Subtitle */}
      <div style={{
        marginTop: 12, fontSize: 18, fontWeight: 400,
        color: "rgba(255,255,255,0.35)", letterSpacing: 0.2,
      }}>
        Two-Pointer · One Pass · Dummy Node
      </div>

      {/* Badges */}
      <div style={{
        marginTop: 20, display: "flex", gap: 10,
        alignItems: "center", flexWrap: "wrap" as const,
      }}>
        {([
          { label: "slow", color: SLOW },
          { label: "fast", color: FAST },
        ] as const).map(({ label, color }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 7,
            background: `${color}14`, border: `1px solid ${color}44`,
            borderRadius: 8, padding: "6px 13px",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: color, boxShadow: `0 0 8px ${color}`,
            }} />
            <span style={{
              fontSize: 12, fontWeight: 800, letterSpacing: 1.5,
              color, textTransform: "uppercase" as const,
              fontFamily: fonts.mono,
            }}>{label}</span>
          </div>
        ))}
        {([
          { label: "TIME",  value: "O(n)",  valueColor: SLOW_BRIGHT },
          { label: "SPACE", value: "O(1)",  valueColor: FAST },
        ] as const).map(({ label, value, valueColor }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 7, padding: "6px 12px",
            fontFamily: fonts.mono, fontSize: 11, fontWeight: 700,
          }}>
            <span style={{ color: "rgba(255,255,255,0.28)" }}>{label} </span>
            <span style={{ color: valueColor }}>{value}</span>
          </div>
        ))}
      </div>
    </div>

    {/* ── Vertical divider ─────────────────────────────────────────── */}
    <div style={{
      position: "absolute", left: 622, top: 80,
      width: 1, height: 560,
      background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.10) 70%, transparent)",
    }} />

    {/* ── Right SVG diagram ─────────────────────────────────────────── */}
    <svg style={{ position: "absolute", inset: 0, width: 1280, height: 720, overflow: "visible" }}>
      <defs>
        <Marker id="rn-white"     fill="rgba(255,255,255,0.70)" />
        <Marker id="rn-white-dim" fill="rgba(255,255,255,0.22)" />
        <Marker id="rn-slow"      fill={SLOW} />
        <Marker id="rn-fast"      fill={FAST} />
      </defs>

      {/* Normal arrows: 1→2, 2→3 */}
      {[0, 1].map(i => (
        <line key={i}
          x1={NX[i] + NW + 3} y1={NC}
          x2={NX[i + 1] - 4}  y2={NC}
          stroke="rgba(255,255,255,0.70)" strokeWidth={2.5}
          markerEnd="url(#rn-white)"
        />
      ))}

      {/* Faded dashed arrows: 3→4, 4→5 (bypassed path) */}
      {[2, 3].map(i => (
        <line key={i}
          x1={NX[i] + NW + 3} y1={NC}
          x2={NX[i + 1] - 4}  y2={NC}
          stroke="rgba(255,255,255,0.20)" strokeWidth={2}
          strokeDasharray="6 5"
          markerEnd="url(#rn-white-dim)"
        />
      ))}

      {/* Bypass arc — node 3 over node 4 to node 5
          Control point y=315 → actual midpoint ~y=360, clears nodes (NY=390) by 30px */}
      <path
        d={`M ${NX[2] + NW + 3} ${NC - 16}
            Q ${CX[3]} 315
              ${NX[4] - 5} ${NC - 16}`}
        stroke={FAST} strokeWidth={4.5} fill="none"
        markerEnd="url(#rn-fast)"
        style={{ filter: `drop-shadow(0 0 14px ${FAST}cc)` }}
      />

      {/* SKIP label — sits above arc peak */}
      <text
        x={CX[3]} y={348}
        textAnchor="middle"
        fill={FAST} fontSize={22} fontWeight={800}
        fontFamily={fonts.mono} letterSpacing={3}
        style={{ filter: `drop-shadow(0 0 10px ${FAST}99)` }}
      >
        SKIP
      </text>

      {/* ── Nodes ──────────────────────────────────────────────────── */}
      <Node x={NX[0]} value={1} />
      <Node x={NX[1]} value={2} />
      <Node x={NX[2]} value={3} fill="#0C3535" stroke={SLOW} strokeWidth={2.8} glow={SLOW} />
      <Node x={NX[3]} value={4} fill={REMOVE_DARK} stroke={REMOVE} strokeWidth={3.2} glow={REMOVE} xMark />
      <Node x={NX[4]} value={5} />

      {/* "slow" badge above node 3 */}
      <g style={{ filter: `drop-shadow(0 0 14px ${SLOW}aa)` }}>
        <rect x={CX[2] - 42} y={252} width={84} height={38} rx={9}
          fill="#082828" stroke={SLOW} strokeWidth={2} />
        <text x={CX[2]} y={277} textAnchor="middle"
          fill={SLOW_BRIGHT} fontSize={18} fontWeight={800}
          fontFamily={fonts.mono}>
          slow
        </text>
      </g>
      <line
        x1={CX[2]} y1={292} x2={CX[2]} y2={NY - 6}
        stroke={SLOW} strokeWidth={2.5}
        markerEnd="url(#rn-slow)"
        style={{ filter: `drop-shadow(0 0 8px ${SLOW}99)` }}
      />

      {/* "head" micro-label above node 1 — bigger + brighter than before */}
      <text x={CX[0]} y={NY - 20} textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontSize={16} fontWeight={700} fontFamily={fonts.mono}
        letterSpacing={1}>
        head
      </text>
      <line
        x1={CX[0]} y1={NY - 15} x2={CX[0]} y2={NY - 3}
        stroke="rgba(255,255,255,0.40)" strokeWidth={1.5}
        markerEnd="url(#rn-white)"
      />

      {/* → null after node 5 */}
      <text x={NX[4] + NW + 10} y={NC + 7} textAnchor="start"
        fill="rgba(255,255,255,0.32)"
        fontSize={15} fontWeight={600} fontFamily={fonts.mono}>
        → null
      </text>

    </svg>

  </AbsoluteFill>
);
