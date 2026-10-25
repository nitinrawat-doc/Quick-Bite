import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMyOrders } from '../api/client';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import FoodImage from '../components/common/FoodImage';
import {
  PackageCheck,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F5C542', bg: 'rgba(245,197,66,0.1)', Icon: Clock },
  confirmed: { label: 'Confirmed', color: '#5B9BF5', bg: 'rgba(91,155,245,0.1)', Icon: CheckCircle },
  preparing: { label: 'Preparing', color: '#B37DFF', bg: 'rgba(179,125,255,0.1)', Icon: ChefHat },
  ready_for_pickup: { label: 'Ready for Pickup', color: '#4CAF7D', bg: 'rgba(76,175,125,0.15)', Icon: PackageCheck },
  completed: { label: 'Completed', color: '#8B9099', bg: 'rgba(139,144,153,0.1)', Icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: '#E05252', bg: 'rgba(224,82,82,0.1)', Icon: XCircle },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadOrders = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await fetchMyOrders(params);
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadOrders(1);
  }, [loadOrders]);

  const StatusChip = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.Icon;
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: config.bg,
          color: config.color,
          border: `1px solid ${config.color}30`,
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: '0.75rem',
          fontWeight: 700,
        }}
      >
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#111214' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 960, margin: '0 auto', width: '100%', padding: '2rem 1.5rem 6rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.75rem', fontWeight: 800, color: '#F5F5F5' }}>
              My Orders
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#8B9099' }}>
              Track past and active campus canteen orders
            </p>
          </div>

          <button
            onClick={() => loadOrders(pagination.page)}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', padding: '8px 12px', borderRadius: 8 }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter chips */}
        <div className="scroll-row" style={{ marginBottom: '1.5rem' }}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending' },
            { id: 'preparing', label: 'Preparing' },
            { id: 'ready_for_pickup', label: 'Ready for Pickup' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`chip ${statusFilter === tab.id ? 'chip-active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading state */}
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
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading orders…</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div
            className="card"
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#E05252',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <AlertCircle size={40} />
            <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{error}</p>
            <button className="btn-ghost" onClick={() => loadOrders(1)}>
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div
            className="card"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              color: '#8B9099',
            }}
          >
            <ShoppingBag size={56} strokeWidth={1.2} color="#F28C45" />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#F5F5F5' }}>
              No Orders Found
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', maxWidth: 360 }}>
              {statusFilter === 'all'
                ? "You haven't placed any canteen orders yet. Hungry? Check out the menu!"
                : `No orders matching filter "${statusFilter.replace(/_/g, ' ')}".`}
            </p>
            <Link to="/menu" className="btn-accent" style={{ textDecoration: 'none', borderRadius: 10, marginTop: 8 }}>
              Browse Canteen Menu
            </Link>
          </div>
        )}

        {/* Orders list */}
        {!loading && !error && orders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => {
              const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
              const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');

              return (
                <div
                  key={order._id}
                  className="card"
                  style={{
                    padding: '1.25rem 1.5rem',
                    transition: 'border-color 0.2s',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/orders/${order._id}`)}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F5F5F5' }}>
                          {order.orderId}
                        </span>
                        <span
                          style={{
                            background: 'rgba(242,140,69,0.15)',
                            color: '#F28C45',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}
                        >
                          Token #{order.pickupToken}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#8B9099' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <StatusChip status={order.orderStatus} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 1rem' }}>
                    {order.items && order.items.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {order.items.slice(0, 3).map((item, i) => (
                          <FoodImage
                            key={i}
                            item={item}
                            src={item.imageUrl || item.image || item.foodItem?.imageUrl}
                            alt={item.name}
                            thumbnail={true}
                            width={36}
                            height={36}
                            aspectRatio="1/1"
                            style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #2E333B' }}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 6,
                              background: '#252A31',
                              border: '1px solid #2E333B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#8B9099',
                            }}
                          >
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.8125rem',
                        color: '#8B9099',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {itemsSummary}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #2E333B',
                      paddingTop: '0.75rem',
                    }}
                  >
                    <span style={{ fontSize: '0.8125rem', color: '#8B9099' }}>
                      {itemCount} item{itemCount !== 1 ? 's' : ''} · {order.pickupCounter || 'Counter #2'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#F5F5F5' }}>
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#F28C45',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                        }}
                      >
                        Track <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '1rem' }}>
                <button
                  className="btn-ghost"
                  disabled={pagination.page <= 1}
                  onClick={() => loadOrders(pagination.page - 1)}
                  style={{ borderRadius: 8, padding: '6px 14px' }}
                >
                  Previous
                </button>
                <span style={{ color: '#8B9099', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="btn-ghost"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadOrders(pagination.page + 1)}
                  style={{ borderRadius: 8, padding: '6px 14px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
