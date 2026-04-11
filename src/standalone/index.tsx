import React from "react";
import type { ThemedToken } from "shiki";
import { StandaloneVideo } from "../StandaloneVideo";
import { InsertHead } from "../scenes/InsertHead";
import { InsertTail } from "../scenes/InsertTail";
import { DeleteNode } from "../scenes/DeleteNode";
import { DeleteHead } from "../scenes/DeleteHead";
import { DeleteMiddle } from "../scenes/DeleteMiddle";
import { DeleteTail } from "../scenes/DeleteTail";
import { SearchNode } from "../scenes/SearchNode";
import { Traverse } from "../scenes/Traverse";
import { Reverse } from "../scenes/Reverse";
import { DetectCycle } from "../scenes/DetectCycle";
import { MergeLists } from "../scenes/MergeLists";

interface TokenProps {
  tokens: ThemedToken[][];
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
    sceneFrames={400}
    nextTopic="Detect Cycle"
  >
    <Reverse tokens={tokens} />
  </StandaloneVideo>
);

export const DetectCycleVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Detect Cycle"
    complexity="O(n)"
    subtitle="Floyd's Algorithm"
    sceneFrames={360}
    nextTopic="Merge Sorted Lists"
  >
    <DetectCycle tokens={tokens} />
  </StandaloneVideo>
);

export const MergeListsVideo: React.FC<TokenProps> = ({ tokens }) => (
  <StandaloneVideo
    title="Merge Sorted Lists"
    complexity="O(n + m)"
    sceneFrames={400}
  >
    <MergeLists tokens={tokens} />
  </StandaloneVideo>
);
