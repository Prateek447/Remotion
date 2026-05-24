import React from "react";
import type { ThemedToken } from "shiki";
import type { KeyedTokensInfo } from "../lib/magic-move";
import { StandaloneVideo } from "../StandaloneVideo";
import { InsertHead } from "../scenes/InsertHead";
import { InsertTail } from "../scenes/InsertTail";
import { DeleteNode } from "../scenes/DeleteNode";
import { SearchNode } from "../scenes/SearchNode";
import { Traverse } from "../scenes/Traverse";
import { Reverse, REVERSE_SCENE_FRAMES } from "../scenes/Reverse";
import { DetectCycle, DETECT_CYCLE_SCENE_FRAMES } from "../scenes/DetectCycle";
import { MergeLists, MERGE_LISTS_SCENE_FRAMES } from "../scenes/MergeLists";
import { RemoveNthFromEnd, REMOVE_NTH_SCENE_FRAMES } from "../scenes/RemoveNthFromEnd";
import { ConstantTime, CONSTANT_TIME_SCENE_FRAMES } from "../scenes/ConstantTime";
import { LinearSearch, LINEAR_SEARCH_SCENE_FRAMES } from "../scenes/LinearSearch";
import { BinarySearch, BINARY_SEARCH_SCENE_FRAMES } from "../scenes/BinarySearch";
import { BubbleSort, BUBBLE_SORT_SCENE_FRAMES } from "../scenes/BubbleSort";
import { MergeSort, MERGE_SORT_SCENE_FRAMES } from "../scenes/MergeSort";
import { Exponential, EXPONENTIAL_SCENE_FRAMES } from "../scenes/Exponential";
import { Factorial, FACTORIAL_SCENE_FRAMES } from "../scenes/Factorial";
import { BSTInsert, BST_INSERT_SCENE_FRAMES } from "../scenes/BSTInsert";
import { TopViewTraversal, TOP_VIEW_SCENE_FRAMES } from "../scenes/TopViewTraversal";
import { LeftViewTraversal, LEFT_VIEW_SCENE_FRAMES } from "../scenes/LeftViewTraversal";
import { LevelOrder, LEVEL_ORDER_SCENE_FRAMES } from "../scenes/LevelOrder";
import { RightViewTraversal, RIGHT_VIEW_SCENE_FRAMES } from "../scenes/RightViewTraversal";
import { BoundaryTraversal, BOUNDARY_SCENE_FRAMES } from "../scenes/BoundaryTraversal";
import { TowerOfHanoi, TOWER_OF_HANOI_SCENE_FRAMES } from "../scenes/TowerOfHanoi";
import { DiagonalTraversal, DIAGONAL_SCENE_FRAMES } from "../scenes/DiagonalTraversal";
import { RightToLeftDiagonal, RTL_DIAGONAL_SCENE_FRAMES } from "../scenes/RightToLeftDiagonal";
import { CountTreeNodes, COUNT_TREE_NODES_SCENE_FRAMES } from "../scenes/CountTreeNodes";
import { VerticalOrderTraversal, VERTICAL_ORDER_SCENE_FRAMES } from "../scenes/VerticalOrderTraversal";
import { ZigzagTraversal, ZIGZAG_SCENE_FRAMES } from "../scenes/ZigzagTraversal";

interface TokenProps { tokens: ThemedToken[][] }
interface DualTokenProps {
  naiveTokens: ThemedToken[][];
  optimalTokens: ThemedToken[][];
  transitionInfo: { from: KeyedTokensInfo; to: KeyedTokensInfo };
}

export const InsertHeadVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Insert at Head" complexity="O(1)" sceneFrames={2756} nextTopic="Insert at Tail">
    <InsertHead tokens={tokens} />
  </StandaloneVideo>
);

export const InsertTailVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Insert at Tail" complexity="O(n)" sceneFrames={2911} nextTopic="Delete Node">
    <InsertTail tokens={tokens} />
  </StandaloneVideo>
);

export const DeleteNodeVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Delete Node" complexity="O(n)" sceneFrames={3822} nextTopic="Search">
    <DeleteNode tokens={tokens} />
  </StandaloneVideo>
);

export const SearchNodeVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Search" complexity="O(n)" sceneFrames={2622} nextTopic="Traverse">
    <SearchNode tokens={tokens} />
  </StandaloneVideo>
);

export const TraverseVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Traverse" complexity="O(n)" sceneFrames={280} nextTopic="Reverse">
    <Traverse tokens={tokens} />
  </StandaloneVideo>
);

export const ReverseVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Reverse" complexity="O(n)" sceneFrames={REVERSE_SCENE_FRAMES} nextTopic="Detect Cycle">
    <Reverse tokens={tokens} />
  </StandaloneVideo>
);

export const DetectCycleVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Detect Cycle" complexity="O(n)" subtitle="Floyd's Algorithm" sceneFrames={DETECT_CYCLE_SCENE_FRAMES} nextTopic="Merge Sorted Lists">
    <DetectCycle tokens={tokens} />
  </StandaloneVideo>
);

export const MergeListsVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Merge Sorted Lists" complexity="O(n + m)" sceneFrames={MERGE_LISTS_SCENE_FRAMES}>
    <MergeLists tokens={tokens} />
  </StandaloneVideo>
);

export const RemoveNthFromEndVideo: React.FC<DualTokenProps> = ({ naiveTokens, optimalTokens, transitionInfo }) => (
  <StandaloneVideo title="Remove Nth From End" complexity="O(n)" subtitle="Two-Pointer Technique" sceneFrames={REMOVE_NTH_SCENE_FRAMES}>
    <RemoveNthFromEnd naiveTokens={naiveTokens} optimalTokens={optimalTokens} transitionInfo={transitionInfo} />
  </StandaloneVideo>
);

export const ConstantTimeVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="O(1) — Constant Time" complexity="O(1)" sceneFrames={CONSTANT_TIME_SCENE_FRAMES} nextTopic="O(n) — Linear Time">
    <ConstantTime tokens={tokens} />
  </StandaloneVideo>
);

export const LinearSearchVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="O(n) — Linear Time" complexity="O(n)" sceneFrames={LINEAR_SEARCH_SCENE_FRAMES} nextTopic="O(log n) — Logarithmic Time">
    <LinearSearch tokens={tokens} />
  </StandaloneVideo>
);

export const BinarySearchVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="O(log n) — Logarithmic Time" complexity="O(log n)" sceneFrames={BINARY_SEARCH_SCENE_FRAMES} nextTopic="O(n²) — Quadratic Time">
    <BinarySearch tokens={tokens} />
  </StandaloneVideo>
);

export const BubbleSortVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="O(n²) — Quadratic Time" complexity="O(n²)" sceneFrames={BUBBLE_SORT_SCENE_FRAMES} nextTopic="O(n log n) — Linearithmic Time">
    <BubbleSort tokens={tokens} />
  </StandaloneVideo>
);

export const MergeSortVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="O(n log n) — Linearithmic Time" complexity="O(n log n)" sceneFrames={MERGE_SORT_SCENE_FRAMES} nextTopic="O(2ⁿ) — Exponential Time">
    <MergeSort tokens={tokens} />
  </StandaloneVideo>
);

export const ExponentialVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="O(2ⁿ) — Exponential Time" complexity="O(2ⁿ)" sceneFrames={EXPONENTIAL_SCENE_FRAMES} nextTopic="O(n!) — Factorial Time">
    <Exponential tokens={tokens} />
  </StandaloneVideo>
);

export const FactorialVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="O(n!) — Factorial Time" complexity="O(n!)" sceneFrames={FACTORIAL_SCENE_FRAMES}>
    <Factorial tokens={tokens} />
  </StandaloneVideo>
);

export const BSTInsertVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="BST Insert" complexity="O(h)" sceneFrames={BST_INSERT_SCENE_FRAMES} nextTopic="BST Search">
    <BSTInsert tokens={tokens} />
  </StandaloneVideo>
);

export const TopViewVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Top View" complexity="O(n)" sceneFrames={TOP_VIEW_SCENE_FRAMES}>
    <TopViewTraversal tokens={tokens} format="youtube" />
  </StandaloneVideo>
);

export const LeftViewVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Left View" complexity="O(n)" sceneFrames={LEFT_VIEW_SCENE_FRAMES}>
    <LeftViewTraversal tokens={tokens} format="youtube" />
  </StandaloneVideo>
);

export const LevelOrderVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Level Order" complexity="O(n)" sceneFrames={LEVEL_ORDER_SCENE_FRAMES} nextTopic="BST Insert">
    <LevelOrder tokens={tokens} format="youtube" />
  </StandaloneVideo>
);

export const RightViewVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Right View" complexity="O(n)" sceneFrames={RIGHT_VIEW_SCENE_FRAMES}>
    <RightViewTraversal tokens={tokens} format="youtube" />
  </StandaloneVideo>
);

export const BoundaryVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Boundary" complexity="O(n)" sceneFrames={BOUNDARY_SCENE_FRAMES}>
    <BoundaryTraversal tokens={tokens} format="youtube" />
  </StandaloneVideo>
);

export const TowerOfHanoiVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Tower of Hanoi" complexity="O(2ⁿ)" subtitle="Recursion Visualized" sceneFrames={TOWER_OF_HANOI_SCENE_FRAMES}>
    <TowerOfHanoi tokens={tokens} format="youtube" />
  </StandaloneVideo>
);

export const DiagonalVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Diagonal" complexity="O(n)" sceneFrames={DIAGONAL_SCENE_FRAMES}>
    <DiagonalTraversal tokens={tokens} format="youtube" />
  </StandaloneVideo>
);

export const DiagonalRLVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Diagonal RL" complexity="O(n)" sceneFrames={RTL_DIAGONAL_SCENE_FRAMES}>
    <RightToLeftDiagonal tokens={tokens} format="youtube" />
  </StandaloneVideo>
);

export const CountTreeNodesVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Count Tree Nodes" complexity="O(n)" subtitle="Recursive size of a binary tree" sceneFrames={COUNT_TREE_NODES_SCENE_FRAMES}>
    <CountTreeNodes tokens={tokens} format="youtube" />
  </StandaloneVideo>
);

export const VerticalOrderVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Vertical Order" complexity="O(n log n)" sceneFrames={VERTICAL_ORDER_SCENE_FRAMES}>
    <VerticalOrderTraversal tokens={tokens} format="youtube" />
  </StandaloneVideo>
);

export const ZigzagVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Zigzag Order" complexity="O(n)" sceneFrames={ZIGZAG_SCENE_FRAMES}>
    <ZigzagTraversal tokens={tokens} format="youtube" />
  </StandaloneVideo>
);
