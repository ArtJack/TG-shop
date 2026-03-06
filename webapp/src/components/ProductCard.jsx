export default function ProductCard({ product, quantity, onAdd, onClick }) {
    const discount = product.old_price
        ? Math.round((1 - product.price / product.old_price) * 100)
        : null;

    return (
        <div className="product-card" onClick={onClick}>
            <div className="product-image-wrapper">
                <img
                    src={product.image_url || (product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : '')}
                    alt={product.name}
                    className="product-image"
                    loading="lazy"
                />
                {/* Overlay gradient at bottom for text readability */}
                <div className="product-image-overlay" />

                {/* Top-left badges */}
                <div className="product-badges">
                    {!product.in_stock && <span className="badge badge-preorder" style={{ background: '#3b82f6', color: '#fff', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)' }}>PRE-ORDER</span>}
                    {discount && <span className="badge badge-sale">−{discount}%</span>}
                    {product.is_new && !product.old_price && <span className="badge badge-new">NEW</span>}
                </div>

                {/* Cart quantity bubble */}
                {quantity > 0 && (
                    <div className="product-qty-bubble">{quantity}</div>
                )}

                {/* Quick-add button */}
                <button
                    className="btn-quick-add"
                    onClick={(e) => { e.stopPropagation(); onAdd(); }}
                    aria-label="Add to cart"
                >
                    {quantity > 0 ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                    )}
                </button>
            </div>

            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-footer">
                    <div className="price-group">
                        <span className="product-price">${product.price.toFixed(2)}</span>
                        {product.old_price && (
                            <span className="product-old-price">${product.old_price.toFixed(2)}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
