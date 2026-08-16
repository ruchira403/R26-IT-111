import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageProvider, usePage } from './context/PageContext';
import Dashboard     from './pages/Dashboard';
import ValidationPage from './pages/Member1/ValidationPage';
import CariesPage    from './pages/Member2/CariesPage';
// Auth pages — separate feature area, URL-routed
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage  from './pages/auth/ProfilePage';
// Scan history & assessment pages
import ScanHistoryPage      from './pages/scans/ScanHistoryPage';
import ScanDetailPage       from './pages/scans/ScanDetailPage';
import AssessmentReportPage from './pages/scans/AssessmentReportPage';

/** Handles internal page switching via PageContext (dashboard / validation / caries) */
function MainAppContent() {
  const { currentPage } = usePage();
  if (currentPage === 'validation') return <ValidationPage />;
  if (currentPage === 'caries')     return <CariesPage />;
  return <Dashboard />;
}

function App() {
  return (
    // PageProvider wraps everything so Header always has access to usePage()
    <PageProvider>
      <Routes>
        {/* Main app — internal navigation via PageContext */}
        <Route path="/"         element={<MainAppContent />} />

        {/* Auth pages — real browser URLs */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile"  element={<ProfilePage />} />

        {/* Scan history & assessment — protected (each page checks token) */}
        <Route path="/scan-history"                                    element={<ScanHistoryPage />} />
        <Route path="/scan-history/:scanId"                            element={<ScanDetailPage />} />
        <Route path="/scan-history/:scanId/assessment/:assessmentId"   element={<AssessmentReportPage />} />

        {/* Direct URL access to member pages, in addition to PageContext switching */}
        <Route path="/member1/validation" element={<ValidationPage />} />
        <Route path="/validation"         element={<ValidationPage />} />
        <Route path="/caries"             element={<CariesPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageProvider>
  );
}

export default App;
