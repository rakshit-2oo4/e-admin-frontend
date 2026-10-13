let accessToken: string | null = null;
let inflight: Promise<string | null> | null = null;

export const setAccessToken = (t: string | null) => { accessToken = t; };

export class ApiError extends Error {
    constructor(public status: number, public code: string, message: string) { super(message); }
}

const getBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) {
        return `${envUrl.replace(/\/+$/, '')}/api/platform`;
    }
    return '/api/platform';
};

async function doRefresh(): Promise<string | null> {
    const res = await fetch(`${getBaseUrl()}/auth/refresh`, { method: 'POST', credentials: 'include' });
    const json = await res.json().catch(() => null);
    accessToken = res.ok && json?.ok ? json.data.accessToken : null;
    return accessToken;
}

export function refreshAccessToken(): Promise<string | null> {
    if (!inflight) {
        inflight = doRefresh().finally(() => {
            inflight = null;
        });
    }

    return inflight;
}
type Opts = {
    method?: string;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    signal?: AbortSignal;
};

export async function api<T>(path: string, { method = 'GET', body, query, signal }: Opts = {}): Promise<T> {
    const qs = query
        ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString()
        : '';

    const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/refresh');
    if (!accessToken && !isAuthRoute) {
        await refreshAccessToken();
    }

    const call = () =>
        fetch(`${getBaseUrl()}${path}${qs}`, {
            method,
            credentials: 'include',
            signal,
            headers: {
                ...(body ? { 'Content-Type': 'application/json' } : {}),
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });

    let res = await call();
    if (res.status === 401 && !isAuthRoute && (await refreshAccessToken())) {
        res = await call();
    }

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
        throw new ApiError(res.status, json?.error?.code ?? 'UNKNOWN', json?.error?.message ?? res.statusText);
    }
    return json.data as T;
}

export async function downloadFile(
    path: string,
    { query, defaultFilename = 'export.csv' }: { query?: Record<string, string | number | undefined>; defaultFilename?: string } = {}
): Promise<void> {
    const qs = query
        ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString()
        : '';
    const call = () =>
        fetch(`${getBaseUrl()}${path}${qs}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
        });

    if (!accessToken) {
        await refreshAccessToken();
    }
    let res = await call();
    if (res.status === 401 && (await refreshAccessToken())) {
        res = await call();
    }

    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new ApiError(res.status, json?.error?.code ?? 'UNKNOWN', json?.error?.message ?? res.statusText);
    }

    const disposition = res.headers.get('Content-Disposition');
    let filename = defaultFilename;
    if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
            filename = match[1].replace(/['"]/g, '').trim();
        }
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
