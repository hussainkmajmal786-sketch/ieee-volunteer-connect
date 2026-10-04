import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { filterOptions } from "../utils/search";

const MAX_SHOWN = 60;

/**
 * Searchable dropdown that still accepts free text (for a college or
 * department that isn't listed). Keyboard: ↑ ↓ to move, Enter to pick, Esc to close.
 */
export default function ComboBox({ value, onChange, options, placeholder, label, required, className = "", inputClassName = "", maxLength = 200 }) {
    const listId = useId();
    const inputRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [showAll, setShowAll] = useState(false);

    // Typing filters; opening with the arrow shows the whole list.
    const matches = useMemo(() => filterOptions(options, showAll ? "" : value || ""), [options, value, showAll]);
    const shown = matches.slice(0, MAX_SHOWN);
    const exact = options.some(o => o.toLowerCase() === (value || "").trim().toLowerCase());

    const pick = (option) => {
        onChange(option);
        setOpen(false);
        setActive(-1);
        setShowAll(false);
    };

    const onKeyDown = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive(i => Math.min(i + 1, shown.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && open && active >= 0 && shown[active]) {
            e.preventDefault();
            pick(shown[active]);
        } else if (e.key === "Escape" && open) {
            e.preventDefault();
            setOpen(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-label={label}
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
                autoComplete="off"
                value={value || ""}
                placeholder={placeholder}
                required={required}
                maxLength={maxLength}
                onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); setShowAll(false); }}
                onFocus={() => setOpen(true)}
                onBlur={() => { setOpen(false); setShowAll(false); }}
                onKeyDown={onKeyDown}
                className={`${inputClassName} pr-10`}
            />
            <button type="button" tabIndex={-1} aria-label={`Show all ${label || "options"}`}
                onMouseDown={(e) => {
                    e.preventDefault();
                    const closing = open && showAll;
                    setShowAll(!closing);
                    setOpen(!closing);
                    inputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-ieee-blue">
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <ul id={listId} role="listbox" aria-label={label}
                    className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl py-1 text-sm">
                    {shown.map((o, i) => (
                        <li key={o} id={`${listId}-${i}`} role="option" aria-selected={o === value}
                            onMouseDown={(e) => { e.preventDefault(); pick(o); }}
                            onMouseEnter={() => setActive(i)}
                            className={`px-3 py-2 cursor-pointer flex items-center gap-2 text-left ${i === active ? "bg-ieee-blue/10 text-ieee-blue dark:text-cyan-300" : "text-gray-700 dark:text-gray-200"}`}>
                            <span className="flex-1">{o}</span>
                            {o === value && <Check className="w-4 h-4 shrink-0 text-ieee-blue" />}
                        </li>
                    ))}
                    {matches.length > MAX_SHOWN && (
                        <li className="px-3 py-2 text-xs text-gray-400">{matches.length - MAX_SHOWN} more — keep typing to narrow down</li>
                    )}
                    {value?.trim() && !exact && !showAll && (
                        <li className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                            {shown.length ? "Not listed? " : "No match. "}“{value.trim()}” will be used as typed.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
