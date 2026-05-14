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
  // Extra pixels added to the vertical position of the node row. The diagram
  // normally centers the node box inside `areaHeight`, but that leaves the
  // pointer labels — which always sit ABOVE the nodes — visually biased
  // toward the top of the panel. A positive value shifts the whole row down,
  // which is useful for reel/portrait layouts where the diagram panel is
  // short and the pointer stack can otherwise look glued to the top edge.
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

function computeLayout(
  nodeCount: number,
  areaWidth: number,
  areaHeight: number,
  nodeScale: number,
  verticalOffset: number,
): LayoutInfo {
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

  // Cap maxGap so nodes always fit within effectiveAreaW — required for layouts
  // with more than MAX_NODES_FOR_NULL nodes, otherwise they overflow the panel.
  const fitCap =
    totalSlots > 1
      ? Math.max(0, (effectiveAreaW - pad * 2 - baseW) / (totalSlots - 1))
      : maxGap;
  const effectiveMaxGap = Math.min(maxGap, fitCap);
  const effectiveMinGap = showNullText ? baseW + 20 : minGap;

  let gap: number;
  if (totalSlots <= 1) {
    gap = effectiveMaxGap;
  } else {
    gap = Math.min(effectiveMaxGap, Math.max(effectiveMinGap, effectiveUsable / (totalSlots - 1)));
  }

  const totalWidth = totalSlots <= 1 ? baseW : (totalSlots - 1) * gap + baseW;
  const startX = Math.max(pad, (effectiveAreaW - totalWidth) / 2);
  const y = areaHeight / 2 - baseH / 2 + verticalOffset;

  return { nodeW: baseW, nodeH: baseH, gap, startX, y, showNullBox, showNullText, totalSlots };
}

function getNodePos(index: number, layout: LayoutInfo) {
  return {
    x: layout.startX + index * layout.gap,
    y: layout.y,
  };
}

const pointerKey = (p: PointerData): string => p.id ?? p.label;

function computePointerStacks(pointers: PointerData[]): Map<string, number> {
  const stacks = new Map<string, number>();
  const targetCounts = new Map<string | null, number>();
  for (const ptr of pointers) {
    const target = ptr.targetNodeId ?? "__null__";
    const count = targetCounts.get(target) || 0;
    stacks.set(pointerKey(ptr), count);
    targetCounts.set(target, count + 1);
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

  const layout = computeLayout(nodes.length, areaWidth, areaHeight, nodeScale, verticalOffset);
  const prevLayout = computeLayout(prevNodes.length, areaWidth, areaHeight, nodeScale, verticalOffset);

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
        (pp) => !snapshot.pointers.find((p) => pointerKey(p) === pointerKey(pp)),
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
        if (fromIdx < 0) return null;
        const fromPos = getNodePos(fromIdx, layout);

        // Arrow to null: short leftward arrow ending in a "null" label
        if (arrow.to === "__null__") {
          const arrowLen = 50;
          const midY = fromPos.y + layout.nodeH / 2;
          const startX = fromPos.x;
          const endX = startX - arrowLen;
          const nullW = layout.nodeW * 0.45;
          const nullH = layout.nodeH * 0.7;
          return (
            <React.Fragment key={`${arrow.from}-null`}>
              <Arrow
                fromX={startX}
                fromY={midY}
                toX={endX}
                toY={midY}
                dashed={arrow.dashed}
                highlight={arrow.highlight}
                delay={i * 2}
              />
              <NodeBox
                value="null"
                x={endX - nullW - 4}
                y={fromPos.y + (layout.nodeH - nullH) / 2}
                w={nullW}
                h={nullH}
                isNull
                delay={i * 2 + 1}
              />
            </React.Fragment>
          );
        }

        const toIdx = nodes.findIndex((n) => n.id === arrow.to);
        if (toIdx < 0) return null;
        const toPos = getNodePos(toIdx, layout);
        const isReversed = toIdx < fromIdx;

        if (arrow.curved) {
          // Start/end the curve below the address labels (nodeH * 0.65 ≈ 44px
          // at scale 1.2) so the arc doesn't overlap with the text.
          const curveYOffset = Math.round(layout.nodeH * 0.65);
          return (
            <Arrow
              key={`${arrow.from}-${arrow.to}-curved`}
              fromX={fromPos.x + layout.nodeW / 2}
              fromY={fromPos.y + layout.nodeH + curveYOffset}
              toX={toPos.x + layout.nodeW / 2}
              toY={toPos.y + layout.nodeH + curveYOffset}
              dashed={arrow.dashed}
              highlight={arrow.highlight}
              curved
              color={arrow.highlight ? undefined : "#FFFFFF"}
              delay={i * 2}
            />
          );
        }

        const fX = isReversed ? fromPos.x : fromPos.x + layout.nodeW;
        const tX = isReversed ? toPos.x + layout.nodeW : toPos.x;
        return (
          <Arrow
            key={`${arrow.from}-${arrow.to}`}
            fromX={fX}
            fromY={fromPos.y + layout.nodeH / 2}
            toX={tX}
            toY={toPos.y + layout.nodeH / 2}
            dashed={arrow.dashed}
            highlight={arrow.highlight}
            delay={i * 2}
          />
        );
      })}

      {departingArrows.map((arrow) => {
        const fromIdx = prevNodes.findIndex((n) => n.id === arrow.from);
        if (fromIdx < 0) return null;
        const fromPos = getNodePos(fromIdx, prevLayout);

        if (arrow.to === "__null__") {
          const arrowLen = 50;
          const midY = fromPos.y + prevLayout.nodeH / 2;
          return (
            <Arrow
              key={`exit-${arrow.from}-null`}
              fromX={fromPos.x}
              fromY={midY}
              toX={fromPos.x - arrowLen}
              toY={midY}
              opacity={1 - exitP}
              delay={0}
            />
          );
        }

        const toIdx = prevNodes.findIndex((n) => n.id === arrow.to);
        if (toIdx < 0) return null;
        const toPos = getNodePos(toIdx, prevLayout);
        const isRevExit = toIdx < fromIdx;
        return (
          <Arrow
            key={`exit-${arrow.from}-${arrow.to}`}
            fromX={isRevExit ? fromPos.x : fromPos.x + prevLayout.nodeW}
            fromY={fromPos.y + prevLayout.nodeH / 2}
            toX={isRevExit ? toPos.x + prevLayout.nodeW : toPos.x}
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
        const isNew = prevIdx < 0;

        if (!isNew) {
          const prevPos = getNodePos(prevIdx, prevLayout);
          const prevNodeData = prevNodes[prevIdx];
          const pX = prevNodeData.x ?? prevPos.x;
          const pY = prevNodeData.y ?? prevPos.y;
          finalX = interpolate(t, [0, 1], [pX, finalX]);
          finalY = interpolate(t, [0, 1], [pY, finalY]);
        }

        const outArrow = snapshot.arrows.find((a) => a.from === node.id);
        const nextNode = outArrow ? nodes.find((n) => n.id === outArrow.to) : undefined;
        const nextAddr = nextNode?.address;

        if (isNew) {
          const enterP = spring({
            frame: localFrame,
            fps,
            delay: i * 3,
            config: springPresets.enter,
          });
          const enterScale = interpolate(enterP, [0, 1], [0, 1]);
          const enterOpacity = interpolate(enterP, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
          const cx = finalX + layout.nodeW / 2;
          const cy = finalY + layout.nodeH / 2;

          const addrLabel = node.address ? (
            <div
              style={{
                position: "absolute",
                left: finalX,
                top: finalY + layout.nodeH + 7,
                width: layout.nodeW,
                textAlign: "center",
                fontFamily: fonts.mono,
                fontSize: Math.max(16, layout.nodeH * 0.40),
                fontWeight: 700,
                color: "rgba(255,255,255,0.78)",
                textShadow: "0 1px 6px rgba(0,0,0,0.95)",
                letterSpacing: 0.5,
                pointerEvents: "none",
              }}
            >
              {node.address}
            </div>
          ) : null;

          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: 0, top: 0, right: 0, bottom: 0,
                pointerEvents: "none",
                opacity: enterOpacity,
                transform: `scale(${enterScale})`,
                transformOrigin: `${cx}px ${cy}px`,
              }}
            >
              <NodeBox
                value={node.value}
                highlight={node.highlight || "none"}
                x={finalX}
                y={finalY}
                w={layout.nodeW}
                h={layout.nodeH}
                delay={0}
                localStepFrame={localFrame}
                reversed={node.reversed}
                address={node.address}
                nextAddress={nextAddr}
              />
              {addrLabel}
            </div>
          );
        }

        return (
          <React.Fragment key={node.id}>
            <NodeBox
              value={node.value}
              highlight={node.highlight || "none"}
              x={finalX}
              y={finalY}
              w={layout.nodeW}
              h={layout.nodeH}
              delay={i * 3}
              localStepFrame={localFrame}
              reversed={node.reversed}
              address={node.address}
              nextAddress={nextAddr}
            />
            {node.address && (
              <div
                style={{
                  position: "absolute",
                  left: finalX,
                  top: finalY + layout.nodeH + 7,
                  width: layout.nodeW,
                  textAlign: "center",
                  fontFamily: fonts.mono,
                  fontSize: Math.max(16, layout.nodeH * 0.40),
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.78)",
                  textShadow: "0 1px 6px rgba(0,0,0,0.95)",
                  letterSpacing: 0.5,
                  pointerEvents: "none",
                }}
              >
                {node.address}
              </div>
            )}
          </React.Fragment>
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

      {layout.showNullBox && !snapshot.hideEndNull && nodes.length > 0 && (() => {
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

      {layout.showNullText && !snapshot.hideEndNull && nodes.length > 0 && (() => {
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
        const currNodeIdx = ptr.targetNodeId
          ? nodes.findIndex((n) => n.id === ptr.targetNodeId)
          : -1;

        // Null-target pointers: "prev" goes left of first node, others go right of last node
        const isLeftNull = ptr.label.toLowerCase() === "prev";
        const nullLeftX = Math.max(layout.nodeW / 2 + 10, layout.startX - layout.gap * 0.5);
        const lastNodePos = nodes.length > 0 ? getNodePos(nodes.length - 1, layout) : null;
        const endNullVisible = (layout.showNullBox || layout.showNullText) && !snapshot.hideEndNull && nodes.length > 0;
        const nullRightX = (!isLeftNull && endNullVisible && layout.showNullBox)
          ? getNodePos(nodes.length, layout).x + layout.nodeW / 2
          : lastNodePos
            ? lastNodePos.x + layout.nodeW + layout.gap * 0.5 + layout.nodeW / 2
            : layout.startX + layout.gap * 0.5;
        const nullPtrX = isLeftNull ? nullLeftX : nullRightX;
        const nullPtrY = layout.y;

        const currPos = currNodeIdx >= 0
          ? getNodePos(currNodeIdx, layout)
          : { x: nullPtrX - layout.nodeW / 2, y: nullPtrY };
        const targetX = currPos.x + layout.nodeW / 2;
        let ptrX = targetX;
        let tilt = 0;
        let stretch = 0;

        let ptrY = currPos.y;

        const key = pointerKey(ptr);
        const prevPtr = prevSnapshot.pointers.find((p) => pointerKey(p) === key);
        if (prevPtr && (prevPtr.targetNodeId !== ptr.targetNodeId)) {
          let prevX: number | null = null;
          let prevY: number | null = null;

          if (prevPtr.targetNodeId) {
            const prevNodeIdx = prevNodes.findIndex((n) => n.id === prevPtr.targetNodeId);
            if (prevNodeIdx >= 0) {
              const prevPos = getNodePos(prevNodeIdx, prevLayout);
              prevX = prevPos.x + prevLayout.nodeW / 2;
              prevY = prevPos.y;
            }
          } else {
            const slideIsLeft = prevPtr.label.toLowerCase() === "prev";
            const slidePrevLastPos = prevNodes.length > 0 ? getNodePos(prevNodes.length - 1, prevLayout) : null;
            prevX = slideIsLeft
              ? Math.max(prevLayout.nodeW / 2 + 10, prevLayout.startX - prevLayout.gap * 0.5)
              : slidePrevLastPos
                ? slidePrevLastPos.x + prevLayout.nodeW + prevLayout.gap * 0.5 + prevLayout.nodeW / 2
                : prevLayout.startX + prevLayout.gap * 0.5;
            prevY = prevLayout.y;
          }

          if (prevX !== null) {
            const ptProgress = spring({
              frame: localFrame,
              fps,
              config: springPresets.pointerMove,
            });

            const cycleEdge = prevPtr.targetNodeId && ptr.targetNodeId
              ? snapshot.arrows.find(
                  (a) => a.curved && a.from === prevPtr.targetNodeId && a.to === ptr.targetNodeId,
                ) ?? prevSnapshot.arrows.find(
                  (a) => a.curved && a.from === prevPtr.targetNodeId && a.to === ptr.targetNodeId,
                )
              : undefined;

            if (cycleEdge && prevY !== null) {
              const CYCLE_DROP = 55;
              const startX = prevX;
              const startY = prevY!;
              const endX = targetX;
              const endY = currPos.y;
              const bottomY = Math.max(startY, endY) + layout.nodeH + CYCLE_DROP;

              const downLen = bottomY - startY;
              const horizLen = Math.abs(endX - startX);
              const upLen = bottomY - endY;
              const totalLen = downLen + horizLen + upLen;

              const seg1End = downLen / totalLen;
              const seg2End = (downLen + horizLen) / totalLen;

              const p = ptProgress;
              if (p <= seg1End) {
                ptrX = startX;
                ptrY = interpolate(p, [0, seg1End], [startY, bottomY], { extrapolateRight: "clamp" });
              } else if (p <= seg2End) {
                ptrX = interpolate(p, [seg1End, seg2End], [startX, endX], { extrapolateRight: "clamp" });
                ptrY = bottomY;
              } else {
                ptrX = endX;
                ptrY = interpolate(p, [seg2End, 1], [bottomY, endY], { extrapolateRight: "clamp" });
              }
            } else {
              const ptProgressPrev = spring({
                frame: Math.max(0, localFrame - 1),
                fps,
                config: springPresets.pointerMove,
              });
              const xCurr = interpolate(ptProgress, [0, 1], [prevX, targetX]);
              const xPrev = interpolate(ptProgressPrev, [0, 1], [prevX, targetX]);
              ptrX = xCurr;

              const vx = xCurr - xPrev;
              const speed = Math.abs(vx);
              tilt = Math.max(-14, Math.min(14, vx * 0.8));
              stretch = Math.min(22, speed * 1.6);
            }
          }
        }

        const stackIdx = pointerStacks.get(key) || 0;
        const isNullTarget = !ptr.targetNodeId;
        const pointerDelay = prevPtr ? 0 : i * 3 + 5;

        return (
          <React.Fragment key={key}>
            <Pointer
              label={ptr.label}
              x={ptrX}
              y={ptrY}
              color={ptr.color || colors.lavender}
              delay={pointerDelay}
              stackIndex={stackIdx}
              scale={nodeScale}
              tilt={tilt}
              stretch={stretch}
            />
            {isNullTarget && !(endNullVisible && !isLeftNull) && (
              <NodeBox
                value="null"
                x={currPos.x}
                y={currPos.y}
                w={layout.nodeW}
                h={layout.nodeH}
                isNull
                delay={pointerDelay + 2}
              />
            )}
          </React.Fragment>
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
        let ptrX: number;
        let ptrY: number;

        if (!targetNodeId) {
          const depIsLeft = ptr.label.toLowerCase() === "prev";
          const depLastPos = prevNodes.length > 0 ? getNodePos(prevNodes.length - 1, prevLayout) : null;
          ptrX = depIsLeft
            ? Math.max(prevLayout.nodeW / 2 + 10, prevLayout.startX - prevLayout.gap * 0.5)
            : depLastPos
              ? depLastPos.x + prevLayout.nodeW + prevLayout.gap * 0.5 + prevLayout.nodeW / 2
              : prevLayout.startX + prevLayout.gap * 0.5;
          ptrY = prevLayout.y;
        } else {
          const prevNodeIdx = prevNodes.findIndex((n) => n.id === targetNodeId);
          if (prevNodeIdx < 0) return null;

          const currNodeIdx = nodes.findIndex((n) => n.id === targetNodeId);
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
        }

        return (
          <Pointer
            key={`exit-${pointerKey(ptr)}`}
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
