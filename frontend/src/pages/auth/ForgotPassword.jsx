import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import api from '../../services/api.js';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      setSubmitting(true);
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(
        data.message || 'If an account exists, a password reset link was sent.'
      );
    } catch {
      setMessage('If an account exists, a password reset link was sent.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we will send a reset link if the account exists."
      footer={
        <Link className="auth-forgot-link" to="/login">
          Back to login
        </Link>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-label">
          Email
          <input
            className="auth-input"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        {message ? (
          <div className="auth-error-box !bg-[var(--marketing-success)]/10 !border-[var(--marketing-success)] !text-[var(--marketing-success)]">
            {message}
          </div>
        ) : null}

        <button
          className="auth-btn"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
