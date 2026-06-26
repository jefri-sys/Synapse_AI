import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import api from '../../services/api.js';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';

export default function ResetVaultPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <AuthLayout title="Invalid Link" subtitle="No reset token provided.">
        <div className="text-center">
          <Link to="/login" className="text-brand-primary font-bold hover:text-brand-primary-hover">Return to Login</Link>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setSubmitting(true);
    try {
      await api.post('/career-vault/reset-vault-password', {
        token,
        newPassword,
        confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password Reset" subtitle="Your Vault password has been updated.">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-status-success-subtle text-status-success mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <p className="text-text-secondary mb-8">You can now access your Career Vault using your new password.</p>
          <Link to="/career" className="inline-flex items-center justify-center w-full bg-brand-primary text-white font-bold py-3 rounded-xl hover:bg-brand-primary-hover transition-colors">
            Go to Career Vault <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Vault Password"
      subtitle="Create a new password for your Career Vault."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-input-group">
          <label className="auth-label">New Password</label>
          <div className="auth-input-wrapper">
            <Lock className="auth-input-icon" size={18} />
            <input
              type="password"
              className="auth-input with-icon"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              required
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="auth-input-group">
          <label className="auth-label">Confirm Password</label>
          <div className="auth-input-wrapper">
            <Lock className="auth-input-icon" size={18} />
            <input
              type="password"
              className="auth-input with-icon"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              required
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <div className="auth-error-box">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="auth-btn"
        >
          {submitting ? 'Updating...' : 'Set New Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
