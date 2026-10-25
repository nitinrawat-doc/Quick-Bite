import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111214',
          color: '#8B9099',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: '3px solid rgba(242,140,69,0.2)',
              borderTopColor: '#F28C45',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Verifying admin permissions…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111214',
          padding: '1.5rem',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 480,
            padding: '2.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              background: 'rgba(224,82,82,0.12)',
              color: '#E05252',
              borderRadius: '50%',
              padding: 16,
              display: 'flex',
            }}
          >
            <ShieldAlert size={48} strokeWidth={1.5} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#F5F5F5' }}>
            Access Restricted
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#8B9099', lineHeight: 1.5 }}>
            The QuickBite administration panel is restricted to authorized campus canteen staff. Your account ({user?.email}) has role <strong style={{ color: '#F5F5F5' }}>{user?.role}</strong>.
          </p>
          <Link
            to="/"
            className="btn-accent"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              borderRadius: 10,
              padding: '0.75rem 1.5rem',
              marginTop: 8,
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Canteen Menu</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
