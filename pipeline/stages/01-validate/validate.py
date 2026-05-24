#!/usr/bin/env python3
"""Validate a scene.yaml against the design-system contracts.

Usage:
    python3 pipeline/stages/01-validate/validate.py <path/to/scene.yaml>

Exits 0 if valid, 1 if violations found. Prints all violations.

Contracts are documented in pipeline/design-system/overview.md ("Authoring contracts").
"""

import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml required. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

# ─── allowed value sets ──────────────────────────────────────────────────────

ALLOWED_DATA_STRUCTURES = {
    "linked-list", "tree", "graph", "array", "stack", "queue", "dp-table",
}
ALLOWED_OPERATION_KINDS = {
    "traversal", "mutation", "algorithm", "comparison", "proof",
}
ALLOWED_PERSONAS = {"teacher-energetic", "measured", "casual"}
ALLOWED_ARCS = {"opening", "methodical", "peak", "closing"}
ALLOWED_FORMATS = {"youtube", "reel", "reel-anim"}
# Note: "pinned" deliberately excluded — would crash on tree nodes per audit
# (TreeNodeCircle.highlightColorMap has no entry for it).
ALLOWED_NODE_HIGHLIGHTS = {
    "none", "active", "found", "new", "removing", "error", "visited",
}

REQUIRED_TOP_LEVEL = [
    "sceneId", "title", "dataStructure", "operationKind",
    "approach", "approachNotes",
    "voice", "code", "steps", "outputs",
]
REQUIRED_VOICE = ["persona"]
REQUIRED_CODE = ["language", "source"]
REQUIRED_OUTPUTS = ["formats"]
REQUIRED_STEP = ["stepIndex", "arc", "narration", "targetFrames", "snapshot"]


# ─── validation ──────────────────────────────────────────────────────────────

def validate(scene: dict) -> list[str]:
    errors: list[str] = []

    for field in REQUIRED_TOP_LEVEL:
        if field not in scene:
            errors.append(f"Missing required top-level field: {field}")
    if errors:
        return errors  # bail early on structural break

    # sceneId — kebab-case
    if not re.match(r"^[a-z][a-z0-9-]*$", scene["sceneId"]):
        errors.append(f"sceneId must be kebab-case, got: {scene['sceneId']!r}")

    # approach — kebab-case identifier. Not constrained to a fixed list (see
    # design-system/approaches.md — approaches are community-sourced per topic).
    approach = scene.get("approach")
    if not isinstance(approach, str) or not re.match(r"^[a-z][a-z0-9-]*$", approach):
        errors.append(
            f"approach must be a kebab-case identifier, got: {approach!r}. "
            f"See design-system/approaches.md for the discovery process."
        )

    # approachNotes — non-empty string documenting the choice.
    notes = scene.get("approachNotes")
    if not isinstance(notes, str) or not notes.strip():
        errors.append(
            "approachNotes must be a non-empty string explaining why this "
            "approach was chosen (community sources, rationale, trade-offs)."
        )

    # dataStructure / operationKind
    if scene["dataStructure"] not in ALLOWED_DATA_STRUCTURES:
        errors.append(
            f"dataStructure must be one of {sorted(ALLOWED_DATA_STRUCTURES)}, "
            f"got: {scene['dataStructure']!r}"
        )
    if scene["operationKind"] not in ALLOWED_OPERATION_KINDS:
        errors.append(
            f"operationKind must be one of {sorted(ALLOWED_OPERATION_KINDS)}, "
            f"got: {scene['operationKind']!r}"
        )

    # voice
    voice = scene.get("voice") or {}
    for field in REQUIRED_VOICE:
        if field not in voice:
            errors.append(f"Missing required voice.{field}")
    if voice.get("persona") not in ALLOWED_PERSONAS:
        errors.append(
            f"voice.persona must be one of {sorted(ALLOWED_PERSONAS)}, "
            f"got: {voice.get('persona')!r}"
        )

    # code
    code = scene.get("code") or {}
    for field in REQUIRED_CODE:
        if field not in code:
            errors.append(f"Missing required code.{field}")
    code_source = code.get("source") or ""
    code_line_count = len(code_source.rstrip("\n").split("\n")) if code_source else 0

    # outputs
    outputs = scene.get("outputs") or {}
    for field in REQUIRED_OUTPUTS:
        if field not in outputs:
            errors.append(f"Missing required outputs.{field}")
    formats = outputs.get("formats") or []
    if not formats:
        errors.append("outputs.formats must contain at least one format")
    for fmt in formats:
        if fmt not in ALLOWED_FORMATS:
            errors.append(
                f"outputs.formats: unknown format {fmt!r}, "
                f"allowed: {sorted(ALLOWED_FORMATS)}"
            )

    # steps
    steps = scene.get("steps") or []
    if not steps:
        errors.append("steps must contain at least one step")
        return errors

    arc_counts: dict[str, int] = {arc: 0 for arc in ALLOWED_ARCS}
    seen_indices: list[int] = []

    for i, step in enumerate(steps):
        prefix = f"steps[{i}]"

        for field in REQUIRED_STEP:
            if field not in step:
                errors.append(f"{prefix}: missing required field {field}")

        if "stepIndex" in step:
            seen_indices.append(step["stepIndex"])

        arc = step.get("arc")
        if arc not in ALLOWED_ARCS:
            errors.append(
                f"{prefix}: arc must be one of {sorted(ALLOWED_ARCS)}, got: {arc!r}"
            )
        else:
            arc_counts[arc] += 1

        # targetFrames floor
        tf = step.get("targetFrames")
        if isinstance(tf, (int, float)) and tf < 40:
            errors.append(
                f"{prefix}: targetFrames {tf} < 40 (viewer absorption floor)"
            )

        # caption length ceiling
        caption = step.get("caption")
        if isinstance(caption, str) and len(caption) > 40:
            errors.append(
                f"{prefix}: caption {len(caption)} chars > 40 "
                f"(readability ceiling): {caption!r}"
            )

        # narration TTS-readiness (hard)
        narration = step.get("narration", "")
        if isinstance(narration, str):
            if re.search(r"\b\d+\b", narration):
                errors.append(
                    f"{prefix}: narration contains digits — spell as words. "
                    f"Got: {narration!r}"
                )
            if "[" in narration or "]" in narration:
                errors.append(
                    f"{prefix}: narration contains [brackets] — base Chatterbox "
                    f"reads them as English. Got: {narration!r}"
                )
            # breath-group word count (em-dashes count as boundaries)
            for sentence in re.split(r"[.!?]", narration):
                for bg in re.split(r"—|--", sentence):
                    word_count = len(bg.strip().split())
                    if word_count > 12:
                        errors.append(
                            f"{prefix}: narration breath group has {word_count} "
                            f"words > 12: {bg.strip()!r}"
                        )

        # highlight bounds
        hl = step.get("highlight") or {}
        if hl:
            start, end = hl.get("startLine"), hl.get("endLine")
            if isinstance(start, int) and isinstance(end, int):
                if start > end:
                    errors.append(
                        f"{prefix}: highlight.startLine {start} > endLine {end}"
                    )
                if code_line_count and (start < 0 or end >= code_line_count):
                    errors.append(
                        f"{prefix}: highlight range [{start}, {end}] out of bounds "
                        f"for code with {code_line_count} lines"
                    )

        # snapshot.nodes[*].highlight
        nodes = (step.get("snapshot") or {}).get("nodes") or []
        for j, node in enumerate(nodes):
            hl_val = node.get("highlight")
            if hl_val is not None and hl_val not in ALLOWED_NODE_HIGHLIGHTS:
                errors.append(
                    f"{prefix}.snapshot.nodes[{j}].highlight: {hl_val!r} not in "
                    f"{sorted(ALLOWED_NODE_HIGHLIGHTS)} "
                    f"(NOTE: 'pinned' deliberately excluded — would crash on tree nodes)"
                )

    # ─── step structure rules ────────────────────────────────────────────────

    if steps[0].get("arc") != "opening":
        errors.append("steps[0] must have arc: opening")
    if steps[-1].get("arc") != "closing":
        errors.append(
            f"steps[{len(steps) - 1}] (last step) must have arc: closing"
        )
    if arc_counts["opening"] != 1:
        errors.append(
            f"Must have exactly one step with arc: opening (got {arc_counts['opening']})"
        )
    if arc_counts["closing"] != 1:
        errors.append(
            f"Must have exactly one step with arc: closing (got {arc_counts['closing']})"
        )
    if arc_counts["peak"] > 1:
        errors.append(
            f"At most one step may have arc: peak (got {arc_counts['peak']})"
        )

    # stepIndex contiguity
    expected = list(range(len(steps)))
    if sorted(seen_indices) != expected:
        errors.append(
            f"stepIndex values must be contiguous starting at 0; "
            f"got {sorted(seen_indices)}, expected {expected}"
        )

    return errors


# ─── CLI ─────────────────────────────────────────────────────────────────────

def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: validate.py <scene.yaml>", file=sys.stderr)
        sys.exit(2)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"Not found: {path}", file=sys.stderr)
        sys.exit(2)

    try:
        scene = yaml.safe_load(path.read_text())
    except yaml.YAMLError as e:
        print(f"YAML parse error in {path}: {e}", file=sys.stderr)
        sys.exit(2)

    if not isinstance(scene, dict):
        print(
            f"Expected a YAML mapping at top level, got {type(scene).__name__}",
            file=sys.stderr,
        )
        sys.exit(2)

    errors = validate(scene)

    if errors:
        print(f"❌ {len(errors)} violation(s) in {path}:")
        for err in errors:
            print(f"  • {err}")
        sys.exit(1)

    print(
        f"✅ {path} valid "
        f"(sceneId: {scene['sceneId']}, "
        f"{len(scene['steps'])} steps, "
        f"persona: {scene['voice']['persona']})"
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
