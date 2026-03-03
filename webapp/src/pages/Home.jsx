import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
    { key: 'new', label: 'New Arrivals', emoji: '✨', color: '#f0c27f, #4b1248' },
    { key: 'sale', label: 'Sale 50% Off', emoji: '🔥', color: '#ff416c, #ff4b2b' },
    { key: 'jewelry', label: 'Jewelry', emoji: '💎', color: '#a18cd1, #fbc2eb' },
    { key: 'totes', label: 'Totes', emoji: '👜', color: '#ffecd2, #fcb69f' },
    { key: 'clothes', label: 'Clothes', emoji: '👗', color: '#a1c4fd, #c2e9fb' },
    { key: 'shoes', label: 'Shoes', emoji: '👠', color: '#d4fc79, #96e6a1' },
    { key: 'perfume', label: 'Perfume', emoji: '🌸', color: '#f093fb, #f5576c' },
    { key: 'home', label: 'Home', emoji: '🏡', color: '#4facfe, #00f2fe' },
];

export default function Home() {
    const navigate = useNavigate();

    const handleCategoryClick = (cat) => {
        if (cat.key === 'new') {
            navigate('/category/new-arrivals');
        } else if (cat.key === 'sale') {
            navigate('/category/sale');
        } else {
            navigate(`/category/${cat.key}`);
        }
    };

    return (
        <div className="home">
            <div className="home-header">
                <h1 className="store-name">Desert Mirage</h1>
                <p className="store-tagline">Curated fashion & lifestyle</p>
            </div>

            <div className="category-grid">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        className="category-card"
                        onClick={() => handleCategoryClick(cat)}
                        style={{
                            '--card-gradient': `linear-gradient(135deg, ${cat.color})`,
                        }}
                    >
                        <span className="category-emoji">{cat.emoji}</span>
                        <span className="category-label">{cat.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
