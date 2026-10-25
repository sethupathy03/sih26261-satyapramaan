import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, CheckCircle2, AlertOctagon, Search } from 'lucide-react';
import { fetchRegistryRecords } from '../apiService';

export default function RegistryExplorer({ isLiveMode = false }) {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchRegistryRecords(isLiveMode).then(({ data }) => {
      if (active) {
        setRecords(data || []);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [isLiveMode]);

  const filtered = records.filter(r =>
    r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.identifier?.toLowerCase().includes(search.toLowerCase()) ||
    r.institution?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={26} color="#38bdf8" />
            Authoritative Registry Simulator (DigiLocker & APAAR)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px' }}>
            Mock authoritative repositories simulating Indian Government UIDAI (Aadhaar), Income Tax (PAN), and APAAR Academic Bank of Credits.
          </p>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search by name or identifier..."
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '32px' }}
          />
        </div>
      </div>

      <div className="glass-panel-elevated" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading registry records...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#64748b' }}>
                <th style={{ padding: '10px 12px' }}>REGISTRY TYPE</th>
                <th style={{ padding: '10px 12px' }}>IDENTIFIER (ROLL/UID)</th>
                <th style={{ padding: '10px 12px' }}>AUTHORITATIVE NAME</th>
                <th style={{ padding: '10px 12px' }}>INSTITUTION / BOARD</th>
                <th style={{ padding: '10px 12px' }}>DEGREE / CREDENTIAL</th>
                <th style={{ padding: '10px 12px' }}>GRADE / CGPA</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: '700', color: '#38bdf8' }}>
                    {rec.registry_type}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#f8fafc' }}>
                    {rec.identifier}
                  </td>
                  <td style={{ padding: '12px', color: '#f8fafc', fontWeight: '600' }}>
                    {rec.full_name}
                  </td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>
                    {rec.institution}
                  </td>
                  <td style={{ padding: '12px', color: '#cbd5e1' }}>
                    {rec.degree}
                  </td>
                  <td style={{ padding: '12px', color: '#f8fafc' }}>
                    {rec.grade_percentage}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {rec.is_revoked ? (
                      <span className="badge-high-risk">
                        <AlertOctagon size={13} /> REVOKED
                      </span>
                    ) : (
                      <span className="badge-low-risk">
                        <CheckCircle2 size={13} /> VERIFIED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
