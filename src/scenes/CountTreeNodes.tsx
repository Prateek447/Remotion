import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
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
import { QueueVisualization } from "../components/QueueVisualization";

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 90, right: 130 };
const REEL_TOP_RATIO = 0.52;

export const COUNT_TREE_NODES_SCENE_FRAMES = 2260;

/*
 * Code lines (0-indexed):
 *   0: int countNodes(Node node) {
 *   1:     if (node == null) return 0;
 *   2:     int left = countNodes(node.left);
 *   3:     int right = countNodes(node.right);
 *   4:     return 1 + left + right;
 *   5: }
 */

function makeSteps(): SceneStep[] {
  return [
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
      startFrame: 85,
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
      startFrame: 175,
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
      startFrame: 280,
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
      startFrame: 355,
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
      startFrame: 440,
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
      startFrame: 520,
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
      startFrame: 615,
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
      startFrame: 700,
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
      startFrame: 785,
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
      startFrame: 870,
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
      startFrame: 950,
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
      startFrame: 1030,
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
      startFrame: 1115,
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
      startFrame: 1220,
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
      startFrame: 1310,
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
      startFrame: 1390,
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
      startFrame: 1470,
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
      startFrame: 1550,
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
      startFrame: 1635,
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
      startFrame: 1720,
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
      startFrame: 1800,
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
      startFrame: 1880,
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
      startFrame: 1965,
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
      startFrame: 2065,
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
      startFrame: 2175,
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
  const nodeScale = isAnim ? 1.4 : isReel ? 0.82 : 1;
  const steps = isAnim ? compressStepsForAnim(makeSteps()) : makeSteps();
  const { current, localFrame } = useStepTransition(steps);
  const complexityInfo = current.snapshot.complexityInfo;

  const diagram = (
    <div
      style={{
        width: diagramAreaW,
        height: isAnim ? diagramAreaH : isReelOnly ? diagramAreaH : height,
        position: "relative",
        overflow: "hidden",
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
      <QueueVisualization
        steps={steps}
        itemSize={isAnim ? 54 : isReel ? 50 : 52}
        style={{
          position: "absolute",
          bottom: isAnim ? 24 : isReelOnly ? 24 : 110,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 5,
        }}
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
        <SplitLayout left={diagram} right={code} leftWidth="54%" />
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
