# Gamayun Dataset Investigation: Findings

## Problem Statement
User asked: "How can we load the Swahili (Congolese) French pair from CLEAR-Global/Gamayun-kits?"

HuggingFace dataset card lists: "**25,302 Swahili (Congolese)-French parallel pairs**"

## Investigation Results

### What We Found
**The CLEAR-Global/Gamayun-kits HF dataset contains:**
- **622,961 monolingual sentences** in various languages
- Single `text` field per record (no parallel structure)
- Mix of: license agreements (first ~1000 records), numeric tokens (document IDs), English, Spanish, French, and other languages
- **NOT actual language pairs**—only individual sentences aggregated from the Gamayun corpus

### Why the Discrepancy?
The HF dataset page metadata ("25,302 Swahili-French pairs available") refers to **what data exists in the Gamayun portal**, not the structure of this specific HF upload. The CLEAR-Global organization uploaded a **monolingual aggregation**, not the parallel pairs.

### How to Access Actual Swahili-French Pairs

**Option 1: Official Gamayun Portal (Recommended)**
- URL: https://gamayun.translatorswb.org/data/
- Download Swahili-French parallel data directly
- Unzip and parse into parallel corpus format
- Implementation: Custom loader in `cs-synthesis.ipynb`

**Option 2: Alternative HF Datasets**
- Search for: `swahili french parallel`, `machine translation sw-fr`
- Alternatives: Common Voice (French), FLORES, OPUS100 (if includes Swahili)

**Option 3: Synthetic Bootstrap (Current Fallback)**
- Use 5-record seed pairs of manually written code-switched examples
- Employ T1 (rule-constrained MLF) + T2 (copy-switch) to generate 9,000+ synthetic pairs
- **Current state**: Pipeline using this approach, 9,000 records already generated in `synthesis_outputs/text/cs_text_dataset.jsonl`

## Current Implementation

### Fallback Seed Pairs (5 examples)
```
1. "Mambo sana leo. C'est très important." → "sw-fr mixed greeting"
2. "Habari yako? Comment ça va?" → "sw-fr status check"
3. "Rafiki yangu akaja juu. Mon ami vient d'arriver." → "sw-fr narrative"
4. "Nini jina lako? Quel est ton nom?" → "sw-fr questions"
5. "Asante kwa kusaidia. Merci beaucoup for helping!" → "sw-fr gratitude"
```

### CorpusLoader.load_gamayun() Returns
- Attempts to load `CLEAR-Global/Gamayun-kits` (finds monolingual records)
- Logs: "CLEAR-Global/Gamayun-kits loaded: 622961 monolingual records (not language pairs)"
- Falls back to 5 seed pairs
- Synthesis pipeline continues with bootstrap generation

## Recommendation

**For production** (next iteration):
1. Download Swahili-French pairs from **Gamayun portal** directly
2. Implement custom parser in CorpusLoader (likely CSV/TSV format)
3. Seed synthesis pipeline with 500+ real pairs instead of 5
4. Re-run T1/T2 generation to produce higher-quality synthetic code-switched data

**For current submission**:
- Use synthetic bootstrap (9,000 generated records)
- Document limitation in README: "Actual Swahili-French parallel corpus unavailable via HuggingFace; using rule-constrained synthesis bootstrap"
- Note: HF dataset card metadata ≠ actual dataset structure

## Code References
- **CorpusLoader**: [cs-synthesis.ipynb](cs-synthesis.ipynb) cell 9 (execution count 49)
- **Dataset exploration**: [cs-synthesis.ipynb](cs-synthesis.ipynb) cell 8 (execution count 48)
- **Output records**: [synthesis_outputs/text/cs_text_dataset.jsonl](synthesis_outputs/text/cs_text_dataset.jsonl) (9,000 records)
