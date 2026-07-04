// import React, { useState } from "react";
// import { 
//   LayoutDashboard, 
//   ShieldCheck, 
//   Activity, 
//   Layers, 
//   FileText, 
//   UploadCloud, 
//   User, 
//   LogOut, 
//   Flame, 
//   CheckCircle2, 
//   HelpCircle 
// } from "lucide-react";

// // සාමාජිකයාගේ Validation Page එක Import කර ගැනීම
// import ValidationPage from "./Member1/ValidationPage";

// const Dashboard = () => {
//   // වත්මන් පිටුව පාලනය කිරීමට State එකක් (Default: 'dashboard')
//   const [activeTab, setActiveTab] = useState("dashboard");
//   const [dragActive, setDragActive] = useState(false);

//   // Sidebar Menu Items (සාමාජිකයන් 4 දෙනාගේම Modules මෙතනට වෙන් කර ඇත)
//   const menuItems = [
//     { id: "dashboard", label: "Dashboard HUD", icon: <LayoutDashboard className="w-5 h-5" /> },
//     { id: "validation", label: "Stage 1: Image Validation", icon: <ShieldCheck className="w-5 h-5" />, member: "Harsha S.N" },
//     { id: "caries", label: "Stage 2: Caries Engine", icon: <Flame className="w-5 h-5" />, member: "Member 02" },
//     { id: "segmentation", label: "Stage 3: Segmentation", icon: <Layers className="w-5 h-5" />, member: "Member 03" },
//     { id: "analytics", label: "Stage 4: Patient Analytics", icon: <Activity className="w-5 h-5" />, member: "Member 04" },
//   ];

//   return (
//     <div className="flex h-screen bg-[#060b26] text-white font-sans overflow-hidden">
      
//       {/* ==================================================================
//           LEFT SIDEBAR: SYSTEM NAVIGATION
//           ================================================================== */}
//       <div className="w-72 bg-[#0b1231] border-r border-[#1a2456] flex flex-col justify-between p-6">
//         <div>
//           {/* Brand Logo / Header */}
//           <div className="flex items-center gap-3 mb-10 px-2">
//             <div className="bg-gradient-to-tr from-[#0055ff] to-[#00ffcc] p-2.5 rounded-xl shadow-lg shadow-[#0055ff]/20">
//               <Activity className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
//                 Xora Scan
//               </h1>
//               <span className="text-[10px] text-[#00ffcc] tracking-widest font-semibold uppercase">
//                 Dental AI Core
//               </span>
//             </div>
//           </div>

//           {/* Navigation Links */}
//           <div className="space-y-1.5">
//             <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider px-2 block mb-2">
//               Core Modules
//             </span>
//             {menuItems.map((item) => (
//               <button
//                 key={item.id}
//                 onClick={() => setActiveTab(item.id)}
//                 className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
//                   activeTab === item.id
//                     ? "bg-gradient-to-r from-[#0052ec] to-[#0073ff] text-white shadow-md shadow-[#0052ec]/20"
//                     : "text-gray-400 hover:bg-[#121c46] hover:text-white"
//                 }`}
//               >
//                 <div className="flex items-center gap-3">
//                   {item.icon}
//                   <span>{item.label}</span>
//                 </div>
//                 {item.member && (
//                   <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tight ${
//                     activeTab === item.id 
//                       ? "bg-white/20 text-white" 
//                       : "bg-[#18255c] text-gray-400 group-hover:text-[#00ffcc]"
//                   }`}>
//                     {item.id === "validation" ? "Me" : "M" + item.id.charAt(0).toUpperCase()}
//                   </span>
//                 )}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* User Profile Summary Bottom */}
//         <div className="border-t border-[#1a2456] pt-4 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-full bg-[#1b275a] border border-[#2a3a7c] flex items-center justify-center text-sm font-bold text-[#00ffcc]">
//               HS
//             </div>
//             <div>
//               <div className="text-xs font-semibold text-white">Harsha S.N</div>
//               <div className="text-[10px] text-gray-500">it22092016</div>
//             </div>
//           </div>
//           <button className="text-gray-500 hover:text-red-400 p-2 rounded-lg transition">
//             <LogOut className="w-4 h-4" />
//           </button>
//         </div>
//       </div>

//       {/* ==================================================================
//           RIGHT CONTENT AREA: DYNAMIC TAB ROUTING
//           ================================================================== */}
//       <div className="flex-1 flex flex-col overflow-y-auto">
        
//         {/* Top Mini-Navbar */}
//         <div className="h-16 border-b border-[#1a2456] bg-[#0b1231]/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
//           <div className="text-xs text-gray-400 font-medium">
//             System Environment: <span className="text-emerald-400 font-bold">Production v1.0.4</span>
//           </div>
//           <div className="flex items-center gap-4">
//             <button className="text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1.5 bg-[#121c46] px-3 py-1.5 rounded-lg border border-[#1e2d6b]">
//               <HelpCircle className="w-3.5 h-3.5" /> Documentation
//             </button>
//             <span className="h-4 w-px bg-[#1a2456]"></span>
//             <div className="text-xs bg-[#0f2d2b] border border-[#12584e] text-[#00ffcc] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
//               <span className="w-1.5 h-1.5 bg-[#00ffcc] rounded-full animate-ping"></span> API Gateway Online
//             </div>
//           </div>
//         </div>

//         {/* Main Body View */}
//         <div className="p-8 flex-1">

//           {/* VIEW A: MAIN DASHBOARD HUD */}
//           {activeTab === "dashboard" && (
//             <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
              
//               {/* Hero Banner Section */}
//               <div className="relative bg-gradient-to-r from-[#0d1742] via-[#091035] to-[#060b26] border border-[#1e2d6b] rounded-3xl p-8 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
//                 <div className="space-y-3 z-10 text-center md:text-left">
//                   <span className="bg-[#0055ff]/10 text-[#3388ff] text-xs font-bold px-3 py-1 rounded-full border border-[#0055ff]/20">
//                     ✨ Computer Vision System Core
//                   </span>
//                   <h2 className="text-3xl font-extrabold text-white tracking-tight">
//                     Precision Starts with Quality.
//                   </h2>
//                   <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
//                     Xora Scan automatically validates dental X-ray integrity, ensuring optimal sharpness, 
//                     contrast, and proper orientation correction before advanced diagnostic models execute.
//                   </p>
//                   <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
//                     <button 
//                       onClick={() => setActiveTab("validation")}
//                       className="bg-gradient-to-r from-[#0055ff] to-[#0099ff] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#0055ff]/20 hover:opacity-90 transition"
//                     >
//                       Start New Scan
//                     </button>
//                     <button className="border border-[#233575] hover:bg-[#121c46] text-gray-300 text-xs font-bold px-5 py-2.5 rounded-xl transition">
//                       Watch Pipeline Demo
//                     </button>
//                   </div>
//                 </div>

//                 {/* Right Quick Check HUD Panel (As seen in your design) */}
//                 <div className="w-full md:w-80 bg-[#10193c] border border-[#203174] rounded-2xl p-5 space-y-4 shadow-xl z-10">
//                   <div className="text-xs font-bold text-gray-400 tracking-wider uppercase">Pre-Processing HUD</div>
                  
//                   <div className="space-y-2.5">
//                     <div className="flex items-center justify-between p-2.5 bg-[#080e29] border border-[#18255a] rounded-xl text-xs">
//                       <span className="text-gray-400">Image Type</span>
//                       <span className="font-bold text-[#00ffcc] flex items-center gap-1">Dental X-Ray <CheckCircle2 className="w-3.5 h-3.5" /></span>
//                     </div>
//                     <div className="flex items-center justify-between p-2.5 bg-[#080e29] border border-[#18255a] rounded-xl text-xs">
//                       <span className="text-gray-400">Sharpness</span>
//                       <span className="font-bold text-[#00ffcc] flex items-center gap-1">98% Optimal <CheckCircle2 className="w-3.5 h-3.5" /></span>
//                     </div>
//                     <div className="flex items-center justify-between p-2.5 bg-[#080e29] border border-[#18255a] rounded-xl text-xs">
//                       <span className="text-gray-400">Contrast</span>
//                       <span className="font-bold text-[#00ffcc] flex items-center gap-1">Acceptable <CheckCircle2 className="w-3.5 h-3.5" /></span>
//                     </div>
//                   </div>

//                   <div className="w-full bg-[#0055ff]/10 border border-[#0055ff]/30 text-[#3388ff] font-bold text-xs py-2.5 rounded-xl text-center uppercase tracking-wider">
//                     Ready For AI Analysis
//                   </div>
//                 </div>

//                 {/* Decorative Glowing Background Orbs */}
//                 <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-[#0055ff]/10 rounded-full blur-3xl"></div>
//                 <div className="absolute bottom-[-30px] left-[20%] w-32 h-32 bg-[#00ffcc]/5 rounded-full blur-2xl"></div>
//               </div>

//               {/* Research Metrics / Compliance Badges Row */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 {[
//                   { value: "500+ Clinics", label: "Trained Datasets" },
//                   { value: "ISO 13485", label: "Medical Device Standard" },
//                   { value: "YOLOv11 & Keras", label: "Core Architectures" },
//                   { value: "HIPAA Compliant", label: "Data Encryption Sec" }
//                 ].map((badge, idx) => (
//                   <div key={idx} className="bg-[#0b1231] border border-[#1a2456] rounded-xl p-4 text-center">
//                     <div className="text-sm font-bold text-[#00ffcc]">{badge.value}</div>
//                     <div className="text-[11px] text-gray-500 font-medium mt-0.5">{badge.label}</div>
//                   </div>
//                 ))}
//               </div>

//             </div>
//           )}

//           {/* VIEW B: IMAGE VALIDATION GATEWAY (ඔයාගේ ප්‍රධාන Module එක මෙතනට Load වේ) */}
//           {activeTab === "validation" && <ValidationPage />}

//           {/* FUTURE VIEWS PLACEHOLDERS (අනෙක් සාමාජිකයන්ගේ ඒවා සඳහා) */}
//           {activeTab === "caries" && (
//             <div className="text-center p-12 bg-[#0b1231] border border-[#1a2456] rounded-2xl">
//               <Flame className="w-12 h-12 text-amber-500 mx-auto mb-3" />
//               <h3 className="text-lg font-bold">Stage 2: Caries Engine Dashboard</h3>
//               <p className="text-xs text-gray-400 mt-1">This module is currently coupled within the Stage 1 Validation Postman Pipeline flow.</p>
//             </div>
//           )}

//           {activeTab === "segmentation" && (
//             <div className="text-center p-12 bg-[#0b1231] border border-[#1a2456] rounded-2xl">
//               <Layers className="w-12 h-12 text-purple-500 mx-auto mb-3" />
//               <h3 className="text-lg font-bold">Stage 3: Tooth Segmentation Panel</h3>
//               <p className="text-xs text-gray-400 mt-1">Awaiting Member 03 front-end template integration.</p>
//             </div>
//           )}

//           {activeTab === "analytics" && (
//             <div className="text-center p-12 bg-[#0b1231] border border-[#1a2456] rounded-2xl">
//               <Activity className="w-12 h-12 text-[#00ffcc] mx-auto mb-3" />
//               <h3 className="text-lg font-bold">Stage 4: Automated EMR & Patient Analytics</h3>
//               <p className="text-xs text-gray-400 mt-1">Awaiting Member 04 front-end template integration.</p>
//             </div>
//           )}

//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { usePage } from '../context/PageContext';
import { 
  Play, 
  ShieldCheck, 
  Check, 
  AlertTriangle, 
  Search, 
  Cpu, 
  Sparkles, 
  Activity, 
  Eye, 
  Calendar, 
  ArrowRight,
  TrendingDown,
  Info,
  Clock,
  RotateCcw
} from 'lucide-react';

export default function Dashboard() {
  const { navigateTo } = usePage();
  // --- Simulation state for pre-processing ---
  const [scanStep, setScanStep] = useState(0); // 0: idle, 1-4: checking steps, 5: success
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // --- Selected anomaly case ---
  const [selectedCase, setSelectedCase] = useState('bone_loss'); // 'caries', 'bone_loss', 'molar'

  // --- Patient timeline active year ---
  const [activeDate, setActiveDate] = useState('May 2026');

  // --- Visual progression slider state ---
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 to 100)
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  // --- Modal watch demo state ---
  const [showDemoModal, setShowDemoModal] = useState(false);

  // --- Bounding box hover state ---
  const [hoveredBox, setHoveredBox] = useState(null);

  // Pre-processing checklist items
  const [checks, setChecks] = useState({
    imageType: 'idle', // idle, loading, success
    sharpness: 'idle',
    contrast: 'idle',
    resolution: 'idle'
  });

  // Start pre-processing simulator
  const handleStartScan = () => {
    if (scanning) return;
    setScanning(true);
    setScanStep(1);
    setScanProgress(5);
    setChecks({
      imageType: 'loading',
      sharpness: 'idle',
      contrast: 'idle',
      resolution: 'idle'
    });
  };

  useEffect(() => {
    let interval;
    if (scanning) {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          const next = prev + Math.floor(Math.random() * 8) + 2;
          if (next >= 100) {
            clearInterval(interval);
            setScanning(false);
            setScanStep(5);
            setChecks({
              imageType: 'success',
              sharpness: 'success',
              contrast: 'success',
              resolution: 'success'
            });
            return 100;
          }
          
          // Manage steps
          if (next > 25 && next <= 50) {
            setScanStep(2);
            setChecks(c => ({ ...c, imageType: 'success', sharpness: 'loading' }));
          } else if (next > 50 && next <= 75) {
            setScanStep(3);
            setChecks(c => ({ ...c, sharpness: 'success', contrast: 'loading' }));
          } else if (next > 75 && next < 95) {
            setScanStep(4);
            setChecks(c => ({ ...c, contrast: 'success', resolution: 'loading' }));
          }
          return next;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [scanning]);

  // Reset scan simulation
  const handleResetScan = () => {
    setScanStep(0);
    setScanProgress(0);
    setChecks({
      imageType: 'idle',
      sharpness: 'idle',
      contrast: 'idle',
      resolution: 'idle'
    });
  };

  // Drag handlers for visual comparison slider
  const handleSliderMove = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    handleSliderMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    handleSliderMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  // Cases data
  const casesInfo = {
    bone_loss: {
      title: 'Periodontal Bone Loss',
      id: 'RX_82138',
      confidence: 94,
      desc: 'High confidence detection of moderate horizontal bone loss around lower molar roots with detailed depth bounds.',
      level: 'severe',
      anomalies: [
        { name: 'Caries', count: '2 LOCATIONS' },
        { name: 'Bone Loss', count: '1 LOCATION' },
        { name: 'Impacted Molar', count: '1 LOCATION' }
      ]
    },
    caries: {
      title: 'Interproximal Caries',
      id: 'RX_94102',
      confidence: 89,
      desc: 'Simulated YOLO prediction localized deep enamel demineralization on distal aspect of second premolar.',
      level: 'moderate',
      anomalies: [
        { name: 'Caries', count: '1 LOCATION' },
        { name: 'Enamel Defect', count: '1 LOCATION' }
      ]
    },
    molar: {
      title: 'Impacted Wisdom Molar',
      id: 'RX_33019',
      confidence: 97,
      desc: 'Horizontal impaction of tooth 38 (lower left third molar) causing mild root resorption on neighboring tooth 37.',
      level: 'severe',
      anomalies: [
        { name: 'Impacted Molar', count: '1 LOCATION' },
        { name: 'Root Contact', count: '1 LOCATION' }
      ]
    }
  };

  const currentCase = casesInfo[selectedCase];

  // Timeline items
  const timelineDates = [
    { label: 'Mar 2024', labelEn: 'Mar 2024' },
    { label: 'Sep 2024', labelEn: 'Sep 2024' },
    { label: 'Mar 2025', labelEn: 'Mar 2025' },
    { label: 'Oct 2025', labelEn: 'Oct 2025' },
    { label: 'May 2026', labelEn: 'May 2026', current: true }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Reusable Header */}
      <Header />

      <main className="flex-grow">

        {/* ========================================================================= */}
        {/* SECTION 1: HERO & PRE-PROCESSING HUB */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/20 to-white py-16 sm:py-24 border-b border-slate-100">
          {/* Subtle Background Gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-200/20 to-indigo-100/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-brand/5 to-cyan-100/10 rounded-full blur-3xl -z-10"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Hero copy */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
                
                {/* AI Badge */}
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs font-semibold text-brand tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-brand animate-ping"></span>
                  <span>AI-POWERED DIAGNOSTICS</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                  Precision Starts with <br />
                  <span className="bg-gradient-to-r from-brand to-indigo-600 bg-clip-text text-transparent">Quality.</span>
                </h1>

                {/* Subhead */}
                <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                  DentiScan AI automatically validates dental X-ray integrity, ensuring optimal sharpness, contrast, and resolution before advanced diagnostic analysis begins.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <button 
                    onClick={() => navigateTo('validation')}
                    className="relative overflow-hidden px-8 py-4 text-center text-base font-semibold text-white bg-brand hover:bg-brand-dark rounded-xl shadow-lg shadow-brand/20 hover:shadow-brand/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Start New Scan
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>

                  <button 
                    onClick={() => setShowDemoModal(true)}
                    className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-sm transition-all duration-200"
                  >
                    <Play className="w-4 h-4 fill-current text-slate-600" />
                    <span>Watch Demo</span>
                  </button>
                </div>

                {/* Badges/Certifications */}
                <div className="flex flex-wrap gap-x-8 gap-y-4 pt-6 border-t border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand" />
                    <span>FDA Cleared</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand" />
                    <span>ISO 13485</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand" />
                    <span>HIPAA Compliant</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Pre-processing Hub Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-6 sm:p-8 space-y-6 sm:space-y-8 transform hover:scale-[1.01] transition-transform duration-300">
                  
                  {/* Preprocessing State Header */}
                  <div className="relative overflow-hidden rounded-2xl bg-[#E6F0FF] p-5 border border-brand/10 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-xl -z-10"></div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white text-brand shadow-sm">
                        {scanStep === 5 ? (
                          <ShieldCheck className="w-6 h-6 text-brand" />
                        ) : scanning ? (
                          <Activity className="w-6 h-6 animate-pulse" />
                        ) : (
                          <Cpu className="w-6 h-6 text-brand" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {scanStep === 0 && (
                          <>
                            <h3 className="text-sm font-bold text-slate-800">Scanner Ready</h3>
                            <p className="text-xs text-slate-500 truncate mt-0.5">Upload panoramic X-ray to diagnose</p>
                          </>
                        )}
                        {scanning && (
                          <>
                            <h3 className="text-sm font-bold text-slate-800">Scanning Image...</h3>
                            <p className="text-xs text-brand font-semibold truncate mt-0.5 animate-pulse">Running image diagnostics ({scanProgress}%)</p>
                          </>
                        )}
                        {scanStep > 0 && !scanning && scanStep < 5 && (
                          <>
                            <h3 className="text-sm font-bold text-slate-800">Diagnostics Paused</h3>
                            <p className="text-xs text-amber-600 truncate mt-0.5">Validation interrupted</p>
                          </>
                        )}
                        {scanStep === 5 && (
                          <>
                            <h3 className="text-sm font-bold text-slate-800">Processing panoramic_2024.dcm</h3>
                            <p className="text-xs text-slate-500 truncate mt-0.5">Running image diagnostics...</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {scanning && (
                      <div className="w-full bg-slate-200/80 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div 
                          className="bg-brand h-full rounded-full transition-all duration-150"
                          style={{ width: `${scanProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {/* Pre-processing Hub items list */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pre-processing Hub</span>
                      {scanStep > 0 && (
                        <button 
                          onClick={handleResetScan} 
                          className="text-xs font-semibold text-slate-500 hover:text-brand flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>

                    {/* Image Check rows */}
                    <div className="space-y-3">
                      {/* 1. Image Type */}
                      <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                        <span className="text-sm font-medium text-slate-700">Image Type</span>
                        {checks.imageType === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand/10 text-xs font-semibold text-brand">
                            Dental X-ray Detected
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : checks.imageType === 'loading' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping"></span>
                            Detecting...
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Waiting...</span>
                        )}
                      </div>

                      {/* 2. Sharpness */}
                      <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                        <span className="text-sm font-medium text-slate-700">Sharpness</span>
                        {checks.sharpness === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand/10 text-xs font-semibold text-brand">
                            94% Optimal
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : checks.sharpness === 'loading' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping"></span>
                            Analyzing...
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Waiting...</span>
                        )}
                      </div>

                      {/* 3. Contrast */}
                      <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                        <span className="text-sm font-medium text-slate-700">Contrast</span>
                        {checks.contrast === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand/10 text-xs font-semibold text-brand">
                            Clinically Acceptable
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : checks.contrast === 'loading' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping"></span>
                            Calculating...
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Waiting...</span>
                        )}
                      </div>

                      {/* 4. Resolution */}
                      <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                        <span className="text-sm font-medium text-slate-700">Resolution</span>
                        {checks.resolution === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand/10 text-xs font-semibold text-brand">
                            2048 x 1024
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : checks.resolution === 'loading' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping"></span>
                            Verifying...
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Waiting...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Validate CTA Button */}
                  <button 
                    disabled={scanStep !== 5}
                    onClick={() => alert('AI Diagnostic complete! Bounding boxes rendered in next section.')}
                    className={`w-full py-4 text-center text-sm font-bold tracking-wider rounded-2xl flex items-center justify-center gap-2.5 shadow-lg border transition-all duration-300 ${
                      scanStep === 5 
                        ? 'bg-brand text-white border-brand shadow-brand/25 hover:shadow-brand/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]' 
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>VALIDATED FOR AI ANALYSIS</span>
                  </button>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: AI DIAGNOSTIC ENGINE (DARK THEME) */}
        {/* ========================================================================= */}
        <section id="analysis" className="bg-[#090D1A] py-20 sm:py-24 text-white relative overflow-hidden">
          
          {/* Subtle Ambient Lighting */}
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-3xl -z-10"></div>
          <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-brand/10 to-transparent rounded-full blur-3xl -z-10"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header copy */}
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
              <span className="text-xs font-bold tracking-wider text-brand uppercase">AI Diagnostic Engine</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                See What the Eye Misses.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Powered by advanced YOLO object detection and OpenCV processing, identifying pathologies with sub-millimeter precision.
              </p>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Column: Dental Clinic Bounding Box Visualizer */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="relative w-full aspect-[1.8/1] rounded-3xl bg-slate-950 border border-white/5 overflow-hidden shadow-2xl group flex items-center justify-center">
                  
                  {/* Custom CSS Stylized Dental Clinic Image/Mockup */}
                  <div className="absolute inset-0 bg-[#1e2330] flex items-center justify-center overflow-hidden">
                    
                    {/* SVG Backdrop representing clinic monitor structure */}
                    <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <radialGradient id="monitor-glow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#monitor-glow)" />
                      {/* Grid lines simulating medical display */}
                      <path d="M 0 50 L 1000 50 M 0 100 L 1000 100 M 0 150 L 1000 150 M 0 200 L 1000 200 M 0 250 L 1000 250 M 0 300 L 1000 300 M 0 350 L 1000 350" stroke="#334155" strokeWidth="0.5" />
                      <path d="M 100 0 L 100 600 M 200 0 L 200 600 M 300 0 L 300 600 M 400 0 L 400 600 M 500 0 L 500 600 M 600 0 L 600 600 M 700 0 L 700 600" stroke="#334155" strokeWidth="0.5" />
                    </svg>

                    {/* Vector representation of teeth / Dental X-Ray */}
                    <div className="relative w-5/6 h-5/6 flex flex-col justify-center items-center space-y-6">
                      
                      {/* X-ray Screen Header Overlay */}
                      <div className="absolute top-2 left-4 flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                        <span>PANORAMIC_PRO_SURVEY</span>
                        <span>|</span>
                        <span>SENS: 98.4%</span>
                      </div>

                      {/* Teeth Arch Illustration */}
                      <svg className="w-full h-32 text-slate-300" viewBox="0 0 400 100" fill="none">
                        {/* Upper Arch */}
                        <path d="M 20 40 Q 200 10 380 40" stroke="#64748B" strokeWidth="3" strokeDasharray="3 3" />
                        {/* Lower Arch */}
                        <path d="M 20 60 Q 200 90 380 60" stroke="#64748B" strokeWidth="3" strokeDasharray="3 3" />

                        {/* Individual Teeth Vectors */}
                        {/* Lower arch teeth */}
                        <path d="M 40 58 Q 44 48 48 58 Z" fill="#334155" stroke="#475569" strokeWidth="2" />
                        <path d="M 68 59 Q 72 47 76 59 Z" fill="#334155" stroke="#475569" strokeWidth="2" />
                        <path d="M 96 61 Q 100 48 104 61 Z" fill="#334155" stroke="#475569" strokeWidth="2" />
                        <path d="M 124 63 Q 128 49 132 63 Z" fill="#334155" stroke="#475569" strokeWidth="2" />
                        {/* Caries Area Left */}
                        <path d="M 152 64 Q 158 48 164 64 Z" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                        <path d="M 180 65 Q 186 48 192 65 Z" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                        {/* Bone Loss Area Center-Right */}
                        <path d="M 208 65 Q 214 53 220 65 Z" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                        <path d="M 236 64 Q 242 54 248 64 Z" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                        <path d="M 264 63 Q 270 52 276 63 Z" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                        <path d="M 292 62 Q 298 50 304 62 Z" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                        <path d="M 320 60 Q 326 48 332 60 Z" fill="#334155" stroke="#475569" strokeWidth="2" />
                        {/* Wisdom Molar Impacted (Horizontal) */}
                        <g transform="translate(345, 62) rotate(75)">
                          <path d="M -8 -8 Q 0 -22 8 -8 Z" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                        </g>
                      </svg>
                    </div>

                    {/* INTERACTIVE BOUNDING BOXES OVERLAY */}
                    
                    {/* Bounding Box 1: Caries */}
                    <div 
                      onMouseEnter={() => { setHoveredBox('caries'); setSelectedCase('caries'); }}
                      onMouseLeave={() => setHoveredBox(null)}
                      onClick={() => setSelectedCase('caries')}
                      className={`absolute cursor-pointer rounded border-2 transition-all duration-200 ${
                        hoveredBox === 'caries' || selectedCase === 'caries'
                          ? 'border-brand bg-brand/10 shadow-lg shadow-brand/35 z-10 scale-105'
                          : 'border-slate-500/60 bg-transparent'
                      }`}
                      style={{ left: '32%', top: '38%', width: '13%', height: '30%' }}
                    >
                      <span className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white bg-brand shadow">
                        Caries
                      </span>
                    </div>

                    {/* Bounding Box 2: Bone Loss */}
                    <div 
                      onMouseEnter={() => { setHoveredBox('bone_loss'); setSelectedCase('bone_loss'); }}
                      onMouseLeave={() => setHoveredBox(null)}
                      onClick={() => setSelectedCase('bone_loss')}
                      className={`absolute cursor-pointer rounded border-2 transition-all duration-200 ${
                        hoveredBox === 'bone_loss' || selectedCase === 'bone_loss'
                          ? 'border-brand bg-brand/10 shadow-lg shadow-brand/35 z-10 scale-105'
                          : 'border-slate-500/60 bg-transparent'
                      }`}
                      style={{ left: '50%', top: '44%', width: '25%', height: '24%' }}
                    >
                      <span className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white bg-brand shadow">
                        Bone Loss
                      </span>
                    </div>

                    {/* Bounding Box 3: Wisdom Molar */}
                    <div 
                      onMouseEnter={() => { setHoveredBox('molar'); setSelectedCase('molar'); }}
                      onMouseLeave={() => setHoveredBox(null)}
                      onClick={() => setSelectedCase('molar')}
                      className={`absolute cursor-pointer rounded border-2 transition-all duration-200 ${
                        hoveredBox === 'molar' || selectedCase === 'molar'
                          ? 'border-brand bg-brand/10 shadow-lg shadow-brand/35 z-10 scale-105'
                          : 'border-slate-500/60 bg-transparent'
                      }`}
                      style={{ left: '80%', top: '35%', width: '14%', height: '36%' }}
                    >
                      <span className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white bg-brand shadow">
                        Projected
                      </span>
                    </div>

                    {/* Reticle / Center Scanner */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-slate-500/10 rounded-full flex items-center justify-center pointer-events-none">
                      <div className="w-1.5 h-1.5 bg-brand rounded-full"></div>
                    </div>
                  </div>

                  {/* Diagnostic overlay instructions */}
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Eye className="w-3.5 h-3.5 text-brand" />
                      Hover boxes to inspect anomalies
                    </span>
                    <span className="font-mono text-slate-500">Detector: YOLOv8-Dental</span>
                  </div>

                </div>

                {/* Clickable Quick Filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button 
                    onClick={() => setSelectedCase('bone_loss')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                      selectedCase === 'bone_loss' 
                        ? 'bg-brand/15 text-brand border-brand/30 shadow shadow-brand/5' 
                        : 'bg-slate-900/40 text-slate-400 border-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    Periodontal Bone Loss (ID: RX_82138)
                  </button>
                  <button 
                    onClick={() => setSelectedCase('caries')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                      selectedCase === 'caries' 
                        ? 'bg-brand/15 text-brand border-brand/30 shadow shadow-brand/5' 
                        : 'bg-slate-900/40 text-slate-400 border-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    Dental Caries (ID: RX_94102)
                  </button>
                  <button 
                    onClick={() => setSelectedCase('molar')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                      selectedCase === 'molar' 
                        ? 'bg-brand/15 text-brand border-brand/30 shadow shadow-brand/5' 
                        : 'bg-slate-900/40 text-slate-400 border-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    Impacted Wisdom Molar (ID: RX_33019)
                  </button>
                </div>
              </div>

              {/* Right Column: Case Analysis Card */}
              <div className="lg:col-span-5 flex items-stretch">
                <div className="w-full bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-slate-800 border border-slate-100 shadow-xl transition-all duration-300">
                  
                  {/* Title Area */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Case Analysis</span>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">{currentCase.title}</h3>
                    <p className="text-xs font-mono text-slate-500">ID: {currentCase.id}</p>
                  </div>

                  {/* Confidence Ring Indicator */}
                  <div className="my-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center space-x-6">
                    {/* SVG Radial Progress */}
                    <div className="relative shrink-0 w-20 h-20 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Background track circle */}
                        <circle cx="40" cy="40" r="34" stroke="#F1F5F9" strokeWidth="6" fill="transparent" />
                        {/* Foreground circle */}
                        <circle 
                          cx="40" 
                          cy="40" 
                          r="34" 
                          stroke="#0066FF" 
                          strokeWidth="6" 
                          fill="transparent" 
                          strokeDasharray={2 * Math.PI * 34}
                          strokeDashoffset={2 * Math.PI * 34 * (1 - currentCase.confidence / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Percent center */}
                      <span className="absolute text-lg font-bold text-slate-900 tracking-tighter">{currentCase.confidence}%</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Detection Confidence</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{currentCase.desc}</p>
                    </div>
                  </div>

                  {/* Disease Level Indicator */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <span>Disease Level</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        currentCase.level === 'severe' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {currentCase.level === 'severe' ? 'LEVEL 3' : 'LEVEL 2'}
                      </span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="relative h-6 flex items-center">
                      {/* Line background */}
                      <div className="absolute inset-x-0 h-2 bg-slate-100 rounded-full"></div>
                      
                      {/* Filled portions segments */}
                      <div className="absolute left-0 w-full h-2 rounded-full flex overflow-hidden">
                        <div className="w-1/3 bg-emerald-400/80"></div>
                        <div className={`w-1/3 ${currentCase.level === 'severe' || currentCase.level === 'moderate' ? 'bg-amber-400' : 'bg-slate-100'}`}></div>
                        <div className={`w-1/3 ${currentCase.level === 'severe' ? 'bg-red-400' : 'bg-slate-100'}`}></div>
                      </div>

                      {/* Slider handle anchor */}
                      <div 
                        className="absolute w-4.5 h-4.5 rounded-full border-2 border-white shadow bg-brand transition-all duration-300"
                        style={{ 
                          left: currentCase.level === 'severe' ? '85%' : currentCase.level === 'moderate' ? '50%' : '15%',
                          transform: 'translateX(-50%)'
                        }}
                      ></div>
                    </div>

                    {/* Scale Labels */}
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>

                  {/* Detected Anomalies */}
                  <div className="space-y-3.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Detected Anomalies ({currentCase.anomalies.length})</span>
                    
                    <div className="space-y-2">
                      {currentCase.anomalies.map((anom, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/50 transition-all duration-200">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand"></span>
                            {anom.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {anom.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: PATIENT JOURNEY (LIGHT THEME) */}
        {/* ========================================================================= */}
        <section id="trends" className="py-20 sm:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header copy */}
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
              <span className="text-xs font-bold tracking-wider text-brand uppercase">Patient Journey</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                Track Every Visit. See Every Change.
              </h2>
            </div>

            {/* Horizontal Timeline Selector */}
            <div className="flex justify-center mb-16 overflow-x-auto py-4 px-2 hide-scrollbar">
              <div className="flex items-center space-x-4">
                {timelineDates.map((item, idx) => (
                  <div key={idx} className="flex items-center">
                    <button 
                      onClick={() => setActiveDate(item.label)}
                      className={`relative flex flex-col items-center justify-between p-4 w-32 h-24 rounded-2xl border transition-all duration-200 shrink-0 ${
                        activeDate === item.label
                          ? 'bg-white border-brand ring-2 ring-brand/10 shadow-lg scale-105 z-10'
                          : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Mini X-Ray Illustration inside thumbnails */}
                      <div className="w-full h-8 bg-slate-100 rounded-md border border-slate-200/50 flex items-center justify-center overflow-hidden">
                        <svg className="w-full h-full text-slate-400 opacity-60" viewBox="0 0 100 30" fill="none">
                          <path d="M 10 15 Q 50 5 90 15" stroke="#94A3B8" strokeWidth="1" />
                          <path d="M 20 16 Q 24 10 28 16" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.5" />
                          <path d="M 40 16 Q 44 8 48 16" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.5" />
                          <path d={`M 60 16 Q 64 ${activeDate === item.label ? '12' : '8'} 68 16`} fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.5" />
                          <path d="M 80 16 Q 84 10 88 16" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.5" />
                        </svg>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-700">{item.labelEn}</span>
                        {item.current && (
                          <span className="text-[8px] font-bold text-brand uppercase mt-0.5 tracking-wider">Current</span>
                        )}
                      </div>
                    </button>
                    {idx < timelineDates.length - 1 && (
                      <div className="w-6 h-0.5 bg-slate-200/80 shrink-0"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Area Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Column: Visual Progression Slider (2024 vs 2026) */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl flex flex-col justify-between h-full">
                  
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Visual Progression (2024 vs 2026)</h3>
                      <p className="text-xs text-slate-500">Drag the central handle to compare bone height changes</p>
                    </div>
                  </div>

                  {/* Real Comparison Slider container */}
                  <div 
                    ref={sliderRef}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleTouchMove}
                    className="relative w-full aspect-[1.8/1] rounded-2xl bg-slate-900 border border-slate-200/50 overflow-hidden select-none"
                  >
                    {/* Background Slide: May 2026 (Anomalous / recession) */}
                    <div className="absolute inset-0 bg-[#0F172A] flex items-center justify-center">
                      <div className="relative w-full h-full">
                        
                        {/* Label Badge 2026 */}
                        <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-brand text-white text-[10px] font-bold rounded-lg tracking-wider">
                          May 2026
                        </div>

                        {/* Bone loss illustration - recessing arch */}
                        <div className="w-full h-full flex flex-col justify-center items-center">
                          <svg className="w-5/6 h-3/4 text-slate-400" viewBox="0 0 350 150" fill="none">
                            <path d="M 20 80 Q 175 10 330 80" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />
                            {/* RECESSING BONE LEVEL IN 2026 */}
                            <path d="M 20 100 Q 175 60 330 100" stroke="#F87171" strokeWidth="3" />
                            <path d="M 20 100 Q 175 60 330 100 L 330 150 L 20 150 Z" fill="url(#recessing-bone)" opacity="0.3" />

                            {/* Dental roots overlay */}
                            <path d="M 120 70 C 120 100 135 110 135 125" stroke="#E2E8F0" strokeWidth="2" opacity="0.4" />
                            <path d="M 150 68 C 150 100 165 110 165 125" stroke="#E2E8F0" strokeWidth="2" opacity="0.4" />
                            <path d="M 180 68 C 180 100 195 110 195 125" stroke="#E2E8F0" strokeWidth="2" opacity="0.4" />
                            <path d="M 210 70 C 210 102 225 112 225 127" stroke="#E2E8F0" strokeWidth="2" opacity="0.4" />

                            {/* Red flag bounding box for bone recession */}
                            <rect x="150" y="55" width="90" height="70" rx="4" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" />
                            <text x="155" y="70" fill="#EF4444" fontSize="8" fontWeight="bold" fontFamily="monospace">BONE HEIGHT LOSS</text>

                            <defs>
                              <linearGradient id="recessing-bone" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#EF4444" />
                                <stop offset="100%" stopColor="#0F172A" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Foreground Slide (Clip-path container): Mar 2024 (Healthy / baseline) */}
                    <div 
                      className="absolute inset-0 bg-[#1E293B] border-r border-white/20 select-none pointer-events-none"
                      style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                    >
                      <div className="relative w-full h-full">
                        {/* Label Badge 2024 */}
                        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-slate-800/90 text-slate-300 text-[10px] font-bold rounded-lg tracking-wider border border-white/5">
                          Mar 2024
                        </div>

                        {/* Healthy Bone Level in 2024 */}
                        <div className="w-full h-full flex flex-col justify-center items-center">
                          <svg className="w-5/6 h-3/4 text-slate-400" viewBox="0 0 350 150" fill="none">
                            <path d="M 20 80 Q 175 10 330 80" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />
                            {/* HEALTHY HIGH BONE LEVEL IN 2024 */}
                            <path d="M 20 85 Q 175 35 330 85" stroke="#10B981" strokeWidth="3" />
                            <path d="M 20 85 Q 175 35 330 85 L 330 150 L 20 150 Z" fill="url(#healthy-bone)" opacity="0.3" />

                            {/* Dental roots overlay */}
                            <path d="M 120 70 C 120 100 135 110 135 125" stroke="#E2E8F0" strokeWidth="2" opacity="0.3" />
                            <path d="M 150 68 C 150 100 165 110 165 125" stroke="#E2E8F0" strokeWidth="2" opacity="0.3" />
                            <path d="M 180 68 C 180 100 195 110 195 125" stroke="#E2E8F0" strokeWidth="2" opacity="0.3" />
                            <path d="M 210 70 C 210 102 225 112 225 127" stroke="#E2E8F0" strokeWidth="2" opacity="0.3" />

                            <defs>
                              <linearGradient id="healthy-bone" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" />
                                <stop offset="100%" stopColor="#1E293B" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Drag Slider Handle bar */}
                    <div 
                      className="absolute inset-y-0 w-0.5 bg-brand/80 cursor-ew-resize z-20"
                      style={{ left: `${sliderPosition}%` }}
                      onMouseDown={(e) => { e.preventDefault(); isDragging.current = true; }}
                      onTouchStart={(e) => { isDragging.current = true; }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand border-2 border-white text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 duration-100">
                        {/* Slider Handle custom icons */}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* Right Column: Alerts & Bone Density line chart */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                
                {/* Alert Box */}
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 flex items-start space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100 text-rose-600 shrink-0 shadow-sm">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-rose-950">Significant Progression Detected</h4>
                    <p className="text-xs text-rose-700 leading-relaxed font-semibold">
                      Bone loss increased by 5.2% in lower quadrants compared to last year.
                    </p>
                  </div>
                </div>

                {/* Line Chart Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl flex-grow flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Bone Density Trend (12m)</h4>
                      <p className="text-xs text-slate-400">Patient baseline mandibular bone density</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-[10px] font-bold text-rose-600 tracking-wide uppercase flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      -12% Diff
                    </span>
                  </div>

                  {/* SVG Line Chart */}
                  <div className="w-full h-36 relative mt-4">
                    <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                      <defs>
                        {/* Area gradient */}
                        <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0066FF" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#0066FF" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      <line x1="0" y1="30" x2="300" y2="30" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="60" x2="300" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="90" x2="300" y2="90" stroke="#F1F5F9" strokeWidth="1" />

                      {/* Area under curve */}
                      <path 
                        d="M 0 30 L 50 35 L 100 45 L 150 48 L 200 62 L 250 69 L 300 78 L 300 120 L 0 120 Z" 
                        fill="url(#chart-area)" 
                      />

                      {/* Line chart stroke */}
                      <path 
                        d="M 0 30 L 50 35 L 100 45 L 150 48 L 200 62 L 250 69 L 300 78" 
                        fill="none" 
                        stroke="#0066FF" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                      />

                      {/* Markers */}
                      <circle cx="0" cy="30" r="3.5" fill="#FFFFFF" stroke="#0066FF" strokeWidth="1.5" />
                      <circle cx="100" cy="45" r="3.5" fill="#FFFFFF" stroke="#0066FF" strokeWidth="1.5" />
                      <circle cx="200" cy="62" r="3.5" fill="#FFFFFF" stroke="#0066FF" strokeWidth="1.5" />
                      <circle cx="300" cy="78" r="3.5" fill="#FFFFFF" stroke="#0066FF" strokeWidth="1.5" />
                    </svg>

                    {/* Chart axis label overlays */}
                    <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase tracking-wider pt-2 font-mono">
                      <span>Jun 2025</span>
                      <span>Oct 2025</span>
                      <span>Feb 2026</span>
                      <span>May 2026</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Info className="w-4 h-4 text-brand shrink-0" />
                    <span>Progression rate has decreased slightly since Oct 2025 therapy.</span>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>

      </main>

      {/* Reusable Footer */}
      <Footer />

      {/* Floating Sparkle/AI Assistant Chat Button */}
      <button 
        onClick={() => alert('DentiScan AI Assistant is here to review case files with you!')}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-brand to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-brand/20 hover:shadow-brand/35 hover:-translate-y-1 transform active:scale-95 transition-all duration-200 group"
        aria-label="AI Assistant"
      >
        <div className="relative">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-rose-500 border border-white rounded-full"></span>
        </div>
      </button>

      {/* WATCH DEMO MODAL */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setShowDemoModal(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl bg-[#090D1A] text-white border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand" />
                DentiScan Diagnostic Platform Demo
              </h3>
              <button 
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
              >
                Close [X]
              </button>
            </div>
            
            {/* Mock Video Container */}
            <div className="relative aspect-video rounded-2xl bg-black border border-white/5 flex items-center justify-center overflow-hidden group">
              {/* Play symbol placeholder */}
              <div className="absolute inset-0 bg-cover bg-center opacity-50 filter blur-sm" style={{ backgroundImage: 'radial-gradient(circle, #1e3a8a 0%, #030712 100%)' }}></div>
              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <Play className="w-7 h-7 fill-current ml-1" />
                </div>
                <span className="text-sm font-semibold tracking-wider text-slate-300">Play Demo Recording</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Duration: 2m 14s</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Version 1.4.0
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
