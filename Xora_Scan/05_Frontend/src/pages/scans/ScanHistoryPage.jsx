import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, AlertTriangle, RefreshCw, ClipboardList, Calendar, Shield,
  Eye, Sparkles, Image as ImageIcon, CheckCircle2, Clock, Activity,
  ChevronRight, Zap, FileSearch, AlertCircle
} from 'lucide-react';
import Header from '../../components/Header';
import { getStoredToken } from '../../auth/useAuth';
import { fetchLatestDentalScan, fetchScanHistory, assessScan } from '../../auth/scanApi';
import AssessmentGenerationOverlay from './AssessmentGenerationOverlay';

/* ── Helpers ────────────────────────────────────────────────────────── */

/** Normalize disease names — collapse multiple spaces */
const normaliseName = (name) => (name || '').replace(/\s{2,}/g, ' ').trim();

/** Convert confidence float to readable percentage */
const toPercent = (val) => {
  if (val == null) return '—';
  return `${Math.round(val * 100)}%`;
};

/** Format ISO date to readable */
const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

/** Get severity badge style */
const severityBadge = (level) => {
  if (!level || level === 'N/A') return 'bg-slate-100 text-slate-600';
  const l = level.toLowerCase();
  if (l.includes('1') || l.includes('mild')) return 'bg-emerald-100 text-emerald-700';
  if (l.includes('2') || l.includes('moderate')) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700'; // Level 3+ or severe
};

/** Determine disease display category */
const diseaseCategory = (type) => {
  if (!type) return 'unknown';
  const t = normaliseName(type).toLowerCase();
  if (t.includes('no disease')) return 'clean';
  if (t.includes('non dental') || t.includes('non-dental')) return 'non-dental';
  return 'disease';
};

/* ── Skeleton Loader ────────────────────────────────────────────────── */
function ScanCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex gap-4">
        <div className="skeleton w-20 h-20 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/* ── Scan Image with error fallback ──────────────────────────────────── */
function ScanImage({ src, alt, className = '' }) {
  const [imgError, setImgError] = useState(false);

  if (imgError || !src) {
    return (
      <div className={`bg-slate-100 border border-slate-200 flex items-center justify-center ${className}`}>
        <ImageIcon className="w-8 h-8 text-slate-300" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}

/* ── Disease Pills ───────────────────────────────────────────────────── */
function DiseasePills({ diseases }) {
  if (!diseases || diseases.length === 0) return <span className="text-xs text-slate-400">No findings</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {diseases.map((d, i) => {
        const cat = diseaseCategory(d.disease_type);
        const name = normaliseName(d.disease_type);
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              cat === 'clean'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : cat === 'non-dental'
                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                  : severityBadge(d.severity_level) + ' border border-current/10'
            }`}
          >
            {cat === 'clean' && <CheckCircle2 className="w-3 h-3" />}
            {name}
          </span>
        );
      })}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────── */
export default function ScanHistoryPage() {
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    if (!getStoredToken()) navigate('/login');
  }, [navigate]);

  const [latestScan, setLatestScan] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasFetchedRef = useRef(false);

  // Assessment generation overlay
  const [generatingFor, setGeneratingFor] = useState(null); // scan object or null
  const [assessLoading, setAssessLoading] = useState(null); // scanId for simple loading (assessed scans)

  /* ── Fetch data ─────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetchLatestDentalScan().catch(() => null),
        fetchScanHistory(),
      ]);

      // Process scan list — sort by created_at desc
      const scanList = (historyRes?.data?.scans || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setScans(scanList);

      // Process latest scan + cross-ref assessed status from scan list
      if (latestRes?.data?.dental_record) {
        const lr = latestRes.data;
        const matchingScan = scanList.find(s => s.id === lr.dental_record.id);
        setLatestScan({
          ...lr.dental_record,
          detected_diseases: lr.detected_diseases || [],
          assessed: matchingScan?.assessed ?? false,
          user: lr.user,
        });
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(err?.response?.data?.message || err?.message || 'Failed to load scan history.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchData();
  }, [fetchData]);

  /* ── Assessment handlers ──────────────────────────────────────────── */

  /** For assessed scans: simple load then navigate */
  const handleViewAssessment = useCallback(async (scan) => {
    if (assessLoading) return;
    setAssessLoading(scan.id);
    try {
      const res = await assessScan(scan.id);
      const assessment = res?.data?.assessment;
      const source = res?.data?.source || 'existing';
      if (assessment) {
        navigate(`/scan-history/${scan.id}/assessment/${assessment.id}`, {
          state: { assessment, source, scan },
        });
      }
    } catch (err) {
      // If it fails, still try navigate to detail
      navigate(`/scan-history/${scan.id}`, { state: { scan } });
    } finally {
      setAssessLoading(null);
    }
  }, [assessLoading, navigate]);

  /** For unassessed scans: full generation overlay */
  const handleGenerateAssessment = useCallback((scan) => {
    const diseases = scan.detected_diseases || [];
    const primary = diseases[0];
    setGeneratingFor({
      ...scan,
      _context: {
        disease: primary ? normaliseName(primary.disease_type) : null,
        severity: primary?.severity_level,
      },
    });
  }, []);

  /** Generation overlay success callback */
  const handleGenerationSuccess = useCallback((assessment, source) => {
    setGeneratingFor(null);
    // Refresh scan list to update assessed status
    hasFetchedRef.current = false;
    if (assessment) {
      navigate(`/scan-history/${generatingFor?.id}/assessment/${assessment.id}`, {
        state: { assessment, source, scan: generatingFor },
      });
    }
  }, [navigate, generatingFor]);

  /** Navigate to scan detail */
  const handleScanClick = useCallback((scan) => {
    navigate(`/scan-history/${scan.id}`, { state: { scan } });
  }, [navigate]);

  /* ── Loading state ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">
        <Header />
        <div className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6" aria-live="polite">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-56 w-full rounded-3xl" />
          <div className="skeleton h-6 w-36" />
          <div className="space-y-4">
            <ScanCardSkeleton />
            <ScanCardSkeleton />
            <ScanCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center gap-6 px-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 border border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-900">Failed to load scan history</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">{error}</p>
          </div>
          <button
            onClick={() => { hasFetchedRef.current = false; fetchData(); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Empty state ────────────────────────────────────────────────────── */
  if (scans.length === 0 && !latestScan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center gap-6 px-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200">
            <FileSearch className="w-10 h-10 text-slate-300" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900">No Scans Yet</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">
              You haven't uploaded any dental scans. Start a new scan to begin your dental health journey.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Start New Scan
          </button>
        </div>
      </div>
    );
  }

  /* ── Scans to show below the latest hero ───────────────────────────── */
  const previousScans = latestScan
    ? scans.filter(s => s.id !== latestScan.id)
    : scans;

  /* ── Main UI ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">
      <Header />

      {/* Background decorations */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-brand/8 to-indigo-100/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs font-semibold text-brand tracking-wide mb-3">
              <ClipboardList className="w-3.5 h-3.5" />
              Scan History
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Your Dental Scans
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View your scan results and assessments
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-sky-200" />
            New Scan
          </button>
        </div>

        {/* ── Latest Scan Hero Card ──────────────────────────────────────── */}
        {latestScan && (
          <section aria-label="Latest scan">
            <div
              className="relative bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-100/50 overflow-hidden scan-card-hover cursor-pointer group"
              onClick={() => handleScanClick(latestScan)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleScanClick(latestScan); } }}
              tabIndex={0}
              role="button"
              aria-label={`Latest scan from ${formatDate(latestScan.created_at)}`}
            >
              {/* Gradient accent border top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-indigo-500" />

              <div className="p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Image */}
                  <div className="relative shrink-0">
                    <ScanImage
                      src={latestScan.image_path}
                      alt="Latest dental scan"
                      className="w-full lg:w-52 h-44 lg:h-40 rounded-2xl"
                    />
                    {/* Latest badge */}
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand text-white text-xs font-bold shadow-md">
                      <Zap className="w-3 h-3" /> Latest Scan
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(latestScan.created_at)} · {formatTime(latestScan.created_at)}
                        </div>
                        {/* Diseases */}
                        <DiseasePills diseases={latestScan.detected_diseases} />
                      </div>
                      {/* Assessment status */}
                      <div className="shrink-0">
                        {latestScan.assessed ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Assessment Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                            <Clock className="w-3.5 h-3.5" /> Assessment Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <MetricChip label="Quality" value={latestScan.quality_score != null ? `${latestScan.quality_score}%` : '—'} icon={Shield} />
                      <MetricChip label="Confidence" value={toPercent(latestScan.confidence_score)} icon={Activity} />
                      <MetricChip label="Exposure" value={latestScan.exposure || '—'} icon={Eye} />
                      <MetricChip label="Blur" value={latestScan.is_blurred ? 'Detected' : 'Clear'} icon={ImageIcon} good={!latestScan.is_blurred} />
                    </div>

                    {/* Primary action */}
                    <div className="flex items-center gap-3 pt-1">
                      {latestScan.assessed ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewAssessment(latestScan); }}
                          disabled={assessLoading === latestScan.id}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 transition-all disabled:opacity-60"
                          aria-label="View assessment for latest scan"
                        >
                          {assessLoading === latestScan.id ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Loading your assessment…</>
                          ) : (
                            <><Eye className="w-4 h-4" /> View Assessment</>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleGenerateAssessment(latestScan); }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-dark hover:to-indigo-700 shadow-md shadow-brand/20 transition-all"
                          aria-label="Analyse risk for latest scan"
                        >
                          <Sparkles className="w-4 h-4" /> Analyse Risk
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleScanClick(latestScan); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-brand hover:bg-slate-50 border border-slate-200 transition-all"
                        aria-label="View scan details"
                      >
                        View Details <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Previous Scans List ────────────────────────────────────────── */}
        {previousScans.length > 0 && (
          <section aria-label="Previous scans">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Previous Scans
              <span className="text-sm font-medium text-slate-400">({previousScans.length})</span>
            </h2>

            <div className="space-y-4">
              {previousScans.map((scan) => (
                <ScanCard
                  key={scan.id}
                  scan={scan}
                  onClick={() => handleScanClick(scan)}
                  onViewAssessment={() => handleViewAssessment(scan)}
                  onGenerateAssessment={() => handleGenerateAssessment(scan)}
                  assessLoading={assessLoading === scan.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* If latest scan exists but no previous scans */}
        {latestScan && previousScans.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">This is your only scan so far.</p>
          </div>
        )}
      </main>

      {/* ── Assessment Generation Overlay ─────────────────────────────── */}
      <AssessmentGenerationOverlay
        isOpen={!!generatingFor}
        onClose={() => setGeneratingFor(null)}
        scanId={generatingFor?.id}
        assessFn={assessScan}
        onSuccess={handleGenerationSuccess}
        scanContext={generatingFor?._context}
      />
    </div>
  );
}

/* ── MetricChip sub-component ──────────────────────────────────────── */
function MetricChip({ label, value, icon: Icon, good }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${good === false ? 'text-amber-500' : 'text-slate-400'}`} />
      <div>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xs font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

/* ── ScanCard sub-component ────────────────────────────────────────── */
function ScanCard({ scan, onClick, onViewAssessment, onGenerateAssessment, assessLoading }) {
  const diseases = scan.detected_diseases || [];
  const primaryDisease = diseases[0];
  const cat = primaryDisease ? diseaseCategory(primaryDisease.disease_type) : 'unknown';

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-50/50 overflow-hidden scan-card-hover cursor-pointer group"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      tabIndex={0}
      role="button"
      aria-label={`Scan from ${formatDate(scan.created_at)}`}
    >
      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Thumbnail */}
          <div className="relative shrink-0">
            <ScanImage
              src={scan.image_path}
              alt={`Dental scan from ${formatDate(scan.created_at)}`}
              className="w-full sm:w-24 h-32 sm:h-24 rounded-xl"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Top row — date + status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {formatDate(scan.created_at)} · {formatTime(scan.created_at)}
              </div>
              <div className="shrink-0">
                {scan.assessed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Assessed
                  </span>
                ) : cat === 'clean' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> No Disease
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
            </div>

            {/* Diseases */}
            <DiseasePills diseases={diseases} />

            {/* Metrics row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> Quality: {scan.quality_score != null ? `${scan.quality_score}%` : '—'}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" /> Confidence: {toPercent(scan.confidence_score)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {scan.exposure || '—'}
              </span>
              {scan.is_blurred && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="w-3 h-3" /> Blurred
                </span>
              )}
            </div>
          </div>

          {/* Action column */}
          <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0 pt-2 sm:pt-0">
            {scan.assessed ? (
              <button
                onClick={(e) => { e.stopPropagation(); onViewAssessment(); }}
                disabled={assessLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand hover:bg-brand-dark shadow-sm transition-all disabled:opacity-60"
                aria-label="View assessment"
              >
                {assessLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                {assessLoading ? 'Loading…' : 'View Report'}
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onGenerateAssessment(); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-dark hover:to-indigo-700 shadow-sm transition-all"
                aria-label="Analyse risk"
              >
                <Sparkles className="w-3.5 h-3.5" /> Analyse Risk
              </button>
            )}
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors hidden sm:block" />
          </div>
        </div>
      </div>
    </div>
  );
}
