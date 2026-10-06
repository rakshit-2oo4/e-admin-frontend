'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Info, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/lib/api';

const MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: 'Incorrect email or password.',
    ACCOUNT_DISABLED: 'This account has been disabled.',
    ACCOUNT_LOCKED: 'Account locked. Try again in 15 minutes.',
    TOO_MANY_ATTEMPTS: 'Too many attempts. Try again later.',
    RATE_LIMITED: 'Too many attempts. Try again later.',
};

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await login(email, password);
            router.replace('/dashboard');
        } catch (err) {
            setError(err instanceof ApiError ? (MESSAGES[err.code] ?? 'Something went wrong. Try again.') : 'Something went wrong. Try again.');
        } finally {
            setBusy(false);
        }
    }

    const inputBase =
        'h-8 w-full rounded-md border bg-[#0B0F16] pl-9 pr-3 text-[13px] text-white outline-none placeholder:text-[#6B7482] focus:border-amber-500/70';

    return (
        <main className="grid min-h-screen bg-[#11151D] text-[#E5E7EB] lg:grid-cols-[45fr_55fr]">
            {/* Left panel */}
            <section className="hidden flex-col justify-between border-r border-[#1A202B] bg-[#10151D] p-14 lg:flex">
                <div className="flex items-center gap-2 text-base font-semibold">
                    EbenchCampus Platform
                    <span className="size-1.5 rounded-full bg-amber-500" />
                </div>

                <div>
                    <h1 className="text-[40px] font-semibold leading-tight tracking-tight">Operate the platform.</h1>
                    <p className="mt-2 text-[14px] text-[#8B95A5]">Internal access only. Activity is logged.</p>
                    <div className="mt-3 flex items-center gap-4 font-mono text-xs uppercase tracking-wider text-[#7C8596]">
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="size-3.5 text-emerald-500" /> STAFF_ONLY
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Activity className="size-3.5 text-amber-500" /> AUDIT_ENABLED
                        </span>
                    </div>
                </div>

                <p className="text-[12px] text-[#5F6878]">© 2026 EbenchCampus. All actions audited.</p>
            </section>

            {/* Right panel */}
            <section className="flex items-center justify-center p-6">
                <form onSubmit={onSubmit} className="w-full max-w-[360px]">
                    <h2 className="text-[20px] font-semibold">Sign in</h2>
                    <p className="mt-1 text-[13px] text-[#8B95A5]">Use your EbenchCampus staff credentials to continue.</p>

                    <div className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-[11px] text-[#8B95A5]">Work email</label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8A93A3]" />
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="username"
                                    placeholder="operator@ebenchcampus.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                    required
                                    className={`${inputBase} border-[#262D3A]`}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-[11px] text-[#8A93A3]">Password</label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8A93A3]" />
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    required
                                    className={`${inputBase} ${error ? 'border-red-500/80' : 'border-[#262D3A]'}`}
                                />
                            </div>
                            {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={busy}
                        className="mt-5 h-9 w-full rounded-md bg-[#F59E0B] text-[12px] font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
                    >
                        {busy ? 'Signing in…' : 'Sign in'}
                    </button>

                    <div className="mt-4 text-center">
                        <Link href="/forgot-password" className="text-[12px] text-amber-500 hover:text-amber-400">Forgot password?</Link>
                    </div>

                    <div className="mt-4 flex gap-2 rounded-md border border-amber-600/60 bg-amber-500/10 px-3 py-2.5">
                        <Info className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                        <p className="text-[12px] leading-snug text-[#8B95A5]">
                            This console is restricted to EbenchCampus staff. All activity is logged and subject to audit.
                        </p>
                    </div>
                </form>
            </section>
        </main>
    );
}