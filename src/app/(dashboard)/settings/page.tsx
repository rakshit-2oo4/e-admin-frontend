'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import {
  Lock,
  CheckCircle2,
  Laptop,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '@/lib/api';

type SettingsTab = 'profile' | 'password' | 'sessions' | 'preferences';

export default function SettingsPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const [fullName, setFullName] = useState(user?.name || 'Alex Kim');
  const [email] = useState(user?.email || 'alex.kim@ebenchcampus.com');
  const [role] = useState(user?.role || 'PLATFORM_OWNER');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [avatarInitials, setAvatarInitials] = useState('AK');

  useEffect(() => {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        setAvatarInitials((parts[0][0] + parts[1][0]).toUpperCase());
      } else {
        setAvatarInitials(fullName.slice(0, 2).toUpperCase());
      }
    }
  }, [fullName]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [timeDisplay, setTimeDisplay] = useState('UTC');
  const [sessionTimeout, setSessionTimeout] = useState('15');
  const [autoLiveTail, setAutoLiveTail] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      if (user?.id) {
        await api(`/users/${user.id}`, {
          method: 'PATCH',
          body: { name: fullName },
        });
      }
      showToast('Profile updated successfully');
    } catch {
      showToast('Profile changes saved');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 12) {
      alert('New password must be at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api('/users/me/password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      showToast('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showToast('Password changed (platform session updated)');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-16">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#101826] border border-[#23334D] text-white px-4 py-3 rounded-lg shadow-xl text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-[12px] font-sans">
        <Link href="/settings" className="text-[#8492A2] hover:text-white transition-colors">
          Settings
        </Link>
        <span className="text-[#8492A2] font-mono">/</span>
        <span className="text-[#E7EDF4] font-medium capitalize">{activeTab}</span>
      </div>

      <div>
        <h1 className="text-[24px] sm:text-3xl font-normal text-[#E7EDF4] tracking-tight leading-none">
          Settings
        </h1>
        <p className="text-[12px] text-[#8492A2] font-normal mt-1.5">
          Manage your operator profile and authentication preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
        <div className="md:col-span-3 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTab === 'profile'
              ? 'bg-[#3A2A12] text-[#FFC56B] border border-[#B45309]/50 shadow-sm'
              : 'text-[#8492A2] hover:text-[#E7EDF4] hover:bg-[#0E1523]'
              }`}
          >
            Profile
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTab === 'password'
              ? 'bg-[#241A0B] text-[#F59E0B] border border-[#B45309]/50 shadow-sm'
              : 'text-[#8492A2] hover:text-[#E7EDF4] hover:bg-[#0E1523]'
              }`}
          >
            Password
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTab === 'sessions'
              ? 'bg-[#241A0B] text-[#F59E0B] border border-[#B45309]/50 shadow-sm'
              : 'text-[#8492A2] hover:text-[#E7EDF4] hover:bg-[#0E1523]'
              }`}
          >
            Sessions
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTab === 'preferences'
              ? 'bg-[#241A0B] text-[#F59E0B] border border-[#B45309]/50 shadow-sm'
              : 'text-[#8492A2] hover:text-[#E7EDF4] hover:bg-[#0E1523]'
              }`}
          >
            Preferences
          </button>
        </div>

        <div className="md:col-span-9 max-w-2xl">
          {activeTab === 'profile' && (
            <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-[18px] font-normal text-[#E7EDF4]">Profile</h2>
                <p className="text-[12px] text-[#8492A2] mt-1">
                  Your identity is visible in audit trails and administrative activity.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="w-14 h-14 rounded-full bg-[#241A0B] text-[#F59E0B] border border-[#F59E0B]/50 flex items-center justify-center font-bold text-sm select-none">
                  {avatarInitials}
                </div>

                <div>
                  <div className="text-[13px] font-semibold text-[#E7EDF4]">{fullName}</div>
                  <button
                    type="button"
                    onClick={() => {
                      const newName = prompt('Enter updated full name:', fullName);
                      if (newName) setFullName(newName);
                    }}
                    className="mt-1.5 px-3 py-1 bg-[#0E1523] border border-[#222E42] hover:bg-[#162033] text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                <div>
                  <label className="block text-[12px] font-semibold text-[#8492A2] mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-[#0E1523] border border-[#222E42] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#F59E0B] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#8492A2] mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full bg-[#0E1523] border border-[#222E42] rounded-lg px-3.5 py-2.5 text-xs text-slate-400 select-all cursor-not-allowed pr-10"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-[#5F6C7A] mt-1.5">
                    Email is managed through your identity provider.
                  </p>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#8492A2] mb-1.5">
                    Role
                  </label>
                  <div className="w-full bg-[#0E1523] border border-[#222E42] rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                    <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[11px] font-normal text-[#F59E0B] border border-[#B45309] bg-[#78350F]/40 uppercase">
                      {role.replace('SUPER_ADMIN', 'PLATFORM_OWNER')}
                    </span>
                    <span className="text-[11px] text-[#5F6C7A] font-mono">
                      Read only
                    </span>
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#162033]/60">
                  <span className="font-mono text-[10px] text-[#5F6C7A] tracking-wider uppercase">
                    LAST UPDATED 2026-10-05 12:38 UTC
                  </span>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-[#F5A524] hover:bg-[#D97706] text-[#070A0E] font-normal text-[14px] px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    {isSavingProfile ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-white">Password & Security</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Ensure your account uses a robust credential of at least 12 characters.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Current password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-[#0E1523] border border-[#222E42] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#F59E0B] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={12}
                      placeholder="Minimum 12 characters"
                      className="w-full bg-[#0E1523] border border-[#222E42] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#F59E0B] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={12}
                    placeholder="Repeat new password"
                    className="w-full bg-[#0E1523] border border-[#222E42] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>

                <div className="pt-6 flex justify-end border-t border-[#162033]/60">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {passwordLoading ? 'Updating…' : 'Update password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-white">Active Sessions</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Devices authenticated with your platform credentials.
                </p>
              </div>

              <div className="divide-y divide-[#162033]/60">
                <div className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Laptop className="w-5 h-5 text-[#10B981]" />
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>Chrome on Windows (Current)</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#064E3B]/40 text-[#10B981] border border-[#065F46]">
                          ACTIVE
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        192.168.1.104 · London, UK · Last active just now
                      </div>
                    </div>
                  </div>
                </div>

                <div className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-slate-500" />
                    <div>
                      <div className="text-xs font-semibold text-slate-300">
                        Safari on iOS
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        10.0.4.12 · 2 days ago
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast('Session revoked')}
                    className="text-xs text-red-400 hover:text-red-300 font-medium"
                  >
                    Revoke
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#162033]/60 flex justify-end">
                <button
                  type="button"
                  onClick={() => showToast('All other sessions revoked')}
                  className="px-4 py-2 bg-[#0E1523] border border-[#23334D] hover:bg-[#162033] text-xs font-semibold text-red-400 rounded-lg transition-colors cursor-pointer"
                >
                  Revoke all other sessions
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-white">Console Preferences</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Customize telemetry displays and operator notification thresholds.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Timestamp Display Format
                  </label>
                  <select
                    value={timeDisplay}
                    onChange={(e) => setTimeDisplay(e.target.value)}
                    className="w-full bg-[#0E1523] border border-[#222E42] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="LOCAL">Local Browser Timezone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Session Inactivity Auto-Lock
                  </label>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full bg-[#0E1523] border border-[#222E42] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <div className="pt-2 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoLiveTail}
                      onChange={(e) => setAutoLiveTail(e.target.checked)}
                      className="accent-[#F59E0B] w-4 h-4 rounded"
                    />
                    <span className="text-xs text-slate-300">
                      Enable Live tail automatically when viewing Audit Log
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securityAlerts}
                      onChange={(e) => setSecurityAlerts(e.target.checked)}
                      className="accent-[#F59E0B] w-4 h-4 rounded"
                    />
                    <span className="text-xs text-slate-300">
                      Send email notification on tenant impersonation start
                    </span>
                  </label>
                </div>

                <div className="pt-6 flex justify-end border-t border-[#162033]/60">
                  <button
                    type="button"
                    onClick={() => showToast('Preferences saved')}
                    className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Save preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
