import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  UtensilsCrossed,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChefHat,
  ArrowRight,
  RefreshCw,
  Users,
} from 'lucide-react';
import { fetchAdminAnalytics, fetchAdminOrders } from '../../api/client';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, ordersData] = await Promise.all([
        fetchAdminAnalytics({ range: 'today' }),
        fetchAdminOrders({ limit: 6 }),
      ]);
      setAnalytics(analyticsData);
      setRecentOrders(ordersData.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#8B9099' }}>
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
        <p>Loading real-time canteen metrics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#E05252' }}>
          <AlertTriangle size={40} style={{ margin: '0 auto 12px' }} />
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Failed to load dashboard</h2>
          <p style={{ margin: '8px 0 16px', color: '#8B9099' }}>{error}</p>
          <button className="btn-accent" onClick={loadDashboardData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const statusCounts = analytics?.statusCounts || {};
  const activeOrders = (statusCounts.pending || 0) + (statusCounts.preparing || 0) + (statusCounts.confirmed || 0);
  const lowStockCount = analytics?.inventoryOverview?.lowStockItems || 0;
  const bestSellers = analytics?.bestSellingItems || [];

  const statCards = [
    {
      label: 'Total Orders',
      value: (summary.totalLifetimeOrders ?? summary.totalOrders ?? 0).toLocaleString('en-IN'),
      sub: 'All-time canteen orders',
      Icon: ShoppingBag,
      color: '#5B9BF5',
      bg: 'rgba(91,155,245,0.12)',
    },
    {
      label: "Today's Orders",
      value: (summary.todayOrdersCount ?? 0).toLocaleString('en-IN'),
      sub: 'Orders placed today',
      Icon: Clock,
      color: '#F28C45',
      bg: 'rgba(242,140,69,0.12)',
    },
    {
      label: 'Pending Orders',
      value: statusCounts.pending || 0,
      sub: `${statusCounts.preparing || 0} currently cooking`,
      Icon: AlertTriangle,
      color: (statusCounts.pending || 0) > 0 ? '#F5C542' : '#8B9099',
      bg: (statusCounts.pending || 0) > 0 ? 'rgba(245,197,66,0.12)' : 'rgba(139,144,153,0.12)',
    },
    {
      label: 'Completed Orders',
      value: statusCounts.completed || 0,
      sub: 'Fulfilled & collected',
      Icon: CheckCircle,
      color: '#4CAF7D',
      bg: 'rgba(76,175,125,0.12)',
    },
    {
      label: 'Low-Stock Items',
      value: lowStockCount,
      sub: 'Items below threshold',
      Icon: AlertTriangle,
      color: lowStockCount > 0 ? '#E05252' : '#8B9099',
      bg: lowStockCount > 0 ? 'rgba(224,82,82,0.12)' : 'rgba(139,144,153,0.12)',
    },
    {
      label: 'Verified Sales',
      value: `₹${(summary.verifiedSales || 0).toLocaleString('en-IN')}`,
      sub: `${summary.verifiedOrderCount || 0} completed/paid orders`,
      Icon: DollarSign,
      color: '#4CAF7D',
      bg: 'rgba(76,175,125,0.12)',
    },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: 1240 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.625rem', fontWeight: 800, color: '#F5F5F5' }}>
            Canteen Operations Dashboard
          </h1>
          <p style={{ margin: 0, color: '#8B9099', fontSize: '0.875rem' }}>
            Live orders, stock alerts, and verified sales overview for today.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', padding: '8px 14px', borderRadius: 8 }}
        >
          <RefreshCw size={14} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {statCards.map((card) => {
          const Icon = card.Icon;
          return (
            <div
              key={card.label}
              className="card animate-fade-in"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#8B9099' }}>
                  {card.label}
                </span>
                <div style={{ background: card.bg, borderRadius: 10, padding: 8, display: 'flex', color: card.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#F5F5F5', lineHeight: 1 }}>
                {card.value}
              </p>
              <span style={{ fontSize: '0.75rem', color: '#8B9099' }}>{card.sub}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Recent Orders Table */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#F5F5F5' }}>
              Incoming & Active Orders
            </h2>
            <Link
              to="/admin/orders"
              style={{
                color: '#F28C45',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#8B9099' }}>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>No orders placed today yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2E333B' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.75rem', color: '#8B9099', fontWeight: 600 }}>Order</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.75rem', color: '#8B9099', fontWeight: 600 }}>Student</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.75rem', color: '#8B9099', fontWeight: 600 }}>Items</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.75rem', color: '#8B9099', fontWeight: 600 }}>Total</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '0.75rem', color: '#8B9099', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => {
                    const itemsDesc = ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
                    const statusColors = {
                      pending: '#F5C542',
                      confirmed: '#5B9BF5',
                      preparing: '#F28C45',
                      ready_for_pickup: '#4CAF7D',
                      completed: '#8B9099',
                      cancelled: '#E05252',
                    };
                    const color = statusColors[ord.orderStatus] || '#8B9099';

                    return (
                      <tr
                        key={ord._id}
                        style={{ borderBottom: '1px solid #2E333B', cursor: 'pointer' }}
                        onClick={() => navigate('/admin/orders')}
                      >
                        <td style={{ padding: '10px', fontSize: '0.8125rem', fontWeight: 700, color: '#F28C45', whiteSpace: 'nowrap' }}>
                          #{ord.pickupToken}
                        </td>
                        <td style={{ padding: '10px', fontSize: '0.8125rem', color: '#F5F5F5', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {ord.user?.name || 'Student'}
                        </td>
                        <td style={{ padding: '10px', fontSize: '0.75rem', color: '#8B9099', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {itemsDesc}
                        </td>
                        <td style={{ padding: '10px', fontSize: '0.8125rem', fontWeight: 700, color: '#F5F5F5', whiteSpace: 'nowrap' }}>
                          ₹{ord.totalAmount}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              background: `${color}18`,
                              color,
                              border: `1px solid ${color}30`,
                              borderRadius: 12,
                              padding: '2px 8px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {ord.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: Best Selling & Quick Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Best Sellers */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 700, color: '#F5F5F5' }}>
              Top Selling Foods
            </h2>

            {bestSellers.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#8B9099' }}>
                No food sales recorded yet today.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bestSellers.slice(0, 5).map((item, idx) => (
                  <div
                    key={item._id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#252A31',
                      borderRadius: 8,
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                      <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </p>
                      <span style={{ fontSize: '0.6875rem', color: '#8B9099' }}>
                        {item.quantitySold} portions sold
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F28C45' }}>
                      ₹{item.totalRevenue}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem', fontWeight: 700, color: '#F5F5F5' }}>
              Admin Shortcuts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link
                to="/admin/food"
                className="btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: '0.8125rem',
                  textDecoration: 'none',
                  justifyContent: 'flex-start',
                }}
              >
                <UtensilsCrossed size={16} color="#F28C45" />
                <span>Add / Edit Menu Items</span>
              </Link>
              <Link
                to="/admin/inventory"
                className="btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: '0.8125rem',
                  textDecoration: 'none',
                  justifyContent: 'flex-start',
                }}
              >
                <AlertTriangle size={16} color="#F5C542" />
                <span>Restock Low Inventory ({lowStockCount})</span>
              </Link>
              <Link
                to="/admin/analytics"
                className="btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: '0.8125rem',
                  textDecoration: 'none',
                  justifyContent: 'flex-start',
                }}
              >
                <DollarSign size={16} color="#4CAF7D" />
                <span>View Full Sales Analytics</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
