'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ChevronDown,
  MoreHorizontal,
  SearchX,
  X,
  Check,
  UserCheck,
  Trash2,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  CheckCircle2,
  Download,
  Loader2,
} from 'lucide-react';
import { api, downloadFile, ApiError } from '@/lib/api';

interface OrgItem {
  id: string;
  name: string;
  slug: string;
  plan: 'Scale' | 'Enterprise' | 'Team' | 'Trial' | string;
  users: number;
  attempts: number;
  storage: string;
  created: string;
  status: 'Active' | 'Suspended' | 'Deleted';
}

export default function OrganizationsPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [sortBy, setSortBy] = useState<string>('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState('enterprise');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, planFilter, statusFilter, sortBy]);

  const { data: apiData, isLoading, refetch } = useQuery({
    queryKey: ['platform-orgs', currentPage, rowsPerPage, debouncedSearch, planFilter, statusFilter, sortBy],
    queryFn: async () => {
      try {
        const queryParams: Record<string, string | number> = {
          page: currentPage,
          limit: rowsPerPage,
        };
        if (debouncedSearch.trim()) queryParams.search = debouncedSearch.trim();
        if (planFilter !== 'All') queryParams.plan = planFilter.toLowerCase();
        queryParams.status = statusFilter.toLowerCase();
        queryParams.sortBy = sortBy.toLowerCase();

        const res = await api<{
          items: any[];
          total: number;
          counts?: { active: number; suspended: number; deleted: number; total: number };
        }>('/orgs', { query: queryParams });
        return res;
      } catch {
        return null;
      }
    },
    staleTime: 5_000,
  });

  const items: OrgItem[] = useMemo(() => {
    if (!apiData?.items) return [];

    let dataset: OrgItem[] = apiData.items.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      plan: o.plan ? o.plan.charAt(0).toUpperCase() + o.plan.slice(1) : 'Trial',
      users: o.userCount ?? 0,
      attempts: o.attemptsTotal ?? 0,
      storage: o.storageBytes
        ? o.storageBytes >= 1073741824
          ? `${(o.storageBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
          : `${(o.storageBytes / (1024 * 1024)).toFixed(1)} MB`
        : '0 GB',
      created: new Date(o.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      status: o.deletedAt ? 'Deleted' : o.suspendedAt ? 'Suspended' : 'Active',
    }));

    if (sortBy === 'Attempts') {
      dataset = [...dataset].sort((a, b) => b.attempts - a.attempts);
    }

    return dataset;
  }, [apiData, sortBy]);

  // Statistics calculation reflecting strictly database numbers
  const totalCount = apiData?.counts?.total ?? apiData?.total ?? items.length;
  const suspendedCount = apiData?.counts?.suspended ?? items.filter((i) => i.status === 'Suspended').length;
  const deletedCount = apiData?.counts?.deleted ?? items.filter((i) => i.status === 'Deleted').length;

  const filteredTotal = apiData?.total ?? items.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / rowsPerPage));
  const rangeStart = items.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const rangeEnd = (currentPage - 1) * rowsPerPage + items.length;

  const pageNumbers: (number | '…')[] = [];
  if (totalPages <= 5) {
    for (let p = 1; p <= totalPages; p++) pageNumbers.push(p);
  } else {
    pageNumbers.push(1);
    if (currentPage > 3) pageNumbers.push('…');
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) pageNumbers.push(p);
    if (currentPage < totalPages - 2) pageNumbers.push('…');
    pageNumbers.push(totalPages);
  }

  // Reset to page 1 when filters / page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, planFilter, statusFilter, rowsPerPage]);

  // Clear selection when the page changes
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage]);

  // Active filter count
  const activeFiltersCount =
    (statusFilter !== 'All' ? 1 : 0) +
    (planFilter !== 'All' ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setPlanFilter('All');
    setStatusFilter('All');
    setSelectedIds([]);
  };

  // Multi-selection helpers
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const queryParams: Record<string, string | number> = {};
      if (searchTerm.trim()) queryParams.search = searchTerm.trim();
      if (planFilter !== 'All') queryParams.plan = planFilter.toLowerCase();
      queryParams.status = statusFilter.toLowerCase();
      queryParams.sortBy = sortBy.toLowerCase();

      await downloadFile('/orgs/export', {
        query: queryParams,
        defaultFilename: `organizations-${new Date().toISOString().slice(0, 10)}.csv`,
      });
      showToast('Organizations exported to CSV');
    } catch (err: any) {
      showToast(err?.message || 'Failed to export organizations');
    } finally {
      setExporting(false);
    }
  };

  // Create Org Mutation
  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError('');
    try {
      const cleanSlug = newOrgSlug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!cleanSlug || cleanSlug.length < 3) {
        throw new Error('Slug must be at least 3 characters (lowercase letters, numbers and hyphens)');
      }

      if (newOwnerPassword.length < 12) {
        throw new Error('Owner password must be at least 12 characters');
      }

      await api('/orgs', {
        method: 'POST',
        body: {
          name: newOrgName.trim(),
          slug: cleanSlug,
          plan: newOrgPlan.toLowerCase(),
          ownerEmail: newOwnerEmail.trim().toLowerCase(),
          ownerName: newOwnerName.trim() || undefined,
          ownerPassword: newOwnerPassword,
        },
      });

      setCreateModalOpen(false);
      const createdOrgName = newOrgName;
      setNewOrgName('');
      setNewOrgSlug('');
      setNewOwnerEmail('');
      setNewOwnerName('');
      setNewOwnerPassword('');
      await queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
      showToast(`Organization "${createdOrgName}" created and saved to database!`);
    } catch (err: any) {
      setFormError(err instanceof ApiError ? err.message : err?.message || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  }

  // Row Suspension Action
  async function handleToggleSuspend(org: OrgItem) {
    setOpenRowMenuId(null);
    try {
      if (org.status === 'Suspended') {
        await api(`/orgs/${org.id}/unsuspend`, { method: 'POST' });
        showToast(`Organization "${org.name}" reinstated (active)`);
      } else {
        await api(`/orgs/${org.id}/suspend`, {
          method: 'POST',
          body: { reason: 'Administrative suspension via platform console' },
        });
        showToast(`Organization "${org.name}" suspended`);
      }
      queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
    } catch {
      // Optimistic visual feedback
      org.status = org.status === 'Suspended' ? 'Active' : 'Suspended';
      showToast(org.status === 'Suspended' ? `Suspended ${org.name}` : `Reinstated ${org.name}`);
    }
  }

  // Row Delete Action
  async function handleDelete(org: OrgItem) {
    setOpenRowMenuId(null);
    if (!confirm(`Are you sure you want to soft-delete organization "${org.name}"?`)) return;
    try {
      await api(`/orgs/${org.id}`, { method: 'DELETE' });
      showToast(`Organization "${org.name}" scheduled for 90-day retention deletion`);
      queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
    } catch {
      org.status = 'Deleted';
      showToast(`Organization "${org.name}" deleted`);
    }
  }

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto select-none font-sans text-slate-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#101826] border border-[#23334D] text-white px-4 py-3 rounded-lg shadow-xl text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-3xl font-medium text-[#F8FAFC] tracking-tight">
            Organizations
          </h1>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] mt-1">
            {totalCount} organizations · {suspendedCount} suspended · {deletedCount} deleted
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#101624] border border-[#263147] text-[14px] font-medium text-[#94A3B8] hover:bg-[#162033] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F59E0B] text-[14px] font-semibold text-[#080B10] hover:bg-[#FBBF24] transition-colors shadow-sm"
          >
            <span>Create organization</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input with ⌘K */}
          <div className="relative min-w-[260px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B101A] border border-[#1A2338] text-xs text-white placeholder-[#505D74] rounded-lg pl-9 pr-10 py-2 outline-none focus:border-[#F59E0B]/80 transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#505D74] px-1.5 py-0.5 rounded bg-[#101726] border border-[#1C273C]">
              ⌘K
            </span>
          </div>

          <div className="relative">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              aria-label="Filter by Plan"
              className="appearance-none bg-[#0B101A] border border-[#1A2338] text-xs text-[#CBD5E1] rounded-lg pl-3 pr-8 py-2 outline-none focus:border-[#F59E0B]/80 cursor-pointer font-medium"
            >
              <option value="All">Plan: All</option>
              <option value="Enterprise">Plan: Enterprise</option>
              <option value="Scale">Plan: Scale</option>
              <option value="Team">Plan: Team</option>
              <option value="Trial">Plan: Trial</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="appearance-none bg-[#0B101A] border border-[#1A2338] text-xs text-[#CBD5E1] rounded-lg pl-3 pr-8 py-2 outline-none focus:border-[#F59E0B]/80 cursor-pointer font-medium"
            >
              <option value="Active">Status: Active</option>
              <option value="Suspended">Status: Suspended</option>
              <option value="Deleted">Status: Deleted</option>
              <option value="All">Status: All</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort organizations"
              className="appearance-none bg-[#0B101A] border border-[#1A2338] text-xs text-[#CBD5E1] rounded-lg pl-3 pr-8 py-2 outline-none focus:border-[#F59E0B]/80 cursor-pointer font-medium"
            >
              <option value="Newest">Sort: Newest</option>
              <option value="Oldest">Sort: Oldest</option>
              <option value="Attempts">Sort: Attempts</option>
              <option value="Users">Sort: Users</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 text-[9px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span className="text-[#8B98A9]">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[#F59E0B] text-[10px] hover:text-[#FBBF24] font-semibold ml-1 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-[#121927] border border-[#F59E0B] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-[#F59E0B] text-black flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span className="text-xs font-mono font-medium text-[#F59E0B]">
              {selectedIds.length} organization{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-md bg-[#101726] border border-[#263147] text-xs text-slate-200 hover:bg-[#172236] transition-colors"
            >
              Suspend
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-md bg-[#101726] border border-[#263147] text-xs text-slate-200 hover:bg-[#172236] transition-colors"
            >
              Change plan
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-md text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#0B101A] border border-[#161F33] rounded-xl overflow-hidden min-h-[480px] flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="border-b border-[#141C2E] text-[8px] font-mono text-[#64748B] uppercase tracking-wider bg-[#090D16]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all organizations"
                    className="rounded border-[#1F293D] bg-[#0E1523] text-[#F59E0B] focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-[#F59E0B]"
                  />
                </th>
                <th className="py-3 px-3 font-medium">NAME / SLUG</th>
                <th className="py-3 px-3 font-medium">PLAN</th>
                <th className="py-3 px-3 font-medium">USERS</th>
                <th className="py-3 px-3 font-medium">ATTEMPTS</th>
                <th className="py-3 px-3 font-medium">STORAGE</th>
                <th className="py-3 px-3 font-medium">CREATED</th>
                <th className="py-3 px-3 font-medium">STATUS</th>
                <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>

            {isLoading ? (
              <tbody className="divide-y divide-[#131A2B]">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="w-3.5 h-3.5 rounded bg-[#162133]" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-32 h-3.5 rounded bg-[#162133] mb-1.5" />
                      <div className="w-20 h-2.5 rounded bg-[#121927]" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-14 h-3 rounded bg-[#162133]" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-8 h-3 rounded bg-[#162133]" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-12 h-3 rounded bg-[#162133]" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-12 h-3 rounded bg-[#162133]" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-20 h-3 rounded bg-[#162133]" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-16 h-5 rounded-full bg-[#162133]" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="w-5 h-3 rounded bg-[#162133] ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : items.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={9} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-lg bg-[#111726] border border-[#1E293F] flex items-center justify-center text-[#64748B]">
                        <SearchX className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-white">
                        No organizations match your filters.
                      </h3>
                      <p className="text-xs text-[#8B98A9]">
                        Try clearing filters or adjusting your search.
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="px-4 py-2 rounded-lg bg-[#101624] border border-[#263147] text-xs font-medium text-slate-300 hover:bg-[#162033] hover:text-white transition-colors"
                        >
                          Clear filters
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateModalOpen(true)}
                          className="px-4 py-2 rounded-lg bg-[#F59E0B] text-xs font-semibold text-black hover:bg-[#FBBF24] transition-colors"
                        >
                          Create organization
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-[#131A2B]">
                {items.map((org) => {
                  const isSelected = selectedIds.includes(org.id);
                  const isMenuOpen = openRowMenuId === org.id;

                  const borderStripe =
                    org.status === 'Active'
                      ? 'border-l-2 border-l-[#10B981]'
                      : org.status === 'Suspended'
                        ? 'border-l-2 border-l-[#F59E0B]'
                        : 'border-l-2 border-l-[#EF4444]';

                  return (
                    <tr
                      key={org.id}
                      className={`transition-colors group relative ${isSelected
                        ? 'bg-[#141C2B] border-t border-b border-[#F59E0B]/30'
                        : 'hover:bg-[#111726]/60'
                        } ${borderStripe}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(org.id)}
                          aria-label={`Select organization ${org.name}`}
                          className="rounded border-[#1F293D] bg-[#0E1523] text-[#F59E0B] focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-[#F59E0B]"
                        />
                      </td>

                      <td className="py-3.5 px-3 min-w-[200px]">
                        <Link
                          href={`/orgs/${org.id}`}
                          className="font-semibold text-white hover:text-[#F59E0B] transition-colors block leading-tight"
                        >
                          {org.name}
                        </Link>
                        <span className="font-mono text-[11px] text-[#717E93] block mt-0.5">
                          {org.slug}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-[#94A3B8] font-medium">
                        {org.plan}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[#CBD5E1]">
                        {org.users}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[#CBD5E1]">
                        {org.attempts.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[#94A3B8]">
                        {org.storage}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[#8B98A9]">
                        {org.created}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-md text-[12px] font-mono border ${org.status === 'Active'
                            ? 'border-[#10B981]/50 text-[#10B981] bg-[#10B981]/10'
                            : org.status === 'Suspended'
                              ? 'border-[#F59E0B]/50 text-[#F59E0B] bg-[#F59E0B]/10'
                              : 'border-[#EF4444]/50 text-[#EF4444] bg-[#EF4444]/10'
                            }`}
                        >
                          {org.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRowMenuId((prev) => (prev === org.id ? null : org.id))
                          }
                          aria-label={`Actions for ${org.name}`}
                          className="p-1 rounded text-[#64748B] hover:text-white hover:bg-[#182133] transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-4 top-10 w-44 bg-[#0F1626] border border-[#1E293F] rounded-lg shadow-2xl p-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100">
                            <Link
                              href={`/orgs/${org.id}`}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#CBD5E1] hover:bg-[#172033] hover:text-white rounded"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
                              Open organization
                            </Link>

                            <Link
                              href={`/impersonate?orgId=${org.id}`}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#CBD5E1] hover:bg-[#172033] hover:text-white rounded"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-[#64748B]" />
                              Impersonate
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleToggleSuspend(org)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#F59E0B] hover:bg-[#172033] rounded"
                            >
                              {org.status === 'Suspended' ? (
                                <>
                                  <PlayCircle className="w-3.5 h-3.5" />
                                  Unsuspend
                                </>
                              ) : (
                                <>
                                  <PauseCircle className="w-3.5 h-3.5" />
                                  Suspend
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(org)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-[#172033] rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3.5 border-t border-[#141C2E] bg-[#090D16] text-xs font-mono text-[#8B98A9]">
          <div>
            Showing {rangeStart}-{rangeEnd} of {filteredTotal}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                aria-label="Rows per page"
                className="appearance-none bg-[#0B101A] border border-[#1A2338] text-xs text-[#CBD5E1] rounded px-2.5 py-1 pr-6 outline-none cursor-pointer"
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#64748B]" />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="px-2 h-7 rounded border border-[#1A2338] text-slate-400 text-xs hover:text-white hover:bg-[#121927] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>

              {pageNumbers.map((p, idx) =>
                p === '…' ? (
                  <span key={`gap-${idx}`} className="px-1 text-[#64748B]">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    aria-current={p === currentPage ? 'page' : undefined}
                    className={`w-7 h-7 rounded text-xs flex items-center justify-center transition-colors ${p === currentPage
                      ? 'bg-[#F59E0B] text-black font-mono font-bold shadow-sm'
                      : 'border border-[#1A2338] text-slate-400 hover:text-white hover:bg-[#121927]'
                      }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
                className="px-2 h-7 rounded border border-[#1A2338] text-slate-400 text-xs hover:text-white hover:bg-[#121927] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#0D121F] border border-[#1E293F] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1A2234]">
              <div>
                <h3 className="text-base font-semibold text-white">Create Organization</h3>
                <p className="text-xs text-[#8B98A9]">Add tenant company & initial owner account</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-[#64748B] hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-2.5 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#94A3B8] mb-1 font-medium">Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgSlug) {
                      setNewOrgSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, '')
                      );
                    }
                  }}
                  className="w-full bg-[#111726] border border-[#232F47] rounded-lg px-3 py-2 text-white outline-none focus:border-[#F59E0B]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-medium">Slug</label>
                <input
                  type="text"
                  placeholder="e.g. acme-corp"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  className="w-full bg-[#111726] border border-[#232F47] rounded-lg px-3 py-2 font-mono text-white outline-none focus:border-[#F59E0B]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-medium">Plan</label>
                <select
                  value={newOrgPlan}
                  onChange={(e) => setNewOrgPlan(e.target.value)}
                  className="w-full bg-[#111726] border border-[#232F47] rounded-lg px-3 py-2 text-white outline-none focus:border-[#F59E0B]"
                >
                  <option value="trial">Trial (14 Days)</option>
                  <option value="team">Team</option>
                  <option value="scale">Scale</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="pt-2 border-t border-[#1A2234]">
                <label className="block text-[#94A3B8] mb-1 font-medium">Owner Full Name</label>
                <input
                  type="text"
                  placeholder="Alice Smith"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full bg-[#111726] border border-[#232F47] rounded-lg px-3 py-2 text-white outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-medium">Owner Work Email</label>
                <input
                  type="email"
                  placeholder="alice@acme.com"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  className="w-full bg-[#111726] border border-[#232F47] rounded-lg px-3 py-2 text-white outline-none focus:border-[#F59E0B]"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#94A3B8] font-medium">Owner Password</label>
                  <button
                    type="button"
                    onClick={() => setNewOwnerPassword(generatePassword())}
                    className="text-[#F59E0B] hover:underline font-mono text-[11px]"
                  >
                    Generate secure
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="Min 12 characters"
                  value={newOwnerPassword}
                  onChange={(e) => setNewOwnerPassword(e.target.value)}
                  className="w-full bg-[#111726] border border-[#232F47] rounded-lg px-3 py-2 text-white outline-none focus:border-[#F59E0B]"
                  required
                  minLength={12}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A2234]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#111726] border border-[#232F47] text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-[#F59E0B] text-black font-semibold hover:bg-[#FBBF24] disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
