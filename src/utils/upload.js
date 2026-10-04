/**
 * Upload an image to the site's file storage (Cloudflare) under {folder}/
 * and return its public URL. Admin-only on the server.
 */
export async function uploadImage(file, folder = "events") {
    if (!file) throw new Error("No file provided");

    const form = new FormData();
    form.append("file", file, file.name || "image");
    form.append("folder", folder);

    const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "same-origin" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error?.message || `Upload failed (${res.status})`);
    return json.url;
}
