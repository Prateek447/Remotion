#!/usr/bin/env python3
"""Filler-lab: empirically test how Chatterbox renders different filler spellings.

User report (the motivating bug): "model speaks 'Um' literally instead of the
natural expected 'Ummmmm' sound."

This script generates one MP3 per filler variant against the same sentence
template, same knobs. The user listens to each in numerical order and
identifies which spellings produce natural elongated filler sounds vs which
read as the literal word. Winners get locked into
`pipeline/design-system/teaching.md` "Natural prosody" filler vocabulary.

Bypasses scene.yaml machinery — no validate/scaffold/apply. Just bare
Chatterbox calls for fast iteration. Uses the same knob matrix as
`pipeline/stages/05-audio/generate.py` so results are representative of
real-pipeline audio.

Usage:
    # Run all categories
    python3 pipeline/experiments/filler-lab/lab.py

    # Run a single category
    python3 pipeline/experiments/filler-lab/lab.py --only um
    python3 pipeline/experiments/filler-lab/lab.py --only ah
    python3 pipeline/experiments/filler-lab/lab.py --only orientation

    # Test under different knobs
    python3 pipeline/experiments/filler-lab/lab.py --persona measured --arc methodical

Output: pipeline/experiments/filler-lab/output/NN-<label>.mp3
"""

import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path


# ─── knob matrix (must match pipeline/stages/05-audio/generate.py) ───────────

PRESETS = {
    "teacher-energetic": {
        "opening":    {"exaggeration": 0.60, "cfg_weight": 0.55, "temperature": 0.90},
        "methodical": {"exaggeration": 0.55, "cfg_weight": 0.60, "temperature": 0.88},
        "peak":       {"exaggeration": 0.80, "cfg_weight": 0.40, "temperature": 0.95},
        "closing":    {"exaggeration": 0.70, "cfg_weight": 0.50, "temperature": 0.92},
    },
    "measured": {
        "opening":    {"exaggeration": 0.50, "cfg_weight": 0.60, "temperature": 0.85},
        "methodical": {"exaggeration": 0.35, "cfg_weight": 0.65, "temperature": 0.80},
        "peak":       {"exaggeration": 0.65, "cfg_weight": 0.50, "temperature": 0.92},
        "closing":    {"exaggeration": 0.55, "cfg_weight": 0.55, "temperature": 0.88},
    },
}

DEFAULT_REFERENCE_WAV = "scripts/my-voice.wav"


# ─── experiment variants ─────────────────────────────────────────────────────
#
# Each entry: (category, label, full sentence text)
# - "category" lets the user run subsets via --only
# - "label" becomes the MP3 filename suffix
# - "full sentence" is what Chatterbox synthesizes
#
# IMPORTANT: keep the surrounding sentence identical across variants in a
# category. The ONLY variable should be the filler spelling. Otherwise we
# can't isolate the effect.

EXPERIMENTS = [
    # ── "Um" — the user's specific complaint ─────────────────────────────────
    ("um", "01-um_baseline",        "Node four combines. Um — one plus zero plus zero… returns one."),
    ("um", "02-um_mild",            "Node four combines. Umm — one plus zero plus zero… returns one."),
    ("um", "03-um_medium",          "Node four combines. Ummmm — one plus zero plus zero… returns one."),
    ("um", "04-um_long",            "Node four combines. Ummmmmm — one plus zero plus zero… returns one."),
    ("um", "05-uh_baseline",        "Node four combines. Uh — one plus zero plus zero… returns one."),
    ("um", "06-uh_medium",          "Node four combines. Uhhh — one plus zero plus zero… returns one."),
    ("um", "07-uh_long",            "Node four combines. Uhhhhh — one plus zero plus zero… returns one."),
    ("um", "08-mmm",                "Node four combines. Mmm — one plus zero plus zero… returns one."),
    ("um", "09-mmmmm",              "Node four combines. Mmmmm — one plus zero plus zero… returns one."),
    ("um", "10-pause_only",         "Node four combines… one plus zero plus zero… returns one."),
    ("um", "11-emdash_only",        "Node four combines — one plus zero plus zero… returns one."),

    # ── "Ah" — the realization moment at a peak ──────────────────────────────
    ("ah", "20-ah_baseline",        "And that gives us… ah, seven!"),
    ("ah", "21-ahh",                "And that gives us… ahh, seven!"),
    ("ah", "22-ahhh",               "And that gives us… ahhh, seven!"),
    ("ah", "23-aha",                "And that gives us… aha, seven!"),
    ("ah", "24-oh",                 "And that gives us… oh, seven!"),
    ("ah", "25-ooh",                "And that gives us… ooh, seven!"),
    ("ah", "26-yes",                "And that gives us… yes, seven!"),
    ("ah", "27-pause_only",         "And that gives us… seven!"),

    # ── "Hmm" — curiosity at a base case ─────────────────────────────────────
    ("hmm", "40-hmm_baseline",      "Node four. Recurse left… hmm — but there is no left child."),
    ("hmm", "41-hmmm",              "Node four. Recurse left… hmmm — but there is no left child."),
    ("hmm", "42-hmmmm",             "Node four. Recurse left… hmmmm — but there is no left child."),
    ("hmm", "43-pause_only",        "Node four. Recurse left… but there is no left child."),
    ("hmm", "44-wait",              "Node four. Recurse left… wait — there is no left child."),

    # ── "Okay" / "Right" / "Alright" — orientation openers ───────────────────
    ("orientation", "60-okay",      "Okay, so… back at the root. Let's combine the children."),
    ("orientation", "61-right",     "Right, so… back at the root. Let's combine the children."),
    ("orientation", "62-alright",   "Alright, so… back at the root. Let's combine the children."),
    ("orientation", "63-so",        "So… back at the root. Let's combine the children."),
    ("orientation", "64-now",       "Now… back at the root. Let's combine the children."),

    # ── Pause-only baseline (no fillers, just ellipses + em-dashes) ──────────
    ("pause", "80-ellipsis_short",  "Node four combines. One plus zero plus zero. Returns one."),
    ("pause", "81-ellipsis_med",    "Node four combines… one plus zero plus zero… returns one."),
    ("pause", "82-ellipsis_heavy",  "Node four combines… one plus zero plus zero. Returns… one."),
    ("pause", "83-three_dots",      "Node four combines... one plus zero plus zero... returns one."),
    ("pause", "84-em_dashes",       "Node four combines — one plus zero plus zero — returns one."),
]

CATEGORIES = sorted({c for c, *_ in EXPERIMENTS})


# ─── audio gen helpers ───────────────────────────────────────────────────────

def _has_cuda() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except ImportError:
        return False


def wav_to_mp3(wav_path: str, mp3_path: str) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path, "-codec:a", "libmp3lame", "-q:a", "2", mp3_path],
        check=True, capture_output=True,
    )


def generate(model, text: str, out_mp3: str, reference: str | None,
             exaggeration: float, cfg_weight: float, temperature: float) -> None:
    import torchaudio
    wav = model.generate(
        text=text,
        audio_prompt_path=reference,
        exaggeration=exaggeration,
        cfg_weight=cfg_weight,
        temperature=temperature,
    )
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav = tmp.name
    try:
        torchaudio.save(tmp_wav, wav, model.sr)
        wav_to_mp3(tmp_wav, out_mp3)
    finally:
        os.unlink(tmp_wav)


# ─── CLI ─────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--only", choices=CATEGORIES + ["all"], default="all",
                    help=f"Run only one category. Available: {CATEGORIES}")
    ap.add_argument("--persona", default="teacher-energetic",
                    choices=list(PRESETS.keys()))
    ap.add_argument("--arc", default="peak",
                    choices=["opening", "methodical", "peak", "closing"],
                    help="Which arc's knob triple to use (default: peak — heaviest prosody)")
    ap.add_argument("--reference", default=DEFAULT_REFERENCE_WAV,
                    help=f"Reference WAV for voice cloning (default: {DEFAULT_REFERENCE_WAV})")
    ap.add_argument("--force", action="store_true",
                    help="Overwrite existing MP3s")
    args = ap.parse_args()

    knobs = PRESETS[args.persona][args.arc]
    print(f"Knobs: persona={args.persona} arc={args.arc} → "
          f"exaggeration={knobs['exaggeration']} cfg_weight={knobs['cfg_weight']} "
          f"temperature={knobs['temperature']}")

    selected = EXPERIMENTS if args.only == "all" else [
        e for e in EXPERIMENTS if e[0] == args.only
    ]
    print(f"Variants to generate: {len(selected)}")

    out_dir = Path("pipeline/experiments/filler-lab/output")
    out_dir.mkdir(parents=True, exist_ok=True)

    # Skip-existing pre-pass
    pending = []
    for cat, label, text in selected:
        out_path = out_dir / f"{label}.mp3"
        if out_path.exists() and not args.force:
            print(f"  [skip] {label}.mp3 (exists; --force to regenerate)")
        else:
            pending.append((cat, label, text, out_path))

    if not pending:
        print("\nNothing to generate.")
        return

    print(f"\nLoading Chatterbox (first run downloads ~1.5GB)…")
    from chatterbox.tts import ChatterboxTTS
    device = "cuda" if _has_cuda() else "cpu"
    print(f"Device: {device}")
    model = ChatterboxTTS.from_pretrained(device=device)
    print("Model loaded.\n")

    reference = args.reference if Path(args.reference).exists() else None
    if not reference:
        print(f"⚠ Reference {args.reference} not found — using default Chatterbox voice")

    for i, (cat, label, text, out_path) in enumerate(pending, 1):
        print(f"[{i:3d}/{len(pending)}] [{cat:12s}] {label}")
        print(f"             text: {text}")
        generate(model, text, str(out_path), reference,
                 knobs["exaggeration"], knobs["cfg_weight"], knobs["temperature"])
        print(f"             → {out_path}")

    print(f"\n✅ Done. {len(pending)} variants generated.\n")
    print(f"Listen to {out_dir}/*.mp3 in numerical order.")
    print(f"For each category, identify the WINNER (the spelling that produces")
    print(f"the most natural-sounding filler, not the literal word).")
    print(f"Report winners back to update teaching.md filler vocabulary.")


if __name__ == "__main__":
    main()
