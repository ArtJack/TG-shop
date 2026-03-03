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

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/category/:slug"
          element={<CategoryPage cart={cart} setCart={setCart} />}
        />
        <Route
          path="/product/:id"
          element={<ProductDetail cart={cart} setCart={setCart} />}
        />
        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="/order-success"
          element={<OrderSuccess setCart={setCart} />}
        />
      </Routes>

      {showNav && (
        <nav className="bottom-nav">
          <button
            className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Shop</span>
          </button>
          <button
            className={`nav-btn cart-nav-btn ${location.pathname === '/cart' ? 'active' : ''}`}
            onClick={() => navigate('/cart')}
          >
            <span className="nav-icon">🛒</span>
            <span className="nav-label">Cart</span>
            {cartCount > 0 && (
              <span className="nav-badge">{cartCount}</span>
            )}
          </button>
          <button
            className={`nav-btn ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => navigate('/profile')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
}
