import { auth, db } from "./config";
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
            await setDoc(userRef, {
                name: user.displayName,
                email: user.email,
                role: "STUDENT",
                branch: "IEEE Branch",
                points: 0,
                badges: [],
                createdAt: new Date()
            });
        }
        return user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const registerWithEmail = async (name, email, password) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;

        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
            name: name,
            email: user.email,
            role: "STUDENT",
            branch: "IEEE Branch",
            points: 0,
            badges: [],
            createdAt: new Date()
        });
        return user;
    } catch (error) {
        console.error("Error registering with email", error);
        throw error;
    }
};

export const loginWithEmail = async (email, password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error("Error signing in with email", error);
        throw error;
    }
};

export const logout = () => signOut(auth);

// Subscribe to auth state
export const subscribeToAuth = (callback) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                callback({ ...user, ...docSnap.data() });
            } else {
                callback(user);
            }
        } else {
            callback(null);
        }
    });
};
