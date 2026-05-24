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
import { Traverse } from "../scenes/Traverse";
import { Reverse, REVERSE_SCENE_FRAMES } from "../scenes/Reverse";
import { DetectCycle, DETECT_CYCLE_SCENE_FRAMES } from "../scenes/DetectCycle";
import { MergeLists, MERGE_LISTS_SCENE_FRAMES } from "../scenes/MergeLists";
import { RemoveNthFromEnd, REMOVE_NTH_SCENE_FRAMES } from "../scenes/RemoveNthFromEnd";
import { CountTreeNodes, COUNT_TREE_NODES_SCENE_FRAMES } from "../scenes/CountTreeNodes";

interface TokenProps {
  tokens: ThemedToken[][];
}

interface DualTokenProps {
  naiveTokens: ThemedToken[][];
  optimalTokens: ThemedToken[][];
  transitionInfo: {
    from: KeyedTokensInfo;
    to: KeyedTokensInfo;
  };
}

export const InsertHeadVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Insert at Head"
    complexity="O(1)"
    sceneFrames={2756}
    nextTopic="Insert at Tail"
  >
    <InsertHead tokens={tokens} />
  </StandaloneVideo>
);

export const InsertHeadReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Insert at Head"
    complexity="O(1)"
    sceneFrames={2756}
    nextTopic="Insert at Tail"
  >
    <InsertHead tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const InsertTailVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Insert at Tail"
    complexity="O(n)"
    sceneFrames={2911}
    nextTopic="Delete Node"
  >
    <InsertTail tokens={tokens} />
  </StandaloneVideo>
);

export const InsertTailReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Insert at Tail"
    complexity="O(n)"
    sceneFrames={2911}
    nextTopic="Delete Node"
  >
    <InsertTail tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DeleteNodeVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Delete Node"
    complexity="O(n)"
    sceneFrames={3822}
    nextTopic="Search"
  >
    <DeleteNode tokens={tokens} />
  </StandaloneVideo>
);

export const DeleteNodeReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Delete Node"
    complexity="O(n)"
    sceneFrames={3822}
    nextTopic="Search"
  >
    <DeleteNode tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DeleteHeadReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Delete Head"
    complexity="O(1)"
    sceneFrames={1245}
    nextTopic="Delete Middle"
  >
    <DeleteHead tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DeleteMiddleReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Delete Middle"
    complexity="O(n)"
    sceneFrames={1425}
    nextTopic="Delete Tail"
  >
    <DeleteMiddle tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DeleteTailReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Delete Tail"
    complexity="O(n)"
    sceneFrames={1185}
    nextTopic="Search"
  >
    <DeleteTail tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const SearchNodeVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Search"
    complexity="O(n)"
    sceneFrames={2622}
    nextTopic="Traverse"
  >
    <SearchNode tokens={tokens} />
  </StandaloneVideo>
);

export const SearchNodeReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Search"
    complexity="O(n)"
    sceneFrames={2622}
    nextTopic="Traverse"
  >
    <SearchNode tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const TraverseVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Traverse"
    complexity="O(n)"
    sceneFrames={280}
    nextTopic="Reverse"
  >
    <Traverse tokens={tokens} />
  </StandaloneVideo>
);

export const ReverseVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Reverse"
    complexity="O(n)"
    sceneFrames={REVERSE_SCENE_FRAMES}
    nextTopic="Detect Cycle"
  >
    <Reverse tokens={tokens} />
  </StandaloneVideo>
);

export const ReverseReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Reverse"
    complexity="O(n)"
    sceneFrames={REVERSE_SCENE_FRAMES}
    nextTopic="Detect Cycle"
  >
    <Reverse tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const DetectCycleVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Detect Cycle"
    complexity="O(n)"
    subtitle="Floyd's Algorithm"
    sceneFrames={DETECT_CYCLE_SCENE_FRAMES}
    nextTopic="Merge Sorted Lists"
  >
    <DetectCycle tokens={tokens} />
  </StandaloneVideo>
);

export const DetectCycleReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Detect Cycle"
    complexity="O(n)"
    subtitle="Floyd's Algorithm"
    sceneFrames={DETECT_CYCLE_SCENE_FRAMES}
    nextTopic="Merge Sorted Lists"
  >
    <DetectCycle tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const MergeListsVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Merge Sorted Lists"
    complexity="O(n + m)"
    sceneFrames={MERGE_LISTS_SCENE_FRAMES}
  >
    <MergeLists tokens={tokens} />
  </StandaloneVideo>
);

export const MergeListsReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Merge Sorted Lists"
    complexity="O(n + m)"
    sceneFrames={MERGE_LISTS_SCENE_FRAMES}
  >
    <MergeLists tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const RemoveNthFromEndVideo: React.FC<DualTokenProps> = ({
  naiveTokens,
  optimalTokens,
  transitionInfo,
}) => (
  <StandaloneVideo
    title="Remove Nth From End"
    complexity="O(n)"
    subtitle="Two-Pointer Technique"
    sceneFrames={REMOVE_NTH_SCENE_FRAMES}
  >
    <RemoveNthFromEnd
      naiveTokens={naiveTokens}
      optimalTokens={optimalTokens}
      transitionInfo={transitionInfo}
    />
  </StandaloneVideo>
);

export const RemoveNthFromEndReel: React.FC<DualTokenProps> = ({
  naiveTokens,
  optimalTokens,
  transitionInfo,
}) => (
  <StandaloneVideo
    title="Remove Nth From End"
    complexity="O(n)"
    subtitle="Two-Pointer Technique"
    sceneFrames={REMOVE_NTH_SCENE_FRAMES}
  >
    <RemoveNthFromEnd
      naiveTokens={naiveTokens}
      optimalTokens={optimalTokens}
      transitionInfo={transitionInfo}
      format="reel"
    />
  </StandaloneVideo>
);

export const CountTreeNodesVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Count Tree Nodes"
    complexity="O(n)"
    subtitle="Recursive size of a binary tree"
    sceneFrames={COUNT_TREE_NODES_SCENE_FRAMES}
  >
    <CountTreeNodes tokens={tokens} />
  </StandaloneVideo>
);

export const CountTreeNodesReel: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Count Tree Nodes"
    complexity="O(n)"
    subtitle="Recursive size of a binary tree"
    sceneFrames={COUNT_TREE_NODES_SCENE_FRAMES}
  >
    <CountTreeNodes tokens={tokens} format="reel" />
  </StandaloneVideo>
);

export const CountTreeNodesReelAnim: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Count Tree Nodes"
    complexity="O(n)"
    subtitle="Recursive size of a binary tree"
    sceneFrames={COUNT_TREE_NODES_SCENE_FRAMES}
  >
    <CountTreeNodes tokens={tokens} format="reel-anim" />
  </StandaloneVideo>
);
