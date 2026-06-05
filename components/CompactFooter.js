import Link from 'next/link';

export default function CompactFooter() {
  return (
    <footer className="bg-[#0a0a0a] py-10 px-4 text-white mt-auto border-t-[6px] border-blue-600">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-4">
        
        {/* 1. Logo & Text Area */}
        <div className="flex flex-col items-center md:items-start gap-3 md:w-1/3">
          <img 
            src="/logo-avy-white.png" 
            className="h-8 sm:h-10 w-auto object-contain" 
            alt="FavyLink Logo" 
          />
          <p className="text-xs text-slate-400 text-center md:text-left leading-relaxed max-w-[250px]">
            The ultimate hub for professional creators. Build a premium storefront, automate deals, and multiply earnings.
          </p>
        </div>

        {/* 2. Legal Links */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-slate-300 font-medium md:w-1/3 md:pt-2">
          <Link href="/terms" className="hover:text-blue-400 transition-colors">Terms & Conditions</Link>
          <Link href="/privacy-policy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
          <Link href="/disclosure" className="hover:text-blue-400 transition-colors">Disclosure</Link>
        </div>

        {/* 3. Contact Button & Social Icons */}
        <div className="flex flex-col items-center md:items-end gap-4 md:w-1/3">
          <a href="mailto:support@favylink.com" className="bg-white/10 hover:bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors">
            Contact Support
          </a>
          
          {/* Compact Social Icons */}
          <div className="flex items-center gap-4">
            {/* Instagram */}
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-pink-500 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            {/* YouTube */}
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            {/* Facebook */}
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-500 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/></svg>
            </a>
            {/* Telegram */}
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-500 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto border-t border-slate-800 mt-8 pt-6 text-center text-xs text-slate-500 font-medium">
        © {new Date().getFullYear()} FavyLink. All rights reserved. Designed for Creators.
      </div>
    </footer>
  );
}