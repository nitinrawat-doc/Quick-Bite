import { NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/',        label: 'Home',    Icon: Home },
  { to: '/menu',    label: 'Menu',    Icon: UtensilsCrossed },
  { to: '/orders',  label: 'Orders',  Icon: ShoppingBag },
  { to: '/cart',    label: 'Cart',    Icon: ShoppingCart, cartBadge: true },
  { to: '/profile', label: 'Profile', Icon: User },
];

export default function BottomNav() {
  const { isAuthenticated } = useAuth();
  const { totalItems, openCart } = useCart();

  if (!isAuthenticated) return null;

  return (
    <nav
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(29,32,37,0.98)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #2E333B',
        display: 'flex',
        zIndex: 30,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Mobile navigation"
      className="sm:hidden"
    >
      {NAV.map(({ to, label, Icon, cartBadge }) => (
        <NavLink
          key={to}
          to={to}
          onClick={cartBadge ? (e) => { e.preventDefault(); openCart(); } : undefined}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4, padding: '10px 0',
            color: isActive ? '#F28C45' : '#8B9099',
            textDecoration: 'none', fontSize: '0.6875rem', fontWeight: 500,
            transition: 'color 0.2s',
            position: 'relative',
          })}
        >
          <div style={{ position: 'relative' }}>
            <Icon size={22} />
            {cartBadge && totalItems > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -8,
                background: '#F28C45', color: '#fff', borderRadius: 9999,
                fontSize: '0.625rem', fontWeight: 700, minWidth: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                border: '1.5px solid #1D2025',
              }}>{totalItems}</span>
            )}
          </div>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
