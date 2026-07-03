import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Heart, Activity, LogOut, AlertTriangle,
  Loader2, RefreshCw, Sparkles, Mail, BadgeCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { getMe, logout } from '../../auth/authApi';
import { getStoredToken, clearStoredAuth } from '../../auth/useAuth';

/* ── Small helper components ─────────────────────────────────────────────── */
function ProfileCard({ title, icon: Icon, iconColor = 'text-brand', children }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-100/50 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className={`flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-slate-100 shadow-sm ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-6 py-5 divide-y divide-slate-50">{children}</div>
    </div>
  );
}

function ProfileRow({ label, value, badge }) {
  return (
    <div className="flex justify-between items-center py-3 text-sm">
      <span className="text-slate-500 font-medium">{label}</span>
      {badge ? (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge}`}>
          {value}
        </span>
      ) : (
        <span className="font-semibold text-slate-800 text-right max-w-[60%]">{value ?? '—'}</span>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const navigate = useNavigate();

  const [userData,      setUserData]      = useState(null);
  const [healthData,    setHealthData]    = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);

  /* ── Load user on mount ──────────────────────────────────────────────── */
  async function fetchProfile() {
    setLoading(true);
    setError('');
    const token = getStoredToken();
    if (!token) { navigate('/login'); return; }
    try {
      const res = await getMe(token);
      setUserData(res.data.user);
      setHealthData(res.data.healthProfile);
    } catch (err) {
      if (err?.response?.status === 401) { clearStoredAuth(); navigate('/login'); return; }
      setError(err?.response?.data?.message || err?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProfile(); }, []); // eslint-disable-line

  /* ── Logout ──────────────────────────────────────────────────────────── */
  async function handleLogout() {
    setLogoutLoading(true);
    const token = getStoredToken();
    try { if (token) await logout(token); } catch { /* still clear */ }
    finally {
      clearStoredAuth();
      setLogoutLoading(false);
      navigate('/login');
    }
  }

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  const yesNo = val => val ? 'Yes' : 'No';
  const cap   = str => !str ? '—' : str.charAt(0).toUpperCase() + str.slice(1);
  const brushing = val => val === 0 ? 'Rarely' : val === 1 ? 'Once per day' : 'Twice or more per day';

  const hygieneBadge = lvl =>
    lvl === 'good' ? 'bg-emerald-100 text-emerald-700' :
    lvl === 'moderate' ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';

  const usageBadge = lvl =>
    lvl === 'no' ? 'bg-emerald-100 text-emerald-700' :
    lvl === 'medium' ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';

  const boolBadge = (val, warnTrue = true) =>
    val
      ? (warnTrue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')
      : 'bg-emerald-100 text-emerald-700';

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand to-indigo-500 shadow-lg shadow-brand/25">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Loading your profile…</p>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 px-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 border border-red-200">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900">Failed to load profile</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">{error}</p>
        </div>
        <button onClick={fetchProfile}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 transition-all">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  /* ── Profile page ────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">

      {/* Shared app header (Analysis, Patient Trends, Start New Scan) */}
      <Header />

      <div className="flex-grow relative">
        {/* Background decoration */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-brand/8 to-indigo-100/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

          {/* Profile hero */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand to-indigo-500 shadow-lg shadow-brand/25 flex items-center justify-center">
                <span className="text-2xl font-black text-white">
                  {userData?.email?.[0]?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                <ShieldCheck className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/10 border border-brand/20 text-xs font-semibold text-brand mb-2">
                <Sparkles className="w-3 h-3" />
                {userData?.role ?? 'USER'}
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{userData?.email ?? '—'}</h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-500" />
                Verified account
              </p>
            </div>

            {/* Inline logout button */}
            <button
              id="profile-logout-btn"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all duration-200 disabled:opacity-60"
            >
              {logoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              {logoutLoading ? 'Signing out…' : 'Sign out'}
            </button>
          </div>

          {/* Account Info */}
          <ProfileCard title="Account Information" icon={Mail}>
            <ProfileRow label="Email"             value={userData?.email} />
            <ProfileRow label="Role"              value={userData?.role ?? 'USER'} badge="bg-brand/10 text-brand" />
            <ProfileRow label="Preferred language" value={healthData?.preferred_language?.toUpperCase() ?? '—'} />
          </ProfileCard>

          {/* Oral Health */}
          {healthData && (
            <ProfileCard title="Oral Health" icon={Heart} iconColor="text-rose-500">
              <ProfileRow label="Age"                value={healthData.age} />
              <ProfileRow label="Number of teeth"    value={healthData.number_of_teeth} />
              <ProfileRow label="Missing teeth"      value={healthData.number_of_missing_teeth} />
              <ProfileRow label="Filled teeth"       value={healthData.number_of_filled_teeth} />
              <ProfileRow label="Primary teeth"      value={yesNo(healthData.is_primary_teeth)} />
              <ProfileRow label="Overall oral hygiene"
                value={cap(healthData.overall_oral_hygiene_level)}
                badge={hygieneBadge(healthData.overall_oral_hygiene_level)} />
            </ProfileCard>
          )}

          {/* Lifestyle */}
          {healthData && (
            <ProfileCard title="Lifestyle Habits" icon={Activity} iconColor="text-amber-500">
              <ProfileRow label="Smoking"      value={cap(healthData.smoking_status)}  badge={usageBadge(healthData.smoking_status)} />
              <ProfileRow label="Alcohol usage"   value={cap(healthData.alcohol_usage)}   badge={usageBadge(healthData.alcohol_usage)} />
              <ProfileRow label="Sugar intake"    value={cap(healthData.sugar_usage)}    badge={usageBadge(healthData.sugar_usage)} />
              <ProfileRow label="Brushing frequency" value={brushing(healthData.brushing_frequency)} />
            </ProfileCard>
          )}

          {/* Medical & Symptoms */}
          {healthData && (
            <ProfileCard title="Medical & Symptoms" icon={ShieldCheck} iconColor="text-emerald-600">
              <ProfileRow label="Diabetes"                   value={yesNo(healthData.diabetes_status)}               badge={boolBadge(healthData.diabetes_status)} />
              <ProfileRow label="Pregnancy"                  value={yesNo(healthData.pregnancy_status)}              badge={boolBadge(healthData.pregnancy_status, false)} />
              <ProfileRow label="Calcium / Vitamin deficiency" value={yesNo(healthData.calcium_or_vitamin_deficiency)} badge={boolBadge(healthData.calcium_or_vitamin_deficiency)} />
              <ProfileRow label="Gum bleeding"               value={yesNo(healthData.gum_bleeding)}                  badge={boolBadge(healthData.gum_bleeding)} />
              <ProfileRow label="Tooth sensitivity"          value={yesNo(healthData.tooth_sensitivity)}             badge={boolBadge(healthData.tooth_sensitivity)} />
            </ProfileCard>
          )}

          {/* Back to dashboard */}
          <div className="flex justify-center pb-6">
            <button
              id="profile-go-dashboard"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Back to Dashboard
              <Sparkles className="w-4 h-4 text-sky-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
