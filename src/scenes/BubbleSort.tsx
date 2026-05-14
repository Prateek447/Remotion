import React from "react";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { CodeOnlyLayout } from "../components/CodeOnlyLayout";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";

/*
 * Code lines (0-indexed):
 *   0:  void bubbleSort(int[] arr) {
 *   1:      int n = arr.length;
 *   2:      for (int i = 0; i < n - 1; i++) {
 *   3:          for (int j = 0; j < n - i - 1; j++) {
 *   4:              if (arr[j] > arr[j + 1]) {
 *   5:                  int tmp = arr[j];
 *   6:                  arr[j] = arr[j + 1];
 *   7:                  arr[j + 1] = tmp;
 *   8:              }
 *   9:          }
 *  10:      }
 *  11:  }
 */

const steps: SceneStep[] = [
  // Step 0 — show the full function
  {
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 11 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
    },
  },

  // Step 1 — n = arr.length: runs once → O(1)
  {
    startFrame: 244,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 1,
    },
  },

  // Step 2 — outer loop: runs n times → O(n)
  {
    startFrame: 452,
    highlightLines: { startLine: 2, endLine: 10 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(n)",
      arrowAnchorLine: 2,
    },
  },

  // Step 3 — inner loop: also ~n per outer pass → multiply → O(n²)
  {
    startFrame: 647,
    highlightLines: { startLine: 3, endLine: 9 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(n²)",
      arrowAnchorLine: 3,
    },
  },

  // Step 4 — body: constant per iteration → O(1)
  {
    startFrame: 993,
    highlightLines: { startLine: 4, endLine: 8 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 5,
    },
  },

  // Step 5 — conclusion
  {
    startFrame: 1375,
    highlightLines: { startLine: 0, endLine: 11 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "O(1) + O(n) × O(n) × O(1) = O(n²)",
      simplifyAtFrame: 244, // fires when narrator says "Everything multiplies to"
    },
  },
];

export const BUBBLE_SORT_SCENE_FRAMES = 1663;

export interface BubbleSortProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const BubbleSort: React.FC<BubbleSortProps> = ({ tokens, format = "youtube" }) => (
  <>
    <CodeOnlyLayout steps={steps} tokens={tokens} format={format} filename="BubbleSort.java" arrowEndOffset={120} />
    <AmbientLayer />
    <SfxLayer steps={steps} duckVolume={0.5} />
    <NarrationLayer sceneId="o-n-squared" steps={steps} />
  </>
);
