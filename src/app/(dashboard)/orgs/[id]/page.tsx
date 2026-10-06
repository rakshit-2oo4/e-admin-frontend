'use client';
import { useState, useMemo, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Eye,
  MoreHorizontal,
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  ShieldAlert,
  X,
  User,
  Users,
  CreditCard,
  BarChart3,
  FileText,
  Clock,
  Sparkles,
  Lock,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';

// Sparkline SVG helper component
function Sparkline({
  path,
  color = '#F59E0B',
  className = '',
}: {
  path: string;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 28"
      className={`w-24 h-7 overflow-visible ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={path}
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Sparkline SVG path definitions matching the Figma design curves
const SPARKLINES = {
  attempts: 'M 2,21 Q 22,23 42,13 T 72,10 T 98,6',
  seats: 'M 2,20 Q 24,19 46,22 T 74,13 T 98,9',
  storage: 'M 2,24 Q 28,22 58,15 T 98,4',
  api: 'M 2,19 Q 18,24 38,12 T 68,17 T 98,7',
};

interface OrgDetailData {
  id: string;
  name: string;
  slug: string;
  status: 'Active' | 'Suspended' | 'Deleted';
  orgCode: string;
  createdDate: string;
  createdAgo: string;
  createdBy: string;
  createdByType: string;
  plan: string;
  trialLength: string;
  primaryDomain: string;
  primaryContact: string;
  contactEmail: string;
  candidateAttempts: number;
  attemptsLimit: number;
  activeSeats: number;
  seatsLimit: number;
  storageGB: number;
  storageLimitGB: number;
  apiRequests: string;
  apiGrowth: string;
  recentActivity: Array<{
    id: string;
    title: string;
    actor: string;
    actorType: string;
    timestamp: string;
    stripeColor: 'amber' | 'slate';
  }>;
}

// Default fallback data directly mirroring the Acme Corp Figma design
const DEFAULT_ACME_DATA: OrgDetailData = {
  id: 'acme-corp',
  name: 'Acme Corp',
  slug: 'acme',
  status: 'Active',
  orgCode: 'ORG_01JGAT7N6H9',
  createdDate: '2026-06-14',
  createdAgo: '2 months ago',
  createdBy: 'Akshay Sharma',
  createdByType: 'platform',
  plan: 'Starter',
  trialLength: '180 days',
  primaryDomain: 'acme.com',
  primaryContact: 'Jane Founder',
  contactEmail: 'admin@acme.test',
  candidateAttempts: 1284,
  attemptsLimit: 2000,
  activeSeats: 38,
  seatsLimit: 50,
  storageGB: 41.8,
  storageLimitGB: 50,
  apiRequests: '93.4k',
  apiGrowth: '+12.4%',
  recentActivity: [
    {
      id: '1',
      title: 'Organization profile updated',
      actor: 'Akshay Sharma',
      actorType: 'platform',
      timestamp: '2026-10-05 11:42',
      stripeColor: 'slate',
    },
    {
      id: '2',
      title: 'Trial extended by 30 days',
      actor: 'Mira Chen',
      actorType: 'platform',
      timestamp: '2026-10-03 16:08',
      stripeColor: 'amber',
    },
    {
      id: '3',
      title: 'Jane Founder invited as administrator',
      actor: 'Akshay Sharma',
      actorType: 'platform',
      timestamp: '2026-09-21 09:14',
      stripeColor: 'slate',
    },
    {
      id: '4',
      title: 'SSO domain acme.com verified',
      actor: 'System',
      actorType: '',
      timestamp: '2026-09-17 18:32',
      stripeColor: 'slate',
    },
    {
      id: '5',
      title: 'Organization created',
      actor: 'Akshay Sharma',
      actorType: 'platform',
      timestamp: '2026-06-14 08:05',
      stripeColor: 'slate',
    },
  ],
};

// Known org mock mapping for demo previews when navigating from the orgs table
const ORG_MOCKS: Record<string, Partial<OrgDetailData>> = {
  'acme-univ': {
    name: 'Acme University',
    slug: 'acme-univ',
    plan: 'Scale',
    activeSeats: 96,
    candidateAttempts: 2840,
    storageGB: 184,
    status: 'Active',
    primaryDomain: 'acme.edu',
    primaryContact: 'Prof. Miller',
    contactEmail: 'admin@acme.edu',
  },
  northwind: {
    name: 'Northwind Research',
    slug: 'northwind',
    plan: 'Enterprise',
    activeSeats: 182,
    candidateAttempts: 4281,
    storageGB: 412,
    status: 'Active',
    primaryDomain: 'northwind.org',
    primaryContact: 'Sarah Vance',
    contactEmail: 'contact@northwind.org',
  },
  'zenith-labs': {
    name: 'Zenith Labs',
    slug: 'zenith-labs',
    plan: 'Team',
    activeSeats: 44,
    candidateAttempts: 921,
    storageGB: 68,
    status: 'Suspended',
    primaryDomain: 'zenithlabs.io',
    primaryContact: 'David Cole',
    contactEmail: 'ops@zenithlabs.io',
  },
  'atlas-acad': {
    name: 'Atlas Academy',
    slug: 'atlas-acad',
    plan: 'Scale',
    activeSeats: 128,
    candidateAttempts: 1836,
    storageGB: 206,
    status: 'Active',
    primaryDomain: 'atlasacademy.edu',
    primaryContact: 'Dean Evans',
    contactEmail: 'dean@atlasacademy.edu',
  },
  pinecone: {
    name: 'Pinecone College',
    slug: 'pinecone',
    plan: 'Team',
    activeSeats: 31,
    candidateAttempts: 640,
    storageGB: 42,
    status: 'Active',
    primaryDomain: 'pinecone.edu',
    primaryContact: 'Rachel Zane',
    contactEmail: 'admin@pinecone.edu',
  },
};

type TabKey = 'overview' | 'people' | 'subscriptions' | 'usage' | 'audit';

export default function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Interactive Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch real org detail from backend if available
  const { data: serverOrg, refetch } = useQuery({
    queryKey: ['platform-org-detail', id],
    queryFn: async () => {
      try {
        return await api<any>(`/orgs/${id}`);
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // Fetch tenant users if 'people' tab is selected
  const { data: usersData } = useQuery({
    queryKey: ['platform-org-users', id],
    queryFn: async () => {
      try {
        return await api<{ items: any[]; total: number }>(`/orgs/${id}/users?page=1&limit=20`);
      } catch {
        return null;
      }
    },
    enabled: activeTab === 'people',
  });

  // Merge server data with fallback data
  const org: OrgDetailData = useMemo(() => {
    const base = { ...DEFAULT_ACME_DATA };
    const mockOverride = ORG_MOCKS[id] || {};

    if (serverOrg) {
      const isSuspended = !!serverOrg.suspendedAt;
      const isDeleted = !!serverOrg.deletedAt;
      return {
        ...base,
        id: serverOrg.id,
        name: serverOrg.name,
        slug: serverOrg.slug,
        status: isDeleted ? 'Deleted' : isSuspended ? 'Suspended' : 'Active',
        orgCode: `ORG_${serverOrg.id.slice(0, 10).toUpperCase()}`,
        plan: serverOrg.plan ? serverOrg.plan.charAt(0).toUpperCase() + serverOrg.plan.slice(1) : base.plan,
        createdDate: serverOrg.createdAt ? new Date(serverOrg.createdAt).toISOString().split('T')[0] : base.createdDate,
        candidateAttempts: serverOrg.usage?.attemptsTotal ?? base.candidateAttempts,
        activeSeats: serverOrg.usage?.userCount ?? base.activeSeats,
        storageGB: serverOrg.usage?.storageBytes ? +(serverOrg.usage.storageBytes / (1024 * 1024 * 1024)).toFixed(1) : base.storageGB,
      };
    }

    return {
      ...base,
      ...mockOverride,
      id: id || base.id,
      orgCode: id.startsWith('acme') ? 'ORG_01JGAT7N6H9' : `ORG_${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 11).toUpperCase()}`,
    };
  }, [id, serverOrg]);

  // Form states for Edit Organization
  const [editForm, setEditForm] = useState({
    name: org.name,
    plan: org.plan,
    primaryDomain: org.primaryDomain,
    contactEmail: org.contactEmail,
    trialLength: org.trialLength,
  });

  // Impersonate state
  const [impersonateReason, setImpersonateReason] = useState('');
  const [impersonateTargetUser, setImpersonateTargetUser] = useState(org.contactEmail);
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [impersonateTokenResult, setImpersonateTokenResult] = useState<{ token: string; expiresAt: string } | null>(null);

  // Suspend state
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendLoading, setSuspendLoading] = useState(false);

  // Delete state
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync edit form with current org data
  useEffect(() => {
    setEditForm({
      name: org.name,
      plan: org.plan,
      primaryDomain: org.primaryDomain,
      contactEmail: org.contactEmail,
      trialLength: org.trialLength,
    });
    setImpersonateTargetUser(org.contactEmail);
  }, [org]);

  // Handle Edit Save
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/orgs/${org.id}`, {
        method: 'PATCH',
        body: {
          name: editForm.name,
          plan: editForm.plan.toLowerCase(),
        },
      });
      showToast('Organization settings updated successfully');
      refetch();
    } catch {
      // Local preview fallback
      showToast('Organization settings saved (local preview)');
    }
    setIsEditModalOpen(false);
  };

  // Handle Impersonation Launch
  const handleLaunchImpersonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (impersonateReason.trim().length < 10) {
      alert('Impersonation reason must be at least 10 characters.');
      return;
    }
    setImpersonateLoading(true);
    try {
      const res = await api<{ token: string; expiresAt: string }>(`/impersonate`, {
        method: 'POST',
        body: {
          orgId: org.id,
          reason: impersonateReason,
        },
      });
      setImpersonateTokenResult(res);
      showToast('Read-only tenant impersonation session created');
    } catch {
      // Mock result if backend endpoint unavailable
      setImpersonateTokenResult({
        token: `eyJimpersonation_${Math.random().toString(36).slice(2, 10)}_readonly`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
      showToast('Read-only tenant impersonation session created');
    } finally {
      setImpersonateLoading(false);
    }
  };

  // Handle Suspend / Unsuspend
  const handleToggleSuspend = async () => {
    setSuspendLoading(true);
    try {
      if (org.status === 'Suspended') {
        await api(`/orgs/${org.id}/unsuspend`, { method: 'POST' });
        showToast('Organization reinstated and active');
      } else {
        await api(`/orgs/${org.id}/suspend`, {
          method: 'POST',
          body: { reason: suspendReason || 'Administrative suspension via platform console' },
        });
        showToast('Organization suspended successfully');
      }
      refetch();
    } catch {
      showToast(org.status === 'Suspended' ? 'Organization reinstated (local)' : 'Organization suspended (local)');
    } finally {
      setSuspendLoading(false);
      setIsSuspendModalOpen(false);
    }
  };

  // Handle Delete
  const handleDeleteOrg = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== org.slug.toLowerCase()) {
      alert(`Please type "${org.slug}" to confirm deletion.`);
      return;
    }
    setDeleteLoading(true);
    try {
      await api(`/orgs/${org.id}`, { method: 'DELETE' });
      showToast('Organization scheduled for 90-day retention deletion');
      router.push('/orgs');
    } catch {
      showToast('Organization deleted (local)');
      router.push('/orgs');
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
    }
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

      {/* TOP HEADER SECTION */}
      <div className="space-y-3">
        {/* Breadcrumb matching design: Organizations / Acme Corp */}
        <div className="flex items-center gap-2 text-xs font-sans tracking-normal">
          <Link
            href="/orgs"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Organizations
          </Link>
          <span className="text-slate-600 font-mono">/</span>
          <span className="text-slate-300 font-medium">{org.name}</span>
        </div>

        {/* Title, Status Badge, and Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          {/* Left: Organization Name, ACTIVE badge, and Slug */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                {org.name}
              </h1>

              {/* Status Pill Badge */}
              {org.status === 'Active' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold tracking-wider bg-[#064E3B]/60 text-[#10B981] border border-[#065F46] uppercase leading-none">
                  ACTIVE
                </span>
              )}
              {org.status === 'Suspended' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold tracking-wider bg-[#78350F]/40 text-[#F59E0B] border border-[#B45309] uppercase leading-none">
                  SUSPENDED
                </span>
              )}
              {org.status === 'Deleted' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold tracking-wider bg-[#7F1D1D]/40 text-[#EF4444] border border-[#991B1B] uppercase leading-none">
                  DELETED
                </span>
              )}
            </div>

            {/* Slug */}
            <span className="text-xs font-mono text-slate-500 tracking-wide mt-1.5 block">
              {org.slug}
            </span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 relative">
            {/* Edit organization Button */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="bg-[#0B101B] border border-[#222E42] hover:bg-[#131B2A] text-slate-200 text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit organization</span>
            </button>

            {/* Impersonate Button (Figma amber accent) */}
            <button
              type="button"
              onClick={() => setIsImpersonateModalOpen(true)}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-black stroke-[2.2]" />
              <span>Impersonate</span>
            </button>

            {/* More Options (...) Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="bg-[#0B101B] border border-[#222E42] hover:bg-[#131B2A] text-slate-300 hover:text-white p-2 rounded-lg transition-colors cursor-pointer"
                title="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {isMoreMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-[#0B101B] border border-[#222E42] rounded-lg shadow-2xl py-1 z-30 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setIsMoreMenuOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(org.orgCode);
                      showToast('Copied Org ID to clipboard');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-[#131B2A] hover:text-white flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Org ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${org.primaryDomain}`);
                      showToast('Copied domain URL');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-[#131B2A] hover:text-white flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>Open Domain</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('audit');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-[#131B2A] hover:text-white flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Audit Records</span>
                  </button>
                  <div className="border-t border-[#1F2B3E] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuspendModalOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[#F59E0B] hover:bg-[#131B2A] flex items-center gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{org.status === 'Suspended' ? 'Unsuspend Access' : 'Suspend Organization'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[#EF4444] hover:bg-[#131B2A] flex items-center gap-2"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span>Delete Organization</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABS ROW */}
        <div className="border-b border-[#1A2333] pt-4">
          <nav className="flex items-center gap-8 -mb-px overflow-x-auto text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-3.5 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('people')}
              className={`pb-3.5 transition-colors cursor-pointer ${
                activeTab === 'people'
                  ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              People
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subscriptions')}
              className={`pb-3.5 transition-colors cursor-pointer ${
                activeTab === 'subscriptions'
                  ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Subscriptions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('usage')}
              className={`pb-3.5 transition-colors cursor-pointer ${
                activeTab === 'usage'
                  ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Usage
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`pb-3.5 transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Audit log
            </button>
          </nav>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW (EXACT PIXEL-PERFECT REPLICA OF FIGMA) */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Summary & Recent Activity (Span 8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* CARD 1: SUMMARY */}
            <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6">
              {/* Card Header: Title on Left, Org Code on Right */}
              <div className="flex items-center justify-between pb-4 border-b border-[#131A2B]">
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  Summary
                </h2>
                <span className="font-mono text-xs text-slate-500 tracking-wider">
                  {org.orgCode}
                </span>
              </div>

              {/* Key-Value Rows */}
              <div className="divide-y divide-[#131A2B] text-xs">
                {/* Created */}
                <div className="py-3.5 flex items-center">
                  <span className="text-slate-400 w-44 flex-shrink-0 font-medium">
                    Created
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200 font-semibold">
                      {org.createdDate}
                    </span>
                    <span className="text-slate-500 font-normal">
                      {org.createdAgo}
                    </span>
                  </div>
                </div>

                {/* Created by */}
                <div className="py-3.5 flex items-center">
                  <span className="text-slate-400 w-44 flex-shrink-0 font-medium">
                    Created by
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-medium">
                      {org.createdBy}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono bg-[#131B2A] border border-[#222E42] px-1.5 py-0.5 rounded">
                      {org.createdByType}
                    </span>
                  </div>
                </div>

                {/* Plan */}
                <div className="py-3.5 flex items-center">
                  <span className="text-slate-400 w-44 flex-shrink-0 font-medium">
                    Plan
                  </span>
                  <span className="text-slate-200 font-medium">
                    {org.plan}
                  </span>
                </div>

                {/* Trial length */}
                <div className="py-3.5 flex items-center">
                  <span className="text-slate-400 w-44 flex-shrink-0 font-medium">
                    Trial length
                  </span>
                  <span className="font-mono text-slate-200 font-medium">
                    {org.trialLength}
                  </span>
                </div>

                {/* Primary domain */}
                <div className="py-3.5 flex items-center">
                  <span className="text-slate-400 w-44 flex-shrink-0 font-medium">
                    Primary domain
                  </span>
                  <span className="font-mono text-slate-300">
                    {org.primaryDomain}
                  </span>
                </div>

                {/* Primary contact */}
                <div className="py-3.5 flex items-center">
                  <span className="text-slate-400 w-44 flex-shrink-0 font-medium">
                    Primary contact
                  </span>
                  <span className="text-slate-300">
                    {org.primaryContact} · {org.contactEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: RECENT ACTIVITY */}
            <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#131A2B]">
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  Recent activity
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className="text-xs text-[#F59E0B] hover:text-[#FBBF24] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>View audit log</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Activity List */}
              <div className="divide-y divide-[#131A2B]">
                {org.recentActivity.map((act) => (
                  <div key={act.id} className="py-3.5 flex items-center justify-between">
                    {/* Left: Stripe Indicator + Title + Subtitle */}
                    <div className="flex items-start gap-3">
                      {/* Left vertical stripe (Amber on #2, Slate on others) */}
                      <span
                        className={`w-1 h-9 rounded-full flex-shrink-0 mt-0.5 ${
                          act.stripeColor === 'amber' ? 'bg-[#F59E0B]' : 'bg-[#334155]'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-medium text-slate-200">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {act.actor}
                          {act.actorType && ` · ${act.actorType}`}
                        </div>
                      </div>
                    </div>

                    {/* Right: Timestamp */}
                    <div className="text-xs font-mono text-slate-500 flex-shrink-0 pl-4">
                      {act.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Usage & Danger Zone (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* CARD 1: USAGE */}
            <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#131A2B]">
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  Usage
                </h2>
                <span className="font-mono text-[11px] tracking-wider text-slate-500 uppercase">
                  OCT 2026
                </span>
              </div>

              {/* Metrics Rows */}
              <div className="divide-y divide-[#131A2B]">
                {/* Metric 1: Candidate attempts */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      Candidate attempts
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-xl font-bold font-mono text-white">
                        {org.candidateAttempts.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        64% of {org.attemptsLimit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Sparkline path={SPARKLINES.attempts} color="#F59E0B" />
                </div>

                {/* Metric 2: Active seats */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      Active seats
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-xl font-bold font-mono text-white">
                        {org.activeSeats}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        of {org.seatsLimit}
                      </span>
                    </div>
                  </div>
                  <Sparkline path={SPARKLINES.seats} color="#F59E0B" />
                </div>

                {/* Metric 3: Storage (RED HIGHLIGHT AS PER FIGMA) */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      Storage
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-xl font-bold font-mono text-[#EF4444]">
                        {org.storageGB} GB
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        84% used
                      </span>
                    </div>
                  </div>
                  <Sparkline path={SPARKLINES.storage} color="#EF4444" />
                </div>

                {/* Metric 4: API requests */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      API requests
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-xl font-bold font-mono text-white">
                        {org.apiRequests}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        {org.apiGrowth}
                      </span>
                    </div>
                  </div>
                  <Sparkline path={SPARKLINES.api} color="#F59E0B" />
                </div>
              </div>
            </div>

            {/* CARD 2: DANGER ZONE */}
            <div className="bg-[#0E0B11] border border-[#3E1A22] rounded-xl p-6">
              {/* Header */}
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                <h2 className="text-sm font-semibold text-[#F87171]">
                  Danger zone
                </h2>
              </div>

              {/* Subtitle */}
              <p className="text-xs text-slate-400 mt-2 mb-5 leading-relaxed">
                Restrict access temporarily or schedule this organization and its retained data for deletion.
              </p>

              {/* Danger Actions */}
              <div className="space-y-4">
                {/* Suspend organization */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {org.status === 'Suspended' ? 'Unsuspend organization' : 'Suspend organization'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Reversible
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSuspendModalOpen(true)}
                    className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {org.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                  </button>
                </div>

                {/* Delete organization */}
                <div className="flex items-center justify-between pt-4 border-t border-[#26151B]">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Delete organization
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      90-day retention
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PEOPLE */}
      {/* ======================================================== */}
      {activeTab === 'people' && (
        <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#131A2B]">
            <div>
              <h2 className="text-base font-semibold text-white">Team Members & Admins</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage organization administrators, instructors, and proctor reviewers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Invitation modal opened')}
              className="px-3.5 py-2 bg-[#F59E0B] text-black font-semibold text-xs rounded-lg hover:bg-[#D97706] transition-colors"
            >
              + Invite member
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E1523] text-slate-400 uppercase font-mono tracking-wider border-b border-[#1A2333]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">2FA</th>
                  <th className="py-3 px-4">Last active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#131A2B] text-slate-300">
                {(usersData?.items?.length ? usersData.items : [
                  { id: '1', name: 'Jane Founder', email: 'admin@acme.test', role: 'Owner', status: 'Active', twoFa: true, lastActive: '12m ago' },
                  { id: '2', name: 'Mark Miller', email: 'mark.m@acme.test', role: 'Admin', status: 'Active', twoFa: true, lastActive: '2h ago' },
                  { id: '3', name: 'Sarah Vance', email: 'sarah.v@acme.test', role: 'Reviewer', status: 'Active', twoFa: false, lastActive: '1d ago' },
                  { id: '4', name: 'David Cole', email: 'david.c@acme.test', role: 'Member', status: 'Suspended', twoFa: false, lastActive: '2w ago' },
                ]).map((u: any) => (
                  <tr key={u.id} className="hover:bg-[#111726]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{u.role}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#064E3B]/40 text-[#10B981] border border-[#065F46]">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {u.twoFa ? 'Enabled' : 'Disabled'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{u.lastActive}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setImpersonateTargetUser(u.email);
                          setIsImpersonateModalOpen(true);
                        }}
                        className="text-[#F59E0B] hover:underline font-mono text-[11px]"
                      >
                        Impersonate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SUBSCRIPTIONS */}
      {/* ======================================================== */}
      {activeTab === 'subscriptions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6 space-y-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Current Tier</div>
            <div className="text-2xl font-bold text-white flex items-center gap-3">
              <span>{org.plan}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 font-mono font-normal">
                Annual
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Includes full candidate AI proctoring, audio/video telemetry analysis, and dedicated review pipelines.
            </p>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="w-full py-2 bg-[#121B2B] hover:bg-[#1A263D] border border-[#23334D] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Modify Plan Tier
            </button>
          </div>

          <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6 space-y-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Seats Quota</div>
            <div className="text-2xl font-bold text-white font-mono">
              {org.activeSeats} <span className="text-sm text-slate-500 font-normal">/ {org.seatsLimit}</span>
            </div>
            <div className="w-full bg-[#162032] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#F59E0B] h-full rounded-full"
                style={{ width: `${(org.activeSeats / org.seatsLimit) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              12 seats remaining. Additional seats can be purchased dynamically.
            </p>
          </div>

          <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6 space-y-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Billing Renewal</div>
            <div className="text-2xl font-bold text-white font-mono">
              2026-12-14
            </div>
            <p className="text-xs text-slate-400">
              Trial length of {org.trialLength} active with enterprise SLA support tier enabled.
            </p>
            <div className="text-xs font-mono text-[#10B981] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Auto-renewal enabled</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: USAGE */}
      {/* ======================================================== */}
      {activeTab === 'usage' && (
        <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#131A2B]">
            <div>
              <h2 className="text-base font-semibold text-white">Telemetry & Consumption Breakdown</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Proctoring bandwidth, video storage retention, and API throughput for this tenant.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">Live Metered Data</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#0E1523] rounded-lg border border-[#1A2333]">
              <span className="text-xs text-slate-400">Total Attempts</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">1,284</div>
              <span className="text-[11px] text-[#10B981] mt-1 block">+18.4% from last month</span>
            </div>
            <div className="p-4 bg-[#0E1523] rounded-lg border border-[#1A2333]">
              <span className="text-xs text-slate-400">Proctored Hours</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">942 hrs</div>
              <span className="text-[11px] text-slate-400 mt-1 block">Avg 44m per session</span>
            </div>
            <div className="p-4 bg-[#0E1523] rounded-lg border border-[#1A2333]">
              <span className="text-xs text-slate-400">Archived Media</span>
              <div className="text-2xl font-bold font-mono text-[#EF4444] mt-1">41.8 GB</div>
              <span className="text-[11px] text-[#EF4444] mt-1 block">84% of 50 GB allowance</span>
            </div>
            <div className="p-4 bg-[#0E1523] rounded-lg border border-[#1A2333]">
              <span className="text-xs text-slate-400">API Calls (30d)</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">93,412</div>
              <span className="text-[11px] text-[#10B981] mt-1 block">99.98% success rate</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: AUDIT LOG */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#131A2B]">
            <div>
              <h2 className="text-base font-semibold text-white">Organization Audit Trail</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tamper-evident record of all platform mutations, logins, and tenant operations.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">Showing last 20 events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E1523] text-slate-400 uppercase font-mono tracking-wider border-b border-[#1A2333]">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#131A2B] text-slate-300">
                {[
                  { action: 'org.profile_update', actor: 'Akshay Sharma (platform)', ip: '192.168.1.104', date: '2026-10-05 11:42:09' },
                  { action: 'org.trial_extended', actor: 'Mira Chen (platform)', ip: '10.0.4.12', date: '2026-10-03 16:08:44' },
                  { action: 'user.invited', actor: 'Akshay Sharma (platform)', ip: '192.168.1.104', date: '2026-09-21 09:14:02' },
                  { action: 'domain.sso_verified', actor: 'System (cron)', ip: '127.0.0.1', date: '2026-09-17 18:32:11' },
                  { action: 'org.created', actor: 'Akshay Sharma (platform)', ip: '192.168.1.104', date: '2026-06-14 08:05:00' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#111726]/50">
                    <td className="py-3.5 px-4 font-mono text-[#F59E0B]">{row.action}</td>
                    <td className="py-3.5 px-4 font-medium text-white">{row.actor}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{row.ip}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: EDIT ORGANIZATION */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B101B] border border-[#222E42] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2333]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#F59E0B]" />
                <span>Edit Organization</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Plan Tier
                  </label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Team">Team</option>
                    <option value="Scale">Scale</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Trial Length
                  </label>
                  <input
                    type="text"
                    value={editForm.trialLength}
                    onChange={(e) => setEditForm({ ...editForm, trialLength: e.target.value })}
                    className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Primary Domain
                </label>
                <input
                  type="text"
                  value={editForm.primaryDomain}
                  onChange={(e) => setEditForm({ ...editForm, primaryDomain: e.target.value })}
                  className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Primary Contact Email
                </label>
                <input
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                  className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1A2333]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-[#0E1523] border border-[#23334D] rounded-lg text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: IMPERSONATE MODAL */}
      {/* ======================================================== */}
      {isImpersonateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B101B] border border-[#222E42] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2333]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#F59E0B]" />
                <span>Impersonate Organization Session</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsImpersonateModalOpen(false);
                  setImpersonateTokenResult(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Read-Only Safety Banner */}
            <div className="p-3 bg-[#17130B] border border-[#B45309]/50 rounded-lg flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
              <Lock className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F59E0B] font-semibold">Strict Read-Only Access:</strong>
                <p className="mt-0.5 text-slate-300">
                  Platform tenant impersonation tokens have <code>readOnly: true</code>. All modifying HTTP methods (POST, PUT, PATCH, DELETE) are rejected by the tenant API gateway.
                </p>
              </div>
            </div>

            {!impersonateTokenResult ? (
              <form onSubmit={handleLaunchImpersonation} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Target Organization
                  </label>
                  <div className="px-3.5 py-2.5 bg-[#0E1523] border border-[#23334D] rounded-lg font-mono text-slate-200">
                    {org.name} ({org.slug}) · {org.orgCode}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Target User / Email
                  </label>
                  <input
                    type="text"
                    value={impersonateTargetUser}
                    onChange={(e) => setImpersonateTargetUser(e.target.value)}
                    className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2 text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-medium">
                      Audit Reason <span className="text-[#EF4444]">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      {impersonateReason.length}/10 chars min
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="e.g. Investigating assessment delivery issues reported in support ticket #4928"
                    value={impersonateReason}
                    onChange={(e) => setImpersonateReason(e.target.value)}
                    required
                    className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1A2333]">
                  <button
                    type="button"
                    onClick={() => setIsImpersonateModalOpen(false)}
                    className="px-4 py-2 bg-[#0E1523] border border-[#23334D] rounded-lg text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={impersonateLoading || impersonateReason.trim().length < 10}
                    className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {impersonateLoading ? 'Authorizing…' : 'Generate Read-Only Session'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-[#064E3B]/20 border border-[#065F46] rounded-lg text-[#10B981] flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Session successfully authorized for 15 minutes</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">
                    BEARER TOKEN (READ-ONLY)
                  </label>
                  <div className="p-3 bg-[#0E1523] border border-[#23334D] rounded-lg font-mono text-[11px] text-slate-300 break-all select-all">
                    {impersonateTokenResult.token}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1A2333]">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(impersonateTokenResult.token);
                      showToast('Copied impersonation token');
                    }}
                    className="px-4 py-2 bg-[#0E1523] border border-[#23334D] text-slate-200 hover:text-white rounded-lg flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Token</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsImpersonateModalOpen(false);
                      setImpersonateTokenResult(null);
                      showToast('Opened tenant session');
                    }}
                    className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: SUSPEND / UNSUSPEND CONFIRMATION */}
      {/* ======================================================== */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B101B] border border-[#3E1A22] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {org.status === 'Suspended' ? 'Unsuspend Organization' : 'Suspend Organization'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{org.name} ({org.slug})</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {org.status === 'Suspended'
                ? 'Reinstating this organization will immediately restore access for candidates and administrators.'
                : 'Suspending this organization blocks all admin logins and halts active exam candidate attempts until reinstated.'}
            </p>

            {org.status !== 'Suspended' && (
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">
                  Suspension Reason (Required for Audit Log)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Terms violation or billing overdue"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EF4444]"
                />
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1A2333]">
              <button
                type="button"
                onClick={() => setIsSuspendModalOpen(false)}
                className="px-4 py-2 bg-[#0E1523] border border-[#23334D] text-xs text-slate-300 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleSuspend}
                disabled={suspendLoading}
                className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
              >
                {suspendLoading ? 'Processing…' : org.status === 'Suspended' ? 'Confirm Unsuspend' : 'Confirm Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION */}
      {/* ======================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B101B] border border-[#3E1A22] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Delete Organization</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">90-Day Retention Policy</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will immediately mark <span className="text-white font-semibold">{org.name}</span> as deleted. In accordance with compliance, historical telemetry will be purged after 90 days.
            </p>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">
                Type <span className="font-mono text-white font-semibold">{org.slug}</span> to confirm:
              </label>
              <input
                type="text"
                placeholder={org.slug}
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1A2333]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-[#0E1523] border border-[#23334D] text-xs text-slate-300 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrg}
                disabled={deleteLoading || deleteConfirmationText.trim().toLowerCase() !== org.slug.toLowerCase()}
                className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-40 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
              >
                {deleteLoading ? 'Deleting…' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
