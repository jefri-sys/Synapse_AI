import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import api from '../../services/api.js';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }

      try {
        await api.get(
          `/auth/verify-email?token=${encodeURIComponent(token)}`
        );

        if (isMounted) {
          setStatus('success');
          setMessage('Email verified. Go to Login');
        }
      } catch (error) {
        if (isMounted) {
          setStatus('error');
          setMessage(
            error.response?.data?.message ||
              'Verification link is invalid or has expired.'
          );
        }
      }
    };

    verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async () => {
    setResendMessage('');

    if (!email) {
      setResendMessage('Enter your email to resend verification.');
      return;
    }

    try {
      setResending(true);
      await api.post('/auth/resend-verification', { email });
      setResendMessage('Verification email sent.');
    } catch (error) {
      setResendMessage(
        error.response?.data?.message || 'Could not resend verification email.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify email"
      subtitle="We are checking your verification link."
      footer={
        <Link className="auth-forgot-link" to="/login">
          Back to login
        </Link>
      }
    >
      {status === 'loading' ? (
        <div className="flex items-center gap-3 text-[var(--marketing-text-tertiary)] text-sm font-medium">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--marketing-border)] border-t-[var(--marketing-accent-primary)]" />
          {message}
        </div>
      ) : null}

      {status === 'success' ? (
        <div className="space-y-4">
          <div className="auth-error-box !bg-[var(--marketing-success)]/10 !border-[var(--marketing-success)] !text-[var(--marketing-success)]">
            {message}
          </div>
          <Link
            className="auth-btn"
            to="/login"
          >
            Go to Login
          </Link>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="space-y-4">
          <div className="auth-error-box">
            {message}
          </div>

          <label className="auth-label">
            Email
            <input
              className="auth-input"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>

          {resendMessage ? (
            <p className="text-sm text-[var(--marketing-text-tertiary)]">{resendMessage}</p>
          ) : null}

          <button
            className="auth-btn"
            disabled={resending}
            onClick={handleResend}
            type="button"
          >
            {resending ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>
      ) : null}
    </AuthLayout>
  );
}

export default VerifyEmail;
