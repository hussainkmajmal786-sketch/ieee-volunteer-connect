import { db } from "../firebase/config";
import {
    collection,
    doc,
    addDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    onSnapshot
} from "firebase/firestore";

/**
 * Event Service
 * Centralizes all event-related Firebase interactions.
 */
class EventService {
    /**
     * Get All Events with optional limits and sorting
     */
    async getAllEvents(limitCount = 100) {
        try {
            const q = query(collection(db, "events"), orderBy("date", "desc"), limit(limitCount));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            this.handleError("Failed to fetch events", error);
        }
    }

    /**
     * Get a single event by ID
     */
    async getEvent(id) {
        try {
            const docRef = doc(db, "events", id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        } catch (error) {
            this.handleError("Failed to fetch event", error);
        }
    }

    /**
     * Create a new event
     */
    async createEvent(eventData) {
        try {
            return await addDoc(collection(db, "events"), {
                ...eventData,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            this.handleError("Failed to create event", error);
        }
    }

    /**
     * Real-time subscription to events
     */
    subscribeToEvents(callback, limitCount = 3) {
        const q = query(collection(db, "events"), orderBy("createdAt", "desc"), limit(limitCount));
        return onSnapshot(q, (snapshot) => {
            const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(events);
        }, (error) => {
            console.error("[EventService] Subscription error", error);
        });
    }

    /**
     * Get volunteer tasks for a specific user
     */
    async getVolunteerTasks(volunteerId) {
        try {
            const q = query(collection(db, "tasks"), where("volunteerId", "==", volunteerId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            this.handleError("Failed to fetch volunteer tasks", error);
        }
    }

    /**
     * Get all volunteers (or specific subset)
     */
    async getVolunteers() {
        try {
            const q = query(collection(db, "users"), where("role", "==", "VOLUNTEER"), orderBy("points", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            this.handleError("Failed to fetch volunteers", error);
        }
    }

    /**
     * Centralized error handling
     */
    handleError(message, error) {
        console.error(`[EventService] ${message}:`, error);
        throw new Error(error.message || message);
    }
}

export const eventService = new EventService();
