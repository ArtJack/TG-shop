import React, { createContext, useContext, useEffect, useState } from 'react';

const TelegramContext = createContext({});

export const TelegramProvider = ({ children }) => {
    const [tg, setTg] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const app = window.Telegram?.WebApp;
        if (app) {
            setTg(app);
            app.ready();
            app.expand();

            // Try to get user immediately
            if (app.initDataUnsafe?.user) {
                setUser(app.initDataUnsafe.user);
            } else {
                // Sometime Telegram WebApp takes a moment to initialize the data
                // This is especially true on iOS/Android clients vs Desktop
                const checkUser = setInterval(() => {
                    const latestApp = window.Telegram?.WebApp;
                    if (latestApp?.initDataUnsafe?.user) {
                        setUser(latestApp.initDataUnsafe.user);
                        clearInterval(checkUser);
                    }
                }, 100);

                // Stop checking after 5 seconds to avoid infinite loop
                setTimeout(() => clearInterval(checkUser), 5000);
            }
        }
    }, []);

    const value = {
        tg,
        user,
        initData: tg?.initData || '',
        colorScheme: tg?.colorScheme || 'dark',
        themeParams: tg?.themeParams || {},
        ready: () => tg?.ready(),
        close: () => tg?.close(),
        expand: () => tg?.expand()
    };

    return (
        <TelegramContext.Provider value={value}>
            {children}
        </TelegramContext.Provider>
    );
};

export const useTelegram = () => useContext(TelegramContext);
