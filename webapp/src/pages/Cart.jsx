import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Cart({ cart, setCart }) {
    const navigate = useNavigate();
    const { user } = useTelegram();

    const [isCheckout, setIsCheckout] = useState(false);
    const [isPayment, setIsPayment] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        customer_name: user?.first_name || '',
        phone: '',
        shipping_address: '',
        shipping_city: '',
        shipping_state: '',
        shipping_zip: ''
    });

    // Auto-fill shipping data from user profile
    useEffect(() => {
        const fetchProfile = async () => {
            const telegramId = user?.id || 123456789;
            try {
                const res = await fetch(`${API_URL}/api/users/${telegramId}/profile`);
                if (res.ok) {
                    const profile = await res.json();
                    setForm({
                        customer_name: profile.customer_name || user?.first_name || '',
                        phone: profile.phone || '',
                        shipping_address: profile.shipping_address || '',
                        shipping_city: profile.shipping_city || '',
                        shipping_state: profile.shipping_state || '',
                        shipping_zip: profile.shipping_zip || ''
                    });
                }
            } catch (err) {
                console.error("Failed to fetch user profile for auto-fill", err);
            }
        };
        fetchProfile();
    }, [user?.id]);

    const updateQuantity = (productId, variationId, delta) => {
        setCart((prev) =>
            prev
                .map((item) =>
                    item.product.id === productId && (item.variation?.id || null) === (varId(variationId))
                        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const varId = (id) => id || null;

    const removeItem = (productId, variationId) => {
        setCart((prev) => prev.filter((item) => !(item.product.id === productId && (item.variation?.id || null) === varId(variationId))));
    };

    const total = cart.reduce(
        (sum, item) => sum + (item.product.price + (item.variation ? item.variation.price_adjustment : 0)) * item.quantity,
        0
    );

    const proceedToPayment = (e) => {
        e.preventDefault();
        const code = 'ZELLE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        setConfirmationCode(code);
        setIsPayment(true);
    };

    const submitOrder = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const orderData = {
            telegram_user_id: user?.id || 123456789, // fallback for testing outside TG
            customer_name: form.customer_name || user?.first_name || 'Anonymous',
            customer_username: user?.username || '',
            phone: form.phone,
            shipping_address: form.shipping_address,
            shipping_city: form.shipping_city,
            shipping_state: form.shipping_state,
            shipping_zip: form.shipping_zip,
            payment_method: 'zelle',
            payment_confirmation: confirmationCode,
            items: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                variation_id: item.variation?.id || null
            }))
        };

        try {
            const res = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                navigate('/order-success');
            } else {
                const data = await res.json();
                setError(data.detail || 'Failed to create order');
            }
        } catch (err) {
            setError('Network error placing order');
        }
        setLoading(false);
    };

    if (cart.length === 0 && !isCheckout && !isPayment) {
        return (
            <div className="cart-page">
                <div className="cart-header">
                    <h1>🛒 Cart</h1>
                </div>
                <div className="empty-state">
                    <div className="empty-icon">🛒</div>
                    <p>Your cart is empty</p>
                    <button className="btn-primary" onClick={() => navigate('/')}>
                        Go to Catalog
                    </button>
                </div>
            </div>
        );
    }

    if (isPayment) {
        return (
            <div className="cart-page">
                <div className="cart-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className="back-btn" onClick={() => setIsPayment(false)}>←</button>
                    <h1>Payment</h1>
                </div>

                <div style={{ padding: 16 }}>
                    <div className="checkout-summary" style={{ marginBottom: 20, padding: 16, background: 'var(--card-bg)', borderRadius: 12 }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>Zelle Instructions</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>
                            Please send exactly <strong style={{ color: 'var(--text-primary)' }}>${total.toFixed(2)}</strong> to the following Zelle number:
                        </p>
                        <div style={{ padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8, marginTop: 12, textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>
                            +1 (555) 123-4567
                        </div>

                        <p style={{ color: 'var(--text-secondary)', marginTop: 24, fontSize: 14 }}>
                            <strong>IMPORTANT:</strong> In the Zelle memo / NOTE field, you MUST enter the following confirmation code so we can identify your payment:
                        </p>
                        <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--accent)', borderRadius: 8, marginTop: 12, textAlign: 'center', fontWeight: 'bold', fontSize: 22, letterSpacing: 2, color: 'var(--accent)' }}>
                            {confirmationCode}
                        </div>
                    </div>

                    {error && <div style={{ color: 'var(--danger)', marginBottom: 16, padding: 12, background: 'rgba(255, 60, 60, 0.1)', borderRadius: 8 }}>{error}</div>}

                    <button
                        className="btn-checkout"
                        onClick={submitOrder}
                        disabled={loading}
                        style={{ marginTop: 10, padding: 16, width: '100%', fontSize: 16, fontWeight: 'bold' }}
                    >
                        {loading ? 'Processing...' : 'Оплатил (I Paid)'}
                    </button>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12, marginTop: 16 }}>
                        By clicking "I Paid", you confirm that the transfer was sent. Your order will be shipped once the payment is verified.
                    </p>
                </div>
            </div>
        );
    }

    if (isCheckout) {
        return (
            <div className="cart-page">
                <div className="cart-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className="back-btn" onClick={() => setIsCheckout(false)}>←</button>
                    <h1>Checkout</h1>
                </div>

                <form className="checkout-form" onSubmit={proceedToPayment} style={{ padding: 16 }}>
                    <div className="checkout-summary" style={{ marginBottom: 20, padding: 16, background: 'var(--card-bg)', borderRadius: 12 }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>Order Summary</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>{cart.length} items</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <h3 style={{ marginBottom: 16 }}>Shipping Details (US)</h3>

                    {error && <div style={{ color: 'var(--danger)', marginBottom: 16, padding: 12, background: 'rgba(255, 60, 60, 0.1)', borderRadius: 8 }}>{error}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input className="checkout-input" required placeholder="Full Name *" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
                        <input className="checkout-input" required type="tel" placeholder="Phone Number *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        <input className="checkout-input" required placeholder="Street Address *" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} />

                        <div style={{ display: 'flex', gap: 8 }}>
                            <input className="checkout-input" required placeholder="City *" style={{ flex: 2 }} value={form.shipping_city} onChange={e => setForm({ ...form, shipping_city: e.target.value })} />
                            <input className="checkout-input" required placeholder="State *" style={{ flex: 1 }} value={form.shipping_state} onChange={e => setForm({ ...form, shipping_state: e.target.value })} />
                        </div>
                        <input className="checkout-input" required placeholder="ZIP Code *" type="text" value={form.shipping_zip} onChange={e => setForm({ ...form, shipping_zip: e.target.value })} />
                    </div>

                    <button
                        className="btn-checkout"
                        type="submit"
                        disabled={loading}
                        style={{ marginTop: 24, padding: 16 }}
                    >
                        Continue to Payment
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="cart-header">
                <h1>🛒 Cart</h1>
                <span className="cart-count">{cart.length} items</span>
            </div>

            <div className="cart-items">
                {cart.map((item, idx) => {
                    const price = item.product.price + (item.variation ? item.variation.price_adjustment : 0);
                    const vId = item.variation?.id || null;
                    return (
                        <div key={`${item.product.id}-${vId}-${idx}`} className="cart-item">
                            <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="cart-item-image"
                            />
                            <div className="cart-item-info">
                                <h3>{item.product.name} {item.variation ? <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}><br />({item.variation.name})</span> : ''}</h3>
                                <p className="cart-item-price">
                                    ${price.toFixed(2)}
                                </p>
                            </div>
                            <div className="cart-item-controls">
                                <button className="qty-btn" onClick={() => updateQuantity(item.product.id, vId, -1)}>−</button>
                                <span className="qty-value">{item.quantity}</span>
                                <button className="qty-btn" onClick={() => updateQuantity(item.product.id, vId, 1)}>+</button>
                            </div>
                            <button
                                className="remove-btn"
                                onClick={() => removeItem(item.product.id, vId)}
                                title="Remove"
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="cart-footer">
                <div className="cart-total">
                    <span>Total:</span>
                    <span className="total-price">
                        ${total.toFixed(2)}
                    </span>
                </div>
                <button
                    className="btn-checkout"
                    onClick={() => setIsCheckout(true)}
                >
                    Proceed to Checkout
                </button>
            </div>
        </div>
    );
}
