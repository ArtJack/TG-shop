import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Admin from './pages/Admin';
import OrderSuccess from './pages/OrderSuccess';
import Profile from './pages/Profile';

export default function App() {
  const [cart, setCart] = useState([]);
  const { ready, expand } = useTelegram();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    ready();
    expand();
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const showNav = !location.pathname.startsWith('/product/') &&
    location.pathname !== '/order-success';

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:slug" element={<CategoryPage cart={cart} setCart={setCart} />} />
        <Route path="/product/:id" element={<ProductDetail cart={cart} setCart={setCart} />} />
        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/order-success" element={<OrderSuccess setCart={setCart} />} />
      </Routes>

      {showNav && (
        <nav className="bottom-nav">
          {/* Shop */}
          <button className={`nav-btn ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>
            <span className="nav-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {isActive('/')
                  ? <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" stroke="currentColor" />
                  : <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>
                }
              </svg>
            </span>
            <span className="nav-label">Shop</span>
          </button>

          {/* Cart */}
          <button className={`nav-btn ${isActive('/cart') ? 'active' : ''}`} onClick={() => navigate('/cart')}>
            <span className="nav-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {isActive('/cart')
                  ? <><circle cx="9" cy="21" r="1" fill="currentColor" /><circle cx="20" cy="21" r="1" fill="currentColor" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" fill="none" /></>
                  : <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>
                }
              </svg>
            </span>
            <span className="nav-label">Cart</span>
            {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
          </button>

          {/* Profile */}
          <button className={`nav-btn ${isActive('/profile') ? 'active' : ''}`} onClick={() => navigate('/profile')}>
            <span className="nav-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {isActive('/profile')
                  ? <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="currentColor" stroke="currentColor" /><circle cx="12" cy="7" r="4" fill="currentColor" /></>
                  : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
                }
              </svg>
            </span>
            <span className="nav-label">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
}
