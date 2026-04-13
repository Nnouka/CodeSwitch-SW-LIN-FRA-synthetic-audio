# Project Plan: Multi-Language Audio Retrieval for Code-Switched DRC Speech

**Date:** April 13, 2026  
**Based on:** proposal.md feasibility review + dataset landscape research

---

## 1. Feasibility Verdict

**Overall: Feasible, with caveats.** The core architecture (contrastive multimodal embeddings for cross-language retrieval) is well-supported by the literature. The main challenge is the **data gap**: no native French-Swahili-Lingala code-switching dataset exists. This is solvable through synthesis, but adds a Phase 0 to the plan.

---

## 2. Component-by-Component Assessment

### 2.1 Models

| Model | Status | Assessment |
|---|---|---|
| **SERENGETI** | ✅ Real, available | Confirmed paper (arXiv 2212.10785, ACL 2023 Findings). Covers 517 African languages. Best choice for text encoding. Available on HuggingFace at `UBC-NLP/serengeti`. |
| **AfriBERTa** | ✅ Real, available | Confirmed on HuggingFace (`castorini/afriberta_large`, 126M params). Covers 11 languages including Swahili but **not Lingala**. Good baseline but weaker for the Lingala component. |
| **CLAP** | ✅ Real, well-established | Contrastive Language-Audio Pretraining (LAION-AI). Standard for audio-text alignment. Can be fine-tuned on Waxal audio + transcription pairs. |
| **CLASP** | ⚠️ Needs clarification | "Contrastive Language-Speech Pretraining" is less established in literature than CLAP. Verify the specific paper/repo being referenced before committing to this architecture. Consider it as an exploratory option, not a primary path. |

### 2.2 Datasets — Audit

| Dataset | Claimed Role | Reality Check | Verdict |
|---|---|---|---|
| **Gamayun Congolese Swahili–French Kit** | "Swahili-French code-switching pairs" | **Parallel translation corpus** (10,305 sentence pairs where each French sentence has a Swahili translation). This is bilingual, NOT intra-sentence code-switching. Requires a note of correction. | ✅ Usable as raw material to **synthesize** CS data |
| **HateSpeech Kenya** | "Swahili-English CS for transfer learning" | ✅ Accurate. 48,076 tweets with genuine Swahili-English code-switching from 2017 elections. Strong transfer learning signal for learning CS patterns. | ✅ Use as-is |
| **Google Waxal NLP** | "Lingala & Swahili audio" | ✅ Confirmed on HuggingFace (`google/WaxalNLP`). 1,250+ hours across 19 African languages. Lingala included via Digital Umuganda. Swahili TTS included. Monolingual only — no CS audio. | ✅ Use as audio backbone; CS audio must be synthesized |
| **Swahili News** | "Formal Swahili baseline" | ✅ Accurate. 6,439 formal Tanzanian news articles. Good for baseline but note it's standard Swahili, not Congolese variety. | ✅ Use as-is with caveat |

### 2.3 Correctness of Problem Statement

The framing is strong and accurate:
- Whisper/Gemini do fail on code-switched speech — this is well-documented.  
- The Goma/Bukavu trilingual speech pattern is real and under-resourced.
- The example sentence is linguistically valid and illustrative.

---

## 3. Mozilla Data Collective — Findings

**URL:** https://mozilladatacollective.com/datasets  

No direct code-switching datasets found. Relevant entries that can supplement the project:

| Dataset | Relevance | Notes |
|---|---|---|
| **Common Voice Scripted Speech 25.0 – French** | Supplementary French audio | 28.39 GB, CC0-1.0. Can provide clean French phoneme reference for audio synthesis. |
| **Common Voice Scripted Speech 25.0 – Kinyarwanda** | Adjacent DRC language region | 57.18 GB, CC0-1.0. Kinyarwanda phonetics are close to DRC Swahili speech patterns. |
| **Bulu ALCAM Multimodal Dataset** | Cameroonian language with French equivalents + audio | MP3+TSV, NOODL-1.0. Demonstrates the Cameroonian multilingual framing of proposal. |
| **Bamun-French Parallel Corpus 2.0** | Central African French-indigenous parallel text | 4,444 lines, TSV, NOODL-1.0. Shows same structural problem (parallel, not CS). |
| **Hausa-TTS-Dataset** | African TTS methodology reference | Audio/text pairs useful as a model for how to build a CS TTS pipeline. |

**Key finding:** Mozilla Data Collective has no code-switching datasets for any African language pair, let alone Swahili-French-Lingala. This confirms the proposal's gap analysis.

---

## 4. Code-Switching Dataset Gap — Solutions

Since no French-Swahili-Lingala CS dataset exists, two tracks are proposed:

### Track A: Synthesize CS Text from Existing Parallel Data

**Method: Matrix Language Frame (MLF) Substitution**

The Matrix Language Frame model (Myers-Scotton, 1993) identifies the "host" language (Swahili as matrix) and the "guest" language (French, Lingala as embedded). Synthesis follows CS linguistics rules.

**Step-by-step pipeline:**

```
1. Take Gamayun parallel corpus (10,305 sentence pairs: French ↔ Congolese Swahili)
2. Run POS tagging on both sides (use spaCy for French, Spacy/mBERT for Swahili)
3. Identify content words in Swahili sentences: nouns, verbs, adjectives
4. For each noun/adjective, randomly swap with the French equivalent from the parallel sentence (20–40% substitution rate mimics natural CS)
5. Separately: use a Lingala wordlist/lexicon to replace slang/emphasis words
   - Sources: PanLex, Glosbe, or a small manually curated list (~500 Lingala slang terms commonly used in Goma/Kinshasa)
6. Output: synthetic CS text sentences with token-level language IDs
```

**Method: Cross-lingual Lexical Substitution (CLLS)**

Uses cross-lingual embedding similarity to find natural substitution points:

```
1. Encode Swahili sentences with mBERT or XLM-R
2. For each token, compute cosine similarity to French vocabulary in the same embedding space
3. Substitute tokens where French equivalent similarity > threshold (e.g., 0.85)
4. Apply Lingala substitutions for culturally-marked terms
```

**Expected output:** ~5,000–10,000 synthetic CS text sentences with per-token language labels.

### Track B: Synthesize CS Audio from Monolingual Sources

Since Waxal provides separate Lingala and Swahili audio, CS audio can be constructed:

**TTS-Concatenation Pipeline:**

```
1. Take synthetic CS text from Track A
2. Split each sentence by language spans (language ID tags from Track A)
3. Synthesize Swahili spans using Waxal Swahili TTS (swa_tts)
4. Synthesize Lingala spans using Waxal Lingala ASR speakers as TTS reference
5. Synthesize French spans using Common Voice French audio + TTS (Coqui TTS / Bark)
6. Concatenate audio spans with prosody smoothing (adjust pitch/speed at transitions)
7. Apply light acoustic augmentation at concatenation points
```

**Expected output:** ~2,000–5,000 synthetic CS audio clips with aligned text and language timestamps.

### Track C: Community-Sourced Real Data (Longer-Term)

If the project has access to DRC diaspora communities or Masakhane members:

```
1. Create a simple web form with 20–30 prompt sentences (in French)
2. Ask bilingual DRC speakers to record themselves reading the prompt 
   "as they would say it naturally" (this naturally elicits CS)
3. Collect ~5–10 hours at minimum
4. Partners to approach: Masakhane community, TWB Gamayun team, 
   Institut Supérieur de Commerce (Kinshasa)
```

---

## 5. Revised Dataset Table

| # | Dataset | Type | Size | Source | Use |
|---|---|---|---|---|---|
| 1 | Gamayun Congolese Swahili–French Kit | Parallel Text | 10,305 pairs | TWB | Raw material for CS synthesis (Track A) |
| 2 | HateSpeech Kenya (Swahili-English) | CS Text | 48,076 tweets | Kaggle | Transfer learning — teaches model the logic of grammatical CS |
| 3 | Google Waxal NLP — Lingala ASR | Monolingual Audio | ~65 hrs est. | HuggingFace | Audio building blocks for Track B |
| 4 | Google Waxal NLP — Swahili TTS | Monolingual Audio | ~10 hrs est. | HuggingFace | Audio building blocks for Track B |
| 5 | Common Voice French 25.0 | Monolingual Audio | 28.39 GB | Mozilla MDC | French audio building blocks for Track B |
| 6 | Swahili News Classification | Monolingual Text | 6,439 articles | Kaggle | Formal Swahili semantic baseline |
| 7 | **[NEW] Synthetic CS Text Corpus** | CS Text | ~5,000–10,000 sentences | Generated (Track A) | Primary training data |
| 8 | **[NEW] Synthetic CS Audio Corpus** | CS Audio | ~2,000–5,000 clips | Generated (Track B) | CLAP fine-tuning, retrieval evaluation |

---

## 6. Revised Project Phases

### Phase 0: Data Foundation (Weeks 1–3)
**Goal:** Produce a usable CS dataset before any model training.

- [ ] Download Gamayun Congolese Swahili-French corpus (requires TWB account)
- [ ] Download HateSpeech Kenya from Kaggle
- [ ] Load Waxal Lingala ASR + Swahili TTS subsets from HuggingFace
- [ ] Download Common Voice French (or a 10% sample) from Mozilla MDC
- [ ] Implement MLF substitution pipeline (Track A) — output: synthetic CS text
- [ ] Implement TTS concatenation pipeline (Track B) — output: synthetic CS audio
- [ ] **Deliverable:** Dataset of ~5,000 CS text + ~2,000 CS audio clips with language IDs

### Phase 1: Baseline Text Retrieval (Weeks 4–5)
**Goal:** Prove T2T retrieval works on the CS text corpus.

- [ ] Fine-tune **SERENGETI** on CS text corpus for semantic similarity
- [ ] Fine-tune **AfriBERTa** on the same corpus (comparison baseline)
- [ ] Build a simple FAISS vector index over CS text embeddings
- [ ] Evaluate T2T retrieval: query "corruption" (French) → retrieve Swahili/Lingala hits
- [ ] **Metric:** MRR@10, NDCG@5 on held-out CS query set

### Phase 2: Cross-Modal Bridge (Weeks 6–8)
**Goal:** Align audio embeddings with text embeddings across languages.

- [ ] Fine-tune **CLAP** on (Waxal audio, transcription) pairs for Swahili and Lingala
- [ ] Extend CLAP fine-tuning with synthetic CS audio clips from Phase 0
- [ ] Build audio embedding index (FAISS or Annoy)
- [ ] Evaluate A2T and T2A retrieval
- [ ] **Metric:** MRR@10 and Code-Switching Robustness Score (defined below)

### Phase 3: Full System + Evaluation (Weeks 9–10)
**Goal:** End-to-end demo and comparative analysis.

- [ ] Build unified retrieval pipeline: any-modality query → any-modality result
- [ ] Ablation study: monolingual-only vs. CS-augmented fine-tuning
- [ ] Define and compute **Code-Switching Robustness Score**
- [ ] Write up findings
- [ ] **Deliverable:** Working demo + paper draft

---

## 7. Metric Definitions (Clarified)

### Mean Reciprocal Rank (MRR)
Standard IR metric. For a set of queries Q:

$$\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}$$

where $\text{rank}_i$ is the rank of the first correct retrieval for query $i$.

### Code-Switching Robustness Score (CSRS)
A proposed metric that measures retrieval degradation as CS intensity increases:

```
1. Group test queries by CS ratio: low (0–20% tokens switched), 
   medium (20–50%), high (50%+)
2. Compute MRR for each group: MRR_low, MRR_medium, MRR_high
3. CSRS = MRR_high / MRR_low  (closer to 1.0 = more robust)
```

A monolingual-centric model will have CSRS << 1. The goal is to demonstrate that CS-aware fine-tuning improves CSRS toward 1.0.

---

## 8. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Gamayun corpus requires login/approval | Medium | Register early with TWB; alternatively use the 15k chunks that are publicly downloadable |
| Synthetic CS audio has unnatural prosody at switch points | High | Apply prosody interpolation; explicitly note synthetic nature in paper; evaluate on both synthetic and any real samples |
| AfriBERTa does not cover Lingala | Medium | Use SERENGETI as primary model; use AfriBERTa only for Swahili-French sub-task |
| CLASP architecture unclear | Medium | Default to CLAP for audio-text alignment; revisit CLASP if a specific paper is identified |
| Waxal Lingala data volume insufficient | Medium | Supplement with AfriVoice (Digital Umuganda source) directly from their repository |
| No ground-truth CS retrieval test set | High | Manually curate 100–200 real CS query-document pairs from YouTube DRC political speech or Twitter; this is the gold evaluation set |

---

## 9. Immediate Next Steps

1. **Correct the proposal:** Gamayun Kit is a parallel translation corpus, not a CS dataset. Update the dataset table description accordingly.
2. **Secure data access:** Register with TWB Gamayun portal and Kaggle for the two gated datasets.
3. **Prototype Track A** (CS text synthesis): This can be done in a Jupyter notebook in 2–3 hours with spaCy + HuggingFace.
4. **Revisit CLASP:** Find the exact paper/implementation before including it in the proposal as a candidate model.
5. **Define the demo scenario** concretely: e.g., build a 50-clip audio retrieval demo for the domain of "political speech in Goma" to make the evaluation tangible.

---

## 10. References & Resources

| Resource | URL |
|---|---|
| SERENGETI paper | https://arxiv.org/abs/2212.10785 |
| AfriBERTa model | https://huggingface.co/castorini/afriberta_large |
| Google Waxal NLP | https://huggingface.co/datasets/google/WaxalNLP |
| Gamayun Congolese Swahili Kit | https://gamayun.translatorswb.org/download/gamayun-medium-kit-15k-chunk-1-2-swc-fra/ |
| HateSpeech Kenya | https://www.kaggle.com/datasets/edwardombui/hatespeech-kenya |
| Swahili News | https://www.kaggle.com/datasets/alfredkondoro/swahili-news-classification-zindi |
| Mozilla Data Collective | https://mozilladatacollective.com/datasets |
| Common Voice French 25.0 | https://mozilladatacollective.com/datasets/cmn5zugst00w3nv07upovf2bg |
| CAFE Code-Switching dataset (Algerian dialect, methodological reference) | https://arxiv.org/abs/2411.13424 |
