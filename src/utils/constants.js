/**
 * IEEE Volunteer Connect — Application Constants
 */

// ─── SUPER ADMIN ────────────────────────────────────────────
// Only this email gets SUPER_ADMIN privileges (global access to all colleges, 
// delete users, reset leaderboard, manage sub-admins).
export const SUPER_ADMIN_EMAIL = 'hussainkmajmal786@gmail.com';

// ─── ROLE DEFINITIONS ───────────────────────────────────────
export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',          // Sub-admin — college-level access
    VOLUNTEER: 'VOLUNTEER',
    STUDENT: 'STUDENT',
};

// Helper to check if a role has admin-level access
export const isAdminRole = (role) => role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;

// ─── COLLEGE BRANCHES ───────────────────────────────────────
// Suggested colleges for dropdowns. Admins can also type custom values.
export const COLLEGE_BRANCHES = [
    'IEEE SB CEK',
    'IEEE SB GEC Thrissur',
    'IEEE SB NSSCE',
    'IEEE SB MACE',
    'IEEE SB TKM',
    'IEEE SB SCT',
    'IEEE SB CET',
    'IEEE SB RIT',
    'IEEE SB MBCET',
    'IEEE SB FISAT',
];
