import React from 'react';
import { Brain, HeartPulse, ShieldCheck, Clock, Sparkles, ArrowRight, X, Gauge } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-ML Powered Risk Analysis',
    desc: 'Your detected condition is combined with your full health profile to model your personal dental risk.',
  },
  {
    icon: Gauge,
    title: 'A Clear Risk Score',
    desc: 'See exactly where you stand — an easy-to-read score and risk level, not just raw numbers.',
  },
  {
    icon: HeartPulse,
    title: 'Custom Health Care Plan',
    desc: 'Get tailored recommendations — oral care routine, diet, and dentist-visit urgency — built around your profile.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety-Checked Results',
    desc: 'Every report is validated for consistency before it reaches you, with clear medical disclaimers.',
  },
];

/**
 * RiskAssessmentIntroModal
 * Shown right after a scan is saved — explains what the risk-assessment
 * pipeline does before the user commits to running it.
 *
 * Props:
 *  - isOpen   : boolean
 *  - onClose  : () => void   — "Maybe Later"
 *  - onStart  : () => void   — proceeds to AssessmentGenerationOverlay
 *  - disease  : string|undefined
 *  - severity : string|undefined
 */
export default function RiskAssessmentIntroModal({ isOpen, onClose, onStart, disease, severity }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4 animate-fadeIn"
      role="dialog"
      aria-label="Risk Assessment Introduction"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden">
        {/* Header banner */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-brand via-indigo-600 to-indigo-700 text-white overflow-hidden">
          <div className="absolute top-[-40px] right-[-40px] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-[-30px] left-[10%] w-28 h-28 bg-sky-300/10 rounded-full blur-2xl" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          <div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-semibold tracking-wide mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Scan Saved Successfully
          </div>

          <h2 className="relative text-2xl font-extrabold tracking-tight leading-tight">
            Ready for Your Risk Assessment?
          </h2>
          <p className="relative text-sm text-white/80 mt-2 leading-relaxed max-w-md">
            Turn this scan into a personalised dental risk report and personalised care plan — powered by our AI-ML assessment pipeline.
          </p>

          {disease && (
            <div className="relative inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-medium">
              Detected: <span className="font-bold">{disease}</span>
              {severity && severity !== 'N/A' && <span className="text-white/70">· {severity}</span>}
            </div>
          )}
        </div>

        {/* Feature grid */}
        <div className="px-8 py-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/60 hover:border-brand/20 transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-sm text-brand shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 leading-tight">{title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer / CTA */}
        <div className="px-8 pb-8 space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            Takes about 30 seconds to 1 minute
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all"
            >
              Maybe Later
            </button>
            <button
              onClick={onStart}
              className="flex-[1.4] flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-dark hover:to-indigo-700 shadow-lg shadow-brand/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Start My Risk Assessment
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
