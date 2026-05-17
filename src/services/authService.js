import { auth, db } from "../firebase/config";
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

/**
 * Authentication Service
 * Centralizes all auth-related Firebase interactions.
 */
class AuthService {
    /**
     * Sign in with Google Popup
     */
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);

            if (!docSnap.exists()) {
                await setDoc(userRef, {
                    name: user.displayName || "Google User",
                    email: user.email,
                    role: "STUDENT",
                    approvalStatus: "PENDING",
                    branch: "IEEE Branch",
                    college: "",
                    points: 0,
                    badges: [],
                    createdAt: serverTimestamp()
                });
            }
            return user;
        } catch (error) {
            this.handleError("Google Login Failed", error);
        }
    }

    /**
     * Register with Email and Password
     */
    async registerWithEmail(name, email, password, college = "") {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                name: name,
                email: user.email,
                role: "STUDENT",
                approvalStatus: "PENDING",
                branch: "IEEE Branch",
                college: college,
                points: 0,
                badges: [],
                createdAt: serverTimestamp()
            });
            return user;
        } catch (error) {
            this.handleError("Registration Failed", error);
        }
    }

    /**
     * Login with Email and Password
     */
    async loginWithEmail(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            this.handleError("Login Failed", error);
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            this.handleError("Logout Failed", error);
        }
    }

    /**
     * Subscribe to Auth State Changes
     */
    subscribeToAuth(callback) {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(userRef);
                    if (docSnap.exists()) {
                        callback({ ...user, ...docSnap.data(), uid: user.uid });
                    } else {
                        callback(user);
                    }
                } catch (error) {
                    console.error("Error fetching user data on auth change", error);
                    callback(user);
                }
            } else {
                callback(null);
            }
        });
    }

    /**
     * Password Reset
     */
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            this.handleError("Password Reset Failed", error);
        }
    }

    /**
     * Centralized error handling for the service
     */
    handleError(message, error) {
        console.error(`[AuthService] ${message}:`, error);
        const err = new Error(error.message || message);
        err.code = error.code;
        throw err;
    }
}

export const authService = new AuthService();
