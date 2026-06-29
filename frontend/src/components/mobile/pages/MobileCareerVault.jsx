import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Plus, FileText, Award, Briefcase, FolderGit2, Trophy, FlaskConical } from 'lucide-react';
import api from '../../../services/api';
import CareerDocUploadModal from '../../../pages/career/CareerDocUploadModal.jsx';

export default function MobileCareerVault() {
  const navigate = useNavigate();
  
  // Auth state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [setupRequired, setSetupRequired] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Vault state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await api.post('/career-vault/verify-access', {});
        // If it succeeds with no password, either it doesn't require password or session is already active
        // But backend usually throws 401 if locked.
        if (res.data.vaultSetupRequired) {
          setSetupRequired(true);
        } else {
          setSetupRequired(false);
          setIsUnlocked(true); // Maybe already unlocked
        }
      } catch (err) {
        if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
          setSetupRequired(false);
        } else {
          setSetupRequired(false);
        }
      }
    };
    checkSetup();
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      fetchDocuments();
    }
  }, [isUnlocked]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.get('/career-vault');
      setDocuments(res.data.documents || res.data || []);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsUnlocked(false);
      }
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (setupRequired && password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    setAuthLoading(true);
    try {
      if (setupRequired) {
        await api.post('/career-vault/setup-password', { password, confirmPassword });
      } else {
        await api.post('/career-vault/verify-access', { password });
      }
      localStorage.setItem('vaultUnlocked', 'true');
      setIsUnlocked(true);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Verification failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'certification': return <Award size={20} color="var(--mobile-primary)" />;
      case 'internship': return <Briefcase size={20} color="var(--mobile-secondary)" />;
      case 'project': return <FolderGit2 size={20} color="var(--mobile-success)" />;
      case 'research': return <FlaskConical size={20} color="var(--mobile-warning)" />;
      case 'achievement': return <Trophy size={20} color="var(--mobile-danger)" />;
      default: return <FileText size={20} color="var(--mobile-text-tertiary)" />;
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'certification': return 'Certification';
      case 'internship': return 'Internship';
      case 'project': return 'Project';
      case 'research': return 'Research';
      case 'achievement': return 'Achievement';
      default: return cat || 'Document';
    }
  };

  // SCREEN A: Vault Access Gate
  if (!isUnlocked) {
    return (
      <div className="mobile-shell" style={{
        height: '100dvh',
        background: 'var(--mobile-bg)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
            <ArrowLeft color="var(--mobile-text-primary)" size={20} />
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px 40px', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(124, 111, 240, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Lock size={32} color="var(--mobile-secondary)" />
          </div>
          
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', marginBottom: '8px', textAlign: 'center' }}>
            {setupRequired ? 'Setup Career Vault' : 'Career Vault'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mobile-text-secondary)', textAlign: 'center', marginBottom: '32px', padding: '0 20px' }}>
            {setupRequired ? 'Create a secure password to protect your career documents.' : 'Enter your vault password to securely access your documents.'}
          </p>

          <form onSubmit={handleUnlock} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Vault Password"
              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--mobile-surface)', fontSize: '15px', color: 'var(--mobile-text-primary)', textAlign: 'center', letterSpacing: '2px', boxShadow: 'var(--mobile-shadow-card)' }}
            />
            {setupRequired && (
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--mobile-surface)', fontSize: '15px', color: 'var(--mobile-text-primary)', textAlign: 'center', letterSpacing: '2px', boxShadow: 'var(--mobile-shadow-card)' }}
              />
            )}

            {authError && <div style={{ color: 'var(--mobile-danger)', fontSize: '13px', textAlign: 'center' }}>{authError}</div>}

            <button 
              type="submit"
              disabled={authLoading || !password}
              style={{ width: '100%', padding: '16px', borderRadius: '18px', background: 'var(--mobile-secondary)', color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none', boxShadow: '0px 6px 16px rgba(124, 111, 240, 0.35)', marginTop: '8px', opacity: (authLoading || !password) ? 0.7 : 1 }}
            >
              {authLoading ? 'Verifying...' : (setupRequired ? 'Set Password' : 'Unlock Vault')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // SCREEN B: Vault Document List
  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      overflowY: 'auto',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '20px',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          Career Vault
          <button onClick={() => setIsUnlocked(false)} style={{ background: 'none', border: 'none', padding: 0 }}>
            <Lock size={20} color="var(--mobile-secondary)" />
          </button>
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--mobile-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0px 6px 16px rgba(124, 111, 240, 0.35)' }}
        >
          <Plus color="#fff" size={24} />
        </button>
      </div>

      {/* DOCUMENTS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loadingDocs ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '20px' }}>Loading...</div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FileText size={48} color="var(--mobile-border)" style={{ marginBottom: '16px' }} />
            <div>No documents in your vault.</div>
          </div>
        ) : (
          documents.map(doc => (
            <div 
              key={doc._id}
              onClick={() => navigate(`/career/${doc._id}`)}
              style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', gap: '16px' }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--mobile-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {getCategoryIcon(doc.category)}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mobile-text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                  {doc.title || 'Untitled Document'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '999px', background: 'var(--mobile-border)', fontSize: '11px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>
                    {getCategoryLabel(doc.category)}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--mobile-text-tertiary)' }}>
                    {doc.dateEarned ? new Date(doc.dateEarned).getFullYear() : ''}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <CareerDocUploadModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(msg) => {
            setIsModalOpen(false);
            if (msg) showToast(msg);
            fetchDocuments();
          }}
          onError={(err) => {
            if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
              setIsUnlocked(false);
              setIsModalOpen(false);
            }
          }}
        />
      )}

      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', background: 'var(--mobile-text-primary)', color: 'var(--mobile-bg)', padding: '12px 24px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--mobile-success)' }} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
