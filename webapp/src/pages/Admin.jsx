import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

const CATEGORIES = [
    'jewelry', 'totes', 'clothes', 'shoes', 'perfume', 'home',
];

const SUBCATEGORIES = {
    jewelry: ['rings', 'earrings', 'brooches'],
    clothes: ['women', 'men'],
};

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const EMPTY_PRODUCT = {
    name: '', sku: '', description: '', price: '', old_price: '',
    image_url: '', category: 'jewelry', subcategory: '',
    quantity: 0, in_stock: false, is_new: false,
};

export default function Admin() {
    const navigate = useNavigate();
    const [secret, setSecret] = useState(localStorage.getItem('admin_secret') || '');
    const [authed, setAuthed] = useState(false);

    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | products | orders | categories
    const [editingProduct, setEditingProduct] = useState(null); // null = list, object = form
    const [editingOrder, setEditingOrder] = useState(null); // null = list, object = details/form
    const [editingCategory, setEditingCategory] = useState(null); // null = list, object = form
    const [newVariation, setNewVariation] = useState({ name: '', quantity: 0, price_adjustment: 0.0, sku: '' });

    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    // product filters
    const [searchQuery, setSearchQuery] = useState('');
    const [catFilter, setCatFilter] = useState('');

    // order filters
    const [statusFilter, setStatusFilter] = useState('');

    const headers = { 'Content-Type': 'application/json', 'X-Admin-Secret': secret };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const pRes = await fetch(`${API_URL}/api/admin/products`, { headers });
            if (pRes.status === 403) { setAuthed(false); setLoading(false); return; }
            const pData = await pRes.json();
            setProducts(pData);
            setAuthed(true);

            const sRes = await fetch(`${API_URL}/api/admin/stats`, { headers });
            if (sRes.ok) setStats(await sRes.json());

            const oRes = await fetch(`${API_URL}/api/admin/orders`, { headers });
            if (oRes.ok) setOrders(await oRes.json());

            const catsRes = await fetch(`${API_URL}/api/admin/categories`, { headers });
            if (catsRes.ok) setCategories(await catsRes.json());

        } catch { /* ignore */ }
        setLoading(false);
    }, [secret]);

    const login = () => {
        localStorage.setItem('admin_secret', secret);
        loadData();
    };

    useEffect(() => {
        if (secret) login();
    }, []);

    const showMsg = (text) => {
        setMsg(text);
        setTimeout(() => setMsg(''), 2500);
    };

    // ── CRM Product Logic ──────────────────────────────
    const saveProduct = async (e) => {
        e.preventDefault();
        const body = {
            ...editingProduct,
            price: parseFloat(editingProduct.price) || 0,
            old_price: editingProduct.old_price ? parseFloat(editingProduct.old_price) : null,
            quantity: parseInt(editingProduct.quantity) || 0,
        };

        const isNew = !editingProduct.id;
        const url = isNew
            ? `${API_URL}/api/admin/products`
            : `${API_URL}/api/admin/products/${editingProduct.id}`;
        const method = isNew ? 'POST' : 'PUT';

        const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
        if (res.ok) {
            showMsg(isNew ? '✅ Product created' : '✅ Product updated');
            setEditingProduct(null);
            loadData();
        } else {
            showMsg('❌ Error saving product');
        }
    };

    const deleteProduct = async (id) => {
        if (!confirm('Delete this product?')) return;
        const res = await fetch(`${API_URL}/api/admin/products/${id}`, { method: 'DELETE', headers });
        if (res.ok) {
            showMsg('🗑 Product deleted');
            loadData();
        }
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/upload`, {
                method: 'POST',
                headers: { 'X-Admin-Secret': secret },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setEditingProduct(prev => ({ ...prev, image_url: data.url }));
                showMsg('🖼️ Image uploaded successfully');
            } else {
                showMsg('❌ Image upload failed');
            }
        } catch (e) {
            showMsg('❌ Upload error');
        }
        setLoading(false);
    };

    // ── CRM Category Logic ─────────────────────────────
    const saveCategory = async (e) => {
        e.preventDefault();
        const isNew = !editingCategory.id;
        const url = isNew
            ? `${API_URL}/api/admin/categories`
            : `${API_URL}/api/admin/categories/${editingCategory.id}`;
        const method = isNew ? 'POST' : 'PUT';

        const res = await fetch(url, { method, headers, body: JSON.stringify(editingCategory) });
        if (res.ok) {
            showMsg(isNew ? '✅ Category created' : '✅ Category updated');
            setEditingCategory(null);
            loadData();
        } else {
            showMsg('❌ Error saving category');
        }
    };

    const deleteCategory = async (id) => {
        if (!confirm('Delete this category?')) return;
        const res = await fetch(`${API_URL}/api/admin/categories/${id}`, { method: 'DELETE', headers });
        if (res.ok) {
            showMsg('🗑 Category deleted');
            loadData();
        }
    };

    const uploadCategoryImage = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/upload`, {
                method: 'POST',
                headers: { 'X-Admin-Secret': secret },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setEditingCategory(prev => ({ ...prev, image_url: data.url }));
                showMsg('🖼️ Image uploaded successfully');
            } else {
                showMsg('❌ Image upload failed');
            }
        } catch (e) {
            showMsg('❌ Upload error');
        }
        setLoading(false);
    };

    // ── Variation Logic ────────────────────────────────
    const addVariation = async () => {
        if (!newVariation.name) {
            showMsg('❌ Variation name required');
            return;
        }
        const res = await fetch(`${API_URL}/api/admin/products/${editingProduct.id}/variations`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newVariation)
        });
        if (res.ok) {
            const v = await res.json();
            setEditingProduct(prev => ({ ...prev, variations: [...(prev.variations || []), v] }));
            setNewVariation({ name: '', quantity: 0, price_adjustment: 0.0, sku: '' });
            showMsg('✅ Variation added');
            loadData();
        } else {
            showMsg('❌ Error adding variation');
        }
    };

    const deleteVariation = async (vid) => {
        if (!window.confirm("Delete variation?")) return;
        const res = await fetch(`${API_URL}/api/admin/variations/${vid}`, { method: 'DELETE', headers });
        if (res.ok) {
            setEditingProduct(prev => ({ ...prev, variations: prev.variations.filter(x => x.id !== vid) }));
            showMsg('✅ Variation deleted');
            loadData();
        } else {
            showMsg('❌ Error deleting variation');
        }
    };

    // ── CRM Order Logic ────────────────────────────────
    const saveOrder = async (e) => {
        e.preventDefault();
        const body = {
            status: editingOrder.status,
            notes: editingOrder.notes
        };
        const res = await fetch(`${API_URL}/api/admin/orders/${editingOrder.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
        if (res.ok) {
            showMsg('✅ Order updated');
            setEditingOrder(null);
            loadData();
        } else {
            showMsg('❌ Error updating order');
        }
    };


    // ── Login screen ────────────────────────────────────
    if (!authed) {
        return (
            <div className="admin-page">
                <div className="admin-login">
                    <h1>🔐 CRM Dashboard</h1>
                    <p>Enter your admin secret key</p>
                    <input
                        type="password"
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        placeholder="Admin Secret"
                        className="admin-input"
                        onKeyDown={(e) => e.key === 'Enter' && login()}
                    />
                    <button className="btn-primary" onClick={login}>Login</button>
                    <button className="btn-secondary" onClick={() => navigate('/')}>← Back to shop</button>
                </div>
            </div>
        );
    }

    // ── Render Form Overlays ────────────────────────────
    if (editingProduct !== null) {
        const subcats = SUBCATEGORIES[editingProduct.category] || [];
        return (
            <div className="admin-page">
                <div className="admin-header">
                    <button className="back-btn" onClick={() => setEditingProduct(null)}>←</button>
                    <h1>{editingProduct.id ? `Edit ${editingProduct.sku || 'Product'}` : 'New Product'}</h1>
                </div>
                {msg && <div className="admin-msg">{msg}</div>}
                <form className="admin-form" onSubmit={saveProduct}>
                    <div className="admin-row">
                        <label>Name *
                            <input className="admin-input" required value={editingProduct.name}
                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                        </label>
                        <label>SKU
                            <input className="admin-input" value={editingProduct.sku}
                                onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })} />
                        </label>
                    </div>
                    <label>Description
                        <textarea className="admin-input admin-textarea" value={editingProduct.description}
                            onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                    </label>
                    <div className="admin-row">
                        <label>Price *
                            <input className="admin-input" type="number" step="0.01" required
                                value={editingProduct.price}
                                onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} />
                        </label>
                        <label>Old Price (sale)
                            <input className="admin-input" type="number" step="0.01"
                                value={editingProduct.old_price || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, old_price: e.target.value })} />
                        </label>
                    </div>
                    <label>Image URL or File Upload
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input className="admin-input" value={editingProduct.image_url}
                                onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })} />
                            <input type="file" accept="image/*" id="image-upload" style={{ display: 'none' }}
                                onChange={(e) => { if (e.target.files[0]) uploadImage(e.target.files[0]); }} />
                            <button type="button" className="btn-secondary" style={{ padding: '0 16px', whiteSpace: 'nowrap' }}
                                onClick={() => document.getElementById('image-upload').click()}>
                                📎 Upload
                            </button>
                        </div>
                    </label>
                    {editingProduct.image_url && (
                        <img src={editingProduct.image_url} alt="preview" className="admin-preview" />
                    )}
                    <div className="admin-row">
                        <label>Category
                            <select className="admin-input" value={editingProduct.category}
                                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value, subcategory: '' })}>
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </label>
                        <label>Subcategory
                            <select className="admin-input" value={editingProduct.subcategory}
                                onChange={(e) => setEditingProduct({ ...editingProduct, subcategory: e.target.value })}>
                                <option value="">— none —</option>
                                {subcats.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="admin-row">
                        <label>Quantity in Stock
                            <input className="admin-input" type="number" required min="0"
                                value={editingProduct.quantity}
                                onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })} />
                        </label>
                        <label style={{ justifyContent: 'center', paddingTop: 20 }}>
                            <div className="admin-checkbox">
                                <input type="checkbox" checked={editingProduct.is_new}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, is_new: e.target.checked })} />
                                Mark as New Arrival
                            </div>
                        </label>
                    </div>
                    <button className="btn-primary" type="submit">
                        {editingProduct.id ? 'Save Changes' : 'Create Product'}
                    </button>
                </form>

                {editingProduct.id && (
                    <div className="crm-card" style={{ marginTop: 25 }}>
                        <h3 className="crm-card-title">Manage Variations (Size, Color)</h3>
                        {(!editingProduct.variations || editingProduct.variations.length === 0) ? (
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 15 }}>No variations added yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 15 }}>
                                {editingProduct.variations.map(v => (
                                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-color)', padding: 10, borderRadius: 8 }}>
                                        <div>
                                            <strong>{v.name}</strong> (Qty: {v.quantity})
                                            {v.price_adjustment !== 0 && <span style={{ color: 'var(--accent)', marginLeft: 8 }}>{v.price_adjustment > 0 ? '+' : '-'}${Math.abs(v.price_adjustment)}</span>}
                                        </div>
                                        <button type="button" onClick={() => deleteVariation(v.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', padding: 5, fontSize: 16 }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <input className="admin-input" style={{ flex: 2, minWidth: 100 }} placeholder="Name (e.g. Size M)" value={newVariation.name} onChange={e => setNewVariation({ ...newVariation, name: e.target.value })} />
                            <input className="admin-input" style={{ flex: 1, minWidth: 60 }} type="number" placeholder="Qty" value={newVariation.quantity} onChange={e => setNewVariation({ ...newVariation, quantity: parseInt(e.target.value) || 0 })} />
                            <input className="admin-input" style={{ flex: 1, minWidth: 80 }} type="number" step="0.01" placeholder="+Price" value={newVariation.price_adjustment} onChange={e => setNewVariation({ ...newVariation, price_adjustment: parseFloat(e.target.value) || 0 })} />
                            <button type="button" className="btn-secondary" style={{ padding: '0 15px' }} onClick={addVariation}>Add</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (editingCategory !== null) {
        return (
            <div className="admin-page">
                <div className="admin-header">
                    <button className="back-btn" onClick={() => setEditingCategory(null)}>←</button>
                    <h1>{editingCategory.id ? `Edit Category` : 'New Category'}</h1>
                </div>
                {msg && <div className="admin-msg">{msg}</div>}
                <form className="admin-form" onSubmit={saveCategory}>
                    <label>Name *
                        <input className="admin-input" required value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                    </label>
                    <div className="admin-row">
                        <label>Order (Sorting)
                            <input className="admin-input" type="number" value={editingCategory.order}
                                onChange={(e) => setEditingCategory({ ...editingCategory, order: parseInt(e.target.value) || 0 })} />
                        </label>
                        <label>Parent Category (Subcategory of)
                            <select className="admin-input" value={editingCategory.parent_id || ''}
                                onChange={(e) => setEditingCategory({ ...editingCategory, parent_id: e.target.value ? parseInt(e.target.value) : null })}>
                                <option value="">— None (Root Category) —</option>
                                {categories.filter(c => c.id !== editingCategory.id && !c.parent_id).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <label>Image URL or File Upload
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input className="admin-input" value={editingCategory.image_url}
                                onChange={(e) => setEditingCategory({ ...editingCategory, image_url: e.target.value })} />
                            <input type="file" accept="image/*" id="cat-image-upload" style={{ display: 'none' }}
                                onChange={(e) => { if (e.target.files[0]) uploadCategoryImage(e.target.files[0]); }} />
                            <button type="button" className="btn-secondary" style={{ padding: '0 16px', whiteSpace: 'nowrap' }}
                                onClick={() => document.getElementById('cat-image-upload').click()}>
                                📎 Upload
                            </button>
                        </div>
                    </label>
                    {editingCategory.image_url && (
                        <div style={{ background: '#f0f0f0', padding: 10, borderRadius: 8, marginTop: 10, textAlign: 'center' }}>
                            <img src={editingCategory.image_url} alt="preview" style={{ maxHeight: 100, objectFit: 'contain' }} />
                        </div>
                    )}
                    <button className="btn-primary" type="submit" style={{ marginTop: 20 }}>
                        {editingCategory.id ? 'Save Changes' : 'Create Category'}
                    </button>
                </form>
            </div>
        );
    }

    if (editingOrder !== null) {
        return (
            <div className="admin-page">
                <div className="admin-header">
                    <button className="back-btn" onClick={() => setEditingOrder(null)}>←</button>
                    <h1>Order #{editingOrder.id}</h1>
                </div>
                {msg && <div className="admin-msg">{msg}</div>}

                <div className="crm-card">
                    <h3 className="crm-card-title">Customer Details</h3>
                    <p><strong>Name:</strong> {editingOrder.customer_name || 'Anonymous'}</p>
                    <p><strong>Telegram:</strong> {editingOrder.customer_username ? `@${editingOrder.customer_username}` : `ID: ${editingOrder.telegram_user_id}`}</p>
                    <p><strong>Date:</strong> {new Date(editingOrder.created_at).toLocaleString()}</p>
                    <p><strong>Total:</strong> ${editingOrder.total.toFixed(2)}</p>
                    {editingOrder.phone && <p style={{ marginTop: 8 }}><strong>Phone:</strong> {editingOrder.phone}</p>}
                    {editingOrder.shipping_address && (
                        <p style={{ marginTop: 4 }}><strong>Shipping:</strong><br />
                            {editingOrder.shipping_address}<br />
                            {editingOrder.shipping_city}, {editingOrder.shipping_state} {editingOrder.shipping_zip}
                        </p>
                    )}
                </div>

                <div className="crm-card">
                    <h3 className="crm-card-title">Items</h3>
                    <div className="admin-list" style={{ gap: 4 }}>
                        {editingOrder.items.map(i => (
                            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                <span>
                                    {i.quantity}x {i.product_name || `Product #${i.product_id}`}
                                    {i.variation_name ? <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6 }}>({i.variation_name})</span> : ''}
                                </span>
                                <span>${i.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <form className="admin-form" onSubmit={saveOrder}>
                    <label>Status
                        <select className="admin-input status-select" value={editingOrder.status}
                            onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}>
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </label>
                    <label>Admin Notes
                        <textarea className="admin-input admin-textarea" value={editingOrder.notes || ''}
                            onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })} />
                    </label>
                    <button className="btn-primary" type="submit">
                        Save Order
                    </button>
                </form>
            </div>
        );
    }


    // ── Filter Data ─────────────────────────────────────
    let filteredProducts = products;
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }
    if (catFilter) {
        filteredProducts = filteredProducts.filter(p => catFilter === 'out-of-stock' ? !p.in_stock : p.category === catFilter);
    }

    let filteredOrders = orders;
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
    }

    // ── Main Page ───────────────────────────────────────
    return (
        <div className="admin-page">
            <div className="admin-header" style={{ justifyContent: 'space-between' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button className="back-btn" style={{ width: 30, height: 30, fontSize: 14 }} onClick={() => navigate('/')}>←</button>
                    CRM
                </h1>
                <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => loadData()}>🔃 Refresh</button>
            </div>
            {msg && <div className="admin-msg">{msg}</div>}

            <div className="crm-tabs">
                <button className={`crm-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
                <button className={`crm-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>📦 Inventory</button>
                <button className={`crm-tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>🗂 Categories</button>
                <button className={`crm-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>🛒 Orders</button>
            </div>

            {loading ? (
                <div className="loader"><div className="spinner" /></div>
            ) : activeTab === 'dashboard' ? (
                <div className="crm-dashboard">
                    {stats && (
                        <>
                            <div className="crm-stat-grid">
                                <div className="crm-stat-card">
                                    <div className="crm-stat-label">Total Revenue</div>
                                    <div className="crm-stat-value">${stats.orders.total_revenue.toFixed(2)}</div>
                                </div>
                                <div className="crm-stat-card">
                                    <div className="crm-stat-label">Today's Revenue</div>
                                    <div className="crm-stat-value">${stats.orders.today_revenue.toFixed(2)}</div>
                                </div>
                                <div className="crm-stat-card">
                                    <div className="crm-stat-label">Total Orders</div>
                                    <div className="crm-stat-value">{stats.orders.total}</div>
                                </div>
                                <div className="crm-stat-card alert">
                                    <div className="crm-stat-label">Out of Stock</div>
                                    <div className="crm-stat-value">{stats.products.out_of_stock} <span style={{ fontSize: 12 }}>/ {stats.products.total}</span></div>
                                </div>
                            </div>

                            <div className="crm-card">
                                <h3 className="crm-card-title">Orders by Status</h3>
                                <div className="crm-chart">
                                    {ORDER_STATUSES.map(status => {
                                        const count = stats.orders.by_status[status] || 0;
                                        const max = Math.max(...Object.values(stats.orders.by_status), 1);
                                        const height = `${(count / max) * 100}%`;
                                        return (
                                            <div key={status} className="crm-chart-bar-container">
                                                <div className="crm-chart-bar" style={{ height }}>
                                                    <span className="crm-chart-val">{count}</span>
                                                </div>
                                                <div className="crm-chart-label">{status.slice(0, 3)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : activeTab === 'products' ? (
                <div>
                    <div className="crm-toolbar">
                        <input className="admin-input" placeholder="Search by name or SKU..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        <select className="admin-input" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                            <option value="">All Categories</option>
                            <option value="out-of-stock">⚠️ Out of Stock</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button className="btn-primary" onClick={() => setEditingProduct({ ...EMPTY_PRODUCT })}>+ Add</button>
                    </div>

                    <div className="admin-list">
                        {filteredProducts.map((p) => (
                            <div key={p.id} className={`admin-item ${!p.in_stock ? 'sold-out' : ''}`}>
                                <img src={p.image_url} alt={p.name} className="admin-item-img" />
                                <div className="admin-item-info">
                                    <h3 style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{p.name}</span>
                                        <span className="crm-sku">{p.sku}</span>
                                    </h3>
                                    <p>${p.price.toFixed(2)} {p.old_price ? `(was $${p.old_price.toFixed(2)})` : ''}</p>
                                    <div className="crm-inventory-row">
                                        <span className={`stock-badge ${p.in_stock ? 'in-stock' : 'out-of-stock'}`}>
                                            {p.in_stock ? '✅ In Stock' : '❌ Out of Stock'}
                                        </span>
                                        <span className="crm-qty">Qty: <strong>{p.quantity}</strong></span>
                                    </div>
                                </div>
                                <div className="admin-item-actions">
                                    <button className="admin-action-btn" title="Edit"
                                        onClick={() => setEditingProduct({ ...p, old_price: p.old_price || '' })}>
                                        ✏️
                                    </button>
                                    <button className="admin-action-btn danger" title="Delete"
                                        onClick={() => deleteProduct(p.id)}>
                                        🗑
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && <div className="empty-state">No products found</div>}
                    </div>
                </div>
            ) : activeTab === 'categories' ? (
                <div>
                    <div className="crm-toolbar">
                        <input className="admin-input" disabled value="" placeholder="Filter categories..." />
                        <button className="btn-primary" onClick={() => setEditingCategory({ name: '', image_url: '', parent_id: null, order: 0 })}>+ Add Category</button>
                    </div>

                    <div className="admin-list">
                        {categories.map((c) => (
                            <div key={c.id} className="admin-item" style={{ alignItems: 'center' }}>
                                {c.image_url ? (
                                    <img src={c.image_url} alt={c.name} className="admin-item-img" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                ) : (
                                    <div className="admin-item-img" style={{ width: 40, height: 40, borderRadius: 8, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📁</div>
                                )}
                                <div className="admin-item-info" style={{ marginLeft: 10 }}>
                                    <h3 style={{ margin: 0 }}>
                                        {c.parent_id ? <span style={{ color: 'var(--text-secondary)' }}>↳ </span> : ''}
                                        {c.name}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Order: {c.order}</p>
                                </div>
                                <div className="admin-item-actions">
                                    <button className="admin-action-btn" title="Edit"
                                        onClick={() => setEditingCategory({ ...c })}>
                                        ✏️
                                    </button>
                                    <button className="admin-action-btn danger" title="Delete"
                                        onClick={() => deleteCategory(c.id)}>
                                        🗑
                                    </button>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && <div className="empty-state">No categories found. Click + Add to create one.</div>}
                    </div>
                </div>
            ) : ( // orders tab
                <div>
                    <div className="crm-toolbar">
                        <select className="admin-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All Statuses</option>
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>

                    <div className="admin-list">
                        {filteredOrders.map((o) => (
                            <div key={o.id} className="admin-item crm-order-item" onClick={() => setEditingOrder(o)}>
                                <div className="crm-order-header">
                                    <strong>#{o.id}</strong>
                                    <span className={`crm-status-badge status-${o.status}`}>{o.status}</span>
                                </div>
                                <div className="crm-order-details">
                                    <span>{o.customer_name || o.telegram_user_id}</span>
                                    <span>{new Date(o.created_at).toLocaleDateString()}</span>
                                    <span><strong>${o.total.toFixed(2)}</strong></span>
                                </div>
                            </div>
                        ))}
                        {filteredOrders.length === 0 && <div className="empty-state">No orders found</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
