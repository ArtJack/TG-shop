import { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Catalog({ cart, setCart }) {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(null);

    useEffect(() => {
        // Fetch categories
        fetch(`${API_URL}/api/categories`)
            .then(r => r.json())
            .then(data => setCategories(data))
            .catch(() => { });

        // Fetch products
        const url = activeCategory
            ? `${API_URL}/api/products?category=${activeCategory}`
            : `${API_URL}/api/products`;
        setLoading(true);
        fetch(url)
            .then((r) => r.json())
            .then((data) => {
                setProducts(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [activeCategory]);

    const addToCart = useCallback(
        (product) => {
            setCart((prev) => {
                const exists = prev.find((item) => item.product.id === product.id);
                if (exists) {
                    return prev.map((item) =>
                        item.product.id === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                }
                return [...prev, { product, quantity: 1 }];
            });
        },
        [setCart]
    );

    const getQuantity = (productId) => {
        const item = cart.find((i) => i.product.id === productId);
        return item ? item.quantity : 0;
    };

    return (
        <div className="catalog">
            <div className="catalog-header">
                <h1 className="catalog-title">
                    <span className="title-icon">🛍</span>
                    TG Shop
                </h1>
                <p className="catalog-subtitle">Премиальные товары с доставкой</p>
            </div>

            <div className="category-tabs" style={{ display: 'flex', gap: 10, padding: '0 16px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                <button
                    className={`category-tab ${activeCategory === null ? 'active' : ''}`}
                    onClick={() => setActiveCategory(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: '1px solid var(--border)', background: activeCategory === null ? 'var(--button-bg)' : 'transparent', color: activeCategory === null ? '#fff' : 'var(--text-primary)', whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0 }}
                >
                    Все
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        className={`category-tab ${activeCategory === cat.name ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.name)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', background: activeCategory === cat.name ? 'var(--button-bg)' : 'transparent', color: activeCategory === cat.name ? '#fff' : 'var(--text-primary)', whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0 }}
                    >
                        {cat.image_url && <img src={cat.image_url} alt={cat.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />}
                        {cat.name}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loader">
                    <div className="spinner" />
                    <p>Загрузка каталога…</p>
                </div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <p>😔 Товары не найдены</p>
                </div>
            ) : (
                <div className="products-grid">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            quantity={getQuantity(product.id)}
                            onAdd={() => addToCart(product)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
