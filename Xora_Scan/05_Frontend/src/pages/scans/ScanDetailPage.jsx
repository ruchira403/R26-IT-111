import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Loader2, AlertTriangle, RefreshCw, ArrowLeft, Calendar, Shield,
  Eye, Sparkles, Image as ImageIcon, CheckCircle2, Clock, Activity,
  AlertCircle, ChevronDown
} from 'lucide-react';
import Header from '../../components/Header';
import { getStoredToken } from '../../auth/useAuth';
import { fetchScanHistory, assessScan } from '../../auth/scanApi';
import AssessmentGenerationOverlay from './AssessmentGenerationOverlay';

/* ── Helpers ────────────────────────────────────────────────────────── */
const normaliseName = (name) => (name || '').replace(/\s{2,}/g, ' ').trim();
const toPercent = (val) => val == null ? '—' : `${Math.round(val * 100)}%`;
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};
const formatTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};
const severityBadge = (level) => {
  if (!level || level === 'N/A') return 'bg-slate-100 text-slate-600';
  const l = level.toLowerCase();
  if (l.includes('1') || l.includes('mild')) return 'bg-emerald-100 text-emerald-700';
  if (l.includes('2') || l.includes('moderate')) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

/* ── Scan Image with fallback ──────────────────────────────────────── */
function ScanImage({ src, alt, className = '' }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className={`bg-slate-100 border border-slate-200 flex items-center justify-center ${className}`}>
        <ImageIcon className="w-12 h-12 text-slate-300" />
      </div>
    );
  }
  return <img src={src} alt={alt} className={`object-cover ${className}`} onError={() => setErr(true)} />;
}

/* ── Main Page ────────────────────────────────────────────────────────── */
export default function ScanDetailPage() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Auth guard
  useEffect(() => {
    if (!getStoredToken()) navigate('/login');
  }, [navigate]);

  // Try to get scan from route state first, otherwise fetch
  const [scan, setScan] = useState(location.state?.scan || null);
  const [loading, setLoading] = useState(!scan);
  const [error, setError] = useState('');

  // Assessment states
  const [assessLoading, setAssessLoading] = useState(false);
  const [showGenerationOverlay, setShowGenerationOverlay] = useState(false);

  const hasFetched = useRef(false);

  /* ── Fetch scan if not in route state ─────────────────────────────── */
  const fetchScan = useCallback(async () => {
    if (scan) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    setError('');
    try {
      const res = await fetchScanHistory();
      const list = res?.data?.scans || [];
      const found = list.find(s => String(s.id) === String(scanId));
      if (found) {
        setScan(found);
      } else {
        setError('Scan not found.');
      }
    } catch (err) {
      if (err?.response?.status === 401) { navigate('/login'); return; }
      setError(err?.response?.data?.message || err?.message || 'Failed to load scan.');
    } finally {
      setLoading(false);
    }
  }, [scan, scanId, navigate]);

  useEffect(() => { fetchScan(); }, [fetchScan]);

  /* ── Assessment handlers ──────────────────────────────────────────── */
  const handleViewAssessment = useCallback(async () => {
    if (assessLoading || !scan) return;
    setAssessLoading(true);
    try {
      const res = await assessScan(scan.id);
      const assessment = res?.data?.assessment;
      const source = res?.data?.source || 'existing';
      if (assessment) {
        navigate(`/scan-history/${scan.id}/assessment/${assessment.id}`, {
          state: { assessment, source, scan },
        });
      }
    } catch {
      setError('Failed to load assessment. Please try again.');
    } finally {
      setAssessLoading(false);
    }
  }, [assessLoading, scan, navigate]);

  const handleGenerateAssessment = useCallback(() => {
    setShowGenerationOverlay(true);
  }, []);

  const handleGenerationSuccess = useCallback((assessment, source) => {
    setShowGenerationOverlay(false);
    if (assessment) {
      navigate(`/scan-history/${scan?.id}/assessment/${assessment.id}`, {
        state: { assessment, source, scan },
      });
    }
  }, [navigate, scan]);

  /* ── Loading ────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand to-indigo-500 shadow-lg shadow-brand/25">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Loading scan details…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ──────────────────────────────────────────────────────────── */
  if (error || !scan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center gap-6 px-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 border border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-900">Could not load scan</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">{error || 'Scan data is not available.'}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/scan-history')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to History
            </button>
            <button
              onClick={() => { hasFetched.current = false; setScan(null); setError(''); fetchScan(); }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Scan data ──────────────────────────────────────────────────────── */
  const diseases = scan.detected_diseases || [];
  const primaryDisease = diseases[0];
  const primaryContext = primaryDisease
    ? { disease: normaliseName(primaryDisease.disease_type), severity: primaryDisease.severity_level }
    : {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white flex flex-col">
      <Header />

      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-brand/8 to-indigo-100/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-6">

        {/* Back button */}
        <button
          onClick={() => navigate('/scan-history')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Scan History
        </button>

        {/* Scan header */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Accent top */}
          <div className="h-1 bg-gradient-to-r from-brand to-indigo-500" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Image + headline */}
            <div className="flex flex-col md:flex-row gap-6">
              <ScanImage
                src={scan.image_path}
                alt="Dental scan"
                className="w-full md:w-72 h-56 md:h-52 rounded-2xl"
              />

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(scan.created_at)} · {formatTime(scan.created_at)}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Scan Details
                  </h1>
                </div>

                {/* Assessment status */}
                <div>
                  {scan.assessed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" /> Assessment Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-200">
                      <Clock className="w-4 h-4" /> Assessment Pending
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  {scan.assessed ? (
                    <button
                      onClick={handleViewAssessment}
                      disabled={assessLoading}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 transition-all disabled:opacity-60"
                    >
                      {assessLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Loading your assessment…</>
                      ) : (
                        <><Eye className="w-4 h-4" /> View Assessment</>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateAssessment}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-dark hover:to-indigo-700 shadow-md shadow-brand/20 transition-all"
                    >
                      <Sparkles className="w-4 h-4" /> Generate Assessment
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <DetailMetric label="Quality Score" value={scan.quality_score != null ? `${scan.quality_score}%` : '—'} icon={Shield} />
              <DetailMetric label="Detection Confidence" value={toPercent(scan.confidence_score)} icon={Activity} />
              <DetailMetric label="Exposure" value={scan.exposure || '—'} icon={Eye} />
              <DetailMetric label="Blur Status" value={scan.is_blurred ? 'Blurred' : 'Clear'} icon={ImageIcon} warn={scan.is_blurred} />
            </div>
          </div>
        </div>

        {/* Detected Diseases */}
        {diseases.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand" />
                Detected Findings ({diseases.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              {diseases.map((d, i) => (
                <div key={i} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">{normaliseName(d.disease_type)}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Detection confidence: <span className="font-semibold text-slate-700">{toPercent(d.confidence)}</span></span>
                      <span>·</span>
                      <span>{formatDate(d.created_at)}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${severityBadge(d.severity_level)}`}>
                    {d.severity_level || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Assessment Generation Overlay */}
      <AssessmentGenerationOverlay
        isOpen={showGenerationOverlay}
        onClose={() => setShowGenerationOverlay(false)}
        scanId={scan.id}
        assessFn={assessScan}
        onSuccess={handleGenerationSuccess}
        scanContext={primaryContext}
      />
    </div>
  );
}

/* ── DetailMetric sub-component ────────────────────────────────────── */
function DetailMetric({ label, value, icon: Icon, warn }) {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${warn ? 'text-amber-500' : 'text-slate-400'}`} />
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-lg font-bold ${warn ? 'text-amber-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
