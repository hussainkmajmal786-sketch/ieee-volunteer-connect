import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wand2, Link2, Upload, Loader2, Film, Image as ImageIcon } from "lucide-react";
import Button from "../Button";
import { apiForm } from "../../lib/api";
import { uploadImage } from "../../utils/upload";
import { grabVideoFrame } from "../../utils/videoFrame";
import { useToast } from "../../hooks/useToast";

const FIELD = "w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none";
const MB = 1024 * 1024;

/**
 * Admin: paste a social media post link and/or drop the poster or promo
 * video; the server reads the event details and returns a draft that opens
 * in the normal event form for review.
 */
export default function ImportEventModal({ open, onClose, onExtracted }) {
    const addToast = useToast();
    const [url, setUrl] = useState("");
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [step, setStep] = useState("");
    const preview = useMemo(() => (file?.type?.startsWith("image/") ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    if (!open) return null;
    const isVideo = file?.type?.startsWith("video/");
    const busy = !!step;

    const pick = (f) => {
        if (!f) return;
        if (f.type.startsWith("video/") ? f.size >= 25 * MB : f.size >= 5 * MB) {
            addToast(f.type.startsWith("video/") ? "Videos must be smaller than 25MB" : "Posters must be smaller than 5MB", "error");
            return;
        }
        if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) return addToast("Choose an image or a video", "error");
        setFile(f);
    };

    const reset = () => { setUrl(""); setText(""); setFile(null); setStep(""); };
    const close = () => { if (!busy) { reset(); onClose(); } };

    const extract = async (e) => {
        e.preventDefault();
        if (!url.trim() && !text.trim() && !file) return addToast("Paste a post link, add the poster/video, or paste the post text", "error");
        const form = new FormData();
        if (url.trim()) form.append("url", url.trim());
        if (text.trim()) form.append("text", text.trim());
        try {
            if (isVideo) {
                setStep("Uploading video…");
                form.append("videoUrl", await uploadImage(file, "event-media"));
                setStep("Reading a frame of the video…");
                const frame = await grabVideoFrame(file).catch(() => null);
                if (frame) form.append("file", frame);
            } else if (file) {
                form.append("file", file);
            }
            setStep("Reading the event details…");
            const result = await apiForm("/api/admin/event-import", form);
            reset();
            onExtracted(result);
        } catch (err) {
            addToast(err.message || "Could not read the event", "error");
            setStep("");
        }
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={close}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="import-title"
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                        <h2 id="import-title" className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Wand2 className="w-5 h-5 text-ieee-blue" /> Import event from a post</h2>
                        <button onClick={close} aria-label="Close" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={extract} className="p-5 space-y-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Add a post link, the poster or the promo video — any one is enough, more gives better results. You’ll review everything before it’s published.
                        </p>
                        <label className="block">
                            <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"><Link2 className="w-4 h-4 inline mr-1" /> Post link</span>
                            <input type="url" value={url} onChange={e => setUrl(e.target.value)} disabled={busy} className={FIELD}
                                placeholder="https://www.instagram.com/p/… (or LinkedIn, Facebook, X, a website)" />
                        </label>

                        <div>
                            <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Poster or video</span>
                            {file ? (
                                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                    {isVideo ? <Film className="w-8 h-8 text-ieee-blue shrink-0" /> : <img src={preview || ""} alt="" className="w-14 h-14 rounded-lg object-cover" />}
                                    <span className="flex-1 min-w-0 text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}<span className="block text-xs text-gray-400">{(file.size / MB).toFixed(1)} MB · {isVideo ? "video" : "poster"}</span></span>
                                    <button type="button" onClick={() => setFile(null)} disabled={busy} aria-label="Remove file" className="p-1.5 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <label onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
                                    className="flex flex-col items-center justify-center gap-1 py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 cursor-pointer hover:border-ieee-blue transition">
                                    <span className="flex items-center gap-2"><ImageIcon className="w-5 h-5" /><Film className="w-5 h-5" /></span>
                                    <span><Upload className="w-4 h-4 inline mr-1" /> Choose or drop a poster (≤5MB) or video (≤25MB)</span>
                                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" className="sr-only"
                                        onChange={e => { pick(e.target.files?.[0]); e.target.value = ""; }} aria-label="Poster or video" />
                                </label>
                            )}
                        </div>

                        <label className="block">
                            <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Post text <span className="font-normal text-gray-400">(optional — paste the caption)</span></span>
                            <textarea rows={3} value={text} onChange={e => setText(e.target.value)} disabled={busy} className={`${FIELD} resize-none`} maxLength={5000}
                                placeholder="Useful when the post is private or the link can't be opened" />
                        </label>

                        <Button type="submit" disabled={busy} className="w-full py-3 flex items-center justify-center gap-2">
                            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {step}</> : <><Wand2 className="w-4 h-4" /> Read event details</>}
                        </Button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
