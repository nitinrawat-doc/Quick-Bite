import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderOpen,
  ShoppingBag,
  PackageOpen,
  BarChart3,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  CreditCard,
} from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', Icon: LayoutDashboard, end: true },
  { to: '/admin/food', label: 'Food Management', Icon: UtensilsCrossed },
  { to: '/admin/categories', label: 'Categories', Icon: FolderOpen },
  { to: '/admin/orders', label: 'Orders', Icon: ShoppingBag },
  { to: '/admin/inventory', label: 'Inventory', Icon: PackageOpen },
  { to: '/admin/analytics', label: 'Sales & Analytics', Icon: BarChart3 },
  { to: '/admin/payments', label: 'Payments & Refunds', Icon: CreditCard },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #2E333B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo size="md" />
          <button
            onClick={() => setMobileOpen(false)}
            className="md-hide"
            style={{
              background: 'none',
              border: 'none',
              color: '#8B9099',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div
          style={{
            marginTop: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(242,140,69,0.12)',
            border: '1px solid rgba(242,140,69,0.25)',
            borderRadius: 6,
            padding: '3px 8px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: '#F28C45',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          <ShieldCheck size={13} />
          <span>Admin Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1 }} aria-label="Admin navigation">
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isActive ? '#F28C45' : '#8B9099',
                  background: isActive ? 'rgba(242,140,69,0.12)' : 'transparent',
                  border: isActive
                    ? '1px solid rgba(242,140,69,0.2)'
                    : '1px solid transparent',
                  transition: 'all 0.15s',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = '#252A31';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Admin User Card & Actions */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid #2E333B' }}>
        <div
          style={{
            padding: '8px 10px',
            background: '#252A31',
            borderRadius: 8,
            marginBottom: 8,
            border: '1px solid #2E333B',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: '#F5F5F5' }}>
            {user?.name || 'Administrator'}
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '0.6875rem',
              color: '#8B9099',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.email}
          </p>
        </div>

        <button
          onClick={() => {
            setMobileOpen(false);
            navigate('/');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            borderRadius: 8,
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#8B9099',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#F5F5F5';
            e.currentTarget.style.background = '#252A31';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8B9099';
            e.currentTarget.style.background = 'none';
          }}
        >
          <span>Exit to Student Menu</span>
          <ChevronRight size={14} />
        </button>

        <button
          id="admin-logout-btn"
          onClick={() => {
            logout();
            navigate('/');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0.5rem 0.75rem',
            borderRadius: 8,
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#E05252',
            fontSize: '0.8125rem',
            fontWeight: 600,
            marginTop: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(224,82,82,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#111214', position: 'relative' }}>
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: 250,
          flexShrink: 0,
          background: '#1D2025',
          borderRight: '1px solid #2E333B',
          position: 'sticky',
          top: 0,
          height: '100dvh',
          overflowY: 'auto',
        }}
        className="hide-on-mobile"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 90,
          }}
          className="show-on-mobile"
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: 280,
          background: '#1D2025',
          zIndex: 100,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          overflowY: 'auto',
          boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
        }}
        className="show-on-mobile"
      >
        {sidebarContent}
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflowY: 'auto',
        }}
      >
        {/* Mobile Top Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem',
            background: '#1D2025',
            borderBottom: '1px solid #2E333B',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
          className="show-on-mobile"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#F5F5F5',
                cursor: 'pointer',
                display: 'flex',
                padding: 4,
              }}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <Logo size="sm" />
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#F28C45',
              background: 'rgba(242,140,69,0.12)',
              border: '1px solid rgba(242,140,69,0.25)',
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            Admin
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
