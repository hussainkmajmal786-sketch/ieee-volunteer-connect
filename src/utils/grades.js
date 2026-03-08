// Grade Tiers & Badge System for IEEE Volunteer Connect

export const GRADE_TIERS = [
    { name: 'Bronze', icon: '🟤', color: 'amber', bgClass: 'from-amber-600 to-amber-800', textClass: 'text-amber-700 dark:text-amber-400', bgPill: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-400/50', min: 0, max: 99 },
    { name: 'Silver', icon: '🩶', color: 'gray', bgClass: 'from-gray-300 to-gray-500', textClass: 'text-gray-600 dark:text-gray-300', bgPill: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-400/50', min: 100, max: 299 },
    { name: 'Gold', icon: '🥇', color: 'yellow', bgClass: 'from-yellow-400 to-amber-500', textClass: 'text-yellow-700 dark:text-yellow-400', bgPill: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-400/50', min: 300, max: 599 },
    { name: 'Platinum', icon: '💎', color: 'cyan', bgClass: 'from-cyan-400 to-blue-500', textClass: 'text-cyan-600 dark:text-cyan-400', bgPill: 'bg-cyan-100 dark:bg-cyan-900/30', border: 'border-cyan-400/50', min: 600, max: 999 },
    { name: 'Diamond', icon: '👑', color: 'violet', bgClass: 'from-violet-400 to-purple-600', textClass: 'text-violet-600 dark:text-violet-400', bgPill: 'bg-violet-100 dark:bg-violet-900/30', border: 'border-violet-400/50', min: 1000, max: Infinity },
];

export function getGrade(points = 0) {
    for (let i = GRADE_TIERS.length - 1; i >= 0; i--) {
        if (points >= GRADE_TIERS[i].min) return { ...GRADE_TIERS[i], tierIndex: i };
    }
    return { ...GRADE_TIERS[0], tierIndex: 0 };
}

export function getNextGrade(points = 0) {
    const current = getGrade(points);
    if (current.tierIndex >= GRADE_TIERS.length - 1) return null;
    return GRADE_TIERS[current.tierIndex + 1];
}

export function getGradeProgress(points = 0) {
    const grade = getGrade(points);
    const next = getNextGrade(points);
    if (!next) return 100;
    const rangeSize = next.min - grade.min;
    return Math.min(100, Math.round(((points - grade.min) / rangeSize) * 100));
}

// Badge definitions
export const BADGES = [
    { id: 'first_event', name: 'First Event', icon: '🎪', desc: 'Attend your first event', condition: (u) => (u.points || 0) >= 10 },
    { id: 'rising_star', name: 'Rising Star', icon: '⭐', desc: 'Earn 50 points', condition: (u) => (u.points || 0) >= 50 },
    { id: 'team_player', name: 'Team Player', icon: '🤝', desc: 'Complete 5 tasks', condition: (u) => (u.tasksCompleted || 0) >= 5 },
    { id: 'social_star', name: 'Social Star', icon: '📣', desc: 'Share 3 event links', condition: (u) => (u.shares || 0) >= 3 },
    { id: 'century', name: 'Century', icon: '💯', desc: 'Reach 100 points', condition: (u) => (u.points || 0) >= 100 },
    { id: 'expert', name: 'Expert', icon: '🏆', desc: 'Reach Gold tier (300+ pts)', condition: (u) => (u.points || 0) >= 300 },
    { id: 'platinum_pro', name: 'Platinum Pro', icon: '💎', desc: 'Reach Platinum tier (600+ pts)', condition: (u) => (u.points || 0) >= 600 },
    { id: 'legend', name: 'Legend', icon: '👑', desc: 'Reach Diamond tier (1000+ pts)', condition: (u) => (u.points || 0) >= 1000 },
];

export function getEarnedBadges(user) {
    return BADGES.filter(b => b.condition(user));
}

export function getLockedBadges(user) {
    return BADGES.filter(b => !b.condition(user));
}
