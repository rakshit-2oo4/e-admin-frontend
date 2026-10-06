'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { LayoutGrid, MoreHorizontal, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isSuperAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/orgs', label: 'Organizations' },
    { href: '/users', label: 'Platform users' },
    { href: '/audit', label: 'Audit log' },
    { href: '/system', label: 'System' },
    { href: '/settings', label: 'Settings' },
  ];

  // Helper for user initials
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'AS';
  };

  const displayName = user?.name || 'Avery Stone';
  const displayRole = user?.role ? user.role.replace('_', ' ') : 'SUPER ADMIN';
  const initials = getInitials(user?.name, user?.email);

  return (
    <aside className="w-60 shrink-0 bg-[#080C14] border-r border-[#1A2234] flex flex-col justify-between p-3 select-none min-h-[calc(100vh-3.5rem)]">
      {/* Top Navigation */}
      <div>
        {/* Section Label */}
        <div className="px-3 pt-3 pb-2 text-[10px] font-mono tracking-widest text-[#64748B] uppercase">
          CONTROL PLANE
        </div>

        {/* Menu Items */}
        <nav className="space-y-1 mt-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard' || pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-[#151F31] text-white shadow-sm'
                  : 'text-[#8E9CAE] hover:bg-[#101623] hover:text-white'
                  }`}
              >
                <LayoutGrid
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#728095]'
                    }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status & User Block */}
      <div className="space-y-3 pt-4 border-t border-[#151D2C]">
        {/* Environment Indicator */}
        <div className="bg-[#0D121D] border border-[#172031] rounded-lg px-3 py-2 flex items-center gap-2.5 text-xs font-mono text-[#8E9CAE]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
          <span className="truncate">production / eu-west</span>
        </div>

        {/* Current User Card */}
        <div className="relative" ref={menuRef}>
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#0E1422] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* User Avatar Circle */}
              <div className="w-8 h-8 rounded-full bg-[#854D0E] text-[#FEF3C7] text-xs font-semibold flex items-center justify-center shrink-0 border border-[#A16207]/30">
                {initials}
              </div>

              <div className="min-w-0 flex flex-col">
                <span className="text-xs font-semibold text-white truncate leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-[#64748B] uppercase leading-tight mt-0.5">
                  {displayRole}
                </span>
              </div>
            </div>

            {/* Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-1 rounded text-[#64748B] hover:text-white hover:bg-[#151F31] transition-colors"
              title="User actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Floating Dropdown for User Actions */}
          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0F1626] border border-[#1E293F] rounded-lg shadow-xl p-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-2 border-b border-[#1E293F] mb-1">
                <p className="text-xs font-medium text-white truncate">
                  {user?.email || 'owner@platform.local'}
                </p>
                <p className="text-[10px] font-mono text-[#10B981] flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  {isSuperAdmin ? 'Full Access' : 'Read Only'}
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                  router.replace('/login');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-red-400 hover:bg-[#1A2336] hover:text-red-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
