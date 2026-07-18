"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Link tag for routing

export default function LoginPage() {
  const router = useRouter();
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 👇 NAYE STATES: In-App Browser Escape & iOS Guide ke liye (Bina purana UI chede)
  const [isEscapingApp, setIsEscapingApp] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ==========================================
  // 🚀 STEP 1: UNIVERSAL IN-APP BROWSER ESCAPER LOGIC
  // ==========================================
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent || navigator.vendor || window.opera || "";
    
    // 🌐 UNIVERSAL REGEX: Pakdega IG, FB, YouTube, Telegram, LinkedIn, Twitter, WhatsApp (wv), etc.
    const isInAppBrowser = /Instagram|FBAN|FBAV|FB_IAB|FB4A|FBIOS|FBSS|LinkedInApp|Twitter|Snapchat|Pinterest|YouTube|Telegram|MicroMessenger|Line|wv/i.test(ua);
    
    const isAndroid = /android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/i.test(ua) && !window.MSStream;

    if (isInAppBrowser) {
      if (isAndroid) {
        // 🤖 ANDROID AUTO-ESCAPE: Seedha Chrome Browser me jump karayega
        setIsEscapingApp(true);
        const currentUrl = window.location.href.replace(/^https?:\/\//, "");
        const intentUrl = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
        
        setTimeout(() => {
          window.location.replace(intentUrl);
        }, 10);
      } else if (isIOS) {
        // 🍏 iOS MANUAL ESCAPE GUIDE: Apple auto-redirect block karta hai, isiliye Visual Guide dikhayenge
        setShowIosGuide(true);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
    } else {
      router.refresh(); 
      setTimeout(() => {
        router.push("/creators"); // Dashboard par redirect
      }, 500); 
    }
  };

  // ==========================================
  // 🚀 STEP 2: BOUNCER UI (Android Loading Spinner)
  // ==========================================
  if (isEscapingApp) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#0f0f11] flex flex-col justify-center items-center text-white font-sans p-6 text-center z-50">
        <div className="w-14 h-14 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black mb-2 tracking-tight">Securing Connection...</h2>
        <p className="text-slate-400 text-sm font-medium max-w-xs leading-relaxed">
          Redirecting to your system Chrome browser for seamless Google Sign-In.
        </p>
      </div>
    );
  }

  // ==========================================
  // 🚀 STEP 3: BOUNCER UI (iOS Visual Guide Popup)
  // ==========================================
  if (showIosGuide) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#0f0f11] flex flex-col justify-center items-center text-white font-sans p-6 text-center relative z-50 overflow-hidden">
        {/* Bouncing Arrow Pointing Top-Right to Instagram/App Menu */}
        <div className="absolute top-6 right-6 animate-bounce text-blue-400 text-4xl drop-shadow-lg">
          ↗
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] max-w-sm w-full text-center border border-white/15 shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/40 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
            🧭
          </div>
          <h2 className="text-2xl font-black mb-3 tracking-tight">Action Required!</h2>
          <p className="text-slate-300 text-sm leading-relaxed font-medium mb-6">
            Instagram blocks Google Sign-In sessions. To log in to your account seamlessly:
          </p>
          
          <div className="bg-black/40 rounded-xl p-4 text-left space-y-2.5 text-xs font-bold text-slate-200 border border-white/5 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">1</span>
              <span>Tap the <strong className="text-white">...</strong> (Three Dots) at the top right.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">2</span>
              <span>Select <strong className="text-blue-400">Open in Safari</strong> or <strong className="text-blue-400">System Browser</strong>.</span>
            </div>
          </div>

          <button 
            onClick={() => setShowIosGuide(false)}
            className="w-full bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs py-3 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
          >
            Stay here anyway (Email Log in)
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🚀 STEP 4: MAIN LOGIN PAGE UI (Pura Purana Code Safe Hai)
  // ==========================================
  return (
    // Pura page flex-center hai taaki form hamesha perfectly screen ke center mein fit rahe
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-sans p-4 sm:p-8">
      
      {/* Compact Center Card */}
      <div className="w-full max-w-[400px] bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200/60">
        
        {/* 1. Header Section with Flat Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <img 
            src="/logo-avy-black.png" 
            className="h-10 w-auto object-contain mb-5" 
            alt="FavyLink Logo" 
          />
          <h2 className="text-2xl font-black text-slate-900 mb-1.5">Welcome back</h2>
          <p className="text-[13px] font-bold text-slate-500">
            Log in to access your creator dashboard.
          </p>
        </div>

        {/* Error Message Box */}
        {errorMsg && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {errorMsg}
          </div>
        )}

        {/* 2. Google Login Button (Moved to TOP) */}
        <button 
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/creators" })}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 rounded-xl px-6 py-3.5 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm mb-6 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* 3. Divider line */}
        <div className="flex items-center w-full mb-6">
          <div className="flex-1 border-t-2 border-slate-100"></div>
          <span className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Or log in with email</span>
          <div className="flex-1 border-t-2 border-slate-100"></div>
        </div>

        {/* 4. Login Form (Email & Password Only) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Field */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>

          {/* Password Field with Show/Hide Toggle */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border-2 border-slate-100 pl-4 pr-12 py-3 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors outline-none cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.35-1.583c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 mt-2 cursor-pointer"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        {/* 5. Redirect to Signup Page */}
        <p className="mt-8 text-center text-xs font-bold text-slate-500">
          Don't have an account? 
          <Link href="/signup" className="ml-1 text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors">
            Sign up here
          </Link>
        </p>

      </div>
    </div>
  );
}