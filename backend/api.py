from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import numpy as np
import os
import json

# ── Paths ────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))   # backend/
FRONTEND_DIR  = os.path.join(BASE_DIR, '..', 'frontend')     # frontend/
ARTIFACTS_DIR = os.path.join(BASE_DIR, 'artifacts')

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

# ── Load model artifacts ─────────────────────────────────
model  = joblib.load(os.path.join(ARTIFACTS_DIR, 'crop_recommendation_model.pkl'))
scaler = joblib.load(os.path.join(ARTIFACTS_DIR, 'scaler.pkl'))
le     = joblib.load(os.path.join(ARTIFACTS_DIR, 'label_encoder.pkl'))

FEATURES = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

# ── Serve frontend files ─────────────────────────────────
@app.route('/')
@app.route('/dashboard')
def serve_dashboard():
    return send_from_directory(FRONTEND_DIR, 'dashboard.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(FRONTEND_DIR, filename)

# ── Health check ─────────────────────────────────────────
@app.route('/api')
def home():
    return jsonify({'message': 'Crop Recommendation API is running!'})

# ── Predict ──────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data   = request.get_json()
        values = [[data[f] for f in FEATURES]]
        scaled = scaler.transform(values)
        pred   = model.predict(scaled)[0]
        proba  = model.predict_proba(scaled)[0].max()

        result = {
            'crop':       le.inverse_transform([pred])[0],
            'confidence': round(float(proba) * 100, 2)
        }

        # Save JSON next to api.py (fixed path)
        json_path = os.path.join(BASE_DIR, 'prediction_result.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=4)

        return jsonify(result)

    except KeyError as e:
        return jsonify({'error': f'Missing field: {e}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print(f'\n  Frontend : http://127.0.0.1:5000/dashboard')
    print(f'  API      : http://127.0.0.1:5000/predict\n')
    app.run(debug=True)
