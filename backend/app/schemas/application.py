from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# Application Schemas
class ApplicationCreate(BaseModel):
    applicant_name: str = Field(..., example="Aarav Sharma")
    applicant_email: str = Field(..., example="aarav.sharma@example.edu")
    applicant_phone: Optional[str] = Field(None, example="+91 9876543210")

class ExtractedFieldSchema(BaseModel):
    id: int
    field_name: str
    field_value: str
    confidence: float
    bounding_box: Optional[List[int]] = None
    is_matched: bool = False

    class Config:
        from_attributes = True

class ForensicReportSchema(BaseModel):
    exif_software: Optional[str] = None
    exif_tamper_flag: bool = False
    ela_discrepancy_score: float = 0.0
    ela_heatmap_url: Optional[str] = None
    edge_noise_variance: float = 0.0
    stamp_seal_detected: bool = False
    stamp_seal_confidence: float = 0.0
    signature_detected: bool = False
    signature_confidence: float = 0.0
    splicing_detected: bool = False
    forensic_score: float = 100.0
    anomaly_flags: List[str] = []
    summary: Optional[str] = None

    class Config:
        from_attributes = True

class RegistryVerificationSchema(BaseModel):
    registry_name: str
    matched_status: str
    match_score: float
    queried_key: Optional[str] = None
    registry_record_preview: Optional[Dict[str, Any]] = None
    discrepancy_details: Optional[str] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocumentSchema(BaseModel):
    id: str
    application_id: str
    doc_type: str
    original_filename: str
    stored_filename: str
    file_url: str
    mime_type: str
    file_size: int
    sha256_hash: str
    status: str
    is_tampered: bool = False
    tamper_summary: Optional[str] = None
    created_at: datetime
    extracted_fields: List[ExtractedFieldSchema] = []
    forensic_report: Optional[ForensicReportSchema] = None
    registry_verifications: List[RegistryVerificationSchema] = []

    class Config:
        from_attributes = True

class AuditTrailSchema(BaseModel):
    id: int
    action: str
    performed_by: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: str
    applicant_name: str
    applicant_email: str
    applicant_phone: Optional[str] = None
    status: str
    risk_level: str
    trust_score: float
    decision_remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    documents: List[DocumentSchema] = []
    audit_trails: List[AuditTrailSchema] = []

    class Config:
        from_attributes = True

class TrustScoreResponse(BaseModel):
    application_id: str
    overall_trust_score: float
    risk_tier: str  # LOW, MEDIUM, HIGH
    recommended_action: str  # AUTO_APPROVE, MANUAL_REVIEW, REJECT
    score_breakdown: Dict[str, float]
    tamper_indicators: List[str]
    discrepancies: List[str]
    explanation: str

class ReviewDecisionRequest(BaseModel):
    decision: str = Field(..., example="APPROVED")  # APPROVED, REJECTED, NEEDS_CLARIFICATION
    remarks: str = Field(..., example="Verified manually against physical records.")
    officer_name: str = Field(default="Auditor_Officer_01")
