'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CornerDownLeft, Eye, LogIn, ScrollText, Search, UserRound } from 'lucide-react';

type Item = {
    id: string;
    group: 'ORGANIZATIONS' | 'PLATFORM USERS' | 'ACTIONS';
    title: string;
    sub: string;
    icon: React.ElementType;
    status?: 'ACTIVE' | 'SUSPENDED';
    href?: string;
};

const ITEMS: Item[] = [
    { id: 'o1', group: 'ORGANIZATIONS', title: 'Acme Corporation', sub: 'acme-corp', icon: Building2, status: 'ACTIVE', href: '/orgs/acme-corp' },
    { id: 'o2', group: 'ORGANIZATIONS', title: 'Northstar Labs', sub: 'northstar-labs', icon: Building2, status: 'ACTIVE', href: '/orgs/northstar-labs' },
    { id: 'o3', group: 'ORGANIZATIONS', title: 'Atlas Education', sub: 'atlas-edu', icon: Building2, status: 'SUSPENDED', href: '/orgs/atlas-edu' },
    { id: 'u1', group: 'PLATFORM USERS', title: 'Maya Chen', sub: 'maya.chen@ebenchcampus.com', icon: UserRound, href: '/users/maya-chen' },
    { id: 'u2', group: 'PLATFORM USERS', title: 'Jon Bell', sub: 'jon.bell@ebenchcampus.com', icon: UserRound, href: '/users/jon-bell' },
    { id: 'a1', group: 'ACTIONS', title: 'Create new organization', sub: 'Provision a customer workspace', icon: LogIn, href: '/orgs' },
    { id: 'a2', group: 'ACTIONS', title: 'View audit log', sub: 'Review operator activity', icon: ScrollText, href: '/audit' },
    { id: 'a3', group: 'ACTIONS', title: 'Start impersonation', sub: 'Enter a customer session', icon: Eye, href: '/impersonate' },
];

const GROUPS: Item['group'][] = ['ORGANIZATIONS', 'PLATFORM USERS', 'ACTIONS'];

interface Props {
    open: boolean;
    onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return ITEMS;
        return ITEMS.filter((i) => `${i.title} ${i.sub}`.toLowerCase().includes(q));
    }, [query]);

    useEffect(() => {
        if (open) {
            setQuery('');
            setActive(0);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    useEffect(() => setActive(0), [query]);

    const select = (item?: Item) => {
        if (!item) return;
        onClose();
        if (item.href) router.push(item.href);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            select(results[active]);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/60 backdrop-blur-[2px]"
            onMouseDown={onClose}
        >
            <div
                className="w-full max-w-[560px] mx-4 rounded-lg border border-[#1F2A3F] bg-[#0B111C] shadow-2xl overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={onKeyDown}
            >
                {/* Input */}
                <div className="flex items-center gap-3 px-4 h-14 border-b border-[#1A2234]">
                    <Search className="w-4 h-4 text-[#8F9CAE] shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search organizations, users, and actions..."
                        className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#64748B]"
                    />
                    <kbd className="px-1.5 py-0.5 rounded border border-[#2A3550] bg-[#151D2C] text-[10px] font-mono text-[#8F9CAE]">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[420px] overflow-y-auto py-2">
                    {results.length === 0 && (
                        <div className="px-4 py-8 text-center text-xs font-mono text-[#64748B]">No results</div>
                    )}
                    {GROUPS.map((g) => {
                        const items = results.filter((i) => i.group === g);
                        if (!items.length) return null;
                        return (
                            <div key={g} className="mb-1">
                                <div className="px-4 pt-3 pb-2 text-[10px] font-mono tracking-widest text-[#64748B]">{g}</div>
                                {items.map((item) => {
                                    const idx = results.indexOf(item);
                                    const isActive = idx === active;
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onMouseMove={() => setActive(idx)}
                                            onClick={() => select(item)}
                                            className={`w-[calc(100%-16px)] mx-2 flex items-center gap-3 px-2.5 py-2 rounded-md text-left transition-colors ${isActive ? 'bg-[#F59E0B]/10' : 'hover:bg-[#111827]'
                                                }`}
                                        >
                                            <span
                                                className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${isActive
                                                    ? 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]'
                                                    : 'border-[#1F2A3F] bg-[#0F1626] text-[#8F9CAE]'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className={`block text-sm truncate ${isActive && item.group === 'ORGANIZATIONS' ? 'text-[#F59E0B]' : 'text-white'}`}>
                                                    {item.title}
                                                </span>
                                                <span className="block text-[11px] font-mono text-[#64748B] truncate">{item.sub}</span>
                                            </span>
                                            {item.status && (
                                                <span
                                                    className={`px-2 py-0.5 rounded-full border text-[10px] font-mono tracking-wider ${item.status === 'ACTIVE'
                                                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                                        : 'border-[#F59E0B]/50 bg-[#F59E0B]/10 text-[#F59E0B]'
                                                        }`}
                                                >
                                                    {item.status}
                                                </span>
                                            )}
                                            {isActive && <CornerDownLeft className="w-3 h-3 text-[#8F9CAE] shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 h-10 border-t border-[#1A2234] text-[10px] font-mono tracking-wider text-[#64748B]">
                    <span>↑↓ to navigate · ⏎ to select · esc to close</span>
                    <span>PLATFORM_ADMIN</span>
                </div>
            </div>
        </div>
    );
}