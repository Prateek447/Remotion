#!/usr/bin/env python3
"""Reproducibility tester for the Hmm family — tone-mapping study.

# History

## Round 1 — initial 34-variant lab (see lab.py)
User listened to all 34 variants and shortlisted three that sounded natural:
- `03-um_medium` ("Ummmm")
- `09-mmmmm`     ("Mmmmm")
- `Hmm`          (pre-confirmed before the lab)

## Round 2 — first reproducibility test (this script, prior version)
At temperature 0.95 (peak preset), 5 random-seed takes per variant:
- Ummmm: **0/5 reliable** — all 5 read literally → DROPPED
- Mmmmm: **0/5 reliable** — all 5 read literally → DROPPED
- Hmm:   **4/5 reliable** — one take misfired → marginal

Verdict: repeated-letter elongation does not work in base Chatterbox. The
original lab's "natural" takes for Ummmm/Mmmmm were happy-accident
single-seed generations, not reproducible behavior. This matches
[Issue #97](https://github.com/resemble-ai/chatterbox/issues/97) — short
isolated inputs (Hi!, Why?, Yes, No — and apparently Ummmm/Mmmmm too)
produce gibberish/hallucinations.

## Round 3 — this version: stabilize Hmm + map spelling to tone

Two questions to answer in one run:

1. **Stabilize**: Does lowering temperature from 0.95 to 0.85 push `Hmm`
   reliability from 4/5 to 5/5? (Production bar.)

2. **Tone control**: At a stable temperature, do `Hmm` / `Hmmm` / `Hmmmm`
   produce audibly different *durations* — short / medium / long thinking
   pause, as the user requested?

If question 2 yields a clear spelling→duration mapping, the design system
gets per-filler tone presets (`hmm-short`, `hmm-medium`, `hmm-long`). If it
doesn't, `Hmm` is just one filler and tone variance has to come from
surrounding ellipses or `[pause:Xs]` markers.

# Bar

5/5 takes consistent at the chosen temperature. A single literal-reading
failure across 5 random seeds = 20% failure rate = unacceptable for
production where this filler appears across many scenes.

Bypasses scene.yaml machinery — bare Chatterbox calls. Uses the same knob
matrix as `pipeline/stages/05-audio/generate.py`.

Usage:
    # Default: 5 takes per variant at teacher-energetic peak knobs
    python3 pipeline/experiments/filler-lab/repro.py

    # More takes for finer-grained reliability signal
    python3 pipeline/experiments/filler-lab/repro.py --takes 10

    # Lower temperature to test if it stabilizes marginal variants
    python3 pipeline/experiments/filler-lab/repro.py --temperature 0.85
    python3 pipeline/experiments/filler-lab/repro.py --temperature 0.75

    # Test under measured-methodical knobs instead
    python3 pipeline/experiments/filler-lab/repro.py --persona measured --arc methodical

Output: pipeline/experiments/filler-lab/repro-output/<variant>-t<TT>-take-<NN>.mp3
where TT = temperature × 100 (so takes at different temperatures don't collide).
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


# ─── Hmm-family variants for stability + tone study ─────────────────────────
#
# Round 2 of this script eliminated Ummmm and Mmmmm (0/5 reliability at temp
# 0.95). The Hmm family is the only filler with any reproducibility signal.
# This round tests three spellings simultaneously to answer:
#
#   - Stability: does Hmm hit 5/5 at lower temperature?
#   - Tone: do the longer spellings produce audibly longer durations?
#
# Same sentence template across all variants — only the filler spelling
# varies. This isolates filler rendering from surrounding context effects.

VARIANTS = [
    ("hmm",    "Node four combines. Hmm — one plus zero plus zero… returns one."),
    ("hmmm",   "Node four combines. Hmmm — one plus zero plus zero… returns one."),
    ("hmmmm",  "Node four combines. Hmmmm — one plus zero plus zero… returns one."),
]


# ─── audio gen helpers (same shape as lab.py) ────────────────────────────────

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
    ap.add_argument("--takes", type=int, default=5,
                    help="Number of takes per variant (default: 5)")
    ap.add_argument("--persona", default="teacher-energetic",
                    choices=list(PRESETS.keys()))
    ap.add_argument("--arc", default="peak",
                    choices=["opening", "methodical", "peak", "closing"],
                    help="Which arc's knob triple to use (default: peak — heaviest prosody)")
    ap.add_argument("--temperature", type=float, default=None,
                    help="Override temperature (default: use persona×arc preset)")
    ap.add_argument("--reference", default=DEFAULT_REFERENCE_WAV,
                    help=f"Reference WAV for voice cloning (default: {DEFAULT_REFERENCE_WAV})")
    ap.add_argument("--force", action="store_true",
                    help="Overwrite existing takes")
    args = ap.parse_args()

    knobs = dict(PRESETS[args.persona][args.arc])
    if args.temperature is not None:
        knobs["temperature"] = args.temperature

    # Temperature tag so re-runs at different temps don't collide.
    t_tag = f"t{int(round(knobs['temperature'] * 100)):02d}"

    print(f"Persona: {args.persona}  Arc: {args.arc}")
    print(f"Knobs:   exaggeration={knobs['exaggeration']}  "
          f"cfg_weight={knobs['cfg_weight']}  temperature={knobs['temperature']}")
    print(f"Variants: {len(VARIANTS)} × {args.takes} takes = "
          f"{len(VARIANTS) * args.takes} generations")
    print(f"Output suffix: -{t_tag}-take-NN.mp3")

    out_dir = Path("pipeline/experiments/filler-lab/repro-output")
    out_dir.mkdir(parents=True, exist_ok=True)

    # Build full plan, skipping existing files unless --force
    plan = []
    for label, sentence in VARIANTS:
        for take in range(1, args.takes + 1):
            out_path = out_dir / f"{label}-{t_tag}-take-{take:02d}.mp3"
            if out_path.exists() and not args.force:
                print(f"  [skip] {out_path.name} (exists; --force to regenerate)")
            else:
                plan.append((label, sentence, take, out_path))

    if not plan:
        print("\nNothing to generate. Use --force to regenerate existing takes.")
        return

    print(f"\nLoading Chatterbox (first run downloads ~1.5GB)…")
    from chatterbox.tts import ChatterboxTTS
    device = "cuda" if _has_cuda() else "cpu"
    print(f"Device: {device}")
    model = ChatterboxTTS.from_pretrained(device=device)
    print("Model loaded.\n")

    reference = args.reference if Path(args.reference).exists() else None
    if not reference:
        print(f"⚠  Reference {args.reference} not found — using default Chatterbox voice\n")

    for i, (label, sentence, take, out_path) in enumerate(plan, 1):
        print(f"[{i:3d}/{len(plan)}] {label}  take {take:02d}")
        print(f"             text: {sentence}")
        generate(model, sentence, str(out_path), reference,
                 knobs["exaggeration"], knobs["cfg_weight"], knobs["temperature"])
        print(f"             → {out_path}")

    print(f"\n✅ Done. {len(plan)} takes generated.\n")
    print(f"Listen by variant. For each variant ask TWO questions:")
    print(f"")
    print(f"  1. STABILITY: how many of the 5 takes render naturally (elongated")
    print(f"     filler sound) vs literally (the word read as text)?")
    print(f"     Bar: 5/5. Anything less = 20%+ failure rate, unacceptable for")
    print(f"     production.")
    print(f"")
    print(f"  2. TONE: compare across variants. Does the duration grow with the")
    print(f"     spelling length?")
    print(f"       Hmm    → short thinking pause (quick acknowledgment)")
    print(f"       Hmmm   → medium thought (considered)")
    print(f"       Hmmmm  → deep contemplation (long deliberation)")
    print(f"     If yes → spelling-based tone control works → 3 named presets.")
    print(f"     If no  → tone control has to come from `[pause:Xs]` markers.")
    print(f"")
    print(f"Listen by variant:")
    for label, _ in VARIANTS:
        print(f"  ls -1 {out_dir}/{label}-{t_tag}-take-*.mp3")
    print(f"")
    print(f"If marginal at temperature={knobs['temperature']}, re-run lower:")
    if knobs["temperature"] > 0.85:
        print(f"  python3 pipeline/experiments/filler-lab/repro.py --temperature 0.85")
    if knobs["temperature"] > 0.75:
        print(f"  python3 pipeline/experiments/filler-lab/repro.py --temperature 0.75")


if __name__ == "__main__":
    main()
