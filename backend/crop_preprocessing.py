"""
Data Preprocessing for Crop Recommendation Dataset
====================================================
Dataset  : Crop_recommendation.csv
Features : N, P, K, temperature, humidity, ph, rainfall
Target   : label (22 crop classes, 100 samples each → 2200 rows)
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split # type: ignore

# ──────────────────────────────────────────────────────────
# 1. LOAD DATA
# ──────────────────────────────────────────────────────────
df = pd.read_csv("Crop_recommendation.csv")

print("=" * 60)
print("STEP 1 — RAW DATA OVERVIEW")
print("=" * 60)
print(f"Shape   : {df.shape}  ({df.shape[0]} rows × {df.shape[1]} cols)")
print(f"Columns : {list(df.columns)}")
print("\nFirst 5 rows:")
print(df.head())

# ──────────────────────────────────────────────────────────
# 2. BASIC INSPECTION
# ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 2 — DATA INSPECTION")
print("=" * 60)

print("\nData Types:")
print(df.dtypes)

print("\nStatistical Summary:")
print(df.describe())

print("\nMissing Values per Column:")
missing = df.isnull().sum()
print(missing)
print(f"→ Total missing: {missing.sum()}")

print(f"\nDuplicate Rows: {df.duplicated().sum()}")

print("\nClass Distribution (label):")
print(df["label"].value_counts().to_string())

# ──────────────────────────────────────────────────────────
# 3. HANDLE MISSING VALUES  (none in this dataset, but safeguard)
# ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 3 — MISSING VALUE HANDLING")
print("=" * 60)

numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

if df[numeric_cols].isnull().sum().sum() > 0:
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    print("Numeric columns — filled with column median.")
else:
    print("No missing values detected in numeric columns.")

if df["label"].isnull().sum() > 0:
    df["label"] = df["label"].fillna(df["label"].mode()[0])
    print("label column — filled with mode.")
else:
    print("No missing values in label column.")

# ──────────────────────────────────────────────────────────
# 4. REMOVE DUPLICATES
# ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 4 — DUPLICATE REMOVAL")
print("=" * 60)

before = len(df)
df.drop_duplicates(inplace=True)
df.reset_index(drop=True, inplace=True)
print(f"Rows before: {before}  |  Rows after: {len(df)}  |  Removed: {before - len(df)}")

# ──────────────────────────────────────────────────────────
# 5. OUTLIER DETECTION & CAPPING (IQR / Winsorization)
# ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 5 — OUTLIER DETECTION & CAPPING (IQR Method)")
print("=" * 60)

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

outlier_report = {}
for col in FEATURES:
    Q1  = df[col].quantile(0.25)
    Q3  = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    n_out = ((df[col] < lower) | (df[col] > upper)).sum()
    outlier_report[col] = {"lower": round(lower, 3),
                           "upper": round(upper, 3),
                           "count": int(n_out)}
    df[col] = df[col].clip(lower=lower, upper=upper)   # Winsorize

print(f"{'Feature':<15} {'Lower Fence':>12} {'Upper Fence':>12} {'Outliers Capped':>16}")
print("-" * 60)
for col, info in outlier_report.items():
    print(f"{col:<15} {info['lower']:>12} {info['upper']:>12} {info['count']:>16}")

# ──────────────────────────────────────────────────────────
# 6. ENCODE TARGET LABEL
# ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 6 — LABEL ENCODING (Target Column)")
print("=" * 60)

le = LabelEncoder()
df["label_encoded"] = le.fit_transform(df["label"])

label_map = dict(zip(le.classes_, le.transform(le.classes_)))
print(f"{'Crop':<20} {'Encoded'}")
print("-" * 30)
for crop, code in sorted(label_map.items()):
    print(f"  {crop:<20}: {code}")

# ──────────────────────────────────────────────────────────
# 7. FEATURE / TARGET SPLIT
# ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 7 — FEATURE / TARGET SPLIT")
print("=" * 60)

X = df[FEATURES]
y = df["label_encoded"]

print(f"Features (X) : {FEATURES}")
print(f"Target   (y) : label_encoded")
print(f"X shape      : {X.shape}")
print(f"y shape      : {y.shape}")

# ──────────────────────────────────────────────────────────
# 8. TRAIN / TEST SPLIT  (80 / 20, stratified)
# ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 8 — TRAIN / TEST SPLIT (80/20, stratified)")
print("=" * 60)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Training samples : {len(X_train)}")
print(f"Testing  samples : {len(X_test)}")

# ──────────────────────────────────────────────────────────
# 9. FEATURE SCALING
# ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 9 — FEATURE SCALING")
print("=" * 60)

# Standard Scaler (zero mean, unit variance) — best for most ML models
std_scaler = StandardScaler()
X_train_std = pd.DataFrame(std_scaler.fit_transform(X_train), columns=FEATURES)
X_test_std  = pd.DataFrame(std_scaler.transform(X_test),      columns=FEATURES)

# MinMax Scaler (range 0–1) — good for neural networks / KNN
mm_scaler = MinMaxScaler()
X_train_mm = pd.DataFrame(mm_scaler.fit_transform(X_train), columns=FEATURES)
X_test_mm  = pd.DataFrame(mm_scaler.transform(X_test),      columns=FEATURES)

print("StandardScaler — X_train_std sample stats:")
print(X_train_std.describe().loc[["mean", "std"]].round(4))

print("\nMinMaxScaler   — X_train_mm sample stats:")
print(X_train_mm.describe().loc[["min", "max"]].round(4))

# ──────────────────────────────────────────────────────────
# 10. CORRELATION HEATMAP
# ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 10 — CORRELATION ANALYSIS")
print("=" * 60)

corr = df[FEATURES].corr()
print(corr.round(3))

plt.figure(figsize=(9, 6))
sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm",
            square=True, linewidths=0.5)
plt.title("Feature Correlation Heatmap — Crop Recommendation", fontsize=13)
plt.tight_layout()
plt.savefig("correlation_heatmap.png", dpi=150)
plt.close()
print("\n→ Heatmap saved as 'correlation_heatmap.png'")

# ──────────────────────────────────────────────────────────
# 11. EXPORT PREPROCESSED DATA
# ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 11 — EXPORT PREPROCESSED DATA")
print("=" * 60)

train_out = X_train_std.copy()
train_out["label_encoded"] = y_train.values
test_out  = X_test_std.copy()
test_out["label_encoded"]  = y_test.values

train_out.to_csv("train_preprocessed.csv", index=False)
test_out.to_csv("test_preprocessed.csv",   index=False)

df[FEATURES + ["label", "label_encoded"]].to_csv("crop_cleaned.csv", index=False)

print("Files saved:")
print("  train_preprocessed.csv  (StandardScaler, 80% split)")
print("  test_preprocessed.csv   (StandardScaler, 20% split)")
print("  crop_cleaned.csv        (cleaned, unscaled, full dataset)")

# ──────────────────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("PREPROCESSING COMPLETE — SUMMARY")
print("=" * 60)
print(f"  Total rows           : {len(df)}")
print(f"  Features used        : {len(FEATURES)}")
print(f"  Classes (crops)      : {df['label'].nunique()}")
print(f"  Train / Test split   : {len(X_train)} / {len(X_test)}")
print(f"  Missing values       : 0")
print(f"  Duplicates removed   : {before - len(df)}")
print(f"  Outliers capped (IQR): Yes — Winsorization")
print(f"  Scaling applied      : StandardScaler + MinMaxScaler")
print(f"  Label encoding       : LabelEncoder (0–21)")
print("=" * 60)
