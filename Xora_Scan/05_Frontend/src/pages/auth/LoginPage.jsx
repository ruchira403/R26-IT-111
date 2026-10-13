import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../auth/authApi';
import { useAuth } from '../../auth/useAuth';

export default function LoginPage() {
  const navigate   = useNavigate();
  const { saveAuth } = useAuth();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* ── Validation ─────────────────────────────────────────────────────────── */
  function validate() {
    const e = {};
    if (!form.email)                             e.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email))  e.email    = 'Enter a valid email address.';
    if (!form.password)                          e.password = 'Password is required.';
    return e;
  }

  /* ── Submit ──────────────────────────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      saveAuth(res.data.accessToken, res.data.user);
      navigate('/profile');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }

  /* ── UI ──────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col items-center justify-center px-4 py-16">

      {/* Background decorations */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-brand/10 to-indigo-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-cyan-200/10 to-brand/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-3 mb-10 group cursor-pointer"
        id="login-logo-home"
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

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-100/60 border border-slate-100 p-8 sm:p-10 relative">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs font-semibold text-brand tracking-wide mb-4">
            <span className="w-2 h-2 rounded-full bg-brand animate-ping" />
            Secure Sign In
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-2">Sign in to your XoraScan account</p>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div className="flex items-start gap-3 mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })); }}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 outline-none
                  ${errors.email
                    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
                    : 'border-slate-200 bg-slate-50 focus:border-brand focus:ring-2 focus:ring-brand/20 hover:border-slate-300'
                  }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />{errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })); }}
                className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm font-medium transition-all duration-200 outline-none
                  ${errors.password
                    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
                    : 'border-slate-200 bg-slate-50 focus:border-brand focus:ring-2 focus:ring-brand/20 hover:border-slate-300'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />{errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="relative overflow-hidden w-full py-3.5 text-sm font-bold text-white bg-brand hover:bg-brand-dark rounded-xl shadow-lg shadow-brand/25 hover:shadow-brand/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</>
            ) : (
              <>Sign In <Sparkles className="w-4 h-4 text-sky-200" /></>
            )}
            <div className="absolute inset-0 w-1/2 h-full bg-white/10 transform -skew-x-12 -translate-x-full hover:translate-x-[250%] transition-transform duration-700 ease-out pointer-events-none" />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-7">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-400 font-medium">New to XoraScan?</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Register link */}
        <button
          id="login-go-register"
          onClick={() => navigate('/register')}
          className="w-full py-3 text-sm font-semibold text-slate-700 hover:text-brand bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-brand/30 rounded-xl transition-all duration-200"
        >
          Create an account
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center">
        © 2026 XoraScan · AI-Powered Dental Diagnostics
      </p>
    </div>
  );
}
