// Drop-in for firebase/functions' httpsCallable, backed by /api/fn/*.
import { api } from './api';

export const functions = Object.freeze({ type: 'functions' });

export function httpsCallable(_functions, name) {
    return async (data) => {
        const res = await api(`/api/fn/${encodeURIComponent(name)}`, { data });
        return { data: res.data };
    };
}
