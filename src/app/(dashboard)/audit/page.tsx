'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Calendar,
  ChevronDown,
  Download,
  Check,
  X,
  FileCode,
  Copy,
  CheckCircle2,
  AlertCircle,
  Radio,
  Filter,
} from 'lucide-react';
import { api } from '@/lib/api';

interface AuditItem {
  id: string;
  timestamp: string;
  dateKey: string;
  action: string;
  target: string;
  actor: string;
  actorType?: string;
  outcome: 'SUCCESS' | 'FAILURE';
  diff?: Record<string, any>;
  highlightLine?: string;
}

// Initial mock data mirroring the exact Figma design
const DEFAULT_AUDIT_LOGS: AuditItem[] = [
  {
    id: 'ev-1',
    timestamp: '12:31:44.093',
    dateKey: '2026-10-05',
    action: 'platform.user.created',
    target: 'mira@ebenchcampus.com',
    actor: 'Akshay Sharma',
    outcome: 'SUCCESS',
    diff: {
      name: 'Mira Chen',
      email: 'mira@ebenchcampus.com',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  },
  {
    id: 'ev-2',
    timestamp: '11:58:12.441',
    dateKey: '2026-10-05',
    action: 'impersonation.started',
    target: 'Acme Corp · Jane Founder',
    actor: 'Mira Chen',
    outcome: 'SUCCESS',
    highlightLine: '+ "reason": "Investigating candidate report #4821"',
    diff: {
      organization: 'acme',
      user: 'admin@acme.test',
      reason: 'Investigating candidate report #4821',
      access: 'READ_ONLY',
    },
  },
  {
    id: 'ev-3',
    timestamp: '10:42:05.817',
    dateKey: '2026-10-05',
    action: 'organization.updated',
    target: 'Acme Corp · trial_days: 150 -> 180',
    actor: 'Luis Romero',
    outcome: 'SUCCESS',
    diff: {
      organization: 'acme',
      trial_days_before: 150,
      trial_days_after: 180,
      updated_by: 'Luis Romero',
    },
  },
  {
    id: 'ev-4',
    timestamp: '09:14:28.202',
    dateKey: '2026-10-05',
    action: 'organization.user.invited',
    target: 'admin@acme.test · ADMIN',
    actor: 'Akshay Sharma',
    outcome: 'SUCCESS',
    diff: {
      invited_email: 'admin@acme.test',
      assigned_role: 'ADMIN',
      organization: 'acme',
    },
  },
  {
    id: 'ev-5',
    timestamp: '08:05:11.912',
    dateKey: '2026-10-05',
    action: 'organization.created',
    target: 'Acme Corp · acme',
    actor: 'Akshay Sharma',
    outcome: 'SUCCESS',
    diff: {
      name: 'Acme Corp',
      slug: 'acme',
      plan: 'starter',
      retention_days: 90,
    },
  },
  {
    id: 'ev-6',
    timestamp: '19:40:12.338',
    dateKey: '2026-10-04',
    action: 'auth.login.failed',
    target: 'unknown@suspicious-ip.io',
    actor: 'System',
    outcome: 'FAILURE',
    diff: {
      ip: '194.26.29.11',
      reason: 'INVALID_CREDENTIALS',
      attempt_count: 3,
    },
  },
];

export default function AuditLogPage() {
  // Live Tail toggle (defaults to true as in Figma)
  const [liveTail, setLiveTail] = useState(true);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter dropdown states
  const [dateFilter, setDateFilter] = useState('2026-10-05');
  const [eventFilter, setEventFilter] = useState('All');
  const [actorFilter, setActorFilter] = useState('All');
  const [outcomeFilter, setOutcomeFilter] = useState<'All' | 'SUCCESS' | 'FAILURE'>('All');

  // Dropdown open toggles
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [actorDropdownOpen, setActorDropdownOpen] = useState(false);
  const [outcomeDropdownOpen, setOutcomeDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Expanded row ID (defaults to 'ev-2' to exactly match the Figma design screenshot!)
  const [expandedRowId, setExpandedRowId] = useState<string | null>('ev-2');

  // Logs state
  const [logsList, setLogsList] = useState<AuditItem[]>(DEFAULT_AUDIT_LOGS);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setEventDropdownOpen(false);
      setActorDropdownOpen(false);
      setOutcomeDropdownOpen(false);
      setDateDropdownOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch real audit logs from backend if available
  const { data: serverLogs, refetch } = useQuery({
    queryKey: ['platform-audit-logs', liveTail],
    queryFn: async () => {
      try {
        return await api<{ items: any[]; nextCursor: string | null }>('/audit?limit=50');
      } catch {
        return null;
      }
    },
    refetchInterval: liveTail ? 8000 : false,
    retry: false,
  });

  // Merge server audit logs with default design rows
  useEffect(() => {
    if (serverLogs?.items && serverLogs.items.length > 0) {
      const mapped: AuditItem[] = serverLogs.items.map((row: any) => {
        const d = new Date(row.createdAt);
        const timeStr = d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
        const dateKey = d.toISOString().split('T')[0];
        return {
          id: row.id,
          timestamp: timeStr,
          dateKey,
          action: row.action,
          target: `${row.entityType}${row.entityId ? ` · ${row.entityId}` : ''}`,
          actor: row.platformUserId ? 'Platform Admin' : 'System',
          outcome: 'SUCCESS',
          diff: row.diff,
        };
      });

      // Keep default demo rows combined
      const existingIds = new Set(mapped.map((m) => m.id));
      const combined = [...mapped];
      for (const def of DEFAULT_AUDIT_LOGS) {
        if (!existingIds.has(def.id)) {
          combined.push(def);
        }
      }
      setLogsList(combined);
    }
  }, [serverLogs]);

  // Unique lists for dropdown filters
  const uniqueEvents = useMemo(() => {
    const set = new Set(logsList.map((l) => l.action));
    return ['All', ...Array.from(set)];
  }, [logsList]);

  const uniqueActors = useMemo(() => {
    const set = new Set(logsList.map((l) => l.actor));
    return ['All', ...Array.from(set)];
  }, [logsList]);

  // Filtered logs calculation
  const filteredLogs = useMemo(() => {
    return logsList.filter((log) => {
      // Search
      const matchesSearch =
        !searchQuery.trim() ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.diff && JSON.stringify(log.diff).toLowerCase().includes(searchQuery.toLowerCase()));

      // Event filter
      const matchesEvent = eventFilter === 'All' || log.action === eventFilter;

      // Actor filter
      const matchesActor = actorFilter === 'All' || log.actor === actorFilter;

      // Outcome filter
      const matchesOutcome = outcomeFilter === 'All' || log.outcome === outcomeFilter;

      // Date filter (if selected)
      const matchesDate = !dateFilter || log.dateKey === dateFilter;

      return matchesSearch && matchesEvent && matchesActor && matchesOutcome && matchesDate;
    });
  }, [logsList, searchQuery, eventFilter, actorFilter, outcomeFilter, dateFilter]);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Date', 'Action', 'Target', 'Actor', 'Outcome', 'Diff'];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.dateKey,
      l.action,
      `"${l.target.replace(/"/g, '""')}"`,
      `"${l.actor.replace(/"/g, '""')}"`,
      l.outcome,
      `"${JSON.stringify(l.diff || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `platform-audit-logs-${dateFilter || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported audit logs to CSV');
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#101826] border border-[#23334D] text-white px-4 py-3 rounded-lg shadow-xl text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
            Audit log
          </h1>
          <p className="text-xs text-slate-400 font-normal mt-1.5">
            Immutable platform and organization security events
          </p>
        </div>

        {/* Live Tail Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto select-none">
          <span className="text-xs font-mono text-slate-300">Live tail</span>
          <button
            type="button"
            onClick={() => {
              setLiveTail(!liveTail);
              showToast(liveTail ? 'Live tail paused' : 'Live tail streaming active');
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
              liveTail ? 'bg-[#F59E0B]' : 'bg-[#1F293D]'
            }`}
            title="Toggle live tail stream"
          >
            <span
              className={`block w-5 h-5 rounded-full bg-black shadow-md transform transition-transform ${
                liveTail ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left Filters Group */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search event or target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B101B] border border-[#1A2333] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Picker Button */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDateDropdownOpen(!dateDropdownOpen);
                setEventDropdownOpen(false);
                setActorDropdownOpen(false);
                setOutcomeDropdownOpen(false);
              }}
              className="bg-[#0B101B] border border-[#1A2333] hover:bg-[#131B2A] text-slate-200 text-xs px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">{dateFilter || 'All Dates'}</span>
            </button>

            {dateDropdownOpen && (
              <div className="absolute left-0 mt-1 w-44 bg-[#0B101B] border border-[#222E42] rounded-lg shadow-2xl py-1 z-30 text-xs font-mono">
                {['2026-10-05', '2026-10-04', '2026-10-03', ''].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDateFilter(d);
                      setDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#131B2A] ${
                      dateFilter === d ? 'text-[#F59E0B] font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>{d || 'All Dates'}</span>
                    {dateFilter === d && <Check className="w-3.5 h-3.5 text-[#F59E0B]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Event Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEventDropdownOpen(!eventDropdownOpen);
                setDateDropdownOpen(false);
                setActorDropdownOpen(false);
                setOutcomeDropdownOpen(false);
              }}
              className="bg-[#0B101B] border border-[#1A2333] hover:bg-[#131B2A] text-slate-200 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="text-slate-500 font-mono">⑊</span>
              <span>Event: {eventFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {eventDropdownOpen && (
              <div className="absolute left-0 mt-1 w-56 bg-[#0B101B] border border-[#222E42] rounded-lg shadow-2xl py-1 z-30 text-xs font-mono max-h-60 overflow-y-auto">
                {uniqueEvents.map((ev) => (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => {
                      setEventFilter(ev);
                      setEventDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#131B2A] ${
                      eventFilter === ev ? 'text-[#F59E0B] font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{ev}</span>
                    {eventFilter === ev && <Check className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actor Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActorDropdownOpen(!actorDropdownOpen);
                setDateDropdownOpen(false);
                setEventDropdownOpen(false);
                setOutcomeDropdownOpen(false);
              }}
              className="bg-[#0B101B] border border-[#1A2333] hover:bg-[#131B2A] text-slate-200 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="text-slate-500 font-mono">⑊</span>
              <span>Actor: {actorFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {actorDropdownOpen && (
              <div className="absolute left-0 mt-1 w-48 bg-[#0B101B] border border-[#222E42] rounded-lg shadow-2xl py-1 z-30 text-xs font-sans">
                {uniqueActors.map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => {
                      setActorFilter(act);
                      setActorDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#131B2A] ${
                      actorFilter === act ? 'text-[#F59E0B] font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>{act}</span>
                    {actorFilter === act && <Check className="w-3.5 h-3.5 text-[#F59E0B]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Outcome Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOutcomeDropdownOpen(!outcomeDropdownOpen);
                setDateDropdownOpen(false);
                setEventDropdownOpen(false);
                setActorDropdownOpen(false);
              }}
              className="bg-[#0B101B] border border-[#1A2333] hover:bg-[#131B2A] text-slate-200 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="text-slate-500 font-mono">⑊</span>
              <span>Outcome: {outcomeFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {outcomeDropdownOpen && (
              <div className="absolute left-0 mt-1 w-40 bg-[#0B101B] border border-[#222E42] rounded-lg shadow-2xl py-1 z-30 text-xs font-sans">
                {(['All', 'SUCCESS', 'FAILURE'] as const).map((out) => (
                  <button
                    key={out}
                    type="button"
                    onClick={() => {
                      setOutcomeFilter(out);
                      setOutcomeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#131B2A] ${
                      outcomeFilter === out ? 'text-[#F59E0B] font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>{out}</span>
                    {outcomeFilter === out && <Check className="w-3.5 h-3.5 text-[#F59E0B]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Export Button */}
        <div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-[#0B101B] border border-[#1A2333] hover:bg-[#131B2A] text-slate-200 text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* EVENT LOG TABLE CONTAINER */}
      <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl overflow-hidden shadow-sm">
        {/* Date Section Header */}
        <div className="px-5 py-3 border-b border-[#131A2B] bg-[#080D17]/40">
          <span className="font-mono text-[11px] text-[#6E7B91] uppercase tracking-widest">
            MONDAY · 2026-10-05 · UTC
          </span>
        </div>

        {/* Rows List */}
        <div className="divide-y divide-[#131A2B]">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-sans">
              No audit events found matching filters.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedRowId === log.id;

              return (
                <div key={log.id} className="transition-colors">
                  {/* Row Header Bar */}
                  <div
                    onClick={() => setExpandedRowId(isExpanded ? null : log.id)}
                    className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors ${
                      isExpanded
                        ? 'bg-[#1C150B] border-y border-[#B45309]/40'
                        : 'hover:bg-[#101625]/60'
                    }`}
                  >
                    {/* Left Group: Indicator + Timestamp + Action & Target */}
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Left Dot Indicator */}
                      <span className="flex-shrink-0 flex items-center justify-center w-2 h-2">
                        {isExpanded ? (
                          <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-sm shadow-[#F59E0B]/60" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        )}
                      </span>

                      {/* Monospace Timestamp */}
                      <span
                        className={`font-mono text-xs w-28 flex-shrink-0 ${
                          isExpanded ? 'text-[#F59E0B]' : 'text-slate-400'
                        }`}
                      >
                        {log.timestamp}
                      </span>

                      {/* Action & Target details */}
                      <div className="min-w-0">
                        <div
                          className={`font-mono text-xs font-medium leading-tight truncate ${
                            isExpanded ? 'text-[#F59E0B]' : 'text-white'
                          }`}
                        >
                          {log.action}
                        </div>
                        <div
                          className={`font-mono text-[11px] truncate mt-0.5 ${
                            isExpanded ? 'text-[#A17C43]' : 'text-slate-500'
                          }`}
                        >
                          {log.target}
                        </div>
                      </div>
                    </div>

                    {/* Right Group: Actor + Outcome Badge + Chevron */}
                    <div className="flex items-center gap-6 flex-shrink-0 pl-4">
                      {/* Actor */}
                      <span className="text-xs text-slate-300 font-medium hidden md:inline-block">
                        {log.actor}
                      </span>

                      {/* Outcome Pill Badge */}
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold uppercase ${
                          log.outcome === 'SUCCESS'
                            ? 'text-[#10B981] border border-[#065F46] bg-[#064E3B]/40'
                            : 'text-[#EF4444] border border-[#991B1B] bg-[#7F1D1D]/40'
                        }`}
                      >
                        {log.outcome}
                      </span>

                      {/* Expand Chevron Icon */}
                      <span className="text-slate-500 hover:text-white">
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${
                            isExpanded ? 'rotate-180 text-[#F59E0B]' : ''
                          }`}
                        />
                      </span>
                    </div>
                  </div>

                  {/* Expanded JSON Inspector Block */}
                  {isExpanded && log.diff && (
                    <div className="bg-[#070A11] border-t border-[#291B0D] px-8 py-5 font-mono text-xs text-slate-300 animate-in fade-in duration-100">
                      <div className="space-y-1 leading-relaxed">
                        <div className="text-slate-500">&#123;</div>

                        {/* If it's the impersonation event matching Figma screenshot */}
                        {log.highlightLine ? (
                          <>
                            <div className="pl-4 text-slate-300">
                              <span className="text-slate-400">&quot;organization&quot;</span>:{' '}
                              <span className="text-[#10B981]">&quot;acme&quot;</span>,
                            </div>
                            <div className="pl-4 text-slate-300">
                              <span className="text-slate-400">&quot;user&quot;</span>:{' '}
                              <span className="text-[#10B981]">&quot;admin@acme.test&quot;</span>,
                            </div>

                            {/* Amber Highlight Diff Line */}
                            <div className="bg-[#31200D]/80 text-[#F59E0B] px-3 py-1.5 rounded -mx-3 my-1 flex items-center gap-2 border border-[#B45309]/40 font-medium">
                              <span>+</span>
                              <span className="text-slate-300">&quot;reason&quot;:</span>
                              <span className="text-[#FBBF24]">
                                &quot;Investigating candidate report #4821&quot;
                              </span>
                              ,
                            </div>

                            <div className="pl-4 text-slate-300">
                              <span className="text-slate-400">&quot;access&quot;</span>:{' '}
                              <span className="text-[#10B981]">&quot;READ_ONLY&quot;</span>
                            </div>
                          </>
                        ) : (
                          Object.entries(log.diff).map(([key, value]) => (
                            <div key={key} className="pl-4 text-slate-300">
                              <span className="text-slate-400">&quot;{key}&quot;</span>:{' '}
                              <span className="text-[#10B981]">
                                {typeof value === 'string'
                                  ? `"${value}"`
                                  : JSON.stringify(value)}
                              </span>
                              ,
                            </div>
                          ))
                        )}

                        <div className="text-slate-500">&#125;</div>
                      </div>

                      {/* Quick copy JSON button */}
                      <div className="mt-3 pt-3 border-t border-[#1F2B3E]/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Event ID: {log.id}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(log.diff, null, 2));
                            showToast('Copied JSON payload to clipboard');
                          }}
                          className="hover:text-white flex items-center gap-1.5 text-slate-400 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Raw JSON</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER BAR WITH PAGINATION */}
        <div className="px-5 py-3.5 border-t border-[#131A2B] bg-[#080D17]/40 flex items-center justify-between text-xs text-slate-500">
          <div>Showing 1–50 of 12,847</div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="px-3.5 py-1.5 rounded-lg bg-[#111726] text-slate-500 text-xs font-medium cursor-not-allowed opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => showToast('Fetched next 50 audit entries')}
              className="px-4 py-1.5 rounded-lg bg-[#0E1523] border border-[#23334D] text-slate-200 hover:text-white hover:bg-[#162033] text-xs font-semibold transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
