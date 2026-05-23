import React from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { useStepTransition } from "../lib/useStepTransition";
import { AmbientLayer } from "../components/AmbientLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AnimationOnlyLayout, ANIM_DIAGRAM_HEIGHT } from "../components/AnimationOnlyLayout";
import { SplitLayout } from "../components/SplitLayout";
import { StackedLayout, type SafeArea } from "../components/StackedLayout";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import {
  TowerOfHanoiDiagram,
  type PegState,
  type HanoiParams,
} from "../components/TowerOfHanoiDiagram";

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 90, right: 130 };
const REEL_TOP_RATIO = 0.65;

// ── Custom step type (structurally satisfies SceneStep) ───────────────────────

interface TowerStep extends SceneStep {
  pegs: PegState;
  movingDisk?: number;
  fromPeg?: keyof PegState;
  toPeg?: keyof PegState;
  params?: HanoiParams;
}

// ── Peg states — 4-disk solution (15 moves) ───────────────────────────────────
// Arrays are bottom→top; index 0 = bottom (largest disk)

const S0:  PegState = { A: [4,3,2,1], B: [],      C: []      }; // start
const S1:  PegState = { A: [4,3,2],   B: [1],      C: []      }; // disk1 A→B
const S2:  PegState = { A: [4,3],     B: [1],      C: [2]     }; // disk2 A→C
const S3:  PegState = { A: [4,3],     B: [],       C: [2,1]   }; // disk1 B→C
const S4:  PegState = { A: [4],       B: [3],      C: [2,1]   }; // disk3 A→B
const S5:  PegState = { A: [4,1],     B: [3],      C: [2]     }; // disk1 C→A
const S6:  PegState = { A: [4,1],     B: [3,2],    C: []      }; // disk2 C→B
const S7:  PegState = { A: [4],       B: [3,2,1],  C: []      }; // disk1 A→B
const S8:  PegState = { A: [],        B: [3,2,1],  C: [4]     }; // disk4 A→C
const S9:  PegState = { A: [],        B: [3,2],    C: [4,1]   }; // disk1 B→C
const S10: PegState = { A: [2],       B: [3],      C: [4,1]   }; // disk2 B→A
const S11: PegState = { A: [2,1],     B: [3],      C: [4]     }; // disk1 C→A
const S12: PegState = { A: [2,1],     B: [],       C: [4,3]   }; // disk3 B→C
const S13: PegState = { A: [2],       B: [1],      C: [4,3]   }; // disk1 A→B
const S14: PegState = { A: [],        B: [1],      C: [4,3,2] }; // disk2 A→C
const S15: PegState = { A: [],        B: [],       C: [4,3,2,1]}; // disk1 B→C (done)

/*
 * Code lines (0-indexed):
 *   0:  void hanoi(int n, char src, char dst, char via) {
 *   1:      if (n == 0) return;
 *   2:      hanoi(n - 1, src, via, dst);
 *   3:      System.out.println(src + " → " + dst);
 *   4:      hanoi(n - 1, via, dst, src);
 *   5:  }
 *
 * startFrame values are PLACEHOLDERS — run generate-narration.mjs,
 * then update-durations.mjs, and recalculate:
 * startFrame[n] = sum(frames[0..n-1]) + n*10
 */
const steps: TowerStep[] = [
  // Step 0 — Intro: all 4 disks on peg A
  {
    startFrame: 0,   // 363f
    highlightLines: { startLine: 0, endLine: 5 },
    snapshot: { nodes: [], pointers: [], arrows: [] },
    pegs: S0,
    params: { n: 4, src: "A", dst: "C", via: "B" },
  },
  // Step 1 — Base case
  {
    startFrame: 373,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: { nodes: [], pointers: [], arrows: [] },
    pegs: S0,
    params: { n: 0, src: "A", dst: "C", via: "B" },
  },
  // Step 2 — First recursive call: move n-1 disks A→B via C
  {
    startFrame: 587,
    highlightLines: { startLine: 2, endLine: 2 },
    snapshot: { nodes: [], pointers: [], arrows: [] },
    pegs: S0,
    params: { n: 3, src: "A", dst: "B", via: "C" },
  },
  // Step 3 — Move 1: disk 1 A → B   [hanoi(1, A, B, C)]
  { startFrame: 904,  highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S1,  movingDisk: 1, fromPeg: "A", toPeg: "B", params: { n: 1, src: "A", dst: "B", via: "C" } },
  // Step 4 — Move 2: disk 2 A → C   [hanoi(2, A, C, B)]
  { startFrame: 1005, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S2,  movingDisk: 2, fromPeg: "A", toPeg: "C", params: { n: 2, src: "A", dst: "C", via: "B" } },
  // Step 5 — Move 3: disk 1 B → C   [hanoi(1, B, C, A)]
  { startFrame: 1104, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S3,  movingDisk: 1, fromPeg: "B", toPeg: "C", params: { n: 1, src: "B", dst: "C", via: "A" } },
  // Step 6 — Move 4: disk 3 A → B   [hanoi(3, A, B, C)]
  { startFrame: 1207, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S4,  movingDisk: 3, fromPeg: "A", toPeg: "B", params: { n: 3, src: "A", dst: "B", via: "C" } },
  // Step 7 — Move 5: disk 1 C → A   [hanoi(1, C, A, B)]
  { startFrame: 1312, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S5,  movingDisk: 1, fromPeg: "C", toPeg: "A", params: { n: 1, src: "C", dst: "A", via: "B" } },
  // Step 8 — Move 6: disk 2 C → B   [hanoi(2, C, B, A)]
  { startFrame: 1415, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S6,  movingDisk: 2, fromPeg: "C", toPeg: "B", params: { n: 2, src: "C", dst: "B", via: "A" } },
  // Step 9 — Move 7: disk 1 A → B   [hanoi(1, A, B, C)]
  { startFrame: 1518, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S7,  movingDisk: 1, fromPeg: "A", toPeg: "B", params: { n: 1, src: "A", dst: "B", via: "C" } },
  // Step 10 — Move 8: disk 4 A → C  [hanoi(4, A, C, B)]
  { startFrame: 1759, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S8,  movingDisk: 4, fromPeg: "A", toPeg: "C", params: { n: 4, src: "A", dst: "C", via: "B" } },
  // Step 11 — Move 9: disk 1 B → C  [hanoi(1, B, C, A)]
  { startFrame: 1897, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S9,  movingDisk: 1, fromPeg: "B", toPeg: "C", params: { n: 1, src: "B", dst: "C", via: "A" } },
  // Step 12 — Move 10: disk 2 B → A [hanoi(2, B, A, C)]
  { startFrame: 1998, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S10, movingDisk: 2, fromPeg: "B", toPeg: "A", params: { n: 2, src: "B", dst: "A", via: "C" } },
  // Step 13 — Move 11: disk 1 C → A [hanoi(1, C, A, B)]
  { startFrame: 2094, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S11, movingDisk: 1, fromPeg: "C", toPeg: "A", params: { n: 1, src: "C", dst: "A", via: "B" } },
  // Step 14 — Move 12: disk 3 B → C [hanoi(3, B, C, A)]
  { startFrame: 2200, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S12, movingDisk: 3, fromPeg: "B", toPeg: "C", params: { n: 3, src: "B", dst: "C", via: "A" } },
  // Step 15 — Move 13: disk 1 A → B [hanoi(1, A, B, C)]
  { startFrame: 2306, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S13, movingDisk: 1, fromPeg: "A", toPeg: "B", params: { n: 1, src: "A", dst: "B", via: "C" } },
  // Step 16 — Move 14: disk 2 A → C [hanoi(2, A, C, B)]
  { startFrame: 2414, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S14, movingDisk: 2, fromPeg: "A", toPeg: "C", params: { n: 2, src: "A", dst: "C", via: "B" } },
  // Step 17 — Move 15: disk 1 B → C [hanoi(1, B, C, A)]
  { startFrame: 2520, highlightLines: { startLine: 3, endLine: 3 }, snapshot: { nodes: [], pointers: [], arrows: [] }, pegs: S15, movingDisk: 1, fromPeg: "B", toPeg: "C", params: { n: 1, src: "B", dst: "C", via: "A" } },
  // Step 18 — Summary
  {
    startFrame: 2724,
    highlightLines: { startLine: 0, endLine: 5 },
    snapshot: { nodes: [], pointers: [], arrows: [] },
    pegs: S15,
    params: { n: 4, src: "A", dst: "C", via: "B" },
  },
];

export const TOWER_OF_HANOI_SCENE_FRAMES = 3146;

// ── Physics-aware SFX ─────────────────────────────────────────────────────────

const sfx = {
  slide:           staticFile("sfx/slide.mp3"),
  whoosh:          staticFile("sfx/whoosh.mp3"),
  pop:             staticFile("sfx/pop.mp3"),
  connect:         staticFile("sfx/connect.mp3"),
  ding:            staticFile("sfx/ding.mp3"),
  focus:           staticFile("sfx/focus.mp3"),
  mouseClick:      staticFile("sfx/mouseClick.mp3"),
  phaseTransition: staticFile("sfx/phase-transition.mp3"),
  successChime:    staticFile("sfx/success-chime.mp3"),
};

// Frames: LIFT_F=20, TRAVEL_F=16, DROP_F=22, ANIM_END=58
const LAND_F  = 58; // frame offset within a step when disk hits the peg
const SETTLE_F = 65;

interface SfxClip { src: string; frame: number; volume: number; duration?: number }

function buildClips(steps: TowerStep[], duckVol: number, animOnly = false): SfxClip[] {
  const clips: SfxClip[] = [];

  const push = (frame: number, src: string, volume: number, duration = 30) =>
    clips.push({ src, frame, volume: volume * duckVol, duration });

  steps.forEach((step, i) => {
    const f = step.startFrame;
    const isLast  = i === steps.length - 1;
    const isFirst = i === 0;
    const disk    = step.movingDisk;

    if (isLast) {
      push(f, sfx.successChime, 0.70);
      return;
    }

    if (isFirst) {
      push(f, sfx.focus, 0.40);
      return;
    }

    // Conceptual steps (no disk moving) — just a code-tick
    if (!disk) {
      if (!animOnly) push(f, sfx.mouseClick, 0.40);
      return;
    }

    // Code line tick at step start (omitted in anim-only mode)
    if (!animOnly) push(f, sfx.mouseClick, 0.30);

    // Cinematic anticipation for the heaviest disk
    if (disk === 4) push(f, sfx.phaseTransition, 0.40);

    // Lift sound — heavier disk needs more effort
    const liftVol = disk === 1 ? 0.28 : disk === 2 ? 0.34 : disk === 3 ? 0.40 : 0.50;
    push(f + 2, sfx.slide, liftVol, 24);

    // Travel whoosh — more air displacement for bigger disks
    const travelVol = disk === 1 ? 0.18 : disk === 2 ? 0.22 : disk === 3 ? 0.28 : 0.36;
    push(f + 22, sfx.whoosh, travelVol, 18);

    // Landing impact — light disks snap (pop), heavy disks thud (connect)
    if (disk <= 2) {
      push(f + LAND_F, sfx.pop,     disk === 1 ? 0.52 : 0.65, 20);
    } else {
      push(f + LAND_F, sfx.connect, disk === 3 ? 0.68 : 0.85, 25);
    }

    // Bounce settle resonance
    const settleVol = disk === 1 ? 0.14 : disk === 2 ? 0.18 : disk === 3 ? 0.22 : 0.28;
    push(f + SETTLE_F, sfx.ding, settleVol, 20);
  });

  return clips;
}

const TowerSfxLayer: React.FC<{ steps: TowerStep[]; duckVolume: number; animOnly?: boolean }> = ({
  steps,
  duckVolume,
  animOnly = false,
}) => {
  const clips = buildClips(steps, duckVolume, animOnly);
  return (
    <>
      {clips.map((c, i) => (
        <Sequence key={i} from={c.frame} durationInFrames={c.duration ?? 30}>
          <Audio src={c.src} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
};

// ── Scene component ───────────────────────────────────────────────────────────

export interface TowerOfHanoiProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

export const TowerOfHanoi: React.FC<TowerOfHanoiProps> = ({
  tokens,
  format = "youtube",
}) => {
  const { width, height } = useVideoConfig();
  const isAnim = format === "reel-anim";
  const isReel = format === "reel" || isAnim;

  const { current, previous, localFrame } = useStepTransition(
    steps as SceneStep[],
  );
  const curr = current as TowerStep;
  const prev = previous as TowerStep;

  // Diagram dimensions
  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;
  const diagramW = isAnim ? width : isReel ? safeW : Math.round(width * 0.54);
  const diagramH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;

  const diagram = (
    <TowerOfHanoiDiagram
      prevPegs={prev.pegs}
      currPegs={curr.pegs}
      movingDisk={curr.movingDisk}
      fromPeg={curr.fromPeg}
      toPeg={curr.toPeg}
      localFrame={localFrame}
      width={diagramW}
      height={diagramH}
      params={isAnim ? undefined : curr.params}
    />
  );

  const code = (
    <CodeWindow title="Hanoi.java" hideTitle={isReel}>
      <CodeBlock
        tokens={tokens}
        steps={steps as SceneStep[]}
        fontSize={isReel ? 26 : 28}
        lineHeight={isReel ? 1.9 : 2.3}
        padding={20}
        centered={isReel}
        centerWidth={isReel ? safeW : undefined}
        bold={isReel}
      />
    </CodeWindow>
  );

  return (
    <>
      {isAnim ? (
        <AnimationOnlyLayout>{diagram}</AnimationOnlyLayout>
      ) : isReel ? (
        <StackedLayout
          top={diagram}
          bottom={code}
          safeArea={REEL_SAFE}
          topRatio={REEL_TOP_RATIO}
          contentPaddingTop={60}
        />
      ) : (
        <SplitLayout left={diagram} right={code} leftWidth="54%" />
      )}

      <AmbientLayer />
      <TowerSfxLayer steps={steps} duckVolume={0.45} animOnly={isAnim} />
      {format === "youtube" && <NarrationLayer sceneId="tower-of-hanoi" steps={steps as SceneStep[]} />}
    </>
  );
};
