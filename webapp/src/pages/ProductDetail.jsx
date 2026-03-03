import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function ProductDetail({ cart, setCart }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/products/${id}`)
            .then((r) => r.json())
            .then((data) => {
                setProduct(data);
                if (data.variations && data.variations.length > 0) {
                    setSelectedVariation(data.variations[0]);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const addToCart = () => {
        setCart((prev) => {
            const vid = selectedVariation ? selectedVariation.id : null;
            const exists = prev.find((i) => i.product.id === product.id && (i.variation?.id || null) === vid);
            if (exists) {
                return prev.map((i) =>
                    i.product.id === product.id && (i.variation?.id || null) === vid
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, { product, quantity: 1, variation: selectedVariation }];
        });
    };

    const getQuantity = () => {
        const vid = selectedVariation ? selectedVariation.id : null;
        const item = cart.find((i) => i.product.id === product?.id && (i.variation?.id || null) === vid);
        return item ? item.quantity : 0;
    };

    if (loading) {
        return (
            <div className="product-detail">
                <div className="loader">
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-detail">
                <div className="empty-state">
                    <p>Product not found</p>
                    <button className="btn-primary" onClick={() => navigate(-1)}>
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    const qty = getQuantity();
    const currentPrice = (product.price || 0) + (selectedVariation?.price_adjustment || 0);

    return (
        <div className="product-detail">
            <div className="detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ←
                </button>
            </div>

            <div className="detail-image-wrapper">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="detail-image"
                />
                {product.old_price && (
                    <div className="sale-badge">−50%</div>
                )}
                {product.is_new && !product.old_price && (
                    <div className="new-badge">NEW</div>
                )}
            </div>

            <div className="detail-content">
                <h1 className="detail-name">{product.name}</h1>

                <div className="detail-price-row">
                    <span className="detail-price">
                        ${currentPrice.toFixed(2)}
                    </span>
                    {product.old_price && (
                        <span className="detail-old-price">
                            ${product.old_price.toFixed(2)}
                        </span>
                    )}
                </div>

                <p className="detail-category">
                    {product.category}
                    {product.subcategory ? ` · ${product.subcategory}` : ''}
                </p>

                {product.variations && product.variations.length > 0 && (
                    <div className="detail-variations" style={{ marginBottom: 15 }}>
                        <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Variation</label>
                        <select
                            className="admin-input"
                            style={{ marginTop: 5, padding: 12 }}
                            value={selectedVariation?.id || ''}
                            onChange={(e) => {
                                const v = product.variations.find(v => v.id === parseInt(e.target.value));
                                setSelectedVariation(v);
                            }}
                        >
                            {product.variations.map(v => {
                                const adj = v.price_adjustment || 0;
                                return (
                                    <option key={v.id} value={v.id}>
                                        {v.name} {adj > 0 ? `(+$${adj.toFixed(2)})` : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                )}

                <p className="detail-description">{product.description}</p>

                <div className="detail-actions">
                    <button className="btn-add-to-cart" onClick={addToCart}>
                        {qty > 0 ? `In cart (${qty}) — Add more` : 'Add to Cart'}
                    </button>
                    {qty > 0 && (
                        <button
                            className="btn-go-cart"
                            onClick={() => navigate('/cart')}
                        >
                            Go to Cart →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
