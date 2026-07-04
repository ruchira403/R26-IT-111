import React from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#060B14] text-slate-400 border-t border-slate-900/60 pt-16 pb-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Logo and About */}
          <div className="flex flex-col space-y-5">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-indigo-500 shadow-md shadow-brand/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M12 7c-2.5 0-4.5 2-4.5 4.5S9.5 16 12 16s4.5-2 4.5-4.5S14.5 7 12 7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9c-1.5 0-2.5 1-2.5 2.5S10.5 14 12 14s2.5-1 2.5-2.5S13.5 9 12 9z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Xora<span className="text-brand">Scan</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              Precision dental diagnostics powered by computer vision and deep learning. Enhancing accuracy and workflow efficiency for clinicians worldwide.
            </p>
            {/* Social Icons */}
            <div className="flex space-x-3 pt-2">
              <a href="#linkedin" className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-brand hover:border-brand transition-all duration-200" aria-label="LinkedIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="#github" className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-brand hover:border-brand transition-all duration-200" aria-label="GitHub">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#twitter" className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-brand hover:border-brand transition-all duration-200" aria-label="Twitter">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Columns */}
          {/* Column 1: Product */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#validation" className="hover:text-white transition-colors duration-150">Validation</a></li>
              <li><a href="#diagnostic" className="hover:text-white transition-colors duration-150">Diagnostic Engine</a></li>
              <li><a href="#trends" className="hover:text-white transition-colors duration-150">Patient Trends</a></li>
              <li><a href="#assistant" className="hover:text-white transition-colors duration-150">AI Assistant</a></li>
              <li><a href="#api" className="hover:text-white transition-colors duration-150">API Documentation</a></li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Resources</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#papers" className="hover:text-white transition-colors duration-150">Research Papers</a></li>
              <li><a href="#studies" className="hover:text-white transition-colors duration-150">Clinical Studies</a></li>
              <li><a href="#cases" className="hover:text-white transition-colors duration-150">Case Library</a></li>
              <li><a href="#compliance" className="hover:text-white transition-colors duration-150">Compliance</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors duration-150">Privacy & HIPAA</a></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <span className="leading-relaxed">Anuradhapura General Hospital, Gate 02, Sri Lanka.</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-brand shrink-0" />
                <a href="mailto:info@xorascan.com" className="hover:text-white transition-colors duration-150">info@xorascan.com</a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-brand shrink-0" />
                <a href="tel:+94112345678" className="hover:text-white transition-colors duration-150">+94 11 234 5678</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-slate-900/90 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          
          <div>
            <span>© 2026 XoraScan. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-1">
            <span>Powered by</span>
            <span className="text-white font-medium">YOLO</span>
            <span>&</span>
            <span className="text-white font-medium">OpenCV</span>
          </div>

          <div className="flex space-x-4">
            <a href="#terms" className="hover:text-white transition-colors duration-150">Terms</a>
            <a href="#privacy-policy" className="hover:text-white transition-colors duration-150">Privacy</a>
            <a href="#cookies" className="hover:text-white transition-colors duration-150">Cookies</a>
          </div>

        </div>
      </div>
    </footer>
  );
}
