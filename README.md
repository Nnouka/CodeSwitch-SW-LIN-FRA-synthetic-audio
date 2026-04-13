Application of AI in Africa - Language project


# A Multi-Language Audio Retrieval System for Code-Switched French-Swahili-Lingala Mix in Eastern DRC

Semantic Alignment of Swahili, French, and Lingala Audio for Real-World Central African Communication

## 1. Problem Definition

### Regional Framing (DRC & Cameroon)

In the Democratic Republic of Congo (DRC) and Cameroon, communication is rarely monolingual. In the DRC, speakers fluidly switch between French, Swahili, and Lingala. In Cameroon, the mix typically involves French, English, and Cameroon Pidgin. Standard AI models (like OpenAI’s Whisper or Google’s Gemini) are trained on "clean" monolingual data. When a user in Goma records a voice note switching from French to Swahili, these models often "hallucinate" or fail to retrieve the correct meaning because the acoustic embeddings do not represent the transition points between languages.

### Local Framing (Eastern DRC Focus)
The specific challenge in Eastern DRC is the fluid, trilingual nature of the Swahili spoken there. Unlike "Standard Swahili," the local variety acts as a structural base that seamlessly incorporates French (for technical/official terms) and Lingala (for slang, emphasis, or cultural nuance).

### The Problem:

Current AI retrieval systems are "monolingual-centric." If a citizen records a voice note in Goma or Bukavu saying: "Njo maana ba politiciens ba-utiliser lingala pamba pamba pour distract batus" (That's why politicians use Lingala just to distract people), a standard model fails.

### The Gap:

It cannot map the French word "politiciens", the Lingala phrase "pamba pamba" (uselessly/anyhow), and the Swahili syntax into a single semantic vector. This makes it impossible for local stakeholders to perform cross-modal searches—such as searching for "political corruption" via text and successfully finding this specific audio clip.

### Stakeholder Relevance & SDGs

Civil Society & Peacebuilders: To detect rising tensions or rumors in local radio and "street" speech before they escalate into physical conflict.
Electoral Commissions: Monitoring political discourse that frequently switches between languages to target different ethnic groups or bypass standard keyword filters.
SDG 16 (Peace, Justice, and Strong Institutions): By building tools to monitor incitement and hate speech in the actual language of the people, we strengthen regional stability and accountability.
SDG 9 (Industry, Innovation, and Infrastructure): Developing "Afro-centric" AI infrastructure that doesn't require users to speak "pure" colonial languages to be digitally visible.

## 2. Dataset Strategy
We will use a multi-pronged dataset approach to "teach" the model the transitions between languages.

| Dataset | Primary Use in Project |
| ------- | ---------------------- |
| 8.8 AB: Gamayun Kit | Provides the specific Swahili-French code-switching pairs common in the DRC. [Masakhane] |
| 8.7 AB: HateSpeech Kenya | Used for Transfer Learning; the Swahili-English code-switching patterns help the model learn the "logic" of switching between two different grammars. [Kaggle] |
| Google Waxal NLP | Crucial for Lingala & Swahili audio. We use this to ground our text models in real Congolese phonetics and audio signatures. [by Google on Huggingface] |
| 8.9 AB: Swahili News | Serves as the "Formal Baseline" to ensure the model maintains high accuracy for core Swahili vocabulary. [Kaggle] |

8.7 AB: HateSpeech Kenya Dataset: This dataset contains tweets from the 2017 Kenyan election cycle, and captures a mix of English and Swahili (code-switching) used in political discourse. The dataset has 48076 tweets manually labeled as Hate Speech, Offensive, or Neither.  https://www.kaggle.com/datasets/edwardombui/hatespeech-kenya 

8.8. AB: Gamayun French-Swahili (Congo) Kit:  This is a dataset of sentences in the Swahili variations of the DRC (Swahili and French code-switched), selected from the Tatoeba corpus from everyday language without any domain specificity. The dataset contains 10,305 parallel sentence pairs in Congolese Swahili. 
https://gamayun.translatorswb.org/download/gamayun-medium-kit-15k-chunk-1-2-swc-fra/ 

8.9. AB: Swahili News Classification Dataset: This dataset features formal news articles from Tanzanian media using standard, monolingual Swahili. The dataset contains 5151 training and 1288 test rows of news content across 5 categories (National, International, Business, Sports, and Entertainment).
https://www.kaggle.com/datasets/alfredkondoro/swahili-news-classification-zindi?select=Train.csv 

https://huggingface.co/datasets/google/WaxalNLP 

## 3. Experiment Plan: Cross-Modal Semantic Bridge

The goal is to build a system where a query in one language (e.g., a text search for "violence") can retrieve audio or text containing that concept in any mix of the three languages.

### A. Candidate Models for Evaluation
We will evaluate the following architectures for their ability to handle the Eastern DRC mix:

1. Serengeti: A massively multilingual model covering 517 African languages. We will use it as the primary text encoder to see if its broad linguistic base captures the nuances of the DRC mix.

2. AfriBERTa: A model specifically optimized for low-resource African languages. We will use this to generate text-to-text embeddings for our retrieval task.

3. CLAP (Contrastive Language-Audio Pretraining): We will fine-tune a CLAP-based architecture using Waxal NLP to align audio signals with text embeddings.

4. CLASP (Contrastive Language-Speech Pretraining): An alternative designed for audio-text information retrieval that often handles multilingual data more efficiently than traditional ASR.

### B. Retrieval Tasks

1. Text-to-Text (T2T): * Query: "Corruption" (French)

- Result: "Kula rushwa na pamba pamba" (Swahili/Lingala mix).

2. Audio-to-Text (A2T) / Text-to-Audio (T2A): * Query (Text): "Conflict"

- Result (Audio): A voice note clip containing "...batu ya bitumba..." (Lingala/Swahili mix).

### C. Evaluation Metrics

- Mean Reciprocal Rank (MRR): To measure how high the "correct" concept appears in search results across the mix.

- Code-Switching Robustness Score: Measuring the drop in retrieval accuracy as the percentage of mixed-language tokens increases.


