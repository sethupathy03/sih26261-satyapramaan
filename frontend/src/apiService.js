import { API_ENDPOINTS, getApiBaseUrl, setCustomApiUrl } from './config';
import { MOCK_APPLICATIONS, MOCK_REGISTRY_RECORDS } from './mockData';

const MOCK_STORAGE_KEY = 'satyapramaan_mock_apps';

function getStoredMockApplications() {
  if (typeof window === 'undefined') return MOCK_APPLICATIONS;
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore json error
  }
  return MOCK_APPLICATIONS;
}

function saveStoredMockApplications(apps) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    // ignore
  }
}

export function resetMockData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  }
}

export async function testBackendConnection(url) {
  const target = (url || getApiBaseUrl() || '').replace(/\/+$/, '');
  const testUrl = target ? `${target}/health` : '/health';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(testUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    }
    return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err) {
    return { success: false, error: err.name === 'AbortError' ? 'Connection timed out (4s)' : err.message };
  }
}

export async function fetchApplications() {
  const endpoint = API_ENDPOINTS.APPLICATIONS();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return { data, isLive: true };
      }
    }
  } catch (err) {
    // Network / 404 / timeout - fallback seamlessly to mock data
  }

  // Graceful Standalone / Demo Mode fallback
  const mockData = getStoredMockApplications();
  return { data: mockData, isLive: false };
}

export async function submitReviewDecision(appId, decision, remarks = '', officerName = 'Lead_Scrutiny_Officer', isLiveMode = false) {
  let liveSuccess = false;
  if (isLiveMode) {
    try {
      const res = await fetch(API_ENDPOINTS.REVIEW_DECISION(appId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          remarks: remarks || `Officer reviewed and marked as ${decision}.`,
          officer_name: officerName
        })
      });
      if (res.ok) {
        liveSuccess = true;
      }
    } catch (e) {
      // fallback to updating local mock store
    }
  }

  // Always update mock local store so UI state updates immediately in demo mode
  const currentMock = getStoredMockApplications();
  const updatedMock = currentMock.map((app) => {
    if (app.id === appId) {
      const newStatus = decision === 'APPROVE' ? 'APPROVED' : decision === 'REJECT' ? 'REJECTED' : 'PENDING_REVIEW';
      const newTrail = {
        id: `aud-${Date.now()}`,
        action: `DECISION_${decision}`,
        performed_by: officerName,
        details: remarks || `Officer decision recorded: ${decision}`,
        timestamp: new Date().toISOString()
      };
      return {
        ...app,
        status: newStatus,
        decision_remarks: remarks || `Officer reviewed and marked as ${decision}.`,
        audit_trails: [newTrail, ...(app.audit_trails || [])]
      };
    }
    return app;
  });
  saveStoredMockApplications(updatedMock);

  return { success: true, isLive: liveSuccess };
}

export async function fetchRegistryRecords(isLiveMode = false) {
  if (isLiveMode) {
    try {
      const res = await fetch(API_ENDPOINTS.REGISTRY_RECORDS());
      if (res.ok) {
        const data = await res.json();
        return { data, isLive: true };
      }
    } catch (e) {
      // fallback
    }
  }
  return { data: MOCK_REGISTRY_RECORDS, isLive: false };
}

// Client-side SHA-256 computation for offline demo
async function computeFileSha256(file) {
  try {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  }
}

export async function runClientSidePipelineSimulation(formData, docType, file, onStepChange) {
  const sha256 = await computeFileSha256(file);
  const isSuspicious = file.name.toLowerCase().includes('forged') ||
                       file.name.toLowerCase().includes('vikram') ||
                       formData.name.toLowerCase().includes('vikram');
  const isDiscrepant = file.name.toLowerCase().includes('rohan') ||
                       formData.name.toLowerCase().includes('rohan');

  // Step 1: SHA-256 Integrity
  if (onStepChange) onStepChange(1);
  await new Promise(r => setTimeout(r, 600));

  // Step 2: CV Forensic Tamper & ELA
  if (onStepChange) onStepChange(2);
  await new Promise(r => setTimeout(r, 700));

  // Step 3: OCR & Layout Entity Extraction
  if (onStepChange) onStepChange(3);
  await new Promise(r => setTimeout(r, 700));

  // Step 4: DigiLocker / APAAR Cross-Check
  if (onStepChange) onStepChange(4);
  await new Promise(r => setTimeout(r, 700));

  // Step 5: Multi-Factor Trust Scoring
  if (onStepChange) onStepChange(5);
  await new Promise(r => setTimeout(r, 600));

  let trustScore = 96.50;
  let riskLevel = 'LOW';
  let status = 'APPROVED';
  let forensicScore = 98.2;
  let ocrScore = 97.0;
  let registryScore = 98.0;
  let isTampered = false;
  let elaScore = 0.012;
  let elaUrl = '/uploads/forensics/ela_doc_aarav_marksheet.jpg';
  let fileUrl = URL.createObjectURL(file);

  if (isSuspicious) {
    trustScore = 38.00;
    riskLevel = 'HIGH';
    status = 'REJECTED';
    forensicScore = 31.5;
    ocrScore = 38.0;
    registryScore = 0.0;
    isTampered = true;
    elaScore = 0.285;
    elaUrl = '/uploads/forensics/ela_doc_vikram_forged.jpg';
  } else if (isDiscrepant) {
    trustScore = 78.50;
    riskLevel = 'MEDIUM';
    status = 'PENDING_REVIEW';
    forensicScore = 87.5;
    ocrScore = 77.0;
    registryScore = 82.0;
    elaScore = 0.042;
    elaUrl = '/uploads/forensics/ela_doc_rohan_marksheet.jpg';
  }

  const newAppId = `app-${Date.now()}`;
  const newDocId = `doc-${Date.now()}`;

  const createdApplication = {
    id: newAppId,
    applicant_name: formData.name,
    applicant_email: formData.email,
    applicant_phone: formData.phone || '+91 9876543210',
    status,
    risk_level: riskLevel,
    trust_score: trustScore,
    decision_remarks: isSuspicious
      ? 'CRITICAL ALERT: Digital manipulation and registry mismatch detected.'
      : isDiscrepant
      ? 'Flagged for scrutiny officer: Minor discrepancy between document and registry.'
      : 'Auto-Approved: All forensic and registry checks passed with high confidence.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    documents: [
      {
        id: newDocId,
        application_id: newAppId,
        doc_type: docType,
        original_filename: file.name,
        stored_filename: file.name,
        file_url: fileUrl,
        mime_type: file.type || 'image/jpeg',
        file_size: file.size,
        sha256_hash: sha256,
        status: isTampered ? 'TAMPER_DETECTED' : 'VERIFIED',
        is_tampered: isTampered,
        tamper_summary: isTampered
          ? 'EXIF software anomaly detected. Error Level Analysis indicates spliced patch.'
          : 'Document structure clean. Consistent compression matrix.',
        created_at: new Date().toISOString(),
        extracted_fields: [
          { id: 'f1', field_name: 'Applicant Name', field_value: formData.name, confidence: 0.98, bounding_box: [70, 110, 300, 140], is_matched: !isSuspicious },
          { id: 'f2', field_name: 'Document Type', field_value: docType, confidence: 0.99, bounding_box: [70, 145, 280, 175], is_matched: true },
          { id: 'f3', field_name: 'Verification Identifier', field_value: `REG-${Math.floor(100000 + Math.random() * 900000)}`, confidence: 0.96, bounding_box: [70, 180, 350, 210], is_matched: !isSuspicious }
        ],
        forensic_report: {
          exif_software: isSuspicious ? 'Adobe Photoshop 2024 (Windows)' : 'Digital Identity Scanner v3.2',
          exif_tamper_flag: isSuspicious,
          ela_discrepancy_score: elaScore,
          ela_heatmap_url: elaUrl,
          edge_noise_variance: isSuspicious ? 74.5 : 16.4,
          stamp_seal_detected: !isSuspicious,
          stamp_seal_confidence: isSuspicious ? 0.08 : 0.94,
          signature_detected: !isSuspicious,
          signature_confidence: isSuspicious ? 0.12 : 0.91,
          splicing_detected: isSuspicious,
          forensic_score: forensicScore,
          anomaly_flags: isSuspicious ? ['EXIF_PHOTO_SOFTWARE_DETECTED', 'ELA_SPLICING_HIGH_VARIANCE'] : [],
          summary: isSuspicious
            ? 'Tampering detected via ELA noise analysis and metadata flags.'
            : 'All forensic checks passed. No compression inconsistencies found.'
        },
        registry_verifications: [
          {
            registry_name: 'DigiLocker / APAAR National Academic Depository',
            matched_status: isSuspicious ? 'NOT_FOUND' : isDiscrepant ? 'PARTIAL_MATCH' : 'MATCHED',
            match_score: registryScore,
            queried_key: formData.name,
            registry_record_preview: isSuspicious ? null : {
              name: formData.name,
              status: 'VERIFIED_RECORD'
            },
            discrepancy_details: isSuspicious
              ? 'Roll number not found in central registry.'
              : isDiscrepant
              ? 'Minor character mismatch in registry database.'
              : 'Cryptographic match confirmed.',
            verified_at: new Date().toISOString()
          }
        ]
      }
    ],
    audit_trails: [
      { id: 'aud-s1', action: 'UPLOAD_PROCESSED', performed_by: 'Client_Engine', details: `SHA-256 computed: ${sha256.slice(0, 16)}...`, timestamp: new Date().toISOString() },
      { id: 'aud-s2', action: 'FORENSICS_RUN', performed_by: 'CV_Forensics_Engine', details: `Score: ${forensicScore}%`, timestamp: new Date().toISOString() },
      { id: 'aud-s3', action: 'TRUST_SCORED', performed_by: 'Autonomous_Scorer', details: `Final Trust Score: ${trustScore}% (${riskLevel} RISK)`, timestamp: new Date().toISOString() }
    ]
  };

  // Add to local mock storage
  const currentMock = getStoredMockApplications();
  const updated = [createdApplication, ...currentMock];
  saveStoredMockApplications(updated);

  return {
    application: createdApplication,
    trustScore: {
      application_id: newAppId,
      trust_score: trustScore,
      risk_level: riskLevel,
      breakdown: {
        forensic: { score: forensicScore, weight: 0.40, weighted: (forensicScore * 0.40).toFixed(2) },
        ocr: { score: ocrScore, weight: 0.20, weighted: (ocrScore * 0.20).toFixed(2) },
        registry: { score: registryScore, weight: 0.40, weighted: (registryScore * 0.40).toFixed(2) }
      },
      computed_at: new Date().toISOString()
    }
  };
}
