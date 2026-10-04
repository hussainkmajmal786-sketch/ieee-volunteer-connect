// Thin JSON client for the Cloudflare Worker API.

export class ApiError extends Error {
    constructor(code, message, status) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

export async function api(path, body) {
    let res;
    try {
        res = await fetch(path, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body ?? {}),
        });
    } catch {
        throw new ApiError('unavailable', 'Network error — check your connection.', 0);
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new ApiError(json.error?.code || 'internal', json.error?.message || `Request failed (${res.status})`, res.status);
    }
    return json;
}

async function parse(res) {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(json.error?.code || 'internal', json.error?.message || `Request failed (${res.status})`, res.status);
    return json;
}

export async function apiGet(path) {
    return parse(await fetch(path, { credentials: 'same-origin' }));
}

export async function apiDelete(path) {
    return parse(await fetch(path, { method: 'DELETE', credentials: 'same-origin' }));
}

/** POST multipart form data (file uploads). */
export async function apiForm(path, formData) {
    return parse(await fetch(path, { method: 'POST', credentials: 'same-origin', body: formData }));
}
