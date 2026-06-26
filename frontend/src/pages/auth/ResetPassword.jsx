import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import api from '../../services/api.js';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError(
        'Password must be at least 8 characters and include 1 uppercase letter and 1 number.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post('/auth/reset-password', {
        token,
        password,
      });
      setSuccess(data.message || 'Password reset successful. Please log in.');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(error.response?.data?.message || 'Password reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Use a strong password with at least one uppercase letter and one number."
      footer={
        <Link className="auth-forgot-link" to="/login">
          Back to login
        </Link>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-label">
          New password
          <input
            className="auth-input"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <label className="auth-label">
          Confirm password
          <input
            className="auth-input"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>

        {error ? (
          <div className="auth-error-box">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="auth-error-box !bg-[var(--marketing-success)]/10 !border-[var(--marketing-success)] !text-[var(--marketing-success)]">
            {success}
          </div>
        ) : null}

        <button
          className="auth-btn"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
