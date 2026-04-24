# Full Code-Switch Synthesis Plan

Date: April 13, 2026  
Scope: End-to-end synthesis of two separate code-switched (CS) tracks and their combined benchmark:
- Track A: French-Swahili focus with Lingala sprinkle.
- Track B: French-Lingala focus with Swahili sprinkle.

## 1) Goal and Success Criteria

Primary goal:
- Build a reproducible data factory that outputs high-quality CS text and CS speech for downstream retrieval/ASR experiments.

Success criteria:
- CS Text: at least 4,000 usable utterances for Track A and at least 4,000 for Track B.
- CS Audio: at least 1,500 aligned clips for Track A and at least 1,500 for Track B.
- Naturalness guardrail: less than 10% of sampled outputs rejected by human review rubric.
- Utility guardrail: synthetic data improves at least one downstream metric versus monolingual-only baseline.
- Baseline reporting guardrail: report metrics separately for Track A, Track B, and shuffled Track A+B.

## 2) Research Basis (What this plan adopts)

This design combines proven ideas from prior CS generation work:
- Parallel-to-CS generation via learned switching behavior and copy mechanisms (CoNLL 2019, K19-1026).
- MT-to-CS curriculum and synthetic bootstrapping for high-quality CS text (ACL 2021, 2021.acl-long.245).
- Monolingual-to-CS speech synthesis by split/concatenate and bilingual data augmentation (Interspeech 2020, arXiv:2010.08136).
- TTS augmentation improves CS ASR robustness in low-resource settings (arXiv:2010.05549, arXiv:2601.00935).
- CS speech generation from monolingual corpora via span construction is practical and effective (arXiv:2409.10969).

## 3) Inputs and Data Contracts

## 3.1 Required Sources

- Parallel text (required):
  - Gamayun Congolese Swahili-French kit.
  - French-Lingala parallel kit.
- Real CS text: HateSpeech Kenya (transfer source, not target pair).
- Monolingual speech: Waxal Lingala ASR, Waxal Swahili TTS/ASR, Common Voice French.
- Optional lexical resources: Lingala slang list, named entities, political domain terminology.

## 3.2 Canonical Record Schemas

Text unit schema:
```json
{
  "id": "cs_txt_000001",
  "text": "Njo maana ba politiciens ba utiliser lingala pamba pamba",
  "tokens": ["Njo", "maana", "ba", "politiciens", "ba", "utiliser", "lingala", "pamba", "pamba"],
  "lang_tags": ["swa", "swa", "lin", "fra", "lin", "fra", "lin", "lin", "lin"],
  "matrix_lang": "swa",
  "switch_points": [3,5],
  "source_trace": {
    "sw_sentence_id": "gmy_1203_sw",
    "fr_sentence_id": "gmy_1203_fr",
    "method": "mlf_rule|copy_model|llm_rewrite"
  },
  "quality": {
    "grammar_score": 0.83,
    "toxicity_flag": false,
    "cs_acceptability": 0.76
  }
}
```

Audio unit schema:
```json
{
  "id": "cs_aud_000001",
  "wav_path": "data/audio/cs_aud_000001.wav",
  "transcript": "Njo maana ba politiciens ba utiliser lingala pamba pamba",
  "lang_spans": [
    {"start": 0.00, "end": 0.58, "lang": "swa"},
    {"start": 0.58, "end": 1.12, "lang": "fra"},
    {"start": 1.12, "end": 2.10, "lang": "lin"}
  ],
  "speaker_profile": {
    "voice_id": "female_mid_03",
    "accent_target": "eastern_drc"
  },
  "synthesis_trace": {
    "text_id": "cs_txt_000001",
    "span_models": ["swa_tts_v1", "fr_tts_v1", "lin_vc_v1"],
    "post_fx": ["crossfade_30ms", "f0_smooth", "gain_norm"]
  },
  "quality": {
    "mos_proxy": 3.9,
    "asr_backtrans_wer": 0.24,
    "boundary_artifact_score": 0.11
  }
}
```

## 4) Synthesis Architecture Overview

Dual-track generation with shared methods:
- Track A corpus build: French-Swahili focus with Lingala sprinkle.
- Track B corpus build: French-Lingala focus with Swahili sprinkle.
- Each track runs through rule-based and model-based generators, then track-specific filtering/ranking.
- Final evaluation includes each track independently plus shuffled union (A+B).

Pipeline stages:
1. Normalize and align source corpora for both tracks.
2. Generate CS text candidates separately for Track A and Track B.
3. Score, filter, deduplicate, and calibrate distributions per track.
4. Generate CS audio per track from accepted text.
5. Validate audio-text alignment and boundary quality per track.
6. Package train/dev/test splits per track and for shuffled combined benchmark.

## 5) Detailed Plan: CS Text Synthesis

## 5.0 Track Definitions and Targets

Track A (French-Swahili + Lingala sprinkle):
- Primary pair: French-Swahili.
- Sprinkle language: Lingala.
- Target token mix band: French 45-55%, Swahili 35-45%, Lingala 5-15%.

Track B (French-Lingala + Swahili sprinkle):
- Primary pair: French-Lingala.
- Sprinkle language: Swahili.
- Target token mix band: French 45-55%, Lingala 35-45%, Swahili 5-15%.

Generation policy:
- Run the full T0-T4 pipeline independently for each track.
- Keep separate IDs and manifests (`track_a_*`, `track_b_*`) before any combined benchmarking.

## 5.1 Stage T0: Normalization and Alignment

Tasks:
- Unicode normalize (NFC), lowercase policy by language, punctuation standardization.
- Sentence pair cleanup: remove pairs with severe length mismatch or probable mistranslation.
- Word/phrase alignments using multilingual aligner (awesome-align or simalign).

Outputs:
- Clean bilingual pairs with alignment matrix.
- Frequency tables for candidate borrow words by POS and domain.

Exit criteria:
- At least 90% of pairs pass alignment confidence threshold.

## 5.2 Stage T1: Rule-Constrained Generator (MLF + Constraints)

Core idea:
- Matrix/embedded language is track-specific.
- Track A: French-Swahili matrix interplay with Lingala embedded sprinkle.
- Track B: French-Lingala matrix interplay with Swahili embedded sprinkle.

Rules:
- Prefer switching on content words (NOUN, ADJ, selected VERB lemmas).
- Do not switch function words unless explicitly whitelisted.
- Maximum switch bursts: 3 consecutive embedded tokens.
- Switch-rate schedule per sentence length:
  - 5-8 tokens: 1 switch
  - 9-14 tokens: 1-2 switches
  - 15+ tokens: 2-3 switches

Algorithm:
```text
for each aligned pair in selected track:
  identify eligible switch anchors from POS + alignment confidence
  sample target switch count from schedule
  perform primary-pair substitutions (fra<->swa for Track A, fra<->lin for Track B)
  inject sprinkle-language lexical items at discourse markers/slang slots
  enforce grammar constraints and punctuation repair
  emit candidate with lang tags, track_id, and trace
```

Expected yield:
- 12k-20k raw candidates before filtering.

## 5.3 Stage T2: Neural Copy-Switch Generator

Model path inspired by CoNLL 2019 + ACL 2021:
- Inputs: (Sw sentence, Fr translation) or (Fr sentence, Sw translation).
- Output: CS sentence.
- Architecture: seq2seq with pointer/copy bias and language-tag embeddings.
- Training curriculum:
  1. Pretrain on monolingual denoising.
  2. Warm-start on synthetic rule outputs.
  3. Fine-tune on any real CS snippets available (even from adjacent pairs).

Control tokens:
- <CS_RATE_LOW>, <CS_RATE_MED>, <CS_RATE_HIGH>
- <MATRIX_SWA>, <MATRIX_FRA>
- <DOMAIN_POLITICS>, <DOMAIN_RADIO>, etc.

Expected value:
- Better naturalness and less template-like output than pure rules.

## 5.4 Stage T3: LLM Rewrite and Validator (Optional but high-impact)

Purpose:
- Improve fluency while preserving semantics and target switch profile.

Prompt contract:
- Preserve meaning.
- Keep matrix language fixed.
- Maintain target switch count and language tags.
- No invented named entities.

Validator checks after rewrite:
- Semantic similarity >= 0.88 to source pair meaning.
- Switch-count deviation <= 1 from target.
- Language-ID consistency >= 95% token agreement.
- Track distribution compliance with Section 5.0 token mix bands.

## 5.5 Stage T4: Quality Filtering and Dataset Shaping

Filters:
- Grammar/acceptability classifier threshold.
- Toxicity and harmful content policy filter.
- Duplicate and near-duplicate removal (minhash + embedding similarity).
- Domain balancing (politics, civic, daily speech, news).

Distribution targets:
- Apply track-specific token mix bands from Section 5.0.
- Reject or downsample outputs that drift outside each track band.
- Switch intensity bands:
  - Low 40%, Medium 40%, High 20%

Output target:
- Track A: 4k-6k high-quality CS text utterances.
- Track B: 4k-6k high-quality CS text utterances.

## 6) Detailed Plan: CS Audio Synthesis

Execution note:
- Run A0-A4 separately for Track A and Track B.
- Keep track-specific audio manifests before building shuffled combined benchmark sets.

## 6.1 Stage A0: Voice and Pronunciation Setup

- Define 6-10 synthetic speaker profiles (gender, pitch range, speaking rate).
- Build pronunciation lexicon for cross-language tokens:
  - French tokens adapted to local pronunciation variants.
  - Lingala borrowings in Swahili phonotactics where appropriate.
- Add named-entity pronunciation overrides.

## 6.2 Stage A1: Span-Based Multilingual Rendering

For each accepted CS text:
- Split by contiguous language spans from token tags.
- Render each span using language-appropriate model:
  - Swahili: Waxal-based TTS or multilingual TTS checkpoint.
  - French: CV/French-capable TTS.
  - Lingala: multilingual TTS or voice-converted path from Lingala ASR speakers.

Boundary handling:
- 20-40 ms crossfade at joins.
- F0 interpolation across boundaries.
- Energy normalization per span and whole utterance.

## 6.3 Stage A2: Cross-Lingual Voice Consistency

Problem:
- Different span models cause timbre jumps.

Mitigation path:
- Use speaker embedding normalization across all span renderers.
- If unavailable, post-hoc voice conversion to a shared target speaker.
- Reject clips with speaker embedding drift above threshold.

## 6.4 Stage A3: Acoustic Augmentation

Create realistic variants (1-2 per clip):
- Room impulse response (mild).
- Mobile compression simulation.
- Background noise at 20-30 dB SNR.
- Small speaking-rate perturbation (0.95x to 1.05x).

Goal:
- Improve robustness of retrieval/ASR without destroying intelligibility.

## 6.5 Stage A4: Audio Quality Gates

Automatic checks:
- VAD coverage: speech duration ratio > 0.6.
- Clipping ratio < 0.5%.
- ASR back-transcription CER/WER threshold by language span.
- Boundary artifact detector score below threshold.

Human audit (sampled 10%):
- Naturalness (1-5).
- Speaker consistency (1-5).
- Switch plausibility (1-5).
- Pronunciation acceptability (1-5).

Acceptance:
- Mean >= 3.5 on all four dimensions.

Output target:
- 3k-6k validated CS audio clips.

## 7) Split Strategy and Leakage Prevention

Hard constraints:
- No source sentence pair leakage across train/dev/test.
- No paraphrase cluster split leakage (cluster by embedding and keep cluster in one split).
- Speaker profile separation for evaluation where possible.

Recommended split:
- Per-track split: Train 80%, Dev 10%, Test 10% for Track A and Track B separately.
- Combined shuffled split: build additional Train/Dev/Test from shuffled union of accepted Track A + Track B records.
- Build a stress-test subset with high switch intensity and named entities.

## 8) Evaluation Plan for the Synthesizer Itself

Text synthesis KPIs:
- LID accuracy on generated tokens.
- Switch-point F1 against rule targets.
- Acceptability classifier score.
- Human CS naturalness rating.

Audio synthesis KPIs:
- Boundary artifact score.
- Back-transcription WER by language span.
- Speaker similarity (embedding cosine).
- Human MOS-style score.

Downstream utility KPIs:
- Delta MRR or retrieval NDCG after adding synthetic data.
- Delta ASR MER/WER for CS segments.
- CS robustness score improvement from low to high switch bands.

Baseline protocol (must run and report separately):
- Baseline A-only:
  - Train/evaluate using Track A synthetic set only.
  - Report all text, audio, and downstream KPIs.
- Baseline B-only:
  - Train/evaluate using Track B synthetic set only.
  - Report all text, audio, and downstream KPIs.
- Baseline Combined-Shuffled:
  - Create shuffled union of Track A and Track B synthetic sets.
  - Train/evaluate on this mixed set and report all KPIs.

Required comparison table:
- Columns: A-only, B-only, Combined-Shuffled.
- Rows: LID accuracy, switch-point F1, acceptability score, boundary artifact score, back-transcription WER, downstream retrieval NDCG/MRR, downstream ASR WER/MER.

## 9) Implementation Timeline (6 Weeks)

Week 1:
- Data ingestion, normalization, alignments, schema finalization.

Week 2:
- Rule-constrained text generator v1 for Track A and Track B + initial filters.

Week 3:
- Neural copy-switch generator v1 + track-specific merge/ranking.

Week 4:
- Span-based audio synthesis v1 + boundary smoothing for both tracks.

Week 5:
- QC automation, human audit loop, track-specific dataset shaping.

Week 6:
- Freeze Track A and Track B datasets, produce data cards, run Baseline A-only, Baseline B-only, and Combined-Shuffled benchmarks.

## 10) Minimal Tooling Stack

- Text processing: spaCy, stanza, sentencepiece, fastText LID.
- Alignments: simalign or awesome-align.
- Generation: transformers seq2seq + pointer/copy adaptation.
- Speech: Coqui TTS or multilingual TTS stack, optional voice conversion module.
- Audio processing: librosa, torchaudio, sox effects.
- Indexing and dedup: FAISS + minhash.
- Experiment tracking: MLflow or Weights and Biases.

## 11) Risk Register (Synthesis-specific)

- Risk: Unnatural switch placement.
  - Mitigation: switch constraints + acceptability reranker + human spot checks.

- Risk: Timbre discontinuity at language boundaries.
  - Mitigation: shared speaker embeddings + VC post-pass + hard rejection rules.

- Risk: Overfitting to synthetic artifacts.
  - Mitigation: blend ratio schedule (start 30% synthetic, cap at 60%), include real speech where possible.

- Risk: Domain drift from target DRC political speech.
  - Mitigation: domain lexicon injection + targeted prompt templates + manual curation of seed phrases.

## 12) Deliverables

- D1: Track A CS text corpus (French-Swahili focus + Lingala sprinkle).
- D2: Track B CS text corpus (French-Lingala focus + Swahili sprinkle).
- D3: Track A CS audio corpus (wav + transcript + span timestamps + provenance).
- D4: Track B CS audio corpus (wav + transcript + span timestamps + provenance).
- D5: Combined shuffled benchmark manifests and splits.
- D6: Evaluation report with A-only, B-only, Combined-Shuffled baseline metrics.
- D7: Data cards documenting methods, limits, and ethical use notes.
- D8: Reproducible synthesis pipeline scripts and config files.

## 13) Immediate Execution Checklist

- [ ] Finalize source licenses and redistribution constraints.
- [ ] Implement schemas and manifest format first.
- [ ] Build T1 rule generator for Track A and Track B; run 500-sentence pilot per track.
- [ ] Build A1 span renderer on 200-utterance pilot per track.
- [ ] Validate QC gates, then scale generation.
- [ ] Compute and compare baseline metrics for A-only, B-only, and Combined-Shuffled.
- [ ] Freeze v1 with immutable IDs and checksums.
