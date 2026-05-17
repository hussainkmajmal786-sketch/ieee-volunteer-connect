import { useState, useEffect, useMemo } from "react";
import { PlusCircle, UserPlus, BarChart2, Activity, Calendar, Users, Shield, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/Button";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc, doc, setDoc, getDocs, getDoc, increment, serverTimestamp } from "firebase/firestore";
import { uploadImage as uploadToStorage } from '../utils/firebaseUpload';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getCroppedImg } from '../utils/cropImage';
import { ROLES, COLLEGE_BRANCHES } from '../utils/constants';

// Modular Components
import StatCards from '../components/admin/StatCards';
import ActivityChart from '../components/admin/ActivityChart';
import AnalyticsGrid from '../components/admin/AnalyticsGrid';
import EventStatsDonut from '../components/admin/EventStatsDonut';
import ParticipantAnalytics from '../components/admin/ParticipantAnalytics';
import VolunteerPerformanceTable from '../components/admin/VolunteerPerformanceTable';
import TopVolunteers from '../components/admin/TopVolunteers';
import EventList from '../components/admin/EventList';
import VolunteerList from '../components/admin/VolunteerList';
import TaskList from '../components/admin/TaskList';
import TeamList from '../components/admin/TeamList';
import RewardList from '../components/admin/RewardList';
import LinkTrackingPanel from '../components/admin/LinkTrackingPanel';

// Modals
import EventModal from '../components/admin/modals/EventModal';
import VolunteerModal from '../components/admin/modals/VolunteerModal';
import TaskModal from '../components/admin/modals/TaskModal';
import TeamModal from '../components/admin/modals/TeamModal';
import RewardModal from '../components/admin/modals/RewardModal';
import GiveRewardModal from '../components/admin/modals/GiveRewardModal';
import RegistrationsModal from '../components/admin/modals/RegistrationsModal';
import NotifyModal from '../components/admin/modals/NotifyModal';
import CountdownModal from '../components/admin/modals/CountdownModal';

export default function AdminDashboard() {
    const addToast = useToast();
    const { user: currentUser, isSuperAdmin } = useAuth();
    const [collegeFilter, setCollegeFilter] = useState('all');
    const [events, setEvents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showVolunteerModal, setShowVolunteerModal] = useState(false);
    const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEventId, setCurrentEventId] = useState(null);
    const [newEvent, setNewEvent] = useState({ name: '', date: '', venue: '', desc: '', category: 'Workshop', imageUrl: '' });
    const [newVolunteer, setNewVolunteer] = useState({ name: '', email: '', password: '', branch: 'IEEE Student Branch', college: '' });
    const [creationError, setCreationError] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [crop, setCrop] = useState({ unit: '%', width: 100, aspect: 16 / 9 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [imageRef, setImageRef] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [searchEvents, setSearchEvents] = useState('');
    const [searchVol, setSearchVol] = useState('');
    const [registrations, setRegistrations] = useState([]);
    const [regEventName, setRegEventName] = useState('');
    const [loadingRegs, setLoadingRegs] = useState(false);
    const [adminTasks, setAdminTasks] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', event: '', eventId: '', date: '', points: 50, target: 5, targetType: 'registrations', assignedTo: 'all' });
    const [selectedTaskVolunteers, setSelectedTaskVolunteers] = useState([]);
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

    // Real-time Listeners
    useEffect(() => {
        const unsubscribeEvents = onSnapshot(query(collection(db, "events"), orderBy("createdAt", "desc")), (s) => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubscribeVols = onSnapshot(query(collection(db, "users")), (s) => setVolunteers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubscribeTasks = onSnapshot(query(collection(db, "tasks")), (s) => setAdminTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubscribeTeams = onSnapshot(query(collection(db, "teams")), (s) => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubscribeRewards = onSnapshot(query(collection(db, "rewards")), (s) => setRewards(s.docs.map(d => ({ id: d.id, ...d.data() }))));

        return () => {
            unsubscribeEvents();
            unsubscribeVols();
            unsubscribeTasks();
            unsubscribeTeams();
            unsubscribeRewards();
        };
    }, []);

    // ── College-scoped filtering ──
    // Super Admin sees all data or filters by college.
    // Sub Admin only sees data matching their own college.
    const scopedEvents = useMemo(() => {
        if (isSuperAdmin && collegeFilter === 'all') return events;
        const college = isSuperAdmin ? collegeFilter : (currentUser?.college || currentUser?.branch || '');
        if (!college) return events;
        return events.filter(e => (e.college || e.branch || '') === college);
    }, [events, isSuperAdmin, collegeFilter, currentUser]);

    const scopedVolunteers = useMemo(() => {
        if (isSuperAdmin && collegeFilter === 'all') return volunteers;
        const college = isSuperAdmin ? collegeFilter : (currentUser?.college || currentUser?.branch || '');
        if (!college) return volunteers;
        return volunteers.filter(v => (v.college || v.branch || '') === college);
    }, [volunteers, isSuperAdmin, collegeFilter, currentUser]);

    // Unique colleges for the filter dropdown
    const allColleges = useMemo(() => {
        const set = new Set();
        volunteers.forEach(v => { if (v.college || v.branch) set.add(v.college || v.branch); });
        events.forEach(e => { if (e.college || e.branch) set.add(e.college || e.branch); });
        return Array.from(set).sort();
    }, [volunteers, events]);

    const totalPoints = scopedVolunteers.reduce((acc, v) => acc + (v.points || 0), 0);
    const totalParticipants = scopedEvents.reduce((acc, e) => acc + (e.participants || 0), 0);
    const maxParticipants = Math.max(...scopedEvents.map(e => e.participants || 0), 1);

    const statConfig = [
        { name: 'Total Events', value: events.length.toString(), icon: Calendar, color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20', accent: 'from-blue-500 to-cyan-400' },
        { name: 'Registrations', value: totalParticipants.toString(), icon: UserPlus, color: 'text-emerald-500', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20', accent: 'from-emerald-500 to-teal-400' },
        { name: 'Active Volunteers', value: volunteers.length.toString(), icon: Users, color: 'text-violet-500', bg: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/20', accent: 'from-violet-500 to-purple-400' },
        { name: 'Total Points', value: totalPoints ? totalPoints.toLocaleString() : '0', icon: Activity, color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20', accent: 'from-amber-500 to-orange-400' },
    ];

    // Event Handlers
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
        let fileToUpload = imageFile;
        if (completedCrop && imageRef && imageRef.complete && completedCrop.width > 0 && completedCrop.height > 0) {
            try {
                const scaleX = imageRef.naturalWidth / imageRef.width;
                const scaleY = imageRef.naturalHeight / imageRef.height;
                if (!isNaN(scaleX) && !isNaN(scaleY)) {
                    const scaledCrop = {
                        x: completedCrop.x * scaleX,
                        y: completedCrop.y * scaleY,
                        width: completedCrop.width * scaleX,
                        height: completedCrop.height * scaleY,
                        unit: 'px',
                    };
                    fileToUpload = await getCroppedImg(imagePreview, scaledCrop, fileToUpload.name);
                }
            } catch (err) {
                console.error("Crop failed, falling back to original file", err);
            }
        }
        return await uploadToStorage(fileToUpload);
    };

    const handleCreateOrUpdateEvent = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const imageUrl = await uploadImage();
            if (isEditing && currentEventId) {
                await updateDoc(doc(db, "events", currentEventId), { ...newEvent, imageUrl });
                addToast('Event updated successfully!', 'success');
            } else {
                const eventCollege = currentUser?.college || currentUser?.branch || '';
                await addDoc(collection(db, "events"), { ...newEvent, imageUrl, college: eventCollege, createdAt: new Date(), participants: 0, status: 'Active' });
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
                college: newVolunteer.college || newVolunteer.branch,
                points: 0,
                tasksCompleted: 0,
                shares: 0,
                createdAt: new Date().toISOString()
            });
            await secondaryAuth.signOut();
            await deleteApp(secondaryApp);
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

    const viewRegistrations = async (eventId, eventName) => {
        setLoadingRegs(true);
        setRegEventName(eventName);
        setShowRegistrationsModal(true);
        try {
            const regsSnap = await getDocs(collection(db, "events", eventId, "registrations"));
            const regsData = regsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            regsData.sort((a, b) => (b.registeredAt?.toDate?.() || new Date(b.registeredAt)) - (a.registeredAt?.toDate?.() || new Date(a.registeredAt)));
            setRegistrations(regsData);
        } catch (error) {
            console.error('Failed to load registrations', error);
            addToast('Failed to load registrations', 'error');
        } finally {
            setLoadingRegs(false);
        }
    };

    const exportRegistrations = () => {
        if (registrations.length === 0) return;
        const headers = ['Name', 'Email', 'Phone', 'College', 'Year', 'Registered At'];
        const csvRows = [headers.join(','), ...registrations.map(r => [`"${r.name || ''}"`, `"${r.email || ''}"`, `"${r.phone || ''}"`, `"${r.college || ''}"`, `"${r.year || ''}"`, `"${r.registeredAt?.toDate ? r.registeredAt.toDate().toLocaleString() : new Date(r.registeredAt).toLocaleString()}"`].join(','))];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${regEventName.replace(/\s+/g, '_')}_registrations.csv`;
        link.click();
        addToast('CSV exported!', 'success');
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const assignedTo = newTask.assignedTo === 'all' ? 'all' : selectedTaskVolunteers;
            await addDoc(collection(db, "tasks"), { ...newTask, points: parseInt(newTask.points) || 50, target: parseInt(newTask.target) || 5, assignedTo, completedBy: [], createdAt: new Date().toISOString() });
            setShowTaskModal(false);
            setNewTask({ title: '', event: '', eventId: '', date: '', points: 50, target: 5, targetType: 'registrations', assignedTo: 'all' });
            setSelectedTaskVolunteers([]);
            addToast('Task created successfully!', 'success');
        } catch (error) {
            console.error('Failed to create task', error);
            addToast('Failed to create task', 'error');
        }
    };

    const handleNotify = async () => {
        if (!notifyEvent || !notifyMessage.trim()) return;
        try {
            await addDoc(collection(db, "events", notifyEvent.id, "notifications"), { message: notifyMessage, createdAt: serverTimestamp(), eventName: notifyEvent.name });
            await addDoc(collection(db, "notifications"), { title: notifyEvent.name, message: notifyMessage, createdAt: serverTimestamp() });
            await updateDoc(doc(db, "events", notifyEvent.id), { latestNotification: notifyMessage, notifiedAt: new Date().toISOString() });
            setShowNotifyModal(false);
            setNotifyMessage('');
            addToast('Notification sent!', 'success');
        } catch (error) {
            console.error('Failed to send notification', error);
            addToast('Failed to send notification', 'error');
        }
    };

    const handleSetCountdown = async () => {
        if (!countdownEvent || !countdownDate) return;
        try {
            await updateDoc(doc(db, "events", countdownEvent.id), { countdownDate });
            setShowCountdownModal(false);
            addToast('Countdown set!', 'success');
        } catch (error) {
            console.error('Failed to set countdown', error);
            addToast('Failed to set countdown', 'error');
        }
    };

    const handleDeleteTask = async (id) => {
        if (window.confirm('Delete this task?')) {
            try { await deleteDoc(doc(db, "tasks", id)); addToast('Task deleted', 'info'); }
            catch (error) { console.error(error); }
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim() || selectedMembers.length === 0) return;
        try {
            const members = selectedMembers.map(uid => {
                const vol = volunteers.find(v => v.id === uid);
                return { uid, name: vol?.name || 'Unknown', email: vol?.email || '' };
            });
            await addDoc(collection(db, "teams"), { name: newTeamName, members, memberIds: selectedMembers, createdAt: new Date().toISOString() });
            setShowTeamModal(false);
            setNewTeamName('');
            setSelectedMembers([]);
            addToast('Team created!', 'success');
        } catch (error) {
            console.error('Failed to create team', error);
            addToast('Failed to create team', 'error');
        }
    };

    const handleDeleteTeam = async (id) => {
        if (window.confirm('Delete this team?')) {
            try { await deleteDoc(doc(db, "teams", id)); addToast('Team deleted', 'info'); }
            catch (error) { console.error(error); }
        }
    };

    const toggleMember = (uid) => setSelectedMembers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);

    const handleCreateReward = async (e) => {
        e.preventDefault();
        if (!newReward.name.trim() || newReward.points < 1) return;
        try {
            await addDoc(collection(db, "rewards"), { ...newReward, createdAt: new Date().toISOString() });
            setShowRewardModal(false);
            setNewReward({ name: '', points: 50, desc: '', icon: '🎁', quantity: 10 });
            addToast('Reward created!', 'success');
        } catch (error) {
            console.error('Failed to create reward', error);
            addToast('Failed to create reward', 'error');
        }
    };

    const handleDeleteReward = async (id) => {
        if (window.confirm('Delete this reward?')) {
            try { await deleteDoc(doc(db, "rewards", id)); addToast('Reward deleted', 'info'); }
            catch (error) { console.error(error); }
        }
    };

    const handleGiveReward = async (e) => {
        e.preventDefault();
        if (!selectedVolunteerForReward || !selectedRewardToGive) return;
        try {
            const rewardData = rewards.find(r => r.id === selectedRewardToGive);
            if (!rewardData) { addToast('Reward not found', 'error'); return; }

            if ((rewardData.quantity || 0) < 1) {
                addToast('This reward is out of stock!', 'error');
                return;
            }

            const userSnap = await getDoc(doc(db, "users", selectedVolunteerForReward));
            const userPoints = userSnap.data()?.points || 0;
            const cost = rewardData.points || 0;

            if (userPoints < cost) {
                addToast(`Not enough points! Needs ${cost} pts but has ${userPoints} pts`, 'error');
                return;
            }

            await addDoc(collection(db, "claims"), { userId: selectedVolunteerForReward, rewardId: selectedRewardToGive, rewardName: rewardData.name, pointsCost: cost, status: 'granted', claimedAt: new Date().toISOString(), grantedBy: 'Admin' });
            await updateDoc(doc(db, "users", selectedVolunteerForReward), { points: increment(-cost) });
            await updateDoc(doc(db, "rewards", selectedRewardToGive), { quantity: increment(-1) });

            setShowGiveRewardModal(false);
            setSelectedVolunteerForReward('');
            setSelectedRewardToGive('');
            addToast('Reward given and points deducted!', 'success');
        } catch (error) {
            console.error('Failed to give reward', error);
            addToast('Failed to give reward: ' + error.message, 'error');
        }
    };

    const openEditModal = (event) => {
        setIsEditing(true);
        setCurrentEventId(event.id);
        
        // Handle date conversion if it's in a human-readable string format
        let formattedDate = event.date;
        if (event.date && !event.date.includes('T')) {
            try {
                const dateObj = new Date(event.date);
                if (!isNaN(dateObj.getTime())) {
                    formattedDate = dateObj.toISOString().slice(0, 16);
                }
            } catch (e) {
                console.warn("Could not parse date for picker", e);
            }
        }

        setNewEvent({ 
            name: event.name, 
            date: formattedDate, 
            venue: event.venue, 
            desc: event.desc, 
            category: event.category || 'Workshop', 
            imageUrl: event.imageUrl || '' 
        });
        if (event.imageUrl) setImagePreview(event.imageUrl);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setNewEvent({ name: '', date: '', venue: '', desc: '', category: 'Workshop', imageUrl: '' });
        setImageFile(null); 
        setImagePreview(null); 
        setCrop({ unit: '%', width: 100, aspect: 16 / 9 });
        setCompletedCrop(null); 
        setImageRef(null);
        setUploading(false); // Ensure spinner stops on close
    };

    const closeVolunteerModal = () => {
        setShowVolunteerModal(false);
        setNewVolunteer({ name: '', email: '', password: '', branch: 'IEEE Student Branch', college: '' });
        setCreationError('');
    };

    const handleRemoveVolunteer = async (id) => {
        if (window.confirm("Remove this volunteer's access?")) {
            try { await updateDoc(doc(db, "users", id), { role: "STUDENT" }); addToast('Access removed', 'warning'); }
            catch (err) { console.error(err); }
        }
    };

    const handlePromoteToVolunteer = async (id) => {
        if (window.confirm("Promote this student to Volunteer?")) {
            try { 
                await updateDoc(doc(db, "users", id), { 
                    role: "VOLUNTEER",
                    approvalStatus: "ACTIVE" 
                }); 
                addToast('Promoted!', 'success'); 
            }
            catch (err) { console.error(err); }
        }
    };

    // ── SUPER ADMIN ONLY: Delete user entirely ──
    const handleDeleteUser = async (id, name) => {
        if (!isSuperAdmin) return;
        if (window.confirm(`⚠️ PERMANENTLY DELETE user "${name}"? This cannot be undone.`)) {
            try {
                await deleteDoc(doc(db, "users", id));
                addToast(`User "${name}" deleted permanently`, 'warning');
            } catch (err) {
                console.error(err);
                addToast('Failed to delete user', 'error');
            }
        }
    };

    // ── SUPER ADMIN ONLY: Reset user points ──
    const handleResetPoints = async (id, name) => {
        if (!isSuperAdmin) return;
        if (window.confirm(`Reset all points for "${name}" to 0?`)) {
            try {
                await updateDoc(doc(db, "users", id), { points: 0 });
                addToast(`Points reset for "${name}"`, 'info');
            } catch (err) {
                console.error(err);
                addToast('Failed to reset points', 'error');
            }
        }
    };

    // ── SUPER ADMIN ONLY: Promote to Sub Admin ──
    const handlePromoteToAdmin = async (id, name) => {
        if (!isSuperAdmin) return;
        if (window.confirm(`Promote "${name}" to Sub Admin?`)) {
            try {
                await updateDoc(doc(db, "users", id), { role: ROLES.ADMIN });
                addToast(`"${name}" is now a Sub Admin`, 'success');
            } catch (err) {
                console.error(err);
                addToast('Failed to promote', 'error');
            }
        }
    };

    // ── SUPER ADMIN ONLY: Demote from Admin ──
    const handleDemoteAdmin = async (id, name) => {
        if (!isSuperAdmin) return;
        if (window.confirm(`Demote "${name}" from Admin to Volunteer?`)) {
            try {
                await updateDoc(doc(db, "users", id), { role: ROLES.VOLUNTEER });
                addToast(`"${name}" demoted to Volunteer`, 'info');
            } catch (err) {
                console.error(err);
                addToast('Failed to demote', 'error');
            }
        }
    };

    const handleApproveVolunteer = async (id) => {
        if (window.confirm("Approve this application? They will need to fill the required form next.")) {
            try { 
                await updateDoc(doc(db, "users", id), { 
                    approvalStatus: "APPROVED_PENDING_FORM" 
                }); 
                addToast('Application Approved!', 'success'); 
            }
            catch (err) { console.error(err); }
        }
    };

    const filteredEvents = scopedEvents.filter(e => e.name?.toLowerCase().includes(searchEvents.toLowerCase()));
    const filteredVols = scopedVolunteers.filter(v => v.name?.toLowerCase().includes(searchVol.toLowerCase()) || v.email?.toLowerCase().includes(searchVol.toLowerCase()));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div className="min-w-0 w-full sm:w-auto">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
                            {isSuperAdmin && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                    <Shield className="w-3 h-3" /> Super Admin
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">Manage events, track volunteers, and monitor engagement.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full sm:w-auto">
                        {/* College Filter — Super Admin only */}
                        {isSuperAdmin && (
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={collegeFilter}
                                    onChange={(e) => setCollegeFilter(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-ieee-blue outline-none appearance-none cursor-pointer min-w-[180px]"
                                >
                                    <option value="all">All Colleges</option>
                                    {allColleges.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <Button onClick={() => setShowVolunteerModal(true)} variant="outline" className="flex items-center gap-2 btn-outline">
                            <UserPlus className="w-4 h-4" /> Add Volunteer
                        </Button>
                        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 shadow-lg hover:shadow-xl btn-primary">
                            <PlusCircle className="w-5 h-5" /> Create Event
                        </Button>
                    </div>
                </div>

                {/* Stats & Charts Section */}
                <StatCards stats={statConfig} />
                <ActivityChart events={scopedEvents} maxParticipants={maxParticipants} viewRegistrations={viewRegistrations} />
                <AnalyticsGrid volunteers={scopedVolunteers} teams={teams} adminTasks={adminTasks} events={scopedEvents} totalPoints={totalPoints} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <EventStatsDonut events={scopedEvents} />
                    <ParticipantAnalytics events={scopedEvents} totalParticipants={totalParticipants} maxParticipants={maxParticipants} />
                </div>

                {/* Rankings and Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                            <BarChart2 className="w-5 h-5 text-violet-500" /> Task Completion Rates
                        </h2>
                        {/* Task Progress Subsection */}
                        <div className="space-y-4">
                            {adminTasks.map(task => {
                                const linkedEvent = events.find(e => e.id === task.eventId);
                                const current = linkedEvent?.participants || 0;
                                const target = task.target || 1;
                                const pct = Math.min(100, Math.round((current / target) * 100));
                                return (
                                    <div key={task.id}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-sm font-semibold truncate dark:text-gray-300 uppercase text-[10px] tracking-wider">{task.title}</span>
                                            <span className="text-xs font-black text-gray-400">{pct}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-violet-500" />
                                        </div>
                                    </div>
                                );
                            })}
                            {adminTasks.length === 0 && <p className="text-center py-10 text-gray-400 text-sm italic">No tasks created yet</p>}
                        </div>
                    </div>
                    <TopVolunteers volunteers={volunteers} />
                </div>

                <VolunteerPerformanceTable volunteers={scopedVolunteers} adminTasks={adminTasks} teams={teams} totalPoints={totalPoints} />

                {/* Lists Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2">
                        <EventList 
                            filteredEvents={filteredEvents}
                            searchEvents={searchEvents}
                            setSearchEvents={setSearchEvents}
                            viewRegistrations={viewRegistrations}
                            setNotifyEvent={setNotifyEvent}
                            setShowNotifyModal={setShowNotifyModal}
                            setCountdownEvent={setCountdownEvent}
                            setCountdownDate={setCountdownDate}
                            setShowCountdownModal={setShowCountdownModal}
                            openEditModal={openEditModal}
                            handleDeleteEvent={handleDeleteEvent}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <VolunteerList 
                            filteredVols={filteredVols} 
                            searchVol={searchVol} 
                            setSearchVol={setSearchVol} 
                            setShowVolunteerModal={setShowVolunteerModal} 
                            handlePromoteToVolunteer={handlePromoteToVolunteer}
                            handleApproveVolunteer={handleApproveVolunteer}
                            handleRemoveVolunteer={handleRemoveVolunteer}
                            isSuperAdmin={isSuperAdmin}
                            handleDeleteUser={handleDeleteUser}
                            handleResetPoints={handleResetPoints}
                            handlePromoteToAdmin={handlePromoteToAdmin}
                            handleDemoteAdmin={handleDemoteAdmin}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <TaskList adminTasks={adminTasks} events={events} setShowTaskModal={setShowTaskModal} handleDeleteTask={handleDeleteTask} />
                    <TeamList teams={teams} volunteers={volunteers} setShowTeamModal={setShowTeamModal} setSelectedMembers={setSelectedMembers} setNewTeamName={setNewTeamName} handleDeleteTeam={handleDeleteTeam} />
                </div>

                <RewardList
                    rewards={rewards}
                    setShowGiveRewardModal={setShowGiveRewardModal}
                    setSelectedVolunteerForReward={setSelectedVolunteerForReward}
                    setSelectedRewardToGive={setSelectedRewardToGive}
                    setShowRewardModal={setShowRewardModal}
                    handleDeleteReward={handleDeleteReward}
                />

                {/* ── Link & Traffic Tracking ── */}
                <div className="mt-8 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                    <LinkTrackingPanel volunteers={scopedVolunteers} events={events} />
                </div>
            </div>

            {/* Modals Container */}
            <EventModal
                showModal={showModal}
                closeModal={closeModal}
                isEditing={isEditing}
                handleCreateOrUpdateEvent={handleCreateOrUpdateEvent}
                newEvent={newEvent}
                setNewEvent={setNewEvent}
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                imageFile={imageFile}
                setImageFile={setImageFile}
                crop={crop}
                setCrop={setCrop}
                setCompletedCrop={setCompletedCrop}
                setImageRef={setImageRef}
                handleImageDrop={handleImageDrop}
                handleImageSelect={handleImageSelect}
                uploading={uploading}
            />
            <VolunteerModal
                showVolunteerModal={showVolunteerModal}
                closeVolunteerModal={closeVolunteerModal}
                handleCreateVolunteer={handleCreateVolunteer}
                newVolunteer={newVolunteer}
                setNewVolunteer={setNewVolunteer}
                creationError={creationError}
            />
            <TaskModal
                showTaskModal={showTaskModal}
                setShowTaskModal={setShowTaskModal}
                newTask={newTask}
                setNewTask={setNewTask}
                events={events}
                volunteers={volunteers}
                selectedTaskVolunteers={selectedTaskVolunteers}
                setSelectedTaskVolunteers={setSelectedTaskVolunteers}
                handleCreateTask={handleCreateTask}
            />
            <TeamModal
                showTeamModal={showTeamModal}
                setShowTeamModal={setShowTeamModal}
                newTeamName={newTeamName}
                setNewTeamName={setNewTeamName}
                volunteers={volunteers}
                selectedMembers={selectedMembers}
                toggleMember={toggleMember}
                handleCreateTeam={handleCreateTeam}
            />
            <RewardModal
                showRewardModal={showRewardModal}
                setShowRewardModal={setShowRewardModal}
                newReward={newReward}
                setNewReward={setNewReward}
                handleCreateReward={handleCreateReward}
            />
            <GiveRewardModal
                showGiveRewardModal={showGiveRewardModal}
                setShowGiveRewardModal={setShowGiveRewardModal}
                selectedVolunteerForReward={selectedVolunteerForReward}
                setSelectedVolunteerForReward={setSelectedVolunteerForReward}
                selectedRewardToGive={selectedRewardToGive}
                setSelectedRewardToGive={setSelectedRewardToGive}
                volunteers={volunteers}
                rewards={rewards}
                handleGiveReward={handleGiveReward}
            />
            <RegistrationsModal
                showRegistrationsModal={showRegistrationsModal}
                setShowRegistrationsModal={setShowRegistrationsModal}
                regEventName={regEventName}
                registrations={registrations}
                loadingRegs={loadingRegs}
                exportRegistrations={exportRegistrations}
            />
            <NotifyModal
                showNotifyModal={showNotifyModal}
                setShowNotifyModal={setShowNotifyModal}
                notifyEvent={notifyEvent}
                notifyMessage={notifyMessage}
                setNotifyMessage={setNotifyMessage}
                handleNotify={handleNotify}
            />
            <CountdownModal
                showCountdownModal={showCountdownModal}
                setShowCountdownModal={setShowCountdownModal}
                countdownEvent={countdownEvent}
                countdownDate={countdownDate}
                setCountdownDate={setCountdownDate}
                handleSetCountdown={handleSetCountdown}
            />
        </div>
    );
}
