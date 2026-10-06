'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, refreshAccessToken, setAccessToken } from '@/lib/api';
import type { PlatformUser } from '@/lib/types';

interface AuthCtx {
    user: PlatformUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isSuperAdmin: boolean;
}
const Ctx = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<PlatformUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                if (await refreshAccessToken()) setUser(await api<PlatformUser>('/auth/me'));
            } catch { setUser(null); }
            finally { setLoading(false); }
        })();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const d = await api<{ accessToken: string; user: PlatformUser }>('/auth/login', { method: 'POST', body: { email, password } });
        setAccessToken(d.accessToken);
        setUser(d.user);
    }, []);

    const logout = useCallback(async () => {
        await api('/auth/logout', { method: 'POST' }).catch(() => { });
        setAccessToken(null);
        setUser(null);
    }, []);

    return <Ctx.Provider value={{ user, loading, login, logout, isSuperAdmin: user?.role === 'SUPER_ADMIN' }}>{children}</Ctx.Provider>;
}