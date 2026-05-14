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
}

const DEFAULT_AREA_WIDTH  = 1920 * 0.55;
const DEFAULT_AREA_HEIGHT = 1080;

export const TreeDiagram: React.FC<TreeDiagramProps> = ({
  steps,
  positionMap,
  areaWidth   = DEFAULT_AREA_WIDTH,
  areaHeight  = DEFAULT_AREA_HEIGHT,
  nodeScale   = 1,
  ringNodeIds = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { current, previous, t, localFrame } = useStepTransition(steps);

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

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
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
  );
};
