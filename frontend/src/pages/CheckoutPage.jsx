import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  apiCreateOrder,
  apiCreatePaymentOrder,
  apiVerifyPayment,
  apiCancelPayment,
} from '../api/client';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import FoodImage from '../components/common/FoodImage';
import {
  ShoppingBag,
  Clock,
  MapPin,
  AlertCircle,
  CreditCard,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('pay_at_pickup');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sandbox modal state when placeholder keys are used
  const [sandboxModal, setSandboxModal] = useState(null);

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            color: '#8B9099',
          }}
        >
          <ShoppingBag size={64} strokeWidth={1.2} style={{ marginBottom: '1rem', color: '#F28C45' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F5F5F5', margin: '0 0 0.5rem' }}>
            Your Cart is Empty
          </h1>
          <p style={{ margin: '0 0 1.5rem', maxWidth: 360, fontSize: '0.875rem' }}>
            Looks like you haven't added any items to your order yet.
          </p>
          <Link to="/menu" className="btn-accent" style={{ textDecoration: 'none', borderRadius: 10 }}>
            Browse Campus Menu
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const orderPayload = {
        items: items.map((i) => ({
          foodItemId: i._id,
          quantity: i.qty,
        })),
        paymentMethod,
        specialInstructions,
      };

      // 1. Create order and reserve inventory
      const orderRes = await apiCreateOrder(orderPayload);
      const order = orderRes.data;

      // 2. Flow: Pay at Pickup Counter
      if (paymentMethod === 'pay_at_pickup') {
        clearCart();
        toast.success('Order placed successfully! Pickup token generated. 🚀');
        navigate(`/orders/${order._id}`);
        return;
      }

      // 3. Flow: Razorpay Online Payment
      if (paymentMethod === 'razorpay') {
        // Initialize payment on backend
        const paymentData = await apiCreatePaymentOrder(order._id);

        const isRealKey =
          paymentData.keyId &&
          !paymentData.keyId.includes('sandbox_key') &&
          paymentData.keyId.startsWith('rzp_');

        if (!isRealKey) {
          // Placeholder sandbox keys in .env
          clearCart();
          setSandboxModal({
            order,
            paymentData,
          });
          setLoading(false);
          return;
        }

        // Real Razorpay test/production credentials detected
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
        }

        const options = {
          key: paymentData.keyId,
          amount: paymentData.amountInPaise,
          currency: 'INR',
          name: 'QuickBite Campus Canteen',
          description: `Order #${paymentData.orderNumber}`,
          order_id: paymentData.razorpayOrderId,
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: user?.phone || '',
          },
          theme: { color: '#F28C45' },
          handler: async function (response) {
            try {
              setLoading(true);
              await apiVerifyPayment({
                orderId: order._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                expectedAmount: paymentData.amount,
              });
              clearCart();
              toast.success('Payment verified successfully! 🎉');
              navigate(`/orders/${order._id}`);
            } catch (err) {
              toast.error(err.message || 'Payment signature verification failed.');
              navigate(`/orders/${order._id}`);
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              toast('Payment cancelled or dismissed.');
              clearCart();
              navigate(`/orders/${order._id}`);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
        });
        rzp.open();
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please review your cart.');
      toast.error(err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSandboxOrder = async () => {
    if (!sandboxModal) return;
    try {
      await apiCancelPayment({
        orderId: sandboxModal.order._id,
        reason: 'Payment cancelled during sandbox checkout.',
      });
      toast.success('Order cancelled and inventory restored.');
      setSandboxModal(null);
      navigate('/orders');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order.');
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#111214' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 1000, margin: '0 auto', width: '100%', padding: '2rem 1.5rem 6rem' }}>
        <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.75rem', fontWeight: 800, color: '#F5F5F5' }}>
          Checkout & Pickup
        </h1>

        {error && (
          <div
            className="animate-shake"
            style={{
              background: 'rgba(224,82,82,0.1)',
              border: '1px solid rgba(224,82,82,0.3)',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              color: '#E05252',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <AlertCircle size={20} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '2rem' }}>
          {/* Left Column: Pickup info & Payment Method */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Campus Pickup Card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <div
                  style={{
                    background: 'rgba(242,140,69,0.15)',
                    color: '#F28C45',
                    borderRadius: 10,
                    padding: 8,
                    display: 'flex',
                  }}
                >
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F5F5F5' }}>
                    Campus Canteen Pickup
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#8B9099' }}>
                    Direct counter pickup (No delivery)
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: '#252A31',
                  borderRadius: 10,
                  padding: '1rem',
                  border: '1px solid #2E333B',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#8B9099' }}>Pickup Location:</span>
                  <span style={{ color: '#F5F5F5', fontWeight: 600 }}>Main Canteen — Counter #2</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#8B9099' }}>Estimated Prep Time:</span>
                  <span style={{ color: '#4CAF7D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} /> ~15 minutes
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#8B9099' }}>Student Name:</span>
                  <span style={{ color: '#F5F5F5', fontWeight: 600 }}>{user?.name}</span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <label
                htmlFor="special-instructions"
                style={{ display: 'block', fontSize: '0.9375rem', fontWeight: 700, color: '#F5F5F5', marginBottom: '0.5rem' }}
              >
                Special Instructions (Optional)
              </label>
              <textarea
                id="special-instructions"
                rows={3}
                placeholder="e.g. extra napkins, keep spicy, no onions…"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                maxLength={300}
                style={{
                  width: '100%',
                  background: '#252A31',
                  border: '1px solid #2E333B',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: '#F5F5F5',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            {/* Payment Method Selector */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#F5F5F5', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} color="#F28C45" />
                <span>Select Payment Method</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Pay at Pickup Counter */}
                <div
                  onClick={() => setPaymentMethod('pay_at_pickup')}
                  style={{
                    background: paymentMethod === 'pay_at_pickup' ? 'rgba(242,140,69,0.08)' : '#252A31',
                    border: paymentMethod === 'pay_at_pickup' ? '1px solid #F28C45' : '1px solid #2E333B',
                    borderRadius: 12,
                    padding: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    id="pay-pickup"
                    name="payment"
                    checked={paymentMethod === 'pay_at_pickup'}
                    onChange={() => setPaymentMethod('pay_at_pickup')}
                    style={{ accentColor: '#F28C45', marginTop: 3 }}
                  />
                  <div>
                    <label htmlFor="pay-pickup" style={{ fontWeight: 700, color: '#F5F5F5', fontSize: '0.9375rem', display: 'block', cursor: 'pointer' }}>
                      Pay at Canteen Counter (Cash / UPI)
                    </label>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#8B9099', lineHeight: 1.4 }}>
                      Pay at pickup counter with cash or UPI QR code when collecting your order. Order is confirmed immediately.
                    </p>
                  </div>
                </div>

                {/* Razorpay Online Payment */}
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  style={{
                    background: paymentMethod === 'razorpay' ? 'rgba(242,140,69,0.08)' : '#252A31',
                    border: paymentMethod === 'razorpay' ? '1px solid #F28C45' : '1px solid #2E333B',
                    borderRadius: 12,
                    padding: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    id="pay-razorpay"
                    name="payment"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    style={{ accentColor: '#F28C45', marginTop: 3 }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label htmlFor="pay-razorpay" style={{ fontWeight: 700, color: '#F5F5F5', fontSize: '0.9375rem', display: 'block', cursor: 'pointer' }}>
                        Razorpay Online Gateway (UPI / Cards / NetBanking)
                      </label>
                      <span
                        style={{
                          background: '#4CAF7D18',
                          color: '#4CAF7D',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 6,
                        }}
                      >
                        Sandbox / Live
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#8B9099', lineHeight: 1.4 }}>
                      Pay instantly online using Razorpay payment gateway with server-side HMAC-SHA256 signature verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div>
            <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: 80 }}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 700, color: '#F5F5F5' }}>
                Order Summary ({totalItems} item{totalItems !== 1 ? 's' : ''})
              </h2>

              {/* Items Snapshot */}
              <div
                style={{
                  maxHeight: 280,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                  paddingRight: 4,
                }}
              >
                {items.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: '#252A31',
                      borderRadius: 10,
                      padding: '8px 10px',
                    }}
                  >
                    <FoodImage
                      item={item}
                      src={item.imageUrl || item.image || item.foodItem?.imageUrl}
                      alt={item.name}
                      thumbnail={true}
                      width={44}
                      height={44}
                      aspectRatio="1/1"
                      style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#8B9099' }}>
                        Qty: {item.qty} × ₹{item.sellingPrice}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F5F5F5' }}>
                      ₹{(item.sellingPrice * item.qty).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div style={{ borderTop: '1px solid #2E333B', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#8B9099' }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#F5F5F5', fontWeight: 600 }}>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#8B9099' }}>
                  <span>Campus Pickup Fee</span>
                  <span style={{ color: '#4CAF7D', fontWeight: 600 }}>FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#8B9099' }}>
                  <span>Taxes</span>
                  <span style={{ color: '#F5F5F5', fontWeight: 600 }}>Included</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #2E333B',
                    paddingTop: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F5F5F5' }}>Total to Pay</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F28C45' }}>
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="place-order-btn"
                onClick={handlePlaceOrder}
                disabled={loading}
                className="btn-accent"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  fontSize: '0.9375rem',
                  borderRadius: 12,
                  marginTop: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? (
                  <span>Processing order…</span>
                ) : (
                  <>
                    <span>{paymentMethod === 'razorpay' ? 'Proceed to Online Payment' : 'Confirm & Place Order'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Sandbox Info & Verification Notice Modal */}
      {sandboxModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 500,
              width: '100%',
              padding: '1.75rem',
              border: '1px solid #2E333B',
              borderRadius: 16,
              background: '#1D2025',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(242,140,69,0.15)', color: '#F28C45', padding: 8, borderRadius: 10 }}>
                <ShieldAlert size={22} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#F5F5F5' }}>
                Razorpay Sandbox Order Created
              </h2>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#8B9099', lineHeight: 1.5, margin: '0 0 1rem' }}>
              Your order has been reserved in <strong style={{ color: '#F5C542' }}>Pending Payment</strong> status.
              The backend generated gateway reference <code style={{ color: '#F28C45' }}>{sandboxModal.paymentData.razorpayOrderId}</code> for <strong style={{ color: '#F5F5F5' }}>₹{sandboxModal.paymentData.amount}</strong>.
            </p>

            <div
              style={{
                background: '#252A31',
                borderRadius: 10,
                padding: '0.875rem 1rem',
                border: '1px solid #2E333B',
                marginBottom: '1.25rem',
                fontSize: '0.8125rem',
                color: '#8B9099',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: '#F5F5F5', display: 'block', marginBottom: 4 }}>
                Testing Note (Gateway Credentials):
              </strong>
              External credentials (<code style={{ color: '#8B9EFF' }}>RAZORPAY_KEY_ID</code> and <code style={{ color: '#8B9EFF' }}>RAZORPAY_KEY_SECRET</code>) can be placed in <code style={{ color: '#8B9EFF' }}>backend/.env</code> for live checkout popup testing. In sandbox mode, automated backend test suites verify HMAC-SHA256 signatures and amount matching.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelSandboxOrder}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(224,82,82,0.4)',
                  color: '#E05252',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel & Release Stock
              </button>
              <button
                onClick={() => {
                  const oid = sandboxModal.order._id;
                  setSandboxModal(null);
                  navigate(`/orders/${oid}`);
                }}
                className="btn-accent"
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Track Order
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
