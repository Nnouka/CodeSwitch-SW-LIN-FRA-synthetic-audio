# Experimentation Plan: Retrieval on Synthetic French-Swahili-Lingala Code-Switched Data

**Date:** April 14, 2026  
**Scope:** Evaluation plan for text and cross-modal retrieval experiments using the synthesized corpus in `synthesis_outputs/` and the documented source datasets.

---

## 1. Purpose

This document defines the experimentation phase after corpus synthesis. The goal is not only to report retrieval scores, but to do so in a way that is reproducible, statistically defensible, and honest about what the data can and cannot support.

The central research question is:

**Does code-switch-aware training improve retrieval on our French-Swahili-Lingala synthetic dataset relative to monolingual or weakly code-switch-aware baselines?**

All conclusions must be limited to the datasets used here. We will not claim that results generalize to all DRC speech, all African code-switching, or all multilingual retrieval settings.

---

## 2. Datasets Used and Why

This section distinguishes between:
- source datasets used to build the corpus,
- the synthesized dataset used for main experiments,
- auxiliary datasets used for baselines or transfer.

### 2.1 Primary Experimental Dataset

#### Synthetic French-Swahili-Lingala Text Corpus
- **Location:** `synthesis_outputs/text/cs_text_dataset.jsonl`
- **Observed size:** 9,000 code-switched text records
- **Splits:** 7,200 train / 900 dev / 900 test
- **Available metadata:** token-level language tags, matrix language, switch points, source trace, grammar score, CS acceptability
- **Why used:** This is the main dataset that matches the target task most closely. It is the only dataset in the workspace that explicitly contains French-Swahili-Lingala code-switched text with token-level switching metadata.

#### Synthetic French-Swahili-Lingala Audio Set
- **Location:** `synthesis_outputs/audio/` plus manifests in `synthesis_outputs/manifests/`
- **Observed size:** 623 clips total, split 498 train / 62 dev / 63 test
- **Why used:** This is the only aligned audio-text resource available for the target three-language setting, so it is necessary for audio-to-text and text-to-audio retrieval experiments.

### 2.2 Source Datasets Used to Build the Synthetic Corpus

#### Gamayun Congolese Swahili-French Parallel Text
- **Workspace evidence:** `synthesis_inputs/gamayun_kit5k_fra-swc/kit5k/`
- **Observed local subset:** 5,000 aligned Swahili-French pairs used in the synthesis pipeline
- **Why used:** It provides DRC-relevant French-Swahili parallel material from which controlled code-switching can be synthesized. It is the main lexical and syntactic backbone for the French-Swahili portion of the corpus.
- **Important limitation:** This is a parallel corpus, not a naturally code-switched corpus.

#### Gamayun French-Lingala Parallel Text
- **Workspace evidence:** `synthesis_inputs/gamayun_kit5k-v1_FRA-LIN/fr-kit5k-v1/`
- **Observed local subset:** 5,000 aligned French-Lingala pairs
- **Why used:** It supplies French-Lingala lexical correspondences needed to extend synthesis beyond a bilingual French-Swahili setting into a tri-lingual one.
- **Important limitation:** This is also parallel text, not naturally occurring code-switched text.

#### Google WaxalNLP
- **Planned role in synthesis:** Lingala and Swahili speech references / audio building blocks
- **Why used:** It is the closest available speech resource for grounding pronunciation and audio synthesis in Congolese or regionally relevant speech.
- **Important limitation:** It is monolingual speech, so any code-switched audio created from it remains synthetic.

#### Common Voice French
- **Planned role in synthesis:** French speech reference for audio rendering
- **Why used:** It covers the French spans needed to synthesize trilingual audio clips.
- **Important limitation:** It is not DRC-specific speech and does not itself contain code-switching.

### 2.3 Auxiliary Datasets for Transfer or Sanity Baselines

#### HateSpeech Kenya
- **Why used:** It is a real code-switched text dataset, but in Swahili-English rather than French-Swahili-Lingala. It is useful only as an auxiliary transfer source or methodological reference for learning switching behavior.
- **Why not used as the main evaluation dataset:** The language pair does not match the target setting, so it cannot directly answer the main research question.

#### Swahili News Classification Dataset
- **Why used:** It provides a monolingual Swahili baseline corpus to test whether gains on code-switched retrieval come at the cost of degraded performance on cleaner Swahili text.
- **Why not used as the main evaluation dataset:** It is monolingual, formal, and not code-switched.

---

## 3. Experimental Claims We Can and Cannot Make

### Claims we can make if experiments succeed
- Code-switch-aware training improves retrieval on this synthesized French-Swahili-Lingala corpus.
- Some models are more robust than others as switch intensity increases on this corpus.
- Specific error patterns appear consistently on this corpus and its test split.

### Claims we cannot make from these experiments alone
- That the same gains will hold on real spontaneous DRC conversational speech.
- That the same ranking of models will hold for all African multilingual retrieval tasks.
- That synthetic audio performance implies equivalent real-world audio robustness.

---

## 4. Experimental Setup

## 4.1 Tasks

We will evaluate three tasks.

### Task A: Text-to-Text Retrieval (T2T)
- Query: one text item
- Target: the correct semantically matching text item in the retrieval pool
- Purpose: establish whether the text encoders can retrieve across code-switch boundaries before adding audio complexity

### Task B: Text-to-Audio Retrieval (T2A)
- Query: text
- Target: matching audio clip
- Purpose: test whether text and audio embeddings align on the target tri-lingual setting

### Task C: Audio-to-Text Retrieval (A2T)
- Query: audio clip
- Target: matching transcript or semantically paired text
- Purpose: evaluate cross-modal robustness in the reverse direction

## 4.2 Candidate Models

### Primary text encoders
- **SERENGETI** as the main multilingual African-language text encoder
- **AfriBERTa** as a lower-coverage baseline, especially weaker for Lingala

### Cross-modal encoder
- **CLAP** as the primary audio-text alignment model

### Model to exclude unless concretely implemented
- **CLASP** should not be treated as a confirmed main experiment unless a specific implementation is identified and run. For now it remains out of scope for the core experimental table.

## 4.3 Training Conditions

Each main model comparison should include the following conditions.

### Text retrieval conditions
1. Monolingual baseline training only
2. Monolingual plus auxiliary transfer data
3. Monolingual plus synthetic French-Swahili-Lingala training data
4. Ablation by switch intensity or by removing Lingala spans

### Cross-modal retrieval conditions
1. Train on monolingual speech-text pairs only
2. Train on monolingual speech-text pairs plus synthetic CS audio
3. Train on text-only synthetic data and evaluate transfer to cross-modal retrieval where applicable

---

## 5. Data Splits and Evaluation Protocol

## 5.1 Official Splits

Use the frozen split files under `synthesis_outputs/manifests/splits.json`.

- Text: 7,200 train / 900 dev / 900 test
- Audio: 498 train / 62 dev / 63 test

No experiments should reshuffle the official test sets.

## 5.2 Anti-Leakage Rule

The synthesis outputs contain `source_trace` metadata. Any derived evaluation pair must preserve source-level separation.

Rules:
- Do not allow test examples to share the same source sentence lineage with train examples.
- Do not create retrieval pairs that collapse trivial paraphrase variants from the same synthetic parent into both query and gold target unless the experiment explicitly studies paraphrase robustness.
- When constructing retrieval pools, ensure that near-duplicate candidates are clustered and placed within the same split.

## 5.3 Retrieval Pool Construction

For each test query:
- include exactly one gold item,
- include hard negatives from the same topic or lexical field,
- include code-switch negatives with overlapping borrowed words but different meanings,
- include monolingual negatives to test false positives caused by language identity instead of semantics.

A recommended first setup is:
- 1 gold target
- 9 hard negatives
- 40 random negatives

This gives a fixed 50-item candidate pool per query for controlled evaluation.

---

## 6. Metrics: What Can Be Used and What We Choose

## 6.1 Candidate Metrics

The following metrics are all reasonable for retrieval.

### Ranking metrics
- Recall@1
- Recall@5
- Recall@10
- Mean Reciprocal Rank (MRR)
- nDCG@5
- nDCG@10

### Code-switch robustness metrics
- Performance by switch-intensity band
- Performance by matrix language
- Performance by number of switch points
- Performance by presence or absence of Lingala spans

### Audio-specific metrics
- Retrieval metrics stratified by clip duration
- Retrieval metrics stratified by audio QC status
- WER or CER for diagnostic back-transcription only, not as the main retrieval metric

## 6.2 Chosen Primary Metrics

We will report the following primary metrics.

### Main retrieval metrics
- **MRR** as the primary overall ranking metric because it directly measures how early the first correct result appears
- **Recall@1** because it reflects whether the top result is correct, which matters for practical retrieval
- **nDCG@5** because it captures ranking quality beyond only the first correct item

### Main robustness metrics
- **CSRS (Code-Switching Robustness Score)** defined as:

$$
\text{CSRS} = \frac{\text{MRR}_{\text{high-switch}}}{\text{MRR}_{\text{low-switch}}}
$$

This will be reported for each model.

### Stratified reporting dimensions
- switch-intensity band: low / medium / high
- matrix language: Swahili / French / Lingala where present
- language composition: bilingual versus tri-lingual items
- modality: T2T, T2A, A2T

## 6.3 Why These Metrics Were Chosen

- MRR is the clearest single measure for retrieval ranking quality.
- Recall@1 captures whether the system is immediately useful.
- nDCG@5 adds stability when more than one semantically acceptable item exists near the top of the list.
- CSRS is necessary because average retrieval quality alone can hide failure on heavily code-switched examples.

Metrics not chosen as primary:
- Recall@10 is useful but too forgiving for a small benchmark.
- WER is diagnostic for audio quality but does not directly measure retrieval success.
- Accuracy is not suitable for ranked retrieval.

---

## 7. Statistical Significance Testing

This section is mandatory. We should not present metric deltas without uncertainty estimates and significance tests.

## 7.1 Unit of Analysis

The unit of analysis is the **query**, not the dataset aggregate.

For each query we will store:
- reciprocal rank,
- top-1 correctness,
- nDCG@5,
- switch-intensity band,
- matrix language,
- whether Lingala is present,
- modality.

This produces paired per-query outcomes for statistical comparison.

## 7.2 Tests to Run

### For MRR and nDCG comparisons
Use a **paired bootstrap resampling test** over queries.

Protocol:
- 10,000 bootstrap resamples of the test query set
- report 95% confidence intervals for metric differences
- treat a result as statistically supported when the 95% CI for the difference excludes 0

### For Recall@1 comparisons
Use **McNemar's test** on paired top-1 success/failure outcomes for the same queries.

This is appropriate because Recall@1 reduces to a paired binary outcome.

### For stratified analysis
When comparing performance across low/medium/high switch bands:
- use bootstrap confidence intervals within each band,
- apply Holm-Bonferroni correction for multiple pairwise comparisons.

## 7.3 Effect Size Reporting

Do not report only p-values.

Always report:
- absolute metric difference,
- relative percentage difference when useful,
- 95% confidence interval,
- number of test queries,
- corrected p-value where applicable.

Example reporting template:

> On the 900-query text test set, SERENGETI+CS outperformed SERENGETI baseline by +0.041 MRR (95% CI [0.018, 0.064], paired bootstrap), with the largest gains concentrated in the high-switch subset.

## 7.4 Minimum Sample Requirements

- Main text experiments: use the full 900-query test split
- Main audio experiments: use the full 63-query audio test split, but label these results as lower-power due to smaller sample size
- For any subgroup with fewer than 30 queries, do not make strong comparative claims; report descriptively only

---

## 8. Error Analysis Plan

Error analysis must be explicit, example-driven, and tied to systematic patterns rather than anecdotal examples.

## 8.1 Sampling Procedure

For each main model, manually inspect at least:
- 30 failed T2T queries
- 20 failed T2A queries
- 20 failed A2T queries
- 20 successful high-switch queries for contrast

## 8.2 Error Categories

Each inspected error should be assigned one primary category.

### Semantic confusion
- retrieved item shares topic words but not the intended meaning

### Language-identity bias
- model prefers same-language items over semantically correct code-switched items

### Switch-boundary failure
- retrieval degrades when borrowed spans occur near switch points or in dense switch bursts

### Lingala under-representation failure
- model performs worse when Lingala-bearing spans are critical to meaning

### Named-entity failure
- person, place, organization, or political terms drive incorrect retrieval

### Synthetic artifact sensitivity
- model latches onto repeated synthetic constructions, token patterns, or audio rendering artifacts

### Audio boundary failure
- in T2A or A2T, transitions between spans cause cross-modal mismatch

## 8.3 What to Quantify

For each error category, report:
- number of sampled errors,
- percentage of sampled errors,
- one representative example,
- whether the error appears systematic or isolated.

## 8.4 Example Error-Analysis Table Template

| Query ID | Task | Gold | Top Incorrect Retrieval | Error Type | Likely Cause |
|---|---|---|---|---|---|
| q_014 | T2T | anti-corruption sentence with Lingala emphasis | general election sentence with same French loanword | semantic confusion | over-weighting shared French content word |
| q_097 | A2T | tri-lingual budget clip | Swahili-only civic clip | audio boundary failure | poor alignment at language transition |

## 8.5 Systematic Error Checks

We will explicitly test whether failures concentrate in the following conditions.

- High switch-intensity items
- Items with two or more switch points
- Items whose crucial meaning is carried by Lingala spans
- French-matrix items if they are less frequent in training
- Low-QC audio clips or clips with boundary artifacts

If one of these groups shows consistently worse performance with non-overlapping confidence intervals versus the easier groups, we will describe that as a systematic error pattern on this dataset.

---

## 9. Result Reporting Requirements

Every main results table must include:
- model name,
- training condition,
- task,
- MRR,
- Recall@1,
- nDCG@5,
- CSRS where applicable,
- 95% confidence intervals,
- significance marker relative to the strongest relevant baseline.

## 9.1 Core Comparison Table

The main table should compare:
- SERENGETI baseline
- SERENGETI + synthetic CS training
- AfriBERTa baseline
- AfriBERTa + synthetic CS training
- CLAP monolingual-only
- CLAP + synthetic CS audio

## 9.2 Required Ablations

At minimum run:
- remove Lingala spans from training data,
- train without synthetic audio,
- evaluate only low-switch queries versus only high-switch queries,
- evaluate with and without hard negatives.

This helps determine whether gains come from true code-switch robustness or from easier lexical memorization.

---

## 10. Interpreting Results Conservatively

Use the following interpretation rules.

### If synthetic training improves average retrieval and high-switch robustness
Valid conclusion:
- synthetic code-switch-aware training helped retrieval on this synthetic benchmark

Invalid conclusion:
- the model solves code-switched retrieval in real DRC speech

### If gains are statistically significant only on text, not audio
Valid conclusion:
- the text-side benefit is clearer than the cross-modal benefit on the present data

Invalid conclusion:
- audio-text alignment does not work in general

### If a model wins overall but fails on Lingala-heavy cases
Valid conclusion:
- the model is strongest on average but still weak on Lingala-dependent examples in this benchmark

Invalid conclusion:
- the model is robust to trilingual code-switching overall

---

## 11. Current Corpus-Specific Caveats

These caveats come directly from the current workspace evidence and should remain visible in the final report.

### 11.1 Text data is stronger than audio data at present
- The text corpus is clearly documented and split.
- The audio corpus exists, but the manifests indicate possible version inconsistency.
- `summary.json` reports strong average audio QC, while `audio_manifest_v2_improved.jsonl` sample entries show failed QC, high clipping ratios, and low MOS proxies.

**Implication:**
Audio experiments can still be run, but results must state which manifest/version is used. If the low-QC v2 audio is used, cross-modal results should be treated as provisional.

### 11.2 The benchmark is synthetic
- The main evaluation set is generated from parallel text and synthesized speech.
- This makes it useful for controlled benchmarking, but not equivalent to spontaneous community speech.

**Implication:**
The benchmark can support claims about model behavior on synthetic French-Swahili-Lingala retrieval tasks, not about field deployment readiness.

### 11.3 Real-code-switch transfer data is mismatched
- HateSpeech Kenya is real code-switching, but in Swahili-English.

**Implication:**
If it helps, we can interpret that as evidence that adjacent-pair transfer may help, not as direct evidence for the target trilingual setting.

---

## 12. Recommended Experiment Sequence

1. Freeze the evaluation artifacts and declare the authoritative text and audio manifests.
2. Build the 900-query T2T benchmark from the text test split.
3. Run SERENGETI and AfriBERTa baselines on T2T.
4. Add synthetic CS fine-tuning and rerun T2T.
5. Run bootstrap confidence intervals and McNemar tests.
6. Perform stratified analysis by switch intensity and Lingala presence.
7. Only after the text benchmark is stable, run T2A and A2T with the authoritative audio set.
8. Perform manual error analysis with representative examples.
9. Write conclusions with dataset-bounded claims only.

---

## 13. Deliverables for the Experimentation Phase

- Frozen retrieval benchmark definitions for T2T, T2A, and A2T
- Model comparison tables with confidence intervals and significance tests
- Stratified robustness analysis by switch intensity and language composition
- Error analysis appendix with representative successes and failures
- Final conclusion section limited to the observed datasets and settings

---

## 14. Bottom-Line Reporting Standard

A result is not ready to present unless it includes all of the following:
- exact dataset and split used,
- exact model and training condition,
- at least one ranking metric and one robustness metric,
- a statistical significance test,
- confidence intervals,
- concrete failure examples,
- conclusions scoped only to the datasets evaluated here.
