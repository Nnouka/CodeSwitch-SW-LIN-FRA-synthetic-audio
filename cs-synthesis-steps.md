# CS Synthesis Reproduction Steps (Fra-Swa-Lin)

This document summarizes exactly how synthetic data is produced in `cs-synthesis.ipynb` so the pipeline can be reproduced end to end.

## 1. Environment and dependencies

1. Use Python 3.10+ in a clean environment.
2. Install core dependencies from `requirements.txt`.
3. Ensure these packages are available in the notebook kernel:
	- `numpy`, `datasets`, `huggingface_hub`, `soundfile`, `librosa`, `scipy`, `torch`, `transformers`
4. If Hugging Face stack imports fail, run the notebook’s repair command for `pyarrow`, `datasets`, and `huggingface_hub`.
5. Keep random seed fixed at 42 for reproducibility.

## 2. Input data placement

1. Put aligned parallel text files in `synthesis_inputs/`:
	- Swahili-French:
	  - `synthesis_inputs/gamayun_kit5k_fra-swc/kit5k/SWC-FRA_kit5k_sentences.SWC.txt`
	  - `synthesis_inputs/gamayun_kit5k_fra-swc/kit5k/SWC-FRA_kit5k_sentences.FRA.txt`
	- French-Lingala (optional/secondary):
	  - `synthesis_inputs/gamayun_kit5k-v1_FRA-LIN/fr-kit5k-v1/gamayun_kit5k-v1_fra-lin_FRA.txt`
	  - `synthesis_inputs/gamayun_kit5k-v1_FRA-LIN/fr-kit5k-v1/gamayun_kit5k-v1_fra-lin_LIN.txt`
2. The notebook creates output directories automatically:
	- `synthesis_outputs/text`
	- `synthesis_outputs/audio`
	- `synthesis_outputs/manifests`

## 3. Load and align source corpora

1. Read the two aligned files line-by-line and zip them into parallel pairs.
2. Keep only non-empty aligned lines.
3. Represent each pair as `lang1_sentence | lang2_sentence`.
4. If corpus files are missing, the notebook falls back to a small built-in seed set.

Code reference: `cs-synthesis.ipynb` (corpus loader cell).

```python
def load_parallel_files(lang1_path, lang2_path, lang1_code, lang2_code):
	pairs = []
	with open(lang1_path, 'r', encoding='utf-8') as f1, open(lang2_path, 'r', encoding='utf-8') as f2:
		for line1, line2 in zip(f1, f2):
			line1, line2 = line1.strip(), line2.strip()
			if line1 and line2:
				pairs.append((f"{line1} | {line2}", f"{lang1_code}-{lang2_code} parallel pair"))
	return pairs
```

## 4. Normalize and tag tokens

1. Normalize whitespace and punctuation spacing.
2. Tokenize into words and punctuation.
3. Assign lightweight language tags per token (`swa`, `fra`, `lin`, `punct`) using lexical hints and suffix heuristics.
4. Detect language switch points from adjacent non-punctuation tag transitions.
5. Compute code-switch acceptability score with these components:
	- sentence length bonus,
	- moderate fraction of non-matrix tokens,
	- moderate number of switch points.

Code reference: `cs-synthesis.ipynb` (normalization + tagging cell).

```python
def normalize_text(text: str) -> str:
	text = re.sub(r"\s*([,.;:!?])\s*", r"\1 ", text)
	text = re.sub(r"\s+", " ", text)
	return text.strip()

def guess_lang_token(tok: str) -> str:
	t = tok.lower()
	if t in LIN_HINT:
		return "lin"
	if t in FRA_HINT or any(x in t for x in ["tion", "ment", "ique", "aire", "eux"]):
		return "fra"
	return "swa"
```

## 5. Generate synthetic code-switched text

1. For each parallel pair, run Tier-1 rule generation:
	- start from Swahili sentence as matrix language,
	- replace selected positions with French lexical items,
	- optionally inject short Lingala discourse markers.
2. Run Tier-2 copy-switch bootstrap variants (`low`, `med`) from Tier-1 output.
3. Apply filtering:
	- keep only records with `cs_acceptability >= 0.72`,
	- reject toxicity-flagged rows.
4. Continue until `target_n = 9000` accepted text records.
5. Save text dataset as JSONL:
	- `synthesis_outputs/text/cs_text_dataset.jsonl`

Code reference: `cs-synthesis.ipynb` (T1/T2 generation + dataset build cells).

```python
def t1_rule_generate(sw: str, fr: str, source_id: str, matrix_lang: str = "swa") -> Dict:
	# Replace selected SW positions with FR anchors; inject short Lingala markers.
	...

def t2_copy_switch_bootstrap(rec: Dict, cs_rate: str = "med") -> Dict:
	# Create low/med switched variants from T1 output.
	...

accepted_text = generate_cs_text_dataset(gamayun_pairs, target_n=9000, min_acceptability=0.72)
```

## 6. Synthesize span-level audio

1. Initialize Hugging Face VITS models:
	- French: `facebook/mms-tts-fra`
	- Swahili: `facebook/mms-tts-swh`
	- Lingala fallback: Swahili model
2. Segment each text record into contiguous same-language spans.
3. Synthesize each span with its language model.
4. Concatenate span waveforms with 30 ms crossfade and peak normalization.
5. Resample to `16 kHz` if needed.
6. Save each clip to:
	- `synthesis_outputs/audio/cs_aud_XXXXXX.wav`
7. If model loading fails, audio stage is skipped and the pipeline still completes with text-only outputs.

Code reference: `cs-synthesis.ipynb` (HF VITS init + span synthesis cells).

```python
HF_VITS_MODEL_CANDIDATES = {
	"fra": ["facebook/mms-tts-fra"],
	"swa": ["facebook/mms-tts-swh"],
	"lin": ["facebook/mms-tts-swh"],
}

spans = contiguous_spans(row["tokens"], row["lang_tags"])
arr = _synthesize_span_to_array(tts_model, text=text, lang=lang)
wav = crossfade_concat(chunks, crossfade_ms=30)
sf.write(wav_path, wav, SAMPLE_RATE)
```

## 7. Audio quality control

1. Compute per-clip QC metrics:
	- `vad_ratio` (speech activity proxy),
	- `clipping_ratio`,
	- `boundary_artifact_score` (derivative burst proxy).
2. Mark clip as pass only if:
	- `vad_ratio > 0.60`
	- `clipping_ratio < 0.005`
3. Keep only QC-passed clips in manifest.
4. Write audio manifest:
	- `synthesis_outputs/manifests/audio_manifest.jsonl`
5. Normalize `wav_path` values to filename-only for portability.

Code reference: `cs-synthesis.ipynb` (QC + manifest normalization cells).

```python
qc_pass = qc["vad_ratio"] > 0.60 and qc["clipping_ratio"] < 0.005

with (MANIFEST_OUT / "audio_manifest.jsonl").open("w", encoding="utf-8") as f:
	for rec in validated_audio:
		f.write(json.dumps(rec, ensure_ascii=False) + "\n")

rec["wav_path"] = Path(rec["wav_path"]).name
```

## 8. Leakage-safe split creation

1. Create random splits (seeded shuffle) separately for text IDs and audio IDs:
	- train: 80%
	- dev: 10%
	- test: 10%
2. Save split mapping to:
	- `synthesis_outputs/manifests/splits.json`

Code reference: `cs-synthesis.ipynb` (split function cell).

```python
def split_ids(ids: Sequence[str], train: float = 0.8, dev: float = 0.1) -> Dict[str, List[str]]:
	ids = list(ids)
	rng.shuffle(ids)
	n_train = int(len(ids) * train)
	n_dev = int(len(ids) * dev)
	return {
		"train": ids[:n_train],
		"dev": ids[n_train:n_train + n_dev],
		"test": ids[n_train + n_dev:],
	}
```

## 9. Export dataset metadata

1. Compute summary KPIs (counts, mean acceptability, MOS proxy, WER proxy).
2. Build dataset feature schemas and checksums.
3. Build datacard (languages, license, attribution, quality targets).
4. Save:
	- `synthesis_outputs/manifests/summary.json`
	- `synthesis_outputs/manifests/hf_dataset_info.json`
	- `synthesis_outputs/manifests/DATACARD.json`

Code reference: `cs-synthesis.ipynb` (summary + datacard export cell).

```python
summary = {
	"text_records": len(accepted_text),
	"audio_records": len(validated_audio),
	"kpi": {
		"avg_cs_acceptability": ...,
		"avg_mos_proxy": ...,
		"avg_asr_backtrans_wer": ...,
	},
}

json.dump(summary, open(MANIFEST_OUT / "summary.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
```

## 10. Publishing-ready package

1. Generate release README in `synthesis_outputs/README.md`.
2. Generate checklist in `synthesis_outputs/PUBLISHING_READINESS.txt`.
3. For publication:
	- upload `synthesis_outputs/` to Hugging Face dataset repo, or
	- zip and upload the same directory to Kaggle.

Code reference: `cs-synthesis.ipynb` (README + readiness checklist cell).

```python
with (OUT / "README.md").open("w", encoding="utf-8") as f:
    f.write(readme)

with (OUT / "PUBLISHING_READINESS.txt").open("w", encoding="utf-8") as f:
    f.write("...checklist...")
```

## 11. Final reproducibility checks

1. Confirm these files exist after run:
	- `synthesis_outputs/text/cs_text_dataset.jsonl`
	- `synthesis_outputs/manifests/audio_manifest.jsonl` (may be empty if TTS unavailable)
	- `synthesis_outputs/manifests/splits.json`
	- `synthesis_outputs/manifests/DATACARD.json`
	- `synthesis_outputs/manifests/hf_dataset_info.json`
2. Spot-check a sample of text and audio outputs for linguistic quality before release.

Code reference: `cs-synthesis.ipynb` (final print/check cells).

```python
print("Accepted text records:", len(accepted_text))
print("Validated audio clips:", len(validated_audio))
print("Splits saved:", MANIFEST_OUT / "splits.json")
print("Saved summary + HF metadata + datacard in:", MANIFEST_OUT)
```
