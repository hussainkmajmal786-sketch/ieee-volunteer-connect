import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
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
const db = getFirestore(app);

const initialTasks = [
    { title: 'Share AI Bootcamp Link on WhatsApp Status', event: 'AI Bootcamp', points: 50, date: 'Oct 10', completedBy: [] },
    { title: 'On-site Registration Desk Management', event: 'Web Dev 101', points: 150, date: 'Oct 15', completedBy: [] },
    { title: 'Create LinkedIn Event Post', event: 'CyberSec Meetup', points: 30, date: 'Oct 18', completedBy: [] },
    { title: 'Assist Guest Speaker Setup', event: 'AI Bootcamp', points: 100, date: 'Oct 12', completedBy: [] }
];

const initialEvents = [
    { name: "AI & Machine Learning Bootcamp", category: "Workshop", desc: "Dive deep into Neural Networks with hands-on labs using Python and TensorFlow.", date: "Oct 15, 2026", venue: "Main Auditorium, Block C", participants: 120, createdAt: new Date() },
    { name: "CyberSecurity Capture The Flag", category: "Competition", desc: "Test your ethical hacking skills in our 24-hour CTF competition.", date: "Nov 02, 2026", venue: "CS Labs 101-103", participants: 85, createdAt: new Date() },
    { name: "Future of Robotics Seminar", category: "Seminar", desc: "Guest lecture by industry experts on inverse kinematics in modern manufacturing.", date: "Nov 15, 2026", venue: "Seminar Hall A", participants: 200, createdAt: new Date() }
];

async function seed() {
    console.log("Starting seed on project:", firebaseConfig.projectId);
    if (!firebaseConfig.projectId) throw new Error("Missing Project ID");

    // Seed Tasks
    const tasksRef = collection(db, "tasks");
    const tasksSnap = await getDocs(tasksRef);
    for (const doc of tasksSnap.docs) await deleteDoc(doc.ref);
    for (const task of initialTasks) {
        await addDoc(tasksRef, task);
        console.log(`Added task: ${task.title}`);
    }

    // Seed Events
    const eventsRef = collection(db, "events");
    const eventsSnap = await getDocs(eventsRef);
    if (eventsSnap.empty) {
        for (const event of initialEvents) {
            await addDoc(eventsRef, { ...event, createdAt: Date.now() });
            console.log(`Added event: ${event.name}`);
        }
    }

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch(console.error);
