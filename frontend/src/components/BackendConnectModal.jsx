import React, { useState } from 'react';
import {
  Server, CheckCircle2, AlertTriangle, X, RefreshCw,
  ExternalLink, Globe, HardDrive, Zap, Info
} from 'lucide-react';
import { getApiBaseUrl, setCustomApiUrl } from '../config';
import { testBackendConnection, resetMockData } from '../apiService';

export default function BackendConnectModal({ isOpen, onClose, isLiveMode, onConnectionChange }) {
  const [urlInput, setUrlInput] = useState(getApiBaseUrl() || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testBackendConnection(urlInput);
    setTesting(false);
    setTestResult(result);
  };

  const handleSave = () => {
    setCustomApiUrl(urlInput);
    if (onConnectionChange) onConnectionChange();
    onClose();
  };

  const handleResetToDemo = () => {
    setUrlInput('');
    setCustomApiUrl('');
    resetMockData();
    if (onConnectionChange) onConnectionChange();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel-elevated" style={{
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '16px',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        padding: '28px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Server size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
                Backend API Connection
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Connect live Python FastAPI backend or run in Standalone Demo Mode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Status Pill */}
        <div style={{
          padding: '14px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          background: isLiveMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)',
          border: `1px solid ${isLiveMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {isLiveMode ? (
            <CheckCircle2 size={22} color="#10b981" />
          ) : (
            <Zap size={22} color="#38bdf8" />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: isLiveMode ? '#34d399' : '#38bdf8' }}>
              {isLiveMode ? 'Live Backend Connected' : 'Standalone / Benchmark Demo Mode Active'}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: '2px' }}>
              {isLiveMode
                ? `Streaming live inferences from ${getApiBaseUrl() || 'active server'}`
                : 'Full UI is 100% interactive using pre-computed SIH benchmark cases (Aarav, Rohan, Vikram).'}
            </div>
          </div>
        </div>

        {/* Backend URL Input Form */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
            Backend API Endpoint URL
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="e.g. https://satyapramaan-api.onrender.com or http://localhost:8000"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setTestResult(null);
              }}
              className="input-field"
              style={{ flex: 1, fontSize: '0.85rem' }}
            />
            <button
              onClick={handleTest}
              disabled={testing}
              className="btn-secondary"
              style={{ padding: '0 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {testing ? <RefreshCw size={14} className="spin" /> : <Globe size={14} />}
              Test Ping
            </button>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div style={{
              marginTop: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: testResult.success ? '#34d399' : '#fb7185',
              border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
            }}>
              {testResult.success ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Success! Backend is online and healthy ({JSON.stringify(testResult.data)})</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  <span>Connection failed: {testResult.error}. Verify backend URL and CORS.</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Quick Instructions / Info accordion */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '10px',
          padding: '14px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '20px',
          fontSize: '0.78rem',
          color: '#94a3b8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc', fontWeight: '600', marginBottom: '6px' }}>
            <Info size={15} color="#38bdf8" />
            Why did 404 occur on Vercel?
          </div>
          <p style={{ lineHeight: '1.5' }}>
            Vercel hosts the React frontend statically. The AI forensic engine (Python FastAPI, OpenCV, Tesseract OCR) requires a Python runtime.
            In <strong>Standalone Demo Mode</strong>, all features work with pre-loaded benchmark applications. To connect your live backend, deploy it to Render/Railway or start a local tunnel and paste the URL above.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={handleResetToDemo}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            Switch to Standalone Demo
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ fontSize: '0.82rem', padding: '8px 18px' }}
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}
