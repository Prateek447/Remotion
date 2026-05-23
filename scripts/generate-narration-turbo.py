#!/usr/bin/env python3
"""Production narration generator using ChatterboxTurboTTS + per-step chunking.

Why this script exists alongside generate-narration-chatterbox.py:
  - The base ChatterboxTTS script pronounces tag tokens literally (e.g. it
    reads "[chuckle]" as the word "chuckle"). Turbo natively renders them
    as non-verbal vocalizations.
  - Turbo is trained on shorter utterances (~300 char cap per demo) and
    sounds monotonic on long algorithm-narration paragraphs. We work
    around this by pre-chunking each step at natural break points and
    concatenating with 250 ms silence between chunks.
  - Output is Remotion-compatible: each step still produces exactly one
    `public/narration/<sceneId>/step-N.mp3` plus a `durations.json`.
    Concatenation happens inside the script.

After generating, patch the scene file + narration-scripts.ts with:

    .venv/bin/python scripts/apply-narration-updates.py <sceneId>

Full reference for Turbo's API, knob behavior, official tag list, and DSA
voice optimisation tips:  scripts/CHATTERBOX_TURBO_NOTES.md

Usage:
    .venv/bin/python scripts/generate-narration-turbo.py                # all registered scenes
    .venv/bin/python scripts/generate-narration-turbo.py bst-insert     # one scene
    .venv/bin/python scripts/generate-narration-turbo.py bst-insert --force   # overwrite mp3s
    .venv/bin/python scripts/generate-narration-turbo.py bst-insert --seed 42  # reproducible
    .venv/bin/python scripts/generate-narration-turbo.py bst-insert --step 5   # one step only
"""

import argparse
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path

# ============================================================================
# Constants
# ============================================================================

REFERENCE_WAV = "scripts/my-voice.wav"
PUBLIC_NARRATION_ROOT = Path("public/narration")
FPS = 30
INTER_CHUNK_SILENCE_S = 0.25       # 250 ms between chunks within a step
TURBO_MAX_CHARS_RECOMMENDED = 300  # Turbo's training-window cap, per demo

# Defaults landed after bst-insert step-5 A/B (see CHATTERBOX_TURBO_NOTES.md).
# Per-step overrides live in each scene's narration table below.
TURBO_DEFAULTS = dict(
    temperature=0.88,
    top_p=0.95,
    top_k=1000,
    repetition_penalty=1.2,
)

# Official paralinguistic tags (per ResembleAI demo's EVENT_TAGS).
# DSA-friendly subset: [gasp], [chuckle], [sigh], [laugh]. Others are
# reserved for character-driven content — see CHATTERBOX_TURBO_NOTES.md.
OFFICIAL_TURBO_TAGS = {
    "[clear throat]", "[sigh]", "[shush]", "[cough]",
    "[groan]", "[sniff]", "[gasp]", "[chuckle]", "[laugh]",
}


# ============================================================================
# Per-scene narration tables
# ============================================================================
# Each step is a list of CHUNKS (short utterances, ≤200 chars each). The
# chunks within a step are concatenated to form step-N.mp3.
#
# Conventions:
#   - One tag per chunk, max. Place the tag adjacent to its trigger word.
#   - Phase markers ("Step one.", "Alright,") are good chunk boundaries.
#   - Keep number sequences ("three, seven, nine") in a single chunk.
#   - Per-step `params` override TURBO_DEFAULTS for emotional peaks/lows.
# ----------------------------------------------------------------------------


@dataclass
class StepNarration:
    step: int
    chunks: list[str]                       # ≥1 chunks per step
    params: dict | None = None              # overrides for TURBO_DEFAULTS

    @property
    def effective_params(self) -> dict:
        return {**TURBO_DEFAULTS, **(self.params or {})}


# bst-insert — 16 steps, pre-chunked.
# Emotional arc: curiosity (0) → analysis (1–4) → discovery (5–6) →
# elegance (7–9) → edge cases (10–14) → wrap (15)
#
# Tag placement follows the empirically validated rules in
# CHATTERBOX_TURBO_NOTES.md (per-tag position matrix). Specifically:
#   [chuckle]  → solo only           (single-token chunk)
#   [gasp]     → prefix only         (opens the chunk it reacts to)
#   [sigh]     → solo or suffix      (here: suffix in step 4)
#   [laugh]    → solo (safest)       (single-token chunk)
BST_INSERT_NARRATION: list[StepNarration] = [
    StepNarration(0, [
        "BST insertion feels complicated because of recursion…",
        "[chuckle]",
        "but the actual algorithm is just repeating one tiny decision again and again — left or right.",
        "And once you see the return phase visually, the whole thing finally clicks.",
        "Alright, Binary Search Tree. One simple rule — smaller values go left, larger values go right.",
        "Right now our root is fifty. Thirty is on the left, seventy on the right, and below thirty we already have twenty and forty.",
        "Now let's insert thirty-five.",
    ], params={"temperature": 0.92}),
    StepNarration(1, [
        "The public insert function just calls a recursive helper. So we start at node fifty.",
        "First question — is this node null? No. So now we compare.",
    ], params={"temperature": 0.80}),
    StepNarration(2, [
        "Thirty-five is smaller than fifty… so we move left.",
        "That means the value belongs somewhere inside the left subtree. Now recursion takes us to thirty.",
    ], params={"temperature": 0.82}),
    StepNarration(3, [
        "At node thirty now.",
        "Thirty-five is greater than thirty… so this time we go right. And we land on forty.",
    ], params={"temperature": 0.82}),
    StepNarration(4, [
        "Now watch carefully. Thirty-five is smaller than forty… so we try going left.",
        "But forty doesn't even have a left child [sigh].",  # sigh suffix — verified working
    ], params={"temperature": 0.85}),
    StepNarration(5, [
        "[gasp] And there it is — null.",  # gasp prefix — verified working
        "That's the base case. This is exactly where the new node should be created.",
        "So recursion creates a brand new node containing thirty-five… and returns it.",
    ], params={"temperature": 0.92}),
    StepNarration(6, [
        "Now comes the important part.",
        "That returned node bubbles back up the recursive calls… and gets attached to forty's left pointer automatically.",
        "We never manually connected thirty-five ourselves.",
        "[chuckle]",                                          # was inline-suffix — moved to solo
        "Recursion handled the insertion during the return phase.",
        "And just like that… thirty-five is now part of the BST.",
    ], params={"temperature": 0.95}),
    StepNarration(7, [
        "Now let's look at a completely empty tree. No root. Nothing.",
        "What happens if we insert ten?",
    ], params={"temperature": 0.88}),
    StepNarration(8, [
        "insertRec gets called immediately with null. Same base case as before.",
        "But this time it happens at the very top. No comparisons. No moving left or right. Nothing.",
    ], params={"temperature": 0.85}),
    StepNarration(9, [
        "So recursion creates the new node… returns it… and that returned node becomes the root itself.",
        "That's the cool part. The exact same recursive logic handled a deep insertion and a completely empty tree.",
        "One base case covers everything.",
        "[chuckle]",                                          # was inline-mid — moved to solo
    ], params={"temperature": 0.95}),
    StepNarration(10, [
        "Alright, last case. What if we try inserting a duplicate? Let's insert forty again.",
    ], params={"temperature": 0.88}),
    StepNarration(11, [
        "Forty starts at the root. Forty is smaller than fifty — so we go left.",
    ], params={"temperature": 0.80}),
    StepNarration(12, [
        "Now at node thirty. Forty is greater than thirty — so this time we go right.",
    ], params={"temperature": 0.80}),
    StepNarration(13, [
        "And we land on node forty.",
        "Here's the key moment — forty equals forty. Neither the less-than condition nor the greater-than condition fires.",
    ], params={"temperature": 0.90}),
    StepNarration(14, [
        "So neither branch runs. The recursion simply returns the current node… unchanged.",
        "No new node gets created. That means this BST ignores duplicates silently.",
        "[chuckle]",                                          # was inline-suffix — moved to solo
    ], params={"temperature": 0.85}),
    StepNarration(15, [
        "And that's BST insertion.",
        "At every step, recursion just asks one question: left or right?",
        "Eventually it hits null… creates the node… and the return phase reconnects everything automatically.",
        "Time complexity is O of h — O of log n in a balanced tree, O of n in the worst case.",
        "And honestly, once the return phase clicks, BST insertion suddenly feels way simpler.",
        "[laugh]",                                            # was inline-mid w/ ellipsis — moved to solo
    ], params={"temperature": 0.95}),
]


# All registered scenes. Add new scenes here as their narration tables are written.
ALL_SCENES: dict[str, list[StepNarration]] = {
    "bst-insert": BST_INSERT_NARRATION,
}


# ============================================================================
# Helpers
# ============================================================================

def pick_device() -> str:
    """Prefer CUDA → MPS → CPU."""
    try:
        import torch
    except ImportError:
        return "cpu"
    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def set_seed(seed: int) -> None:
    import random
    import numpy as np
    import torch
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def ffprobe_duration(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())


def wav_to_mp3(wav: Path, mp3: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-q:a", "2", str(mp3)],
        check=True, capture_output=True,
    )


def make_silence_mp3(out_path: Path, duration_s: float, sample_rate: int = 24000) -> None:
    """Generate a silent mp3 of the requested duration."""
    subprocess.run(
        ["ffmpeg", "-y",
         "-f", "lavfi", "-i", f"anullsrc=r={sample_rate}:cl=mono",
         "-t", f"{duration_s}", "-codec:a", "libmp3lame", "-q:a", "2",
         str(out_path)],
        check=True, capture_output=True,
    )


def concat_mp3s(out_path: Path, chunk_paths: list[Path], silence_path: Path) -> None:
    """Concat chunk mp3s with a silence file inserted between each pair."""
    list_file = out_path.with_suffix(".concat.txt")
    lines = []
    for i, p in enumerate(chunk_paths):
        if i > 0:
            lines.append(f"file '{silence_path.resolve()}'")
        lines.append(f"file '{p.resolve()}'")
    list_file.write_text("\n".join(lines) + "\n")
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
             "-i", str(list_file),
             "-codec:a", "libmp3lame", "-q:a", "2",
             str(out_path)],
            check=True, capture_output=True,
        )
    finally:
        list_file.unlink(missing_ok=True)


def warn_unknown_tags(text: str) -> None:
    import re
    for tag in re.findall(r"\[[a-zA-Z][a-zA-Z _-]*\]", text):
        if tag not in OFFICIAL_TURBO_TAGS:
            print(f"    ⚠ tag {tag} is not in the documented Turbo tag set — may be ignored or spoken")


def warn_long_chunk(text: str) -> None:
    if len(text) > TURBO_MAX_CHARS_RECOMMENDED:
        print(f"    ⚠ chunk is {len(text)} chars (Turbo demo caps at {TURBO_MAX_CHARS_RECOMMENDED}); "
              f"consider splitting at a sentence boundary")


@dataclass
class ChunkTiming:
    gen_s: float       # Turbo sampling + WAV save + mp3 transcode
    audio_s: float     # output audio duration


def synth_chunk(model, text: str, out_mp3: Path, *,
                temperature: float, top_p: float, top_k: int,
                repetition_penalty: float, seed: int | None) -> ChunkTiming:
    """Generate one chunk's mp3 via Turbo. Returns wall time + audio duration."""
    import torchaudio
    if seed is not None:
        set_seed(seed)
    warn_long_chunk(text)
    warn_unknown_tags(text)
    t0 = time.perf_counter()
    wav = model.generate(
        text=text,
        temperature=temperature,
        top_p=top_p,
        top_k=top_k,
        repetition_penalty=repetition_penalty,
    )
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav = Path(tmp.name)
    try:
        torchaudio.save(str(tmp_wav), wav, model.sr)
        wav_to_mp3(tmp_wav, out_mp3)
    finally:
        tmp_wav.unlink(missing_ok=True)
    gen_s = time.perf_counter() - t0
    return ChunkTiming(gen_s=gen_s, audio_s=ffprobe_duration(out_mp3))


# ============================================================================
# Per-scene runner
# ============================================================================

@dataclass
class StepBench:
    step: int
    chunks: int
    gen_s: float          # sum of per-chunk wall times
    concat_s: float       # ffmpeg concat wall time
    audio_s: float        # final step audio duration
    skipped: bool = False

    @property
    def total_s(self) -> float:
        return self.gen_s + self.concat_s


@dataclass
class SceneBench:
    scene_id: str
    steps: list[StepBench] = field(default_factory=list)

    @property
    def total_gen_s(self) -> float:
        return sum(s.gen_s for s in self.steps)

    @property
    def total_concat_s(self) -> float:
        return sum(s.concat_s for s in self.steps)

    @property
    def total_audio_s(self) -> float:
        return sum(s.audio_s for s in self.steps)

    @property
    def chunks_generated(self) -> int:
        return sum(s.chunks for s in self.steps if not s.skipped)


def fmt_mmss(seconds: float) -> str:
    m, s = divmod(int(round(seconds)), 60)
    return f"{m:d}:{s:02d}"


def generate_scene(model, scene_id: str, narration: list[StepNarration], *,
                   only_steps: set[int] | None, force: bool, seed: int | None,
                   keep_chunks: bool) -> SceneBench:
    out_dir = PUBLIC_NARRATION_ROOT / scene_id
    out_dir.mkdir(parents=True, exist_ok=True)
    chunks_dir = out_dir / "_chunks"
    chunks_dir.mkdir(parents=True, exist_ok=True)

    silence_path = chunks_dir / f"_silence-{int(INTER_CHUNK_SILENCE_S * 1000)}ms.mp3"
    if not silence_path.exists():
        make_silence_mp3(silence_path, INTER_CHUNK_SILENCE_S)

    print(f"\nScene: {scene_id}")
    print("=" * 60)

    durations: list[dict] = []
    chunk_meta: list[dict] = []
    bench = SceneBench(scene_id=scene_id)

    for step in narration:
        if only_steps is not None and step.step not in only_steps:
            # Preserve existing duration for unchanged steps so durations.json stays complete
            existing = out_dir / f"step-{step.step}.mp3"
            if existing.exists():
                dur = ffprobe_duration(existing)
                durations.append({"step": step.step,
                                   "duration": round(dur, 3),
                                   "frames": math.ceil(dur * FPS)})
            continue

        step_mp3 = out_dir / f"step-{step.step}.mp3"
        if step_mp3.exists() and not force:
            print(f"  step {step.step:02d} [skip — already exists; --force to overwrite]")
            dur = ffprobe_duration(step_mp3)
            durations.append({"step": step.step,
                               "duration": round(dur, 3),
                               "frames": math.ceil(dur * FPS)})
            bench.steps.append(StepBench(step=step.step, chunks=len(step.chunks),
                                          gen_s=0.0, concat_s=0.0,
                                          audio_s=dur, skipped=True))
            continue

        params = step.effective_params
        print(f"  step {step.step:02d}  {len(step.chunks)} chunks  "
              f"temp={params['temperature']} top_p={params['top_p']} top_k={params['top_k']}")

        chunk_paths: list[Path] = []
        step_gen_s = 0.0
        for idx, chunk_text in enumerate(step.chunks):
            chunk_mp3 = chunks_dir / f"step-{step.step:02d}-{idx:02d}.mp3"
            preview = chunk_text[:60] + ("…" if len(chunk_text) > 60 else "")
            print(f"    chunk {idx} ({len(chunk_text)} chars): {preview!r}")
            ct = synth_chunk(model, chunk_text, chunk_mp3,
                              temperature=params["temperature"],
                              top_p=params["top_p"],
                              top_k=params["top_k"],
                              repetition_penalty=params["repetition_penalty"],
                              seed=seed)
            step_gen_s += ct.gen_s
            chunk_paths.append(chunk_mp3)
            chunk_meta.append({
                "step": step.step,
                "chunk": idx,
                "text": chunk_text,
                "duration_s": round(ct.audio_s, 3),
                "gen_s": round(ct.gen_s, 3),
                "mp3": str(chunk_mp3.relative_to(out_dir)),
            })
            print(f"      gen {ct.gen_s:.1f}s  →  {ct.audio_s:.2f}s audio "
                  f"({ct.gen_s / ct.audio_s:.1f}× realtime)")

        # Concat all chunks for this step into step-N.mp3
        t_concat = time.perf_counter()
        concat_mp3s(step_mp3, chunk_paths, silence_path)
        concat_s = time.perf_counter() - t_concat

        total_dur = ffprobe_duration(step_mp3)
        frames = math.ceil(total_dur * FPS)
        durations.append({"step": step.step, "duration": round(total_dur, 3), "frames": frames})
        bench.steps.append(StepBench(step=step.step, chunks=len(step.chunks),
                                      gen_s=step_gen_s, concat_s=concat_s,
                                      audio_s=total_dur))
        print(f"    -> {step_mp3.name} ({total_dur:.2f}s audio, {frames} frames)  "
              f"[step took {step_gen_s + concat_s:.1f}s wall, "
              f"{(step_gen_s + concat_s) / total_dur:.1f}× realtime]")

    durations.sort(key=lambda d: d["step"])
    (out_dir / "durations.json").write_text(json.dumps(durations, indent=2))
    (out_dir / "chunks.json").write_text(json.dumps({
        "scene": scene_id,
        "inter_chunk_silence_s": INTER_CHUNK_SILENCE_S,
        "voice_ref": REFERENCE_WAV,
        "seed": seed,
        "defaults": TURBO_DEFAULTS,
        "chunks": chunk_meta,
    }, indent=2, ensure_ascii=False))

    if not keep_chunks:
        shutil.rmtree(chunks_dir, ignore_errors=True)

    # Summary
    print(f"\nDuration summary for {scene_id}:")
    total_frames = 0
    for d in durations:
        print(f"  step {d['step']:02d}: {d['duration']:.2f}s ({d['frames']} frames)")
        total_frames += d["frames"]
    print(f"  total audio: {total_frames} frames ({total_frames / FPS:.1f}s)")

    print("\nSuggested startFrame values (10-frame buffer between steps):")
    sf = 0
    for d in durations:
        print(f"  step {d['step']:02d}: startFrame: {sf}")
        sf += d["frames"] + 10
    print(f"  total scene frames: {sf}")
    print(f"\nNext: .venv/bin/python scripts/apply-narration-updates.py {scene_id}")
    return bench


# ============================================================================
# CLI
# ============================================================================

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0],
                                  formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("scene", nargs="*",
                    help=f"Scene ID(s). Omit for all registered scenes. "
                         f"Available: {', '.join(ALL_SCENES.keys())}")
    ap.add_argument("--step", type=int, action="append", default=None,
                    help="Generate only this step (can be passed multiple times). "
                         "Default: all steps for the chosen scene(s).")
    ap.add_argument("--force", "-f", action="store_true",
                    help="Overwrite existing step-N.mp3 files. Without this, existing files are kept.")
    ap.add_argument("--seed", type=int, default=None,
                    help="RNG seed applied before each chunk for reproducibility.")
    ap.add_argument("--reference", type=str, default=REFERENCE_WAV,
                    help=f"Reference voice WAV (default: {REFERENCE_WAV})")
    ap.add_argument("--keep-chunks", action="store_true",
                    help="Preserve the per-chunk mp3s under public/narration/<sceneId>/_chunks/ "
                         "for debugging. By default, the chunks directory is cleaned after concat.")
    args = ap.parse_args()

    if args.scene:
        unknown = set(args.scene) - set(ALL_SCENES.keys())
        if unknown:
            print(f"Unknown scene(s): {', '.join(sorted(unknown))}")
            print(f"Available: {', '.join(ALL_SCENES.keys())}")
            sys.exit(1)
        scene_ids = args.scene
    else:
        scene_ids = list(ALL_SCENES.keys())

    only_steps = set(args.step) if args.step else None

    reference = Path(args.reference)
    if not reference.exists():
        print(f"Reference WAV not found: {reference}")
        sys.exit(1)

    t_wall_start = time.perf_counter()
    print(f"Loading ChatterboxTurboTTS (first run downloads ~1.5 GB)…")
    from chatterbox.tts_turbo import ChatterboxTurboTTS
    device = pick_device()
    print(f"Device: {device}")
    t_load = time.perf_counter()
    model = ChatterboxTurboTTS.from_pretrained(device=device)
    load_s = time.perf_counter() - t_load
    print(f"Model loaded in {load_s:.1f}s")

    print(f"Caching conditionals from {reference}…")
    t_conds = time.perf_counter()
    model.prepare_conditionals(str(reference))
    conds_s = time.perf_counter() - t_conds
    print(f"Conditionals cached in {conds_s:.1f}s")

    benches: list[SceneBench] = []
    for scene_id in scene_ids:
        b = generate_scene(model, scene_id, ALL_SCENES[scene_id],
                           only_steps=only_steps, force=args.force,
                           seed=args.seed, keep_chunks=args.keep_chunks)
        benches.append(b)

    wall_s = time.perf_counter() - t_wall_start

    # ===== Final benchmark summary =====
    print("\n" + "=" * 60)
    print("Benchmark")
    print("=" * 60)
    print(f"Device:                  {device}")
    print(f"Model load:              {load_s:6.1f}s")
    print(f"Reference conditioning:  {conds_s:6.1f}s")
    print()
    for b in benches:
        print(f"Scene: {b.scene_id}")
        print(f"  {'step':<6} {'chunks':<7} {'gen':<8} {'concat':<8} {'audio':<8} {'×realtime':<10}")
        for s in b.steps:
            mark = " [skip]" if s.skipped else ""
            ratio = (s.gen_s + s.concat_s) / s.audio_s if s.audio_s > 0 and not s.skipped else 0.0
            print(f"  {s.step:<6} {s.chunks:<7} "
                  f"{s.gen_s:>6.1f}s {s.concat_s:>6.2f}s "
                  f"{s.audio_s:>6.2f}s "
                  f"{ratio:>6.2f}×{mark}")
        if b.chunks_generated > 0:
            print(f"  ── totals ──")
            print(f"  generation:  {b.total_gen_s:6.1f}s ({fmt_mmss(b.total_gen_s)})")
            print(f"  concat:      {b.total_concat_s:6.2f}s")
            print(f"  audio out:   {b.total_audio_s:6.2f}s ({fmt_mmss(b.total_audio_s)})")
            print(f"  throughput:  {b.total_audio_s / b.total_gen_s:.2f}× realtime "
                  f"({b.total_gen_s / b.total_audio_s:.1f}s real per 1s audio, "
                  f"{b.total_gen_s / b.chunks_generated:.1f}s/chunk avg)")
        print()
    print(f"Wall time (total):       {wall_s:6.1f}s  ({fmt_mmss(wall_s)})")
    print()
    print("Done.")


if __name__ == "__main__":
    main()
