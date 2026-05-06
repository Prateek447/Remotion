import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { ThemedToken } from "shiki";
import type { SceneStep, HighlightStep } from "../lib/types";
import type { KeyedTokensInfo } from "../lib/magic-move";
import { SplitLayout } from "../components/SplitLayout";
import { StackedLayout, type SafeArea } from "../components/StackedLayout";
import { LinkedListDiagram } from "../components/LinkedListDiagram";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { InlineCodeMagicMove } from "../components/InlineCodeMagicMove";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";
import { AnimationOnlyLayout, ANIM_DIAGRAM_HEIGHT } from "../components/AnimationOnlyLayout";
import { compressStepsForAnim } from "../lib/animSteps";

/*
 * LeetCode #19 — Remove Nth Node From End of List.
 *
 * Two code panels share the scene:
 *   - Naive (two-pass) during Phase 1
 *   - Optimal (one-pass two-pointer with dummy) during Phases 0, 2+
 *
 * Naive code lines (0-indexed):
 *   0:  public ListNode removeNthFromEnd(ListNode head, int n) {
 *   1:      int length = 0;
 *   2:      ListNode curr = head;
 *   3:      while (curr != null) {
 *   4:          length++;
 *   5:          curr = curr.next;
 *   6:      }
 *   7:      int target = length - n;
 *   8:      if (target == 0) return head.next;
 *   9:      curr = head;
 *  10:      for (int i = 0; i < target - 1; i++) {
 *  11:          curr = curr.next;
 *  12:      }
 *  13:      curr.next = curr.next.next;
 *  14:      return head;
 *  15: }
 *
 * Optimal code lines (0-indexed):
 *   0:  public ListNode removeNthFromEnd(ListNode head, int n) {
 *   1:      ListNode dummy = new ListNode(0);
 *   2:      dummy.next = head;
 *   3:      ListNode fast = dummy;
 *   4:      ListNode slow = dummy;
 *   5:      for (int i = 0; i <= n; i++) {
 *   6:          fast = fast.next;
 *   7:      }
 *   8:      while (fast != null) {
 *   9:          slow = slow.next;
 *  10:          fast = fast.next;
 *  11:      }
 *  12:      slow.next = slow.next.next;
 *  13:      return dummy.next;
 *  14: }
 */

const HEAD_COLOR = "#1565C0";
const CURR_COLOR = "#2E7D32";
const FAST_COLOR = "#C05621";
const SLOW_COLOR = "#0D7377";
const LEN_COLOR = "#6A1B9A";

type Phase = "intro" | "naive" | "optimal";

const NO_HL: HighlightStep = { startLine: -1, endLine: -1 };

interface ScriptStep extends SceneStep {
  phase: Phase;
  naiveHighlight?: HighlightStep;
  optimalHighlight?: HighlightStep;
}

// startFrame[n] = startFrame[n-1] + frames[n-1] + 10 (buffer)
// Durations from public/narration/remove-nth-from-end/durations.json
const steps: ScriptStep[] = [
  // ─── Phase 0: Problem intro ──────────────────────────────────────────────
  {
    startFrame: 0,
    phase: "intro",
    highlightLines: NO_HL,
    optimalHighlight: NO_HL,
    snapshot: {
      nodes: [
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4, highlight: "active" },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
    },
  },

  // ─── Phase 1: Naive (two-pass) ───────────────────────────────────────────
  {
    startFrame: 486,
    phase: "naive",
    highlightLines: { startLine: 0, endLine: 0 },
    naiveHighlight: { startLine: 0, endLine: 0 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
    },
  },
  // Narration 2 runs from frame 725 for ~227 frames:
  //   "Pass one. Walk a pointer through the list, bumping a counter.
  //    One, two, three, four, five. Length is five."
  //
  // Sub-steps 2..6 animate curr walking n1 -> n5, with a `len` pointer
  // stacked above it showing the counter ticking 1..5 in real time.
  {
    startFrame: 725,
    phase: "naive",
    highlightLines: { startLine: 2, endLine: 2 },
    naiveHighlight: { startLine: 2, endLine: 2 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "active" },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n1", color: CURR_COLOR },
        { id: "len", label: "len = 1", targetNodeId: "n1", color: LEN_COLOR },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
    },
  },
  {
    startFrame: 770,
    phase: "naive",
    highlightLines: { startLine: 4, endLine: 5 },
    naiveHighlight: { startLine: 4, endLine: 5 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1 },
        { id: "n2", value: 2, highlight: "active" },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n2", color: CURR_COLOR },
        { id: "len", label: "len = 2", targetNodeId: "n2", color: LEN_COLOR },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
    },
  },
  {
    startFrame: 815,
    phase: "naive",
    highlightLines: { startLine: 4, endLine: 5 },
    naiveHighlight: { startLine: 4, endLine: 5 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3, highlight: "active" },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
        { id: "len", label: "len = 3", targetNodeId: "n3", color: LEN_COLOR },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
    },
  },
  {
    startFrame: 860,
    phase: "naive",
    highlightLines: { startLine: 4, endLine: 5 },
    naiveHighlight: { startLine: 4, endLine: 5 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4, highlight: "active" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n4", color: CURR_COLOR },
        { id: "len", label: "len = 4", targetNodeId: "n4", color: LEN_COLOR },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
    },
  },
  {
    startFrame: 905,
    phase: "naive",
    highlightLines: { startLine: 3, endLine: 6 },
    naiveHighlight: { startLine: 3, endLine: 6 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5, highlight: "active" },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n5", color: CURR_COLOR },
        { id: "len", label: "len = 5", targetNodeId: "n5", color: LEN_COLOR },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "length = 5",
    },
  },
  // Narration 3 runs from frame 962 for 453 frames:
  //   "Now the target. Length minus n is three. But we count from zero —
  //    so index three is actually the fourth node, which holds four.
  //    That's what we're removing. We reset curr to head, and walk two
  //    steps, landing on node three — the predecessor, at index two."
  //
  // Three sub-steps map to the narration beats:
  //   Beat A (~300f): target math + reset curr to head + mark n4 as target.
  //                   Caption explicitly shows "index 3 = 4th node".
  //   Beat B (~80f):  curr walks n1 -> n2 ("walk two steps").
  //   Beat C (~75f):  curr lands on n3 (the predecessor at index 2).
  {
    startFrame: 962,
    phase: "naive",
    highlightLines: { startLine: 7, endLine: 9 },
    naiveHighlight: { startLine: 7, endLine: 9 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "active" },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4, highlight: "removing" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n1", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "target = 5 − 2 = 3  ·  index 3 (0-based) = 4th node → value 4",
    },
  },
  {
    startFrame: 1262,
    phase: "naive",
    highlightLines: { startLine: 10, endLine: 12 },
    naiveHighlight: { startLine: 10, endLine: 12 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1 },
        { id: "n2", value: 2, highlight: "active" },
        { id: "n3", value: 3 },
        { id: "n4", value: 4, highlight: "removing" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n2", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "i = 0 · curr at index 1",
    },
  },
  {
    startFrame: 1342,
    phase: "naive",
    highlightLines: { startLine: 10, endLine: 12 },
    naiveHighlight: { startLine: 10, endLine: 12 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3, highlight: "active" },
        { id: "n4", value: 4, highlight: "removing" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "i = 1 · curr at index 2 — predecessor of target",
    },
  },
  // Narration 4 runs from frame 1425 for 276 frames:
  //   "And splice. curr dot next equals curr dot next dot next.
  //    Four is bypassed. Done. But that was two passes. Can we do better?"
  //
  // Two beats so the naive phase actually *finishes* before we hand off:
  //   Beat A (~120f): the dashed bypass arrow appears over n4 — that's
  //                   the "curr dot next = curr dot next dot next" moment.
  //   Beat B (~160f): n4 is gone from the list entirely, the bypass is
  //                   now a solid arrow, and 1->2->3->5 holds clean while
  //                   the narrator says "Done. But that was two passes…"
  //                   This completes the animation before the optimal
  //                   phase restores the full list with a dummy prepended.
  {
    startFrame: 1425,
    phase: "naive",
    highlightLines: { startLine: 13, endLine: 13 },
    naiveHighlight: { startLine: 13, endLine: 13 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4, highlight: "removing" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n5", dashed: true, highlight: true },
        { from: "n4", to: "n5" },
      ],
    },
  },
  {
    startFrame: 1545,
    phase: "naive",
    highlightLines: { startLine: 14, endLine: 14 },
    naiveHighlight: { startLine: 14, endLine: 14 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n5" },
      ],
      caption: "1 → 2 → 3 → 5  ·  four is gone",
    },
  },

  // ─── Phase 2: Optimal two-pointer ────────────────────────────────────────
  {
    startFrame: 1711,
    phase: "optimal",
    highlightLines: { startLine: 1, endLine: 2 },
    optimalHighlight: { startLine: 1, endLine: 2 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "new" },
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
    },
  },
  // Narration 6 runs from frame 1932 for 324 frames:
  //   "Now two pointers, fast and slow, both starting at dummy.
  //    We move fast forward by n plus one steps. With n equals two,
  //    fast advances three times and lands on node three."
  //
  // Sub-steps animate fast walking dummy -> n1 -> n2 -> n3 while slow
  // stays parked on dummy. The first sub-step shows both pointers on
  // the dummy node so the viewer sees the initial assignment before
  // fast starts moving.
  {
    startFrame: 1932,
    phase: "optimal",
    highlightLines: { startLine: 3, endLine: 4 },
    optimalHighlight: { startLine: 3, endLine: 4 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "dummy", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "dummy", color: FAST_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "fast = slow = dummy",
    },
  },
  {
    startFrame: 2047,
    phase: "optimal",
    highlightLines: { startLine: 5, endLine: 7 },
    optimalHighlight: { startLine: 5, endLine: 7 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n1", value: 1, highlight: "active" },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "dummy", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n1", color: FAST_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "fast advances 1 of 3",
    },
  },
  {
    startFrame: 2107,
    phase: "optimal",
    highlightLines: { startLine: 5, endLine: 7 },
    optimalHighlight: { startLine: 5, endLine: 7 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n1", value: 1 },
        { id: "n2", value: 2, highlight: "active" },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "dummy", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n2", color: FAST_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "fast advances 2 of 3",
    },
  },
  {
    startFrame: 2167,
    phase: "optimal",
    highlightLines: { startLine: 5, endLine: 7 },
    optimalHighlight: { startLine: 5, endLine: 7 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3, highlight: "active" },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "dummy", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n3", color: FAST_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "fast advanced n + 1 = 3 steps",
    },
  },
  // Narration 7 runs from frame 2266 for 224 frames:
  //   "Now the magic. We move fast and slow together, one step at a time.
  //    They keep that same gap — always n plus one apart."
  //
  // Sub-steps hold the previous state during "Now the magic." and only start
  // moving slow/fast when the narrator actually says "we move fast and slow
  // together". The "one step at a time" line is illustrated by two distinct
  // hops instead of teleporting directly to n2/n5 — slow and fast advance in
  // lock-step so the viewer sees the n+1 gap is preserved between hops.
  {
    startFrame: 2266,
    phase: "optimal",
    highlightLines: { startLine: 8, endLine: 11 },
    optimalHighlight: { startLine: 8, endLine: 11 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3, highlight: "active" },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "dummy", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n3", color: FAST_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "gap between slow and fast is n + 1",
    },
  },
  {
    startFrame: 2322,
    phase: "optimal",
    highlightLines: { startLine: 8, endLine: 11 },
    optimalHighlight: { startLine: 8, endLine: 11 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n1", value: 1, highlight: "active" },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4, highlight: "active" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "n1", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n4", color: FAST_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "step 1 — both advance one node",
    },
  },
  {
    startFrame: 2382,
    phase: "optimal",
    highlightLines: { startLine: 8, endLine: 11 },
    optimalHighlight: { startLine: 8, endLine: 11 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n1", value: 1 },
        { id: "n2", value: 2, highlight: "active" },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5, highlight: "active" },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "n2", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n5", color: FAST_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "step 2 — gap stays n + 1",
    },
  },
  {
    startFrame: 2500,
    phase: "optimal",
    highlightLines: { startLine: 8, endLine: 11 },
    optimalHighlight: { startLine: 8, endLine: 11 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3, highlight: "active" },
        { id: "n4", value: 4, highlight: "removing" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "n3", color: SLOW_COLOR },
        { label: "fast", targetNodeId: null, color: FAST_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "fast → null, slow sits right before the target",
    },
  },
  {
    startFrame: 2773,
    phase: "optimal",
    highlightLines: { startLine: 12, endLine: 13 },
    optimalHighlight: { startLine: 12, endLine: 13 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n1", value: 1 },
        { id: "n2", value: 2 },
        { id: "n3", value: 3, highlight: "active" },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "n3", color: SLOW_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n5" },
      ],
    },
  },

  // ─── Phase 3: Edge case — remove head (n = 5) ────────────────────────────
  {
    startFrame: 3066,
    phase: "optimal",
    highlightLines: { startLine: 1, endLine: 4 },
    optimalHighlight: { startLine: 1, endLine: 4 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n1", value: 1, highlight: "removing" },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "dummy", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "dummy", color: FAST_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "n = 5 — the target is the head",
    },
  },
  {
    startFrame: 3282,
    phase: "optimal",
    highlightLines: { startLine: 5, endLine: 7 },
    optimalHighlight: { startLine: 5, endLine: 7 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n1", value: 1, highlight: "removing" },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n1", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "dummy", color: SLOW_COLOR },
        { label: "fast", targetNodeId: null, color: FAST_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n1" },
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "fast walked n + 1 = 6 steps → null",
    },
  },
  {
    startFrame: 3529,
    phase: "optimal",
    highlightLines: { startLine: 12, endLine: 13 },
    optimalHighlight: { startLine: 12, endLine: 13 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "pinned" },
        { id: "n2", value: 2 },
        { id: "n3", value: 3 },
        { id: "n4", value: 4 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n2", color: HEAD_COLOR },
        { label: "slow", targetNodeId: "dummy", color: SLOW_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
      ],
      caption: "dummy absorbed the edge case — no null-check needed",
    },
  },

  // ─── Phase 4: Complexity recap ───────────────────────────────────────────
  {
    startFrame: 3790,
    phase: "optimal",
    highlightLines: { startLine: 0, endLine: 14 },
    optimalHighlight: { startLine: 0, endLine: 14 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "found" },
        { id: "n2", value: 2, highlight: "found" },
        { id: "n3", value: 3, highlight: "found" },
        { id: "n5", value: 5, highlight: "found" },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n5" },
      ],
      caption: "O(n) time · O(1) space · one pass",
    },
  },

  // ─── Phase 5: Subscribe CTA ──────────────────────────────────────────────
  {
    startFrame: 4052,
    phase: "optimal",
    highlightLines: { startLine: 0, endLine: 14 },
    optimalHighlight: { startLine: 0, endLine: 14 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "found" },
        { id: "n2", value: 2, highlight: "found" },
        { id: "n3", value: 3, highlight: "found" },
        { id: "n5", value: 5, highlight: "found" },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n5" },
      ],
    },
  },
];

// 4052 (CTA start) + 178 (step 14 frames) + 10 buffer = 4240
export const REMOVE_NTH_SCENE_FRAMES = 4240;

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 60, right: 160 };
const REEL_TOP_RATIO = 0.42;

const diagramSteps: SceneStep[] = steps.map((s) => ({
  startFrame: s.startFrame,
  highlightLines: s.highlightLines,
  snapshot: s.snapshot,
}));

const naiveCodeSteps: SceneStep[] = steps.map((s) => ({
  startFrame: s.startFrame,
  highlightLines: s.naiveHighlight ?? NO_HL,
  snapshot: s.snapshot,
}));

const optimalCodeSteps: SceneStep[] = steps.map((s) => ({
  startFrame: s.startFrame,
  highlightLines: s.optimalHighlight ?? NO_HL,
  snapshot: s.snapshot,
}));

function currentPhase(frame: number): Phase {
  let phase: Phase = steps[0].phase;
  for (const s of steps) {
    if (frame >= s.startFrame) phase = s.phase;
    else break;
  }
  return phase;
}

// Crossfade naive/optimal code panels at phase boundaries.
const CROSSFADE_FRAMES = 20;

interface PanelOpacityProps {
  target: Phase;
}

const usePanelOpacity = ({ target }: PanelOpacityProps): number => {
  const frame = useCurrentFrame();
  const phase = currentPhase(frame);

  // Default opacities per phase:
  //   intro / optimal   → optimal visible, naive hidden
  //   naive             → naive visible, optimal hidden
  const isNaiveActive = phase === "naive";
  const isOptimalActive = phase === "intro" || phase === "optimal";

  // Find the frame window closest to the current phase boundary for crossfade.
  const boundaries: { frame: number; enteringNaive: boolean }[] = [];
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].phase !== steps[i - 1].phase) {
      boundaries.push({
        frame: steps[i].startFrame,
        enteringNaive: steps[i].phase === "naive",
      });
    }
  }

  let op = target === "naive" ? (isNaiveActive ? 1 : 0) : isOptimalActive ? 1 : 0;

  for (const b of boundaries) {
    if (frame >= b.frame - CROSSFADE_FRAMES && frame <= b.frame + CROSSFADE_FRAMES) {
      const progress = interpolate(
        frame,
        [b.frame - CROSSFADE_FRAMES, b.frame + CROSSFADE_FRAMES],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );
      const beforeIsNaive = !b.enteringNaive;
      if (target === "naive") {
        op = beforeIsNaive ? 1 - progress : progress;
      } else {
        op = beforeIsNaive ? progress : 1 - progress;
      }
    }
  }

  return op;
};

// Motion-Canvas-style code morph: the static naive/optimal panels are hidden
// over a 36-frame window centred on frame 1720, and an InlineCodeMagicMove
// takes over, tweening matching tokens to their new positions while fading
// out removed lines and fading in added lines.
//
// Timing rationale: audio 4 ends at frame 1701 ("...Can we do better?").
// Audio 5 starts at 1711 ("Enter the two-pointer trick..."). We want the
// morph to play *after* the rhetorical question, visually answering it by
// transforming the naive code into the two-pointer code right as the
// narrator introduces the better approach. Morph window = 1702..1738:
//   - 1702 : "Can we do better?" has just ended
//   - 1711 : phase flips to optimal, "Enter" starts — tween is mid-flight
//   - 1738 : morph lands, optimal code fully visible by the time narrator
//            reaches "...dummy node in front of head."
const MORPH_BOUNDARY_FRAME = 1720;
const MORPH_HALF_FRAMES = 18;
const MORPH_START = MORPH_BOUNDARY_FRAME - MORPH_HALF_FRAMES;
const MORPH_END = MORPH_BOUNDARY_FRAME + MORPH_HALF_FRAMES;

interface DualCodePanelsProps {
  naiveTokens: ThemedToken[][];
  optimalTokens: ThemedToken[][];
  transitionInfo: { from: KeyedTokensInfo; to: KeyedTokensInfo };
  fontSize: number;
  isReel: boolean;
  safeW?: number;
}

const DualCodePanels: React.FC<DualCodePanelsProps> = ({
  naiveTokens,
  optimalTokens,
  transitionInfo,
  fontSize,
  isReel,
  safeW,
}) => {
  const frame = useCurrentFrame();
  const rawNaiveOp = usePanelOpacity({ target: "naive" });
  const rawOptimalOp = usePanelOpacity({ target: "optimal" });

  const inMorph = frame >= MORPH_START && frame <= MORPH_END;
  const morphProgress = interpolate(frame, [MORPH_START, MORPH_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // During the morph window, suppress the static panels so only the
  // tween layer is visible.
  const naiveOpacity = inMorph ? 0 : rawNaiveOp;
  const optimalOpacity = inMorph ? 0 : rawOptimalOp;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: naiveOpacity,
          pointerEvents: "none",
        }}
      >
        <CodeWindow title="RemoveNth.java — naive" hideTitle={isReel}>
          <CodeBlock
            tokens={naiveTokens}
            steps={naiveCodeSteps}
            fontSize={fontSize}
            centered={isReel}
            centerWidth={isReel ? safeW : undefined}
          />
        </CodeWindow>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: optimalOpacity,
          pointerEvents: "none",
        }}
      >
        <CodeWindow title="RemoveNth.java — two-pointer" hideTitle={isReel}>
          <CodeBlock
            tokens={optimalTokens}
            steps={optimalCodeSteps}
            fontSize={fontSize}
            centered={isReel}
            centerWidth={isReel ? safeW : undefined}
          />
        </CodeWindow>
      </div>

      {inMorph && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <CodeWindow title="RemoveNth.java" hideTitle={isReel}>
            <InlineCodeMagicMove
              fromInfo={transitionInfo.from}
              toInfo={transitionInfo.to}
              progress={morphProgress}
              fontSize={fontSize}
              lineHeight={1.75}
              padX={40}
              padY={40}
            />
          </CodeWindow>
        </div>
      )}
    </div>
  );
};

export interface RemoveNthFromEndProps {
  naiveTokens: ThemedToken[][];
  optimalTokens: ThemedToken[][];
  transitionInfo: { from: KeyedTokensInfo; to: KeyedTokensInfo };
  format?: "youtube" | "reel" | "reel-anim";
}

export const RemoveNthFromEnd: React.FC<RemoveNthFromEndProps> = ({
  naiveTokens,
  optimalTokens,
  transitionInfo,
  format = "youtube",
}) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel";
  const isAnim = format === "reel-anim";
  const activeDiagramSteps = isAnim ? compressStepsForAnim(diagramSteps) : diagramSteps;

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;

  const LEFT_WIDTH_RATIO = 0.55;
  const diagramAreaW = isAnim ? width : isReel ? safeW : width * LEFT_WIDTH_RATIO;
  const diagramAreaH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  const nodeScale = isAnim ? 0.9 : isReel ? 0.7 : 0.88;
  const codeFontSize = isReel ? 22 : 22;
  const diagramVerticalOffset = isReel || isAnim ? 90 : 0;

  const diagram = (
    <LinkedListDiagram
      steps={activeDiagramSteps}
      areaWidth={diagramAreaW}
      areaHeight={diagramAreaH}
      nodeScale={nodeScale}
      verticalOffset={diagramVerticalOffset}
    />
  );

  const code = (
    <DualCodePanels
      naiveTokens={naiveTokens}
      optimalTokens={optimalTokens}
      transitionInfo={transitionInfo}
      fontSize={codeFontSize}
      isReel={isReel}
      safeW={isReel ? safeW : undefined}
    />
  );

  return (
    <>
      {isAnim ? (
        <AnimationOnlyLayout>{diagram}</AnimationOnlyLayout>
      ) : isReel ? (
        <StackedLayout top={diagram} bottom={code} safeArea={REEL_SAFE} topRatio={REEL_TOP_RATIO} />
      ) : (
        <SplitLayout left={diagram} right={code} leftWidth={`${LEFT_WIDTH_RATIO * 100}%`} />
      )}
      <AmbientLayer animOnly={isAnim} />
      <SfxLayer steps={activeDiagramSteps} duckVolume={0.5} animOnly={isAnim} />
      {!isAnim && <NarrationLayer sceneId="remove-nth-from-end" steps={diagramSteps} />}
    </>
  );
};
