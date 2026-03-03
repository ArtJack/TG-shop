import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';

export default function OrderSuccess({ setCart }) {
    const navigate = useNavigate();
    const { close } = useTelegram();

    useEffect(() => {
        // Clear cart on mount
        setCart([]);
    }, [setCart]);

    return (
        <div className="order-success">
            <div className="success-animation">
                <div className="success-circle">
                    <span className="success-check">✓</span>
                </div>
            </div>
            <h1>Order Placed!</h1>
            <p>Thank you for your purchase 🎉</p>
            <p className="success-subtitle">
                Your order is pending verification of your Zelle payment. You will receive an update once it is confirmed.
            </p>
            <div className="success-actions">
                <button className="btn-primary" onClick={() => navigate('/')}>
                    Continue Shopping
                </button>
                <button className="btn-secondary" onClick={close}>
                    Close
                </button>
            </div>
        </div>
    );
}
