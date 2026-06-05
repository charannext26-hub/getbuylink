"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

// 🛍️ Updated Affiliate & Creator Niches
const CATEGORIES = [
  { id: "tech", icon: "💻", label: "Tech & Gadgets" },
  { id: "fashion", icon: "👗", label: "Fashion & Style" },
  { id: "beauty", icon: "💄", label: "Beauty" },
  { id: "home", icon: "🏡", label: "Home Decor" },
  { id: "kitchen", icon: "✨", label: "Home & Kitchen" },
  { id: "travel", icon: "✈️", label: "Travel" }, 
  { id: "kids", icon: "👶", label: "Kids & Baby" }, 
  { id: "deals", icon: "🔥", label: "Loot & Deals" },
  { id: "finance", icon: "📈", label: "Finance" },
  { id: "other", icon: "✨", label: "Other" }
];

// 🛑 Internal Platform Routes (Inko koi username nahi le sakta)
const RESERVED_WORDS = ["dashboards", "create", "setting", "abouts", "privacy", "help", "support", "contact", "admin", "api", "login", "signup", "campaign", "campaigns", "terms", "term", "disclosure", "username", "support", "deal", "offer", "cron", "dashboard", "creators", "creator", "influencer", "settings", "about", "privacypolicy", "privacy", "home", "search", "explore"];

export default function UsernameForm() {
  const { update } = useSession();
  
  const [username, setUsername] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null); 
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const [socialLinks, setSocialLinks] = useState(""); 
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ error: "", success: "" });

  // 🚨 1. Smart input handler (Live block spaces & special chars)
  const handleUsernameChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(sanitizedValue);
    setIsUsernameAvailable(null);
  };

  // 🚨 2. Live Username Availability Check (Debounced & Blacklisted)
  useEffect(() => {
    if (username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    // Client-side Blacklist Check (Saves API calls)
    if (RESERVED_WORDS.includes(username)) {
      setIsUsernameAvailable(false);
      return;
    }

    const checkAvailability = async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/check-username?username=${username}`);
        const data = await res.json();
        setIsUsernameAvailable(data.available); 
      } catch (err) {
        setIsUsernameAvailable(null);
      }
      setCheckingUsername(false);
    };

    const timeoutId = setTimeout(() => {
      checkAvailability();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);


  // 🚨 3. Multi-Category Toggle
  const toggleCategory = (label) => {
    if (selectedCategories.includes(label)) {
      setSelectedCategories(selectedCategories.filter(c => c !== label));
    } else {
      setSelectedCategories([...selectedCategories, label]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUsernameAvailable === false || username.length < 3) return; 

    setLoading(true);
    setMessage({ error: "", success: "" });

    const extractedLinks = socialLinks.split('\n').map(link => link.trim()).filter(link => link);

    try {
      const res = await fetch("/api/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username,
          socialHandles: extractedLinks,
          categories: selectedCategories
        }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        setMessage({ error: data.error, success: "" });
      } else {
        setMessage({ error: "", success: data.message });
        await update();
        setTimeout(() => window.location.reload(), 2000); 
      }
    } catch (err) {
      setMessage({ error: "Network error, please try again.", success: "" });
    }
    setLoading(false);
  };

  // Button Active Logic
  const isFormReady = username.length >= 3 && isUsernameAvailable === true;

  return (
    // pb-24 added so bottom sticky button doesn't hide content
    <div className="w-full pb-24 font-sans">
      
      {/* 🖼️ Logo Area */}
      <div className="flex justify-center mb-6 pt-4">
        <img 
          src="/logo-avy-black.png" 
          className="h-10 w-auto object-contain drop-shadow-sm" 
          alt="FavyLink Logo" 
        />
      </div>

      <div className="text-center mb-6 px-4">
        <h2 className="text-2xl font-black text-slate-900 mb-1">Setup Your Creator Profile</h2>
        <p className="text-sm font-medium text-slate-500">Claim your unique storefront handle.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col items-center w-full max-w-md mx-auto space-y-4 px-4">
        
        {/* STEP 1: USERNAME (Fixed Input Hiding) */}
        <div className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative">
          <label className="block text-sm font-extrabold text-slate-800 mb-1">Claim Your Handle <span className="text-red-500">*</span></label>
          <p className="text-[10px] font-bold text-orange-600 mb-2.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Permanent. Cannot be changed later.
          </p>
          
          <div className="relative w-full flex items-center bg-slate-50 border-2 border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:bg-white transition-all px-3 py-2.5">
            <span className="text-slate-400 font-bold text-sm whitespace-nowrap select-none">
              favylink.com/
            </span>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="name"
              className="flex-1 bg-transparent focus:outline-none text-slate-900 font-bold text-sm min-w-0 px-1"
              required
              maxLength={20}
            />

            <div className="shrink-0 ml-1">
              {checkingUsername ? (
                <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : username.length >= 3 ? (
                isUsernameAvailable === true ? (
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                ) : isUsernameAvailable === false ? (
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                ) : null
              ) : null}
            </div>
          </div>
          
          {isUsernameAvailable === false && <p className="text-[10px] font-bold text-red-500 mt-1.5 ml-1">Username is reserved or already taken!</p>}
          {isUsernameAvailable === true && <p className="text-[10px] font-bold text-emerald-600 mt-1.5 ml-1">Awesome! Username is available.</p>}
        </div>

        {/* STEP 2: MULTIPLE SOCIAL LINKS (Compact) */}
        <div className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-extrabold text-slate-800 mb-0.5">Social Handles <span className="text-slate-400 font-medium text-xs">(Optional)</span></label>
          <p className="text-[10px] font-medium text-slate-500 mb-2">Paste multiple URLs (One per line).</p>
          <textarea
            rows="2"
            value={socialLinks}
            onChange={(e) => setSocialLinks(e.target.value)}
            placeholder={`https://instagram.com/yourprofilenhttps://youtube.com/@yourchannel`}
            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-medium text-xs resize-none"
          ></textarea>
        </div>

        {/* STEP 3: MULTIPLE CATEGORIES (Compact) */}
        <div className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-extrabold text-slate-800 mb-0.5">Your Niches <span className="text-slate-400 font-medium text-xs">(Optional)</span></label>
          <p className="text-[10px] font-medium text-slate-500 mb-3">What kind of products do you review?</p>
          
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.label)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${selectedCategories.includes(cat.label) ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-95' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        {message.error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl text-sm font-bold w-full"><svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{message.error}</div>
        )}
        {message.success && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl text-sm font-bold w-full"><svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{message.success}</div>
        )}

        {/* 🚀 STICKY BOTTOM BUTTON */}
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-50 flex justify-center">
          <button
            type="submit"
            disabled={loading || !isFormReady}
            className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-black transition-all w-full max-w-md ${
              isFormReady 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 active:scale-95" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Saving..." : (
              <>
                Complete Setup <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}