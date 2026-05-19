import { db } from "../firebase/config";
import {
    collection,
    doc,
    addDoc,
    deleteDoc,
    updateDoc,
    setDoc,
    getDoc,
    getDocs,
    increment,
    serverTimestamp,
    arrayUnion,
} from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";

/**
 * Admin Service
 * Centralizes all admin-level Firestore operations
 * for events, volunteers, tasks, teams, rewards, claims, and notifications.
 */
class AdminService {
    // ─── EVENTS ──────────────────────────────────────────────

    async createEvent(eventData, college) {
        return await addDoc(collection(db, "events"), {
            ...eventData,
            college,
            createdAt: new Date(),
            participants: 0,
            status: "Active",
        });
    }

    async updateEvent(eventId, data) {
        await updateDoc(doc(db, "events", eventId), data);
    }

    async deleteEvent(eventId) {
        await deleteDoc(doc(db, "events", eventId));
    }

    async getRegistrations(eventId) {
        const snapshot = await getDocs(
            collection(db, "events", eventId, "registrations")
        );
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort(
            (a, b) =>
                (b.registeredAt?.toDate?.() || new Date(b.registeredAt)) -
                (a.registeredAt?.toDate?.() || new Date(a.registeredAt))
        );
        return data;
    }

    // ─── VOLUNTEERS / USERS ──────────────────────────────────

    /**
     * Create a volunteer account using a secondary Firebase App
     * so the current admin session is preserved.
     */
    async createVolunteer(volunteerData, firebaseConfig) {
        const secondaryApp = initializeApp(firebaseConfig, "Secondary" + Date.now());
        const secondaryAuth = getAuth(secondaryApp);

        try {
            const cred = await createUserWithEmailAndPassword(
                secondaryAuth,
                volunteerData.email,
                volunteerData.password
            );

            await setDoc(doc(db, "users", cred.user.uid), {
                uid: cred.user.uid,
                name: volunteerData.name,
                email: volunteerData.email,
                role: "VOLUNTEER",
                branch: volunteerData.branch,
                college: volunteerData.college || volunteerData.branch,
                points: 0,
                tasksCompleted: 0,
                shares: 0,
                badges: [],
                createdAt: new Date().toISOString(),
            });

            await secondaryAuth.signOut();
            return cred.user;
        } finally {
            await deleteApp(secondaryApp);
        }
    }

    async updateUserRole(userId, role) {
        await updateDoc(doc(db, "users", userId), { role });
    }

    async approveVolunteer(userId, status) {
        await updateDoc(doc(db, "users", userId), { approvalStatus: status });
    }

    async promoteToVolunteer(userId) {
        await updateDoc(doc(db, "users", userId), {
            role: "VOLUNTEER",
            approvalStatus: "ACTIVE",
        });
    }

    async demoteToStudent(userId) {
        await updateDoc(doc(db, "users", userId), { role: "STUDENT" });
    }

    async resetPoints(userId) {
        await updateDoc(doc(db, "users", userId), { points: 0 });
    }

    async deleteUser(userId) {
        await deleteDoc(doc(db, "users", userId));
    }

    // ─── TASKS ───────────────────────────────────────────────

    async createTask(taskData, assignedTo) {
        return await addDoc(collection(db, "tasks"), {
            ...taskData,
            points: parseInt(taskData.points) || 50,
            target: parseInt(taskData.target) || 5,
            assignedTo,
            completedBy: [],
            createdAt: new Date().toISOString(),
        });
    }

    async deleteTask(taskId) {
        await deleteDoc(doc(db, "tasks", taskId));
    }

    async markTaskComplete(taskId, userId, points) {
        await updateDoc(doc(db, "tasks", taskId), {
            completedBy: arrayUnion(userId),
        });
        await updateDoc(doc(db, "users", userId), {
            points: increment(points),
            tasksCompleted: increment(1),
        });
    }

    // ─── TEAMS ───────────────────────────────────────────────

    async createTeam(teamName, members, memberIds) {
        return await addDoc(collection(db, "teams"), {
            name: teamName,
            members,
            memberIds,
            createdAt: new Date().toISOString(),
        });
    }

    async deleteTeam(teamId) {
        await deleteDoc(doc(db, "teams", teamId));
    }

    // ─── REWARDS ─────────────────────────────────────────────

    async createReward(rewardData) {
        return await addDoc(collection(db, "rewards"), {
            ...rewardData,
            createdAt: new Date().toISOString(),
        });
    }

    async deleteReward(rewardId) {
        await deleteDoc(doc(db, "rewards", rewardId));
    }

    /**
     * Give a reward to a volunteer — validates points and stock.
     * Returns { success, message }.
     */
    async giveReward(volunteerId, rewardId, rewards) {
        const rewardData = rewards.find((r) => r.id === rewardId);
        if (!rewardData) return { success: false, message: "Reward not found" };

        if ((rewardData.quantity || 0) < 1) {
            return { success: false, message: "This reward is out of stock!" };
        }

        const userSnap = await getDoc(doc(db, "users", volunteerId));
        const userPoints = userSnap.data()?.points || 0;
        const cost = rewardData.points || 0;

        if (userPoints < cost) {
            return {
                success: false,
                message: `Not enough points! Needs ${cost} pts but has ${userPoints} pts`,
            };
        }

        await addDoc(collection(db, "claims"), {
            userId: volunteerId,
            rewardId,
            rewardName: rewardData.name,
            pointsCost: cost,
            status: "granted",
            claimedAt: new Date().toISOString(),
            grantedBy: "Admin",
        });

        await updateDoc(doc(db, "users", volunteerId), {
            points: increment(-cost),
        });
        await updateDoc(doc(db, "rewards", rewardId), {
            quantity: increment(-1),
        });

        return { success: true, message: "Reward given and points deducted!" };
    }

    // ─── NOTIFICATIONS ───────────────────────────────────────

    async sendEventNotification(eventId, eventName, message) {
        // Write to event-specific subcollection
        await addDoc(collection(db, "events", eventId, "notifications"), {
            message,
            createdAt: serverTimestamp(),
            eventName,
        });

        // Write to global notifications collection
        await addDoc(collection(db, "notifications"), {
            title: eventName,
            message,
            createdAt: serverTimestamp(),
        });

        // Update event with latest notification
        await updateDoc(doc(db, "events", eventId), {
            latestNotification: message,
            notifiedAt: new Date().toISOString(),
        });
    }

    async setCountdown(eventId, countdownDate) {
        await updateDoc(doc(db, "events", eventId), { countdownDate });
    }

    // ─── REGISTRATIONS EXPORT ────────────────────────────────

    exportRegistrationsCSV(registrations, eventName) {
        if (registrations.length === 0) return null;

        const headers = ["Name", "Email", "Phone", "College", "Year", "Registered At"];
        const csvRows = [
            headers.join(","),
            ...registrations.map((r) =>
                [
                    `"${r.name || ""}"`,
                    `"${r.email || ""}"`,
                    `"${r.phone || ""}"`,
                    `"${r.college || ""}"`,
                    `"${r.year || ""}"`,
                    `"${
                        r.registeredAt?.toDate
                            ? r.registeredAt.toDate().toLocaleString()
                            : new Date(r.registeredAt).toLocaleString()
                    }"`,
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${eventName.replace(/\s+/g, "_")}_registrations.csv`;
        link.click();
        URL.revokeObjectURL(url);
        return true;
    }

    // ─── OPPORTUNITIES ──────────────────────────────────────

    async createOpportunity(data) {
        return await addDoc(collection(db, "opportunities"), {
            ...data,
            createdAt: serverTimestamp(),
        });
    }

    async updateOpportunity(id, data) {
        await updateDoc(doc(db, "opportunities", id), data);
    }

    async deleteOpportunity(id) {
        await deleteDoc(doc(db, "opportunities", id));
    }

    // ─── PROJECTS ───────────────────────────────────────────

    async createProject(data) {
        return await addDoc(collection(db, "projects"), {
            ...data,
            createdAt: serverTimestamp(),
        });
    }

    async updateProject(id, data) {
        await updateDoc(doc(db, "projects", id), data);
    }

    async deleteProject(id) {
        await deleteDoc(doc(db, "projects", id));
    }

    // ─── RESOURCES ──────────────────────────────────────────

    async createResource(data) {
        return await addDoc(collection(db, "resources"), {
            ...data,
            createdAt: serverTimestamp(),
        });
    }

    async updateResource(id, data) {
        await updateDoc(doc(db, "resources", id), data);
    }

    async deleteResource(id) {
        await deleteDoc(doc(db, "resources", id));
    }

    // ─── CHAPTERS ───────────────────────────────────────────

    async createChapter(data) {
        return await addDoc(collection(db, "chapters"), {
            ...data,
            createdAt: serverTimestamp(),
        });
    }

    async updateChapter(id, data) {
        await updateDoc(doc(db, "chapters", id), data);
    }

    async deleteChapter(id) {
        await deleteDoc(doc(db, "chapters", id));
    }

    // ─── TESTIMONIALS ───────────────────────────────────────

    async createTestimonial(data) {
        return await addDoc(collection(db, "testimonials"), {
            ...data,
            createdAt: serverTimestamp(),
        });
    }

    async deleteTestimonial(id) {
        await deleteDoc(doc(db, "testimonials", id));
    }

    // ─── SPONSORS ───────────────────────────────────────────

    async createSponsor(data) {
        return await addDoc(collection(db, "sponsors"), {
            ...data,
            createdAt: serverTimestamp(),
        });
    }

    async deleteSponsor(id) {
        await deleteDoc(doc(db, "sponsors", id));
    }

    // ─── NEWS ───────────────────────────────────────────────

    async createNews(data) {
        return await addDoc(collection(db, "news"), {
            ...data,
            createdAt: serverTimestamp(),
        });
    }

    async updateNews(id, data) {
        await updateDoc(doc(db, "news", id), data);
    }

    async deleteNews(id) {
        await deleteDoc(doc(db, "news", id));
    }

    // ─── APPLICATIONS ───────────────────────────────────────

    async createApplication(userId, targetType, targetId, targetName) {
        return await addDoc(collection(db, "applications"), {
            userId,
            targetType,
            targetId,
            targetName,
            status: "PENDING",
            createdAt: serverTimestamp(),
        });
    }

    async approveApplication(appId) {
        await updateDoc(doc(db, "applications", appId), {
            status: "APPROVED",
            reviewedAt: serverTimestamp(),
        });
    }

    async rejectApplication(appId) {
        await updateDoc(doc(db, "applications", appId), {
            status: "REJECTED",
            reviewedAt: serverTimestamp(),
        });
    }

    async deleteApplication(appId) {
        await deleteDoc(doc(db, "applications", appId));
    }
    // ─── SPOTLIGHTS ─────────────────────────────────────────

    async createSpotlight(data) {
        return await addDoc(collection(db, "spotlights"), {
            ...data,
            createdAt: serverTimestamp(),
        });
    }

    async updateSpotlight(id, data) {
        await updateDoc(doc(db, "spotlights", id), data);
    }

    async deleteSpotlight(id) {
        await deleteDoc(doc(db, "spotlights", id));
    }
}

export const adminService = new AdminService();

