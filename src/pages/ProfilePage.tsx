import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// ─── Icons ────────────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const UserIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const PhoneIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3.05 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16h1a2 2 0 0 1-.08.92z" />
  </svg>
);
const ShieldIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const CheckIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);

// ─── Role badge config ────────────────────────────────────────────────────────
const roleConfig: Record<string, { label: string; color: string; description: string }> = {
  USER:       { label: 'Farmer / User',   color: 'bg-agri-primary/10 text-agri-primary border-agri-primary/20', description: 'Standard access — can explore crops, run financial evaluations, and access training courses.' },
  RESEARCHER: { label: 'Researcher',       color: 'bg-blue-100 text-blue-700 border-blue-200',                    description: 'Extended access — can view analytics data and contribute research insights.' },
  ADMIN:      { label: 'Administrator',   color: 'bg-amber-100 text-amber-700 border-amber-200',                 description: 'Full access — can manage crops, locations, pricing data, and all users.' },
};

// ─── Component ────────────────────────────────────────────────────────────────
const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const role = profile?.role ?? 'USER';
  const roleCfg = roleConfig[role] ?? roleConfig.USER;

  const initials = (profile?.full_name ?? user?.email ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      setSaveError(error.message);
    } else {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setFullName(profile?.full_name ?? '');
    setPhoneNumber(profile?.phone_number ?? '');
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-agri-bg">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-agri-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            id="back-to-dashboard-btn"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-agri-subtext hover:text-agri-text hover:bg-agri-bg transition-colors border border-agri-border"
          >
            <ArrowLeftIcon />
            Dashboard
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="h-7 w-7 rounded-xl bg-agri-dark flex items-center justify-center">
              <svg className="h-4 w-4 text-agri-lime" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 8C8 10 5.9 16.17 3.82 21c-.19.41.39.81.74.53l1.1-.87C7 19.5 8.5 19 10 19c4 0 5-2.5 8-2.5s4 2.5 7 2.5c.55 0 1-.45 1-1 0-4.5-5-10-9-10z" />
              </svg>
            </div>
            <span className="text-agri-dark text-base font-bold">YEATI</span>
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-agri-text">My Profile</h1>
          <p className="text-agri-subtext text-sm mt-1">Manage your account information</p>
        </div>

        {/* ── Avatar + Role card ────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-agri-border p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-24 w-24 rounded-3xl bg-agri-dark flex items-center justify-center text-agri-lime text-3xl font-bold shadow-lg shadow-agri-dark/20">
              {initials}
            </div>
            <div className={`absolute -bottom-2 -right-2 h-7 w-7 rounded-xl flex items-center justify-center border-2 border-white shadow-md ${role === 'ADMIN' ? 'bg-amber-400' : role === 'RESEARCHER' ? 'bg-blue-400' : 'bg-agri-primary'}`}>
              <ShieldIcon />
            </div>
          </div>

          {/* Name + email + role */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h2 className="text-xl font-bold text-agri-text">{profile?.full_name || 'No name set'}</h2>
            <p className="text-agri-subtext text-sm">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleCfg.color}`}>
                <ShieldIcon />
                {roleCfg.label}
              </span>
              <span className="text-xs text-agri-subtext bg-agri-bg border border-agri-border rounded-full px-3 py-1">
                Member since {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Role Info card ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-agri-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldIcon />
            <h3 className="font-semibold text-agri-text text-sm">Account Role & Permissions</h3>
          </div>
          <p className="text-sm text-agri-subtext leading-relaxed">{roleCfg.description}</p>
          <div className="mt-4 pt-4 border-t border-agri-border">
            <p className="text-xs text-agri-subtext">
              <span className="font-semibold text-agri-text">Role changes</span> are managed by an administrator.
              If you need elevated access, please contact your system admin.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {(['USER', 'RESEARCHER', 'ADMIN'] as const).map((r) => (
                <div
                  key={r}
                  className={`rounded-xl px-3 py-2 border text-xs font-semibold transition-all ${r === role
                    ? roleConfig[r].color + ' ring-2 ring-offset-1 ring-current/30'
                    : 'bg-agri-bg text-agri-subtext border-agri-border opacity-40'
                    }`}
                >
                  {roleConfig[r].label}
                  {r === role && <div className="mt-1 text-[10px] font-normal opacity-70">current</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Edit Details card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-agri-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon />
              <h3 className="font-semibold text-agri-text text-sm">Personal Information</h3>
            </div>
            {!isEditing && (
              <Button
                id="edit-profile-btn"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>

          {/* Success */}
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 text-sm text-green-700">
              <CheckIcon />
              Profile updated successfully
            </div>
          )}

          {/* Error */}
          {saveError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {saveError}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              id="profile-fullname"
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!isEditing}
              placeholder="Your full name"
              leftIcon={<UserIcon />}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-email" className="text-sm font-medium text-agri-text">
                Email address
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-agri-border bg-agri-bg px-4 py-2.5 text-sm text-agri-subtext cursor-not-allowed">
                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="truncate">{user?.email}</span>
                <span className="ml-auto text-[10px] bg-agri-primary/10 text-agri-primary px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">locked</span>
              </div>
              <p className="text-xs text-agri-subtext">Email cannot be changed here</p>
            </div>
            <Input
              id="profile-phone"
              label="Phone number (optional)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={!isEditing}
              placeholder="+94 71 234 5678"
              leftIcon={<PhoneIcon />}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-agri-text">Role</label>
              <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold cursor-not-allowed ${roleCfg.color}`}>
                <ShieldIcon />
                {roleCfg.label}
                <span className="ml-auto text-[10px] opacity-70 flex-shrink-0">assigned by admin</span>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-2">
              <Button
                id="save-profile-btn"
                onClick={handleSave}
                isLoading={isSaving}
                size="md"
              >
                Save Changes
              </Button>
              <Button
                id="cancel-edit-btn"
                variant="outline"
                size="md"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* ── Danger zone ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-red-200 p-5 space-y-3">
          <h3 className="font-semibold text-red-600 text-sm">Sign Out</h3>
          <p className="text-sm text-agri-subtext">You'll be redirected to the login page.</p>
          <Button
            id="profile-signout-btn"
            variant="danger"
            size="md"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
