import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchOrderDetails, apiCancelOrder } from '../api/client';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import FoodImage from '../components/common/FoodImage';
import {
  CheckCircle,
  Clock,
  MapPin,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChefHat,
  PackageCheck,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock, desc: 'Awaiting canteen counter' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, desc: 'Canteen accepted' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, desc: 'Kitchen is cooking' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: PackageCheck, desc: 'Head to Counter #2' },
  { key: 'completed', label: 'Collected', icon: CheckCircle, desc: 'Enjoy your meal!' },
];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');

  const loadOrder = useCallback(
    async (isPolling = false) => {
      try {
        if (!isPolling) setLoading(true);
        const data = await fetchOrderDetails(id);
        setOrder(data);
        setError(null);
      } catch (err) {
        if (!isPolling) setError(err.message || 'Failed to load order');
      } finally {
        if (!isPolling) setLoading(false);
      }
    },
    [id]
  );

  // Initial load
  useEffect(() => {
    loadOrder(false);
  }, [loadOrder]);

  // Polling every 6 seconds while on this tracking page unless order is completed or cancelled
  useEffect(() => {
    if (!order) return;
    if (order.orderStatus === 'completed' || order.orderStatus === 'cancelled') {
      return;
    }

    const interval = setInterval(() => {
      loadOrder(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [order, loadOrder]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await apiCancelOrder(order._id, cancelReason);
      setOrder(res.data);
      setShowCancelModal(false);
      toast.success('Order cancelled and inventory restored');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStepIndex = (status) => {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  const currentStepIndex = order ? getStepIndex(order.orderStatus) : -1;
  const isCancelled = order?.orderStatus === 'cancelled';
  const canCancel =
    order && (order.orderStatus === 'pending' || order.orderStatus === 'confirmed');

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#111214' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 840, margin: '0 auto', width: '100%', padding: '2rem 1.5rem 6rem' }}>
        {/* Top bar back link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('/orders')}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', padding: '6px 12px' }}
          >
            <ChevronLeft size={18} />
            <span>All Orders</span>
          </button>
          <button
            onClick={() => loadOrder(false)}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', padding: '6px 12px' }}
            title="Refresh order status"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#8B9099' }}>
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
            <p>Loading order details…</p>
          </div>
        )}

        {error && (
          <div
            className="card"
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              color: '#E05252',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <AlertCircle size={48} strokeWidth={1.5} />
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Unable to load order</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#8B9099' }}>{error}</p>
            <Link to="/orders" className="btn-accent" style={{ textDecoration: 'none', borderRadius: 8, marginTop: 8 }}>
              View My Orders
            </Link>
          </div>
        )}

        {!loading && !error && order && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header Card with Pickup Token */}
            <div
              className="card animate-fade-in"
              style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, #1D2025 0%, #252A31 100%)',
                border: '1px solid rgba(242,140,69,0.2)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#F28C45',
                    }}
                  >
                    Campus Pickup Order
                  </span>
                  <h1 style={{ margin: '4px 0 0', fontSize: '1.375rem', fontWeight: 800, color: '#F5F5F5' }}>
                    {order.orderId}
                  </h1>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#8B9099' }}>
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Big Pickup Token Badge */}
                <div
                  style={{
                    background: 'rgba(242,140,69,0.12)',
                    border: '1.5px solid #F28C45',
                    borderRadius: 16,
                    padding: '0.75rem 1.5rem',
                    textAlign: 'center',
                    minWidth: 140,
                  }}
                >
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#8B9099', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>
                    Pickup Token
                  </span>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#F28C45', lineHeight: 1.1 }}>
                    #{order.pickupToken}
                  </span>
                </div>
              </div>

              {/* Counter Pickup Instructions */}
              <div
                style={{
                  background: '#181A1F',
                  borderRadius: 12,
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: '1px solid #2E333B',
                }}
              >
                <div style={{ background: 'rgba(76,175,125,0.15)', color: '#4CAF7D', borderRadius: 8, padding: 8, display: 'flex' }}>
                  <MapPin size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#F5F5F5' }}>
                    {order.pickupCounter || 'Main Canteen Counter #2'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#8B9099' }}>
                    Show Token #{order.pickupToken} to the staff to collect your items.
                  </p>
                </div>
              </div>
            </div>

            {/* Status Timeline / Cancelled Banner */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F5F5F5' }}>
                  Live Order Status
                </h2>
                {!isCancelled && order.orderStatus !== 'completed' && (
                  <span style={{ fontSize: '0.75rem', color: '#4CAF7D', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF7D', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                    Live polling active
                  </span>
                )}
              </div>

              {isCancelled ? (
                <div
                  style={{
                    background: 'rgba(224,82,82,0.1)',
                    border: '1px solid rgba(224,82,82,0.3)',
                    borderRadius: 12,
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    color: '#E05252',
                  }}
                >
                  <XCircle size={28} flexShrink={0} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>This order has been cancelled</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#8B9099' }}>
                      Reason: {order.cancellationReason || 'Cancelled by student'}. Reserved food stock has been restored.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Stepper Bar (Horizontal on desktop) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: 8,
                      position: 'relative',
                    }}
                  >
                    {STATUS_STEPS.map((step, idx) => {
                      const isPast = idx < currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      const StepIcon = step.icon;

                      return (
                        <div
                          key={step.key}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isCurrent
                                ? '#F28C45'
                                : isPast
                                ? '#4CAF7D'
                                : '#252A31',
                              color: isCurrent || isPast ? '#FFFFFF' : '#8B9099',
                              border: isCurrent
                                ? '2px solid #F5F5F5'
                                : isPast
                                ? '2px solid #4CAF7D'
                                : '1px solid #2E333B',
                              boxShadow: isCurrent ? '0 0 16px rgba(242,140,69,0.5)' : 'none',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <StepIcon size={18} />
                          </div>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: isCurrent ? 700 : 500,
                              color: isCurrent ? '#F28C45' : isPast ? '#F5F5F5' : '#8B9099',
                            }}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current Status Description Card */}
                  <div
                    style={{
                      marginTop: '0.75rem',
                      background: '#252A31',
                      borderRadius: 10,
                      padding: '1rem',
                      border: '1px solid #2E333B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#8B9099', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Current Progress
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '0.9375rem', fontWeight: 700, color: '#F5F5F5' }}>
                        {STATUS_STEPS[currentStepIndex]?.label || order.orderStatus}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#8B9099' }}>
                        {STATUS_STEPS[currentStepIndex]?.desc}
                      </p>
                    </div>

                    {canCancel && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        style={{
                          background: 'rgba(224,82,82,0.1)',
                          color: '#E05252',
                          border: '1px solid rgba(224,82,82,0.25)',
                          borderRadius: 8,
                          padding: '6px 14px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order Items Snapshot */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#F5F5F5' }}>
                Items in This Order ({order.items.length})
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: '#252A31',
                      borderRadius: 10,
                      padding: '10px 12px',
                      border: '1px solid #2E333B',
                    }}
                  >
                    <FoodImage
                      item={item}
                      src={item.imageUrl || item.image || item.foodItem?.imageUrl}
                      alt={item.name}
                      thumbnail={true}
                      width={48}
                      height={48}
                      aspectRatio="1/1"
                      style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#F5F5F5' }}>
                        {item.name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#8B9099' }}>
                        {item.quantity} × ₹{item.unitPrice}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#F5F5F5' }}>
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div style={{ borderTop: '1px solid #2E333B', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#8B9099' }}>
                  <span>Payment Method</span>
                  <span style={{ color: '#F5F5F5', fontWeight: 600, textTransform: 'capitalize' }}>
                    {order.paymentMethod.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#8B9099' }}>
                  <span>Payment Status</span>
                  <span style={{ color: order.paymentStatus === 'completed' ? '#4CAF7D' : '#F5C542', fontWeight: 600, textTransform: 'capitalize' }}>
                    {order.paymentStatus} (Pay at counter)
                  </span>
                </div>
                {order.specialInstructions && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#8B9099' }}>
                    <span>Special Notes</span>
                    <span style={{ color: '#F5F5F5' }}>{order.specialInstructions}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #2E333B',
                    paddingTop: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F5F5F5' }}>Grand Total</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F28C45' }}>
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div
              className="card animate-scale-up"
              style={{
                width: '100%',
                maxWidth: 400,
                padding: '2rem',
                border: '1px solid #2E333B',
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 800, color: '#F5F5F5' }}>
                Cancel Order #{order?.pickupToken}?
              </h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: '#8B9099' }}>
                Are you sure you want to cancel this order? Reserved canteen food items will be returned to inventory.
              </p>

              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: '0.375rem' }}>
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  background: '#252A31',
                  border: '1px solid #2E333B',
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: '#F5F5F5',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem',
                  outline: 'none',
                }}
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Taking too long">Taking too long</option>
                <option value="Leaving campus">Leaving campus</option>
              </select>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  style={{ borderRadius: 8 }}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  style={{
                    background: '#E05252',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cancelling ? 'Cancelling…' : 'Yes, Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
