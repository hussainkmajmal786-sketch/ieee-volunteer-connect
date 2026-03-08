import { db } from "./config";
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy
} from "firebase/firestore";

// Events
export const getEvents = async () => {
    const q = query(collection(db, "events"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getEvent = async (id) => {
    const docRef = doc(db, "events", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const createEvent = async (eventData) => {
    return await addDoc(collection(db, "events"), eventData);
};

// Tasks
export const getVolunteerTasks = async (volunteerId) => {
    const q = query(collection(db, "tasks"), where("volunteerId", "==", volunteerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Users
export const getVolunteers = async () => {
    const q = query(collection(db, "users"), where("role", "==", "VOLUNTEER"), orderBy("points", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getLeaderboard = async () => {
    return await getVolunteers(); // essentially the same for now
};
