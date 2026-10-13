import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    Upload,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    Eye,
    Image as ImageIcon,
    ArrowLeft,
    Activity,
    Sparkles,
    Layers,
    BarChart2,
    Sliders,
    Zap,
    ShieldCheck,
    Fingerprint,
    Target,
    ScanLine,
    Radar as RadarIcon,
    ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../auth/useAuth";
import { usePage } from "../../context/PageContext";
import { MODEL_API_BASE_URL } from "../../auth/authConfig";

export default function ValidationPage() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const { navigateTo } = usePage();

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [backendData, setBackendData] = useState(null);
    const [error, setError] = useState(null);

    
    const [showHeatmap, setShowHeatmap] = useState(false);

    // Progressive steps state
    const [steps, setSteps] = useState({
        validity: 'idle',      
        orientation: 'idle',
        metrics: 'idle',
        pathology: 'idle'
    });

    //  real time pipeline popup 
    const [showPipelineModal, setShowPipelineModal] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    if (!isLoggedIn) {
        return null;
    }

    // Handle File Selection & Local Preview
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setBackendData(null);
            setError(null);
            setShowHeatmap(false);
            setSteps({ validity: 'idle', orientation: 'idle', metrics: 'idle', pathology: 'idle' });
        }
    };

    // Clear All States (Re-Upload Logic)
    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setBackendData(null);
        setError(null);
        setShowHeatmap(false);
        setSteps({ validity: 'idle', orientation: 'idle', metrics: 'idle', pathology: 'idle' });
    };

    // Reject Alert Popup Logic
    const triggerRejectionPopup = (reason, label, confidence) => {
        Swal.fire({
            title: `<span style="color: #e11d48; font-family: sans-serif; font-weight: 800; letter-spacing: 0.02em;">INTEGRITY CHECK FAILED</span>`,
            html: `
        <div style="text-align: center; font-family: sans-serif; color: #475569; font-size: 14px;">
          <p style="margin-bottom: 15px;">The uploaded media could not pass the Stage 1 AI validation gate.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 12px; text-align: left;">
            <b style="color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;">REASON:</b> <span style="color: #e11d48; font-weight: bold;">${reason}</span><br/>
            <b style="color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 5px; display: inline-block;">CLASSIFICATION:</b> ${label} (${(confidence * 100).toFixed(0)}% Match)
          </div>
          <p style="color: #d97706; font-size: 11px; margin-top: 10px; font-style: italic;">⚠️ Downstream pathology diagnostics bypassed.</p>
        </div>
      `,
            icon: "error",
            background: "#ffffff",
            confirmButtonText: "🔄 Re-Upload Radiograph",
            confirmButtonColor: "#e11d48",
            allowOutsideClick: false,
            customClass: {
                popup: 'rounded-3xl shadow-xl'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                handleReset();
            }
        });
    };

    // Upload to Flask Backend API
    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Please select an X-ray image first.");
            return;
        }

        setLoading(true);
        setBackendData(null);
        setError(null);
        setShowHeatmap(false);
        setShowPipelineModal(true);

        setSteps({
            validity: 'processing',
            orientation: 'idle',
            metrics: 'idle'
        });

        const formData = new FormData();
        formData.append("image", selectedFile);

        try {
            const apiResponse = await axios.post(`${MODEL_API_BASE_URL}/validate`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const resData = apiResponse.data;

            if (resData.status === "Rejected" || resData.status === "failed" || !resData.status) {
                setSteps({
                    validity: 'error',
                    orientation: 'idle',
                    metrics: 'idle'
                });
                setBackendData(resData);
                setLoading(false);
                setShowPipelineModal(false);

                const reasonText = resData.validation_results?.reason || resData.message || "Uploaded image is not a valid dental X-ray.";
                const labelText = resData.validation_results?.label || "Unknown Artifact";
                const confidenceValue = resData.validation_results?.confidence ? (resData.validation_results.confidence * 100).toFixed(0) + "%" : "N/A";

                try {
                    triggerRejectionPopup(reasonText, labelText, resData.validation_results?.confidence || 0);
                } catch (swalError) {
                    alert(`❌ INTEGRITY CHECK FAILED\n\nReason: ${reasonText}\nClassification: ${labelText} (${confidenceValue})\n\nPlease re-upload a valid dental radiograph.`);
                    handleReset();
                }
                return;
            }

            setSteps(s => ({ ...s, validity: 'success', orientation: 'processing' }));

            setTimeout(() => {
                setSteps(s => ({ ...s, orientation: 'success', metrics: 'processing' }));

                setTimeout(() => {
                    setSteps(s => ({ ...s, metrics: 'success' }));
                    setBackendData(resData);
                    setLoading(false);

                    // Hold on "Success" for a moment before the popup auto-closes
                    setTimeout(() => {
                        setShowPipelineModal(false);
                    }, 1100);
                }, 800);
            }, 800);

        } catch (err) {
            setSteps({ validity: 'error', orientation: 'idle', metrics: 'idle' });
            setError("Backend connection failed. Please check if your Flask server is running.");
            setLoading(false);
            setShowPipelineModal(false);
        }
    };

    const renderStepStatus = (status) => {
        switch (status) {
            case 'processing':
                return (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full border border-brand/20 bg-brand/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping"></span>
                    </span>
                );
            case 'success':
                return <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50" />;
            case 'error':
                return <AlertTriangle className="w-5 h-5 text-rose-500 fill-rose-50" />;
            case 'idle':
            default:
                return <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-white"></div>;
        }
    };

    const valResults = backendData?.validation_results || {};
    const metricsBreakdown = valResults.metrics_breakdown || {};
    const classProbabilities = valResults.class_probabilities || {};

    const DONUT_COLORS = ['#00ff48', '#3b82f6', '#ffffff', '#f59e0b', '#ef4444'];
    const probEntries = Object.entries(classProbabilities).sort((a, b) => Number(b[1]) - Number(a[1]));
    const topConfidence = probEntries.length > 0 ? Math.max(...probEntries.map(([, val]) => Number(val))) : 0;
    const topClassEntry = probEntries.length > 0 ? probEntries[0] : null;

    // Needle rotation angle formula (-90deg to 90deg)
    const needleAngle = -90 + (topConfidence / 100) * 180;

    // Nothing here invents numbers that were not returned by the API.

    const isSuccess = backendData && backendData.status === "Success";
    const isRejected = backendData && (backendData.status === "Rejected" || backendData.status === "failed" || !backendData.status);

    const stage4Status = isSuccess ? 'success' : (isRejected || steps.validity === 'error') ? 'error' : (loading && steps.metrics === 'success') ? 'processing' : 'idle';

    const hasQualityScore = valResults.quality_score !== undefined && valResults.quality_score !== null && !Number.isNaN(Number(valResults.quality_score));

    const qualityMetricDefs = [
        { key: 'blur_score', name: "Sharpness / Blur", axisShort: "SHP" },
        { key: 'brightness_score', name: "Brightness Level", axisShort: "BRT" },
        { key: 'contrast_score', name: "Contrast Ratio", axisShort: "CTR" },
        { key: 'exposure_score', name: "Exposure Index", axisShort: "EXP" },
    ].map((m) => ({
        ...m,
        hasValue: metricsBreakdown[m.key] !== undefined && metricsBreakdown[m.key] !== null,
        value: Number(metricsBreakdown[m.key]) || 0,
    }));

    // Radar polygon geometry for the four quality metrics
    const RADAR_CENTER = 100;
    const RADAR_MAX_R = 72;
    const radarPoint = (index, total, value) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
        const r = (Math.max(0, Math.min(100, value)) / 100) * RADAR_MAX_R;
        return [RADAR_CENTER + r * Math.cos(angle), RADAR_CENTER + r * Math.sin(angle)];
    };
    const radarAxisPoint = (index, total, r) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
        return [RADAR_CENTER + r * Math.cos(angle), RADAR_CENTER + r * Math.sin(angle)];
    };
    const radarValues = qualityMetricDefs.map(m => m.value);
    const radarPolygon = qualityMetricDefs.map((_, i) => radarPoint(i, qualityMetricDefs.length, radarValues[i]).join(",")).join(" ");
    const anyRadarData = qualityMetricDefs.some(m => m.hasValue);

    // Real time pipeline popup tage list + progress bar percentage
    const pipelineStages = [
        { label: "Image Integrity", sub: "Verify structure", status: steps.validity },
        { label: "Orientation Analysis", sub: "Flip & rotation", status: steps.orientation },
        { label: "Quality Assessment", sub: "Blur & heatmap", status: steps.metrics },
        { label: "Validation Decision", sub: "Final outcome", status: stage4Status },
    ];
    const pipelineProgress = Math.round(
        (pipelineStages.reduce((acc, s) => acc + (s.status === 'success' ? 1 : s.status === 'processing' ? 0.5 : 0), 0) / pipelineStages.length) * 100
    );
    const pipelineComplete = stage4Status === 'success';
    const pipelineFailed = pipelineStages.some(s => s.status === 'error');

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-colors duration-300">
            <Header />

            {/* REAL-TIME PIPELINE POPUP */}
            {showPipelineModal && (
                <div className="fixed inset-0 z-50 bg-slate-90/50 backdrop-blur-sm flex items-center justify-center px-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 animate-fadeIn">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                            <Activity className="w-4.5 h-4.5 text-brand" />
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Multi-Stage AI Validation Pipeline</h3>
                                <p className="text-[11px] text-slate-400">Processing radiograph in real time…</p>
                            </div>
                        </div>

                        <div className="space-y-3 py-5">
                            {pipelineStages.map((stage, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl border ${stage.status === 'processing' ? 'border-brand/40 bg-brand/5' : 'border-slate-100 bg-slate-50/30'}`}>
                                    <div className="flex items-center space-x-3">
                                        {renderStepStatus(stage.status)}
                                        <div className="text-xs">
                                            <div className="font-bold text-slate-800">{stage.label}</div>
                                            <div className="text-slate-400 text-[10px]">{stage.sub}</div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-mono font-bold text-slate-300">{String(idx + 1).padStart(2, "0")}</span>
                                </div>
                            ))}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                <span>Pipeline Progress</span>
                                <span>{pipelineProgress}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${pipelineFailed ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-brand'}`}
                                    style={{ width: `${pipelineProgress}%` }}
                                ></div>
                            </div>
                        </div>

                        {pipelineComplete && (
                            <div className="mt-5 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-sm uppercase tracking-wider">
                                <CheckCircle className="w-5 h-5" />
                                Success
                            </div>
                        )}
                    </div>
                </div>
            )}

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
                    <div>
                        <button
                            onClick={() => { navigateTo('dashboard'); navigate('/'); }}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand mb-3 transition-colors group cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Dashboard</span>
                        </button>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                            Stage 1: <span className="bg-gradient-to-r from-brand to-indigo-600 bg-clip-text text-transparent">Image Validation & Diagnostics</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
                            AI-assisted radiographic integrity, orientation and image-quality validation before downstream pathology analysis.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs font-semibold text-brand tracking-wide uppercase flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-brand animate-ping"></span>
                            Pipeline Active
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedFile ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                            Image {selectedFile ? 'Loaded' : 'Not Loaded'}
                            <span className="mx-1 text-slate-300">/</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-500' : loading ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'}`}></span>
                            Analysis {isSuccess ? 'Complete' : loading ? 'Running' : 'Idle'}
                        </div>
                    </div>
                </div>

                <div className={`grid grid-cols-1 ${isSuccess ? "gap-8" : "lg:grid-cols-12 gap-8"} items-start`}>
                    {/* LEFT COLUMN / TOP ROW: UPLOAD */}
                    <div className={`${isSuccess ? "w-full max-w-7xl mx-auto" : "lg:col-span-4"} bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 flex flex-col justify-between ${isSuccess ? "" : "min-h-[420px]"}`}>
                        <div>
                            <h2 className="text-md font-bold mb-1 flex items-center gap-2 text-slate-950 uppercase tracking-wider">
                                <ImageIcon className="text-brand w-5 h-5" /> Radiographic Input
                            </h2>
                            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">Provide a dental radiograph for the Stage 1 validation gate.</p>

                            <div className={isSuccess ? "flex flex-col md:flex-row md:items-stretch gap-6" : "flex flex-col h-full"}>
                                <div className={isSuccess ? "flex-1" : ""}>
                                    <label className={`border-2 border-dashed border-slate-200 hover:border-brand/70 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-slate-50/30 hover:bg-slate-50 ${isSuccess ? "h-full min-h-[160px]" : "min-h-[220px]"} group relative`}>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={loading} />
                                        {previewUrl ? (
                                            <>
                                                <img src={previewUrl} alt="Preview" className={`${isSuccess ? "max-h-[140px]" : "max-h-[180px]"} rounded-xl object-contain shadow shadow-slate-200/50`} />
                                                <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                    <CheckCircle className="w-3 h-3" /> Loaded
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-brand group-hover:scale-105 transition-all duration-300 mb-3">
                                                    <Upload className="w-6 h-6" />
                                                </div>
                                                <span className="text-sm text-slate-700 font-semibold">Click to upload X-ray</span>
                                                <span className="text-[11px] text-slate-400 mt-1">JPG, PNG — periapical or panoramic</span>
                                            </>
                                        )}
                                    </label>

                                    {selectedFile && !isSuccess && (
                                        <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                                            <span className="truncate max-w-[70%]" title={selectedFile.name}>{selectedFile.name}</span>
                                            <span>{(selectedFile.size / 1024).toFixed(0)} KB</span>
                                        </div>
                                    )}

                                    {error && !isSuccess && (
                                        <div className="mt-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 shadow-sm">
                                            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                                            <span className="leading-relaxed font-semibold">{error}</span>
                                        </div>
                                    )}
                                </div>

                                {isSuccess && (
                                    <div className="w-full md:w-1/3 flex flex-col justify-end">
                                        {selectedFile && (
                                            <div className="mb-4 flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                                                <span className="truncate max-w-[70%]" title={selectedFile.name}>{selectedFile.name}</span>
                                                <span>{(selectedFile.size / 1024).toFixed(0)} KB</span>
                                            </div>
                                        )}
                                        {error && (
                                            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 shadow-sm">
                                                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                                                <span className="leading-relaxed font-semibold">{error}</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleUpload}
                                            disabled={loading || !selectedFile}
                                            className={`w-full py-4 mt-auto rounded-2xl font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 text-white shadow-lg border transition-all duration-300 cursor-pointer ${loading || !selectedFile
                                                ? "bg-slate-100 text-slate-400 border-slate-200 shadow-none cursor-not-allowed opacity-50"
                                                : "bg-brand hover:bg-brand-dark border-brand shadow-brand/25 hover:-translate-y-0.5"
                                                }`}
                                        >
                                            {loading ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    <span>Validating...</span>
                                                </>
                                            ) : (
                                                "Run AI Validation"
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!isSuccess && (
                            <button
                                onClick={handleUpload}
                                disabled={loading || !selectedFile}
                                className={`w-full py-4 mt-8 rounded-2xl font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 text-white shadow-lg border transition-all duration-300 cursor-pointer ${loading || !selectedFile
                                    ? "bg-slate-100 text-slate-400 border-slate-200 shadow-none cursor-not-allowed opacity-50"
                                    : "bg-brand hover:bg-brand-dark border-brand shadow-brand/25 hover:-translate-y-0.5"
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Validating...</span>
                                    </>
                                ) : (
                                    "Run AI Validation"
                                )}
                            </button>
                        )}
                    </div>

                    {/* RIGHT COLUMN / BOTTOM ROW: PIPELINE OUTPUTS */}
                    <div className={`${isSuccess ? "w-full" : "lg:col-span-8"} space-y-6`}>

                        {/* EMPTY STATE */}
                        {!backendData && !loading && (
                            <div className="bg-white p-12 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center min-h-[420px] shadow-xl shadow-slate-100/40">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                                    <Eye className="w-6 h-6 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">No Radiograph Currently Loaded</h3>
                                <p className="text-sm text-slate-500 mt-2 max-w-sm">Upload a dental X-ray to begin the AI validation pipeline.</p>
                            </div>
                        )}

                        {/* LOADING STATE (pipeline detail is shown in the popup) */}
                        {loading && (
                            <div className="bg-white p-12 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center min-h-[420px] shadow-xl shadow-slate-100/40">
                                <RefreshCw className="w-7 h-7 text-brand animate-spin mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">Running AI Validation</h3>
                                <p className="text-sm text-slate-500 mt-2 max-w-sm">Follow real-time pipeline status in the popup above.</p>
                            </div>
                        )}

                        {/* SUCCESS RESULTS DISPLAY */}
                        {backendData && !loading && backendData.status === "Success" && (
                            <div className="space-y-6 animate-fadeIn">

                                {/* AI VALIDATION RESULT SUMMARY - HIGHLY HIGHLIGHTED */}
                                <div className="bg-white rounded-3xl border-2 border-emerald-400 shadow-2xl shadow-emerald-200/50 overflow-hidden transform transition-all">
                                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 sm:px-8 py-5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                                <ShieldCheck className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="text-sm font-black uppercase tracking-widest text-white">Validation Result</span>
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-white px-4 py-1.5 rounded-full shadow-sm">
                                            {backendData.status === "Success" ? "System Validated" : backendData.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 px-6 sm:px-8 py-6 text-xs bg-emerald-50/30">
                                        <div className="flex flex-col">
                                            <div className="text-emerald-600/70 font-bold uppercase tracking-widest text-[10px] mb-1.5">Image Quality</div>
                                            <div className="font-black text-slate-900 text-xl">{hasQualityScore ? `${valResults.quality_score}%` : "N/A"}</div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-emerald-600/70 font-bold uppercase tracking-widest text-[10px] mb-1.5">Orientation</div>
                                            <div className="font-black text-slate-900 text-lg truncate">{valResults.rotation_applied || "N/A"}</div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-emerald-600/70 font-bold uppercase tracking-widest text-[10px] mb-1.5">Exposure</div>
                                            <div className="font-black text-slate-900 text-lg truncate">{valResults.exposure || "N/A"}</div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-emerald-600/70 font-bold uppercase tracking-widest text-[10px] mb-1.5">Dominant Class</div>
                                            <div className="font-black text-slate-900 text-lg truncate">{topClassEntry ? topClassEntry[0] : "N/A"}</div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-emerald-600/70 font-bold uppercase tracking-widest text-[10px] mb-1.5">Confidence</div>
                                            <div className="font-black text-brand text-xl">{probEntries.length > 0 ? `${topConfidence}%` : "N/A"}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* ORIGINAL INPUT + AI-PROCESSED OUTPUT - SEPARATE SECTION */}
                                <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xl shadow-slate-100/50 p-6 sm:p-8">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-6">
                                        <ScanLine className="w-5 h-5 text-brand" /> Radiographic Comparison
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Original Input</span>
                                                <span className="text-xs font-mono text-slate-400 uppercase">Raw Upload</span>
                                            </div>
                                            <div className="bg-white p-2 flex items-center justify-center h-[400px] rounded-xl overflow-hidden shadow-sm">
                                                <img src={previewUrl} alt="Original" className="max-h-full max-w-full object-contain rounded-xl" />
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative flex flex-col justify-between">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-sm font-bold text-brand uppercase tracking-wider block">
                                                    {showHeatmap ? "Blur Heatmap Overlay" : "Fixed Output"}
                                                </span>
                                                {valResults.blur_heatmap_base64 && (
                                                    <button
                                                        // onClick={() => setShowHeatmap(!showHeatmap)}
                                                        // className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer shadow-sm"
                                                    >
                                                        {/* <Layers className="w-4 h-4" /> */}
                                                        {/* <span>{showHeatmap ? "View Clean X-Ray" : "Show Blur Heatmap"}</span> */}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="bg-white p-2 flex items-center justify-center h-[400px] relative rounded-xl overflow-hidden shadow-sm">
                                                <img
                                                    src={showHeatmap && valResults.blur_heatmap_base64 ? valResults.blur_heatmap_base64 : backendData.fixed_image_url}
                                                    alt={showHeatmap ? "Blur Heatmap Overlay" : "Fixed Result"}
                                                    className="max-h-full max-w-full object-contain rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ADVANCED MEDICAL DASHBOARD CHARTS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* CHART 1: RADIAL GAUGE FOR ORIENTATION CONFIDENCE */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl flex flex-col justify-between relative overflow-hidden">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <BarChart2 className="w-4 h-4 text-brand" />
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Classification Confidence</h4>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Model Output</span>
                                        </div>

                                        <div className="relative flex flex-col items-center justify-center my-3">
                                            <svg className="w-56 h-28 overflow-visible" viewBox="0 0 100 50">
                                                <defs>
                                                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#818cf8" />
                                                        <stop offset="50%" stopColor="#6366f1" />
                                                        <stop offset="100%" stopColor="#4f46e5" />
                                                    </linearGradient>
                                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.4" />
                                                    </filter>
                                                </defs>

                                                {/* Confidence zone bands (low / moderate / high) */}
                                                <path d="M 10 50 A 40 40 0 0 1 26.6 20.4" fill="none" stroke="#fecdd3" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
                                                <path d="M 26.6 20.4 A 40 40 0 0 1 73.4 20.4" fill="none" stroke="#fde68a" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
                                                <path d="M 73.4 20.4 A 40 40 0 0 1 90 50" fill="none" stroke="#a7f3d0" strokeWidth="4" strokeLinecap="round" opacity="0.7" />

                                                {/* Scale Ticks Background */}
                                                {Array.from({ length: 11 }).map((_, i) => {
                                                    const angle = (180 / 10) * i;
                                                    const rad = (angle * Math.PI) / 180;
                                                    const x1 = 50 - 45 * Math.cos(rad);
                                                    const y1 = 50 - 45 * Math.sin(rad);
                                                    const x2 = 50 - 41 * Math.cos(rad);
                                                    const y2 = 50 - 41 * Math.sin(rad);
                                                    return (
                                                        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1" />
                                                    );
                                                })}

                                                {/* Background Outer Arc */}
                                                <path
                                                    d="M 10 50 A 40 40 0 0 1 90 50"
                                                    fill="none"
                                                    stroke="#f1f5f9"
                                                    strokeWidth="10"
                                                    strokeLinecap="round"
                                                />
                                                {/* Active Glowing Arc */}
                                                <path
                                                    d="M 10 50 A 40 40 0 0 1 90 50"
                                                    fill="none"
                                                    stroke="url(#gaugeGradient)"
                                                    strokeWidth="10"
                                                    strokeLinecap="round"
                                                    strokeDasharray="125.6"
                                                    strokeDashoffset={125.6 - (125.6 * (topConfidence / 100))}
                                                    filter="url(#glow)"
                                                    className="transition-all duration-1000 ease-out"
                                                />

                                                {/* Dynamic Needle Indicator */}
                                                <g transform={`rotate(${needleAngle}, 50, 50)`} className="transition-transform duration-1000 ease-out">
                                                    <line x1="50" y1="50" x2="50" y2="17" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                                                    <circle cx="50" cy="50" r="4" fill="#0f172a" />
                                                    <circle cx="50" cy="50" r="2" fill="#ffffff" />
                                                </g>
                                            </svg>

                                            <div className="text-center mt-2">
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                                                        {topConfidence}%
                                                    </span>
                                                    <span className="text-xs font-bold text-emerald-600">
                                                        {topConfidence >= 75 ? "High" : topConfidence >= 40 ? "Moderate" : "Low"}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Classification Reliability{topClassEntry ? ` · ${topClassEntry[0]}` : ""}</span>
                                            </div>
                                        </div>

                                        {/* Ranked Probability Distribution */}
                                        <div className="space-y-2 pt-3 border-t border-slate-100">
                                            {probEntries.map(([cls, prob], idx) => (
                                                <div key={idx} className="flex items-center gap-2.5">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}></span>
                                                    <span className={`text-[11px] font-mono truncate w-24 shrink-0 ${idx === 0 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{cls}</span>
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{ width: `${Math.min(100, Math.max(0, Number(prob)))}%`, backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-xs font-extrabold w-10 text-right shrink-0 ${idx === 0 ? 'text-slate-900' : 'text-slate-500'}`}>{prob}%</span>
                                                </div>
                                            ))}
                                            {probEntries.length === 0 && (
                                                <div className="text-[11px] text-slate-400 text-center py-2">No classification probabilities reported.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* CHART 2: QUALITY METRICS INDEX WITH THRESHOLD MARKER */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl flex flex-col justify-between">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Sliders className="w-4 h-4 text-brand" />
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Quality Metrics Index</h4>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> UI Target: 80%
                                            </div>
                                        </div>

                                        <div className="space-y-4 py-3 relative">
                                            {/* Vertical Threshold Reference Line at 80% (interface target, not a clinical threshold) */}
                                            <div className="absolute top-0 bottom-0 left-[80%] border-r-2 border-dashed border-amber-300 pointer-events-none z-10 opacity-60"></div>

                                            {qualityMetricDefs.map((metric, idx) => (
                                                <div key={idx} className="space-y-1.5 relative z-0">
                                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                                        <span>{metric.name}</span>
                                                        <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{metric.hasValue ? `${metric.value}%` : "N/A"}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-3 rounded-xl overflow-hidden p-0.5 border border-slate-200/50">
                                                        <div
                                                            className="h-full rounded-lg shadow-sm transition-all duration-700 ease-out bg-gradient-to-r from-indigo-500 to-brand"
                                                            style={{ width: `${metric.hasValue ? Math.min(100, Math.max(0, metric.value)) : 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Auto-Calibrated
                                            </span>
                                            <span className="font-mono text-[10px] text-slate-400">OpenCV Metric Standard</span>
                                        </div>
                                    </div>
                                </div>

                                {/* QUALITY PROFILE RADAR + VALIDATION EVIDENCE */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* RADAR: RADIOGRAPHIC QUALITY PROFILE */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl flex flex-col">
                                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                            <RadarIcon className="w-4 h-4 text-brand" />
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Radiographic Quality Profile</h4>
                                        </div>

                                        {anyRadarData ? (
                                            <div className="flex items-center justify-center py-4">
                                                <svg viewBox="0 0 200 200" className="w-56 h-56">
                                                    {/* Grid rings */}
                                                    {[0.25, 0.5, 0.75, 1].map((f, i) => (
                                                        <polygon
                                                            key={i}
                                                            points={qualityMetricDefs.map((_, idx) => radarAxisPoint(idx, qualityMetricDefs.length, RADAR_MAX_R * f).join(",")).join(" ")}
                                                            fill="none"
                                                            stroke="#e2e8f0"
                                                            strokeWidth="1"
                                                        />
                                                    ))}
                                                    {/* Axes */}
                                                    {qualityMetricDefs.map((m, idx) => {
                                                        const [x, y] = radarAxisPoint(idx, qualityMetricDefs.length, RADAR_MAX_R);
                                                        return <line key={idx} x1={RADAR_CENTER} y1={RADAR_CENTER} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
                                                    })}
                                                    {/* Data polygon */}
                                                    <polygon points={radarPolygon} fill="#6366f1" fillOpacity="0.18" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" className="transition-all duration-700" />
                                                    {qualityMetricDefs.map((m, idx) => {
                                                        const [x, y] = radarPoint(idx, qualityMetricDefs.length, m.value);
                                                        return <circle key={idx} cx={x} cy={y} r="3" fill="#4f46e5" />;
                                                    })}
                                                    {/* Axis labels */}
                                                    {qualityMetricDefs.map((m, idx) => {
                                                        const [x, y] = radarAxisPoint(idx, qualityMetricDefs.length, RADAR_MAX_R + 16);
                                                        return (
                                                            <text key={idx} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500" style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 700 }}>
                                                                {m.axisShort}
                                                            </text>
                                                        );
                                                    })}
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-[11px] text-slate-400 py-10">No quality metric data reported.</div>
                                        )}

                                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
                                            {qualityMetricDefs.map((m, idx) => (
                                                <div key={idx}>
                                                    <div className="text-[9px] font-mono text-slate-400 uppercase">{m.axisShort}</div>
                                                    <div className="text-xs font-bold text-slate-800">{m.hasValue ? `${m.value}%` : "—"}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* VALIDATION EVIDENCE */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl flex flex-col">
                                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                            <Fingerprint className="w-4 h-4 text-brand" />
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Validation Evidence</h4>
                                        </div>
                                        <div className="space-y-3 pt-4 text-xs">
                                            <div className="flex items-start gap-3">
                                                <ShieldCheck className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <div className="font-bold text-slate-800">Input Integrity</div>
                                                    <div className="text-slate-500">Image classification: <span className="font-semibold text-slate-700">{valResults.label || "Valid Radiograph"}</span></div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Target className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <div className="font-bold text-slate-800">Orientation Evidence</div>
                                                    <div className="text-slate-500">{valResults.rotation_applied ? `Rotation result: ${valResults.rotation_applied}` : "Not reported by backend"}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Sliders className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <div className="font-bold text-slate-800">Quality Evidence</div>
                                                    <div className="text-slate-500">Blur, brightness, contrast and exposure scores computed from the image.</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <BarChart2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <div className="font-bold text-slate-800">Confidence Evidence</div>
                                                    <div className="text-slate-500">{probEntries.length > 0 ? `Class probability distribution across ${probEntries.length} class${probEntries.length > 1 ? 'es' : ''}.` : "Not reported by backend"}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CONTINUE TO STAGE 2 */}
                                <div className="bg-gradient-to-r from-brand/5 to-indigo-50 border border-brand/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white border border-brand/20 flex items-center justify-center shrink-0">
                                            <ClipboardList className="w-4.5 h-4.5 text-brand" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">Stage 1 Validation Complete</div>
                                            <div className="text-xs text-slate-500 mt-0.5">Proceed to Stage 2: Dental Caries Pathology Analysis.</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigateTo('caries', { backendData, originalPreviewUrl: previewUrl });
                                            navigate('/caries');
                                        }}
                                        className="px-6 py-3 bg-brand text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all shrink-0"
                                    >
                                        <Sparkles className="w-4 h-4" /> Continue to Caries Analysis
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}