/* eslint-disable react-refresh/only-export-components -- co-locating context + hook with provider is intentional */
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { authService } from "../services/authService";
import { SUPER_ADMIN_EMAIL, ROLES } from "../utils/constants";

export const AuthContext = createContext(null);

/**
 * Custom hook to consume auth context.
 * Co-located with the provider for single-source-of-truth.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = authService.subscribeToAuth((userData) => {
            setUser(userData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = useMemo(() => {
        // Determine if the current user is the Super Admin
        const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL && 
            (user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN);

        // Check if user has any admin-level access
        const isAdmin = isSuperAdmin || user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

        return {
            user,
            loading,
            isSuperAdmin,
            isAdmin,
            loginWithGoogle: () => authService.loginWithGoogle(),
            loginWithEmail: (email, password) => authService.loginWithEmail(email, password),
            registerWithEmail: (name, email, password, college) => authService.registerWithEmail(name, email, password, college),
            logout: () => authService.logout(),
            resetPassword: (email) => authService.resetPassword(email)
        };
    }, [user, loading]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
