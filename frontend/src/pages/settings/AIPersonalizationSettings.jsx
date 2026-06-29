import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Save, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'https://synapse-ai-4dcd.onrender.com';

const SCOPES = [
  { id: 'global', label: 'Global', helper: 'General style, tone, and language. Applies to all personal AI features.' },
  { id: 'notebook', label: 'Notebook', helper: 'Applies to summaries, flashcards, and notebook Q&A.' },
  { id: 'planner', label: 'Study Planner', helper: 'Applies to dashboard schedules and custom PDF plans.' },
  { id: 'resourceExplorer', label: 'Resource Explorer', helper: 'Applies to roadmap generation and resource chat.' }
];

export default function AIPersonalizationSettings() {
  const [preferences, setPreferences] = useState({});
  const [updatedDates, setUpdatedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState({}); // { scopeId: 'saving' | 'saved' | 'error' }

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
    if (!window.confirm(`Are you sure you want to reset the ${scopeLabel} AI instructions to default?`)) {
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

  if (loading) {
    return <div className="animate-pulse flex flex-col gap-6"><div className="h-40 bg-surface-sunken rounded-xl"></div></div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-text-primary">Customize AI Behavior</h2>
      <p className="text-text-secondary mb-8 text-sm">
        Give the AI custom instructions on how to behave, what tone to use, or how to format responses. 
        These layer on top of the base features and do not affect the public Study Group AI bots.
      </p>

      <div className="space-y-8">
        {SCOPES.map(scope => (
          <div key={scope.id} className="bg-surface-sunken border border-surface-border rounded-xl p-5">
            <div className="mb-3">
              <label className="block text-base font-semibold text-text-primary">
                {scope.label}
              </label>
              <p className="text-sm text-text-secondary mt-1">
                {scope.helper}
              </p>
            </div>
            
            <div className="relative">
              <textarea
                value={preferences[scope.id] || ''}
                onChange={(e) => handleTextChange(scope.id, e.target.value)}
                placeholder="e.g. Speak like a pirate..."
                className="w-full px-4 py-3 rounded-lg border border-surface-border bg-surface-base text-text-primary focus:ring-2 focus:ring-brand-primary min-h-[100px] resize-y"
              />
              <div className="absolute bottom-3 right-3 text-xs text-text-tertiary font-medium">
                {(preferences[scope.id] || '').length}/1000
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                {savingStatus[scope.id] === 'error' && (
                  <span className="text-status-danger text-sm flex items-center gap-1 font-medium">
                    <AlertTriangle size={14} /> Failed to save
                  </span>
                )}
                {savingStatus[scope.id] === 'saved' && (
                  <span className="text-status-success text-sm font-medium">
                    Saved successfully!
                  </span>
                )}
                {savingStatus[scope.id] === 'reset' && (
                  <span className="text-text-secondary text-sm font-medium">
                    Reset to default.
                  </span>
                )}
                {savingStatus[scope.id] !== 'saved' && savingStatus[scope.id] !== 'reset' && savingStatus[scope.id] !== 'error' && updatedDates[scope.id] && (
                  <span className="text-text-tertiary text-xs font-medium">
                    Last updated: {new Date(updatedDates[scope.id]).toLocaleDateString()} {new Date(updatedDates[scope.id]).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {preferences[scope.id] && preferences[scope.id].length > 0 && (
                  <Button
                    variant="outline"
                    tone="danger"
                    onClick={() => handleReset(scope.id)}
                    disabled={savingStatus[scope.id] === 'saving'}
                    className="disabled:opacity-50"
                  >
                    <RotateCcw size={16} className="mr-2" />
                    Reset
                  </Button>
                )}
                <Button 
                  variant="primary"
                  onClick={() => handleSave(scope.id)}
                  disabled={savingStatus[scope.id] === 'saving'}
                  className="disabled:opacity-50"
                >
                  <Save size={16} className="mr-2" /> 
                  {savingStatus[scope.id] === 'saving' ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
