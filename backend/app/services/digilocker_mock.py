import difflib
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from ..models.application import MockRegistryRecord

try:
    from rapidfuzz import fuzz
    def calculate_similarity(s1: str, s2: str) -> float:
        if not s1 or not s2:
            return 0.0
        return float(fuzz.token_sort_ratio(s1.lower().strip(), s2.lower().strip()))
except ImportError:
    def calculate_similarity(s1: str, s2: str) -> float:
        if not s1 or not s2:
            return 0.0
        return round(difflib.SequenceMatcher(None, s1.lower().strip(), s2.lower().strip()).ratio() * 100.0, 1)

# Default seeded verified government & academic records
DEFAULT_AUTHORITATIVE_REGISTRY = [
    {
        "registry_type": "DIGILOCKER_AADHAAR",
        "identifier": "348982149012",
        "full_name": "Aarav Sharma",
        "dob": "14/08/2002",
        "institution": "UIDAI Central Identity Repository",
        "degree": "Aadhaar e-KYC Verified",
        "roll_number": "348982149012",
        "grade_percentage": "N/A",
        "is_revoked": False
    },
    {
        "registry_type": "DIGILOCKER_PAN",
        "identifier": "ABCDE1234F",
        "full_name": "Aarav Sharma",
        "dob": "14/08/2002",
        "institution": "Income Tax Department, Govt of India",
        "degree": "Permanent Account Number",
        "roll_number": "ABCDE1234F",
        "grade_percentage": "N/A",
        "is_revoked": False
    },
    {
        "registry_type": "APAAR_EDUCATION",
        "identifier": "2020CS1049",
        "full_name": "Aarav Sharma",
        "dob": "14/08/2002",
        "institution": "Anna University",
        "degree": "Bachelor of Technology (Computer Science and Engineering)",
        "roll_number": "2020CS1049",
        "grade_percentage": "8.92",
        "is_revoked": False
    },
    {
        "registry_type": "APAAR_EDUCATION",
        "identifier": "IITB2019EE402",
        "full_name": "Priya Patel",
        "dob": "22/11/2001",
        "institution": "Indian Institute of Technology",
        "degree": "Bachelor of Technology (Electrical Engineering)",
        "roll_number": "IITB2019EE402",
        "grade_percentage": "9.41",
        "is_revoked": False
    },
    {
        "registry_type": "APAAR_EDUCATION",
        "identifier": "REVOKED-FAKE-999",
        "full_name": "Counterfeit Record",
        "dob": "01/01/2000",
        "institution": "Blacklisted Institution",
        "degree": "Fake Diploma",
        "roll_number": "REVOKED-FAKE-999",
        "grade_percentage": "99.0",
        "is_revoked": True
    }
]

class MockRegistryService:
    @staticmethod
    def seed_defaults(db: Session):
        """Pre-populates the mock registry table if empty."""
        count = db.query(MockRegistryRecord).count()
        if count == 0:
            for item in DEFAULT_AUTHORITATIVE_REGISTRY:
                rec = MockRegistryRecord(**item)
                db.add(rec)
            db.commit()

    @classmethod
    def query_registry(cls, db: Session, doc_type: str, extracted_fields: list[dict]) -> dict:
        """
        Cross-validates extracted document fields against DigiLocker and APAAR registries.
        Returns match status, confidence score (0-100), verified payload, and discrepancy notes.
        """
        cls.seed_defaults(db)

        # Map document type to expected registry
        registry_target = "DIGILOCKER_AADHAAR"
        if "PAN" in doc_type:
            registry_target = "DIGILOCKER_PAN"
        elif "DEGREE" in doc_type or "MARKSHEET" in doc_type:
            registry_target = "APAAR_EDUCATION"

        # Find key identifier in extracted fields
        identifier_value = None
        extracted_name = None
        extracted_cgpa = None

        for f in extracted_fields:
            fname = f.get("field_name")
            fval = f.get("field_value", "").strip()

            if fname in ["AADHAAR_NUMBER", "PAN_NUMBER", "ROLL_NUMBER"]:
                identifier_value = fval.replace(" ", "")
            elif fname == "APPLICANT_NAME":
                extracted_name = fval
            elif fname == "CGPA_OR_MARKS":
                extracted_cgpa = fval

        # Search registry by identifier or name
        record = None
        if identifier_value:
            record = db.query(MockRegistryRecord).filter(
                MockRegistryRecord.identifier == identifier_value
            ).first()

        # If not found by exact identifier, search by name similarity
        if not record and extracted_name:
            all_records = db.query(MockRegistryRecord).filter(
                MockRegistryRecord.registry_type == registry_target
            ).all()
            for cand in all_records:
                sim = calculate_similarity(cand.full_name, extracted_name)
                if sim > 85.0:
                    record = cand
                    break

        if not record:
            return {
                "registry_name": registry_target,
                "matched_status": "NOT_FOUND",
                "match_score": 0.0,
                "queried_key": identifier_value or extracted_name or "UNKNOWN",
                "registry_record_preview": None,
                "discrepancy_details": f"No authoritative entry found in {registry_target} for identifier '{identifier_value or extracted_name}'."
            }

        if record.is_revoked:
            return {
                "registry_name": registry_target,
                "matched_status": "FRAUD_MISMATCH",
                "match_score": 0.0,
                "queried_key": record.identifier,
                "registry_record_preview": {
                    "full_name": record.full_name,
                    "institution": record.institution,
                    "degree": record.degree,
                    "is_revoked": True
                },
                "discrepancy_details": "CRITICAL ALERT: This credential is listed as REVOKED / COUNTERFEIT in government repository."
            }

        # Compare fields to compute match score
        score_points = 0.0
        total_evaluations = 0
        discrepancies = []

        if extracted_name:
            total_evaluations += 1
            name_sim = calculate_similarity(record.full_name, extracted_name)
            score_points += name_sim
            if name_sim < 80.0:
                discrepancies.append(f"Name Discrepancy: Extracted '{extracted_name}' vs Registry '{record.full_name}' ({name_sim}% match)")

        if identifier_value:
            total_evaluations += 1
            id_sim = calculate_similarity(record.identifier, identifier_value)
            score_points += id_sim
            if id_sim < 90.0:
                discrepancies.append(f"Identifier Mismatch: Extracted '{identifier_value}' vs Registry '{record.identifier}'")

        if extracted_cgpa and record.grade_percentage:
            total_evaluations += 1
            # Check numerical similarity
            clean_ext = extracted_cgpa.replace("%", "").strip()
            clean_reg = record.grade_percentage.replace("%", "").strip()
            if clean_ext == clean_reg:
                score_points += 100.0
            else:
                score_points += 40.0
                discrepancies.append(f"Grade/CGPA Alteration: Extracted '{clean_ext}' vs Registry '{clean_reg}'")

        final_match_score = round(score_points / max(1, total_evaluations), 2)

        status = "MATCHED"
        if final_match_score < 50.0 or discrepancies:
            status = "PARTIAL_MATCH" if final_match_score >= 60.0 else "FRAUD_MISMATCH"

        return {
            "registry_name": registry_target,
            "matched_status": status,
            "match_score": final_match_score,
            "queried_key": record.identifier,
            "registry_record_preview": {
                "full_name": record.full_name,
                "institution": record.institution,
                "degree": record.degree,
                "roll_number": record.roll_number,
                "grade_percentage": record.grade_percentage
            },
            "discrepancy_details": "; ".join(discrepancies) if discrepancies else "Authoritative record matched successfully."
        }
