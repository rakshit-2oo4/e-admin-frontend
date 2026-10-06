'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-4 bg-[#070A12] text-white">
      <div className="w-full max-w-sm space-y-4 rounded-xl bg-[#0D121F] border border-[#1A2234] p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-white">Reset Password</h1>
        {sent ? (
          <p className="text-sm text-slate-300 font-mono">
            If the account exists, a reset link has been dispatched.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Platform email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded bg-[#151D2C] border border-[#232F47] px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
              required
            />
            <button
              disabled={busy}
              type="submit"
              className="w-full rounded bg-[#F59E0B] text-black font-semibold py-2 text-sm hover:bg-[#FBBF24] transition-colors disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <div className="text-center pt-2">
          <Link href="/login" className="text-xs text-slate-400 hover:text-white underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
