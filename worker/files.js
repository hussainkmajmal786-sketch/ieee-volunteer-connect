// Image storage: R2 when the FILES bucket is bound, otherwise Workers KV
// (FILES_KV), which needs no payment method on the free plan.

export async function putFile(env, key, body, contentType) {
    if (env.FILES) {
        await env.FILES.put(key, body, { httpMetadata: { contentType } });
    } else if (env.FILES_KV) {
        await env.FILES_KV.put(key, body, { metadata: { contentType } });
    } else {
        throw new Error('No file storage bound (FILES or FILES_KV)');
    }
}

/** Parse a single "bytes=a-b" range against `size`; null if absent/invalid. */
export function parseRange(header, size) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(header || '');
    if (!m || (m[1] === '' && m[2] === '')) return null;
    let start = m[1] === '' ? size - Number(m[2]) : Number(m[1]);
    let end = m[1] === '' || m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
    if (start < 0) start = 0;
    if (start > end || start >= size) return { invalid: true };
    return { start, end };
}

// Range support matters for video: iOS Safari won't play without it.
export async function getFile(env, key, rangeHeader = null) {
    const headers = { 'Cache-Control': 'public, max-age=31536000, immutable', 'Accept-Ranges': 'bytes' };
    let body, type;
    if (env.FILES) {
        const obj = await env.FILES.get(key);
        if (!obj) return null;
        type = obj.httpMetadata?.contentType;
        if (!rangeHeader) return new Response(obj.body, { headers: { ...headers, 'Content-Type': type || 'application/octet-stream' } });
        body = await obj.arrayBuffer();
    } else if (env.FILES_KV) {
        if (!rangeHeader) {
            const { value, metadata } = await env.FILES_KV.getWithMetadata(key, { type: 'stream', cacheTtl: 86400 });
            if (!value) return null;
            return new Response(value, { headers: { ...headers, 'Content-Type': metadata?.contentType || 'application/octet-stream' } });
        }
        const { value, metadata } = await env.FILES_KV.getWithMetadata(key, { type: 'arrayBuffer', cacheTtl: 86400 });
        if (!value) return null;
        body = value;
        type = metadata?.contentType;
    } else {
        return null;
    }
    const size = body.byteLength;
    const range = parseRange(rangeHeader, size);
    const contentType = type || 'application/octet-stream';
    if (!range) return new Response(body, { headers: { ...headers, 'Content-Type': contentType } });
    if (range.invalid) return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${size}` } });
    return new Response(body.slice(range.start, range.end + 1), {
        status: 206,
        headers: { ...headers, 'Content-Type': contentType, 'Content-Range': `bytes ${range.start}-${range.end}/${size}`, 'Content-Length': String(range.end - range.start + 1) },
    });
}

/** Raw stored object ({ body }) for responses that set their own headers. */
export async function getFileObject(env, key) {
    if (env.FILES) {
        const obj = await env.FILES.get(key);
        return obj ? { body: obj.body } : null;
    }
    if (env.FILES_KV) {
        const body = await env.FILES_KV.get(key, { type: 'stream' });
        return body ? { body } : null;
    }
    return null;
}

export async function deleteFile(env, key) {
    if (env.FILES) await env.FILES.delete(key);
    else if (env.FILES_KV) await env.FILES_KV.delete(key);
}
