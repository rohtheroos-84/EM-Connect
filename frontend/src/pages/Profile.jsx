import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getCurrentUser,
  updateProfile,
  changePassword,
  uploadAvatar,
  getMyRegistrations,
  getMyTickets,
} from '../services/api';
import AppLayout from '../components/AppLayout';
import {
  User,
  Mail,
  Shield,
  CalendarDays,
  Pencil,
  KeyRound,
  Camera,
  Loader2,
  Check,
  AlertCircle,
  Ticket,
  ClipboardList,
  BarChart3,
  X,
} from 'lucide-react';

const API_BASE = '/api';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function Profile() {
  const { user, refreshUser } = useAuth();

  /* ── Profile data ── */
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── Edit name ── */
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);

  /* ── Change password ── */
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  /* ── Avatar ── */
  const fileRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);

  /* ── Registration stats ── */
  const [stats, setStats] = useState({
    totalRegs: 0,
    activeRegs: 0,
    cancelledRegs: 0,
    tickets: 0,
  });

  /* ── Load profile + stats ── */
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, regData, allRegData, ticketData] = await Promise.all([
        getCurrentUser(),
        getMyRegistrations(0, 1, true).catch(() => ({ totalElements: 0 })),
        getMyRegistrations(0, 1, false).catch(() => ({ totalElements: 0 })),
        getMyTickets().catch(() => []),
      ]);
      setProfile(userData);
      setNameValue(userData.name || '');
      setStats({
        totalRegs: allRegData.totalElements || 0,
        activeRegs: regData.totalElements || 0,
        cancelledRegs: (allRegData.totalElements || 0) - (regData.totalElements || 0),
        tickets: Array.isArray(ticketData) ? ticketData.length : 0,
      });
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /* ── Avatar URL helper ── */
  const avatarSrc = profile?.avatarUrl
    ? `${API_BASE}/${profile.avatarUrl.replace(/^avatars\//, 'users/avatars/')}`
    : null;

  /* ── Save name ── */
  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed.length < 2) {
      setNameMsg({ type: 'error', text: 'Name must be at least 2 characters' });
      return;
    }
    setNameSaving(true);
    setNameMsg(null);
    try {
      const updated = await updateProfile({ name: trimmed });
      setProfile(updated);
      await refreshUser();
      setEditingName(false);
      setNameMsg({ type: 'success', text: 'Name updated' });
      setTimeout(() => setNameMsg(null), 3000);
    } catch (err) {
      setNameMsg({ type: 'error', text: err.message || 'Failed to update name' });
    } finally {
      setNameSaving(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);

    if (pwNew.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setPwSaving(true);
    try {
      await changePassword({ currentPassword: pwCurrent, newPassword: pwNew });
      setPwMsg({ type: 'success', text: 'Password changed successfully' });
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
      setTimeout(() => {
        setShowPwForm(false);
        setPwMsg(null);
      }, 2000);
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setPwSaving(false);
    }
  };

  /* ── Avatar upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarMsg(null);
    setAvatarUploading(true);

    try {
      const updated = await uploadAvatar(file);
      setProfile(updated);
      await refreshUser();
      setAvatarMsg({ type: 'success', text: 'Avatar updated' });
      setTimeout(() => setAvatarMsg(null), 3000);
    } catch (err) {
      setAvatarMsg({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-bauhaus-blue animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="pb-4 border-b border-[#1F2937]/20">
          <p className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">
            Account
          </p>
          <h1 className="text-2xl font-black text-bauhaus-fg tracking-tight uppercase mt-1">
            My Profile
          </h1>
        </div>

        {/* ── Avatar + Identity card ── */}
        <div className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden">
          <div className="h-0.75 bg-bauhaus-blue" />
          <div className="p-6 flex flex-col sm:flex-row items-start gap-6">

            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 bg-bauhaus-bg border-2 border-[#1F2937]/20 overflow-hidden flex items-center justify-center">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    key={avatarSrc}
                  />
                ) : (
                  <User className="w-10 h-10 text-bauhaus-fg/20" />
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-bauhaus-fg/40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-bauhaus-blue text-white flex items-center justify-center hover:bg-bauhaus-blue/80 transition-colors cursor-pointer disabled:opacity-50"
                title="Change avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-3 w-full">
              {/* Name row */}
              <div>
                <label className="text-[10px] font-bold text-bauhaus-fg/35 uppercase tracking-wider block mb-1">
                  Name
                </label>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="h-10 px-3 border border-[#1F2937]/30 bg-bauhaus-bg text-bauhaus-fg text-sm font-medium flex-1 focus:outline-none focus:border-bauhaus-blue"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={nameSaving}
                      className="h-10 px-3 bg-bauhaus-blue text-white text-xs font-bold uppercase tracking-wider hover:bg-bauhaus-blue/80 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {nameSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingName(false);
                        setNameValue(profile?.name || '');
                        setNameMsg(null);
                      }}
                      className="h-10 px-3 bg-bauhaus-bg border border-[#1F2937]/20 text-bauhaus-fg text-xs hover:bg-bauhaus-bg/60 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-bauhaus-fg">{profile?.name || '—'}</span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="p-1 text-bauhaus-fg/30 hover:text-bauhaus-blue transition-colors cursor-pointer"
                      title="Edit name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {nameMsg && <Msg msg={nameMsg} />}
              </div>

              {/* Email */}
              <InfoRow icon={Mail} label="Email" value={profile?.email || '—'} />
              {/* Role */}
              <InfoRow
                icon={Shield}
                label="Role"
                value={
                  <span className="px-2 py-0.5 bg-bauhaus-yellow text-bauhaus-fg text-[10px] font-bold uppercase tracking-wider">
                    {profile?.role || 'USER'}
                  </span>
                }
              />
              {/* Member since */}
              <InfoRow icon={CalendarDays} label="Member since" value={fmtDate(profile?.createdAt)} />
            </div>
          </div>
          {avatarMsg && (
            <div className="px-6 pb-4">
              <Msg msg={avatarMsg} />
            </div>
          )}
        </div>

        {/* ── Registration History Stats ── */}
        <div className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden">
          <div className="h-0.75 bg-bauhaus-red" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-bauhaus-red" />
              <h2 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">
                Registration History
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MiniStat
                icon={<ClipboardList className="w-3.5 h-3.5" />}
                label="Total"
                value={stats.totalRegs}
                accent="#D02020"
              />
              <MiniStat
                icon={<Check className="w-3.5 h-3.5" />}
                label="Active"
                value={stats.activeRegs}
                accent="#16A34A"
              />
              <MiniStat
                icon={<X className="w-3.5 h-3.5" />}
                label="Cancelled"
                value={stats.cancelledRegs}
                accent="#9CA3AF"
              />
              <MiniStat
                icon={<Ticket className="w-3.5 h-3.5" />}
                label="Tickets"
                value={stats.tickets}
                accent="#F0C020"
              />
            </div>

            {/* Visual bar */}
            {stats.totalRegs > 0 && (
              <div className="mt-4">
                <div className="text-[10px] text-bauhaus-fg/35 font-bold uppercase tracking-wider mb-1.5">
                  Distribution
                </div>
                <div className="h-3 bg-bauhaus-bg flex overflow-hidden border border-[#1F2937]/10">
                  {stats.activeRegs > 0 && (
                    <div
                      className="h-full bg-[#16A34A] transition-all duration-500"
                      style={{ width: `${(stats.activeRegs / stats.totalRegs) * 100}%` }}
                      title={`Active: ${stats.activeRegs}`}
                    />
                  )}
                  {stats.cancelledRegs > 0 && (
                    <div
                      className="h-full bg-[#9CA3AF] transition-all duration-500"
                      style={{ width: `${(stats.cancelledRegs / stats.totalRegs) * 100}%` }}
                      title={`Cancelled: ${stats.cancelledRegs}`}
                    />
                  )}
                </div>
                <div className="flex gap-4 mt-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] text-bauhaus-fg/40">
                    <span className="w-2.5 h-2.5 bg-[#16A34A]" /> Active
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-bauhaus-fg/40">
                    <span className="w-2.5 h-2.5 bg-[#9CA3AF]" /> Cancelled
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Security — Change Password ── */}
        <div className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden">
          <div className="h-0.75 bg-bauhaus-yellow" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-bauhaus-yellow" />
                <h2 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em]">
                  Security
                </h2>
              </div>
              {!showPwForm && (
                <button
                  onClick={() => {
                    setShowPwForm(true);
                    setPwMsg(null);
                  }}
                  className="text-[11px] font-bold text-bauhaus-blue uppercase tracking-wider hover:underline cursor-pointer"
                >
                  Change Password
                </button>
              )}
            </div>

            {showPwForm ? (
              <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                <PwInput
                  label="Current Password"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  placeholder="Enter current password"
                />
                <PwInput
                  label="New Password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  placeholder="Min. 6 characters"
                />
                <PwInput
                  label="Confirm New Password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  match={pwNew && pwConfirm ? pwNew === pwConfirm : null}
                />
                {pwMsg && <Msg msg={pwMsg} />}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}
                    className="h-10 px-5 bg-bauhaus-yellow text-bauhaus-fg text-xs font-bold uppercase tracking-wider hover:bg-bauhaus-yellow/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {pwSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Update Password'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPwForm(false);
                      setPwCurrent('');
                      setPwNew('');
                      setPwConfirm('');
                      setPwMsg(null);
                    }}
                    className="h-10 px-4 border border-[#1F2937]/20 text-bauhaus-fg text-xs font-bold uppercase tracking-wider hover:bg-bauhaus-bg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-bauhaus-fg/40">
                Password last changed: unknown. It's recommended to update your password regularly.
              </p>
            )}
          </div>
        </div>

        {/* ── Account Info ── */}
        <div className="bg-bauhaus-white/80 border border-[#1F2937]/20 overflow-hidden">
          <div className="h-0.75 bg-bauhaus-fg/20" />
          <div className="p-6">
            <h2 className="text-[11px] font-bold text-bauhaus-fg/35 uppercase tracking-[0.15em] mb-3">
              Account Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[10px] font-bold text-bauhaus-fg/30 uppercase tracking-wider">User ID</span>
                <p className="text-bauhaus-fg font-mono text-xs mt-0.5">{profile?.id || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-bauhaus-fg/30 uppercase tracking-wider">Account Type</span>
                <p className="text-bauhaus-fg text-xs font-medium mt-0.5">{profile?.role === 'ADMIN' ? 'Administrator' : 'Standard User'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ── Sub-components ── */

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-bauhaus-fg/35 uppercase tracking-wider flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <div className="text-sm text-bauhaus-fg font-medium">{value}</div>
    </div>
  );
}

function MiniStat({ icon, label, value, accent }) {
  return (
    <div className="bg-bauhaus-bg/60 border border-[#1F2937]/10 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div
          className="w-5 h-5 flex items-center justify-center text-white"
          style={{ backgroundColor: accent }}
        >
          {icon}
        </div>
        <span className="text-[10px] font-bold text-bauhaus-fg/35 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black text-bauhaus-fg tracking-tight leading-none">{value}</p>
    </div>
  );
}

function Msg({ msg }) {
  const isErr = msg.type === 'error';
  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium mt-1.5 ${
        isErr ? 'text-bauhaus-red' : 'text-[#16A34A]'
      }`}
    >
      {isErr ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
      {msg.text}
    </div>
  );
}

function PwInput({ label, value, onChange, placeholder, match }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-bauhaus-fg/35 uppercase tracking-wider block mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="password"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full h-10 px-3 border bg-bauhaus-bg text-bauhaus-fg text-sm focus:outline-none focus:border-bauhaus-blue ${
            match === false
              ? 'border-bauhaus-red'
              : match === true
                ? 'border-[#16A34A]'
                : 'border-[#1F2937]/30'
          }`}
        />
        {match !== null && match !== undefined && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {match ? (
              <Check className="w-3.5 h-3.5 text-[#16A34A]" />
            ) : (
              <X className="w-3.5 h-3.5 text-bauhaus-red" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
