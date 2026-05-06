import React from "react";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { CodeOnlyLayout } from "../components/CodeOnlyLayout";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";

/*
 * Code lines (0-indexed):
 *   0: int fib(int n) {
 *   1:     if (n <= 1) return n;
 *   2:     return fib(n - 1) + fib(n - 2);
 *   3: }
 *
 * startFrame values are placeholders — recalculate after audio generation.
 */

const steps: SceneStep[] = [
  // Step 0 — show the full function
  {
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 3 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "Naive recursive Fibonacci. Two lines of actual code — but it creates O(2^n) function calls, one of the slowest complexity classes. We count calls by tracing the recursion tree.",
    },
  },

  // Step 1 — base case: O(1) per leaf
  {
    startFrame: 353,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "The base case. If n is 0 or 1, return immediately — O(1) per call. Every recursion tree has a bottom. This is it. Each leaf fires this line once and stops branching.",
      arrowLabel: "O(1)",
      arrowAnchorLine: 1,
    },
  },

  // Step 2 — two recursive calls → 2^n total
  {
    startFrame: 703,
    highlightLines: { startLine: 2, endLine: 2 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "One return — but two recursive calls inside it. fib(n-1) and fib(n-2) each branch into two more. The root fans to 2 nodes, each fans to 2 more. After n levels the bottom row has ~2^n nodes. Total calls across all levels: approximately 2^n.",
      arrowLabel: "2^n calls",
      arrowAnchorLine: 2,
    },
  },

  // Step 3 — conclusion
  {
    startFrame: 1285,
    highlightLines: { startLine: 0, endLine: 3 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "O(2^n) × O(1) = O(2^n)",
      simplifyAtFrame: 380,
    },
  },
];

export const EXPONENTIAL_SCENE_FRAMES = 2076;

export interface ExponentialProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const Exponential: React.FC<ExponentialProps> = ({ tokens, format = "youtube" }) => (
  <>
    <CodeOnlyLayout steps={steps} tokens={tokens} format={format} filename="Fibonacci.java" />
    <AmbientLayer />
    <SfxLayer steps={steps} duckVolume={0.5} />
    <NarrationLayer sceneId="o-2n" steps={steps} />
  </>
);
