import { createContext, useContext, useEffect, useState } from "react";
import { subscribeToAuth, loginWithGoogle, loginWithEmail, registerWithEmail, logout } from "../firebase/auth";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAuth((userData) => {
            setUser(userData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
