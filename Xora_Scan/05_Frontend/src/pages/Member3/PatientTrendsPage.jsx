import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Image as ImageIcon,
  Info,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import Header from '../../components/Header';
import { fetchScanHistory } from '../../auth/scanApi';
import { compareLongitudinalScans, fetchLongitudinalTimeline } from '../../auth/ruchiraApi';
import { getStoredToken, getStoredUser } from '../../auth/useAuth';

const PARAMETER_ORDER = ['alignment', 'bone_density', 'periodontal', 'caries', 'spacing', 'proportion'];

const formatDate = (value, withYear = true) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
};

const normaliseDisease = (value) => (value || '').replace(/\s{2,}/g, ' ').trim();

const scoreTone = (score) => {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-rose-600';
};

const trendMeta = (trend) => {
  if (trend === 'improving') return { label: 'Improving', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', symbol: '↗' };
  if (trend === 'declining') return { label: 'Declining', text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', symbol: '↘' };
  if (trend === 'baseline') return { label: 'Baseline', text: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', symbol: '•' };
  return { label: 'Stable', text: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', symbol: '→' };
};

function ScanImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-slate-950 ${className}`}>
        <ImageIcon className="w-10 h-10 text-slate-600" />
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}

function MetricCard({ label, value, detail, icon: Icon, accent = 'text-brand', badge }) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="absolute -right-7 -top-7 w-24 h-24 rounded-full bg-blue-50" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <div className="flex items-end gap-2 mt-2">
            <p className={`text-3xl font-extrabold tracking-tight ${accent}`}>{value}</p>
            {badge && <span className="mb-1 text-xs font-bold text-slate-500">{badge}</span>}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">{detail}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
      </div>
    </div>
  );
}

function ParameterCard({ parameter }) {
  const meta = trendMeta(parameter.trend);
  const width = Math.max(4, Math.min(100, parameter.current));
  const delta = parameter.delta > 0 ? `+${parameter.delta.toFixed(2)}` : parameter.delta.toFixed(2);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900">{parameter.label}</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{parameter.weight}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Previous {parameter.previous.toFixed(2)}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${meta.bg} ${meta.text}`}>
          {meta.symbol} {delta}
        </span>
      </div>
      <div className="flex items-end justify-between mt-5">
        <p className={`text-3xl font-extrabold ${scoreTone(parameter.current)}`}>{parameter.current.toFixed(2)}</p>
        <p className="text-xs font-semibold text-slate-400">/ 100</p>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-3">
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-indigo-500 transition-all duration-700" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function TimelineChart({ series }) {
  if (!series || series.length === 0) return null;
  const width = 760;
  const height = 190;
  const padX = 54;
  const padY = 28;
  const scores = series.map((point) => Number(point.dhs || 0));
  const min = Math.max(0, Math.min(...scores) - 6);
  const max = Math.min(100, Math.max(...scores) + 6);
  const range = Math.max(10, max - min);
  const x = (index) => series.length === 1 ? width / 2 : padX + index * ((width - padX * 2) / (series.length - 1));
  const y = (score) => padY + (max - score) * ((height - padY * 2) / range);
  const points = series.map((point, index) => `${x(index)},${y(point.dhs)}`).join(' ');

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[620px] h-[190px]" role="img" aria-label="Dental health score timeline">
        {[0, 1, 2, 3].map((line) => {
          const yy = padY + line * ((height - padY * 2) / 3);
          return <line key={line} x1={padX} x2={width - padX} y1={yy} y2={yy} stroke="#e2e8f0" strokeDasharray="5 6" />;
        })}
        <polyline fill="none" stroke="#0066FF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points} />
        {series.map((point, index) => (
          <g key={point.scan_id ?? index}>
            <circle cx={x(index)} cy={y(point.dhs)} r="7" fill="white" stroke="#0066FF" strokeWidth="4" />
            <text x={x(index)} y={y(point.dhs) - 16} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">
              {Number(point.dhs).toFixed(1)}
            </text>
            <text x={x(index)} y={height - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">
              {formatDate(point.date, false)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function EmptyState({ baseline, onStartNewScan }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
        {baseline ? <CheckCircle2 className="w-8 h-8 text-brand" /> : <ImageIcon className="w-8 h-8 text-brand" />}
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 mt-5">{baseline ? 'Baseline scan established' : 'No dental scans yet'}</h2>
      <p className="text-sm text-slate-500 max-w-lg mx-auto mt-2 leading-relaxed">
        {baseline
          ? 'Your first panoramic scan is saved as the longitudinal baseline. Add one more validated scan later to unlock side-by-side progression analysis.'
          : 'Complete a validated panoramic X-ray scan first. Your saved scan history is the source for longitudinal analysis.'}
      </p>
      <button onClick={onStartNewScan} className="mt-6 px-6 py-3 rounded-xl bg-brand text-white text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark transition-colors">
        Start New Scan
      </button>
    </div>
  );
}

export default function PatientTrendsPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const fetchedRef = useRef(false);

  const [scans, setScans] = useState([]);
  const [selectedCurrentId, setSelectedCurrentId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getStoredToken()) navigate('/login');
  }, [navigate]);

  const orderedScans = useMemo(
    () => [...scans].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [scans],
  );

  const selectedIndex = useMemo(() => {
    if (orderedScans.length < 2) return -1;
    const found = orderedScans.findIndex((scan) => String(scan.id) === String(selectedCurrentId));
    return found > 0 ? found : orderedScans.length - 1;
  }, [orderedScans, selectedCurrentId]);

  const previousScan = selectedIndex > 0 ? orderedScans[selectedIndex - 1] : null;
  const currentScan = selectedIndex > 0 ? orderedScans[selectedIndex] : null;

  const runComparison = useCallback(async (previous, current) => {
    if (!previous || !current) return;
    setAnalyzing(true);
    setAnalysis(null);
    setError('');
    try {
      const result = await compareLongitudinalScans(previous, current);
      setAnalysis(result);
    } catch (err) {
      setAnalysis(null);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'The longitudinal comparison service could not analyze these scans.',
      );
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const loadTimeline = useCallback(async (scanList) => {
    if (scanList.length < 2) return;
    setTimelineLoading(true);
    try {
      const result = await fetchLongitudinalTimeline(scanList.slice(-6));
      setTimeline(result?.series || []);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const loadScans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchScanHistory();
      const list = response?.data?.scans || [];
      setScans(list);
      const chronological = [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      if (chronological.length >= 2) {
        setSelectedCurrentId(chronological[chronological.length - 1].id);
        await Promise.all([
          runComparison(chronological[chronological.length - 2], chronological[chronological.length - 1]),
          loadTimeline(chronological),
        ]);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(err?.response?.data?.message || err?.message || 'Unable to load your scan history.');
    } finally {
      setLoading(false);
    }
  }, [loadTimeline, navigate, runComparison]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadScans();
  }, [loadScans]);

  const handleCurrentChange = async (event) => {
    const nextId = event.target.value;
    setSelectedCurrentId(nextId);
    const index = orderedScans.findIndex((scan) => String(scan.id) === String(nextId));
    if (index > 0) await runComparison(orderedScans[index - 1], orderedScans[index]);
  };

  const refresh = async () => {
    if (previousScan && currentScan) {
      await Promise.all([runComparison(previousScan, currentScan), loadTimeline(orderedScans)]);
    } else {
      fetchedRef.current = false;
      await loadScans();
    }
  };

  const exportSummary = () => {
    if (!analysis) return;
    const payload = {
      generatedAt: new Date().toISOString(),
      user: user?.email || null,
      analysis,
      timeline,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `xorascan-longitudinal-${analysis.current?.scan_id || 'analysis'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand to-indigo-500 flex items-center justify-center shadow-lg shadow-brand/25">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-800">Building longitudinal view</p>
              <p className="text-sm text-slate-500 mt-1">Loading authenticated scan history…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">
      <Header />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl shadow-slate-200/70">
          <div className="absolute -top-28 -right-20 w-80 h-80 rounded-full bg-brand/25 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-bold tracking-wide text-blue-100">
                <Sparkles className="w-3.5 h-3.5" /> MEMBER 03 · LONGITUDINAL ANALYSIS
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-5">Dental Health Progression</h1>
              <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
                Compare sequential panoramic X-rays from the authenticated patient history, quantify six progression signals, and visualize registered radiographic change over time.
              </p>
              {user?.email && <p className="text-xs text-slate-400 mt-4">Patient account · {user.email}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/scan-history')} className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 text-sm font-bold transition-colors">
                Scan History
              </button>
              <button onClick={refresh} disabled={analyzing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-blue-50 text-sm font-bold transition-colors disabled:opacity-60">
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Run Comparison
              </button>
            </div>
          </div>
        </section>

        <div className="flex items-start gap-3 mt-5 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-brand" />
          <p className="text-xs sm:text-sm leading-relaxed">
            <strong>Research proxy:</strong> this longitudinal score summarizes radiographic and saved model-output changes. It is not a clinical diagnosis and should not replace professional dental interpretation.
          </p>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-800">Longitudinal analysis needs attention</p>
              <p className="text-sm text-rose-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {orderedScans.length === 0 && <div className="mt-8"><EmptyState onStartNewScan={() => navigate('/validation')} /></div>}
        {orderedScans.length === 1 && <div className="mt-8"><EmptyState baseline onStartNewScan={() => navigate('/validation')} /></div>}

        {orderedScans.length >= 2 && (
          <div className="space-y-7 mt-7">
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Comparison window</p>
                <p className="text-sm text-slate-600 mt-1">The previous scan is automatically the scan immediately before the selected current scan.</p>
              </div>
              <select value={selectedCurrentId ?? ''} onChange={handleCurrentChange} className="min-w-[260px] px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                {orderedScans.slice(1).map((scan) => (
                  <option value={scan.id} key={scan.id}>Current · {formatDate(scan.created_at)} · Scan #{scan.id}</option>
                ))}
              </select>
            </section>

            {analyzing && !analysis ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <p className="font-bold text-slate-800 mt-4">Registering panoramic X-rays</p>
                <p className="text-sm text-slate-500 mt-1">Measuring longitudinal radiographic change…</p>
              </div>
            ) : analysis ? (
              <>
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard label="Current DHS" value={analysis.current.dhs.toFixed(2)} detail={`Previous ${analysis.previous.dhs.toFixed(2)}`} icon={Activity} accent={scoreTone(analysis.current.dhs)} badge="/100" />
                  <MetricCard label="Health Grade" value={analysis.current.grade} detail={`Previous grade ${analysis.previous.grade}`} icon={Shield} accent={scoreTone(analysis.current.dhs)} />
                  <MetricCard label="Trend" value={trendMeta(analysis.comparison.trend).symbol} detail={`${trendMeta(analysis.comparison.trend).label} · ${analysis.comparison.delta > 0 ? '+' : ''}${analysis.comparison.delta.toFixed(2)} pts`} icon={Zap} accent={trendMeta(analysis.comparison.trend).text} />
                  <MetricCard label="Image Change" value={`${analysis.comparison.change_percentage.toFixed(2)}%`} detail="Notable registered pixel change" icon={Eye} accent="text-indigo-600" />
                </section>

                <section className="grid lg:grid-cols-2 gap-5">
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Previous scan</p>
                        <p className="font-bold text-slate-900 mt-1">{formatDate(previousScan?.created_at)}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-500">#{previousScan?.id}</span>
                    </div>
                    <ScanImage src={previousScan?.image_path} alt="Previous panoramic X-ray" className="w-full h-[280px] sm:h-[340px]" />
                    <div className="p-4 flex flex-wrap gap-2">
                      {(previousScan?.detected_diseases || []).length ? previousScan.detected_diseases.map((disease, index) => (
                        <span key={index} className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">{normaliseDisease(disease.disease_type)} · {disease.severity_level || 'N/A'}</span>
                      )) : <span className="text-xs text-slate-400">No saved disease findings</span>}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-brand/15 shadow-sm overflow-hidden ring-1 ring-brand/5">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Current scan</p>
                        <p className="font-bold text-slate-900 mt-1">{formatDate(currentScan?.created_at)}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-xs font-bold text-brand">#{currentScan?.id}</span>
                    </div>
                    <ScanImage src={currentScan?.image_path} alt="Current panoramic X-ray" className="w-full h-[280px] sm:h-[340px]" />
                    <div className="p-4 flex flex-wrap gap-2">
                      {(currentScan?.detected_diseases || []).length ? currentScan.detected_diseases.map((disease, index) => (
                        <span key={index} className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">{normaliseDisease(disease.disease_type)} · {disease.severity_level || 'N/A'}</span>
                      )) : <span className="text-xs text-slate-400">No saved disease findings</span>}
                    </div>
                  </div>
                </section>

                <section className="grid lg:grid-cols-5 gap-5">
                  <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Change heatmap</p>
                        <h2 className="font-extrabold text-slate-900 mt-1">Registered radiographic differences</h2>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-rose-500" /> stronger change</div>
                    </div>
                    <ScanImage src={analysis.heatmap_url} alt="Longitudinal change heatmap" className="w-full h-[320px] sm:h-[390px]" />
                    <p className="text-xs text-slate-500 leading-relaxed p-4 bg-slate-50/70 border-t border-slate-100">Warm regions indicate larger registered intensity differences; cooler/darker regions indicate smaller differences. The overlay is a research visualization, not lesion localization.</p>
                  </div>

                  <div className="lg:col-span-2 bg-slate-950 text-white rounded-3xl p-6 shadow-lg flex flex-col">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-300">Analysis summary</p>
                    <p className="text-base text-slate-200 leading-relaxed mt-4">{analysis.comparison.summary}</p>
                    <div className="mt-6 space-y-3">
                      {(analysis.comparison.dominant_changes || []).map((change) => (
                        <div key={change.key} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                          <span className="text-sm font-semibold text-slate-300">{change.label}</span>
                          <span className={`text-sm font-extrabold ${change.delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{change.delta > 0 ? '+' : ''}{change.delta.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={exportSummary} className="mt-auto pt-5 text-sm font-bold text-blue-300 hover:text-white transition-colors text-left">Export analysis summary →</button>
                  </div>
                </section>

                <section>
                  <div className="flex items-end justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Weighted progression metrics</p>
                      <h2 className="text-xl font-extrabold text-slate-900 mt-1">Six longitudinal parameters</h2>
                    </div>
                    <p className="hidden sm:block text-xs text-slate-400">Weights total 100%</p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysis.comparison.parameters
                      .sort((a, b) => PARAMETER_ORDER.indexOf(a.key) - PARAMETER_ORDER.indexOf(b.key))
                      .map((parameter) => <ParameterCard key={parameter.key} parameter={parameter} />)}
                  </div>
                </section>

                <section className="grid lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Progression timeline</p>
                        <h2 className="font-extrabold text-slate-900 mt-1">Dental health proxy over saved scans</h2>
                      </div>
                      {timelineLoading && <Loader2 className="w-4 h-4 text-brand animate-spin" />}
                    </div>
                    {timeline.length > 0 ? <TimelineChart series={timeline} /> : <p className="text-sm text-slate-400 py-12 text-center">Timeline is available when historical scan images can be resolved by the analysis service.</p>}
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Analysis details</p>
                    <div className="space-y-4 mt-5">
                      <DetailRow icon={Zap} label="Registration" value={analysis.comparison.registration.method.replaceAll('_', ' ')} />
                      <DetailRow icon={Activity} label="Feature matches" value={analysis.comparison.registration.matches} />
                      <DetailRow icon={CheckCircle2} label="RANSAC inliers" value={analysis.comparison.registration.inliers} />
                      <DetailRow icon={Calendar} label="Scan interval" value={analysis.comparison.scan_interval_days == null ? '—' : `${analysis.comparison.scan_interval_days} days`} />
                      <DetailRow icon={Clock} label="Compared scans" value={`#${analysis.previous.scan_id} → #${analysis.current.scan_id}`} />
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Authenticated scan history</p>
                      <h2 className="font-extrabold text-slate-900 mt-1">Patient progression records</h2>
                    </div>
                    <button onClick={() => navigate('/scan-history')} className="text-sm font-bold text-brand hover:text-brand-dark">Open full history</button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {[...orderedScans].reverse().slice(0, 6).map((scan) => {
                      const selected = String(scan.id) === String(currentScan?.id) || String(scan.id) === String(previousScan?.id);
                      return (
                        <div key={scan.id} className={`px-5 sm:px-6 py-4 flex items-center gap-4 ${selected ? 'bg-blue-50/40' : ''}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-slate-800">{formatDate(scan.created_at)}</p>
                              <span className="text-xs text-slate-400">Scan #{scan.id}</span>
                              {String(scan.id) === String(currentScan?.id) && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[10px] font-bold text-brand">CURRENT</span>}
                              {String(scan.id) === String(previousScan?.id) && <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">PREVIOUS</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 truncate">{(scan.detected_diseases || []).map((d) => normaliseDisease(d.disease_type)).join(' · ') || 'No saved findings'}</p>
                          </div>
                          <button onClick={() => navigate(`/scan-history/${scan.id}`)} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-brand transition-colors"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}
