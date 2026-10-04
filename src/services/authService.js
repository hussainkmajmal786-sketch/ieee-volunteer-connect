import { authClient } from "../lib/authClient";
import { db, doc, updateDoc, onSnapshot, refreshListeners } from "../lib/firestore";

// Map Better Auth error payloads onto the codes AuthPage already understands.
function toError(error, fallback) {
    const err = new Error(error?.message || fallback);
    const code = error?.code || "";
    if (code === "INVALID_EMAIL_OR_PASSWORD") err.code = "auth/invalid-credential";
    else if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") err.code = "auth/email-already-in-use";
    else if (code === "PASSWORD_TOO_SHORT") err.code = "auth/weak-password";
    else if (code === "INVALID_EMAIL") err.code = "auth/invalid-email";
    else err.code = code;
    return err;
}

/**
 * Authentication Service
 * Centralizes auth (Better Auth on Cloudflare) and the users/{uid} profile.
 */
class AuthService {
    /** Google sign-in redirects away and back to `callbackURL`. */
    async loginWithGoogle(callbackURL = "/dashboard") {
        const { error } = await authClient.signIn.social({ provider: "google", callbackURL });
        if (error) throw toError(error, "Google Login Failed");
    }

    async registerWithEmail(name, email, password, college = "") {
        const { data, error } = await authClient.signUp.email({ name, email, password });
        if (error) throw toError(error, "Registration Failed");
        // The server creates the profile; add the optional college here.
        if (college) await updateDoc(doc(db, "users", data.user.id), { college });
        refreshListeners();
        return data.user;
    }

    async loginWithEmail(email, password) {
        const { data, error } = await authClient.signIn.email({ email, password });
        if (error) throw toError(error, "Login Failed");
        refreshListeners();
        return data.user;
    }

    async logout() {
        const { error } = await authClient.signOut();
        if (error) throw toError(error, "Logout Failed");
        refreshListeners();
    }

    async resetPassword(email) {
        const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
        if (error) throw toError(error, "Password Reset Failed");
    }

    async completePasswordReset(token, newPassword) {
        const { error } = await authClient.resetPassword({ token, newPassword });
        if (error) throw toError(error, "Password Reset Failed");
    }

    /**
     * Live profile for a signed-in account, shaped like the old Firebase user
     * merged with its users/{uid} document.
     */
    subscribeToProfile(sessionUser, callback) {
        const base = {
            uid: sessionUser.id,
            email: sessionUser.email,
            displayName: sessionUser.name,
            photoURL: sessionUser.image || null,
            emailVerified: !!sessionUser.emailVerified,
        };
        return onSnapshot(
            doc(db, "users", sessionUser.id),
            (snap) => callback(snap.exists() ? { ...base, ...snap.data(), uid: sessionUser.id } : base),
            (error) => {
                console.error("Error fetching user profile", error);
                callback(base);
            }
        );
    }
}

export const authService = new AuthService();
