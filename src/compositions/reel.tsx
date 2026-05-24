import React from "react";
import type { ThemedToken } from "shiki";
import type { KeyedTokensInfo } from "../lib/magic-move";
import { StandaloneVideo } from "../StandaloneVideo";
import { InsertHead } from "../scenes/InsertHead";
import { InsertTail } from "../scenes/InsertTail";
import { DeleteNode } from "../scenes/DeleteNode";
import { DeleteHead } from "../scenes/DeleteHead";
import { DeleteMiddle } from "../scenes/DeleteMiddle";
import { DeleteTail } from "../scenes/DeleteTail";
import { SearchNode } from "../scenes/SearchNode";
import { Reverse, REVERSE_SCENE_FRAMES } from "../scenes/Reverse";
import { DetectCycle, DETECT_CYCLE_SCENE_FRAMES } from "../scenes/DetectCycle";
import { MergeLists, MERGE_LISTS_SCENE_FRAMES } from "../scenes/MergeLists";
import { RemoveNthFromEnd, REMOVE_NTH_SCENE_FRAMES } from "../scenes/RemoveNthFromEnd";
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

export const InsertHeadReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Insert at Head" complexity="O(1)" sceneFrames={2756} nextTopic="Insert at Tail">
    <InsertHead tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const InsertTailReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Insert at Tail" complexity="O(n)" sceneFrames={2911} nextTopic="Delete Node">
    <InsertTail tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DeleteNodeReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Delete Node" complexity="O(n)" sceneFrames={3822} nextTopic="Search">
    <DeleteNode tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DeleteHeadReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Delete Head" complexity="O(1)" sceneFrames={1245} nextTopic="Delete Middle">
    <DeleteHead tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DeleteMiddleReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Delete Middle" complexity="O(n)" sceneFrames={1425} nextTopic="Delete Tail">
    <DeleteMiddle tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DeleteTailReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Delete Tail" complexity="O(n)" sceneFrames={1185} nextTopic="Search">
    <DeleteTail tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const SearchNodeReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Search" complexity="O(n)" sceneFrames={2622} nextTopic="Traverse">
    <SearchNode tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const ReverseReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Reverse" complexity="O(n)" sceneFrames={REVERSE_SCENE_FRAMES} nextTopic="Detect Cycle">
    <Reverse tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DetectCycleReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Detect Cycle" complexity="O(n)" subtitle="Floyd's Algorithm" sceneFrames={DETECT_CYCLE_SCENE_FRAMES} nextTopic="Merge Sorted Lists">
    <DetectCycle tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const MergeListsReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Merge Sorted Lists" complexity="O(n + m)" sceneFrames={MERGE_LISTS_SCENE_FRAMES}>
    <MergeLists tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const RemoveNthFromEndReel: React.FC<DualTokenProps> = ({ naiveTokens, optimalTokens, transitionInfo }) => (
  <StandaloneVideo title="Remove Nth From End" complexity="O(n)" subtitle="Two-Pointer Technique" sceneFrames={REMOVE_NTH_SCENE_FRAMES}>
    <RemoveNthFromEnd naiveTokens={naiveTokens} optimalTokens={optimalTokens} transitionInfo={transitionInfo} format="reel" />
  </StandaloneVideo>
);

export const BSTInsertReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="BST Insert" complexity="O(h)" sceneFrames={BST_INSERT_SCENE_FRAMES} nextTopic="BST Search">
    <BSTInsert tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const TopViewReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Top View" complexity="O(n)" sceneFrames={TOP_VIEW_SCENE_FRAMES}>
    <TopViewTraversal tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const LeftViewReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Left View" complexity="O(n)" sceneFrames={LEFT_VIEW_SCENE_FRAMES}>
    <LeftViewTraversal tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const LevelOrderReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Level Order" complexity="O(n)" sceneFrames={LEVEL_ORDER_SCENE_FRAMES}>
    <LevelOrder tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const RightViewReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Right View" complexity="O(n)" sceneFrames={RIGHT_VIEW_SCENE_FRAMES}>
    <RightViewTraversal tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const BoundaryReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Boundary" complexity="O(n)" sceneFrames={BOUNDARY_SCENE_FRAMES}>
    <BoundaryTraversal tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const TowerOfHanoiReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Tower of Hanoi" complexity="O(2ⁿ)" subtitle="Recursion Visualized" sceneFrames={TOWER_OF_HANOI_SCENE_FRAMES}>
    <TowerOfHanoi tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DiagonalReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Diagonal" complexity="O(n)" sceneFrames={DIAGONAL_SCENE_FRAMES}>
    <DiagonalTraversal tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DiagonalRLReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Diagonal RL" complexity="O(n)" sceneFrames={RTL_DIAGONAL_SCENE_FRAMES}>
    <RightToLeftDiagonal tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const CountTreeNodesReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Count Tree Nodes" complexity="O(n)" subtitle="Recursive size of a binary tree" sceneFrames={COUNT_TREE_NODES_SCENE_FRAMES}>
    <CountTreeNodes tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const VerticalOrderReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Vertical Order" complexity="O(n log n)" sceneFrames={VERTICAL_ORDER_SCENE_FRAMES}>
    <VerticalOrderTraversal tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const ZigzagReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Zigzag Order" complexity="O(n)" sceneFrames={ZIGZAG_SCENE_FRAMES}>
    <ZigzagTraversal tokens={tokens} format="reel" />
  </StandaloneVideo>
);
