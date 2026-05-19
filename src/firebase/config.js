import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { initializeAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy_api_key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "localhost",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ieee-connect-dev",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-M2WQEP49JS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize Analytics conditionally (only runs in browser environment)
// Using initializeAnalytics with cookie_domain: 'none' to prevent invalid domain warnings
export const analytics = typeof window !== 'undefined' ? initializeAnalytics(app, {
    config: {
        cookie_domain: 'none',
        cookie_flags: 'SameSite=None;Secure'
    }
}) : null;

export default app;
