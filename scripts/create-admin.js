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

// ─── Validate ────────────────────────────────────────────
if (!firebaseConfig.projectId) {
    console.error("❌ Missing Firebase config. Make sure .env.local exists with VITE_FIREBASE_* variables.");
    process.exit(1);
}

// ─── CLI Arguments ───────────────────────────────────────
const [,, email, password, name = "Admin User", role = "ADMIN"] = process.argv;

if (!email || !password) {
    console.log(`
  Usage: node scripts/create-admin.js <email> <password> [name] [role]
  
  Examples:
    node scripts/create-admin.js admin@ieee.org MyPass123
    node scripts/create-admin.js admin@ieee.org MyPass123 "John Doe" SUPER_ADMIN
  
  Roles: ADMIN (default), SUPER_ADMIN
`);
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
    console.log(`Creating ${role} user: ${email} on project: ${firebaseConfig.projectId}`);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: name,
            email: user.email,
            role: role,
            branch: "IEEE Student Branch",
            college: "",
            points: 0,
            tasksCompleted: 0,
            shares: 0,
            badges: [],
            createdAt: new Date().toISOString()
        });

        console.log(`✅ ${role} user created successfully: ${user.email} (uid: ${user.uid})`);
        process.exit(0);
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
            console.log("⚠️  User already exists. Please log in or use a different email.");
            process.exit(0);
        } else {
            console.error("❌ Error creating admin user:", e.message);
            process.exit(1);
        }
    }
}

createAdmin();
