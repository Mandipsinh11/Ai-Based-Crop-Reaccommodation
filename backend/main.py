import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os

from flask import Flask, request, jsonify
from flask_cors import CORS

from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix

# =========================
# LOAD DATASET
# =========================

df = pd.read_csv("Crop_recommendation.csv")

FEATURES = [
    "N",
    "P",
    "K",
    "temperature",
    "humidity",
    "ph",
    "rainfall"
]

# =========================
# LABEL ENCODING
# =========================

le = LabelEncoder()
df["label_encoded"] = le.fit_transform(df["label"])

# =========================
# SPLIT DATA
# =========================

X = df[FEATURES]
y = df["label_encoded"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# =========================
# SCALE DATA
# =========================

scaler = StandardScaler()

X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# =========================
# TRAIN MODEL
# =========================

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

# =========================
# ACCURACY
# =========================

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("Accuracy:", accuracy * 100)

# =========================
# CONFUSION MATRIX
# =========================

cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(10, 8))

sns.heatmap(cm, cmap="Blues")

plt.title("Confusion Matrix")

plt.show()

# =========================
# SAVE MODEL
# =========================

os.makedirs("artifacts", exist_ok=True)

joblib.dump(model, "artifacts/model.pkl")
joblib.dump(scaler, "artifacts/scaler.pkl")
joblib.dump(le, "artifacts/label_encoder.pkl")

print("Model Saved")

# =========================
# FLASK API
# =========================

app = Flask(__name__)

CORS(app)

@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    values = [[
        float(data["N"]),
        float(data["P"]),
        float(data["K"]),
        float(data["temperature"]),
        float(data["humidity"]),
        float(data["ph"]),
        float(data["rainfall"])
    ]]

    scaled_data = scaler.transform(values)

    prediction = model.predict(scaled_data)

    crop = le.inverse_transform(prediction)[0]

    return jsonify({
        "success": True,
        "crop": crop
    })

# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":
    app.run(debug=True)