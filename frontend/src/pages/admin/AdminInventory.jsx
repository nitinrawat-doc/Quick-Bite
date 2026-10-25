import { useState, useEffect, useCallback } from 'react';
import { PackageOpen, AlertTriangle, TrendingDown, RefreshCw, Edit, Plus, Check } from 'lucide-react';
import { fetchAdminFoodItems, updateAdminFoodStock } from '../../api/client';
import toast from 'react-hot-toast';

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStockItem, setEditingStockItem] = useState(null);
  const [stockVal, setStockVal] = useState(0);
  const [thresholdVal, setThresholdVal] = useState(5);
  const [saving, setSaving] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminFoodItems();
      setItems(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleOpenEdit = (item) => {
    setEditingStockItem(item);
    setStockVal(item.stockQuantity);
    setThresholdVal(item.lowStockThreshold || 5);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAdminFoodStock(editingStockItem._id, {
        stockQuantity: Number(stockVal),
        lowStockThreshold: Number(thresholdVal),
      });
      toast.success(`Updated stock for "${editingStockItem.name}" to ${stockVal}`);
      setEditingStockItem(null);
      loadInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  const outOfStock = items.filter((i) => i.stockQuantity === 0);
  const lowStockItems = items.filter(
    (i) => i.stockQuantity > 0 && i.stockQuantity <= i.lowStockThreshold
  );

  const totalHoldingValue = items.reduce(
    (acc, i) => acc + (i.stockQuantity * (i.costPrice || 0)),
    0
  );

  return (
    <div style={{ padding: '2rem', maxWidth: 1240 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.625rem', fontWeight: 800, color: '#F5F5F5' }}>
            Inventory & Stock Tracking
          </h1>
          <p style={{ margin: 0, color: '#8B9099', fontSize: '0.875rem' }}>
            Monitor real-time canteen pantry levels and update stock quantities.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              background: '#1D2025',
              border: '1px solid #2E333B',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: '0.8125rem',
              color: '#8B9099',
            }}
          >
            Estimated Inventory Value:{' '}
            <strong style={{ color: '#F28C45' }}>₹{totalHoldingValue.toLocaleString('en-IN')}</strong>
          </div>

          <button
            onClick={loadInventory}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', padding: '8px 12px', borderRadius: 8 }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Alert banners */}
      {outOfStock.length > 0 && (
        <div
          style={{
            background: 'rgba(224,82,82,0.08)',
            border: '1px solid rgba(224,82,82,0.3)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <AlertTriangle size={20} color="#E05252" flexShrink={0} />
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#E07878' }}>
            <strong>{outOfStock.length} food item{outOfStock.length > 1 ? 's' : ''} out of stock:</strong>{' '}
            {outOfStock.map((i) => i.name).join(', ')}. Students cannot order these items.
          </p>
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div
          style={{
            background: 'rgba(242,140,69,0.08)',
            border: '1px solid rgba(242,140,69,0.3)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <TrendingDown size={20} color="#F28C45" flexShrink={0} />
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#F28C45' }}>
            <strong>{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low:</strong>{' '}
            {lowStockItems.map((i) => `${i.name} (${i.stockQuantity})`).join(', ')}.
          </p>
        </div>
      )}

      {/* Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8B9099' }}>
            <p>Loading inventory data…</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2E333B', background: '#252A31' }}>
                  {['Food Item', 'Category', 'Stock Available', 'Alert Threshold', 'Cost Price', 'Selling Price', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#8B9099' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item._id} style={{ borderBottom: idx < items.length - 1 ? '1px solid #2E333B' : 'none' }}>
                    <td style={{ padding: '12px 14px', fontSize: '0.875rem', fontWeight: 700, color: '#F5F5F5' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8125rem', color: '#8B9099' }}>
                      {item.category?.icon} {item.category?.name || 'Uncategorized'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 800,
                          color: item.stockQuantity === 0 ? '#E05252' : item.stockQuantity <= item.lowStockThreshold ? '#F28C45' : '#4CAF7D',
                        }}
                      >
                        {item.stockQuantity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8125rem', color: '#8B9099' }}>
                      {item.lowStockThreshold} units
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8125rem', color: '#F5F5F5' }}>
                      ₹{item.costPrice}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8125rem', fontWeight: 700, color: '#F28C45' }}>
                      ₹{item.sellingPrice}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="btn-ghost"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: '0.75rem', borderRadius: 6 }}
                      >
                        <Edit size={13} />
                        <span>Update Stock</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stock Modal */}
      {editingStockItem && (
        <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-scale-up" style={{ width: '100%', maxWidth: 400, padding: '2rem' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 800, color: '#F5F5F5' }}>
              Adjust Stock Level
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.8125rem', color: '#8B9099' }}>
              {editingStockItem.name}
            </p>

            <form onSubmit={handleSaveStock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                  Available Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockVal}
                  onChange={(e) => setStockVal(e.target.value)}
                  style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                  Low-Stock Warning Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={thresholdVal}
                  onChange={(e) => setThresholdVal(e.target.value)}
                  style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-ghost" onClick={() => setEditingStockItem(null)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-accent" disabled={saving}>
                  {saving ? 'Updating…' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
