import React, { useState } from 'react';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ChevronRight,
  ChevronLeft, Check, User, Heart, Activity, ClipboardList, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../auth/authApi';
import { useAuth } from '../../auth/useAuth';

/* ─── Step definitions ────────────────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: 'Account',     icon: User },
  { id: 2, label: 'Oral Health', icon: Heart },
  { id: 3, label: 'Lifestyle',   icon: Activity },
  { id: 4, label: 'Review',      icon: ClipboardList },
];

/* ─── Small reusable sub-components ─────────────────────────────────────── */

function PillGroup({ id, options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap" id={id}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer
            ${value === opt.value
              ? 'bg-brand text-white border-brand shadow shadow-brand/25'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand/40 hover:text-brand'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleSwitch({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-4 cursor-pointer group">
      <span className="text-sm text-slate-700 font-medium group-hover:text-brand transition-colors">{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full border-2 transition-all duration-200 shrink-0
          ${checked ? 'bg-brand border-brand' : 'bg-slate-200 border-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </label>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{msg}
    </p>
  );
}

function SectionTitle({ children }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 mt-2">{children}</p>;
}

function ReviewSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden">
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</span>
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 text-right max-w-[60%] break-all">{value}</span>
    </div>
  );
}

function capitalize(str) {
  if (!str && str !== 0) return '—';
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

function brushingLabel(val) {
  if (val === 0) return 'Rarely';
  if (val === 1) return 'Once per day';
  return 'Twice or more per day';
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function RegisterPage() {
  const navigate   = useNavigate();
  const { saveAuth } = useAuth();

  const [step, setStep]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors]     = useState({});
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Form state ─────────────────────────────────────────────────────────── */
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    age: '', number_of_teeth: '', number_of_missing_teeth: '', number_of_filled_teeth: '',
    is_primary_teeth: false,
    overall_oral_hygiene_level: 'moderate',
    preferred_language: 'en',
    smoking_status: 'no', alcohol_usage: 'no', sugar_usage: 'no',
    brushing_frequency: 1,
    diabetes_status: false, pregnancy_status: false,
    gum_bleeding: false, tooth_sensitivity: false,
    calcium_or_vitamin_deficiency: false,
  });

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  /* ── Per-step validation ────────────────────────────────────────────────── */
  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.email)                            e.email    = 'Email is required.';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = 'Enter a valid email.';
      if (!form.password)                         e.password = 'Password is required.';
      else if (form.password.length < 6)          e.password = 'Password must be at least 6 characters.';
      if (!form.confirmPassword)                  e.confirmPassword = 'Please confirm your password.';
      else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    }
    if (s === 2) {
      const age = Number(form.age);
      const nt  = Number(form.number_of_teeth);
      const nm  = Number(form.number_of_missing_teeth);
      const nf  = Number(form.number_of_filled_teeth);
      if (!form.age || isNaN(age) || age < 1 || age > 120)   e.age = 'Age must be between 1 and 120.';
      if (form.number_of_teeth === '' || isNaN(nt) || nt < 0 || nt > 32)
        e.number_of_teeth = 'Must be 0–32.';
      if (form.number_of_missing_teeth === '' || isNaN(nm) || nm < 0 || nm > 32)
        e.number_of_missing_teeth = 'Must be 0–32.';
      if (!isNaN(nt) && !isNaN(nm) && nt + nm > 32)
        e.number_of_missing_teeth = 'Teeth + missing must be ≤ 32.';
      if (form.number_of_filled_teeth === '' || isNaN(nf) || nf < 0 || nf > 32)
        e.number_of_filled_teeth = 'Must be 0–32.';
      if (!isNaN(nf) && !isNaN(nt) && nf > nt)
        e.number_of_filled_teeth = 'Cannot exceed number of teeth.';
    }
    // Steps 3 has no required validation (all have defaults)
    return e;
  }

  /* ── Navigation (NOT inside <form>) ────────────────────────────────────── */
  function goNext() {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setErrors({});
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── Final submit (only called explicitly at step 4) ───────────────────── */
  async function handleSubmit() {
    setApiError('');
    setLoading(true);
    try {
      const payload = {
        email:    form.email,
        password: form.password,
        role:     'USER',
        healthProfile: {
          age:                           Number(form.age),
          number_of_teeth:               Number(form.number_of_teeth),
          number_of_missing_teeth:       Number(form.number_of_missing_teeth),
          number_of_filled_teeth:        Number(form.number_of_filled_teeth),
          is_primary_teeth:              form.is_primary_teeth,
          smoking_status:                form.smoking_status,
          alcohol_usage:                 form.alcohol_usage,
          sugar_usage:                   form.sugar_usage,
          brushing_frequency:            Number(form.brushing_frequency),
          diabetes_status:               form.diabetes_status,
          pregnancy_status:              form.pregnancy_status,
          gum_bleeding:                  form.gum_bleeding,
          tooth_sensitivity:             form.tooth_sensitivity,
          calcium_or_vitamin_deficiency: form.calcium_or_vitamin_deficiency,
          overall_oral_hygiene_level:    form.overall_oral_hygiene_level,
          preferred_language:            form.preferred_language,
        },
      };
      const res = await register(payload);
      // If backend returns a token on register, log user in directly
      if (res?.data?.accessToken) {
        saveAuth(res.data.accessToken, res.data.user);
        navigate('/profile');
      } else {
        // Otherwise go to login so the user signs in
        navigate('/login');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }

  /* ── Shared input class ─────────────────────────────────────────────────── */
  const inputClass = (hasError) =>
    `w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 outline-none
    ${hasError
      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
      : 'border-slate-200 bg-slate-50 focus:border-brand focus:ring-2 focus:ring-brand/20 hover:border-slate-300'
    }`;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col items-center justify-start px-4 py-12">

      {/* Background decorations */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-brand/8 to-indigo-200/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-cyan-200/8 to-brand/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-3 mb-8 group cursor-pointer"
        id="register-logo-home"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-indigo-500 shadow-md shadow-brand/20 transition-transform group-hover:scale-105 duration-300">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M12 7c-2.5 0-4.5 2-4.5 4.5S9.5 16 12 16s4.5-2 4.5-4.5S14.5 7 12 7z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9c-1.5 0-2.5 1-2.5 2.5S10.5 14 12 14s2.5-1 2.5-2.5S13.5 9 12 9z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">
          Xora<span className="text-brand">Scan</span>
        </span>
      </button>

      {/* Step Progress Indicator */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const done   = step > s.id;
            const active = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
                    ${done   ? 'bg-brand border-brand text-white' :
                      active ? 'bg-white border-brand text-brand shadow-md shadow-brand/20' :
                               'bg-white border-slate-200 text-slate-400'}`}>
                    {done ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-semibold transition-colors ${active ? 'text-brand' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${step > s.id ? 'bg-brand' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Card — NOTE: NO <form> wrapper here to prevent accidental submission */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-slate-100/60 border border-slate-100 p-8 sm:p-10 relative">

        {/* API Error */}
        {apiError && (
          <div className="flex items-start gap-3 mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* ═══════════════ STEP 1: Account Details ═══════════════ */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
              <p className="text-sm text-slate-500 mt-1">Set up your login credentials.</p>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="reg-email" type="email" autoComplete="email" placeholder="you@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  className={`${inputClass(errors.email)} pl-10`}
                />
              </div>
              <FieldError msg={errors.email} />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="reg-password" type={showPass ? 'text' : 'password'} autoComplete="new-password" placeholder="Min. 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  className={`${inputClass(errors.password)} pl-10 pr-11`}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={errors.password} />
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="reg-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter password"
                  value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  className={`${inputClass(errors.confirmPassword)} pl-10 pr-11`}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={errors.confirmPassword} />
            </div>

            <p className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
              Your account will be created with the <span className="font-semibold text-slate-600">USER</span> role by default.
            </p>
          </div>
        )}

        {/* ═══════════════ STEP 2: Oral Health Basics ═══════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Oral health basics</h2>
              <p className="text-sm text-slate-500 mt-1">Help us understand your dental health profile.</p>
            </div>

            <SectionTitle>Basic Details</SectionTitle>

            <div>
              <label htmlFor="reg-age" className="block text-sm font-semibold text-slate-700 mb-1.5">Age</label>
              <input id="reg-age" type="number" min={1} max={120} placeholder="e.g. 35"
                value={form.age} onChange={e => set('age', e.target.value)}
                className={inputClass(errors.age)} />
              <FieldError msg={errors.age} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="reg-teeth" className="block text-sm font-semibold text-slate-700 mb-1.5">Teeth (total)</label>
                <input id="reg-teeth" type="number" min={0} max={32} placeholder="0–32"
                  value={form.number_of_teeth} onChange={e => set('number_of_teeth', e.target.value)}
                  className={inputClass(errors.number_of_teeth)} />
                <FieldError msg={errors.number_of_teeth} />
              </div>
              <div>
                <label htmlFor="reg-missing" className="block text-sm font-semibold text-slate-700 mb-1.5">Missing teeth</label>
                <input id="reg-missing" type="number" min={0} max={32} placeholder="0–32"
                  value={form.number_of_missing_teeth} onChange={e => set('number_of_missing_teeth', e.target.value)}
                  className={inputClass(errors.number_of_missing_teeth)} />
                <FieldError msg={errors.number_of_missing_teeth} />
              </div>
              <div>
                <label htmlFor="reg-filled" className="block text-sm font-semibold text-slate-700 mb-1.5">Filled teeth</label>
                <input id="reg-filled" type="number" min={0} max={32} placeholder="0–32"
                  value={form.number_of_filled_teeth} onChange={e => set('number_of_filled_teeth', e.target.value)}
                  className={inputClass(errors.number_of_filled_teeth)} />
                <FieldError msg={errors.number_of_filled_teeth} />
              </div>
            </div>

            <SectionTitle>Oral condition</SectionTitle>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <ToggleSwitch id="reg-primary" label="Are these primary (baby) teeth?"
                checked={form.is_primary_teeth} onChange={v => set('is_primary_teeth', v)} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Overall oral hygiene level</label>
              <PillGroup id="reg-hygiene" value={form.overall_oral_hygiene_level}
                onChange={v => set('overall_oral_hygiene_level', v)}
                options={[
                  { label: '😄 Good', value: 'good' },
                  { label: '😐 Moderate', value: 'moderate' },
                  { label: '😟 Poor', value: 'poor' },
                ]} />
            </div>

            <div>
              <label htmlFor="reg-lang" className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred language</label>
              <select id="reg-lang" value={form.preferred_language} onChange={e => set('preferred_language', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all">
                <option value="en">🇬🇧 English</option>
                <option value="si">🇱🇰 Sinhala</option>
                <option value="ta">🇮🇳 Tamil</option>
              </select>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 3: Lifestyle & Medical ═══════════════ */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Lifestyle & medical</h2>
              <p className="text-sm text-slate-500 mt-1">These factors help personalise your dental risk assessment.</p>
            </div>

            <SectionTitle>Daily Habits</SectionTitle>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Smoking frequency</label>
              <PillGroup id="reg-smoking" value={form.smoking_status} onChange={v => set('smoking_status', v)}
                options={[
                  { label: '🚭 None', value: 'no' },
                  { label: '🚬 Medium', value: 'medium' },
                  { label: '🔥 Heavy', value: 'high' },
                ]} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Alcohol usage</label>
              <PillGroup id="reg-alcohol" value={form.alcohol_usage} onChange={v => set('alcohol_usage', v)}
                options={[
                  { label: '🚫 None', value: 'no' },
                  { label: '🍷 Medium', value: 'medium' },
                  { label: '🍺 High', value: 'high' },
                ]} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sugar / sweets intake</label>
              <PillGroup id="reg-sugar" value={form.sugar_usage} onChange={v => set('sugar_usage', v)}
                options={[
                  { label: '🥦 Low', value: 'no' },
                  { label: '🍬 Medium', value: 'medium' },
                  { label: '🍰 High', value: 'high' },
                ]} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Brushing frequency</label>
              <PillGroup id="reg-brushing" value={form.brushing_frequency} onChange={v => set('brushing_frequency', Number(v))}
                options={[
                  { label: '😬 Rarely', value: 0 },
                  { label: '🦷 Once/day', value: 1 },
                  { label: '✨ Twice+/day', value: 2 },
                ]} />
            </div>

            <SectionTitle>Medical Conditions</SectionTitle>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <ToggleSwitch id="reg-diabetes" label="Diabetes"
                checked={form.diabetes_status} onChange={v => set('diabetes_status', v)} />
              <div className="h-px bg-slate-200" />
              <ToggleSwitch id="reg-pregnancy" label="Pregnancy"
                checked={form.pregnancy_status} onChange={v => set('pregnancy_status', v)} />
              <div className="h-px bg-slate-200" />
              <ToggleSwitch id="reg-deficiency" label="Calcium or vitamin deficiency"
                checked={form.calcium_or_vitamin_deficiency} onChange={v => set('calcium_or_vitamin_deficiency', v)} />
            </div>

            <SectionTitle>Symptoms</SectionTitle>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <ToggleSwitch id="reg-bleeding" label="Gum bleeding"
                checked={form.gum_bleeding} onChange={v => set('gum_bleeding', v)} />
              <div className="h-px bg-slate-200" />
              <ToggleSwitch id="reg-sensitivity" label="Tooth sensitivity"
                checked={form.tooth_sensitivity} onChange={v => set('tooth_sensitivity', v)} />
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 4: Review & Submit ═══════════════ */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Review & confirm</h2>
              <p className="text-sm text-slate-500 mt-1">Double-check everything, then click <strong>Create account</strong>.</p>
            </div>

            <ReviewSection title="Account">
              <ReviewRow label="Email"    value={form.email} />
              <ReviewRow label="Password" value="••••••••" />
              <ReviewRow label="Role"     value="USER" />
            </ReviewSection>

            <ReviewSection title="Oral Health">
              <ReviewRow label="Age"             value={form.age} />
              <ReviewRow label="Total teeth"      value={form.number_of_teeth} />
              <ReviewRow label="Missing teeth"    value={form.number_of_missing_teeth} />
              <ReviewRow label="Filled teeth"     value={form.number_of_filled_teeth} />
              <ReviewRow label="Primary teeth"    value={form.is_primary_teeth ? 'Yes' : 'No'} />
              <ReviewRow label="Oral hygiene"     value={capitalize(form.overall_oral_hygiene_level)} />
              <ReviewRow label="Language"         value={form.preferred_language.toUpperCase()} />
            </ReviewSection>

            <ReviewSection title="Lifestyle">
              <ReviewRow label="Smoking"      value={capitalize(form.smoking_status)} />
              <ReviewRow label="Alcohol"      value={capitalize(form.alcohol_usage)} />
              <ReviewRow label="Sugar intake" value={capitalize(form.sugar_usage)} />
              <ReviewRow label="Brushing"     value={brushingLabel(form.brushing_frequency)} />
            </ReviewSection>

            <ReviewSection title="Medical & Symptoms">
              <ReviewRow label="Diabetes"              value={form.diabetes_status ? 'Yes' : 'No'} />
              <ReviewRow label="Pregnancy"             value={form.pregnancy_status ? 'Yes' : 'No'} />
              <ReviewRow label="Ca/Vitamin deficiency" value={form.calcium_or_vitamin_deficiency ? 'Yes' : 'No'} />
              <ReviewRow label="Gum bleeding"          value={form.gum_bleeding ? 'Yes' : 'No'} />
              <ReviewRow label="Tooth sensitivity"     value={form.tooth_sensitivity ? 'Yes' : 'No'} />
            </ReviewSection>
          </div>
        )}

        {/* ─── Navigation Buttons (all type="button" — never trigger form submit) ─── */}
        <div className={`flex mt-8 gap-3 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              id={`reg-back-step-${step}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}

          {/* Continue — steps 1-3 */}
          {step < 4 && (
            <button
              type="button"
              onClick={goNext}
              id={`reg-next-step-${step}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Create account — step 4 only */}
          {step === 4 && (
            <button
              id="reg-submit-btn"
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</>
                : <>Create account <Sparkles className="w-4 h-4 text-sky-200" /></>
              }
            </button>
          )}
        </div>
      </div>

      {/* Login link */}
      <p className="mt-6 text-sm text-slate-500 pb-8">
        Already have an account?{' '}
        <button id="reg-go-login" onClick={() => navigate('/login')}
          className="text-brand font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );
}
