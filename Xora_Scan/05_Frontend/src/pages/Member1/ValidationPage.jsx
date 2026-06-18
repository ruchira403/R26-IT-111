import React, { useState } from "react";
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
    ShieldCheck,
    FileText,
    Sparkles
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { usePage } from "../../context/PageContext";

export default function ValidationPage() {
    const { navigateTo } = usePage();
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [backendData, setBackendData] = useState(null);
    const [error, setError] = useState(null);

    // Progressive steps state
    const [steps, setSteps] = useState({
        validity: 'idle',      // idle | processing | success | error
        orientation: 'idle',
        metrics: 'idle',
        pathology: 'idle'
    });

    // 1. Handle File Selection & Local Preview
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setBackendData(null);
            setError(null);
            setSteps({ validity: 'idle', orientation: 'idle', metrics: 'idle', pathology: 'idle' });
        }
    };

    // 2. Clear All States (Re-Upload Logic)
    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setBackendData(null);
        setError(null);
        setSteps({ validity: 'idle', orientation: 'idle', metrics: 'idle', pathology: 'idle' });
    };

    // Reject Alert Popup Logic 
    const triggerRejectionPopup = (reason, label, confidence) => {
        Swal.fire({
            title: `<span style="color: #e11d48; font-family: sans-serif; font-weight: 800;">INTEGRITY CHECK FAILED</span>`,
            html: `
        <div style="text-align: center; font-family: sans-serif; color: #475569; font-size: 14px;">
          <p style="margin-bottom: 15px;">The uploaded media could not pass the Stage 1 AI validation gate.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; rounded-xl: 12px; text-align: left; border-radius: 12px;">
            <b style="color: #0f172a; font-size: 12px; uppercase">REASON:</b> <span style="color: #e11d48; font-weight: bold;">${reason}</span><br/>
            <b style="color: #0f172a; font-size: 12px; uppercase; margin-top: 5px; display: inline-block;">CLASSIFICATION:</b> ${label} (${(confidence * 100).toFixed(0)}% Match)
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
                handleReset(); // reset the ui immediatly when the button click
            }
        });
    };

    // 4. Upload to Flask Backend API
    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Please select an X-ray image first.");
            return;
        }

        setLoading(true);
        setBackendData(null);
        setError(null);

        //  'processing' 
        setSteps({
            validity: 'processing',
            orientation: 'idle',
            metrics: 'idle'
        });

        const formData = new FormData();
        formData.append("image", selectedFile);

        try {
            // call Backend API 
            const apiResponse = await axios.post("http://127.0.0.1:5000/validate", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const resData = apiResponse.data;
            console.log("Backend Raw Response Data:", resData); 

            // Broaden condition to handle 'Rejected' and any non-success status
            if (resData.status === "Rejected" || resData.status === "failed" || !resData.status) {

                setSteps({
                    validity: 'error', 
                    orientation: 'idle',
                    metrics: 'idle'
                });
                setBackendData(resData);
                setLoading(false);

                const reasonText = resData.validation_results?.reason || resData.message || "Uploaded image is not a valid dental X-ray.";
                const labelText = resData.validation_results?.label || "Unknown Artifact";
                const confidenceValue = resData.validation_results?.confidence ? (resData.validation_results.confidence * 100).toFixed(0) + "%" : "N/A";

                try {
                    triggerRejectionPopup(reasonText, labelText, resData.validation_results?.confidence || 0);
                } catch (swalError) {
                    console.warn("SweetAlert2 failed, falling back to standard alert:", swalError);
                
                    alert(`❌ INTEGRITY CHECK FAILED\n\nReason: ${reasonText}\nClassification: ${labelText} (${confidenceValue})\n\nPlease re-upload a valid dental radiograph.`);
                    handleReset();
                }
                return;
            }

            //  CASE B: If image is valid (DENTAL X-RAY), run steps 1 to 3 in order
            setSteps(s => ({ ...s, validity: 'success', orientation: 'processing' }));

            setTimeout(() => {
                setSteps(s => ({ ...s, orientation: 'success', metrics: 'processing' }));

                setTimeout(() => {
                    setSteps(s => ({ ...s, metrics: 'success' }));
                    setBackendData(resData);
                    setLoading(false);
                }, 800);
            }, 800);

        } catch (err) {
            console.error("Axios Error Details:", err);
            setSteps({ validity: 'error', orientation: 'idle', metrics: 'idle' });
            setError("Backend connection failed. Please check if your Flask server is running.");
            setLoading(false);
        }
    };

    // Render status indicators for step checklist
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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-colors duration-300">
            <Header />

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">

                {/* Navigation & Branding Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
                    <div>
                        <button
                            onClick={() => navigateTo('dashboard')}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand mb-3 transition-colors group cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Dashboard</span>
                        </button>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                            Stage 1: <span className="bg-gradient-to-r from-brand to-indigo-600 bg-clip-text text-transparent">Image Validation & Diagnostics</span>
                        </h1>
                        {/* <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
                            Researcher ID: <span className="text-slate-700 font-semibold font-mono">it22092016</span>
                        </p> */}
                    </div>
                    <div className="px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs font-semibold text-brand tracking-wide uppercase flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-brand animate-ping"></span>
                        Pipeline Active
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: UPLOAD */}
                    <div className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 flex flex-col justify-between min-h-[420px]">
                        <div>
                            <h2 className="text-md font-bold mb-4 flex items-center gap-2 text-slate-950 uppercase tracking-wider">
                                <ImageIcon className="text-brand w-5 h-5" /> Input Radiograph
                            </h2>

                            <label className="border-2 border-dashed border-slate-200 hover:border-brand/70 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-slate-50/30 hover:bg-slate-50 min-h-[220px] group">
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={loading} />
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="max-h-[180px] rounded-xl object-contain shadow shadow-slate-200/50" />
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-brand group-hover:scale-105 transition-all duration-300 mb-3">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <span className="text-sm text-slate-700 font-semibold">Click to upload X-ray</span>
                                    </>
                                )}
                            </label>

                            {error && (
                                <div className="mt-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 shadow-sm">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                                    <span className="leading-relaxed font-semibold">{error}</span>
                                </div>
                            )}
                        </div>

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
                    </div>

                    {/* RIGHT COLUMN: PIPELINE OUTPUTS */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* PIPELINE STATE CHECKLIST CARD */}
                        {(loading || backendData || steps.validity !== 'idle') && (
                            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                        <Activity className="w-4.5 h-4.5 text-brand" />
                                        <span>Multi-Stage AI Validation Pipeline</span>
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${steps.validity === 'processing' ? 'border-brand/40 bg-brand/5' : 'border-slate-100 bg-slate-50/30'}`}>
                                        <div className="flex items-center space-x-3">
                                            {renderStepStatus(steps.validity)}
                                            <div className="text-xs">
                                                <div className="font-bold text-slate-800">1. Image Validity check</div>
                                                <div className="text-slate-400 text-[10px]">Verify radiograph structure</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${steps.orientation === 'processing' ? 'border-brand/40 bg-brand/5' : 'border-slate-100 bg-slate-50/30'}`}>
                                        <div className="flex items-center space-x-3">
                                            {renderStepStatus(steps.orientation)}
                                            <div className="text-xs">
                                                <div className="font-bold text-slate-800">2. Flip & Rotation check</div>
                                                <div className="text-slate-400 text-[10px]">Resolve flip anomalies</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${steps.metrics === 'processing' ? 'border-brand/40 bg-brand/5' : 'border-slate-100 bg-slate-50/30'}`}>
                                        <div className="flex items-center space-x-3">
                                            {renderStepStatus(steps.metrics)}
                                            <div className="text-xs">
                                                <div className="font-bold text-slate-800">3. Exposure & Sharpness</div>
                                                <div className="text-slate-400 text-[10px]">Calculate contrast ratios</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONDITION A: NO DATA YET */}
                        {!backendData && !loading && (
                            <div className="bg-white p-12 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center min-h-[420px] shadow-xl shadow-slate-100/40">
                                <Eye className="w-8 h-8 text-slate-400 mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">Awaiting AI Execution</h3>
                                <p className="text-sm text-slate-500 mt-2">Upload a dental X-ray and click "Run AI Validation".</p>
                            </div>
                        )}

                        {/* CONDITION C: SUCCESS RESULTS DISPLAY */}
                        {backendData && !loading && backendData.status === "Success" && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* BEFORE / AFTER PANEL */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xl">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">1. Original Uploaded</span>
                                        <div className="bg-slate-50 p-2 flex items-center justify-center h-[220px]">
                                            <img src={previewUrl} alt="Original" className="max-h-full max-w-full object-contain rounded-lg" />
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 relative shadow-xl">
                                        <span className="text-xs font-bold text-brand uppercase tracking-wider block mb-3">2. AI Stabilized (Fixed Output)</span>
                                        <div className="bg-slate-50 p-2 flex items-center justify-center h-[220px]">
                                            <img src={backendData.fixed_image_url} alt="Fixed" className="max-h-full max-w-full object-contain rounded-lg" />
                                        </div>
                                    </div>
                                </div>

                                {/* HUD DATA INDICATORS */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl">
                                        <div className="text-xs font-bold text-slate-500 uppercase">Image Quality Score</div>
                                        <div className="text-3xl font-extrabold text-brand mt-2">{backendData.validation_results?.quality_score}%</div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl">
                                        <div className="text-xs font-bold text-slate-500 uppercase">Orientation Status</div>
                                        <div className="text-sm font-semibold text-slate-800 mt-2 truncate">{backendData.validation_results?.rotation_applied}</div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl">
                                        <div className="text-xs font-bold text-slate-500 uppercase">Radiograph Exposure</div>
                                        <div className="text-lg font-bold text-emerald-600 mt-2">{backendData.validation_results?.exposure}</div>
                                    </div>
                                </div>

                                {/* CONTINUE TO STAGE 2 */}
                                <div className="bg-gradient-to-r from-brand/5 to-indigo-50 border border-brand/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">Stage 1 Validation Complete</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Proceed to Stage 2: Dental Caries Pathology Analysis.</div>
                                    </div>
                                    <button
                                        onClick={() => navigateTo('caries', { backendData, originalPreviewUrl: previewUrl })}
                                        className="px-6 py-3 bg-brand text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
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