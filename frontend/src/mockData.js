// Benchmark SIH26261 Demonstration Data for Standalone / Offline Evaluation

export const MOCK_APPLICATIONS = [
  {
    id: "app-aarav-001",
    applicant_name: "Aarav Sharma",
    applicant_email: "aarav.sharma@example.edu",
    applicant_phone: "+91 9876543210",
    status: "APPROVED",
    risk_level: "LOW",
    trust_score: 98.86,
    decision_remarks: "Autonomous Verification: Forensic integrity clean, OCR extracted credentials match DigiLocker APAAR registry 100%.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    documents: [
      {
        id: "doc-aarav-01",
        application_id: "app-aarav-001",
        doc_type: "MARKSHEET",
        original_filename: "Aarav_AnnaUniv_Degree.jpg",
        stored_filename: "doc_aarav_marksheet.jpg",
        file_url: "/uploads/doc_aarav_marksheet.jpg",
        mime_type: "image/jpeg",
        file_size: 37970,
        sha256_hash: "a4f78e9b621c901e8432a51275dc43a789efb123456789abcdef0123456789ab",
        status: "VERIFIED",
        is_tampered: false,
        tamper_summary: "No digital manipulation detected. EXIF metadata consistent with optical scanner.",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        extracted_fields: [
          { id: "ef-1", field_name: "Candidate Name", field_value: "Aarav Sharma", confidence: 0.99, bounding_box: [70, 110, 320, 140], is_matched: true },
          { id: "ef-2", field_name: "Roll Number", field_value: "2020CS1049", confidence: 0.98, bounding_box: [70, 145, 300, 175], is_matched: true },
          { id: "ef-3", field_name: "Degree", field_value: "B.Tech Computer Science", confidence: 0.97, bounding_box: [70, 180, 420, 210], is_matched: true },
          { id: "ef-4", field_name: "Institution", field_value: "Anna University", confidence: 0.99, bounding_box: [70, 215, 360, 245], is_matched: true },
          { id: "ef-5", field_name: "CGPA / Grade", field_value: "8.92", confidence: 0.98, bounding_box: [70, 250, 220, 280], is_matched: true }
        ],
        forensic_report: {
          exif_software: "Digital Identity Scanner v3.2",
          exif_tamper_flag: false,
          ela_discrepancy_score: 0.008,
          ela_heatmap_url: "/uploads/forensics/ela_doc_aarav_marksheet.jpg",
          edge_noise_variance: 14.2,
          stamp_seal_detected: true,
          stamp_seal_confidence: 0.96,
          signature_detected: true,
          signature_confidence: 0.94,
          splicing_detected: false,
          forensic_score: 98.8,
          anomaly_flags: [],
          summary: "Document exhibits uniform JPEG compression grid. Official circular seal and authorized signature verified with high confidence."
        },
        registry_verifications: [
          {
            registry_name: "DigiLocker / APAAR National Academic Depository",
            matched_status: "MATCHED",
            match_score: 99.5,
            queried_key: "2020CS1049",
            registry_record_preview: {
              roll_number: "2020CS1049",
              full_name: "Aarav Sharma",
              institution: "Anna University",
              degree: "B.Tech Computer Science",
              grade: "8.92",
              status: "ACTIVE_VALID"
            },
            discrepancy_details: "Exact cryptographic match against central registry database record.",
            verified_at: new Date(Date.now() - 3600000).toISOString()
          }
        ]
      }
    ],
    audit_trails: [
      { id: "aud-1", action: "UPLOAD_RECEIVED", performed_by: "System_Gateway", details: "Document received and SHA-256 hash computed.", timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: "aud-2", action: "FORENSIC_ANALYSIS_COMPLETED", performed_by: "CV_Forensics_Engine", details: "ELA and EXIF validation completed. Score: 98.80%", timestamp: new Date(Date.now() - 7000000).toISOString() },
      { id: "aud-3", action: "REGISTRY_VERIFIED", performed_by: "APAAR_Connector", details: "Record matched against central DigiLocker academic database.", timestamp: new Date(Date.now() - 6800000).toISOString() },
      { id: "aud-4", action: "AUTO_APPROVED", performed_by: "Autonomous_Scorer", details: "Trust score 98.86 exceeds auto-approval threshold (>= 85.0).", timestamp: new Date(Date.now() - 6500000).toISOString() }
    ]
  },
  {
    id: "app-rohan-002",
    applicant_name: "Rohan Varma",
    applicant_email: "rohan.varma@example.edu",
    applicant_phone: "+91 9876543211",
    status: "PENDING_REVIEW",
    risk_level: "MEDIUM",
    trust_score: 78.50,
    decision_remarks: "Flagged for Scrutiny Officer: Minor phonetic name variation between application ('Varma') and university registry ('Verma').",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    documents: [
      {
        id: "doc-rohan-02",
        application_id: "app-rohan-002",
        doc_type: "MARKSHEET",
        original_filename: "Rohan_DelhiUniv_Provisional.jpg",
        stored_filename: "doc_rohan_marksheet.jpg",
        file_url: "/uploads/doc_rohan_marksheet.jpg",
        mime_type: "image/jpeg",
        file_size: 29262,
        sha256_hash: "7bc3410f9241da509312b184ef4821a8c90351bfa7041c28005e810acb7b12d3",
        status: "FLAGGED_REVIEW",
        is_tampered: false,
        tamper_summary: "No malicious splicing detected. Minor seal contrast discrepancy noted.",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        extracted_fields: [
          { id: "ef-201", field_name: "Candidate Name", field_value: "Rohan Varma", confidence: 0.96, bounding_box: [70, 110, 310, 140], is_matched: true },
          { id: "ef-202", field_name: "Roll Number", field_value: "2021ME5510", confidence: 0.97, bounding_box: [70, 145, 290, 175], is_matched: true },
          { id: "ef-203", field_name: "Degree", field_value: "B.Tech Mechanical Engineering", confidence: 0.94, bounding_box: [70, 180, 440, 210], is_matched: true },
          { id: "ef-204", field_name: "Institution", field_value: "Delhi University", confidence: 0.98, bounding_box: [70, 215, 340, 245], is_matched: true },
          { id: "ef-205", field_name: "CGPA / Grade", field_value: "7.84", confidence: 0.95, bounding_box: [70, 250, 220, 280], is_matched: true }
        ],
        forensic_report: {
          exif_software: "Digital Identity Scanner v3.2",
          exif_tamper_flag: false,
          ela_discrepancy_score: 0.042,
          ela_heatmap_url: "/uploads/forensics/ela_doc_rohan_marksheet.jpg",
          edge_noise_variance: 22.8,
          stamp_seal_detected: true,
          stamp_seal_confidence: 0.72,
          signature_detected: true,
          signature_confidence: 0.88,
          splicing_detected: false,
          forensic_score: 87.5,
          anomaly_flags: ["SEAL_LOW_CONFIDENCE"],
          summary: "Moderate seal contrast degradation. Overall image structure consistent, no Photoshop or re-compression layers detected."
        },
        registry_verifications: [
          {
            registry_name: "DigiLocker / APAAR National Academic Depository",
            matched_status: "PARTIAL_MATCH",
            match_score: 82.0,
            queried_key: "2021ME5510",
            registry_record_preview: {
              roll_number: "2021ME5510",
              full_name: "Rohan Verma",
              institution: "Delhi University",
              degree: "B.Tech Mechanical Engineering",
              grade: "7.84",
              status: "ACTIVE_VALID"
            },
            discrepancy_details: "Slight phonetic discrepancy: Document states 'Rohan Varma', registry record shows 'Rohan Verma'. Manual officer confirmation advised.",
            verified_at: new Date(Date.now() - 3600000 * 2).toISOString()
          }
        ]
      }
    ],
    audit_trails: [
      { id: "aud-21", action: "UPLOAD_RECEIVED", performed_by: "System_Gateway", details: "Document received and SHA-256 hash computed.", timestamp: new Date(Date.now() - 18000000).toISOString() },
      { id: "aud-22", action: "FORENSIC_ANALYSIS_COMPLETED", performed_by: "CV_Forensics_Engine", details: "Minor seal contrast warning noted. Score: 87.50%", timestamp: new Date(Date.now() - 17500000).toISOString() },
      { id: "aud-23", action: "REGISTRY_VERIFIED", performed_by: "APAAR_Connector", details: "Partial match: Candidate surname spelling variance.", timestamp: new Date(Date.now() - 17000000).toISOString() },
      { id: "aud-24", action: "ROUTED_TO_MANUAL_REVIEW", performed_by: "Autonomous_Scorer", details: "Trust score 78.50 falls in Medium Risk zone (60-84). Assigned to review queue.", timestamp: new Date(Date.now() - 16500000).toISOString() }
    ]
  },
  {
    id: "app-vikram-003",
    applicant_name: "Vikram Malhotra",
    applicant_email: "vikram.fake@darkmail.com",
    applicant_phone: "+91 9999900000",
    status: "REJECTED",
    risk_level: "HIGH",
    trust_score: 38.00,
    decision_remarks: "CRITICAL SECURITY ALERT: Digital forgery confirmed. EXIF tag reveals 'Adobe Photoshop 2024'. Error Level Analysis reveals spliced CGPA box. Registry roll number does not exist.",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    documents: [
      {
        id: "doc-vikram-03",
        application_id: "app-vikram-003",
        doc_type: "MARKSHEET",
        original_filename: "Vikram_IITBombay_Certificate.jpg",
        stored_filename: "doc_vikram_forged.jpg",
        file_url: "/uploads/doc_vikram_forged.jpg",
        mime_type: "image/jpeg",
        file_size: 32292,
        sha256_hash: "e5a87123bf0450912389ab4127004f1289cba5600127812903bbca5432109876",
        status: "TAMPER_DETECTED",
        is_tampered: true,
        tamper_summary: "EXIF manipulation detected: Adobe Photoshop 2024. Splicing noise anomaly detected around CGPA field. Official seal missing.",
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        extracted_fields: [
          { id: "ef-301", field_name: "Candidate Name", field_value: "Vikram Malhotra", confidence: 0.92, bounding_box: [70, 110, 330, 140], is_matched: false },
          { id: "ef-302", field_name: "Roll Number", field_value: "REVOKED-FAKE-999", confidence: 0.95, bounding_box: [70, 145, 360, 175], is_matched: false },
          { id: "ef-303", field_name: "Degree", field_value: "B.Tech Computer Science", confidence: 0.91, bounding_box: [70, 180, 420, 210], is_matched: false },
          { id: "ef-304", field_name: "Institution", field_value: "IIT Bombay (Forged)", confidence: 0.88, bounding_box: [70, 215, 380, 245], is_matched: false },
          { id: "ef-305", field_name: "CGPA / Grade", field_value: "9.98 (EDITED)", confidence: 0.97, bounding_box: [480, 200, 720, 260], is_matched: false }
        ],
        forensic_report: {
          exif_software: "Adobe Photoshop 2024 (Windows)",
          exif_tamper_flag: true,
          ela_discrepancy_score: 0.285,
          ela_heatmap_url: "/uploads/forensics/ela_doc_vikram_forged.jpg",
          edge_noise_variance: 74.5,
          stamp_seal_detected: false,
          stamp_seal_confidence: 0.08,
          signature_detected: false,
          signature_confidence: 0.12,
          splicing_detected: true,
          forensic_score: 31.5,
          anomaly_flags: [
            "EXIF_PHOTO_SOFTWARE_DETECTED",
            "ELA_SPLICING_HIGH_VARIANCE",
            "OFFICIAL_SEAL_MISSING",
            "SIGNATURE_MISSING"
          ],
          summary: "CRITICAL: Image modified with Adobe Photoshop 2024. Localized error level analysis highlights significant re-compression noise disparity in the CGPA patch. Splicing confirmed."
        },
        registry_verifications: [
          {
            registry_name: "DigiLocker / APAAR National Academic Depository",
            matched_status: "NOT_FOUND",
            match_score: 0.0,
            queried_key: "REVOKED-FAKE-999",
            registry_record_preview: null,
            discrepancy_details: "Queried Roll Number 'REVOKED-FAKE-999' does not exist in central university depository records.",
            verified_at: new Date(Date.now() - 3600000 * 3).toISOString()
          }
        ]
      }
    ],
    audit_trails: [
      { id: "aud-31", action: "UPLOAD_RECEIVED", performed_by: "System_Gateway", details: "Document received and SHA-256 hash computed.", timestamp: new Date(Date.now() - 28800000).toISOString() },
      { id: "aud-32", action: "TAMPER_FLAGGED", performed_by: "CV_Forensics_Engine", details: "EXIF Tag: Adobe Photoshop 2024. ELA splicing variance: 74.5.", timestamp: new Date(Date.now() - 28000000).toISOString() },
      { id: "aud-33", action: "REGISTRY_FAILED", performed_by: "APAAR_Connector", details: "Roll number not found in government repository.", timestamp: new Date(Date.now() - 27500000).toISOString() },
      { id: "aud-34", action: "AUTO_REJECTED", performed_by: "Autonomous_Scorer", details: "Trust score 38.00 falls in High Risk zone (< 60.0). Flagged as fraudulent document.", timestamp: new Date(Date.now() - 27000000).toISOString() }
    ]
  }
];

export const MOCK_REGISTRY_RECORDS = [
  {
    id: 1,
    registry_type: "APAAR_EDUCATION",
    identifier: "2020CS1049",
    full_name: "Aarav Sharma",
    dob: "14/08/2002",
    institution: "Anna University",
    degree: "B.Tech Computer Science",
    roll_number: "2020CS1049",
    grade_percentage: "8.92",
    is_revoked: false,
    created_at: "2024-01-10T09:00:00Z"
  },
  {
    id: 2,
    registry_type: "APAAR_EDUCATION",
    identifier: "2021ME5510",
    full_name: "Rohan Verma",
    dob: "20/05/2001",
    institution: "Delhi University",
    degree: "B.Tech Mechanical Engineering",
    roll_number: "2021ME5510",
    grade_percentage: "7.84",
    is_revoked: false,
    created_at: "2024-01-15T11:30:00Z"
  },
  {
    id: 3,
    registry_type: "APAAR_EDUCATION",
    identifier: "2019EE4102",
    full_name: "Priya Sundaram",
    dob: "02/11/2001",
    institution: "IIT Madras",
    degree: "B.Tech Electrical Engineering",
    roll_number: "2019EE4102",
    grade_percentage: "9.45",
    is_revoked: false,
    created_at: "2024-02-01T14:20:00Z"
  },
  {
    id: 4,
    registry_type: "DIGILOCKER_AADHAAR",
    identifier: "9988-7766-5544",
    full_name: "Aarav Sharma",
    dob: "14/08/2002",
    institution: "UIDAI Central Identity Repository",
    degree: "Aadhaar e-KYC Verification",
    roll_number: "9988-7766-5544",
    grade_percentage: "BIOMETRIC_VERIFIED",
    is_revoked: false,
    created_at: "2024-02-10T10:00:00Z"
  }
];
