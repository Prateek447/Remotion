---
name: design-expert
description: Apply professional visual design principles to educational explainer videos in Remotion. Covers dynamic layout for variable node counts, pointer stacking, arrow design, typography hierarchy, color contrast, and spacing for data structure and algorithm visualizations. Use when designing components for Remotion video projects, creating data structure diagrams, or whenever video output has layout issues.
---

# Design Expert for Educational Videos

Design for **a viewer watching a video**, not a developer reading a screen. Everything must be legible at 1080p playback, often on a phone or embedded player.

## Cardinal Rule: Dynamic Layout

Never use fixed spacing that assumes a specific node count. The diagram area is only **55% of 1920px = 1056px**. Node count varies from 3 to 8+ across different scenes. **The layout must adapt.**

### Dynamic Gap Calculation

```ts
const usable = areaWidth - padding * 2;
const gap = Math.min(maxGap, Math.max(minGap, usable / (totalSlots - 1)));
```

- `maxGap`: 180px -- prevents nodes from being too spread out with few nodes
- `minGap`: nodeWidth + 24px -- ensures arrows always have visible shaft
- `totalSlots`: includes null terminator only when ≤5 real nodes
- Center the entire chain horizontally in the diagram area

### Conditional Null Terminator

- Show null terminator when **≤5 nodes** (there's room)
- Hide it when **>5 nodes** (save space, it's implied)
- Null terminator uses a smaller dashed-border box with "null" text at ~50% opacity

---

## Node Sizing

Nodes should be **proportional and compact**, not oversized. Oversized nodes eat space and cause overflow.

| Property | Value | Rationale |
|---|---|---|
| nodeWidth | 100px | Fits 8 nodes in 1056px area with arrows between |
| nodeHeight | 54px | ~0.54 ratio, visually balanced |
| Border radius | 10px | Modern without being circular |
| Value font | 16-26px (adaptive) | `Math.max(16, Math.min(26, h * 0.44))` |
| Border | 1px solid #333 | Visible separation from black canvas |
| Shadow | `0 4px 16px rgba(0,0,0,0.35)` | Subtle depth without dominating |

### Two-Part Node Design

```
┌──────────┬────┐
│  value   │  → │
└──────────┴────┘
   70%       30%
```

- Value section: 70% width, bold monospace, centered
- Pointer section: 30% width, small arrow icon, slightly darker bg
- The internal arrow icon scales with node size: `Math.max(12, w * 0.12)`

### Highlighted vs Default

- **Default**: `#222` bg, `#e8e8e8` text, `#333` border, 65% opacity (dimmed)
- **Highlighted**: colored bg (blue/green/red/purple), `#000` text, colored glow, 100% opacity
- Emphasis pulse: single-fire scale from 1→1.06→1.01, not looping

---

## Arrows (Directed Edges)

### Open V-Shape Arrowhead (Not Filled Polygon)

Use `<polyline>` with `strokeLinecap="round"` and `strokeLinejoin="round"`, **not** a filled `<polygon>`. This produces a cleaner, more modern look:

```tsx
<polyline
  points={`${wing1X},${wing1Y} ${tipX},${tipY} ${wing2X},${wing2Y}`}
  fill="none"
  stroke={color}
  strokeWidth={2.5}
  strokeLinecap="round"
  strokeLinejoin="round"
/>
```

| Property | Value |
|---|---|
| Stroke width | 2.5px |
| Color (default) | `#555` -- visible on black |
| Color (active) | `#89b4fa` |
| Arrowhead length | 10px |
| Arrowhead spread | 6px |
| Dashed pattern | `6 4` |
| Draw-on animation | `strokeDashoffset` spring |
| Head fade-in | opacity 0→1 at 60-100% of draw progress |

### Arrow Length

The arrow shaft (from end of source node to start of target node) should always be **≥24px** visible. If the dynamic gap calculation produces a smaller shaft, it means nodes are too close -- reduce node width or reconsider the data.

---

## Pointer Labels & Stacking

### The Overlap Problem

When multiple pointers (e.g., "prev", "curr", "next") target the **same node**, they all render at the same x,y. This makes them invisible.

### Solution: Vertical Stacking

Group pointers by `targetNodeId`. Assign a `stackIndex` (0, 1, 2...) to each pointer targeting the same node:

```ts
function computePointerStacks(pointers: PointerData[]): Map<string, number> {
  const stacks = new Map<string, number>();
  const targetCounts = new Map<string | null, number>();
  for (const ptr of pointers) {
    if (!ptr.targetNodeId) continue;
    const count = targetCounts.get(ptr.targetNodeId) || 0;
    stacks.set(ptr.label, count);
    targetCounts.set(ptr.targetNodeId, count + 1);
  }
  return stacks;
}
```

- `stackIndex=0`: closest to node, shows a small triangle pointing down
- `stackIndex>0`: offset further above by `stackIndex * 34px`, with a dashed vertical line connecting to the node
- Base offset from node top: 36px

### Pointer Style

| Property | Value |
|---|---|
| Font size | 14px mono, bold |
| Background | `#0a0a0a` |
| Padding | `3px 10px` |
| Border radius | 6px |
| Border | `1px solid {color}40` |
| Glow | `0 0 10px {color}20` |

---

## Typography Hierarchy

### Code Panel

| Element | Size | Notes |
|---|---|---|
| Code text | 24px mono | Full contrast on highlighted lines |
| Line numbers | 22px | 15-50% opacity (brighter when highlighted) |
| Line height | 1.75 | Comfortable reading |
| Padding | 40px | Inner padding within code editor |

### Diagram Panel

| Element | Size | Notes |
|---|---|---|
| Node values | 16-26px adaptive | `Math.max(16, Math.min(26, h * 0.44))` |
| Pointer labels | 14px mono bold | Colored to match pointer |
| Caption | 20px sans | Bottom of diagram, 40px from edge |

### Title Cards

| Element | Size |
|---|---|
| Title | 84px, weight 800, letter-spacing -1.5px |
| Complexity badge | 30px mono, pill shape |
| Subtitle | 26px, lower contrast |

---

## Color & Contrast on Black

On pure black, low-contrast elements vanish after video compression.

| Element | Minimum Color |
|---|---|
| Default node bg | `#222` (not `#1a1a1a`) |
| Node border | `#333` |
| Arrows | `#555` |
| Null terminator | `#555` at 45% opacity |
| Code editor bg | `#0c0c0c` |
| Highlight bar | `rgba(137,180,250,0.10)` |
| Dimmed code lines | 30% opacity |

---

## Layout Composition

### Split Layout (55/45)

- Diagram: 55% width, with `overflow: hidden`
- Code: 45% width, with 16px outer padding
- Divider: 1px `#282828` line
- Both panels have black background

### Diagram Space Budget

For a 1056px-wide diagram area with 50px padding on each side:

| Nodes | Slots (with null) | Gap (center-to-center) | Arrow shaft |
|---|---|---|---|
| 3 | 4 | 180px (capped) | 80px |
| 4 | 5 | 180px (capped) | 80px |
| 5 | 6 | 180px (capped) | 80px |
| 6 | 6 (no null) | 180px (capped) | 80px |
| 7 | 7 (no null) | ~159px | 59px |
| 8 | 8 (no null) | ~136px | 36px |

---

## Anti-Patterns

| Don't | Do Instead |
|---|---|
| Fixed `nodeGap` for all scenes | Dynamic gap based on node count |
| Same pointer y for all | Stack pointers vertically when overlapping |
| Oversized nodes (160x80) | Compact nodes (100x54) that scale to any count |
| Filled polygon arrowhead | Open V-shape `<polyline>` arrowhead |
| Thick arrow stroke (3.5+px) | Clean 2.5px stroke |
| Always show null terminator | Conditional: only when ≤5 nodes |
| Nodes overflowing into code panel | `overflow: hidden` + dynamic layout |
| All pointers at same z-index | `zIndex: 10 + stackIndex` |

---

## Checklist

- [ ] Dynamic gap calculation: nodes fit within 55% of canvas width
- [ ] Null terminator shown only when ≤5 nodes
- [ ] Multiple pointers on same node are vertically stacked
- [ ] Arrow shaft is ≥24px long between any two adjacent nodes
- [ ] Open V-shape arrowhead (not filled triangle)
- [ ] Node size is ≤100x54 to handle 8+ nodes
- [ ] Highlighted nodes at full opacity, others dimmed to 65%
- [ ] Code text at 24px with 1.75 line height
- [ ] Caption at 20px, 40px from bottom edge
- [ ] Pointer labels readable and non-overlapping
