'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MoreHorizontal, ArrowRight } from 'lucide-react';

interface OverviewStats {
  totalOrgs: number;
  activeOrgs: number;
  suspendedOrgs: number;
  totalUsers: number;
  attemptsLast30Days: number;
  totalStorageBytes: number;
  mostActiveOrgs: { orgId: string; name: string; attemptsLast30Days: number }[];
}

interface RecentOrg {
  id: string;
  name: string;
  slug: string;
  plan: string;
  users: number;
  attempts: number;
  status: 'Active' | 'Suspended';
}

export default function OverviewPage() {
  // Query backend overview metrics
  const { data: stats } = useQuery<OverviewStats>({
    queryKey: ['overview-stats'],
    queryFn: () => api<OverviewStats>('/stats/overview').catch(() => null as any),
    staleTime: 30_000,
  });

  // Action dropdown state
  const [activeMenuOrgId, setActiveMenuOrgId] = useState<string | null>('zenith-labs');

  // Sparkline SVG path helper
  const Sparkline = () => (
    <svg className="w-20 h-7 overflow-visible" viewBox="0 0 80 28" fill="none">
      <path
        d="M 2 24 Q 15 22, 25 18 T 45 15 T 60 8 T 78 4"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const attemptBars = [
    { label: 'Sep 06', value: 50, date: 'Sep 06' },
    { label: '', value: 72, date: 'Sep 08' },
    { label: '', value: 60, date: 'Sep 10' },
    { label: 'Sep 13', value: 88, date: 'Sep 13' },
    { label: '', value: 68, date: 'Sep 15' },
    { label: '', value: 104, date: 'Sep 17' },
    { label: 'Sep 20', value: 82, date: 'Sep 20' },
    { label: '', value: 118, date: 'Sep 22' },
    { label: '', value: 92, date: 'Sep 24' },
    { label: 'Sep 27', value: 126, date: 'Sep 27' },
    { label: '', value: 140, date: 'Sep 29', isHighlight: true },
    { label: '', value: 112, date: 'Oct 02', isHighlight: true },
    { label: 'Oct 05', value: 152, date: 'Oct 05', isHighlight: true },
  ];

  const healthServices = [
    { name: 'API', status: 'Operational', color: 'emerald' },
    { name: 'Judge0', status: 'Operational', color: 'emerald' },
    { name: 'SQL runner', status: 'Operational', color: 'emerald' },
    { name: 'Redis', status: 'Operational', color: 'emerald' },
    { name: 'Postgres', status: 'Operational', color: 'emerald' },
    { name: 'S3 storage', status: 'Degraded', color: 'amber' },
  ];

  const sampleOrgs: RecentOrg[] = [
    {
      id: 'northwind',
      name: 'Northwind Research',
      slug: 'northwind',
      plan: 'Enterprise',
      users: 182,
      attempts: 4281,
      status: 'Active',
    },
    {
      id: 'acme-univ',
      name: 'Acme University',
      slug: 'acme-univ',
      plan: 'Scale',
      users: 96,
      attempts: 2840,
      status: 'Active',
    },
    {
      id: 'zenith-labs',
      name: 'Zenith Labs',
      slug: 'zenith-labs',
      plan: 'Team',
      users: 44,
      attempts: 921,
      status: 'Suspended',
    },
    {
      id: 'atlas-acad',
      name: 'Atlas Academy',
      slug: 'atlas-acad',
      plan: 'Scale',
      users: 128,
      attempts: 1836,
      status: 'Active',
    },
    {
      id: 'pinecone',
      name: 'Pinecone College',
      slug: 'pinecone',
      plan: 'Team',
      users: 31,
      attempts: 640,
      status: 'Active',
    },
  ];

  const activities = [
    {
      initials: 'AS',
      type: 'user',
      title: "Suspended org 'Zenith Labs'",
      time: '2m ago',
    },
    {
      initials: 'MR',
      type: 'user',
      title: "Created org 'Northwind'",
      time: '14m ago',
    },
    {
      initials: 'AS',
      type: 'user',
      title: "Started impersonation of 'Acme'",
      time: '1h ago',
    },
    {
      initials: 'SYS',
      type: 'system',
      title: "system · Auto-expired impersonation 'Acme'",
      time: '2h ago',
    },
    {
      initials: 'JL',
      type: 'user',
      title: "Changed plan for 'Atlas'",
      time: '3h ago',
    },
    {
      initials: 'MR',
      type: 'user',
      title: "Invited platform user 'Dana'",
      time: '5h ago',
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Overview
          </h1>
          <p className="text-xs font-mono uppercase tracking-wider text-[#64748B] mt-1">
            PLATFORM SNAPSHOT · 05 OCT 2026 · 12:32 UTC
          </p>
        </div>

        {/* Live System Indicator Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <span className="text-xs font-mono font-medium tracking-widest text-[#E2E8F0] uppercase">
            ALL SYSTEMS REPORTING
          </span>
        </div>
      </div>

      {/* 2. Top Metric Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Organizations */}
        <div className="bg-[#0D121F] border border-[#172033] rounded-xl p-5 hover:border-[#202C45] transition-colors flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium text-[#8F9CAE]">Organizations</span>
            <Sparkline />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white tracking-tight font-sans">
              {stats?.totalOrgs ?? 0}
            </div>
            <div className="text-xs font-mono text-[#10B981] mt-1.5 flex items-center gap-1">
              +3 this month
            </div>
          </div>
        </div>

        {/* Card 2: Active Attempts */}
        <div className="bg-[#0D121F] border border-[#172033] rounded-xl p-5 hover:border-[#202C45] transition-colors flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium text-[#8F9CAE]">Active attempts</span>
            <Sparkline />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white tracking-tight font-sans">
              128
            </div>
            <div className="text-xs font-mono text-[#10B981] mt-1.5 flex items-center gap-1">
              +12% vs last week
            </div>
          </div>
        </div>

        {/* Card 3: Storage Used */}
        <div className="bg-[#0D121F] border border-[#172033] rounded-xl p-5 hover:border-[#202C45] transition-colors flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium text-[#8F9CAE]">Storage used</span>
            <Sparkline />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white tracking-tight font-sans">
              2.4 TB
            </div>
            <div className="text-xs font-mono text-[#10B981] mt-1.5 flex items-center gap-1">
              +180 GB this week
            </div>
          </div>
        </div>

        {/* Card 4: Platform Users */}
        <div className="bg-[#0D121F] border border-[#172033] rounded-xl p-5 hover:border-[#202C45] transition-colors flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium text-[#8F9CAE]">Platform users</span>
            <Sparkline />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white tracking-tight font-sans">
              {stats?.totalUsers ?? 0}
            </div>
            <div className="text-xs font-mono text-[#64748B] mt-1.5">
              6 super admins
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Attempts Chart (Left) + System Health (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Attempts Chart Card (8 Columns) */}
        <div className="lg:col-span-8 bg-[#0D121F] border border-[#172033] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-6">
            <h2 className="text-sm font-semibold text-white">Attempts</h2>
            <span className="text-xs font-mono text-[#64748B]">30 days · UTC</span>
          </div>

          {/* Bar Chart Container */}
          <div className="flex flex-1 min-h-[220px]">
            {/* Y-Axis Ticks */}
            <div className="flex flex-col justify-between text-[11px] font-mono text-[#64748B] pr-4 select-none pb-7">
              <span>160</span>
              <span>120</span>
              <span>80</span>
              <span>40</span>
              <span>0</span>
            </div>

            {/* Bars Canvas with Grid lines */}
            <div className="flex-1 flex flex-col justify-between relative">
              {/* Horizontal Grid Guidelines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
                <div className="border-b border-[#141C2E] w-full" />
                <div className="border-b border-[#141C2E] w-full" />
                <div className="border-b border-[#141C2E] w-full" />
                <div className="border-b border-[#141C2E] w-full" />
                <div className="border-b border-[#1A2338] w-full" />
              </div>

              {/* Bars Row */}
              <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-3 z-10 px-2 pb-7">
                {attemptBars.map((bar, idx) => {
                  const heightPercent = (bar.value / 160) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#151D2C] border border-[#232F47] text-white text-[10px] font-mono py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-20">
                        {bar.value} attempts
                      </div>

                      {/* Bar Pillar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[42px] rounded-t-sm transition-all duration-200 ${bar.isHighlight
                          ? 'bg-[#F59E0B] hover:bg-[#FBBF24] shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : 'bg-[#182337] hover:bg-[#22304A]'
                          }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between text-[11px] font-mono text-[#64748B] pt-2 border-t border-[#141C2E] px-2">
                <span>0  Sep 06</span>
                <span>Sep 13</span>
                <span>Sep 20</span>
                <span>Sep 27</span>
                <span>Oct 05</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: System Health Card (4 Columns) */}
        <div className="lg:col-span-4 bg-[#0D121F] border border-[#172033] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-sm font-semibold text-white">System health</h2>
            <span className="text-xs font-mono text-[#64748B]">Live</span>
          </div>

          <div className="space-y-3.5 my-auto">
            {healthServices.map((svc) => (
              <div
                key={svc.name}
                className="flex items-center justify-between text-xs py-1"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${svc.color === 'emerald'
                      ? 'bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                      : 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                      }`}
                  />
                  <span className="text-[#94A3B8] font-medium">{svc.name}</span>
                </div>

                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-mono border ${svc.color === 'emerald'
                    ? 'border-[#10B981]/40 text-[#10B981] bg-[#10B981]/10'
                    : 'border-[#F59E0B]/50 text-[#F59E0B] bg-[#F59E0B]/10'
                    }`}
                >
                  {svc.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#141C2E] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
            <span>Latency: 28ms avg</span>
            <span>Uptime: 99.98%</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Recent Organizations (Left) + Activity Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Recent Organizations Table (8 Columns) */}
        <div className="lg:col-span-8 bg-[#0D121F] border border-[#172033] rounded-xl p-5">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-sm font-semibold text-white">Recent organizations</h2>
            <span className="text-xs font-mono text-[#64748B]">Updated 34s ago</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#141C2E] text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
                  <th className="py-2.5 font-medium">NAME</th>
                  <th className="py-2.5 font-medium">SLUG</th>
                  <th className="py-2.5 font-medium">PLAN</th>
                  <th className="py-2.5 font-medium">USERS</th>
                  <th className="py-2.5 font-medium">ATTEMPTS</th>
                  <th className="py-2.5 font-medium">STATUS</th>
                  <th className="py-2.5 font-medium text-right pr-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#131A2B]">
                {sampleOrgs.map((org) => {
                  const isMenuOpen = activeMenuOrgId === org.id;

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-[#111726]/60 transition-colors group relative"
                    >
                      <td className="py-3.5 font-semibold text-white">
                        {org.name}
                      </td>
                      <td className="py-3.5 font-mono text-[#8B98A9]">
                        {org.slug}
                      </td>
                      <td className="py-3.5 text-[#94A3B8]">
                        {org.plan}
                      </td>
                      <td className="py-3.5 font-mono text-[#CBD5E1]">
                        {org.users}
                      </td>
                      <td className="py-3.5 font-mono text-[#CBD5E1]">
                        {org.attempts.toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-xs font-mono border ${org.status === 'Active'
                            ? 'border-[#10B981]/50 text-[#10B981] bg-[#10B981]/10'
                            : 'border-[#EF4444]/50 text-[#EF4444] bg-[#EF4444]/10'
                            }`}
                        >
                          {org.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right relative pr-2">
                        {/* Two dots button */}
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuOrgId((prev) => (prev === org.id ? null : org.id))
                          }
                          className="p-1 rounded text-[#64748B] hover:text-white hover:bg-[#182133] transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu (Open on Zenith Labs in screenshot) */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-10 w-44 bg-[#0F1626] border border-[#1E293F] rounded-lg shadow-2xl p-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100">
                            <Link
                              href={`/orgs/${org.id}`}
                              className="block px-3 py-1.5 text-xs text-[#CBD5E1] hover:bg-[#172033] hover:text-white rounded"
                            >
                              Open organization
                            </Link>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-1.5 text-xs text-[#CBD5E1] hover:bg-[#172033] hover:text-white rounded"
                            >
                              Impersonate
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-1.5 text-xs text-[#EF4444] hover:bg-[#172033] rounded"
                            >
                              {org.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Recent Platform Activity Card (4 Columns) */}
        <div className="lg:col-span-4 bg-[#0D121F] border border-[#172033] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white pb-4">
              Recent platform activity
            </h2>

            {/* Activity Stream Items */}
            <div className="space-y-4">
              {activities.map((act, index) => (
                <div key={index} className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* User Initials Circle Avatar */}
                    <div
                      className={`w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0 ${act.type === 'system'
                        ? 'bg-[#1E293B] text-[#94A3B8] border border-[#334155]'
                        : 'bg-[#854D0E] text-[#FEF3C7] border border-[#A16207]/40'
                        }`}
                    >
                      {act.initials}
                    </div>

                    <span className="text-[#CBD5E1] truncate">
                      {act.title}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-[#64748B] shrink-0">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Link */}
          <div className="pt-6 border-t border-[#141C2E] mt-6">
            <Link
              href="/audit"
              className="text-xs font-semibold text-[#F59E0B] hover:text-[#FBBF24] flex items-center gap-1 transition-colors"
            >
              <span>View full audit log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
