export default function ProductCard({ product, quantity, onAdd, onClick }) {
    return (
        <div className="product-card" onClick={onClick}>
            <div className="product-image-wrapper">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="product-image"
                    loading="lazy"
                />
                {quantity > 0 && (
                    <div className="product-badge">{quantity}</div>
                )}
                {product.old_price && (
                    <div className="sale-tag">−50%</div>
                )}
                {product.is_new && !product.old_price && (
                    <div className="new-tag">NEW</div>
                )}
            </div>
            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-footer">
                    <div className="price-group">
                        <span className="product-price">
                            ${product.price.toFixed(2)}
                        </span>
                        {product.old_price && (
                            <span className="product-old-price">
                                ${product.old_price.toFixed(2)}
                            </span>
                        )}
                    </div>
                    <button
                        className="btn-add"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd();
                        }}
                    >
                        {quantity > 0 ? '+' : '🛒'}
                    </button>
                </div>
            </div>
        </div>
    );
}
