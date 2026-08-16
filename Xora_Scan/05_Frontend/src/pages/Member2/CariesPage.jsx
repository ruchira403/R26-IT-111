import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Activity,
  Sparkles,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Image as ImageIcon,
  Microscope,
  BarChart3,
  Zap,
  FileText,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { usePage } from "../../context/PageContext";
import { getStoredToken } from '../../auth/useAuth';
import { CARIES_API_BASE_URL, MODEL_API_BASE_URL } from '../../auth/authConfig';
import { assessScan } from '../../auth/scanApi';
import RiskAssessmentIntroModal from '../scans/RiskAssessmentIntroModal';
import AssessmentGenerationOverlay from '../scans/AssessmentGenerationOverlay';

const ACCEPTED_FORMATS = "image/jpeg, image/png, image/webp";

export default function CariesPage() {
  const { navigateTo, pageData } = usePage();
  const navigate = useNavigate();

  // Pre-loaded data from Stage 1 (ValidationPage) 
  const passedBackend = pageData?.backendData ?? null;  // full backend payload
  const passedPreview = pageData?.originalPreviewUrl ?? null; // original uploaded image URL
  const passedCaries = passedBackend?.caries_results ?? null;
  const passedFixed = passedBackend?.fixed_image_url ?? null;

  // Determine if we already have caries data handed over from Stage 1
  const hasPassedResult = !!(passedCaries && passedCaries.diagnosis);

  // Fresh-upload state (used when user re-uploads on this page) 
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [freshResult, setFreshResult] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [steps, setSteps] = useState({
    loading: "idle", inference: "idle", postprocess: "idle",
  });
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setPageLoading(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  // NEW STATES FOR DATABASE SAVING
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Post-save risk assessment flow: saved scan -> intro modal -> generation overlay -> report
  const [savedRecordId, setSavedRecordId] = useState(null);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [showGeneratingOverlay, setShowGeneratingOverlay] = useState(false);

  // Show either the fresh result (from a re-upload on this page) or the passed result
  const displayResult = freshResult ?? (hasPassedResult ? passedCaries : null);
  const displayPreview = freshResult
    ? previewUrl
    : (passedFixed || passedPreview); // prefer the fixed image for the "after" display

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFreshResult(null);
    setImageError(null);
    setNetworkError(null);
    setSaveSuccess(false); // Reset database status
    setSteps({ loading: "idle", inference: "idle", postprocess: "idle" });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFreshResult(null);
    setImageError(null);
    setNetworkError(null);
    setSaveSuccess(false); // Reset database status
    setSteps({ loading: "idle", inference: "idle", postprocess: "idle" });
  };

  const runStepsAnimation = () =>
    new Promise((resolve) => {
      setTimeout(() => {
        setSteps((s) => ({ ...s, loading: "success", inference: "processing" }));
        setTimeout(() => {
          setSteps((s) => ({ ...s, inference: "success", postprocess: "processing" }));
          setTimeout(() => {
            setSteps((s) => ({ ...s, postprocess: "success" }));
            resolve();
          }, 900);
        }, 900);
      }, 900);
    });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setFreshResult(null);
    setImageError(null);
    setNetworkError(null);
    setSaveSuccess(false);
    setSteps({ loading: "processing", inference: "idle", postprocess: "idle" });

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const [apiResponse] = await Promise.all([
        axios.post(`${MODEL_API_BASE_URL}/caries`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
        runStepsAnimation(),
      ]);

      const data = apiResponse.data;

      if (data.status === "Rejected" || data.error) {
        setImageError({
          reason: data.reason || data.error || "The uploaded image could not be analysed as a dental radiograph.",
          label: data.label || "Unknown",
          confidence: data.confidence ?? null,
        });
      } else {
        setFreshResult(data);
      }
    } catch (err) {
      console.error(err);
      setSteps((s) => {
        const next = { ...s };
        for (const k of Object.keys(next)) {
          if (next[k] === "processing") { next[k] = "error"; break; }
        }
        return next;
      });
      setNetworkError(
        `Backend connection failed. Please ensure the Flask server is running on ${MODEL_API_BASE_URL}.`
      );
    } finally {
      loading(false);
    }
  };

  // 💡 ── NEW FUNCTION: SAVE TO SHARED POSTGRES DATABASE (UPDATED) ──────────────────────
  const handleSaveToDatabase = async () => {
    if (!displayResult) return;

    setSaveLoading(true);
    try {
      
      const payload = {
        image_path: displayPreview || "path/to/xray_image.png",
        quality_score: passedBackend?.quality_score ?? 100.0, 
        confidence_score: displayResult.caries_confidence ?? 0.0,
        exposure: passedBackend?.exposure ?? "Good",
        is_blurred: passedBackend?.is_blurred ?? false,
        diseases: [
          {
            type: displayResult.diagnosis || "Dental Caries",
            
            severity_level: displayResult.disease_level || "N/A", 
            confidence: displayResult.caries_confidence ?? 0.0
          }
        ]
      };

      console.log("Sending updated payload to Node.js backend:", payload);

      const token = getStoredToken();
      const response = await axios.post(`${CARIES_API_BASE_URL}/save-diagnosis`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data.success || response.data.status === "Success") {
        setSaveSuccess(true);
        if (response.data.recordId) {
          setSavedRecordId(response.data.recordId);
          setShowIntroModal(true);
        }
      }
    } catch (err) {
      console.error("Error saving to database:", err);
      alert(`❌ Failed to save data. Please ensure the Node.js backend is running at ${CARIES_API_BASE_URL}.`);
    } finally {
      setSaveLoading(false);
    }
  };

  /** User confirmed the intro modal — hand off to the assessment generation overlay */
  const handleStartAssessment = () => {
    setShowIntroModal(false);
    setShowGeneratingOverlay(true);
  };

  /** Assessment generated (or already existed) — go straight to the report */
  const handleAssessmentSuccess = (assessment, source) => {
    setShowGeneratingOverlay(false);
    if (assessment && savedRecordId) {
      navigate(`/scan-history/${savedRecordId}/assessment/${assessment.id}`, {
        state: { assessment, source },
      });
    }
  };

  // Helpers 

  const StepBadge = ({ status }) => {
    if (status === "processing")
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full border border-brand/20 bg-brand/5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
        </span>
      );
    if (status === "success") return <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50" />;
    if (status === "error") return <AlertTriangle className="w-5 h-5 text-rose-500 fill-rose-50" />;
    return <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-white" />;
  };

  const severityColour = (level) => {
    const l = (level || "").toLowerCase();
    if (l.includes("severe") || l.includes("3")) return "text-rose-600";
    if (l.includes("moderate") || l.includes("2")) return "text-amber-500";
    if (l.includes("mild") || l.includes("1")) return "text-yellow-500";
    return "text-emerald-600";
  };

  // Are we showing a fresh upload UI (no passed data, or user chose to re-upload)?
  const showUploadPanel = !hasPassedResult || selectedFile;

  // ── UI ───────────────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand via-indigo-500 to-brand opacity-75 blur-md animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand border-r-indigo-500 animate-spin" />
            <div className="absolute inset-1 rounded-full border-2 border-slate-100/30" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">Initializing Disease Analysis</h2>
            <p className="text-sm text-slate-500 mt-2">Loading diagnostic engine...</p>
          </div>
        </div>
      </div>
    );
  }
  // UI

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-colors duration-300">
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        {loading && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-2 border-t-brand border-r-indigo-400 animate-spin" />
              </div>
            </div>
          </div>
        )}

        {/* Page Title Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
          <div>
            <button
              onClick={() => navigateTo("validation")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand mb-3 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Validation</span>
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Stage 2:{" "}
              <span className="bg-gradient-to-r from-brand to-indigo-600 bg-clip-text text-transparent">
                Disease Analysis
              </span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
              Disease Detection{" "}
              <span className="text-slate-700 font-semibold font-mono"></span>{" "}
              |
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-600/20 text-xs font-semibold text-indigo-600 tracking-wide uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            Stage 02 Engine
          </div>
        </div>

        {/* 
            SECTION A — PRE-LOADED RESULTS FROM STAGE 1*/}
        {hasPassedResult && !selectedFile && (
          <div className="space-y-8 animate-fadeIn">

            {/* Stage badge */}
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs font-semibold text-emerald-800 leading-relaxed">
                Stage 1 validation data forwarded successfully — Caries analysis results are pre-loaded below.
              </div>
            </div>

            {/* Dual image panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 relative shadow-xl shadow-slate-100/30">
                <span className="text-xs font-bold text-brand tracking-wider uppercase block mb-3">
                  2. Stage 1 AI-Stabilised Output
                </span>
                <div className="bg-slate-50/50 rounded-xl border border-slate-200/40 p-2 flex items-center justify-center h-[240px]">
                  {passedFixed ? (
                    <img src={passedFixed} alt="Fixed" className="max-h-full max-w-full object-contain rounded-lg" />
                  ) : passedPreview ? (
                    <img src={passedPreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
                  ) : (
                    <div className="text-slate-400 text-xs">No image available</div>
                  )}
                </div>
                <span className="absolute top-4 right-4 bg-brand/10 text-brand text-[9px] font-bold px-2 py-0.5 rounded border border-brand/20 uppercase tracking-wider">
                  Validated ✓
                </span>
              </div>
            </div>

            {/* Pathology Analysis card */}
            <div className="bg-gradient-to-r from-white to-blue-50/50 p-6 rounded-3xl border border-brand/20 shadow-xl shadow-brand/5">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-brand/10">
                <h3 className="text-sm font-bold text-brand tracking-wider uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-pulse text-indigo-500" />
                  <span>Stage 2: Pathology Analysis (Member 02 Engine)</span>
                </h3>
                <span className="bg-brand/10 text-brand text-[9px] font-bold px-2 py-0.5 rounded border border-brand/20 uppercase tracking-wider">
                  YOLOv11 ACTIVE
                </span>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detected Diagnosis</div>
                  <div className="text-lg font-bold text-slate-800 mt-1 leading-snug">
                    {passedCaries.diagnosis ?? "—"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1">Pathology type</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> Model Confidence
                  </div>
                  <div className="text-3xl font-extrabold text-brand mt-1">
                    {((passedCaries.caries_confidence ?? 0) * 100).toFixed(0)}%
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand to-indigo-500 h-full transition-all duration-700"
                      style={{ width: `${((passedCaries.caries_confidence ?? 0) * 100).toFixed(0)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Risk Level
                  </div>
                  <div className={`text-lg font-extrabold mt-1 ${severityColour(passedCaries.disease_level)}`}>
                    {passedCaries.disease_level ?? "—"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Clinical Risk rating
                  </div>
                </div>
              </div>

              {/* Clinical Note */}
              {passedCaries.clinical_note && (
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-brand" />
                    <span> Note</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic">"{passedCaries.clinical_note}"</p>
                </div>
              )}
            </div>

            {/* BUTTON CONTAINER FOR SECTION A */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end p-6 bg-white border border-slate-100 rounded-3xl shadow-md">
              <button
                onClick={() => navigateTo("validation", { triggerFreshUpload: true })}
                className="px-6 py-3 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all uppercase tracking-wider cursor-pointer"
              >
                Upload New Image
              </button>
              <button
                onClick={handleSaveToDatabase}
                disabled={saveLoading || saveSuccess}
                className={`px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                  saveSuccess 
                    ? "bg-emerald-500 shadow-emerald-100 cursor-not-allowed" 
                    : "bg-brand hover:bg-brand-dark shadow-brand/25 hover:-translate-y-0.5 cursor-pointer"
                }`}
              >
                {saveLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> <span>Saving...</span></>
                ) : saveSuccess ? (
                  <><CheckCircle className="w-4 h-4" /> <span>Saved Successfully</span></>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> <span>Continue & Proceed</span></>
                )}
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION B — FRESH UPLOAD UI
         ══════════════════════════════════════════════════════════════════════ */}
        {(!hasPassedResult || selectedFile) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT – Upload Panel */}
            <div className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 flex flex-col justify-between min-h-[420px]">
              <div>
                <h2 className="text-md font-bold mb-4 flex items-center gap-2 text-slate-950 uppercase tracking-wider">
                  <ImageIcon className="text-brand w-5 h-5" /> Dental Radiograph
                </h2>

                <label className="border-2 border-dashed border-slate-200 hover:border-brand/70 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-slate-50/30 hover:bg-slate-50 min-h-[220px] group">
                  <input
                    type="file"
                    accept={ACCEPTED_FORMATS}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-[180px] rounded-xl object-contain shadow shadow-slate-200/50"
                    />
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-brand group-hover:scale-105 transition-all duration-300 mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm text-slate-700 font-semibold group-hover:text-slate-900 transition-colors">
                        Click to upload X-ray
                      </span>
                      <span className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WebP</span>
                    </>
                  )}
                </label>

                {networkError && (
                  <div className="mt-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 shadow-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span className="leading-relaxed font-semibold">{networkError}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={loading || !selectedFile}
                className={`w-full py-4 mt-8 rounded-2xl font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 text-white shadow-lg border transition-all duration-300 cursor-pointer ${
                  loading || !selectedFile
                    ? "bg-slate-100 text-slate-400 border-slate-200 shadow-none cursor-not-allowed opacity-50"
                    : "bg-brand hover:bg-brand-dark border-brand shadow-brand/25 shadow-brand/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                }`}
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /><span>Detecting Caries...</span></>
                ) : (
                  <><ScanSearch className="w-4 h-4" /><span>Run Caries Detection</span></>
                )}
              </button>
            </div>

            {/* RIGHT – Output Panel */}
            <div className="lg:col-span-8 space-y-6">

              {/* Pipeline Steps */}
              {(loading || freshResult || imageError || steps.loading !== "idle") && (
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-brand" />
                      <span>Caries Detection Pipeline</span>
                    </h3>
                    {loading && (
                      <span className="text-[10px] font-semibold text-brand animate-pulse tracking-wider">Analyzing...</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: "loading", label: "1. Image Loading", sub: "Preprocess radiograph" },
                      { key: "inference", label: "2. YOLOv11 Inference", sub: "Run pathology detection" },
                      { key: "postprocess", label: "3. Report Generation", sub: "Compile severity scores" },
                    ].map(({ key, label, sub }) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                          steps[key] === "processing" ? "border-brand/40 bg-brand/5" : "border-slate-100 bg-slate-50/30"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <StepBadge status={steps[key]} />
                          <div className="text-xs">
                            <div className="font-bold text-slate-800">{label}</div>
                            <div className="text-slate-400 text-[10px] mt-0.5 font-medium">{sub}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Idle */}
              {!loading && !freshResult && !imageError && steps.loading === "idle" && (
                <div className="bg-white p-12 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center min-h-[420px] shadow-xl shadow-slate-100/40">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4">
                    <Microscope className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Ready for Caries Detection</h3>
                  <p className="text-sm text-slate-500 max-w-sm mt-2 leading-relaxed">
                    Upload a dental X-ray and run the detection engine to receive a caries pathology report.
                  </p>
                </div>
              )}

              {/* Loading spinner */}
              {loading && (
                <div className="bg-white p-12 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center min-h-[160px] shadow-xl shadow-slate-100/40">
                  <div className="relative w-10 h-10 mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-brand border-r-indigo-400 animate-spin" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 animate-pulse">
                    Running YOLOv11 inference on radiograph...
                  </h3>
                </div>
              )}

              {/* Wrong image error */}
              {imageError && !loading && (
                <div className="bg-rose-50/40 border border-rose-200 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-slate-100/40 min-h-[300px] animate-fadeIn">
                  <div className="w-14 h-14 bg-rose-100 border border-rose-200 rounded-full flex items-center justify-center text-rose-600 mb-4">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-extrabold text-rose-700 tracking-wider uppercase">
                    Invalid Image Detected
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
                    The uploaded image could not be processed by the Caries Detection Engine. Please upload a clear dental panoramic or periapical X-ray.
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-8 px-6 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-md tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Re-upload Correct Image
                  </button>
                </div>
              )}

              {/* ✅ Fresh detection success */}
              {freshResult && !loading && (
                <div className="space-y-6 animate-fadeIn">
                  {freshResult.annotated_image_url && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/30">
                        <span className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-3">Original Radiograph</span>
                        <div className="bg-slate-50/50 rounded-xl border border-slate-200/40 p-2 flex items-center justify-center h-[220px]">
                          <img src={previewUrl} alt="Original" className="max-h-full max-w-full object-contain rounded-lg" />
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 relative shadow-xl shadow-slate-100/30">
                        <span className="text-xs font-bold text-brand tracking-wider uppercase block mb-3">YOLOv11 Annotated Output</span>
                        <div className="bg-slate-50/50 rounded-xl border border-slate-200/40 p-2 flex items-center justify-center h-[220px]">
                          <img src={freshResult.annotated_image_url} alt="Annotated" className="max-h-full max-w-full object-contain rounded-lg" />
                        </div>
                        <span className="absolute top-4 right-4 bg-brand/10 text-brand text-[9px] font-bold px-2 py-0.5 rounded border border-brand/20 uppercase tracking-wider">
                          Caries Mapped
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-white to-blue-50/50 p-6 rounded-3xl border border-brand/20 shadow-xl shadow-brand/5">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-brand/10">
                      <h3 className="text-sm font-bold text-brand tracking-wider uppercase flex items-center gap-2">
                        <Activity className="w-4 h-4 animate-pulse text-indigo-500" />
                        <span>Stage 2: Pathology Analysis (Member 02 Engine)</span>
                      </h3>
                      <span className="bg-brand/10 text-brand text-[9px] font-bold px-2 py-0.5 rounded border border-brand/20 uppercase tracking-wider">
                        YOLOv11 ACTIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detected Diagnosis</div>
                        <div className="text-lg font-bold text-slate-800 mt-1">{freshResult.diagnosis ?? "—"}</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> Model Confidence
                        </div>
                        <div className="text-3xl font-extrabold text-brand mt-1">
                          {((freshResult.caries_confidence ?? 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Severity Level
                        </div>
                        <div className={`text-lg font-extrabold mt-1 ${severityColour(freshResult.disease_level)}`}>
                          {freshResult.disease_level ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 💡 ── BUTTON CONTAINER FOR SECTION B (FRESH SCANS) ───────────────── */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-end p-6 bg-white border border-slate-100 rounded-3xl shadow-md">
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all uppercase tracking-wider cursor-pointer"
                    >
                      Reset / Clear
                    </button>
                    <button
                      onClick={handleSaveToDatabase}
                      disabled={saveLoading || saveSuccess}
                      className={`px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                        saveSuccess 
                          ? "bg-emerald-500 shadow-emerald-100 cursor-not-allowed" 
                          : "bg-brand hover:bg-brand-dark shadow-brand/25 hover:-translate-y-0.5 cursor-pointer"
                      }`}
                    >
                      {saveLoading ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> <span>Saving...</span></>
                      ) : saveSuccess ? (
                        <><CheckCircle className="w-4 h-4" /> <span>Saved Successfully</span></>
                      ) : (
                        <><CheckCircle className="w-4 h-4" /> <span>Continue & Proceed</span></>
                      )}
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </main>

      <Footer />

      {/* ── Post-save risk assessment flow ────────────────────────────── */}
      <RiskAssessmentIntroModal
        isOpen={showIntroModal}
        onClose={() => setShowIntroModal(false)}
        onStart={handleStartAssessment}
        disease={displayResult?.diagnosis}
        severity={displayResult?.disease_level}
      />
      <AssessmentGenerationOverlay
        isOpen={showGeneratingOverlay}
        onClose={() => setShowGeneratingOverlay(false)}
        scanId={savedRecordId}
        assessFn={assessScan}
        onSuccess={handleAssessmentSuccess}
        scanContext={{ disease: displayResult?.diagnosis, severity: displayResult?.disease_level }}
      />
    </div>
  );
}