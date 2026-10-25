import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  Sliders, Eye, Stamp, PenTool, Check, FileText, UserCheck,
  Clock, Hash, ArrowUpRight, Search, RefreshCw
} from 'lucide-react';
import { getImageUrl } from '../config';
import { submitReviewDecision } from '../apiService';

export default function AdminDashboard({ applications = [], selectedAppId, setSelectedAppId, refreshData, isLiveMode = false }) {
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);

  // Visual Inspector controls
  const [inspectorMode, setInspectorMode] = useState('split'); // 'original', 'ela', 'split'
  const [blendOpacity, setBlendOpacity] = useState(50); // for cross-fade blend
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Active selected application object
  const activeApp = applications.find(a => a.id === selectedAppId) || applications[0] || null;
  const activeDoc = activeApp && activeApp.documents && activeApp.documents.length > 0
    ? activeApp.documents[selectedDocIndex] || activeApp.documents[0]
    : null;

  // Filter list
  const filteredApps = applications.filter(app => {
    const matchesRisk = filterRisk === 'ALL' || app.risk_level === filterRisk;
    const matchesSearch = app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.applicant_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  // Calculate metrics
  const totalCount = applications.length;
  const lowRiskCount = applications.filter(a => a.risk_level === 'LOW').length;
  const medRiskCount = applications.filter(a => a.risk_level === 'MEDIUM').length;
  const highRiskCount = applications.filter(a => a.risk_level === 'HIGH').length;

  const handleAdminDecision = async (decision) => {
    if (!activeApp) return;
    setActionLoading(true);
    try {
      await submitReviewDecision(
        activeApp.id,
        decision,
        officerRemarks || `Officer reviewed and marked as ${decision}.`,
        'Lead_Scrutiny_Officer',
        isLiveMode
      );
      setOfficerRemarks('');
      if (refreshData) refreshData();
    } catch (err) {
      alert(`Error submitting decision: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '24px auto', padding: '0 24px' }}>
      {/* Top High-Level Metrics KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Applications
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Autonomous OCR & Forensic pipeline
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Low Risk (Auto-Approved)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>
            {lowRiskCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Trust Score &ge; 85% + Clean Forensics
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Medium Risk (Manual Review)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fbbf24', marginTop: '4px' }}>
            {medRiskCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Minor field / seal discrepancies
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ fontSize: '0.8rem', color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            High Risk (Tamper / Rejected)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fb7185', marginTop: '4px' }}>
            {highRiskCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Photoshop EXIF, ELA splicing, or fake ID
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Queue + Right Side-by-Side Reviewer */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Application Queue */}
        <div className="glass-panel-elevated" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Review Queue</h3>
            <button
              onClick={refreshData}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              title="Refresh queue"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search candidate name..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '0.84rem' }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterRisk(tier)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid',
                  cursor: 'pointer',
                  borderColor: filterRisk === tier ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                  backgroundColor: filterRisk === tier ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: filterRisk === tier ? '#38bdf8' : '#94a3b8'
                }}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* Application List */}
          <div style={{ display: 'grid', gap: '8px', maxHeight: '680px', overflowY: 'auto' }}>
            {filteredApps.map((app) => {
              const isSelected = activeApp && activeApp.id === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedAppId(app.id);
                    setSelectedDocIndex(0);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.92rem', color: '#f8fafc' }}>
                      {app.applicant_name}
                    </span>
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      color: app.risk_level === 'LOW' ? '#34d399' : app.risk_level === 'MEDIUM' ? '#fbbf24' : '#fb7185'
                    }}>
                      {app.trust_score}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {app.documents?.[0]?.doc_type || 'DOCUMENT'}
                    </span>
                    <span className={
                      app.risk_level === 'LOW' ? 'badge-low-risk' : app.risk_level === 'MEDIUM' ? 'badge-med-risk' : 'badge-high-risk'
                    } style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                      {app.risk_level}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Interactive Side-by-Side Reviewer */}
        {activeApp && activeDoc ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Top Bar of Active Candidate */}
            <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc' }}>
                    {activeApp.applicant_name}
                  </h2>
                  <span className={
                    activeApp.risk_level === 'LOW' ? 'badge-low-risk' : activeApp.risk_level === 'MEDIUM' ? 'badge-med-risk' : 'badge-high-risk'
                  }>
                    {activeApp.risk_level} RISK — {activeApp.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                  <span>Email: {activeApp.applicant_email}</span>
                  <span>•</span>
                  <span>Phone: {activeApp.applicant_phone || 'N/A'}</span>
                  <span>•</span>
                  <span>Doc ID: {activeDoc.id.slice(0, 8)}...</span>
                </div>
              </div>

              {/* Document Tabs */}
              {activeApp.documents.length > 1 && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {activeApp.documents.map((d, idx) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDocIndex(idx)}
                      className={selectedDocIndex === idx ? 'btn-primary' : 'btn-secondary'}
                      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    >
                      {d.doc_type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Split Screen Workspace: Document Viewer (Left) + Data/Trust Matrix (Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
              {/* Left Box: Forensic Visual Inspector */}
              <div className="glass-panel-elevated" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={16} color="#38bdf8" />
                    Forensic Visual Anomaly Inspector
                  </h3>

                  {/* Mode switcher */}
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(15,23,42,0.8)', padding: '3px', borderRadius: '8px' }}>
                    <button
                      onClick={() => setInspectorMode('original')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: inspectorMode === 'original' ? '#0284c7' : 'transparent',
                        color: '#fff'
                      }}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setInspectorMode('ela')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: inspectorMode === 'ela' ? '#0284c7' : 'transparent',
                        color: '#fff'
                      }}
                    >
                      ELA Heatmap
                    </button>
                    <button
                      onClick={() => setInspectorMode('split')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: inspectorMode === 'split' ? '#0284c7' : 'transparent',
                        color: '#fff'
                      }}
                    >
                      Cross-Fade Blend
                    </button>
                  </div>
                </div>

                {/* Visual Canvas Display */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '340px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#020617',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {inspectorMode === 'original' && (
                    <img
                      src={getImageUrl(activeDoc.file_url)}
                      alt="Original Document"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )}

                  {inspectorMode === 'ela' && (
                    <img
                      src={getImageUrl(activeDoc.forensic_report?.ela_heatmap_url || activeDoc.file_url)}
                      alt="ELA Heatmap"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )}

                  {inspectorMode === 'split' && (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {/* Base Original */}
                      <img
                        src={getImageUrl(activeDoc.file_url)}
                        alt="Original"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      {/* Overlay Heatmap with adjustable opacity */}
                      <img
                        src={getImageUrl(activeDoc.forensic_report?.ela_heatmap_url || activeDoc.file_url)}
                        alt="ELA Heatmap Overlay"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          opacity: blendOpacity / 100.0,
                          mixBlendMode: 'screen',
                          transition: 'opacity 0.1s linear'
                        }}
                      />
                    </div>
                  )}

                  {/* Tamper Anomaly Indicator overlay if high risk */}
                  {activeDoc.is_tampered && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(220, 38, 38, 0.85)',
                      backdropFilter: 'blur(8px)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <ShieldAlert size={14} />
                      TAMPER ARTIFACT HIGHLIGHTED
                    </div>
                  )}
                </div>

                {/* Blend Slider when in cross-fade mode */}
                {inspectorMode === 'split' && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      ELA Overlay Opacity:
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={blendOpacity}
                      onChange={(e) => setBlendOpacity(Number(e.target.value))}
                      style={{ flex: 1, accentColor: '#38bdf8' }}
                    />
                    <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '700', width: '35px' }}>
                      {blendOpacity}%
                    </span>
                  </div>
                )}

                {/* Forensic Signals Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                  <div style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: activeDoc.forensic_report?.stamp_seal_detected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    border: `1px solid ${activeDoc.forensic_report?.stamp_seal_detected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Stamp size={18} color={activeDoc.forensic_report?.stamp_seal_detected ? '#34d399' : '#64748b'} />
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '700', color: activeDoc.forensic_report?.stamp_seal_detected ? '#34d399' : '#94a3b8' }}>
                        {activeDoc.forensic_report?.stamp_seal_detected ? 'Official Seal Verified' : 'No Official Seal'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Confidence: {activeDoc.forensic_report?.stamp_seal_confidence || 0}%
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: activeDoc.forensic_report?.signature_detected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    border: `1px solid ${activeDoc.forensic_report?.signature_detected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <PenTool size={18} color={activeDoc.forensic_report?.signature_detected ? '#34d399' : '#64748b'} />
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '700', color: activeDoc.forensic_report?.signature_detected ? '#34d399' : '#94a3b8' }}>
                        {activeDoc.forensic_report?.signature_detected ? 'Signature Stroke Found' : 'No Signature'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Confidence: {activeDoc.forensic_report?.signature_confidence || 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tamper Flags Breakdown */}
                {activeDoc.forensic_report?.anomaly_flags?.length > 0 && (
                  <div style={{ marginTop: '14px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fb7185', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={15} />
                      Identified Tamper & Forgery Flags:
                    </div>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.75rem', color: '#fecdd3' }}>
                      {activeDoc.forensic_report.anomaly_flags.map((flg, i) => (
                        <li key={i}>{flg}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Box: Extracted Data Table vs DigiLocker/APAAR Registry */}
              <div className="glass-panel-elevated" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="#38bdf8" />
                  OCR Extracted Data vs Authoritative Registry
                </h3>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#64748b' }}>
                      <th style={{ padding: '8px 6px' }}>FIELD</th>
                      <th style={{ padding: '8px 6px' }}>EXTRACTED (OCR)</th>
                      <th style={{ padding: '8px 6px' }}>REGISTRY (GOVT)</th>
                      <th style={{ padding: '8px 6px', textAlign: 'center' }}>MATCH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDoc.extracted_fields?.map((field) => {
                      const regRecord = activeDoc.registry_verifications?.[0]?.registry_record_preview;
                      let registryVal = '—';
                      let isMatch = field.is_matched;

                      if (regRecord) {
                        if (field.field_name === 'APPLICANT_NAME') registryVal = regRecord.full_name || '—';
                        else if (field.field_name === 'ROLL_NUMBER') registryVal = regRecord.roll_number || '—';
                        else if (field.field_name === 'CGPA_OR_MARKS') registryVal = regRecord.grade_percentage || '—';
                        else if (field.field_name === 'INSTITUTION') registryVal = regRecord.institution || '—';
                      }

                      return (
                        <tr key={field.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '10px 6px', fontWeight: '600', color: '#94a3b8' }}>
                            {field.field_name.replace(/_/g, ' ')}
                          </td>
                          <td style={{ padding: '10px 6px', color: '#f8fafc' }}>
                            {field.field_value}
                            <span style={{ fontSize: '0.68rem', color: '#64748b', marginLeft: '4px' }}>
                              ({Math.round(field.confidence)}%)
                            </span>
                          </td>
                          <td style={{ padding: '10px 6px', color: registryVal !== '—' ? '#38bdf8' : '#64748b' }}>
                            {registryVal}
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                            {isMatch ? (
                              <CheckCircle2 size={16} color="#10b981" />
                            ) : (
                              <XCircle size={16} color="#f43f5e" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Trust Score & Decision Console */}
                <div style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#94a3b8' }}>
                      AUTOMATED TRUST SCORE MATRIX
                    </span>
                    <span style={{
                      fontSize: '1.4rem',
                      fontWeight: '900',
                      color: activeApp.risk_level === 'LOW' ? '#34d399' : activeApp.risk_level === 'MEDIUM' ? '#fbbf24' : '#fb7185'
                    }}>
                      {activeApp.trust_score} / 100
                    </span>
                  </div>

                  {/* Sub-scores Progress bars */}
                  <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                        <span>Forensic Integrity (40% Weight)</span>
                        <span>{activeDoc.forensic_report?.forensic_score || 0}%</span>
                      </div>
                      <div style={{ height: '5px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${activeDoc.forensic_report?.forensic_score || 0}%`, height: '100%', backgroundColor: '#0284c7' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                        <span>Registry Cross-Match (40% Weight)</span>
                        <span>{activeDoc.registry_verifications?.[0]?.match_score || 0}%</span>
                      </div>
                      <div style={{ height: '5px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${activeDoc.registry_verifications?.[0]?.match_score || 0}%`, height: '100%', backgroundColor: '#10b981' }} />
                      </div>
                    </div>
                  </div>

                  {/* Officer Action Bar */}
                  <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                      Audit Remarks / Officer Notes:
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Add official audit verification notes..."
                      value={officerRemarks}
                      onChange={(e) => setOfficerRemarks(e.target.value)}
                      style={{ fontSize: '0.82rem', marginBottom: '12px' }}
                    />

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleAdminDecision('APPROVED')}
                        disabled={actionLoading}
                        className="btn-approve"
                        style={{ flex: 1, fontSize: '0.85rem' }}
                      >
                        <Check size={16} />
                        Approve Candidate
                      </button>

                      <button
                        onClick={() => handleAdminDecision('REJECTED')}
                        disabled={actionLoading}
                        className="btn-reject"
                        style={{ flex: 1, fontSize: '0.85rem' }}
                      >
                        <XCircle size={16} />
                        Reject Application
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Audit Trail Timeline */}
            <div className="glass-panel" style={{ padding: '18px 24px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#94a3b8', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#38bdf8" />
                IMMUTABLE AUDIT LOG & VERIFICATION TIMELINE
              </h4>

              <div style={{ display: 'grid', gap: '8px' }}>
                {activeApp.audit_trails?.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        fontWeight: '700',
                        fontSize: '0.7rem'
                      }}>
                        {log.action}
                      </span>
                      <span style={{ color: '#f8fafc' }}>{log.details}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b' }}>
                      <span>By: <strong style={{ color: '#94a3b8' }}>{log.performed_by}</strong></span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Select an application from the review queue to inspect documents and verification logs.
          </div>
        )}
      </div>
    </div>
  );
}
