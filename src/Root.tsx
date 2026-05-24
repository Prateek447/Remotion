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
  linearSearchCode,
  binarySearchCode,
  bubbleSortCode,
  mergeSortCode,
  fibonacciCode,
  permutationsCode,
  bstInsertCode,
  towerOfHanoiCode,
  topViewCode,
  leftViewCode,
  levelOrderCode,
  rightViewCode,
  boundaryCode,
  diagonalCode,
  rtlDiagonalCode,
  countTreeNodesCode,
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
import { ConstantTime, CONSTANT_TIME_SCENE_FRAMES } from "./scenes/ConstantTime";
import { LinearSearch, LINEAR_SEARCH_SCENE_FRAMES } from "./scenes/LinearSearch";
import { BinarySearch, BINARY_SEARCH_SCENE_FRAMES } from "./scenes/BinarySearch";
import { BubbleSort, BUBBLE_SORT_SCENE_FRAMES } from "./scenes/BubbleSort";
import { MergeSort, MERGE_SORT_SCENE_FRAMES } from "./scenes/MergeSort";
import { Exponential, EXPONENTIAL_SCENE_FRAMES } from "./scenes/Exponential";
import { Factorial, FACTORIAL_SCENE_FRAMES } from "./scenes/Factorial";
import { TLSHandshake, TLS_HANDSHAKE_SCENE_FRAMES } from "./scenes/TLSHandshake";
import { BSTInsert, BST_INSERT_SCENE_FRAMES } from "./scenes/BSTInsert";
import { TopViewTraversal, TOP_VIEW_SCENE_FRAMES } from "./scenes/TopViewTraversal";
import { LeftViewTraversal, LEFT_VIEW_SCENE_FRAMES } from "./scenes/LeftViewTraversal";
import { LevelOrder, LEVEL_ORDER_SCENE_FRAMES } from "./scenes/LevelOrder";
import { RightViewTraversal, RIGHT_VIEW_SCENE_FRAMES } from "./scenes/RightViewTraversal";
import { BoundaryTraversal, BOUNDARY_SCENE_FRAMES } from "./scenes/BoundaryTraversal";
import { TowerOfHanoi, TOWER_OF_HANOI_SCENE_FRAMES } from "./scenes/TowerOfHanoi";
import { DiagonalTraversal, DIAGONAL_SCENE_FRAMES } from "./scenes/DiagonalTraversal";
import { RightToLeftDiagonal, RTL_DIAGONAL_SCENE_FRAMES } from "./scenes/RightToLeftDiagonal";
import { CountTreeNodes, COUNT_TREE_NODES_SCENE_FRAMES } from "./scenes/CountTreeNodes";
import { TLSThumbnail } from "./thumbnails/TLSThumbnail";
import { FactorialThumbnail } from "./thumbnails/FactorialThumbnail";
import { DetectCycleThumbnail } from "./thumbnails/DetectCycleThumbnail";
import { RemoveNthThumbnail } from "./thumbnails/RemoveNthThumbnail";
import { BinaryTreeThumbnail } from "./thumbnails/BinaryTreeThumbnail";
import { FullVideo, FULL_VIDEO_DURATION } from "./FullVideo";
import { TitleCard } from "./components/TitleCard";
import { standaloneDuration } from "./StandaloneVideo";
import { ANIM_FRAMES_PER_STEP } from "./lib/animSteps";
import {
  // YouTube
  InsertHeadVideo, InsertTailVideo, DeleteNodeVideo, SearchNodeVideo,
  TraverseVideo, ReverseVideo, DetectCycleVideo, MergeListsVideo, RemoveNthFromEndVideo,
  ConstantTimeVideo, LinearSearchVideo, BinarySearchVideo, BubbleSortVideo,
  MergeSortVideo, ExponentialVideo, FactorialVideo, BSTInsertVideo,
  TopViewVideo, LeftViewVideo, LevelOrderVideo, RightViewVideo, BoundaryVideo,
  TowerOfHanoiVideo,
  DiagonalVideo,
  DiagonalRLVideo,
  // Reels with code
  InsertHeadReel, InsertTailReel, DeleteNodeReel, SearchNodeReel,
  DeleteHeadReel, DeleteMiddleReel, DeleteTailReel,
  ReverseReel, DetectCycleReel, MergeListsReel, RemoveNthFromEndReel, BSTInsertReel,
  TopViewReel, LeftViewReel, LevelOrderReel, RightViewReel, BoundaryReel,
  TowerOfHanoiReel,
  DiagonalReel,
  DiagonalRLReel,
  // Reels animation only
  InsertHeadReelAnim, InsertTailReelAnim, DeleteNodeReelAnim, SearchNodeReelAnim,
  DeleteHeadReelAnim, DeleteMiddleReelAnim, DeleteTailReelAnim,
  ReverseReelAnim, DetectCycleReelAnim, MergeListsReelAnim, RemoveNthFromEndReelAnim,
  BSTInsertReelAnim, TopViewReelAnim, LeftViewReelAnim, LevelOrderReelAnim, RightViewReelAnim, BoundaryReelAnim,
  TowerOfHanoiReelAnim,
  DiagonalReelAnim,
  DiagonalRLReelAnim,
  CountTreeNodesVideo,
  CountTreeNodesReel,
  CountTreeNodesReelAnim,
} from "./compositions";

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
        id="BinaryTree-Thumbnail"
        component={BinaryTreeThumbnail}
        durationInFrames={1}
        fps={FPS}
        width={1080}
        height={1920}
      />

      <Composition
        id="TLS-Thumbnail"
        component={TLSThumbnail}
        durationInFrames={1}
        fps={FPS}
        width={1280}
        height={720}
      />

      <Composition
        id="DetectCycle-Thumbnail"
        component={DetectCycleThumbnail}
        durationInFrames={1}
        fps={FPS}
        width={1280}
        height={720}
      />

      <Composition
        id="RemoveNth-Thumbnail"
        component={RemoveNthThumbnail}
        durationInFrames={1}
        fps={FPS}
        width={1280}
        height={720}
      />

      <Composition
        id="Factorial-Thumbnail"
        component={FactorialThumbnail}
        durationInFrames={1}
        fps={FPS}
        width={1280}
        height={720}
      />

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
          durationInFrames={2622}
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
        <Composition
          id="CountTreeNodes"
          component={CountTreeNodes}
          durationInFrames={COUNT_TREE_NODES_SCENE_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ tokens: emptyTokens }}
          calculateMetadata={makeCalcMetadata(countTreeNodesCode)}
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

      <Folder name="LinkedList">
        <Folder name="InsertHead">
          <Composition id="Video-InsertHead" component={InsertHeadVideo} durationInFrames={standaloneDuration(2756)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(insertAtHeadCode)} />
          <Composition id="Reel-InsertHead" component={InsertHeadReel} durationInFrames={standaloneDuration(2756)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(insertAtHeadCode)} />
          <Composition id="Anim-InsertHead" component={InsertHeadReelAnim} durationInFrames={standaloneDuration(14 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(insertAtHeadCode)} />
        </Folder>
        <Folder name="InsertTail">
          <Composition id="Video-InsertTail" component={InsertTailVideo} durationInFrames={standaloneDuration(2911)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(insertAtTailCode)} />
          <Composition id="Reel-InsertTail" component={InsertTailReel} durationInFrames={standaloneDuration(2911)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(insertAtTailCode)} />
          <Composition id="Anim-InsertTail" component={InsertTailReelAnim} durationInFrames={standaloneDuration(15 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(insertAtTailCode)} />
        </Folder>
        <Folder name="DeleteNode">
          <Composition id="Video-DeleteNode" component={DeleteNodeVideo} durationInFrames={standaloneDuration(3822)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(deleteNodeCode)} />
          <Composition id="Reel-DeleteNode" component={DeleteNodeReel} durationInFrames={standaloneDuration(3822)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(deleteNodeCode)} />
          <Composition id="Anim-DeleteNode" component={DeleteNodeReelAnim} durationInFrames={standaloneDuration(17 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(deleteNodeCode)} />
        </Folder>
        <Folder name="DeleteHead">
          <Composition id="Reel-DeleteHead" component={DeleteHeadReel} durationInFrames={standaloneDuration(1245)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(deleteNodeCode)} />
          <Composition id="Anim-DeleteHead" component={DeleteHeadReelAnim} durationInFrames={standaloneDuration(5 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(deleteNodeCode)} />
        </Folder>
        <Folder name="DeleteMiddle">
          <Composition id="Reel-DeleteMiddle" component={DeleteMiddleReel} durationInFrames={standaloneDuration(1425)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(deleteNodeCode)} />
          <Composition id="Anim-DeleteMiddle" component={DeleteMiddleReelAnim} durationInFrames={standaloneDuration(6 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(deleteNodeCode)} />
        </Folder>
        <Folder name="DeleteTail">
          <Composition id="Reel-DeleteTail" component={DeleteTailReel} durationInFrames={standaloneDuration(1185)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(deleteNodeCode)} />
          <Composition id="Anim-DeleteTail" component={DeleteTailReelAnim} durationInFrames={standaloneDuration(6 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(deleteNodeCode)} />
        </Folder>
        <Folder name="SearchNode">
          <Composition id="Video-SearchNode" component={SearchNodeVideo} durationInFrames={standaloneDuration(2622)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(searchNodeCode)} />
          <Composition id="Reel-SearchNode" component={SearchNodeReel} durationInFrames={standaloneDuration(2622)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(searchNodeCode)} />
          <Composition id="Anim-SearchNode" component={SearchNodeReelAnim} durationInFrames={standaloneDuration(18 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(searchNodeCode)} />
        </Folder>
        <Folder name="Traverse">
          <Composition id="Video-Traverse" component={TraverseVideo} durationInFrames={standaloneDuration(280)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(traverseCode)} />
        </Folder>
        <Folder name="Reverse">
          <Composition id="Video-Reverse" component={ReverseVideo} durationInFrames={standaloneDuration(REVERSE_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(reverseCode)} />
          <Composition id="Reel-Reverse" component={ReverseReel} durationInFrames={standaloneDuration(REVERSE_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(reverseCode)} />
          <Composition id="Anim-Reverse" component={ReverseReelAnim} durationInFrames={standaloneDuration(20 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(reverseCode)} />
        </Folder>
        <Folder name="DetectCycle">
          <Composition id="Video-DetectCycle" component={DetectCycleVideo} durationInFrames={standaloneDuration(DETECT_CYCLE_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(detectCycleCode)} />
          <Composition id="Reel-DetectCycle" component={DetectCycleReel} durationInFrames={standaloneDuration(DETECT_CYCLE_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(detectCycleCode)} />
          <Composition id="Anim-DetectCycle" component={DetectCycleReelAnim} durationInFrames={standaloneDuration(15 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(detectCycleCode)} />
        </Folder>
        <Folder name="MergeLists">
          <Composition id="Video-MergeLists" component={MergeListsVideo} durationInFrames={standaloneDuration(MERGE_LISTS_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(mergeSortedCode)} />
          <Composition id="Reel-MergeLists" component={MergeListsReel} durationInFrames={standaloneDuration(MERGE_LISTS_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(mergeSortedCode)} />
          <Composition id="Anim-MergeLists" component={MergeListsReelAnim} durationInFrames={standaloneDuration(12 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(mergeSortedCode)} />
        </Folder>
      </Folder>

      <Folder name="LeetCode">
        <Folder name="RemoveNthFromEnd">
          <Composition id="RemoveNthFromEnd" component={RemoveNthFromEnd} durationInFrames={REMOVE_NTH_SCENE_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ naiveTokens: emptyTokens, optimalTokens: emptyTokens, transitionInfo: emptyDualTransition }} calculateMetadata={makeDualCalcMetadata(removeNthNaiveCode, removeNthOptimalCode)} />
          <Composition id="Video-RemoveNthFromEnd" component={RemoveNthFromEndVideo} durationInFrames={standaloneDuration(REMOVE_NTH_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ naiveTokens: emptyTokens, optimalTokens: emptyTokens, transitionInfo: emptyDualTransition }} calculateMetadata={makeDualCalcMetadata(removeNthNaiveCode, removeNthOptimalCode)} />
          <Composition id="Reel-RemoveNthFromEnd" component={RemoveNthFromEndReel} durationInFrames={standaloneDuration(REMOVE_NTH_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ naiveTokens: emptyTokens, optimalTokens: emptyTokens, transitionInfo: emptyDualTransition }} calculateMetadata={makeDualCalcMetadata(removeNthNaiveCode, removeNthOptimalCode)} />
          <Composition id="Anim-RemoveNthFromEnd" component={RemoveNthFromEndReelAnim} durationInFrames={standaloneDuration(30 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ naiveTokens: emptyTokens, optimalTokens: emptyTokens, transitionInfo: emptyDualTransition }} calculateMetadata={makeDualCalcMetadata(removeNthNaiveCode, removeNthOptimalCode)} />
        </Folder>
      </Folder>

      <Folder name="TimeComplexity">
        <Folder name="ConstantTime">
          <Composition id="Video-ConstantTime" component={ConstantTimeVideo} durationInFrames={standaloneDuration(CONSTANT_TIME_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(insertAtHeadCode)} />
        </Folder>
        <Folder name="LinearSearch">
          <Composition id="Video-LinearSearch" component={LinearSearchVideo} durationInFrames={standaloneDuration(LINEAR_SEARCH_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(linearSearchCode)} />
        </Folder>
        <Folder name="BinarySearch">
          <Composition id="Video-BinarySearch" component={BinarySearchVideo} durationInFrames={standaloneDuration(BINARY_SEARCH_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(binarySearchCode)} />
        </Folder>
        <Folder name="BubbleSort">
          <Composition id="Video-BubbleSort" component={BubbleSortVideo} durationInFrames={standaloneDuration(BUBBLE_SORT_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(bubbleSortCode)} />
        </Folder>
        <Folder name="MergeSort">
          <Composition id="Video-MergeSort" component={MergeSortVideo} durationInFrames={standaloneDuration(MERGE_SORT_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(mergeSortCode)} />
        </Folder>
        <Folder name="Exponential">
          <Composition id="Video-Exponential" component={ExponentialVideo} durationInFrames={standaloneDuration(EXPONENTIAL_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(fibonacciCode)} />
        </Folder>
        <Folder name="Factorial">
          <Composition id="Video-Factorial" component={FactorialVideo} durationInFrames={standaloneDuration(FACTORIAL_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(permutationsCode)} />
        </Folder>
      </Folder>

      <Folder name="Diagrams">
        <Composition
          id="TLS-Handshake"
          component={TLSHandshake}
          durationInFrames={TLS_HANDSHAKE_SCENE_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{}}
        />
      </Folder>

      <Folder name="Trees">
        <Folder name="BSTInsert">
          <Composition id="Video-BSTInsert" component={BSTInsertVideo} durationInFrames={standaloneDuration(BST_INSERT_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(bstInsertCode)} />
          <Composition id="Reel-BSTInsert" component={BSTInsertReel} durationInFrames={standaloneDuration(BST_INSERT_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(bstInsertCode)} />
          <Composition id="Anim-BSTInsert" component={BSTInsertReelAnim} durationInFrames={standaloneDuration(16 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(bstInsertCode)} />
        </Folder>
        <Folder name="TopView">
          <Composition id="Video-TopView" component={TopViewVideo} durationInFrames={standaloneDuration(TOP_VIEW_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(topViewCode)} />
          <Composition id="Reel-TopView" component={TopViewReel} durationInFrames={standaloneDuration(TOP_VIEW_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(topViewCode)} />
          <Composition id="Anim-TopView" component={TopViewReelAnim} durationInFrames={standaloneDuration(22 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(topViewCode)} />
        </Folder>
        <Folder name="LeftView">
          <Composition id="Video-LeftView" component={LeftViewVideo} durationInFrames={standaloneDuration(LEFT_VIEW_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(leftViewCode)} />
          <Composition id="Reel-LeftView" component={LeftViewReel} durationInFrames={standaloneDuration(LEFT_VIEW_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(leftViewCode)} />
          <Composition id="Anim-LeftView" component={LeftViewReelAnim} durationInFrames={standaloneDuration(22 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(leftViewCode)} />
        </Folder>
        <Folder name="LevelOrder">
          <Composition id="Video-LevelOrder" component={LevelOrderVideo} durationInFrames={standaloneDuration(LEVEL_ORDER_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(levelOrderCode)} />
          <Composition id="Reel-LevelOrder" component={LevelOrderReel} durationInFrames={standaloneDuration(LEVEL_ORDER_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(levelOrderCode)} />
          <Composition id="Anim-LevelOrder" component={LevelOrderReelAnim} durationInFrames={standaloneDuration(16 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(levelOrderCode)} />
        </Folder>
        <Folder name="RightView">
          <Composition id="Video-RightView" component={RightViewVideo} durationInFrames={standaloneDuration(RIGHT_VIEW_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(rightViewCode)} />
          <Composition id="Reel-RightView" component={RightViewReel} durationInFrames={standaloneDuration(RIGHT_VIEW_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(rightViewCode)} />
          <Composition id="Anim-RightView" component={RightViewReelAnim} durationInFrames={standaloneDuration(22 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(rightViewCode)} />
        </Folder>
        <Folder name="Boundary">
          <Composition id="Video-Boundary" component={BoundaryVideo} durationInFrames={standaloneDuration(BOUNDARY_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(boundaryCode)} />
          <Composition id="Reel-Boundary" component={BoundaryReel} durationInFrames={standaloneDuration(BOUNDARY_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(boundaryCode)} />
          <Composition id="Anim-Boundary" component={BoundaryReelAnim} durationInFrames={standaloneDuration(17 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(boundaryCode)} />
        </Folder>
        <Folder name="Diagonal">
          <Composition id="Video-Diagonal" component={DiagonalVideo} durationInFrames={standaloneDuration(DIAGONAL_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(diagonalCode)} />
          <Composition id="Reel-Diagonal" component={DiagonalReel} durationInFrames={standaloneDuration(DIAGONAL_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(diagonalCode)} />
          <Composition id="Anim-Diagonal" component={DiagonalReelAnim} durationInFrames={standaloneDuration(18 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(diagonalCode)} />
        </Folder>
        <Folder name="DiagonalRL">
          <Composition id="Video-DiagonalRL" component={DiagonalRLVideo} durationInFrames={standaloneDuration(RTL_DIAGONAL_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(rtlDiagonalCode)} />
          <Composition id="Reel-DiagonalRL" component={DiagonalRLReel} durationInFrames={standaloneDuration(RTL_DIAGONAL_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(rtlDiagonalCode)} />
          <Composition id="Anim-DiagonalRL" component={DiagonalRLReelAnim} durationInFrames={standaloneDuration(18 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(rtlDiagonalCode)} />
        </Folder>
        <Folder name="CountTreeNodes">
          <Composition id="Video-CountTreeNodes" component={CountTreeNodesVideo} durationInFrames={standaloneDuration(COUNT_TREE_NODES_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(countTreeNodesCode)} />
          <Composition id="Reel-CountTreeNodes" component={CountTreeNodesReel} durationInFrames={standaloneDuration(COUNT_TREE_NODES_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(countTreeNodesCode)} />
          <Composition id="Anim-CountTreeNodes" component={CountTreeNodesReelAnim} durationInFrames={standaloneDuration(26 * ANIM_FRAMES_PER_STEP)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(countTreeNodesCode)} />
        </Folder>
      </Folder>

      <Folder name="Recursion">
        <Folder name="TowerOfHanoi">
          <Composition id="TowerOfHanoi" component={TowerOfHanoi} durationInFrames={TOWER_OF_HANOI_SCENE_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(towerOfHanoiCode)} />
          <Composition id="Video-TowerOfHanoi" component={TowerOfHanoiVideo} durationInFrames={standaloneDuration(TOWER_OF_HANOI_SCENE_FRAMES)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(towerOfHanoiCode)} />
          <Composition id="Reel-TowerOfHanoi" component={TowerOfHanoiReel} durationInFrames={standaloneDuration(TOWER_OF_HANOI_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(towerOfHanoiCode)} />
          <Composition id="ReelAnim-TowerOfHanoi" component={TowerOfHanoiReelAnim} durationInFrames={standaloneDuration(TOWER_OF_HANOI_SCENE_FRAMES)} fps={FPS} width={REEL_WIDTH} height={REEL_HEIGHT} defaultProps={{ tokens: emptyTokens }} calculateMetadata={makeCalcMetadata(towerOfHanoiCode)} />
        </Folder>
      </Folder>
    </>
  );
};
