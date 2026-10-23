import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
ARTIFACTS_DIR = UPLOAD_DIR / "forensics"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'sih26261.db'}")

# Multi-Factor Trust Scoring Weights (Sum = 1.0)
WEIGHT_FORENSIC = float(os.getenv("WEIGHT_FORENSIC", "0.40"))
WEIGHT_OCR = float(os.getenv("WEIGHT_OCR", "0.20"))
WEIGHT_REGISTRY = float(os.getenv("WEIGHT_REGISTRY", "0.40"))

# Thresholds
AUTO_APPROVE_THRESHOLD = 85.0
MANUAL_REVIEW_THRESHOLD = 60.0

# Supported Document Types
SUPPORTED_DOC_TYPES = [
    "AADHAAR_CARD",
    "PAN_CARD",
    "DEGREE_CERTIFICATE",
    "MARKSHEET",
    "OTHER"
]
