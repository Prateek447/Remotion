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

interface TokenProps { tokens: ThemedToken[][] }
interface DualTokenProps {
  naiveTokens: ThemedToken[][];
  optimalTokens: ThemedToken[][];
  transitionInfo: { from: KeyedTokensInfo; to: KeyedTokensInfo };
}

export const InsertHeadReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Insert at Head" complexity="O(1)" sceneFrames={2756} nextTopic="Insert at Tail">
    <InsertHead tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const InsertTailReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Insert at Tail" complexity="O(n)" sceneFrames={2911} nextTopic="Delete Node">
    <InsertTail tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const DeleteNodeReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Delete Node" complexity="O(n)" sceneFrames={3822} nextTopic="Search">
    <DeleteNode tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const DeleteHeadReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Delete Head" complexity="O(1)" sceneFrames={1245} nextTopic="Delete Middle">
    <DeleteHead tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const DeleteMiddleReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Delete Middle" complexity="O(n)" sceneFrames={1425} nextTopic="Delete Tail">
    <DeleteMiddle tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const DeleteTailReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Delete Tail" complexity="O(n)" sceneFrames={1185} nextTopic="Search">
    <DeleteTail tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const SearchNodeReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Search" complexity="O(n)" sceneFrames={2622} nextTopic="Traverse">
    <SearchNode tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const ReverseReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Reverse" complexity="O(n)" sceneFrames={REVERSE_SCENE_FRAMES} nextTopic="Detect Cycle">
    <Reverse tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const DetectCycleReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Detect Cycle" complexity="O(n)" subtitle="Floyd's Algorithm" sceneFrames={DETECT_CYCLE_SCENE_FRAMES} nextTopic="Merge Sorted Lists">
    <DetectCycle tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const MergeListsReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Merge Sorted Lists" complexity="O(n + m)" sceneFrames={MERGE_LISTS_SCENE_FRAMES}>
    <MergeLists tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const RemoveNthFromEndReelAnim: React.FC<DualTokenProps> = ({ naiveTokens, optimalTokens, transitionInfo }) => (
  <StandaloneVideo title="Remove Nth From End" complexity="O(n)" subtitle="Two-Pointer Technique" sceneFrames={REMOVE_NTH_SCENE_FRAMES}>
    <RemoveNthFromEnd naiveTokens={naiveTokens} optimalTokens={optimalTokens} transitionInfo={transitionInfo} format="reel-anim" />
  </StandaloneVideo>
);

export const BSTInsertReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="BST Insert" complexity="O(h)" sceneFrames={BST_INSERT_SCENE_FRAMES}>
    <BSTInsert tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const TopViewReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Top View" complexity="O(n)" sceneFrames={TOP_VIEW_SCENE_FRAMES}>
    <TopViewTraversal tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const LeftViewReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Left View" complexity="O(n)" sceneFrames={LEFT_VIEW_SCENE_FRAMES}>
    <LeftViewTraversal tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const LevelOrderReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Level Order" complexity="O(n)" sceneFrames={LEVEL_ORDER_SCENE_FRAMES}>
    <LevelOrder tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const RightViewReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Right View" complexity="O(n)" sceneFrames={RIGHT_VIEW_SCENE_FRAMES}>
    <RightViewTraversal tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const BoundaryReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Boundary" complexity="O(n)" sceneFrames={BOUNDARY_SCENE_FRAMES}>
    <BoundaryTraversal tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const TowerOfHanoiReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Tower of Hanoi" complexity="O(2ⁿ)" subtitle="Recursion Visualized" sceneFrames={TOWER_OF_HANOI_SCENE_FRAMES}>
    <TowerOfHanoi tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const DiagonalReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Diagonal" complexity="O(n)" sceneFrames={DIAGONAL_SCENE_FRAMES}>
    <DiagonalTraversal tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);

export const DiagonalRLReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo title="Binary Tree — Diagonal RL" complexity="O(n)" sceneFrames={RTL_DIAGONAL_SCENE_FRAMES}>
    <RightToLeftDiagonal tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);
