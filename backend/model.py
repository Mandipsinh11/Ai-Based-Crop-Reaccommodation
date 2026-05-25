import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import warnings
import joblib
import os

warnings.filterwarnings("ignore")

# Create artifacts folder
ARTIFACTS_DIR = "artifacts"
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

# Load dataset
df = pd.read_csv("Crop_recommendation.csv")

# Features
FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

# Label Encoding
le = LabelEncoder()
df["label_encoded"] = le.fit_transform(df["label"])

X = df[FEATURES]
y = df["label_encoded"]

# Train test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Scaling
scaler = StandardScaler()

X_train_sc = scaler.fit_transform(X_train)
X_test_sc = scaler.transform(X_test)

# Model
rf = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

# Train
rf.fit(X_train_sc, y_train)

# Prediction
y_pred = rf.predict(X_test_sc)

# Accuracy
train_acc = accuracy_score(y_train, rf.predict(X_train_sc))
test_acc = accuracy_score(y_test, y_pred)

print(f"Train Accuracy : {train_acc*100:.2f}%")
print(f"Test Accuracy  : {test_acc*100:.2f}%")

# Cross Validation
cv_scores = cross_val_score(rf, X_train_sc, y_train, cv=5)

print(f"CV Accuracy : {cv_scores.mean()*100:.2f}%")

# Classification Report
print(classification_report(y_test, y_pred))

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(12,10))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.title("Confusion Matrix")
plt.savefig(os.path.join(ARTIFACTS_DIR, "confusion_matrix.png"))
plt.close()

# Feature Importance
importance = rf.feature_importances_

feat_df = pd.DataFrame({
    "Feature": FEATURES,
    "Importance": importance
}).sort_values(by="Importance", ascending=False)

print(feat_df)

plt.figure(figsize=(8,5))
sns.barplot(
    data=feat_df,
    x="Importance",
    y="Feature"
)

plt.title("Feature Importance")
plt.savefig(os.path.join(ARTIFACTS_DIR, "feature_importance.png"))
plt.close()

# Save model
joblib.dump(rf, os.path.join(ARTIFACTS_DIR, "crop_model.pkl"))
joblib.dump(scaler, os.path.join(ARTIFACTS_DIR, "scaler.pkl"))
joblib.dump(le, os.path.join(ARTIFACTS_DIR, "label_encoder.pkl"))

print("Model Saved Successfully")

# Test sample prediction
sample = pd.DataFrame(
    [[90, 42, 43, 20.8, 82.0, 6.5, 202.0]],
    columns=FEATURES
)

sample_scaled = scaler.transform(sample)

prediction = rf.predict(sample_scaled)[0]

crop = le.inverse_transform([prediction])[0]

print("Predicted Crop:", crop)