import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import {
  fetchAdminFoodItems,
  createAdminFoodItem,
  updateAdminFoodItem,
  toggleAdminFoodAvailability,
  deleteAdminFoodItem,
  fetchAdminCategories,
  createAdminCategory,
  uploadFoodImage,
} from '../../api/client';
import FoodImage from '../../components/common/FoodImage';
import toast from 'react-hot-toast';

export default function AdminFoodManagement() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const initialForm = {
    name: '',
    description: '',
    category: '',
    sellingPrice: '',
    costPrice: '',
    stockQuantity: '',
    lowStockThreshold: 5,
    imageUrl: '',
    isVeg: true,
    isAvailable: true,
  };
  const [itemForm, setItemForm] = useState(initialForm);

  const [catForm, setCatForm] = useState({
    name: '',
    icon: '🍽️',
    description: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [foodList, catList] = await Promise.all([
        fetchAdminFoodItems(),
        fetchAdminCategories(),
      ]);
      setItems(foodList);
      setCategories(catList);
    } catch (err) {
      toast.error(err.message || 'Failed to load food management data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setItemForm({
      ...initialForm,
      category: categories[0]?._id || '',
    });
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      category: item.category?._id || item.category,
      sellingPrice: item.sellingPrice,
      costPrice: item.costPrice,
      stockQuantity: item.stockQuantity,
      lowStockThreshold: item.lowStockThreshold || 5,
      imageUrl: item.imageUrl || '',
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
    });
    setShowItemModal(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file must be under 5MB');
      return;
    }

    setUploadingImage(true);
    const localPreviewUrl = URL.createObjectURL(file);
    setItemForm((prev) => ({ ...prev, imageUrl: localPreviewUrl }));

    try {
      const res = await uploadFoodImage(file);
      setItemForm((prev) => ({ ...prev, imageUrl: res.url }));
      toast.success('Image uploaded successfully! 📸');
    } catch (err) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      URL.revokeObjectURL(localPreviewUrl);
      setUploadingImage(false);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.category || itemForm.sellingPrice === '' || itemForm.costPrice === '') {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await updateAdminFoodItem(editingItem._id, itemForm);
        toast.success(`Updated "${itemForm.name}"`);
      } else {
        await createAdminFoodItem(itemForm);
        toast.success(`Created "${itemForm.name}"`);
      }
      setShowItemModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save food item');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await toggleAdminFoodAvailability(item._id);
      setItems((prev) =>
        prev.map((i) =>
          i._id === item._id ? { ...i, isAvailable: !i.isAvailable } : i
        )
      );
      toast.success(`${item.name} marked as ${!item.isAvailable ? 'Available' : 'Unavailable'}`);
    } catch (err) {
      toast.error(err.message || 'Failed to toggle availability');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    try {
      const res = await deleteAdminFoodItem(deleteConfirmItem._id);
      toast.success(res.message);
      setDeleteConfirmItem(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete food item');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name) {
      toast.error('Category name is required');
      return;
    }
    try {
      await createAdminCategory(catForm);
      toast.success(`Category "${catForm.name}" created!`);
      setShowCatModal(false);
      setCatForm({ name: '', icon: '🍽️', description: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create category');
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCat =
      selectedCategory === 'all' ||
      item.category?._id === selectedCategory ||
      item.category?.slug === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: 1240 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.625rem', fontWeight: 800, color: '#F5F5F5' }}>
            Menu & Food Management
          </h1>
          <p style={{ margin: 0, color: '#8B9099', fontSize: '0.875rem' }}>
            Manage campus canteen food items, prices, cost of goods, and live stock.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowCatModal(true)}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, fontSize: '0.8125rem' }}
          >
            <FolderPlus size={16} color="#F28C45" />
            <span>New Category</span>
          </button>
          <button
            onClick={handleOpenCreateItem}
            className="btn-accent"
            id="add-food-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, fontSize: '0.8125rem' }}
          >
            <Plus size={16} />
            <span>Add Food Item</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8B9099' }} />
          <input
            placeholder="Search items by name or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#1D2025',
              border: '1px solid #2E333B',
              borderRadius: 10,
              padding: '9px 12px 9px 36px',
              color: '#F5F5F5',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            background: '#1D2025',
            border: '1px solid #2E333B',
            borderRadius: 10,
            padding: '9px 14px',
            color: '#F5F5F5',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        >
          <option value="all">All Categories ({items.length})</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={loadData}
          className="btn-ghost"
          style={{ padding: '8px 12px', borderRadius: 10, fontSize: '0.8125rem' }}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8B9099' }}>
            <p>Loading food items…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8B9099' }}>
            <p style={{ margin: 0 }}>No food items matching your filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2E333B', background: '#252A31' }}>
                  {['Photo', 'Item Details', 'Category', 'Selling / Cost Price', 'Stock Level', 'Available', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#8B9099' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={item._id} style={{ borderBottom: idx < filteredItems.length - 1 ? '1px solid #2E333B' : 'none' }}>
                    {/* Image */}
                    <td style={{ padding: '12px 14px', width: 60 }}>
                      <FoodImage
                        src={item.imageUrl}
                        alt={item.name}
                        thumbnail={true}
                        width={44}
                        height={44}
                        aspectRatio="1/1"
                        loading="lazy"
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                      />
                    </td>

                    {/* Name & Veg Badge */}
                    <td style={{ padding: '12px 14px', minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <div className={item.isVeg ? 'badge-veg' : 'badge-nonveg'} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F5F5F5' }}>
                          {item.name}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#8B9099', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description || 'No description provided'}
                      </p>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '12px 14px', fontSize: '0.8125rem', color: '#F5F5F5', whiteSpace: 'nowrap' }}>
                      {item.category?.icon} {item.category?.name || 'Uncategorized'}
                    </td>

                    {/* Price */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F28C45' }}>
                        ₹{item.sellingPrice}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#8B9099' }}>
                        Cost: ₹{item.costPrice}
                      </div>
                    </td>

                    {/* Stock */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: item.stockQuantity === 0 ? '#E05252' : item.stockQuantity <= item.lowStockThreshold ? '#F28C45' : '#4CAF7D',
                          }}
                        >
                          {item.stockQuantity}
                        </span>
                        {item.stockQuantity <= item.lowStockThreshold && item.stockQuantity > 0 && (
                          <span style={{ fontSize: '0.6875rem', color: '#F28C45', background: 'rgba(242,140,69,0.1)', padding: '1px 6px', borderRadius: 4 }}>
                            Low
                          </span>
                        )}
                        {item.stockQuantity === 0 && (
                          <span style={{ fontSize: '0.6875rem', color: '#E05252', background: 'rgba(224,82,82,0.1)', padding: '1px 6px', borderRadius: 4 }}>
                            Empty
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Available Toggle */}
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        style={{
                          background: item.isAvailable ? 'rgba(76,175,125,0.15)' : 'rgba(224,82,82,0.15)',
                          color: item.isAvailable ? '#4CAF7D' : '#E05252',
                          border: `1px solid ${item.isAvailable ? '#4CAF7D30' : '#E0525230'}`,
                          borderRadius: 20,
                          padding: '3px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {item.isAvailable ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenEditItem(item)}
                          className="btn-ghost"
                          style={{ padding: '6px', borderRadius: 6 }}
                          title="Edit item"
                        >
                          <Edit size={15} color="#8B9099" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmItem(item)}
                          className="btn-ghost"
                          style={{ padding: '6px', borderRadius: 6, color: '#E05252' }}
                          title="Delete item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Modal (Create & Edit) */}
      {showItemModal && (
        <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div
            className="card animate-scale-up"
            style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid #2E333B' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F5F5F5' }}>
                {editingItem ? `Edit: ${editingItem.name}` : 'Create New Food Item'}
              </h2>
              <button onClick={() => setShowItemModal(false)} style={{ background: 'none', border: 'none', color: '#8B9099', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                  Item Name *
                </label>
                <input
                  required
                  placeholder="e.g. Paneer Butter Masala Roll"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                  Category *
                </label>
                <select
                  required
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="149"
                    value={itemForm.sellingPrice}
                    onChange={(e) => setItemForm({ ...itemForm, sellingPrice: e.target.value })}
                    style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                    Cost Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="65"
                    value={itemForm.costPrice}
                    onChange={(e) => setItemForm({ ...itemForm, costPrice: e.target.value })}
                    style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="30"
                    value={itemForm.stockQuantity}
                    onChange={(e) => setItemForm({ ...itemForm, stockQuantity: e.target.value })}
                    style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                    Low-Stock Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5"
                    value={itemForm.lowStockThreshold}
                    onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: e.target.value })}
                    style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              {/* Image upload with preview */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                  Food Image
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {itemForm.imageUrl && (
                    <FoodImage
                      src={itemForm.imageUrl}
                      alt="Preview"
                      thumbnail={true}
                      width={56}
                      height={56}
                      aspectRatio="1/1"
                      loading="eager"
                      style={{ width: 56, height: 56, borderRadius: 8, border: '1px solid #2E333B', flexShrink: 0 }}
                    />
                  )}
                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: '#252A31',
                      border: '1px dashed #2E333B',
                      borderRadius: 8,
                      padding: '12px',
                      cursor: 'pointer',
                      color: '#F28C45',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                    }}
                  >
                    <Upload size={16} />
                    <span>{uploadingImage ? 'Uploading image…' : 'Choose File to Upload'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="Or paste external image URL"
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                  style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.75rem', marginTop: 6 }}
                />
              </div>

              {/* Veg and Available Switches */}
              <div style={{ display: 'flex', gap: '2rem', padding: '6px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#F5F5F5' }}>
                  <input
                    type="checkbox"
                    checked={itemForm.isVeg}
                    onChange={(e) => setItemForm({ ...itemForm, isVeg: e.target.checked })}
                    style={{ accentColor: '#4CAF7D', width: 16, height: 16 }}
                  />
                  <span>Vegetarian item</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#F5F5F5' }}>
                  <input
                    type="checkbox"
                    checked={itemForm.isAvailable}
                    onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                    style={{ accentColor: '#F28C45', width: 16, height: 16 }}
                  />
                  <span>Available on menu</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, preparation details…"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowItemModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accent"
                  disabled={saving || uploadingImage}
                >
                  {saving ? 'Saving…' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-scale-up" style={{ width: '100%', maxWidth: 440, padding: '2rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 800, color: '#F5F5F5' }}>
              Add New Category
            </h2>
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                  Category Name *
                </label>
                <input
                  required
                  placeholder="e.g. Beverages"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                  Icon Emoji
                </label>
                <input
                  placeholder="🥤"
                  value={catForm.icon}
                  onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                  style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                  Description (optional)
                </label>
                <input
                  placeholder="Refreshing campus drinks"
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  style={{ width: '100%', background: '#252A31', border: '1px solid #2E333B', borderRadius: 8, padding: '8px 12px', color: '#F5F5F5', fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: '0.5rem' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowCatModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-scale-up" style={{ width: '100%', maxWidth: 420, padding: '2rem', textAlign: 'center' }}>
            <AlertCircle size={44} color="#E05252" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '1.125rem', fontWeight: 800, color: '#F5F5F5' }}>
              Delete "{deleteConfirmItem.name}"?
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#8B9099' }}>
              If this item was previously ordered by students, it will be safely soft-deleted from the menu so student order histories are preserved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirmItem(null)}>
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                style={{
                  background: '#E05252',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
