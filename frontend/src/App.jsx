import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ApplicantPortal from './components/ApplicantPortal';
import AdminDashboard from './components/AdminDashboard';
import RegistryExplorer from './components/RegistryExplorer';

export default function App() {
  const [activeTab, setActiveTab] = useState('admin'); // default to admin view to showcase the side-by-side comparison
  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/v1/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
        setBackendOnline(true);
        if (!selectedAppId && data.length > 0) {
          setSelectedAppId(data[0].id);
        }
      } else {
        setBackendOnline(false);
      }
    } catch (err) {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 5000);
    return () => clearInterval(interval);
  }, []);

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
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'applicant' && (
          <ApplicantPortal
            onSelectApplicationForReview={handleSelectApplicationForReview}
            refreshGlobalData={fetchApplications}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            applications={applications}
            selectedAppId={selectedAppId}
            setSelectedAppId={setSelectedAppId}
            refreshData={fetchApplications}
          />
        )}

        {activeTab === 'registry' && (
          <RegistryExplorer />
        )}
      </main>

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
