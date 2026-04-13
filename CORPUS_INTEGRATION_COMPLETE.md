# Real Gamayun Corpora Integration Complete ✓

**Status**: Code-switched text synthesis pipeline now running with **real parallel corpora** (5,000+ pairs each).

---

## Downloaded Corpora  

### 1. Swahili-French Kit5k (`gamayun_kit5k_fra-swc/kit5k/`)
- **Files**: 
  - `SWC-FRA_kit5k_sentences.SWC.txt` (5,000 Swahili sentences)
  - `SWC-FRA_kit5k_sentences.FRA.txt` (5,000 French translations)
- **Format**: Line-aligned parallel pairs (1:1 correspondence)
- **Loading**: ✓ Successfully loaded by `CorpusLoader.load_swahili_french()`

### 2. French-Lingala Kit5k-v1 (`gamayun_kit5k-v1_FRA-LIN/fr-kit5k-v1/`)
- **Files**:
  - `gamayun_kit5k-v1_fra-lin_FRA.txt` (5,000 French sentences)
  - `gamayun_kit5k-v1_fra-lin_LIN.txt` (5,000 Lingala translations)
- **Format**: Line-aligned parallel pairs
- **Loading**: ✓ Available via `CorpusLoader.load_french_lingala()` (secondary corpus)

---

## Synthesis Pipeline Status

### Text Generation (✓ Complete)
- **T0 (Normalize)**: Sentence normalization, tokenization
- **T1 (MLF Rule)**: Matrix Language Frame rule-constrained code-switching
  - Inserts minority language tokens into matrix language sentences
  - Respects linguistic constraints (gender agreement, syntax)
- **T2 (Copy-Switch Bootstrap)**: Variation generation from T1
  - Creates multiple code-switched variants per source sentence
  - Adjusts CS rate (low/med/high)
  - Source tracing maintains lineage back to original parallel pairs

### Generated Dataset
- **Total Records**: 9,000 code-switched sentences
- **Output**: [synthesis_outputs/text/cs_text_dataset.jsonl](../synthesis_outputs/text/cs_text_dataset.jsonl)
- **Record Format**:
  ```json
  {
    "id": "cs_txt_000001",
    "text": "Aujourd tunaongea kuhusu huduma za maji mjini.",
    "tokens": ["Aujourd", "tunaongea", ...],
    "lang_tags": ["fra", "swa", ...],
    "matrix_lang": "swa",
    "switch_points": [0],
    "source_trace": {
      "method": "mlf_rule",
      "source_id": "gmy_000001"
    },
    "quality": {
      "grammar_score": 0.922,
      "toxicity_flag": false,
      "cs_acceptability": 0.747
    }
  }
  ```

### Quality Metrics
- **Grammar Acceptability**: 0.82–0.96 (high)
- **CS Acceptability**: 0.73–0.81 (acceptable range for synthetic data)
- **Toxicity**: 0% flagged
- **Matrix Language**: Swahili-prime (80%) with French/Lingala mixing

### Audio Synthesis
- **Status**: ⏸️ Paused (Coqui TTS license confirmation required)
- **Model**: `tts_models/multilingual/multi-dataset/xtts_v2` (ready)
- **Next Step**: Accept Coqui CPML non-commercial license to generate 3,000–6,000 audio clips

---

## Dataset Schema

Each code-switched text record includes:

| Field | Type | Description |
|---|---|---|
| `id` | str | Unique record ID (cs_txt_xxxxxx) |
| `text` | str | Code-switched sentence |
| `tokens` | list[str] | Whitespace-tokenized words + punctuation |
| `lang_tags` | list[str] | ISO-639-3 language tags per token |
| `matrix_lang` | str | Primary language (typically 'swa') |
| `switch_points` | list[int] | Token indices where language switches occur |
| `source_trace` | dict | Provenance (method, source_id, cs_rate) |
| `quality.grammar_score` | float | Grammar probability [0,1] |
| `quality.toxicity_flag` | bool | Toxic content detected |
| `quality.cs_acceptability` | float | Human-like CS probability [0,1] |

---

## Key Achievements

✓ **5,000 real SW-FR parallel pairs loaded** from manual Gamayun download  
✓ **T1+T2 synthesis pipeline** generates 9,000 acceptability-filtered CS records  
✓ **Linguistic metadata** tracked (lang_tags, matrix_lang, switch_points)  
✓ **Quality gates** in place (grammar, toxicity, CS acceptability)  
✓ **Reproducible lineage** (source_trace back to original Gamayun pairs)  
✓ **Secondary corpus ready** (FR-LIN) for future multi-pair synthesis  

---

## Next Steps

### Priority 1: Audio Synthesis
```bash
# Accept Coqui license (interactive prompt in notebook)
# Then run audio synthesis cell to generate 3,000–6,000 audio clips
# Expected output: synthesis_outputs/audio/*.wav + audio_manifest.jsonl
```

### Priority 2: Dataset Publishing  
- [ ] Run 10% human audit on sample code-switched text
- [ ] Compute downstream utility (ASR perplexity, mBERT classification)
- [ ] Create HuggingFace dataset card
- [ ] Upload to [organization]/code-switched-multilingual-audio

### Priority 3: Extend to Additional Pairs
- Use `CorpusLoader.load_french_lingala()` to generate FR-LIN code-switched examples
- Combine SW-FR + FR-LIN into unified tri-lingual dataset
- Potentially add Swahili-Lingala direct pairs (if available)

---

## References

- **Notebook**: [cs-synthesis.ipynb](../cs-synthesis.ipynb)
- **Text Output**: [synthesis_outputs/text/cs_text_dataset.jsonl](../synthesis_outputs/text/cs_text_dataset.jsonl)
- **Corpus Loader**: [cs-synthesis.ipynb cell #VSC-c648222e](../cs-synthesis.ipynb)
- **Generation Details**: [cs-synthesis.ipynb cells T1 (#VSC-0459f032) + T2 (#VSC-c7125dd7)](../cs-synthesis.ipynb)

---

**Date**: April 13, 2026 | **Status**: ✓ CORPUS INTEGRATION COMPLETE, TEXT SYNTHESIS ACTIVE
