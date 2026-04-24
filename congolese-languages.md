# Findings: Speech Recognition Datasets for Congolese Languages

Scope reviewed end-to-end:
- `Speech Recognition Datasets for Congolese Languages/CSRC/raw_data`
- `Speech Recognition Datasets for Congolese Languages/LRSC/lingala`

## 1) What is in the folder

Two dataset groups are present:
- **CSRC**: mostly raw/unlabeled audio collection + preprocessing scripts/notebooks.
- **LRSC (lingala)**: labeled train/valid split with manifests and transcripts.

## 2) LRSC (lingala) observations

### Dataset shape
- Train audio files: **2557**
- Valid audio files: **383**
- Train transcripts: **2557** lines
- Valid transcripts: **383** lines
- Manifest files include: `train.tsv`, `valid.tsv`, `train.wrd`, `valid.wrd`, `train.ltr`, `valid.ltr`, `dict.ltr.txt`.

### Important technical details
- `train.tsv` and `valid.tsv` first line uses absolute path roots like `/home/ubuntu/...`, so path rewriting is needed on Windows/local runs.
- Transcript text is primarily Lingala but contains visible French/code-switch lexical insertions (examples include `dejà`, `coop`, `ambassade`, `taxi`, `ville`, `banque commerciale`).
- Character dictionary contains special characters and punctuation (`ɔ`, `ɛ`, `ε`, apostrophes, hyphen, pipe, digits), which is useful for tokenizer/vocabulary design.

### Relevance to this project
- This is the most immediately usable **labeled** resource for Lingala-side evaluation.
- It can support:
	- Lingala ASR baseline,
	- token/LID sanity checks for generated French-Lingala (+Swahili sprinkle) outputs,
	- pronunciation and orthography checks for Lingala tokens in synthetic text/audio.

## 3) CSRC raw_data observations

### Dataset shape
- Total files in `CSRC/raw_data`: **1619**
- Audio files (`.wav`/`.mp3`): **1600**
- Notebooks: **8**
- Text-like metadata files found: effectively **1** (`lingala/lingala.txt` with YouTube IDs).

### Language coverage in raw collection
- Congolese Swahili
- Lingala
- Kikongo
- Tshiluba

### Pipeline documented in CSRC
From `pret_scripts/readme.md` and scripts:
1. Download (YouTube IDs or Radio Archive).
2. Convert/normalize audio (16 kHz, mono expected by VAD script).
3. VAD segmentation (`vad.py`, WebRTC VAD).
4. SNR filtering (`snr_filter.py`, low-SNR files moved to `snr_rejected`).
5. Chunking (`chunking.py`, long files chunked).

### Concrete processing behavior (important)
- **VAD assumptions**: mono channel, 16-bit PCM, **16 kHz**.
- **SNR threshold**: files with estimated SNR < **15 dB** are moved to `snr_rejected/<language>`.
- **Chunking rule**: files longer than 25 seconds are split into 20-second chunks and exported with prefix `broken-...`; original long file is removed.

### Data state caveat
- In `data_refined`, many files start with `broken-`; this is largely a chunking artifact, not automatically a corruption indicator.
- Radio archive source coverage is imbalanced in current snapshot:
	- `RA_ln`: 27 mp3
	- `RA_swc`: 20 mp3
	- `RA_kon`: 10 mp3
	- `RA_tshi`: 0 mp3

### Relevance to this project
- CSRC is mainly **unlabeled acoustic data** in current form.
- Strong fit for:
	- acoustic pretraining or adaptation,
	- noise/robustness augmentation source,
	- language-conditioned audio style mining.
- Weak fit for direct supervised ASR benchmarking unless aligned transcripts are created.

## 4) What this means for your dual-track synthesis project

Project tracks:
1. French-Swahili focus + Lingala sprinkle
2. French-Lingala focus + Swahili sprinkle

### Recommended usage mapping
- Use **LRSC Lingala** as labeled benchmark anchor for Lingala-side metrics (especially Track 2).
- Use **CSRC raw_data** as unlabeled audio source for robustness/domain adaptation, not as primary supervised benchmark.

### Baseline metric implications
- Track-specific baselines (A and B) should be computed on your synthetic sets as planned.
- For external reality checks:
	- Lingala checks can leverage LRSC labels directly.
	- Swahili checks may need additional labeled Swahili corpora beyond current CSRC snapshot.

## 5) Practical integration notes before training/evaluation

1. Rewrite LRSC manifest root paths (`/home/ubuntu/...`) to local workspace paths.
2. Standardize all audio to 16 kHz mono before mixing sources.
3. Treat `broken-*.wav` as chunked segments; do not auto-drop them without listening/QC.
4. Keep CSRC `snr_rejected` excluded from training unless explicitly used for robustness experiments.
5. Run text normalization rules that preserve Lingala special characters (`ɔ`, `ɛ`, `ε`) to avoid lexical distortion.

## Bottom line

- **LRSC/lingala** is your strongest immediate supervised evaluation resource.
- **CSRC/raw_data** is best viewed as a multilingual unlabeled acoustic reservoir with a clear preprocessing pipeline.
- This combination is compatible with your dual-track synthetic plan, but supervised baseline strength will currently be better on the Lingala side than on the Swahili side unless additional labeled Swahili references are added.
