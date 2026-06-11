import React, { useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { usePage } from '../context/PageContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { navigateTo } = usePage();

  const handleNavClick = (page, anchorId) => {
    navigateTo(page);
    setMobileMenuOpen(false);
    if (anchorId) {
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo Section */}
          <div 
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-indigo-500 shadow-md shadow-brand/20 transition-transform group-hover:scale-105 duration-300">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M12 7c-2.5 0-4.5 2-4.5 4.5S9.5 16 12 16s4.5-2 4.5-4.5S14.5 7 12 7z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9c-1.5 0-2.5 1-2.5 2.5S10.5 14 12 14s2.5-1 2.5-2.5S13.5 9 12 9z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
              Xora<span className="text-brand">Scan</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            <button 
              onClick={() => handleNavClick('dashboard', 'analysis')}
              className="text-slate-600 hover:text-brand transition-colors duration-200 py-2 cursor-pointer font-medium"
            >
              Analysis
            </button>
            <button 
              onClick={() => handleNavClick('dashboard', 'trends')}
              className="text-slate-600 hover:text-brand transition-colors duration-200 py-2 cursor-pointer font-medium"
            >
              Patient Trends
            </button>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="px-5 py-2 text-sm font-semibold text-slate-700 hover:text-brand hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all duration-200">
              Login
            </button>
            <button 
              onClick={() => handleNavClick('validation')}
              className="relative overflow-hidden px-5 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-dark rounded-xl shadow-lg shadow-brand/20 hover:shadow-brand/35 transform active:scale-[0.98] transition-all duration-200 group cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                Start New Scan
                <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
              </span>
              <div className="absolute inset-0 w-1/2 h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out"></div>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors duration-200"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-xl animate-in slide-in-from-top-5 duration-200">
          <div className="px-4 pt-2 pb-6 space-y-3">
            <button
              onClick={() => handleNavClick('dashboard', 'analysis')}
              className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-slate-700 hover:text-brand hover:bg-slate-50 transition-colors"
            >
              Analysis
            </button>
            <button
              onClick={() => handleNavClick('dashboard', 'trends')}
              className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-slate-700 hover:text-brand hover:bg-slate-50 transition-colors"
            >
              Patient Trends
            </button>
            <hr className="border-slate-100 my-2" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Login
              </button>
              <button 
                onClick={() => handleNavClick('validation')}
                className="w-full py-2.5 text-center text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark shadow-md shadow-brand/10 transition-colors"
              >
                Start New Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
