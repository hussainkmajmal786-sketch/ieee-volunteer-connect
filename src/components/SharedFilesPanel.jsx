import { useCallback, useEffect, useState } from "react";
import { FolderOpen, FileText, Image as ImageIcon, Link as LinkIcon, Download, Eye, ExternalLink, RefreshCw } from "lucide-react";
import { apiGet } from "../lib/api";
import { decode } from "../lib/firestore";
import { formatBytes } from "../utils/format";

const VIEWABLE = /^(image\/|application\/pdf|video\/|audio\/|text\/plain)/;

function iconFor(f) {
    if (f.url) return LinkIcon;
    if (f.contentType?.startsWith("image/")) return ImageIcon;
    return FileText;
}

/** Files and links the super admin shared with this user. */
export default function SharedFilesPanel() {
    const [files, setFiles] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { files } = await apiGet("/api/shared-files");
            setFiles(decode(files));
        } catch {
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const onFocus = () => load();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [load]);

    if (!files || files.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><FolderOpen className="w-5 h-5 text-amber-500" /> Shared with you</h3>
                <button onClick={load} className="p-1.5 text-gray-400 hover:text-ieee-blue rounded-lg" aria-label="Refresh shared files">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800 max-h-96 overflow-y-auto">
                {files.map(f => {
                    const Icon = iconFor(f);
                    const href = f.url || `/api/shared-files/${encodeURIComponent(f.id)}/download`;
                    return (
                        <li key={f.id} className="p-4 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">{f.title}</p>
                                {f.description && <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{f.description}</p>}
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {f.fileName ? `${f.fileName} · ${formatBytes(f.size)}` : "Link"}
                                    {f.createdAt?.toDate ? ` · ${f.createdAt.toDate().toLocaleDateString()}` : ""}
                                </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                {f.url ? (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-ieee-blue hover:bg-ieee-blue/10" aria-label={`Open ${f.title}`}><ExternalLink className="w-4 h-4" /></a>
                                ) : (
                                    <>
                                        {VIEWABLE.test(f.contentType || "") && (
                                            <a href={`${href}?view=1`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-ieee-blue hover:bg-ieee-blue/10" aria-label={`View ${f.title}`}><Eye className="w-4 h-4" /></a>
                                        )}
                                        <a href={href} className="p-2 rounded-lg text-ieee-blue hover:bg-ieee-blue/10" aria-label={`Download ${f.title}`}><Download className="w-4 h-4" /></a>
                                    </>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
