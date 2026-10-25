import { useState, useEffect, useCallback } from 'react';
import { fetchMenu } from '../api/client';
import FoodCard from '../components/menu/FoodCard';
import SkeletonCard from '../components/common/SkeletonCard';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import CartDrawer from '../components/cart/CartDrawer';
import { useCart } from '../context/CartContext';
import { AlertCircle, Search } from 'lucide-react';

// Debounce hook
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function MenuPage() {
  const [menuData, setMenuData] = useState({ categories: [], foodItems: [] });
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { totalItems, totalPrice, openCart } = useCart();

  const debouncedSearch = useDebounce(searchQuery);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (activeCategory !== 'all') params.category = activeCategory;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const data = await fetchMenu(params);
      setMenuData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedSearch]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const handleCategoryClick = (slug) => setActiveCategory(slug);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onSearch={setSearchQuery} />
      <CartDrawer />

      <main style={{ flex: 1, maxWidth: 1280, margin: '0 auto', width: '100%', padding: '0 1.5rem 6rem' }}>

        {/* Welcome Hero */}
        <section style={{ padding: '2rem 0 1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(242,140,69,0.1) 0%, rgba(242,140,69,0.03) 100%)',
            border: '1px solid rgba(242,140,69,0.18)',
            borderRadius: 20,
            padding: '2rem',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(242,140,69,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(242,140,69,0.04)', pointerEvents: 'none' }} />

            <p style={{ margin: '0 0 4px', fontSize: '0.8125rem', color: '#F28C45', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              🎓 Campus Canteen
            </p>
            <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: '#F5F5F5', lineHeight: 1.2 }}>
              What are you craving<br/>
              <span style={{ color: '#F28C45' }}>today?</span>
            </h1>
            <p style={{ margin: 0, color: '#8B9099', fontSize: '0.9375rem' }}>
              Fresh food, fast delivery — right to your table.
            </p>
          </div>
        </section>

        {/* Category chips */}
        <section style={{ marginBottom: '1.5rem' }} aria-label="Food categories">
          <div className="scroll-row">
            <button
              className={`chip ${activeCategory === 'all' ? 'chip-active' : ''}`}
              onClick={() => handleCategoryClick('all')}
              aria-pressed={activeCategory === 'all'}
            >
              🍽️ All
            </button>
            {menuData.categories.map((cat) => (
              <button
                key={cat._id}
                className={`chip ${activeCategory === cat.slug ? 'chip-active' : ''}`}
                onClick={() => handleCategoryClick(cat.slug)}
                aria-pressed={activeCategory === cat.slug}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#F5F5F5' }}>
            {debouncedSearch
              ? `Results for "${debouncedSearch}"`
              : activeCategory === 'all'
              ? 'All Items'
              : menuData.categories.find((c) => c.slug === activeCategory)?.name || 'Menu'}
          </h2>
          {!loading && (
            <span style={{ fontSize: '0.8125rem', color: '#8B9099' }}>
              {menuData.foodItems.length} item{menuData.foodItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 300, gap: '1rem', color: '#E05252', textAlign: 'center',
          }}>
            <AlertCircle size={48} strokeWidth={1.2} />
            <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Failed to load menu</p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#8B9099' }}>{error}</p>
            <button className="btn-ghost" onClick={loadMenu} style={{ marginTop: '0.5rem' }}>
              Try Again
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: '1.25rem',
          }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && menuData.foodItems.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 300, gap: '1rem', color: '#8B9099', textAlign: 'center',
          }}>
            <Search size={48} strokeWidth={1.2} />
            <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#F5F5F5' }}>No items found</p>
            <p style={{ margin: 0, fontSize: '0.8125rem' }}>
              {debouncedSearch ? `No results for "${debouncedSearch}"` : 'No items in this category yet.'}
            </p>
            {debouncedSearch && (
              <button className="btn-ghost" onClick={() => setSearchQuery('')} style={{ marginTop: '0.5rem' }}>
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Food grid */}
        {!loading && !error && menuData.foodItems.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: '1.25rem',
          }}>
            {menuData.foodItems.map((item) => (
              <FoodCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Floating cart button (mobile, when cart has items) */}
      {totalItems > 0 && (
        <div
          className="sm:hidden"
          style={{
            position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)',
            zIndex: 25,
          }}
        >
          <button
            className="btn-accent animate-slide-up"
            onClick={openCart}
            style={{ borderRadius: 9999, padding: '0.75rem 1.75rem', boxShadow: '0 8px 32px rgba(242,140,69,0.4)', fontSize: '0.9375rem' }}
          >
            🛒 View Cart ({totalItems}) · ₹{totalPrice.toLocaleString('en-IN')}
          </button>
        </div>
      )}
    </div>
  );
}
