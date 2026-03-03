import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const API_URL = import.meta.env.VITE_API_URL || '';

const SUBCATEGORIES = {
    jewelry: [
        { key: '', label: 'All' },
        { key: 'rings', label: 'Rings' },
        { key: 'earrings', label: 'Earrings' },
        { key: 'brooches', label: 'Brooches' },
    ],
    clothes: [
        { key: '', label: 'All' },
        { key: 'women', label: 'Women' },
        { key: 'men', label: 'Men' },
    ],
};

const CATEGORY_TITLES = {
    jewelry: '💎 Jewelry',
    totes: '👜 Totes',
    clothes: '👗 Clothes',
    shoes: '👠 Shoes',
    perfume: '🌸 Perfume',
    home: '🏡 Home',
    'new-arrivals': '✨ New Arrivals',
    sale: '🔥 Sale 50% Off',
};

export default function CategoryPage({ cart, setCart }) {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSub, setActiveSub] = useState('');

    const subcats = SUBCATEGORIES[slug] || null;
    const title = CATEGORY_TITLES[slug] || slug;

    useEffect(() => {
        let url = `${API_URL}/api/products`;
        const params = new URLSearchParams();

        if (slug === 'new-arrivals') {
            params.set('is_new', 'true');
        } else if (slug === 'sale') {
            params.set('on_sale', 'true');
        } else {
            params.set('category', slug);
            if (activeSub) {
                params.set('subcategory', activeSub);
            }
        }

        url += '?' + params.toString();
        setLoading(true);
        fetch(url)
            .then((r) => r.json())
            .then((data) => {
                setProducts(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [slug, activeSub]);

    const addToCart = (product) => {
        setCart((prev) => {
            const exists = prev.find((i) => i.product.id === product.id);
            if (exists) {
                return prev.map((i) =>
                    i.product.id === product.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const getQuantity = (productId) => {
        const item = cart.find((i) => i.product.id === productId);
        return item ? item.quantity : 0;
    };

    return (
        <div className="category-page">
            <div className="category-page-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    ←
                </button>
                <h1>{title}</h1>
            </div>

            {subcats && (
                <div className="subcategory-tabs">
                    {subcats.map((sub) => (
                        <button
                            key={sub.key}
                            className={`subcategory-tab ${activeSub === sub.key ? 'active' : ''}`}
                            onClick={() => setActiveSub(sub.key)}
                        >
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
                    <p>😔 No products found</p>
                </div>
            ) : (
                <div className="products-grid">
                    {products.map((product) => (
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
