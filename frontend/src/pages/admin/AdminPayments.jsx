import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { fetchAdminPayments, processAdminRefund } from '../../api/client';
import toast from 'react-hot-toast';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [refundModalPayment, setRefundModalPayment] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Customer complaint / cancellation');
  const [refunding, setRefunding] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (methodFilter !== 'all') params.paymentMethod = methodFilter;
      const data = await fetchAdminPayments(params);
      setPayments(data.payments || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load payment records');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleOpenRefundModal = (payment) => {
    setRefundModalPayment(payment);
    setRefundAmount(payment.amount);
    setRefundReason('Customer cancellation request');
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!refundModalPayment) return;

    setRefunding(true);
    try {
      const res = await processAdminRefund(refundModalPayment._id, {
        refundAmount: Number(refundAmount),
        reason: refundReason,
      });
      toast.success(res.message || 'Refund processed successfully');
      setRefundModalPayment(null);
      loadPayments();
    } catch (err) {
      toast.error(err.message || 'Failed to process refund');
    } finally {
      setRefunding(false);
    }
  };

  const StatusChip = ({ status }) => {
    const config = {
      completed: { label: 'Completed', color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)', Icon: CheckCircle },
      pending: { label: 'Pending', color: '#F5C542', bg: 'rgba(245,197,66,0.12)', Icon: Clock },
      failed: { label: 'Failed', color: '#E05252', bg: 'rgba(224,82,82,0.12)', Icon: XCircle },
      refunded: { label: 'Refunded', color: '#B37DFF', bg: 'rgba(179,125,255,0.12)', Icon: RotateCcw },
    }[status] || { label: status, color: '#8B9099', bg: 'rgba(139,144,153,0.1)', Icon: Clock };

    const Icon = config.Icon;
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: config.bg,
          color: config.color,
          border: `1px solid ${config.color}35`,
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'capitalize',
        }}
      >
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1240 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.625rem', fontWeight: 800, color: '#F5F5F5' }}>
            Payment Records & Refunds
          </h1>
          <p style={{ margin: 0, color: '#8B9099', fontSize: '0.875rem' }}>
            View verified Razorpay transactions, counter payments, and process customer refunds.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', padding: '8px 14px', borderRadius: 8 }}
        >
          <RefreshCw size={14} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="scroll-row" style={{ flex: 1 }}>
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'completed', label: 'Completed' },
            { id: 'pending', label: 'Pending' },
            { id: 'refunded', label: 'Refunded' },
            { id: 'failed', label: 'Failed' },
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

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          style={{
            background: '#1D2025',
            border: '1px solid #2E333B',
            borderRadius: 8,
            padding: '7px 12px',
            color: '#F5F5F5',
            fontSize: '0.8125rem',
            outline: 'none',
          }}
        >
          <option value="all">All Payment Methods</option>
          <option value="razorpay">Razorpay Online</option>
          <option value="pay_at_pickup">Pay at Pickup Counter</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8B9099' }}>
            <p>Loading payment records…</p>
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8B9099' }}>
            <p style={{ margin: 0 }}>No payment transactions found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2E333B', background: '#252A31' }}>
                  {['Date / Time', 'Order ID', 'Student', 'Amount', 'Payment Method', 'Gateway / Txn ID', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#8B9099' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr key={p._id} style={{ borderBottom: idx < payments.length - 1 ? '1px solid #2E333B' : 'none' }}>
                    <td style={{ padding: '12px 14px', fontSize: '0.75rem', color: '#8B9099', whiteSpace: 'nowrap' }}>
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8125rem', fontWeight: 700, color: '#F28C45', whiteSpace: 'nowrap' }}>
                      {p.order?.orderId || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', display: 'block' }}>
                        {p.user?.name || 'Student'}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#8B9099' }}>
                        {p.user?.email}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.875rem', fontWeight: 800, color: '#F5F5F5', whiteSpace: 'nowrap' }}>
                      ₹{p.amount}
                      {p.refundAmount > 0 && (
                        <span style={{ fontSize: '0.6875rem', color: '#E05252', display: 'block' }}>
                          (Refunded: ₹{p.refundAmount})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8125rem', color: '#8B9099', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                      {p.paymentMethod === 'razorpay' ? '💳 Razorpay Online' : '💵 Counter Cash/UPI'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.75rem', color: '#8B9099', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.razorpayPaymentId || p.transactionId || 'Counter Transaction'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <StatusChip status={p.paymentStatus} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {p.paymentStatus === 'completed' && (
                        <button
                          onClick={() => handleOpenRefundModal(p)}
                          className="btn-ghost"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            borderRadius: 6,
                            color: '#E05252',
                          }}
                        >
                          <RotateCcw size={12} />
                          <span>Refund</span>
                        </button>
                      )}
                      {p.refundStatus === 'processed' && (
                        <span style={{ fontSize: '0.6875rem', color: '#B37DFF', fontWeight: 600 }}>
                          Refund #{p.refundId?.slice(-6)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundModalPayment && (
        <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-scale-up" style={{ width: '100%', maxWidth: 440, padding: '2rem' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#F5F5F5' }}>
              Issue Customer Refund
            </h2>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.8125rem', color: '#8B9099' }}>
              Order {refundModalPayment.order?.orderId} · Original Captured: ₹{refundModalPayment.amount}
            </p>

            <form onSubmit={handleProcessRefund} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                  Refund Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={refundModalPayment.amount}
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                  Refund Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Canteen item out of stock, customer cancellation…"
                  style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.8125rem' }}
                />
              </div>

              <div
                style={{
                  background: 'rgba(242,140,69,0.08)',
                  border: '1px solid rgba(242,140,69,0.2)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  color: '#F28C45',
                }}
              >
                ⚠️ Note: Refunding will mark this order as cancelled and restore reserved inventory if not already completed.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-ghost" onClick={() => setRefundModalPayment(null)} disabled={refunding}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refunding}
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
                  {refunding ? 'Processing Refund…' : `Confirm Refund ₹${refundAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
