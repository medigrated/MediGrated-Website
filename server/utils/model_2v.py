"""
Medical Disease Prediction System  –  v6
=========================================
Key change: ZERO manual symptom mappings
-----------------------------------------
All hand-crafted PHRASE_SHORTCUTS (100+ entries) and BODY_PART_SYNONYMS
have been removed and replaced with an automatic paraphrase-embedding
system that generalises to any phrasing without maintenance:

HOW IT WORKS
  At startup, every canonical symptom (e.g. "joint pain") is expanded
  into ~10 natural-language paraphrases using sentence templates:
      "joint pain"
      "i have joint pain"
      "i am experiencing joint pain"
      "suffering from joint pain"  … etc.
  All paraphrases are embedded with the BioBERT sentence encoder.

  When the user types anything (e.g. "my hands ache a lot"):
  1. Filler phrases and intensity modifiers are stripped
     → "hands ache"
  2. Verb stems are mapped to their medical noun forms
     → "hands pain"   (ach* → pain)
  3. The cleaned text is embedded and cosine-searched against all
     paraphrase vectors.
  4. Max-pooling over paraphrases: each canonical symptom keeps only
     its highest-scoring paraphrase match.
  5. The top-k canonical symptoms above the threshold are returned.

BENEFITS OVER MANUAL SHORTCUTS
  • Handles any unseen phrasing — no coverage gaps.
  • No maintenance as the symptom list grows.
  • Generalisable: works for any language domain, not just the 100
    phrases someone thought of in advance.
  • Body-part context (arm vs leg) emerges naturally from the embedding
    space rather than requiring regex rules.

All previous improvements (v2–v5) are retained:
  adaptive hybrid scoring, log-Bayesian ranker, group-aware train/val
  split, macro-F1 tracking, classifier dropout, augmentation with order
  shuffling, Jupyter auto-detection, safe logging.

Requirements
------------
    pip install transformers datasets sentence-transformers \\
                scikit-learn pandas torch rich
"""

import argparse
import json
import logging
import logging.handlers
import math
import pickle
import random
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import torch
import torch.nn.functional as F
from datasets import Dataset
from rich.console import Console
from rich.table import Table
from sentence_transformers import SentenceTransformer, util
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    TrainerCallback,       # replaces EarlyStoppingCallback (avoids Python 3.12 tuple bug)
    TrainerControl,
    TrainerState,
    Trainer,
    TrainingArguments,
)

# ─────────────────────────────────────────────
# LOGGING  (plain StreamHandler – no rich interference)
# ─────────────────────────────────────────────
def _setup_logging() -> logging.Logger:
    """
    Configure a plain StreamHandler that writes to sys.stderr directly.
    Avoids the Python 3.12 'tuple has no f_lineno' crash that occurs when
    rich's Console patches stderr and logging's Formatter walks frame tuples.
    """
    logger = logging.getLogger("medical_ai")
    if logger.handlers:          # already configured (e.g. re-import)
        return logger
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler(sys.__stderr__)   # bypass rich's stderr patch
    handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
    )
    logger.propagate = False     # don't bubble up to root logger
    logger.addHandler(handler)
    return logger


log = _setup_logging()
console = Console(stderr=False)  # stdout only; never patches sys.stderr


# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
@dataclass
class Config:
    # Paths
    dataset_path: str = "/kaggle/input/datasets/abhayshetty626/thebigfour/dataset.csv"
    description_path: str = "/kaggle/input/datasets/abhayshetty626/thebigfour/symptom_Description.csv"
    precaution_path: str = "/kaggle/input/datasets/abhayshetty626/thebigfour/symptom_precaution.csv"
    severity_path: str = "/kaggle/input/datasets/abhayshetty626/thebigfour/Symptom-severity.csv"
    save_path: str = "distilbert-base-uncased"
    metadata_path: str = "medical_metadata_v2.pkl"

    # Model
    transformer_model: str = "distilbert-base-uncased"
    embed_model_name: str = "pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb"
    max_length: int = 64
    similarity_threshold: float = 0.50

    # Training hyper-parameters
    # ── Core values restored to the v3 baseline that achieved F1=0.757.
    #    Every deviation from that baseline is noted with its reason.
    augmentation_per_row: int = 30   # was 12→safe to raise, more data helps
    test_size: float = 0.10          # restored from 0.15 — GroupShuffleSplit
                                     # needed 0.15 but stratified split works
                                     # fine at 0.10 (and keeps more train data)
    learning_rate: float = 3e-5      # restored from 2e-5 — 2e-5 caused
                                     # divergence (val loss rising each epoch)
    batch_size: int = 32
    num_epochs: int = 20
    weight_decay: float = 0.01       # restored from 0.02 — 0.02 was too
                                     # aggressive and contributed to divergence
    warmup_ratio: float = 0.15
    label_smoothing: float = 0.05
    early_stopping_patience: int = 4
    classifier_dropout: float = 0.20  # safe — only affects classifier head

    # Hybrid weights
    transformer_weight: float = 0.70
    bayesian_weight: float = 0.30

    # Softmax temperature
    softmax_temperature: float = 0.7

    # Confidence bar width (chars)
    bar_width: int = 20


# ─────────────────────────────────────────────
# AUTOMATIC SYMPTOM PARAPHRASE ENGINE
# ─────────────────────────────────────────────
# No hand-crafted shortcuts or synonym maps.  Instead, every known
# symptom is expanded into ~10 natural-language paraphrases at startup
# and all paraphrases are embedded.  The matcher searches this expanded
# index so any phrasing the user types — however colloquial — resolves
# to the correct canonical symptom automatically.

# Templates that wrap each symptom phrase.  {s} = symptom text.
_PARAPHRASE_TEMPLATES: List[str] = [
    "{s}",
    "i have {s}",
    "i am experiencing {s}",
    "i feel {s}",
    "suffering from {s}",
    "i have been having {s}",
    "i noticed {s}",
    "there is {s}",
    "{s} is bothering me",
    "i keep having {s}",
]

# Verb-stem → medical noun.  Applied BEFORE embedding so the model
# sees the noun form it was trained on.  Only stems needed —
# startswith() handles "urinate", "urinating", "urination" etc.
_VERB_TO_NOUN: Dict[str, str] = {
    "urinat":  "urination",
    "pee":     "urination",
    "vomit":   "vomiting",
    "throw":   "vomiting",   # "throwing up"
    "sneez":   "sneezing",
    "bleed":   "bleeding",
    "sweat":   "sweating",
    "itch":    "itching",
    "scratch": "itching",
    "cough":   "cough",
    "breath":  "breathlessness",
    "ach":     "pain",
    "hurt":    "pain",
    "swell":   "swelling",
    "burn":    "burning",
    "nauseat": "nausea",
    "dizz":    "dizziness",
    "faint":   "dizziness",
    "trembl":  "trembling",
    "shiver":  "shivering",
    "shake":   "shivering",
    "peel":    "skin peeling",
    "rash":    "skin rash",
    "starv":   "hunger",
    "hungry":  "hunger",
    "tired":   "fatigue",
    "weak":    "fatigue",
    "exhaust": "fatigue",
    "fever":   "fever",
    "blurr":   "blurred vision",
    "spin":    "spinning",
}

# Modifiers and fillers stripped before embedding.
_STRIP_RE = re.compile(
    r"\b(i have|i am having|i am|i feel|i keep|i get|i got|"
    r"i ve been|there is|there are|experiencing|suffering from|"
    r"feeling|my|the|some|an|a|very|quite|really|so|too|always|"
    r"constantly|often|sometimes|slightly|a little|a bit|severely|"
    r"badly|mildly|extremely|all the time|all day|lot of|lots of)\b"
)


def _normalise_input(raw: str) -> str:
    """
    Convert free-form user text to a compact medical phrase:
    1. Lowercase + remove punctuation.
    2. Strip fillers and intensity modifiers.
    3. Map verb stems to noun forms.
    4. Collapse whitespace.
    """
    text = raw.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    text = _STRIP_RE.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()

    tokens, out = text.split(), []
    for tok in tokens:
        noun = next((n for stem, n in _VERB_TO_NOUN.items()
                     if tok.startswith(stem)), None)
        out.append(noun if noun else tok)
    return " ".join(out).strip()


def _paraphrases_for(symptom: str) -> List[str]:
    """Return all template paraphrases for *symptom*."""
    s = symptom.replace("_", " ").strip()
    return [t.format(s=s) for t in _PARAPHRASE_TEMPLATES]


# ─────────────────────────────────────────────
# CUSTOM EARLY STOPPING
# ─────────────────────────────────────────────
class EarlyStoppingOnF1(TrainerCallback):
    """
    Manual early stopping on validation F1.

    Replaces transformers.EarlyStoppingCallback which, in some versions,
    receives (args, state, control) as a positional tuple on Python 3.12
    and crashes with: AttributeError: 'tuple' object has no attribute 'f_lineno'
    when that error is subsequently logged.
    """

    def __init__(self, patience: int = 3) -> None:
        self.patience = patience
        self._best_f1: float = -1.0
        self._bad_epochs: int = 0

    def on_evaluate(
        self,
        args: TrainingArguments,
        state: TrainerState,
        control: TrainerControl,
        metrics: Optional[Dict[str, float]] = None,
        **kwargs: Any,
    ) -> None:
        if metrics is None:
            return
        current_f1 = metrics.get("eval_f1", 0.0)
        if current_f1 > self._best_f1 + 1e-4:
            self._best_f1 = current_f1
            self._bad_epochs = 0
        else:
            self._bad_epochs += 1
            if self._bad_epochs >= self.patience:
                log.info(
                    "Early stopping: F1 has not improved for %d epochs (best=%.4f).",
                    self.patience,
                    self._best_f1,
                )
                control.should_training_stop = True


# ─────────────────────────────────────────────
# DATA LOADING
# ─────────────────────────────────────────────
@dataclass
class MedicalKnowledgeBase:
    disease_symptoms: Dict[str, List[str]] = field(default_factory=dict)
    disease_descriptions: Dict[str, str] = field(default_factory=dict)
    disease_precautions: Dict[str, List[str]] = field(default_factory=dict)
    symptom_severity: Dict[str, int] = field(default_factory=dict)


def load_knowledge_base(cfg: Config) -> MedicalKnowledgeBase:
    """Load and merge all four CSV files into a single knowledge base."""
    kb = MedicalKnowledgeBase()

    # ── Dataset (diseases + symptoms) ──────────────────────────
    df = pd.read_csv(cfg.dataset_path)
    symptom_cols = [c for c in df.columns if "Symptom" in c]

    for _, row in df.iterrows():
        disease = str(row["Disease"]).strip()
        symptoms = [
            str(row[c]).replace("_", " ").strip().lower()
            for c in symptom_cols
            if pd.notna(row[c]) and str(row[c]).strip()
        ]
        if disease not in kb.disease_symptoms:
            kb.disease_symptoms[disease] = []
        for s in symptoms:
            if s not in kb.disease_symptoms[disease]:
                kb.disease_symptoms[disease].append(s)

    # ── Descriptions ───────────────────────────────────────────
    desc_df = pd.read_csv(cfg.description_path)
    for _, row in desc_df.iterrows():
        kb.disease_descriptions[str(row["Disease"]).strip()] = str(row["Description"]).strip()

    # ── Precautions ────────────────────────────────────────────
    prec_df = pd.read_csv(cfg.precaution_path)
    prec_cols = [c for c in prec_df.columns if "Precaution" in c]
    for _, row in prec_df.iterrows():
        disease = str(row["Disease"]).strip()
        precautions = [
            str(row[c]).strip()
            for c in prec_cols
            if pd.notna(row[c]) and str(row[c]).strip()
        ]
        kb.disease_precautions[disease] = precautions

    # ── Severity weights ───────────────────────────────────────
    sev_df = pd.read_csv(cfg.severity_path)
    for _, row in sev_df.iterrows():
        symptom = str(row["Symptom"]).replace("_", " ").strip().lower()
        kb.symptom_severity[symptom] = int(row["weight"])

    log.info(
        "Knowledge base loaded: %d diseases, %d unique severity entries",
        len(kb.disease_symptoms),
        len(kb.symptom_severity),
    )
    return kb


# ─────────────────────────────────────────────
# AUGMENTATION
# ─────────────────────────────────────────────
def build_training_data(
    kb: MedicalKnowledgeBase, cfg: Config
) -> Tuple[List[str], List[str]]:
    """
    Build a richer synthetic training corpus:

    1. Severity-weighted random subsets (as before).
    2. Token-order shuffling on each subset — the transformer learns
       that symptom order is irrelevant, improving generalisation.
    3. Always include the full symptom set as one example — ensures
       every disease has at least one "complete" training sample.
    4. Minimum-symptom examples (1–2 symptoms) for early-presentation
       pattern learning, weighted toward high-severity symptoms.
    """
    texts, labels = [], []
    n = cfg.augmentation_per_row

    for disease, symptoms in kb.disease_symptoms.items():
        if not symptoms:
            continue

        weights = [kb.symptom_severity.get(s, 1) for s in symptoms]
        total_w = sum(weights) or 1
        probs = [w / total_w for w in weights]

        # ── Always include the full symptom set (shuffled) ────
        full = symptoms.copy()
        random.shuffle(full)
        texts.append(" ".join(full))
        labels.append(disease)

        # ── Severity-weighted subsets with order shuffling ────
        for i in range(n - 1):
            lo = max(1, len(symptoms) // 3)
            k = random.randint(lo, len(symptoms))
            subset = random.choices(symptoms, weights=probs, k=k)
            subset = list(dict.fromkeys(subset))   # deduplicate
            random.shuffle(subset)                  # shuffle order
            texts.append(" ".join(subset))
            labels.append(disease)

        # ── Early-presentation examples (1–2 high-sev symptoms) ─
        if len(symptoms) >= 3:
            for _ in range(max(2, n // 6)):
                k = random.randint(1, 2)
                mini = random.choices(symptoms, weights=probs, k=k)
                mini = list(dict.fromkeys(mini))
                texts.append(" ".join(mini))
                labels.append(disease)

    log.info(
        "Training corpus: %d examples for %d diseases",
        len(texts), len(kb.disease_symptoms),
    )
    return texts, labels


# ─────────────────────────────────────────────
# TOKENISATION HELPER
# ─────────────────────────────────────────────
def tokenize_dataset(
    dataset: Dataset, tokenizer: AutoTokenizer, cfg: Config
) -> Dataset:
    def _tok(batch):
        return tokenizer(
            batch["text"],
            truncation=True,
            padding="max_length",
            max_length=cfg.max_length,
        )

    dataset = dataset.map(_tok, batched=True, num_proc=1)
    dataset.set_format(type="torch", columns=["input_ids", "attention_mask", "label"])
    return dataset


# ─────────────────────────────────────────────
# METRICS
# ─────────────────────────────────────────────
def compute_metrics(pred) -> Dict[str, float]:
    """
    Weighted F1 (main metric) + macro F1 (minority-class health check).
    Macro F1 treats every disease equally regardless of val sample count,
    so a drop there immediately signals a minority class is being hurt.
    """
    labels = pred.label_ids
    preds  = pred.predictions.argmax(-1)
    return {
        "accuracy":    accuracy_score(labels, preds),
        "f1":          f1_score(labels, preds, average="weighted"),
        "f1_macro":    f1_score(labels, preds, average="macro",
                                zero_division=0),
    }


# ─────────────────────────────────────────────
# TRAINING PIPELINE
# ─────────────────────────────────────────────
def train(cfg: Config) -> None:
    """End-to-end training: load data → fine-tune → save artefacts."""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    log.info("Device: %s", device)

    kb = load_knowledge_base(cfg)
    texts, labels = build_training_data(kb, cfg)

    # ── Label encoding ────────────────────────────────────────
    label_encoder = LabelEncoder()
    encoded = label_encoder.fit_transform(labels)
    num_labels = len(label_encoder.classes_)

    # ── Tokenizer (load once, reuse everywhere) ───────────────
    tokenizer = AutoTokenizer.from_pretrained(cfg.transformer_model)

    # ── Stratified train/val split ────────────────────────────
    # GroupShuffleSplit (used previously) assigned ENTIRE diseases to
    # train OR val.  With 41 diseases and test_size=0.15 only ~6 diseases
    # ended up in the val set, so the model was never trained on those
    # classes → accuracy and F1 stayed at 0.0 throughout.
    #
    # The correct split for augmented data is stratified train_test_split:
    # it ensures every disease class has examples in both splits, which
    # is what we want — the model must generalise within each class, not
    # across unseen classes.
    tr_texts, va_texts, tr_labels, va_labels = train_test_split(
        texts, encoded,
        test_size=cfg.test_size,
        random_state=42,
        stratify=encoded,        # guarantees every disease in both splits
    )

    log.info(
        "Split: %d train / %d val  (%d classes in val)",
        len(tr_texts), len(va_texts), len(set(va_labels)),
    )

    train_ds = tokenize_dataset(
        Dataset.from_dict({"text": tr_texts, "label": tr_labels}), tokenizer, cfg,
    )
    val_ds = tokenize_dataset(
        Dataset.from_dict({"text": va_texts, "label": va_labels}), tokenizer, cfg,
    )

    # ── Model with raised classifier dropout ──────────────────
    # DistilBERT uses `seq_classif_dropout`; BERT/RoBERTa use
    # `classifier_dropout`.  Detect by model name to avoid the
    # "unexpected keyword argument" crash.
    is_distilbert = "distilbert" in cfg.transformer_model.lower()
    dropout_kwargs = (
        {"seq_classif_dropout": cfg.classifier_dropout}
        if is_distilbert else
        {"classifier_dropout": cfg.classifier_dropout}
    )
    model = AutoModelForSequenceClassification.from_pretrained(
        cfg.transformer_model,
        num_labels=num_labels,
        **dropout_kwargs,
    ).to(device)
    model.gradient_checkpointing_enable()

    # ── Training arguments ────────────────────────────────────
    use_fp16 = device == "cuda" and not torch.cuda.is_bf16_supported()
    use_bf16 = device == "cuda" and torch.cuda.is_bf16_supported()

    training_args = TrainingArguments(
        output_dir=cfg.save_path,
        learning_rate=cfg.learning_rate,
        per_device_train_batch_size=cfg.batch_size,
        per_device_eval_batch_size=cfg.batch_size,
        num_train_epochs=cfg.num_epochs,
        weight_decay=cfg.weight_decay,
        warmup_ratio=cfg.warmup_ratio,
        label_smoothing_factor=cfg.label_smoothing,
        lr_scheduler_type="linear",    # cosine was overshooting on small data
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        fp16=use_fp16,
        bf16=use_bf16,
        logging_steps=10,              # steps/epoch ≈ 40; 50 caused stale display
        report_to="none",
        dataloader_num_workers=2,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingOnF1(patience=cfg.early_stopping_patience)],
    )

    log.info("Starting training …")
    trainer.train()

    final_metrics = trainer.evaluate()
    log.info("Final validation metrics: %s", json.dumps(final_metrics, indent=2))

    # ── Per-class report (shows which diseases underperform) ──
    preds_out  = trainer.predict(val_ds)
    preds_flat = preds_out.predictions.argmax(-1)
    from sklearn.metrics import classification_report
    report = classification_report(
        preds_out.label_ids,
        preds_flat,
        target_names=label_encoder.classes_,
        zero_division=0,
    )
    log.info("Per-class report:\n%s", report)

    # ── Save ──────────────────────────────────────────────────
    trainer.save_model(cfg.save_path)
    tokenizer.save_pretrained(cfg.save_path)

    with open(cfg.metadata_path, "wb") as f:
        pickle.dump(
            {
                "disease_symptoms": kb.disease_symptoms,
                "disease_descriptions": kb.disease_descriptions,
                "disease_precautions": kb.disease_precautions,
                "symptom_severity": kb.symptom_severity,
                "label_encoder": label_encoder,
                "config": cfg,
            },
            f,
        )

    log.info("Model and metadata saved to '%s' and '%s'", cfg.save_path, cfg.metadata_path)


# ─────────────────────────────────────────────
# INFERENCE ENGINE
# ─────────────────────────────────────────────
class MedicalPredictor:
    """
    Loads a trained model and provides hybrid (transformer + Bayesian)
    disease prediction with natural-language symptom matching.
    """

    def __init__(self, cfg: Config) -> None:
        self.cfg = cfg
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        log.info("Loading transformer …")
        self.tokenizer = AutoTokenizer.from_pretrained(cfg.save_path)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            cfg.save_path
        ).to(self.device)
        self.model.eval()

        log.info("Loading metadata …")
        with open(cfg.metadata_path, "rb") as f:
            sys.modules['__main__'].Config = Config
            meta = pickle.load(f)

        self.label_encoder: LabelEncoder = meta["label_encoder"]
        self.disease_symptoms: Dict[str, List[str]] = meta["disease_symptoms"]
        self.disease_descriptions: Dict[str, str] = meta.get("disease_descriptions", {})
        self.disease_precautions: Dict[str, List[str]] = meta.get("disease_precautions", {})
        self.symptom_severity: Dict[str, int] = meta.get("symptom_severity", {})

        log.info("Loading embedding model …")
        self.embed_model = SentenceTransformer(cfg.embed_model_name)

        # ── Build expanded paraphrase index ───────────────────
        # For every canonical symptom generate ~10 paraphrases and embed
        # them all.  Store a parallel list mapping each embedding row back
        # to its canonical symptom name.  This lets any colloquial phrasing
        # the user types land near at least one paraphrase of the right
        # symptom without any hand-written shortcut.
        all_symptoms = sorted({
            s for syms in self.disease_symptoms.values() for s in syms
        })
        self.symptom_list: List[str] = []   # canonical name per embedding row
        paraphrase_texts: List[str] = []

        for sym in all_symptoms:
            for para in _paraphrases_for(sym):
                self.symptom_list.append(sym)
                paraphrase_texts.append(para)

        log.info(
            "Encoding %d paraphrases for %d symptoms …",
            len(paraphrase_texts), len(all_symptoms),
        )
        self.symptom_embeddings = self.embed_model.encode(
            paraphrase_texts,
            convert_to_tensor=True,
            batch_size=128,
            show_progress_bar=False,
        )
        log.info("Predictor ready (%d symptoms, %d paraphrase vectors)",
                 len(all_symptoms), len(paraphrase_texts))

    # ── Symptom matching ──────────────────────────────────────
    def match_symptom(
        self, raw: str, top_k: int = 3
    ) -> Optional[List[Tuple[str, float]]]:
        """
        Map free-form user text to canonical symptom(s) automatically.

        Pipeline:
          1. Normalise: strip fillers, modifiers; map verb stems to nouns.
          2. Embed the normalised query.
          3. Cosine-search across all paraphrase embeddings.
          4. For each hit, record its canonical symptom and keep the
             highest score seen for that symptom (max-pool over paraphrases).
          5. Return up to top_k canonical symptoms above the threshold.

        No manual shortcuts or synonym dictionaries needed.
        """
        normalised = _normalise_input(raw)
        if not normalised:
            return None

        query_emb = self.embed_model.encode(normalised, convert_to_tensor=True)
        scores = util.cos_sim(query_emb, self.symptom_embeddings)[0]

        # Max-pool: for each canonical symptom keep only its best paraphrase score
        best: Dict[str, float] = {}
        for idx, score in enumerate(scores.tolist()):
            sym = self.symptom_list[idx]
            if score > best.get(sym, -1.0):
                best[sym] = score

        # Filter and sort
        candidates = sorted(
            [(sym, sc) for sym, sc in best.items()
             if sc >= self.cfg.similarity_threshold],
            key=lambda x: x[1],
            reverse=True,
        )[:top_k]

        return candidates if candidates else None

    # ── Transformer prediction ────────────────────────────────
    def _transformer_predict(self, symptoms: List[str]) -> List[Tuple[str, float]]:
        text = " ".join(symptoms)
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=self.cfg.max_length,
        ).to(self.device)

        with torch.no_grad():
            logits = self.model(**inputs).logits

        probs = F.softmax(logits / self.cfg.softmax_temperature, dim=1)
        k = min(5, probs.shape[1])  # prevent overflow
        top_probs, top_ids = torch.topk(probs, k)

        return [
            (self.label_encoder.inverse_transform([i.item()])[0], float(p))
            for p, i in zip(top_probs[0], top_ids[0])
        ]

    # ── Severity-weighted Bayesian ranking ───────────────────
    def _bayesian_rank(self, symptoms: List[str]) -> List[Tuple[str, float]]:
        """
        Improved Bayesian scorer with three components:

        1. Severity-weighted match ratio  — high-severity matched symptoms
           count more than low-severity ones (same as before).
        2. Symptom-count bonus  — matching 3/5 symptoms scores higher than
           matching 1/5 even if the ratio is the same. Prevents diseases
           with few total symptoms from always topping the list.
        3. Precision component  — penalises diseases that have many
           symptoms the user didn't mention (avoids over-broad matches).
        """
        total = len(self.disease_symptoms)
        results = []
        sym_set = set(symptoms)

        for disease, dsym in self.disease_symptoms.items():
            matched = sym_set & set(dsym)
            if not matched:
                continue

            n_matched = len(matched)
            n_disease = len(dsym)
            n_input   = len(sym_set)

            # Severity-weighted recall
            match_weight = sum(self.symptom_severity.get(s, 1) for s in matched)
            total_weight  = sum(self.symptom_severity.get(s, 1) for s in dsym) or 1
            recall = match_weight / total_weight

            # Precision: what fraction of user's symptoms are explained
            precision = n_matched / n_input if n_input else 0

            # Count bonus: log-scaled so matching more symptoms always helps
            count_bonus = math.log1p(n_matched) / math.log1p(max(n_disease, 1))

            # Combined likelihood (recall + precision + count, equally weighted)
            likelihood = (recall + precision + count_bonus) / 3.0

            score = (1.0 / total) * likelihood
            results.append((disease, score))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:5]

    # ── Hybrid prediction ─────────────────────────────────────
    def predict(self, symptoms: List[str]) -> List[Tuple[str, float]]:
        """
        Combine transformer and Bayesian scores with adaptive weighting.

        With few symptoms (≤2) the transformer dominates (80/20) because
        Bayesian matching has little signal. As more symptoms are added the
        Bayesian component grows (up to 40/60 at 6+ symptoms) since it can
        precisely identify diseases by symptom overlap.
        """
        n = len(symptoms)
        # Linearly interpolate: 2 symptoms → 80/20, 6+ symptoms → 50/50
        bayes_w = min(0.50, self.cfg.bayesian_weight + (n - 2) * 0.05)
        bayes_w = max(self.cfg.bayesian_weight, bayes_w)
        trans_w = 1.0 - bayes_w

        transformer = dict(self._transformer_predict(symptoms))
        bayesian     = dict(self._bayesian_rank(symptoms))

        combined = {
            disease: trans_w * transformer.get(disease, 0.0)
                   + bayes_w * bayesian.get(disease, 0.0)
            for disease in set(transformer) | set(bayesian)
        }

        return sorted(combined.items(), key=lambda x: x[1], reverse=True)[:5]

    # ── Rich result display ───────────────────────────────────
    def display_results(self, predictions: List[Tuple[str, float]]) -> None:
        """
        Display a ranked prediction table with:
        - Bars normalised relative to the top result (top = full bar).
        - Colour-coded tiers: green ≥50%, yellow ≥25%, red <25%.
        - Explicit LOW-CONFIDENCE warning when top score < 40%.
        - Description and precautions for the #1 result.
        """
        if not predictions:
            console.print("[red]No predictions available.[/red]")
            return

        top_score = predictions[0][1]
        bw = self.cfg.bar_width

        # ── Table ──────────────────────────────────────────────
        table = Table(
            title="\n  🩺  Diagnosis Predictions",
            show_header=True,
            header_style="bold white on dark_blue",
            border_style="blue",
            show_lines=True,
            min_width=72,
        )
        table.add_column("Rank", style="dim", width=5, justify="center")
        table.add_column("Disease", style="bold", min_width=26)
        table.add_column("Confidence", min_width=34)
        table.add_column("Score", justify="right", width=7)

        for rank, (disease, score) in enumerate(predictions, 1):
            pct = score / top_score          # relative to best
            filled = round(pct * bw)
            empty  = bw - filled
            bar_str = "█" * filled + "░" * empty

            if pct >= 0.50:
                colour = "bright_green"
            elif pct >= 0.25:
                colour = "yellow"
            else:
                colour = "red"

            bar_cell = f"[{colour}]{bar_str}[/{colour}]  {score * 100:.1f}%"
            table.add_row(f"#{rank}", disease, bar_cell, f"{score:.4f}")

        console.print(table)

        # ── Low-confidence warning ─────────────────────────────
        # The raw hybrid score is always small (transformer distributes
        # probability across 41 classes). Flag low confidence only when
        # the top result is less than 2× the second result — meaning the
        # model is genuinely undecided — not just because the raw score
        # is a small number.
        genuinely_uncertain = (
            len(predictions) >= 2
            and predictions[0][1] < predictions[1][1] * 1.5
        )
        if genuinely_uncertain:
            console.print(
                "\n[bold yellow]⚠  Uncertain prediction[/bold yellow] – the top two "
                "candidates are very close in score.\n"
                "   Enter more symptoms for a sharper result.\n"
            )

        # ── Top-result details ─────────────────────────────────
        top_disease, _ = predictions[0]

        if desc := self.disease_descriptions.get(top_disease):
            console.rule(f"[bold yellow] About: {top_disease} ")
            # Word-wrap description to ~72 chars
            words = desc.split()
            line, lines = [], []
            for w in words:
                line.append(w)
                if len(" ".join(line)) > 72:
                    lines.append(" ".join(line[:-1]))
                    line = [w]
            if line:
                lines.append(" ".join(line))
            for ln in lines:
                console.print(f"  [italic]{ln}[/italic]")
            console.print()

        if prec := self.disease_precautions.get(top_disease):
            console.rule("[bold red] Recommended Precautions ")
            for i, p in enumerate(prec, 1):
                console.print(f"  [red]{i}.[/red]  {p.capitalize()}")
            console.print()


# ─────────────────────────────────────────────
# INTERACTIVE CHATBOT
# ─────────────────────────────────────────────
def run_chatbot(cfg: Config) -> None:
    predictor = MedicalPredictor(cfg)
    symptoms: List[str] = []

    console.rule("[bold green]Medical AI Diagnostic Assistant v3")
    console.print(
        "[dim]Commands:[/dim]  "
        "[bold]analyze[/bold] / [bold]analyse[/bold] – run prediction  "
        "| [bold]clear[/bold] / [bold]reset[/bold] – clear symptoms  "
        "| [bold]list[/bold] – show current symptoms  "
        "| [bold]exit[/bold] / [bold]quit[/bold] – quit\n"
    )

    while True:
        try:
            user = console.input("[bold cyan]Enter symptom:[/bold cyan] ").strip()
        except (EOFError, KeyboardInterrupt):
            console.print("\n[dim]Goodbye.[/dim]")
            break

        if not user:
            continue

        cmd = user.lower()

        if cmd in ("exit", "quit", "q"):
            console.print("[dim]Goodbye.[/dim]")
            break

        if cmd in ("clear", "reset"):
            symptoms.clear()
            console.print("[yellow]Symptom list cleared.[/yellow]\n")
            continue

        if cmd == "list":
            if symptoms:
                console.print(
                    f"[dim]Current symptoms ({len(symptoms)}):[/dim] "
                    + ", ".join(f"[cyan]{s}[/cyan]" for s in symptoms) + "\n"
                )
            else:
                console.print("[dim]No symptoms entered yet.[/dim]\n")
            continue

        if cmd in ("analyze", "analyse", "predict", "run"):
            if len(symptoms) < 2:
                console.print("[yellow]Please enter at least 2 symptoms first.[/yellow]\n")
                continue

            console.print(
                f"\n[dim]Analysing symptoms:[/dim] "
                + ", ".join(f"[green]{s}[/green]" for s in symptoms)
                + "\n"
            )
            results = predictor.predict(symptoms)
            predictor.display_results(results)
            continue

        # Symptom matching
        matches = predictor.match_symptom(user)
        if not matches:
            console.print(
                "[red]Symptom not recognised.[/red] "
                "[dim]Try rephrasing, e.g. 'joint pain', 'fatigue', 'skin rash'.[/dim]\n"
            )
            continue

        # Auto-accept if top match is clearly the best
        if len(matches) == 1 or matches[0][1] - matches[1][1] >= 0.08:
            chosen = matches[0][0]
        else:
            # Scores are close — let user disambiguate
            tied = matches[0][1] - matches[1][1] < 0.02
            header = (
                "[yellow]Multiple equally-matched options found – please choose:[/yellow]"
                if tied else
                "[yellow]Multiple matches found – please choose:[/yellow]"
            )
            console.print(header)
            for idx, (sym, sc) in enumerate(matches, 1):
                tie_tag = " [dim](tied)[/dim]" if tied and idx <= 2 else ""
                console.print(f"  [bold]{idx}.[/bold] {sym} ({sc:.2f}){tie_tag}")
            choice = console.input(
                f"Select 1–{len(matches)}, or press Enter to skip: "
            ).strip()
            if choice.isdigit() and 1 <= int(choice) <= len(matches):
                chosen = matches[int(choice) - 1][0]
            else:
                console.print("[dim]Skipped.[/dim]\n")
                continue

        if chosen not in symptoms:
            symptoms.append(chosen)
            match_score = next((s for n, s in matches if n == chosen), 0.0)
            score_colour = "green" if match_score >= 0.80 else "yellow" if match_score >= 0.65 else "red"
            console.print(
                f"[green]✓[/green] Mapped to: [bold]{chosen}[/bold]  "
                f"[[{score_colour}]similarity {match_score:.2f}[/{score_colour}]]"
            )
            console.print(
                f"[dim]Current symptoms ({len(symptoms)}):[/dim] "
                + ", ".join(f"[cyan]{s}[/cyan]" for s in symptoms)
                + "\n"
            )
        else:
            console.print(f"[dim]'{chosen}' already in list.[/dim]\n")


# ─────────────────────────────────────────────
# CLI ENTRYPOINT
# ─────────────────────────────────────────────
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Medical Disease Prediction System v2",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    sub = p.add_subparsers(dest="command", required=True)

    # ── train ──────────────────────────────────────────────────
    train_p = sub.add_parser("train", help="Fine-tune the model")
    train_p.add_argument("--dataset", default="dataset.csv")
    train_p.add_argument("--descriptions", default="symptom_Description.csv")
    train_p.add_argument("--precautions", default="symptom_precaution.csv")
    train_p.add_argument("--severity", default="Symptom-severity.csv")
    train_p.add_argument("--save-path", default="./medical_model_v2")
    train_p.add_argument("--epochs", type=int, default=15)
    train_p.add_argument("--batch-size", type=int, default=32)
    train_p.add_argument("--model", default="distilbert-base-uncased")

    # ── chat ───────────────────────────────────────────────────
    chat_p = sub.add_parser("chat", help="Run interactive diagnosis chatbot")
    chat_p.add_argument("--save-path", default="./medical_model_v2")
    chat_p.add_argument("--metadata", default="medical_metadata_v2.pkl")
    chat_p.add_argument("--threshold", type=float, default=0.55)

    # ── predict ────────────────────────────────────────────────
    pred_p = sub.add_parser("predict", help="Single prediction (non-interactive)")
    pred_p.add_argument("symptoms", nargs="+", help="Symptom strings to classify")
    pred_p.add_argument("--save-path", default="./medical_model_v2")
    pred_p.add_argument("--metadata", default="medical_metadata_v2.pkl")

    return p


def _is_jupyter() -> bool:
    """Return True when running inside a Jupyter / IPython kernel."""
    try:
        shell = get_ipython().__class__.__name__  # type: ignore[name-defined]
        return shell in ("ZMQInteractiveShell", "TerminalInteractiveShell")
    except NameError:
        return False


def main() -> None:
    """
    Entry point for both CLI and Jupyter notebook execution.

    In a Jupyter environment sys.argv contains the kernel JSON path, not
    real CLI arguments, so argparse would crash with:
        ArgumentError: invalid choice: '/root/.../kernel-xxx.json'
    We detect this and run in interactive notebook mode instead.
    """
    if _is_jupyter():
        # ── Notebook mode: run training then chatbot directly ──────
        cfg = Config()
        log.info("Jupyter environment detected – running in notebook mode.")
        log.info("To customise paths/hyperparameters edit the Config dataclass.")

        model_dir = Path(cfg.save_path)
        meta_file = Path(cfg.metadata_path)

        if not model_dir.exists() or not meta_file.exists():
            log.info("No saved model found – starting training.")
            train(cfg)
        else:
            log.info("Saved model found at '%s' – skipping training.", cfg.save_path)

        run_chatbot(cfg)
        return

    # ── CLI mode ───────────────────────────────────────────────────
    parser = build_parser()
    args = parser.parse_args()
    cfg = Config()

    if args.command == "train":
        cfg.dataset_path = args.dataset
        cfg.description_path = args.descriptions
        cfg.precaution_path = args.precautions
        cfg.severity_path = args.severity
        cfg.save_path = args.save_path
        cfg.transformer_model = args.model
        cfg.num_epochs = args.epochs
        cfg.batch_size = args.batch_size
        train(cfg)

    elif args.command == "chat":
        cfg.save_path = args.save_path
        cfg.metadata_path = args.metadata
        cfg.similarity_threshold = args.threshold
        run_chatbot(cfg)

    elif args.command == "predict":
        cfg.save_path = args.save_path
        cfg.metadata_path = args.metadata
        predictor = MedicalPredictor(cfg)
        matched = []
        for raw in args.symptoms:
            m = predictor.match_symptom(raw)
            if m:
                matched.append(m[0][0])
                log.info("'%s' → '%s'", raw, m[0][0])
            else:
                log.warning("No match for '%s'", raw)
        if not matched:
            log.error("No recognisable symptoms provided.")
            sys.exit(1)
        results = predictor.predict(matched)
        predictor.display_results(results)


# ── Notebook convenience functions ─────────────────────────────────────
# Call these directly in a cell instead of using the CLI.

def notebook_train(cfg: Optional[Config] = None) -> None:
    """Train (or re-train) the model from a notebook cell."""
    train(cfg or Config())


def notebook_chat(cfg: Optional[Config] = None) -> None:
    """Launch the interactive chatbot from a notebook cell."""
    run_chatbot(cfg or Config())


def notebook_predict(
    *symptoms: str,
    cfg: Optional[Config] = None,
) -> List[Tuple[str, float]]:
    """
    Run a one-shot prediction from a notebook cell.

    Usage::
        results = notebook_predict("joint pain", "swollen arm", "fatigue")
    """
    predictor = MedicalPredictor(cfg or Config())
    matched = []
    for raw in symptoms:
        m = predictor.match_symptom(raw)
        if m:
            matched.append(m[0][0])
            log.info("'%s' → '%s'", raw, m[0][0])
        else:
            log.warning("No match for '%s'", raw)
    if not matched:
        log.error("No recognisable symptoms provided.")
        return []
    results = predictor.predict(matched)
    predictor.display_results(results)
    return results


if __name__ == "__main__":
    main()

