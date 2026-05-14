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
