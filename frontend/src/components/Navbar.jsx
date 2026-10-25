import React from 'react';
import { ShieldCheck, UserCheck, LayoutDashboard, Database, Activity, Server, Settings } from 'lucide-react';
import { getApiBaseUrl } from '../config';

export default function Navbar({ activeTab, setActiveTab, backendOnline, onOpenBackendSettings }) {
  const activeBaseUrl = getApiBaseUrl();

  return (
    <header style={{
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Logo & System Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
          }}>
            <ShieldCheck size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>
                SatyaPramaan <span style={{ color: '#38bdf8' }}>AI</span>
              </h1>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontSize: '0.68rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                SIH26261
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              AI-Powered Application Validation & Document Authentication
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <nav style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.9)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('applicant')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'applicant' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeTab === 'applicant' ? '#ffffff' : '#94a3b8'
            }}
          >
            <UserCheck size={16} />
            Applicant Portal
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'admin' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeTab === 'admin' ? '#ffffff' : '#94a3b8'
            }}
          >
            <LayoutDashboard size={16} />
            Admin Review Dashboard
          </button>

          <button
            onClick={() => setActiveTab('registry')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'registry' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeTab === 'registry' ? '#ffffff' : '#94a3b8'
            }}
          >
            <Database size={16} />
            Mock DigiLocker/APAAR
          </button>
        </nav>

        {/* Backend Status indicator & Configuration button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onOpenBackendSettings}
            title="Click to view/change Backend API connection"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              padding: '6px 12px',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: backendOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)',
              color: backendOnline ? '#34d399' : '#38bdf8',
              border: `1px solid ${backendOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: backendOnline ? '#10b981' : '#38bdf8',
              boxShadow: backendOnline ? '0 0 8px #10b981' : '0 0 8px #38bdf8'
            }} />
            <Activity size={13} />
            {backendOnline ? 'Live Backend Connected' : 'Demo Mode (Click to Connect API)'}
            <Settings size={12} style={{ marginLeft: '4px', opacity: 0.7 }} />
          </button>
        </div>
      </div>
    </header>
  );
}
