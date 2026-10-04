/** Options matching every typed word; names starting with the text come first. */
export function filterOptions(options, text) {
    const q = text.trim().toLowerCase();
    if (!q) return options;
    const words = q.split(/\s+/);
    const hits = options.filter(o => {
        const l = o.toLowerCase();
        return words.every(w => l.includes(w));
    });
    return [...hits.filter(o => o.toLowerCase().startsWith(q)), ...hits.filter(o => !o.toLowerCase().startsWith(q))];
}
