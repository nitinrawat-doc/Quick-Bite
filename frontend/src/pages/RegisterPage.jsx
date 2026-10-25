import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, CheckCircle, AlertCircle, ShieldAlert, ShieldCheck, Key, GraduationCap } from 'lucide-react';
import Logo from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#E05252', '#F28C45', '#F5C542', '#4CAF7D'];

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function FormField({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  icon: Icon,
  autoComplete,
  required = true,
  value,
  onChange,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: '#F5F5F5',
          marginBottom: '0.375rem',
        }}
      >
        {label} {!required && <span style={{ color: '#8B9099', fontWeight: 400 }}>(optional)</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon
          size={15}
          style={{
            position: 'absolute',
            left: 13,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#8B9099',
          }}
        />
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
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
  );
}

export default function RegisterPage() {
  const [accountType, setAccountType] = useState('student'); // 'student' | 'admin'
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    inviteCode: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, registerAdmin, isAuthenticated, isLoading, user } = useAuth();
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

  const pwStrength = getPasswordStrength(form.password);
  const pwsMatch = form.password && form.confirm && form.password === form.confirm;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (accountType === 'admin') {
      if (!form.inviteCode.trim()) {
        setError('Administrator authorization code is required.');
        return;
      }
    }

    setLoading(true);
    setError('');
    try {
      if (accountType === 'admin') {
        await registerAdmin({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          setupToken: form.inviteCode.trim(),
        });
        navigate('/admin', { replace: true });
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
        });
        navigate('/menu', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
      <div
        className="card animate-fade-in"
        style={{ width: '100%', maxWidth: 440, padding: '2.5rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <Logo size="lg" />
        </div>

        {/* Account Type Selector */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            background: '#252A31',
            padding: 4,
            borderRadius: 12,
            marginBottom: '1.5rem',
            border: '1px solid #2E333B',
          }}
        >
          <button
            type="button"
            id="account-type-student-btn"
            onClick={() => {
              setAccountType('student');
              setError('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              background: accountType === 'student' ? '#F28C45' : 'transparent',
              color: accountType === 'student' ? '#111214' : '#8B9099',
            }}
          >
            <GraduationCap size={16} />
            <span>Student / User</span>
          </button>

          <button
            type="button"
            id="account-type-admin-btn"
            onClick={() => {
              setAccountType('admin');
              setError('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              background: accountType === 'admin' ? '#F28C45' : 'transparent',
              color: accountType === 'admin' ? '#111214' : '#8B9099',
            }}
          >
            <ShieldCheck size={16} />
            <span>Admin</span>
          </button>
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
          {accountType === 'admin' ? 'Canteen Admin Registration' : 'Create Student Account'}
        </h1>
        <p
          style={{
            margin: '0 0 1.5rem',
            color: '#8B9099',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          {accountType === 'admin'
            ? 'Campus canteen staff & operations panel access'
            : 'Fast, effortless canteen ordering on campus'}
        </p>

        {accountType === 'admin' && (
          <div
            style={{
              background: 'rgba(242,140,69,0.08)',
              border: '1px solid rgba(242,140,69,0.25)',
              borderRadius: 10,
              padding: '0.875rem 1rem',
              color: '#F5F5F5',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <ShieldAlert size={18} color="#F28C45" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: '#F28C45', display: 'block', marginBottom: 2 }}>
                Administrator Authorization Required
              </strong>
              <span style={{ color: '#8B9099', lineHeight: 1.4 }}>
                Admin access requires a valid single-use invitation code or server authorization key. Normal registration will not grant administrator privileges.
              </span>
            </div>
          </div>
        )}

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormField
            id="reg-name"
            name="name"
            label="Full Name"
            placeholder="Aarav Sharma"
            icon={User}
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
          />
          <FormField
            id="reg-email"
            name="email"
            type="email"
            label="Campus Email"
            placeholder="aarav@campus.edu"
            icon={Mail}
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
          />
          <FormField
            id="reg-phone"
            name="phone"
            type="tel"
            label="Phone Number"
            placeholder="9876543210"
            icon={Phone}
            autoComplete="tel"
            required={false}
            value={form.phone}
            onChange={handleChange}
          />

          {/* Password */}
          <div>
            <label
              htmlFor="reg-password"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#F5F5F5',
                marginBottom: '0.375rem',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                style={{
                  position: 'absolute',
                  left: 13,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8B9099',
                }}
              />
              <input
                id="reg-password"
                name="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="At least 6 characters"
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
                }}
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
                }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Strength meter */}
            {form.password && (
              <div style={{ marginTop: '0.375rem' }}>
                <div style={{ display: 'flex', gap: 4, height: 4, borderRadius: 2, overflow: 'hidden' }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        background:
                          pwStrength >= level ? STRENGTH_COLORS[pwStrength] : '#2E333B',
                        borderRadius: 2,
                        transition: 'background 0.2s',
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: STRENGTH_COLORS[pwStrength],
                    marginTop: 2,
                    display: 'block',
                  }}
                >
                  {STRENGTH_LABELS[pwStrength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="reg-confirm"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#F5F5F5',
                marginBottom: '0.375rem',
              }}
            >
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                style={{
                  position: 'absolute',
                  left: 13,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8B9099',
                }}
              />
              <input
                id="reg-confirm"
                name="confirm"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Repeat password"
                value={form.confirm}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: '#252A31',
                  border: `1px solid ${
                    form.confirm
                      ? pwsMatch
                        ? '#4CAF7D'
                        : '#E05252'
                      : '#2E333B'
                  }`,
                  borderRadius: 10,
                  padding: '10px 38px 10px 38px',
                  color: '#F5F5F5',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              {pwsMatch && (
                <CheckCircle
                  size={15}
                  color="#4CAF7D"
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
            </div>
          </div>

          {/* Admin Invitation Code (Only when Admin is selected) */}
          {accountType === 'admin' && (
            <FormField
              id="reg-invite-code"
              name="inviteCode"
              label="Admin Invitation / Authorization Key"
              placeholder="qb_inv_... or server setup key"
              icon={Key}
              autoComplete="off"
              required={true}
              value={form.inviteCode}
              onChange={handleChange}
            />
          )}

          {/* Submit */}
          <button
            id="register-submit-btn"
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
              <span>{accountType === 'admin' ? 'Authorizing Admin Account…' : 'Creating Account…'}</span>
            ) : (
              <>
                <span>{accountType === 'admin' ? 'Authorize & Create Admin Account' : 'Create Student Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p
          style={{
            margin: '1.75rem 0 0',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: '#8B9099',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: '#F28C45', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
