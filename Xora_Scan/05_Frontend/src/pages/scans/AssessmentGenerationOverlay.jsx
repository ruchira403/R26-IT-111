import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Loader2, CheckCircle2, AlertTriangle, X, RefreshCw,
  Database, Brain, Layers, ShieldCheck, FileCheck, Sparkles, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * AssessmentGenerationOverlay
 * Full-screen themed overlay with a 6-stage animated stepper.
 *
 * Props:
 *  - isOpen          : boolean
 *  - onClose         : () => void
 *  - scanId          : number|string
 *  - assessFn        : (scanId) => Promise<response>  — the assessScan API call
 *  - onSuccess       : (assessmentData, source) => void
 *  - scanContext     : { disease, severity } — for display
 */
export default function AssessmentGenerationOverlay({
  isOpen,
  onClose,
  scanId,
  assessFn,
  onSuccess,
  scanContext = {},
}) {
  const navigate = useNavigate();

  // Stage definitions
  const stages = [
    { key: 'prepare',     label: 'Preparing Patient Data',         icon: Database,   desc: 'Preparing the information required for your assessment' },
    { key: 'analyse',     label: 'Analysing Health Profile',       icon: Brain,      desc: 'Our models are analysing your scan and health profile' },
    { key: 'pipeline',    label: 'Multi-Stage Prediction Pipeline', icon: Layers,     desc: 'Multiple validation stages are being applied' },
    { key: 'generate',    label: 'Generating Care Plan',            icon: Sparkles,   desc: 'Generating your personalised assessment report' },
    { key: 'validate',    label: 'Post-AI Safety Validation',      icon: ShieldCheck, desc: 'Your results are being checked for consistency and safety' },
    { key: 'finalise',    label: 'Finalising Assessment',          icon: FileCheck,  desc: 'This process usually takes around 30 seconds to 1 minute' },
  ];

  const pipelineSubSteps = [
    'Validating input data',
    'Mapping scan findings',
    'Assessing risk factors',
    'Generating risk score',
    'Creating the personalised care plan',
  ];

  const [activeStage, setActiveStage] = useState(0);
  const [activeSubStep, setActiveSubStep] = useState(-1);
  const [stageStatuses, setStageStatuses] = useState(stages.map(() => 'pending')); // pending | active | done | error
  const [error, setError] = useState(null);
  const [apiDone, setApiDone] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const apiCalledRef = useRef(false);
  const mountedRef = useRef(true);

  // Reset state when overlay opens
  useEffect(() => {
    if (isOpen) {
      setActiveStage(0);
      setActiveSubStep(-1);
      setStageStatuses(stages.map(() => 'pending'));
      setError(null);
      setApiDone(false);
      setApiResult(null);
      apiCalledRef.current = false;
      mountedRef.current = true;
    }
    return () => { mountedRef.current = false; };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timed stage progression
  useEffect(() => {
    if (!isOpen || error) return;

    // Advance first 3 stages on frontend timers
    const timers = [];

    // Stage 0 → active immediately
    setStageStatuses(prev => { const n = [...prev]; n[0] = 'active'; return n; });

    // Stage 0 done after 2s → Stage 1 active
    timers.push(setTimeout(() => {
      if (!mountedRef.current) return;
      setStageStatuses(prev => { const n = [...prev]; n[0] = 'done'; n[1] = 'active'; return n; });
      setActiveStage(1);
    }, 2000));

    // Stage 1 done after 4s → Stage 2 (pipeline) active
    timers.push(setTimeout(() => {
      if (!mountedRef.current) return;
      setStageStatuses(prev => { const n = [...prev]; n[1] = 'done'; n[2] = 'active'; return n; });
      setActiveStage(2);
      setActiveSubStep(0);
    }, 4500));

    // Pipeline substeps (every 2s)
    pipelineSubSteps.forEach((_, i) => {
      timers.push(setTimeout(() => {
        if (!mountedRef.current) return;
        setActiveSubStep(i);
      }, 4500 + i * 2000));
    });

    // After pipeline → Stage 3 active (Generating Care Plan) — auto-advance on timer
    const pipelineDuration = 4500 + pipelineSubSteps.length * 2000;
    timers.push(setTimeout(() => {
      if (!mountedRef.current) return;
      setStageStatuses(prev => { const n = [...prev]; n[2] = 'done'; n[3] = 'active'; return n; });
      setActiveStage(3);
      setActiveSubStep(-1);
    }, pipelineDuration));

    // Stage 3 done after 3s → Stage 4 active (Safety Validation) — hold here until API returns
    timers.push(setTimeout(() => {
      if (!mountedRef.current) return;
      setStageStatuses(prev => { const n = [...prev]; n[3] = 'done'; n[4] = 'active'; return n; });
      setActiveStage(4);
    }, pipelineDuration + 3000));

    return () => timers.forEach(clearTimeout);
  }, [isOpen, error]); // eslint-disable-line react-hooks/exhaustive-deps

  // Call API after overlay opens
  useEffect(() => {
    if (!isOpen || apiCalledRef.current || !scanId || !assessFn) return;
    apiCalledRef.current = true;

    (async () => {
      try {
        const res = await assessFn(scanId);
        if (!mountedRef.current) return;
        setApiResult(res);
        setApiDone(true);
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err?.response?.data?.message || err?.message || 'We could not complete the assessment at this time.';
        const isProfileMissing = msg.toLowerCase().includes('health profile') || msg.toLowerCase().includes('profile');
        setError({ message: msg, isProfileMissing });
      }
    })();
  }, [isOpen, scanId, assessFn]);

  // When API finishes successfully, complete remaining stages and navigate
  useEffect(() => {
    if (!apiDone || !apiResult || error) return;
    const timers = [];

    // Complete remaining stages with brief transitions
    // Stage 4 (safety validation) was holding — mark it done, advance to finalise
    timers.push(setTimeout(() => {
      if (!mountedRef.current) return;
      setStageStatuses(prev => { const n = [...prev]; n[4] = 'done'; n[5] = 'active'; return n; });
      setActiveStage(5);
    }, 500));

    timers.push(setTimeout(() => {
      if (!mountedRef.current) return;
      setStageStatuses(prev => { const n = [...prev]; n[5] = 'done'; return n; });
    }, 1800));

    // Navigate to report after brief success display
    timers.push(setTimeout(() => {
      if (!mountedRef.current) return;
      const assessment = apiResult?.data?.assessment;
      const source = apiResult?.data?.source || 'generated';
      if (assessment && onSuccess) {
        onSuccess(assessment, source);
      }
    }, 2400));

    return () => timers.forEach(clearTimeout);
  }, [apiDone, apiResult, error, onSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = useCallback(() => {
    setError(null);
    setApiDone(false);
    setApiResult(null);
    apiCalledRef.current = false;
    setActiveStage(0);
    setActiveSubStep(-1);
    setStageStatuses(stages.map(() => 'pending'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4" role="dialog" aria-label="Assessment Error">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-8 text-center space-y-5">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-red-100 border border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Assessment Could Not Be Completed</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {error.message || 'We could not complete the assessment at this time. Your scan has not been changed. Please try again.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            {error.isProfileMissing && (
              <button
                onClick={() => { onClose(); navigate('/profile'); }}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
              >
                <User className="w-4 h-4" /> Go to Profile
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main stepper ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4" role="dialog" aria-live="polite" aria-label="Generating Assessment">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-8 sm:p-10 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs font-semibold text-brand tracking-wide">
            <span className="w-2 h-2 rounded-full bg-brand step-pulse" />
            AI Assessment In Progress
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Generating Your Assessment
          </h2>
          {scanContext?.disease && (
            <p className="text-sm text-slate-500">
              Analysing: <span className="font-semibold text-slate-700">{scanContext.disease}</span>
              {scanContext.severity && scanContext.severity !== 'N/A' && (
                <span className="text-slate-400"> · {scanContext.severity}</span>
              )}
            </p>
          )}
        </div>

        {/* Vertical Stepper */}
        <div className="space-y-0">
          {stages.map((stage, idx) => {
            const status = stageStatuses[idx];
            const StageIcon = stage.icon;
            const isActive = status === 'active';
            const isDone = status === 'done';

            return (
              <div key={stage.key} className="flex gap-4">
                {/* Connector line + icon */}
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-xl border-2 transition-all duration-300 shrink-0 ${
                    isDone
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-600'
                      : isActive
                        ? 'bg-brand/10 border-brand text-brand step-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    {isDone ? (
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    ) : isActive ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <StageIcon className="w-4 h-4" />
                    )}
                  </div>
                  {idx < stages.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-6 transition-colors duration-300 ${
                      isDone ? 'bg-emerald-300' : 'bg-slate-200'
                    }`} />
                  )}
                </div>

                {/* Label + description */}
                <div className={`pb-5 pt-1.5 transition-opacity duration-300 ${status === 'pending' ? 'opacity-50' : 'opacity-100'}`}>
                  <p className={`text-sm font-semibold leading-tight ${
                    isDone ? 'text-emerald-700' : isActive ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {stage.label}
                  </p>
                  {isActive && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{stage.desc}</p>
                  )}

                  {/* Pipeline substeps */}
                  {stage.key === 'pipeline' && isActive && (
                    <div className="mt-3 space-y-1.5 pl-1">
                      {pipelineSubSteps.map((sub, si) => (
                        <div key={si} className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                          si <= activeSubStep ? 'text-slate-700' : 'text-slate-400'
                        }`}>
                          {si < activeSubStep ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : si === activeSubStep ? (
                            <Loader2 className="w-3.5 h-3.5 text-brand animate-spin shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span>{sub}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 leading-relaxed">
          This process usually takes around 30 seconds to 1 minute.
          <br />
          Please do not close this window.
        </p>
      </div>
    </div>
  );
}
