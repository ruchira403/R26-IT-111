import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, Calendar, Shield,
  Eye, Sparkles, CheckCircle2, Activity, AlertCircle,
  ChevronDown, ChevronUp, Printer, ArrowUp, Heart, Stethoscope,
  FileText, Info, ShieldCheck, Pill, Apple, Droplets,
  Siren, Target, ThumbsUp, AlertOctagon, BookOpen, Gauge,
} from 'lucide-react';
import Header from '../../components/Header';
import { getStoredToken } from '../../auth/useAuth';
import { assessScan } from '../../auth/scanApi';

/* ── Helpers ────────────────────────────────────────────────────────── */
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Convert raw enum-like values to readable text */
const humanize = (val) => {
  if (!val || val === '—') return '—';
  return val
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/** Convert booleans to Yes/No */
const yesNo = (val) => (val ? 'Yes' : 'No');

/** Risk level color classes */
const riskLevelColor = (level) => {
  if (!level) return { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200', grad: 'from-slate-500 to-slate-600', soft: 'bg-slate-50' };
  const l = level.toLowerCase();
  if (l === 'low') return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', stroke: '#10b981', grad: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50' };
  if (l === 'medium' || l === 'moderate') return { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', stroke: '#f59e0b', grad: 'from-amber-500 to-orange-600', soft: 'bg-amber-50' };
  return { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', stroke: '#ef4444', grad: 'from-rose-500 to-red-600', soft: 'bg-red-50' };
};

/** Map care plan keys to categories */
const carePlanCategory = (key) => {
  const map = {
    toothpaste_type: 'Daily Oral Care',
    mouthwash_type: 'Supportive Rinses',
    rinse_type: 'Supportive Rinses',
    interdental_tool: 'Interdental Cleaning',
    dietary_action: 'Diet & Lifestyle',
    lifestyle_action: 'Diet & Lifestyle',
    pain_relief: 'Temporary Symptom Support',
    dentist_urgency: 'Professional Dental Care',
    monitoring_focus: 'Monitoring & Follow-Up',
  };
  return map[key] || 'General Recommendations';
};

/** Category icons */
const categoryIcon = (cat) => {
  const icons = {
    'Daily Oral Care': Droplets,
    'Supportive Rinses': Droplets,
    'Interdental Cleaning': Activity,
    'Diet & Lifestyle': Apple,
    'Temporary Symptom Support': Pill,
    'Professional Dental Care': Stethoscope,
    'Monitoring & Follow-Up': Target,
    'General Recommendations': FileText,
  };
  return icons[cat] || FileText;
};

/** Urgency display */
const urgencyDisplay = (val) => {
  if (!val) return { text: '—', color: 'text-slate-600' };
  const v = val.toLowerCase();
  if (v.includes('immediate') || v.includes('asap')) return { text: humanize(val), color: 'text-red-700 font-bold' };
  if (v.includes('1-week') || v.includes('1 week')) return { text: 'Within 1 Week', color: 'text-red-600 font-semibold' };
  if (v.includes('2-week') || v.includes('2 week')) return { text: 'Within 2 Weeks', color: 'text-amber-700 font-semibold' };
  if (v.includes('1-month') || v.includes('month')) return { text: 'Within 1 Month', color: 'text-amber-600' };
  if (v.includes('routine') || v.includes('6-month')) return { text: 'Routine (6 Months)', color: 'text-emerald-700' };
  return { text: humanize(val), color: 'text-slate-700' };
};

/* ── RiskScoreGauge ────────────────────────────────────────────────── */
function RiskScoreGauge({ score, level, size = 150 }) {
  const colors = riskLevelColor(level);
  const radius = (size / 2) - 16;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score || 0, 0), 100);
  const dashoffset = circumference - (pct / 100) * circumference;
  const center = size / 2;

  return (
    <div className="risk-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="11" />
        <circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={colors.stroke || '#0066FF'}
          strokeWidth="11" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold ${colors.text}`}>{Math.round(pct)}</span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Risk Score</span>
      </div>
    </div>
  );
}

/* ── Accordion ──────────────────────────────────────────────────────── */
function Accordion({ title, children, defaultOpen = false, id }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden" id={id}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 accordion-content">{children}</div>}
    </div>
  );
}

/* ── Card wrapper (used inside tab panels) ─────────────────────────── */
function Card({ title, icon: Icon, iconColor = 'text-brand', children }) {
  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className={`flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-slate-100 shadow-sm ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

/* ── QuickFact chip (always-visible summary strip) ─────────────────── */
function QuickFact({ icon: Icon, label, value, valueClass = 'text-slate-800' }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white shadow-sm shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-bold break-words ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

/* ── Tab button ─────────────────────────────────────────────────────── */
function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
        active
          ? 'bg-brand text-white shadow-md shadow-brand/25'
          : 'text-slate-600 hover:text-brand hover:bg-blue-50/80'
      }`}
      aria-pressed={active}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────── */
export default function AssessmentReportPage() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Auth guard
  useEffect(() => {
    if (!getStoredToken()) navigate('/login');
  }, [navigate]);

  // Try route state first
  const [assessment, setAssessment] = useState(location.state?.assessment || null);
  const [source, setSource] = useState(location.state?.source || null);
  const [loading, setLoading] = useState(!assessment);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── Fetch assessment if not in route state ──────────────────────── */
  const fetchAssessment = useCallback(async () => {
    if (assessment) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    try {
      const res = await assessScan(scanId);
      const a = res?.data?.assessment;
      if (a) {
        setAssessment(a);
        setSource(res?.data?.source || 'existing');
      } else {
        setError('Assessment not found.');
      }
    } catch (err) {
      if (err?.response?.status === 401) { navigate('/login'); return; }
      setError(err?.response?.data?.message || err?.message || 'Failed to load assessment.');
    } finally {
      setLoading(false);
    }
  }, [assessment, scanId, navigate]);

  useEffect(() => { fetchAssessment(); }, [fetchAssessment]);

  /* ── Loading ────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center" aria-live="polite">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand to-indigo-500 shadow-lg shadow-brand/25">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Loading your assessment…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ──────────────────────────────────────────────────────────── */
  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center gap-6 px-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 border border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-900">Could not load assessment</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">{error || 'Assessment data is not available.'}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/scan-history')} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Extract data defensively ──────────────────────────────────────── */
  const result = assessment.assessment_result || {};
  const report = result.report || {};
  const riskReport = report.risk_report || {};
  const modelOutput = report.model_output || {};
  const carePlan = modelOutput.care_plan || {};
  const postValidation = report.post_validation || {};
  const carePlanReport = report.care_plan_report || [];
  const ethics = report.ethical_considerations || {};
  const inputSnapshot = assessment.input_snapshot || {};

  const riskScore = modelOutput.risk_score;
  const riskLevel = modelOutput.risk_level;
  const colors = riskLevelColor(riskLevel);

  const mainRiskFactors = riskReport.main_risk_factors || [];
  const possibleConcerns = riskReport.possible_concerns || [];
  const riskReducingFactors = riskReport.risk_reducing_factors || [];
  const safetyNotes = postValidation.safety_notes || [];
  const inconsistencies = postValidation.inconsistencies || [];
  const hasRiskBreakdown = mainRiskFactors.length > 0 || possibleConcerns.length > 0 || riskReducingFactors.length > 0;

  // Group care plan items by category
  const carePlanGroups = {};
  carePlanReport.forEach((item) => {
    const cat = carePlanCategory(item.key);
    if (!carePlanGroups[cat]) carePlanGroups[cat] = [];
    carePlanGroups[cat].push(item);
  });

  // Urgency info
  const urgency = urgencyDisplay(carePlan.dentist_urgency);

  // Source label
  const sourceLabel = source === 'generated' ? 'Newly Generated' : 'Saved Assessment';

  // Tabs — only show ones with content
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Gauge, show: true },
    { id: 'risks', label: 'Risk Breakdown', icon: Target, show: hasRiskBreakdown },
    { id: 'care', label: 'Care Plan', icon: Heart, show: carePlanReport.length > 0 },
    { id: 'safety', label: 'Safety & Info', icon: ShieldCheck, show: true },
  ].filter((t) => t.show);

  const panelClass = (id) => `${activeTab === id ? 'block' : 'hidden'} print:block space-y-6`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">
      <Header />

      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-brand/8 to-indigo-100/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-6">

        {/* Back + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <button
            onClick={() => navigate('/scan-history')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Scan History
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-brand border border-slate-200 hover:border-brand/30 bg-white hover:bg-blue-50 transition-all"
            aria-label="Print or save report"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Download
          </button>
        </div>

        {/* ── Hero — risk-colour-washed header + quick facts ─────────────── */}
        <section className={`relative rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/40 overflow-hidden`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.grad} opacity-95`} />
          <div className="absolute top-[-60px] right-[-40px] w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-40px] left-[10%] w-40 h-40 bg-white/5 rounded-full blur-2xl" />

          <div className="relative p-6 sm:p-8 text-white space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold">
                <Sparkles className="w-3 h-3" /> AI-Assisted Assessment
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold">
                {sourceLabel}
              </span>
              {assessment.assessment_status === 'SUCCESS' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              )}
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
                {riskReport.title || 'Dental Risk Assessment'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80 mt-2">
                {assessment.code && (
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {assessment.code}</span>
                )}
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(assessment.created_at)}</span>
              </div>
            </div>

            {/* Quick facts strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <QuickFact icon={Gauge} label="Risk Level" value={humanize(riskLevel) || '—'} />
              <QuickFact icon={Siren} label="Dentist Visit" value={urgency.text} />
              <QuickFact icon={Stethoscope} label="Detected" value={humanize(inputSnapshot.identified_disease) || '—'} />
              <QuickFact icon={AlertCircle} label="X-Ray Severity" value={humanize(inputSnapshot.disease_severity_from_xray) || '—'} />
            </div>
          </div>
        </section>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 print:hidden" role="tablist">
          {tabs.map((t) => (
            <TabButton
              key={t.id}
              active={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              icon={t.icon}
              label={t.label}
            />
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        <div className={panelClass('overview')} role="tabpanel">
          <Card title="Risk Score" icon={Gauge} iconColor="text-red-500">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="shrink-0">
                <RiskScoreGauge score={riskScore} level={riskLevel} />
              </div>
              <div className="flex-1 space-y-3 w-full text-sm text-slate-700 leading-relaxed">
                {riskReport.summary && <p>{riskReport.summary}</p>}
              </div>
            </div>
          </Card>

          {(riskReport.risk_level_text || riskReport.risk_score_text) && (
            <Card title="Assessment Summary" icon={FileText}>
              <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                {riskReport.risk_level_text && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Risk Level Explanation</p>
                    <p>{riskReport.risk_level_text}</p>
                  </div>
                )}
                {riskReport.risk_score_text && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Risk Score Explanation</p>
                    <p>{riskReport.risk_score_text}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ── RISK BREAKDOWN ───────────────────────────────────────────── */}
        {hasRiskBreakdown && (
          <div className={panelClass('risks')} role="tabpanel">
            {mainRiskFactors.length > 0 && (
              <Card title="Main Risk Factors" icon={AlertTriangle} iconColor="text-amber-500">
                <ul className="space-y-3">
                  {mainRiskFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {possibleConcerns.length > 0 && (
              <Card title="Possible Concerns" icon={AlertOctagon} iconColor="text-orange-500">
                <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-2">
                  <p className="text-xs text-orange-700 font-semibold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Areas to be aware of — not a confirmed diagnosis
                  </p>
                  <ul className="space-y-2">
                    {possibleConcerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}

            {riskReducingFactors.length > 0 && (
              <Card title="Risk-Reducing Factors" icon={ThumbsUp} iconColor="text-emerald-500">
                <ul className="space-y-3">
                  {riskReducingFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {/* ── CARE PLAN ────────────────────────────────────────────────── */}
        {carePlanReport.length > 0 && (
          <div className={panelClass('care')} role="tabpanel">
            <Card title="Personalised Care Plan" icon={Heart} iconColor="text-rose-500">
              <div className="space-y-4">
                {carePlan.dentist_urgency && (
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
                    urgency.color.includes('red')
                      ? 'bg-red-50 border-red-200'
                      : urgency.color.includes('amber')
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <Siren className={`w-5 h-5 shrink-0 ${urgency.color}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recommended Dental Visit</p>
                      <p className={`text-sm font-bold ${urgency.color}`}>{urgency.text}</p>
                    </div>
                  </div>
                )}

                {Object.entries(carePlanGroups).map(([cat, items]) => {
                  const CatIcon = categoryIcon(cat);
                  return (
                    <div key={cat} className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 pt-2">
                        <CatIcon className="w-3.5 h-3.5" />
                        {cat}
                      </h4>
                      {items.map((item, idx) => (
                        <Accordion
                          key={idx}
                          title={
                            <div className="space-y-0.5">
                              <span className="text-sm font-semibold text-slate-800">{item.title || humanize(item.key)}</span>
                              {item.short_point && (
                                <p className="text-xs text-slate-500 font-normal">{item.short_point}</p>
                              )}
                            </div>
                          }
                          defaultOpen={item.key === 'dentist_urgency'}
                        >
                          <div className="space-y-3 text-sm text-slate-700">
                            {item.selected_value && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold border border-brand/20">
                                Recommendation: {humanize(item.selected_value)}
                              </div>
                            )}
                            {item.detailed_explanation && (
                              <p className="leading-relaxed">{item.detailed_explanation}</p>
                            )}
                            {item.safety_note && (
                              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
                                <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <p>{item.safety_note}</p>
                              </div>
                            )}
                          </div>
                        </Accordion>
                      ))}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ── SAFETY & INFO ────────────────────────────────────────────── */}
        <div className={panelClass('safety')} role="tabpanel">
          <Card title="Safety Validation" icon={ShieldCheck} iconColor="text-emerald-600">
            <div className="space-y-4">
              {postValidation.status === 'passed' ? (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    The generated report passed the system's post-generation consistency and safety checks.
                  </p>
                </div>
              ) : postValidation.status ? (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Validation status: {postValidation.status}</p>
                </div>
              ) : null}

              {safetyNotes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Safety Notes</p>
                  {safetyNotes.map((note, i) => (
                    <p key={i} className="text-sm text-slate-600 leading-relaxed pl-3 border-l-2 border-brand/30">{note}</p>
                  ))}
                </div>
              )}

              {inconsistencies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Inconsistencies Detected</p>
                  {inconsistencies.map((inc, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Accordion title="Information Used For This Assessment">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-rose-400" /> Oral Health
                </p>
                <InputRow label="Age" value={inputSnapshot.age} />
                <InputRow label="Number of Teeth" value={inputSnapshot.number_of_teeth} />
                <InputRow label="Missing Teeth" value={inputSnapshot.number_of_missing_teeth} />
                <InputRow label="Filled Teeth" value={inputSnapshot.number_of_filled_teeth} />
                <InputRow label="Affected Teeth" value={inputSnapshot.affected_teeth_count} />
                <InputRow label="Primary Teeth" value={yesNo(inputSnapshot.is_primary_teeth)} />
                <InputRow label="Gum Bleeding" value={yesNo(inputSnapshot.gum_bleeding)} />
                <InputRow label="Tooth Sensitivity" value={yesNo(inputSnapshot.tooth_sensitivity)} />
                <InputRow label="Brushing Frequency" value={inputSnapshot.brushing_frequency === 0 ? 'Rarely' : inputSnapshot.brushing_frequency === 1 ? 'Once per day' : 'Twice or more'} />
                <InputRow label="Oral Hygiene" value={humanize(inputSnapshot.overall_oral_hygiene_level)} />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-amber-400" /> Lifestyle & General Health
                </p>
                <InputRow label="Smoking" value={humanize(inputSnapshot.smoking_status)} />
                <InputRow label="Alcohol" value={humanize(inputSnapshot.alcohol_usage)} />
                <InputRow label="Sugar Intake" value={humanize(inputSnapshot.sugar_usage)} />
                <InputRow label="Diabetes" value={yesNo(inputSnapshot.diabetes_status)} />
                <InputRow label="Pregnancy" value={yesNo(inputSnapshot.pregnancy_status)} />
                <InputRow label="Calcium/Vitamin Deficiency" value={yesNo(inputSnapshot.calcium_or_vitamin_deficiency)} />

                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pt-4">
                  <Eye className="w-3 h-3 text-blue-400" /> Scan Findings
                </p>
                <InputRow label="Identified Disease" value={humanize(inputSnapshot.identified_disease)} />
                <InputRow label="X-Ray Severity" value={humanize(inputSnapshot.disease_severity_from_xray)} />
                <InputRow label="Language" value={(inputSnapshot.preferred_language || '').toUpperCase()} />
              </div>
            </div>
          </Accordion>

          <Card title="Important Disclaimers" icon={BookOpen} iconColor="text-slate-500">
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              {ethics.main_disclaimer && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
                  <p className="font-semibold text-xs uppercase tracking-wider mb-1">Primary Disclaimer</p>
                  <p>{ethics.main_disclaimer}</p>
                </div>
              )}
              {ethics.research_context && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-1">Research Context</p>
                  <p>{ethics.research_context}</p>
                </div>
              )}
              {ethics.medication_disclaimer && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-1">Medication Notice</p>
                  <p>{ethics.medication_disclaimer}</p>
                </div>
              )}
              {ethics.professional_care_disclaimer && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <p className="font-semibold text-xs text-blue-600 uppercase tracking-wider mb-1">Professional Care</p>
                  <p className="text-blue-800">{ethics.professional_care_disclaimer}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>

      {/* ── Back to top ──────────────────────────────────────────────── */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-dark transition-all print:hidden"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

/* ── InputRow sub-component ──────────────────────────────────────────── */
function InputRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-xs border-b border-slate-50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-700 text-right">{value ?? '—'}</span>
    </div>
  );
}
