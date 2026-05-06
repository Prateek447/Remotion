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
      caption: "Two nested loops. Key rule: when a loop runs inside another loop, their iteration counts multiply — not add. We count each loop separately, then combine.",
    },
  },

  // Step 1 — n = arr.length: runs once → O(1)
  {
    startFrame: 266,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "One assignment before the loops — runs once, always. Whether the array has 5 or 5 million elements, still 1 operation. O(1) means constant: the step count never grows with n.",
      arrowLabel: "O(1)",
      arrowAnchorLine: 1,
    },
  },

  // Step 2 — outer loop: runs n times → O(n)
  {
    startFrame: 662,
    highlightLines: { startLine: 2, endLine: 10 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "The outer loop: i goes 0 → n−1, exactly n iterations. Add one more element, get one more pass. That direct proportionality is linear growth → O(n).",
      arrowLabel: "O(n)",
      arrowAnchorLine: 2,
    },
  },

  // Step 3 — inner loop: also ~n per outer pass → multiply → O(n²)
  {
    startFrame: 963,
    highlightLines: { startLine: 3, endLine: 9 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "The inner loop runs n−i−1 times per outer pass — on average ~n/2, still O(n) since halving a linear term doesn't change its class. Outer O(n) × inner O(n) = O(n²). Double n? Work quadruples.",
      arrowLabel: "O(n²)",
      arrowAnchorLine: 3,
    },
  },

  // Step 4 — body: constant per iteration → O(1)
  {
    startFrame: 1526,
    highlightLines: { startLine: 4, endLine: 8 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "The swap: always exactly 3 assignments, for every pair compared. O(3) = O(1) in Big-O — constants get absorbed. Multiplying O(n²) by O(1) leaves the class unchanged: the dominant term always wins.",
      arrowLabel: "O(1)",
      arrowAnchorLine: 5,
    },
  },

  // Step 5 — conclusion
  {
    startFrame: 2002,
    highlightLines: { startLine: 0, endLine: 11 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "O(1) + O(n) × O(n) × O(1) = O(n²)",
      simplifyAtFrame: 244, // fires when narrator says "Everything multiplies to"
    },
  },
];

export const BUBBLE_SORT_SCENE_FRAMES = 3039;

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
