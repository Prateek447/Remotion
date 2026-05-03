import React from "react";
import { Composition, Folder } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import type { ThemedToken } from "shiki";
import type { KeyedTokensInfo } from "./lib/magic-move";
import "./index.css";

import { highlightCode, computeKeyedTokens, computeTransitionPair } from "./lib/highlight";
import {
  insertAtHeadCode,
  insertAtTailCode,
  deleteNodeCode,
  searchNodeCode,
  traverseCode,
  reverseCode,
  detectCycleCode,
  mergeSortedCode,
  removeNthNaiveCode,
  removeNthOptimalCode,
} from "./data/code-snippets";

import { InsertHead } from "./scenes/InsertHead";
import { InsertTail } from "./scenes/InsertTail";
import { DeleteNode } from "./scenes/DeleteNode";
import { SearchNode } from "./scenes/SearchNode";
import { Traverse } from "./scenes/Traverse";
import { Reverse, REVERSE_SCENE_FRAMES } from "./scenes/Reverse";
import { DetectCycle, DETECT_CYCLE_SCENE_FRAMES } from "./scenes/DetectCycle";
import { MergeLists, MERGE_LISTS_SCENE_FRAMES } from "./scenes/MergeLists";
import { RemoveNthFromEnd, REMOVE_NTH_SCENE_FRAMES } from "./scenes/RemoveNthFromEnd";
import { FullVideo, FULL_VIDEO_DURATION } from "./FullVideo";
import { TitleCard } from "./components/TitleCard";
import { standaloneDuration } from "./StandaloneVideo";
import {
  InsertHeadVideo,
  InsertTailVideo,
  DeleteNodeVideo,
  SearchNodeVideo,
  TraverseVideo,
  ReverseVideo,
  DetectCycleVideo,
  MergeListsVideo,
  InsertHeadReel,
  InsertTailReel,
  DeleteNodeReel,
  DeleteHeadReel,
  DeleteMiddleReel,
  DeleteTailReel,
  ReverseReel,
  DetectCycleReel,
  MergeListsReel,
  RemoveNthFromEndVideo,
  RemoveNthFromEndReel,
} from "./standalone";

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;

const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920;

interface TokenProps {
  tokens: ThemedToken[][];
}

const makeCalcMetadata = (code: string): CalculateMetadataFunction<TokenProps> => {
  return async () => {
    const tokens = await highlightCode(code);
    return { props: { tokens } };
  };
};

interface DualTokenProps {
  naiveTokens: ThemedToken[][];
  optimalTokens: ThemedToken[][];
  // Pre-synced keyed tokens for the naive -> optimal morph animation.
  // Matching tokens share keys so they tween position/color.
  transitionInfo: {
    from: KeyedTokensInfo;
    to: KeyedTokensInfo;
  };
}

const makeDualCalcMetadata = (
  naiveCode: string,
  optimalCode: string,
): CalculateMetadataFunction<DualTokenProps> => {
  return async () => {
    const [naiveTokens, optimalTokens, naiveKeyed, optimalKeyed] = await Promise.all([
      highlightCode(naiveCode),
      highlightCode(optimalCode),
      computeKeyedTokens(naiveCode),
      computeKeyedTokens(optimalCode),
    ]);
    const transitionInfo = computeTransitionPair(naiveKeyed, optimalKeyed);
    return { props: { naiveTokens, optimalTokens, transitionInfo } };
  };
};

export interface TransitionPair {
  from: KeyedTokensInfo;
  to: KeyedTokensInfo;
}

export interface FullVideoProps {
  insertHeadTokens: ThemedToken[][];
  insertTailTokens: ThemedToken[][];
  deleteTokens: ThemedToken[][];
  searchTokens: ThemedToken[][];
  traverseTokens: ThemedToken[][];
  reverseTokens: ThemedToken[][];
  detectCycleTokens: ThemedToken[][];
  mergeTokens: ThemedToken[][];
  transitions: TransitionPair[];
}

const codeSources = [
  insertAtHeadCode,
  insertAtTailCode,
  deleteNodeCode,
  searchNodeCode,
  traverseCode,
  reverseCode,
  detectCycleCode,
  mergeSortedCode,
];

const calcFullVideoMetadata: CalculateMetadataFunction<FullVideoProps> = async () => {
  const [
    insertHeadTokens,
    insertTailTokens,
    deleteTokens,
    searchTokens,
    traverseTokens,
    reverseTokens,
    detectCycleTokens,
    mergeTokens,
  ] = await Promise.all(codeSources.map((c) => highlightCode(c)));

  const keyedAll = await Promise.all(codeSources.map((c) => computeKeyedTokens(c)));

  const transitions: TransitionPair[] = [];
  for (let i = 0; i < keyedAll.length - 1; i++) {
    transitions.push(computeTransitionPair(keyedAll[i], keyedAll[i + 1]));
  }

  return {
    props: {
      insertHeadTokens,
      insertTailTokens,
      deleteTokens,
      searchTokens,
      traverseTokens,
      reverseTokens,
      detectCycleTokens,
      mergeTokens,
      transitions,
    },
  };
};

const emptyTokens: ThemedToken[][] = [];
const emptyTransitions: TransitionPair[] = [];
const emptyKeyedTokens: KeyedTokensInfo = { code: "", hash: "", tokens: [] };
const emptyDualTransition = { from: emptyKeyedTokens, to: emptyKeyedTokens };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TitleIntro"
        component={TitleCard}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          title: "Linked List Operations",
          subtitle: "A visual guide to fundamental data structures",
        }}
      />

      <Folder name="Scenes">
        <Composition
          id="InsertHead"
          component={InsertHead}
          durationInFrames={2756}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(insertAtHeadCode)}
        />
        <Composition
          id="InsertTail"
          component={InsertTail}
          durationInFrames={2911}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(insertAtTailCode)}
        />
        <Composition
          id="DeleteNode"
          component={DeleteNode}
          durationInFrames={315}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(deleteNodeCode)}
        />
        <Composition
          id="SearchNode"
          component={SearchNode}
          durationInFrames={315}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(searchNodeCode)}
        />
        <Composition
          id="Traverse"
          component={Traverse}
          durationInFrames={280}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(traverseCode)}
        />
        <Composition
          id="Reverse"
          component={Reverse}
          durationInFrames={REVERSE_SCENE_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(reverseCode)}
        />
        <Composition
          id="DetectCycle"
          component={DetectCycle}
          durationInFrames={DETECT_CYCLE_SCENE_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(detectCycleCode)}
        />
        <Composition
          id="MergeLists"
          component={MergeLists}
          durationInFrames={MERGE_LISTS_SCENE_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(mergeSortedCode)}
        />
      </Folder>

      <Composition
        id="FullVideo"
        component={FullVideo}
        durationInFrames={FULL_VIDEO_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          insertHeadTokens: emptyTokens,
          insertTailTokens: emptyTokens,
          deleteTokens: emptyTokens,
          searchTokens: emptyTokens,
          traverseTokens: emptyTokens,
          reverseTokens: emptyTokens,
          detectCycleTokens: emptyTokens,
          mergeTokens: emptyTokens,
          transitions: emptyTransitions,
        }}
        calculateMetadata={calcFullVideoMetadata}
      />

      <Folder name="Standalone">
        <Composition
          id="Video-InsertHead"
          component={InsertHeadVideo}
          durationInFrames={standaloneDuration(2756)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(insertAtHeadCode)}
        />
        <Composition
          id="Video-InsertTail"
          component={InsertTailVideo}
          durationInFrames={standaloneDuration(2911)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(insertAtTailCode)}
        />
        <Composition
          id="Video-DeleteNode"
          component={DeleteNodeVideo}
          durationInFrames={standaloneDuration(3822)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(deleteNodeCode)}
        />
        <Composition
          id="Video-SearchNode"
          component={SearchNodeVideo}
          durationInFrames={standaloneDuration(315)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(searchNodeCode)}
        />
        <Composition
          id="Video-Traverse"
          component={TraverseVideo}
          durationInFrames={standaloneDuration(280)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(traverseCode)}
        />
        <Composition
          id="Video-Reverse"
          component={ReverseVideo}
          durationInFrames={standaloneDuration(REVERSE_SCENE_FRAMES)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(reverseCode)}
        />
        <Composition
          id="Video-DetectCycle"
          component={DetectCycleVideo}
          durationInFrames={standaloneDuration(DETECT_CYCLE_SCENE_FRAMES)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(detectCycleCode)}
        />
        <Composition
          id="Video-MergeLists"
          component={MergeListsVideo}
          durationInFrames={standaloneDuration(MERGE_LISTS_SCENE_FRAMES)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(mergeSortedCode)}
        />
      </Folder>

      <Folder name="Reels">
        <Composition
          id="Reel-InsertHead"
          component={InsertHeadReel}
          durationInFrames={standaloneDuration(2756)}
          fps={FPS}
          width={REEL_WIDTH}
          height={REEL_HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(insertAtHeadCode)}
        />
        <Composition
          id="Reel-InsertTail"
          component={InsertTailReel}
          durationInFrames={standaloneDuration(2911)}
          fps={FPS}
          width={REEL_WIDTH}
          height={REEL_HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(insertAtTailCode)}
        />
        <Composition
          id="Reel-DeleteNode"
          component={DeleteNodeReel}
          durationInFrames={standaloneDuration(3822)}
          fps={FPS}
          width={REEL_WIDTH}
          height={REEL_HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(deleteNodeCode)}
        />
        <Composition
          id="Reel-DeleteHead"
          component={DeleteHeadReel}
          durationInFrames={standaloneDuration(1245)}
          fps={FPS}
          width={REEL_WIDTH}
          height={REEL_HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(deleteNodeCode)}
        />
        <Composition
          id="Reel-DeleteMiddle"
          component={DeleteMiddleReel}
          durationInFrames={standaloneDuration(1425)}
          fps={FPS}
          width={REEL_WIDTH}
          height={REEL_HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(deleteNodeCode)}
        />
        <Composition
          id="Reel-DeleteTail"
          component={DeleteTailReel}
          durationInFrames={standaloneDuration(1185)}
          fps={FPS}
          width={REEL_WIDTH}
          height={REEL_HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(deleteNodeCode)}
        />
        <Composition
          id="Reel-Reverse"
          component={ReverseReel}
          durationInFrames={standaloneDuration(REVERSE_SCENE_FRAMES)}
          fps={FPS}
          width={REEL_WIDTH}
          height={REEL_HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(reverseCode)}
        />
        <Composition
          id="Reel-DetectCycle"
          component={DetectCycleReel}
          durationInFrames={standaloneDuration(DETECT_CYCLE_SCENE_FRAMES)}
          fps={FPS}
          width={REEL_WIDTH}
          height={REEL_HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(detectCycleCode)}
        />
        <Composition
          id="Reel-MergeLists"
          component={MergeListsReel}
          durationInFrames={standaloneDuration(MERGE_LISTS_SCENE_FRAMES)}
          fps={FPS}
          width={REEL_WIDTH}
          height={REEL_HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(mergeSortedCode)}
        />
      </Folder>

      <Folder name="LeetCode">
        <Composition
          id="RemoveNthFromEnd"
          component={RemoveNthFromEnd}
          durationInFrames={REMOVE_NTH_SCENE_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ naiveTokens: emptyTokens, optimalTokens: emptyTokens, transitionInfo: emptyDualTransition }}
          calculateMetadata={makeDualCalcMetadata(removeNthNaiveCode, removeNthOptimalCode)}
        />
        <Composition
          id="Video-RemoveNthFromEnd"
          component={RemoveNthFromEndVideo}
          durationInFrames={standaloneDuration(REMOVE_NTH_SCENE_FRAMES)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ naiveTokens: emptyTokens, optimalTokens: emptyTokens, transitionInfo: emptyDualTransition }}
          calculateMetadata={makeDualCalcMetadata(removeNthNaiveCode, removeNthOptimalCode)}
        />
        <Composition
          id="Reel-RemoveNthFromEnd"
          component={RemoveNthFromEndReel}
          durationInFrames={standaloneDuration(REMOVE_NTH_SCENE_FRAMES)}
          fps={FPS}
          width={REEL_WIDTH}
          height={REEL_HEIGHT}
          defaultProps={{ naiveTokens: emptyTokens, optimalTokens: emptyTokens, transitionInfo: emptyDualTransition }}
          calculateMetadata={makeDualCalcMetadata(removeNthNaiveCode, removeNthOptimalCode)}
        />
      </Folder>
    </>
  );
};
