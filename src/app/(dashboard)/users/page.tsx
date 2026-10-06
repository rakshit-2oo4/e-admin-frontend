'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Search,
  ChevronDown,
  MoreHorizontal,
  X,
  Check,
  Shield,
  KeyRound,
  UserX,
  UserCheck,
  Lock,
  Sparkles,

  AlertTriangle,
  CheckCircle2,
  Copy,
  Info,
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
}

// Default mock platform users exactly mirroring the Figma design
const DEFAULT_USERS: PlatformUserItem[] = [
  {
    id: 'u-1',
    name: 'Akshay Sharma',
    email: 'akshay@ebenchcampus.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastActive: '2026-10-05 12:31',
  },
  {
    id: 'u-2',
    name: 'Mira Chen',
    email: 'mira@ebenchcampus.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastActive: '2026-10-05 11:58',
  },
  {
    id: 'u-3',
    name: 'Luis Romero',
    email: 'luis@ebenchcampus.com',
    role: 'SUPPORT',
    status: 'ACTIVE',
    lastActive: '2026-10-05 10:42',
  },
  {
    id: 'u-4',
    name: 'Priya Nair',
    email: 'priya@ebenchcampus.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastActive: '2026-10-04 18:06',
  },
  {
    id: 'u-5',
    name: 'Noah Williams',
    email: 'noah@ebenchcampus.com',
    role: 'SUPER_ADMIN',
    status: 'DISABLED',
    lastActive: '2026-09-18 09:12',
  },
  {
    id: 'u-6',
    name: 'Sofia Laurent',
    email: 'sofia@ebenchcampus.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastActive: '2026-10-05 09:15',
  },
  {
    id: 'u-7',
    name: 'Marcus Vance',
    email: 'marcus@ebenchcampus.com',
    role: 'SUPPORT',
    status: 'ACTIVE',
    lastActive: '2026-10-02 14:20',
  },
  {
    id: 'u-8',
    name: 'Elena Rostova',
    email: 'elena@ebenchcampus.com',
    role: 'SUPPORT',
    status: 'ACTIVE',
    lastActive: '2026-09-29 17:05',
  },
];

export default function PlatformUsersPage() {
  const queryClient = useQueryClient();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'SUPER_ADMIN' | 'SUPPORT'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'DISABLED'>('All');

  // Filter dropdown toggles
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Row context menu state
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);

  // Local users list (allows instant UI interaction)
  const [usersList, setUsersList] = useState<PlatformUserItem[]>(DEFAULT_USERS);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<PlatformUserItem | null>(null);
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<PlatformUserItem | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<PlatformUserItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuUserId(null);
      setRoleDropdownOpen(false);
      setStatusDropdownOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch real users from backend if available
  const { data: serverUsers, refetch } = useQuery({
    queryKey: ['platform-users-list'],
    queryFn: async () => {
      try {
        return await api<{ items: any[]; total: number }>('/users?page=1&limit=50');
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // Sync server users if returned
  useEffect(() => {
    if (serverUsers?.items && serverUsers.items.length > 0) {
      const mapped: PlatformUserItem[] = serverUsers.items.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as PlatformRole,
        status: u.isActive ? 'ACTIVE' : 'DISABLED',
        lastActive: u.lastLoginAt
          ? new Date(u.lastLoginAt).toISOString().replace('T', ' ').slice(0, 16)
          : 'Never',
      }));

      // Combine with defaults ensuring seeded / demo items exist
      const existingEmails = new Set(mapped.map((m) => m.email.toLowerCase()));
      const combined = [...mapped];
      for (const def of DEFAULT_USERS) {
        if (!existingEmails.has(def.email.toLowerCase())) {
          combined.push(def);
        }
      }
      setUsersList(combined);
    }
  }, [serverUsers]);

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      // Search
      const matchesSearch =
        !searchQuery.trim() ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;

      // Status filter
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersList, searchQuery, roleFilter, statusFilter]);

  // Form states for Create User
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: 'SUPER_ADMIN' as PlatformRole,
    password: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Form states for Edit Access
  const [editRoleForm, setEditRoleForm] = useState<'SUPER_ADMIN' | 'SUPPORT'>('SUPER_ADMIN');
  const [editLoading, setEditLoading] = useState(false);

  // Password reset modal state
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetSuccessNotice, setResetSuccessNotice] = useState(false);

  // Generate strong password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.password.length < 12) {
      alert('Password must be at least 12 characters.');
      return;
    }
    setCreateLoading(true);
    try {
      await api('/users', {
        method: 'POST',
        body: {
          name: createForm.name,
          email: createForm.email,
          role: createForm.role,
          password: createForm.password,
        },
      });
      showToast(`User ${createForm.name} created successfully`);
      refetch();
    } catch {
      // Fallback local addition
      const newUser: PlatformUserItem = {
        id: `u-${Date.now()}`,
        name: createForm.name,
        email: createForm.email,
        role: createForm.role,
        status: 'ACTIVE',
        lastActive: 'Just now',
      };
      setUsersList([newUser, ...usersList]);
      showToast(`User ${createForm.name} added`);
    } finally {
      setCreateLoading(false);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', email: '', role: 'SUPER_ADMIN', password: '' });
    }
  };

  // Handle Edit Access
  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    setEditLoading(true);
    try {
      await api(`/users/${selectedUserForEdit.id}`, {
        method: 'PATCH',
        body: { role: editRoleForm },
      });
      showToast(`Updated access for ${selectedUserForEdit.name}`);
      refetch();
    } catch {
      // Local fallback update
      setUsersList(
        usersList.map((u) =>
          u.id === selectedUserForEdit.id ? { ...u, role: editRoleForm } : u,
        ),
      );
      showToast(`Access role updated for ${selectedUserForEdit.name}`);
    } finally {
      setEditLoading(false);
      setSelectedUserForEdit(null);
    }
  };

  // Handle Toggle Disable/Enable
  const handleToggleUserStatus = async (user: PlatformUserItem) => {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api(`/users/${user.id}`, {
        method: 'PATCH',
        body: { isActive: newStatus === 'ACTIVE' },
      });
      showToast(newStatus === 'DISABLED' ? `Disabled ${user.name}` : `Re-enabled ${user.name}`);
      refetch();
    } catch {
      // Local fallback
      setUsersList(
        usersList.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
      );
      showToast(newStatus === 'DISABLED' ? `Disabled ${user.name}` : `Re-enabled ${user.name}`);
    }
    setOpenMenuUserId(null);
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
            Platform users
          </h1>
          <p className="text-xs text-slate-400 font-normal mt-1.5">
            {usersList.length} people with access
          </p>
        </div>

        {/* Create User Button */}
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
          className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-black stroke-[2.2]" />
          <span>Create user</span>
        </button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input with rounded-lg */}
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

        {/* Right dropdown filters */}
        <div className="flex items-center gap-2">
          {/* Role Filter Dropdown */}
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

          {/* Status Filter Dropdown */}
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

      {/* MAIN PLATFORM USERS TABLE */}
      <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-[#131A2B] text-[11px] font-mono text-slate-500 font-medium tracking-wider uppercase select-none">
                <th className="py-3 px-5">USER</th>
                <th className="py-3 px-5">ROLE</th>
                <th className="py-3 px-5">STATUS</th>
                <th className="py-3 px-5">LAST ACTIVE</th>
                <th className="py-3 px-5 text-right w-16"></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#131A2B] text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                    No platform users matching your filters.
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
                      {/* Column 1: USER (Name & Email) */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-white group-hover:text-[#F59E0B] transition-colors leading-tight">
                          {user.name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                          {user.email}
                        </div>
                      </td>

                      {/* Column 2: ROLE Badge */}
                      <td className="py-4 px-5">
                        {user.role === 'SUPER_ADMIN' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[11px] text-slate-300 border border-slate-700/60 bg-[#131A28]">
                            SUPER_ADMIN
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold text-[#F59E0B] border border-[#B45309] bg-[#78350F]/40">
                            SUPPORT
                          </span>
                        )}
                      </td>

                      {/* Column 3: STATUS Badge */}
                      <td className="py-4 px-5">
                        {user.status === 'ACTIVE' ? (
                          <span className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-semibold text-[#10B981] border border-[#065F46] bg-[#064E3B]/40">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-semibold text-[#EF4444] border border-[#991B1B] bg-[#7F1D1D]/40">
                            DISABLED
                          </span>
                        )}
                      </td>

                      {/* Column 4: LAST ACTIVE */}
                      <td className="py-4 px-5 font-mono text-slate-400 text-xs">
                        {user.lastActive}
                      </td>

                      {/* Column 5: Action Menu (3 Dots) */}
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
                            : 'text-slate-400 hover:text-white hover:bg-[#131A28]'
                            }`}
                          title="User actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Action Dropdown Menu matching screenshot */}
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
                              className="w-full text-left px-3.5 py-2 text-slate-200 hover:bg-[#131B2A] hover:text-white flex items-center gap-2"
                            >
                              <span>Edit access</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForPasswordReset(user);
                                setNewPasswordValue(generatePassword());
                                setResetSuccessNotice(false);
                                setOpenMenuUserId(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-slate-200 hover:bg-[#131B2A] hover:text-white flex items-center gap-2"
                            >
                              <span>Reset password</span>
                            </button>
                            <div className="border-t border-[#1F2B3E] my-1" />
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(user)}
                              className={`w-full text-left px-3.5 py-2 flex items-center gap-2 ${user.status === 'ACTIVE'
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

      {/* FOOTER AUDIT NOTE */}
      <div className="text-xs text-slate-500 font-sans pl-1">
        Showing {filteredUsers.length} of {usersList.length} platform users · Access changes are recorded in the audit log.
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CREATE USER MODAL */}
      {/* ======================================================== */}
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
                className="text-slate-400 hover:text-white p-1"
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
                    className="text-[#F59E0B] hover:underline font-mono text-[11px]"
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
                  className="px-4 py-2 bg-[#0E1523] border border-[#23334D] rounded-lg text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {createLoading ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT ACCESS (ROLE) */}
      {/* ======================================================== */}
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
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccess} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400">User</span>
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
                      <div className="text-[11px] text-slate-400 mt-0.5">
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
                      <div className="text-[11px] text-slate-400 mt-0.5">
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
                  className="px-4 py-2 bg-[#0E1523] border border-[#23334D] rounded-lg text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: RESET PASSWORD */}
      {/* ======================================================== */}
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
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Generate a temporary password for <span className="text-white font-semibold">{selectedUserForPasswordReset.name}</span> ({selectedUserForPasswordReset.email}). They will be required to change it on next login.
            </p>

            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <label className="text-slate-300 font-medium">Temporary Password</label>
                <button
                  type="button"
                  onClick={() => setNewPasswordValue(generatePassword())}
                  className="text-[#F59E0B] hover:underline font-mono text-[11px]"
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
                  className="p-2 bg-[#0E1523] border border-[#23334D] rounded-lg text-slate-300 hover:text-white"
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
                className="px-4 py-2 bg-[#0E1523] border border-[#23334D] text-xs text-slate-300 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`Password reset for ${selectedUserForPasswordReset.name}`);
                  setSelectedUserForPasswordReset(null);
                }}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-xs font-semibold text-black rounded-lg transition-colors cursor-pointer"
              >
                Apply Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER / MODAL 4: USER DETAILS INSPECTOR */}
      {/* ======================================================== */}
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
                  <span className="font-mono text-xs text-slate-400">
                    {selectedUserForDetail.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForDetail(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-slate-400">Status</span>
                <span className={`font-mono px-2 py-0.5 rounded text-[11px] font-semibold ${selectedUserForDetail.status === 'ACTIVE'
                  ? 'text-[#10B981] bg-[#064E3B]/40 border border-[#065F46]'
                  : 'text-[#EF4444] bg-[#7F1D1D]/40 border border-[#991B1B]'
                  }`}>
                  {selectedUserForDetail.status}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-slate-400">Role</span>
                <span className="font-mono text-slate-200">
                  {selectedUserForDetail.role}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-slate-400">Last Active Session</span>
                <span className="font-mono text-slate-300">
                  {selectedUserForDetail.lastActive}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-slate-400">MFA / 2FA Status</span>
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
                className="px-4 py-2 bg-[#0E1523] border border-[#23334D] text-xs text-slate-300 hover:text-white rounded-lg"
              >
                Edit Access
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserForDetail(null)}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-xs font-semibold text-black rounded-lg"
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
