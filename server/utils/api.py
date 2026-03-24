from fastapi import FastAPI
from model_2v import MedicalPredictor, Config

app = FastAPI()

cfg = Config()
predictor = MedicalPredictor(cfg)

@app.post("/predict")
def predict(data: dict):
    try:
        raw_symptoms = data.get("symptoms", [])

        if len(raw_symptoms) < 2:
            return {"error": "Please provide at least 2 symptoms"}

        matched = []
        for s in raw_symptoms:
            m = predictor.match_symptom(s)
            if m:
                matched.append(m[0][0])

        if len(matched) < 2:
            return {"error": "Not enough recognizable symptoms"}

        results = predictor.predict(matched)

        # 🔥 NEW: include description + precautions
        top_disease = results[0][0]

        return {
            "matched_symptoms": matched,
            "predictions": results,
            "top_disease": top_disease,
            "description": predictor.disease_descriptions.get(top_disease, ""),
            "precautions": predictor.disease_precautions.get(top_disease, [])
        }

    except Exception as e:
        print("❌ API ERROR:", str(e))
        return {"error": str(e)}