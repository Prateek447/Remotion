#!/usr/bin/env python3
"""Validate + summarize the chunked-narration sidecar.

Read-only — does not generate audio or modify files. Runs as the pre-flight
check before stage 05 audio generation:

  - Validates sidecar schema (every step has chunks, every chunk has the
    required fields, params triples present and in range).
  - Cross-checks against scene.yaml — every scene stepIndex must have a
    chunked entry; warns on extra sidecar entries that don't match a scene
    step.
  - Lints per-chunk text for TTS hazards (digits-as-numerals, [brackets],
    OOP operators that need to be spelled out).
  - Summarizes param ranges and total inter-chunk silence per step.
  - Surfaces shape warnings authors typically want to fix:
      • single-chunk opening / peak / closing (probably under-chunked)
      • peak step's max exaggeration below 0.85 (under-emphasized reveal)
      • back-to-back chunks with identical params (could be merged into one)

Exits non-zero on hard schema errors or scene/sidecar coverage mismatches.

Usage:
    python3 pipeline/stages/03-narration/preview.py <scene.yaml>
"""

import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml required. Install with: pip install pyyaml",
          file=sys.stderr)
    sys.exit(2)

TTS_HAZARDS: list[tuple[str, str]] = [
    ("O(",       "O of n / O of one / O of log n"),
    (".next",    "dot next"),
    (".val",     "dot val"),
    (".size",    "dot size"),
    (".left",    "dot left"),
    (".right",   "dot right"),
    ("n+1",      "n plus one"),
    ("n-1",      "n minus one"),
    ("i+1",      "i plus one"),
    ("->",       "arrow / points to"),
    ("==",       "equals / equal to"),
    ("!=",       "not equal to"),
    ("<=",       "less than or equal to"),
    (">=",       "greater than or equal to"),
]

# Reasonable bounds for the three Chatterbox knobs. Outside these the model
# behavior degrades (per the README + community observations).
PARAM_RANGES: dict[str, tuple[float, float]] = {
    "exaggeration": (0.0, 1.2),
    "cfg_weight":   (0.0, 1.0),
    "temperature":  (0.5, 1.5),
}


def lint_chunk_text(text: str) -> list[str]:
    """TTS-readiness lint for a single chunk's text."""
    issues: list[str] = []
    if not isinstance(text, str):
        return issues
    if re.search(r"\b\d+\b", text):
        issues.append("contains digits — spell as words")
    if "[" in text or "]" in text:
        issues.append("contains [brackets] — Chatterbox reads them literally")
    for hazard, fix in TTS_HAZARDS:
        if hazard in text:
            issues.append(f"{hazard!r} → say {fix!r}")
    # Per-chunk word count — chunks should be tight emotion-coherent beats.
    # If a chunk is long, emotion likely drifts within it; recommend split.
    wc = len(text.split())
    if wc > 18:
        issues.append(f"chunk has {wc} words — consider splitting "
                      f"(one chunk = one emotion)")
    return issues


def validate_params(params: dict, chunk_id: str) -> list[str]:
    issues: list[str] = []
    for key, (lo, hi) in PARAM_RANGES.items():
        if key not in params:
            issues.append(f"chunk {chunk_id} missing params.{key}")
            continue
        v = params[key]
        if not isinstance(v, (int, float)):
            issues.append(f"chunk {chunk_id} params.{key} not numeric: {v!r}")
        elif not (lo <= v <= hi):
            issues.append(f"chunk {chunk_id} params.{key}={v} out of range "
                          f"[{lo}, {hi}]")
    return issues


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: preview.py <scene.yaml>", file=sys.stderr)
        sys.exit(2)

    scene_path = Path(sys.argv[1])
    if not scene_path.exists():
        print(f"Not found: {scene_path}", file=sys.stderr)
        sys.exit(2)

    sidecar_path = scene_path.with_suffix("").with_suffix(".narration.yaml")
    if not sidecar_path.exists():
        print(
            f"ERROR: sidecar missing at {sidecar_path}\n"
            f"  Run: python3 pipeline/stages/03-narration/scaffold.py {scene_path}",
            file=sys.stderr,
        )
        sys.exit(2)

    scene = yaml.safe_load(scene_path.read_text())
    sid = scene["sceneId"]
    scene_arc_by_idx = {s["stepIndex"]: s.get("arc", "methodical")
                        for s in scene["steps"]}
    scene_step_indices = set(scene_arc_by_idx.keys())

    sidecar = yaml.safe_load(sidecar_path.read_text())
    if not isinstance(sidecar, dict) or "steps" not in sidecar:
        print(f"ERROR: sidecar missing 'steps' key", file=sys.stderr)
        sys.exit(2)

    sidecar_steps = sidecar["steps"]
    sidecar_idx = {s["stepIndex"] for s in sidecar_steps}

    print("=" * 78)
    print(f"CHUNKED NARRATION PREVIEW — sceneId={sid}")
    print(f"  scene:   {scene_path}")
    print(f"  sidecar: {sidecar_path}")
    print("=" * 78)

    hard_error = False
    any_lint = False
    any_warn = False

    # Coverage cross-check
    missing = scene_step_indices - sidecar_idx
    extra = sidecar_idx - scene_step_indices
    if missing:
        hard_error = True
        print(f"\n❌ Sidecar missing entries for stepIndex: {sorted(missing)}")
        print(f"   Stage 05 generate.py will refuse to run until these exist.")
    if extra:
        any_warn = True
        print(f"\n⚠  Sidecar has entries for stepIndex not in scene yaml: "
              f"{sorted(extra)}  (will be ignored at generate time)")

    # Per-step table
    print(f"\n{'step':>4}  {'arc':<10}  {'chunks':>6}  "
          f"{'ex range':<12}  {'cfg range':<12}  {'pause':>7}  intent")
    print("-" * 78)

    grand_chunks = 0
    grand_pause = 0.0

    for s in sorted(sidecar_steps, key=lambda x: x["stepIndex"]):
        idx = s["stepIndex"]
        arc = scene_arc_by_idx.get(idx, "?")
        chunks = s["chunks"]
        if not chunks:
            hard_error = True
            print(f"{idx:>4}  {arc:<10}  {'0':>6}  — empty chunks list ❌")
            continue

        ex = [c["params"]["exaggeration"] for c in chunks]
        cfg = [c["params"]["cfg_weight"] for c in chunks]
        pauses = [float(c.get("pauseAfter", 0) or 0) for c in chunks]
        intent = s.get("intent", "")
        grand_chunks += len(chunks)
        grand_pause += sum(pauses)

        print(
            f"{idx:>4}  {arc:<10}  {len(chunks):>6}  "
            f"{min(ex):.2f}-{max(ex):.2f}    "
            f"{min(cfg):.2f}-{max(cfg):.2f}    "
            f"{sum(pauses):>5.2f}s   {intent}"
        )

        # Shape warnings
        if arc in ("opening", "peak", "closing") and len(chunks) == 1:
            any_warn = True
            print(f"        ⚠  single chunk on {arc} arc — typically "
                  f"under-chunked; opening/peak/closing have multiple beats")
        if arc == "peak" and max(ex) < 0.85:
            any_warn = True
            print(f"        ⚠  peak max ex={max(ex):.2f} — reveal beat "
                  f"should be ≥ 0.85 (recommend 0.90-0.95)")

        # Per-chunk lint, param range check, identical-neighbor merge hint
        prev_triple = None
        for c in chunks:
            param_issues = validate_params(c["params"], c["id"])
            for pi in param_issues:
                hard_error = True
                print(f"        ❌ {pi}")

            text_issues = lint_chunk_text(c.get("text", ""))
            if text_issues:
                any_lint = True
                short = c.get("text", "")[:60]
                short += "..." if len(c.get("text", "")) > 60 else ""
                print(f"        ⚠  chunk {c['id']}: {text_issues[0]}")
                for issue in text_issues[1:]:
                    print(f"                     {issue}")

            p = c["params"]
            triple = (p.get("exaggeration"), p.get("cfg_weight"),
                      p.get("temperature"))
            if prev_triple == triple and len(chunks) > 1:
                any_warn = True
                print(f"        ⚠  chunk {c['id']} has identical params to "
                      f"previous — could be merged into one chunk")
            prev_triple = triple

    print()
    print(f"Totals: {len(sidecar_steps)} step(s), {grand_chunks} chunks, "
          f"{grand_pause:.1f}s of inter-chunk silence")

    if hard_error:
        print("\n❌ Hard errors above — fix before running generate.py.")
        sys.exit(2)
    if any_lint:
        print("\n⚠  TTS-readiness warnings above — review chunk text before "
              "audio gen.")
    elif any_warn:
        print("\n⚠  Shape warnings above — review before audio gen if relevant.")
    else:
        print("\n✅ Sidecar looks clean. Ready for stage 05.")

    print(f"\nNext: python3 pipeline/stages/05-audio/generate.py {scene_path}")


if __name__ == "__main__":
    main()
