import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Logo from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/menu';

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirectPath || '/menu', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, navigate, redirectPath]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const loggedInUser = await login(form.email, form.password);
      if (loggedInUser && loggedInUser.role === 'admin' && (redirectPath === '/' || redirectPath === '/menu')) {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111214',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '60vw',
          height: '60vw',
          maxWidth: 600,
          background: 'radial-gradient(circle, rgba(242,140,69,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          maxWidth: 500,
          background: 'radial-gradient(circle, rgba(242,140,69,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
          borderRadius: '50%',
        }}
      />

      <div
        className="card animate-fade-in"
        style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Logo size="lg" />
        </div>

        <h1
          style={{
            margin: '0 0 0.375rem',
            fontSize: '1.375rem',
            fontWeight: 800,
            color: '#F5F5F5',
            textAlign: 'center',
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            margin: '0 0 2rem',
            color: '#8B9099',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          Sign in to your QuickBite student account
        </p>

        {error && (
          <div
            className="animate-shake"
            style={{
              background: 'rgba(224,82,82,0.1)',
              border: '1px solid rgba(224,82,82,0.3)',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              color: '#E05252',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#F5F5F5',
                marginBottom: '0.375rem',
              }}
            >
              Campus Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: 13,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8B9099',
                }}
              />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="student@campus.edu"
                value={form.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: '#252A31',
                  border: '1px solid #2E333B',
                  borderRadius: 10,
                  padding: '10px 12px 10px 38px',
                  color: '#F5F5F5',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#F28C45')}
                onBlur={(e) => (e.target.style.borderColor = '#2E333B')}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <label
                htmlFor="password"
                style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5' }}
              >
                Password
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: 13,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8B9099',
                }}
              />
              <input
                id="password"
                name="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: '#252A31',
                  border: '1px solid #2E333B',
                  borderRadius: 10,
                  padding: '10px 38px 10px 38px',
                  color: '#F5F5F5',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#F28C45')}
                onBlur={(e) => (e.target.style.borderColor = '#2E333B')}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8B9099',
                  display: 'flex',
                  padding: 2,
                }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="btn-accent"
            style={{
              width: '100%',
              padding: '0.875rem',
              fontSize: '0.9375rem',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: '0.5rem',
            }}
          >
            {loading ? (
              <span>Signing in…</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p
          style={{
            margin: '2rem 0 0',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: '#8B9099',
          }}
        >
          New to QuickBite?{' '}
          <Link
            to="/register"
            style={{ color: '#F28C45', fontWeight: 600, textDecoration: 'none' }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
