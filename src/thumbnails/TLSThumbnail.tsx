import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../lib/theme";

const BLUE  = "#6E9BFF";
const TEAL  = "#5CE8D4";
const GREEN = "#6EE7A0";
const GOLD  = "#FFD666";
const PEACH = "#FF9E6B";

// Diagram x-coords (full 1280-wide SVG)
const CX = 800;   // client lifeline
const SX = 1170;  // server lifeline
const AX0 = CX + 72; // arrow start (right of client box)
const AX1 = SX - 72; // arrow end (left of server box)

interface ArrowRowProps {
  y: number;
  color: string;
  label: string;
  rtl?: boolean;  // right-to-left
  both?: boolean; // bidirectional (drawn as two half-arrows)
  tag?: string;
}

const ArrowRow: React.FC<ArrowRowProps> = ({ y, color, label, rtl = false, both = false, tag }) => {
  const x0 = rtl ? AX1 : AX0;
  const x1 = rtl ? AX0 : AX1;
  const len = Math.abs(x1 - x0);
  const dir = rtl ? -1 : 1;
  const hLen = 9; const hSpread = 5;
  const mid = (AX0 + AX1) / 2;

  return (
    <g>
      {/* Shaft */}
      <line x1={x0} y1={y} x2={x1} y2={y}
        stroke={color} strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 5px ${color}88)` }} />
      {/* Arrowhead */}
      <polyline
        points={`${x1 - dir * hLen},${y - hSpread} ${x1},${y} ${x1 - dir * hLen},${y + hSpread}`}
        fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 5px ${color}88)` }} />
      {/* If bidirectional, add reverse arrowhead */}
      {both && (
        <polyline
          points={`${x0 + dir * hLen},${y - hSpread} ${x0},${y} ${x0 + dir * hLen},${y + hSpread}`}
          fill="none" stroke={color} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 5px ${color}88)` }} />
      )}
      {/* Label above arrow */}
      <text x={mid} y={y - 10}
        textAnchor="middle" fill="#ffffff" fontSize={14} fontWeight={700}
        fontFamily={fonts.sans}>
        {label}
      </text>
      {/* Tag below arrow */}
      {tag && (
        <text x={mid} y={y + 18}
          textAnchor="middle" fill={color} fontSize={11} fontWeight={400}
          fontFamily={fonts.mono} opacity={0.8}>
          {tag}
        </text>
      )}
    </g>
  );
};

export const TLSThumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: "#000", fontFamily: fonts.sans, overflow: "hidden" }}>

    {/* ── Ambient background glows ──────────────────────────────────────── */}
    <div style={{
      position: "absolute", inset: 0,
      background: `
        radial-gradient(ellipse 640px 680px at -4% 52%, ${BLUE}1A 0%, transparent 65%),
        radial-gradient(ellipse 640px 680px at 104% 52%, ${TEAL}16 0%, transparent 65%),
        radial-gradient(ellipse 420px 280px at 50% 100%, ${GREEN}0D 0%, transparent 55%)
      `,
    }} />

    {/* Subtle grid lines */}
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}>
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`v${i}`} x1={i * 107} y1={0} x2={i * 107} y2={720}
          stroke="#6E9BFF" strokeWidth={0.5} />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 120} x2={1280} y2={i * 120}
          stroke="#6E9BFF" strokeWidth={0.5} />
      ))}
    </svg>

    {/* ── Left text column ──────────────────────────────────────────────── */}
    <div style={{
      position: "absolute",
      left: 64, top: 0, bottom: 0, width: 560,
      display: "flex", flexDirection: "column",
      justifyContent: "center",
      paddingBottom: 20,
    }}>
      {/* Category chip */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: `${TEAL}14`,
        border: `1px solid ${TEAL}44`,
        borderRadius: 8,
        padding: "6px 18px",
        width: "fit-content",
        marginBottom: 28,
      }}>
        <span style={{
          fontFamily: fonts.mono, fontSize: 13, fontWeight: 600,
          letterSpacing: 3, color: TEAL, textTransform: "uppercase" as const,
        }}>
          Networking · Security
        </span>
      </div>

      {/* "TLS" — huge hero word */}
      <div style={{
        fontSize: 212,
        fontWeight: 900,
        lineHeight: 0.86,
        color: "#FFFFFF",
        letterSpacing: -10,
      }}>
        TLS
      </div>

      {/* "Handshake" — gradient subtitle */}
      <div style={{
        fontSize: 68,
        fontWeight: 800,
        lineHeight: 1,
        marginTop: 12,
        background: `linear-gradient(100deg, ${BLUE} 0%, ${TEAL} 100%)`,
        WebkitBackgroundClip: "text" as const,
        WebkitTextFillColor: "transparent" as const,
        letterSpacing: -2,
      }}>
        Handshake
      </div>

      {/* Horizontal rule */}
      <div style={{
        marginTop: 30,
        height: 1.5,
        width: 440,
        background: `linear-gradient(90deg, ${BLUE}70 0%, transparent 100%)`,
      }} />

      {/* Subtitle */}
      <div style={{
        marginTop: 18,
        fontSize: 24,
        fontWeight: 400,
        color: "rgba(255,255,255,0.52)",
        lineHeight: 1.5,
      }}>
        How HTTPS Actually Works
      </div>

      {/* HTTPS secure badge */}
      <div style={{
        marginTop: 26,
        display: "inline-flex", alignItems: "center", gap: 10,
        background: `${GREEN}12`,
        border: `1.5px solid ${GREEN}44`,
        borderRadius: 50,
        padding: "11px 26px",
        width: "fit-content",
        boxShadow: `0 0 28px ${GREEN}22`,
      }}>
        <svg width="19" height="22" viewBox="0 0 19 22" fill="none">
          <path d="M4 10V7a5.5 5.5 0 0 1 11 0v3" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round"/>
          <rect x="1" y="10" width="17" height="11" rx="3"
            fill={`${GREEN}22`} stroke={GREEN} strokeWidth="1.8"/>
          <circle cx="9.5" cy="15.5" r="2" fill={GREEN}/>
        </svg>
        <span style={{
          fontFamily: fonts.mono, fontSize: 21, fontWeight: 700,
          color: GREEN, letterSpacing: 2,
        }}>
          HTTPS
        </span>
      </div>
    </div>

    {/* ── Right — sequence diagram ──────────────────────────────────────── */}
    <svg style={{ position: "absolute", inset: 0, width: 1280, height: 720, overflow: "visible" }}>

      {/* Actor boxes */}
      {/* CLIENT */}
      <rect x={CX - 70} y={34} width={140} height={58} rx={12}
        fill={`${BLUE}16`} stroke={`${BLUE}58`} strokeWidth={1.5}
        style={{ filter: `drop-shadow(0 0 18px ${BLUE}44)` }} />
      <text x={CX} y={68} textAnchor="middle" fill={BLUE}
        fontSize={14} fontWeight={700} fontFamily={fonts.sans} letterSpacing={2.5}>
        CLIENT
      </text>

      {/* SERVER */}
      <rect x={SX - 70} y={34} width={140} height={58} rx={12}
        fill={`${TEAL}16`} stroke={`${TEAL}58`} strokeWidth={1.5}
        style={{ filter: `drop-shadow(0 0 18px ${TEAL}44)` }} />
      <text x={SX} y={68} textAnchor="middle" fill={TEAL}
        fontSize={14} fontWeight={700} fontFamily={fonts.sans} letterSpacing={2.5}>
        SERVER
      </text>

      {/* Lifelines */}
      <line x1={CX} y1={92} x2={CX} y2={650}
        stroke={BLUE} strokeWidth={1.2} strokeDasharray="7 5" opacity={0.28} />
      <line x1={SX} y1={92} x2={SX} y2={650}
        stroke={TEAL} strokeWidth={1.2} strokeDasharray="7 5" opacity={0.28} />

      {/* ── Messages ── */}
      <ArrowRow y={165} color={BLUE}  label="ClientHello"
        tag="TLS versions · cipher suites · client random" />

      <ArrowRow y={265} color={GOLD}  label="ServerHello + Certificate" rtl
        tag="chosen cipher · server random · public key" />

      <ArrowRow y={365} color={PEACH} label="ClientKeyExchange"
        tag="pre-master secret  (RSA encrypted)" />

      <ArrowRow y={455} color={GREEN} label="ChangeCipherSpec + Finished" both
        tag="🔒  session keys derived  ·  handshake verified" />

      {/* "Encrypted Data" final row */}
      <g>
        <rect x={AX0 - 4} y={530} width={AX1 - AX0 + 8} height={34} rx={17}
          fill={`${TEAL}0A`} stroke={`${TEAL}30`} strokeWidth={1} />
        {/* left arrowhead */}
        <polyline points={`${AX0 + 10},${547 - 5} ${AX0},${547} ${AX0 + 10},${547 + 5}`}
          fill="none" stroke={TEAL} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        {/* right arrowhead */}
        <polyline points={`${AX1 - 10},${547 - 5} ${AX1},${547} ${AX1 - 10},${547 + 5}`}
          fill="none" stroke={TEAL} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <text x={(AX0 + AX1) / 2} y={552} textAnchor="middle"
          fill={TEAL} fontSize={13} fontWeight={600} fontFamily={fonts.mono} letterSpacing={1}>
          AES-256-GCM  ·  Encrypted Application Data
        </text>
      </g>

      {/* "Session Established" glow badge */}
      <g>
        {/* glow aura */}
        <ellipse cx={(CX + SX) / 2} cy={636} rx={164} ry={30}
          fill={GREEN} opacity={0.07}
          style={{ filter: "blur(12px)" }} />
        <rect x={(CX + SX) / 2 - 152} y={610} width={304} height={52} rx={26}
          fill={`${GREEN}14`} stroke={`${GREEN}55`} strokeWidth={1.5}
          style={{ filter: `drop-shadow(0 0 24px ${GREEN}55)` }} />
        {/* lock */}
        <g transform={`translate(${(CX + SX) / 2 - 106}, 636)`}>
          <path d="M-5 0V-3A5 5 0 0 1 5 -3V0" stroke={GREEN} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
          <rect x="-7" y="0" width="14" height="10" rx="2"
            fill={`${GREEN}22`} stroke={GREEN} strokeWidth="1.6"/>
          <circle cy="5" r="1.8" fill={GREEN}/>
        </g>
        <text x={(CX + SX) / 2 + 8} y={641} textAnchor="middle"
          fill={GREEN} fontSize={16} fontWeight={700} fontFamily={fonts.sans} letterSpacing={1.5}>
          SESSION ESTABLISHED
        </text>
      </g>

      {/* Phase brackets (left side) */}
      {/* NEGOTIATION */}
      <BracketLabel x={707} y0={148} y1={282} color={BLUE} label="NEGOTIATION" />
      {/* AUTHENTICATION */}
      <BracketLabel x={707} y0={298} y1={382} color={GOLD} label="AUTH" />
      {/* KEY EXCHANGE */}
      <BracketLabel x={707} y0={398} y1={472} color={GREEN} label="KEY EXCHANGE" />
    </svg>

  </AbsoluteFill>
);

const BracketLabel: React.FC<{
  x: number; y0: number; y1: number; color: string; label: string;
}> = ({ x, y0, y1, color, label }) => {
  const mid = (y0 + y1) / 2;
  return (
    <g opacity={0.38}>
      <line x1={x + 6} y1={y0} x2={x + 1} y2={y0} stroke={color} strokeWidth={1.2} />
      <line x1={x + 1} y1={y0} x2={x + 1} y2={y1} stroke={color} strokeWidth={1.2} />
      <line x1={x + 1} y1={y1} x2={x + 6} y2={y1} stroke={color} strokeWidth={1.2} />
      <text x={x - 6} y={mid + 4} textAnchor="end"
        fill={color} fontSize={9} fontWeight={600}
        fontFamily={fonts.mono} letterSpacing={1.5}>
        {label}
      </text>
    </g>
  );
};
