import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/constants";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // SUPER_ADMIN always has access to everything
    if (user.role === ROLES.SUPER_ADMIN) {
        return children;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If user's role is not allowed, redirect to home or somewhere safe
        return <Navigate to="/events" replace />;
    }

    return children;
}
