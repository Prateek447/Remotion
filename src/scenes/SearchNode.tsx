import React from "react";
import { useVideoConfig, useCurrentFrame, AbsoluteFill, interpolate, Sequence } from "remotion";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { SplitLayout } from "../components/SplitLayout";
import { StackedLayout, STACKED_TOP_RATIO, type SafeArea } from "../components/StackedLayout";
import { LinkedListDiagram } from "../components/LinkedListDiagram";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";
import { fonts } from "../lib/theme";
import { AnimationOnlyLayout, ANIM_DIAGRAM_HEIGHT } from "../components/AnimationOnlyLayout";
import { compressStepsForAnim } from "../lib/animSteps";

/*
 * Code lines (0-indexed):
 *   0: public boolean search(int val) {
 *   1:     Node curr = head;
 *   2:     while (curr != null) {
 *   3:         if (curr.val == val) {
 *   4:             return true;
 *   5:         }
 *   6:         curr = curr.next;
 *   7:     }
 *   8:     return false;
 *   9: }
 */

const HEAD_COLOR = "#2196F3";
const CURR_COLOR = "#7c3aed";

/*
 * visibleLines = number of code lines visible (progressive reveal).
 *   1  → only line 0 (function sig)
 *   2  → lines 0-1 (+ curr = head)
 *   7  → lines 0-6 (while loop body, no return false)
 *   10 → all lines
 */

// startFrame values derived from actual narration audio durations + 10-frame buffer
const steps: SceneStep[] = [
  // ─── Phase 0: CONTEXT ─────────────────────────────────────────────────
  {
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 0 },
    visibleLines: 1,
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Linked List: 3 → 7 → 9 → 5",
    },
  },

  // Problem statement — search for value 9
  {
    startFrame: 190,
    highlightLines: { startLine: 0, endLine: 0 },
    visibleLines: 1,
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Search for value 9",
      searchTarget: 9,
    },
  },

  // ─── Phase 1: INITIALIZE ──────────────────────────────────────────────
  // curr = head → reveal line 1
  {
    startFrame: 423,
    highlightLines: { startLine: 1, endLine: 1 },
    visibleLines: 2,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "curr = head",
      searchTarget: 9,
    },
  },

  // ─── Phase 2: FOUND CASE — searching for 9 ────────────────────────────
  // Check curr.val(3) ≠ 9 → reveal while loop (lines 2-7)
  {
    startFrame: 580,
    highlightLines: { startLine: 2, endLine: 3 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "curr.val(3) ≠ 9",
      searchTarget: 9,
    },
  },

  // curr = curr.next → move to 7
  {
    startFrame: 747,
    highlightLines: { startLine: 6, endLine: 6 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "visited" },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n7", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7", highlight: true },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "curr = curr.next",
      searchTarget: 9,
    },
  },

  // Check curr.val(7) ≠ 9
  {
    startFrame: 823,
    highlightLines: { startLine: 2, endLine: 3 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "visited" },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n7", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "curr.val(7) ≠ 9",
      searchTarget: 9,
    },
  },

  // curr = curr.next → move to 9
  {
    startFrame: 923,
    highlightLines: { startLine: 6, endLine: 6 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "visited" },
        { id: "n7", value: 7, highlight: "visited" },
        { id: "n9", value: 9, highlight: "active" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9", highlight: true },
        { from: "n9", to: "n5" },
      ],
      caption: "curr = curr.next",
      searchTarget: 9,
    },
  },

  // curr.val(9) == 9 — FOUND!
  {
    startFrame: 983,
    highlightLines: { startLine: 3, endLine: 3 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "visited" },
        { id: "n7", value: 7, highlight: "visited" },
        { id: "n9", value: 9, highlight: "found" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "curr.val(9) == 9 ✓",
      searchTarget: 9,
    },
  },

  // return true
  {
    startFrame: 1122,
    highlightLines: { startLine: 4, endLine: 4 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "visited" },
        { id: "n7", value: 7, highlight: "visited" },
        { id: "n9", value: 9, highlight: "found" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "return true",
      searchTarget: 9,
    },
  },

  // ─── Phase 3: NOT FOUND CASE — searching for 4 ────────────────────────
  // Reset list, new search target
  {
    startFrame: 1242,
    highlightLines: { startLine: 0, endLine: 0 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Now search for value 4",
      searchTarget: 4,
    },
  },

  // curr = head, check 3 ≠ 4
  {
    startFrame: 1378,
    highlightLines: { startLine: 1, endLine: 3 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "curr.val(3) ≠ 4",
      searchTarget: 4,
    },
  },

  // curr → 7, check 7 ≠ 4
  {
    startFrame: 1515,
    highlightLines: { startLine: 2, endLine: 6 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "visited" },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n7", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7", highlight: true },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "curr.val(7) ≠ 4",
      searchTarget: 4,
    },
  },

  // curr → 9, check 9 ≠ 4
  {
    startFrame: 1624,
    highlightLines: { startLine: 2, endLine: 6 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "visited" },
        { id: "n7", value: 7, highlight: "visited" },
        { id: "n9", value: 9, highlight: "active" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9", highlight: true },
        { from: "n9", to: "n5" },
      ],
      caption: "curr.val(9) ≠ 4",
      searchTarget: 4,
    },
  },

  // curr → 5, check 5 ≠ 4 (last node)
  {
    startFrame: 1719,
    highlightLines: { startLine: 2, endLine: 6 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "visited" },
        { id: "n7", value: 7, highlight: "visited" },
        { id: "n9", value: 9, highlight: "visited" },
        { id: "n5", value: 5, highlight: "active" },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n5", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5", highlight: true },
      ],
      caption: "curr.val(5) ≠ 4",
      searchTarget: 4,
    },
  },

  // curr = curr.next → null (pointer disappears)
  {
    startFrame: 1833,
    highlightLines: { startLine: 6, endLine: 7 },
    visibleLines: 8,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "visited" },
        { id: "n7", value: 7, highlight: "visited" },
        { id: "n9", value: 9, highlight: "visited" },
        { id: "n5", value: 5, highlight: "visited" },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "curr = null — list exhausted",
      searchTarget: 4,
    },
  },

  // return false → reveal remaining lines (8-9)
  {
    startFrame: 1948,
    highlightLines: { startLine: 8, endLine: 8 },
    visibleLines: 10,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "error" },
        { id: "n7", value: 7, highlight: "error" },
        { id: "n9", value: 9, highlight: "error" },
        { id: "n5", value: 5, highlight: "error" },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "return false — value 4 not found",
      searchTarget: 4,
    },
  },

  // ─── Phase 4: COMPLEXITY ──────────────────────────────────────────────
  {
    startFrame: 2163,
    highlightLines: { startLine: 0, endLine: 9 },
    visibleLines: 10,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9, highlight: "active" },
        { id: "n5", value: 5, highlight: "active" },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Time Complexity: O(n)",
    },
  },

  // ─── Phase 5: CTA ─────────────────────────────────────────────────────
  {
    startFrame: 2420,
    highlightLines: { startLine: 0, endLine: 9 },
    visibleLines: 10,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "found" },
        { id: "n7", value: 7, highlight: "found" },
        { id: "n9", value: 9, highlight: "found" },
        { id: "n5", value: 5, highlight: "found" },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },
];

export const SEARCH_NODE_SCENE_FRAMES = 2622;

const FOUND_FRAME = 983;
const ERROR_FRAME = 1948;

const FoundFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 4, 12], [0, 0.25, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at center, rgba(33,150,243,0.5) 0%, transparent 70%)",
        opacity,
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
};

const CameraShake: React.FC<{ triggerFrame: number; duration: number; children: React.ReactNode }> = ({ triggerFrame, duration, children }) => {
  const frame = useCurrentFrame();
  const localF = frame - triggerFrame;
  const active = localF >= 0 && localF < duration;
  const intensity = active ? interpolate(localF, [0, duration], [4, 0], { extrapolateRight: "clamp" }) : 0;
  const x = intensity > 0.1 ? Math.sin(localF * 2.5) * intensity : 0;
  const y = intensity > 0.1 ? Math.cos(localF * 3.2) * intensity * 0.5 : 0;
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

const ErrorVignette: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5, 18], [0, 0.35, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(192,57,43,0.6) 100%)",
        opacity,
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
};

const PHASE_BREAK_FRAME = 1170;

const PhaseBreath: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, 45, 60], [0, 0.6, 0.6, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        background: "#000",
        opacity,
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
};

const COMPLEXITY_FRAME = 2163;

const ComplexityCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const nodeCount = 4;
  const stagger = 18;

  const count = Math.min(nodeCount, Math.floor(frame / stagger) + 1);
  const allDone = frame >= stagger * nodeCount;

  const labelOpacity = allDone
    ? interpolate(frame - stagger * nodeCount, [0, 12], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {Array.from({ length: nodeCount }).map((_, i) => {
          const visible = i < count;
          return (
            <div
              key={i}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: visible ? "rgba(21,101,192,0.5)" : "rgba(255,255,255,0.08)",
                border: `2px solid ${visible ? "rgba(21,101,192,0.8)" : "rgba(255,255,255,0.15)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.mono,
                fontSize: 16,
                fontWeight: 700,
                color: visible ? "#fff" : "transparent",
                boxShadow: visible ? "0 0 10px rgba(21,101,192,0.4)" : "none",
                transform: `scale(${visible ? 1 : 0.7})`,
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 20,
          fontWeight: 600,
          color: "#cdd6f4",
          opacity: labelOpacity,
          letterSpacing: 0.5,
        }}
      >
        Worst case: <span style={{ color: "#1565C0", fontWeight: 800 }}>n</span> checks
      </div>
    </div>
  );
};

const REEL_SAFE: SafeArea = { top: 190, bottom: 380, left: 60, right: 160 };

export interface SearchNodeProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

export const SearchNode: React.FC<SearchNodeProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel";
  const isAnim = format === "reel-anim";
  const activeSteps = isAnim ? compressStepsForAnim(steps) : steps;

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;

  const diagramAreaW = isAnim ? width : isReel ? safeW : width * 0.62;
  const diagramAreaH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * STACKED_TOP_RATIO) : height;
  const nodeScale = isAnim ? 1.4 : isReel ? 1.2 : 1;
  const codeFontSize = isReel ? 30 : 24;

  const diagram = (
    <LinkedListDiagram
      steps={activeSteps}
      areaWidth={diagramAreaW}
      areaHeight={diagramAreaH}
      nodeScale={nodeScale}
      verticalOffset={isReel || isAnim ? 60 : 0}
    />
  );

  const code = (
    <CodeWindow title="LinkedList.java" hideTitle={isReel}>
      <CodeBlock
        tokens={tokens}
        steps={activeSteps}
        fontSize={codeFontSize}
        centered={isReel}
        centerWidth={isReel ? safeW : undefined}
      />
    </CodeWindow>
  );

  return (
    <>
      <CameraShake triggerFrame={ERROR_FRAME} duration={14}>
        {isAnim ? (
          <AnimationOnlyLayout>{diagram}</AnimationOnlyLayout>
        ) : isReel ? (
          <StackedLayout top={diagram} bottom={code} safeArea={REEL_SAFE} />
        ) : (
          <SplitLayout left={diagram} right={code} />
        )}
      </CameraShake>

      <Sequence from={FOUND_FRAME} durationInFrames={15}>
        <FoundFlash />
      </Sequence>
      <Sequence from={PHASE_BREAK_FRAME} durationInFrames={65}>
        <PhaseBreath />
      </Sequence>
      <Sequence from={ERROR_FRAME} durationInFrames={20}>
        <ErrorVignette />
      </Sequence>
      <Sequence from={COMPLEXITY_FRAME} durationInFrames={120}>
        <ComplexityCounter />
      </Sequence>

      <AmbientLayer animOnly={isAnim} />
      <SfxLayer steps={activeSteps} duckVolume={0.5} animOnly={isAnim} />
      {!isAnim && <NarrationLayer sceneId="search-node" steps={activeSteps} />}
    </>
  );
};
