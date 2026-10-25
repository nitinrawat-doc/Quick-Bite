import { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Calendar,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { fetchAdminAnalytics } from '../../api/client';
import toast from 'react-hot-toast';

export default function AdminAnalytics() {
  const [range, setRange] = useState('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { range };
      if (range === 'custom') {
        if (!startDate || !endDate) {
          setLoading(false);
          return;
        }
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await fetchAdminAnalytics(params);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch sales analytics.');
      toast.error('Could not load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [range, startDate, endDate]);

  const summarySource = data?.kpis || data?.summary || {};
  const kpis = {
    totalRevenue: summarySource.totalRevenue ?? summarySource.verifiedSales ?? 0,
    totalRefunds: summarySource.totalRefunds ?? summarySource.totalRefunded ?? 0,
    netVerifiedSales: summarySource.netVerifiedSales ?? summarySource.verifiedSales ?? 0,
    paidOrdersCount: summarySource.paidOrdersCount ?? summarySource.verifiedOrderCount ?? 0,
    avgOrderValue: summarySource.avgOrderValue ?? summarySource.averageOrderValue ?? 0,
    estimatedCogs: summarySource.estimatedCogs ?? summarySource.estimatedCOGS ?? 0,
    estimatedGrossProfit: summarySource.estimatedGrossProfit ?? 0,
    grossMarginPercent:
      summarySource.grossMarginPercent ??
      ((summarySource.netVerifiedSales || summarySource.verifiedSales) > 0
        ? Math.round(
            ((summarySource.estimatedGrossProfit || 0) /
              (summarySource.netVerifiedSales || summarySource.verifiedSales)) *
              100
          )
        : 0),
  };

  const ordersByStatus = data?.ordersByStatus || data?.statusCounts || {};
  const rawTopSelling = data?.topSellingItems || data?.bestSellingItems || [];
  const topSellingItems = rawTopSelling.map((item) => ({
    ...item,
    totalQuantity: item.totalQuantity ?? item.quantitySold ?? 0,
    totalRevenue: item.totalRevenue ?? 0,
    estimatedCost: item.estimatedCost ?? 0,
    estimatedProfit:
      item.estimatedProfit ??
      Math.max(0, (item.totalRevenue || 0) - (item.estimatedCost || 0)),
  }));
  const rawTimeline = data?.dailyTimeline || [];
  const dailyTimeline = rawTimeline.map((d) => ({
    ...d,
    date: d.date || d._id || '',
    day: d.day || (d._id ? d._id.slice(5) : ''),
    revenue: d.revenue || 0,
    orders: d.orders || 0,
  }));

  const maxTimelineRevenue =
    dailyTimeline.length > 0
      ? Math.max(...dailyTimeline.map((d) => d.revenue), 1)
      : 1;

  const totalStatusCount = Object.values(ordersByStatus).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto', color: '#F5F5F5' }}>
      {/* Header & Filter Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 0.375rem', fontSize: '1.625rem', fontWeight: 800, color: '#F5F5F5' }}>
            Sales & Financial Analytics
          </h1>
          <p style={{ margin: 0, color: '#8B9099', fontSize: '0.875rem' }}>
            Verified revenue, estimated gross profit, and item sales performance metrics.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          {/* Quick Date Range Pills */}
          <div
            style={{
              background: '#1D2025',
              padding: 4,
              borderRadius: 10,
              display: 'flex',
              border: '1px solid #2E333B',
              gap: 4,
            }}
          >
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRange(tab.id)}
                style={{
                  background: range === tab.id ? '#F28C45' : 'transparent',
                  color: range === tab.id ? '#111214' : '#8B9099',
                  border: 'none',
                  borderRadius: 7,
                  padding: '6px 14px',
                  fontSize: '0.8125rem',
                  fontWeight: range === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadAnalytics}
            title="Refresh Data"
            style={{
              background: '#1D2025',
              border: '1px solid #2E333B',
              color: '#F5F5F5',
              padding: '8px 12px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: '0.8125rem',
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {range === 'custom' && (
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1rem',
            background: '#1D2025',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#F28C45" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F5F5F5' }}>Custom Date Filter:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: '0.8125rem', color: '#8B9099' }}>From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                background: '#252A31',
                border: '1px solid #2E333B',
                color: '#F5F5F5',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: '0.8125rem',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: '0.8125rem', color: '#8B9099' }}>To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                background: '#252A31',
                border: '1px solid #2E333B',
                color: '#F5F5F5',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: '0.8125rem',
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(224,82,82,0.1)',
            border: '1px solid rgba(224,82,82,0.3)',
            borderRadius: 12,
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#E05252',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Verified Net Sales */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8125rem', color: '#8B9099', fontWeight: 500 }}>Net Verified Sales</span>
            <div style={{ background: 'rgba(76,175,125,0.15)', color: '#4CAF7D', padding: 6, borderRadius: 8 }}>
              <DollarSign size={18} />
            </div>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: '1.625rem', fontWeight: 800, color: '#F5F5F5' }}>
            ₹{kpis.netVerifiedSales.toLocaleString('en-IN')}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#8B9099' }}>
            Gross: ₹{kpis.totalRevenue.toLocaleString('en-IN')}
            {kpis.totalRefunds > 0 && (
              <span style={{ color: '#E05252', marginLeft: 4 }}>
                (-₹{kpis.totalRefunds.toLocaleString('en-IN')} refunded)
              </span>
            )}
          </p>
        </div>

        {/* Estimated Gross Profit */}
        <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(242,140,69,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.8125rem', color: '#F28C45', fontWeight: 700 }}>Est. Gross Profit</span>
              <span title="Calculated from recorded food cost price snapshots. Operating expenses & utilities are excluded.">
                <HelpCircle size={13} color="#8B9099" style={{ cursor: 'help' }} />
              </span>
            </div>
            <div style={{ background: 'rgba(242,140,69,0.15)', color: '#F28C45', padding: 6, borderRadius: 8 }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: '1.625rem', fontWeight: 800, color: '#F28C45' }}>
            ₹{kpis.estimatedGrossProfit.toLocaleString('en-IN')}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#8B9099' }}>
            Gross Margin: <span style={{ color: '#F5F5F5', fontWeight: 600 }}>{kpis.grossMarginPercent}%</span>
          </p>
        </div>

        {/* Estimated Cost of Goods Sold */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8125rem', color: '#8B9099', fontWeight: 500 }}>Estimated COGS</span>
            <div style={{ background: 'rgba(139,158,255,0.15)', color: '#8B9EFF', padding: 6, borderRadius: 8 }}>
              <Package size={18} />
            </div>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: '1.625rem', fontWeight: 800, color: '#F5F5F5' }}>
            ₹{kpis.estimatedCogs.toLocaleString('en-IN')}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#8B9099' }}>
            Aggregated item ingredient cost snapshot
          </p>
        </div>

        {/* Paid Orders & AOV */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8125rem', color: '#8B9099', fontWeight: 500 }}>Verified Paid Orders</span>
            <div style={{ background: 'rgba(245,197,66,0.15)', color: '#F5C542', padding: 6, borderRadius: 8 }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: '1.625rem', fontWeight: 800, color: '#F5F5F5' }}>
            {kpis.paidOrdersCount}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#8B9099' }}>
            Avg Order Value (AOV): <span style={{ color: '#F5F5F5', fontWeight: 600 }}>₹{kpis.avgOrderValue}</span>
          </p>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Daily Revenue Timeline Bar Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.0625rem', fontWeight: 700, color: '#F5F5F5' }}>
                Daily Revenue Trend
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#8B9099' }}>
                Verified sales over selected timeframe
              </p>
            </div>
            <span style={{ fontSize: '0.8125rem', color: '#4CAF7D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpRight size={14} /> ₹{kpis.netVerifiedSales.toLocaleString('en-IN')} Total
            </span>
          </div>

          {dailyTimeline.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B9099', fontSize: '0.875rem' }}>
              No sales recorded for this date range.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 200, paddingTop: '1rem' }}>
              {dailyTimeline.map((item) => {
                const heightPct = Math.max((item.revenue / maxTimelineRevenue) * 100, 6);
                return (
                  <div
                    key={item.date}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: '0.625rem', color: '#8B9099', whiteSpace: 'nowrap' }}>
                      ₹{item.revenue > 1000 ? `${(item.revenue / 1000).toFixed(1)}k` : item.revenue}
                    </span>
                    <div
                      title={`${item.date}: ₹${item.revenue} (${item.orders} orders)`}
                      style={{
                        width: '100%',
                        maxWidth: 32,
                        height: `${heightPct}%`,
                        background: 'linear-gradient(180deg, #F28C45 0%, rgba(242,140,69,0.3) 100%)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.4s ease',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '0.6875rem', color: '#8B9099', fontWeight: 500 }}>
                      {item.day || item.date.slice(-5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Status Funnel / Breakdown */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.0625rem', fontWeight: 700, color: '#F5F5F5' }}>
                Order Status Pipeline
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#8B9099' }}>
                All orders in period: <strong style={{ color: '#F5F5F5' }}>{totalStatusCount} total</strong>
              </p>
            </div>
            <div style={{ background: '#252A31', padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', color: '#8B9099' }}>
              Real-time pipeline
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'completed', label: 'Completed (Picked Up)', count: ordersByStatus.completed || 0, color: '#4CAF7D', icon: CheckCircle2 },
              { key: 'ready_for_pickup', label: 'Ready for Pickup', count: ordersByStatus.ready_for_pickup || 0, color: '#8B9EFF', icon: Package },
              { key: 'preparing', label: 'In Kitchen (Preparing)', count: ordersByStatus.preparing || 0, color: '#F28C45', icon: Clock },
              { key: 'confirmed', label: 'Confirmed Orders', count: ordersByStatus.confirmed || 0, color: '#F5C542', icon: Clock },
              { key: 'pending', label: 'Pending Payment / Token', count: ordersByStatus.pending || 0, color: '#8B9099', icon: Clock },
              { key: 'cancelled', label: 'Cancelled Orders', count: ordersByStatus.cancelled || 0, color: '#E05252', icon: XCircle },
            ].map(({ key, label, count, color, icon: Icon }) => {
              const pct = totalStatusCount > 0 ? ((count / totalStatusCount) * 100).toFixed(0) : 0;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8125rem', color: '#F5F5F5', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={14} color={color} />
                      {label}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#8B9099' }}>
                      <strong style={{ color: '#F5F5F5' }}>{count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#252A31', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: color,
                        borderRadius: 3,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Best-Selling Food Items */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.0625rem', fontWeight: 700, color: '#F5F5F5' }}>
              Best-Selling Food Items
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#8B9099' }}>
              Ranked by total quantity sold and verified revenue contribution
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#8B9099' }}>
            {topSellingItems.length} menu items sold
          </span>
        </div>

        {topSellingItems.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#8B9099', fontSize: '0.875rem' }}>
            No completed food sales recorded in this period.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2E333B', color: '#8B9099', textAlign: 'left', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px 12px' }}>#</th>
                  <th style={{ padding: '10px 12px' }}>Food Item</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Qty Sold</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Revenue</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Est. Food Cost</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Est. Gross Profit</th>
                </tr>
              </thead>
              <tbody>
                {topSellingItems.map((item, index) => (
                  <tr
                    key={item._id || index}
                    style={{
                      borderBottom: '1px solid #252A31',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px', color: index === 0 ? '#F28C45' : '#8B9099', fontWeight: 700 }}>
                      #{index + 1}
                    </td>
                    <td style={{ padding: '12px', color: '#F5F5F5', fontWeight: 600 }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#F5F5F5', fontWeight: 700 }}>
                      {item.totalQuantity} units
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#4CAF7D', fontWeight: 700 }}>
                      ₹{item.totalRevenue.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#8B9099' }}>
                      ₹{item.estimatedCost.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#F28C45', fontWeight: 700 }}>
                      ₹{item.estimatedProfit.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accounting / Gross Profit Disclaimer */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem 1.25rem',
          background: '#1D2025',
          border: '1px solid #2E333B',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          color: '#8B9099',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
        }}
      >
        <AlertCircle size={18} color="#F28C45" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ color: '#F5F5F5' }}>Financial Disclosure & Profit Accounting:</strong>
          <span style={{ display: 'block', marginTop: 2 }}>
            Gross Profit figures shown above are estimates based on recorded ingredient/dish cost price snapshots at the time of cataloging. Operating expenses (canteen staff salaries, electricity, gas, kitchen equipment depreciation, and rent) are not tracked and are excluded. Unpaid or cancelled orders are omitted from verified sales totals.
          </span>
        </div>
      </div>
    </div>
  );
}
