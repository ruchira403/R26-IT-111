import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Sparkles,
  User,
  LogOut,
  ClipboardList,
  Activity,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePage } from '../context/PageContext';
import { getStoredToken, clearStoredAuth } from '../auth/useAuth';

// Import the logo image from assets directory
import logoImg from '../assets/main logo.png';

export default function Header({ transparent = false, dark = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { navigateTo } = usePage();
  const navigate = useNavigate();
  const location = useLocation();

  // Check auth state from localStorage
  const isLoggedIn = !!getStoredToken();

  // Robust email & letter extraction logic
  const getFirstLetterFromStorage = () => {
    try {
      const possibleKeys = ['user', 'userData', 'userInfo', 'authUser', 'account'];
      let foundEmail = '';

      for (const key of possibleKeys) {
        const rawData = localStorage.getItem(key);
        if (rawData) {
          try {
            const parsed = JSON.parse(rawData);
            foundEmail = 
              parsed?.email || 
              parsed?.user?.email || 
              parsed?.data?.email ||
              parsed?.account?.email ||
              '';
            if (foundEmail) break;
          } catch {
            if (typeof rawData === 'string' && rawData.includes('@')) {
              foundEmail = rawData;
              break;
            }
          }
        }
      }

      if (!foundEmail) {
        for (let i = 0; i < localStorage.length; i++) {
          const itemKey = localStorage.key(i);
          const val = localStorage.getItem(itemKey);
          if (val && val.includes('@')) {
            try {
              const parsed = JSON.parse(val);
              foundEmail = parsed?.email || parsed?.user?.email || '';
            } catch {
              if (val.includes('@')) foundEmail = val;
            }
            if (foundEmail) break;
          }
        }
      }

      if (foundEmail && typeof foundEmail === 'string') {
        return foundEmail.trim().charAt(0).toUpperCase();
      }
    } catch (err) {
      console.error('Error reading email from storage:', err);
    }
    return '';
  };

  const [firstLetter, setFirstLetter] = useState(getFirstLetterFromStorage);

  useEffect(() => {
    setFirstLetter(getFirstLetterFromStorage());
  }, [isLoggedIn, location.pathname]);

  // Handle logout
  const handleLogout = () => {
    clearStoredAuth();
    setMobileMenuOpen(false);
    setAvatarMenuOpen(false);
    navigate('/login');
  };

  // Handle navigation
  const handleNavClick = (page, anchorId) => {
    navigateTo(page);
    setMobileMenuOpen(false);
    setAvatarMenuOpen(false);

    if (anchorId) {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(anchorId);
          if (el) {
            el.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 400);
      } else {
        setTimeout(() => {
          const el = document.getElementById(anchorId);
          if (el) {
            el.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 100);
      }
    } else if (page === 'validation') {
      navigate('/member1/validation');
    } else if (location.pathname !== '/') {
      navigate('/');
    }
  };

  // Handle scroll effect for transparent header
  useEffect(() => {
    if (!transparent) {
      setIsScrolled(false);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [transparent]);

  // Close avatar menu when clicking outside / navigating
  useEffect(() => {
    setAvatarMenuOpen(false);
  }, [location.pathname]);

  // Dynamic header classes
  const headerClasses = dark
    ? 'sticky top-0 z-50 w-full bg-[#090D1A] border-b border-brand/20 shadow-lg shadow-brand/10 transition-all duration-300'
    : transparent
      ? isScrolled
        ? 'sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-white/10 shadow-lg shadow-slate-950/30 transition-all duration-300'
        : 'absolute top-0 left-0 w-full z-50 bg-transparent border-b border-white/10 transition-all duration-300'
      : 'sticky top-0 z-50 w-full glass-panel border-b border-slate-200/80 transition-all duration-300';

  const navContainerClasses = dark
    ? 'hidden md:flex items-center space-x-1 bg-brand/10 backdrop-blur-md border border-brand/25 rounded-full px-2.5 py-1 text-sm font-medium'
    : transparent
      ? 'hidden md:flex items-center space-x-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-2.5 py-1 text-sm font-medium'
      : 'hidden md:flex space-x-8 text-sm font-medium';

  const navLinkClasses = dark
    ? 'px-5 py-1.5 rounded-full text-white/80 hover:text-white hover:bg-brand/20 transition-all duration-200 cursor-pointer font-medium'
    : transparent
      ? 'px-5 py-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer font-medium'
      : 'text-slate-600 hover:text-brand transition-colors duration-200 py-2 cursor-pointer font-medium';

  const mobileDrawerClasses = dark
    ? 'md:hidden absolute top-full left-0 w-full bg-[#090D1A]/98 backdrop-blur-lg border-b border-brand/20 shadow-xl animate-in slide-in-from-top-5 duration-200'
    : transparent
      ? 'md:hidden absolute top-full left-0 w-full bg-slate-950/95 backdrop-blur-lg border-b border-white/10 shadow-xl animate-in slide-in-from-top-5 duration-200'
      : 'md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-xl animate-in slide-in-from-top-5 duration-200';

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">

          {/* ==================== Logo Section ==================== */}
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
              {/* Custom Image Logo with Smooth Rounded Borders */}
              <img
                src={logoImg}
                alt="XoraScan Logo"
                className="w-10 h-10 object-cover rounded-xl shadow-md border border-white/20"
              />

              {/* Status Indicator Dot */}
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></div>
            </div>

            <span
              className={
                dark || transparent
                  ? 'text-xl font-bold text-white tracking-tight'
                  : 'text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight'
              }
            >
              Xora
              <span className={dark ? 'text-brand' : transparent ? 'text-brand' : 'text-brand'}>
                Scan
              </span>
            </span>
          </div>

          {/* ==================== Desktop Navigation ==================== */}
          <nav className={navContainerClasses}>
            <button
              onClick={() => handleNavClick('dashboard', 'analysis')}
              className={navLinkClasses}
            >
              Analysis
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (isLoggedIn) {
                  navigate('/patient-trends');
                } else {
                  navigate('/login');
                }
              }}
              className={`${navLinkClasses} ${
                location.pathname === '/patient-trends' ||
                location.pathname === '/member3/trends'
                  ? transparent
                    ? 'bg-white/10 text-white'
                    : 'text-brand'
                  : ''
              }`}
              id="header-patient-trends-btn"
            >
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                Patient Trends
              </span>
            </button>

            {isLoggedIn && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/scan-history');
                }}
                className={`${navLinkClasses} ${
                  location.pathname.startsWith('/scan-history')
                    ? transparent
                      ? 'bg-white/10 text-white'
                      : 'text-brand'
                    : ''
                }`}
                id="header-scan-history-btn"
              >
                <span className="flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" />
                  Scan History
                </span>
              </button>
            )}
          </nav>

          {/* ==================== Desktop Actions ==================== */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setAvatarMenuOpen((value) => !value)}
                    className={`w-10 h-10 inline-flex items-center justify-center rounded-full font-bold text-sm shadow-md transition-all duration-200 ${
                      dark
                        ? 'bg-brand text-white shadow-brand/30 hover:scale-105 ring-2 ring-brand/20'
                        : transparent
                          ? 'bg-white text-slate-900 shadow-black/10 hover:scale-105'
                          : 'bg-brand text-white shadow-brand/20 hover:scale-105'
                    }`}
                    aria-label="User menu"
                    aria-expanded={avatarMenuOpen}
                  >
                    {firstLetter || '?'}
                  </button>

                  {avatarMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        id="header-profile-dropdown-btn"
                      >
                        <User className="w-4 h-4" />
                        User Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        id="header-logout-dropdown-btn"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className={
                    dark
                      ? 'px-5 py-2 text-sm font-semibold text-white/70 hover:text-red-400 transition-all duration-200 cursor-pointer'
                      : transparent
                        ? 'px-5 py-2 text-sm font-semibold text-white/90 hover:text-white transition-all duration-200 cursor-pointer'
                        : 'px-5 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-all duration-200 cursor-pointer'
                  }
                  id="header-logout-btn"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                id="header-login-btn"
                className={
                  dark
                    ? 'px-5 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-brand/20 rounded-xl transition-all duration-200 cursor-pointer'
                    : transparent
                      ? 'px-5 py-2 text-sm font-semibold text-white/95 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer'
                      : 'px-5 py-2 text-sm font-semibold text-slate-700 hover:text-brand hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all duration-200 cursor-pointer'
                }
              >
                Login
              </button>
            )}

            {dark ? (
              <button
                onClick={() => handleNavClick('validation')}
                className="relative overflow-hidden px-5 py-2.5 text-sm font-bold text-white bg-brand hover:bg-brand-dark rounded-xl shadow-lg shadow-brand/30 hover:shadow-brand/50 transform active:scale-[0.98] transition-all duration-200 group cursor-pointer border border-brand/40"
                id="header-start-scan-btn"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  Start New Scan
                  <Sparkles className="w-4 h-4 text-white/80 animate-pulse" />
                </span>
                <div className="absolute inset-0 w-1/2 h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out"></div>
              </button>
            ) : transparent ? (
              <button
                onClick={() => handleNavClick('validation')}
                className="px-6 py-2.5 text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-full shadow-lg shadow-black/10 hover:shadow-black/15 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                id="header-start-scan-btn"
              >
                Start New Scan
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('validation')}
                className="relative overflow-hidden px-5 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-dark rounded-xl shadow-lg shadow-brand/20 hover:shadow-brand/35 transform active:scale-[0.98] transition-all duration-200 group cursor-pointer"
                id="header-start-scan-btn"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  Start New Scan
                  <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
                </span>
                <div className="absolute inset-0 w-1/2 h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out"></div>
              </button>
            )}
          </div>

          {/* ==================== Mobile Menu Button ==================== */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={
                dark
                  ? 'p-2 rounded-xl text-white/80 hover:text-white hover:bg-brand/20 focus:outline-none transition-colors duration-200'
                  : transparent
                    ? 'p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 focus:outline-none transition-colors duration-200'
                    : 'p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors duration-200'
              }
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ==================== Mobile Drawer ==================== */}
      {mobileMenuOpen && (
        <div className={mobileDrawerClasses}>
          <div className="px-4 pt-2 pb-6 space-y-3">
            <button
              onClick={() => handleNavClick('dashboard', 'analysis')}
              className={
                dark
                  ? 'block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-white/80 hover:text-white hover:bg-brand/20 transition-colors'
                  : transparent
                    ? 'block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors'
                    : 'block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-slate-700 hover:text-brand hover:bg-slate-50 transition-colors'
              }
            >
              Analysis
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (isLoggedIn) {
                  navigate('/patient-trends');
                } else {
                  navigate('/login');
                }
              }}
              className={
                dark
                  ? `w-full text-left px-3 py-2 rounded-xl text-base font-medium transition-colors flex items-center gap-2 ${
                      location.pathname === '/patient-trends' ||
                      location.pathname === '/member3/trends'
                        ? 'text-brand bg-brand/10'
                        : 'text-white/80 hover:text-white hover:bg-brand/20'
                    }`
                  : transparent
                    ? `w-full text-left px-3 py-2 rounded-xl text-base font-medium transition-colors flex items-center gap-2 ${
                        location.pathname === '/patient-trends' ||
                        location.pathname === '/member3/trends'
                          ? 'text-white bg-white/10'
                          : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`
                    : `w-full text-left px-3 py-2 rounded-xl text-base font-medium transition-colors flex items-center gap-2 ${
                        location.pathname === '/patient-trends' ||
                        location.pathname === '/member3/trends'
                          ? 'text-brand bg-blue-50'
                          : 'text-slate-700 hover:text-brand hover:bg-slate-50'
                      }`
              }
              id="header-mobile-patient-trends-btn"
            >
              <Activity className="w-4 h-4" />
              Patient Trends
            </button>

            {isLoggedIn && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/scan-history');
                }}
                className={
                  dark
                    ? `w-full text-left px-3 py-2 rounded-xl text-base font-medium transition-colors flex items-center gap-2 ${
                        location.pathname.startsWith('/scan-history')
                          ? 'text-brand bg-brand/10'
                          : 'text-white/80 hover:text-white hover:bg-brand/20'
                      }`
                    : transparent
                      ? `w-full text-left px-3 py-2 rounded-xl text-base font-medium transition-colors flex items-center gap-2 ${
                          location.pathname.startsWith('/scan-history')
                            ? 'text-white bg-white/10'
                            : 'text-white/90 hover:text-white hover:bg-white/10'
                        }`
                      : `w-full text-left px-3 py-2 rounded-xl text-base font-medium transition-colors flex items-center gap-2 ${
                          location.pathname.startsWith('/scan-history')
                            ? 'text-brand bg-blue-50'
                            : 'text-slate-700 hover:text-brand hover:bg-slate-50'
                        }`
                }
                id="header-mobile-scan-history-btn"
              >
                <ClipboardList className="w-4 h-4" />
                Scan History
              </button>
            )}

            <hr
              className={
                dark
                  ? 'border-brand/15 my-2'
                  : transparent
                    ? 'border-white/10 my-2'
                    : 'border-slate-100 my-2'
              }
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/profile');
                    }}
                    className={
                      dark
                        ? 'w-full py-2.5 text-center text-sm font-semibold text-white/80 bg-brand/10 border border-brand/20 rounded-xl hover:bg-brand/20 transition-colors flex items-center justify-center gap-1.5'
                        : transparent
                          ? 'w-full py-2.5 text-center text-sm font-semibold text-white/90 bg-white/10 border border-white/15 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5'
                          : 'w-full py-2.5 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5'
                    }
                    id="header-mobile-profile-btn"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>

                  <button
                    onClick={handleLogout}
                    className={
                      dark
                        ? 'w-full py-2.5 text-center text-sm font-semibold text-red-400 bg-brand/10 border border-brand/20 rounded-xl hover:bg-red-500/10 hover:border-red-500/20 transition-colors flex items-center justify-center gap-1.5'
                        : transparent
                          ? 'w-full py-2.5 text-center text-sm font-semibold text-red-300 bg-white/10 border border-white/15 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5'
                          : 'w-full py-2.5 text-center text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5'
                    }
                    id="header-mobile-logout-btn"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className={
                    dark
                      ? 'w-full py-2.5 text-center text-sm font-semibold text-white/80 bg-brand/10 border border-brand/20 rounded-xl hover:bg-brand/20 transition-colors'
                      : transparent
                        ? 'w-full py-2.5 text-center text-sm font-semibold text-white/90 bg-white/10 border border-white/15 rounded-xl hover:bg-white/20 transition-colors'
                        : 'w-full py-2.5 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors'
                  }
                  id="header-mobile-login-btn"
                >
                  Login
                </button>
              )}

              <button
                onClick={() => handleNavClick('validation')}
                className={
                  dark
                    ? 'w-full py-2.5 text-center text-sm font-bold text-white bg-brand hover:bg-brand-dark rounded-xl shadow-lg shadow-brand/30 transition-colors'
                    : transparent
                      ? 'w-full py-2.5 text-center text-sm font-semibold text-slate-900 bg-white rounded-xl hover:bg-slate-100 transition-colors'
                      : 'w-full py-2.5 text-center text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark shadow-md shadow-brand/10 transition-colors'
                }
                id="header-mobile-start-scan-btn"
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