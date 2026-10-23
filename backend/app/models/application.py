import datetime
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    applicant_name = Column(String(150), nullable=False)
    applicant_email = Column(String(150), nullable=False)
    applicant_phone = Column(String(20), nullable=True)
    status = Column(String(30), default="PENDING")  # PENDING, IN_PROGRESS, AUTO_APPROVED, MANUAL_REVIEW, REJECTED
    risk_level = Column(String(20), default="UNKNOWN")  # LOW, MEDIUM, HIGH, UNKNOWN
    trust_score = Column(Float, default=0.0)
    decision_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    audit_trails = relationship("AuditTrail", back_populates="application", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(String(50), nullable=False)  # AADHAAR_CARD, PAN_CARD, DEGREE_CERTIFICATE, MARKSHEET, OTHER
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, default=0)
    sha256_hash = Column(String(64), nullable=False)
    status = Column(String(30), default="UPLOADED")  # UPLOADED, ANALYZED, VERIFIED, FAILED
    is_tampered = Column(Boolean, default=False)
    tamper_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="documents")
    extracted_fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")
    forensic_report = relationship("ForensicReport", back_populates="document", uselist=False, cascade="all, delete-orphan")
    registry_verifications = relationship("RegistryVerification", back_populates="document", cascade="all, delete-orphan")

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(100), nullable=False)  # NAME, ID_NUMBER, DOB, INSTITUTION, ROLL_NUMBER, CGPA, etc.
    field_value = Column(Text, nullable=False)
    confidence = Column(Float, default=100.0)
    bounding_box = Column(JSON, nullable=True)  # [x, y, width, height]
    is_matched = Column(Boolean, default=False)

    document = relationship("Document", back_populates="extracted_fields")

class ForensicReport(Base):
    __tablename__ = "forensic_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False)
    exif_software = Column(String(150), nullable=True)
    exif_tamper_flag = Column(Boolean, default=False)
    ela_discrepancy_score = Column(Float, default=0.0)  # 0 to 100, higher means high tampering probability
    ela_heatmap_path = Column(String(500), nullable=True)
    edge_noise_variance = Column(Float, default=0.0)
    stamp_seal_detected = Column(Boolean, default=False)
    stamp_seal_confidence = Column(Float, default=0.0)
    signature_detected = Column(Boolean, default=False)
    signature_confidence = Column(Float, default=0.0)
    splicing_detected = Column(Boolean, default=False)
    forensic_score = Column(Float, default=100.0)  # Integrity score: 100 = clean, 0 = heavily manipulated
    anomaly_flags = Column(JSON, default=list)  # list of strings: ["PHOTOSHOP_METADATA", "ELA_HIGH_DIFF", etc.]
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="forensic_report")

class RegistryVerification(Base):
    __tablename__ = "registry_verifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    registry_name = Column(String(100), nullable=False)  # DIGILOCKER_UIDAI, DIGILOCKER_PAN, APAAR_ABC, STATE_BOARD
    matched_status = Column(String(50), default="UNVERIFIED")  # MATCHED, PARTIAL_MATCH, NOT_FOUND, FRAUD_MISMATCH
    match_score = Column(Float, default=0.0)  # 0 to 100
    queried_key = Column(String(150), nullable=True)
    registry_record_preview = Column(JSON, nullable=True)
    discrepancy_details = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="registry_verifications")

class AuditTrail(Base):
    __tablename__ = "audit_trails"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)
    performed_by = Column(String(100), default="SYSTEM_AI")
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="audit_trails")

class MockRegistryRecord(Base):
    __tablename__ = "mock_registry_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    registry_type = Column(String(50), nullable=False)  # DIGILOCKER_AADHAAR, DIGILOCKER_PAN, APAAR_EDUCATION
    identifier = Column(String(100), nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    dob = Column(String(30), nullable=True)
    institution = Column(String(200), nullable=True)
    degree = Column(String(150), nullable=True)
    roll_number = Column(String(100), nullable=True)
    grade_percentage = Column(String(50), nullable=True)
    is_revoked = Column(Boolean, default=False)
