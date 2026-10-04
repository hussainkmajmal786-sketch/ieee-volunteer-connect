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

export async function getFile(env, key) {
    const headers = { 'Cache-Control': 'public, max-age=31536000, immutable' };
    if (env.FILES) {
        const obj = await env.FILES.get(key);
        if (!obj) return null;
        return new Response(obj.body, { headers: { ...headers, 'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream' } });
    }
    if (env.FILES_KV) {
        const { value, metadata } = await env.FILES_KV.getWithMetadata(key, { type: 'stream', cacheTtl: 86400 });
        if (!value) return null;
        return new Response(value, { headers: { ...headers, 'Content-Type': metadata?.contentType || 'application/octet-stream' } });
    }
    return null;
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
