import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { SceneStep, PointerData } from "../lib/types";
import { useStepTransition } from "../lib/useStepTransition";
import { spacing, colors, fonts, springPresets } from "../lib/theme";
import { NodeBox } from "./NodeBox";
import { Arrow } from "./Arrow";
import { Pointer } from "./Pointer";

interface LinkedListDiagramProps {
  steps: SceneStep[];
  areaWidth?: number;
  areaHeight?: number;
  nodeScale?: number;
  verticalOffset?: number;
}

const MAX_NODES_FOR_NULL = 5;
const DEFAULT_AREA_WIDTH = 1920 * 0.55;
const DEFAULT_AREA_HEIGHT = 1080;

interface LayoutInfo {
  nodeW: number;
  nodeH: number;
  gap: number;
  startX: number;
  y: number;
  showNullBox: boolean;  // full dashed NodeBox for null
  showNullText: boolean; // compact "null" text label when no room for full box
  totalSlots: number;
}

// Space reserved on the right when showing null as compact text (arrow + label)
const NULL_TEXT_RESERVE = 100;

function computeLayout(nodeCount: number, areaWidth: number, areaHeight: number, nodeScale: number): LayoutInfo {
  const showNull = nodeCount <= MAX_NODES_FOR_NULL;
  const pad = spacing.diagramPadding;

  const baseW = spacing.nodeWidth * nodeScale;
  const baseH = spacing.nodeHeight * nodeScale;

  const maxGap = 220;
  const minArrowLen = 40;
  const minGap = baseW + minArrowLen;

  // Check if the null box fits as a full extra slot with proper spacing
  const fitGapWithNull = nodeCount > 0 ? (areaWidth - pad - baseW) / nodeCount : maxGap;
  const showNullBox = showNull && fitGapWithNull >= minGap;
  const showNullText = showNull && !showNullBox;

  // When showing null as text, shrink the usable area so nodes don't crowd the right edge
  const effectiveAreaW = showNullText ? areaWidth - NULL_TEXT_RESERVE : areaWidth;
  const effectiveUsable = effectiveAreaW - pad * 2;

  const totalSlots = showNullBox ? nodeCount + 1 : nodeCount;

  // Cap maxGap so nodes fit within effectiveAreaW, allow slightly shorter arrows when tight
  const effectiveMaxGap = (showNullText && totalSlots > 1)
    ? Math.min(maxGap, (effectiveAreaW - pad - baseW) / (totalSlots - 1))
    : maxGap;
  const effectiveMinGap = showNullText ? baseW + 20 : minGap;

  let gap: number;
  if (totalSlots <= 1) {
    gap = effectiveMaxGap;
  } else {
    gap = Math.min(effectiveMaxGap, Math.max(effectiveMinGap, effectiveUsable / (totalSlots - 1)));
  }

  const totalWidth = totalSlots <= 1 ? baseW : (totalSlots - 1) * gap + baseW;
  const startX = Math.max(pad, (effectiveAreaW - totalWidth) / 2);
  const y = areaHeight / 2 - baseH / 2;

  return { nodeW: baseW, nodeH: baseH, gap, startX, y, showNullBox, showNullText, totalSlots };
}

function getNodePos(index: number, layout: LayoutInfo) {
  return {
    x: layout.startX + index * layout.gap,
    y: layout.y,
  };
}

function computePointerStacks(pointers: PointerData[]): Map<string, number> {
  const stacks = new Map<string, number>();
  const targetCounts = new Map<string | null, number>();
  for (const ptr of pointers) {
    if (!ptr.targetNodeId) continue;
    const count = targetCounts.get(ptr.targetNodeId) || 0;
    stacks.set(ptr.label, count);
    targetCounts.set(ptr.targetNodeId, count + 1);
  }
  return stacks;
}

export const LinkedListDiagram: React.FC<LinkedListDiagramProps> = ({
  steps,
  areaWidth = DEFAULT_AREA_WIDTH,
  areaHeight = DEFAULT_AREA_HEIGHT,
  nodeScale = 1,
  verticalOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { current, previous, t, localFrame } = useStepTransition(steps);

  const { snapshot } = current;
  const prevSnapshot = previous.snapshot;
  const nodes = snapshot.nodes;
  const prevNodes = prevSnapshot.nodes;

  const rawLayout = computeLayout(nodes.length, areaWidth, areaHeight, nodeScale);
  const layout = { ...rawLayout, y: rawLayout.y + verticalOffset };
  const rawPrevLayout = computeLayout(prevNodes.length, areaWidth, areaHeight, nodeScale);
  const prevLayout = { ...rawPrevLayout, y: rawPrevLayout.y + verticalOffset };

  const pointerStacks = computePointerStacks(snapshot.pointers);

  const departingNodes = prevNodes.filter(
    (pn) => !nodes.find((n) => n.id === pn.id) && pn.highlight === "removing",
  );
  const departingNodeIds = new Set(departingNodes.map((n) => n.id));
  const hasRemovingExit = departingNodes.length > 0;

  const departingArrows = hasRemovingExit
    ? prevSnapshot.arrows.filter(
        (pa) =>
          !snapshot.arrows.find((a) => a.from === pa.from && a.to === pa.to) &&
          (departingNodeIds.has(pa.from) || departingNodeIds.has(pa.to)),
      )
    : [];

  const departingPointers = hasRemovingExit
    ? prevSnapshot.pointers.filter(
        (pp) => !snapshot.pointers.find((p) => p.label === pp.label),
      )
    : [];

  const exitP = hasRemovingExit
    ? spring({ frame: localFrame, fps, config: springPresets.exit })
    : 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {snapshot.searchTarget !== undefined && (
        <SearchTargetBadge
          target={snapshot.searchTarget}
          prevTarget={prevSnapshot.searchTarget}
          localFrame={localFrame}
        />
      )}

      {snapshot.arrows.map((arrow, i) => {
        const fromIdx = nodes.findIndex((n) => n.id === arrow.from);
        const toIdx = nodes.findIndex((n) => n.id === arrow.to);
        if (fromIdx < 0 || toIdx < 0) return null;
        const fromPos = getNodePos(fromIdx, layout);
        const toPos = getNodePos(toIdx, layout);
        return (
          <Arrow
            key={`${arrow.from}-${arrow.to}`}
            fromX={fromPos.x + layout.nodeW}
            fromY={fromPos.y + layout.nodeH / 2}
            toX={toPos.x}
            toY={toPos.y + layout.nodeH / 2}
            dashed={arrow.dashed}
            highlight={arrow.highlight}
            delay={i * 2}
          />
        );
      })}

      {departingArrows.map((arrow) => {
        const fromIdx = prevNodes.findIndex((n) => n.id === arrow.from);
        const toIdx = prevNodes.findIndex((n) => n.id === arrow.to);
        if (fromIdx < 0 || toIdx < 0) return null;
        const fromPos = getNodePos(fromIdx, prevLayout);
        const toPos = getNodePos(toIdx, prevLayout);
        return (
          <Arrow
            key={`exit-${arrow.from}-${arrow.to}`}
            fromX={fromPos.x + prevLayout.nodeW}
            fromY={fromPos.y + prevLayout.nodeH / 2}
            toX={toPos.x}
            toY={toPos.y + prevLayout.nodeH / 2}
            opacity={1 - exitP}
            delay={0}
          />
        );
      })}

      {nodes.map((node, i) => {
        const currPos = getNodePos(i, layout);
        let finalX = node.x ?? currPos.x;
        let finalY = node.y ?? currPos.y;

        const prevIdx = prevNodes.findIndex((n) => n.id === node.id);
        if (prevIdx >= 0) {
          const prevPos = getNodePos(prevIdx, prevLayout);
          const prevNodeData = prevNodes[prevIdx];
          const pX = prevNodeData.x ?? prevPos.x;
          const pY = prevNodeData.y ?? prevPos.y;
          finalX = interpolate(t, [0, 1], [pX, finalX]);
          finalY = interpolate(t, [0, 1], [pY, finalY]);
        }

        return (
          <NodeBox
            key={node.id}
            value={node.value}
            highlight={node.highlight || "none"}
            x={finalX}
            y={finalY}
            w={layout.nodeW}
            h={layout.nodeH}
            delay={i * 3}
            localStepFrame={localFrame}
          />
        );
      })}

      {departingNodes.map((node) => {
        const prevIdx = prevNodes.findIndex((n) => n.id === node.id);
        const prevPos = getNodePos(prevIdx, prevLayout);
        return (
          <NodeBox
            key={`exit-${node.id}`}
            value={node.value}
            highlight={node.highlight || "removing"}
            x={prevPos.x}
            y={prevPos.y}
            w={prevLayout.nodeW}
            h={prevLayout.nodeH}
            delay={0}
            exitProgress={exitP}
          />
        );
      })}

      {snapshot.newNode &&
        (() => {
          const firstNodePos = nodes.length > 0 ? getNodePos(0, layout) : { x: layout.startX, y: layout.y };
          const targetX = snapshot.newNode.x ?? firstNodePos.x;
          const targetY = snapshot.newNode.y ?? layout.y - layout.nodeH - 50;
          const dropP = spring({
            frame: localFrame,
            fps,
            delay: 5,
            config: springPresets.enter,
          });
          const startY = targetY - 80;
          const ny = interpolate(dropP, [0, 1], [startY, targetY]);
          return (
            <NodeBox
              value={snapshot.newNode.value}
              highlight={snapshot.newNode.highlight || "new"}
              x={targetX}
              y={ny}
              w={layout.nodeW}
              h={layout.nodeH}
              delay={0}
              localStepFrame={localFrame}
            />
          );
        })()}

      {layout.showNullBox && nodes.length > 0 && (() => {
        const lastIdx = nodes.length - 1;
        const lastPos = getNodePos(lastIdx, layout);
        const nullPos = getNodePos(nodes.length, layout);
        return (
          <>
            <Arrow
              fromX={lastPos.x + layout.nodeW}
              fromY={lastPos.y + layout.nodeH / 2}
              toX={nullPos.x}
              toY={nullPos.y + layout.nodeH / 2}
              delay={(lastIdx + 1) * 2}
            />
            <NodeBox
              value="null"
              x={nullPos.x}
              y={nullPos.y}
              w={layout.nodeW}
              h={layout.nodeH}
              isNull
              delay={(lastIdx + 1) * 3}
            />
          </>
        );
      })()}

      {layout.showNullText && nodes.length > 0 && (() => {
        const lastIdx = nodes.length - 1;
        const lastPos = getNodePos(lastIdx, layout);
        const arrowLen = 40;
        const midY = lastPos.y + layout.nodeH / 2;
        const textX = lastPos.x + layout.nodeW + arrowLen + 6;
        return (
          <>
            <Arrow
              fromX={lastPos.x + layout.nodeW}
              fromY={midY}
              toX={lastPos.x + layout.nodeW + arrowLen}
              toY={midY}
              delay={(lastIdx + 1) * 2}
            />
            <div
              style={{
                position: "absolute",
                left: textX,
                top: lastPos.y,
                height: layout.nodeH,
                display: "flex",
                alignItems: "center",
                fontFamily: fonts.mono,
                fontSize: Math.max(13, layout.nodeH * 0.28),
                fontWeight: 700,
                color: colors.nullNode,
                opacity: 0.85,
                letterSpacing: 0.5,
                pointerEvents: "none",
              }}
            >
              null
            </div>
          </>
        );
      })()}

      {snapshot.pointers.map((ptr, i) => {
        const currNodeIdx = nodes.findIndex((n) => n.id === ptr.targetNodeId);
        if (currNodeIdx < 0) return null;

        const currPos = getNodePos(currNodeIdx, layout);
        let ptrX = currPos.x + layout.nodeW / 2;

        const prevPtr = prevSnapshot.pointers.find((p) => p.label === ptr.label);
        if (prevPtr?.targetNodeId) {
          const prevNodeIdx = prevNodes.findIndex((n) => n.id === prevPtr.targetNodeId);
          if (prevNodeIdx >= 0) {
            const prevPos = getNodePos(prevNodeIdx, prevLayout);
            const prevX = prevPos.x + prevLayout.nodeW / 2;
            ptrX = interpolate(t, [0, 1], [prevX, ptrX]);
          }
        }

        const stackIdx = pointerStacks.get(ptr.label) || 0;

        return (
          <Pointer
            key={ptr.label}
            label={ptr.label}
            x={ptrX}
            y={currPos.y}
            color={ptr.color || colors.lavender}
            delay={prevPtr ? 0 : i * 3 + 5}
            stackIndex={stackIdx}
            scale={nodeScale}
          />
        );
      })}

      {(() => {
        const cmp = parseComparison(snapshot.caption);
        if (!cmp) return null;
        const activeIdx = nodes.findIndex((n) => n.highlight === "active" || n.highlight === "found");
        if (activeIdx < 0) return null;
        const pos = getNodePos(activeIdx, layout);
        return (
          <ComparisonBadge
            comparison={cmp}
            x={pos.x + layout.nodeW / 2}
            y={pos.y}
            nodeH={layout.nodeH}
            localFrame={localFrame}
          />
        );
      })()}

      <CaptionCrossfade
        currentCaption={snapshot.caption}
        previousCaption={prevSnapshot.caption}
        localFrame={localFrame}
      />

      {departingPointers.map((ptr) => {
        const targetNodeId = ptr.targetNodeId;
        if (!targetNodeId) return null;
        const prevNodeIdx = prevNodes.findIndex((n) => n.id === targetNodeId);
        if (prevNodeIdx < 0) return null;

        const currNodeIdx = nodes.findIndex((n) => n.id === targetNodeId);
        let ptrX: number;
        let ptrY: number;
        if (currNodeIdx >= 0) {
          const currPos = getNodePos(currNodeIdx, layout);
          const prevPos = getNodePos(prevNodeIdx, prevLayout);
          ptrX = interpolate(t, [0, 1], [
            prevPos.x + prevLayout.nodeW / 2,
            currPos.x + layout.nodeW / 2,
          ]);
          ptrY = interpolate(t, [0, 1], [prevPos.y, currPos.y]);
        } else {
          const prevPos = getNodePos(prevNodeIdx, prevLayout);
          ptrX = prevPos.x + prevLayout.nodeW / 2;
          ptrY = prevPos.y;
        }

        return (
          <Pointer
            key={`exit-${ptr.label}`}
            label={ptr.label}
            x={ptrX}
            y={ptrY}
            color={ptr.color || colors.lavender}
            delay={0}
            stackIndex={0}
            scale={nodeScale}
            exitProgress={exitP}
          />
        );
      })}

    </div>
  );
};

const SearchTargetBadge: React.FC<{
  target: number | string;
  prevTarget?: number | string;
  localFrame: number;
}> = ({ target, prevTarget, localFrame }) => {
  const { fps } = useVideoConfig();
  const isNew = prevTarget !== target;
  const p = isNew
    ? spring({ frame: localFrame, fps, delay: 3, config: springPresets.enter })
    : 1;
  const scale = interpolate(p, [0, 0.5, 1], [0.6, 1.06, 1]);
  const opacity = interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        top: 36,
        left: 20,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: fonts.sans,
        fontSize: 17,
        fontWeight: 600,
        color: "#cdd6f4",
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: 10,
        padding: "8px 18px",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 0 12px rgba(0,0,0,0.2)",
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        pointerEvents: "none",
        letterSpacing: 0.3,
      }}
    >
      <span style={{ color: "#a6adc8", fontWeight: 400 }}>target</span>
      <span
        style={{
          fontFamily: fonts.mono,
          fontSize: 22,
          fontWeight: 800,
          color: "#f9e2af",
          textShadow: "0 0 8px rgba(249,226,175,0.4)",
        }}
      >
        {target}
      </span>
    </div>
  );
};

function parseComparison(caption?: string): { left: string; right: string; match: boolean } | null {
  if (!caption) return null;
  const m = caption.match(/curr\.val\((\d+)\)\s*(==|≠|!=)\s*(\d+)/);
  if (!m) return null;
  return { left: m[1], right: m[3], match: m[2] === "==" };
}

const ComparisonBadge: React.FC<{
  comparison: { left: string; right: string; match: boolean };
  x: number;
  y: number;
  nodeH: number;
  localFrame: number;
}> = ({ comparison, x, y, nodeH, localFrame }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: localFrame, fps, delay: 4, config: springPresets.emphasis });
  const scale = interpolate(p, [0, 0.5, 1], [0.4, 1.08, 1]);
  const opacity = interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  const isMatch = comparison.match;
  const bg = isMatch ? "rgba(21, 101, 192, 0.30)" : "rgba(192, 57, 43, 0.30)";
  const border = isMatch ? "rgba(21, 101, 192, 0.7)" : "rgba(192, 57, 43, 0.7)";
  const glow = isMatch ? "0 0 12px rgba(21,101,192,0.5)" : "0 0 12px rgba(192,57,43,0.5)";
  const textColor = isMatch ? "#5b9bd5" : "#ffffff";
  const symbol = isMatch ? "==" : "≠";
  const suffix = isMatch ? " ✓" : "";

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + nodeH + 14,
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: "center top",
        opacity,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: fonts.mono,
        fontSize: 18,
        fontWeight: 700,
        color: textColor,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 20,
        padding: "4px 14px",
        boxShadow: glow,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {comparison.left} {symbol} {comparison.right}{suffix}
    </div>
  );
};

const CaptionCrossfade: React.FC<{
  currentCaption?: string;
  previousCaption?: string;
  localFrame: number;
}> = ({ currentCaption, previousCaption, localFrame }) => {
  const changed = previousCaption !== currentCaption;

  const outOpacity = changed
    ? interpolate(localFrame, [0, 6], [1, 0], { extrapolateRight: "clamp" })
    : 0;

  const inOpacity = changed
    ? interpolate(localFrame, [6, 16], [0, 1], { extrapolateRight: "clamp" })
    : 1;

  const inY = changed
    ? interpolate(localFrame, [6, 16], [6, 0], { extrapolateRight: "clamp" })
    : 0;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
  };

  const pillStyle: React.CSSProperties = {
    fontFamily: fonts.sans,
    fontSize: 22,
    color: colors.subtext0,
    letterSpacing: 0.3,
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 30,
    padding: "8px 24px",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

  return (
    <>
      {changed && previousCaption && (
        <div style={{ ...baseStyle, opacity: outOpacity }}>
          <span style={pillStyle}>{previousCaption}</span>
        </div>
      )}
      {currentCaption && (
        <div style={{ ...baseStyle, opacity: inOpacity, transform: `translateY(${inY}px)` }}>
          <span style={pillStyle}>{currentCaption}</span>
        </div>
      )}
    </>
  );
};
