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
