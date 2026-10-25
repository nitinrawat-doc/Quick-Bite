import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  User,
  X,
  LogOut,
  PackageCheck,
  Shield,
  Menu as MenuIcon,
  UtensilsCrossed,
  Home,
  HelpCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import Logo from '../common/Logo';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onSearch }) {
  const { totalItems, openCart, clearCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    clearCart();
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Close menus when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    onSearch?.(val);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch?.('');
    setSearchOpen(false);
  };

  const isHome = location.pathname === '/';
  const isMenu = location.pathname === '/menu';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(17,18,20,0.94)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #2E333B',
      }}
    >
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 1.5rem',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
        }}
        aria-label="Main navigation"
      >
        {/* Left: Logo & Desktop Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexShrink: 0 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <div
            className="hidden md:flex"
            style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}
          >
            <Link
              to="/"
              style={{
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: isHome ? '#F28C45' : '#8B9099',
                transition: 'color 0.2s',
                padding: '4px 0',
                borderBottom: isHome ? '2px solid #F28C45' : '2px solid transparent',
              }}
              className="hover:text-[#F5F5F5]"
            >
              Home
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/menu"
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isMenu ? '#F28C45' : '#8B9099',
                    transition: 'color 0.2s',
                    padding: '4px 0',
                    borderBottom: isMenu ? '2px solid #F28C45' : '2px solid transparent',
                  }}
                  className="hover:text-[#F5F5F5]"
                >
                  Menu
                </Link>

                <Link
                  to="/orders"
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: location.pathname === '/orders' ? '#F28C45' : '#8B9099',
                    transition: 'color 0.2s',
                    padding: '4px 0',
                    borderBottom: location.pathname === '/orders' ? '2px solid #F28C45' : '2px solid transparent',
                  }}
                  className="hover:text-[#F5F5F5]"
                >
                  My Orders
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Center: Search bar (shown when onSearch is available, e.g. MenuPage) */}
        {onSearch ? (
          <div
            style={{
              flex: 1,
              maxWidth: 380,
              display: searchOpen ? 'none' : 'flex',
            }}
            className="hidden sm:flex"
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8B9099',
                }}
              />
              <input
                id="desktop-search"
                type="search"
                placeholder="Search canteen menu…"
                value={query}
                onChange={handleSearch}
                style={{
                  width: '100%',
                  background: '#1D2025',
                  border: '1px solid #2E333B',
                  borderRadius: 10,
                  padding: '9px 12px 9px 36px',
                  color: '#F5F5F5',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#F28C45')}
                onBlur={(e) => (e.target.style.borderColor = '#2E333B')}
              />
              {query && (
                <button
                  onClick={clearSearch}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#8B9099',
                    display: 'flex',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Mobile search toggle if search enabled */}
          {onSearch && (
            <button
              id="mobile-search-btn"
              onClick={() => setSearchOpen((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8B9099',
                display: 'flex',
                padding: '8px',
                borderRadius: 8,
              }}
              aria-label="Toggle search"
              className="sm:hidden"
            >
              <Search size={20} />
            </button>
          )}

          {/* Quick link: My Orders (desktop) */}
          {isAuthenticated && (
            <Link
              to="/orders"
              className="hidden lg:flex btn-ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                fontSize: '0.8125rem',
                textDecoration: 'none',
                borderRadius: 8,
              }}
            >
              <PackageCheck size={16} color="#F28C45" />
              <span>My Orders</span>
            </Link>
          )}

          {/* Quick link: Admin Dashboard (if admin user) */}
          {isAuthenticated && user?.role === 'admin' && (
            <Link
              to="/admin"
              className="hidden md:flex"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                fontSize: '0.8125rem',
                textDecoration: 'none',
                borderRadius: 8,
                background: 'rgba(242,140,69,0.15)',
                color: '#F28C45',
                border: '1px solid rgba(242,140,69,0.3)',
                fontWeight: 600,
              }}
            >
              <Shield size={15} color="#F28C45" />
              <span>Admin Portal</span>
            </Link>
          )}

          {/* User Auth Profile / Login & Register */}
          {isAuthenticated ? (
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <button
                id="user-profile-menu-btn"
                onClick={() => setUserMenuOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#1D2025',
                  border: '1px solid #2E333B',
                  borderRadius: 20,
                  padding: '4px 12px 4px 6px',
                  cursor: 'pointer',
                  color: '#F5F5F5',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  transition: 'border-color 0.2s',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(242,140,69,0.18)',
                    color: '#F28C45',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <span
                  className="hidden sm:inline"
                  style={{
                    maxWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.name?.split(' ')[0]}
                </span>
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div
                  className="animate-slide-up"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: 200,
                    background: '#1D2025',
                    border: '1px solid #2E333B',
                    borderRadius: 12,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                    padding: '6px',
                    zIndex: 40,
                  }}
                >
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #2E333B', marginBottom: 4 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '0.8125rem', fontWeight: 700, color: '#F5F5F5' }}>
                      {user?.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: '#8B9099',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.email}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      color: '#F5F5F5',
                      textDecoration: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                    }}
                    className="hover:bg-[#252A31]"
                  >
                    <User size={15} color="#8B9099" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      color: '#F5F5F5',
                      textDecoration: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                    }}
                    className="hover:bg-[#252A31]"
                  >
                    <PackageCheck size={15} color="#8B9099" />
                    <span>Order History</span>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 8,
                        color: '#F28C45',
                        textDecoration: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                      }}
                      className="hover:bg-[#252A31]"
                    >
                      <Shield size={15} color="#F28C45" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      color: '#E05252',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                    }}
                    className="hover:bg-[#252A31]"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                id="login-btn"
                onClick={() => navigate('/login')}
                className="btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>

              <button
                id="register-btn"
                onClick={() => navigate('/register')}
                className="hidden sm:inline-flex"
                style={{
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 22px',
                  borderRadius: 9999,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  background: '#F28C45',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(242,140,69,0.4)',
                  transition: 'background 0.2s, transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E07A30';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F28C45';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <UserPlus size={15} />
                <span>Register</span>
              </button>
            </div>
          )}

          {/* Cart Button (authenticated students only) */}
          {isAuthenticated && (
            <button
              id="cart-btn"
              onClick={openCart}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(242,140,69,0.1)',
                border: '1px solid rgba(242,140,69,0.25)',
                borderRadius: 10,
                padding: '8px',
                cursor: 'pointer',
                color: '#F28C45',
                transition: 'background 0.2s',
              }}
              aria-label={`Open cart, ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(242,140,69,0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(242,140,69,0.1)')}
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: '#F28C45',
                    color: '#fff',
                    borderRadius: 9999,
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    border: '2px solid #111214',
                  }}
                >
                  {totalItems}
                </span>
              )}
            </button>
          )}

          {/* Mobile hamburger toggle */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#8B9099',
              display: 'flex',
              padding: '8px',
              borderRadius: 8,
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} color="#F28C45" /> : <MenuIcon size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile search bar if onSearch is enabled */}
      {onSearch && searchOpen && (
        <div style={{ padding: '0 1.5rem 0.75rem', borderTop: '1px solid #2E333B' }} className="sm:hidden">
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8B9099',
              }}
            />
            <input
              ref={inputRef}
              id="mobile-search"
              type="search"
              placeholder="Search canteen menu…"
              value={query}
              onChange={handleSearch}
              style={{
                width: '100%',
                background: '#1D2025',
                border: '1px solid #F28C45',
                borderRadius: 10,
                padding: '9px 36px 9px 33px',
                color: '#F5F5F5',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <button
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8B9099',
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile navigation dropdown drawer */}
      {mobileMenuOpen && (
        <div
          className="animate-slide-up md:hidden"
          style={{
            background: '#1D2025',
            borderTop: '1px solid #2E333B',
            borderBottom: '1px solid #2E333B',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                color: isHome ? '#F28C45' : '#F5F5F5',
                background: isHome ? 'rgba(242,140,69,0.1)' : 'transparent',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
              }}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/menu"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  color: isMenu ? '#F28C45' : '#F5F5F5',
                  background: isMenu ? 'rgba(242,140,69,0.1)' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                }}
              >
                <UtensilsCrossed size={18} />
                <span>Campus Menu</span>
              </Link>
            )}
          </div>

          <div style={{ borderTop: '1px solid #2E333B', paddingTop: '0.75rem' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    color: '#F5F5F5',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                >
                  <PackageCheck size={18} color="#F28C45" />
                  <span>My Orders</span>
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    color: '#F5F5F5',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                >
                  <User size={18} color="#8B9099" />
                  <span>Student Profile</span>
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      color: '#F28C45',
                      background: 'rgba(242,140,69,0.1)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    <Shield size={18} />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    color: '#E05252',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    width: '100%',
                  }}
                >
                  <LogOut size={18} />
                  <span>Sign Out ({user?.name?.split(' ')[0]})</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-ghost"
                  style={{ flex: 1, textDecoration: 'none', padding: '10px' }}
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-accent"
                  style={{ flex: 1, textDecoration: 'none', padding: '10px' }}
                >
                  <UserPlus size={16} />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
