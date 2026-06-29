import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { ArrowLeft, Save, AlertTriangle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://synapse-ai-4dcd.onrender.com';

const SCOPES = [
  { id: 'global', label: 'Global', helper: 'General style, tone, and language. Applies to all personal AI features.' },
  { id: 'notebook', label: 'Notebook', helper: 'Applies to summaries, flashcards, and notebook Q&A.' },
  { id: 'planner', label: 'Study Planner', helper: 'Applies to dashboard schedules and custom PDF plans.' },
  { id: 'resourceExplorer', label: 'Resource Explorer', helper: 'Applies to roadmap generation and resource chat.' }
];

export default function MobileAIPersonalization() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({});
  const [updatedDates, setUpdatedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState({});

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/settings/ai-preferences`);
      
      const initialPrefs = {};
      const dates = {};
      SCOPES.forEach(s => {
        initialPrefs[s.id] = res.data[s.id]?.raw || '';
        dates[s.id] = res.data[s.id]?.updatedAt || null;
      });
      setPreferences(initialPrefs);
      setUpdatedDates(dates);
    } catch (err) {
      console.error('Failed to load AI preferences', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (scopeId, text) => {
    if (text.length > 1000) return;
    setPreferences(prev => ({ ...prev, [scopeId]: text }));
    if (savingStatus[scopeId] === 'saved') {
      setSavingStatus(prev => ({ ...prev, [scopeId]: '' }));
    }
  };

  const handleSave = async (scopeId) => {
    try {
      setSavingStatus(prev => ({ ...prev, [scopeId]: 'saving' }));
      
      const res = await api.put(`/settings/ai-preferences/${scopeId}`, {
        text: preferences[scopeId]
      });

      setSavingStatus(prev => ({ ...prev, [scopeId]: 'saved' }));
      setUpdatedDates(prev => ({ ...prev, [scopeId]: res.data.updatedAt }));
      
      setTimeout(() => {
        setSavingStatus(prev => {
          if (prev[scopeId] === 'saved') {
            return { ...prev, [scopeId]: '' };
          }
          return prev;
        });
      }, 3000);
    } catch (err) {
      console.error(`Failed to save ${scopeId} preferences`, err);
      setSavingStatus(prev => ({ ...prev, [scopeId]: 'error' }));
    }
  };

  const handleReset = async (scopeId) => {
    const scopeLabel = SCOPES.find(s => s.id === scopeId)?.label || scopeId;
    if (!window.confirm(`Reset ${scopeLabel} AI instructions to default?`)) {
      return;
    }
    
    try {
      setSavingStatus(prev => ({ ...prev, [scopeId]: 'saving' }));
      await api.delete(`/settings/ai-preferences/${scopeId}`);

      setPreferences(prev => ({ ...prev, [scopeId]: '' }));
      setUpdatedDates(prev => ({ ...prev, [scopeId]: null }));
      setSavingStatus(prev => ({ ...prev, [scopeId]: 'reset' }));
      
      setTimeout(() => {
        setSavingStatus(prev => {
          if (prev[scopeId] === 'reset') {
            return { ...prev, [scopeId]: '' };
          }
          return prev;
        });
      }, 3000);
    } catch (err) {
      console.error(`Failed to reset ${scopeId} preferences`, err);
      setSavingStatus(prev => ({ ...prev, [scopeId]: 'error' }));
    }
  };

  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      overflowY: 'auto',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '20px',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: 'var(--mobile-shadow-card)' }}>
          <ArrowLeft color="var(--mobile-text-primary)" size={20} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Custom AI Context</h1>
      </div>

      <p style={{ color: 'var(--mobile-text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
        Give the AI custom instructions on how to behave, what tone to use, or how to format responses. These layer on top of the base features.
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div style={{ color: 'var(--mobile-text-tertiary)', fontSize: '14px' }}>Loading preferences...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {SCOPES.map(scope => (
            <div key={scope.id} style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>{scope.label}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--mobile-text-secondary)' }}>{scope.helper}</p>
              </div>

              <div style={{ position: 'relative' }}>
                <textarea
                  value={preferences[scope.id] || ''}
                  onChange={(e) => handleTextChange(scope.id, e.target.value)}
                  placeholder="e.g. Speak like a pirate..."
                  style={{
                    width: '100%',
                    padding: '16px',
                    paddingBottom: '32px',
                    borderRadius: '16px',
                    border: '1px solid var(--mobile-border)',
                    background: 'var(--mobile-bg)',
                    color: 'var(--mobile-text-primary)',
                    fontSize: '14px',
                    minHeight: '120px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '11px', color: 'var(--mobile-text-tertiary)', fontWeight: 600 }}>
                  {(preferences[scope.id] || '').length}/1000
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px', gap: '8px' }}>
                <div style={{ flex: 1, minHeight: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {savingStatus[scope.id] === 'error' && (
                    <span style={{ color: 'var(--mobile-danger)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <AlertTriangle size={12} /> Failed to save
                    </span>
                  )}
                  {savingStatus[scope.id] === 'saved' && (
                    <span style={{ color: 'var(--mobile-success)', fontSize: '12px', fontWeight: 600 }}>
                      Saved successfully!
                    </span>
                  )}
                  {savingStatus[scope.id] === 'reset' && (
                    <span style={{ color: 'var(--mobile-text-secondary)', fontSize: '12px', fontWeight: 600 }}>
                      Reset to default.
                    </span>
                  )}
                  {savingStatus[scope.id] !== 'saved' && savingStatus[scope.id] !== 'reset' && savingStatus[scope.id] !== 'error' && updatedDates[scope.id] && (
                    <span style={{ color: 'var(--mobile-text-tertiary)', fontSize: '11px', fontWeight: 500 }}>
                      Updated: {new Date(updatedDates[scope.id]).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {preferences[scope.id] && preferences[scope.id].length > 0 && (
                    <button
                      onClick={() => handleReset(scope.id)}
                      disabled={savingStatus[scope.id] === 'saving'}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--mobile-danger-subtle)',
                        background: 'transparent',
                        color: 'var(--mobile-danger)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 700,
                        opacity: savingStatus[scope.id] === 'saving' ? 0.5 : 1
                      }}
                    >
                      <RotateCcw size={14} />
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => handleSave(scope.id)}
                    disabled={savingStatus[scope.id] === 'saving'}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'var(--mobile-primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 700,
                      opacity: savingStatus[scope.id] === 'saving' ? 0.7 : 1
                    }}
                  >
                    <Save size={14} />
                    {savingStatus[scope.id] === 'saving' ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
