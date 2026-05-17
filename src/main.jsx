/* eslint-disable react-refresh/only-export-components -- entry point intentionally composes providers */
import { StrictMode, useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import SplashScreen from './components/SplashScreen'

function Root() {
    const [showSplash, setShowSplash] = useState(true);

    const handleSplashFinish = useCallback(() => {
        setShowSplash(false);
    }, []);

    return (
        <StrictMode>
            <ErrorBoundary>
                <HelmetProvider>
                    <AuthProvider>
                        <ToastProvider>
                            {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
                            <App />
                        </ToastProvider>
                    </AuthProvider>
                </HelmetProvider>
            </ErrorBoundary>
        </StrictMode>
    );
}

createRoot(document.getElementById('root')).render(<Root />)
