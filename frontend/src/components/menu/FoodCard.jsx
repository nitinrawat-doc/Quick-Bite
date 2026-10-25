import { useCart } from '../../context/CartContext';
import FoodImage from '../common/FoodImage';
import { Plus, Minus, Clock, Star } from 'lucide-react';

export default function FoodCard({ item }) {
  const { items, addItem, removeItem } = useCart();
  const cartItem = items.find((i) => i._id === item._id);
  const qty = cartItem?.qty ?? 0;

  const isOOS = item.isOutOfStock || item.stockQuantity === 0;

  return (
    <article
      className="card animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative' }}>
        <FoodImage
          src={item.imageUrl}
          alt={item.name}
          width="100%"
          height={180}
          aspectRatio="16/10"
          loading="lazy"
          style={{ width: '100%', height: 180, display: 'block' }}
        />
        {isOOS && (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(17,18,20,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{
              color: '#8B9099', fontWeight: 600, fontSize: '0.8125rem',
              background: 'rgba(17,18,20,0.9)', padding: '6px 14px', borderRadius: 9999,
              border: '1px solid #2E333B',
            }}>Out of Stock</span>
          </div>
        )}
        {item.tags?.includes('bestseller') && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: '#F28C45', color: '#fff', fontSize: '0.6875rem',
            fontWeight: 700, padding: '3px 10px', borderRadius: 9999,
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>Bestseller</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0.875rem 1rem 1rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.5rem' }}>
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <div className={item.isVeg ? 'badge-veg' : 'badge-nonveg'} style={{ marginTop: 3, flexShrink: 0 }} />
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#F5F5F5', lineHeight: 1.3 }}>
            {item.name}
          </h3>
        </div>

        {/* Description */}
        <p style={{
          margin: 0, fontSize: '0.78125rem', color: '#8B9099', lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {item.description}
        </p>

        {/* Meta */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
          {item.rating > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', color: '#F28C45' }}>
              <Star size={11} fill="#F28C45" /> {item.rating.toFixed(1)}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', color: '#8B9099' }}>
            <Clock size={11} /> {item.preparationTimeMinutes} min
          </span>
        </div>

        {/* Price + Cart */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem' }}>
          <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#F5F5F5' }}>
            ₹{item.sellingPrice}
          </span>

          {isOOS ? (
            <button className="btn-ghost" disabled style={{ fontSize: '0.8125rem', padding: '6px 14px' }}>
              Unavailable
            </button>
          ) : qty === 0 ? (
            <button
              id={`add-${item._id}`}
              className="btn-accent"
              style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
              onClick={() => addItem(item)}
              aria-label={`Add ${item.name} to cart`}
            >
              <Plus size={14} /> Add
            </button>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(242,140,69,0.12)', border: '1px solid rgba(242,140,69,0.3)',
              borderRadius: 10, padding: '4px 6px',
            }}>
              <button
                onClick={() => removeItem(item._id)}
                aria-label="Decrease quantity"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#F28C45', display: 'flex', padding: '2px',
                }}
              >
                <Minus size={15} />
              </button>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#F28C45', minWidth: 18, textAlign: 'center' }}>
                {qty}
              </span>
              <button
                onClick={() => addItem(item)}
                aria-label="Increase quantity"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#F28C45', display: 'flex', padding: '2px',
                }}
              >
                <Plus size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
