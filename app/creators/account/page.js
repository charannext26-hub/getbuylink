"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';

const THEMES = {
  minimal: { 
    name: "Minimal Clean", 
    bg: "bg-slate-50", 
    text: "text-slate-900", 
    card: "bg-white border-slate-200 shadow-sm" 
  },
  luxury: { 
    name: "Luxury Dark", 
    bg: "bg-[#121212] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]", 
    text: "text-white", 
    card: "bg-white/10 border-white/20 backdrop-blur-md" 
  },
  fashion: { 
    name: "Fashion Sunset", 
    bg: "bg-gradient-to-tr from-rose-400 via-fuchsia-500 to-indigo-500", 
    text: "text-white", 
    card: "bg-white/20 border-white/30 backdrop-blur-md shadow-xl" 
  },
  glass: { 
    name: "Glassmorphism Shop", 
    bg: "bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center", 
    text: "text-white", 
    card: "bg-black/40 border-white/20 backdrop-blur-xl" 
  }
};

function AccountContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [toastMessage, setToastMessage] = useState(null);

  // 👇 YAHAN SE QR CODE KA LOGIC PASTE KAREIN 👇
  const [showQRModal, setShowQRModal] = useState(false);
  const qrCardRef = useRef(null);

  const downloadQRCard = async () => {
    if (!qrCardRef.current) return;
    
    try {
      showToast("⏳ Generating high-quality QR...");
      
      // Modern html-to-image library ka use kar rahe hain
      const dataUrl = await toPng(qrCardRef.current, { 
        cacheBust: true,
        pixelRatio: 4, // 4x High Resolution ke liye
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${username}-LinkFav-QR.png`;
      link.click();
      
      showToast("✅ QR Code Downloaded!");
    } catch (err) {
      console.error("QR Download Error:", err);
      showToast("⚠️ Error downloading QR.");
    }
  };
  
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [totalEarnings, setTotalEarnings] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    image: "",
    bio: "",
    mobileNumber: "",
    bioTheme: "minimal", 
    amazonTag: "",
    salesBoosterActive: false,
    banners: [],
    socialHandles: []
  });

  const [newBanner, setNewBanner] = useState("");
  const [newSocial, setNewSocial] = useState("");
  
  const [isMediaSectionOpen, setIsMediaSectionOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  
  // 🚨 YAHAN APNA YOUTUBE LINK DAALIYE
  const videoTutorialUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ"; 

  const bioMaxLength = 150;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");

    if (status === "authenticated" && session?.user?.email) {
      setLoading(true);
      fetch(`/api/user/get-by-email?email=${session.user.email}`)
        .then(res => res.json())
        .then(async data => {
          if (data.success && data.user) {
            const u = data.user;
            
            if (!u.username || u.username === "creator") {
              router.replace("/creators"); 
              return;
            }

            try {
              const statsRes = await fetch(`/api/analytics/get-data?username=${u.username}&timeline=all`);
              const statsData = await statsRes.json();
              if (statsData.success && statsData.data?.overall) {
                setTotalEarnings(statsData.data.overall.totalEarnings || 0);
              }
            } catch (err) {
              console.error("Failed to fetch earnings for account page:", err);
            }

            setEmail(u.email);
            setUsername(u.username);
            setFormData({
              name: u.name || "",
              image: u.image || "",
              bio: u.bio || "",
              mobileNumber: u.mobileNumber || "",
              bioTheme: u.bioTheme || "minimal",
              amazonTag: u.amazonTag || "",
              salesBoosterActive: u.salesBoosterActive || false,
              banners: u.banners || [],
              socialHandles: u.socialHandles || []
            });
            setLoading(false);
          }
        });
    }
  }, [status, session, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addArrayItem = (field, value, resetSetter) => {
    if (!value.trim()) return;
    setFormData({ ...formData, [field]: [...formData[field], value] });
    resetSetter("");
  };

  const removeArrayItem = (field, index) => {
    const updated = [...formData[field]];
    updated.splice(index, 1);
    setFormData({ ...formData, [field]: updated });
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, ...formData })
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ Profile Updated Successfully!");
      } else {
        showToast("⚠️ Error saving profile.");
      }
    } catch (err) {
      showToast("⚠️ Something went wrong!");
    }
    setSaving(false);
  };

  const copyBioLink = () => {
    const link = `${window.location.origin}/${username}`;
    navigator.clipboard.writeText(link);
    showToast("✅ Bio Link Copied!");
  };

  if (loading || status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const bioLink = `${window.location.origin}/${username}`;
  const activeTheme = THEMES[formData.bioTheme] || THEMES.minimal;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative pb-20">
      
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm z-50 flex items-center gap-2 animate-[bounce_0.3s_ease-in-out]">
          {toastMessage}
        </div>
      )}

      {/* 🚨 NAYA: IN-PAGE VIDEO MODAL (Fixed Close Button & Backdrop Click) */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* 1. Backdrop (Bahar click karne par band hoga) */}
          <div 
            className="absolute inset-0 bg-slate-900/80 transition-opacity" 
            onClick={() => setIsVideoModalOpen(false)}
          ></div>

          {/* 2. Modal Content */}
          <div className="bg-slate-900 border border-slate-700 p-2 rounded-2xl w-full max-w-4xl shadow-2xl relative z-10">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsVideoModalOpen(false)} 
              className="absolute -top-12 right-0 text-white hover:text-red-400 font-bold bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full transition-colors flex items-center gap-2 z-20 shadow-lg"
            >
              Close <span className="text-xl">✕</span>
            </button>

            {/* Fixed Video Aspect Ratio to 16:9 */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
              <iframe 
                src={videoTutorialUrl} 
                title="How to get Image URL"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: SETTINGS FORM                 */}
        {/* ========================================== */}
        <div className="flex-1 space-y-6">
          
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Creator Profile</h1>

          {/* 1. THE BIO LINK BAR (Compact with QR Button) */}
          <div className="bg-slate-900 text-white rounded-xl p-2 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2 pl-2 overflow-hidden flex-1">
              <span className="text-lg">🔗</span>
              <span className="font-bold text-sm truncate text-slate-300">linkfav.com/<span className="text-white">{username}</span></span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              
              {/* 🚨 NAYA QR BUTTON */}
              <button onClick={() => setShowQRModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white transition-colors px-3 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5" title="Get QR Code">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
              </button>

              <button onClick={copyBioLink} className="bg-slate-800 hover:bg-slate-700 transition-colors px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Copy
              </button>
              <a href={bioLink} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white transition-colors px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5">
                Visit
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </a>
            </div>
          </div>

          {/* 2. ACCOUNT SECURITY & EARNINGS (READ-ONLY) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Account Security & Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-1">Username (Locked)</p>
                <p className="font-bold text-slate-900">@{username}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-hidden">
                <p className="text-xs font-bold text-slate-500 mb-1">Email Address</p>
                <p className="font-bold text-slate-900 truncate">{email}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-700 mb-1">All-Time Earnings</p>
                  <p className="font-black text-2xl text-emerald-900">₹{totalEarnings.toFixed(2)}</p>
                </div>
                <svg className="w-8 h-8 text-emerald-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            </div>
          </div>

          {/* 3. PROFILE DETAILS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Public Profile Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex-shrink-0 relative">
                  {formData.image ? <img src={formData.image} alt="Profile" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-400"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>}
                </div>
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-bold text-slate-600">Profile Image URL</label>
                    {/* 🚨 NAYA: Play Icon Button */}
                    <button type="button" onClick={() => setIsVideoModalOpen(true)} className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> How to add
                    </button>
                  </div>
                  <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="https://..." className="w-full border-2 border-slate-200 rounded-xl p-2.5 font-medium focus:border-blue-500 outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Display Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Brand Name" className="w-full border-2 border-slate-200 rounded-xl p-2.5 font-bold focus:border-blue-500 outline-none transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Premium Bio Theme</label>
                <select name="bioTheme" value={formData.bioTheme} onChange={handleChange} className="w-full border-2 border-slate-200 rounded-xl p-2.5 font-bold focus:border-blue-500 outline-none transition-colors bg-white">
                  {Object.entries(THEMES).map(([key, theme]) => (
                    <option key={key} value={key}>{theme.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-xs font-bold text-slate-600">Short Bio</label>
                  <span className={`text-[10px] font-bold ${formData.bio.length > bioMaxLength ? 'text-red-500' : 'text-slate-400'}`}>
                    {formData.bio.length} / {bioMaxLength} characters
                  </span>
                </div>
                <textarea 
                  name="bio" 
                  rows="3" 
                  value={formData.bio} 
                  onChange={handleChange} 
                  placeholder="Welcome to my shopping page! Find the best deals here..." 
                  className={`w-full border-2 rounded-xl p-3 font-medium outline-none transition-colors ${formData.bio.length > bioMaxLength ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
                ></textarea>
                {formData.bio.length > bioMaxLength && <p className="text-[10px] text-red-500 font-bold mt-1">Bio is too long, extra text might be hidden on mobile.</p>}
              </div>
            </div>
          </div>

          {/* 4. MEDIA & SOCIALS (TRUE DROPDOWN FIX) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
            
            {/* Dropdown Header */}
            <button 
              onClick={() => setIsMediaSectionOpen(!isMediaSectionOpen)}
              className="w-full p-5 md:p-6 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
            >
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></span>
                Media & Social Link Settings
              </h2>
              <div className={`p-2 rounded-full transition-transform duration-300 ${isMediaSectionOpen ? 'bg-slate-200 rotate-180' : 'bg-slate-100'}`}>
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </button>

            {/* 🚨 NAYA: Conditional Rendering fixes the empty height issue */}
            {isMediaSectionOpen && (
              <div className="p-5 md:p-6 border-t border-slate-100 space-y-6">
                
                {/* Banners */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-bold text-slate-800">Auto-Sliding Banners (Images)</label>
                    <button type="button" onClick={() => setIsVideoModalOpen(true)} className="text-[10px] font-extrabold text-blue-600 bg-white border border-blue-100 px-2 py-1 rounded shadow-sm flex items-center gap-1 hover:bg-blue-50 transition-colors">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> How to set
                    </button>
                  </div>
                  
                  {formData.banners.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 border rounded-lg shadow-sm">
                      <img src={url} alt="banner" className="w-10 h-10 object-cover rounded bg-slate-100" />
                      <span className="flex-1 text-xs truncate text-slate-500">{url}</span>
                      <button onClick={() => removeArrayItem('banners', idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <input type="text" value={newBanner} onChange={(e) => setNewBanner(e.target.value)} placeholder="Paste banner image URL..." className="flex-1 border-2 border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none" />
                    <button onClick={() => addArrayItem('banners', newBanner, setNewBanner)} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-700 flex items-center gap-1 shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      Add
                    </button>
                  </div>
                </div>

                {/* Socials */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-sm font-bold text-slate-800">Social Handles (Profile Links)</label>
                  
                  {formData.socialHandles.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 border rounded-lg shadow-sm">
                      <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                      </div>
                      <span className="flex-1 text-xs truncate text-slate-500">{url}</span>
                      <button onClick={() => removeArrayItem('socialHandles', idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <input type="text" value={newSocial} onChange={(e) => setNewSocial(e.target.value)} placeholder="Insta/YT Profile URL..." className="flex-1 border-2 border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none" />
                    <button onClick={() => addArrayItem('socialHandles', newSocial, setNewSocial)} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-700 flex items-center gap-1 shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      Add
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* 5. BUSINESS & CONTACT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              Business Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">WhatsApp / Mobile No.</label>
                <input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="+91..." className="w-full border-2 border-slate-200 rounded-xl p-2.5 font-bold focus:border-blue-500 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Amazon Associates Tag</label>
                <input type="text" name="amazonTag" value={formData.amazonTag} onChange={handleChange} placeholder="yourbrand-21" className="w-full border-2 border-slate-200 rounded-xl p-2.5 font-bold focus:border-blue-500 outline-none transition-colors" />
              </div>
            </div>
          </div>

          {/* 6. GROWTH & MARKETING */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Live Sales Booster
                </h2>
                <p className="text-xs font-semibold text-indigo-700/70 leading-relaxed max-w-sm">
                  Show smart "recent purchase" popups on your bio page to build trust and increase conversion rates by up to 3x.
                </p>
              </div>
              
              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.salesBoosterActive}
                  onChange={(e) => setFormData({ ...formData, salesBoosterActive: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
              </label>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button onClick={handleSaveChanges} disabled={saving} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-extrabold text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all hover:-translate-y-1">
            {saving ? "Updating Profile..." : "Save All Changes"}
          </button>
          
          {/* FAQ SECTION (Minimal & Clean) */}
          <div className="mt-8 space-y-3 pb-8">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Frequently Asked Questions</h3>
            
            <details className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer group shadow-sm">
              <summary className="font-bold text-sm text-slate-700 outline-none list-none flex justify-between items-center">
                Why can't I change my Username or Email?
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </summary>
              <p className="text-sm text-slate-500 mt-3 font-medium leading-relaxed border-t border-slate-100 pt-3">
                Your username is permanently tied to your bio link and tracking IDs. Changing it would break all your previously shared affiliate links across your social media. For security, your email is also locked.
              </p>
            </details>

            <details className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer group shadow-sm">
              <summary className="font-bold text-sm text-slate-700 outline-none list-none flex justify-between items-center">
                How does the Amazon Associates Tag work?
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </summary>
              <p className="text-sm text-slate-500 mt-3 font-medium leading-relaxed border-t border-slate-100 pt-3">
                When you enter your Amazon Tag, all Amazon product links on your bio page will automatically include your tag. <br/><br/>
                <b>Note:</b> Earnings and clicks for Amazon links will show directly in your official Amazon Associates Dashboard, not in our platform's analytics.
              </p>
            </details>
          </div>

        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: REALISTIC LIVE PREVIEW       */}
        {/* ========================================== */}
        <div className="hidden lg:block w-[350px] flex-shrink-0">
          <div className="sticky top-8">
            <h3 className="font-extrabold text-slate-400 uppercase tracking-wider text-sm mb-4 text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              Live Bio Preview
            </h3>
            
            {/* Phone Frame */}
            <div className="w-[320px] h-[650px] mx-auto bg-slate-900 border-[10px] border-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl w-32 mx-auto z-20"></div>

              {/* DYNAMIC THEME ENGINE */}
              <div className={`flex-1 w-full overflow-y-auto overflow-x-hidden hide-scrollbar flex flex-col items-center pt-12 pb-6 px-4 transition-all duration-500 ${activeTheme.bg} ${activeTheme.text}`}>
                
                {/* Profile Img */}
                <div className={`w-20 h-20 rounded-full bg-slate-200 mb-3 border-4 overflow-hidden shadow-lg shrink-0 ${formData.bioTheme === 'minimal' ? 'border-white' : 'border-white/20'}`}>
                  {formData.image && <img src={formData.image} alt="pic" className="w-full h-full object-cover"/>}
                </div>

                {/* Name & Bio */}
                <h2 className="font-black text-xl mb-1 text-center tracking-tight">{formData.name || "@" + username}</h2>
                <p className={`text-xs text-center px-2 mb-6 font-medium break-words w-full ${formData.bioTheme === 'minimal' ? 'text-slate-600' : 'text-white/80'}`}>
                  {formData.bio || "Write a short bio to welcome your followers to your shopping page..."}
                </p>

                {/* Banners Preview */}
                {formData.banners.length > 0 && (
                  <div className="w-full h-32 rounded-2xl mb-6 overflow-hidden flex shadow-lg border shrink-0 border-white/10">
                    <img src={formData.banners[0]} className="w-full h-full object-cover" alt="banner preview"/>
                  </div>
                )}

                {/* Social Links Buttons Preview */}
                <div className="w-full space-y-3 mb-6 shrink-0">
                  {formData.socialHandles.map((handle, idx) => (
                    <div key={idx} className={`w-full py-3.5 rounded-2xl flex items-center justify-center text-sm font-extrabold shadow-sm transition-all ${activeTheme.card}`}>
                      {handle.includes('instagram') ? 'Instagram' : handle.includes('youtube') ? 'YouTube' : 'My Link'}
                    </div>
                  ))}
                  {formData.socialHandles.length === 0 && (
                    <div className={`w-full py-4 border-2 border-dashed rounded-xl text-center text-xs font-bold opacity-50 ${formData.bioTheme === 'minimal' ? 'border-slate-300 text-slate-500' : 'border-white/30 text-white'}`}>
                      Social Links appear here
                    </div>
                  )}
                </div>

                {/* Shopping Products Skeleton Preview */}
                <div className="w-full space-y-3 shrink-0">
                  <h4 className="font-extrabold text-sm mb-2 opacity-80">🛍️ Top Deals</h4>
                  <div className={`w-full h-24 rounded-2xl ${activeTheme.card}`}></div>
                  <div className={`w-full h-24 rounded-2xl ${activeTheme.card}`}></div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 🚨 THE PREMIUM QR CODE MODAL 🚨 */}
      {/* ======================================================== */}
      {showQRModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-300" style={{ zIndex: 2147483647 }}>
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowQRModal(false)}></div>
          
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-black text-slate-800 flex items-center gap-2">
                <span className="text-indigo-600">📱</span> Share Profile
              </h2>
              <button onClick={() => setShowQRModal(false)} className="w-8 h-8 bg-slate-200 hover:bg-red-100 hover:text-red-600 rounded-full flex items-center justify-center font-bold text-slate-600 transition-colors">✕</button>
            </div>

            {/* THE DOWNLOADABLE CARD AREA (Clean & Professional) */}
            {/* ========================================== */}
            <div className="flex items-center justify-center py-4 bg-slate-50 border-y border-slate-100 overflow-x-auto">
              
              {/* FIXED SIZE CARD */}
              <div 
                ref={qrCardRef}
                className="bg-white flex flex-col items-center justify-center shadow-sm relative"
                style={{ width: "280px", height: "350px", padding: "20px", borderRadius: "24px" }} 
              >
                
                {/* 1. MARKETING BRANDING (TOP) */}
                <div className="w-full flex justify-center mb-3">
                  <div className="bg-slate-800 text-white px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                    <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    <span className="text-[10px] font-black tracking-widest uppercase">linkfav.com</span>
                  </div>
                </div>

                {/* 2. THE QR CODE WRAPPER */}
                <div className="relative flex items-center justify-center w-full bg-white mb-1">
                  <QRCodeSVG 
                    value={`https://linkfav.com/${username}`}
                    size={210} 
                    bgColor={"#ffffff"}
                    fgColor={"#0f172a"}
                    level={"H"} 
                  />
                  
                  {/* 🚨 SINGLE CREATOR IMAGE CENTERED WITH BORDER 🚨 */}
                  <div className="absolute flex items-center justify-center bg-white rounded-full shadow-sm" style={{ width: "56px", height: "56px" }}>
                    <img 
                      src={formData.image || session?.user?.image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                      alt="Creator" 
                      crossOrigin="anonymous" 
                      className="w-12 h-12 rounded-full border-[2.5px] border-slate-200 bg-slate-100 object-cover" 
                    />
                  </div>
                </div>

                {/* 3. USERNAME & TAGLINE (Gap Reduced) */}
                <div className="flex flex-col items-center w-full mt-1">
                  <p className="font-black text-[19px] text-slate-900 tracking-tight truncate w-full text-center">
                    @{username}
                  </p>
                  <p className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-widest mt-0.5">
                    Scan to shop my favs!
                  </p>
                </div>

              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={downloadQRCard} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-indigo-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Download QR
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function AccountPage() {
  return (
    <SessionProvider>
      <AccountContent />
    </SessionProvider>
  );
}