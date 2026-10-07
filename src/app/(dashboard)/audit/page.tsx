'use client';
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Calendar,
  ChevronDown,
  Download,
  Check,
  X,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { api } from '@/lib/api';

export interface AuditItem {
  id: string;
  timestamp: string;
  dateKey: string;
  action: string;
  target: string;
  actor: string;
  actorEmail?: string;
  outcome: 'SUCCESS' | 'FAILURE';
  diff?: Record<string, any> | null;
  ip?: string | null;
  userAgent?: string | null;
  entityType?: string;
  entityId?: string | null;
  createdAtRaw?: string;
}

export default function AuditLogPage() {
  // Live Tail toggle (defaults to true as in design)
  const [liveTail, setLiveTail] = useState(true);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter dropdown states
  const [dateFilter, setDateFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('All');
  const [actorFilter, setActorFilter] = useState('All');
  const [outcomeFilter, setOutcomeFilter] = useState<'All' | 'SUCCESS' | 'FAILURE'>('All');

  // Dropdown open toggles
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [actorDropdownOpen, setActorDropdownOpen] = useState(false);
  const [outcomeDropdownOpen, setOutcomeDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Expanded row ID
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (msg: string, isError = false) => {
    setToastMessage({ text: msg, isError });
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

  // Fetch real audit logs strictly from backend PostgreSQL database
  const {
    data: serverLogs,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['platform-audit-logs', liveTail],
    queryFn: async () => {
      return await api<{ items: any[]; nextCursor: string | null; limit: number }>('/audit', {
        query: { limit: 100 },
      });
    },
    refetchInterval: liveTail ? 5000 : false,
    staleTime: liveTail ? 3000 : 15000,
  });

  // Map server records strictly to AuditItem objects (zero fake data)
  const logsList = useMemo<AuditItem[]>(() => {
    if (!serverLogs?.items) return [];
    return serverLogs.items.map((row: any) => {
      const d = new Date(row.createdAt);
      const timeStr = !isNaN(d.getTime())
        ? d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0')
        : '00:00:00.000';
      const dateKey = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : 'N/A';

      // Compute descriptive target from diff or entity attributes
      let targetDesc = `${row.entityType || 'Entity'}`;
      if (row.diff?.after?.name) {
        targetDesc = `${row.diff.after.name}${row.diff.after.slug ? ` · ${row.diff.after.slug}` : ''}`;
      } else if (row.diff?.after?.email) {
        targetDesc = `${row.diff.after.email}`;
      } else if (row.diff?.name) {
        targetDesc = `${row.diff.name}`;
      } else if (row.diff?.email) {
        targetDesc = `${row.diff.email}`;
      } else if (row.entityId) {
        targetDesc = `${row.entityType} · ${row.entityId.slice(0, 8)}…`;
      }

      const isFail =
        row.action.toLowerCase().includes('fail') ||
        row.action.toLowerCase().includes('bad') ||
        row.action.toLowerCase().includes('denied');

      const payload = row.diff
        ? row.diff
        : {
            entityType: row.entityType,
            entityId: row.entityId,
            ip: row.ip,
            userAgent: row.userAgent,
          };

      return {
        id: row.id,
        timestamp: timeStr,
        dateKey,
        action: row.action,
        target: targetDesc,
        actor: row.actor?.name || row.actor?.email || (row.platformUserId ? 'Platform Admin' : 'System'),
        actorEmail: row.actor?.email,
        outcome: (isFail ? 'FAILURE' : 'SUCCESS') as 'SUCCESS' | 'FAILURE',
        diff: payload,
        ip: row.ip,
        userAgent: row.userAgent,
        entityType: row.entityType,
        entityId: row.entityId,
        createdAtRaw: row.createdAt,
      };
    });
  }, [serverLogs]);

  // Set the first row expanded by default once data is loaded if none is expanded
  useEffect(() => {
    if (!expandedRowId && logsList.length > 0) {
      setExpandedRowId(logsList[0].id);
    }
  }, [logsList, expandedRowId]);

  // Dynamic filter options derived from real database rows
  const uniqueDates = useMemo(() => {
    const set = new Set(logsList.map((l) => l.dateKey).filter(Boolean));
    return ['', ...Array.from(set)];
  }, [logsList]);

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
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        (log.diff && JSON.stringify(log.diff).toLowerCase().includes(q));

      // Filters
      const matchesEvent = eventFilter === 'All' || log.action === eventFilter;
      const matchesActor = actorFilter === 'All' || log.actor === actorFilter;
      const matchesOutcome = outcomeFilter === 'All' || log.outcome === outcomeFilter;
      const matchesDate = !dateFilter || log.dateKey === dateFilter;

      return matchesSearch && matchesEvent && matchesActor && matchesOutcome && matchesDate;
    });
  }, [logsList, searchQuery, eventFilter, actorFilter, outcomeFilter, dateFilter]);

  // Computed section date header
  const sectionDateLabel = useMemo(() => {
    if (filteredLogs.length === 0) return 'RECENT EVENTS · UTC';
    const first = filteredLogs[0];
    const d = new Date(first.createdAtRaw || Date.now());
    const dayName = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      : 'AUDIT LOG';
    return `${dayName} · ${first.dateKey} · UTC`;
  }, [filteredLogs]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('No logs to export', true);
      return;
    }
    const headers = ['ID', 'Timestamp', 'Date', 'Action', 'Target', 'Actor', 'Outcome', 'IP', 'Diff'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.dateKey,
      l.action,
      `"${l.target.replace(/"/g, '""')}"`,
      `"${l.actor.replace(/"/g, '""')}"`,
      l.outcome,
      l.ip || '',
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
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-200 border ${
            toastMessage.isError
              ? 'bg-[#1C1215] border-[#EF4444]/60 text-[#EF4444]'
              : 'bg-[#101826] border-[#10B981]/50 text-white'
          }`}
        >
          {toastMessage.isError ? (
            <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
            Audit log
          </h1>
          <p className="text-xs text-slate-400 font-normal mt-1.5 flex items-center gap-2">
            <span>
              {isLoading
                ? 'Loading audit records...'
                : `Immutable platform and organization security events (${logsList.length} loaded)`}
            </span>
            {isFetching && !isLoading && (
              <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />
            )}
          </p>
        </div>

        {/* Live Tail Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto select-none">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
            {liveTail && <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />}
            <span>Live tail</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextState = !liveTail;
              setLiveTail(nextState);
              showToast(nextState ? 'Live tail streaming active' : 'Live tail paused');
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
              placeholder="Search event, target, or actor..."
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
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute left-0 mt-1 w-44 bg-[#0B101B] border border-[#222E42] rounded-lg shadow-2xl py-1 z-30 text-xs font-mono">
                {uniqueDates.map((d) => (
                  <button
                    key={d || 'all'}
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
              <div className="absolute left-0 mt-1 w-64 bg-[#0B101B] border border-[#222E42] rounded-lg shadow-2xl py-1 z-30 text-xs font-mono max-h-60 overflow-y-auto">
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

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-[#0B101B] border border-[#1A2333] hover:bg-[#131B2A] text-slate-400 hover:text-white p-2 rounded-lg transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
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

      {/* ERROR BANNER */}
      {isError && (
        <div className="p-4 bg-[#1C1215] border border-[#EF4444]/40 rounded-xl flex items-center justify-between text-xs text-[#EF4444]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Failed to load audit logs from database:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 rounded font-medium text-white transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* EVENT LOG TABLE CONTAINER */}
      <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl overflow-hidden shadow-sm">
        {/* Date Section Header */}
        <div className="px-5 py-3 border-b border-[#131A2B] bg-[#080D17]/40 flex items-center justify-between">
          <span className="font-mono text-[11px] text-[#6E7B91] uppercase tracking-widest">
            {sectionDateLabel}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {filteredLogs.length} events
          </span>
        </div>

        {/* Rows List */}
        <div className="divide-y divide-[#131A2B]">
          {isLoading ? (
            // Skeleton loader
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={`skel-${idx}`} className="px-5 py-4 animate-pulse flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#1A2333]" />
                  <div className="h-4 bg-[#141C2B] rounded w-24" />
                  <div className="space-y-1.5">
                    <div className="h-4 bg-[#141C2B] rounded w-48" />
                    <div className="h-3 bg-[#101724] rounded w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="h-4 bg-[#141C2B] rounded w-28 hidden md:block" />
                  <div className="h-5 bg-[#141C2B] rounded w-16" />
                </div>
              </div>
            ))
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-sans">
              {searchQuery || eventFilter !== 'All' || actorFilter !== 'All' || outcomeFilter !== 'All' || dateFilter
                ? 'No audit events found matching filters.'
                : 'No audit events recorded in database yet.'}
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
                        {Object.entries(log.diff).map(([key, value]) => (
                          <div key={key} className="pl-4 text-slate-300">
                            <span className="text-slate-400">&quot;{key}&quot;</span>:{' '}
                            <span className="text-[#10B981]">
                              {typeof value === 'string'
                                ? `"${value}"`
                                : typeof value === 'object' && value !== null
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                            ,
                          </div>
                        ))}
                        <div className="text-slate-500">&#125;</div>
                      </div>

                      {/* Event metadata footer */}
                      <div className="mt-4 pt-3 border-t border-[#1F2B3E]/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
                        <div className="flex items-center gap-4">
                          <span>Event ID: {log.id}</span>
                          {log.ip && <span>IP: {log.ip}</span>}
                          {log.userAgent && <span className="truncate max-w-xs">Client: {log.userAgent}</span>}
                        </div>
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

        {/* FOOTER BAR */}
        <div className="px-5 py-3.5 border-t border-[#131A2B] bg-[#080D17]/40 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {filteredLogs.length} of {logsList.length} events
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3.5 py-1.5 rounded-lg bg-[#0E1523] border border-[#23334D] text-slate-200 hover:text-white hover:bg-[#162033] text-xs font-medium transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
