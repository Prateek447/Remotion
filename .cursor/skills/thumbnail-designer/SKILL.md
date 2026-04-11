---
name: thumbnail-designer
description: Design eye-catching YouTube thumbnails and Instagram cover images for code explanation videos using Remotion. Covers composition rules, text overlay, branding, color psychology, and programmatic thumbnail generation. Use when creating thumbnails, cover images, or any static preview frames for video content.
---

# Thumbnail Designer for Code Videos

Thumbnails drive 50%+ of YouTube click-through rate. A great thumbnail communicates the video topic in under 1 second.

## YouTube Thumbnail Specifications

| Property | Value |
|---|---|
| Resolution | 1280x720 (minimum) |
| Recommended | 1920x1080 |
| Aspect ratio | 16:9 |
| Max file size | 2MB |
| Format | JPG, PNG |

---

## Anatomy of a High-CTR Thumbnail

```
┌──────────────────────────────────┐
│                                  │
│   [DATA STRUCTURE]    [DIAGRAM]  │
│   [VISUAL]            [PREVIEW]  │
│                                  │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│   BIG TEXT OVERLAY               │
│   (2-4 words max)               │
│                                  │
│              [Complexity Badge]  │
└──────────────────────────────────┘
```

### The Three Elements

1. **Visual hook** (left/center): a diagram or code snippet that's recognizable at small size
2. **Text overlay** (large, bold): 2-4 words describing the content
3. **Accent element** (badge, arrow, emoji): draws the eye to the key point

---

## Text Overlay Rules

### Font & Size

- **Primary text**: 72-120px, weight 800-900, sans-serif
- **Font**: Inter Black, Montserrat Black, or Poppins Bold
- **Max 4 words**: "LINKED LIST REVERSE" not "How to Reverse a Linked List in Java"
- **ALL CAPS or Title Case**: both work, pick one and be consistent

### Text Contrast

On dark backgrounds, use **white text with a dark shadow or stroke**:

```css
color: white;
text-shadow: 0 4px 20px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9);
```

Or use a **semi-transparent dark bar** behind the text:

```css
background: linear-gradient(transparent, rgba(0,0,0,0.7));
```

### Text Placement

- **Bottom third**: safest area, doesn't conflict with diagram
- **Left-aligned**: reads naturally, leaves room for diagram on right
- **Never center vertically**: looks generic and boring
- **Avoid top-right corner**: YouTube places duration overlay there

---

## Generating Thumbnails in Remotion

Create a dedicated `Thumbnail` composition:

```tsx
<Composition
  id="Thumbnail"
  component={ThumbnailComponent}
  width={1920}
  height={1080}
  fps={1}
  durationInFrames={1}
  defaultProps={{ title: "LINKED LIST", operation: "REVERSE" }}
/>
```

Render as a still image:

```bash
npx remotion still src/index.ts Thumbnail --output out/thumbnail.png \
  --props '{"title":"LINKED LIST","operation":"REVERSE"}'
```

### Thumbnail Component Pattern

```tsx
const ThumbnailComponent: React.FC<{ title: string; operation: string }> = ({
  title, operation
}) => (
  <AbsoluteFill style={{ background: "#000" }}>
    {/* Diagram preview (frozen at an interesting frame) */}
    <div style={{ position: "absolute", right: 40, top: 60 }}>
      <FrozenDiagram />
    </div>

    {/* Big text overlay */}
    <div style={{
      position: "absolute", bottom: 80, left: 60,
      fontFamily: "'Inter', sans-serif", fontWeight: 900,
    }}>
      <div style={{ fontSize: 96, color: "#fff", textShadow: "..." }}>
        {title}
      </div>
      <div style={{ fontSize: 72, color: "#89b4fa" }}>
        {operation}
      </div>
    </div>

    {/* Complexity badge */}
    <div style={{
      position: "absolute", bottom: 80, right: 60,
      fontSize: 36, color: "#a6e3a1", background: "#a6e3a120",
      padding: "8px 24px", borderRadius: 50,
    }}>
      O(n)
    </div>
  </AbsoluteFill>
);
```

---

## Color Psychology for Thumbnails

| Color | Emotion | Use For |
|---|---|---|
| Blue (`#89b4fa`) | Trust, technical | Data structures, algorithms |
| Green (`#a6e3a1`) | Success, easy | Beginner topics, "solved" |
| Red (`#f38ba8`) | Urgency, important | "Don't make this mistake", edge cases |
| Purple (`#cba6f7`) | Creative, advanced | Advanced topics, unique approaches |
| Yellow (`#f9e2af`) | Attention, warning | Performance tips, gotchas |

Use the **same accent color** in both the thumbnail and the video title card for visual consistency.

---

## Branding Consistency

### Channel Identity Elements

Define once, use everywhere:

```ts
const brand = {
  font: "'Inter', sans-serif",
  accentColor: "#89b4fa",
  bgGradient: "radial-gradient(ellipse at 30% 70%, #0a0a2e 0%, #000 70%)",
  cornerRadius: 16,
  logoPosition: { top: 30, left: 30 },
};
```

### Series Theming

Each video series should have a consistent visual pattern:
- **Linked List series**: blue accent, node chain in thumbnail
- **Tree series**: green accent, tree diagram in thumbnail
- **Graph series**: purple accent, network diagram in thumbnail
- **Array series**: yellow accent, cell row in thumbnail

This creates visual grouping in the channel page.

---

## Instagram Cover Images

### Reel Cover (9:16)

```
┌─────────────┐
│             │
│  [DIAGRAM]  │
│             │
│             │
│ ━━━━━━━━━━ │
│ BIG TEXT    │
│ 2-3 WORDS  │
│             │
└─────────────┘
```

- Resolution: 1080x1920
- Text must be readable in the tiny grid preview (very large font)
- Keep diagram simple -- just 3-4 nodes max

### Feed Post Cover (1:1)

- Resolution: 1080x1080
- Similar layout but square
- Text even larger (120px+) since grid thumbnails are very small

---

## Thumbnail Variations

Generate 2-3 variants per video to A/B test:

1. **Diagram-focused**: prominent diagram, small text
2. **Text-focused**: huge text, subtle diagram background
3. **Code-focused**: syntax-highlighted code snippet as the visual hook

```bash
# Generate all three
npx remotion still src/index.ts Thumbnail --output out/thumb-diagram.png \
  --props '{"variant":"diagram","title":"REVERSE"}'
npx remotion still src/index.ts Thumbnail --output out/thumb-text.png \
  --props '{"variant":"text","title":"REVERSE"}'
npx remotion still src/index.ts Thumbnail --output out/thumb-code.png \
  --props '{"variant":"code","title":"REVERSE"}'
```

---

## Anti-Patterns

| Don't | Do Instead |
|---|---|
| More than 4 words of text | 2-3 punchy words |
| Small text (<60px) | Large text (72-120px) |
| Cluttered diagram with 8+ nodes | Simple 3-4 node preview |
| Generic stock-photo backgrounds | Dark gradient matching video theme |
| Inconsistent fonts between videos | Same brand font everywhere |
| Text in top-right corner | Bottom-left or bottom-center |
| Low contrast text on busy background | Text shadow or dark overlay bar |
| Different style per video | Consistent series theming |

---

## Checklist

- [ ] 1920x1080 or 1280x720 resolution
- [ ] 2-4 words of text, readable at thumbnail size
- [ ] Visual diagram element from the video
- [ ] Accent color matches video content
- [ ] No text in top-right (YouTube duration badge area)
- [ ] File size under 2MB
- [ ] Looks good at both full size and tiny grid preview
- [ ] Consistent with channel branding
- [ ] Generated programmatically via Remotion `still` command
