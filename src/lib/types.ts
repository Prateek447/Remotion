import type { ThemedToken } from "shiki";

export type NodeHighlight = "active" | "found" | "removing" | "new" | "error" | "visited" | "none";

export interface ListNodeData {
  id: string;
  value: number;
  highlight?: NodeHighlight;
  x?: number;
  y?: number;
}

export interface PointerData {
  label: string;
  targetNodeId: string | null;
  color?: string;
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
  searchTarget?: number | string;
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
