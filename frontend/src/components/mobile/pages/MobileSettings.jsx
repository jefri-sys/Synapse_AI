import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Key, Bell, Palette, Sparkles, ChevronRight, LogOut, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';


export default function MobileSettings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetData = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post(`/users/reset-data`, { password: confirmPassword });
      alert('All Synapse data reset successfully.');
      setShowResetModal(false);
      setConfirmPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error resetting data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.delete(`/users/account`, { data: { password: confirmPassword } });
      window.location.href = '/login';
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting account');
      setLoading(false);
    }
  };

  const handleNavigation = (tabName) => {
    const tabMap = {
      'Edit Profile': 'profile',
      'Change Password': 'security',
      'Notifications': 'notifications',
      'Appearance': 'appearance'
    };
    if (tabName === 'Custom AI Context') {
      navigate('/ai-settings-mobile');
    } else if (tabMap[tabName]) {
      navigate('/settings', { state: { activeTab: tabMap[tabName] } });
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
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: 'var(--mobile-shadow-card)' }}>
          <ArrowLeft color="var(--mobile-text-primary)" size={20} />
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* GROUP 1: PROFILE */}
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mobile-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginLeft: '12px' }}>Account</h2>
          <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '8px', boxShadow: 'var(--mobile-shadow-card)' }}>
            
            <div onClick={() => handleNavigation('Edit Profile')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--mobile-border)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--mobile-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} color="var(--mobile-primary)" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>Edit Profile</span>
              </div>
              <ChevronRight size={20} color="var(--mobile-text-tertiary)" />
            </div>

            <div onClick={() => handleNavigation('Change Password')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--mobile-secondary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={18} color="var(--mobile-secondary)" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>Change Password</span>
              </div>
              <ChevronRight size={20} color="var(--mobile-text-tertiary)" />
            </div>

          </div>
        </div>

        {/* GROUP 2: PREFERENCES */}
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mobile-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginLeft: '12px' }}>Preferences</h2>
          <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '8px', boxShadow: 'var(--mobile-shadow-card)' }}>
            
            <div onClick={() => handleNavigation('Notifications')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--mobile-border)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--mobile-warning-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={18} color="var(--mobile-warning)" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>Notifications</span>
              </div>
              <ChevronRight size={20} color="var(--mobile-text-tertiary)" />
            </div>

            <div onClick={() => handleNavigation('Appearance')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--mobile-border)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--mobile-success-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Palette size={18} color="var(--mobile-success)" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>Appearance</span>
              </div>
              <ChevronRight size={20} color="var(--mobile-text-tertiary)" />
            </div>

            <div onClick={() => setShowResetModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--mobile-border)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--mobile-danger-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} color="var(--mobile-danger)" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>Reset Synapse Data</span>
              </div>
              <ChevronRight size={20} color="var(--mobile-text-tertiary)" />
            </div>

            <div onClick={() => setShowDeleteModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--mobile-danger-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={18} color="var(--mobile-danger)" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>Delete Account</span>
              </div>
              <ChevronRight size={20} color="var(--mobile-text-tertiary)" />
            </div>

          </div>
        </div>

        {/* GROUP 3: AI PERSONALIZATION */}
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mobile-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginLeft: '12px' }}>AI Personalization</h2>
          <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '8px', boxShadow: 'var(--mobile-shadow-card)' }}>
            
            <div onClick={() => handleNavigation('Custom AI Context')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--mobile-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="var(--mobile-primary)" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>Custom AI Context</span>
              </div>
              <ChevronRight size={20} color="var(--mobile-text-tertiary)" />
            </div>

          </div>
        </div>

        {/* LOGOUT */}
        <button 
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'var(--mobile-danger-subtle)', color: 'var(--mobile-danger)', border: 'none', borderRadius: '24px', padding: '16px', fontSize: '15px', fontWeight: 700, marginTop: '8px' }}
        >
          <LogOut size={20} />
          Log Out
        </button>

      </div>

      {/* RESET DATA SHEET */}
      {showResetModal && (
        <>
          <div onClick={() => !loading && setShowResetModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--mobile-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', zIndex: 1001, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'var(--mobile-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle color="var(--mobile-danger)" /> Reset Data
              </h3>
              <button disabled={loading} onClick={() => setShowResetModal(false)} style={{ background: 'none', border: 'none', color: 'var(--mobile-text-secondary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p style={{ color: 'var(--mobile-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              This will permanently delete all your planners, notebooks, groups, and tasks. Enter your password to confirm.
            </p>
            <form onSubmit={handleResetData} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="password" required placeholder="Enter password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', color: 'var(--mobile-text-primary)' }}
              />
              <button 
                type="submit" disabled={loading || !confirmPassword}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--mobile-danger)', color: '#fff', fontWeight: 'bold', border: 'none', opacity: (loading || !confirmPassword) ? 0.7 : 1 }}
              >
                {loading ? 'Resetting...' : 'Confirm Reset Data'}
              </button>
            </form>
          </div>
        </>
      )}

      {/* DELETE ACCOUNT SHEET */}
      {showDeleteModal && (
        <>
          <div onClick={() => !loading && setShowDeleteModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--mobile-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', zIndex: 1001, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'var(--mobile-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 color="var(--mobile-danger)" /> Delete Account
              </h3>
              <button disabled={loading} onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', color: 'var(--mobile-text-secondary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p style={{ color: 'var(--mobile-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              This will permanently delete your account and all associated data. This action cannot be undone. Enter your password to confirm.
            </p>
            <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="password" required placeholder="Enter password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', color: 'var(--mobile-text-primary)' }}
              />
              <button 
                type="submit" disabled={loading || !confirmPassword}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--mobile-danger)', color: '#fff', fontWeight: 'bold', border: 'none', opacity: (loading || !confirmPassword) ? 0.7 : 1 }}
              >
                {loading ? 'Deleting...' : 'Confirm Delete Account'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
