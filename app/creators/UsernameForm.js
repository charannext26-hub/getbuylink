"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const CATEGORIES = [
  { id: "fashion", icon: "👗", label: "Fashion" },
  { id: "tech", icon: "💻", label: "Tech" },
  { id: "beauty", icon: "💄", label: "Beauty" },
  { id: "home", icon: "🏡", label: "Home Decor" },
  { id: "Home & Kitchen", icon: "✨", label: "Home & Kitchen" },
  { id: "deals", icon: "🔥", label: "Deals" },
  { id: "fitness", icon: "🏋️", label: "Fitness" },
  { id: "finance", icon: "📈", label: "Finance" },
  { id: "other", icon: "✨", label: "Other" }
];

export default function UsernameForm() {
  const { update } = useSession();
  
  const [username, setUsername] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null); // null = checking/typing, true = available, false = taken
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const [socialLinks, setSocialLinks] = useState(""); // Will be split by newline later
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ error: "", success: "" });

  // 🚨 1. Smart input handler (Live block spaces & special chars)
  const handleUsernameChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(sanitizedValue);
    setIsUsernameAvailable(null); // Reset check status when typing
  };

  // 🚨 2. Live Username Availability Check (Debounced)
  useEffect(() => {
    if (username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    const checkAvailability = async () => {
      setCheckingUsername(true);
      try {
        // Assume aapki ek nayi choti API banegi iske liye: /api/check-username
        const res = await fetch(`/api/check-username?username=${username}`);
        const data = await res.json();
        setIsUsernameAvailable(data.available); // API should return { available: true/false }
      } catch (err) {
        setIsUsernameAvailable(null);
      }
      setCheckingUsername(false);
    };

    // 500ms delay taaki har keypress par API hit na ho
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
    if (isUsernameAvailable === false) return; // Prevent submit if taken

    setLoading(true);
    setMessage({ error: "", success: "" });

    // Extract multiple URLs from text area
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

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col items-center w-full max-w-md mx-auto space-y-5">
      
      {/* STEP 1: USERNAME */}
      <div className="w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
        <label className="block text-sm font-extrabold text-slate-800 mb-1">Claim Your Handle <span className="text-red-500">*</span></label>
        
        {/* Short Warning */}
        <p className="text-[10px] font-bold text-orange-600 mb-3 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          Permanent. Cannot be changed later.
        </p>
        
        <div className="relative w-full flex items-center bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:bg-white transition-all">
          
          <div className="pl-3.5 pr-1 py-3 text-slate-400 font-bold text-sm bg-transparent pointer-events-none shrink-0 border-r border-slate-200/50">
            getbuylink.com/
          </div>
          
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="yourname"
            className="w-full pl-2 pr-10 py-3 bg-transparent focus:outline-none text-slate-900 font-bold text-sm"
            required
            maxLength={20}
          />

          {/* 🚨 Live Status Icon inside the input */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {checkingUsername ? (
              <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : username.length >= 3 ? (
              isUsernameAvailable === true ? (
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              ) : isUsernameAvailable === false ? (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              ) : null
            ) : null}
          </div>
        </div>
        
        {/* Helper text below input */}
        {isUsernameAvailable === false && <p className="text-[10px] font-bold text-red-500 mt-1">Username already taken!</p>}
        {isUsernameAvailable === true && <p className="text-[10px] font-bold text-emerald-600 mt-1">Available!</p>}
      </div>

      {/* STEP 2: MULTIPLE SOCIAL LINKS (Textarea) */}
      <div className="w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <label className="block text-sm font-extrabold text-slate-800 mb-1">Social Handles <span className="text-slate-400 font-medium text-xs">(Optional)</span></label>
        <p className="text-[10px] font-medium text-slate-500 mb-3">Paste multiple URLs (One per line). e.g., Insta, YT, Telegram.</p>
        
        <textarea
          rows="3"
          value={socialLinks}
          onChange={(e) => setSocialLinks(e.target.value)}
          placeholder={`https://instagram.com/yourprofile\nhttps://youtube.com/@yourchannel`}
          className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-medium text-xs resize-none"
        ></textarea>
      </div>

      {/* STEP 3: MULTIPLE CATEGORIES */}
      <div className="w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <label className="block text-sm font-extrabold text-slate-800 mb-1">Your Niches <span className="text-slate-400 font-medium text-xs">(Optional)</span></label>
        <p className="text-[10px] font-medium text-slate-500 mb-3">Select one or more categories you promote.</p>
        
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.label)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${selectedCategories.includes(cat.label) ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-95' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
            >
              <span className="text-sm">{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUBMIT ACTION */}
      <button
        type="submit"
        disabled={loading || username.length < 3 || isUsernameAvailable === false}
        className="mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-blue-500/30 transition-all w-full max-w-md active:scale-95"
      >
        {loading ? (
          "Saving..."
        ) : (
          <>
            Complete Setup <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </>
        )}
      </button>

      {/* Messages */}
      {message.error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl text-sm font-bold w-full max-w-md shadow-sm"><svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{message.error}</div>
      )}
      {message.success && (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl text-sm font-bold w-full max-w-md shadow-sm"><svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{message.success}</div>
      )}
    </form>
  );
}