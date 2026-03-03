import { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Profile() {
    const { user } = useTelegram();
    const [orders, setOrders] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Form state for profile
    const [formData, setFormData] = useState({
        customer_name: '',
        phone: '',
        shipping_address: '',
        shipping_city: '',
        shipping_state: '',
        shipping_zip: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            const telegramId = user?.id || 123456789;
            try {
                const [ordersRes, profileRes] = await Promise.all([
                    fetch(`${API_URL}/api/orders/${telegramId}`),
                    fetch(`${API_URL}/api/users/${telegramId}/profile`)
                ]);

                if (ordersRes.ok) {
                    setOrders(await ordersRes.json());
                }

                if (profileRes.ok) {
                    const p = await profileRes.json();
                    setProfile(p);
                    setFormData({
                        customer_name: p.customer_name || '',
                        phone: p.phone || '',
                        shipping_address: p.shipping_address || '',
                        shipping_city: p.shipping_city || '',
                        shipping_state: p.shipping_state || '',
                        shipping_zip: p.shipping_zip || ''
                    });
                }
            } catch (err) {
                console.error("Failed to fetch profile data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id]);

    const handleSaveProfile = async () => {
        const telegramId = user?.id || 123456789;
        try {
            const res = await fetch(`${API_URL}/api/users/${telegramId}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const p = await res.json();
                setProfile(p);
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Failed to save profile", err);
        }
    };

    if (loading) {
        return <div className="profile-page"><div className="loading">Loading...</div></div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-avatar">
                    {user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <h2>{user?.first_name || 'Guest'} {user?.last_name || ''}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>ID: {user?.id || 'No ID'}</p>
            </div>

            <div className="profile-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>📍 Default Shipping Info</h3>
                    {!isEditing && (
                        <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 14 }} onClick={() => setIsEditing(true)}>
                            Edit
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="profile-card">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <input className="admin-input" placeholder="Full Name" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} />
                            <input className="admin-input" placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            <input className="admin-input" placeholder="Address" value={formData.shipping_address} onChange={e => setFormData({ ...formData, shipping_address: e.target.value })} />
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input className="admin-input" style={{ flex: 2 }} placeholder="City" value={formData.shipping_city} onChange={e => setFormData({ ...formData, shipping_city: e.target.value })} />
                                <input className="admin-input" style={{ flex: 1 }} placeholder="State" value={formData.shipping_state} onChange={e => setFormData({ ...formData, shipping_state: e.target.value })} />
                                <input className="admin-input" style={{ flex: 1 }} placeholder="ZIP" value={formData.shipping_zip} onChange={e => setFormData({ ...formData, shipping_zip: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveProfile}>Save</button>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                ) : profile && profile.shipping_address ? (
                    <div className="profile-card">
                        <p><strong>Name:</strong> {profile.customer_name}</p>
                        <p><strong>Phone:</strong> {profile.phone}</p>
                        <p><strong>Address:</strong><br />
                            {profile.shipping_address}<br />
                            {profile.shipping_city}, {profile.shipping_state} {profile.shipping_zip}
                        </p>
                    </div>
                ) : (
                    <div className="profile-card empty">
                        <p>No shipping info saved yet.</p>
                        <small>Address is saved automatically upon your first order.</small>
                    </div>
                )}
            </div>

            <div className="profile-section">
                <h3>🐞 Debug Info</h3>
                <div className="profile-card" style={{ fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto' }}>
                    <p><strong>URL:</strong> {window.location.href}</p>
                    <p><strong>initData:</strong> {window.Telegram?.WebApp?.initData || 'EMPTY'}</p>
                    <p><strong>initDataUnsafe:</strong> {JSON.stringify(window.Telegram?.WebApp?.initDataUnsafe || {})}</p>
                </div>
            </div>

            <div className="profile-section">
                <h3>📦 Order History</h3>
                {orders.length === 0 ? (
                    <div className="profile-card empty">
                        <p>You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div key={order.id} className="profile-card order-card">
                                <div className="order-header">
                                    <span className="order-id">Order #{order.id}</span>
                                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                                        {order.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="order-date">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </div>
                                <div className="order-items">
                                    {order.items.map(item => (
                                        <div key={item.id} className="order-item-row">
                                            <span>
                                                {item.quantity}x <Link to={`/product/${item.product_id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{item.product_name || `Item #${item.product_id}`}</Link>
                                                {item.variation_name ? <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6 }}>({item.variation_name})</span> : ''}
                                            </span>
                                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="order-total">
                                    <strong>Total:</strong> ${order.total.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add extra padding at bottom so nav doesn't hide content */}
            <div style={{ height: 100 }}></div>
        </div>
    );
}
