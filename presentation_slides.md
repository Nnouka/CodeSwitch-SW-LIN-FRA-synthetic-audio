# 5-Minute Presentation: Multi-Language Audio Retrieval for Code-Switched DRC Speech

## Presentation Goal

This deck is designed for a 5-minute project presentation based on the project artifacts and the submitted report. It keeps the focus on the actual contribution of this milestone: building a usable benchmark and validating it with a simple baseline.

## Timing Overview

- Slide 1: 30 seconds
- Slide 2: 45 seconds
- Slide 3: 40 seconds
- Slide 4: 55 seconds
- Slide 5: 55 seconds
- Slide 6: 55 seconds
- Slide 7: 40 seconds

Total: about 5 minutes

---

## Slide 1. Title and One-Sentence Pitch

### On-slide content

**Multi-Language Audio Retrieval for Code-Switched DRC Speech**

- Focus: French, Swahili, and Lingala in eastern DRC
- Problem: no usable benchmark for code-switched retrieval
- Our milestone: build the data, benchmark it, and validate a baseline

### Speaker notes

Hello everyone. Our project focuses on multilingual retrieval for the eastern DRC, where speakers often mix French, Swahili, and Lingala in a single utterance. The core challenge is that there was no ready-to-use benchmark for this setting. So in this phase, instead of claiming a strong model result, we focused on building the missing benchmark infrastructure and validating that it works.

---

## Slide 2. Why This Problem Matters

### On-slide content

**Real speech in eastern DRC is naturally code-switched**

- Swahili often provides the sentence frame
- French carries official or technical vocabulary
- Lingala appears in emphasis, slang, and social nuance
- Monolingual-centric systems break on these mixed inputs

Example:

"Leo tuko na probleme ya maji, mairie ilisema travaux zinaanza kesho matin."

### Speaker notes

In Goma and Bukavu, speech is not cleanly monolingual. People move across languages fluidly. That creates a real problem for retrieval systems, because many existing tools are trained on cleaner monolingual data and do not represent the switching points well. So even when the topic is clear to a local speaker, the model may fail to match the audio or text correctly. This matters for humanitarian communication, public-service information, and future monitoring tools.

---

## Slide 3. Existing Work on Code-Switching

### On-slide content

**There is related work, but not the benchmark we need**

- Code-switch speech and multilingual retrieval are active research areas
- Existing resources cover other language pairs or other tasks
- Nearest real transfer example: English-Swahili code-switching
   - for example, HateSpeech Kenya captures real Swahili-English mixing
- Useful building blocks exist:
   - SERENGETI and AfriBERTa for multilingual text
   - CLAP-style audio-text alignment
   - Gamayun, WaxalNLP, Common Voice as source resources
- Missing piece: a French-Swahili-Lingala retrieval benchmark with frozen splits

### Speaker notes

This project does not start from zero. There is strong prior work on multilingual retrieval, code-switched speech, and African language modeling. One especially relevant reference point is English-Swahili code-switching, including datasets like HateSpeech Kenya, which show real mixing behavior but in a different language pair. Models like SERENGETI and AfriBERTa are important baselines, and resources like Gamayun and WaxalNLP are useful ingredients. But none of these directly gives us a benchmark for French-Swahili-Lingala retrieval in the eastern DRC setting. That is the gap this milestone tries to fill.

---

## Slide 4. What We Built

### On-slide content

**Three concrete outputs**

1. Synthetic trilingual corpus
   - 9,000 text records
   - 623 aligned synthetic audio clips

2. Controlled retrieval benchmark
   - 164 test queries
   - 50 candidates per query
   - 1 gold, 9 hard negatives, 40 random negatives
   - Current retriever: TF-IDF word-bigram + cosine similarity
   - Fit on benchmark texts only, not fine-tuned as a neural model

3. Community data collection app
   - Lilics frontend for consent, prompts, recording, and submission

### Speaker notes

This milestone produced three artifacts. First, we released a synthetic French-Swahili-Lingala corpus with 9,000 text items and 623 aligned audio clips. Second, we converted that corpus into a controlled retrieval benchmark with fixed candidate pools, which lets future models be compared fairly. The current retriever on top of that benchmark is a simple TF-IDF word-bigram baseline with cosine similarity, so this phase is about validating the benchmark rather than training a strong neural model. Third, we scaffolded a community collection app called Lilics so we have a path from synthetic data to real local speech in the next phase.

---

## Slide 5. How the Pipeline Works

### On-slide content

**Data pipeline**

- Start from real parallel corpora
  - French-Swahili Gamayun
  - French-Lingala Gamayun
- Generate code-switched text
  - rule-constrained Matrix Language Frame style substitutions
  - copy-switch variation for diversity
- Render synthetic audio span-by-span
- Apply QC, metadata, and fixed train/dev/test splits

**Key design choice:** benchmark the dataset first before training stronger encoders

### Speaker notes

We used real parallel corpora as source material, especially manually downloaded Gamayun French-Swahili and French-Lingala pairs. From those, we generated code-switched text using controlled substitutions, usually keeping Swahili as the matrix language while inserting French and Lingala spans. We then rendered audio and stored metadata such as language tags, switch points, and provenance. The main engineering decision here was to first make the benchmark reliable before moving to heavier models like SERENGETI or CLAP.

---

## Slide 6. Baseline Results

### On-slide content

**TF-IDF word-bigram baseline on 164-query benchmark**

- MRR: 0.5803
- Recall@1: 0.4085
- nDCG@5: 0.6232
- CSRS: 1.4277

**More detail**

- Low-switch MRR: 0.5837
- Medium-switch MRR: 0.3976
- High-switch MRR: 0.8333, but only 3 queries
- Lingala present: MRR drops from 0.5912 to 0.5385

### Speaker notes

We ran a simple TF-IDF word-bigram retriever, not because it is a strong final model, but because it is a good sanity check. The result is that the benchmark behaves meaningfully: the model often finds the right item early, but not reliably enough to treat the task as solved. The most credible weakness is the medium-switch condition, where performance drops sharply. We also see a modest decline when Lingala is present, which is plausible given the smaller amount of Lingala-bearing material.

Suggested visual: include the switch-band plot from `experiment_outputs/plots/baseline_mrr_by_switch_band.png`.

---

## Slide 7. What This Means, Limits, and Next Steps

### On-slide content

**Main takeaway**

- The contribution is the benchmark and data pipeline, not a state-of-the-art model

**Current limitations**

- Dataset is synthetic
- Switch-band distribution is imbalanced
- Source-family leakage exists across splits for future learned models

**Next steps**

- collect real eastern DRC speech with Lilics
- rebuild family-disjoint splits
- evaluate stronger models: SERENGETI, AfriBERTa, CLAP

### Speaker notes

The most honest interpretation is that this phase turns an idea into an experimental asset. We now have a reproducible corpus, a fixed benchmark, baseline metrics, and an app for future community collection. At the same time, we need to be clear about the limits: the benchmark is synthetic, the switch-band counts are uneven, and the leakage report shows that future learned models should use family-disjoint splits. So the next step is not to oversell the current numbers. It is to strengthen the benchmark and then test better multilingual and cross-modal models on it.

---

## Optional Closing Line

We did not solve multilingual retrieval for the DRC yet, but we built the benchmark, dataset, and collection path needed to study it rigorously.

## Q&A Backup Points

- Why synthetic data first: because no usable trilingual benchmark existed.
- Why TF-IDF first: to validate benchmark construction before heavier models.
- Why Lilics matters: it creates a path to real community-sourced speech.
- Biggest technical risk: split leakage and limited real-world external validity.
