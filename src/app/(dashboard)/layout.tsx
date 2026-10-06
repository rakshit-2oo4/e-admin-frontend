'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center text-slate-500 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          <span>AUTHENTICATING PLATFORM SESSION…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-200 flex flex-col font-sans">
      {/* Top Reusable Navbar */}
      <Navbar />

      {/* Main Body: Reusable Sidebar + Page Content */}
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-[#080C14] overflow-x-hidden p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}