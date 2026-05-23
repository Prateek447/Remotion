import React from "react";
import { spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../lib/theme";

export interface PegState {
  A: number[];
  B: number[];
  C: number[];
}

export interface HanoiParams {
  n: number;
  src: string;
  dst: string;
  via: string;
}

interface TowerOfHanoiDiagramProps {
  prevPegs: PegState;
  currPegs: PegState;
  movingDisk?: number;
  fromPeg?: keyof PegState;
  toPeg?: keyof PegState;
  /** Frames elapsed since this step started — drives physics simulation */
  localFrame: number;
  width: number;
  height: number;
  params?: HanoiParams;
}

const PEG_FRACS: Record<string, number> = { A: 0.22, B: 0.50, C: 0.78 };
const DISK_H = 48;
const DISK_GAP = 10;
const PEG_W = 14;

// Phase durations (frames at 30 fps)
const LIFT_F   = 20; // rise straight up, decelerating
const TRAVEL_F = 16; // carry horizontally with ease-in-out
const DROP_F   = 22; // fall with gravitational acceleration
const ANIM_END = LIFT_F + TRAVEL_F + DROP_F; // 58 frames ≈ 1.93 s

const DISK_COLOR: Record<number, string> = {
  1: "#00E676",
  2: "#FF6D00",
  3: "#2979FF",
  4: "#D500F9",
};

// Heavier disks bounce more on landing (Newton's laws + elasticity)
const DISK_MASS: Record<number, number> = { 1: 0.45, 2: 0.65, 3: 0.90, 4: 1.20 };
const DISK_BOUNCE_AMP: Record<number, number> = { 1: 14, 2: 20, 3: 28, 4: 36 };

function diskWidth(disk: number, areaW: number): number {
  const fracs: Record<number, number> = { 1: 0.10, 2: 0.16, 3: 0.22, 4: 0.29 };
  return (fracs[disk] ?? 0.10) * areaW;
}

function diskTopY(stackIdx: number, baseY: number): number {
  return baseY - (stackIdx + 1) * DISK_H - stackIdx * DISK_GAP;
}

// Ease-out: decelerating (t^(1/e) curve)
function easeOut(t: number, exp = 1.8): number {
  return 1 - Math.pow(1 - t, exp);
}

// Ease-in-out (cubic)
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Quadratic ease-in: constant gravitational acceleration (a = const, v = a·t, d = ½·a·t²)
function gravity(t: number): number {
  return t * t;
}

export const TowerOfHanoiDiagram: React.FC<TowerOfHanoiDiagramProps> = ({
  prevPegs,
  currPegs,
  movingDisk,
  fromPeg,
  toPeg,
  localFrame,
  width,
  height,
  params,
}) => {
  const { fps } = useVideoConfig();

  const baseY = height * 0.76;
  const pegHeight = height * 0.55;
  const pegTopY = baseY + DISK_H / 2 - pegHeight; // top edge of all peg rods
  const labelY = baseY + DISK_H / 2 + 22;
  const captionY = labelY + 44;

  const pegX = (peg: string) => width * (PEG_FRACS[peg] ?? 0.5);

  // ── Physics simulation ──────────────────────────────────────────────────────
  let animX = 0;
  let animY = 0;
  let showMoving = false;
  let heightFrac = 0; // 0 = at rest, 1 = at peak height (drives visual effects)

  if (movingDisk && fromPeg && toPeg) {
    showMoving = true;

    const fromX = pegX(fromPeg);
    const toX   = pegX(toPeg);

    const fromY = diskTopY(prevPegs[fromPeg].length - 1, baseY);
    const toY   = diskTopY(currPegs[toPeg].length - 1, baseY);

    // Peak height: disk must clear peg rod tops so it can pass over them
    const peakY = pegTopY - 12; // 12 px clearance above all peg tops
    const liftH = fromY - peakY; // vertical distance to lift (always positive)

    if (localFrame < ANIM_END) {
      // ── Phase 1: Lift straight up (deceleration — like fighting gravity to start) ──
      if (localFrame < LIFT_F) {
        const rT = localFrame / LIFT_F;
        animX = fromX;
        animY = fromY - liftH * easeOut(rT, 1.8);
      }
      // ── Phase 2: Carry horizontally at peak height ──────────────────────────
      else if (localFrame < LIFT_F + TRAVEL_F) {
        const tT = (localFrame - LIFT_F) / TRAVEL_F;
        // Horizontal: ease-in-out (like holding the disk and walking to the peg)
        animX = fromX + (toX - fromX) * easeInOut(tT);
        // Slight vertical wobble (0.8px amplitude) — arm sway while carrying
        const wobble = Math.sin(tT * Math.PI) * 0.8;
        animY = peakY + wobble;
      }
      // ── Phase 3: Drop with gravity (constant downward acceleration) ─────────
      else {
        const dT = (localFrame - LIFT_F - TRAVEL_F) / DROP_F;
        animX = toX;
        // Gravity: y(t) = peakY + (toY − peakY) · t²  [a = const, no initial downward vel]
        animY = peakY + (toY - peakY) * gravity(dT);
      }

      heightFrac = Math.min(1, (fromY - animY) / liftH);
    }
    // ── Phase 4: Landing impact + spring bounce ─────────────────────────────
    else {
      const bounceFrame = localFrame - ANIM_END;
      const mass = DISK_MASS[movingDisk] ?? 0.65;
      const amp  = DISK_BOUNCE_AMP[movingDisk] ?? 12;

      // Underdamped spring: starts 'amp' px above destination, springs down and oscillates.
      // Heavier disks (larger mass) bounce more visibly before settling.
      const bs = spring({
        frame: bounceFrame,
        fps,
        config: { damping: 10, stiffness: 460, mass },
      });

      animX = toX;
      // bs goes 0 → 1 (with overshoot for underdamped). Map: 0 → toY-amp, 1 → toY
      animY = toY - amp * (1 - bs);
      heightFrac = 0;
    }
  }

  // ── Visual effect parameters driven by current height ──────────────────────
  const glowRadius  = 16 + heightFrac * 28;         // glow expands as disk rises
  const dropShadowY = 4 + heightFrac * 14;          // shadow offset grows with height
  const shadowBlur  = 12 + heightFrac * 24;
  const scale       = 1 + heightFrac * 0.065;        // subtle scale-up at peak (depth cue)

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderDisk = (disk: number, cx: number, cy: number, moving = false) => {
    const dw  = diskWidth(disk, width);
    const col = DISK_COLOR[disk] ?? "#888";

    const boxShadow = moving
      ? `0 0 ${glowRadius}px ${col}99, 0 ${dropShadowY}px ${shadowBlur}px rgba(0,0,0,0.6)`
      : `0 4px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2)`;

    const transform = moving ? `scale(${scale})` : undefined;

    return (
      <div
        key={moving ? `moving-${disk}` : `${disk}-${cy}`}
        style={{
          position: "absolute",
          left: cx - dw / 2,
          top: cy,
          width: dw,
          height: DISK_H,
          background: col,
          borderRadius: 12,
          border: `2px solid ${col}bb`,
          boxShadow,
          transform,
          transformOrigin: "center center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: moving ? 100 : 10,
          willChange: moving ? "transform, top, left" : undefined,
        }}
      >
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 22,
            fontWeight: 800,
            color: "#FFFFFF",
            userSelect: "none",
          }}
        >
          {disk}
        </span>
      </div>
    );
  };

  // ── Impact ring ─────────────────────────────────────────────────────────────
  // A faint expanding ring at the destination peg when the disk lands
  const renderImpactRing = () => {
    if (!showMoving || !movingDisk || !toPeg) return null;
    const ringFrame = localFrame - ANIM_END;
    if (ringFrame < 0 || ringFrame > 20) return null;

    const ringProgress = ringFrame / 20;
    const ringScale = 1 + ringProgress * 1.8;
    const ringOpacity = (1 - ringProgress) * 0.55;
    const col = DISK_COLOR[movingDisk] ?? "#888";
    const cx = pegX(toPeg);
    const cy = diskTopY(currPegs[toPeg].length - 1, baseY);
    const dw = diskWidth(movingDisk, width);

    return (
      <div
        style={{
          position: "absolute",
          left: cx - dw / 2,
          top: cy,
          width: dw,
          height: DISK_H,
          border: `3px solid ${col}`,
          borderRadius: 12,
          opacity: ringOpacity,
          transform: `scale(${ringScale})`,
          transformOrigin: "center center",
          pointerEvents: "none",
          zIndex: 90,
        }}
      />
    );
  };

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative", width, height, overflow: "hidden" }}>

      {/* Parameter display */}
      {params && (() => {
        const entries: Array<{ key: string; val: string; color: string }> = [
          { key: "n",   val: String(params.n),   color: "#FFD666" },
          { key: "src", val: params.src,          color: "#00E676" },
          { key: "dst", val: params.dst,          color: "#4FC3F7" },
          { key: "via", val: params.via,          color: "#A78BFA" },
        ];
        return (
          <div
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "stretch",
              background: "rgba(12,12,20,0.82)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 14,
              overflow: "hidden",
              zIndex: 20,
            }}
          >
            {entries.map(({ key, val, color }, i) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "10px 28px",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 17,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: "uppercase" as const,
                    color: "#FFFFFF",
                  }}
                >
                  {key}
                </span>
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 34,
                    fontWeight: 800,
                    color,
                    lineHeight: 1,
                    letterSpacing: -0.5,
                  }}
                >
                  {val}
                </span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Base plate */}
      <div
        style={{
          position: "absolute",
          left: width * 0.06,
          top: baseY + DISK_H / 2,
          width: width * 0.88,
          height: 18,
          background: "linear-gradient(90deg, #C0C0C0, #FFFFFF, #C0C0C0)",
          borderRadius: 9,
          boxShadow: "0 4px 20px rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.5)",
        }}
      />

      {/* Peg rods + labels */}
      {(["A", "B", "C"] as const).map((peg) => (
        <React.Fragment key={peg}>
          <div
            style={{
              position: "absolute",
              left: pegX(peg) - PEG_W / 2,
              top: baseY + DISK_H / 2 - pegHeight,
              width: PEG_W,
              height: pegHeight,
              background: "linear-gradient(90deg, #B0B0B0, #FFFFFF, #B0B0B0)",
              borderRadius: "7px 7px 0 0",
              boxShadow: "0 0 12px rgba(255,255,255,0.25)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: pegX(peg) - 24,
              top: labelY,
              width: 48,
              textAlign: "center",
              fontFamily: fonts.mono,
              fontSize: 30,
              fontWeight: 700,
              color: colors.subtext0,
              letterSpacing: 2,
            }}
          >
            {peg}
          </div>
        </React.Fragment>
      ))}

      {/* Static disks from currPegs — skip the one in flight */}
      {(["A", "B", "C"] as const).map((peg) =>
        currPegs[peg].map((disk, idx) => {
          if (showMoving && disk === movingDisk) return null;
          return renderDisk(disk, pegX(peg), diskTopY(idx, baseY));
        }),
      )}

      {/* Impact ring — expands outward when disk lands */}
      {renderImpactRing()}

      {/* Moving disk — physics-driven position */}
      {showMoving && movingDisk && renderDisk(movingDisk, animX, animY, true)}

    </div>
  );
};
