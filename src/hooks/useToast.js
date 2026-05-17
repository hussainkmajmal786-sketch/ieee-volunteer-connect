import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

/**
 * Custom hook to use the toast context.
 * Separated to satisfy Vite Fast Refresh rules.
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
