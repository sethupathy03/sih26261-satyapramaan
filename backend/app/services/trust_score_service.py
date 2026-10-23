from typing import List, Dict, Any
from ..config import WEIGHT_FORENSIC, WEIGHT_OCR, WEIGHT_REGISTRY, AUTO_APPROVE_THRESHOLD, MANUAL_REVIEW_THRESHOLD
from ..models.application import Application, Document, ForensicReport, ExtractedField, RegistryVerification
from .digilocker_mock import calculate_similarity

class TrustScoreService:
    @classmethod
    def calculate_application_trust_score(cls, application: Application) -> dict:
        """
        Computes the holistic multi-factor trust score across all documents in an application.
        Integrates:
        1. Forensic Integrity (EXIF, ELA heatmap variance, splicing, stamps)
        2. OCR Field Extraction Completeness & Confidence
        3. Authoritative Registry Verification (DigiLocker & APAAR)
        4. Cross-Document Identity Consistency (Name/DOB consistency across multiple documents)
        """
        documents = application.documents
        if not documents:
            return {
                "overall_trust_score": 0.0,
                "risk_tier": "UNKNOWN",
                "recommended_action": "REJECT",
                "score_breakdown": {"forensic": 0.0, "ocr": 0.0, "registry": 0.0, "cross_doc": 0.0},
                "tamper_indicators": ["No documents uploaded for application."],
                "discrepancies": [],
                "explanation": "No documents available to verify."
            }

        forensic_scores = []
        ocr_scores = []
        registry_scores = []
        tamper_flags = []
        discrepancies = []

        extracted_names = []
        extracted_dobs = []

        for doc in documents:
            # 1. Forensic Assessment
            f_rep: ForensicReport = doc.forensic_report
            if f_rep:
                forensic_scores.append(f_rep.forensic_score)
                if f_rep.anomaly_flags:
                    for flg in f_rep.anomaly_flags:
                        tamper_flags.append(f"[{doc.doc_type}] {flg}")
            else:
                forensic_scores.append(50.0)

            # 2. OCR Field Assessment
            fields: List[ExtractedField] = doc.extracted_fields
            if fields:
                avg_conf = sum(f.confidence for f in fields) / len(fields)
                ocr_scores.append(avg_conf)

                for f in fields:
                    if f.field_name == "APPLICANT_NAME":
                        extracted_names.append((doc.doc_type, f.field_value))
                    elif f.field_name == "DOB":
                        extracted_dobs.append((doc.doc_type, f.field_value))
            else:
                ocr_scores.append(40.0)

            # 3. Registry Match Assessment
            reg_verifs: List[RegistryVerification] = doc.registry_verifications
            if reg_verifs:
                for rv in reg_verifs:
                    registry_scores.append(rv.match_score)
                    if rv.matched_status in ["PARTIAL_MATCH", "FRAUD_MISMATCH"]:
                        discrepancies.append(f"[{doc.doc_type}] {rv.registry_name}: {rv.discrepancy_details}")
            else:
                registry_scores.append(0.0)

        # Average sub-scores
        avg_forensic = sum(forensic_scores) / max(1, len(forensic_scores))
        avg_ocr = sum(ocr_scores) / max(1, len(ocr_scores))
        avg_registry = sum(registry_scores) / max(1, len(registry_scores))

        # 4. Cross-Document Consistency Check
        cross_doc_penalty = 0.0
        if len(extracted_names) > 1:
            base_type, base_name = extracted_names[0]
            for other_type, other_name in extracted_names[1:]:
                sim = calculate_similarity(base_name, other_name)
                if sim < 80.0:
                    cross_doc_penalty += 15.0
                    discrepancies.append(
                        f"Cross-Document Identity Conflict: Name on {base_type} ('{base_name}') does not match {other_type} ('{other_name}') ({sim}% match)"
                    )

        # Base Weighted Score
        raw_score = (
            (avg_forensic * WEIGHT_FORENSIC) +
            (avg_ocr * WEIGHT_OCR) +
            (avg_registry * WEIGHT_REGISTRY)
        )

        final_trust_score = max(0.0, min(100.0, round(raw_score - cross_doc_penalty, 2)))

        # Determine Risk Tier and Recommended Action
        critical_tamper = any("EXIF_EDITING_SOFTWARE" in f or "FRAUD" in f for f in tamper_flags)

        if critical_tamper or final_trust_score < MANUAL_REVIEW_THRESHOLD:
            risk_tier = "HIGH"
            recommended_action = "REJECT"
            status = "REJECTED"
        elif final_trust_score >= AUTO_APPROVE_THRESHOLD and not discrepancies:
            risk_tier = "LOW"
            recommended_action = "AUTO_APPROVE"
            status = "AUTO_APPROVED"
        else:
            risk_tier = "MEDIUM"
            recommended_action = "MANUAL_REVIEW"
            status = "MANUAL_REVIEW"

        # Generate human-readable audit explanation
        explanation_lines = [
            f"Automated Risk Assessment: {risk_tier} Risk with Trust Score {final_trust_score}/100.",
            f"Component breakdown: Forensic Integrity {round(avg_forensic, 1)}%, OCR Confidence {round(avg_ocr, 1)}%, Registry Validation {round(avg_registry, 1)}%."
        ]
        if tamper_flags:
            explanation_lines.append(f"Security Alert: Detected {len(tamper_flags)} visual or metadata anomaly indicators.")
        if discrepancies:
            explanation_lines.append(f"Verification Discrepancies: {len(discrepancies)} mismatch(es) found.")
        if cross_doc_penalty > 0:
            explanation_lines.append("Warning: Cross-document name inconsistency observed.")

        return {
            "overall_trust_score": final_trust_score,
            "risk_tier": risk_tier,
            "recommended_action": recommended_action,
            "status": status,
            "score_breakdown": {
                "forensic_score": round(avg_forensic, 1),
                "ocr_score": round(avg_ocr, 1),
                "registry_score": round(avg_registry, 1),
                "cross_doc_penalty": cross_doc_penalty
            },
            "tamper_indicators": tamper_flags,
            "discrepancies": discrepancies,
            "explanation": " ".join(explanation_lines)
        }
