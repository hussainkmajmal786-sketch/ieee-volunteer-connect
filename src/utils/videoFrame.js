/**
 * Grab one frame of a video file as a JPEG (used as the poster image the AI
 * reads, and as the event cover). Picks a point ~1s in, where titles usually show.
 */
export function grabVideoFrame(file, at = 1) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        video.src = url;
        const done = (fn, arg) => { URL.revokeObjectURL(url); fn(arg); };
        video.onerror = () => done(reject, new Error("This video format can't be read in the browser"));
        video.onloadedmetadata = () => { video.currentTime = Math.min(at, (video.duration || 2) / 2); };
        video.onseeked = () => {
            const scale = Math.min(1, 1280 / (video.videoWidth || 1280));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round((video.videoWidth || 1280) * scale);
            canvas.height = Math.round((video.videoHeight || 720) * scale);
            canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(b => (b ? done(resolve, new File([b], "video-frame.jpg", { type: "image/jpeg" })) : done(reject, new Error("Could not capture a frame"))), "image/jpeg", 0.85);
        };
    });
}
