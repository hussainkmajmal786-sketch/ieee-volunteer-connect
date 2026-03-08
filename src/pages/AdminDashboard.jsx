import { useState, useEffect } from "react";
import { Users, Calendar, Activity, TrendingUp, PlusCircle, X, MapPin, Clock, Edit2, Trash2, Upload, Image, Search, BarChart2, UserPlus, Eye, Mail, Phone, Building2, Download, Target, ListChecks, Hash, Bell, Timer, UsersRound, Crown, CheckSquare, Gift, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/Button";
import { useToast } from "../components/Toast";
import { db, storage } from "../firebase/config";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc, doc, where, setDoc, increment, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getGrade, getEarnedBadges } from "../utils/grades";

export default function AdminDashboard() {
    const addToast = useToast();
    const [events, setEvents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showVolunteerModal, setShowVolunteerModal] = useState(false);
    const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEventId, setCurrentEventId] = useState(null);
    const [newEvent, setNewEvent] = useState({ name: '', date: '', venue: '', desc: '', category: 'Workshop', imageUrl: '' });
    const [newVolunteer, setNewVolunteer] = useState({ name: '', email: '', password: '', branch: 'IEEE Student Branch' });
    const [creationError, setCreationError] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [searchEvents, setSearchEvents] = useState('');
    const [searchVol, setSearchVol] = useState('');
    const [registrations, setRegistrations] = useState([]);
    const [regEventName, setRegEventName] = useState('');
    const [loadingRegs, setLoadingRegs] = useState(false);
    const [adminTasks, setAdminTasks] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', event: '', eventId: '', date: '', points: 50, target: 5, targetType: 'registrations' });
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyEvent, setNotifyEvent] = useState(null);
    const [notifyMessage, setNotifyMessage] = useState('');
    const [showCountdownModal, setShowCountdownModal] = useState(false);
    const [countdownEvent, setCountdownEvent] = useState(null);
    const [countdownDate, setCountdownDate] = useState('');
    const [teams, setTeams] = useState([]);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [newReward, setNewReward] = useState({ name: '', points: 50, desc: '', icon: '🎁', quantity: 10 });
    const [showGiveRewardModal, setShowGiveRewardModal] = useState(false);
    const [selectedVolunteerForReward, setSelectedVolunteerForReward] = useState('');
    const [selectedRewardToGive, setSelectedRewardToGive] = useState('');

    // Fetch Events real-time
    useEffect(() => {
        const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventsData = [];
            snapshot.forEach((doc) => eventsData.push({ id: doc.id, ...doc.data() }));
            setEvents(eventsData);
        });
        return unsubscribe;
    }, []);

    // Fetch Volunteers real-time
    useEffect(() => {
        const q = query(collection(db, "users"), where("role", "in", ["VOLUNTEER", "ADMIN"]));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const volData = [];
            snapshot.forEach((doc) => volData.push({ id: doc.id, ...doc.data() }));
            setVolunteers(volData);
        });
        return unsubscribe;
    }, []);

    // Fetch Tasks real-time
    useEffect(() => {
        const q = query(collection(db, "tasks"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData = [];
            snapshot.forEach((doc) => tasksData.push({ id: doc.id, ...doc.data() }));
            setAdminTasks(tasksData);
        });
        return unsubscribe;
    }, []);

    // Fetch Teams real-time
    useEffect(() => {
        const q = query(collection(db, "teams"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teamsData = [];
            snapshot.forEach((doc) => teamsData.push({ id: doc.id, ...doc.data() }));
            setTeams(teamsData);
        });
        return unsubscribe;
    }, []);

    // Fetch Rewards real-time
    useEffect(() => {
        const q = query(collection(db, "rewards"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rewardsData = [];
            snapshot.forEach((doc) => rewardsData.push({ id: doc.id, ...doc.data() }));
            setRewards(rewardsData);
        });
        return unsubscribe;
    }, []);

    const totalPoints = volunteers.reduce((acc, v) => acc + (v.points || 0), 0);
    const totalParticipants = events.reduce((acc, e) => acc + (e.participants || 0), 0);

    const stats = [
        { name: 'Total Events', value: events.length.toString(), icon: Calendar, color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20', accent: 'from-blue-500 to-cyan-400' },
        { name: 'Registrations', value: totalParticipants.toString(), icon: UserPlus, color: 'text-emerald-500', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20', accent: 'from-emerald-500 to-teal-400' },
        { name: 'Active Volunteers', value: volunteers.length.toString(), icon: Users, color: 'text-violet-500', bg: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/20', accent: 'from-violet-500 to-purple-400' },
        { name: 'Total Points', value: totalPoints.toLocaleString(), icon: Activity, color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20', accent: 'from-amber-500 to-orange-400' },
    ];

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleImageDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async () => {
        if (!imageFile) return newEvent.imageUrl || '';
        const fileRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
        await uploadBytes(fileRef, imageFile);
        return await getDownloadURL(fileRef);
    };

    const handleCreateOrUpdateEvent = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const imageUrl = await uploadImage();
            if (isEditing && currentEventId) {
                const eventRef = doc(db, "events", currentEventId);
                await updateDoc(eventRef, { ...newEvent, imageUrl });
                addToast('Event updated successfully!', 'success');
            } else {
                await addDoc(collection(db, "events"), {
                    ...newEvent,
                    imageUrl,
                    createdAt: new Date(),
                    participants: 0,
                    status: 'Active'
                });
                addToast('Event created successfully!', 'success');
            }
            closeModal();
        } catch (error) {
            console.error("Error saving event:", error);
            addToast('Failed to save event: ' + error.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateVolunteer = async (e) => {
        e.preventDefault();
        setCreationError('');
        try {
            const firebaseConfig = {
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
                authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: import.meta.env.VITE_FIREBASE_APP_ID
            };
            const secondaryApp = initializeApp(firebaseConfig, "Secondary" + Date.now());
            const secondaryAuth = getAuth(secondaryApp);
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newVolunteer.email, newVolunteer.password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                name: newVolunteer.name,
                email: newVolunteer.email,
                role: "VOLUNTEER",
                branch: newVolunteer.branch,
                points: 0,
                tasksCompleted: 0,
                shares: 0,
                createdAt: new Date().toISOString()
            });
            await secondaryAuth.signOut();
            closeVolunteerModal();
            addToast('Volunteer account created!', 'success');
        } catch (error) {
            console.error("Error creating volunteer:", error);
            setCreationError(error.message);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            try {
                await deleteDoc(doc(db, "events", id));
                addToast('Event deleted', 'info');
            } catch (error) {
                console.error("Error deleting event:", error);
            }
        }
    };

    // View event registrations
    const viewRegistrations = async (eventId, eventName) => {
        setLoadingRegs(true);
        setRegEventName(eventName);
        setShowRegistrationsModal(true);
        try {
            const regsSnap = await getDocs(collection(db, "events", eventId, "registrations"));
            const regsData = [];
            regsSnap.forEach((doc) => regsData.push({ id: doc.id, ...doc.data() }));
            regsData.sort((a, b) => {
                const dateA = a.registeredAt?.toDate?.() || new Date(a.registeredAt);
                const dateB = b.registeredAt?.toDate?.() || new Date(b.registeredAt);
                return dateB - dateA;
            });
            setRegistrations(regsData);
        } catch (error) {
            console.error("Error fetching registrations:", error);
            addToast('Failed to load registrations', 'error');
        } finally {
            setLoadingRegs(false);
        }
    };

    const exportRegistrations = () => {
        if (registrations.length === 0) return;
        const headers = ['Name', 'Email', 'Phone', 'College', 'Year', 'Registered At'];
        const csvRows = [
            headers.join(','),
            ...registrations.map(r => [
                `"${r.name || ''}"`,
                `"${r.email || ''}"`,
                `"${r.phone || ''}"`,
                `"${r.college || ''}"`,
                `"${r.year || ''}"`,
                `"${r.registeredAt?.toDate ? r.registeredAt.toDate().toLocaleString() : new Date(r.registeredAt).toLocaleString()}"`,
            ].join(','))
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${regEventName.replace(/\s+/g, '_')}_registrations.csv`;
        link.click();
        URL.revokeObjectURL(url);
        addToast('CSV exported!', 'success');
    };

    // Task management
    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "tasks"), {
                title: newTask.title,
                event: newTask.event,
                eventId: newTask.eventId,
                date: newTask.date,
                points: parseInt(newTask.points) || 50,
                target: parseInt(newTask.target) || 5,
                targetType: newTask.targetType,
                completedBy: [],
                createdAt: new Date().toISOString()
            });
            setShowTaskModal(false);
            setNewTask({ title: '', event: '', eventId: '', date: '', points: 50, target: 5, targetType: 'registrations' });
            addToast('Task created!', 'success');
        } catch (error) {
            console.error('Error creating task:', error);
            addToast('Failed to create task', 'error');
        }
    };

    // Notify all registered students
    const handleNotify = async () => {
        if (!notifyEvent || !notifyMessage.trim()) return;
        try {
            await addDoc(collection(db, "events", notifyEvent.id, "notifications"), {
                message: notifyMessage,
                createdAt: new Date(),
                eventName: notifyEvent.name
            });
            // Also update the event document with the latest notification
            await updateDoc(doc(db, "events", notifyEvent.id), {
                latestNotification: notifyMessage,
                notifiedAt: new Date().toISOString()
            });
            setShowNotifyModal(false);
            setNotifyMessage('');
            setNotifyEvent(null);
            addToast(`Notification sent to all ${notifyEvent.name} registrants!`, 'success');
        } catch (error) {
            console.error('Error sending notification:', error);
            addToast('Failed to send notification', 'error');
        }
    };

    // Set countdown for event
    const handleSetCountdown = async () => {
        if (!countdownEvent || !countdownDate) return;
        try {
            await updateDoc(doc(db, "events", countdownEvent.id), {
                countdownDate: countdownDate
            });
            setShowCountdownModal(false);
            setCountdownDate('');
            setCountdownEvent(null);
            addToast(`Countdown set for ${countdownEvent.name}!`, 'success');
        } catch (error) {
            console.error('Error setting countdown:', error);
            addToast('Failed to set countdown', 'error');
        }
    };

    const handleDeleteTask = async (id) => {
        if (window.confirm('Delete this task?')) {
            try {
                await deleteDoc(doc(db, "tasks", id));
                addToast('Task deleted', 'info');
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };

    // Team management
    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim() || selectedMembers.length === 0) return;
        try {
            const members = selectedMembers.map(uid => {
                const vol = volunteers.find(v => v.id === uid);
                return { uid, name: vol?.name || 'Unknown', email: vol?.email || '' };
            });
            await addDoc(collection(db, "teams"), {
                name: newTeamName,
                members,
                memberIds: selectedMembers,
                createdAt: new Date().toISOString(),
                totalPoints: members.reduce((acc, m) => {
                    const vol = volunteers.find(v => v.id === m.uid);
                    return acc + (vol?.points || 0);
                }, 0)
            });
            setShowTeamModal(false);
            setNewTeamName('');
            setSelectedMembers([]);
            addToast('Team created!', 'success');
        } catch (error) {
            console.error('Error creating team:', error);
            addToast('Failed to create team', 'error');
        }
    };

    const handleDeleteTeam = async (id) => {
        if (window.confirm('Delete this team?')) {
            try {
                await deleteDoc(doc(db, "teams", id));
                addToast('Team deleted', 'info');
            } catch (error) {
                console.error('Error deleting team:', error);
            }
        }
    };

    const toggleMember = (uid) => {
        setSelectedMembers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
    };

    // Reward management
    const handleCreateReward = async (e) => {
        e.preventDefault();
        if (!newReward.name.trim() || newReward.points < 1) return;
        try {
            await addDoc(collection(db, "rewards"), {
                ...newReward,
                createdAt: new Date().toISOString()
            });
            setShowRewardModal(false);
            setNewReward({ name: '', points: 50, desc: '', icon: '🎁', quantity: 10 });
            addToast('Reward created!', 'success');
        } catch (error) {
            console.error('Error creating reward:', error);
            addToast('Failed to create reward', 'error');
        }
    };

    const handleDeleteReward = async (id) => {
        if (window.confirm('Delete this reward?')) {
            try {
                await deleteDoc(doc(db, "rewards", id));
                addToast('Reward deleted', 'info');
            } catch (error) {
                console.error('Error deleting reward:', error);
            }
        }
    };

    const handleGiveReward = async (e) => {
        e.preventDefault();
        if (!selectedVolunteerForReward || !selectedRewardToGive) return;
        try {
            const rewardData = rewards.find(r => r.id === selectedRewardToGive);
            await addDoc(collection(db, "claims"), {
                userId: selectedVolunteerForReward,
                rewardId: selectedRewardToGive,
                rewardName: rewardData?.name || 'Unknown',
                pointsCost: rewardData?.points || 0,
                status: 'granted',
                claimedAt: new Date().toISOString(),
                grantedBy: 'Admin'
            });
            setShowGiveRewardModal(false);
            setSelectedVolunteerForReward('');
            setSelectedRewardToGive('');
            addToast('Reward given successfully!', 'success');
        } catch (error) {
            console.error('Error giving reward:', error);
            addToast('Failed to give reward', 'error');
        }
    };

    const openEditModal = (event) => {
        setIsEditing(true);
        setCurrentEventId(event.id);
        setNewEvent({ name: event.name, date: event.date, venue: event.venue, desc: event.desc, category: event.category || 'Workshop', imageUrl: event.imageUrl || '' });
        if (event.imageUrl) setImagePreview(event.imageUrl);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setCurrentEventId(null);
        setNewEvent({ name: '', date: '', venue: '', desc: '', category: 'Workshop', imageUrl: '' });
        setImageFile(null);
        setImagePreview(null);
    };

    const closeVolunteerModal = () => {
        setShowVolunteerModal(false);
        setNewVolunteer({ name: '', email: '', password: '', branch: 'IEEE Student Branch' });
        setCreationError('');
    };

    const handleRemoveVolunteer = async (id) => {
        if (window.confirm("Remove this volunteer's access?")) {
            try {
                await updateDoc(doc(db, "users", id), { role: "STUDENT" });
                addToast('Volunteer access removed', 'warning');
            } catch (err) {
                console.error("Error removing volunteer", err);
            }
        }
    };

    // Filtered lists
    const filteredEvents = events.filter(e => e.name?.toLowerCase().includes(searchEvents.toLowerCase()));
    const filteredVols = volunteers.filter(v => v.name?.toLowerCase().includes(searchVol.toLowerCase()) || v.email?.toLowerCase().includes(searchVol.toLowerCase()));

    // Mini bar chart data
    const maxParticipants = Math.max(...events.map(e => e.participants || 0), 1);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage events, track volunteers, and monitor engagement.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => setShowVolunteerModal(true)} variant="outline" className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Add Volunteer
                        </Button>
                        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 shadow-lg hover:shadow-xl">
                            <PlusCircle className="w-5 h-5" /> Create Event
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {stats.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <motion.div key={s.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                <div className={`relative overflow-hidden rounded-2xl p-5 border border-gray-100 dark:border-gray-800 transition-colors ${s.bg}`}>
                                    <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${s.accent} opacity-10 blur-xl`} />
                                    <div className="flex items-center justify-between mb-3 relative z-10">
                                        <div className="p-2.5 rounded-xl bg-white/70 dark:bg-gray-900/50 shadow-sm">
                                            <Icon className={`w-5 h-5 ${s.color}`} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white relative z-10">{s.value}</p>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1 relative z-10">{s.name}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Activity Chart Mini */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-8">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-ieee-blue" /> Event Registrations
                        </h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{events.length} Events</span>
                    </div>
                    <div className="flex items-end gap-2 h-32">
                        {events.slice(0, 12).map((evt, i) => {
                            const h = Math.max(8, ((evt.participants || 0) / maxParticipants) * 100);
                            return (
                                <motion.div key={evt.id} initial={{ height: 0 }} animate={{ height: `${h}%` }}
                                    transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 100 }}
                                    className="flex-1 min-w-0 rounded-t-lg bg-gradient-to-t from-ieee-blue to-cyan-400 relative group cursor-pointer hover:opacity-90 transition"
                                    onClick={() => viewRegistrations(evt.id, evt.name)}
                                    title={`${evt.name}: ${evt.participants || 0} registrations — Click to view`}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                        {evt.participants || 0}
                                    </div>
                                </motion.div>
                            );
                        })}
                        {events.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No events yet</div>
                        )}
                    </div>
                    <div className="flex gap-2 mt-2 overflow-hidden">
                        {events.slice(0, 12).map((evt) => (
                            <div key={evt.id} className="flex-1 min-w-0 text-center">
                                <span className="text-[8px] text-gray-400 font-medium truncate block">{evt.name?.slice(0, 6)}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ========== ANALYTICS DASHBOARD ========== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl"><Users className="w-4 h-4 text-violet-500" /></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Volunteers</span>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{volunteers.length}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {volunteers.filter(v => (v.points || 0) >= 100).length} high performers ({'>'}100 pts)
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl"><UsersRound className="w-4 h-4 text-rose-500" /></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teams</span>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{teams.length}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)} members across teams
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"><CheckSquare className="w-4 h-4 text-emerald-500" /></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Task Completion</span>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                            {adminTasks.length > 0 ? Math.round((adminTasks.filter(t => {
                                const evt = events.find(e => e.id === t.eventId);
                                return evt && (evt.participants || 0) >= (t.target || 1);
                            }).length / adminTasks.length) * 100) : 0}%
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {adminTasks.filter(t => { const evt = events.find(e => e.id === t.eventId); return evt && (evt.participants || 0) >= (t.target || 1); }).length}/{adminTasks.length} tasks completed
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl"><TrendingUp className="w-4 h-4 text-amber-500" /></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Points</span>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                            {volunteers.length > 0 ? Math.round(totalPoints / volunteers.length) : 0}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">per volunteer average</p>
                    </div>
                </div>

                {/* Analytics Row: Event Statistics + Participant Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Event Statistics by Category */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                            <BarChart2 className="w-5 h-5 text-cyan-500" /> Event Statistics
                        </h2>
                        {(() => {
                            const cats = {};
                            events.forEach(e => {
                                const cat = e.category || 'Other';
                                if (!cats[cat]) cats[cat] = { count: 0, participants: 0 };
                                cats[cat].count++;
                                cats[cat].participants += (e.participants || 0);
                            });
                            const catEntries = Object.entries(cats);
                            const catColors = ['from-blue-500 to-cyan-400', 'from-emerald-500 to-teal-400', 'from-violet-500 to-purple-400', 'from-amber-500 to-orange-400', 'from-rose-500 to-pink-400', 'from-indigo-500 to-blue-400'];
                            const catBgs = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];

                            return (
                                <div>
                                    {/* Mini donut visualization */}
                                    <div className="flex items-center gap-6 mb-5">
                                        <div className="relative w-28 h-28 shrink-0">
                                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                                {(() => {
                                                    let offset = 0;
                                                    const total = events.length || 1;
                                                    const strokeColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#6366f1'];
                                                    return catEntries.map(([cat, data], i) => {
                                                        const pct = (data.count / total) * 100;
                                                        const dash = `${pct} ${100 - pct}`;
                                                        const el = (
                                                            <circle key={cat} cx="18" cy="18" r="15.915" fill="transparent" stroke={strokeColors[i % strokeColors.length]}
                                                                strokeWidth="3.5" strokeDasharray={dash} strokeDashoffset={-offset} strokeLinecap="round" />
                                                        );
                                                        offset += pct;
                                                        return el;
                                                    });
                                                })()}
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <p className="text-xl font-black text-gray-900 dark:text-white">{events.length}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Events</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {catEntries.map(([cat, data], i) => (
                                                <div key={cat} className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${catBgs[i % catBgs.length]} shrink-0`} />
                                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">{cat}</span>
                                                    <span className="text-xs font-bold text-gray-500">{data.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Category details */}
                                    <div className="space-y-3">
                                        {catEntries.map(([cat, data], i) => (
                                            <div key={cat} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{cat}</span>
                                                    <span className="text-xs font-bold text-gray-500">{data.participants} registrations</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full bg-gradient-to-r ${catColors[i % catColors.length]}`}
                                                        style={{ width: `${(events.length > 0 ? (data.count / events.length) * 100 : 0)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Participant Analytics */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                            <TrendingUp className="w-5 h-5 text-emerald-500" /> Participant Analytics
                        </h2>
                        <div className="space-y-3">
                            {events.slice().sort((a, b) => (b.participants || 0) - (a.participants || 0)).slice(0, 8).map((evt, i) => {
                                const pct = maxParticipants > 0 ? ((evt.participants || 0) / maxParticipants) * 100 : 0;
                                return (
                                    <div key={evt.id} className="group">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-[10px] font-black w-5 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-400'}`}>#{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{evt.name}</span>
                                                    <span className="text-xs font-black text-ieee-blue dark:text-cyan-400 ml-2 shrink-0">{evt.participants || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-8 w-[calc(100%-2rem)] h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                                                className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-ieee-blue to-cyan-400'}`} />
                                        </div>
                                    </div>
                                );
                            })}
                            {events.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No events to analyze</p>}
                        </div>
                        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-3 text-center">
                            <div>
                                <p className="text-lg font-black text-gray-900 dark:text-white">{totalParticipants}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                            </div>
                            <div>
                                <p className="text-lg font-black text-gray-900 dark:text-white">{events.length > 0 ? Math.round(totalParticipants / events.length) : 0}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Avg / Event</p>
                            </div>
                            <div>
                                <p className="text-lg font-black text-gray-900 dark:text-white">{events.length > 0 ? Math.max(...events.map(e => e.participants || 0)) : 0}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Peak</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task Completion Rates + Top Volunteers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Task Completion Rates */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                            <ListChecks className="w-5 h-5 text-violet-500" /> Task Completion Rates
                        </h2>
                        {adminTasks.length === 0 ? (
                            <div className="text-center py-8">
                                <Target className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">No tasks to show completion rates</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {adminTasks.map((task) => {
                                    const linkedEvent = events.find(e => e.id === task.eventId);
                                    const current = linkedEvent?.participants || 0;
                                    const target = task.target || 1;
                                    const pct = Math.min(100, Math.round((current / target) * 100));
                                    const met = current >= target;
                                    return (
                                        <div key={task.id}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <span className={`text-sm font-semibold truncate ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>{task.title}</span>
                                                    {met && <span className="text-[10px] font-black px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full shrink-0">✓ Done</span>}
                                                </div>
                                                <span className={`text-xs font-black ml-2 shrink-0 ${met ? 'text-green-500' : 'text-gray-500'}`}>{pct}%</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                                                        className={`h-full rounded-full ${met ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`} />
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold w-16 text-right shrink-0">{current}/{target}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Top Volunteers Podium */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                            <Crown className="w-5 h-5 text-amber-500" /> Top Volunteers
                        </h2>
                        {volunteers.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">No volunteers yet</p>
                            </div>
                        ) : (
                            <div>
                                {/* Top 3 Podium */}
                                <div className="flex items-end justify-center gap-4 mb-6 h-44">
                                    {[1, 0, 2].map((rank) => {
                                        const sorted = [...volunteers].sort((a, b) => (b.points || 0) - (a.points || 0));
                                        const vol = sorted[rank];
                                        if (!vol) return <div key={rank} className="flex-1" />;
                                        const grade = getGrade(vol.points || 0);
                                        const heights = ['h-36', 'h-24', 'h-20'];
                                        const medals = ['🥇', '🥈', '🥉'];
                                        const sizes = ['w-14 h-14 text-lg', 'w-11 h-11 text-sm', 'w-10 h-10 text-sm'];
                                        return (
                                            <motion.div key={vol.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + rank * 0.1 }}
                                                className="flex flex-col items-center flex-1">
                                                <div className="relative mb-2">
                                                    <div className={`${sizes[rank]} rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white font-bold shadow-lg`}>
                                                        {vol.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className="absolute -top-1 -right-1 text-sm">{medals[rank]}</span>
                                                </div>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white text-center truncate w-full">{vol.name?.split(' ')[0]}</p>
                                                <p className="text-[10px] font-black text-ieee-blue dark:text-cyan-400">{vol.points || 0} pts</p>
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded mt-1 ${grade.bgPill} ${grade.textClass}`}>{grade.icon} {grade.name}</span>
                                                <div className={`w-full ${heights[rank]} bg-gradient-to-t from-ieee-blue/20 to-transparent rounded-t-xl mt-2 relative`}>
                                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-ieee-blue to-cyan-400 rounded-full" />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Remaining top volunteers */}
                                <div className="space-y-2">
                                    {[...volunteers].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(3, 8).map((vol, i) => {
                                        const grade = getGrade(vol.points || 0);
                                        return (
                                            <div key={vol.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                                <span className="text-xs font-black text-gray-400 w-5 text-center">#{i + 4}</span>
                                                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white text-[10px] font-bold`}>
                                                    {vol.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{vol.name}</p>
                                                </div>
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${grade.bgPill} ${grade.textClass}`}>{grade.icon}</span>
                                                <span className="text-xs font-black text-ieee-blue dark:text-cyan-400">{vol.points || 0} pts</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Volunteer Performance Tracking */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-8">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-500" /> Volunteer Performance Tracking
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">Detailed breakdown of each volunteer's contributions and activity</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Rank</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Volunteer</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Grade</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Points</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Tasks Done</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Teams</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Badges</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Performance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {[...volunteers].sort((a, b) => (b.points || 0) - (a.points || 0)).map((vol, i) => {
                                    const grade = getGrade(vol.points || 0);
                                    const badges = getEarnedBadges(vol);
                                    const tasksCompleted = adminTasks.filter(t => t.completedBy?.includes(vol.id)).length;
                                    const teamsIn = teams.filter(t => t.memberIds?.includes(vol.id)).length;
                                    const performancePct = volunteers.length > 0 && totalPoints > 0 ? Math.round(((vol.points || 0) / (totalPoints / volunteers.length)) * 50) : 0;
                                    const cappedPct = Math.min(100, performancePct);
                                    return (
                                        <tr key={vol.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                            <td className="px-5 py-3">
                                                <span className={`text-sm font-black ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-400'}`}>#{i + 1}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white text-xs font-bold`}>
                                                        {vol.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{vol.name}</p>
                                                        <p className="text-[10px] text-gray-400">{vol.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${grade.bgPill} ${grade.textClass}`}>{grade.icon} {grade.name}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm font-black text-ieee-blue dark:text-cyan-400">{vol.points || 0}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{tasksCompleted}/{adminTasks.length}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{teamsIn}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex gap-0.5">
                                                    {badges.length > 0 ? badges.slice(0, 4).map(b => (
                                                        <span key={b.id} className="text-sm" title={b.name}>{b.icon}</span>
                                                    )) : <span className="text-xs text-gray-300">—</span>}
                                                    {badges.length > 4 && <span className="text-[10px] text-gray-400 ml-1">+{badges.length - 4}</span>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${cappedPct >= 80 ? 'bg-green-500' : cappedPct >= 50 ? 'bg-ieee-blue' : cappedPct >= 25 ? 'bg-amber-500' : 'bg-gray-400'}`}
                                                            style={{ width: `${cappedPct}%` }} />
                                                    </div>
                                                    <span className={`text-[10px] font-black ${cappedPct >= 80 ? 'text-green-500' : cappedPct >= 50 ? 'text-ieee-blue' : cappedPct >= 25 ? 'text-amber-500' : 'text-gray-400'}`}>
                                                        {cappedPct >= 80 ? 'Excellent' : cappedPct >= 50 ? 'Good' : cappedPct >= 25 ? 'Average' : 'Low'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {volunteers.length === 0 && (
                            <div className="p-8 text-center">
                                <p className="text-gray-400 text-sm">No volunteer data to display</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Event List */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-ieee-blue" /> Manage Events
                                </h2>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" placeholder="Search events..." value={searchEvents} onChange={(e) => setSearchEvents(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" />
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
                            {filteredEvents.length === 0 ? (
                                <p className="p-5 text-center text-gray-500">No events found. Create one above!</p>
                            ) : filteredEvents.map((evt) => (
                                <div key={evt.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                                    {/* Thumbnail */}
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-ieee-blue/20 to-cyan-500/20 flex items-center justify-center">
                                        {evt.imageUrl ? (
                                            <img src={evt.imageUrl} alt={evt.name} className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <Image className="w-6 h-6 text-ieee-blue/40" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                                            <span className="truncate">{evt.name}</span>
                                            <span className="bg-ieee-blue/10 text-ieee-blue text-[10px] uppercase font-bold px-2 py-0.5 rounded-md shrink-0">{evt.category || 'Event'}</span>
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {evt.date}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {evt.venue}</span>
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {evt.participants || 0}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <button onClick={() => viewRegistrations(evt.id, evt.name)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 transition">
                                                <Eye className="w-3 h-3" /> Registrations
                                            </button>
                                            <button onClick={() => { setNotifyEvent(evt); setShowNotifyModal(true); }} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 transition">
                                                <Bell className="w-3 h-3" /> Notify
                                            </button>
                                            <button onClick={() => { setCountdownEvent(evt); setCountdownDate(evt.countdownDate || ''); setShowCountdownModal(true); }} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-lg hover:bg-violet-100 transition">
                                                <Timer className="w-3 h-3" /> Countdown
                                            </button>
                                            <button onClick={() => openEditModal(evt)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                                <Edit2 className="w-3 h-3" /> Edit
                                            </button>
                                            <button onClick={() => handleDeleteEvent(evt.id)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 transition">
                                                <Trash2 className="w-3 h-3" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Volunteers List */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-500" /> Active Volunteers
                                </h2>
                                <button onClick={() => setShowVolunteerModal(true)} className="flex items-center gap-1 text-xs font-bold text-ieee-blue hover:text-cyan-600 bg-ieee-blue/10 px-3 py-1.5 rounded-lg transition">
                                    <PlusCircle className="w-3.5 h-3.5" /> New
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" placeholder="Search volunteers..." value={searchVol} onChange={(e) => setSearchVol(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" />
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
                            {filteredVols.length === 0 ? (
                                <p className="p-5 text-center text-gray-500">No volunteers found.</p>
                            ) : filteredVols.map((vol) => {
                                const grade = getGrade(vol.points || 0);
                                const badges = getEarnedBadges(vol);
                                return (
                                    <div key={vol.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white font-bold shadow-md`}>
                                                {vol.name ? vol.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{vol.name}</p>
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${grade.bgPill} ${grade.textClass}`}>{grade.icon} {grade.name}</span>
                                                </div>
                                                <p className="text-xs text-gray-500">{vol.email}</p>
                                                {badges.length > 0 && (
                                                    <div className="flex gap-1 mt-0.5">
                                                        {badges.slice(0, 4).map(b => (
                                                            <span key={b.id} className="text-xs" title={b.name}>{b.icon}</span>
                                                        ))}
                                                        {badges.length > 4 && <span className="text-[10px] text-gray-400">+{badges.length - 4}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-black text-ieee-blue dark:text-cyan-400 text-sm">{vol.points || 0}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Points</p>
                                            </div>
                                            <button onClick={() => handleRemoveVolunteer(vol.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition" title="Remove Volunteer Access">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ===== TASKS MANAGEMENT ===== */}
                <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-violet-500" /> Volunteer Tasks
                        </h2>
                        <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-500 hover:bg-violet-600 px-4 py-2 rounded-xl transition shadow-md">
                            <PlusCircle className="w-4 h-4" /> Create Task
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
                        {adminTasks.length === 0 ? (
                            <div className="p-8 text-center">
                                <Target className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 font-medium">No tasks created yet.</p>
                                <p className="text-sm text-gray-400 mt-1">Create tasks with targets for volunteers to auto-complete.</p>
                            </div>
                        ) : adminTasks.map((task) => {
                            const linkedEvent = events.find(e => e.id === task.eventId);
                            const currentProgress = linkedEvent?.participants || 0;
                            const targetMet = currentProgress >= (task.target || 1);
                            const progressPct = Math.min(100, Math.round((currentProgress / (task.target || 1)) * 100));
                            return (
                                <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{task.title}</h3>
                                            {targetMet ? (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 shrink-0">✓ Target Met</span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">In Progress</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {task.event || 'General'}</span>
                                            <span className="flex items-center gap-1 font-bold text-ieee-blue">+{task.points} pts</span>
                                            <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {currentProgress}/{task.target} {task.targetType}</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${targetMet ? 'bg-green-500' : 'bg-gradient-to-r from-ieee-blue to-cyan-400'}`} style={{ width: `${progressPct}%` }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4">
                                        <span className="text-xs font-bold text-gray-400">{task.completedBy?.length || 0} completed</span>
                                        <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition" title="Delete Task">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ===== TEAMS MANAGEMENT ===== */}
                <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <UsersRound className="w-5 h-5 text-rose-500" /> Volunteer Teams
                        </h2>
                        <button onClick={() => { setShowTeamModal(true); setSelectedMembers([]); setNewTeamName(''); }} className="flex items-center gap-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-xl transition shadow-md">
                            <PlusCircle className="w-4 h-4" /> Make Team
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
                        {teams.length === 0 ? (
                            <div className="p-8 text-center">
                                <UsersRound className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 font-medium">No teams created yet.</p>
                                <p className="text-sm text-gray-400 mt-1">Create teams to organize your volunteers.</p>
                            </div>
                        ) : teams.map((team) => {
                            const teamPoints = (team.memberIds || []).reduce((acc, uid) => {
                                const vol = volunteers.find(v => v.id === uid);
                                return acc + (vol?.points || 0);
                            }, 0);
                            return (
                                <div key={team.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                                                {team.name?.charAt(0)?.toUpperCase() || 'T'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                                    {team.name}
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                                        {team.members?.length || 0} members
                                                    </span>
                                                </h3>
                                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                                    <span className="font-bold text-ieee-blue">{teamPoints} pts</span> • Created {new Date(team.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteTeam(team.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition" title="Delete Team">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(team.members || []).map((member, i) => {
                                            const vol = volunteers.find(v => v.id === member.uid);
                                            const grade = getGrade(vol?.points || 0);
                                            return (
                                                <div key={member.uid} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
                                                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white text-[10px] font-bold`}>
                                                        {member.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{member.name}</span>
                                                    {i === 0 && <Crown className="w-3 h-3 text-amber-500" title="Team Lead" />}
                                                    <span className={`text-[9px] font-black px-1 py-0.5 rounded ${grade.bgPill} ${grade.textClass}`}>{grade.icon}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ===== REWARDS MANAGEMENT ===== */}
                <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-8">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Gift className="w-5 h-5 text-pink-500" /> Reward Store
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={() => { setShowGiveRewardModal(true); setSelectedVolunteerForReward(''); setSelectedRewardToGive(''); }} className="flex items-center gap-1.5 text-xs font-bold text-ieee-blue bg-ieee-blue/10 hover:bg-ieee-blue hover:text-white px-4 py-2 rounded-xl transition shadow-sm">
                                <Award className="w-4 h-4" /> Give Reward
                            </button>
                            <button onClick={() => setShowRewardModal(true)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-xl transition shadow-md">
                                <PlusCircle className="w-4 h-4" /> Create Reward
                            </button>
                        </div>
                    </div>
                    <div className="p-5 overflow-x-auto">
                        {rewards.length === 0 ? (
                            <div className="text-center py-8">
                                <Gift className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 font-medium">No rewards created yet.</p>
                                <p className="text-sm text-gray-400 mt-1">Add rewards that volunteers can earn or you can give.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {rewards.map(reward => (
                                    <div key={reward.id} className="relative bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-gray-800 shrink-0">
                                                {reward.icon || '🎁'}
                                            </div>
                                            <button onClick={() => handleDeleteReward(reward.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition hover:bg-white dark:hover:bg-gray-900 rounded-md shrink-0 border border-transparent hover:border-red-100 dark:hover:border-red-900/30">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{reward.name}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">{reward.desc}</p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-xs font-black text-pink-500 bg-pink-50 dark:bg-pink-900/30 px-2 py-1 rounded-md">
                                                {reward.points} pts
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 items-center justify-center">
                                                {reward.quantity} in stock
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== CREATE TEAM MODAL ===== */}
            <AnimatePresence>
                {showTeamModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowTeamModal(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><UsersRound className="w-5 h-5 text-rose-500" /> Make Team</h3>
                                <button onClick={() => setShowTeamModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Team Name</label>
                                    <input type="text" placeholder="e.g. Web Dev Warriors" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Members ({selectedMembers.length} selected)</label>
                                    <div className="max-h-48 overflow-y-auto space-y-1 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
                                        {volunteers.map((vol) => {
                                            const isSelected = selectedMembers.includes(vol.id);
                                            const grade = getGrade(vol.points || 0);
                                            return (
                                                <button type="button" key={vol.id} onClick={() => toggleMember(vol.id)}
                                                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${isSelected ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'}`}>
                                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition ${isSelected ? 'bg-rose-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                                        {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                                                        {vol.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{vol.name}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{vol.email}</p>
                                                    </div>
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${grade.bgPill} ${grade.textClass} shrink-0`}>{grade.icon} {grade.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {selectedMembers.length > 0 && (
                                    <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 border border-rose-100 dark:border-rose-800/30">
                                        <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">
                                            👥 Team "{newTeamName || '...'}" will have {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setShowTeamModal(false)} className="flex-1">Cancel</Button>
                                    <Button type="submit" disabled={!newTeamName.trim() || selectedMembers.length === 0} className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50">Create Team</Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== CREATE REWARD MODAL ===== */}
            <AnimatePresence>
                {showRewardModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowRewardModal(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Gift className="w-5 h-5 text-pink-500" /> Create Reward</h3>
                                <button onClick={() => setShowRewardModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateReward} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Reward Name</label>
                                    <input type="text" placeholder="e.g. IEEE T-Shirt" value={newReward.name} onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                                    <textarea placeholder="Reward details..." value={newReward.desc} onChange={(e) => setNewReward({ ...newReward, desc: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 outline-none resize-none" rows="2" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Points Value</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="number" min="1" value={newReward.points} onChange={(e) => setNewReward({ ...newReward, points: parseInt(e.target.value) || 0 })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Quantity</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 opacity-0" />
                                            <input type="number" min="1" value={newReward.quantity} onChange={(e) => setNewReward({ ...newReward, quantity: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Emoji Icon</label>
                                        <input type="text" value={newReward.icon} onChange={(e) => setNewReward({ ...newReward, icon: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none text-center text-xl" required />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setShowRewardModal(false)} className="flex-1">Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-pink-500 hover:bg-pink-600 border-none text-white">Add Reward</Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== GIVE REWARD MODAL ===== */}
            <AnimatePresence>
                {showGiveRewardModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowGiveRewardModal(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Award className="w-5 h-5 text-ieee-blue" /> Give Reward</h3>
                                <button onClick={() => setShowGiveRewardModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleGiveReward} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Volunteer</label>
                                    <select value={selectedVolunteerForReward} onChange={(e) => setSelectedVolunteerForReward(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none" required>
                                        <option value="">Select a volunteer...</option>
                                        {[...volunteers].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(vol => {
                                            const grade = getGrade(vol.points || 0);
                                            return (
                                                <option key={vol.id} value={vol.id}>{vol.name} ({vol.points || 0} pts - {grade.name})</option>
                                            )
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Reward to Give</label>
                                    <select value={selectedRewardToGive} onChange={(e) => setSelectedRewardToGive(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none" required>
                                        <option value="">Select a reward...</option>
                                        {rewards.map(reward => (
                                            <option key={reward.id} value={reward.id}>{reward.icon} {reward.name} ({reward.points} pts value)</option>
                                        ))}
                                    </select>
                                </div>
                                {selectedVolunteerForReward && selectedRewardToGive && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium pb-1 flex items-center gap-2">
                                            🎁 Granting <strong>{rewards.find(r => r.id === selectedRewardToGive)?.name}</strong>
                                        </p>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                            to volunteer <strong>{volunteers.find(v => v.id === selectedVolunteerForReward)?.name}</strong>.
                                        </p>
                                    </div>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setShowGiveRewardModal(false)} className="flex-1">Cancel</Button>
                                    <Button type="submit" disabled={!selectedVolunteerForReward || !selectedRewardToGive} className="flex-1 bg-ieee-blue hover:bg-ieee-blue/90 disabled:opacity-50 border-none text-white">Give Reward</Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== CREATE TASK MODAL ===== */}
            <AnimatePresence>
                {showTaskModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowTaskModal(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Volunteer Task</h3>
                                <button onClick={() => setShowTaskModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Task Title</label>
                                    <input type="text" placeholder="e.g. Get 10 registrations for AI Bootcamp" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Link to Event</label>
                                    <select value={newTask.eventId} onChange={(e) => {
                                        const selectedEvt = events.find(ev => ev.id === e.target.value);
                                        setNewTask({ ...newTask, eventId: e.target.value, event: selectedEvt?.name || '' });
                                    }} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none" required>
                                        <option value="">Select an event...</option>
                                        {events.map(evt => (
                                            <option key={evt.id} value={evt.id}>{evt.name} ({evt.participants || 0} registrations)</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Points</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="number" min="1" value={newTask.points} onChange={(e) => setNewTask({ ...newTask, points: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Target</label>
                                        <div className="relative">
                                            <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="number" min="1" value={newTask.target} onChange={(e) => setNewTask({ ...newTask, target: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                                        <select value={newTask.targetType} onChange={(e) => setNewTask({ ...newTask, targetType: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none">
                                            <option value="registrations">Registrations</option>
                                            <option value="shares">Shares</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Deadline (optional)</label>
                                    <input type="text" placeholder="e.g. Mar 15, 2026" value={newTask.date} onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 outline-none" />
                                </div>
                                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-100 dark:border-violet-800/30">
                                    <p className="text-sm text-violet-700 dark:text-violet-300 font-medium flex items-center gap-2">
                                        <Target className="w-4 h-4" /> Task will <strong>auto-complete</strong> when the linked event reaches {newTask.target || '?'} {newTask.targetType}
                                    </p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setShowTaskModal(false)} className="flex-1">Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-violet-500 hover:bg-violet-600">Create Task</Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            <AnimatePresence>
                {showRegistrationsModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => { setShowRegistrationsModal(false); setRegistrations([]); }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Event Registrations</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">{regEventName} — {registrations.length} registration{registrations.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {registrations.length > 0 && (
                                        <button onClick={exportRegistrations} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-ieee-blue bg-ieee-blue/10 rounded-xl hover:bg-ieee-blue hover:text-white transition">
                                            <Download className="w-4 h-4" /> Export CSV
                                        </button>
                                    )}
                                    <button onClick={() => { setShowRegistrationsModal(false); setRegistrations([]); }} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {loadingRegs ? (
                                    <div className="flex justify-center py-16">
                                        <div className="w-8 h-8 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : registrations.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No registrations yet for this event.</p>
                                        <p className="text-sm text-gray-400 mt-1">Share the event link to get students to register!</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                                                    <th className="px-6 py-4 w-12">#</th>
                                                    <th className="px-6 py-4">Name</th>
                                                    <th className="px-6 py-4">Email</th>
                                                    <th className="px-6 py-4">Phone</th>
                                                    <th className="px-6 py-4">College</th>
                                                    <th className="px-6 py-4">Year</th>
                                                    <th className="px-6 py-4">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                                {registrations.map((reg, i) => (
                                                    <tr key={reg.id} className="hover:bg-blue-50/30 dark:hover:bg-gray-800/30 transition">
                                                        <td className="px-6 py-3.5 text-xs font-bold text-gray-400">{i + 1}</td>
                                                        <td className="px-6 py-3.5">
                                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{reg.name}</p>
                                                        </td>
                                                        <td className="px-6 py-3.5">
                                                            <a href={`mailto:${reg.email}`} className="text-sm text-ieee-blue hover:underline flex items-center gap-1">
                                                                <Mail className="w-3 h-3" /> {reg.email}
                                                            </a>
                                                        </td>
                                                        <td className="px-6 py-3.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                                                <Phone className="w-3 h-3 text-gray-400" /> {reg.phone || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                                                <Building2 className="w-3 h-3 text-gray-400" /> {reg.college || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3.5">
                                                            <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{reg.year || '—'}</span>
                                                        </td>
                                                        <td className="px-6 py-3.5">
                                                            <span className="text-xs text-gray-400">
                                                                {reg.registeredAt?.toDate ? reg.registeredAt.toDate().toLocaleDateString() : new Date(reg.registeredAt).toLocaleDateString()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create/Edit Event Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeModal}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Event' : 'Create New Event'}</h3>
                                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateOrUpdateEvent} className="p-6 space-y-4">
                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Event Banner Image</label>
                                    <div onDragOver={(e) => e.preventDefault()} onDrop={handleImageDrop}
                                        className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-ieee-blue dark:hover:border-cyan-500 transition-colors cursor-pointer overflow-hidden">
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                                                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Drop image here or click to upload</span>
                                                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                                                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Event Name</label>
                                    <input type="text" placeholder="e.g. AI Bootcamp 2026" value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="text" placeholder="Nov 20, 2026" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                                        <select value={newEvent.category} onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none">
                                            <option value="Workshop">Workshop</option>
                                            <option value="Seminar">Seminar</option>
                                            <option value="Competition">Competition</option>
                                            <option value="Hackathon">Hackathon</option>
                                            <option value="Meetup">Meetup</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Venue</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input type="text" placeholder="Main Hall" value={newEvent.venue} onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                                    <textarea placeholder="Describe the event..." rows={3} value={newEvent.desc} onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none resize-none" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
                                    <Button type="submit" isLoading={uploading} className="flex-1">{isEditing ? 'Save Changes' : 'Create Event'}</Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Volunteer Modal */}
            <AnimatePresence>
                {showVolunteerModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeVolunteerModal}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Volunteer Account</h3>
                                <button onClick={closeVolunteerModal} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateVolunteer} className="p-6 space-y-4">
                                {creationError && (
                                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium border border-red-100">
                                        {creationError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                                    <input type="text" placeholder="John Doe" value={newVolunteer.name} onChange={(e) => setNewVolunteer({ ...newVolunteer, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                                        <input type="email" placeholder="john@ieee.org" value={newVolunteer.email} onChange={(e) => setNewVolunteer({ ...newVolunteer, email: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Temporary Password</label>
                                        <input type="text" placeholder="pass123" value={newVolunteer.password} onChange={(e) => setNewVolunteer({ ...newVolunteer, password: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Branch</label>
                                    <input type="text" placeholder="IEEE Student Branch" value={newVolunteer.branch} onChange={(e) => setNewVolunteer({ ...newVolunteer, branch: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" required />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={closeVolunteerModal} className="flex-1">Cancel</Button>
                                    <Button type="submit" className="flex-1">Create Account</Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== NOTIFY MODAL ===== */}
            <AnimatePresence>
                {showNotifyModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowNotifyModal(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> Send Notification</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Notify all {notifyEvent?.name} registrants</p>
                                </div>
                                <button onClick={() => setShowNotifyModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Notification Message</label>
                                    <textarea rows={4} placeholder="e.g. Reminder: The event starts tomorrow at 10AM! Don't forget to bring your laptop." value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 outline-none resize-none" />
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
                                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                                        📢 This notification will be visible on the event page for all {notifyEvent?.participants || 0} registered students.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={() => setShowNotifyModal(false)} className="flex-1">Cancel</Button>
                                    <Button onClick={handleNotify} disabled={!notifyMessage.trim()} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50">
                                        <Bell className="w-4 h-4 mr-1" /> Send Notification
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== COUNTDOWN MODAL ===== */}
            <AnimatePresence>
                {showCountdownModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCountdownModal(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Timer className="w-5 h-5 text-violet-500" /> Set Countdown</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">{countdownEvent?.name}</p>
                                </div>
                                <button onClick={() => setShowCountdownModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Event Date & Time</label>
                                    <input type="datetime-local" value={countdownDate} onChange={(e) => setCountdownDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none" />
                                </div>
                                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-100 dark:border-violet-800/30">
                                    <p className="text-sm text-violet-700 dark:text-violet-300 font-medium">
                                        ⏱️ A live countdown timer will appear on the event page, counting down to this date.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={() => setShowCountdownModal(false)} className="flex-1">Cancel</Button>
                                    <Button onClick={handleSetCountdown} disabled={!countdownDate} className="flex-1 bg-violet-500 hover:bg-violet-600 disabled:opacity-50">
                                        <Timer className="w-4 h-4 mr-1" /> Set Countdown
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
