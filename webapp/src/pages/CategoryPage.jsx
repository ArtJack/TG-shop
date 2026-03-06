import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

import API_URL from '../utils/api.js';

// Hardcoded display info for pages that use special filter logic (not a category slug)
const SPECIAL_TITLES = {
    'new-arrivals': { name: 'New Arrivals', emoji: '✨' },
    'sale': { name: 'Sale 50% Off', emoji: '🔥' },
};

// Display overrides for DB categories that also need a nice title but ARE fetched from DB
const DISPLAY_OVERRIDES = {
    'available-now': { name: 'Available Now', emoji: '⚡' },
};

export default function CategoryPage({ cart, setCart }) {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSub, setActiveSub] = useState('');
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [subcats, setSubcats] = useState([]);

    const special = SPECIAL_TITLES[slug];
    const override = DISPLAY_OVERRIDES[slug];

    // Fetch category info + subcategories from DB
    useEffect(() => {
        setActiveSub(''); // reset sub-tab when slug changes

        // For special pages (Available Now, Sale, New Arrivals) use top-level categories as filter tabs
        const specialSlugs = ['available-now', 'sale', 'new-arrivals'];
        if (specialSlugs.includes(slug)) {
            fetch(`${API_URL}/api/categories`)
                .then(r => r.json())
                .then(cats => {
                    const topLevel = cats.filter(c =>
                        !c.parent_id &&
                        c.slug !== 'available-now' &&
                        c.name.toLowerCase() !== 'available now'
                    );
                    if (topLevel.length > 0) {
                        setSubcats([{ key: '', label: 'All', emoji: '' }, ...topLevel.map(c => ({ key: c.slug || c.name.toLowerCase(), label: c.name, emoji: c.emoji }))]);
                    } else {
                        setSubcats([]);
                    }
                })
                .catch(() => { });
            return;
        }

        fetch(`${API_URL}/api/categories`)
            .then(r => r.json())
            .then(cats => {
                const match = cats.find(c => c.slug === slug || c.name.toLowerCase() === slug);
                if (match) {
                    setCategoryInfo(match);
                    const children = cats.filter(c => c.parent_id === match.id);
                    if (children.length > 0) {
                        setSubcats([{ key: '', label: 'All', emoji: '' }, ...children.map(c => ({ key: c.slug || c.name.toLowerCase(), label: c.name, emoji: c.emoji }))]);
                    } else {
                        setSubcats([]);
                    }
                }
            })
            .catch(() => { });
    }, [slug]);

    // Fetch products whenever slug or active sub-tab changes
    useEffect(() => {
        const params = new URLSearchParams();

        if (slug === 'new-arrivals') {
            params.set('is_new', 'true');
            if (activeSub) params.set('category', activeSub);
        } else if (slug === 'sale') {
            params.set('on_sale', 'true');
            if (activeSub) params.set('category', activeSub);
        } else if (slug === 'available-now') {
            params.set('in_stock', 'true');
            if (activeSub) params.set('category', activeSub);
        } else {
            // For regular categories — pass category + optional subcategory
            params.set('category', slug);
            if (activeSub) params.set('subcategory', activeSub);
        }

        setLoading(true);
        fetch(`${API_URL}/api/products?${params.toString()}`)
            .then(r => r.json())
            .then(data => { setProducts(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [slug, activeSub]);

    const addToCart = (product) => {
        setCart(prev => {
            const exists = prev.find(i => i.product.id === product.id);
            if (exists) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { product, quantity: 1 }];
        });
    };

    const getQuantity = (productId) => {
        const item = cart.find(i => i.product.id === productId);
        return item ? item.quantity : 0;
    };

    const emoji = override?.emoji || special?.emoji || categoryInfo?.emoji || '📦';
    const title = override?.name || special?.name || categoryInfo?.name || slug.replace(/-/g, ' ');

    return (
        <div className="category-page">
            <div className="category-page-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1>{emoji} {title}</h1>
                <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
                    {!loading && `${products.length} items`}
                </span>
            </div>

            {/* Dynamic subcategory filter tabs */}
            {subcats.length > 0 && (
                <div className="subcategory-tabs" style={{ padding: '12px 16px 0' }}>
                    {subcats.map(sub => (
                        <button
                            key={sub.key}
                            className={`subcategory-tab ${activeSub === sub.key ? 'active' : ''}`}
                            onClick={() => setActiveSub(sub.key)}
                        >
                            {sub.emoji && <span style={{ marginRight: 4 }}>{sub.emoji}</span>}
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="loader">
                    <div className="spinner" />
                    <p>Loading…</p>
                </div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">😔</span>
                    <p>No products found</p>
                </div>
            ) : (
                <div className="products-grid" style={{ marginTop: subcats.length > 0 ? 12 : 16 }}>
                    {products.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            quantity={getQuantity(product.id)}
                            onAdd={() => addToCart(product)}
                            onClick={() => navigate(`/product/${product.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
