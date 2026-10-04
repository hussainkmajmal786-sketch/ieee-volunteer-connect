/* eslint-disable react-refresh/only-export-components -- co-locating context + hook with provider is intentional */
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { authService } from "../services/authService";
import { authClient } from "../lib/authClient";
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
    const { data: session, isPending } = authClient.useSession();
    const sessionUser = session?.user ?? null;
    const [profile, setProfile] = useState({ uid: null, user: null });

    // Follow the signed-in user's profile document (points, role… update live).
    useEffect(() => {
        if (!sessionUser) return;
        return authService.subscribeToProfile(sessionUser, (u) => setProfile({ uid: sessionUser.id, user: u }));
    }, [sessionUser]);

    const user = sessionUser && profile.uid === sessionUser.id ? profile.user : null;
    const loading = isPending || (!!sessionUser && !user);

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
            loginWithGoogle: (callbackURL) => authService.loginWithGoogle(callbackURL),
            loginWithEmail: (email, password) => authService.loginWithEmail(email, password),
            registerWithEmail: (name, email, password, college) => authService.registerWithEmail(name, email, password, college),
            logout: () => authService.logout(),
            resetPassword: (email) => authService.resetPassword(email),
            completePasswordReset: (token, password) => authService.completePasswordReset(token, password)
        };
    }, [user, loading]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
