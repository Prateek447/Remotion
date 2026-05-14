import type { ThemedToken } from "shiki";

export type NodeHighlight = "active" | "found" | "removing" | "new" | "error" | "pinned" | "none";

export interface ListNodeData {
  id: string;
  value: number;
  highlight?: NodeHighlight;
  x?: number;
  y?: number;
  reversed?: boolean;
  address?: string;
}

export interface PointerData {
  label: string;
  targetNodeId: string | null;
  color?: string;
  // Stable identity for tracking across steps. Defaults to `label`.
  // Use when the display label changes between steps (e.g. "len = 1" -> "len = 2")
  // so the pointer slides/updates in place instead of re-mounting each step.
  id?: string;
}

export interface ArrowData {
  from: string;
  to: string;
  dashed?: boolean;
  highlight?: boolean;
  curved?: boolean;
}

export interface ListSnapshot {
  nodes: ListNodeData[];
  pointers: PointerData[];
  arrows: ArrowData[];
  newNode?: ListNodeData;
  caption?: string;
  hideEndNull?: boolean;
  complexityInfo?: { time: string; space: string };
}

export interface HighlightStep {
  startLine: number;
  endLine: number;
}

export interface SceneStep {
  snapshot: ListSnapshot;
  highlightLines: HighlightStep;
  startFrame: number;
  visibleLines?: number;
}

export interface CodeSnippet {
  code: string;
  tokens: ThemedToken[][];
  language: string;
}
