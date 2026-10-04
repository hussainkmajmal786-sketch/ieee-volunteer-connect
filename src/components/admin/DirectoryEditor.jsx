import { useEffect, useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { db, doc, getDoc, setDoc, serverTimestamp } from "../../lib/firestore";
import { useToast } from "../../hooks/useToast";
import { DIRECTORY_DOC, DIRECTORY_DEFAULTS, refreshDirectory } from "../../hooks/useDirectory";
import { cleanList } from "../../utils/constants";

const AREA = "w-full h-72 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none font-mono leading-relaxed";
const toText = (list) => list.join("\n");

/** Super admin: the college and department lists shown in every form. */
export default function DirectoryEditor() {
    const addToast = useToast();
    const [text, setText] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getDoc(doc(db, ...DIRECTORY_DOC)).then(s => {
            const d = s.exists() ? s.data() : {};
            setText({
                colleges: toText(d.colleges?.length ? d.colleges : DIRECTORY_DEFAULTS.colleges),
                departments: toText(d.departments?.length ? d.departments : DIRECTORY_DEFAULTS.departments),
            });
        }).catch(() => setText({ colleges: toText(DIRECTORY_DEFAULTS.colleges), departments: toText(DIRECTORY_DEFAULTS.departments) }));
    }, []);

    if (!text) return <p className="text-sm text-gray-400 py-6">Loading…</p>;
    const lists = { colleges: cleanList(text.colleges.split("\n")), departments: cleanList(text.departments.split("\n")) };

    const save = async () => {
        if (!lists.colleges.length || !lists.departments.length) return addToast("Both lists need at least one entry", "error");
        setSaving(true);
        try {
            await setDoc(doc(db, ...DIRECTORY_DOC), { ...lists, updatedAt: serverTimestamp() });
            refreshDirectory();
            setText({ colleges: toText(lists.colleges), departments: toText(lists.departments) });
            addToast("Lists saved — forms now show them", "success");
        } catch (err) {
            addToast(err.message || "Could not save", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Shown as searchable lists in registration, sign-up, profile and ambassador forms. One per line. People can still type a name that isn’t listed.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
                {[["colleges", "Colleges"], ["departments", "Departments / branches"]].map(([key, label]) => (
                    <label key={key} className="block">
                        <span className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            {label} <span className="text-xs font-normal text-gray-400">{lists[key].length}</span>
                        </span>
                        <textarea className={AREA} value={text[key]} onChange={e => setText({ ...text, [key]: e.target.value })} spellCheck={false} />
                    </label>
                ))}
            </div>
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={save} disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-ieee-blue text-white rounded-xl text-sm font-bold hover:bg-ieee-blue/90 disabled:opacity-50">
                    <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save lists"}
                </button>
                <button type="button" onClick={() => setText({ colleges: toText(DIRECTORY_DEFAULTS.colleges), departments: toText(DIRECTORY_DEFAULTS.departments) })}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                    <RotateCcw className="w-4 h-4" /> Restore default lists
                </button>
            </div>
        </div>
    );
}
