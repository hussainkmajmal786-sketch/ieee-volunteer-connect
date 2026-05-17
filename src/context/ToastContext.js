import { createContext } from "react";

/**
 * Toast context for managing notifications.
 * Separated to satisfy Vite Fast Refresh rules.
 */
export const ToastContext = createContext();
