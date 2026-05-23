import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneStep } from "../lib/types";
import { useStepTransition } from "../lib/useStepTransition";
import { Arrow } from "./Arrow";
import { TreeNodeCircle } from "./TreeNodeCircle";
import { spacing } from "../lib/theme";

interface Position {
  x: number;
  y: number;
}

interface TreeDiagramProps {
  steps: SceneStep[];
  positionMap: Record<string, Position>;
  areaWidth?: number;
  areaHeight?: number;
  nodeScale?: number;
  ringNodeIds?: string[];
  transitionStyle?: "none" | "gravity" | "blob" | "flip";
}

const DEFAULT_AREA_WIDTH  = 1920 * 0.55;
const DEFAULT_AREA_HEIGHT = 1080;

export const TreeDiagram: React.FC<TreeDiagramProps> = ({
  steps,
  positionMap,
  areaWidth         = DEFAULT_AREA_WIDTH,
  areaHeight        = DEFAULT_AREA_HEIGHT,
  nodeScale         = 1,
  ringNodeIds      = [],
  transitionStyle  = "none" as "none" | "gravity" | "blob" | "flip",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { current, previous, t, localFrame, stepIndex } = useStepTransition(steps);

  const nodeSize = spacing.nodeHeight * 1.18 * nodeScale;
  const radius   = nodeSize / 2;
  const snapshot     = current.snapshot;
  const prevSnapshot = previous.snapshot;

  const prevHighlightMap = new Map(
    prevSnapshot.nodes.map((n) => [n.id, n.highlight ?? "none"] as const)
  );

  const anyHighlighted     = snapshot.arrows.some((a) => a.highlight);
  const prevAnyHighlighted = prevSnapshot.arrows.some((a) => a.highlight);
  const arrowDimT = interpolate(t, [0, 1], [
    prevAnyHighlighted ? 1 : 0,
    anyHighlighted     ? 1 : 0,
  ]);

  const isNodeHighlighted = (h?: string) =>
    h === "active" || h === "found" || h === "new" || h === "removing" || h === "error";
  const anyNodeHighlighted     = snapshot.nodes.some((n) => isNodeHighlighted(n.highlight));
  const prevAnyNodeHighlighted = prevSnapshot.nodes.some((n) => isNodeHighlighted(n.highlight));
  const nodeDimT = interpolate(t, [0, 1], [
    prevAnyNodeHighlighted ? 1 : 0,
    anyNodeHighlighted     ? 1 : 0,
  ]);

  // ── Shared: only animate when edge topology changes (not on highlight-only steps) ──
  const edgesChanged = (() => {
    if (prevSnapshot.arrows.length !== snapshot.arrows.length) return true;
    const prevEdges = new Set(prevSnapshot.arrows.map((a) => `${a.from}-${a.to}`));
    return snapshot.arrows.some((a) => !prevEdges.has(`${a.from}-${a.to}`));
  })();

  // ── Gravity transition ───────────────────────────────────────────────────
  const GRAVITY_FRAMES = 22;
  const inGravity = transitionStyle === "gravity" && stepIndex > 0 && edgesChanged && localFrame < GRAVITY_FRAMES;
  const gProgress = localFrame / GRAVITY_FRAMES;

  const fallOffsetY = gProgress * gProgress * 980;
  const fallOpacity = 1 - gProgress;
  const rainOffsetY = -(1 - gProgress) * (1 - gProgress) * 720;
  const rainOpacity = gProgress;

  // ── Liquid blob merge transition ─────────────────────────────────────────

  const BLOB_FRAMES  = 32;
  const inBlob       = transitionStyle === "blob" && stepIndex > 0 && edgesChanged && localFrame < BLOB_FRAMES;
  const blobPhase    = Math.min(localFrame / BLOB_FRAMES, 1);
  // Triangle wave 0→1→0 — peaks at midpoint when swap happens (max blur hides the cut)
  const blobT        = blobPhase < 0.5 ? blobPhase * 2 : (1 - blobPhase) * 2;
  const blurPx       = blobT * 30;
  const blobScale    = 1 - blobT * 0.72;         // 1.0 → 0.28 → 1.0
  const blobBright   = 1 + blobT * 0.7;          // glow intensifies at peak
  // Show previous state collapsing in, current state expanding out
  const blobSnap     = inBlob && blobPhase < 0.5 ? prevSnapshot : snapshot;

  // ── 3D card flip transition ──────────────────────────────────────────────
  // First half: old tree rotates 0→90° (easeIn). At 90° the card is edge-on — swap.
  // Second half: new tree rotates -90→0° (easeOut) into view.
  const FLIP_FRAMES = 28;
  const inFlip      = transitionStyle === "flip" && stepIndex > 0 && edgesChanged && localFrame < FLIP_FRAMES;
  const flipPhase   = Math.min(localFrame / FLIP_FRAMES, 1);
  const flipSnap    = inFlip && flipPhase < 0.5 ? prevSnapshot : snapshot;

  let rotateYDeg = 0;
  if (inFlip) {
    if (flipPhase < 0.5) {
      const t = flipPhase * 2;
      rotateYDeg = t * t * 90;                        // easeIn  0 → 90
    } else {
      const t = (flipPhase - 0.5) * 2;
      rotateYDeg = -90 + (1 - (1 - t) * (1 - t)) * 90; // easeOut -90 → 0
    }
  }

  const getCenter = (nodeId: string) => {
    const pos = positionMap[nodeId];
    if (!pos) return { x: areaWidth / 2, y: areaHeight / 2 };
    return { x: pos.x * areaWidth, y: pos.y * areaHeight };
  };

  // Mirror the idle wiggle from TreeNodeCircle so arrows follow live node positions.
  // delay = nodeIndex * 3, phase = delay * 0.9  (same constants as TreeNodeCircle)
  const getNodeWiggleY = (nodeId: string): number => {
    const idx = snapshot.nodes.findIndex((n) => n.id === nodeId);
    if (idx < 0) return 0;
    const phase = idx * 3 * 0.9;
    return Math.sin(frame * 0.055 + phase) * 10;
  };

  const getWiggledCenter = (nodeId: string) => {
    const c = getCenter(nodeId);
    return { x: c.x, y: c.y + getNodeWiggleY(nodeId) };
  };

  const getCircleTopLeft = (nodeId: string) => {
    const c = getCenter(nodeId);
    return { x: c.x - radius, y: c.y - radius };
  };

  const getEdgeEndpoints = (fromId: string, toId: string) => {
    const from = getWiggledCenter(fromId);
    const to   = getWiggledCenter(toId);
    const dx   = to.x - from.x;
    const dy   = to.y - from.y;
    const len  = Math.hypot(dx, dy) || 1;
    const ux   = dx / len;
    const uy   = dy / len;
    const edgeOffset = radius + 2;
    // Rubber bend: when connected nodes are at different wiggle heights, arc the edge sideways
    const bend = (getNodeWiggleY(fromId) - getNodeWiggleY(toId)) * 0.5;
    return {
      fromX: from.x + ux * edgeOffset,
      fromY: from.y + uy * edgeOffset,
      toX:   to.x   - ux * edgeOffset,
      toY:   to.y   - uy * edgeOffset,
      bend,
    };
  };

  // ── Flip render ─────────────────────────────────────────────────────────
  if (inFlip) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          perspective: "1200px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `rotateY(${rotateYDeg}deg)`,
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            willChange: "transform",
          }}
        >
          {flipSnap.arrows.map((arrow) => {
            if (!positionMap[arrow.from] || !positionMap[arrow.to]) return null;
            const edge = getEdgeEndpoints(arrow.from, arrow.to);
            return (
              <Arrow
                key={`flip-${arrow.from}-${arrow.to}`}
                fromX={edge.fromX}
                fromY={edge.fromY}
                toX={edge.toX}
                toY={edge.toY}
                highlight={!!arrow.highlight}
                dashed={!!arrow.dashed}
                color={arrow.color}
                delay={0}
                opacity={1}
                bend={edge.bend}
              />
            );
          })}
          {flipSnap.nodes.map((node) => {
            const rect = getCircleTopLeft(node.id);
            return (
              <TreeNodeCircle
                key={`flip-${node.id}`}
                value={node.value}
                highlight={node.highlight ?? "none"}
                prevHighlight={node.highlight ?? "none"}
                transitionT={1}
                nodeDimT={0}
                x={rect.x}
                y={rect.y}
                size={nodeSize}
                delay={0}
                localStepFrame={0}
                showRing={ringNodeIds.includes(node.id)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // ── Blob render ─────────────────────────────────────────────────────────
  if (inBlob) {
    return (
      <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${blobScale})`,
            filter: `blur(${blurPx}px) brightness(${blobBright})`,
            transformOrigin: "center center",
            willChange: "transform, filter",
          }}
        >
          {blobSnap.arrows.map((arrow) => {
            if (!positionMap[arrow.from] || !positionMap[arrow.to]) return null;
            const edge = getEdgeEndpoints(arrow.from, arrow.to);
            return (
              <Arrow
                key={`blob-${arrow.from}-${arrow.to}`}
                fromX={edge.fromX}
                fromY={edge.fromY}
                toX={edge.toX}
                toY={edge.toY}
                highlight={!!arrow.highlight}
                dashed={!!arrow.dashed}
                color={arrow.color}
                delay={0}
                opacity={1}
                bend={edge.bend}
              />
            );
          })}
          {blobSnap.nodes.map((node) => {
            const rect = getCircleTopLeft(node.id);
            return (
              <TreeNodeCircle
                key={`blob-${node.id}`}
                value={node.value}
                highlight={node.highlight ?? "none"}
                prevHighlight={node.highlight ?? "none"}
                transitionT={1}
                nodeDimT={0}
                x={rect.x}
                y={rect.y}
                size={nodeSize}
                delay={0}
                localStepFrame={0}
                showRing={ringNodeIds.includes(node.id)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Gravity fall layer: previous snapshot drops off screen ────────── */}
      {inGravity && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateY(${fallOffsetY}px)`,
            opacity: fallOpacity,
            pointerEvents: "none",
            willChange: "transform, opacity",
          }}
        >
          {prevSnapshot.arrows.map((arrow, index) => {
            if (!positionMap[arrow.from] || !positionMap[arrow.to]) return null;
            const edge = getEdgeEndpoints(arrow.from, arrow.to);
            return (
              <Arrow
                key={`fall-${arrow.from}-${arrow.to}`}
                fromX={edge.fromX}
                fromY={edge.fromY}
                toX={edge.toX}
                toY={edge.toY}
                highlight={!!arrow.highlight}
                dashed={!!arrow.dashed}
                color={arrow.color}
                delay={0}
                opacity={1}
                bend={edge.bend}
              />
            );
          })}
          {prevSnapshot.nodes.map((node) => {
            const rect = getCircleTopLeft(node.id);
            return (
              <TreeNodeCircle
                key={`fall-${node.id}`}
                value={node.value}
                highlight={node.highlight ?? "none"}
                prevHighlight={node.highlight ?? "none"}
                transitionT={1}
                nodeDimT={0}
                x={rect.x}
                y={rect.y}
                size={nodeSize}
                delay={0}
                localStepFrame={0}
                showRing={ringNodeIds.includes(node.id)}
              />
            );
          })}
        </div>
      )}

      {/* ── Rain-in layer: current snapshot descends from above ───────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...(inGravity ? {
            transform: `translateY(${rainOffsetY}px)`,
            opacity: rainOpacity,
            willChange: "transform, opacity",
          } : {}),
        }}
      >
        {snapshot.arrows.map((arrow, index) => {
          const edge = getEdgeEndpoints(arrow.from, arrow.to);
          const isHighlighted = !!arrow.highlight;
          const arrowOpacity  = arrowDimT > 0 && !isHighlighted
            ? interpolate(arrowDimT, [0, 1], [1, 0.25])
            : 1;

          return (
            <Arrow
              key={`${arrow.from}-${arrow.to}`}
              fromX={edge.fromX}
              fromY={edge.fromY}
              toX={edge.toX}
              toY={edge.toY}
              highlight={isHighlighted}
              dashed={!!arrow.dashed}
              color={arrow.color}
              delay={index * 2}
              opacity={arrowOpacity}
              bend={edge.bend}
            />
          );
        })}

        {snapshot.nodes.map((node, index) => {
          const rect          = getCircleTopLeft(node.id);
          const prevHighlight = prevHighlightMap.get(node.id) ?? "none";

          return (
            <TreeNodeCircle
              key={node.id}
              value={node.value}
              highlight={node.highlight ?? "none"}
              prevHighlight={prevHighlight}
              transitionT={t}
              nodeDimT={nodeDimT}
              x={rect.x}
              y={rect.y}
              size={nodeSize}
              delay={index * 3}
              localStepFrame={localFrame}
              showRing={ringNodeIds.includes(node.id)}
            />
          );
        })}
      </div>
    </div>
  );
};
