import React from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-white text-slate-500 border-t border-slate-200/80 pt-16 pb-12 transition-all duration-300 overflow-hidden z-10">
      
      {/* Top Banner (Newsletter) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-slate-100 pb-12">
          {/* Left Text */}
          <div className="lg:col-span-6 text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Your Smile Matters <br />
              Connect With Us Today
            </h2>
          </div>
          {/* Right Newsletter Input */}
          <div className="lg:col-span-6 space-y-4">
            <p className="text-sm text-slate-600 text-left lg:text-right max-w-md lg:ml-auto leading-relaxed font-medium">
              Join our newsletter to receive the latest oral health tips, special offers and clinic updates.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md lg:ml-auto">
              <div className="flex items-center gap-3 bg-slate-100 border border-slate-200/50 rounded-full px-5 py-2.5 w-full">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  type="email" 
                  placeholder="Your Email Address" 
                  className="bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm w-full"
                />
              </div>
              <button className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white font-bold text-sm px-7 py-3.5 rounded-full shadow-lg shadow-brand/20 transition-all duration-200 shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section (Columns) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-left">
          
          {/* Column 1: Product/Company */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#validation" className="font-semibold text-slate-800 hover:text-brand transition-colors">Validation</a></li>
              <li><a href="#diagnostic" className="font-semibold text-slate-800 hover:text-brand transition-colors">Diagnostic Engine</a></li>
              <li><a href="#trends" className="font-semibold text-slate-800 hover:text-brand transition-colors">Patient Trends</a></li>
              <li><a href="#assistant" className="font-semibold text-slate-800 hover:text-brand transition-colors">AI Assistant</a></li>
              <li><a href="#api" className="font-semibold text-slate-800 hover:text-brand transition-colors">API Documentation</a></li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#papers" className="font-semibold text-slate-800 hover:text-brand transition-colors">Research Papers</a></li>
              <li><a href="#studies" className="font-semibold text-slate-800 hover:text-brand transition-colors">Clinical Studies</a></li>
              <li><a href="#cases" className="font-semibold text-slate-800 hover:text-brand transition-colors">Case Library</a></li>
              <li><a href="#compliance" className="font-semibold text-slate-800 hover:text-brand transition-colors">Compliance</a></li>
              <li><a href="#privacy" className="font-semibold text-slate-800 hover:text-brand transition-colors">Privacy & HIPAA</a></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#privacy-policy" className="font-semibold text-slate-800 hover:text-brand transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="font-semibold text-slate-800 hover:text-brand transition-colors">Terms and Conditions</a></li>
              <li><a href="#license" className="font-semibold text-slate-800 hover:text-brand transition-colors">License</a></li>
              <li><a href="#cookies" className="font-semibold text-slate-800 hover:text-brand transition-colors">Cookies Policy</a></li>
            </ul>
          </div>

          {/* Column 4: Contact/Help */}
          <div className="flex flex-col space-y-5">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">We'd love to help you with ease</h3>
              <a 
                href="mailto:info@xorascan.com" 
                className="text-2xl font-extrabold text-slate-900 border-b-2 border-slate-900 pb-0.5 hover:text-brand hover:border-brand transition-colors inline-block tracking-tight"
              >
                info@xorascan.com
              </a>
            </div>
            
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Follow Us</h4>
              <div className="flex space-x-3 pt-1">
                {/* Facebook */}
                <a href="#facebook" className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-800 hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-200" aria-label="Facebook">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8H7v3h2v9h3v-9h3l.5-3H12V6c0-.88.39-1 1-1h2V2h-3c-2.9 0-4 1.5-4 3.5V8z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="#instagram" className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-800 hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-200" aria-label="Instagram">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                {/* Twitter (X) */}
                <a href="#twitter" className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-800 hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-200" aria-label="Twitter">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                {/* YouTube */}
                <a href="#youtube" className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-800 hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-200" aria-label="YouTube">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.483 20.455 12 20.455 12 20.455s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 space-y-1.5 font-medium">
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Anuradhapura General Hospital, Gate 02, Sri Lanka.</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>+94 11 234 5678</span>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Giant Watermark Background Text */}
      <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none select-none -z-10 overflow-hidden h-[18vw] flex items-center justify-center">
        <span className="text-[12vw] font-black text-slate-100 leading-none tracking-tighter uppercase">
          XoraScan
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6"></div>

      {/* Bottom Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-semibold">
          
          <div>
            <span>© 2026 XoraScan. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-1">
            <span>Powered by</span>
            <span className="text-slate-800 font-bold">YOLO</span>
            <span>&</span>
            <span className="text-slate-800 font-bold">OpenCV</span>
          </div>

          <div className="flex space-x-4">
            <a href="#terms" className="hover:text-brand transition-colors">Terms</a>
            <a href="#privacy-policy" className="hover:text-brand transition-colors">Privacy</a>
            <a href="#cookies" className="hover:text-brand transition-colors">Cookies</a>
          </div>

        </div>
      </div>

    </footer>
  );
}
