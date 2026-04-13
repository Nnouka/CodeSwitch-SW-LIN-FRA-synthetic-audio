# Full Code-Switch Synthesis Plan

Date: April 13, 2026  
Scope: End-to-end synthesis of French-Swahili-Lingala code-switched (CS) text and audio from primarily monolingual/parallel data.

## 1) Goal and Success Criteria

Primary goal:
- Build a reproducible data factory that outputs high-quality CS text and CS speech for downstream retrieval/ASR experiments.

Success criteria:
- CS Text: at least 8,000 usable utterances with token-level language tags and quality metadata.
- CS Audio: at least 3,000 aligned clips with transcript and span timestamps.
- Naturalness guardrail: less than 10% of sampled outputs rejected by human review rubric.
- Utility guardrail: synthetic data improves at least one downstream metric versus monolingual-only baseline.

## 2) Research Basis (What this plan adopts)

This design combines proven ideas from prior CS generation work:
- Parallel-to-CS generation via learned switching behavior and copy mechanisms (CoNLL 2019, K19-1026).
- MT-to-CS curriculum and synthetic bootstrapping for high-quality CS text (ACL 2021, 2021.acl-long.245).
- Monolingual-to-CS speech synthesis by split/concatenate and bilingual data augmentation (Interspeech 2020, arXiv:2010.08136).
- TTS augmentation improves CS ASR robustness in low-resource settings (arXiv:2010.05549, arXiv:2601.00935).
- CS speech generation from monolingual corpora via span construction is practical and effective (arXiv:2409.10969).

## 3) Inputs and Data Contracts

## 3.1 Required Sources

- Parallel text: Gamayun Congolese Swahili-French kit.
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

Two-lane generation with merge:
- Lane A (Rule-constrained): deterministic MLF-style CS generation for control.
- Lane B (Model-based): learned switching generator for fluency and variety.
- Merge + rank: select best candidates by quality scoring and diversity constraints.

Pipeline stages:
1. Normalize and align source corpora.
2. Generate CS text candidates (A+B).
3. Score, filter, deduplicate, and calibrate CS distribution.
4. Generate CS audio from accepted text.
5. Validate audio-text alignment and boundary quality.
6. Package train/dev/test splits with anti-leakage controls.

## 5) Detailed Plan: CS Text Synthesis

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
- Swahili as matrix language; French and Lingala as embedded islands.

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
for each sw-fr aligned pair:
  identify eligible switch anchors from POS + alignment confidence
  sample target switch count from schedule
  replace sampled anchors with aligned FR tokens
  inject Lingala lexical items at discourse markers/slang slots
  enforce grammar constraints and punctuation repair
  emit candidate with lang tags and trace
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

## 5.5 Stage T4: Quality Filtering and Dataset Shaping

Filters:
- Grammar/acceptability classifier threshold.
- Toxicity and harmful content policy filter.
- Duplicate and near-duplicate removal (minhash + embedding similarity).
- Domain balancing (politics, civic, daily speech, news).

Distribution targets:
- Matrix language mix:
  - 70% Swahili matrix
  - 20% French matrix
  - 10% Lingala matrix (short utterances)
- Switch intensity bands:
  - Low 40%, Medium 40%, High 20%

Output target:
- 8k-12k high-quality CS text utterances.

## 6) Detailed Plan: CS Audio Synthesis

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
- Train 80%, Dev 10%, Test 10%.
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

## 9) Implementation Timeline (6 Weeks)

Week 1:
- Data ingestion, normalization, alignments, schema finalization.

Week 2:
- Rule-constrained text generator v1 + initial filters.

Week 3:
- Neural copy-switch generator v1 + merge/ranking.

Week 4:
- Span-based audio synthesis v1 + boundary smoothing.

Week 5:
- QC automation, human audit loop, dataset shaping.

Week 6:
- Freeze v1 dataset, produce data cards, run downstream utility benchmark.

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

- D1: CS text corpus (jsonl + language tags + quality metadata).
- D2: CS audio corpus (wav + transcript + span timestamps + provenance).
- D3: Data card documenting methods, limits, and ethical use notes.
- D4: Reproducible synthesis pipeline scripts and config files.
- D5: Evaluation report showing synthetic-data utility and failure modes.

## 13) Immediate Execution Checklist

- [ ] Finalize source licenses and redistribution constraints.
- [ ] Implement schemas and manifest format first.
- [ ] Build T1 rule generator and run on 500-sentence pilot.
- [ ] Build A1 span renderer on 200-utterance pilot.
- [ ] Validate QC gates, then scale generation.
- [ ] Freeze v1 with immutable IDs and checksums.
