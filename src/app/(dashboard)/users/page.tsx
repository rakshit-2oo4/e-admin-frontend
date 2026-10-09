'use client';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Search,
  ChevronDown,
  MoreHorizontal,
  X,
  Check,
  Shield,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';

export type PlatformRole = 'SUPER_ADMIN' | 'SUPPORT';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface PlatformUserItem {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  status: UserStatus;
  lastActive: string;
  createdAt?: string;
}

export default function PlatformUsersPage() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'SUPER_ADMIN' | 'SUPPORT'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'DISABLED'>('All');

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<PlatformUserItem | null>(null);
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<PlatformUserItem | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<PlatformUserItem | null>(null);

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: 'SUPER_ADMIN' as PlatformRole,
    password: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  const [editRoleForm, setEditRoleForm] = useState<'SUPER_ADMIN' | 'SUPPORT'>('SUPER_ADMIN');
  const [editLoading, setEditLoading] = useState(false);

  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (msg: string, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuUserId(null);
      setRoleDropdownOpen(false);
      setStatusDropdownOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const {
    data: serverData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['platform-users-list'],
    queryFn: async () => {
      return await api<{ items: any[]; total: number }>('/users', {
        query: { page: 1, limit: 100 },
      });
    },
    staleTime: 10_000,
  });

  const usersList = useMemo<PlatformUserItem[]>(() => {
    if (!serverData?.items) return [];
    return serverData.items.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as PlatformRole,
      status: (u.isActive ? 'ACTIVE' : 'DISABLED') as UserStatus,
      lastActive: u.lastLoginAt
        ? new Date(u.lastLoginAt).toISOString().replace('T', ' ').slice(0, 16)
        : 'Never',
      createdAt: u.createdAt,
    }));
  }, [serverData]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        !searchQuery.trim() ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersList, searchQuery, roleFilter, statusFilter]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.password.length < 12) {
      showToast('Password must be at least 12 characters.', true);
      return;
    }
    setCreateLoading(true);
    try {
      await api('/users', {
        method: 'POST',
        body: {
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          role: createForm.role,
          password: createForm.password,
        },
      });
      showToast(`User ${createForm.name} created successfully in database`);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', email: '', role: 'SUPER_ADMIN', password: '' });
      await queryClient.invalidateQueries({ queryKey: ['platform-users-list'] });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Failed to create user';
      showToast(`Error: ${msg}`, true);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    setEditLoading(true);
    try {
      await api(`/users/${selectedUserForEdit.id}`, {
        method: 'PATCH',
        body: { role: editRoleForm },
      });
      showToast(`Updated access role for ${selectedUserForEdit.name}`);
      setSelectedUserForEdit(null);
      await queryClient.invalidateQueries({ queryKey: ['platform-users-list'] });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Failed to update access';
      showToast(`Error: ${msg}`, true);
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: PlatformUserItem) => {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api(`/users/${user.id}`, {
        method: 'PATCH',
        body: { isActive: newStatus === 'ACTIVE' },
      });
      showToast(newStatus === 'DISABLED' ? `Disabled ${user.name}` : `Re-enabled ${user.name}`);
      await queryClient.invalidateQueries({ queryKey: ['platform-users-list'] });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Failed to update status';
      showToast(`Error: ${msg}`, true);
    }
    setOpenMenuUserId(null);
  };

  const handleApplyPasswordReset = async () => {
    if (!selectedUserForPasswordReset) return;
    if (newPasswordValue.length < 12) {
      showToast('Password must be at least 12 characters.', true);
      return;
    }
    setResetLoading(true);
    try {
      await api(`/users/${selectedUserForPasswordReset.id}/reset-password`, {
        method: 'POST',
        body: { newPassword: newPasswordValue },
      });
      showToast(`Password reset successfully for ${selectedUserForPasswordReset.name}`);
      setSelectedUserForPasswordReset(null);
      await queryClient.invalidateQueries({ queryKey: ['platform-users-list'] });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Failed to reset password';
      showToast(`Error: ${msg}`, true);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-200 border ${toastMessage.isError
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] sm:text-3xl font-bold text-[#F2F4F7] tracking-tight leading-none">
            Platform users
          </h1>
          <p className="text-[12px] text-[#626C79] font-normal mt-1.5 flex items-center gap-2">
            <span>
              {isLoading ? 'Loading users from database...' : `${usersList.length} people with access`}
            </span>
            {isFetching && !isLoading && (
              <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateForm({
              name: '',
              email: '',
              role: 'SUPER_ADMIN',
              password: generatePassword(),
            });
            setIsCreateModalOpen(true);
          }}
          className="bg-[#F59E0B] hover:bg-[#D97706] text-[#07090D] font-semibold text-[12px] px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#07090D] stroke-[2.2]" />
          <span>Create user</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B101B] border border-[#1A2333] rounded-lg pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-[#0B101B] border border-[#1A2333] hover:bg-[#131B2A] text-text-[#626C79] hover:text-white p-2 rounded-lg transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRoleDropdownOpen(!roleDropdownOpen);
                setStatusDropdownOpen(false);
              }}
              className="bg-[#0B101B] border border-[#1A2333] hover:bg-[#131B2A] text-slate-300 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="font-sans">Role: {roleFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-[#0B101B] border border-[#222E42] rounded-lg shadow-2xl py-1 z-30 text-xs font-sans">
                {(['All', 'SUPER_ADMIN', 'SUPPORT'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRoleFilter(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#131B2A] ${roleFilter === r ? 'text-[#F59E0B] font-semibold' : 'text-slate-300'
                      }`}
                  >
                    <span>{r}</span>
                    {roleFilter === r && <Check className="w-3.5 h-3.5 text-[#F59E0B]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setStatusDropdownOpen(!statusDropdownOpen);
                setRoleDropdownOpen(false);
              }}
              className="bg-[#0B101B] border border-[#1A2333] hover:bg-[#131B2A] text-slate-300 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="font-sans">Status: {statusFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {statusDropdownOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-[#0B101B] border border-[#222E42] rounded-lg shadow-2xl py-1 z-30 text-xs font-sans">
                {(['All', 'ACTIVE', 'DISABLED'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatusFilter(s);
                      setStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#131B2A] ${statusFilter === s ? 'text-[#F59E0B] font-semibold' : 'text-slate-300'
                      }`}
                  >
                    <span>{s}</span>
                    {statusFilter === s && <Check className="w-3.5 h-3.5 text-[#F59E0B]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isError && (
        <div className="p-4 bg-[#1C1215] border border-[#EF4444]/40 rounded-xl flex items-center justify-between text-xs text-[#EF4444]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Failed to load platform users from database:{' '}
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

      <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#131A2B] text-[10px] font-mono text-[#626C79] font-bold tracking-wider uppercase select-none">
                <th className="py-3 px-5">USER</th>
                <th className="py-3 px-5">ROLE</th>
                <th className="py-3 px-5">STATUS</th>
                <th className="py-3 px-5">LAST ACTIVE</th>
                <th className="py-3 px-5 text-right w-16"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#131A2B] text-[13px]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="h-4 bg-[#141C2B] rounded w-36 mb-1.5" />
                      <div className="h-3 bg-[#101724] rounded w-48" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-5 bg-[#141C2B] rounded w-24" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-5 bg-[#141C2B] rounded w-16" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-3 bg-[#101724] rounded w-28" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-7 w-7 bg-[#141C2B] rounded inline-block" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#626C79] font-sans">
                    {searchQuery || roleFilter !== 'All' || statusFilter !== 'All'
                      ? 'No platform users matching your filters.'
                      : 'No platform users found in database.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isMenuOpen = openMenuUserId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#101625]/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedUserForDetail(user)}
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#F2F4F7] group-hover:text-[#F59E0B] transition-colors leading-tight">
                          {user.name}
                        </div>
                        <div className="font-mono text-[10px] text-[#626C79] mt-0.5">
                          {user.email}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {user.role === 'SUPER_ADMIN' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[12px] text-[#F2F4F7] border border-[#1A2333]/60 bg-[#131A28]">
                            SUPER_ADMIN
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[12px] font-medium text-[#F59E0B] border border-[#B45309] bg-[#78350F]/40">
                            SUPPORT
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {user.status === 'ACTIVE' ? (
                          <span className="inline-block px-2 py-0.5 rounded font-mono text-[12px] font-medium text-[#16A34A] border border-[#059669] bg-[#047857]/40">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded font-mono text-[12px] font-medium text-[#DC2626] border border-[#B91C1C] bg-[#991B1B]/40">
                            DISABLED
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 font-mono text-text-[#626C79] text-xs">
                        {user.lastActive}
                      </td>
                      <td
                        className="py-4 px-5 text-right relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuUserId(isMenuOpen ? null : user.id);
                          }}
                          className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors cursor-pointer ${isMenuOpen
                            ? 'bg-[#1C2638] text-white'
                            : 'text-text-[#626C79] hover:text-white hover:bg-[#131A28]'
                            }`}
                          title="User actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div
                            className="absolute right-5 mt-1 w-44 bg-[#0B101B] border border-[#222E42] rounded-lg shadow-2xl py-1 z-40 text-left text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForEdit(user);
                                setEditRoleForm(user.role);
                                setOpenMenuUserId(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-slate-200 hover:bg-[#131B2A] hover:text-white flex items-center gap-2 cursor-pointer"
                            >
                              <span>Edit access</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForPasswordReset(user);
                                setNewPasswordValue(generatePassword());
                                setOpenMenuUserId(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-slate-200 hover:bg-[#131B2A] hover:text-white flex items-center gap-2 cursor-pointer"
                            >
                              <span>Reset password</span>
                            </button>
                            <div className="border-t border-[#1F2B3E] my-1" />
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(user)}
                              className={`w-full text-left px-3.5 py-2 flex items-center gap-2 cursor-pointer ${user.status === 'ACTIVE'
                                ? 'text-[#EF4444] hover:bg-[#1C1417]'
                                : 'text-[#10B981] hover:bg-[#0D1C17]'
                                }`}
                            >
                              <span>{user.status === 'ACTIVE' ? 'Disable user' : 'Enable user'}</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-500 font-sans pl-1">
        Showing {filteredUsers.length} of {usersList.length} platform users · Access changes are recorded in the audit log.
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B101B] border border-[#222E42] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2333]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#F59E0B]" />
                <span>Create Platform User</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-text-[#626C79] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rachel Adams"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Platform Email</label>
                <input
                  type="email"
                  placeholder="name@ebenchcampus.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Platform Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, role: e.target.value as PlatformRole })
                  }
                  className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full platform permissions)</option>
                  <option value="SUPPORT">SUPPORT (Read-only impersonation & diagnostics)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">Initial Password</label>
                  <button
                    type="button"
                    onClick={() =>
                      setCreateForm({ ...createForm, password: generatePassword() })
                    }
                    className="text-[#F59E0B] hover:underline font-mono text-[11px] cursor-pointer"
                  >
                    Generate secure
                  </button>
                </div>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={12}
                  className="w-full bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1A2333]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#0E1523] border border-[#23334D] rounded-lg text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#07090D] font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  {createLoading ? 'Creating in DB…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B101B] border border-[#222E42] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2333]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#F59E0B]" />
                <span>Edit User Access</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserForEdit(null)}
                className="text-text-[#626C79] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccess} className="space-y-4 text-xs">
              <div>
                <span className="text-text-[#626C79]">User</span>
                <div className="font-semibold text-white text-sm mt-0.5">
                  {selectedUserForEdit.name}
                </div>
                <div className="font-mono text-slate-500 text-[11px]">
                  {selectedUserForEdit.email}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Assigned Role</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-[#23334D] bg-[#0E1523] cursor-pointer hover:border-[#F59E0B]">
                    <input
                      type="radio"
                      name="editRole"
                      value="SUPER_ADMIN"
                      checked={editRoleForm === 'SUPER_ADMIN'}
                      onChange={() => setEditRoleForm('SUPER_ADMIN')}
                      className="mt-0.5 text-[#F59E0B] accent-[#F59E0B]"
                    />
                    <div>
                      <div className="font-semibold text-white">SUPER_ADMIN</div>
                      <div className="text-[11px] text-text-[#626C79] mt-0.5">
                        Unrestricted platform access: create orgs, edit billing plans, manage platform staff, and audit system events.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-[#23334D] bg-[#0E1523] cursor-pointer hover:border-[#F59E0B]">
                    <input
                      type="radio"
                      name="editRole"
                      value="SUPPORT"
                      checked={editRoleForm === 'SUPPORT'}
                      onChange={() => setEditRoleForm('SUPPORT')}
                      className="mt-0.5 text-[#F59E0B] accent-[#F59E0B]"
                    />
                    <div>
                      <div className="font-semibold text-white">SUPPORT</div>
                      <div className="text-[11px] text-text-[#626C79] mt-0.5">
                        Read-only tenant investigations, viewing organization telemetry, and diagnostic logs. Cannot mutate tenant state.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1A2333]">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2 bg-[#0E1523] border border-[#23334D] rounded-lg text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  {editLoading ? 'Saving in DB…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedUserForPasswordReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B101B] border border-[#222E42] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2333]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F59E0B]" />
                <span>Reset Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserForPasswordReset(null)}
                className="text-text-[#626C79] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Generate a new password for{' '}
              <span className="text-white font-semibold">{selectedUserForPasswordReset.name}</span> (
              {selectedUserForPasswordReset.email}). This will immediately update the database and invalidate active sessions.
            </p>

            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <label className="text-slate-300 font-medium">New Password</label>
                <button
                  type="button"
                  onClick={() => setNewPasswordValue(generatePassword())}
                  className="text-[#F59E0B] hover:underline font-mono text-[11px] cursor-pointer"
                >
                  Regenerate
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="flex-1 bg-[#0E1523] border border-[#23334D] rounded-lg px-3.5 py-2 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newPasswordValue);
                    showToast('Copied password to clipboard');
                  }}
                  className="p-2 bg-[#0E1523] border border-[#23334D] rounded-lg text-slate-300 hover:text-white cursor-pointer"
                  title="Copy password"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1A2333]">
              <button
                type="button"
                onClick={() => setSelectedUserForPasswordReset(null)}
                className="px-4 py-2 bg-[#0E1523] border border-[#23334D] text-xs text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetLoading}
                onClick={handleApplyPasswordReset}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-xs font-semibold text-black rounded-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                {resetLoading ? 'Updating DB…' : 'Apply Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B101B] border border-[#222E42] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2333]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 flex items-center justify-center font-bold text-sm">
                  {selectedUserForDetail.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white leading-tight">
                    {selectedUserForDetail.name}
                  </h3>
                  <span className="font-mono text-xs text-text-[#626C79]">
                    {selectedUserForDetail.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForDetail(null)}
                className="text-text-[#626C79] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-text-[#626C79]">User ID</span>
                <span className="font-mono text-[11px] text-slate-300 flex items-center gap-2">
                  <span>{selectedUserForDetail.id}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedUserForDetail.id);
                      showToast('Copied ID to clipboard');
                    }}
                    className="text-slate-500 hover:text-slate-300 cursor-pointer"
                    title="Copy ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-text-[#626C79]">Status</span>
                <span
                  className={`font-mono px-2 py-0.5 rounded text-[11px] font-semibold ${selectedUserForDetail.status === 'ACTIVE'
                    ? 'text-[#10B981] bg-[#064E3B]/40 border border-[#065F46]'
                    : 'text-[#EF4444] bg-[#7F1D1D]/40 border border-[#991B1B]'
                    }`}
                >
                  {selectedUserForDetail.status}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-text-[#626C79]">Role</span>
                <span className="font-mono text-slate-200">
                  {selectedUserForDetail.role}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-text-[#626C79]">Last Active Session</span>
                <span className="font-mono text-slate-300">
                  {selectedUserForDetail.lastActive}
                </span>
              </div>

              {selectedUserForDetail.createdAt && (
                <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                  <span className="text-text-[#626C79]">Account Created</span>
                  <span className="font-mono text-text-[#626C79]">
                    {new Date(selectedUserForDetail.createdAt).toISOString().replace('T', ' ').slice(0, 16)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-text-[#626C79]">MFA / 2FA Status</span>
                <span className="font-mono text-[#10B981]">
                  Enforced (Hardware TOTP)
                </span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1A2333]">
              <button
                type="button"
                onClick={() => {
                  const u = selectedUserForDetail;
                  setSelectedUserForDetail(null);
                  setSelectedUserForEdit(u);
                  setEditRoleForm(u.role);
                }}
                className="px-4 py-2 bg-[#0E1523] border border-[#23334D] text-xs text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                Edit Access
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserForDetail(null)}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-xs font-semibold text-black rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
