import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageProvider } from './context/PageContext';
import Dashboard from './pages/Dashboard';
import ValidationPage from './pages/Member1/ValidationPage';
import CariesPage from './pages/Member2/CariesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <PageProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/member1/validation" element={<ValidationPage />} />
        <Route path="/validation" element={<ValidationPage />} />
        <Route path="/caries" element={<CariesPage />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageProvider>
  );
}

export default App;
