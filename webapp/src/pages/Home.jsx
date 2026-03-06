import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import API_URL from '../utils/api.js';

const SPECIAL_TILES = [
    { key: 'sale', label: 'Sale 50% Off', emoji: '🔥', color: 'rgba(255, 65, 108, 0.5), rgba(255, 75, 43, 0.8)' },
    { key: 'new', label: 'New Arrivals', emoji: '✨', color: 'rgba(121, 40, 202, 0.6), rgba(255, 0, 128, 0.4)' },
];

const DEFAULT_COLOR = 'rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5)';
const DEFAULT_EMOJI = '📁';

export default function Home() {
    const navigate = useNavigate();
    const [dbCategories, setDbCategories] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/api/categories`)
            .then(r => r.ok ? r.json() : [])
            .then(data => setDbCategories(
                data.filter(c => !c.parent_id && c.slug !== 'available-now' && c.name.toLowerCase() !== 'available now')
            ))
            .catch(() => { });
    }, []);

    const handleCategoryClick = (key) => {
        if (key === 'new') navigate('/category/new-arrivals');
        else if (key === 'sale') navigate('/category/sale');
        else navigate(`/category/${key}`);
    };

    return (
        <div className="home">
            {/* Branding header */}
            <div className="home-header">
                <h1 className="store-name">Private Drop</h1>
                <p className="store-tagline">Curated fashion &amp; lifestyle</p>
            </div>

            {/* Full-width Available Now banner */}
            <button
                className="available-now-banner"
                onClick={() => handleCategoryClick('available-now')}
            >
                <div className="available-now-left">
                    <span className="available-now-icon">⚡</span>
                    <div>
                        <span className="available-now-title">Available Now</span>
                        <span className="available-now-sub">Ships today · In local stock</span>
                    </div>
                </div>
                <span className="available-now-arrow">›</span>
            </button>

            {/* Hero promo row — Sale & New Arrivals as wide horizontal tiles */}
            <div className="hero-row">
                {SPECIAL_TILES.map((cat) => (
                    <button
                        key={cat.key}
                        className="hero-tile"
                        onClick={() => handleCategoryClick(cat.key)}
                        style={{ '--card-gradient': `linear-gradient(135deg, ${cat.color})` }}
                    >
                        <span className="hero-emoji">{cat.emoji}</span>
                        <span className="hero-label">{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Square category grid */}
            {dbCategories.length > 0 && (
                <>
                    <p className="section-title">Shop by Category</p>
                    <div className="category-grid">
                        {dbCategories.map((cat) => (
                            <button
                                key={cat.id}
                                className="category-card"
                                onClick={() => handleCategoryClick(cat.slug || cat.name.toLowerCase())}
                                style={{ '--card-gradient': `linear-gradient(135deg, ${cat.color || DEFAULT_COLOR})` }}
                            >
                                <span className="category-emoji">
                                    {cat.image_url
                                        ? <img src={cat.image_url} alt={cat.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                                        : (cat.emoji || DEFAULT_EMOJI)}
                                </span>
                                <span className="category-label">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Bottom nav spacer */}
            <div style={{ height: 24 }} />
        </div>
    );
}
