# Code-Switched French-Swahili-Lingala Corpus

Version: 1.0.0  
Date: 2026-04-24  
License: CC-BY-4.0

## What This Release Contains
- Text: 9000 records in text/cs_text_dataset.jsonl
- Audio: 623 clips in audio/
- Splits: manifests/splits.json
- Metadata: manifests/DATACARD.json, manifests/hf_dataset_info.json, manifests/summary.json

## Generation Summary
- Text pipeline: T0 normalize -> T1 rule constraints -> T2 copy-switch bootstrap -> T4 filters
- Audio pipeline: A0 model setup -> A1 span rendering (XTTS) -> boundary smoothing -> A4 QC gates

## Hugging Face Publishing
1. Create dataset repo on Hugging Face.
2. Upload synthesis_outputs/ preserving text/, audio/, manifests/.
3. Paste DATACARD.json content into dataset card sections.
4. Tag release as v1.0.0.

## Kaggle Publishing
1. Zip synthesis_outputs/ as cs_text_audio_fra_swa_lin_v1.zip.
2. Create Kaggle dataset and upload zip.
3. Copy README + citation + license details from manifests/DATACARD.json.
