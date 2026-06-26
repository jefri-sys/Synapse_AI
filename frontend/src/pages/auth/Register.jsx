import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout.jsx';
import api from '../../services/api.js';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const fieldClass = 'auth-input';
const labelClass = 'auth-label';

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password || score <= 1) {
    return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
  }

  if (score <= 3) {
    return { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' };
  }

  return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
}

function Register() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      setSuccess('Check your email.');
      setForm(initialForm);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your Synapse workspace after verifying your email."
      footer={
        <>
          Already have an account?{' '}
          <Link className="auth-forgot-link" to="/login">
            Log in
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className={labelClass}>
          Name
          <input
            className={fieldClass}
            name="name"
            onChange={handleChange}
            required
            type="text"
            value={form.name}
          />
        </label>

        <label className={labelClass}>
          Email
          <input
            className={fieldClass}
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={form.email}
          />
        </label>

        <label className={labelClass}>
          Password
          <div className="relative">
            <input
              className={`${fieldClass} pr-10`}
              minLength={8}
              name="password"
              onChange={handleChange}
              required
              type={showPassword ? 'text' : 'password'}
              value={form.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <div aria-live="polite" className="mt-2">
          <div className="h-1.5 rounded-full bg-white/10">
            <div
              className={`h-1.5 rounded-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300`}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-[var(--marketing-text-tertiary)]">
            Password strength: <span className="text-white">{passwordStrength.label}</span>
          </p>
        </div>

        <label className={labelClass}>
          Confirm Password
          <div className="relative">
            <input
              className={`${fieldClass} pr-10`}
              minLength={8}
              name="confirmPassword"
              onChange={handleChange}
              required
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
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
          className="auth-btn mt-4"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Register;
