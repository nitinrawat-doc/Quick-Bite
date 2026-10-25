import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import CartDrawer from '../components/cart/CartDrawer';
import SkeletonCard from '../components/common/SkeletonCard';
import FoodImage from '../components/common/FoodImage';
import Logo from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { fetchMenu } from '../api/client';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  ShoppingBag,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const HERO_VARIANTS = [
  {
    id: 0,
    title: 'Double Smash Cheeseburger',
    tagline: 'Flame-grilled double beef patty with melted cheddar & fresh greens',
    image: '/images/hero-burger-double.jpg',
  },
  {
    id: 1,
    title: 'The Ultimate Explosive Burger',
    tagline: 'Toasted brioche, melting cheddar, crispy pickles & signature secret sauce',
    image: '/images/hero-burger-explosive.jpg',
  },
  {
    id: 2,
    title: 'Crispy Brioche Chicken',
    tagline: 'Golden crispy breast fillet topped with fresh crunchy slaw & chipotle mayo',
    image: '/images/hero-burger-crispy.jpg',
  },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { items: cartItems, addItem, removeItem } = useCart();
  const navigate = useNavigate();

  const [activeHeroIndex, setActiveHeroIndex] = useState(1); // Default to center explosive burger
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load real menu items from database API
  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        setLoading(true);
        const data = await fetchMenu();
        if (!isMounted) return;
        const allItems = data?.foodItems || [];

        // Select 4-6 real items from database (prioritize bestsellers and available items)
        const bestsellers = allItems.filter(
          (item) => item.tags?.includes('bestseller') && !item.isOutOfStock
        );
        const others = allItems.filter(
          (item) => !item.tags?.includes('bestseller') && !item.isOutOfStock
        );
        const combined = [...bestsellers, ...others].slice(0, 6);

        setFeaturedItems(combined.length > 0 ? combined : allItems.slice(0, 6));
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to fetch featured foods:', err.message);
          setError(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrevHero = () => {
    setActiveHeroIndex((prev) => (prev === 0 ? HERO_VARIANTS.length - 1 : prev - 1));
  };

  const handleNextHero = () => {
    setActiveHeroIndex((prev) => (prev === HERO_VARIANTS.length - 1 ? 0 : prev + 1));
  };

  const handleExploreMenu = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to browse and order from the canteen');
      navigate('/login', { state: { from: { pathname: '/menu' } } });
    } else {
      navigate('/menu');
    }
  };

  const handleAddToCart = (item) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your cart');
      navigate('/login', { state: { from: { pathname: '/menu' } } });
      return;
    }
    addItem(item);
    toast.success(`Added ${item.name} to cart`);
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#111214', color: '#F5F5F5', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar />
      {isAuthenticated && <CartDrawer />}

      <main style={{ flex: 1 }}>
        {/* ─── Hero Section (Premium Dark Showcase) ─────────────────────────── */}
        <section style={{ padding: '1.25rem 1rem 3rem', maxWidth: 1380, margin: '0 auto', width: '100%' }}>
          <div
            style={{
              background: '#111214',
              border: '1px solid rgba(242, 140, 69, 0.28)',
              borderRadius: 28,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
              padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 4rem)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle background ambient glow */}
            <div
              style={{
                position: 'absolute',
                top: '-20%',
                right: '5%',
                width: 500,
                height: 500,
                background: 'radial-gradient(circle, rgba(242,140,69,0.12) 0%, rgba(17,18,20,0) 70%)',
                pointerEvents: 'none',
                filter: 'blur(50px)',
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 'clamp(2rem, 5vw, 4rem)',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Left Column: Editorial Headline & Thumbnail Carousel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <div>
                  <h1
                    className="font-serif-luxury"
                    style={{
                      fontSize: 'clamp(2.75rem, 5.5vw, 4.25rem)',
                      fontWeight: 800,
                      lineHeight: 1.1,
                      color: '#F5F5F5',
                      margin: '0 0 1.25rem',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Good Food.<br />
                    Zero Waiting.
                  </h1>

                  <p
                    style={{
                      fontSize: '1rem',
                      lineHeight: 1.65,
                      color: '#8B9099',
                      maxWidth: 480,
                      margin: 0,
                    }}
                  >
                    Welcome to QuickBite — your campus food paradise where hot, delicious canteen specialties meet zero counter wait times. Indulge in freshly prepared meals crafted with quality ingredients, ready for instant pickup.
                  </p>
                </div>

                {/* Call-to-Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <button
                    id="hero-order-now-btn"
                    type="button"
                    onClick={handleExploreMenu}
                    style={{
                      background: '#F28C45',
                      color: '#FFFFFF',
                      borderRadius: 9999,
                      padding: '13px 34px',
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 8px 24px rgba(242,140,69,0.4)',
                      transition: 'transform 0.2s, background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.background = '#E07A30';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = '#F28C45';
                    }}
                  >
                    <span>Order Now</span>
                  </button>

                  {!isAuthenticated ? (
                    <Link
                      id="hero-create-account-link"
                      to="/register"
                      style={{
                        color: '#F28C45',
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        padding: '10px 14px',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#FFA96B')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#F28C45')}
                    >
                      Create Account
                    </Link>
                  ) : (
                    <button
                      id="hero-view-menu-link"
                      type="button"
                      onClick={handleExploreMenu}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#F28C45',
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        padding: '10px 14px',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#FFA96B')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#F28C45')}
                    >
                      View Full Menu
                    </button>
                  )}
                </div>

                {/* ─── 3-Item Thumbnail Selector Carousel (Directly matching reference) ─── */}
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Left Navigation Arrow */}
                    <button
                      onClick={handlePrevHero}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '1.5px solid #F28C45',
                        background: 'transparent',
                        color: '#F28C45',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                      aria-label="Previous featured burger"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(242,140,69,0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* 3 Thumbnails */}
                    <div style={{ display: 'flex', gap: 14 }}>
                      {HERO_VARIANTS.map((item, idx) => {
                        const isActive = activeHeroIndex === idx;
                        return (
                          <div
                            key={item.id}
                            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                          >
                            {/* Orange Triangle Caret Indicator over active card */}
                            {isActive && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: -11,
                                  width: 0,
                                  height: 0,
                                  borderLeft: '5px solid transparent',
                                  borderRight: '5px solid transparent',
                                  borderBottom: '7px solid #F28C45',
                                  zIndex: 10,
                                }}
                              />
                            )}

                            <button
                              onClick={() => setActiveHeroIndex(idx)}
                              style={{
                                width: 72,
                                height: 72,
                                borderRadius: 14,
                                background: '#1D2025',
                                border: isActive ? '2px solid #F28C45' : '1px solid #2E333B',
                                padding: 6,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                                boxShadow: isActive ? '0 0 16px rgba(242,140,69,0.35)' : 'none',
                                transform: isActive ? 'scale(1.04)' : 'scale(1)',
                              }}
                              aria-label={`Select ${item.title}`}
                            >
                              <img
                                src={item.image}
                                alt={item.title}
                                width={44}
                                height={44}
                                loading="eager"
                                decoding="sync"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  aspectRatio: '1/1',
                                  objectFit: 'contain',
                                }}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Navigation Arrow */}
                    <button
                      onClick={handleNextHero}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '1.5px solid #F28C45',
                        background: 'transparent',
                        color: '#F28C45',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                      aria-label="Next featured burger"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(242,140,69,0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Slider Indicator Dots */}
                  <div style={{ display: 'flex', gap: 6, paddingLeft: 46 }}>
                    {HERO_VARIANTS.map((item, idx) => {
                      const isActive = activeHeroIndex === idx;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveHeroIndex(idx)}
                          style={{
                            width: isActive ? 22 : 6,
                            height: 6,
                            borderRadius: 3,
                            background: isActive ? '#F28C45' : '#2E333B',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            transition: 'all 0.25s',
                          }}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Large Floating Burger Showcase */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 460,
                }}
              >
                {/* Burger image with smooth float animation & clean drop-shadow */}
                <img
                  key={activeHeroIndex}
                  src={HERO_VARIANTS[activeHeroIndex].image}
                  alt={HERO_VARIANTS[activeHeroIndex].title}
                  className="animate-float animate-fade-in"
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                  width={520}
                  height={520}
                  style={{
                    width: '100%',
                    maxWidth: 520,
                    maxHeight: 520,
                    aspectRatio: '1/1',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 28px 50px rgba(0,0,0,0.85))',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Featured Foods Section (Real Items From API) ────────────────── */}
        <section style={{ padding: '4rem 1.5rem', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#F28C45',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Campus Specialties
              </span>
              <h2
                style={{
                  margin: '0 0 6px',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#F5F5F5',
                  letterSpacing: '-0.01em',
                }}
              >
                Popular Picks Today
              </h2>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#8B9099' }}>
                Freshly prepared meals and snacks from our live canteen kitchen.
              </p>
            </div>

            <button
              id="view-all-menu-btn"
              type="button"
              onClick={handleExploreMenu}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#F28C45',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 0',
                transition: 'gap 0.2s',
              }}
            >
              <span>Explore Full Menu</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Food Cards Grid */}
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {[1, 2, 3, 4].map((n) => (
                <SkeletonCard key={n} />
              ))}
            </div>
          ) : error ? (
            <div
              className="card"
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#8B9099',
                borderRadius: 16,
              }}
            >
              <p style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#F5F5F5' }}>
                Explore all 16+ fresh canteen items on our interactive menu.
              </p>
              <button
                type="button"
                onClick={handleExploreMenu}
                className="btn-accent"
                style={{ borderRadius: 9999, border: 'none', cursor: 'pointer', padding: '10px 24px', fontWeight: 700 }}
              >
                Browse Full Menu
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {featuredItems.map((item) => {
                const cartItem = cartItems.find((i) => i._id === item._id);
                const qty = cartItem?.qty ?? 0;
                const isOOS = item.isOutOfStock || item.stockQuantity === 0;

                return (
                  <article
                    key={item._id}
                    className="card"
                    style={{
                      background: '#1D2025',
                      border: '1px solid #2E333B',
                      borderRadius: 18,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = 'rgba(242,140,69,0.4)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#2E333B';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Item Image */}
                    <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
                      <FoodImage
                        src={item.imageUrl}
                        alt={item.name}
                        width="100%"
                        height={180}
                        aspectRatio="16/10"
                        loading="lazy"
                        style={{ height: '100%', width: '100%' }}
                      />
                      {isOOS && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(17,18,20,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{
                              background: '#252A31',
                              color: '#8B9099',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '5px 12px',
                              borderRadius: 9999,
                              border: '1px solid #2E333B',
                            }}
                          >
                            Out of Stock
                          </span>
                        </div>
                      )}
                      {item.tags?.includes('bestseller') && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            background: '#F28C45',
                            color: '#fff',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            textTransform: 'uppercase',
                          }}
                        >
                          Bestseller
                        </span>
                      )}
                    </div>

                    {/* Item Details */}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={item.dietary === 'veg' ? 'badge-veg' : 'badge-nonveg'} />
                          <span style={{ fontSize: '0.75rem', color: '#8B9099', textTransform: 'capitalize' }}>
                            {item.category?.name || item.category || 'Special'}
                          </span>
                        </div>
                      </div>

                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.0625rem',
                          fontWeight: 700,
                          color: '#F5F5F5',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.name}
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.8125rem',
                          color: '#8B9099',
                          lineHeight: 1.5,
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.description || 'Freshly prepared at the campus canteen kitchen.'}
                      </p>

                      {/* Price & Add to Cart Action */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: 10,
                          borderTop: '1px solid #252A31',
                          marginTop: 6,
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.6875rem', color: '#8B9099', display: 'block' }}>Price</span>
                          <span style={{ fontSize: '1.1875rem', fontWeight: 800, color: '#F5F5F5' }}>
                            ₹{item.price}
                          </span>
                        </div>

                        {isAuthenticated && qty > 0 ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              background: '#252A31',
                              borderRadius: 9999,
                              padding: '4px 8px',
                              border: '1px solid #2E333B',
                            }}
                          >
                            <button
                              onClick={() => removeItem(item._id)}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'transparent',
                                border: 'none',
                                color: '#F28C45',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              aria-label="Remove one"
                            >
                              <Minus size={14} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F5F5F5', minWidth: 16, textAlign: 'center' }}>
                              {qty}
                            </span>
                            <button
                              onClick={() => addItem(item)}
                              disabled={isOOS || qty >= (item.stockQuantity ?? 99)}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: '#F28C45',
                                border: 'none',
                                color: '#fff',
                                cursor: isOOS || qty >= (item.stockQuantity ?? 99) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: isOOS || qty >= (item.stockQuantity ?? 99) ? 0.5 : 1,
                              }}
                              aria-label="Add one more"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            disabled={isOOS}
                            style={{
                              background: isOOS ? '#252A31' : '#F28C45',
                              color: isOOS ? '#8B9099' : '#FFFFFF',
                              border: 'none',
                              borderRadius: 9999,
                              padding: '7px 16px',
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              cursor: isOOS ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              transition: 'background 0.2s',
                            }}
                          >
                            <Plus size={14} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── How It Works Section ─────────────────────────────────────────── */}
        <section
          id="how-it-works"
          style={{
            padding: '5rem 1.5rem',
            background: '#14161A',
            borderTop: '1px solid #1D2025',
            borderBottom: '1px solid #1D2025',
          }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#F28C45',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Simple & Effortless
              </span>
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#F5F5F5',
                  letterSpacing: '-0.01em',
                }}
              >
                How QuickBite Works
              </h2>
              <p style={{ margin: '0 auto', fontSize: '0.9375rem', color: '#8B9099', maxWidth: 440 }}>
                Three simple steps between your craving and counter pickup.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
              }}
            >
              {/* Step 1 */}
              <div
                style={{
                  background: '#1D2025',
                  border: '1px solid #2E333B',
                  borderRadius: 20,
                  padding: '2.5rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: 'rgba(242,140,69,0.12)',
                      color: '#F28C45',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UtensilsCrossed size={22} />
                  </div>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2E333B', letterSpacing: '-1px' }}>
                    01
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F5F5F5' }}>
                  Explore Food
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: '#8B9099' }}>
                  Browse our live campus menu, vegetarian choices, and today's freshly grilled specials with verified pricing.
                </p>
              </div>

              {/* Step 2 */}
              <div
                style={{
                  background: '#1D2025',
                  border: '1px solid #2E333B',
                  borderRadius: 20,
                  padding: '2.5rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: 'rgba(242,140,69,0.12)',
                      color: '#F28C45',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShoppingBag size={22} />
                  </div>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2E333B', letterSpacing: '-1px' }}>
                    02
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F5F5F5' }}>
                  Place an Order
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: '#8B9099' }}>
                  Customize special notes, choose pay at counter or instant digital payment, and receive your pickup token.
                </p>
              </div>

              {/* Step 3 */}
              <div
                style={{
                  background: '#1D2025',
                  border: '1px solid #2E333B',
                  borderRadius: 20,
                  padding: '2.5rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: 'rgba(76,175,125,0.15)',
                      color: '#4CAF7D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={22} />
                  </div>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2E333B', letterSpacing: '-1px' }}>
                    03
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F5F5F5' }}>
                  Pick It Up
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: '#8B9099' }}>
                  Track preparation live on your screen and walk up to the counter to collect your fresh, hot food without waiting in line.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Final Call to Action ─────────────────────────────────────────── */}
        <section style={{ padding: '5rem 1.5rem', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <div
            style={{
              background: '#1D2025',
              border: '1px solid rgba(242, 140, 69, 0.3)',
              borderRadius: 26,
              padding: 'clamp(3rem, 5vw, 4.5rem) 2rem',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4.5vw, 2.75rem)',
                  fontWeight: 900,
                  color: '#F5F5F5',
                  margin: '0 0 1rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Your Next Favourite Meal Is Waiting.
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: '#8B9099',
                  margin: '0 0 2rem',
                }}
              >
                Skip the counter queue between classes. Browse today's live canteen specials and order ahead with your phone.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  id="cta-explore-menu-btn"
                  type="button"
                  onClick={handleExploreMenu}
                  style={{
                    background: '#F28C45',
                    color: '#fff',
                    borderRadius: 9999,
                    padding: '13px 34px',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 6px 20px rgba(242,140,69,0.35)',
                    transition: 'transform 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = '#E07A30';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = '#F28C45';
                  }}
                >
                  <span>Explore Menu</span>
                  <ArrowRight size={16} />
                </button>

                {!isAuthenticated && (
                  <Link
                    to="/register"
                    className="btn-ghost"
                    style={{
                      borderRadius: 9999,
                      padding: '13px 28px',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Create Account</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: '#0D0E10',
          borderTop: '1px solid #1D2025',
          padding: '3rem 1.5rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Col 1: Brand */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <Logo size="md" />
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.6, color: '#8B9099', maxWidth: 280 }}>
              The campus canteen pre-ordering platform. Designed for fast, effortless dining and counter pickup.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4
              style={{
                margin: '0 0 1rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#F5F5F5',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Explore
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <Link to="/" style={{ color: '#8B9099', textDecoration: 'none', fontSize: '0.8125rem' }}>
                Home
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/menu" style={{ color: '#8B9099', textDecoration: 'none', fontSize: '0.8125rem' }}>
                    Campus Menu
                  </Link>
                  <Link to="/orders" style={{ color: '#8B9099', textDecoration: 'none', fontSize: '0.8125rem' }}>
                    Order History
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" style={{ color: '#8B9099', textDecoration: 'none', fontSize: '0.8125rem' }}>
                    Sign In
                  </Link>
                  <Link to="/register" style={{ color: '#8B9099', textDecoration: 'none', fontSize: '0.8125rem' }}>
                    Create Account
                  </Link>
                </>
              )}
              <a href="/#how-it-works" style={{ color: '#8B9099', textDecoration: 'none', fontSize: '0.8125rem' }}>
                How It Works
              </a>
            </div>
          </div>

          {/* Col 3: Student Portal */}
          <div>
            <h4
              style={{
                margin: '0 0 1rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#F5F5F5',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Account
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {!isAuthenticated ? (
                <>
                  <Link to="/login" style={{ color: '#8B9099', textDecoration: 'none', fontSize: '0.8125rem' }}>
                    Sign In
                  </Link>
                  <Link to="/register" style={{ color: '#8B9099', textDecoration: 'none', fontSize: '0.8125rem' }}>
                    Student Registration
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/profile" style={{ color: '#8B9099', textDecoration: 'none', fontSize: '0.8125rem' }}>
                    Profile & Details
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" style={{ color: '#F28C45', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600 }}>
                      Admin Portal
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Col 4: Canteen Details */}
          <div>
            <h4
              style={{
                margin: '0 0 1rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#F5F5F5',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Campus Canteen
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#8B9099', fontSize: '0.8125rem' }}>
              <p style={{ margin: 0 }}>Central Dining Hall, Block B, Campus</p>
              <p style={{ margin: 0 }}>Mon – Sat • 8:00 AM – 8:00 PM</p>
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            paddingTop: '1.5rem',
            borderTop: '1px solid #1D2025',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            color: '#656972',
            fontSize: '0.75rem',
          }}
        >
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} QuickBite. All rights reserved.</p>
          <p style={{ margin: 0 }}>Zero counter waiting. Pre-order with instant pickup tokens.</p>
        </div>
      </footer>
    </div>
  );
}
