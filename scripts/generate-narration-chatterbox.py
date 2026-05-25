#!/usr/bin/env python3
"""Generate narration MP3 files using Chatterbox TTS (voice cloning).

Usage:
    python scripts/generate-narration-chatterbox.py              # all scenes
    python scripts/generate-narration-chatterbox.py search-node  # single scene

Requires:
    pip install chatterbox-tts
    ffmpeg on PATH (for WAV -> MP3 conversion)
"""

import argparse
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

reverse_lines = [
    {"stepIndex": 0,  "text": "Alright, here's our linked list. Three, seven, nine. Three nodes, each pointing to the next. Today we're flipping the whole thing around."},
    {"stepIndex": 1,  "text": "So what does reversing actually mean? Instead of three pointing to seven pointing to nine, we want nine pointing to seven pointing to three. Every arrow flips direction."},
    {"stepIndex": 2,  "text": "To pull this off, we need three pointers. Prev starts at null. Curr starts at head, which is three. And next, we'll use that to save our place before we break any links."},
    {"stepIndex": 3,  "text": "First thing, we save curr dot next into next. That's seven. We need this because we're about to destroy the link from three to seven."},
    {"stepIndex": 4,  "text": "Now the key move. We set curr dot next to prev. So three no longer points to seven. It points to null. We just reversed our first link."},
    {"stepIndex": 5,  "text": "Time to advance. Prev moves to curr, which is three. And curr moves to next, which is seven. We slide everything forward by one."},
    {"stepIndex": 6,  "text": "Same pattern again. Save next. That's nine."},
    {"stepIndex": 7,  "text": "Reverse the link. Seven's next now points to three instead of nine."},
    {"stepIndex": 8,  "text": "Advance again. Prev moves to seven, curr moves to nine."},
    {"stepIndex": 9,  "text": "One more time. Save next. It's null this time. We're at the last node."},
    {"stepIndex": 10, "text": "Reverse the link. Nine now points back to seven."},
    {"stepIndex": 11, "text": "Advance. Prev is nine, curr is null. The loop condition fails. We're done iterating."},
    {"stepIndex": 12, "text": "Last step. We set head to prev. And prev is nine. So the list now starts at nine, goes to seven, then three. Fully reversed."},
    {"stepIndex": 13, "text": "Here's the beauty of it. We touched every node exactly once. No extra memory, no recursion. O of n time, O of one space. Clean."},
    {"stepIndex": 14, "text": "If this helped you visualize linked list reversal, hit subscribe. More data structures and algorithms coming soon."},
]

merge_lists_lines = [
    {"stepIndex": 0,  "text": "Two sorted linked lists. List A has one, four, six. List B has two, three, five. We need to merge them into one sorted list."},
    {"stepIndex": 1,  "text": "The trick? A dummy node. We create a fake node with value zero. It won't be in the final answer, but it gives us a stable starting point. Tail points to dummy."},
    {"stepIndex": 2,  "text": "Now we compare. A is at one, B is at two. One is smaller, so we take from A. Tail dot next equals A. Then we advance A to four, and tail to one."},
    {"stepIndex": 3,  "text": "Compare again. A is four, B is two. Two is smaller. Take from B. Tail dot next equals B. Advance B to three, tail to two."},
    {"stepIndex": 4,  "text": "A is four, B is three. Three is smaller. Take from B. Advance B to five, tail to three."},
    {"stepIndex": 5,  "text": "A is four, B is five. Four is smaller. Take from A. Advance A to six, tail to four."},
    {"stepIndex": 6,  "text": "A is six, B is five. Five is smaller. Take from B. Advance B to null, tail to five."},
    {"stepIndex": 7,  "text": "B is null now. The while loop ends. But A still has six left."},
    {"stepIndex": 8,  "text": "We just attach whatever's remaining. Tail dot next equals A. Six gets linked to the end."},
    {"stepIndex": 9,  "text": "And we're done. The merged list is one, two, three, four, five, six. Perfectly sorted. We return dummy dot next to skip that fake zero node."},
    {"stepIndex": 10, "text": "Time complexity? O of n plus m, where n and m are the lengths of the two lists. We visit every node exactly once. Space is O of one, we're just rearranging pointers."},
    {"stepIndex": 11, "text": "If this merge technique made sense to you, smash that subscribe. More algorithm deep dives are coming."},
]

detect_cycle_lines = [
    {"stepIndex": 0,  "text": "Here's a tricky problem — how do you even know if a linked list has a cycle, where some node's next pointer loops back to an earlier node and creates an infinite loop?"},
    {"stepIndex": 1,  "text": "Here's our list, nodes one through five, but five's next doesn't point to null — it points back to three, and if you tried to traverse this list you'd loop forever with no way out."},
    {"stepIndex": 2,  "text": "The trick is Floyd's algorithm, which uses two pointers called slow and fast, both starting at head — slow moves one step at a time while fast moves two steps at a time."},
    {"stepIndex": 3,  "text": "Let's run it — slow moves to two and fast jumps ahead to three, so they're already at different nodes after just one iteration."},
    {"stepIndex": 4,  "text": "We check if slow equals fast — slow is at two and fast is at three, they're not equal so we continue looping."},
    {"stepIndex": 5,  "text": "Slow moves to three and fast jumps two steps to land on five."},
    {"stepIndex": 6,  "text": "Still not equal — slow is at three and fast is at five — so we go around one more time."},
    {"stepIndex": 7,  "text": "Now watch the fast pointer — slow moves to four, and fast follows the cycle arrow from five back to three then hops one more step to four, so now they're both at node four."},
    {"stepIndex": 8,  "text": "Slow equals fast, which means a cycle was detected and we return true right here."},
    {"stepIndex": 9,  "text": "But what if there's no cycle? Say the list is just one through five with null at the end and no loop anywhere in it."},
    {"stepIndex": 10, "text": "Fast would reach null before slow ever catches up, the while condition fails and we return false — clean and simple."},
    {"stepIndex": 11, "text": "Why does this actually work? Think of two runners on a circular track — the fast one will always eventually lap the slow one, so if there's a cycle they must meet, and if there's no cycle fast just falls off the end."},
    {"stepIndex": 12, "text": "Time complexity is O of n and space is O of one — no hash sets, no extra memory, just two pointers doing all the work, which makes this one of the most elegant solutions in all of DSA."},
    {"stepIndex": 13, "text": "If Floyd's algorithm clicked for you, hit that subscribe button because more algorithm breakdowns are on the way."},
]

tls_handshake_lines = [
    {"stepIndex": 0, "text": "Every time you open a website that starts with HTTPS, something invisible happens before a single byte of your data moves. A handshake. Browser and server quietly agree on how to lock the conversation. That agreement is TLS."},
    {"stepIndex": 1, "text": "The browser speaks first. It says, here are the encryption methods I know, the TLS versions I support, and a random number I just generated. That random number is called the client random. It's the first ingredient in what becomes your encryption key."},
    {"stepIndex": 2, "text": "The server responds. It picks the strongest cipher suite both sides share, generates its own random number, the server random, and sends back a session ID. Two randoms, two sides, neither knows the key yet."},
    {"stepIndex": 3, "text": "Now the server proves who it is. It sends its certificate, a document containing its public key, signed by a trusted Certificate Authority. Your browser checks that signature. If it's valid, you're talking to the real server, not an imposter."},
    {"stepIndex": 4, "text": "The browser generates one more secret, the pre-master secret. It encrypts it using the server's public key from the certificate and sends it across. Only the server, with its private key, can decrypt this. No one watching the network can read it."},
    {"stepIndex": 5, "text": "Here's where the magic happens. Both sides now have all three ingredients: client random, server random, and pre-master secret. Each side independently runs the same calculation and arrives at the exact same session keys. The key was never sent. It was derived."},
    {"stepIndex": 6, "text": "The browser switches to encrypted mode and sends the first protected message, a Finished packet. It contains a fingerprint of the entire handshake so far. If anyone tampered with a single message, this check fails."},
    {"stepIndex": 7, "text": "The server sends its own Finished message back. Both sides have now verified each other. The handshake is complete. You have a secure, authenticated, encrypted channel, built in milliseconds, before you even saw the page load."},
    {"stepIndex": 8, "text": "And now everything flows. Every request, every response, every cookie, every header, all of it encrypted with AES-256-GCM. Symmetric, fast, unreadable to anyone in between. That lock icon in your browser, now you know exactly what it took to put it there."},
]

remove_nth_lines = [
    {"stepIndex": 0,  "text": "The problem is to remove the nth node from the end of a linked list — we have nodes one through five with n equals two, so we need to delete the second node from the end which is four, and the result should be one, two, three, five."},
    {"stepIndex": 1,  "text": "The obvious approach is two passes — a first pass to count the total length, then a second pass to walk to the right spot and splice the node out."},
    {"stepIndex": 2,  "text": "In the first pass we walk a pointer through the whole list bumping a counter at each step — one, two, three, four, five — so the total length is five."},
    {"stepIndex": 3,  "text": "Now the target — length minus n is three, but we count from zero, so index three is actually the fourth node which holds four, and that's what we're removing, so we reset curr to head and walk two steps to land on node three, the predecessor."},
    {"stepIndex": 4,  "text": "Then we splice by setting curr dot next to curr dot next dot next, so four gets bypassed and we're done — but that was two passes, so can we do it in just one?"},
    {"stepIndex": 5,  "text": "Here's the two-pointer trick — we start by adding a dummy node in front of head, and that one small detail is going to matter a lot when we hit edge cases."},
    {"stepIndex": 6,  "text": "Now two pointers, fast and slow, both starting at dummy — we move fast forward by n plus one steps, and with n equals two, fast advances three times and lands on node three."},
    {"stepIndex": 7,  "text": "Here's where the magic happens — we move fast and slow together one step at a time, and they maintain that exact gap of n plus one between them the entire way."},
    {"stepIndex": 8,  "text": "When fast falls off the end and becomes null, slow is sitting right before the node we want to remove — exactly the predecessor, every single time."},
    {"stepIndex": 9,  "text": "It's a single line — slow dot next equals slow dot next dot next — four is bypassed, we return dummy dot next and we're done in one pass with no counting at all."},
    {"stepIndex": 10, "text": "Now let me show you why that dummy node matters — what if n equals five? We're removing the head itself, node one."},
    {"stepIndex": 11, "text": "Fast advances six steps, walks right through every node and lands on null, while slow never moves and stays at dummy."},
    {"stepIndex": 12, "text": "slow dot next dot next just skips past the old head — no null checks, no special cases needed, because the dummy node absorbs what would otherwise be a crash."},
    {"stepIndex": 13, "text": "Both versions are O of n time and O of one space, but the two-pointer version does it in a single pass with no length counting, which makes it the cleaner and more elegant solution."},
    {"stepIndex": 14, "text": "If this two-pointer trick clicked for you, smash that subscribe because more LeetCode patterns are on the way."},
]

level_order_lines = [
    {"stepIndex": 0,  "text": "Level order traversal is how you read a tree the same way you read a page — left to right, row by row. Every node in level one before any node in level two. Think of it as processing the tree in waves. We have a seven-node complete binary tree here. Node one at the root, two and three one level below, and four through seven at the bottom. Watch how we visit them in that exact order."},
    {"stepIndex": 1,  "text": "Before anything else, a null check. If the root doesn't exist, there's no tree to traverse. We return an empty result right away. One line, prevents a crash on an empty tree. Always good practice."},
    {"stepIndex": 2,  "text": "Now, why a queue? Because a queue is first-in, first-out. The node that enters first exits first. That's exactly the behaviour we need — finish processing each level completely before moving to the next. We create the queue and drop in the root. Node one is now waiting in line."},
    {"stepIndex": 3,  "text": "The while loop is the engine. As long as the queue has something in it, there are nodes left to process. Right now, node one is in the queue. The condition is true — we enter the loop."},
    {"stepIndex": 4,  "text": "Poll removes the front of the queue and returns it. We get node one. We call result dot add to record its value. Output so far — just one. The queue is now empty, but we're about to refill it."},
    {"stepIndex": 5,  "text": "Node one has two children. Two on the left, three on the right. We check each child and offer them to the queue. Left before right — always. The queue now holds two and three. We've just seeded the entire second level."},
    {"stepIndex": 6,  "text": "Back to the top of the while loop. Queue isn't empty — node two is waiting. We poll it. Two exits from the front. We add two to the result. Output: one, two."},
    {"stepIndex": 7,  "text": "Two's left child is four and its right child is five. Both get offered to the queue. The queue now has three, four, five. Three was already there from before, and four and five just joined the line."},
    {"stepIndex": 8,  "text": "We poll again. Three comes out next — it was added before four and five, so it exits first. That's the queue enforcing order. We add three to the result. Output: one, two, three. The entire second level is captured."},
    {"stepIndex": 9,  "text": "Three's children are six and seven. We offer both. Queue now holds four, five, six, seven. That's the complete third level, lined up and ready to go."},
    {"stepIndex": 10, "text": "Poll gives us four. Four is a leaf — no left child, no right child. Both if checks see null, so nothing gets added to the queue. We add four to the result and move on. Output: one, two, three, four."},
    {"stepIndex": 11, "text": "Five is next. Also a leaf. Poll, add to result, nothing to enqueue. Output: one, two, three, four, five."},
    {"stepIndex": 12, "text": "Six comes out of the queue. Another leaf. Poll, add, done. Output: one through six. One node left waiting."},
    {"stepIndex": 13, "text": "Seven — the last node. We poll it and add it. Queue size drops to zero. Output: one, two, three, four, five, six, seven. Every single node, in exactly the right order."},
    {"stepIndex": 14, "text": "The while loop checks one more time. Queue is empty — the condition is false. We exit. Nothing more to process."},
    {"stepIndex": 15, "text": "Time complexity is O of n — we visit every node exactly once. Space is also O of n — at peak, the queue holds an entire level, and in a complete binary tree the bottom level has roughly n over two nodes. This queue-based, wave-by-wave pattern is the foundation of BFS and shows up everywhere in tree problems. Drop a like if this clicked, and subscribe for more."},
]

bst_insert_lines = [
    {"stepIndex": 0,  "text": "BST insertion feels complicated because of recursion… but the actual algorithm is just repeating one tiny decision again and again — left or right. And once you see the return phase visually, the whole thing finally clicks. Alright, Binary Search Tree. One simple rule — smaller values go left, larger values go right. Right now our root is fifty. Thirty is on the left, seventy on the right, and below thirty we already have twenty and forty. Now let's insert thirty-five."},
    {"stepIndex": 1,  "text": "The public insert function just calls a recursive helper. So we start at node fifty. First question — is this node null? No. So now we compare."},
    {"stepIndex": 2,  "text": "Thirty-five is smaller than fifty… so we move left. That means the value belongs somewhere inside the left subtree. Now recursion takes us to thirty."},
    {"stepIndex": 3,  "text": "At node thirty now. Thirty-five is greater than thirty… so this time we go right. And we land on forty."},
    {"stepIndex": 4,  "text": "Now watch carefully. Thirty-five is smaller than forty… so we try going left. But forty doesn't even have a left child."},
    {"stepIndex": 5,  "text": "And there it is — null. That's the base case. This is exactly where the new node should be created. So recursion creates a brand new node containing thirty-five… and returns it."},
    {"stepIndex": 6,  "text": "Now comes the important part. That returned node bubbles back up the recursive calls… and gets attached to forty's left pointer automatically. We never manually connected thirty-five ourselves. Recursion handled the insertion during the return phase. And just like that… thirty-five is now part of the BST."},
    {"stepIndex": 7,  "text": "Now let's look at a completely empty tree. No root. Nothing. What happens if we insert ten?"},
    {"stepIndex": 8,  "text": "insertRec gets called immediately with null. Same base case as before. But this time it happens at the very top. No comparisons. No moving left or right. Nothing."},
    {"stepIndex": 9,  "text": "So recursion creates the new node… returns it… and that returned node becomes the root itself. That's the cool part. The exact same recursive logic handled a deep insertion and a completely empty tree. One base case… covers everything."},
    {"stepIndex": 10, "text": "Alright, last case. What if we try inserting a duplicate? Let's insert forty again."},
    {"stepIndex": 11, "text": "Forty starts at the root. Forty is smaller than fifty — so we go left."},
    {"stepIndex": 12, "text": "Now at node thirty. Forty is greater than thirty — so this time we go right."},
    {"stepIndex": 13, "text": "And we land on node forty. Here's the key moment — forty equals forty. Neither the less-than condition nor the greater-than condition fires."},
    {"stepIndex": 14, "text": "So neither branch runs. The recursion simply returns the current node… unchanged. No new node gets created. That means this BST ignores duplicates silently."},
    {"stepIndex": 15, "text": "And that's BST insertion. At every step, recursion just asks one question: left or right? Eventually it hits null… creates the node… and the return phase reconnects everything automatically. Time complexity is O of h — O of log n in a balanced tree, O of n in the worst case. And honestly… once the return phase clicks, BST insertion suddenly feels way simpler."},
]

right_view_lines = [
    {"stepIndex": 0,  "text": "The right view of a binary tree shows the last node visible at each level — what you'd see looking from the right side."},
    {"stepIndex": 1,  "text": "Edge case: if the tree is empty, we return an empty list."},
    {"stepIndex": 2,  "text": "We create a result list and a queue, then add the root to start BFS."},
    {"stepIndex": 3,  "text": "We loop while the queue is not empty."},
    {"stepIndex": 4,  "text": "Capture the current level size — this tells us when the level ends."},
    {"stepIndex": 5,  "text": "We poll node one. Since i equals size minus one, this is the last node in the level — add it to the result."},
    {"stepIndex": 6,  "text": "Push its left child, two, and right child, three, into the queue."},
    {"stepIndex": 7,  "text": "Level one has two nodes. We grab the size."},
    {"stepIndex": 8,  "text": "Poll node two. i is zero, not size minus one, so we skip it."},
    {"stepIndex": 9,  "text": "Push node two's children — four and five — into the queue."},
    {"stepIndex": 10, "text": "Poll node three. i equals one, which is size minus one — add three to the result."},
    {"stepIndex": 11, "text": "Push node three's children — six and seven."},
    {"stepIndex": 12, "text": "Level two has four nodes. We grab the size."},
    {"stepIndex": 13, "text": "Poll node four. i is zero out of three — skip it."},
    {"stepIndex": 14, "text": "Push node four's only child — eight."},
    {"stepIndex": 15, "text": "Poll node five. i is one out of three — skip it. No children."},
    {"stepIndex": 16, "text": "Poll node six. i is two out of three — skip it. No children."},
    {"stepIndex": 17, "text": "Poll node seven. i equals three, size minus one — add seven to the result."},
    {"stepIndex": 18, "text": "Level three has just one node. Size is one."},
    {"stepIndex": 19, "text": "Poll node eight. i is zero, size minus one — it's the only node on this level, so add it to the result."},
    {"stepIndex": 20, "text": "Queue is empty, the while loop exits."},
    {"stepIndex": 21, "text": "We return the right view: one, three, seven, eight. Time and space complexity are both O of n. Follow for more tree algorithms!"},
]

boundary_lines = [
    {"stepIndex": 0,  "text": "Boundary traversal collects every node visible from outside the tree. Three recursive helpers do the work: addLeft, addLeaves, and addRight. Nine nodes get a dashed ring — node five has no ring because it's the only interior node."},
    {"stepIndex": 1,  "text": "Handle the edge case first: empty tree returns an empty list."},
    {"stepIndex": 2,  "text": "The root always goes in first — unless it's a leaf. Node one has children, so we add it. Output: one."},
    {"stepIndex": 3,  "text": "Now call addLeft with the root's left child — node two."},
    {"stepIndex": 4,  "text": "Inside addLeft: node two is not a leaf — it has children — so we add it and recurse into node four. Output: one, two."},
    {"stepIndex": 5,  "text": "addLeft recurses again. Node four is not a leaf either — add it and recurse into node eight. Output: one, two, four."},
    {"stepIndex": 6,  "text": "addLeft reaches node eight. Node eight IS a leaf — both children are null — so the base case fires and we return without adding. Leaves are handled separately by addLeaves."},
    {"stepIndex": 7,  "text": "Now call addLeaves. It performs a full DFS and collects every leaf node in the tree."},
    {"stepIndex": 8,  "text": "Node eight — no children, it's a leaf. Add it. Output: one, two, four, eight."},
    {"stepIndex": 9,  "text": "Node nine — also a leaf under node four. Add it. Output: one, two, four, eight, nine."},
    {"stepIndex": 10, "text": "Node five has a child — node ten — so it is NOT a leaf. addLeaves recurses through node five without collecting it."},
    {"stepIndex": 11, "text": "Node ten IS a leaf. Add it. Node five was visited but never collected — that's exactly why it's excluded from the boundary. Output: one, two, four, eight, nine, ten."},
    {"stepIndex": 12, "text": "DFS moves to node three's subtree. Node six is a leaf. Add it. Output: one, two, four, eight, nine, ten, six."},
    {"stepIndex": 13, "text": "Node seven — leaf. Add it. addLeaves is complete. Output: one, two, four, eight, nine, ten, six, seven."},
    {"stepIndex": 14, "text": "Call addRight on the root's right child — node three. addRight recurses deeper first, before adding anything. It goes to node seven, which is a leaf, and returns immediately."},
    {"stepIndex": 15, "text": "Back in addRight for node three: the recursive call already returned, so NOW we add node three. Adding AFTER the recursion gives bottom-up order automatically — no explicit stack needed. Output: one, two, four, eight, nine, ten, six, seven, three."},
    {"stepIndex": 16, "text": "Nine boundary nodes in correct order. Node five was the only interior node — correctly excluded by all three helpers. Time and space: both O of n. Follow for more tree algorithms!"},
]

tower_of_hanoi_lines = [
    {"stepIndex": 0,  "text": "Tower of Hanoi. Four disks on peg A, biggest at the bottom. The goal — move all four to peg C, using B as a helper. The only rule: a bigger disk can never sit on top of a smaller one."},
    {"stepIndex": 1,  "text": "The function is recursive. If n equals zero, there is nothing to move — that is the base case. Just return."},
    {"stepIndex": 2,  "text": "Before moving disk n, we clear the path. Recursively move n minus one disks from src to via, with dst as the helper. This exposes the biggest disk."},
    {"stepIndex": 3,  "text": "Move one. Disk one goes from A to B."},
    {"stepIndex": 4,  "text": "Move two. Disk two goes from A to C."},
    {"stepIndex": 5,  "text": "Move three. Disk one goes from B to C."},
    {"stepIndex": 6,  "text": "Move four. Disk three goes from A to B."},
    {"stepIndex": 7,  "text": "Move five. Disk one goes from C to A."},
    {"stepIndex": 8,  "text": "Move six. Disk two goes from C to B."},
    {"stepIndex": 9,  "text": "Move seven. Disk one goes from A to B. The top three disks are now stacked on B, clearing the path for the biggest."},
    {"stepIndex": 10, "text": "Move eight. Disk four — the heaviest — crosses all the way from A to C."},
    {"stepIndex": 11, "text": "Move nine. Disk one goes from B to C."},
    {"stepIndex": 12, "text": "Move ten. Disk two goes from B to A."},
    {"stepIndex": 13, "text": "Move eleven. Disk one goes from C to A."},
    {"stepIndex": 14, "text": "Move twelve. Disk three goes from B to C."},
    {"stepIndex": 15, "text": "Move thirteen. Disk one goes from A to B."},
    {"stepIndex": 16, "text": "Move fourteen. Disk two goes from A to C."},
    {"stepIndex": 17, "text": "Move fifteen. Disk one goes from B to C. All four disks on peg C — solved!"},
    {"stepIndex": 18, "text": "Four disks needed exactly fifteen moves. The pattern is two to the power n, minus one. Time complexity O of two to the n — exponential. Space is O of n for the call stack. Follow for more algorithm breakdowns!"},
]

diagonal_lines = [
    {"stepIndex": 0,  "text": "Here's what we're building. Take this tree and group every node by diagonal — nodes reachable from each other by only moving right end up in the same group. This tree gives three groups: one, three, six on the first diagonal; two, five, eight on the second; four, seven on the third. By the end of this video, you'll code this in O of n."},
    {"stepIndex": 1,  "text": "Look at this tree. Every node you reach by only moving right belongs to the same diagonal. The second you go left, you drop to the next one. That's the entire algorithm — remember that, because at the end I'll show you why this same rule solves vertical order traversal too."},
    {"stepIndex": 2,  "text": "Null root, empty result. One-line guard — if you've written any tree problem before, this is automatic."},
    {"stepIndex": 3,  "text": "Initialize result and a queue, then seed the queue with node one. This queue is not for level-order traversal — it tracks the starting node of each new diagonal."},
    {"stepIndex": 4,  "text": "Outer while loop — one iteration per diagonal. Here's what trips most people up: this is not BFS. Level-order processes row by row. This processes diagonal by diagonal. Same queue structure, completely different purpose."},
    {"stepIndex": 5,  "text": "Top of each pass — row for this diagonal's output, nextQ to collect every left child we encounter. Left children are the entry points of future diagonals. We bank them now, process them later."},
    {"stepIndex": 6,  "text": "Poll node one. Enter the right-chain while loop. Add one to the row. Node one has a left child — two — and left means new diagonal, so two banks into nextQ. We don't follow it yet. We follow the right pointer instead."},
    {"stepIndex": 7,  "text": "Right to node three. Moving right keeps us on diagonal zero — the rule holds. Three has no left child, so nextQ is untouched. Row is now one, three."},
    {"stepIndex": 8,  "text": "Right of three leads to six. Add six. No children at all — right of six is null, the inner while exits. Diagonal zero is done: one, three, six. Now watch how the handoff works."},
    {"stepIndex": 9,  "text": "Row gets added to result. Queue absorbs nextQ — which held just node two. Two becomes the starting node of diagonal one. That's the handoff: every left child collected during the right-chain seeds the next diagonal's traversal."},
    {"stepIndex": 10, "text": "Outer loop fires again — queue has two. Poll it and enter the exact same right-chain logic. New diagonal, identical pattern."},
    {"stepIndex": 11, "text": "Add two, then five, then eight — following right pointers. Left children four and seven bank into nextQ along the way. Diagonal one: two, five, eight. Same right-chain logic, different diagonal."},
    {"stepIndex": 12, "text": "Queue absorbs nextQ: four and seven. Four arrives before seven because we added it to nextQ first, from node two's left child, before we even reached node five. BFS insertion order, not tree depth."},
    {"stepIndex": 13, "text": "Diagonal two. Poll four — no right child, chain ends immediately. Just four."},
    {"stepIndex": 14, "text": "Poll seven. Also no right child. Add seven. Queue empty — outer loop exits. Diagonal two: four, seven."},
    {"stepIndex": 15, "text": "Return the result. Three diagonals — exactly what the mental model predicted before we touched a single line of code."},
    {"stepIndex": 16, "text": "Every right move stayed on a diagonal. Every left move opened the next one. The code never broke that rule once — it just made it mechanical. That's what good algorithms do."},
    {"stepIndex": 17, "text": "Time: O of n — every node visited exactly once. Space: O of n for queue and output. Subscribe so you catch the next video — vertical order traversal uses this exact same model, just with column indices instead of diagonal indices."},
]

rtl_diagonal_lines = [
    {"stepIndex": 0,  "text": "Let's look at right-to-left diagonal traversal — the mirror of what we saw before. Three diagonals: one, two, four — three, five, seven — and six, eight."},
    {"stepIndex": 1,  "text": "In left-to-right diagonal, going right kept you on the same diagonal. Here it's flipped — going left keeps you on the diagonal, going right moves you to the next one."},
    {"stepIndex": 2,  "text": "Null root returns an empty list. Same guard as always."},
    {"stepIndex": 3,  "text": "Initialize result and a queue. Seed with root — node one. The queue tracks the entry node of each diagonal."},
    {"stepIndex": 4,  "text": "Outer while loop: queue not empty means more diagonals remain."},
    {"stepIndex": 5,  "text": "Start each diagonal with a fresh row and an empty nextQ. Row collects output; nextQ collects right children — the entry nodes for the next diagonal."},
    {"stepIndex": 6,  "text": "Poll node one. Enter the left-chain while loop. Add one to row. Right child three goes to nextQ — it starts the next diagonal."},
    {"stepIndex": 7,  "text": "Move left to node two. Left movement keeps us on diagonal zero."},
    {"stepIndex": 8,  "text": "Add two to row. Right child five goes to nextQ. Move left to four."},
    {"stepIndex": 9,  "text": "Add four. No right child. Left is null — inner while exits. Diagonal zero: one, two, four."},
    {"stepIndex": 10, "text": "Push row to result. Refill queue from nextQ — now three and five, entry nodes of diagonal one."},
    {"stepIndex": 11, "text": "Diagonal one begins. Poll node three."},
    {"stepIndex": 12, "text": "Add three. Right child six goes to nextQ. No left child — done with three. Poll five."},
    {"stepIndex": 13, "text": "Add five. Right child eight to nextQ. Move left to seven. Add seven. No right, no left — inner while exits. Diagonal one: three, five, seven."},
    {"stepIndex": 14, "text": "Push to result. Queue refills with six and eight — entry nodes of diagonal two."},
    {"stepIndex": 15, "text": "Diagonal two: poll six, no left. Poll eight, no left. Diagonal two: six, eight. Queue empty — outer loop exits."},
    {"stepIndex": 16, "text": "Return the result. Diagonal zero: one, two, four. One: three, five, seven. Two: six, eight."},
    {"stepIndex": 17, "text": "Time O of n — every node visited exactly once. Space O of n. The only change from left-to-right diagonal: swap left and right in the inner loop. Subscribe for more tree patterns."},
]

vertical_order_lines = [
    {"stepIndex": 0,  "text": "Most people look at this and think — just group nodes by their horizontal position, easy. Then they try it, and the output comes out scrambled. The problem isn't the traversal. It's one specific choice you make when storing the groups. By the end, you'll see exactly what that choice is — and why it makes everything just work."},
    {"stepIndex": 1,  "text": "Here's the intuition before we touch any code. Every time you take a left turn in the tree, your column number drops by one. Every right turn, it goes up by one. That's it. Root is column zero, left child is minus one, right child is plus one. Hold onto that — everything we write is just automating this one idea."},
    {"stepIndex": 2,  "text": "If the tree is empty, return empty. Nothing to explain there."},
    {"stepIndex": 3,  "text": "Now here's the key decision. We need a map to collect nodes under each column number. You might reach for a HashMap — but HashMap stores things in no particular order. So when you read the columns back out, they could come in any sequence. Instead, use a TreeMap. A TreeMap keeps its keys sorted automatically. So the columns will come out left to right without you doing anything extra. We also need a second map to track each node's column, and a queue to process nodes level by level."},
    {"stepIndex": 4,  "text": "Put the root into the queue, label it column zero. Now start the loop — poll means take from the front of the queue. We take node one out. It's column zero, so it goes into the TreeMap under zero. That's the first entry. If this is clicking for you already, subscribe — this is what I post every week."},
    {"stepIndex": 5,  "text": "Node one has two children. Left child two — going left means column zero minus one, so column negative one. Right child three — going right means column zero plus one, column positive one. Both go into the queue."},
    {"stepIndex": 6,  "text": "Take node two out. It's at column negative one. Drop it into that column's list. Simple."},
    {"stepIndex": 7,  "text": "Node two's children now. Four goes left — column negative two, the furthest left in our entire tree. Five goes right — column zero. Same column as the root. So five is going to end up in the same group as node one. Keep that in mind — I'll come back to it."},
    {"stepIndex": 8,  "text": "Take node three. Column positive one, added. Its right child six gets column positive two and joins the queue. Now — remember what I said about five sharing a column with one? Watch what happens when we process five. The order they appear in that group actually matters."},
    {"stepIndex": 9,  "text": "Take node four — column negative two. No children. Done."},
    {"stepIndex": 10, "text": "Take node five. Column zero — so it joins node one in the same group. And look: one is first, five is second. Why? Because we used a queue. A queue processes the tree level by level, top to bottom. Node one was on a higher level, so it got processed earlier. If you had traversed the tree in a different way — going deep down one branch before the other — five could have come out before one, and the answer would be wrong. The queue is what makes the order correct."},
    {"stepIndex": 11, "text": "Take node six — column positive two. Added. No children."},
    {"stepIndex": 12, "text": "Take node seven — column positive one. It joins node three. Queue is empty, every node is processed. Quick question — what breaks if you swap the TreeMap for a regular HashMap? Think about it and drop your answer in the comments."},
    {"stepIndex": 13, "text": "Now we just read the TreeMap. It's already sorted, so it hands us the columns left to right: four from column minus two, two from minus one, one and five from zero, three and seven from plus one, six from plus two. No sorting step. No second loop. The TreeMap took care of it."},
    {"stepIndex": 14, "text": "Time complexity is O n log n — visiting every node is O n, but each TreeMap insertion costs log n to stay sorted, so that adds up. Space is O n. That's the whole solution. Next up is top view traversal — same column tracking, but you only keep the first node you see in each column. I'll see you there."},
]

zigzag_lines = [
    {"stepIndex": 0,  "text": "You've probably seen level order — row by row, left to right. Zigzag does the same thing, but flips direction every level. Level zero: just one. Level one: three, two — that's right to left. Level two: four, five, six, seven — left to right again. Sound weird? Let me show you exactly how it works."},
    {"stepIndex": 1,  "text": "The whole trick fits in one boolean: leftToRight. When it's true, we go left to right. When it's false, right to left. We flip it after every level. That's the entire algorithm — one flag."},
    {"stepIndex": 2,  "text": "Null root? Return empty list. Simple safety check."},
    {"stepIndex": 3,  "text": "Set up the result list, create a queue, drop the root in. And set leftToRight to true — the first level always starts left to right."},
    {"stepIndex": 4,  "text": "Enter the while loop. Size is one — that's how many nodes are in this level. We create a fresh LinkedList called level to collect this level's values."},
    {"stepIndex": 5,  "text": "Poll node one. leftToRight is true, so we call addLast. Level is now just [1]."},
    {"stepIndex": 6,  "text": "Node one has both children. Offer two and three into the queue."},
    {"stepIndex": 7,  "text": "Add level [1] to result. Then flip leftToRight to false. Next level goes right to left."},
    {"stepIndex": 8,  "text": "Second pass. Size is two — nodes two and three are waiting. leftToRight is now false. Pay attention — this is where the magic happens."},
    {"stepIndex": 9,  "text": "Poll node two. leftToRight is false, so we call addFirst this time. Level = [2]."},
    {"stepIndex": 10, "text": "Two has children — offer four and five."},
    {"stepIndex": 11, "text": "Now poll node three. addFirst again — puts three at the FRONT. Level becomes [3, 2]. That's the zigzag! Right to left, without reversing the whole array."},
    {"stepIndex": 12, "text": "Three has children — offer six and seven."},
    {"stepIndex": 13, "text": "Add [3, 2] to result. Flip leftToRight back to true. Output so far: one, three, two."},
    {"stepIndex": 14, "text": "Third pass. Four leaf nodes. leftToRight is true — addLast each. No children to offer. Add [4, 5, 6, 7]. Queue drains."},
    {"stepIndex": 15, "text": "Return result. That's zigzag: [1], then [3, 2], then [4, 5, 6, 7]. One BFS pass, one boolean, one LinkedList trick."},
    {"stepIndex": 16, "text": "Time is O of n — every node visited once. Space is O of n for the queue. The addFirst and addLast trick is the key insight. Subscribe for more tree patterns like this."},
]

intro_trees_lines = [
    {"stepIndex": 0,  "text": "Trees are everywhere in computer science — file systems, databases, compilers, HTML. Once you understand binary trees, every algorithm that follows becomes clear. Let's start from zero."},
    {"stepIndex": 1,  "text": "A binary tree is a hierarchical data structure. It's made up of nodes connected by edges. The rule: each node can have at most two children — a left child and a right child."},
    {"stepIndex": 2,  "text": "The very top node is called the ROOT. Every tree has exactly one root. It's where every traversal starts."},
    {"stepIndex": 3,  "text": "When a node connects to a node below it, that relationship is called parent and child. Node one is the parent. Node two is its left child, node three its right child."},
    {"stepIndex": 4,  "text": "Two nodes that share the same parent are called SIBLINGS. Node two and node three both have node one as their parent — so they are siblings of each other."},
    {"stepIndex": 5,  "text": "Left and right are not just labels — they define the structure. A node on the left side and the same node on the right creates a completely different tree."},
    {"stepIndex": 6,  "text": "Every node is the root of its own SUBTREE — the node itself plus all its descendants. Node two, together with four and five, forms its own subtree."},
    {"stepIndex": 7,  "text": "Nodes with no children are called LEAVES. They're at the bottom of the tree — the endpoints. In this tree, four, five, six, and seven are all leaves."},
    {"stepIndex": 8,  "text": "Nodes that have at least one child are called INTERNAL nodes. Here, two and three are internal — they have children below them."},
    {"stepIndex": 9,  "text": "The DEGREE of a node is how many children it has. Node one has two children — degree two. Nodes two and three are also degree two. Leaves have no children — degree zero."},
    {"stepIndex": 10, "text": "Nodes at the same distance from the root belong to the same LEVEL. The root is level zero. Two and three are level one. Four, five, six, and seven are level two."},
    {"stepIndex": 11, "text": "Height is the longest root-to-leaf path, counted in edges. Watch the highlighted path — root one, down to node two, down to leaf four. Two edges. Height equals two."},
    {"stepIndex": 12, "text": "Depth works the other way. It's the number of edges from the root down to a specific node. Root has depth zero. Nodes two and three are depth one. The four leaves at the bottom are all depth two."},
    {"stepIndex": 13, "text": "A PATH is a sequence of connected nodes with no repetition. Here, one to three to seven is a path of length two. Height is simply the length of the longest path from root to any leaf."},
    {"stepIndex": 14, "text": "In code, a tree node is just a class with three fields. That's all you need to represent any binary tree."},
    {"stepIndex": 15, "text": "val stores the node's value. It can be an integer, a string — any data type."},
    {"stepIndex": 16, "text": "left and right are references to the left and right child nodes. If a child doesn't exist, they're null."},
    {"stepIndex": 17, "text": "The constructor takes a value, sets left and right to null. Every node starts as a leaf — you connect it by setting the parent's left or right pointer."},
    {"stepIndex": 18, "text": "One class. Three fields. From this, you can build binary search trees, heaps, tries — every tree structure we cover. Subscribe to see them all."},
]

ALL_NARRATIONS = [
    {"sceneId": "insert-head",          "lines": insert_head_lines},
    {"sceneId": "insert-tail",          "lines": insert_tail_lines},
    {"sceneId": "delete-node",          "lines": delete_node_lines},
    {"sceneId": "search-node",          "lines": search_node_lines},
    {"sceneId": "remove-nth-from-end",  "lines": remove_nth_lines},
    {"sceneId": "left-view",            "lines": left_view_lines},
    {"sceneId": "top-view",             "lines": top_view_lines},
    {"sceneId": "o-n",                  "lines": linear_search_lines},
    {"sceneId": "o-log-n",             "lines": binary_search_lines},
    {"sceneId": "o-n-squared",          "lines": bubble_sort_lines},
    {"sceneId": "o-1",                  "lines": constant_time_lines},
    {"sceneId": "o-n-log-n",           "lines": merge_sort_lines},
    {"sceneId": "o-2n",                "lines": exponential_lines},
    {"sceneId": "o-n-factorial",        "lines": factorial_lines},
    {"sceneId": "detect-cycle",         "lines": detect_cycle_lines},
    {"sceneId": "reverse",              "lines": reverse_lines},
    {"sceneId": "merge-lists",          "lines": merge_lists_lines},
    {"sceneId": "tls-handshake",        "lines": tls_handshake_lines},
    {"sceneId": "level-order",          "lines": level_order_lines},
    {"sceneId": "bst-insert",           "lines": bst_insert_lines},
    {"sceneId": "right-view",           "lines": right_view_lines},
    {"sceneId": "boundary",             "lines": boundary_lines},
    {"sceneId": "tower-of-hanoi",       "lines": tower_of_hanoi_lines},
    {"sceneId": "diagonal-traversal",   "lines": diagonal_lines},
    {"sceneId": "diagonal-rl",          "lines": rtl_diagonal_lines},
    {"sceneId": "vertical-order",       "lines": vertical_order_lines},
    {"sceneId": "zigzag",               "lines": zigzag_lines},
    {"sceneId": "intro-trees",          "lines": intro_trees_lines},
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
    parser = argparse.ArgumentParser()
    parser.add_argument("scene", nargs="?", default=None, help="Scene ID to generate (omit for all)")
    parser.add_argument("--force", "-f", action="store_true", help="Overwrite existing MP3 files")
    args = parser.parse_args()
    filter_scene = args.scene
    force = args.force

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

            if output_path.exists() and not force:
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
