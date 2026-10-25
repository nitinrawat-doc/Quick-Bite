import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/client';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  LogOut,
  ShoppingBag,
  UtensilsCrossed,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      setUser((prev) => ({ ...prev, ...updated }));
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#111214' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 680, margin: '0 auto', width: '100%', padding: '2rem 1.5rem 6rem' }}>
        <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.75rem', fontWeight: 800, color: '#F5F5F5' }}>
          Student Profile
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Main Profile Card */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(242,140,69,0.2) 0%, rgba(242,140,69,0.05) 100%)',
                  border: '2px solid #F28C45',
                  color: '#F28C45',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#F5F5F5' }}>
                  {user?.name}
                </h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    style={{
                      background: 'rgba(242,140,69,0.15)',
                      color: '#F28C45',
                      borderRadius: 20,
                      padding: '2px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    🎓 {user?.role || 'student'}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: '#8B9099' }}>
                    Campus ID Verified
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditing((v) => !v)}
                className="btn-ghost"
                style={{ borderRadius: 8, padding: '6px 14px', fontSize: '0.8125rem' }}
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editing ? (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      background: '#252A31',
                      border: '1px solid #2E333B',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#F5F5F5',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9876543210"
                    style={{
                      width: '100%',
                      background: '#252A31',
                      border: '1px solid #2E333B',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#F5F5F5',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-accent"
                  style={{
                    borderRadius: 8,
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontSize: '0.875rem',
                  }}
                >
                  <Check size={16} />
                  <span>{saving ? 'Saving…' : 'Save Changes'}</span>
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: '#252A31',
                    borderRadius: 10,
                    padding: '10px 14px',
                  }}
                >
                  <Mail size={16} color="#8B9099" />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: '#8B9099', display: 'block' }}>Email Address</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F5F5F5' }}>{user?.email}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: '#252A31',
                    borderRadius: 10,
                    padding: '10px 14px',
                  }}
                >
                  <Phone size={16} color="#8B9099" />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: '#8B9099', display: 'block' }}>Phone Number</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F5F5F5' }}>
                      {user?.phone || 'Not provided'}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: '#252A31',
                    borderRadius: 10,
                    padding: '10px 14px',
                  }}
                >
                  <Calendar size={16} color="#8B9099" />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: '#8B9099', display: 'block' }}>Member Since</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F5F5F5' }}>
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Recent'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: '#F5F5F5' }}>
              Quick Actions
            </h3>

            <Link
              to="/orders"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#252A31',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#F5F5F5',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              <ShoppingBag size={18} color="#F28C45" />
              <span>View Order History</span>
            </Link>

            <Link
              to="/menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#252A31',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#F5F5F5',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              <UtensilsCrossed size={18} color="#F28C45" />
              <span>Explore Canteen Menu</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(224,82,82,0.1)',
                border: '1px solid rgba(224,82,82,0.25)',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#E05252',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                textAlign: 'left',
              }}
            >
              <LogOut size={18} />
              <span>Sign Out of QuickBite</span>
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
