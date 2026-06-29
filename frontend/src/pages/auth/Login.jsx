import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { Mail, Lock, ArrowRight } from 'lucide-react';

function Login() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    window.dispatchEvent(new CustomEvent('auth-submit'));
    try {
      setSubmitting(true);
      const { data } = await api.post('/auth/login', form);
      if (data.token) {
        localStorage.setItem('synapse_token', data.token);
      }
      window.dispatchEvent(new CustomEvent('auth-success'));
      login(data.user);
      // Slight delay to allow the success animation to play
      setTimeout(() => {
         navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
      }, 800);
    } catch (error) {
      window.dispatchEvent(new CustomEvent('auth-error'));
      setError(error.response?.data?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Enter your credentials to access your Synapse workspace."
      footer={
        <>
          Don't have an account?{' '}
          <Link className="auth-forgot-link" style={{ fontWeight: 800 }} to="/register">
            Sign up for free
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-input-group">
          <label className="auth-label">Email Address</label>
          <div className="auth-input-wrapper">
            <Mail className="auth-input-icon" size={18} />
            <input
              className="auth-input with-icon"
              name="email"
              onChange={handleChange}
              onFocus={() => window.dispatchEvent(new CustomEvent('auth-focus', { detail: 'email' }))}
              onBlur={() => window.dispatchEvent(new CustomEvent('auth-focus', { detail: null }))}
              required
              type="email"
              placeholder="you@university.edu"
              value={form.email}
            />
          </div>
        </div>

        <div className="auth-input-group">
          <label className="auth-label">Password</label>
          <div className="auth-input-wrapper">
            <Lock className="auth-input-icon" size={18} />
            <input
              className="auth-input with-icon"
              name="password"
              onChange={handleChange}
              onFocus={() => window.dispatchEvent(new CustomEvent('auth-focus', { detail: 'password' }))}
              onBlur={() => window.dispatchEvent(new CustomEvent('auth-focus', { detail: null }))}
              required
              type="password"
              placeholder="••••••••"
              value={form.password}
            />
          </div>
        </div>

        <div className="auth-options">
          <label className="auth-checkbox-label">
            <input
              checked={form.rememberMe}
              className="auth-checkbox"
              name="rememberMe"
              onChange={handleChange}
              type="checkbox"
            />
            <span>Remember for 30 days</span>
          </label>

          <Link className="auth-forgot-link" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="auth-error-box">
            {error}
          </div>
        )}

        <button 
          className="auth-btn" 
          disabled={submitting} 
          type="submit"
          onMouseEnter={() => window.dispatchEvent(new CustomEvent('auth-hover-submit', { detail: true }))}
          onMouseLeave={() => window.dispatchEvent(new CustomEvent('auth-hover-submit', { detail: false }))}
        >
          {submitting ? 'Authenticating...' : (
            <>
              Sign In <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
