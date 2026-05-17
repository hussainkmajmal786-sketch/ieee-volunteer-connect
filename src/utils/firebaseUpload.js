import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/config";

/**
 * Upload an image to Firebase Storage under {folder}/{timestamp}-{filename}
 * and return its public download URL.
 *
 * Replaces the previous Cloudinary uploader. Same signature so callers
 * don't need to change.
 */
export async function uploadImage(file, folder = "events") {
    if (!file) throw new Error("No file provided");

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}-${safeName}`;
    const storageRef = ref(storage, path);

    const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
    });
    return await getDownloadURL(snapshot.ref);
}
