let accessToken: string | null = null;
let inflight: Promise<string | null> | null = null;

export const setAccessToken = (t: string | null) => { accessToken = t; };

export class ApiError extends Error {
    constructor(public status: number, public code: string, message: string) { super(message); }
}

async function doRefresh(): Promise<string | null> {
    const res = await fetch('/api/platform/auth/refresh', { method: 'POST', credentials: 'include' });
    const json = await res.json().catch(() => null);
    accessToken = res.ok && json?.ok ? json.data.accessToken : null;
    return accessToken;
}
async function refreshWithLock(): Promise<string | null> {
    if (typeof navigator !== 'undefined' && navigator.locks) {
        return await navigator.locks.request('platform-refresh', async () => doRefresh());
    }
    return doRefresh();
}

export function refreshAccessToken(): Promise<string | null> {
    if (!inflight) {
        inflight = refreshWithLock().finally(() => {
            inflight = null;
        });
    }
    return inflight;
}
type Opts = { method?: string; body?: unknown; query?: Record<string, string | number | undefined> };

export async function api<T>(path: string, { method = 'GET', body, query }: Opts = {}): Promise<T> {
    const qs = query
        ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString()
        : '';
    const call = () =>
        fetch(`/api/platform${path}${qs}`, {
            method,
            credentials: 'include',
            headers: {
                ...(body ? { 'Content-Type': 'application/json' } : {}),
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });

    let res = await call();
    const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/refresh');
    if (res.status === 401 && !isAuthRoute && (await refreshAccessToken())) res = await call();

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
        throw new ApiError(res.status, json?.error?.code ?? 'UNKNOWN', json?.error?.message ?? res.statusText);
    }
    return json.data as T;
}