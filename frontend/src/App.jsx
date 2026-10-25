import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import ApplicantPortal from './components/ApplicantPortal';
import AdminDashboard from './components/AdminDashboard';
import RegistryExplorer from './components/RegistryExplorer';
import BackendConnectModal from './components/BackendConnectModal';
import { fetchApplications as apiFetchApplications } from './apiService';

export default function App() {
  const [activeTab, setActiveTab] = useState('admin'); // default to admin view to showcase the side-by-side comparison
  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadApplications = useCallback(async () => {
    const { data, isLive } = await apiFetchApplications();
    setApplications(data);
    setBackendOnline(isLive);
    if (data && data.length > 0) {
      setSelectedAppId(prev => {
        if (!prev) return data[0].id;
        const exists = data.some(a => a.id === prev);
        return exists ? prev : data[0].id;
      });
    }
  }, []);

  useEffect(() => {
    loadApplications();
    // Poll gently every 10 seconds without aggressive error logs
    const interval = setInterval(loadApplications, 10000);
    return () => clearInterval(interval);
  }, [loadApplications]);

  const handleSelectApplicationForReview = (appId) => {
    setSelectedAppId(appId);
    setActiveTab('admin');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendOnline={backendOnline}
        onOpenBackendSettings={() => setIsSettingsOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'applicant' && (
          <ApplicantPortal
            onSelectApplicationForReview={handleSelectApplicationForReview}
            refreshGlobalData={loadApplications}
            isLiveMode={backendOnline}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            applications={applications}
            selectedAppId={selectedAppId}
            setSelectedAppId={setSelectedAppId}
            refreshData={loadApplications}
            isLiveMode={backendOnline}
          />
        )}

        {activeTab === 'registry' && (
          <RegistryExplorer isLiveMode={backendOnline} />
        )}
      </main>

      <BackendConnectModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isLiveMode={backendOnline}
        onConnectionChange={loadApplications}
      />

      <footer style={{
        textAlign: 'center',
        padding: '24px',
        color: '#64748b',
        fontSize: '0.8rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        marginTop: '40px'
      }}>
        Smart India Hackathon SIH26261 Prototype &bull; SatyaPramaan AI Multi-Modal Document Authentication Engine
      </footer>
    </div>
  );
}
