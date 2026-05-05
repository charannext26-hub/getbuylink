"use client";
import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [username, setUsername] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* 1. SIMPLE & PREMIUM NAVBAR */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs tracking-tighter shadow-md">
            LF
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">LinkFav</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
            Log in
          </Link>
          <Link href="/register" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-slate-900/20">
            Sign Up Free
          </Link>
        </div>
      </nav>

      {/* 2. THE MAIN HERO SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 lg:pt-20 lg:pb-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 relative z-10">
        
        {/* ========================================== */}
        {/* LEFT SIDE: HEADLINE & CTA */}
        {/* ========================================== */}
        <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start w-full">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span className="text-xs font-bold text-indigo-700 tracking-wide uppercase">The Ultimate Creator Hub</span>
          </div>

          {/* Epic Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
            Share your favs.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
              Multiply your earnings.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-lg sm:text-xl text-slate-500 font-medium mb-10 max-w-2xl leading-relaxed">
            One smart link for all your shoppable deals, social profiles, and favorite products. Includes <strong className="text-slate-800">Auto-Telegram posting</strong> and live sales boosters.
          </p>

          {/* CTA: Claim Username Input (High Conversion Design) */}
          <div className="w-full max-w-md bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex items-center transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 mb-8">
            <div className="pl-4 pr-1 text-slate-400 font-bold text-lg hidden sm:block">
              linkfav.com/
            </div>
            <div className="pl-3 pr-1 text-slate-400 font-bold text-lg sm:hidden">
              lf.com/
            </div>
            <input 
              type="text" 
              placeholder="yourname" 
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="flex-1 bg-transparent outline-none font-bold text-lg text-slate-900 w-full min-w-0"
            />
            <Link 
              href={`/register?username=${username}`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap transition-transform active:scale-95 shadow-md shadow-indigo-600/20 ml-2"
            >
              Claim Link
            </Link>
          </div>

          {/* Micro-copy / Social Proof */}
          <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
            <div className="flex -space-x-2">
              <img className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" src="https://i.pravatar.cc/100?img=1" alt="user" />
              <img className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" src="https://i.pravatar.cc/100?img=5" alt="user" />
              <img className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" src="https://i.pravatar.cc/100?img=9" alt="user" />
            </div>
            <p>Join 10,000+ top creators</p>
          </div>

        </div>

        {/* ========================================== */}
        {/* RIGHT SIDE: PREMIUM MOBILE MOCKUP */}
        {/* ========================================== */}
        <div className="flex-1 w-full flex justify-center lg:justify-end relative perspective-1000">
          
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-200 via-emerald-100 to-fuchsia-100 blur-3xl opacity-50 rounded-full z-0"></div>

          {/* The Phone Frame */}
          <div className="relative w-[300px] h-[600px] bg-slate-900 border-[10px] border-slate-900 rounded-[3rem] shadow-2xl z-10 overflow-hidden transform lg:-rotate-2 hover:rotate-0 transition-transform duration-500 flex flex-col">
            
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl w-32 mx-auto z-20"></div>

            {/* Phone Screen Contents (Luxury Dark Theme) */}
            <div className="flex-1 w-full bg-[#121212] pt-14 pb-6 px-5 flex flex-col items-center relative">
              
              {/* Creator Profile */}
              <div className="w-20 h-20 rounded-full border-[3px] border-white/20 p-1 mb-4">
                <img src="https://i.pravatar.cc/150?img=32" alt="Creator" className="w-full h-full rounded-full object-cover" />
              </div>
              <h3 className="text-white font-black text-xl mb-1">{username ? `@${username}` : "Priya Styles"}</h3>
              <p className="text-white/60 text-xs font-semibold text-center mb-6">Fashion | Lifestyle | Tech deals 👗💻</p>

              {/* Fake Social Links */}
              <div className="w-full space-y-3 mb-6">
                <div className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 flex items-center justify-center gap-2">
                  <span className="text-white text-sm font-extrabold">📺 Watch my Latest Vlog</span>
                </div>
                <div className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 flex items-center justify-center gap-2">
                  <span className="text-white text-sm font-extrabold">📸 Instagram</span>
                </div>
              </div>

              {/* Fake Shoppable Products */}
              <div className="w-full flex-1">
                <p className="text-white/80 font-extrabold text-xs uppercase tracking-wider mb-3">🛍️ Shop My Favs</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl aspect-square border border-white/10"></div>
                  <div className="bg-white/5 rounded-xl aspect-square border border-white/10"></div>
                </div>
              </div>

              {/* Floating Sales Booster Badge (Absolute) */}
              <div className="absolute bottom-6 left-0 right-0 mx-auto w-[90%] bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 animate-bounce">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center"><span className="text-[10px]">🔥</span></div>
                <div className="text-left">
                  <p className="text-[9px] font-black leading-tight">Someone just bought</p>
                  <p className="text-[8px] font-medium leading-tight opacity-90">Apple AirPods Pro</p>
                </div>
              </div>

            </div>
          </div>

          {/* Floating Element 2 (Telegram Bot Icon) */}
          <div className="absolute -left-6 top-20 bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-20 flex items-center gap-3 hidden md:flex animate-[bounce_3s_ease-in-out_infinite]">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-800">Auto-Post Active</p>
              <p className="text-[9px] font-bold text-slate-500">Telegram Sync</p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}