import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..config import SUPPORTED_DOC_TYPES
from ..utils.file_storage import save_upload_file, get_ela_output_path
from ..models.application import (
    Application, Document, ExtractedField, ForensicReport,
    RegistryVerification, AuditTrail, MockRegistryRecord
)
from ..schemas.application import (
    ApplicationCreate, ApplicationResponse, DocumentSchema,
    TrustScoreResponse, ReviewDecisionRequest, AuditTrailSchema
)
from ..services.ocr_service import OCRService
from ..services.forensics_service import ForensicAnalysisService
from ..services.digilocker_mock import MockRegistryService
from ..services.trust_score_service import TrustScoreService

router = APIRouter(prefix="/api/v1", tags=["Verification"])

# -------------------------------------------------------------
# 1. Application Management
# -------------------------------------------------------------
@router.post("/applications", response_model=ApplicationResponse)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    app = Application(
        applicant_name=payload.applicant_name,
        applicant_email=payload.applicant_email,
        applicant_phone=payload.applicant_phone,
        status="PENDING",
        risk_level="UNKNOWN"
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # Add audit log
    audit = AuditTrail(
        application_id=app.id,
        action="APPLICATION_CREATED",
        performed_by="APPLICANT_PORTAL",
        details=f"Application initialized for {app.applicant_name} ({app.applicant_email})"
    )
    db.add(audit)
    db.commit()

    return _format_application_response(app, db)

@router.get("/applications", response_model=List[ApplicationResponse])
def list_applications(
    status: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Application)
    if status:
        query = query.filter(Application.status == status)
    if risk_level:
        query = query.filter(Application.risk_level == risk_level)
    apps = query.order_by(Application.created_at.desc()).all()
    return [_format_application_response(a, db) for a in apps]

@router.get("/applications/{app_id}", response_model=ApplicationResponse)
def get_application(app_id: str, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return _format_application_response(app, db)

# -------------------------------------------------------------
# 2. Document Upload Endpoint
# -------------------------------------------------------------
@router.post("/upload-document")
async def upload_document(
    application_id: str = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Step 1: Uploads document, computes SHA-256 integrity hash, stores file on disk,
    and registers Document metadata record in DB.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if doc_type not in SUPPORTED_DOC_TYPES:
        doc_type = "OTHER"

    # Save file and calculate SHA-256 hash
    stored_filename, file_path, file_size, sha256_hash = await save_upload_file(file)

    document = Document(
        application_id=app.id,
        doc_type=doc_type,
        original_filename=file.filename or "uploaded_doc.jpg",
        stored_filename=stored_filename,
        file_path=file_path,
        mime_type=file.content_type or "image/jpeg",
        file_size=file_size,
        sha256_hash=sha256_hash,
        status="UPLOADED"
    )
    db.add(document)

    # Append audit trail
    audit = AuditTrail(
        application_id=app.id,
        action="DOCUMENT_UPLOADED",
        performed_by="APPLICANT",
        details=f"Uploaded {doc_type} ({file.filename}) - SHA-256: {sha256_hash[:12]}..."
    )
    db.add(audit)
    db.commit()
    db.refresh(document)

    return {
        "message": "Document uploaded successfully",
        "document_id": document.id,
        "application_id": app.id,
        "doc_type": document.doc_type,
        "sha256_hash": document.sha256_hash,
        "file_url": f"/uploads/{document.stored_filename}",
        "status": document.status
    }

# -------------------------------------------------------------
# 3. AI Analysis Endpoint (OCR, Layout Parsing & Forensics)
# -------------------------------------------------------------
@router.post("/analyze-document/{doc_id}")
def analyze_document(doc_id: str, db: Session = Depends(get_db)):
    """
    Step 2: Runs AI OCR & Layout NER, plus Computer Vision Forensic Suite
    (EXIF metadata, ELA heatmap difference, Stamp/Signature detection, Edge splicing).
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    image_path = doc.file_path
    ela_out_path = get_ela_output_path(doc.stored_filename)

    # 1. Run Forensic Tamper Suite
    forensic_res = ForensicAnalysisService.run_full_forensic_suite(image_path, ela_out_path)

    # Save or update ForensicReport record
    existing_rep = db.query(ForensicReport).filter(ForensicReport.document_id == doc.id).first()
    if existing_rep:
        db.delete(existing_rep)

    ela_filename = os.path.basename(ela_out_path) if forensic_res.get("ela_heatmap_path") else None

    rep = ForensicReport(
        document_id=doc.id,
        exif_software=forensic_res.get("exif_software"),
        exif_tamper_flag=forensic_res.get("exif_tamper_flag", False),
        ela_discrepancy_score=forensic_res.get("ela_discrepancy_score", 0.0),
        ela_heatmap_path=f"/uploads/forensics/{ela_filename}" if ela_filename else None,
        edge_noise_variance=forensic_res.get("edge_noise_variance", 0.0),
        stamp_seal_detected=forensic_res.get("stamp_seal_detected", False),
        stamp_seal_confidence=forensic_res.get("stamp_seal_confidence", 0.0),
        signature_detected=forensic_res.get("signature_detected", False),
        signature_confidence=forensic_res.get("signature_confidence", 0.0),
        splicing_detected=forensic_res.get("splicing_detected", False),
        forensic_score=forensic_res.get("forensic_score", 100.0),
        anomaly_flags=forensic_res.get("anomaly_flags", []),
        summary=forensic_res.get("summary")
    )
    db.add(rep)

    # Update document tamper status
    if len(forensic_res.get("anomaly_flags", [])) > 0 or rep.forensic_score < 70.0:
        doc.is_tampered = True
        doc.tamper_summary = forensic_res.get("summary")
    else:
        doc.is_tampered = False
        doc.tamper_summary = "Clean document with authentic forensic profile."

    # 2. Run OCR & NER Subsystem
    raw_text, _ = OCRService.extract_raw_text(image_path)
    extracted_entities = OCRService.parse_entities(raw_text, doc.doc_type)

    # Clear old fields
    db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).delete()

    for ent in extracted_entities:
        field_rec = ExtractedField(
            document_id=doc.id,
            field_name=ent["field_name"],
            field_value=str(ent["field_value"]),
            confidence=float(ent.get("confidence", 95.0)),
            bounding_box=ent.get("bounding_box", [10, 10, 100, 30])
        )
        db.add(field_rec)

    doc.status = "ANALYZED"

    # Add audit log
    audit = AuditTrail(
        application_id=doc.application_id,
        action="AI_ANALYZED",
        performed_by="AI_VISION_PIPELINE",
        details=f"Analyzed {doc.doc_type}: Forensic Score {rep.forensic_score}/100, {len(extracted_entities)} fields extracted"
    )
    db.add(audit)
    db.commit()

    return {
        "document_id": doc.id,
        "status": doc.status,
        "is_tampered": doc.is_tampered,
        "forensic_report": {
            "forensic_score": rep.forensic_score,
            "exif_software": rep.exif_software,
            "exif_tamper_flag": rep.exif_tamper_flag,
            "ela_discrepancy_score": rep.ela_discrepancy_score,
            "ela_heatmap_url": rep.ela_heatmap_path,
            "stamp_seal_detected": rep.stamp_seal_detected,
            "signature_detected": rep.signature_detected,
            "anomaly_flags": rep.anomaly_flags,
            "summary": rep.summary
        },
        "extracted_fields": extracted_entities
    }

# -------------------------------------------------------------
# 4. Registry Verification & Trust Score Engine Endpoint
# -------------------------------------------------------------
@router.post("/verify-document/{doc_id}")
def verify_document_registry(doc_id: str, db: Session = Depends(get_db)):
    """
    Step 3: Cross-checks extracted credentials against authoritative mock DigiLocker/APAAR APIs.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Fetch extracted fields
    fields_data = [
        {"field_name": f.field_name, "field_value": f.field_value}
        for f in doc.extracted_fields
    ]

    reg_result = MockRegistryService.query_registry(db, doc.doc_type, fields_data)

    # Save or update RegistryVerification
    db.query(RegistryVerification).filter(RegistryVerification.document_id == doc.id).delete()
    verif = RegistryVerification(
        document_id=doc.id,
        registry_name=reg_result["registry_name"],
        matched_status=reg_result["matched_status"],
        match_score=reg_result["match_score"],
        queried_key=reg_result.get("queried_key"),
        registry_record_preview=reg_result.get("registry_record_preview"),
        discrepancy_details=reg_result.get("discrepancy_details")
    )
    db.add(verif)

    # Mark matched fields
    if reg_result["matched_status"] == "MATCHED":
        for f in doc.extracted_fields:
            f.is_matched = True

    doc.status = "VERIFIED"
    db.commit()

    return reg_result

@router.post("/verify-trust-score/{app_id}", response_model=TrustScoreResponse)
def calculate_trust_score(app_id: str, db: Session = Depends(get_db)):
    """
    Step 4: Computes the overall multi-factor Trust Score (0-100), evaluates Risk Matrix,
    and assigns Automated Workflow Recommendation (AUTO_APPROVE, MANUAL_REVIEW, REJECT).
    """
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    score_result = TrustScoreService.calculate_application_trust_score(app)

    # Update application record
    app.trust_score = score_result["overall_trust_score"]
    app.risk_level = score_result["risk_tier"]
    app.status = score_result["status"]
    app.decision_remarks = score_result["explanation"]

    # Append audit trail
    audit = AuditTrail(
        application_id=app.id,
        action="TRUST_SCORE_EVALUATED",
        performed_by="TRUST_SCORING_ENGINE",
        details=f"Score: {app.trust_score}/100 | Risk: {app.risk_level} | Action: {score_result['recommended_action']}"
    )
    db.add(audit)
    db.commit()

    return TrustScoreResponse(
        application_id=app.id,
        overall_trust_score=app.trust_score,
        risk_tier=app.risk_level,
        recommended_action=score_result["recommended_action"],
        score_breakdown=score_result["score_breakdown"],
        tamper_indicators=score_result["tamper_indicators"],
        discrepancies=score_result["discrepancies"],
        explanation=score_result["explanation"]
    )

# -------------------------------------------------------------
# 5. One-Click Automated Pipeline Orchestrator
# -------------------------------------------------------------
@router.post("/pipeline/run-full/{app_id}")
def run_full_pipeline(app_id: str, db: Session = Depends(get_db)):
    """
    Runs end-to-end pipeline in one call:
    Analyze all documents -> Query DigiLocker/APAAR -> Compute Trust Score.
    """
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    for doc in app.documents:
        # Run Forensic + OCR
        analyze_document(doc.id, db)
        # Run Registry Check
        verify_document_registry(doc.id, db)

    # Compute overall trust score
    trust_resp = calculate_trust_score(app.id, db)
    return {
        "message": "Full verification pipeline executed successfully",
        "application_id": app.id,
        "trust_score": trust_resp.overall_trust_score,
        "risk_level": trust_resp.risk_tier,
        "status": app.status,
        "recommendation": trust_resp.recommended_action
    }

# -------------------------------------------------------------
# 6. Admin Manual Decision & Audit Trail
# -------------------------------------------------------------
@router.post("/review-decision/{app_id}")
def submit_admin_decision(app_id: str, payload: ReviewDecisionRequest, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if payload.decision == "APPROVED":
        app.status = "APPROVED"
    elif payload.decision == "REJECTED":
        app.status = "REJECTED"
    else:
        app.status = "MANUAL_REVIEW"

    app.decision_remarks = f"[{payload.officer_name}] {payload.remarks}"

    audit = AuditTrail(
        application_id=app.id,
        action=f"ADMIN_{payload.decision}",
        performed_by=payload.officer_name,
        details=f"Decision: {payload.decision} | Remarks: {payload.remarks}"
    )
    db.add(audit)
    db.commit()

    return {"message": "Admin review decision recorded", "status": app.status}

# -------------------------------------------------------------
# 7. Mock Registry Search / Seed Data
# -------------------------------------------------------------
@router.get("/registry/records")
def get_registry_records(db: Session = Depends(get_db)):
    MockRegistryService.seed_defaults(db)
    records = db.query(MockRegistryRecord).all()
    return records


def _format_application_response(app: Application, db: Session) -> ApplicationResponse:
    docs_payload = []
    for d in app.documents:
        f_rep = None
        if d.forensic_report:
            f_rep = {
                "exif_software": d.forensic_report.exif_software,
                "exif_tamper_flag": d.forensic_report.exif_tamper_flag,
                "ela_discrepancy_score": d.forensic_report.ela_discrepancy_score,
                "ela_heatmap_url": d.forensic_report.ela_heatmap_path,
                "edge_noise_variance": d.forensic_report.edge_noise_variance,
                "stamp_seal_detected": d.forensic_report.stamp_seal_detected,
                "stamp_seal_confidence": d.forensic_report.stamp_seal_confidence,
                "signature_detected": d.forensic_report.signature_detected,
                "signature_confidence": d.forensic_report.signature_confidence,
                "splicing_detected": d.forensic_report.splicing_detected,
                "forensic_score": d.forensic_report.forensic_score,
                "anomaly_flags": d.forensic_report.anomaly_flags or [],
                "summary": d.forensic_report.summary
            }

        extracted_fields_payload = [
            {
                "id": ef.id,
                "field_name": ef.field_name,
                "field_value": ef.field_value,
                "confidence": ef.confidence,
                "bounding_box": ef.bounding_box,
                "is_matched": ef.is_matched
            }
            for ef in d.extracted_fields
        ]

        registry_verifs_payload = [
            {
                "registry_name": rv.registry_name,
                "matched_status": rv.matched_status,
                "match_score": rv.match_score,
                "queried_key": rv.queried_key,
                "registry_record_preview": rv.registry_record_preview,
                "discrepancy_details": rv.discrepancy_details,
                "verified_at": rv.verified_at
            }
            for rv in d.registry_verifications
        ]

        docs_payload.append({
            "id": d.id,
            "application_id": d.application_id,
            "doc_type": d.doc_type,
            "original_filename": d.original_filename,
            "stored_filename": d.stored_filename,
            "file_url": f"/uploads/{d.stored_filename}",
            "mime_type": d.mime_type,
            "file_size": d.file_size,
            "sha256_hash": d.sha256_hash,
            "status": d.status,
            "is_tampered": d.is_tampered,
            "tamper_summary": d.tamper_summary,
            "created_at": d.created_at,
            "extracted_fields": extracted_fields_payload,
            "forensic_report": f_rep,
            "registry_verifications": registry_verifs_payload
        })

    audit_payload = [
        {
            "id": a.id,
            "action": a.action,
            "performed_by": a.performed_by,
            "details": a.details,
            "timestamp": a.timestamp
        }
        for a in app.audit_trails
    ]

    return ApplicationResponse(
        id=app.id,
        applicant_name=app.applicant_name,
        applicant_email=app.applicant_email,
        applicant_phone=app.applicant_phone,
        status=app.status,
        risk_level=app.risk_level,
        trust_score=app.trust_score,
        decision_remarks=app.decision_remarks,
        created_at=app.created_at,
        updated_at=app.updated_at,
        documents=docs_payload,
        audit_trails=audit_payload
    )
