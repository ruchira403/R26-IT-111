// // import React from "react";
// // import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
// // import Dashboard from "./pages/Dashboard";
// // import ValidationPage from "./pages/Member1/ValidationPage";

// // // සාමාජික 03 සහ 04 ගේ පිටු (දැනට Dummy සාදා ඇත, පසුව ඔවුන්ගේ කේතයන් මෙතනට ආදේශ කළ හැක)
// // const Member3Page = () => <div className="p-8 text-white"><h2>Member 03 Module - Coming Soon</h2></div>;
// // const Member4Page = () => <div className="p-8 text-white"><h2>Member 04 Module - Coming Soon</h2></div>;

// // function App() {
// //   return (
// //     <Router>
// //       <div className="min-h-screen bg-[#0a1128] flex flex-col justify-between selection:bg-[#0066ff] selection:text-white">

// //         {/* GLOBAL NAVIGATION BAR */}
// //         <nav className="bg-[#111936]/80 backdrop-blur-md border-b border-[#1e295d] sticky top-0 z-50 px-6 py-4">
// //           <div className="max-w-7xl mx-auto flex justify-between items-center">

// //             {/* Logo / Home Link */}
// //             <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-wider hover:opacity-90 transition">
// //               <span className="bg-gradient-to-r from-[#0055ff] to-[#00ffcc] text-transparent bg-clip-text">Xora Scan</span>
// //             </Link>

// //             {/* Top Navigation Links for 4 Members */}
// //             <div className="flex items-center gap-6 text-sm font-medium">
// //               <Link to="/" className="text-gray-300 hover:text-[#00ffcc] transition">Home</Link>

// //               <Link to="/validation" className="text-gray-300 hover:text-[#00ffcc] transition border-l border-gray-700 pl-4">
// //                 Stage 1 (Member 01)
// //               </Link>

// //               <Link to="/validation" className="text-gray-400 hover:text-[#00ffcc] transition">
// //                 Stage 2 (Member 02)
// //               </Link>

// //               <Link to="/member3" className="text-gray-500 hover:text-[#00ffcc] transition">
// //                 Module 03
// //               </Link>

// //               <Link to="/member4" className="text-gray-500 hover:text-[#00ffcc] transition">
// //                 Module 04
// //               </Link>
// //             </div>

// //           </div>
// //         </nav>

// //         {/* DYNAMIC CONTENT AREA */}
// //         <main className="flex-grow">
// //           <Routes>
// //             {/* මුල් පිටුවට ඔයා හදපු Dashboard එක සෙට් කිරීම */}
// //             <Route path="/" element={<Dashboard />} />

// //             {/* Validation / Caries Hybrid Pipeline පිටුව */}
// //             <Route path="/validation" element={<ValidationPage />} />

// //             {/* අනෙකුත් සාමාජිකයන්ගේ පිටු */}
// //             <Route path="/member3" element={<Member3Page />} />
// //             <Route path="/member4" element={<Member4Page />} />
// //           </Routes>
// //         </main>

// //         {/* GLOBAL COMPACT FOOTER */}
// //         <footer className="bg-[#070c1e] text-center py-4 border-t border-[#141b3a] text-xs text-gray-500">
// //           <p>© 2026 Xora Scan - Multi-Member AI Dental Research Initiative. All rights reserved.</p>
// //         </footer>

// //       </div>
// //     </Router>
// //   );
// // }

// // export default App;
// import React from 'react';
// import { PageProvider, usePage } from './context/PageContext';
// import Dashboard from './pages/Dashboard';
// import ValidationPage from './pages/Member1/ValidationPage';
// import CariesPage from './pages/Member2/CariesPage';


// function MainAppContent() {
//   const { currentPage } = usePage();

//   if (currentPage === 'dashboard') return <Dashboard />;
//   if (currentPage === 'caries') return <CariesPage />;

//   // Fallback: show dashboard
//   return <Dashboard />;
// }

// function App() {
//   return (
//     <PageProvider>
//       <MainAppContent />
//     </PageProvider>
//   );
// }

// export default App;

import React from 'react';
import { PageProvider, usePage } from './context/PageContext';
import Dashboard from './pages/Dashboard';
import ValidationPage from './pages/Member1/ValidationPage';
import CariesPage from './pages/Member2/CariesPage';
import LoginPage from './pages/LoginPage';



function MainAppContent() {
  // 💡 changePage වෙනුවට navigateTo ලෙස ලබාගන්න
  const { currentPage, navigateTo } = usePage(); 

  if (currentPage === 'dashboard') return <Dashboard />;
  if (currentPage === 'validation') return <ValidationPage />;
  if (currentPage === 'caries') return <CariesPage />;
  
  // 🚀 අලුත් පිටු 3 සඳහා කොන්දේසි
  if (currentPage === 'login') return <LoginPage />;
 


  return <Dashboard />;
}

function App() {
  return (
    <PageProvider>
      <MainAppContent />
    </PageProvider>
  );
}

export default App;