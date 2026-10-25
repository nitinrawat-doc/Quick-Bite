import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import FoodImage from '../common/FoodImage';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    addItem,
    removeItem,
    deleteItem,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();
  const drawerRef = useRef(null);
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeCart]);

  // Trap scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleProceedCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="overlay" onClick={closeCart} aria-hidden="true" />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className="animate-slide-right"
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(420px, 100vw)',
          background: '#1D2025',
          borderLeft: '1px solid #2E333B',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #2E333B',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={20} color="#F28C45" />
            <h2
              style={{
                margin: 0,
                fontSize: '1.0625rem',
                fontWeight: 700,
                color: '#F5F5F5',
              }}
            >
              Your Cart
            </h2>
            {totalItems > 0 && (
              <span
                style={{
                  background: '#F28C45',
                  color: '#fff',
                  borderRadius: 9999,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '1px 8px',
                }}
              >
                {totalItems}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8B9099',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  padding: '4px 8px',
                }}
                aria-label="Clear cart"
              >
                Clear all
              </button>
            )}
            <button
              id="cart-close-btn"
              onClick={closeCart}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8B9099',
                display: 'flex',
                padding: '4px',
              }}
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div
          style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '1rem 1.5rem',
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '1rem',
                color: '#8B9099',
              }}
            >
              <ShoppingBag size={56} strokeWidth={1.2} />
              <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 500 }}>
                Your cart is empty
              </p>
              <p style={{ margin: 0, fontSize: '0.8125rem' }}>
                Add some delicious items from the campus menu!
              </p>
              <button
                className="btn-accent"
                onClick={closeCart}
                style={{ marginTop: '0.5rem' }}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {items.map((item) => (
                <li
                  key={item._id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    background: '#252A31',
                    borderRadius: 12,
                    padding: '0.625rem',
                    border: '1px solid #2E333B',
                  }}
                >
                  <FoodImage
                    item={item}
                    src={item.imageUrl || item.image || item.foodItem?.imageUrl}
                    alt={item.name}
                    thumbnail={true}
                    width={60}
                    height={60}
                    aspectRatio="1/1"
                    style={{ width: 60, height: 60, borderRadius: 8, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: '0 0 2px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#F5F5F5',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.8125rem',
                        color: '#F28C45',
                        fontWeight: 700,
                      }}
                    >
                      ₹{(item.sellingPrice * item.qty).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => removeItem(item._id)}
                      style={{
                        background: 'rgba(242,140,69,0.1)',
                        border: '1px solid rgba(242,140,69,0.25)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#F28C45',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Decrease"
                    >
                      <Minus size={13} />
                    </button>
                    <span
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: '#F5F5F5',
                        minWidth: 18,
                        textAlign: 'center',
                      }}
                    >
                      {item.qty}
                    </span>
                    <button
                      onClick={() => addItem(item)}
                      style={{
                        background: 'rgba(242,140,69,0.1)',
                        border: '1px solid rgba(242,140,69,0.25)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#F28C45',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Increase"
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      onClick={() => deleteItem(item._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#E05252',
                        marginLeft: '4px',
                        display: 'flex',
                        padding: '2px',
                      }}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid #2E333B',
              flexShrink: 0,
              background: '#1D2025',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <span style={{ color: '#8B9099', fontSize: '0.875rem' }}>
                Estimated Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})
              </span>
              <span
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: '#F5F5F5',
                }}
              >
                ₹{totalPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              id="proceed-checkout-btn"
              className="btn-accent"
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '0.9375rem',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onClick={handleProceedCheckout}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
