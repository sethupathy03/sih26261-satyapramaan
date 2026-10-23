import os
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from app.database import SessionLocal, Base, engine
from app.models.application import Application, Document, ExtractedField, ForensicReport, RegistryVerification, AuditTrail, MockRegistryRecord
from app.config import UPLOAD_DIR, ARTIFACTS_DIR
from app.utils.file_storage import compute_sha256, get_ela_output_path
from app.services.forensics_service import ForensicAnalysisService
from app.services.ocr_service import OCRService
from app.services.digilocker_mock import MockRegistryService
from app.services.trust_score_service import TrustScoreService

def create_sample_document_image(filename: str, title: str, details: list[str], has_stamp: bool = True, fake_photoshop: bool = False) -> str:
    filepath = UPLOAD_DIR / filename
    # Create an authentic-looking certificate canvas
    w, h = 800, 560
    img = Image.new("RGB", (w, h), color=(252, 250, 245))
    draw = ImageDraw.Draw(img)

    # Decorative Border
    draw.rectangle([20, 20, w - 20, h - 20], outline=(40, 70, 120), width=4)
    draw.rectangle([28, 28, w - 28, h - 28], outline=(180, 160, 100), width=2)

    # Header
    draw.text((w // 2 - 180, 45), title.upper(), fill=(20, 40, 90))

    # Body lines
    y = 110
    for line in details:
        draw.text((70, y), line, fill=(30, 30, 30))
        y += 35

    # If official stamp requested, draw an authentic red circular seal
    if has_stamp:
        stamp_cx, stamp_cy, radius = 640, 420, 55
        draw.ellipse([stamp_cx - radius, stamp_cy - radius, stamp_cx + radius, stamp_cy + radius], outline=(180, 30, 30), width=4)
        draw.ellipse([stamp_cx - radius + 8, stamp_cy - radius + 8, stamp_cx + radius - 8, stamp_cy + radius - 8], outline=(180, 30, 30), width=1)
        draw.text((stamp_cx - 36, stamp_cy - 10), "VERIFIED", fill=(180, 30, 30))
        draw.text((stamp_cx - 42, stamp_cy + 10), "SEAL & SIGN", fill=(180, 30, 30))

    # Signature line
    draw.line([100, 470, 260, 470], fill=(60, 60, 60), width=2)
    draw.text((120, 480), "Authorized Signatory", fill=(80, 80, 80))

    # If tampering simulation requested, insert high-contrast spliced patch
    if fake_photoshop:
        # Splice a patched box with different compression/noise
        draw.rectangle([480, 200, 720, 260], fill=(240, 255, 240), outline=(255, 0, 0), width=2)
        draw.text((490, 215), "CGPA: 9.98 (EDITED)", fill=(180, 0, 0))

    # Save image
    exif = img.getexif()
    if fake_photoshop:
        # Inject Software tag for Adobe Photoshop
        exif[0x0131] = "Adobe Photoshop 2024 (Windows)"
    else:
        exif[0x0131] = "Digital Identity Scanner v3.2"

    img.save(filepath, "JPEG", quality=92, exif=exif)
    return str(filepath)

def seed_database():
    print("[*] Re-initializing Database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data
    db.query(AuditTrail).delete()
    db.query(RegistryVerification).delete()
    db.query(ExtractedField).delete()
    db.query(ForensicReport).delete()
    db.query(Document).delete()
    db.query(Application).delete()
    db.query(MockRegistryRecord).delete()
    db.commit()

    # Seed mock government records
    MockRegistryService.seed_defaults(db)

    # Add extra registry records for test cases
    db.add(MockRegistryRecord(
        registry_type="APAAR_EDUCATION",
        identifier="2020CS1049",
        full_name="Aarav Sharma",
        dob="14/08/2002",
        institution="Anna University",
        degree="B.Tech Computer Science",
        roll_number="2020CS1049",
        grade_percentage="8.92",
        is_revoked=False
    ))
    db.add(MockRegistryRecord(
        registry_type="APAAR_EDUCATION",
        identifier="2021ME5510",
        full_name="Rohan Verma",  # Note slight spelling difference with Varma
        dob="20/05/2001",
        institution="Delhi University",
        degree="B.Tech Mechanical Engineering",
        roll_number="2021ME5510",
        grade_percentage="7.80",
        is_revoked=False
    ))
    db.commit()

    # -------------------------------------------------------------------------
    # CASE 1: Low Risk / Genuine Candidate (Aarav Sharma) -> Auto-Approved
    # -------------------------------------------------------------------------
    print("[+] Seeding Case 1: Genuine Applicant (Aarav Sharma)...")
    app1 = Application(
        applicant_name="Aarav Sharma",
        applicant_email="aarav.sharma@example.edu",
        applicant_phone="+91 9876543210",
        status="PENDING",
        risk_level="UNKNOWN"
    )
    db.add(app1)
    db.commit()
    db.refresh(app1)

    f1_path = create_sample_document_image(
        "doc_aarav_marksheet.jpg",
        "Anna University Chennai",
        [
            "Candidate: Aarav Sharma",
            "Degree: Bachelor of Technology (Computer Science)",
            "Roll No: 2020CS1049",
            "CGPA: 8.92",
            "Year of Passing: 2024",
            "Result: First Class with Distinction"
        ],
        has_stamp=True,
        fake_photoshop=False
    )

    doc1 = Document(
        application_id=app1.id,
        doc_type="MARKSHEET",
        original_filename="Aarav_BTech_Marksheet.jpg",
        stored_filename="doc_aarav_marksheet.jpg",
        file_path=f1_path,
        mime_type="image/jpeg",
        file_size=os.path.getsize(f1_path),
        sha256_hash=compute_sha256(f1_path),
        status="UPLOADED"
    )
    db.add(doc1)
    db.commit()
    db.refresh(doc1)

    # -------------------------------------------------------------------------
    # CASE 2: Medium Risk / Discrepancy (Rohan Varma) -> Manual Review
    # -------------------------------------------------------------------------
    print("[+] Seeding Case 2: Borderline Discrepancy (Rohan Varma)...")
    app2 = Application(
        applicant_name="Rohan Varma",
        applicant_email="rohan.varma@example.edu",
        applicant_phone="+91 9123456789",
        status="PENDING",
        risk_level="UNKNOWN"
    )
    db.add(app2)
    db.commit()
    db.refresh(app2)

    f2_path = create_sample_document_image(
        "doc_rohan_marksheet.jpg",
        "Delhi University",
        [
            "Candidate: Rohan Varma",
            "Degree: Bachelor of Technology (Mechanical)",
            "Roll No: 2021ME5510",
            "CGPA: 7.80",
            "Year of Passing: 2024"
        ],
        has_stamp=False,  # Missing stamp
        fake_photoshop=False
    )

    doc2 = Document(
        application_id=app2.id,
        doc_type="MARKSHEET",
        original_filename="Rohan_Marksheet_Provisional.jpg",
        stored_filename="doc_rohan_marksheet.jpg",
        file_path=f2_path,
        mime_type="image/jpeg",
        file_size=os.path.getsize(f2_path),
        sha256_hash=compute_sha256(f2_path),
        status="UPLOADED"
    )
    db.add(doc2)
    db.commit()
    db.refresh(doc2)

    # -------------------------------------------------------------------------
    # CASE 3: High Risk / Tampered Forgery (Vikram Malhotra) -> Rejected
    # -------------------------------------------------------------------------
    print("[+] Seeding Case 3: Tampered Forgery (Vikram Malhotra)...")
    app3 = Application(
        applicant_name="Vikram Malhotra",
        applicant_email="vikram.fake@darkmail.com",
        applicant_phone="+91 9999900000",
        status="PENDING",
        risk_level="UNKNOWN"
    )
    db.add(app3)
    db.commit()
    db.refresh(app3)

    f3_path = create_sample_document_image(
        "doc_vikram_forged.jpg",
        "IIT Bombay (Forged Copy)",
        [
            "Candidate: Vikram Malhotra",
            "Roll No: REVOKED-FAKE-999",
            "Degree: B.Tech Computer Science",
            "CGPA: 9.98",
            "Year: 2024"
        ],
        has_stamp=False,
        fake_photoshop=True  # High ELA anomaly + Photoshop tag
    )

    doc3 = Document(
        application_id=app3.id,
        doc_type="MARKSHEET",
        original_filename="Vikram_IIT_Certificate.jpg",
        stored_filename="doc_vikram_forged.jpg",
        file_path=f3_path,
        mime_type="image/jpeg",
        file_size=os.path.getsize(f3_path),
        sha256_hash=compute_sha256(f3_path),
        status="UPLOADED"
    )
    db.add(doc3)
    db.commit()
    db.refresh(doc3)

    # Run AI pipeline on all 3 applications so they are ready for instant review in Dashboard!
    from app.api.endpoints import analyze_document, verify_document_registry, calculate_trust_score

    for app in [app1, app2, app3]:
        for d in app.documents:
            analyze_document(d.id, db)
            verify_document_registry(d.id, db)
        calculate_trust_score(app.id, db)

    db.close()
    print("[OK] Seed Data populated successfully!")

if __name__ == "__main__":
    seed_database()
