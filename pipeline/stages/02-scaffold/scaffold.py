#!/usr/bin/env python3
"""Stage 2: scaffold a Remotion scene .tsx from a scene.yaml.

Usage:
    python3 pipeline/stages/02-scaffold/scaffold.py <scene.yaml> [--out-dir src/scenes/] [--dry-run]

Reads a scene document conforming to pipeline/design-system/scene-schema.yaml and
writes src/scenes/<TitleCase>.tsx using the template for the (dataStructure,
operationKind) combination.

Also prints (to stdout) the paste snippets needed for:
  - src/data/code-snippets.ts          (the code constant)
  - src/standalone/index.tsx           (standalone + reel video exports)
  - src/Root.tsx                       (Scenes / Standalone / Reels registrations)
  - scripts/apply-narration-updates.py (SCENES dict entry)

The scaffolder does NOT modify those files; the user pastes them manually for
safety (Root.tsx in particular is fragile to automated edits).

Supported combinations:
    (linked-list, mutation)   → InsertHead-style template
    (linked-list, algorithm)  → Reverse-style template
    (tree,        mutation)   → BSTInsert-style template
    (tree,        traversal)  → LeftViewTraversal-style template

For any other combo, exits 1 with a clear message.

startFrame values in the generated .tsx are seeded from targetFrames (cumulative
with the 10-frame buffer). scripts/apply-narration-updates.py overwrites them
later once real audio durations are available.
"""

import argparse
import re
import sys
from pathlib import Path
from typing import Any, Optional

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml required. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

try:
    from jinja2 import Environment, FileSystemLoader, StrictUndefined
    HAVE_JINJA = True
except ImportError:
    HAVE_JINJA = False


SCAFFOLD_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = SCAFFOLD_DIR / "templates"
BUFFER_FRAMES = 10  # post-step audio buffer; matches apply-narration-updates.py

# (dataStructure, operationKind) -> template filename
SUPPORTED_COMBOS: dict[tuple[str, str], str] = {
    ("linked-list", "mutation"):  "linked-list-mutation.tsx.j2",
    ("linked-list", "algorithm"): "linked-list-algorithm.tsx.j2",
    ("tree",        "mutation"):  "tree-mutation.tsx.j2",
    ("tree",        "traversal"): "tree-traversal.tsx.j2",
}

# Highlights that should appear in generated TSX as snake-cased strings.
# (the schema uses kebab-friendly lower; the code uses double-quoted TS strings)
VALID_NODE_HIGHLIGHTS = {
    "none", "active", "found", "new", "removing", "error", "visited",
}


# ─── small helpers ────────────────────────────────────────────────────────────

def kebab_to_title(s: str) -> str:
    """insert-head → InsertHead. left-view-traversal → LeftViewTraversal."""
    return "".join(p.capitalize() for p in s.split("-"))


def kebab_to_camel(s: str) -> str:
    """insert-head → insertHead."""
    parts = s.split("-")
    if not parts:
        return s
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def kebab_to_screaming_snake(s: str) -> str:
    """insert-head → INSERT_HEAD."""
    return s.replace("-", "_").upper()


def js_str(s: str) -> str:
    """JS-safe double-quoted string."""
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def fmt_num(value: float) -> str:
    """1.0 → '1', 1.2 → '1.2'."""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if value == int(value):
        return str(int(value))
    return f"{value:g}"


# ─── input parsing ────────────────────────────────────────────────────────────

def load_yaml(path: Path) -> dict:
    try:
        data = yaml.safe_load(path.read_text())
    except yaml.YAMLError as e:
        die(f"YAML parse error in {path}: {e}")
    if not isinstance(data, dict):
        die(f"Expected a YAML mapping at top level of {path}; got {type(data).__name__}")
    return data


def die(msg: str, code: int = 1) -> None:
    print(f"scaffold: {msg}", file=sys.stderr)
    sys.exit(code)


def minimal_validate(scene: dict, path: Path) -> None:
    """Minimal pre-flight check — full validation belongs to stage 01."""
    for f in ("sceneId", "dataStructure", "operationKind", "code", "steps", "outputs"):
        if f not in scene:
            die(f"missing required field '{f}' in {path}")
    code = scene.get("code") or {}
    if "source" not in code:
        die("missing code.source")
    steps = scene.get("steps") or []
    if not steps:
        die("steps must contain at least one entry")
    for i, st in enumerate(steps):
        for f in ("stepIndex", "targetFrames", "snapshot"):
            if f not in st:
                die(f"steps[{i}]: missing required field '{f}'")


# ─── derived identifiers ──────────────────────────────────────────────────────

def derive_identifiers(scene: dict) -> dict[str, str]:
    """Compute names used in the generated TSX + paste snippets.

    Honours optional `identifiers:` block in the YAML; otherwise derives from
    sceneId.
    """
    overrides = scene.get("identifiers") or {}
    scene_id = scene["sceneId"]
    title_case = kebab_to_title(scene_id)
    camel = kebab_to_camel(scene_id)
    screaming = kebab_to_screaming_snake(scene_id)

    component_name = overrides.get("componentName") or title_case
    scene_frames_const = overrides.get("sceneFramesConst") or f"{screaming}_SCENE_FRAMES"
    code_const = overrides.get("codeConstName") or f"{camel}Code"
    code_window_title = overrides.get("codeWindowTitle") or (
        "BinaryTree.java" if scene.get("dataStructure") == "tree" else "LinkedList.java"
    )

    durations_var = overrides.get("durationsVarName") or f"{camel}Durations"

    return {
        "scene_id": scene_id,
        "component_name": component_name,
        "scene_frames_const": scene_frames_const,
        "code_const": code_const,
        "code_window_title": code_window_title,
        "durations_var": durations_var,
    }


# ─── step rendering ───────────────────────────────────────────────────────────

def render_snapshot_field_listnodedata(node: dict, indent: str) -> str:
    """Render a ListNodeData literal — id, value, optional highlight, optional reversed."""
    parts = [f'id: {js_str(node["id"])}', f'value: {node["value"]}']
    if "highlight" in node and node["highlight"] != "none":
        hl = node["highlight"]
        if hl not in VALID_NODE_HIGHLIGHTS:
            parts.append(f"/* TODO: unknown highlight {hl!r} */ ")
        else:
            parts.append(f'highlight: {js_str(hl)}')
    if node.get("reversed"):
        parts.append("reversed: true")
    if "address" in node:
        parts.append(f'address: {js_str(node["address"])}')
    return f"{indent}{{ {', '.join(parts)} }},"


def render_pointer_literal(ptr: dict, indent: str) -> str:
    """PointerData: { label, targetNodeId, color?, id? }.

    Schema name: `points` (mirrors English better) → maps to `targetNodeId`.
    """
    label = ptr.get("label", "")
    points = ptr.get("points", None)
    target = "null" if points is None else js_str(points)
    parts = [f'label: {js_str(label)}', f'targetNodeId: {target}']
    if ptr.get("color"):
        parts.append(f'color: {js_str(ptr["color"])}')
    if ptr.get("id") and ptr["id"] != label:
        parts.append(f'id: {js_str(ptr["id"])}')
    return f"{indent}{{ {', '.join(parts)} }},"


def render_arrow_literal(arrow: dict, indent: str) -> str:
    parts = [f'from: {js_str(arrow["from"])}', f'to: {js_str(arrow["to"])}']
    if arrow.get("dashed"):
        parts.append("dashed: true")
    if arrow.get("highlight"):
        parts.append("highlight: true")
    if arrow.get("curved"):
        parts.append("curved: true")
    if arrow.get("color"):
        parts.append(f'color: {js_str(arrow["color"])}')
    return f"{indent}{{ {', '.join(parts)} }},"


def render_queue_item(item: dict, indent: str) -> str:
    parts = [f'value: {item["value"]}']
    if item.get("highlight") and item["highlight"] != "none":
        parts.append(f'highlight: {js_str(item["highlight"])}')
    return f"{indent}{{ {', '.join(parts)} }},"


def render_snapshot(snapshot: dict, base_indent: str) -> str:
    """Render the ListSnapshot literal."""
    lines: list[str] = []
    inner = base_indent + "  "

    if snapshot.get("hideEndNull"):
        lines.append(f"{inner}hideEndNull: true,")

    # nodes
    nodes = snapshot.get("nodes") or []
    if nodes:
        lines.append(f"{inner}nodes: [")
        for n in nodes:
            lines.append(render_snapshot_field_listnodedata(n, inner + "  "))
        lines.append(f"{inner}],")
    else:
        lines.append(f"{inner}nodes: [],")

    # pointers
    pointers = snapshot.get("pointers") or []
    if pointers:
        lines.append(f"{inner}pointers: [")
        for p in pointers:
            lines.append(render_pointer_literal(p, inner + "  "))
        lines.append(f"{inner}],")
    else:
        lines.append(f"{inner}pointers: [],")

    # arrows
    arrows = snapshot.get("arrows") or []
    if arrows:
        lines.append(f"{inner}arrows: [")
        for a in arrows:
            lines.append(render_arrow_literal(a, inner + "  "))
        lines.append(f"{inner}],")
    else:
        lines.append(f"{inner}arrows: [],")

    # newNode (single)
    if snapshot.get("newNode"):
        nn = snapshot["newNode"]
        nn_parts = [f'id: {js_str(nn["id"])}', f'value: {nn["value"]}']
        if "highlight" in nn:
            nn_parts.append(f'highlight: {js_str(nn["highlight"])}')
        lines.append(f"{inner}newNode: {{ {', '.join(nn_parts)} }},")

    # caption
    if snapshot.get("caption"):
        lines.append(f"{inner}caption: {js_str(snapshot['caption'])},")

    # secondaryCaption (used by traversal scenes — silently dropped by ListSnapshot
    # but components read it; we keep it for parity)
    if snapshot.get("secondaryCaption"):
        lines.append(
            f"{inner}// @ts-expect-error secondaryCaption read by some components\n"
            f"{inner}secondaryCaption: {js_str(snapshot['secondaryCaption'])},"
        )

    # complexity info
    ci = snapshot.get("complexityInfo")
    if ci:
        time_s = js_str(ci.get("time", ""))
        space_s = js_str(ci.get("space", ""))
        lines.append(
            f"{inner}complexityInfo: {{ time: {time_s}, space: {space_s} }},"
        )

    # queueItems
    qi = snapshot.get("queueItems")
    if qi is not None:
        if qi:
            lines.append(f"{inner}queueItems: [")
            for it in qi:
                lines.append(render_queue_item(it, inner + "  "))
            lines.append(f"{inner}],")
        else:
            lines.append(f"{inner}queueItems: [],")

    # nextQItems
    nqi = snapshot.get("nextQItems")
    if nqi is not None:
        if nqi:
            lines.append(f"{inner}nextQItems: [")
            for it in nqi:
                lines.append(render_queue_item(it, inner + "  "))
            lines.append(f"{inner}],")
        else:
            lines.append(f"{inner}nextQItems: [],")

    # stackItems
    si = snapshot.get("stackItems")
    if si is not None:
        lines.append(f"{inner}stackItems: [{', '.join(str(v) for v in si)}],")

    # outputValues + outputLabel (paired for traversal scenes)
    ov = snapshot.get("outputValues")
    ol = snapshot.get("outputLabel")
    if ol is not None:
        lines.append(f"{inner}outputLabel: {js_str(ol)},")
    if ov is not None:
        lines.append(f"{inner}outputValues: [{', '.join(str(v) for v in ov)}],")

    return "\n".join(lines)


def render_step(step: dict, start_frame: int, base_indent: str, include_visible_lines: bool) -> str:
    """Render a single SceneStep literal as the array element (with trailing comma)."""
    lines: list[str] = []
    intent = step.get("intent") or step.get("arc") or ""

    if intent:
        lines.append(f"{base_indent}// {intent}")

    lines.append(f"{base_indent}{{")
    inner = base_indent + "  "
    lines.append(f"{inner}startFrame: {start_frame},")

    hl = step.get("highlight") or {}
    sl = hl.get("startLine", 0)
    el = hl.get("endLine", sl)
    lines.append(f"{inner}highlightLines: {{ startLine: {sl}, endLine: {el} }},")

    if include_visible_lines and "visibleLines" in step:
        lines.append(f"{inner}visibleLines: {step['visibleLines']},")

    lines.append(f"{inner}snapshot: {{")
    lines.append(render_snapshot(step.get("snapshot") or {}, inner))
    lines.append(f"{inner}}},")

    lines.append(f"{base_indent}}},")
    return "\n".join(lines)


def compute_start_frames(steps: list[dict]) -> tuple[list[int], int]:
    """Cumulative startFrames seeded from targetFrames + BUFFER. Matches apply-narration-updates."""
    sf = 0
    out: list[int] = []
    for st in steps:
        out.append(sf)
        sf += int(st.get("targetFrames", 0)) + BUFFER_FRAMES
    return out, sf


def render_steps_literal(steps: list[dict], base_indent: str, include_visible_lines: bool) -> str:
    start_frames, _ = compute_start_frames(steps)
    chunks = []
    for st, sf in zip(steps, start_frames):
        chunks.append(render_step(st, sf, base_indent, include_visible_lines))
    return "\n".join(chunks) + "\n"


# ─── pointer constants ────────────────────────────────────────────────────────

def derive_pointer_constants(scene: dict) -> tuple[str, dict[str, str]]:
    """Collect named pointer colors into module-level constants.

    Returns (constants_block, label_to_var_name_map).
    Reads two sources, in order:
      1. Explicit `pointers:` block in YAML — `pointers.<label>.color`
      2. Any unique (label, color) pair in step pointers — first occurrence wins

    Constant names: SCREAMING_SNAKE on the label, suffixed with _COLOR.
    """
    constants: dict[str, str] = {}  # var_name -> color
    label_to_var: dict[str, str] = {}

    declared = scene.get("pointers") or {}
    for label, cfg in declared.items():
        color = cfg.get("color") if isinstance(cfg, dict) else None
        if color:
            var = label_to_const(label)
            constants[var] = color
            label_to_var[label] = var

    # also scan steps so undeclared but coloured pointers get hoisted
    for step in scene.get("steps") or []:
        for p in (step.get("snapshot") or {}).get("pointers") or []:
            label = p.get("label", "")
            color = p.get("color")
            if not label or not color:
                continue
            if label in label_to_var:
                continue  # already declared
            var = label_to_const(label)
            constants[var] = color
            label_to_var[label] = var

    if not constants:
        return "", {}

    lines = [f'const {var} = {js_str(color)};' for var, color in constants.items()]
    return "\n".join(lines), label_to_var


def label_to_const(label: str) -> str:
    """`head` -> `HEAD_COLOR`. `newNode` -> `NEWNODE_COLOR`."""
    clean = re.sub(r"[^A-Za-z0-9]", "", label)
    return clean.upper() + "_COLOR"


def rewrite_pointer_colors_inplace(scene: dict, label_to_var: dict[str, str]) -> None:
    """Rewrite step pointer colors so they reference the module-level constant
    by sentinel (rendered later by post-process).

    We use sentinels like __CONST__HEAD_COLOR__ so the JS renderer emits an
    unquoted identifier instead of a string literal.
    """
    for step in scene.get("steps") or []:
        for p in (step.get("snapshot") or {}).get("pointers") or []:
            label = p.get("label")
            if label in label_to_var and p.get("color"):
                p["color"] = f"__CONST__{label_to_var[label]}__"


def post_process_constants(rendered: str) -> str:
    """Turn `color: "__CONST__HEAD_COLOR__"` into `color: HEAD_COLOR`."""
    return re.sub(r'"__CONST__([A-Z0-9_]+)__"', r'\1', rendered)


# ─── code comment block ───────────────────────────────────────────────────────

def make_code_comment_block(source: str) -> str:
    """Build the `* 0: line one\n * 1: line two` comment shown above steps."""
    lines = source.rstrip("\n").split("\n")
    width = len(str(len(lines) - 1))
    return "\n".join(f" *   {str(i).rjust(width)}: {line}" for i, line in enumerate(lines))


# ─── position map ─────────────────────────────────────────────────────────────

def render_position_map_block(pmap: dict[str, dict], indent: str) -> str:
    """Render `n1: { x: 0.5, y: 0.2 }, ...` lines for a position map.

    Sort by node id so the order is deterministic across runs.
    """
    if not pmap:
        return ""
    lines = []
    for node_id in sorted(pmap.keys()):
        coords = pmap[node_id]
        x = coords.get("x", 0.5)
        y = coords.get("y", 0.5)
        lines.append(f"{indent}{node_id}: {{ x: {fmt_num(x)}, y: {fmt_num(y)} }},")
    return "\n".join(lines) + "\n"


def get_position_maps(scene: dict, combo: tuple[str, str]) -> dict[str, dict]:
    """Pull format-specific position maps from YAML.

    Schema (recommended):
        positionMaps:
          default: { n50: { x: 0.5, y: 0.18 }, ... }
          reel:    { ... }
          reel-anim: { ... }

    Fallback: if only `positionMap` is given (one map), use it for all three formats.

    For tree scenes a position map is required. Returns dict with keys
    'default', 'reel', 'reel-anim'.
    """
    if combo[0] != "tree":
        return {}

    maps = scene.get("positionMaps") or {}
    if not maps:
        # try the singular form (one map across all formats)
        single = scene.get("positionMap")
        if single:
            return {"default": single, "reel": single, "reel-anim": single}
        # gather node ids from steps and emit a stub
        node_ids = set()
        for step in scene.get("steps") or []:
            for n in (step.get("snapshot") or {}).get("nodes") or []:
                node_ids.add(n["id"])
            if (step.get("snapshot") or {}).get("newNode"):
                node_ids.add(step["snapshot"]["newNode"]["id"])
        stub = {nid: {"x": 0.5, "y": 0.5} for nid in sorted(node_ids)}
        # leave a TODO so the user knows to hand-tune
        return {"default": stub, "reel": stub, "reel-anim": stub, "_stub": True}  # type: ignore

    # Normalise
    return {
        "default": maps.get("default") or maps.get("youtube") or {},
        "reel": maps.get("reel") or {},
        "reel-anim": maps.get("reel-anim") or maps.get("reelAnim") or {},
    }


# ─── ring node ids (traversal only) ───────────────────────────────────────────

def gather_ring_node_ids(scene: dict) -> list[str]:
    """Read scene.ringNodeIds — list of node ids that should wear a permanent ring."""
    ring = scene.get("ringNodeIds")
    if not ring:
        return []
    return list(ring)


# ─── reel layout knobs ────────────────────────────────────────────────────────

def reel_defaults(combo: tuple[str, str]) -> dict[str, Any]:
    """Pattern-derived defaults per (dataStructure, operationKind)."""
    ds, op = combo
    if ds == "linked-list" and op == "mutation":
        return {
            "safeArea": {"top": 150, "bottom": 380, "left": 60, "right": 160},
            "topRatio": None,  # use STACKED_TOP_RATIO default
            "nodeScale": 1.2,
            "animNodeScale": 1.4,
            "codeFontSize": 30,
            "duckVolume": 0.5,
        }
    if ds == "linked-list" and op == "algorithm":
        return {
            "safeArea": {"top": 150, "bottom": 380, "left": 30, "right": 30},
            "topRatio": 0.45,
            "nodeScale": 0.9,
            "animNodeScale": 1.2,
            "codeFontSize": 26,
            "duckVolume": 0.5,
        }
    if ds == "tree" and op == "mutation":
        return {
            "safeArea": {"top": 150, "bottom": 380, "left": 90, "right": 130},
            "topRatio": 0.60,
            "nodeScale": 1.1,
            "animNodeScale": 1.4,
            "codeFontSize": 20,
            "duckVolume": 0.45,
        }
    if ds == "tree" and op == "traversal":
        return {
            "safeArea": {"top": 150, "bottom": 380, "left": 90, "right": 130},
            "topRatio": 0.52,
            "nodeScale": 0.82,
            "animNodeScale": 1.4,
            "codeFontSize": 22,
            "duckVolume": 0.45,
        }
    return {}


def merge_reel_settings(scene: dict, combo: tuple[str, str]) -> dict[str, Any]:
    defaults = reel_defaults(combo)
    user = scene.get("reel") or {}
    safe = {**defaults.get("safeArea", {}), **(user.get("safeArea") or {})}
    return {
        "safeArea": safe,
        "topRatio": user.get("topRatio", defaults.get("topRatio")),
        "nodeScale": user.get("nodeScale", defaults.get("nodeScale")),
        "animNodeScale": user.get("animNodeScale", defaults.get("animNodeScale")),
        "codeFontSize": user.get("codeFontSize", defaults.get("codeFontSize")),
        "duckVolume": scene.get("duckVolume", defaults.get("duckVolume")),
    }


# ─── main render pass ─────────────────────────────────────────────────────────

def render_scene(scene: dict, scene_path: Path) -> str:
    ds = scene["dataStructure"]
    op = scene["operationKind"]
    combo = (ds, op)

    if combo not in SUPPORTED_COMBOS:
        supported = ", ".join(f"({a}, {b})" for a, b in SUPPORTED_COMBOS.keys())
        die(
            f"(datastructure={ds!r}, operationKind={op!r}) not yet supported. "
            f"Supported: {supported}"
        )

    ids = derive_identifiers(scene)
    reel = merge_reel_settings(scene, combo)

    # pointer constants + sentinel rewrite
    pointer_constants, label_to_var = derive_pointer_constants(scene)
    rewrite_pointer_colors_inplace(scene, label_to_var)

    code_source = scene["code"]["source"]
    code_comment_block = make_code_comment_block(code_source)

    # totals (start_frames seeded; apply-narration-updates rewrites later)
    _, scene_frames_value = compute_start_frames(scene["steps"])

    # progressive code reveal: trees get visibleLines; linked-list scenes don't
    include_visible_lines = (ds == "tree")

    # indent depth depends on whether steps are inside a function (tree) or top-level (linked-list)
    step_indent = "    " if ds == "tree" else "  "
    steps_literal = render_steps_literal(scene["steps"], step_indent, include_visible_lines)

    # top_ratio_expr — used by linked-list-mutation template since topRatio may be null
    top_ratio_expr = (
        f"{fmt_num(reel['topRatio'])}" if reel["topRatio"] is not None
        else "STACKED_TOP_RATIO"
    )

    context: dict[str, Any] = {
        "scene_id": ids["scene_id"],
        "component_name": ids["component_name"],
        "scene_frames_const": ids["scene_frames_const"],
        "scene_frames_value": scene_frames_value,
        "code_window_title": ids["code_window_title"],
        "code_comment_block": code_comment_block,
        "pointer_constants": pointer_constants,
        "steps_literal": steps_literal,
        "reel_safe": reel["safeArea"],
        "reel_top_ratio_const": (
            fmt_num(reel["topRatio"]) if reel["topRatio"] is not None else None
        ),
        "top_ratio_expr": top_ratio_expr,
        "reel_node_scale": fmt_num(reel["nodeScale"]),
        "anim_node_scale": fmt_num(reel["animNodeScale"]),
        "reel_code_font_size": fmt_num(reel["codeFontSize"]),
        "duck_volume": fmt_num(reel["duckVolume"]),
    }

    # tree-specific extras
    if ds == "tree":
        pmaps = get_position_maps(scene, combo)
        if pmaps.get("_stub"):
            print(
                "  ⚠️  positionMap missing — emitted stub coordinates (all 0.5/0.5). "
                "Hand-tune in the generated file.",
                file=sys.stderr,
            )
        context["position_map_default"] = render_position_map_block(pmaps.get("default") or {}, "    ")
        context["position_map_reel"]    = render_position_map_block(pmaps.get("reel") or {}, "      ")
        context["position_map_anim"]    = render_position_map_block(pmaps.get("reel-anim") or {}, "      ")

    if combo == ("tree", "traversal"):
        ring = gather_ring_node_ids(scene)
        if ring:
            context["ring_node_ids_literal"] = "[" + ", ".join(js_str(n) for n in ring) + "]"
        else:
            context["ring_node_ids_literal"] = ""

    template_path = TEMPLATES_DIR / SUPPORTED_COMBOS[combo]
    rendered = render_template(template_path, context)
    rendered = post_process_constants(rendered)
    return rendered


# ─── template loader ──────────────────────────────────────────────────────────

def render_template(template_path: Path, context: dict[str, Any]) -> str:
    if not template_path.exists():
        die(f"template not found: {template_path}")

    if HAVE_JINJA:
        # Custom delimiters: JSX uses `{{`/`}}` for inline object literals, and
        # TypeScript uses `<X>` for generic params (`<<X>>` would collide), so
        # we use `[[`/`]]` for variables and `%%`/`%%` for blocks.
        env = Environment(
            loader=FileSystemLoader(str(template_path.parent)),
            undefined=StrictUndefined,
            keep_trailing_newline=True,
            trim_blocks=False,
            lstrip_blocks=False,
            variable_start_string="[[",
            variable_end_string="]]",
            block_start_string="{%",
            block_end_string="%}",
            comment_start_string="<#",
            comment_end_string="#>",
        )
        tmpl = env.get_template(template_path.name)
        return tmpl.render(**context)

    # Fallback: very small Python templating using `{{ name }}` substitution.
    # Doesn't support conditionals — surface a clear error if the template uses them.
    src = template_path.read_text()
    if "{%" in src:
        die(
            f"template {template_path.name} uses control flow but jinja2 is "
            "not installed. Install with: pip install jinja2"
        )
    out = src
    for k, v in context.items():
        out = out.replace("{{ " + k + " }}", str(v) if v is not None else "")
        out = out.replace("{{" + k + "}}", str(v) if v is not None else "")
    return out


# ─── paste snippets ───────────────────────────────────────────────────────────

def emit_paste_snippets(scene: dict, ids: dict[str, str]) -> str:
    """Build the multi-section markdown-ish text printed to stdout."""
    ds = scene["dataStructure"]
    op = scene["operationKind"]
    formats = (scene.get("outputs") or {}).get("formats") or []
    code_source = scene["code"]["source"]

    title = (scene.get("title") or ids["component_name"]).strip()
    complexity_obj = scene.get("complexity") or {}
    complexity_str = complexity_obj.get("time", "O(?)")
    standalone = scene.get("standalone") or {}
    next_topic = standalone.get("nextTopic")
    subtitle = scene.get("subtitle")

    sections: list[str] = []

    # ─── 1. code-snippets.ts ─────────────────────────────────────────────────
    code_const = ids["code_const"]
    # template literal — escape backticks and ${...}
    safe_code = code_source.rstrip("\n").replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
    sections.append(
        "─── PASTE 1/4: src/data/code-snippets.ts ───────────────────────────────\n"
        "Append (or place alphabetically) the constant below:\n\n"
        f"export const {code_const} = `{safe_code}`;\n"
    )

    # ─── 2. standalone/index.tsx ─────────────────────────────────────────────
    name = ids["component_name"]
    scene_frames_const = ids["scene_frames_const"]
    standalone_lines: list[str] = []
    standalone_lines.append(
        "─── PASTE 2/4: src/standalone/index.tsx ────────────────────────────────\n"
        f"Import addition (alongside the other scene imports at the top):\n\n"
        f"import {{ {name}, {scene_frames_const} }} from \"../scenes/{name}\";\n"
    )

    # Build standalone exports for each format
    sub = f'\n    subtitle="{subtitle}"' if subtitle else ""
    next_topic_str = f'\n    nextTopic="{next_topic}"' if next_topic else ""

    if "youtube" in formats:
        standalone_lines.append(
            f"\nexport const {name}Video: React.FC<TokenProps> = ({{ tokens }}) => (\n"
            f"  <StandaloneVideo\n"
            f"    title=\"{title}\"\n"
            f"    complexity=\"{complexity_str}\"{sub}\n"
            f"    sceneFrames={{{scene_frames_const}}}{next_topic_str}\n"
            f"  >\n"
            f"    <{name} tokens={{tokens}} />\n"
            f"  </StandaloneVideo>\n"
            f");\n"
        )
    if "reel" in formats:
        standalone_lines.append(
            f"\nexport const {name}Reel: React.FC<TokenProps> = ({{ tokens }}) => (\n"
            f"  <StandaloneVideo\n"
            f"    title=\"{title}\"\n"
            f"    complexity=\"{complexity_str}\"{sub}\n"
            f"    sceneFrames={{{scene_frames_const}}}{next_topic_str}\n"
            f"  >\n"
            f"    <{name} tokens={{tokens}} format=\"reel\" />\n"
            f"  </StandaloneVideo>\n"
            f");\n"
        )
    if "reel-anim" in formats:
        standalone_lines.append(
            f"\nexport const {name}ReelAnim: React.FC<TokenProps> = ({{ tokens }}) => (\n"
            f"  <StandaloneVideo\n"
            f"    title=\"{title}\"\n"
            f"    complexity=\"{complexity_str}\"{sub}\n"
            f"    sceneFrames={{{scene_frames_const}}}{next_topic_str}\n"
            f"  >\n"
            f"    <{name} tokens={{tokens}} format=\"reel-anim\" />\n"
            f"  </StandaloneVideo>\n"
            f");\n"
        )
    sections.append("".join(standalone_lines))

    # ─── 3. Root.tsx ─────────────────────────────────────────────────────────
    step_count = len(scene.get("steps") or [])
    code_const_ref = ids["code_const"]

    root_lines: list[str] = []
    root_lines.append(
        "─── PASTE 3/4: src/Root.tsx ────────────────────────────────────────────\n"
        f"Imports (add to the existing scene + code-snippet import groups):\n\n"
        f"  // from ./scenes/{name}\n"
        f"  import {{ {name}, {scene_frames_const} }} from \"./scenes/{name}\";\n"
        f"  // from ./data/code-snippets\n"
        f"  import {{ {code_const_ref} }} from \"./data/code-snippets\";\n"
        f"  // from ./compositions (or ./standalone)\n"
    )
    comp_imports = []
    if "youtube" in formats:
        comp_imports.append(f"{name}Video")
    if "reel" in formats:
        comp_imports.append(f"{name}Reel")
    if "reel-anim" in formats:
        comp_imports.append(f"{name}ReelAnim")
    if comp_imports:
        root_lines.append(f"  import {{ {', '.join(comp_imports)} }} from \"./compositions\";\n")

    # Scenes folder registration
    root_lines.append(
        f"\nRegister inside <Folder name=\"Scenes\">:\n\n"
        f"        <Composition\n"
        f"          id=\"{name}\"\n"
        f"          component={{{name}}}\n"
        f"          durationInFrames={{{scene_frames_const}}}\n"
        f"          fps={{FPS}}\n"
        f"          width={{WIDTH}}\n"
        f"          height={{HEIGHT}}\n"
        f"          defaultProps={{{{ tokens: emptyTokens }}}}\n"
        f"          calculateMetadata={{makeCalcMetadata({code_const_ref})}}\n"
        f"        />\n"
    )

    # Standalone / Reels folder
    folder_root = "LinkedList" if ds == "linked-list" else ("Trees" if ds == "tree" else "Other")
    root_lines.append(
        f"\nInside <Folder name=\"{folder_root}\">, add a sub-folder:\n\n"
        f"        <Folder name=\"{name}\">\n"
    )
    if "youtube" in formats:
        root_lines.append(
            f"          <Composition id=\"Video-{name}\" component={{{name}Video}} "
            f"durationInFrames={{standaloneDuration({scene_frames_const})}} fps={{FPS}} "
            f"width={{WIDTH}} height={{HEIGHT}} defaultProps={{{{ tokens: emptyTokens }}}} "
            f"calculateMetadata={{makeCalcMetadata({code_const_ref})}} />\n"
        )
    if "reel" in formats:
        root_lines.append(
            f"          <Composition id=\"Reel-{name}\" component={{{name}Reel}} "
            f"durationInFrames={{standaloneDuration({scene_frames_const})}} fps={{FPS}} "
            f"width={{REEL_WIDTH}} height={{REEL_HEIGHT}} defaultProps={{{{ tokens: emptyTokens }}}} "
            f"calculateMetadata={{makeCalcMetadata({code_const_ref})}} />\n"
        )
    if "reel-anim" in formats:
        root_lines.append(
            f"          <Composition id=\"Anim-{name}\" component={{{name}ReelAnim}} "
            f"durationInFrames={{standaloneDuration({step_count} * ANIM_FRAMES_PER_STEP)}} fps={{FPS}} "
            f"width={{REEL_WIDTH}} height={{REEL_HEIGHT}} defaultProps={{{{ tokens: emptyTokens }}}} "
            f"calculateMetadata={{makeCalcMetadata({code_const_ref})}} />\n"
        )
    root_lines.append("        </Folder>\n")
    sections.append("".join(root_lines))

    # ─── 4. scripts/apply-narration-updates.py (OPTIONAL — ad-hoc only) ─────
    #
    # The pipeline uses its own apply at pipeline/stages/06-apply/apply.py,
    # which derives identifiers from scene.yaml directly and does NOT need
    # a SCENES dict entry. This paste is only useful if you want to keep
    # the legacy script working ad-hoc for this scene. Skip it otherwise.
    scene_id = ids["scene_id"]
    tsx_rel = f"src/scenes/{name}.tsx"
    durations_var = ids["durations_var"]
    sections.append(
        "─── PASTE 4/4 (OPTIONAL): scripts/apply-narration-updates.py ───────────\n"
        "The pipeline doesn't need this — pipeline/stages/06-apply/apply.py\n"
        "reads scene.yaml directly. Add this only if you want the legacy script\n"
        "to work ad-hoc on this scene:\n\n"
        f'    "{scene_id}": ("{tsx_rel}", "{scene_frames_const}", "{durations_var}"),\n'
    )

    return "\n".join(sections)


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(
        description="Scaffold a Remotion scene .tsx from a scene.yaml.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Supported combos:\n  "
            + "\n  ".join(
                f"({a}, {b})" for a, b in SUPPORTED_COMBOS.keys()
            )
        ),
    )
    ap.add_argument("scene_yaml", type=Path, help="Path to scene.yaml")
    ap.add_argument(
        "--out-dir", type=Path, default=Path("src/scenes"),
        help="Output directory for the .tsx (default: src/scenes/)",
    )
    ap.add_argument(
        "--dry-run", action="store_true",
        help="Print what would be written without writing",
    )
    ap.add_argument(
        "--no-snippets", action="store_true",
        help="Suppress the paste snippets on stdout",
    )
    args = ap.parse_args()

    if not args.scene_yaml.exists():
        die(f"not found: {args.scene_yaml}", code=2)

    scene = load_yaml(args.scene_yaml)
    minimal_validate(scene, args.scene_yaml)
    ids = derive_identifiers(scene)

    rendered = render_scene(scene, args.scene_yaml)

    out_path = args.out_dir / f"{ids['component_name']}.tsx"

    if args.dry_run:
        print(f"[dry-run] would write {out_path} ({len(rendered)} bytes)")
    else:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(rendered)
        print(f"✅ wrote {out_path} ({len(rendered)} bytes)")

    if not args.no_snippets:
        print()
        print(emit_paste_snippets(scene, ids))


if __name__ == "__main__":
    main()
