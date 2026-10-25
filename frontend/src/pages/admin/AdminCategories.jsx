import { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  AlertTriangle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../../api/client';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const DEFAULT_ICONS = ['🍔', '🍕', '🥪', '🍜', '☕', '🥤', '🍰', '🥗', '🍛', '🍽️'];

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    icon: '🍽️',
    description: '',
    sortOrder: 0,
    isActive: true,
  });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCategories();
      setCategories(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setForm({
      name: '',
      slug: '',
      icon: '🍽️',
      description: '',
      sortOrder: categories.length,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug || '',
      icon: cat.icon || '🍽️',
      description: cat.description || '',
      sortOrder: cat.sortOrder ?? 0,
      isActive: cat.isActive !== false,
    });
    setShowModal(true);
  };

  const handleNameChange = (name) => {
    setForm((prev) => {
      // Auto-suggest slug if creating new
      if (!editingCategory) {
        const slug = name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        return { ...prev, name, slug };
      }
      return { ...prev, name };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Category name is required.');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await updateAdminCategory(editingCategory._id, form);
        toast.success(`Category "${form.name}" updated successfully!`);
      } else {
        await createAdminCategory(form);
        toast.success(`Category "${form.name}" created successfully!`);
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.itemCount > 0) {
      toast.error(
        `Cannot delete "${deleteConfirm.name}". ${deleteConfirm.itemCount} active food item(s) are assigned to it.`
      );
      return;
    }

    setSaving(true);
    try {
      await deleteAdminCategory(deleteConfirm._id);
      toast.success(`Category "${deleteConfirm.name}" deleted successfully.`);
      setDeleteConfirm(null);
      loadCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.slug && c.slug.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: '2rem', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.625rem', fontWeight: 800, color: '#F5F5F5' }}>
            Category Management
          </h1>
          <p style={{ margin: 0, color: '#8B9099', fontSize: '0.875rem' }}>
            Organize campus canteen food menus, display sorting, and item categorization.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={loadCategories}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', padding: '8px 14px', borderRadius: 8 }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          <button
            id="admin-add-category-btn"
            onClick={handleOpenCreate}
            className="btn-accent"
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', padding: '9px 18px', borderRadius: 10 }}
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Search & Overview Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 400 }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8B9099' }}
          />
          <input
            type="text"
            placeholder="Search categories by name or slug…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#1D2025',
              border: '1px solid #2E333B',
              borderRadius: 10,
              padding: '10px 14px 10px 40px',
              color: '#F5F5F5',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div
            style={{
              background: '#1D2025',
              border: '1px solid #2E333B',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: '0.8125rem',
              color: '#8B9099',
            }}
          >
            Total Categories: <strong style={{ color: '#F5F5F5' }}>{categories.length}</strong>
          </div>
          <div
            style={{
              background: '#1D2025',
              border: '1px solid #2E333B',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: '0.8125rem',
              color: '#8B9099',
            }}
          >
            Active: <strong style={{ color: '#4CAF7D' }}>{categories.filter((c) => c.isActive !== false).length}</strong>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#8B9099' }}>
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
          <p>Loading canteen categories…</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#8B9099' }}>
          <FolderOpen size={44} style={{ margin: '0 auto 12px', color: '#F28C45' }} />
          <h2 style={{ fontSize: '1.125rem', color: '#F5F5F5', margin: '0 0 6px' }}>No categories found</h2>
          <p style={{ margin: '0 0 16px', fontSize: '0.875rem' }}>
            {searchQuery ? `No category matches "${searchQuery}"` : 'Get started by creating your first canteen food category.'}
          </p>
          <button onClick={handleOpenCreate} className="btn-accent" style={{ padding: '8px 16px', borderRadius: 8 }}>
            Add Category
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredCategories.map((cat) => (
            <div
              key={cat._id}
              className="card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.2s',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(242,140,69,0.12)',
                        border: '1px solid rgba(242,140,69,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                      }}
                    >
                      {cat.icon || '🍽️'}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#F5F5F5' }}>
                        {cat.name}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: '#8B9099', fontFamily: 'monospace' }}>
                        /{cat.slug}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontWeight: 600,
                      background: cat.isActive !== false ? 'rgba(76,175,125,0.12)' : 'rgba(139,144,153,0.15)',
                      color: cat.isActive !== false ? '#4CAF7D' : '#8B9099',
                      border: cat.isActive !== false ? '1px solid rgba(76,175,125,0.25)' : '1px solid #2E333B',
                    }}
                  >
                    {cat.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {cat.description && (
                  <p
                    style={{
                      margin: '0 0 14px',
                      fontSize: '0.8125rem',
                      color: '#8B9099',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {cat.description}
                  </p>
                )}
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#252A31',
                    borderRadius: 8,
                    marginBottom: 12,
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ color: '#8B9099' }}>Assigned Food Items:</span>
                  <span style={{ fontWeight: 700, color: cat.itemCount > 0 ? '#F28C45' : '#8B9099' }}>
                    {cat.itemCount || 0} items
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="btn-ghost"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.75rem',
                      padding: '6px 12px',
                      borderRadius: 6,
                    }}
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirm(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.75rem',
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: 'none',
                      border: '1px solid rgba(224,82,82,0.3)',
                      color: '#E05252',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(224,82,82,0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            className="card animate-fade-in"
            style={{ width: '100%', maxWidth: 460, padding: '1.75rem', position: 'relative' }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                right: 16,
                top: 16,
                background: 'none',
                border: 'none',
                color: '#8B9099',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: 800, color: '#F5F5F5' }}>
              {editingCategory ? 'Edit Category' : 'Create Food Category'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Category Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 6 }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Burgers & Wraps"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#252A31',
                    border: '1px solid #2E333B',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#F5F5F5',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Slug */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 6 }}>
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. burgers-and-wraps"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#252A31',
                    border: '1px solid #2E333B',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#F5F5F5',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Icon selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 6 }}>
                  Icon / Emoji
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {DEFAULT_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, icon: emoji })}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: form.icon === emoji ? 'rgba(242,140,69,0.2)' : '#252A31',
                        border: form.icon === emoji ? '1px solid #F28C45' : '1px solid #2E333B',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Custom emoji or icon code"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#252A31',
                    border: '1px solid #2E333B',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#F5F5F5',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 6 }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of this menu category…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#252A31',
                    border: '1px solid #2E333B',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#F5F5F5',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Sort Order & Active */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 6 }}>
                    Sort Priority
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      background: '#252A31',
                      border: '1px solid #2E333B',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#F5F5F5',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#F5F5F5', marginBottom: 6 }}>
                    Status
                  </label>
                  <select
                    value={form.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
                    style={{
                      width: '100%',
                      background: '#252A31',
                      border: '1px solid #2E333B',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#F5F5F5',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-ghost"
                  style={{ padding: '8px 16px', borderRadius: 8 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-accent"
                  style={{ padding: '8px 20px', borderRadius: 8 }}
                >
                  {saving ? 'Saving…' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Safe Deletion Guard Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            className="card animate-fade-in"
            style={{ width: '100%', maxWidth: 440, padding: '2rem', textAlign: 'center' }}
          >
            {deleteConfirm.itemCount > 0 ? (
              <>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: 'rgba(242,140,69,0.12)',
                    color: '#F28C45',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <AlertTriangle size={26} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#F5F5F5' }}>
                  Cannot Delete Category
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#8B9099', lineHeight: 1.5 }}>
                  The category <strong style={{ color: '#F5F5F5' }}>"{deleteConfirm.name}"</strong> cannot be deleted because{' '}
                  <strong style={{ color: '#F28C45' }}>{deleteConfirm.itemCount} active food item(s)</strong> are currently assigned to it.
                </p>
                <div
                  style={{
                    background: '#252A31',
                    border: '1px solid #2E333B',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: '0.8125rem',
                    color: '#8B9099',
                    textAlign: 'left',
                    marginBottom: 20,
                  }}
                >
                  <strong style={{ color: '#F5F5F5', display: 'block', marginBottom: 4 }}>Safe Alternatives:</strong>
                  1. Go to Food Management and reassign items to another category.<br />
                  2. Or edit this category to set its status to <em>Inactive</em> instead.
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="btn-ghost"
                    style={{ padding: '8px 16px', borderRadius: 8 }}
                  >
                    Close
                  </button>
                  <Link
                    to="/admin/food"
                    className="btn-accent"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Manage Food Items</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: 'rgba(224,82,82,0.12)',
                    color: '#E05252',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Trash2 size={26} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#F5F5F5' }}>
                  Delete Category?
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: '#8B9099', lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete category <strong style={{ color: '#F5F5F5' }}>"{deleteConfirm.name}"</strong>?
                  This action is safe because no active items belong to it.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="btn-ghost"
                    style={{ padding: '8px 16px', borderRadius: 8 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    style={{
                      background: '#E05252',
                      color: '#FFF',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {saving ? 'Deleting…' : 'Confirm Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
