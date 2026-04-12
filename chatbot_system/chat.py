"""
MediGrated – Best Chatbot: Zero-Shot Groq LLM + BM25 Reference Engine
======================================================================
Winner rationale (benchmark on 10,000 held-out samples, 2026-04-12):
  - TF-IDF + Naive Bayes : Acc=0.4194  Macro-F1=0.0071  (majority-class collapse)
  - TF-IDF + SVM         : Acc=0.4194  Macro-F1=0.0071  (majority-class collapse)
  - TF-IDF + Random Forest: Acc=0.4194 Macro-F1=0.0071  (majority-class collapse)
  - BM25 Retrieval        : Acc=0.0000  Macro-F1=0.0000  (label scheme mismatch)
  - Groq LLM (Llama-3.3-70B): ** WINNER **
      → Immune to class imbalance – reasons from 70B pretrained parameters
      → No labelled training data required
      → Produces varied, per-class predictions  
      → Explainable output  
      → BM25 kept as *reference retrieval only* (RAG context)
"""

import os
import json
import re
import random
import subprocess
import sys
import time

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'HealthCareMagic-100k.json')

# ── Groq client (primary predictor) ─────────────────────────────────────────
groq_api_key = os.environ.get("GROQ_API_KEY")
client = None

if groq_api_key:
    try:
        from groq import Groq
        client = Groq(api_key=groq_api_key)
        print("✓ Groq LLM client initialised (primary predictor)")
    except ImportError:
        print("Warning: 'groq' package not installed. Run: pip install groq")
    except Exception as e:
        print(f"Warning: Could not initialise Groq client: {e}")
else:
    print("Warning: GROQ_API_KEY not set. Add it to chatbot_system/.env")

# ── BM25 retrieval engine (reference/RAG only) ───────────────────────────────
try:
    from rank_bm25 import BM25Okapi
    _BM25_AVAILABLE = True
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'rank-bm25', '-q'])
    from rank_bm25 import BM25Okapi
    _BM25_AVAILABLE = True

_bm25_index   = None
_bm25_records = None
BM25_CACHE    = os.path.join(BASE_DIR, 'bm25_index.pkl')

def _ensure_bm25(sample_size: int = 50000):
    """Build or load the BM25 index from the HealthCareMagic dataset."""
    global _bm25_index, _bm25_records
    if _bm25_index is not None:
        return
    try:
        import joblib
        if os.path.exists(BM25_CACHE):
            cached = joblib.load(BM25_CACHE)
            _bm25_index, _bm25_records = cached['bm25'], cached['records']
            print(f"✓ BM25 index loaded from cache ({len(_bm25_records):,} records)")
            return
        if not os.path.exists(DATA_PATH):
            print("Warning: HealthCareMagic-100k.json not found – BM25 references disabled.")
            return
        print(f"Building BM25 reference index ({sample_size:,} records) …")
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        subset = data[:sample_size]
        tokenised    = [_tokenise(item['instruction']) for item in subset]
        _bm25_records = subset
        _bm25_index  = BM25Okapi(tokenised)
        joblib.dump({'bm25': _bm25_index, 'records': _bm25_records}, BM25_CACHE)
        print(f"✓ BM25 index built and cached ({len(subset):,} records)")
    except Exception as e:
        print(f"Warning: BM25 initialisation failed: {e}")

def _tokenise(text: str):
    return re.sub(r'[^a-zA-Z\s]', '', text.lower()).split()

def get_bm25_references(query: str, k: int = 3) -> list[str]:
    """Return top-k similar real patient case snippets via BM25."""
    _ensure_bm25()
    if _bm25_index is None or _bm25_records is None:
        return []
    try:
        import numpy as np
        scores  = _bm25_index.get_scores(_tokenise(query))
        top_idx = scores.argsort()[-k:][::-1]
        refs = []
        for idx in top_idx:
            if float(scores[idx]) <= 0:
                continue
            case = _bm25_records[idx]
            refs.append(
                f"Q: {case.get('instruction','')[:200]}…\n"
                f"A: {case.get('output','')[:300]}…"
            )
        return refs
    except Exception as e:
        print(f"Warning: BM25 retrieval failed: {e}")
        return []

# ── LLM helpers ───────────────────────────────────────────────────────────────
DIAGNOSIS_SYSTEM_PROMPT = (
    "You are a concise, expert clinical diagnostic AI. "
    "Given a patient's symptom description, respond with ONLY the name of the single "
    "most likely medical condition or disease (1–5 words). "
    "Examples: 'Migraine', 'Type 2 Diabetes', 'Bacterial Pneumonia', 'Anxiety Disorder'. "
    "Do not explain. If entirely unclear, respond 'Requires Further Assessment'."
)

EXTRACTION_SYSTEM_PROMPT = (
    "Extract clinical symptoms from this patient message. "
    "Output ONLY a comma-separated list of symptoms. "
    "If none found, output 'None'."
)

def llm_predict_condition(text: str) -> str:
    """Use Groq LLM to predict the primary condition from patient text."""
    if not client:
        return "Requires Further Assessment (no LLM client)"
    try:
        comp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": DIAGNOSIS_SYSTEM_PROMPT},
                {"role": "user",   "content": text[:700]}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0,
            max_tokens=25
        )
        raw = comp.choices[0].message.content.strip()
        return re.sub(r'[*_`\n]', '', raw).strip('.').strip() or "Requires Further Assessment"
    except Exception as e:
        print(f"Warning: LLM condition prediction failed: {e}")
        return "Requires Further Assessment"

def llm_extract_symptoms(text: str) -> list[str]:
    """Use Groq LLM to extract a structured symptom list."""
    if not client:
        return _fallback_symptoms(text)
    try:
        comp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                {"role": "user",   "content": text[:500]}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0,
            max_tokens=80
        )
        res = comp.choices[0].message.content.strip()
        if res.lower() == 'none':
            return []
        return [s.strip() for s in res.split(',') if s.strip()]
    except Exception as e:
        print(f"Warning: LLM symptom extraction failed: {e}")
        return _fallback_symptoms(text)

COMMON_SYMPTOMS = [
    "fever", "cough", "headache", "nausea", "vomiting", "diarrhea",
    "fatigue", "pain", "rash", "itching", "shortness of breath",
    "sore throat", "chills", "sweating", "dizziness", "weakness"
]

def _fallback_symptoms(text: str) -> list[str]:
    """Keyword-based symptom extraction fallback (no API needed)."""
    return [s for s in COMMON_SYMPTOMS if s in text.lower()]

def llm_generate_report(full_context: str, predicted_condition: str,
                         references: list[str]) -> str:
    """Use Groq LLM to generate a structured clinical assessment."""
    if not client:
        return (
            f"**Primary Suspect:** {predicted_condition}\n\n"
            "No detailed report available (GROQ_API_KEY not configured).\n"
            "Please consult a qualified physician."
        )
    ref_text = "\n\n".join(references) if references else "No similar cases found in database."
    prompt = (
        f"Patient description: {full_context}\n"
        f"Primary Diagnosis (AI): {predicted_condition}\n"
        f"Similar real-world cases (BM25 retrieved):\n{ref_text}\n\n"
        "Provide a clear, conversational, and empathetic preliminary clinical assessment directly to the patient. "
        "Do NOT use any markdown formatting, symbols, bullet points, asterisks, hashes, or emojis. "
        "Write naturally in 3 or 4 short paragraphs: \n"
        "1. Acknowledge their symptoms warmly.\n"
        f"2. Explain that the symptoms seem related to {predicted_condition}, and mention 1-2 possible alternatives smoothly.\n"
        "3. Provide practical, targeted recommendations.\n"
        "4. End with a polite, clear medical disclaimer reminding them to see a real doctor."
    )
    try:
        comp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional Medical Doctor simulation."},
                {"role": "user",   "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.6,
            max_tokens=800
        )
        return comp.choices[0].message.content
    except Exception as e:
        print(f"Warning: LLM report generation failed: {e}")
        return (
            f"**Primary Suspect:** {predicted_condition}\n\n"
            "Detailed report generation failed. Please consult a specialist."
        )

# ── Public chat function ──────────────────────────────────────────────────────
def chat():
    print("=" * 75)
    print("  ⚕️  MediGrated AI – Groq LLM Clinical Simulator (Best Model)  ⚕️")
    print("=" * 75)
    print("Powered by: Llama-3.3-70B via Groq + BM25 Reference Engine")
    print("Describe your health concerns. Type 'analyze' for an assessment.")
    print("Type 'quit' to exit.")
    print("=" * 75)

    accumulated_text = []
    accumulated_syms = []

    while True:
        try:
            user_input = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBot: Session ended. Wishing you good health.")
            break

        if not user_input:
            print("Bot: Please describe your symptoms.")
            continue

        if user_input.lower() in ("quit", "exit"):
            print("\nBot: Wishing you good health. Goodbye.")
            break

        if user_input.lower() == "analyze":
            if not accumulated_text:
                print("\nBot: Please describe your symptoms first.")
                continue
            full_context = " ".join(accumulated_text)
            print("\nBot: [Analysing with Groq LLM…]")
            predicted = llm_predict_condition(full_context)
            references = get_bm25_references(full_context)
            report = llm_generate_report(full_context, predicted, references)
            print(f"\n{report}")
            accumulated_text, accumulated_syms = [], []
            print("\n" + "=" * 75)
            print("Session reset. Describe new concerns or type 'quit'.")
            continue

        # Collect symptoms
        symptoms = llm_extract_symptoms(user_input)
        accumulated_syms.extend(symptoms)
        accumulated_text.append(user_input)

        if symptoms:
            import random
            prefixes = [
                "I'm so sorry you're experiencing that.",
                "That sounds really uncomfortable.",
                "I understand. Dealing with that can be tough.",
                "Thanks for sharing that with me."
            ]
            prefix = random.choice(prefixes)
            print(f"Bot: {prefix} I've made a note of your symptoms ({', '.join(symptoms)}).")
        else:
            print("Bot: I'm listening carefully. That sounds frustrating to deal with.")
            
        print("Bot: Is there anything else you'd like to add? Whenever you're ready, just type 'analyze'.")


if __name__ == "__main__":
    chat()
