# French-Swahili-Lingala Code-Switched Data Synthesis and Baseline Retrieval Report

## Introduction

This project addresses a practical gap in multilingual speech technology for the eastern Democratic Republic of Congo (DRC): the lack of usable French-Swahili-Lingala code-switched datasets for retrieval and speech applications. The original plan in [plan.md](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\plan.md) identified the core challenge correctly. Relevant multilingual encoders and audio-text retrieval models exist, but there is no native, ready-to-use trilingual code-switched corpus for this setting. Our work therefore focused first on creating data, then on building a first retrieval benchmark over that data.

We completed three concrete pieces of work. First, we synthesized a trilingual code-switched corpus and packaged it for release in [synthesis_outputs](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs). Second, we started a community collection web application in [lilics](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\lilics) to support future real data acquisition. Third, we implemented a baseline experimentation pipeline in [experimentation.ipynb](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experimentation.ipynb), following [experimentation-plan.md](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experimentation-plan.md), and exported the results to [experiment_outputs](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs).

The main question for this phase was deliberately modest: can we construct a reproducible synthetic code-switched dataset and verify that a simple retrieval baseline can operate on it in a controlled benchmark setting? The answer is yes, but with important limitations. The resulting conclusions apply to the synthetic corpus in this workspace, not to spontaneous DRC conversational speech in general.

## Methodology

### Datasets and Why They Were Used

The project used a combination of source corpora, synthesized outputs, and auxiliary infrastructure.

The primary text dataset for experiments is the synthetic corpus in [synthesis_outputs/text/cs_text_dataset.jsonl](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs\text\cs_text_dataset.jsonl). According to [synthesis_outputs/manifests/summary.json](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs\manifests\summary.json), it contains 9,000 text records split into 7,200 train, 900 dev, and 900 test examples. Each record includes token-level language tags, matrix language, switch points, and quality metadata. This dataset is the main experimental corpus because it is the only resource in the workspace that explicitly models French-Swahili-Lingala code-switching at the utterance level.

The corresponding synthetic audio resource lives in [synthesis_outputs/audio](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs\audio) with manifests in [synthesis_outputs/manifests](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs\manifests). The summary manifest reports 623 aligned clips split into 498 train, 62 dev, and 63 test items. These clips were created to support later cross-modal retrieval experiments, although in the current milestone they were audited rather than used for a full text-audio benchmark.

The source datasets were chosen because no naturally occurring trilingual code-switched corpus was available. As documented in [plan.md](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\plan.md), the intended backbone sources were Gamayun Congolese Swahili-French, Google WaxalNLP, and Common Voice French. However, the investigation in [GAMAYUN_FINDINGS.md](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\GAMAYUN_FINDINGS.md) showed that the Hugging Face release of CLEAR-Global/Gamayun-kits does not expose aligned parallel pairs in the form we needed. Instead of blocking the project, we used a synthetic bootstrap approach and documented that limitation explicitly.

We also prepared a real-data collection track. The application described in [community-real-data-agent-plan.md](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\community-real-data-agent-plan.md) and implemented in [lilics](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\lilics) is meant to collect future natural code-switched speech. The current frontend already supports consent, prompt presentation, recording, and submission, including the collection flow in [lilics/src/features/submission/CollectPage.tsx](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\lilics\src\features\submission\CollectPage.tsx). This matters because it gives us a path beyond synthetic data.

### Text Synthesis Pipeline

The synthesis pipeline follows the staged design in the synthesis plan. The published release summary in [synthesis_outputs/README.md](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs\README.md) describes the text path as T0 normalize, T1 rule constraints, T2 copy-switch bootstrap, and T4 filters.

In practical terms, the method works as follows. First, seed examples are normalized and tokenized. Next, a rule-constrained generator applies Matrix Language Frame style substitutions, keeping Swahili as the dominant matrix language while inserting French and Lingala spans at controlled points. Then a copy-switch bootstrap stage adds lexical variation so the outputs are not trivial templates. Finally, filtered outputs are retained only if they satisfy quality constraints such as code-switch acceptability and consistency. The resulting corpus stores language tags and switch metadata at the token level.

An example from the released text corpus is:

> Leo tuko na probleme ya maji, mairie ilisema travaux zinaanza kesho matin.

This single sentence illustrates the intended behavior: the grammatical frame is mostly Swahili, but French nouns and discourse content are embedded, with Lingala also appearing elsewhere in the corpus. This is exactly the type of input the downstream retrieval benchmark is meant to test.

### Audio Synthesis and Audio Acquisition Strategy

The release summary in [synthesis_outputs/README.md](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs\README.md) describes the audio path as A0 model setup, A1 span rendering with XTTS, boundary smoothing, and A4 quality control. The goal was to synthesize aligned clips for future cross-modal retrieval, not yet to claim natural conversational speech quality.

The audio strategy combines two tracks. The first is synthetic generation from multilingual span rendering and quality filtering. The second is future collection of real data. For real data, we built the initial Lilics web app and defined a contributor workflow with consent, prompt selection, recording, metadata submission, and review. This is the project’s concrete answer to the fact that synthetic data alone is insufficient for external validity.

We also investigated external audio sources. The project plan documents Mozilla Data Collective and Common Voice French as usable references, and WaxalNLP as the closest available Lingala and Swahili speech backbone. We did exploratory work around podcast-style Lingala audio sourcing, but no podcast corpus was incorporated into the released benchmark because licensing, segmentation, and provenance controls were not yet resolved. The current release therefore relies on synthetic audio plus a community collection path, rather than claiming a finalized podcast ingestion pipeline.

### Retrieval Benchmark Construction

The experimentation pipeline in [experimentation.ipynb](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experimentation.ipynb) implements a controlled text-to-text retrieval benchmark before attempting audio-text retrieval. This is methodologically appropriate because it isolates the retrieval problem from audio synthesis noise.

The benchmark uses the frozen split file in [synthesis_outputs/manifests/splits.json](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs\manifests\splits.json). It derives a source-family identifier from the synthesis trace and uses this lineage to define gold pairs while checking for leakage across train, dev, and test. For each eligible test query, it builds a fixed 50-item candidate set consisting of one gold target, nine hard negatives, and forty random negatives. The exported benchmark file [experiment_outputs/csv/benchmark_queries.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\benchmark_queries.csv) shows this setup explicitly, while [experiment_outputs/csv/candidate_pool_distribution.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\candidate_pool_distribution.csv) confirms a pool size of 50 for every benchmark query.

This design choice is important. Although the text test split contains 900 items, not all of them become retrieval queries. Only items with a valid paired gold target from the same synthetic lineage are retained, giving 164 benchmark queries. This is a stricter and more controlled evaluation than simply retrieving over the entire test set.

### Metrics and Statistical Testing

The experimentation plan lists several possible retrieval metrics; the notebook chooses MRR, Recall@1, and nDCG@5 as the primary metrics, plus CSRS as a robustness measure. These choices are appropriate for a small controlled retrieval benchmark.

MRR is the most informative single ranking metric because it measures how early the first correct answer appears. Recall@1 measures immediate usability. nDCG@5 reflects the quality of the top-ranked portion of the list when the correct result is not always first. CSRS is defined as the ratio of high-switch MRR to low-switch MRR:

$$
\text{CSRS} = \frac{\text{MRR}_{\text{high-switch}}}{\text{MRR}_{\text{low-switch}}}
$$

The notebook also implements paired bootstrap resampling for MRR and nDCG differences and McNemar’s test for Recall@1. However, only one real baseline model was actually executed in this milestone, so the significance-testing framework is implemented but not yet used for a meaningful model-versus-model comparison. The only executed comparison is a self-comparison sanity check, which correctly yields zero deltas and $p = 1.0$.

## Results

### Corpus Release

The first concrete result is the release of a synthetic trilingual corpus. According to [synthesis_outputs/manifests/summary.json](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs\manifests\summary.json), the released dataset contains 9,000 text records and 623 audio clips. The official split sizes are 7,200/900/900 for text and 498/62/63 for audio. The summary manifest also reports anti-leakage checks passing, an average code-switch acceptability score of 0.757, an average MOS proxy of 4.4 for audio, and an average ASR back-transcription WER proxy of 0.12.

These numbers show that the corpus is large enough to support an initial retrieval benchmark and that the audio metadata is at least internally consistent at the manifest level. At the same time, the audio remains synthetic and should be interpreted as such.

### Dataset Audit for the Retrieval Benchmark

The text split summary in [experiment_outputs/csv/text_split_summary.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\text_split_summary.csv) shows that the train, dev, and test partitions have similar switch ratios and Lingala rates. This is a good sign because it suggests that evaluation is not being driven by a visibly different switch distribution in one split.

However, the test-set switch intensity distribution in [experiment_outputs/csv/text_switch_band_distribution.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\text_switch_band_distribution.csv) is highly imbalanced: 846 low-switch examples, 42 medium-switch examples, and only 12 high-switch examples. This imbalance constrains what can be concluded from subgroup analysis. High-switch performance can be reported descriptively, but it should not be over-interpreted.

The audio audit in [experiment_outputs/csv/audio_quality_summary.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\audio_quality_summary.csv) reports a 1.0 QC pass rate, mean MOS proxy 4.4, zero clipping, and mean back-transcription WER 0.12 for the authoritative manifest used by the experimentation notebook. These are manifest-level diagnostics, not human naturalness judgments.

### Baseline Text-to-Text Retrieval

The only executed retrieval model in this milestone is a TF-IDF word-bigram baseline. This model is intentionally simple. It is not meant to compete with SERENGETI or AfriBERTa; instead, it verifies that the benchmark logic, candidate pools, metrics, and exports all work end to end.

The baseline results in [experiment_outputs/csv/baseline_summary.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\baseline_summary.csv) are:

- MRR = 0.5803
- Recall@1 = 0.4085
- nDCG@5 = 0.6232
- CSRS = 1.4277

These results indicate that even a lexical baseline can often retrieve the correct sibling example early in the ranking. This is expected because the benchmark pairs are drawn from related synthetic lineages, so lexical overlap remains informative.

Performance by switch band in [experiment_outputs/csv/baseline_by_switch_band.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\baseline_by_switch_band.csv) is:

- High-switch: MRR 0.8333, Recall@1 0.6667, nDCG@5 0.8770
- Low-switch: MRR 0.5837, Recall@1 0.4156, nDCG@5 0.6238
- Medium-switch: MRR 0.3976, Recall@1 0.1429, nDCG@5 0.5025

The high-switch numbers appear best, which is counterintuitive. The correct interpretation is not that the model is inherently strongest on high-switch text. Rather, the high-switch subset is very small, and the specific synthetic examples in that subset are likely easier than average. The medium-switch band is more plausibly the hardest condition in this benchmark.

Performance by Lingala presence in [experiment_outputs/csv/baseline_by_lingala.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\baseline_by_lingala.csv) shows a modest drop when Lingala is present:

- No Lingala: MRR 0.5912, Recall@1 0.4154, nDCG@5 0.6309
- Has Lingala: MRR 0.5385, Recall@1 0.3824, nDCG@5 0.5938

This suggests that Lingala-bearing examples may be somewhat harder for a lexical baseline, which is reasonable given lower lexical regularity and the smaller volume of Lingala-bearing material.

### Significance Testing Output

The significance-testing code was executed only as a self-comparison sanity check. The output in [experiment_outputs/csv/baseline_vs_self.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\baseline_vs_self.csv) shows zero metric differences and $p = 1.0$ for all metrics, which is the expected result. This confirms that the paired bootstrap and McNemar implementations are wired correctly, but it does not yet provide a substantive statistical claim about one model beating another. That step requires at least one additional trained baseline.

### Error Analysis Setup

The notebook exports an error analysis template in [experiment_outputs/csv/error_analysis_template.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\error_analysis_template.csv). A representative failure pattern is lexical-topic confusion: the baseline retrieves a sentence that shares high-overlap words such as “Bajeti ya afya imeongezeka...” but misses the intended paired target because several synthetic sentences are near-duplicates with only a few swapped tokens. This is a useful result because it shows that the benchmark is working as designed: the negatives are hard, not random nonsense.

## Discussion

The main contribution of this milestone is not a state-of-the-art retrieval result. It is the construction of a usable experimental substrate. The project now has a released trilingual synthetic corpus, a reproducible benchmark notebook, a baseline retrieval result, and the start of a real-data collection platform. That is meaningful progress because the plan correctly identified that the missing dataset was the key blocker.

Several insights follow from the current results.

First, the synthetic text corpus is sufficient to support controlled retrieval experiments. The baseline achieves non-trivial performance, and the benchmark pipeline is stable enough to export query-level results, subgroup tables, and plots. This means the project is ready for stronger text encoders such as SERENGETI and AfriBERTa.

Second, the current benchmark is still heavily shaped by synthetic construction. The best-performing examples are often those with strong lexical overlap between paired siblings. This is useful for debugging but means the current scores should not be treated as evidence of real-world conversational retrieval robustness.

Third, the test distribution is skewed toward low-switch cases. Since only 12 test items are high-switch, the reported CSRS value is unstable. The current CSRS of 1.4277 should therefore be interpreted as a descriptive property of this benchmark, not as strong evidence that the baseline is robust to heavy code-switching.

Fourth, Lingala appears to introduce additional difficulty, albeit modestly. This is consistent with the broader resource situation: Lingala has less mature tooling and fewer aligned resources than French or Swahili in this project setup.

Fifth, the audio side remains preparatory. The synthetic audio manifests look internally clean, and the web app provides a path to collecting real data, but the project has not yet run the cross-modal retrieval experiments promised in the longer plan. Likewise, exploratory work on podcast-based Lingala audio acquisition did not yet mature into a publishable, provenance-safe dataset component.

There are also clear limitations. The Hugging Face Gamayun release did not provide aligned pairs in the expected form, so part of the synthesis pipeline relied on fallback bootstrapping. The baseline experiment uses TF-IDF rather than multilingual neural encoders. The significance-testing framework is implemented but not yet exercised on a real paired model comparison. Finally, the corpus is synthetic, so external claims must remain conservative.

## Conclusion

This phase of the project achieved the essential prerequisite for multilingual code-switched retrieval research in this setting: it produced a released French-Swahili-Lingala synthetic corpus, a functioning data collection app for future real speech, and a reproducible baseline retrieval benchmark. The synthesized release contains 9,000 text records and 623 audio clips with frozen splits and metadata. The initial TF-IDF text-to-text baseline reaches an MRR of 0.5803, Recall@1 of 0.4085, and nDCG@5 of 0.6232 on the controlled benchmark.

The correct conclusion is therefore narrow but useful. On the synthetic corpus in this workspace, the project has demonstrated an end-to-end pipeline from dataset construction to baseline retrieval evaluation. It has not yet demonstrated superiority of code-switch-aware neural models, robustness on real DRC speech, or strong cross-modal retrieval performance. Those are the next steps. The immediate follow-on work should be to run SERENGETI and AfriBERTa on the existing benchmark, execute model-vs-model significance tests, expand the high-switch evaluation set, and use the Lilics platform to begin collecting real code-switched audio for external validation.

## Appendix: Concrete Artifacts Produced

- Corpus release: [synthesis_outputs](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs)
- Text corpus: [synthesis_outputs/text/cs_text_dataset.jsonl](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs\text\cs_text_dataset.jsonl)
- Corpus summary: [synthesis_outputs/manifests/summary.json](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\synthesis_outputs\manifests\summary.json)
- Collection app: [lilics](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\lilics)
- Experiment notebook: [experimentation.ipynb](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experimentation.ipynb)
- Experiment exports: [experiment_outputs](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs)
- Baseline metrics: [experiment_outputs/csv/baseline_summary.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\baseline_summary.csv)
- Error analysis template: [experiment_outputs/csv/error_analysis_template.csv](c:\cmu\course-work\spring-1\applications-ai-africa\group-work\experiment_outputs\csv\error_analysis_template.csv)