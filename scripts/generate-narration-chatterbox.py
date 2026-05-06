#!/usr/bin/env python3
"""Generate narration MP3 files using Chatterbox TTS (voice cloning).

Usage:
    python scripts/generate-narration-chatterbox.py              # all scenes
    python scripts/generate-narration-chatterbox.py search-node  # single scene

Requires:
    pip install chatterbox-tts
    ffmpeg on PATH (for WAV -> MP3 conversion)
"""

import json
import math
import os
import subprocess
import sys
import tempfile
from pathlib import Path

# Path to your reference voice recording (WAV recommended, 5–30s of clean speech)
REFERENCE_WAV = "scripts/my-voice.wav"

# Chatterbox controls (tweak if voice sounds off)
# exaggeration: 0.25 = calm/flat, 0.5 = natural, 0.75+ = expressive
# cfg_weight: lower = more like reference voice, higher = follows text more strictly
EXAGGERATION = 0.5
CFG_WEIGHT = 0.5

# ---------------------------------------------------------------------------
# Narration scripts (mirrors generate-narration.mjs)
# ---------------------------------------------------------------------------

insert_head_lines = [
    {"stepIndex": 0,  "text": "So, a linked list. It's basically a chain of nodes. Each node has two parts. A value, and a next pointer that points to the following node."},
    {"stepIndex": 1,  "text": "Here's our linked list. Three, seven, nine. And this head pointer right here? That marks the start."},
    {"stepIndex": 2,  "text": "Now, what we want to do, is insert the value one, at the very beginning of this list."},
    {"stepIndex": 3,  "text": "But here's the thing. What if we move the head pointer to the new node first?"},
    {"stepIndex": 4,  "text": "See the problem? We lost the connection to three, seven, and nine. Those nodes are completely unreachable now."},
    {"stepIndex": 5,  "text": "So, the order matters. We have to link the new node first, before touching head."},
    {"stepIndex": 6,  "text": "Alright, step one. We create a brand new node, with value one."},
    {"stepIndex": 7,  "text": "Step two. We point new node's next, to the current head. This links it into the existing chain."},
    {"stepIndex": 8,  "text": "Step three. Now it's safe to move head to the new node. Nothing is lost."},
    {"stepIndex": 9,  "text": "And we're done! We increment the size. The list is now one, three, seven, nine."},
    {"stepIndex": 10, "text": "Now here's the beautiful part. We never had to walk through the list. No matter how long it is, this is always O of one. Constant time."},
    {"stepIndex": 11, "text": "What about an empty list though? Well, the same code just works. New node's next is null, and head moves to the new node."},
    {"stepIndex": 12, "text": "So remember. Three simple steps. Create the node. Link it to head. Then move head. That's it."},
    {"stepIndex": 13, "text": "If this helped you understand linked lists better, hit that subscribe button and drop a like. More data structures coming soon!"},
]

insert_tail_lines = [
    {"stepIndex": 0,  "text": "Alright, here's our linked list again. Three, seven, nine, with head pointing to the start."},
    {"stepIndex": 1,  "text": "This time, we want to insert the value five, at the very end of this list. At the tail."},
    {"stepIndex": 2,  "text": "But unlike insert at head, we don't have a direct pointer to the last node. So we need to walk through the entire list to find it."},
    {"stepIndex": 3,  "text": "But first, what if the list is empty? If head is null, the new node just becomes the head. Simple."},
    {"stepIndex": 4,  "text": "Back to our list. Step one. Create a brand new node, with value five."},
    {"stepIndex": 5,  "text": "Step two. We create a pointer called curr, and set it to head."},
    {"stepIndex": 6,  "text": "Now we check. Node three's next points to seven. Not null. So curr moves forward to seven."},
    {"stepIndex": 7,  "text": "Node seven's next points to nine. Still not null. So curr advances to nine."},
    {"stepIndex": 8,  "text": "Now we check node nine's next. It's null! We've found the last node. We exit the loop."},
    {"stepIndex": 9,  "text": "Step three. We set curr dot next to the new node. This links five to the end of our chain."},
    {"stepIndex": 10, "text": "And we're done! We increment the size. The list is now three, seven, nine, five."},
    {"stepIndex": 11, "text": "Now why is this O of n? Because we had to walk through every single node to reach the tail. The longer the list, the more steps it takes."},
    {"stepIndex": 12, "text": "Compare that to insert at head, which was O of one. With a tail pointer, we could make this O of one too. But that's a topic for another video."},
    {"stepIndex": 13, "text": "So remember. Create the node. Walk to the end. Link it up. That's insert at tail."},
    {"stepIndex": 14, "text": "If this helped you understand linked lists better, hit that subscribe button and drop a like. More data structures coming soon!"},
]

delete_node_lines = [
    {"stepIndex": 0,  "text": "Okay so here's our linked list. Three, seven, nine, five. Four nodes, each one pointing to the next. Today we're removing one of them."},
    {"stepIndex": 1,  "text": "But first. What if the list is already empty? Head is null. There's literally nothing there. So we just return. No crash, no extra logic. Done."},
    {"stepIndex": 2,  "text": "Now the first real case. What if the node we want to delete is right at the front? The head itself."},
    {"stepIndex": 3,  "text": "Say we're deleting three. We check — head dot val equals three. Yep, that's our node."},
    {"stepIndex": 4,  "text": "All we do is move head one step forward. That's it. Three is gone. We never even walked the rest of the list. O of one. Instant."},
    {"stepIndex": 5,  "text": "Alright, now the trickier part. What if the node is somewhere in the middle? We can't jump straight to it. We have to walk the chain."},
    {"stepIndex": 6,  "text": "We create a pointer called curr, and start it at head. This is our scanner. It moves through the list one node at a time."},
    {"stepIndex": 7,  "text": "We check curr dot next dot val. And there it is — seven. We found the node we want to remove."},
    {"stepIndex": 8,  "text": "Here's the key move. We set curr dot next to curr dot next dot next. So three no longer points to seven — it skips straight to nine. Seven is bypassed."},
    {"stepIndex": 9,  "text": "And seven is gone. The list reconnects cleanly. Three, nine, five. No gaps."},
    {"stepIndex": 10, "text": "Last case. What if it's the tail — the very last node? Same approach, we just walk a bit further."},
    {"stepIndex": 11, "text": "Curr starts at three. Three's next is seven — not our target. Keep moving."},
    {"stepIndex": 12, "text": "Now curr is at seven. Seven's next is nine — still not it. One more step."},
    {"stepIndex": 13, "text": "Curr lands on nine. And nine's next is five — which is exactly what we want to delete. We're in the right spot."},
    {"stepIndex": 14, "text": "We set nine dot next to null. Five is detached. The tail is gone. Clean."},
    {"stepIndex": 15, "text": "So here's the full picture. Deleting the head is O of one — fast, no walking needed. But deleting anything else means traversing the list, and that's O of n. The longer the list, the longer it takes."},
    {"stepIndex": 16, "text": "If this clicked for you, hit subscribe. Next up — searching a linked list."},
]

search_node_lines = [
    {"stepIndex": 0,  "text": "Alright, here's our linked list. Three, seven, nine, five. Four nodes, all connected."},
    {"stepIndex": 1,  "text": "Now, we want to search for the value nine. Can we jump straight to it? Nope. We have to check each node, one at a time."},
    {"stepIndex": 2,  "text": "We create a pointer called curr and set it to head. This is where we start our search."},
    {"stepIndex": 3,  "text": "First check. Curr dot val is three. That's not nine. Not our target."},
    {"stepIndex": 4,  "text": "So we move curr to the next node."},
    {"stepIndex": 5,  "text": "Curr dot val is seven. Still not nine."},
    {"stepIndex": 6,  "text": "Move curr forward again."},
    {"stepIndex": 7,  "text": "Curr dot val is nine. That's it! We found what we're looking for."},
    {"stepIndex": 8,  "text": "We return true. Value nine exists in the list."},
    {"stepIndex": 9,  "text": "But what if the value isn't there? Let's search for four this time."},
    {"stepIndex": 10, "text": "Same process. Curr starts at head. Three is not four."},
    {"stepIndex": 11, "text": "Move forward. Seven is not four."},
    {"stepIndex": 12, "text": "Next. Nine is not four."},
    {"stepIndex": 13, "text": "And five is not four either. That was the last node."},
    {"stepIndex": 14, "text": "Curr moves to null. We've gone through the entire list."},
    {"stepIndex": 15, "text": "The loop condition fails. Curr is null. So we return false. Value four does not exist."},
    {"stepIndex": 16, "text": "So the time complexity is O of n. Best case, we find it right away at the head. Worst case, we walk through every single node."},
    {"stepIndex": 17, "text": "If this helped you understand searching in a linked list, hit subscribe and drop a like. Traversal is coming next."},
]

left_view_lines = [
    {"stepIndex": 0,  "text": "Left view means: stand to the left of the tree and look right. In every row, you see exactly one node - the first one. That's what we need to print."},
    {"stepIndex": 1,  "text": "First line: if root is null, the tree is empty. Just return. Nothing to print."},
    {"stepIndex": 2,  "text": "We create a queue and put the root - node one - inside it. A queue is first in, first out. Think of it as a waiting line for nodes to be processed."},
    {"stepIndex": 3,  "text": "We enter the while loop. Queue is not empty, so we read levelSize. It equals queue dot size, which is the number of nodes currently waiting. Right now it's one."},
    {"stepIndex": 4,  "text": "The for loop starts. i is zero. We call queue dot poll - it removes and returns the first node. We get node one."},
    {"stepIndex": 5,  "text": "i equals zero. That means this is the first node of the row - the leftmost one. So we print node one."},
    {"stepIndex": 6,  "text": "Now we push the children. Left child two goes in first, then right child three. Left always before right. Queue is now two, three."},
    {"stepIndex": 7,  "text": "For loop ends. Back to while. Queue is not empty. levelSize is now two, because two and three are waiting."},
    {"stepIndex": 8,  "text": "For loop again. i is zero. We poll node two."},
    {"stepIndex": 9,  "text": "i is zero. We print node two. That's the leftmost of row two."},
    {"stepIndex": 10, "text": "Push two's left child four. Then two's right child five. Queue now has three, four, five."},
    {"stepIndex": 11, "text": "i is now one. We poll node three from the queue."},
    {"stepIndex": 12, "text": "i is one, not zero. So we don't print node three. It's not the leftmost of this row."},
    {"stepIndex": 13, "text": "But we still push its children. Six goes in, then seven. Queue now has four, five, six, seven."},
    {"stepIndex": 14, "text": "Row two is done. Back to while. levelSize is four. Nodes four, five, six, seven are all waiting."},
    {"stepIndex": 15, "text": "i is zero. We poll node four and print it. That's the leftmost of row three."},
    {"stepIndex": 16, "text": "Push four's only child, node eight. Queue now has five, six, seven, eight."},
    {"stepIndex": 17, "text": "Nodes five, six, and seven come out with i equal to one, two, three. None of them are first in the row. None get printed."},
    {"stepIndex": 18, "text": "Row three is done. Queue has just node eight. levelSize is one."},
    {"stepIndex": 19, "text": "i is zero. We poll node eight and print it. Left view is complete."},
    {"stepIndex": 20, "text": "Queue is now empty. The while loop exits."},
    {"stepIndex": 21, "text": "Final output: one, two, four, eight. Time is O of n - every node visited exactly once. Space is O of n for the queue. Like and subscribe for more tree problems."},
]

top_view_lines = [
    {"stepIndex": 0,  "text": "Top view of a binary tree. Imagine you are flying directly above the tree and looking straight down. You would see exactly one node per column — the topmost one. Let us figure out which nodes those are."},
    {"stepIndex": 1,  "text": "First, a simple safety check. If the tree is empty — root is null — we return right away. Nothing to process."},
    {"stepIndex": 2,  "text": "We set up three things. A column map — a sorted notebook with one entry per column. A column lookup — to remember which column each node belongs to. And a queue — a waiting line of nodes we have not processed yet."},
    {"stepIndex": 3,  "text": "The root, node one, starts at column zero. We record that in our column lookup and add node one to the queue. Everything starts here."},
    {"stepIndex": 4,  "text": "Now the loop begins. We keep going as long as the queue has nodes waiting."},
    {"stepIndex": 5,  "text": "We take node one out of the queue. We check our column lookup — node one is in column zero."},
    {"stepIndex": 6,  "text": "Column zero has not been claimed yet. So we store node one there. The rule is simple — only the first node to arrive in a column gets to stay. Node one is now visible from above."},
    {"stepIndex": 7,  "text": "Now we handle node one's children. Node two goes one column to the left — column negative one. Node three goes one column to the right — column positive one. Both join the queue."},
    {"stepIndex": 8,  "text": "Next out of the queue is node two. Its column is negative one."},
    {"stepIndex": 9,  "text": "Column negative one is free. Node two claims it and joins the top view."},
    {"stepIndex": 10, "text": "Node two's children. Node four goes to column negative two. Node five goes to column zero. Both added to the queue."},
    {"stepIndex": 11, "text": "Node three comes out next. Its column is positive one."},
    {"stepIndex": 12, "text": "Column positive one has not been taken. Node three owns it."},
    {"stepIndex": 13, "text": "Node three's children. Node six is assigned column zero. Node seven gets column positive two. Both join the queue."},
    {"stepIndex": 14, "text": "Node four is next. It is sitting at column negative two."},
    {"stepIndex": 15, "text": "Column negative two is free. Node four claims it. Our top view now has four, two, one, and three — reading left to right."},
    {"stepIndex": 16, "text": "Node four has one child — node eight. It lands at column negative three and joins the queue."},
    {"stepIndex": 17, "text": "Node five comes out. Its column is zero. But column zero was already claimed by node one. So we skip node five. When you look from above, node one is blocking it completely."},
    {"stepIndex": 18, "text": "Node six. Also column zero. Also already taken. We skip it too. Both five and six are hidden behind node one."},
    {"stepIndex": 19, "text": "Node seven. Column positive two — nobody has been there yet. Seven gets it."},
    {"stepIndex": 20, "text": "Node eight. Column negative three — all clear. Eight claims the last open column."},
    {"stepIndex": 21, "text": "The loop ends. Our column map is sorted by column key, so reading left to right gives us: eight, four, two, one, three, seven. Time complexity O of n, space O of n. If this clicked for you, drop a like and subscribe — more tree problems coming soon."},
]

linear_search_lines = [
    {"stepIndex": 0, "text": "Time complexity answers one question: as the input size n grows, how does the number of operations grow? We don't guess — we read it directly from the code structure, piece by piece."},
    {"stepIndex": 1, "text": "Look at this for loop. It runs once for each element in the array. Ten elements — ten iterations. A million elements — a million iterations. The count grows in direct proportion to n. We call that linear growth, and we write it as O of n."},
    {"stepIndex": 2, "text": "Now look inside the loop. One comparison — arr at i equals target. It's always exactly one step, whether the array has ten or ten million elements. When the step count stays fixed no matter what n is, that is the definition of O of one."},
    {"stepIndex": 3, "text": "This return is outside the loop entirely. It runs at most once — independent of n. Fixed step count equals O of one."},
    {"stepIndex": 4, "text": "Now we combine. The loop runs O of n times. Each pass does O of one work. Multiply them: O of n. Final time complexity: O of n."},
]

binary_search_lines = [
    {"stepIndex": 0, "text": "Binary search works by eliminating half the candidates every step. To find the time complexity, we ask: starting from n elements, how many times can you cut the search space in half before only one element remains?"},
    {"stepIndex": 1, "text": "These two lines set up left and right. They run exactly once before the loop starts — two assignments, always two, regardless of whether n is ten or ten million. The count is fixed, so it's O of one."},
    {"stepIndex": 2, "text": "Now the while loop. Each iteration cuts the remaining range in half. After k passes it's n over two to the power k. The loop stops when that reaches one — solving gives k equals log base two of n. So the loop runs log n times."},
    {"stepIndex": 3, "text": "Inside the loop: compute mid, compare against target, then move a pointer. Always two to three operations per pass. This is O of one work per iteration."},
    {"stepIndex": 4, "text": "Putting it together. O of one for setup. Then O of log n iterations, each doing O of one work. Final time complexity: O of log n."},
]

bubble_sort_lines = [
    {"stepIndex": 0, "text": "Bubble sort has two nested loops. Here is the critical rule for nested loops: you multiply their iteration counts, you do not add them."},
    {"stepIndex": 1, "text": "This single line reads the array length into n. It runs exactly once, before any looping begins. O of one."},
    {"stepIndex": 2, "text": "The outer loop. i goes from zero up to n minus one — that is exactly n iterations. O of n."},
    {"stepIndex": 3, "text": "The inner loop runs n minus i minus one times for each outer pass. On average that's about n over two — but n over two is still O of n. Outer O of n times inner O of n equals O of n squared."},
    {"stepIndex": 4, "text": "Inside both loops: one comparison, then at most three assignments for the swap. Always exactly three — O of one. Multiplying O of n squared by O of one leaves O of n squared unchanged."},
    {"stepIndex": 5, "text": "Final calculation. O of one for the setup. Then outer O of n, times inner O of n, times body O of one. Everything multiplies to O of n squared."},
]

constant_time_lines = [
    {"stepIndex": 0, "text": "O of one. No matter what happens to your input — ten elements or ten million — the code does the exact same amount of work. No loops, no recursion. Every line runs a fixed number of times."},
    {"stepIndex": 1, "text": "Look at line one. We're creating a new node. One allocation, one assignment. It doesn't matter if the linked list has three nodes or three million. Always two things. That's why it's O of one."},
    {"stepIndex": 2, "text": "Line two. newNode dot next equals head. One pointer assignment. Not walking through the list, not touching any other node. Same cost, every single time. O of one."},
    {"stepIndex": 3, "text": "Line three. head equals newNode. One assignment. Doesn't matter if the list is empty or has a billion nodes. Always one operation. O of one."},
    {"stepIndex": 4, "text": "Line four. size plus plus. One increment. No loop, no condition. Just plus one. Always. O of one."},
    {"stepIndex": 5, "text": "Four lines, each one is O of one. When you add constants, they don't grow with n. The whole function is O of one. Drop a like and subscribe. O of n is coming next."},
]

merge_sort_lines = [
    {"stepIndex": 0, "text": "Merge sort is the classic O of n log n algorithm. Two things make it that way: how many times the array gets split, and how much work happens per level of splitting."},
    {"stepIndex": 1, "text": "The base case. If l is greater than or equal to r, we have one element or fewer. O of one. This line runs once per leaf of the recursion tree."},
    {"stepIndex": 2, "text": "One arithmetic expression — compute the midpoint. Always exactly one operation. O of one."},
    {"stepIndex": 3, "text": "Two recursive calls, each on half the array. After k splits there are two to the power k subarrays. The recursion bottoms out when size hits one — solving gives k equals log base two of n. The recursion tree is log n levels deep."},
    {"stepIndex": 4, "text": "The merge step combines two sorted halves by touching every element exactly once. At each level of the tree, all merges together process exactly n elements — O of n total work per level."},
    {"stepIndex": 5, "text": "Put it together. Log n levels. At each level, O of n merge work. Multiply: n log n. Final complexity: O of n log n."},
]

exponential_lines = [
    {"stepIndex": 0, "text": "Naive recursive Fibonacci. Two lines of actual code — but it creates O of two to the power n function calls, one of the slowest complexity classes."},
    {"stepIndex": 1, "text": "The base case. If n is zero or one, return immediately. O of one per call. Every recursion tree has a bottom — this is it."},
    {"stepIndex": 2, "text": "One return statement — but two recursive calls inside it. Think of it as a tree: the root fans out to two nodes, each fans to two more. After n levels, the bottom row has roughly two to the power n nodes."},
    {"stepIndex": 3, "text": "Each individual call does O of one work. But the number of calls is two to the power n. Multiply: O of two to the power n. Memoization fixes this — bringing Fibonacci from O of two to the power n down to O of n."},
]

factorial_lines = [
    {"stepIndex": 0, "text": "Here is the question: if the array has n items, how many total steps does this function take? We go level by level, write down the count at each level, then multiply everything together at the end."},
    {"stepIndex": 1, "text": "First, find the work unit. When start equals arr dot length, every slot is filled — print and return. O of one. The big question is: how many times is this leaf reached?"},
    {"stepIndex": 2, "text": "Level zero — the very first call. start equals zero. The for loop runs n iterations. Each calls permute with start plus one. So level zero makes exactly n recursive calls."},
    {"stepIndex": 3, "text": "Level one — each of those n calls has start equals one. The loop now runs n minus one iterations each. Total calls at level one: n times n minus one."},
    {"stepIndex": 4, "text": "Level two: multiply by n minus two. Level three: times n minus three. This keeps going until the loop runs exactly once. Multiply all levels: n factorial."},
    {"stepIndex": 5, "text": "n factorial leaves, each doing O of one work. Final complexity: O of n factorial. For n equals twelve, that's nearly five hundred million calls. Always ask — is there a smarter algorithm?"},
]

ALL_NARRATIONS = [
    {"sceneId": "insert-head",   "lines": insert_head_lines},
    {"sceneId": "insert-tail",   "lines": insert_tail_lines},
    {"sceneId": "delete-node",   "lines": delete_node_lines},
    {"sceneId": "search-node",   "lines": search_node_lines},
    {"sceneId": "left-view",     "lines": left_view_lines},
    {"sceneId": "top-view",      "lines": top_view_lines},
    {"sceneId": "o-n",           "lines": linear_search_lines},
    {"sceneId": "o-log-n",       "lines": binary_search_lines},
    {"sceneId": "o-n-squared",   "lines": bubble_sort_lines},
    {"sceneId": "o-1",           "lines": constant_time_lines},
    {"sceneId": "o-n-log-n",     "lines": merge_sort_lines},
    {"sceneId": "o-2n",          "lines": exponential_lines},
    {"sceneId": "o-n-factorial", "lines": factorial_lines},
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_audio_duration(file_path: str) -> float:
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", file_path],
            capture_output=True, text=True, check=True,
        )
        return float(result.stdout.strip())
    except Exception:
        return 3.0


def wav_to_mp3(wav_path: str, mp3_path: str) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path,
         "-codec:a", "libmp3lame", "-q:a", "2", mp3_path],
        check=True, capture_output=True,
    )


def generate_speech(model, text: str, output_mp3: str) -> None:
    import torchaudio

    wav = model.generate(
        text=text,
        audio_prompt_path=REFERENCE_WAV if REFERENCE_WAV else None,
        exaggeration=EXAGGERATION,
        cfg_weight=CFG_WEIGHT,
    )

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav = tmp.name

    try:
        torchaudio.save(tmp_wav, wav, model.sr)
        wav_to_mp3(tmp_wav, output_mp3)
    finally:
        os.unlink(tmp_wav)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    filter_scene = sys.argv[1] if len(sys.argv) > 1 else None

    scenes = (
        [n for n in ALL_NARRATIONS if n["sceneId"] == filter_scene]
        if filter_scene
        else ALL_NARRATIONS
    )

    if not scenes:
        print(f"Unknown scene: {filter_scene}")
        print(f"Available: {', '.join(n['sceneId'] for n in ALL_NARRATIONS)}")
        sys.exit(1)

    print("Loading Chatterbox model (first run downloads ~1.5 GB)...")
    from chatterbox.tts import ChatterboxTTS
    device = "cuda" if _has_cuda() else "cpu"
    print(f"Using device: {device}")
    model = ChatterboxTTS.from_pretrained(device=device)
    print("Model loaded.\n")

    if REFERENCE_WAV and not Path(REFERENCE_WAV).exists():
        print(f"WARNING: Reference WAV not found at '{REFERENCE_WAV}'. Generating without voice cloning.")

    for narration in scenes:
        scene_id = narration["sceneId"]
        out_dir = Path("public") / "narration" / scene_id
        out_dir.mkdir(parents=True, exist_ok=True)

        print(f"Scene: {scene_id}")
        print("=" * 40)

        durations = []

        for line in narration["lines"]:
            step_index = line["stepIndex"]
            output_path = out_dir / f"step-{step_index}.mp3"

            if output_path.exists():
                print(f"  Step {step_index} [skip — already exists]")
                duration = get_audio_duration(str(output_path))
                frames = math.ceil(duration * 30)
                durations.append({"step": step_index, "duration": duration, "frames": frames})
                continue

            text = line["text"]
            short_text = text[:60] + "..." if len(text) > 60 else text
            print(f"  Step {step_index}: \"{short_text}\"")

            generate_speech(model, text, str(output_path))

            duration = get_audio_duration(str(output_path))
            frames = math.ceil(duration * 30)
            durations.append({"step": step_index, "duration": duration, "frames": frames})
            print(f"    -> {output_path} ({duration:.2f}s, {frames} frames)")

        durations_path = out_dir / "durations.json"
        with open(durations_path, "w") as f:
            json.dump(durations, f, indent=2)

        print(f"\nDuration summary for {scene_id}:")
        total_frames = 0
        for d in durations:
            print(f"  Step {d['step']}: {d['duration']:.2f}s ({d['frames']} frames)")
            total_frames += d["frames"]
        print(f"  Total audio: {total_frames} frames ({total_frames / 30:.1f}s)")
        print(f"  Saved durations to {durations_path}")

        print("\nSuggested startFrame values:")
        sf = 0
        for d in durations:
            print(f"  Step {d['step']}: startFrame: {sf}")
            sf += d["frames"] + 10
        print(f"  Total scene frames: {sf}\n")

    print("Done!")


def _has_cuda() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except ImportError:
        return False


if __name__ == "__main__":
    main()
