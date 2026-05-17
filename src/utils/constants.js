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
// Suggested IEEE Student Branches in Kerala. Admins/users can also type
// custom values — these populate a <datalist>, not a closed <select>.
// Sorted alphabetically by short name for fast lookup in the dropdown.
export const COLLEGE_BRANCHES = [
    // Government Engineering Colleges
    'IEEE SB CEK — College of Engineering Kidangoor',
    'IEEE SB CET — College of Engineering Trivandrum',
    'IEEE SB GEC Barton Hill',
    'IEEE SB GEC Idukki',
    'IEEE SB GEC Kannur',
    'IEEE SB GEC Kozhikode',
    'IEEE SB GEC Palakkad',
    'IEEE SB GEC Sreekrishnapuram',
    'IEEE SB GEC Thrissur',
    'IEEE SB GEC Wayanad',
    'IEEE SB MEC — Model Engineering College Thrikkakara',
    'IEEE SB NSSCE — NSS College of Engineering Palakkad',
    'IEEE SB RIT — Rajiv Gandhi Institute of Technology Kottayam',
    'IEEE SB TKMCE — TKM College of Engineering Kollam',

    // National Institutes
    'IEEE SB IIITK — IIIT Kottayam',
    'IEEE SB IIST — Indian Institute of Space Science and Technology',
    'IEEE SB NITC — NIT Calicut',

    // Aided / Self-financing
    'IEEE SB Adi Shankara Institute of Engineering & Technology',
    'IEEE SB Amal Jyothi College of Engineering Kanjirappally',
    'IEEE SB Amrita Vishwa Vidyapeetham Amritapuri',
    'IEEE SB Christ College of Engineering Irinjalakuda',
    'IEEE SB FISAT — Federal Institute of Science & Technology Angamaly',
    'IEEE SB Jyothi Engineering College Cheruthuruthy',
    'IEEE SB KMEA Engineering College',
    'IEEE SB LBSITW — LBS Institute of Tech for Women Trivandrum',
    'IEEE SB MACE — Mar Athanasius College of Engineering Kothamangalam',
    'IEEE SB Mangalam College of Engineering',
    'IEEE SB Marian Engineering College Trivandrum',
    'IEEE SB MBCET — Mar Baselios College of Engineering Trivandrum',
    'IEEE SB MBITS — Mar Baselios Institute of Tech & Science Nellimattom',
    'IEEE SB MES College of Engineering Kuttippuram',
    'IEEE SB Muthoot Institute of Technology & Science',
    'IEEE SB Nehru College of Engineering & Research Centre',
    'IEEE SB Saintgits College of Engineering Kottayam',
    'IEEE SB SCMS School of Engineering & Technology',
    'IEEE SB SCT — Sahrdaya College of Engineering & Tech Thrissur',
    'IEEE SB SJCET Palai',
    'IEEE SB Sree Buddha College of Engineering',
    'IEEE SB TIST — Toc H Institute of Science & Technology',
    'IEEE SB Vidya Academy of Science & Technology Thrissur',
    'IEEE SB Vimal Jyothi Engineering College Chemperi',
    'IEEE SB Viswajyothi College of Engineering & Technology',

    // Other / Not Listed
    'Other (Type your branch name)',
];
