import { useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { uploadImage } from "../../utils/upload";
import { useToast } from "../../hooks/useToast";

/**
 * Upload control for admin forms. Single mode: value is a URL string.
 * Multiple mode: value is an array of { url, name }.
 */
export default function MediaInput({ label, folder, accept = "image/*", multiple = false, value, onChange, hint }) {
    const addToast = useToast();
    const [busy, setBusy] = useState(false);
    const items = multiple ? (value || []) : (value ? [{ url: value, name: value.split("/").pop() }] : []);
    const isImage = (u) => /\.(png|jpe?g|webp|gif)$/i.test(u);
    const isVideo = (u) => /\.(mp4|webm)$/i.test(u);

    const pick = async (e) => {
        const files = [...(e.target.files || [])];
        e.target.value = "";
        if (files.length === 0) return;
        setBusy(true);
        try {
            const uploaded = [];
            for (const f of files) uploaded.push({ url: await uploadImage(f, folder), name: f.name });
            onChange(multiple ? [...items, ...uploaded] : uploaded[0].url);
        } catch (err) {
            addToast(err.message || "Upload failed", "error");
        } finally {
            setBusy(false);
        }
    };

    const remove = (url) => onChange(multiple ? items.filter(i => i.url !== url) : "");

    return (
        <div className="mb-4">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">{label}</span>
            {items.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {items.map(i => (
                        <div key={i.url} className="relative group">
                            {isImage(i.url) ? (
                                <img src={i.url} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
                            ) : isVideo(i.url) ? (
                                <video src={i.url} className="w-32 h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700" muted />
                            ) : (
                                <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 max-w-[12rem]">
                                    <FileText className="w-4 h-4 shrink-0" /> <span className="truncate">{i.name}</span>
                                </span>
                            )}
                            <button type="button" onClick={() => remove(i.url)} aria-label={`Remove ${i.name}`}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow"><X className="w-3.5 h-3.5" /></button>
                        </div>
                    ))}
                </div>
            )}
            {(multiple || items.length === 0) && (
                <label className="flex items-center justify-center gap-2 px-3 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 cursor-pointer hover:border-ieee-blue transition">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {busy ? "Uploading…" : multiple ? "Add files" : "Choose file"}
                    <input type="file" accept={accept} multiple={multiple} className="sr-only" onChange={pick} disabled={busy} aria-label={label} />
                </label>
            )}
            {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}
