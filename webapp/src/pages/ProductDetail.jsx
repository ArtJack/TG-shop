import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import API_URL from '../utils/api.js';

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

            const maxQuantity = selectedVariation ? selectedVariation.quantity : product.quantity;

            if (exists) {
                if (product.in_stock && exists.quantity >= maxQuantity) {
                    alert(`Sorry, only ${maxQuantity} items available in stock.`);
                    return prev;
                }
                return prev.map((i) =>
                    i.product.id === product.id && (i.variation?.id || null) === vid
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }

            if (product.in_stock && maxQuantity < 1) {
                alert('This size is currently unavailable.');
                return prev;
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
                {product.image_urls && product.image_urls.length > 1 ? (
                    <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: 10, paddingBottom: 10 }}>
                        {product.image_urls.map((url, idx) => (
                            <img
                                key={idx}
                                src={url}
                                alt={`${product.name} ${idx + 1}`}
                                className="detail-image"
                                style={{ scrollSnapAlign: 'center', flex: '0 0 auto', width: '100%', objectFit: 'contain' }}
                            />
                        ))}
                    </div>
                ) : (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="detail-image"
                    />
                )}

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

                {product.variations && product.variations.length > 0 && (() => {
                    // Detect if these variations are sizes
                    const looksLikeSize = product.variations.some(v =>
                        /\d/.test(v.name) || /size|us|eu|uk/i.test(v.name)
                    );
                    const label = looksLikeSize ? 'Size' : 'Option';
                    const outOfStock = selectedVariation && selectedVariation.quantity === 0;

                    return (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                    {label}{selectedVariation ? `: ${selectedVariation.name}` : ''}
                                </p>
                                {outOfStock && (
                                    <span style={{ fontSize: 11, color: product.in_stock ? '#ff6b6b' : '#818cf8', fontWeight: 600 }}>
                                        {product.in_stock ? 'Out of stock' : 'Available to order'}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {product.variations.map(v => {
                                    const adj = v.price_adjustment || 0;
                                    const isSelected = selectedVariation?.id === v.id;
                                    // For pre-order items, all sizes are orderable even if quantity=0
                                    const noStock = product.in_stock && v.quantity === 0;
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => !noStock && setSelectedVariation(v)}
                                            style={{
                                                minWidth: looksLikeSize ? 52 : 'auto',
                                                padding: looksLikeSize ? '10px 8px' : '8px 16px',
                                                borderRadius: looksLikeSize ? '10px' : 'var(--radius-sm)',
                                                border: isSelected ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                                                background: isSelected ? 'var(--accent-glow)' : noStock ? 'transparent' : 'var(--bg-secondary)',
                                                color: noStock ? 'var(--text-muted)' : isSelected ? 'var(--accent-light)' : 'var(--text-secondary)',
                                                fontSize: looksLikeSize ? 13 : 13,
                                                fontWeight: isSelected ? 700 : 600,
                                                cursor: noStock ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s',
                                                fontFamily: 'var(--font)',
                                                textDecoration: noStock ? 'line-through' : 'none',
                                                opacity: noStock ? 0.45 : 1,
                                                textAlign: 'center',
                                            }}
                                        >
                                            {v.name}{adj > 0 ? ` +$${adj.toFixed(2)}` : ''}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                <p className="detail-description">{product.description}</p>

                <div className="detail-actions">
                    <button
                        className="btn-add-to-cart"
                        onClick={addToCart}
                        disabled={product.in_stock && (selectedVariation ? selectedVariation.quantity === 0 : product.quantity === 0)}
                    >
                        {qty > 0 ? `In cart (${qty}) — Add more` : (!product.in_stock ? 'Reserve — Pre-Order' : 'Add to Cart')}
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
