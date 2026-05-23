import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const VOICE = "en-US-BrianMultilingualNeural";
const DEFAULT_RATE = "+10%";
const DEFAULT_PITCH = "+0Hz";

const insertHeadLines = [
  { stepIndex: 0, text: "So, a linked list. It's basically a chain of nodes. Each node has two parts. A value, and a next pointer that points to the following node." },
  { stepIndex: 1, text: "Here's our linked list. Three, seven, nine. And this head pointer right here? That marks the start." },
  { stepIndex: 2, text: "Now, what we want to do, is insert the value one, at the very beginning of this list." },
  { stepIndex: 3, text: "But here's the thing. What if we move the head pointer to the new node first?", rate: "+5%" },
  { stepIndex: 4, text: "See the problem? We lost the connection to three, seven, and nine. Those nodes are completely unreachable now.", rate: "+5%" },
  { stepIndex: 5, text: "So, the order matters. We have to link the new node first, before touching head.", rate: "+5%" },
  { stepIndex: 6, text: "Alright, step one. We create a brand new node, with value one." },
  { stepIndex: 7, text: "Step two. We point new node's next, to the current head. This links it into the existing chain." },
  { stepIndex: 8, text: "Step three. Now it's safe to move head to the new node. Nothing is lost." },
  { stepIndex: 9, text: "And we're done! We increment the size. The list is now one, three, seven, nine." },
  { stepIndex: 10, text: "Now here's the beautiful part. We never had to walk through the list. No matter how long it is, this is always O of one. Constant time.", rate: "+5%" },
  { stepIndex: 11, text: "What about an empty list though? Well, the same code just works. New node's next is null, and head moves to the new node." },
  { stepIndex: 12, text: "So remember. Three simple steps. Create the node. Link it to head. Then move head. That's it." },
  { stepIndex: 13, text: "If this helped you understand linked lists better, hit that subscribe button and drop a like. More data structures coming soon!" },
];

const insertTailLines = [
  { stepIndex: 0, text: "Alright, here's our linked list again. Three, seven, nine, with head pointing to the start." },
  { stepIndex: 1, text: "This time, we want to insert the value five, at the very end of this list. At the tail." },
  { stepIndex: 2, text: "But unlike insert at head, we don't have a direct pointer to the last node. So we need to walk through the entire list to find it.", rate: "+5%" },
  { stepIndex: 3, text: "But first, what if the list is empty? If head is null, the new node just becomes the head. Simple." },
  { stepIndex: 4, text: "Back to our list. Step one. Create a brand new node, with value five." },
  { stepIndex: 5, text: "Step two. We create a pointer called curr, and set it to head." },
  { stepIndex: 6, text: "Now we check. Node three's next points to seven. Not null. So curr moves forward to seven." },
  { stepIndex: 7, text: "Node seven's next points to nine. Still not null. So curr advances to nine." },
  { stepIndex: 8, text: "Now we check node nine's next. It's null! We've found the last node. We exit the loop." },
  { stepIndex: 9, text: "Step three. We set curr dot next to the new node. This links five to the end of our chain." },
  { stepIndex: 10, text: "And we're done! We increment the size. The list is now three, seven, nine, five." },
  { stepIndex: 11, text: "Now why is this O of n? Because we had to walk through every single node to reach the tail. The longer the list, the more steps it takes.", rate: "+5%" },
  { stepIndex: 12, text: "Compare that to insert at head, which was O of one. With a tail pointer, we could make this O of one too. But that's a topic for another video.", rate: "+5%" },
  { stepIndex: 13, text: "So remember. Create the node. Walk to the end. Link it up. That's insert at tail." },
  { stepIndex: 14, text: "If this helped you understand linked lists better, hit that subscribe button and drop a like. More data structures coming soon!" },
];

const deleteNodeLines = [
  { stepIndex: 0,  text: "Okay so here's our linked list. Three, seven, nine, five. Four nodes, each one pointing to the next. Today we're removing one of them." },
  { stepIndex: 1,  text: "But first. What if the list is already empty? Head is null. There's literally nothing there. So we just return. No crash, no extra logic. Done." },
  { stepIndex: 2,  text: "Now the first real case. What if the node we want to delete is right at the front? The head itself." },
  { stepIndex: 3,  text: "Say we're deleting three. We check — head dot val equals three. Yep, that's our node." },
  { stepIndex: 4,  text: "All we do is move head one step forward. That's it. Three is gone. We never even walked the rest of the list. O of one. Instant." },
  { stepIndex: 5,  text: "Alright, now the trickier part. What if the node is somewhere in the middle? We can't jump straight to it. We have to walk the chain." },
  { stepIndex: 6,  text: "We create a pointer called curr, and start it at head. This is our scanner. It moves through the list one node at a time." },
  { stepIndex: 7,  text: "We check curr dot next dot val. And there it is — seven. We found the node we want to remove." },
  { stepIndex: 8,  text: "Here's the key move. We set curr dot next to curr dot next dot next. So three no longer points to seven — it skips straight to nine. Seven is bypassed.", rate: "+5%" },
  { stepIndex: 9,  text: "And seven is gone. The list reconnects cleanly. Three, nine, five. No gaps." },
  { stepIndex: 10, text: "Last case. What if it's the tail — the very last node? Same approach, we just walk a bit further." },
  { stepIndex: 11, text: "Curr starts at three. Three's next is seven — not our target. Keep moving." },
  { stepIndex: 12, text: "Now curr is at seven. Seven's next is nine — still not it. One more step." },
  { stepIndex: 13, text: "Curr lands on nine. And nine's next is five — which is exactly what we want to delete. We're in the right spot." },
  { stepIndex: 14, text: "We set nine dot next to null. Five is detached. The tail is gone. Clean." },
  { stepIndex: 15, text: "So here's the full picture. Deleting the head is O of one — fast, no walking needed. But deleting anything else means traversing the list, and that's O of n. The longer the list, the longer it takes.", rate: "+5%" },
  { stepIndex: 16, text: "If this clicked for you, hit subscribe. Next up — searching a linked list." },
];

const removeNthLines = [
  // Phase 0: Problem intro (optimal code dimmed)
  { stepIndex: 0, text: "The problem is to remove the nth node from the end of a linked list — we have nodes one through five with n equals two, so we need to delete the second node from the end which is four, and the result should be one, two, three, five." },
  // Phase 1: Naive approach (naive code active)
  { stepIndex: 1, text: "The obvious approach is two passes — a first pass to count the total length, then a second pass to walk to the right spot and splice the node out." },
  { stepIndex: 2, text: "In the first pass we walk a pointer through the whole list bumping a counter at each step — one, two, three, four, five — so the total length is five." },
  { stepIndex: 3, text: "Now the target — length minus n is three, but we count from zero, so index three is actually the fourth node which holds four, and that's what we're removing, so we reset curr to head and walk two steps to land on node three, the predecessor." },
  { stepIndex: 4, text: "Then we splice by setting curr dot next to curr dot next dot next, so four gets bypassed and we're done — but that was two passes, so can we do it in just one?", rate: "+5%" },
  // Phase 2: Optimal (optimal code active)
  { stepIndex: 5, text: "Here's the two-pointer trick — we start by adding a dummy node in front of head, and that one small detail is going to matter a lot when we hit edge cases." },
  { stepIndex: 6, text: "Now two pointers, fast and slow, both starting at dummy — we move fast forward by n plus one steps, and with n equals two, fast advances three times and lands on node three." },
  { stepIndex: 7, text: "Here's where the magic happens — we move fast and slow together one step at a time, and they maintain that exact gap of n plus one between them the entire way." },
  { stepIndex: 8, text: "When fast falls off the end and becomes null, slow is sitting right before the node we want to remove — exactly the predecessor, every single time." },
  { stepIndex: 9, text: "It's a single line — slow dot next equals slow dot next dot next — four is bypassed, we return dummy dot next and we're done in one pass with no counting at all." },
  // Phase 3: Edge case - remove head
  { stepIndex: 10, text: "Now let me show you why that dummy node matters — what if n equals five? We're removing the head itself, node one." },
  { stepIndex: 11, text: "Fast advances six steps, walks right through every node and lands on null, while slow never moves and stays at dummy." },
  { stepIndex: 12, text: "slow dot next dot next just skips past the old head — no null checks, no special cases needed, because the dummy node absorbs what would otherwise be a crash." },
  // Phase 4: Complexity
  { stepIndex: 13, text: "Both versions are O of n time and O of one space, but the two-pointer version does it in a single pass with no length counting, which makes it the cleaner and more elegant solution.", rate: "+5%" },
  // Phase 5: CTA
  { stepIndex: 14, text: "If this two-pointer trick clicked for you, smash that subscribe because more LeetCode patterns are on the way." },
];

const reverseLines = [
  { stepIndex: 0, text: "Alright, here's our linked list. Three, seven, nine. Three nodes, each pointing to the next. Today we're flipping the whole thing around." },
  { stepIndex: 1, text: "So what does reversing actually mean? Instead of three pointing to seven pointing to nine, we want nine pointing to seven pointing to three. Every arrow flips direction." },
  { stepIndex: 2, text: "To pull this off, we need three pointers. Prev starts at null. Curr starts at head, which is three. And next, we'll use that to save our place before we break any links." },
  { stepIndex: 3, text: "First thing, we save curr dot next into next. That's seven. We need this because we're about to destroy the link from three to seven." },
  { stepIndex: 4, text: "Now the key move. We set curr dot next to prev. So three no longer points to seven. It points to null. We just reversed our first link." },
  { stepIndex: 5, text: "Time to advance. Prev moves to curr, which is three. And curr moves to next, which is seven. We slide everything forward by one." },
  { stepIndex: 6, text: "Same pattern again. Save next. That's nine." },
  { stepIndex: 7, text: "Reverse the link. Seven's next now points to three instead of nine." },
  { stepIndex: 8, text: "Advance again. Prev moves to seven, curr moves to nine." },
  { stepIndex: 9, text: "One more time. Save next. It's null this time. We're at the last node." },
  { stepIndex: 10, text: "Reverse the link. Nine now points back to seven." },
  { stepIndex: 11, text: "Advance. Prev is nine, curr is null. The loop condition fails. We're done iterating." },
  { stepIndex: 12, text: "Last step. We set head to prev. And prev is nine. So the list now starts at nine, goes to seven, then three. Fully reversed." },
  { stepIndex: 13, text: "Here's the beauty of it. We touched every node exactly once. No extra memory, no recursion. O of n time, O of one space. Clean.", rate: "+5%" },
  { stepIndex: 14, text: "If this helped you visualize linked list reversal, hit subscribe. More data structures and algorithms coming soon." },
];

const detectCycleLines = [
  { stepIndex: 0, text: "Here's a tricky one. How do you know if a linked list has a cycle? Meaning, some node's next pointer loops back to an earlier node, creating an infinite loop." },
  { stepIndex: 1, text: "Here's our list. One, two, three, four, five. But look, five's next doesn't point to null. It points back to three. That's a cycle. If you tried to traverse this list, you'd loop forever." },
  { stepIndex: 2, text: "The trick is called Floyd's algorithm. Two pointers, slow and fast, both starting at head. Slow moves one step at a time. Fast moves two steps." },
  { stepIndex: 3, text: "Let's run it. Slow moves to two. Fast jumps to three. They're at different nodes." },
  { stepIndex: 4, text: "We check. Slow is at two, fast is at three. Not equal. Keep going." },
  { stepIndex: 5, text: "Slow moves to three. Fast jumps two steps and lands on five." },
  { stepIndex: 6, text: "Still not equal. Slow is three, fast is five. Continue." },
  { stepIndex: 7, text: "Now watch the fast pointer carefully. Slow moves to four. Fast follows the cycle arrow from five back to three, then hops one more to four. They're both at four." },
  { stepIndex: 8, text: "Slow equals fast. Cycle detected. We return true." },
  { stepIndex: 9, text: "But what if there's no cycle? Say the list is just one through five with null at the end. No loop." },
  { stepIndex: 10, text: "Fast would reach null before slow catches up. The while condition fails, and we return false. Simple." },
  { stepIndex: 11, text: "Why does this work? Think of it like two runners on a circular track. The fast one will always lap the slow one. If there's a cycle, they must meet. If not, fast hits the end.", rate: "+5%" },
  { stepIndex: 12, text: "Time complexity, O of n. Space, O of one. No hash sets, no extra memory. Just two pointers. Elegant." },
  { stepIndex: 13, text: "If Floyd's algorithm clicked for you, hit that subscribe button. More algorithm breakdowns on the way." },
];

const mergeListsLines = [
  { stepIndex: 0, text: "Two sorted linked lists. List A has one, four, six. List B has two, three, five. We need to merge them into one sorted list." },
  { stepIndex: 1, text: "The trick? A dummy node. We create a fake node with value zero. It won't be in the final answer, but it gives us a stable starting point. Tail points to dummy." },
  { stepIndex: 2, text: "Now we compare. A is at one, B is at two. One is smaller, so we take from A. Tail dot next equals A. Then we advance A to four, and tail to one." },
  { stepIndex: 3, text: "Compare again. A is four, B is two. Two is smaller. Take from B. Tail dot next equals B. Advance B to three, tail to two." },
  { stepIndex: 4, text: "A is four, B is three. Three is smaller. Take from B. Advance B to five, tail to three." },
  { stepIndex: 5, text: "A is four, B is five. Four is smaller. Take from A. Advance A to six, tail to four." },
  { stepIndex: 6, text: "A is six, B is five. Five is smaller. Take from B. Advance B to null, tail to five." },
  { stepIndex: 7, text: "B is null now. The while loop ends. But A still has six left." },
  { stepIndex: 8, text: "We just attach whatever's remaining. Tail dot next equals A. Six gets linked to the end." },
  { stepIndex: 9, text: "And we're done. The merged list is one, two, three, four, five, six. Perfectly sorted. We return dummy dot next to skip that fake zero node." },
  { stepIndex: 10, text: "Time complexity? O of n plus m, where n and m are the lengths of the two lists. We visit every node exactly once. Space is O of one, we're just rearranging pointers.", rate: "+5%" },
  { stepIndex: 11, text: "If this merge technique made sense to you, smash that subscribe. More algorithm deep dives are coming." },
];

const tlsHandshakeLines = [
  { stepIndex: 0, text: "Every time you open a website that starts with HTTPS, something invisible happens before a single byte of your data moves. A handshake. Browser and server quietly agree on how to lock the conversation. That agreement is TLS." },
  { stepIndex: 1, text: "The browser speaks first. It says, here are the encryption methods I know, the TLS versions I support, and a random number I just generated. That random number is called the client random. It's the first ingredient in what becomes your encryption key." },
  { stepIndex: 2, text: "The server responds. It picks the strongest cipher suite both sides share, generates its own random number, the server random, and sends back a session ID. Two randoms, two sides, neither knows the key yet." },
  { stepIndex: 3, text: "Now the server proves who it is. It sends its certificate, a document containing its public key, signed by a trusted Certificate Authority. Your browser checks that signature. If it's valid, you're talking to the real server, not an imposter." },
  { stepIndex: 4, text: "The browser generates one more secret, the pre-master secret. It encrypts it using the server's public key from the certificate and sends it across. Only the server, with its private key, can decrypt this. No one watching the network can read it." },
  { stepIndex: 5, text: "Here's where the magic happens. Both sides now have all three ingredients: client random, server random, and pre-master secret. Each side independently runs the same calculation and arrives at the exact same session keys. The key was never sent. It was derived." },
  { stepIndex: 6, text: "The browser switches to encrypted mode and sends the first protected message, a Finished packet. It contains a fingerprint of the entire handshake so far. If anyone tampered with a single message, this check fails." },
  { stepIndex: 7, text: "The server sends its own Finished message back. Both sides have now verified each other. The handshake is complete. You have a secure, authenticated, encrypted channel, built in milliseconds, before you even saw the page load." },
  { stepIndex: 8, text: "And now everything flows. Every request, every response, every cookie, every header, all of it encrypted with AES-256-GCM. Symmetric, fast, unreadable to anyone in between. That lock icon in your browser, now you know exactly what it took to put it there." },
];

const bstInsertLines = [
  // Hook + intro
  { stepIndex: 0,  text: "BST insertion feels complicated because of recursion… but the actual algorithm is just repeating one tiny decision again and again — left or right. And once you see the return phase visually, the whole thing finally clicks. Alright, Binary Search Tree. One simple rule — smaller values go left, larger values go right. Right now our root is fifty. Thirty is on the left, seventy on the right, and below thirty we already have twenty and forty. Now let's insert thirty-five." },
  // Phase 1 – Normal insert
  { stepIndex: 1,  text: "The public insert function just calls a recursive helper. So we start at node fifty. First question — is this node null? No. So now we compare." },
  { stepIndex: 2,  text: "Thirty-five is smaller than fifty… so we move left. That means the value belongs somewhere inside the left subtree. Now recursion takes us to thirty." },
  { stepIndex: 3,  text: "At node thirty now. Thirty-five is greater than thirty… so this time we go right. And we land on forty." },
  { stepIndex: 4,  text: "Now watch carefully. Thirty-five is smaller than forty… so we try going left. But forty doesn't even have a left child." },
  { stepIndex: 5,  text: "And there it is — null. That's the base case. This is exactly where the new node should be created. So recursion creates a brand new node containing thirty-five… and returns it." },
  { stepIndex: 6,  text: "Now comes the important part. That returned node bubbles back up the recursive calls… and gets attached to forty's left pointer automatically. We never manually connected thirty-five ourselves. Recursion handled the insertion during the return phase. And just like that… thirty-five is now part of the BST." },
  // Phase 2 – Empty tree
  { stepIndex: 7,  text: "Now let's look at a completely empty tree. No root. Nothing. What happens if we insert ten?" },
  { stepIndex: 8,  text: "insertRec gets called immediately with null. Same base case as before. But this time it happens at the very top. No comparisons. No moving left or right. Nothing." },
  { stepIndex: 9,  text: "So recursion creates the new node… returns it… and that returned node becomes the root itself. That's the cool part. The exact same recursive logic handled a deep insertion and a completely empty tree. One base case… covers everything." },
  // Phase 3 – Duplicate
  { stepIndex: 10, text: "Alright, last case. What if we try inserting a duplicate? Let's insert forty again." },
  { stepIndex: 11, text: "Forty starts at the root. Forty is smaller than fifty — so we go left." },
  { stepIndex: 12, text: "Now at node thirty. Forty is greater than thirty — so this time we go right." },
  { stepIndex: 13, text: "And we land on node forty. Here's the key moment — forty equals forty. Neither the less-than condition nor the greater-than condition fires." },
  { stepIndex: 14, text: "So neither branch runs. The recursion simply returns the current node… unchanged. No new node gets created. That means this BST ignores duplicates silently." },
  // Ending / CTA
  { stepIndex: 15, text: "And that's BST insertion. At every step, recursion just asks one question: left or right? Eventually it hits null… creates the node… and the return phase reconnects everything automatically. Time complexity is O of h — O of log n in a balanced tree, O of n in the worst case. And honestly… once the return phase clicks, BST insertion suddenly feels way simpler." },
];

const levelOrderLines = [
  { stepIndex: 0,  text: "Level order traversal is how you read a tree the same way you read a page — left to right, row by row. Every node in level one before any node in level two. Think of it as processing the tree in waves. We have a seven-node complete binary tree here. Node one at the root, two and three one level below, and four through seven at the bottom. Watch how we visit them in that exact order." },
  { stepIndex: 1,  text: "Before anything else, a null check. If the root doesn't exist, there's no tree to traverse. We return an empty result right away. One line, prevents a crash on an empty tree. Always good practice." },
  { stepIndex: 2,  text: "Now, why a queue? Because a queue is first-in, first-out. The node that enters first exits first. That's exactly the behaviour we need — finish processing each level completely before moving to the next. We create the queue and drop in the root. Node one is now waiting in line." },
  { stepIndex: 3,  text: "The while loop is the engine. As long as the queue has something in it, there are nodes left to process. Right now, node one is in the queue. The condition is true — we enter the loop." },
  { stepIndex: 4,  text: "Poll removes the front of the queue and returns it. We get node one. We call result dot add to record its value. Output so far — just one. The queue is now empty, but we're about to refill it." },
  { stepIndex: 5,  text: "Node one has two children. Two on the left, three on the right. We check each child and offer them to the queue. Left before right — always. The queue now holds two and three. We've just seeded the entire second level." },
  { stepIndex: 6,  text: "Back to the top of the while loop. Queue isn't empty — node two is waiting. We poll it. Two exits from the front. We add two to the result. Output: one, two." },
  { stepIndex: 7,  text: "Two's left child is four and its right child is five. Both get offered to the queue. The queue now has three, four, five. Three was already there from before, and four and five just joined the line." },
  { stepIndex: 8,  text: "We poll again. Three comes out next — it was added before four and five, so it exits first. That's the queue enforcing order. We add three to the result. Output: one, two, three. The entire second level is captured." },
  { stepIndex: 9,  text: "Three's children are six and seven. We offer both. Queue now holds four, five, six, seven. That's the complete third level, lined up and ready to go." },
  { stepIndex: 10, text: "Poll gives us four. Four is a leaf — no left child, no right child. Both if checks see null, so nothing gets added to the queue. We add four to the result and move on. Output: one, two, three, four." },
  { stepIndex: 11, text: "Five is next. Also a leaf. Poll, add to result, nothing to enqueue. Output: one, two, three, four, five." },
  { stepIndex: 12, text: "Six comes out of the queue. Another leaf. Poll, add, done. Output: one through six. One node left waiting." },
  { stepIndex: 13, text: "Seven — the last node. We poll it and add it. Queue size drops to zero. Output: one, two, three, four, five, six, seven. Every single node, in exactly the right order." },
  { stepIndex: 14, text: "The while loop checks one more time. Queue is empty — the condition is false. We exit. Nothing more to process." },
  { stepIndex: 15, text: "Time complexity is O of n — we visit every node exactly once. Space is also O of n — at peak, the queue holds an entire level, and in a complete binary tree the bottom level has roughly n over two nodes. This queue-based, wave-by-wave pattern is the foundation of BFS and shows up everywhere in tree problems. Drop a like if this clicked, and subscribe for more." },
];

const rightViewLines = [
  { stepIndex: 0,  text: "The right view of a binary tree shows the last node visible at each level — what you'd see looking from the right side." },
  { stepIndex: 1,  text: "Edge case: if the tree is empty, we return an empty list." },
  { stepIndex: 2,  text: "We create a result list and a queue, then add the root to start BFS." },
  { stepIndex: 3,  text: "We loop while the queue is not empty." },
  { stepIndex: 4,  text: "Capture the current level size — this tells us when the level ends." },
  { stepIndex: 5,  text: "We poll node one. Since i equals size minus one, this is the last node in the level — add it to the result." },
  { stepIndex: 6,  text: "Push its left child, two, and right child, three, into the queue." },
  { stepIndex: 7,  text: "Level one has two nodes. We grab the size." },
  { stepIndex: 8,  text: "Poll node two. i is zero, not size minus one, so we skip it." },
  { stepIndex: 9,  text: "Push node two's children — four and five — into the queue." },
  { stepIndex: 10, text: "Poll node three. i equals one, which is size minus one — add three to the result." },
  { stepIndex: 11, text: "Push node three's children — six and seven." },
  { stepIndex: 12, text: "Level two has four nodes. We grab the size." },
  { stepIndex: 13, text: "Poll node four. i is zero out of three — skip it." },
  { stepIndex: 14, text: "Push node four's only child — eight." },
  { stepIndex: 15, text: "Poll node five. i is one out of three — skip it. No children." },
  { stepIndex: 16, text: "Poll node six. i is two out of three — skip it. No children." },
  { stepIndex: 17, text: "Poll node seven. i equals three, size minus one — add seven to the result." },
  { stepIndex: 18, text: "Level three has just one node. Size is one." },
  { stepIndex: 19, text: "Poll node eight. i is zero, size minus one — it's the only node on this level, so add it to the result." },
  { stepIndex: 20, text: "Queue is empty, the while loop exits." },
  { stepIndex: 21, text: "We return the right view: one, three, seven, eight. Time and space complexity are both O of n. Follow for more tree algorithms!" },
];

const boundaryLines = [
  { stepIndex: 0,  text: "Boundary traversal collects every node visible from outside the tree. Three recursive helpers do the work: addLeft, addLeaves, and addRight. Nine nodes get a dashed ring — node five has no ring because it's the only interior node." },
  { stepIndex: 1,  text: "Handle the edge case first: empty tree returns an empty list." },
  { stepIndex: 2,  text: "The root always goes in first — unless it's a leaf. Node one has children, so we add it. Output: one." },
  { stepIndex: 3,  text: "Now call addLeft with the root's left child — node two." },
  { stepIndex: 4,  text: "Inside addLeft: node two is not a leaf — it has children — so we add it and recurse into node four. Output: one, two." },
  { stepIndex: 5,  text: "addLeft recurses again. Node four is not a leaf either — add it and recurse into node eight. Output: one, two, four." },
  { stepIndex: 6,  text: "addLeft reaches node eight. Node eight IS a leaf — both children are null — so the base case fires and we return without adding. Leaves are handled separately by addLeaves." },
  { stepIndex: 7,  text: "Now call addLeaves. It performs a full DFS and collects every leaf node in the tree." },
  { stepIndex: 8,  text: "Node eight — no children, it's a leaf. Add it. Output: one, two, four, eight." },
  { stepIndex: 9,  text: "Node nine — also a leaf under node four. Add it. Output: one, two, four, eight, nine." },
  { stepIndex: 10, text: "Node five has a child — node ten — so it is NOT a leaf. addLeaves recurses through node five without collecting it." },
  { stepIndex: 11, text: "Node ten IS a leaf. Add it. Node five was visited but never collected — that's exactly why it's excluded from the boundary. Output: one, two, four, eight, nine, ten." },
  { stepIndex: 12, text: "DFS moves to node three's subtree. Node six is a leaf. Add it. Output: one, two, four, eight, nine, ten, six." },
  { stepIndex: 13, text: "Node seven — leaf. Add it. addLeaves is complete. Output: one, two, four, eight, nine, ten, six, seven." },
  { stepIndex: 14, text: "Call addRight on the root's right child — node three. addRight recurses deeper first, before adding anything. It goes to node seven, which is a leaf, and returns immediately." },
  { stepIndex: 15, text: "Back in addRight for node three: the recursive call already returned, so NOW we add node three. Adding AFTER the recursion gives bottom-up order automatically — no explicit stack needed. Output: one, two, four, eight, nine, ten, six, seven, three." },
  { stepIndex: 16, text: "Nine boundary nodes in correct order. Node five was the only interior node — correctly excluded by all three helpers. Time and space: both O of n. Follow for more tree algorithms!" },
];

const towerOfHanoiLines = [
  { stepIndex: 0,  text: "Tower of Hanoi. Four disks on peg A, biggest at the bottom. The goal — move all four to peg C, using B as a helper. The only rule: a bigger disk can never sit on top of a smaller one." },
  { stepIndex: 1,  text: "The function is recursive. If n equals zero, there is nothing to move — that is the base case. Just return." },
  { stepIndex: 2,  text: "Before moving disk n, we clear the path. Recursively move n minus one disks from src to via, with dst as the helper. This exposes the biggest disk." },
  { stepIndex: 3,  text: "Move one. Disk one goes from A to B." },
  { stepIndex: 4,  text: "Move two. Disk two goes from A to C." },
  { stepIndex: 5,  text: "Move three. Disk one goes from B to C." },
  { stepIndex: 6,  text: "Move four. Disk three goes from A to B." },
  { stepIndex: 7,  text: "Move five. Disk one goes from C to A." },
  { stepIndex: 8,  text: "Move six. Disk two goes from C to B." },
  { stepIndex: 9,  text: "Move seven. Disk one goes from A to B. The top three disks are now stacked on B, clearing the path for the biggest." },
  { stepIndex: 10, text: "Move eight. Disk four — the heaviest — crosses all the way from A to C." },
  { stepIndex: 11, text: "Move nine. Disk one goes from B to C." },
  { stepIndex: 12, text: "Move ten. Disk two goes from B to A." },
  { stepIndex: 13, text: "Move eleven. Disk one goes from C to A." },
  { stepIndex: 14, text: "Move twelve. Disk three goes from B to C." },
  { stepIndex: 15, text: "Move thirteen. Disk one goes from A to B." },
  { stepIndex: 16, text: "Move fourteen. Disk two goes from A to C." },
  { stepIndex: 17, text: "Move fifteen. Disk one goes from B to C. All four disks on peg C — solved!" },
  { stepIndex: 18, text: "Four disks needed exactly fifteen moves. The pattern is two to the power n, minus one. Time complexity O of two to the n — exponential. Space is O of n for the call stack. Follow for more algorithm breakdowns!" },
];

const diagonalLines = [
  { stepIndex: 0,  text: "Here's what we're building. Take this tree and group every node by diagonal — nodes reachable from each other by only moving right end up in the same group. This tree gives three groups: one, three, six on the first diagonal; two, five, eight on the second; four, seven on the third. By the end of this video, you'll code this in O of n." },
  { stepIndex: 1,  text: "Look at this tree. Every node you reach by only moving right belongs to the same diagonal. The second you go left, you drop to the next one. That's the entire algorithm — remember that, because at the end I'll show you why this same rule solves vertical order traversal too." },
  { stepIndex: 2,  text: "Null root, empty result. One-line guard — if you've written any tree problem before, this is automatic." },
  { stepIndex: 3,  text: "Initialize result and a queue, then seed the queue with node one. This queue is not for level-order traversal — it tracks the starting node of each new diagonal." },
  { stepIndex: 4,  text: "Outer while loop — one iteration per diagonal. Here's what trips most people up: this is not BFS. Level-order processes row by row. This processes diagonal by diagonal. Same queue structure, completely different purpose." },
  { stepIndex: 5,  text: "Top of each pass — row for this diagonal's output, nextQ to collect every left child we encounter. Left children are the entry points of future diagonals. We bank them now, process them later. If this is already clearer than other explanations, this is what I post every week." },
  { stepIndex: 6,  text: "Poll node one. Enter the right-chain while loop. Add one to the row. Node one has a left child — two — and left means new diagonal, so two banks into nextQ. We don't follow it yet. We follow the right pointer instead." },
  { stepIndex: 7,  text: "Right to node three. Moving right keeps us on diagonal zero — the rule holds. Three has no left child, so nextQ is untouched. Row is now one, three." },
  { stepIndex: 8,  text: "Right of three leads to six. Add six. No children at all — right of six is null, the inner while exits. Diagonal zero is done: one, three, six. Now watch how the handoff works." },
  { stepIndex: 9,  text: "Row gets added to result. Queue absorbs nextQ — which held just node two. Two becomes the starting node of diagonal one. That's the handoff: every left child collected during the right-chain seeds the next diagonal's traversal." },
  { stepIndex: 10, text: "Outer loop fires again — queue has two. Poll it and enter the exact same right-chain logic. New diagonal, identical pattern." },
  { stepIndex: 11, text: "Add two, then five, then eight — following right pointers. Left children four and seven bank into nextQ along the way. Diagonal one: two, five, eight. Same right-chain logic, different diagonal." },
  { stepIndex: 12, text: "Queue absorbs nextQ: four and seven. Here's the part that confused me the first time — four arrives before seven because we added it to nextQ first, from node two's left child, before we even reached node five. BFS insertion order, not tree depth. For a completely right-skewed tree, how many diagonals would you get? Drop it below." },
  { stepIndex: 13, text: "Diagonal two. Poll four — no right child, chain ends immediately. Just four." },
  { stepIndex: 14, text: "Poll seven. Also no right child. Add seven. Queue empty — outer loop exits. Diagonal two: four, seven." },
  { stepIndex: 15, text: "Return the result. Three diagonals — exactly what the mental model predicted before we touched a single line of code." },
  { stepIndex: 16, text: "Every right move stayed on a diagonal. Every left move opened the next one. The code never broke that rule once — it just made it mechanical. That's what good algorithms do." },
  { stepIndex: 17, text: "Time: O of n — every node visited exactly once. Space: O of n for queue and output. Here's the callback from the start: vertical order traversal uses this exact same right-stays, left-shifts model, just with column indices instead of diagonal indices. Subscribe so you catch that one — it's the next video." },
];

const rtlDiagonalLines = [
  { stepIndex: 0,  text: "Let's look at right-to-left diagonal traversal — the mirror of what we saw before. Three diagonals: one, two, four — three, five, seven — and six, eight." },
  { stepIndex: 1,  text: "In left-to-right diagonal, going right kept you on the same diagonal. Here it's flipped — going left keeps you on the diagonal, going right moves you to the next one." },
  { stepIndex: 2,  text: "Null root returns an empty list. Same guard as always." },
  { stepIndex: 3,  text: "Initialize result and a queue. Seed with root — node one. The queue tracks the entry node of each diagonal." },
  { stepIndex: 4,  text: "Outer while loop: queue not empty means more diagonals remain." },
  { stepIndex: 5,  text: "Start each diagonal with a fresh row and an empty nextQ. Row collects output; nextQ collects right children — the entry nodes for the next diagonal." },
  { stepIndex: 6,  text: "Poll node one. Enter the left-chain while loop. Add one to row. Right child three goes to nextQ — it starts the next diagonal." },
  { stepIndex: 7,  text: "Move left to node two. Left movement keeps us on diagonal zero." },
  { stepIndex: 8,  text: "Add two to row. Right child five goes to nextQ. Move left to four." },
  { stepIndex: 9,  text: "Add four. No right child. Left is null — inner while exits. Diagonal zero: one, two, four." },
  { stepIndex: 10, text: "Push row to result. Refill queue from nextQ — now three and five, entry nodes of diagonal one." },
  { stepIndex: 11, text: "Diagonal one begins. Poll node three." },
  { stepIndex: 12, text: "Add three. Right child six goes to nextQ. No left child — done with three. Poll five." },
  { stepIndex: 13, text: "Add five. Right child eight to nextQ. Move left to seven. Add seven. No right, no left — inner while exits. Diagonal one: three, five, seven." },
  { stepIndex: 14, text: "Push to result. Queue refills with six and eight — entry nodes of diagonal two." },
  { stepIndex: 15, text: "Diagonal two: poll six, no left. Poll eight, no left. Diagonal two: six, eight. Queue empty — outer loop exits." },
  { stepIndex: 16, text: "Return the result. Diagonal zero: one, two, four. One: three, five, seven. Two: six, eight." },
  { stepIndex: 17, text: "Time O of n — every node visited exactly once. Space O of n. The only change from left-to-right diagonal: swap left and right in the inner loop. Subscribe for more tree patterns." },
];

const allNarrations = [
  { sceneId: "insert-head", lines: insertHeadLines },
  { sceneId: "insert-tail", lines: insertTailLines },
  { sceneId: "delete-node", lines: deleteNodeLines },
  { sceneId: "remove-nth-from-end", lines: removeNthLines },
  { sceneId: "reverse", lines: reverseLines },
  { sceneId: "detect-cycle", lines: detectCycleLines },
  { sceneId: "merge-lists", lines: mergeListsLines },
  { sceneId: "tls-handshake", lines: tlsHandshakeLines },
  { sceneId: "bst-insert", lines: bstInsertLines },
  { sceneId: "tower-of-hanoi", lines: towerOfHanoiLines },
  { sceneId: "level-order", lines: levelOrderLines },
  { sceneId: "right-view", lines: rightViewLines },
  { sceneId: "boundary", lines: boundaryLines },
  { sceneId: "diagonal-traversal", lines: diagonalLines },
  { sceneId: "diagonal-rl", lines: rtlDiagonalLines },
];

function getAudioDuration(filePath) {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf-8" },
    );
    return parseFloat(result.trim());
  } catch {
    return 3;
  }
}

function generateWithEdgeTts(text, outputPath, voice, rate) {
  const escaped = text.replace(/"/g, '\\"');
  execSync(
    `edge-tts --voice "${voice}" --rate="${rate}" --text "${escaped}" --write-media "${outputPath}"`,
    { encoding: "utf-8", stdio: "pipe" },
  );
}

function main() {
  const filterScene = process.argv[2];

  const scenes = filterScene
    ? allNarrations.filter((n) => n.sceneId === filterScene)
    : allNarrations;

  if (scenes.length === 0) {
    console.error(`Unknown scene: ${filterScene}`);
    console.error(`Available: ${allNarrations.map((n) => n.sceneId).join(", ")}`);
    process.exit(1);
  }

  console.log("Generating narration audio files...\n");

  for (const narration of scenes) {
    const outDir = path.join("public", "narration", narration.sceneId);
    fs.mkdirSync(outDir, { recursive: true });

    console.log(`Scene: ${narration.sceneId}`);
    console.log(`Voice: ${VOICE}`);
    console.log("=".repeat(40));

    const durations = [];

    for (const line of narration.lines) {
      const outputPath = path.join(outDir, `step-${line.stepIndex}.mp3`);
      const rate = line.rate || DEFAULT_RATE;
      const shortText = line.text.length > 60 ? line.text.slice(0, 60) + "..." : line.text;

      console.log(`  Step ${line.stepIndex} [rate=${rate}]: "${shortText}"`);

      generateWithEdgeTts(line.text, outputPath, VOICE, rate);

      const duration = getAudioDuration(outputPath);
      const frames = Math.ceil(duration * 30);
      durations.push({ step: line.stepIndex, duration, frames });

      console.log(`    -> ${outputPath} (${duration.toFixed(2)}s, ${frames} frames)`);
    }

    console.log(`\nDuration summary for ${narration.sceneId}:`);
    let totalFrames = 0;
    for (const d of durations) {
      console.log(`  Step ${d.step}: ${d.duration.toFixed(2)}s (${d.frames} frames)`);
      totalFrames += d.frames;
    }
    console.log(`  Total audio: ${totalFrames} frames (${(totalFrames / 30).toFixed(1)}s)`);

    const durationsPath = path.join(outDir, "durations.json");
    fs.writeFileSync(durationsPath, JSON.stringify(durations, null, 2));
    console.log(`  Saved durations to ${durationsPath}\n`);

    // Print startFrame suggestions (each step = prev startFrame + prev frames + 10 buffer)
    console.log("Suggested startFrame values:");
    let sf = 0;
    for (let i = 0; i < durations.length; i++) {
      console.log(`  Step ${durations[i].step}: startFrame: ${sf}`);
      sf += durations[i].frames + 10;
    }
    console.log(`  Total scene frames: ${sf}\n`);
  }

  console.log("Done!");
}

main();
