"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';

const fetcher = (url) => fetch(url).then((res) => res.json());

// 🎨 THEMES (Premium Ordered & Optimized)
const THEMES = {
  midnight: { name: "Midnight Neon", bg: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900", text: "text-white", card: "bg-white/10 border-white/20 shadow-md", tab: "bg-white text-purple-400", tabBg: "bg-black/60 border-white/10 backdrop-blur-md" },
  gold: { name: "Royal Gold", bg: "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500", text: "text-slate-900", card: "bg-white/40 border-white/50 shadow-md", tab: "bg-slate-900 text-amber-600", tabBg: "bg-white/50 border-white/30 backdrop-blur-md" },
  glass: { name: "Premium Red", bg: "bg-gradient-to-br from-red-600 via-rose-700 to-slate-900", text: "text-white", card: "bg-black/40 border-white/20 shadow-md", tab: "bg-white text-rose-500", tabBg: "bg-black/60 border-white/10 backdrop-blur-md" },
  luxury: { name: "Luxury Dark", bg: "bg-[#121212] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]", text: "text-white", card: "bg-white/10 border-white/20 shadow-sm", tab: "bg-white text-slate-900", tabBg: "bg-black/80 border-white/10 backdrop-blur-md" },
  minimal: { name: "Minimal Light", bg: "bg-slate-50", text: "text-slate-900", card: "bg-white border-slate-200 shadow-sm", tab: "bg-slate-900 text-white", tabBg: "bg-white/90 border-slate-200" },
  fashion: { name: "Fashion Sunset", bg: "bg-gradient-to-tr from-rose-400 via-fuchsia-500 to-indigo-500", text: "text-white", card: "bg-white/20 border-white/30 shadow-md", tab: "bg-white text-rose-500", tabBg: "bg-black/20 border-white/10 backdrop-blur-md" }
};

function AccountContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isInitialized, setIsInitialized] = useState(false); 
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [showQRModal, setShowQRModal] = useState(false);
  const qrCardRef = useRef(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [totalEarnings, setTotalEarnings] = useState(0);

  // 👇 NAYA: Mobile Number Edit State
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // 👇 NAYA: Full Page Drawer State (null, 'storefront', 'amazon')
  const [activeDrawer, setActiveDrawer] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    image: "",
    bio: "",
    mobileNumber: "",
    bioTheme: "minimal", 
    amazonTag: "",
    isAmazonShortlinkEnabled: false, // 🚀 Toggle for DB
    salesBoosterActive: false,
    banners: [],
    socialHandles: []
  });

  const [newBannerImage, setNewBannerImage] = useState("");
  const [newBannerLink, setNewBannerLink] = useState("");
  const [newSocialTitle, setNewSocialTitle] = useState("");
  const [newSocialLink, setNewSocialLink] = useState("");
  
  const [isMediaSectionOpen, setIsMediaSectionOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  
  const videoTutorialUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ"; 
  const bioMaxLength = 150;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const userEmail = session?.user?.email;
  const { data: userData } = useSWR(userEmail ? `/api/user/get-by-email?email=${userEmail}` : null, fetcher, { revalidateOnFocus: false });
  
  const fetchedUsername = userData?.success ? userData.user.username : null;
  const { data: statsData } = useSWR(fetchedUsername ? `/api/analytics/get-data?username=${fetchedUsername}&timeline=all` : null, fetcher, { revalidateOnFocus: false });

  // 🚀 DRAWER BACK BUTTON LOGIC (Hardware Back Button Support)
  useEffect(() => {
    const handlePopState = () => {
      if (activeDrawer) {
         setActiveDrawer(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeDrawer]);

  const openDrawer = (drawerName) => {
    window.history.pushState({ drawerOpen: true }, '');
    setActiveDrawer(drawerName);
  };

  const closeDrawer = () => {
    window.history.back(); // This triggers popstate -> sets activeDrawer to null
  };

  // Auth Check
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Data Sync
  useEffect(() => {
    if (userData?.success && userData?.user && !isInitialized) {
      const u = userData.user;
      if (!u.username || u.username === "creator") {
        router.replace("/creators"); 
        return;
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
        isAmazonShortlinkEnabled: !!u.isAmazonShortlinkEnabled, // 🚀 Sync Amazon Toggle
        salesBoosterActive: u.salesBoosterActive || false,
        banners: u.banners || [],
        socialHandles: u.socialHandles || []
      });
      setIsInitialized(true); 
    }
  }, [userData, isInitialized, router]);

  useEffect(() => {
    if (statsData?.success && statsData.data?.overall) {
      setTotalEarnings(statsData.data.overall.totalEarnings || 0);
    }
  }, [statsData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddBanner = () => {
    if (!newBannerImage.trim()) return showToast("⚠️ Please enter Banner Image URL");
    setFormData({ ...formData, banners: [...formData.banners, { image: newBannerImage, link: newBannerLink }] });
    setNewBannerImage(""); 
    setNewBannerLink("");
  };

  const handleAddSocial = () => {
    if (!newSocialTitle.trim() || !newSocialLink.trim()) return showToast("⚠️ Please enter both Title and Link");
    setFormData({ ...formData, socialHandles: [...formData.socialHandles, { title: newSocialTitle, link: newSocialLink }] });
    setNewSocialTitle(""); 
    setNewSocialLink("");
  };

  const removeArrayItem = (field, index) => {
    const updated = [...formData[field]];
    updated.splice(index, 1);
    setFormData({ ...formData, [field]: updated });
  };

  const handleSaveChanges = async (isPhoneUpdate = false) => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, ...formData })
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ Updated Successfully!");
        if (isPhoneUpdate) setIsEditingPhone(false);
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

  const downloadQRCard = async () => {
    if (!qrCardRef.current) return;
    try {
      showToast("⏳ Generating high-quality QR...");
      const dataUrl = await toPng(qrCardRef.current, { cacheBust: true, pixelRatio: 4, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${username}-FavyLink-QR.png`;
      link.click();
      showToast("✅ QR Code Downloaded!");
    } catch (err) {
      showToast("⚠️ Error downloading QR.");
    }
  };

  if (!isInitialized || status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 flex justify-center animate-pulse">
        <div className="w-full max-w-2xl h-96 bg-slate-200 rounded-3xl mt-10"></div>
      </div>
    );
  }

  const bioLink = `${window.location.origin}/${username}`;
  const activeTheme = THEMES[formData.bioTheme] || THEMES.minimal;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative pb-20">
      
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm z-[300] flex items-center gap-2 animate-[bounce_0.3s_ease-in-out]">
          {toastMessage}
        </div>
      )}

      {/* IN-PAGE VIDEO MODAL */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 transition-opacity" onClick={() => setIsVideoModalOpen(false)}></div>
          <div className="bg-slate-900 border border-slate-700 p-2 rounded-2xl w-full max-w-4xl shadow-2xl relative z-10">
            <button onClick={() => setIsVideoModalOpen(false)} className="absolute -top-12 right-0 text-white hover:text-red-400 font-bold bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full transition-colors flex items-center gap-2 z-20 shadow-lg">
              Close <span className="text-xl">✕</span>
            </button>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
              <iframe src={videoTutorialUrl} title="Tutorial" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="absolute top-0 left-0 w-full h-full"></iframe>
            </div>
          </div>
        </div>
      )}

      {/* 📱 THE MAIN PAGE UI */}
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        
        {/* Compact Header */}
        <div className="flex items-end gap-2 mb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Account</h1>
          <span className="text-xs font-bold text-slate-500 mb-[2px]">Settings & Overview</span>
        </div>

        {/* BIO LINK BAR (Unchanged) */}
        <div className="bg-white border-[0.5px] border-slate-200/70 rounded-xl py-2 px-3 shadow-sm flex items-center justify-between gap-2 overflow-hidden hover:border-slate-300 transition-colors mb-4">
          <div className="flex flex-col min-w-0 flex-1 pl-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Your Page Link</p>
              <button onClick={copyBioLink} className="text-slate-400 hover:text-emerald-500 active:scale-95 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </button>
            </div>
            <span className="font-black text-[12px] md:text-sm truncate block text-slate-800 leading-tight">favylink.com/{username}</span>
          </div>
          <div className="flex shrink-0 gap-1.5 items-center">
            <button onClick={() => setShowQRModal(true)} className="flex items-center justify-center p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors rounded-lg border border-indigo-100 active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" /></svg>
            </button>
            <a href={bioLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-extrabold text-[10px] md:text-xs shadow-md shadow-blue-500/30 active:scale-95">
              View <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
          </div>
        </div>

        {/* 👇 NAYA: User Info & Dynamic Total Mined Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-row items-stretch gap-3 mb-6 transition-all duration-300">
          
          {/* Left Side: User Details */}
          <div className="flex-1 flex flex-col justify-between gap-2">
            <div className="flex justify-between items-center bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-100">
               <span className="text-[9px] font-extrabold text-slate-400">Username</span>
               <span className="text-[11px] font-bold text-slate-600">@{username}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-100">
               <span className="text-[9px] font-extrabold text-slate-400">Email</span>
               <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px] sm:max-w-[150px]">{email}</span>
            </div>
            
            {/* Dynamic Phone Input */}
            <div className={`flex justify-between items-center bg-blue-50/50 p-1.5 px-3 rounded-lg border border-blue-100 transition-all ${isEditingPhone ? 'ring-2 ring-blue-400' : ''}`}>
               <span className="text-[9px] font-extrabold text-blue-600 whitespace-nowrap mr-2">Phone Number</span>
               {isEditingPhone ? (
                 <input 
                   type="text" 
                   maxLength="10" 
                   autoFocus
                   value={formData.mobileNumber} 
                   onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, '') })} 
                   placeholder="10 digit number" 
                   className="w-full bg-transparent text-right text-[11px] font-bold text-slate-800 outline-none placeholder:text-blue-300" 
                 />
               ) : (
                 <span onClick={() => setIsEditingPhone(true)} className="text-[11px] font-bold text-slate-800 cursor-pointer w-full text-right hover:text-blue-600">
                   {formData.mobileNumber ? `+91 ${formData.mobileNumber}` : "+ Add Number"}
                 </span>
               )}
            </div>
            {/* Update Number Button (Appears only when editing) */}
            {isEditingPhone && (
               <button onClick={() => handleSaveChanges(true)} disabled={saving || formData.mobileNumber.length !== 10} className="w-full bg-blue-600 text-white text-[10px] font-black py-2 rounded-lg mt-1 transition-all disabled:opacity-50">
                 {saving ? "Updating..." : "Update Number"}
               </button>
            )}
          </div>

          {/* Right Side: Total Mined (Shrinks if editing phone) */}
          <div className={`bg-emerald-500 rounded-xl flex flex-col items-center justify-center relative overflow-hidden shrink-0 transition-all duration-300 ease-in-out ${isEditingPhone ? 'w-16 p-2 opacity-50' : 'w-28 sm:w-32 p-3'}`}>
            <div className="relative z-10 text-center">
              <p className={`font-black text-emerald-100 uppercase tracking-wider mb-0.5 transition-all ${isEditingPhone ? 'text-[6px]' : 'text-[8px]'}`}>Total Mined</p>
              <p className={`font-black text-white transition-all ${isEditingPhone ? 'text-sm' : 'text-lg'}`}>₹{totalEarnings.toFixed(2)}</p>
            </div>
            <span className="absolute -right-1 -bottom-4 text-[65px] font-black text-emerald-600 opacity-50 select-none leading-none">₹</span>
          </div>
        </div>

        {/* 👇 NAYA: DRAWER TRIGGERS (Main Page Buttons) */}
        <div className="space-y-4 mb-8">
          
          {/* 1. Storefront Settings Trigger */}
          <button onClick={() => openDrawer('storefront')} className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.99] group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100/50">
                 {/* NAYA: Bio Page (Profile/Layout) SVG Icon */}
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>
              </div>
              <div className="text-left">
                <h3 className="font-black text-slate-800 text-sm">Storefront Appearance</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">Themes, Bio, Banners & Socials</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7-7"></path></svg>
            </div>
          </button>

          {/* 2. Amazon Affiliate Trigger */}
          <button onClick={() => openDrawer('amazon')} className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-orange-300 transition-all active:scale-[0.99] group relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
            <div className="flex items-center gap-4 pl-2">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-orange-100/50 p-2 shadow-inner">
                 {/* NAYA: Real Amazon Logo */}
                 <img src="https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.png" alt="Amazon" className="w-full h-full object-contain drop-shadow-sm" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-slate-800 text-sm">Amazon Affiliate</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">Setup Amazon Tag & Link Shortening</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7-7"></path></svg>
            </div>
          </button>

          {/* 3. NAYA: Payouts & Earnings Trigger */}
          <button onClick={() => router.push('/creators/analytics?tab=payouts')} className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.99] group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/50">
                 {/* NAYA: Indian Cash/Rupee SVG */}
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div className="text-left">
                <h3 className="font-black text-slate-800 text-sm">Payouts & Earnings</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">Withdraw funds & check history</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7-7"></path></svg>
            </div>
          </button>

        </div>

        {/* FAQ SECTION (Unchanged) */}
        <div className="space-y-3 pb-8">
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
      {/* 🚀 FULL PAGE DRAWER 1: STOREFRONT SETTINGS */}
      {/* ========================================== */}
      <div className={`fixed inset-0 z-[150] bg-slate-50 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${activeDrawer === 'storefront' ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* NAYA: Non-Sticky Header with <-- Arrow */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={closeDrawer} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors pr-0.5">
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h2 className="font-black text-lg text-slate-800">Storefront Details</h2>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          <div className="max-w-3xl mx-auto space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
              {/* ... (Profile Image and Details remain same as your code) ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex-shrink-0 relative">
                    {formData.image ? <img src={formData.image} alt="Profile" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-400"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>}
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-xs font-bold text-slate-600">Profile Image URL</label>
                      <button type="button" onClick={() => setIsVideoModalOpen(true)} className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> How to add?
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
                  <label className="block text-xs font-bold text-slate-600 mb-1">Background Theme</label>
                  <button type="button" onClick={() => setIsThemeModalOpen(true)} className="w-full border-2 border-slate-200 rounded-xl p-2.5 font-bold focus:border-blue-500 outline-none transition-colors bg-white text-left flex justify-between items-center">
                    <span>{THEMES[formData.bioTheme]?.name || "Select Theme"}</span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
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
                  
                  {/* Sales Booster Toggle - DISABLED FOR NOW */}
                  <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔥</span>
                      <div>
                        <p className="text-xs font-extrabold text-indigo-900 leading-tight">Live Sales Booster Popups</p>
                        <p className="text-[9px] font-semibold text-indigo-700/70">Show recent purchase popups to visitors.</p>
                      </div>
                    </div>
                    {/* DISABLED AND READONLY */}
                    <label className="relative inline-flex items-center cursor-not-allowed">
                      <input type="checkbox" className="sr-only peer" disabled readOnly checked={false} />
                      <div className="w-9 h-5 bg-slate-300 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* BANNERS & SOCIALS */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5 md:p-6 space-y-6">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></span>
                Banners & Social Handles
              </h2>
              
              {/* Banners Input */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-slate-800">Auto-Sliding Banners</label>
                  {/* NAYA: Video tutorial button for Banners */}
                  <button type="button" onClick={() => setIsVideoModalOpen(true)} className="text-[10px] font-extrabold text-blue-600 bg-white border border-blue-100 px-2 py-1 rounded shadow-sm flex items-center gap-1 hover:bg-blue-50 transition-colors">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> How to set?
                  </button>
                </div>
                {formData.banners.map((item, idx) => {
                  const imgUrl = typeof item === 'string' ? item : item.image;
                  const linkUrl = typeof item === 'string' ? "" : item.link;
                  return (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 border rounded-lg shadow-sm">
                    <img src={imgUrl} alt="banner" className="w-10 h-10 object-cover rounded bg-slate-100" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs truncate text-slate-700 font-bold">{imgUrl}</p>
                      {linkUrl && <p className="text-[10px] truncate text-slate-400 mt-0.5">🔗 {linkUrl}</p>}
                    </div>
                    <button onClick={() => removeArrayItem('banners', idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                )})}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                  <input type="text" value={newBannerImage} onChange={(e) => setNewBannerImage(e.target.value)} placeholder="1. Paste Banner Image URL (4:1 Ratio)..." className="w-full border-2 border-slate-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none" />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={newBannerLink} onChange={(e) => setNewBannerLink(e.target.value)} placeholder="2. Banner Redirect Link (Optional)..." className="flex-1 w-full border-2 border-slate-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none" />
                    <button onClick={handleAddBanner} className="w-full sm:w-auto px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs hover:bg-slate-700 shadow-sm">Add Banner</button>
                  </div>
                </div>
              </div>

              {/* Socials Input */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-slate-800">Social Handles (Buttons)</label>
                  <span className="text-[10px] font-bold text-slate-500">{formData.socialHandles.length}/5 Added</span>
                </div>
                
                {formData.socialHandles.map((item, idx) => {
                  const title = typeof item === 'string' ? "Social Link" : item.title;
                  const url = typeof item === 'string' ? item : item.link;
                  return (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 border rounded-lg shadow-sm">
                    <div className="flex-1 overflow-hidden pl-2">
                      <p className="text-xs font-bold text-slate-700 truncate">{title}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{url}</p>
                    </div>
                    <button onClick={() => removeArrayItem('socialHandles', idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                )})}

                {/* NAYA: Limit to 5 social handles */}
                {formData.socialHandles.length < 5 ? (
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input type="text" value={newSocialTitle} onChange={(e) => setNewSocialTitle(e.target.value)} placeholder="Title (e.g. Join VIP Group)" className="w-full sm:w-1/3 border-2 border-slate-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none" />
                      <input type="text" value={newSocialLink} onChange={(e) => setNewSocialLink(e.target.value)} placeholder="Paste Link URL..." className="w-full flex-1 border-2 border-slate-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none" />
                    </div>
                    <button onClick={handleAddSocial} className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold text-xs hover:bg-slate-700 shadow-sm text-center">Add Social Button</button>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-red-500 text-center pt-2">Max 5 social buttons allowed.</p>
                )}
              </div>

            </div>

          </div>
        </div>
        
        {/* ... Bottom action bar remains same ... */}
        <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] fixed bottom-0 w-full z-20">
          <div className="max-w-3xl mx-auto flex gap-3">
             <button onClick={closeDrawer} className="px-6 py-3.5 bg-slate-100 text-slate-700 font-extrabold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
             <button onClick={() => { handleSaveChanges(); closeDrawer(); }} disabled={saving} className="flex-1 py-3.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50 text-base">
               {saving ? "Saving..." : "Save Configuration"}
             </button>
          </div>
        </div>
      </div>


      {/* ========================================== */}
      {/* 🚀 FULL PAGE DRAWER 2: AMAZON AFFILIATE  */}
      {/* ========================================== */}
      <div className={`fixed inset-0 z-[150] bg-slate-50 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${activeDrawer === 'amazon' ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* NAYA: Non-sticky header with <-- Arrow */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={closeDrawer} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors pr-0.5">
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h2 className="font-black text-lg text-slate-800">Amazon Associates</h2>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          <div className="max-w-xl mx-auto space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
               
               <div className="mb-8">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Amazon Affiliate Tag</label>
                  <input 
                    type="text" 
                    name="amazonTag" 
                    value={formData.amazonTag} 
                    onChange={handleChange} 
                    placeholder="e.g. yourtag-21" 
                    className="w-full border-2 border-slate-200 rounded-2xl p-4 font-bold text-slate-800 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300" 
                  />
                  {/* NAYA: Bullet Points Guide */}
                  <ul className="text-xs font-semibold text-slate-500 mt-4 leading-relaxed px-2 list-disc space-y-1.5 marker:text-slate-300">
                    <li>Your Amazon affiliate earnings will be directly tracked in your official Amazon Associate account.</li>
                    <li>Please enter your <strong>exact Amazon tag</strong> carefully to ensure your tracking and earnings are not missed!</li>
                  </ul>
               </div>

               <button onClick={() => { handleSaveChanges(); showToast("✅ Amazon Tag Saved!"); }} disabled={saving} className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-lg rounded-2xl shadow-lg shadow-blue-500/30 hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                 {saving ? "Saving..." : "Save Affiliate Tag"}
               </button>
            </div>

            {/* Link Shortening Box */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                 <div>
                    <h3 className="text-lg font-black text-slate-800 mb-2">Enable Link Shortening</h3>
                    {/* 🚀 THE FIX: Professional text explaining the App Bypass feature */}
                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[280px]">
                      Enable to route clicks through our secure engine. This allows Amazon links to seamlessly escape in-app browsers (like Instagram) and open directly in the native Amazon App, significantly boosting your conversion rates.
                    </p>
                 </div>
                 
                 {/* 🚀 THE FIX: Updated Toast Message for Disabled Toggle */}
                 <div onClick={() => showToast("🛠️ Feature temporarily unavailable. We are upgrading our shortlink engine for faster routing. Stay tuned!")} className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 opacity-60">
                    <input type="checkbox" className="sr-only peer" disabled readOnly checked={false} />
                    <div className="w-14 h-8 bg-slate-200 rounded-full peer after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6.5 after:w-6.5"></div>
                 </div>
              </div>

              {/* Warning/Info Box */}
              <div className="mt-6 bg-[#FFF9E6] border border-[#F5D77D] rounded-2xl p-5 flex gap-3">
                 <span className="text-[#B97A00] text-lg">⚠️</span>
                 <div>
                    <span className="font-bold text-[#966300] text-sm block mb-1">Important Note on Shortlinks:</span>
                    <p className="text-[#A36C00] text-xs font-medium leading-relaxed">
                      Amazon tracks sales perfectly through raw links. Enabling link shortener will route clicks through our tracking engine. Only turn this ON if you strictly need click analytics for Amazon products on this platform.
                    </p>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* QR & THEME MODALS (Unchanged, hidden inside Z-index) */}
      {showQRModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-300" style={{ zIndex: 2147483647 }}>
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowQRModal(false)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-black text-slate-800 flex items-center gap-2"><span className="text-indigo-600">📱</span> Share Profile</h2>
              <button onClick={() => setShowQRModal(false)} className="w-8 h-8 bg-slate-200 hover:bg-red-100 hover:text-red-600 rounded-full flex items-center justify-center font-bold text-slate-600 transition-colors">✕</button>
            </div>
            <div className="flex items-center justify-center py-4 bg-slate-50 border-y border-slate-100 overflow-x-auto">
              <div ref={qrCardRef} className="bg-white flex flex-col items-center justify-center shadow-sm relative" style={{ width: "280px", height: "350px", padding: "20px", borderRadius: "24px" }}>
                <div className="w-full flex justify-center mb-3">
                  <div className="bg-slate-800 text-white px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                    <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    <span className="text-[10px] font-black tracking-widest uppercase">favylink.com</span>
                  </div>
                </div>
                <div className="relative flex items-center justify-center w-full bg-white mb-1">
                  <QRCodeSVG value={`https://favylink.com/${username}`} size={210} bgColor={"#ffffff"} fgColor={"#0f172a"} level={"H"} />
                  <div className="absolute flex items-center justify-center bg-white rounded-full shadow-sm" style={{ width: "56px", height: "56px" }}>
                    <img src={formData.image || session?.user?.image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="Creator" crossOrigin="anonymous" className="w-12 h-12 rounded-full border-[2.5px] border-slate-200 bg-slate-100 object-cover" />
                  </div>
                </div>
                <div className="flex flex-col items-center w-full mt-1">
                  <p className="font-black text-[19px] text-slate-900 tracking-tight truncate w-full text-center">@{username}</p>
                  <p className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-widest mt-0.5">Scan to shop my favy!</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={downloadQRCard} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-indigo-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Download QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THEME FILTER MODAL */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-[250] bg-slate-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in" onClick={() => setIsThemeModalOpen(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">🎨 Select Theme</h3>
              <button onClick={() => setIsThemeModalOpen(false)} className="w-7 h-7 bg-slate-200 rounded-full text-slate-600 hover:bg-slate-800 hover:text-white font-extrabold flex items-center justify-center transition-colors">✕</button>
            </div>
            
            {/* 🚀 THE FIX: Premium Colored Theme Buttons */}
            <div className="p-4 overflow-y-auto max-h-[65vh] grid gap-3">
               {Object.entries(THEMES).map(([key, theme]) => {
                 const isActiveTheme = formData.bioTheme === key;
                 return (
                 <button 
                   key={key} 
                   onClick={() => { setFormData({ ...formData, bioTheme: key }); setIsThemeModalOpen(false); }} 
                   className={`relative w-full h-16 rounded-xl transition-all overflow-hidden flex items-center justify-center group ${isActiveTheme ? 'ring-4 ring-indigo-500 ring-offset-2 scale-[0.98]' : 'hover:scale-[1.02] shadow-sm'}`}
                 >
                   {/* Background Color/Gradient filling the whole button */}
                   <div className={`absolute inset-0 ${theme.bg}`}></div>
                   
                   {/* Overlay Badge for Text readability */}
                   <div className="relative z-10 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-lg border border-white/20 flex items-center gap-2">
                      <span className="font-black text-sm text-white tracking-wide">{theme.name}</span>
                      {isActiveTheme && <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                   </div>
                 </button>
               )})}
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