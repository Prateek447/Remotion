import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { useStepTransition } from "../lib/useStepTransition";
import { colors, fonts, springPresets } from "../lib/theme";
import { AmbientLayer } from "../components/AmbientLayer";
import { compressStepsForAnim } from "../lib/animSteps";
import { AnimationOnlyLayout, ANIM_DIAGRAM_HEIGHT } from "../components/AnimationOnlyLayout";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { NarrationLayer } from "../components/NarrationLayer";
import { SfxLayer } from "../components/SfxLayer";
import { SplitLayout } from "../components/SplitLayout";
import { StackedLayout, type SafeArea } from "../components/StackedLayout";
import { TreeDiagram } from "../components/TreeDiagram";

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 90, right: 130 };
const REEL_TOP_RATIO = 0.52;

export const COUNT_TREE_NODES_SCENE_FRAMES = 5547;

/*
 * Code lines (0-indexed):
 *   0: int countNodes(Node node) {
 *   1:     if (node == null) return 0;
 *   2:     int left = countNodes(node.left);
 *   3:     int right = countNodes(node.right);
 *   4:     return 1 + left + right;
 *   5: }
 */

// Step index at which each node's return value first becomes visible
const NODE_RETURN_STEP: Record<string, number> = {
  n4: 8, n5: 12, n2: 13, n6: 18, n7: 22, n3: 23, n1: 24,
};
const NODE_RETURN_VALUE: Record<string, number> = {
  n4: 1, n5: 1, n6: 1, n7: 1, n2: 3, n3: 3, n1: 7,
};

// Child → parent edges for traveling-number animation
const PARENT_MAP: Record<string, string> = {
  n4: "n2", n5: "n2", n2: "n1",
  n6: "n3", n7: "n3", n3: "n1",
};
const TRAVEL_FRAMES = 28;

// Which step index shows each leaf's null child (left or right)
const NULL_CHILD_INFO: Record<number, { parentId: string; side: "left" | "right" }> = {
  6:  { parentId: "n4", side: "left"  },
  7:  { parentId: "n4", side: "right" },
  10: { parentId: "n5", side: "left"  },
  11: { parentId: "n5", side: "right" },
  16: { parentId: "n6", side: "left"  },
  17: { parentId: "n6", side: "right" },
  20: { parentId: "n7", side: "left"  },
  21: { parentId: "n7", side: "right" },
};
// Fractional offsets from parent leaf to null child position
const NULL_DX = 0.085;
const NULL_DY = 0.17;
// The "0" pill starts traveling after the null node has faded in
const NULL_TRAVEL_START = 12;

// delays: how many localFrames after a step starts before the formula appears
const FORMULA_DELAY_NULL   = NULL_TRAVEL_START + TRAVEL_FRAMES; // ~40 — after null→leaf travel
const FORMULA_DELAY_TRAVEL = TRAVEL_FRAMES;                     // ~28 — after child→parent travel

// How many frames the absorb-into-node animation takes
const ABSORB_FRAMES = 22;

// Per-node lifecycle: appear when left value arrives, update when right arrives, absorb on return
const NODE_FORMULA_LIFECYCLE: Record<string, {
  leftStep:   number; leftText:   string; leftDelay:  number;
  rightStep:  number; fullText:   string; rightDelay: number;
  absorbStep: number;
}> = {
  n4: { leftStep: 6,  leftText: "L = 0", leftDelay: FORMULA_DELAY_NULL,   rightStep: 7,  fullText: "0+0+1 = 1", rightDelay: FORMULA_DELAY_NULL,   absorbStep: 8  },
  n5: { leftStep: 10, leftText: "L = 0", leftDelay: FORMULA_DELAY_NULL,   rightStep: 11, fullText: "0+0+1 = 1", rightDelay: FORMULA_DELAY_NULL,   absorbStep: 12 },
  n2: { leftStep: 8,  leftText: "L = 1", leftDelay: FORMULA_DELAY_TRAVEL, rightStep: 12, fullText: "1+1+1 = 3", rightDelay: FORMULA_DELAY_TRAVEL, absorbStep: 13 },
  n6: { leftStep: 16, leftText: "L = 0", leftDelay: FORMULA_DELAY_NULL,   rightStep: 17, fullText: "0+0+1 = 1", rightDelay: FORMULA_DELAY_NULL,   absorbStep: 18 },
  n7: { leftStep: 20, leftText: "L = 0", leftDelay: FORMULA_DELAY_NULL,   rightStep: 21, fullText: "0+0+1 = 1", rightDelay: FORMULA_DELAY_NULL,   absorbStep: 22 },
  n3: { leftStep: 18, leftText: "L = 1", leftDelay: FORMULA_DELAY_TRAVEL, rightStep: 22, fullText: "1+1+1 = 3", rightDelay: FORMULA_DELAY_TRAVEL, absorbStep: 23 },
  n1: { leftStep: 13, leftText: "L = 3", leftDelay: FORMULA_DELAY_TRAVEL, rightStep: 23, fullText: "3+3+1 = 7", rightDelay: FORMULA_DELAY_TRAVEL, absorbStep: 24 },
};

// Maps node id → its index in the snapshot nodes array (drives idle float phase)
const NODE_INDEX: Record<string, number> = {
  n1: 0, n2: 1, n3: 2, n4: 3, n5: 4, n6: 5, n7: 6,
};

function nodeFloatY(nodeId: string, frame: number): number {
  const idx = NODE_INDEX[nodeId] ?? 0;
  return Math.sin(frame * 0.055 + idx * 3 * 0.9) * 10;
}

function makeSteps(): SceneStep[] {
  const raw: SceneStep[] = [
    // Show tree, pose the question
    {
      startFrame: 0,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 1,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4 },
          { id: "n5", value: 5 },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Count every node in this tree",
      },
    },
    // Name recursion as the mechanism
    {
      startFrame: 237,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 1,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4 },
          { id: "n5", value: 5 },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Recursion: ask each node, then add up",
      },
    },
    // Show the formula in code
    {
      startFrame: 458,
      highlightLines: { startLine: 1, endLine: 4 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4 },
          { id: "n5", value: 5 },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "The recursive formula",
      },
    },
    // Enter the recursion at the root
    {
      startFrame: 814,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1, highlight: "active" },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4 },
          { id: "n5", value: 5 },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Frame 1: countNodes(node 1)",
      },
    },
    // Recurse into the left child of root
    {
      startFrame: 939,
      visualOffset: 74,
      highlightLines: { startLine: 2, endLine: 2 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "active" },
          { id: "n3", value: 3 },
          { id: "n4", value: 4 },
          { id: "n5", value: 5 },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2", highlight: true },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Frame 2: countNodes(node 2)",
      },
    },
    // Descend further to the leaf n4
    {
      startFrame: 1137,
      visualOffset: 42,
      highlightLines: { startLine: 2, endLine: 2 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "active" },
          { id: "n5", value: 5 },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2", highlight: true },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4", highlight: true },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Frame 3: countNodes(node 4)",
      },
    },
    // First base case — n4's left child is null
    {
      startFrame: 1309,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "active" },
          { id: "n5", value: 5 },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2", highlight: true },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4", highlight: true },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Left of node 4: returned 0",
      },
    },
    // Second base case — n4's right child is null
    {
      startFrame: 1601,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "active" },
          { id: "n5", value: 5 },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2", highlight: true },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4", highlight: true },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Right of node 4: returned 0",
      },
    },
    // Node 4 combines its children's returns
    {
      startFrame: 1809,
      highlightLines: { startLine: 4, endLine: 4 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5 },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2", highlight: true },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4", highlight: true },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Node 4 returned 1",
      },
    },
    // Enter the call on n5
    {
      startFrame: 1995,
      visualOffset: 56,
      highlightLines: { startLine: 3, endLine: 3 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "active" },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2", highlight: true },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5", highlight: true },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Frame: countNodes(node 5)",
      },
    },
    // n5's left child is null — base case
    {
      startFrame: 2187,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "active" },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2", highlight: true },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5", highlight: true },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Left of node 5: returned 0",
      },
    },
    // n5's right child is null — base case
    {
      startFrame: 2369,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "active" },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2", highlight: true },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5", highlight: true },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Right of node 5: returned 0",
      },
    },
    // Node 5 combines its children's returns
    {
      startFrame: 2536,
      highlightLines: { startLine: 4, endLine: 4 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2 },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2", highlight: true },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5", highlight: true },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Node 5 returned 1",
      },
    },
    // Node 2 combines child returns
    {
      startFrame: 2728,
      highlightLines: { startLine: 4, endLine: 4 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Node 2 returned 3",
      },
    },
    // Enter the call on n3
    {
      startFrame: 3035,
      visualOffset: 54,
      highlightLines: { startLine: 3, endLine: 3 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3, highlight: "active" },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6 },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3", highlight: true },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Frame: countNodes(node 3)",
      },
    },
    // Descend left from n3 to n6
    {
      startFrame: 3248,
      highlightLines: { startLine: 2, endLine: 2 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6, highlight: "active" },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3", highlight: true },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6", highlight: true },
          { from: "n3", to: "n7" },
        ],
        caption: "Frame: countNodes(node 6)",
      },
    },
    // n6's left child is null — base case
    {
      startFrame: 3409,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6, highlight: "active" },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3", highlight: true },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6", highlight: true },
          { from: "n3", to: "n7" },
        ],
        caption: "Left of node 6: returned 0",
      },
    },
    // n6's right child is null — base case
    {
      startFrame: 3602,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6, highlight: "active" },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3", highlight: true },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6", highlight: true },
          { from: "n3", to: "n7" },
        ],
        caption: "Right of node 6: returned 0",
      },
    },
    // Node 6 combines its children's returns
    {
      startFrame: 3768,
      highlightLines: { startLine: 4, endLine: 4 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6, highlight: "found" },
          { id: "n7", value: 7 },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3", highlight: true },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6", highlight: true },
          { from: "n3", to: "n7" },
        ],
        caption: "Node 6 returned 1",
      },
    },
    // Enter the call on n7
    {
      startFrame: 3952,
      visualOffset: 59,
      highlightLines: { startLine: 3, endLine: 3 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6, highlight: "found" },
          { id: "n7", value: 7, highlight: "active" },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3", highlight: true },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7", highlight: true },
        ],
        caption: "Frame: countNodes(node 7)",
      },
    },
    // n7's left child is null — base case
    {
      startFrame: 4141,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6, highlight: "found" },
          { id: "n7", value: 7, highlight: "active" },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3", highlight: true },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7", highlight: true },
        ],
        caption: "Left of node 7: returned 0",
      },
    },
    // n7's right child is null — base case
    {
      startFrame: 4361,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6, highlight: "found" },
          { id: "n7", value: 7, highlight: "active" },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3", highlight: true },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7", highlight: true },
        ],
        caption: "Right of node 7: returned 0",
      },
    },
    // Node 7 combines its children's returns
    {
      startFrame: 4523,
      highlightLines: { startLine: 4, endLine: 4 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3 },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6, highlight: "found" },
          { id: "n7", value: 7, highlight: "found" },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3", highlight: true },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7", highlight: true },
        ],
        caption: "Node 7 returned 1",
      },
    },
    // Node 3 combines its children's returns
    {
      startFrame: 4687,
      highlightLines: { startLine: 4, endLine: 4 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1 },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3, highlight: "found" },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6, highlight: "found" },
          { id: "n7", value: 7, highlight: "found" },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Node 3 returned 3",
      },
    },
    // Root combines — one plus three plus three is seven
    {
      startFrame: 4959,
      visualOffset: 103,
      highlightLines: { startLine: 4, endLine: 4 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1, highlight: "found" },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3, highlight: "found" },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6, highlight: "found" },
          { id: "n7", value: 7, highlight: "found" },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "Total: 7 nodes",
      },
    },
    // Wrap up with complexity
    {
      startFrame: 5293,
      highlightLines: { startLine: 0, endLine: 5 },
      visibleLines: 6,
      snapshot: {
        nodes: [
          { id: "n1", value: 1, highlight: "found" },
          { id: "n2", value: 2, highlight: "found" },
          { id: "n3", value: 3, highlight: "found" },
          { id: "n4", value: 4, highlight: "found" },
          { id: "n5", value: 5, highlight: "found" },
          { id: "n6", value: 6, highlight: "found" },
          { id: "n7", value: 7, highlight: "found" },
        ],
        pointers: [],
        arrows: [
          { from: "n1", to: "n2" },
          { from: "n1", to: "n3" },
          { from: "n2", to: "n4" },
          { from: "n2", to: "n5" },
          { from: "n3", to: "n6" },
          { from: "n3", to: "n7" },
        ],
        caption: "O(n) time — each node visited once",
        complexityInfo: { time: "O(n)", space: "O(h)" },
      },
    },
  ];

  return raw.map((step, i) => ({
    ...step,
    snapshot: {
      ...step.snapshot,
      nodeReturnValues: Object.fromEntries(
        Object.entries(NODE_RETURN_VALUE).filter(([id]) => i >= (NODE_RETURN_STEP[id] ?? Infinity))
      ),
    },
  }));
}

function makePositionMap(format: "youtube" | "reel" | "reel-anim"): Record<string, { x: number; y: number }> {
  if (format === "reel-anim") {
    return {
      n1: { x: 0.5, y: 0.12 },
      n2: { x: 0.25, y: 0.35 },
      n3: { x: 0.75, y: 0.35 },
      n4: { x: 0.11, y: 0.58 },
      n5: { x: 0.38, y: 0.58 },
      n6: { x: 0.62, y: 0.58 },
      n7: { x: 0.89, y: 0.58 },
    };
  }
  return format === "reel"
    ? {
      n1: { x: 0.5, y: 0.13 },
      n2: { x: 0.26, y: 0.36 },
      n3: { x: 0.74, y: 0.36 },
      n4: { x: 0.12, y: 0.6 },
      n5: { x: 0.38, y: 0.6 },
      n6: { x: 0.62, y: 0.6 },
      n7: { x: 0.88, y: 0.6 },
      }
    : {
    n1: { x: 0.5, y: 0.18 },
    n2: { x: 0.28, y: 0.42 },
    n3: { x: 0.72, y: 0.42 },
    n4: { x: 0.16, y: 0.66 },
    n5: { x: 0.4, y: 0.66 },
    n6: { x: 0.6, y: 0.66 },
    n7: { x: 0.84, y: 0.66 },
      };
}

// ── ReturnValueOverlay ────────────────────────────────────────────────────────
// Shows "= N" badges below each node as return values bubble up the recursion.

const ReturnValueOverlay: React.FC<{
  steps:       SceneStep[];
  positionMap: Record<string, { x: number; y: number }>;
  areaWidth:   number;
  areaHeight:  number;
  nodeRadius:  number;
}> = ({ steps, positionMap, areaWidth, areaHeight, nodeRadius }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const { current, previous, localFrame } = useStepTransition(steps);

  const currVals = current.snapshot.nodeReturnValues  ?? {};
  const prevVals = previous.snapshot.nodeReturnValues ?? {};

  const entries = Object.entries(currVals);
  if (entries.length === 0) return null;

  const badgeFontSize = Math.round(nodeRadius * 0.58);

  return (
    <div
      style={{
        position:      "absolute",
        top:           0,
        left:          0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "none",
        zIndex:        6,
      }}
    >
      {entries.map(([nodeId, value]) => {
        const pos = positionMap[nodeId];
        if (!pos) return null;

        const cx     = pos.x * areaWidth;
        const floatY = nodeFloatY(nodeId, frame);
        const cy     = pos.y * areaHeight + nodeRadius + 10 + floatY;
        const isNew  = !(nodeId in prevVals);

        const popP = spring({
          frame:  isNew ? localFrame : 9999,
          fps,
          config: springPresets.snappy,
        });
        const scale   = isNew ? interpolate(popP, [0, 0.4, 1], [0, 1.15, 1]) : 1;
        const opacity = isNew ? interpolate(popP, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }) : 1;
        const glow    = isNew ? interpolate(popP, [0, 0.4, 1], [1, 1, 0]) : 0;

        return (
          <div
            key={nodeId}
            style={{
              position:     "absolute",
              left:         cx,
              top:          cy,
              transform:    `translateX(-50%) scale(${scale})`,
              opacity,
              background:   "rgba(8, 10, 18, 0.93)",
              border:       `1.5px solid ${colors.green}CC`,
              borderRadius: 8,
              padding:      `3px 10px`,
              fontFamily:   fonts.mono,
              fontSize:     badgeFontSize,
              fontWeight:   800,
              color:        colors.green,
              textShadow:   `0 0 8px ${colors.green}88`,
              whiteSpace:   "nowrap",
              boxShadow:    glow > 0.05
                ? `0 0 ${Math.round(14 * glow)}px ${colors.green}55`
                : "none",
            }}
          >
            {value}
          </div>
        );
      })}
    </div>
  );
};

// ── helpers ───────────────────────────────────────────────────────────────────

function travelPill(
  t: number,
  localFrame: number,
  startFrame: number,
  color: string,
  value: number | string,
  nodeRadius: number,
  x: number,
  y: number,
): React.ReactElement {
  const opacity    = t < 0.12 ? t / 0.12 : t > 0.80 ? 1 - (t - 0.80) / 0.20 : 1;
  const scale      = interpolate(t, [0, 0.18, 0.82, 1], [0.5, 1.18, 1.0, 0.65]);
  const glowRadius = Math.round(interpolate(t, [0, 0.5, 1], [6, 24, 6]));
  const fontSize   = Math.round(nodeRadius * 0.80);

  return (
    <div
      style={{
        position:      "absolute",
        left:          x,
        top:           y,
        transform:     `translate(-50%, -50%) scale(${scale})`,
        opacity,
        background:    "rgba(8, 10, 18, 0.93)",
        border:        `2px solid ${color}CC`,
        borderRadius:  10,
        padding:       `4px 14px`,
        fontFamily:    fonts.mono,
        fontSize,
        fontWeight:    800,
        color,
        whiteSpace:    "nowrap",
        textShadow:    `0 0 8px ${color}AA`,
        boxShadow:     `0 0 ${glowRadius}px ${color}66, inset 0 0 8px ${color}22`,
        pointerEvents: "none",
        zIndex:        10,
      }}
    >
      {value}
    </div>
  );
}

// ── TravelingNumberOverlay ────────────────────────────────────────────────────
// When a node returns its count, a green pill glides along the edge to the parent.

const TravelingNumberOverlay: React.FC<{
  steps:       SceneStep[];
  positionMap: Record<string, { x: number; y: number }>;
  areaWidth:   number;
  areaHeight:  number;
  nodeRadius:  number;
}> = ({ steps, positionMap, areaWidth, areaHeight, nodeRadius }) => {
  const { current, previous, localFrame } = useStepTransition(steps);

  const currVals = current.snapshot.nodeReturnValues  ?? {};
  const prevVals = previous.snapshot.nodeReturnValues ?? {};

  const newlyReturned = Object.entries(currVals).filter(([id]) => !(id in prevVals));
  if (newlyReturned.length === 0 || localFrame >= TRAVEL_FRAMES) return null;

  return (
    <>
      {newlyReturned.map(([nodeId, value]) => {
        const parentId = PARENT_MAP[nodeId];
        if (!parentId) return null;

        const childPos  = positionMap[nodeId];
        const parentPos = positionMap[parentId];
        if (!childPos || !parentPos) return null;

        const t     = localFrame / TRAVEL_FRAMES;
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const x     = childPos.x  * areaWidth  + (parentPos.x * areaWidth  - childPos.x * areaWidth)  * eased;
        const y     = childPos.y  * areaHeight + (parentPos.y * areaHeight - childPos.y * areaHeight) * eased;

        return (
          <React.Fragment key={nodeId}>
            {travelPill(t, localFrame, 0, colors.green, value, nodeRadius, x, y)}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ── NullNodeOverlay ───────────────────────────────────────────────────────────
// During base-case steps, shows a null child circle and a "0" pill traveling up.

const NullNodeOverlay: React.FC<{
  steps:       SceneStep[];
  positionMap: Record<string, { x: number; y: number }>;
  areaWidth:   number;
  areaHeight:  number;
  nodeRadius:  number;
}> = ({ steps, positionMap, areaWidth, areaHeight, nodeRadius }) => {
  const { fps } = useVideoConfig();
  const { current, localFrame } = useStepTransition(steps);

  const stepIdx = steps.indexOf(current);
  const info    = NULL_CHILD_INFO[stepIdx];
  if (!info) return null;

  const parentPos = positionMap[info.parentId];
  if (!parentPos) return null;

  const nullPos = {
    x: parentPos.x + (info.side === "left" ? -NULL_DX : NULL_DX),
    y: parentPos.y + NULL_DY,
  };

  const nullX   = nullPos.x * areaWidth;
  const nullY   = nullPos.y * areaHeight;
  const parentX = parentPos.x * areaWidth;
  const parentY = parentPos.y * areaHeight;

  // Null node fades in with a spring
  const nodeP   = spring({ frame: localFrame, fps, config: springPresets.enter });
  const nodeR   = nodeRadius;
  const nullFsz = Math.round(nodeR * 0.52);

  // "0" pill travels null→parent after NULL_TRAVEL_START frames
  const travelLocal  = localFrame - NULL_TRAVEL_START;
  const travelActive = travelLocal >= 0 && travelLocal < TRAVEL_FRAMES;
  const t      = Math.min(Math.max(travelLocal, 0) / TRAVEL_FRAMES, 1);
  const eased  = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const tx     = nullX   + (parentX - nullX)   * eased;
  const ty     = nullY   + (parentY - nullY)   * eased;

  // Offset line endpoints to node edges so it doesn't overlap the circles
  const dist   = Math.hypot(nullX - parentX, nullY - parentY);
  const ux     = (nullX - parentX) / dist;
  const uy     = (nullY - parentY) / dist;
  const lineX1 = parentX + ux * nodeRadius;
  const lineY1 = parentY + uy * nodeRadius;
  const lineX2 = nullX   - ux * nodeR;
  const lineY2 = nullY   - uy * nodeR;

  return (
    <>
      {/* dashed edge — runs between the two node edges, not centers */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 4 }}
      >
        <line
          x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2}
          stroke={colors.subtext0}
          strokeWidth={2}
          strokeDasharray="6 4"
          opacity={nodeP * 0.7}
        />
      </svg>

      {/* null node circle */}
      <div
        style={{
          position:       "absolute",
          left:           nullX,
          top:            nullY,
          transform:      `translate(-50%, -50%) scale(${nodeP})`,
          opacity:        nodeP,
          width:          nodeR * 2,
          height:         nodeR * 2,
          borderRadius:   "50%",
          border:         `2px dashed ${colors.subtext0}`,
          background:     "rgba(8, 10, 18, 0.90)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontFamily:     fonts.mono,
          fontSize:       nullFsz,
          fontWeight:     700,
          color:          colors.subtext0,
          letterSpacing:  0.2,
          pointerEvents:  "none",
          zIndex:         5,
        }}
      >
        null
      </div>

      {/* traveling "0" pill */}
      {travelActive && travelPill(t, travelLocal, 0, colors.subtext0, "0", nodeRadius, tx, ty)}
    </>
  );
};

// ── FormulaOverlay ────────────────────────────────────────────────────────────
// Each node shows a formula pill from when its left value arrives until it
// returns its own result.  Lifecycle: appear → persist → update text → absorb.

const FormulaOverlay: React.FC<{
  steps:       SceneStep[];
  positionMap: Record<string, { x: number; y: number }>;
  areaWidth:   number;
  areaHeight:  number;
  nodeRadius:  number;
}> = ({ steps, positionMap, areaWidth, areaHeight, nodeRadius }) => {
  const { fps } = useVideoConfig();
  const frame    = useCurrentFrame();
  const { current, localFrame } = useStepTransition(steps);
  const stepIdx  = steps.indexOf(current);
  const fontSize = Math.round(nodeRadius * 0.68);
  const pills: React.ReactElement[] = [];

  for (const [nodeId, lc] of Object.entries(NODE_FORMULA_LIFECYCLE)) {
    const { leftStep, leftText, leftDelay, rightStep, fullText, rightDelay, absorbStep } = lc;

    if (stepIdx < leftStep || stepIdx > absorbStep) continue;

    const pos = positionMap[nodeId];
    if (!pos) continue;

    const floatY   = nodeFloatY(nodeId, frame);
    const nodeCx   = pos.x * areaWidth;
    const nodeCy   = pos.y * areaHeight + floatY;
    const gap      = nodeRadius + 14;
    const pillLeft = nodeCx + gap;
    const originX  = "left";

    let text: string;
    let opacity = 1;
    let scale   = 1;
    let shiftX  = 0;

    if (stepIdx === absorbStep) {
      if (localFrame >= ABSORB_FRAMES) continue;
      const t = localFrame / ABSORB_FRAMES;
      text    = fullText;
      opacity = 1 - t;
      scale   = 1 - t * 0.65;
      shiftX  = -t * gap * 0.8;

    } else if (stepIdx === leftStep) {
      const after = localFrame - leftDelay;
      if (after < 0) continue;
      text = leftText;
      const p = spring({ frame: after, fps, config: springPresets.snappy });
      scale   = interpolate(p, [0, 0.4, 1], [0, 1.12, 1]);
      opacity = interpolate(p, [0, 0.2], [0, 1], { extrapolateRight: "clamp" });

    } else if (stepIdx === rightStep) {
      const after = localFrame - rightDelay;
      if (after < 0) {
        // right value not yet arrived — keep showing left text at full opacity
        text = leftText;
      } else {
        // right value arrived — quick scale pop to signal the update
        text = fullText;
        const p = spring({ frame: after, fps, config: springPresets.snappy });
        scale = interpolate(p, [0, 0.35, 1], [0.88, 1.12, 1]);
      }

    } else {
      // persisting between steps
      text = stepIdx < rightStep ? leftText : fullText;
    }

    pills.push(
      <div
        key={nodeId}
        style={{
          position:        "absolute",
          left:            pillLeft,
          top:             nodeCy,
          transform:       `translateY(-50%) translateX(${shiftX}px) scale(${scale})`,
          transformOrigin: `${originX} center`,
          opacity,
          background:      "#0096FF",
          borderRadius:    9,
          padding:         `4px 14px`,
          fontFamily:      fonts.mono,
          fontSize,
          fontWeight:      700,
          color:           colors.text,
          whiteSpace:      "nowrap",
          boxShadow:       "0 0 14px #0096FF66",
          pointerEvents:   "none",
          zIndex:          8,
        }}
      >
        {text}
      </div>
    );
  }

  return pills.length > 0 ? <>{pills}</> : null;
};

export interface CountTreeNodesProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

const ComplexityCard: React.FC<{
  time: string;
  space: string;
  localFrame: number;
  style: React.CSSProperties;
}> = ({ time, space, localFrame, style }) => {
  const { fps } = useVideoConfig();

  const slideP     = spring({ frame: localFrame, fps, config: springPresets.slide });
  const opacity    = interpolate(slideP, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });
  const translateY = interpolate(slideP, [0, 1], [50, 0]);

  const pills: Array<{ label: string; value: string; color: string; glow: string }> = [
    { label: "Time",  value: time,  color: colors.yellow,   glow: "rgba(249,226,175,0.25)" },
    { label: "Space", value: space, color: colors.sapphire, glow: "rgba(116,199,236,0.25)" },
  ];

  return (
    <div
      style={{
        ...style,
        transform: `${style.transform ?? ""} translateY(${translateY}px)`.trim(),
        transformOrigin: "top center",
        opacity,
        display: "flex",
        gap: 16,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {pills.map(({ label, value, color, glow }) => (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(10,10,10,0.82)",
            border: `1px solid ${color}44`,
            borderRadius: 14,
            padding: "10px 20px",
            boxShadow: `0 0 18px ${glow}, inset 0 0 10px ${glow}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ fontFamily: fonts.sans, fontSize: 15, fontWeight: 500, color: colors.subtext0, letterSpacing: 0.4, textTransform: "uppercase" as const }}>
            {label}
          </span>
          <span style={{ fontFamily: fonts.mono, fontSize: 22, fontWeight: 800, color, textShadow: `0 0 10px ${color}88`, letterSpacing: 0.5 }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const CountTreeNodes: React.FC<CountTreeNodesProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel" || format === "reel-anim";
  const isAnim = format === "reel-anim";
  const isReelOnly = format === "reel";

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;
  const diagramAreaW = isAnim ? width : isReel ? safeW : width * 0.62;
  const diagramAreaH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  const nodeScale = isAnim ? 1.15 : isReel ? 0.82 : 1;
  const steps = isAnim ? compressStepsForAnim(makeSteps()) : makeSteps();
  const { current, localFrame } = useStepTransition(steps);
  const complexityInfo = current.snapshot.complexityInfo;

  const diagram = (
    <div
      style={{
        width: diagramAreaW,
        height: isAnim ? diagramAreaH : isReelOnly ? diagramAreaH : height,
        position: "relative",
        overflow: isAnim ? "visible" : "hidden",
        margin: isReelOnly ? "0 auto" : undefined,
      }}
    >
      <TreeDiagram
        steps={steps}
        positionMap={makePositionMap(format)}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeScale={nodeScale}
      />
      <ReturnValueOverlay
        steps={steps}
        positionMap={makePositionMap(format)}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeRadius={30 * nodeScale}
      />
      <TravelingNumberOverlay
        steps={steps}
        positionMap={makePositionMap(format)}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeRadius={30 * nodeScale}
      />
      <NullNodeOverlay
        steps={steps}
        positionMap={makePositionMap(format)}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeRadius={30 * nodeScale}
      />
      <FormulaOverlay
        steps={steps}
        positionMap={makePositionMap(format)}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeRadius={30 * nodeScale}
      />
    </div>
  );

  const code = (
    <CodeWindow title="BinaryTree.java" hideTitle={isReel}>
      <CodeBlock
        tokens={tokens}
        steps={steps}
        fontSize={isReel ? 22 : 24}
        padding={isReel ? 24 : 20}
        centered={isReel}
        centerWidth={isReel ? safeW : undefined}
      />
    </CodeWindow>
  );

  const reelDividerTop  = REEL_SAFE.top + safeH * REEL_TOP_RATIO;
  const reelCenterLeft  = REEL_SAFE.left + safeW / 2;

  return (
    <>
      {isAnim ? (
        <AnimationOnlyLayout>{diagram}</AnimationOnlyLayout>
      ) : isReelOnly ? (
        <StackedLayout top={diagram} bottom={code} safeArea={REEL_SAFE} topRatio={REEL_TOP_RATIO} />
      ) : (
        <SplitLayout left={diagram} right={code} leftWidth="67%" />
      )}
      <AmbientLayer />
      {!isAnim && <SfxLayer steps={steps} duckVolume={0.45} />}
      {!isAnim && <NarrationLayer sceneId="count-tree-nodes" steps={steps} />}
      {complexityInfo && (
        <ComplexityCard
          time={complexityInfo.time}
          space={complexityInfo.space}
          localFrame={Math.max(0, localFrame - 20)}
          style={
            isAnim
              ? { position: "absolute", top: 1460, left: "50%", transform: "translateX(-50%)" }
              : isReelOnly
              ? { position: "absolute", top: reelDividerTop - 160, left: reelCenterLeft, transform: "translateX(-50%)" }
              : { position: "absolute", top: 28, left: 28 }
          }
        />
      )}
    </>
  );
};
