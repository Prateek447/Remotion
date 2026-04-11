---
name: dsa-visualizer
description: Visual patterns and component architectures for animating any data structure in Remotion -- arrays, stacks, queues, trees, graphs, hash maps, heaps, and tries. Covers layout algorithms, node shapes, edge routing, and how to represent operations visually. Use when creating a new video for a data structure beyond linked lists.
---

# DSA Visualizer Patterns

Each data structure has a natural visual representation. This skill defines the **layout, components, and animation patterns** for each.

## Universal Principles

These apply to ALL data structures:

1. **One canonical shape per structure**: Arrays are rows, trees are hierarchies, graphs are force-directed. Don't fight the natural layout.
2. **Index/key labels are always visible**: The viewer needs to see positions, not guess them.
3. **Operations animate ONE cell/node at a time**: Bulk changes confuse. Animate sequentially with staggered delays.
4. **Color semantics are consistent across structures**:
   - Blue (`#89b4fa`): currently active/being processed
   - Green (`#a6e3a1`): found/success/sorted
   - Red (`#f38ba8`): removing/error/comparison failure
   - Purple (`#cba6f7`): newly inserted
   - Default (`#222`): inactive

---

## Array / List

### Layout
Horizontal row of equal-width cells, left-aligned or centered.

```
┌────┬────┬────┬────┬────┐
│ 10 │ 20 │ 30 │ 40 │ 50 │
└────┴────┴────┴────┴────┘
  0    1    2    3    4     <- index labels below
```

### Component: `ArrayCell`
- Fixed width per cell: `min(100, (areaWidth - padding * 2) / n)` -- adaptive like linked list nodes
- Height: 56-64px
- Index label below each cell: 14px mono, dimmed
- No gap between cells (shared borders), 1px divider lines
- Highlighted cell: colored background, white text

### Operations to Animate
| Operation | Visual |
|---|---|
| Access `arr[i]` | Highlight cell i (blue) |
| Insert at index | Slide cells right from index, new cell drops in (purple) |
| Delete at index | Cell fades out (red), remaining cells slide left |
| Swap | Two cells physically swap positions with crossover animation |
| Sort pass | Sequential highlighting with swap animations |
| Binary search | Highlight left/mid/right pointers, shrink search range |

### Pointers for Arrays
Use bracket-style pointers below the array:
```
  [ left        mid        right ]
```
Or arrow pointers above cells (same as linked list pointers).

---

## Stack

### Layout
Vertical column, bottom-aligned (stack grows upward).

```
     ┌────┐
     │ 30 │  <- top
     ├────┤
     │ 20 │
     ├────┤
     │ 10 │
     └────┘
```

### Component: `StackCell`
- Same as ArrayCell but stacked vertically
- "top" pointer label on the right side of the topmost cell
- Push: new cell slides down from above with spring
- Pop: top cell slides up and fades out

### Width
Fixed at 120-160px (stack is narrow), centered in diagram area.

---

## Queue

### Layout
Horizontal row like array, but with `front` and `rear` pointers.

```
  front                    rear
    ↓                        ↓
┌────┬────┬────┬────┬────┐
│ 10 │ 20 │ 30 │ 40 │ 50 │
└────┴────┴────┴────┴────┘
```

### Operations
| Operation | Visual |
|---|---|
| Enqueue | New cell appears at rear (right side), slides in |
| Dequeue | Front cell slides out left and fades, front pointer advances |
| Peek | Front cell highlights (blue) |

For **circular queue**: arrange cells in a circle/ring layout with head/tail arcs.

---

## Binary Tree

### Layout
Hierarchical, top-down. Each level doubles in width.

```
           [8]
         /     \
       [4]     [12]
      /   \    /  \
    [2]  [6] [10] [14]
```

### Layout Algorithm
```ts
function getTreeNodePosition(depth: number, index: number, totalWidth: number) {
  const levelWidth = totalWidth / Math.pow(2, depth);
  const x = levelWidth * (index + 0.5);
  const y = depth * verticalSpacing + padding;
  return { x, y };
}
```

### Component: `TreeNode`
- **Circular** (not rectangular): 48-56px diameter, centered value
- Edges: lines from parent center-bottom to child center-top
- BST coloring: left subtree can have subtle tint vs right subtree

### Sizing
- Vertical spacing between levels: 90-110px
- Tree with depth 4 needs ~440px height, fits in 1080 with padding
- Max practical depth at 1080p: 5 levels (32 leaf nodes)

### Operations
| Operation | Visual |
|---|---|
| Search | Highlight path from root, green when found |
| Insert | Search path (blue), then new node drops in (purple) at leaf |
| Delete | Node turns red, replacement node slides into position |
| Rotation (AVL/RB) | Animated node position swap with edge redraw |
| Traversal | Sequential node highlighting in traversal order |

### Traversal Order Visualization
Show a numbered badge on each node indicating visit order:
- In-order: left-root-right
- Pre-order: root-left-right
- Post-order: left-right-root

---

## Graph

### Layout
Force-directed or manual positioning. Nodes can be anywhere.

### Component: `GraphNode`
- Circular, 48-56px diameter (same as tree nodes for consistency)
- Edges: lines or curves between node centers
- Directed edges: arrowhead at target
- Weighted edges: label on the midpoint of the edge
- Self-loops: small circle arc from node back to itself

### Layout Strategies
1. **Manual**: for small graphs (<=8 nodes), hand-place x,y coordinates in the scene data
2. **Grid**: arrange in rows/columns for adjacency matrix visualizations
3. **Circular**: nodes arranged in a circle, edges cross the interior
4. **Layered**: for DAGs, like tree but allowing multiple parents

### Operations
| Operation | Visual |
|---|---|
| BFS | Highlight level by level (concentric waves) |
| DFS | Highlight path, backtrack animation |
| Dijkstra | Expanding frontier with distance labels |
| Topological sort | Nodes fade into sorted order on a separate row |

### Edge Labels
For weighted graphs, show weight on the edge midpoint:
- 14px mono, background pill for readability
- Update dynamically for algorithms like Dijkstra (show relaxed distances)

---

## Hash Map

### Layout
Two-column view: left shows the hash table (array of buckets), right shows the key-value being processed.

```
  Bucket    Chain
  [0]  -->  (k1,v1) -> (k4,v4) -> null
  [1]  -->  null
  [2]  -->  (k2,v2) -> null
  [3]  -->  (k3,v3) -> null
```

### Components
- `HashBucket`: array cell with bucket index, linked to a chain of nodes
- `HashEntry`: linked-list-style node showing `key: value`
- Hash function visualization: show `hash(key) % size = index` above the table

### Operations
| Operation | Visual |
|---|---|
| Put | Hash computation animation, then insert into bucket chain |
| Get | Hash computation, traverse chain, highlight match (green) |
| Remove | Hash computation, traverse chain, remove node (red) |
| Resize | All entries scatter and re-hash into new larger table |

---

## Heap (Priority Queue)

### Layout
**Dual representation**: tree view (top) + array view (bottom), synchronized.

```
        [1]           Tree view
       /   \
     [3]   [2]
    / \
  [5] [4]

  [1] [3] [2] [5] [4]   Array view
   0   1   2   3   4
```

### Operations
| Operation | Visual |
|---|---|
| Insert | Add to end of array, bubble-up in tree (swap animation) |
| Extract min/max | Remove root, move last to root, sift-down |
| Heapify | Bottom-up sift-down for each non-leaf |

Animate both representations simultaneously: when nodes swap in the tree, the corresponding array cells also swap.

---

## Trie (Prefix Tree)

### Layout
Tree-like but edges are labeled with characters, not nodes.

```
        (root)
       /   |   \
      a    b    c
     /     |
    p      a
   / \     |
  p   i    t  <- "bat"
  |   |
  l   r  <- "apple", "air"
  |
  e  <- "apple"
```

### Components
- Nodes are small circles (36px) -- they represent states, not values
- Edge labels: single character on each edge, 16px mono
- Word-terminal nodes: filled/highlighted to indicate a complete word
- Path highlighting: color the edges forming the search path

---

## Reusable Patterns Across All Structures

### Pointer/Cursor Animation
All structures need movable pointers. Reuse the `Pointer` component pattern:
- Name label above (or beside for vertical structures)
- Colored to match the pointer semantics
- Spring-animated position changes
- Stack when multiple pointers target the same element

### Step Transition Pattern
All structures use the same `SceneStep` + `useStepTransition` pattern:
- Define snapshots with element states
- Interpolate positions and highlights between steps
- Dim inactive elements, emphasize active ones

### Adaptive Sizing
All structures must fit within the diagram area (55% of 1920 = 1056px wide, 1080px tall):
- Calculate element size based on count: `size = min(maxSize, available / count)`
- Never let elements overflow -- reduce count in the example instead

---

## Checklist for New Data Structure

- [ ] Define node/cell component with highlight states
- [ ] Define layout algorithm (how to compute x,y for each element)
- [ ] Adaptive sizing: works for 3 to 15+ elements
- [ ] All standard operations have defined animation patterns
- [ ] Color semantics match the universal palette
- [ ] Pointer labels are stackable and readable
- [ ] Works within 1056x1080 diagram area at 1080p
