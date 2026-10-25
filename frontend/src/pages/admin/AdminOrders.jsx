import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChefHat,
  PackageCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  AlertCircle,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../api/client';
import FoodImage from '../../components/common/FoodImage';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending: { Icon: Clock, color: '#F5C542', bg: 'rgba(245,197,66,0.1)', next: 'confirmed', nextLabel: 'Confirm Order' },
  confirmed: { Icon: CheckCircle, color: '#5B9BF5', bg: 'rgba(91,155,245,0.1)', next: 'preparing', nextLabel: 'Start Cooking' },
  preparing: { Icon: ChefHat, color: '#F28C45', bg: 'rgba(242,140,69,0.1)', next: 'ready_for_pickup', nextLabel: 'Mark Ready' },
  ready_for_pickup: { Icon: PackageCheck, color: '#4CAF7D', bg: 'rgba(76,175,125,0.15)', next: 'completed', nextLabel: 'Complete Pickup' },
  completed: { Icon: CheckCircle, color: '#8B9099', bg: 'rgba(139,144,153,0.1)', next: null },
  cancelled: { Icon: XCircle, color: '#E05252', bg: 'rgba(224,82,82,0.1)', next: null },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        params.startDate = todayStr;
        params.endDate = todayStr;
      } else if (dateFilter === '7days') {
        const past = new Date();
        past.setDate(past.getDate() - 7);
        params.startDate = past.toISOString().split('T')[0];
      } else if (dateFilter === 'custom' && customDate) {
        params.startDate = customDate;
        params.endDate = customDate;
      }

      const data = await fetchAdminOrders(params);
      setOrders(data.orders || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load canteen orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, dateFilter, customDate]);

  useEffect(() => {
    loadOrders();
    // Auto refresh every 10 seconds for real-time kitchen display
    const timer = setInterval(() => {
      loadOrders();
    }, 10000);
    return () => clearInterval(timer);
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId, targetStatus, reason) => {
    setActionLoading(true);
    try {
      await updateAdminOrderStatus(orderId, targetStatus, '', reason);
      toast.success(`Order moved to ${targetStatus.replace(/_/g, ' ')}!`);
      loadOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, orderStatus: targetStatus }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1240 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.625rem', fontWeight: 800, color: '#F5F5F5' }}>
            Kitchen & Order Management
          </h1>
          <p style={{ margin: 0, color: '#8B9099', fontSize: '0.875rem' }}>
            Accept, prepare, and complete campus student orders with valid status transitions.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', padding: '8px 14px', borderRadius: 8 }}
        >
          <RefreshCw size={14} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter Chips & Search */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="scroll-row" style={{ flex: 1 }}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'preparing', label: 'Preparing' },
            { id: 'ready_for_pickup', label: 'Ready for Pickup' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((s) => (
            <button
              key={s.id}
              className={`chip ${statusFilter === s.id ? 'chip-active' : ''}`}
              onClick={() => setStatusFilter(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Date Filter & Search */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              background: '#1D2025',
              border: '1px solid #2E333B',
              borderRadius: 8,
              padding: '7px 10px',
              color: '#F5F5F5',
              fontSize: '0.8125rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7days">Past 7 Days</option>
            <option value="custom">Specific Date</option>
          </select>

          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              style={{
                background: '#1D2025',
                border: '1px solid #2E333B',
                borderRadius: 8,
                padding: '5px 8px',
                color: '#F5F5F5',
                fontSize: '0.8125rem',
                outline: 'none',
              }}
            />
          )}

          <div style={{ position: 'relative', width: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8B9099' }} />
            <input
              placeholder="Search order or token…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: '#1D2025',
                border: '1px solid #2E333B',
                borderRadius: 8,
                padding: '7px 10px 7px 30px',
                color: '#F5F5F5',
                fontSize: '0.8125rem',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading && orders.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#8B9099' }}>
          <p>Loading orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#8B9099' }}>
          <p style={{ margin: 0 }}>No orders matching the selected status or query.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {orders.map((ord) => {
            const config = STATUS_CONFIG[ord.orderStatus] || STATUS_CONFIG.pending;
            const Icon = config.Icon;
            const itemsSummary = ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');

            return (
              <div
                key={ord._id}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  flexWrap: 'wrap',
                  borderLeft: `4px solid ${config.color}`,
                }}
              >
                {/* Order token & ID */}
                <div style={{ minWidth: 120 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#F28C45' }}>
                      #{ord.pickupToken}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#8B9099', background: '#252A31', padding: '1px 6px', borderRadius: 4 }}>
                      {ord.orderId}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#8B9099', marginTop: 2, display: 'block' }}>
                    {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Student details & items */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F5F5F5' }}>
                      {ord.user?.name || 'Student'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#8B9099' }}>
                      ({ord.user?.email})
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#8B9099', maxWidth: 450, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {itemsSummary}
                  </p>
                  {ord.specialInstructions && (
                    <span style={{ fontSize: '0.6875rem', color: '#F5C542', fontStyle: 'italic', display: 'block', marginTop: 2 }}>
                      Note: "{ord.specialInstructions}"
                    </span>
                  )}
                </div>

                {/* Amount & Payment Info */}
                <div style={{ textAlign: 'right', minWidth: 100 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F5F5F5', display: 'block' }}>
                    ₹{ord.totalAmount}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: ord.paymentStatus === 'completed' ? '#4CAF7D' : ord.paymentStatus === 'refunded' ? '#E05252' : '#F5C542',
                      textTransform: 'capitalize',
                    }}
                  >
                    {ord.paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash/UPI'} · {ord.paymentStatus}
                  </span>
                </div>

                {/* Status Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: config.bg,
                    border: `1px solid ${config.color}35`,
                    borderRadius: 20,
                    padding: '4px 12px',
                    color: config.color,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                  }}
                >
                  <Icon size={13} />
                  <span>{ord.orderStatus.replace(/_/g, ' ')}</span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {config.next && (
                    <button
                      onClick={() => handleUpdateStatus(ord._id, config.next)}
                      disabled={actionLoading}
                      className="btn-accent"
                      style={{ padding: '6px 14px', fontSize: '0.8125rem', borderRadius: 8 }}
                    >
                      {config.nextLabel}
                    </button>
                  )}

                  {ord.orderStatus !== 'completed' && ord.orderStatus !== 'cancelled' && (
                    <button
                      onClick={() => {
                        const reason = window.prompt('Reason for cancellation (stock will be restored):', 'Canteen staff cancellation');
                        if (reason) handleUpdateStatus(ord._id, 'cancelled', reason);
                      }}
                      disabled={actionLoading}
                      style={{
                        background: 'rgba(224,82,82,0.1)',
                        color: '#E05252',
                        border: '1px solid rgba(224,82,82,0.25)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOrder(ord)}
                    className="btn-ghost"
                    style={{ padding: '6px', borderRadius: 6 }}
                    title="View details"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-scale-up" style={{ width: '100%', maxWidth: 520, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#F28C45', fontWeight: 700, textTransform: 'uppercase' }}>
                  Token #{selectedOrder.pickupToken}
                </span>
                <h2 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#F5F5F5' }}>
                  {selectedOrder.orderId}
                </h2>
                <span style={{ fontSize: '0.8125rem', color: '#8B9099' }}>
                  Ordered by {selectedOrder.user?.name} ({selectedOrder.user?.phone || 'No phone'})
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="btn-ghost" style={{ padding: 4 }}>
                <XCircle size={20} />
              </button>
            </div>

            {/* Items list */}
            <div style={{ borderTop: '1px solid #2E333B', borderBottom: '1px solid #2E333B', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <FoodImage
                      item={item}
                      src={item.imageUrl || item.image || item.foodItem?.imageUrl}
                      alt={item.name}
                      thumbnail={true}
                      width={36}
                      height={36}
                      aspectRatio="1/1"
                      style={{ width: 36, height: 36, borderRadius: 6, flexShrink: 0 }}
                    />
                    <span style={{ color: '#F5F5F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.quantity} × {item.name}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#F28C45', flexShrink: 0 }}>
                    ₹{item.subtotal}
                  </span>
                </div>
              ))}
            </div>

            {/* Status History */}
            <div style={{ marginTop: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8B9099', textTransform: 'uppercase' }}>
                Status History Audit Trail
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6, maxHeight: 120, overflowY: 'auto' }}>
                {selectedOrder.statusHistory?.map((hist, i) => (
                  <div key={i} style={{ fontSize: '0.75rem', color: '#8B9099', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ textTransform: 'capitalize', color: '#F5F5F5' }}>• {hist.status}: {hist.note}</span>
                    <span>{new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-accent" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
