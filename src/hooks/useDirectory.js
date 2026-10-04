import { useEffect, useState } from "react";
import { db, doc, getDoc } from "../lib/firestore";
import { COLLEGE_BRANCHES, DEPARTMENTS, cleanList } from "../utils/constants";

export const DIRECTORY_DOC = ["settings", "directory"];
const DEFAULTS = { colleges: cleanList(COLLEGE_BRANCHES), departments: cleanList(DEPARTMENTS) };

// Loaded once per page; the super admin's saved lists replace the defaults.
let pending = null;
function load() {
    pending ??= getDoc(doc(db, ...DIRECTORY_DOC))
        .then(s => {
            const d = s.exists() ? s.data() : {};
            return {
                colleges: d.colleges?.length ? cleanList(d.colleges) : DEFAULTS.colleges,
                departments: d.departments?.length ? cleanList(d.departments) : DEFAULTS.departments,
            };
        })
        .catch(() => DEFAULTS);
    return pending;
}

/** Forget the cached lists (after the super admin saves new ones). */
export function refreshDirectory() {
    pending = null;
}

/** { colleges, departments } for form pickers (defaults until loaded). */
export function useDirectory() {
    const [lists, setLists] = useState(DEFAULTS);
    useEffect(() => {
        let cancelled = false;
        load().then(l => !cancelled && setLists(l));
        return () => { cancelled = true; };
    }, []);
    return lists;
}

export { DEFAULTS as DIRECTORY_DEFAULTS };
