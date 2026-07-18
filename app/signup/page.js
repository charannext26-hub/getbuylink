"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form Hide/Show State
  const [showEmailForm, setShowEmailForm] = useState(false);

  // 👇 NAYE STATES: In-App Browser Escape & iOS Guide ke liye
  const [isEscapingApp, setIsEscapingApp] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Form States
  const [name, setName] = useState("");
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

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        setErrorMsg(data.message || "Something went wrong.");
        setLoading(false);
      } else {
        setSuccessMsg(true);
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg("Failed to connect to the server. Please try again.");
      setLoading(false);
    }
  };

  // ==========================================
  // 🚀 STEP 4: MAIN SIGNUP PAGE UI
  // ==========================================
  return (
    <div className="min-h-[100dvh] w-full flex flex-col justify-center items-center bg-slate-50 font-sans p-4 py-10 overflow-y-auto">
      
      <div className="w-full max-w-[400px] bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200/60 my-auto transition-all duration-300 ease-in-out">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <img 
            src="/logo-avy-black.png" 
            className="h-10 w-auto object-contain mb-5" 
            alt="FavyLink Logo" 
          />
          <h2 className="text-2xl font-black text-slate-900 mb-1.5">Create an account</h2>
          <p className="text-[13px] font-bold text-slate-500">
            Start monetizing your favourites today.
          </p>
        </div>

        {/* SUCCESS STATE */}
        {successMsg ? (
          <div className="flex flex-col items-center text-center py-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Check your email</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">
              We've sent a verification link to <br/><strong className="text-slate-800">{email}</strong>
            </p>
            <p className="text-xs text-slate-400">Click the link in the email to verify your account and continue setting up your profile.</p>
          </div>
        ) : (
          <>
            {/* Error Message Box */}
            {errorMsg && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-start gap-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {errorMsg}
              </div>
            )}

            {/* Google Signup Button */}
            <button 
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/creators" })}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 rounded-xl px-6 py-3.5 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm mb-4 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* Email Form Toggle */}
            {!showEmailForm ? (
              <button 
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-6 py-3.5 text-slate-600 font-bold text-sm hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                Continue with Email
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Divider */}
                <div className="flex items-center w-full my-6">
                  <div className="flex-1 border-t-2 border-slate-100"></div>
                  <span className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Or sign up with email</span>
                  <div className="flex-1 border-t-2 border-slate-100"></div>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  {/* Email */}
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

                  {/* Password */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Create Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border-2 border-slate-100 pl-4 pr-12 py-3 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                        required
                        minLength={6}
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

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 mt-2 cursor-pointer"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        <p className="mt-8 text-center text-xs font-bold text-slate-500">
          Already have an account? 
          <Link href="/login" className="ml-1 text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors">
            Sign in here
          </Link>
        </p>

      </div>
    </div>
  );
}