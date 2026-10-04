/** Display label for someone's role in the team. */
export function roleLabel(p) {
    if (p.ambassadorType === "campus") return "Campus Ambassador";
    if (p.ambassadorType === "class") return "Class Ambassador";
    if (p.role === "SUPER_ADMIN" || p.role === "ADMIN") return "Core Team";
    return "Volunteer";
}
