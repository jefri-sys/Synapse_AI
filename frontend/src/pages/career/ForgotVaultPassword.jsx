import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';

export default function ForgotVaultPassword() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/career-vault/forgot-password');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedPage title="Career Vault Recovery">
      <Card className="max-w-md mx-auto mt-16 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-status-danger-subtle text-status-danger mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-text-primary mb-2">Forgot Vault Password?</h2>
        <p className="text-text-secondary mb-8 leading-relaxed">
          This will send a secure link to your email to reset your Career Vault password. 
          Your main Synapse account password will not be affected.
        </p>

        {success ? (
          <div className="bg-status-success-subtle text-status-success p-4 rounded-xl border border-status-success/20 mb-6">
            <p className="font-semibold">Check your email for a reset link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="text-status-danger mb-4 text-sm font-bold">{error}</div>}
            <Button
              type="submit"
              disabled={submitting}
              variant="primary"
              className="w-full py-3 h-auto text-base"
            >
              {submitting ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link to="/career" className="inline-flex items-center text-sm font-bold text-text-tertiary hover:text-text-primary transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to Career Vault
          </Link>
        </div>
      </Card>
    </ProtectedPage>
  );
}
