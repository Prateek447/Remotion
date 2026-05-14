import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { fonts, springPresets } from "../lib/theme";
import { NarrationLayer } from "../components/NarrationLayer";
import type { SceneStep } from "../lib/types";

// ── Layout ────────────────────────────────────────────────────────────────────
const CX = 256;
const SX = 1664;
const BOX_W = 234;
const BOX_H = 92;
const BOX_TOP = 42;
const LL_Y0 = BOX_TOP + BOX_H;
const LL_Y1 = 1030;
const MSG_Y0 = 208;
const MSG_DY = 110;
const C_EDGE = CX + BOX_W / 2 + 6;
const S_EDGE = SX - BOX_W / 2 - 6;

// ── Timing ────────────────────────────────────────────────────────────────────
const SPF  = 115;
const DRAW = 38;

// ── Palette ───────────────────────────────────────────────────────────────────
const BLUE  = "#6E9BFF";
const TEAL  = "#5CE8D4";
const GOLD  = "#FFD666";
const PEACH = "#FF9E6B";
const GREEN = "#6EE7A0";
const MAUVE = "#B07EFF";

// ── Types ─────────────────────────────────────────────────────────────────────
type Dir = "c2s" | "s2c" | "both" | "none";

interface Step {
  label:    string;
  tag?:     string;
  locked?:  boolean;
  dir:      Dir;
  color:    string;

  keyStep?: boolean;
}

const STEPS: Step[] = [
  { label: "", dir: "none", color: "" },
  { label: "ClientHello",    tag: "TLS versions  ·  Cipher suites  ·  Client random", dir: "c2s", color: BLUE },
  { label: "ServerHello",    tag: "Chosen cipher  ·  Server random  ·  Session ID",   dir: "s2c", color: TEAL },
  { label: "Certificate",    tag: "Public key  ·  CA signature  ·  Domain",            dir: "s2c", color: GOLD },
  { label: "ClientKeyExchange", tag: "Pre-master secret  (RSA-encrypted)",             dir: "c2s", color: PEACH },
  { label: "Session Keys Derived", dir: "none", color: GREEN, keyStep: true },
  { label: "ChangeCipherSpec + Finished", tag: "Encrypted with session key", locked: true, dir: "c2s", color: GREEN },
  { label: "ChangeCipherSpec + Finished", tag: "Encrypted with session key", locked: true, dir: "s2c", color: GREEN },
  { label: "Encrypted Application Data",  tag: "AES-256-GCM",                locked: true, dir: "both", color: MAUVE },
];

// startFrame for each step = cumulative audio frames + 10-frame buffer between steps.
// Recalculate from public/narration/tls-handshake/durations.json whenever audio changes.
const STEP_START_FRAMES = [0, 446, 892, 1312, 1822, 2306, 2795, 3212, 3611];

export const TLS_HANDSHAKE_SCENE_FRAMES = 3611 + 486 + 60; // last step audio + tail

// Steps array used only by NarrationLayer (it only reads startFrame).
const tlsNarrationSteps: SceneStep[] = STEPS.map((_, i) => ({
  startFrame: STEP_START_FRAMES[i],
  highlightLines: { startLine: 0, endLine: 0 },
  snapshot: { nodes: [], pointers: [], arrows: [] },
}));

function rowY(stepIdx: number) {
  return MSG_Y0 + (stepIdx - 1) * MSG_DY;
}

// ── SVG icons (pure paths, no emoji) ──────────────────────────────────────────

// Laptop icon for CLIENT actor box
const LaptopIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="36" height="32" viewBox="0 0 36 32" fill="none">
    <rect x="3" y="1" width="30" height="21" rx="2.5" stroke={color} strokeWidth="1.8" />
    <rect x="7" y="5" width="22" height="13" rx="1" fill={`${color}20`} />
    {/* screen glow line */}
    <line x1="7" y1="5" x2="29" y2="5" stroke={`${color}55`} strokeWidth="1" strokeLinecap="round" />
    {/* base */}
    <path d="M1 23 L35 23" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    {/* trackpad */}
    <rect x="14" y="23" width="8" height="4" rx="2" fill={`${color}44`} />
  </svg>
);

// Server rack icon for SERVER actor box
const ServerIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="36" height="32" viewBox="0 0 36 32" fill="none">
    <rect x="2" y="2"  width="32" height="12" rx="2.5" stroke={color} strokeWidth="1.8" />
    <rect x="2" y="18" width="32" height="12" rx="2.5" stroke={color} strokeWidth="1.8" />
    {/* status LEDs */}
    <circle cx="29" cy="8"  r="2.4" fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    <circle cx="29" cy="24" r="2.4" fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    {/* drive bays */}
    <line x1="6" y1="8"  x2="22" y2="8"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="6" y1="24" x2="22" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    {/* rack screws */}
    <circle cx="5" cy="5"  r="1.2" stroke={`${color}66`} strokeWidth="1" />
    <circle cx="5" cy="11" r="1.2" stroke={`${color}66`} strokeWidth="1" />
    <circle cx="5" cy="21" r="1.2" stroke={`${color}66`} strokeWidth="1" />
    <circle cx="5" cy="27" r="1.2" stroke={`${color}66`} strokeWidth="1" />
  </svg>
);

// SVG lock shape — centered at (0,0), used inside <svg> context
const LockSVG: React.FC<{ color: string; cx: number; cy: number; s?: number }> = ({
  color, cx, cy, s = 1,
}) => (
  <g transform={`translate(${cx},${cy}) scale(${s})`}>
    {/* shackle */}
    <path d="M -5 -1 A 5 5 0 0 1 5 -1" stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" />
    {/* body */}
    <rect x="-7" y="-1" width="14" height="11" rx="2" stroke={color} strokeWidth="1.7" fill={`${color}22`} />
    {/* keyhole */}
    <circle cx="0" cy="5" r="2" fill={color} />
  </g>
);

// SVG key shape — centered at (0,0), used inside <svg> context
const KeySVG: React.FC<{ color: string; cx: number; cy: number; s?: number }> = ({
  color, cx, cy, s = 1,
}) => (
  <g transform={`translate(${cx},${cy}) scale(${s})`}>
    {/* ring */}
    <circle cx="-9" cy="0" r="5.5" stroke={color} strokeWidth="1.7" fill={`${color}22`} />
    {/* shaft */}
    <line x1="-3.5" y1="0" x2="12" y2="0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    {/* teeth */}
    <line x1="9"  y1="0" x2="9"  y2="-3.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    <line x1="12" y1="0" x2="12" y2="-3.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </g>
);

// ── Actor box ─────────────────────────────────────────────────────────────────
const ActorBox: React.FC<{
  label: string;
  icon: "laptop" | "server";
  cx: number;
  accentColor: string;
  borderColor: string;
  frame: number;
}> = ({ label, icon, cx, accentColor, borderColor, frame }) => {
  const { fps } = useVideoConfig();
  const p       = spring({ frame, fps, config: springPresets.enter });
  const scale   = interpolate(p, [0, 1], [0.82, 1]);
  const opacity = interpolate(p, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{
      position: "absolute",
      top: BOX_TOP,
      left: cx - BOX_W / 2,
      width: BOX_W,
      height: BOX_H,
      borderRadius: 16,
      background: `linear-gradient(140deg, ${accentColor}18 0%, ${accentColor}08 100%)`,
      border: `1.5px solid ${borderColor}`,
      boxShadow: `0 0 36px ${accentColor}28, inset 0 1px 0 ${accentColor}22`,
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      transform: `scale(${scale})`,
      opacity,
    }}>
      {icon === "laptop" ? <LaptopIcon color={accentColor} /> : <ServerIcon color={accentColor} />}
      <span style={{
        fontFamily: fonts.sans,
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: 2.5,
        textTransform: "uppercase" as const,
        color: accentColor,
        textShadow: "0 1px 6px rgba(0,0,0,0.8)",
      }}>{label}</span>
    </div>
  );
};

// ── Message arrow ──────────────────────────────────────────────────────────────
const MsgArrow: React.FC<{
  step: Step; y: number; localFrame: number; isPast: boolean; hideText?: boolean;
}> = ({ step, y, localFrame, isPast, hideText = false }) => {
  const { dir, color, label, tag, locked } = step;
  if (dir === "none") return null;

  const x0  = dir === "s2c" ? S_EDGE : C_EDGE;
  const x1  = dir === "s2c" ? C_EDGE : S_EDGE;
  const len = Math.abs(x1 - x0);
  const midX = (x0 + x1) / 2;

  const drawP = isPast
    ? 1
    : interpolate(localFrame, [4, DRAW], [0, 1], { extrapolateRight: "clamp" });
  const dashOffset  = (1 - drawP) * len;
  const headOpacity = interpolate(drawP, [0.65, 1], [0, 1], { extrapolateRight: "clamp" });
  const textOpacity = hideText ? 0 : interpolate(drawP, [0.4, 0.9], [0, 1], { extrapolateRight: "clamp" });

  // Packet travels slowly for most of the step duration
  const packetP  = isPast ? 0 : interpolate(localFrame, [DRAW + 4, SPF - 7], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const packetX  = interpolate(packetP, [0, 1], [x0, x1]);
  const showPkt  = !isPast && packetP > 0 && packetP < 0.98;
  const opacity  = 1; // past arrows stay fully visible

  const dir2  = x1 > x0 ? 1 : -1;
  const hLen  = 11; const hSpread = 6;
  const w1x   = x1 - dir2 * hLen;
  const w1y   = y - hSpread;
  const w2x   = x1 - dir2 * hLen;
  const w2y   = y + hSpread;

  const glow  = `drop-shadow(0 0 6px ${color}88)`;

  // Estimate tag half-width for lock positioning (JetBrains Mono ~13.2px / char at 22px)
  const CHAR_PX  = 13.2;
  const tagHalfW = tag ? tag.length * CHAR_PX * 0.5 : 0;
  const lockX    = midX - tagHalfW - 24;
  const tagX     = locked && !isPast ? midX + 10 : midX;

  return (
    <g opacity={opacity}>
      {/* Shaft */}
      <line x1={x0} y1={y} x2={x1} y2={y}
        stroke={color} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={`${len}`} strokeDashoffset={dashOffset}
        style={{ filter: isPast ? "none" : glow }}
      />
      {/* Arrowhead */}
      <polyline
        points={`${w1x},${w1y} ${x1},${y} ${w2x},${w2y}`}
        fill="none" stroke={color} strokeWidth={3}
        strokeLinecap="round" strokeLinejoin="round"
        opacity={headOpacity}
        style={{ filter: isPast ? "none" : glow }}
      />
      {/* Packet dot */}
      {showPkt && (
        <circle cx={packetX} cy={y} r={6} fill={color}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
      )}
      {/* Label */}
      {!hideText && (
        <text x={midX} y={y - 20}
          textAnchor="middle"
          fill={isPast ? "rgba(255,255,255,0.72)" : "#ffffff"}
          fontSize={isPast ? 26 : 34}
          fontWeight={isPast ? 500 : 700}
          fontFamily={fonts.sans}
          opacity={textOpacity}
          style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.9))" }}>
          {label}
        </text>
      )}
      {/* Tag row: lock icon + text */}
      {!hideText && tag && (
        <g opacity={textOpacity}>
          {locked && !isPast && (
            <LockSVG color={color} cx={lockX} cy={y + 32} s={1.0} />
          )}
          <text x={tagX} y={y + 38}
            textAnchor="middle"
            fill={isPast ? "rgba(255,255,255,0.62)" : color}
            fontSize={isPast ? 18 : 22}
            fontWeight={400}
            fontFamily={fonts.mono}>
            {tag}
          </text>
        </g>
      )}
    </g>
  );
};

// ── Bidirectional arrows — shared label above, shared tag below ───────────────
const BidirArrow: React.FC<{
  step: Step; y: number; localFrame: number; isPast: boolean;
}> = ({ step, y, localFrame, isPast }) => {
  const { color, label, tag, locked } = step;
  const midX = (C_EDGE + S_EDGE) / 2;

  // Each inner MsgArrow manages its own shaft opacity; we only control text here.
  const drawP      = isPast ? 1 : interpolate(localFrame, [4, DRAW], [0, 1], { extrapolateRight: "clamp" });
  const textAlpha  = 1;
  const textOpacity = textAlpha * interpolate(drawP, [0.4, 0.9], [0, 1], { extrapolateRight: "clamp" });

  const bare = (dir: Dir): Step => ({ ...step, dir, label: "", tag: undefined, locked: false });

  const CHAR_PX  = 13.2;
  const tagHalfW = tag ? tag.length * CHAR_PX * 0.5 : 0;
  const lockX    = midX - tagHalfW - 24;
  const tagX     = locked && !isPast ? midX + 10 : midX;

  return (
    <>
      {/* Two shafts ±14 px from center — inner MsgArrow owns shaft opacity */}
      <MsgArrow step={bare("c2s")} y={y - 14} localFrame={localFrame}          isPast={isPast} hideText />
      <MsgArrow step={bare("s2c")} y={y + 14} localFrame={isPast ? 0 : localFrame - 8} isPast={isPast} hideText />
      {/* Shared label above c2s shaft */}
      <text x={midX} y={y - 36}
        textAnchor="middle"
        fill={isPast ? "rgba(255,255,255,0.72)" : "#ffffff"}
        fontSize={isPast ? 26 : 34} fontWeight={isPast ? 500 : 700}
        fontFamily={fonts.sans} opacity={textOpacity}
        style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.9))" }}>
        {label}
      </text>
      {/* Shared tag below s2c shaft */}
      {tag && (
        <g opacity={textOpacity}>
          {locked && !isPast && (
            <LockSVG color={color} cx={lockX} cy={y + 38} s={1.0} />
          )}
          <text x={tagX} y={y + 44}
            textAnchor="middle"
            fill={isPast ? "rgba(255,255,255,0.62)" : color}
            fontSize={isPast ? 18 : 22}
            fontWeight={400}
            fontFamily={fonts.mono}>
            {tag}
          </text>
        </g>
      )}
    </>
  );
};

// ── Session key derivation burst ───────────────────────────────────────────────
const KeyBurst: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { fps } = useVideoConfig();
  const y      = rowY(5);
  const p      = spring({ frame: localFrame, fps, config: springPresets.emphasis });
  const scale  = interpolate(p, [0, 1], [0.3, 1]);
  const opacity = interpolate(p, [0, 0.2], [0, 1], { extrapolateRight: "clamp" });
  const beamP  = interpolate(localFrame, [10, 40], [0, 1], { extrapolateRight: "clamp" });

  const mid        = (C_EDGE + S_EDGE) / 2;
  const BADGE_HALF = 196; // badge rect half-width (192) + small gap
  // Beams grow outward from the badge edges — never crossing the text
  const cBeamEnd = interpolate(beamP, [0, 1], [mid - BADGE_HALF, C_EDGE + 36]);
  const sBeamEnd = interpolate(beamP, [0, 1], [mid + BADGE_HALF, S_EDGE - 36]);

  return (
    <g>
      {/* Beams start at badge edges and grow outward toward each actor */}
      <line x1={mid - BADGE_HALF} y1={y} x2={cBeamEnd} y2={y}
        stroke={GREEN} strokeWidth={2} opacity={opacity * beamP}
        strokeDasharray="5 4"
        style={{ filter: `drop-shadow(0 0 6px ${GREEN})` }} />
      <line x1={mid + BADGE_HALF} y1={y} x2={sBeamEnd} y2={y}
        stroke={GREEN} strokeWidth={2} opacity={opacity * beamP}
        strokeDasharray="5 4"
        style={{ filter: `drop-shadow(0 0 6px ${GREEN})` }} />

      {/* Center badge */}
      <g transform={`translate(${mid},${y})`}>
        <g transform={`scale(${scale})`} opacity={opacity}>
          <rect x={-192} y={-26} width={384} height={52} rx={26}
            fill={`${GREEN}18`} stroke={`${GREEN}70`} strokeWidth={1.5}
            style={{ filter: `drop-shadow(0 0 18px ${GREEN}55)` }} />
          {/* Key icons flanking label */}
          <KeySVG color={GREEN} cx={-163} cy={0} s={1.15} />
          <KeySVG color={GREEN} cx={163}  cy={0} s={1.15} />
          <text x={0} y={8} textAnchor="middle"
            fill={GREEN} fontSize={24} fontWeight={700} fontFamily={fonts.sans}>
            Session Keys Derived
          </text>
        </g>
      </g>

      {/* Lock icons at each lifeline */}
      <g opacity={opacity * beamP}>
        <LockSVG color={GREEN} cx={CX} cy={y} s={1.15} />
        <LockSVG color={GREEN} cx={SX} cy={y} s={1.15} />
      </g>
    </g>
  );
};

// ── Phase bracket labels (left side) ──────────────────────────────────────────
const PHASES = [
  { label: "NEGOTIATION",    first: 1, last: 2, color: BLUE  },
  { label: "AUTHENTICATION", first: 3, last: 4, color: GOLD  },
  { label: "KEY EXCHANGE",   first: 5, last: 7, color: GREEN },
  { label: "ENCRYPTED DATA", first: 8, last: 8, color: MAUVE },
];

const PhaseLabels: React.FC<{ stepIdx: number }> = ({ stepIdx }) => {
  if (stepIdx === 0) return null;
  const x = C_EDGE - 72;

  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {PHASES.map((ph) => {
        const y0     = rowY(ph.first) - 14;
        const y1     = rowY(ph.last)  + 14;
        const midY   = (y0 + y1) / 2;
        const show   = stepIdx >= ph.first;

        return (
          <g key={ph.label} opacity={show ? 0.60 : 0}>
            {/* Bracket */}
            <line x1={x + 8}  y1={y0}   x2={x + 2} y2={y0}   stroke={ph.color} strokeWidth={1.2} />
            <line x1={x + 2}  y1={y0}   x2={x + 2} y2={y1}   stroke={ph.color} strokeWidth={1.2} />
            <line x1={x + 2}  y1={y1}   x2={x + 8} y2={y1}   stroke={ph.color} strokeWidth={1.2} />
            {/* Label */}
            <text x={x - 8} y={midY + 4}
              textAnchor="end"
              fill={ph.color}
              fontSize={14}
              fontWeight={600}
              fontFamily={fonts.mono}
              letterSpacing={1.5}>
              {ph.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Step counter ───────────────────────────────────────────────────────────────
const StepBadge: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div style={{
    position: "absolute", top: 26, right: 50,
    fontFamily: fonts.mono, fontSize: 14, fontWeight: 600,
    color: "rgba(255,255,255,0.35)", letterSpacing: 1,
  }}>
    {current > 0 ? `STEP ${current} / ${total - 1}` : "TLS HANDSHAKE"}
  </div>
);


// ── Main component ─────────────────────────────────────────────────────────────
export const TLSHandshake: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let stepIdx = 0;
  for (let i = 1; i < STEP_START_FRAMES.length; i++) {
    if (frame >= STEP_START_FRAMES[i]) stepIdx = i;
  }
  const localFrame = frame - STEP_START_FRAMES[stepIdx];

  const boxP = spring({ frame, fps, config: springPresets.enter });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* SVG layer — lifelines + arrows */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        {/* Lifelines */}
        <line x1={CX} y1={LL_Y0} x2={CX} y2={LL_Y1}
          stroke={BLUE} strokeWidth={1.5} strokeDasharray="7 5"
          opacity={interpolate(boxP, [0, 1], [0, 0.35])} />
        <line x1={SX} y1={LL_Y0} x2={SX} y2={LL_Y1}
          stroke={TEAL} strokeWidth={1.5} strokeDasharray="7 5"
          opacity={interpolate(boxP, [0, 1], [0, 0.35])} />

        {/* Message rows */}
        {STEPS.map((step, i) => {
          if (i === 0) return null;
          const y       = rowY(i);
          const isPast  = stepIdx > i;
          const isActive = stepIdx === i;
          if (!isActive && !isPast) return null;

          const lf = isActive ? localFrame : 0;

          if (step.keyStep) {
            return isActive
              ? <KeyBurst key={i} localFrame={localFrame} />
              : (
                <g key={i} opacity={0.25}>
                  <rect x={(C_EDGE + S_EDGE) / 2 - 192} y={y - 26} width={384} height={52} rx={26}
                    fill="none" stroke={GREEN} strokeWidth={1} />
                  <text x={(C_EDGE + S_EDGE) / 2} y={y + 7} textAnchor="middle"
                    fill={GREEN} fontSize={18} fontFamily={fonts.sans} fontWeight={600}>
                    Session Keys Derived
                  </text>
                </g>
              );
          }

          if (step.dir === "both") {
            return <BidirArrow key={i} step={step} y={y} localFrame={lf} isPast={isPast} />;
          }

          return <MsgArrow key={i} step={step} y={y} localFrame={lf} isPast={isPast} />;
        })}

        {/* Active-step dot on lifeline */}
        {stepIdx > 0 && !STEPS[stepIdx].keyStep && (
          <circle
            cx={STEPS[stepIdx].dir === "c2s" || STEPS[stepIdx].dir === "both" ? CX : SX}
            cy={rowY(stepIdx)}
            r={6}
            fill={STEPS[stepIdx].color}
            opacity={0.9}
            style={{ filter: `drop-shadow(0 0 8px ${STEPS[stepIdx].color})` }}
          />
        )}
      </svg>

      {/* Phase bracket labels */}
      <PhaseLabels stepIdx={stepIdx} />

      {/* Actor boxes */}
      <ActorBox label="CLIENT" icon="laptop" cx={CX}
        accentColor={BLUE} borderColor={`${BLUE}55`} frame={frame} />
      <ActorBox label="SERVER" icon="server" cx={SX}
        accentColor={TEAL} borderColor={`${TEAL}55`} frame={Math.max(frame - 8, 0)} />

      {/* Step counter */}
      <StepBadge current={stepIdx} total={STEPS.length} />

      {/* Narration audio */}
      <NarrationLayer sceneId="tls-handshake" steps={tlsNarrationSteps} />
    </AbsoluteFill>
  );
};
