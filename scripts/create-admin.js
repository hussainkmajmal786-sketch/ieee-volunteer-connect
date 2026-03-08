import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
    console.log("Creating Admin User...");
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            "hussainkmajmal786@gmail.com",
            "passwordfgh"
        );

        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: "Hussain M",
            email: user.email,
            role: "ADMIN",
            branch: "IEEE Kerala Section",
            points: 0,
            createdAt: new Date().toISOString()
        });

        console.log(`✅ Admin user created successfully: ${user.email}`);
        process.exit(0);
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
            console.log("User already exists! Please attempt login.");
            process.exit(0);
        } else {
            console.error("Error creating admin user:", e);
            process.exit(1);
        }
    }
}

createAdmin();
