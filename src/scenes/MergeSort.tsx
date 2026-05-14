import React from "react";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { CodeOnlyLayout } from "../components/CodeOnlyLayout";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";

/*
 * Code lines (0-indexed):
 *   0: void mergeSort(int[] arr, int l, int r) {
 *   1:     if (l >= r) return;
 *   2:     int mid = l + (r - l) / 2;
 *   3:     mergeSort(arr, l, mid);
 *   4:     mergeSort(arr, mid + 1, r);
 *   5:     merge(arr, l, mid, r);
 *   6: }
 *
 * startFrame values are placeholders — recalculate after audio generation.
 */

const steps: SceneStep[] = [
  // Step 0 — show the full function
  {
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 6 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
    },
  },

  // Step 1 — base case: O(1) per leaf
  {
    startFrame: 291,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 1,
    },
  },

  // Step 2 — mid calculation: O(1)
  {
    startFrame: 609,
    highlightLines: { startLine: 2, endLine: 2 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 2,
    },
  },

  // Step 3 — two recursive calls → log n depth
  {
    startFrame: 793,
    highlightLines: { startLine: 3, endLine: 4 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "log n levels",
      arrowAnchorLine: 3,
    },
  },

  // Step 4 — merge call: O(n) per level
  {
    startFrame: 1208,
    highlightLines: { startLine: 5, endLine: 5 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(n) / level",
      arrowAnchorLine: 5,
    },
  },

  // Step 5 — conclusion
  {
    startFrame: 1599,
    highlightLines: { startLine: 0, endLine: 6 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "O(1) + O(1) + O(log n) × O(n) = O(n log n)",
      simplifyAtFrame: 420,
    },
  },
];

export const MERGE_SORT_SCENE_FRAMES = 1851;

export interface MergeSortProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const MergeSort: React.FC<MergeSortProps> = ({ tokens, format = "youtube" }) => (
  <>
    <CodeOnlyLayout steps={steps} tokens={tokens} format={format} filename="MergeSort.java" />
    <AmbientLayer />
    <SfxLayer steps={steps} duckVolume={0.5} />
    <NarrationLayer sceneId="o-n-log-n" steps={steps} />
  </>
);
