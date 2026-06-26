import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api.js';
import { Card } from '../../components/ui/card.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Button } from '../../components/ui/button.jsx';

export default function CareerVaultGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [setupRequired, setSetupRequired] = useState(null);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await api.post('/career-vault/verify-access', {});
        if (res.data.vaultSetupRequired) {
          setSetupRequired(true);
        } else {
          setSetupRequired(false);
        }
      } catch (err) {
        setSetupRequired(false);
      }
    };
    checkSetup();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (setupRequired && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      if (setupRequired) {
        await api.post('/career-vault/setup-password', { password, confirmPassword });
      } else {
        await api.post('/career-vault/verify-access', { password });
      }
      onUnlock();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (setupRequired === null) {
    return (
      <ProtectedPage title="Career Vault Secured">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage
      title={setupRequired ? "Setup Career Vault" : "Career Vault Secured"}
      description="This area contains sensitive career documents. Please verify your identity."
    >
      <Card className="max-w-md mx-auto mt-10 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-primary-subtle text-brand-primary mb-4">
            {setupRequired ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-display font-bold text-text-primary">
            {setupRequired ? 'Set up your Vault password' : 'Re-enter your password'}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {setupRequired 
              ? 'This password is specific to your Vault and separate from your main account login.' 
              : 'to access Career Vault'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              {setupRequired ? 'New Vault Password' : 'Password'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary z-10">
                <Lock size={18} />
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                placeholder="••••••••"
                autoFocus
                className="pl-10"
              />
            </div>
          </div>

          {setupRequired && (
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Confirm Vault Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary z-10">
                  <Lock size={18} />
                </div>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  required
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {!setupRequired && (
            <div className="flex justify-end">
              <Link to="/career/forgot-vault-password" className="text-sm font-semibold text-brand-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          )}

          {error && (
            <div className="bg-status-danger-subtle text-status-danger p-3 rounded-lg text-sm border border-status-danger/20">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? (setupRequired ? 'Setting up...' : 'Verifying...') : (
              <>{setupRequired ? 'Create Vault Password' : 'Unlock'} <ArrowRight size={18} /></>
            )}
          </Button>
        </form>
      </Card>
    </ProtectedPage>
  );
}
