"use client";
import { useState, useEffect, use, useRef } from "react";

// 🎨 THEMES (Premium Ordered & Optimized)
const THEMES = {
  // 1. Sabse Last wala (Midnight Neon) ab 1st par
  midnight: { 
      name: "Midnight Neon",
      bg: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900", 
      text: "text-white", 
      card: "bg-white/10 border-white/20 shadow-md", 
      tab: "bg-white text-purple-400", 
      tabBg: "bg-slate-900 border-white/10" 
  },
  // 2. Gold
  gold: { 
      name: "Royal Gold",
      bg: "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500", 
      text: "text-slate-900", 
      card: "bg-white/40 border-white/50 shadow-md", 
      tab: "bg-slate-900 text-amber-600", 
      tabBg: "bg-white/50 border-white/30 backdrop-blur-md" 
  },
  // 3. Premium Red (Pehle Glass tha)
  glass: { 
      name: "Premium Red",
      bg: "bg-gradient-to-br from-red-600 via-rose-700 to-slate-900", 
      text: "text-white", 
      card: "bg-black/40 border-white/20 shadow-md", 
      tab: "bg-white text-rose-500", 
      tabBg: "bg-black/60 border-white/10 backdrop-blur-md" 
  },
  // 4. Luxury Dark 
  luxury: { 
      name: "Luxury Dark",
      bg: "bg-[#121212] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]", 
      text: "text-white", 
      card: "bg-white/10 border-white/20 shadow-sm", 
      tab: "bg-white text-slate-900", 
      tabBg: "bg-black/80 border-white/10 backdrop-blur-md" 
  },
  // 5. Minimal (Last 2)
  minimal: { 
      name: "Minimal Light",
      bg: "bg-slate-50", 
      text: "text-slate-900", 
      card: "bg-white border-slate-200 shadow-sm", 
      tab: "bg-slate-900 text-white", 
      tabBg: "bg-white border-slate-200" 
  },
  // 6. Fashion (Last 1)
  fashion: { 
      name: "Fashion Sunset",
      bg: "bg-gradient-to-tr from-rose-400 via-fuchsia-500 to-indigo-500", 
      text: "text-white", 
      card: "bg-white/20 border-white/30 shadow-md", 
      tab: "bg-white text-rose-500", 
      tabBg: "bg-black/20 border-white/10 backdrop-blur-md" 
  }
};
// Super Extractors
const getYouTubeID = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    return match ? match[1] : null;
};
const getFacebookEmbedUrl = (url) => {
    if (!url) return null;
    if (!url.includes('facebook.com') && !url.includes('fb.watch') && !url.includes('fb.com')) return null;
    let cleanUrl = url.replace('m.facebook.com', 'www.facebook.com');
    if (cleanUrl.includes('/reel/') || cleanUrl.includes('/videos/')) cleanUrl = cleanUrl.split('?')[0]; 
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=false&width=400`;
};
const getInstagramEmbedUrl = (url) => {
    if (!url) return null;
    if (!url.toLowerCase().includes('instagram.com')) return null;
    let embedUrl = url.split('?')[0]; 
    if (!embedUrl.endsWith('/')) embedUrl += '/';
    return embedUrl + 'embed';
};
const getThumbnail = (url) => {
    if (!url) return "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400&auto=format&fit=crop";
    const ytId = getYouTubeID(url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return "https://images.unsplash.com/photo-1611262588024-d12430b98920?q=80&w=400&auto=format&fit=crop";
};

// ⏱️ auto Post Timing
const timeAgo = (date) => {
    if (!date) return "recently";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
};

// 🧮 SMART INDIAN PRICE FORMATTER
const formatIndianPrice = (priceStr) => {
    if (!priceStr) return "";
    const num = parseFloat(priceStr.toString().replace(/[^\d.]/g, ''));
    if (isNaN(num)) return priceStr;
    return `₹${num.toLocaleString('en-IN')}`;
};


// 🌟 SMART Colored SVG Logos
const SVGS = {
    whatsapp: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>,
    instagram: (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
            <defs><linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#fd5949" /><stop offset="50%" stopColor="#d6249f" /><stop offset="100%" stopColor="#285AEB" /></linearGradient></defs>
            <path fill="url(#igGrad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
    ),
    youtube: <svg className="w-6 h-6" fill="#FF0000" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>,
    telegram: <svg className="w-6 h-6" fill="#0088cc" viewBox="0 0 24 24"><path d="M11.944 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm6.81 7.228-2.333 11.002c-.179.807-.655 1.006-1.328.625l-3.673-2.709-1.77 1.705c-.196.196-.361.36-.74.36l.263-3.743 6.817-6.155c.296-.264-.065-.41-.459-.153l-8.423 5.303-3.633-1.139c-.79-.247-.806-.79.165-1.17l14.218-5.48c.658-.246 1.233.15.895 1.554z"/></svg>,
    facebook: <svg className="w-6 h-6" fill="#1877F2" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>,
    default: <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
};

const getSocialDetails = (socialObj) => {
    if (!socialObj) return { name: 'Link', url: '#', icon: SVGS.default };

    // 👇 NAYA: Check karega ki purana string format hai ya naya object format
    const isString = typeof socialObj === 'string';
    let rawUrl = isString ? socialObj.trim() : (socialObj.link || "");
    let customTitle = isString ? null : socialObj.title; // Creator ka diya hua naam

    let url = rawUrl;
    if (url.startsWith('@')) url = `https://t.me/${url.substring(1)}`;
    let lowerUrl = url.toLowerCase();

    let icon = SVGS.default;
    let defaultName = "Link";

    if (lowerUrl.includes('whatsapp') || lowerUrl.includes('wa.me')) { icon = SVGS.whatsapp; defaultName = 'WhatsApp'; }
    else if (lowerUrl.includes('instagram')) { icon = SVGS.instagram; defaultName = 'Instagram'; }
    else if (lowerUrl.includes('youtube')) { icon = SVGS.youtube; defaultName = 'YouTube'; }
    else if (lowerUrl.includes('telegram') || lowerUrl.includes('t.me')) { icon = SVGS.telegram; defaultName = 'Telegram'; }
    else if (lowerUrl.includes('facebook') || lowerUrl.includes('fb.com')) { icon = SVGS.facebook; defaultName = 'Facebook'; }
    else {
        try { defaultName = new URL(url).hostname.replace('www.', '').split('.')[0]; } catch(e) {}
    }

    // 👇 NAYA: Agar customTitle hai toh wo dikhega, warna default name
    return { name: customTitle || defaultName, url, icon };
};

const applyMasonryOrder = (items) => {
    if (!items || items.length === 0) return [];
    const left = [];
    const right = [];
    items.forEach((item, i) => {
        if (i % 2 === 0) left.push(item);
        else right.push(item);
    });
    return [...left, ...right];
};

export default function CreatorBioPage({ params }) {
  const unwrappedParams = use(params);
  const username = unwrappedParams.username; 
  
  const [isCreatorLoading, setIsCreatorLoading] = useState(true);
  const [isDealsLoading, setIsDealsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("home");
  const [deals, setDeals] = useState([]);
  const [creator, setCreator] = useState(null);
  
  const [theatreMode, setTheatreMode] = useState({ isOpen: false, videoUrl: "", relatedDeals: [] });
  const [collectionMode, setCollectionMode] = useState({ isOpen: false, title: "", relatedDeals: [] });
  const [isHomeDrawerOpen, setIsHomeDrawerOpen] = useState(false);
  const [categoryDrawer, setCategoryDrawer] = useState({ isOpen: false, title: "", relatedDeals: [] }); 
  
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [liveSale, setLiveSale] = useState(null); 
  
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [isDisclaimerVisible, setIsDisclaimerVisible] = useState(true);
  const [isDisclaimerDrawerOpen, setIsDisclaimerDrawerOpen] = useState(false);

  const bannerScrollRef = useRef(null);

  const [isEscapingApp, setIsEscapingApp] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // 👇 NAYA: Pagination (Infinite Scroll) States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loaderRef = useRef(null); // Scroll track karne ke liye
  const [allTimeTrending, setAllTimeTrending] = useState([]);
  const [similarDeals, setSimilarDeals] = useState([]);
  const [isSimilarLoading, setIsSimilarLoading] = useState(false);

  // 👇 NAYA: Full Page Drawer Stack & Custom Share States
  const [dealDrawerStack, setDealDrawerStack] = useState([]); // Array use karenge taaki back button smoothly chale
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [customShareModal, setCustomShareModal] = useState({ isOpen: false, deal: null, generatedUrl: "" });
  const [isRedirecting, setIsRedirecting] = useState(false);

  const activeDeal = dealDrawerStack.length > 0 ? dealDrawerStack[dealDrawerStack.length - 1] : null;

  // 👇 NAYA: Mobile Back Button Logic (Stack Pop System)
  useEffect(() => {
      const handlePopState = () => {
          if (customShareModal.isOpen) {
              setCustomShareModal({ isOpen: false, deal: null, generatedUrl: "" });
          } else if (dealDrawerStack.length > 0) {
              setDealDrawerStack(prev => prev.slice(0, -1));
          }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [dealDrawerStack, customShareModal.isOpen]);

  const openDetailedModal = (deal) => {
      window.history.pushState({ modalOpen: true }, ''); 
      setDealDrawerStack(prev => [...prev, deal]);
  };

  const handleShareClick = async (deal) => {
      setIsGeneratingShare(true);
      try {
          let finalUrl = `${window.location.origin}/`; 

          // 🚀 Sirf "Own" link bina API ke share hoga
          if (deal.linkType === "own") {
              finalUrl = deal.expandedUrl || deal.originalUrl;
              if (finalUrl && finalUrl.startsWith('/go/')) {
                  finalUrl = `${window.location.origin}${finalUrl}`;
              }
          }
          // 🛑 CACHE CHECK FOR TELEGRAM DEALS
          else if (deal.finalUrl && deal.isRaw) {
              finalUrl = deal.finalUrl;
          } else if (deal.shortCode) {
              finalUrl = `${window.location.origin}/go/${deal.shortCode}`; 
          } 
          // 🔄 API CALL: Sirf Telegram deals ke liye pehli baar
          else if (creator) {
              const res = await fetch('/api/generate-link', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ dealId: deal._id, creatorUsername: creator.username, triggerSource: "detailed_share" })
              });
              const data = await res.json();
              
              if (data.success && (data.finalUrl || data.shortCode)) {
                  if (data.isRaw) {
                      finalUrl = data.finalUrl;
                  } else {
                      finalUrl = `${window.location.origin}/go/${data.shortCode}`;
                  }
                  
                  deal.shortCode = data.shortCode;
                  deal.finalUrl = data.finalUrl;
                  deal.isRaw = data.isRaw;
                  
                  setDealDrawerStack(prevStack => prevStack.map(d => d._id === deal._id ? { ...d, shortCode: data.shortCode, finalUrl: data.finalUrl, isRaw: data.isRaw } : d));
                  setDeals(prevDeals => prevDeals.map(d => d._id === deal._id ? { ...d, shortCode: data.shortCode, finalUrl: data.finalUrl, isRaw: data.isRaw } : d));
                  
                  const cacheKey = `deals_${creator.username}_${activeTab}`;
                  const cachedStr = sessionStorage.getItem(cacheKey);
                  if (cachedStr) {
                      const cachedData = JSON.parse(cachedStr);
                      if (cachedData.deals) {
                          const updatedCachedDeals = cachedData.deals.map(d => d._id === deal._id ? { ...d, shortCode: data.shortCode, finalUrl: data.finalUrl, isRaw: data.isRaw } : d);
                          sessionStorage.setItem(cacheKey, JSON.stringify({ ...cachedData, deals: updatedCachedDeals }));
                      }
                  }
              } else {
                  triggerToast("Could not generate share link.");
                  setIsGeneratingShare(false);
                  return; 
              }
          }

          window.history.pushState({ shareModalOpen: true }, '');
          setCustomShareModal({ isOpen: true, deal: deal, generatedUrl: finalUrl });
      } catch (e) {
          triggerToast("Failed to generate share link");
      } finally {
          setIsGeneratingShare(false);
      }
  };

  // 👇 NAYA: Background Scroll Lock (Ye lag & vibrate issue ko 100% fix kar dega)
  useEffect(() => {
      // Agar drawer khula hai ya share modal khula hai, toh main page ko freeze kardo
      if (dealDrawerStack.length > 0 || customShareModal.isOpen) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'unset';
      }
      
      // Cleanup function
      return () => { document.body.style.overflow = 'unset'; };
  }, [dealDrawerStack.length, customShareModal.isOpen]);

  // 👇 NAYA: Throttled Scroll Listener (Zero Lag)
useEffect(() => {
    let isPastThreshold = false; // Internal flag (React state ko bypass karne ke liye)

    const handleScroll = () => {
        const currentScroll = window.scrollY > 150; 
        
        // 🛡️ THE FIX: React state sirf tabhi update hogi jab "hide" se "show" hoga. 
        // Baar-baar scroll karne par faltu updates nahi aayenge!
        if (currentScroll !== isPastThreshold) {
            isPastThreshold = currentScroll;
            
            // requestAnimationFrame browser ko batata hai ki next frame par hi paint kare (Butter Smooth)
            requestAnimationFrame(() => {
                setIsScrolled(currentScroll);
            });
        }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    }, []);
      
  // ⚡ STEP 2: App Escaper Logic (With STRICT UI BLOCKING for Bio Page)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || navigator.vendor || window.opera || "";
    
    // 🌐 UNIVERSAL REGEX: Pakdega IG, FB, YouTube, Telegram, LinkedIn, Twitter, WhatsApp (wv), etc.
    const isInAppBrowser = /Instagram|FBAN|FBAV|FB_IAB|FB4A|FBIOS|FBSS|LinkedInApp|Twitter|Snapchat|Pinterest|YouTube|Telegram|MicroMessenger|Line|wv/i.test(ua);
    
    const isAndroid = /android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/i.test(ua) && !window.MSStream;

    if (isInAppBrowser) {
      if (isAndroid) {
        // 🤖 STRICT ANDROID BOUNCER: Pehle spinner ON karo, fir Chrome me phenko
        setIsEscapingApp(true); // 👈 YE LINE MISSING THI! Isse spinner turant aayega
        const currentUrl = window.location.href.replace(/^https?:\/\//, "");
        const intentUrl = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
        setTimeout(() => { window.location.replace(intentUrl); }, 10);
      // } else if (isIOS) {
        // 🍏 STRICT iOS BOUNCER: iPhone par bhi normal page mat dikhao, Visual Guide Popup chalao
        //setShowIosGuide(true);
      }
    }
  }, []);

  useEffect(() => {
      if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const tab = urlParams.get("tab");
          if (tab && ["home", "trending", "liveoffer", "categories"].includes(tab)) {
              setActiveTab(tab);
          }
      }
  }, []);

  // ============================================================================
  // 🚀 1.5 SMART CACHE BUSTER (Page Refresh par purana kachra saaf karega)
  // ============================================================================
  useEffect(() => {
      if (typeof window !== "undefined" && window.performance) {
          const navEntries = window.performance.getEntriesByType("navigation");
          // Agar user ne refresh button dabaya, toh saare tabs ka cache uda do
          if (navEntries.length > 0 && navEntries[0].type === "reload") {
              Object.keys(sessionStorage).forEach(key => {
                  if (key.startsWith("deals_")) sessionStorage.removeItem(key);
              });
          }
      }
  }, []); // Sirf pehli baar chalega

  // ============================================================================
  // 🚀 1. FETCH CREATOR PROFILE (Ye galti se delete ho gaya tha!)
  // ============================================================================
  useEffect(() => {
      async function getCreator() {
          const cachedCreator = sessionStorage.getItem(`creator_${username}`);
          if (cachedCreator) {
              setCreator(JSON.parse(cachedCreator));
              setIsCreatorLoading(false);
          }
          try {
              const res = await fetch(`/api/user/get-by-username?username=${username}`);
              const data = await res.json();
              if (data.success) {
                  setCreator(data.user);
                  sessionStorage.setItem(`creator_${username}`, JSON.stringify(data.user));
              }
          } catch (err) { console.error(err); } 
          finally { setIsCreatorLoading(false); }
      }
      if (username) getCreator();
  }, [username]);

  // ============================================================================
  // 🚀 2. FETCH DEALS BASED ON TAB (STRICT CACHE - 0 API Calls on Tab Switch)
  // ============================================================================
  useEffect(() => {
      if (!creator) return;
      let ignore = false; 

      async function fetchTabDeals() {
          const cacheKey = `deals_${creator.username}_${activeTab}`;
          const cachedStr = sessionStorage.getItem(cacheKey);

          // 1️⃣ INSTANT LOAD FROM CACHE
          if (cachedStr) {
              try {
                  const cachedData = JSON.parse(cachedStr);
                  if (!Array.isArray(cachedData) && cachedData.deals) {
                      if (!ignore) {
                          setDeals(cachedData.deals);
                          setPage(cachedData.page);
                          setHasMore(cachedData.hasMore);
                          setIsDealsLoading(false);
                      }
                      return; // 🛑 THE STRICT LOCK: Cache mil gaya toh function yahi khatam! Koi API call nahi!
                  }
              } catch(e) {}
          }

          // Agar cache nahi hai (First time tab open), tabhi API jayegi
          setDeals([]); 
          setIsDealsLoading(true);
          setPage(1);

          try {
              const res = await fetch(`/api/deals/get-all?username=${creator.username}&page=1&limit=20&tab=${activeTab}`);
              const data = await res.json();
              
              if (!ignore && data.success) {
                  setDeals(data.deals);
                  setPage(1);
                  setHasMore(data.hasMore);
                  sessionStorage.setItem(cacheKey, JSON.stringify({ deals: data.deals, page: 1, hasMore: data.hasMore })); 
              }
          } catch (err) { console.error(err); } 
          finally { if (!ignore) setIsDealsLoading(false); }
      }
      
      fetchTabDeals();
      return () => { ignore = true; };
  }, [activeTab, creator]);

  // ============================================================================
  // 🚀 NAYA: FETCH SIMILAR DEALS FOR DRAWER (With Smart Category Cache to Save APIs)
  // ============================================================================
  useEffect(() => {
      if (activeDeal && activeDeal.category && activeDeal.category !== "Other") {
          
          // 🛑 THE FIX: Check karega ki kya is category ka similar data pehle se fetch kiya hua hai?
          const similarCacheKey = `similar_${creator?.username}_${activeTab}_${activeDeal.category}`;
          const cachedSimilarStr = sessionStorage.getItem(similarCacheKey);
          
          if (cachedSimilarStr) {
              try {
                  const cachedSimilarDeals = JSON.parse(cachedSimilarStr);
                  // 🚀 THE MAGIC: Cache se data uthao, aur har baar usko naye tareeqe se Shuffle kar do!
                  const shuffledDeals = cachedSimilarDeals
                      .filter(d => d._id !== activeDeal._id)
                      .sort(() => 0.5 - Math.random()); // Ye line har baar order badal degi
                  
                  setSimilarDeals(shuffledDeals);
                  setIsSimilarLoading(false);
                  return; 
              } catch(e) {}
          }

          setIsSimilarLoading(true);
          setSimilarDeals([]); 

          fetch(`/api/deals/get-all?username=${creator?.username}&page=1&limit=15&tab=${activeTab}&category=${encodeURIComponent(activeDeal.category)}`)
          .then(res => res.json())
          .then(data => {
              if (data.success && data.deals) {
                  // 📦 Cache Save: Ek baar data aa gaya toh usko category ke naam se save kar lo
                  sessionStorage.setItem(similarCacheKey, JSON.stringify(data.deals));
                  
                  const filtered = data.deals.filter(d => d._id !== activeDeal._id).sort(() => 0.5 - Math.random());
                  setSimilarDeals(filtered);
              }
          })
          .catch(err => console.error(err))
          .finally(() => setIsSimilarLoading(false)); 
      }
  }, [activeDeal?._id, activeDeal?.category, creator?.username, activeTab]);

  // ============================================================================
  // 🚀 3. INFINITE SCROLL (Scroll karne par agla page + Duplicate Check Fix)
  // ============================================================================
  const loadMoreDeals = async () => {
      if (!creator || !hasMore || isFetchingMore) return;
      setIsFetchingMore(true);
      try {
          const nextPage = page + 1;
          const res = await fetch(`/api/deals/get-all?username=${creator.username}&page=${nextPage}&limit=20&tab=${activeTab}`);
          const data = await res.json();
          if (data.success) {
              setDeals(prev => {
                  // 🛡️ THE FIX: Check karega ki naya product pehle se list mein hai ya nahi
                  const existingIds = new Set(prev.map(d => d._id));
                  const newUniqueDeals = data.deals.filter(d => !existingIds.has(d._id));
                  
                  // Sirf UNIQUE deals ko hi purani list mein jodega
                  const updatedDeals = [...prev, ...newUniqueDeals];
                  
                  // Cache update karega WITH TIMESTAMP
                  const cacheKey = `deals_${creator.username}_${activeTab}`;
                  sessionStorage.setItem(cacheKey, JSON.stringify({ deals: updatedDeals, page: nextPage, hasMore: data.hasMore, timestamp: Date.now() }));
                  
                  return updatedDeals;
              });
              setPage(nextPage);
              setHasMore(data.hasMore);
          }
      } catch (error) { console.error(error); } 
      finally { setIsFetchingMore(false); }
  };

  useEffect(() => {
      const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isDealsLoading) {
              loadMoreDeals();
          }
      }, { threshold: 0.1 }); 
      
      if (loaderRef.current) observer.observe(loaderRef.current);
      return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isDealsLoading, page, creator, activeTab]);

  // 🚀 NAYA: Dynamic Manifest (Add to Home Screen) Injector
    useEffect(() => {
        // Next.js latest rule: params ek Promise hai, isliye usko pehle unwrap karna zaroori hai
        const getManifest = async () => {
            // Agar params directly available nahi hai, toh React.use() ya await ka use karein
            // Note: useEffect ke andar hum Promise.resolve use karke safely value nikal sakte hain
            const resolvedParams = await Promise.resolve(params);
            const username = resolvedParams?.username;

            if (username) {
                // Hamari nayi dynamic API ka URL
                const dynamicManifestUrl = `/api/manifest?username=${username}`;
                
                // Pata lagao ki kya pehle se koi manifest tag hai HTML mein
                let manifestLink = document.querySelector('link[rel="manifest"]');
                
                if (manifestLink) {
                    // Agar hai, toh usko hamare dynamic wale se replace kar do
                    manifestLink.href = dynamicManifestUrl;
                } else {
                    // Agar nahi hai, toh ek naya tag banakar Head mein daal do
                    manifestLink = document.createElement('link');
                    manifestLink.rel = 'manifest';
                    manifestLink.href = dynamicManifestUrl;
                    document.head.appendChild(manifestLink);
                }
            }
        };

        getManifest();
    }, [params]); // Dependency mein sirf params rakha hai

  useEffect(() => {
      if (!creator?.banners?.length || creator.banners.length <= 1) return;
      const interval = setInterval(() => {
          if (bannerScrollRef.current) {
              const max = bannerScrollRef.current.scrollWidth - bannerScrollRef.current.clientWidth;
              if (bannerScrollRef.current.scrollLeft >= max - 10) bannerScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
              else bannerScrollRef.current.scrollBy({ left: bannerScrollRef.current.clientWidth, behavior: 'smooth' });
          }
      }, 4000);
      return () => clearInterval(interval);
  }, [creator?.banners]);

   // ============================================================================
  // 🚀 DRAWER HISTORY MANAGER: Hardware Back Button ke liye (All Drawers)
  // ============================================================================
  useEffect(() => {
      // Jab bhi koi Drawer ya Theatre mode khule, history mein ek step add karo
      if (collectionMode.isOpen || categoryDrawer.isOpen || theatreMode.isOpen) {
          window.history.pushState({ drawerOpen: true }, '');
      }
  }, [collectionMode.isOpen, categoryDrawer.isOpen, theatreMode.isOpen]);

  useEffect(() => {
      // Jab user Phone ka Back Button dabaye, toh open wala drawer close kar do
      const handlePopState = () => {
          if (theatreMode.isOpen) {
              setTheatreMode({ isOpen: false, videoUrl: "", relatedDeals: [] });
          } else if (collectionMode.isOpen) {
              setCollectionMode({ isOpen: false, title: "", relatedDeals: [] });
          } else if (categoryDrawer.isOpen) {
              setCategoryDrawer({ isOpen: false, title: "", relatedDeals: [] });
          }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [collectionMode.isOpen, categoryDrawer.isOpen, theatreMode.isOpen]);

  useEffect(() => {
      if (!creator || !creator.salesBoosterActive) return;
      
      const triggerRandomSale = () => {
          const STORES = ["Flipkart", "Amazon", "Myntra", "Shopsy", "Ajio"];
          const TIMES = ["just now", "a few minutes ago", "recently"];
          const AMOUNTS = [499, 899, 1299, 1499, 599, 749, 1999, 999, 2499, 399];
          
          setLiveSale({ store: STORES[Math.floor(Math.random() * STORES.length)], time: TIMES[Math.floor(Math.random() * TIMES.length)], amount: AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)] });
          setTimeout(() => setLiveSale(null), 4000);
      };

      const initialTimer = setTimeout(() => {
          triggerRandomSale();
          const interval = setInterval(() => triggerRandomSale(), Math.floor(Math.random() * 8000) + 10000);
          return () => clearInterval(interval);
      }, 6000);

      return () => clearTimeout(initialTimer);
  }, [creator]);

  const triggerToast = (msg) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(""), 2500);
  };

  const handleTabShare = (tabData) => {
      const shareText = `Hey! Check out these handpicked ${tabData.label} curated just for you. Grab the deals before they're gone! 👇\n\n`;
      const shareUrl = `${window.location.origin}/${username}?tab=${tabData.id}`;
      
      if (navigator.share) {
          navigator.share({ title: `${creator?.name}'s Deals`, text: shareText, url: shareUrl }).catch(()=>{});
      } else {
          navigator.clipboard.writeText(shareText + shareUrl);
          triggerToast("Link Copied!");
      }
      setIsShareDrawerOpen(false);
  };

  const handleDealClick = async (deal) => {
      if (!creator) return;

      // 🚀 THE FIX: Sirf "Own" link hi bypass hoga kyunki uska link get-all bhej raha hai!
      if (deal.linkType === "own") {
          let targetUrl = deal.expandedUrl || deal.originalUrl;
          if (targetUrl) {
              if (targetUrl.startsWith('/go/')) {
                  targetUrl = `${window.location.origin}${targetUrl}`;
              }
              return window.open(targetUrl, '_blank');
          }
          return triggerToast("Link not available");
      }
      
      // 🛑 CACHE CHECK FOR ALL PLATFORM DEALS (Manual + Telegram)
      if (deal.finalUrl && deal.isRaw) {
          return window.open(deal.finalUrl, '_blank');
      } else if (deal.shortCode) {
          return window.open(`${window.location.origin}/go/${deal.shortCode}`, '_blank');
      }

      // 🔄 API CALL: Ye ab saari Platform deals ke liye chalegi (Manual ho ya Telegram)
      try {
        const res = await fetch('/api/generate-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealId: deal._id, creatorUsername: creator.username, triggerSource: "bio_page" })
        });
        const data = await res.json();
        
        if (data.success && (data.finalUrl || data.shortCode)) {
            deal.shortCode = data.shortCode; 
            deal.finalUrl = data.finalUrl; 
            deal.isRaw = data.isRaw; 
            
            setDealDrawerStack(prevStack => prevStack.map(d => 
                d._id === deal._id ? { ...d, shortCode: data.shortCode, finalUrl: data.finalUrl, isRaw: data.isRaw } : d
            ));

            setDeals(prevDeals => prevDeals.map(d => 
                d._id === deal._id ? { ...d, shortCode: data.shortCode, finalUrl: data.finalUrl, isRaw: data.isRaw } : d
            ));
            
            // ... (Cache Saving Logic exactly wahi purana wala) ...

            if (data.isRaw) {
                window.open(data.finalUrl, '_blank'); 
            } else {
                window.open(`${window.location.origin}/go/${data.shortCode}`, '_blank'); 
            }
        } else {
            triggerToast("Deal is currently unavailable!"); 
        }
      } catch (err) { 
        triggerToast("Connection error! Please try again.");
      }
  };

  // ============================================================================
  // 🚀 4. DATA PROCESSING (With Master Deduplication Shield)
  // ============================================================================
  
  // 🛡️ THE MASTER FILTER: Agar koi duplicate ID aa gayi hai, toh usko filter kar do
  const uniqueDealsMap = new Map();
  deals.forEach(deal => {
      if (deal && deal._id) uniqueDealsMap.set(deal._id, deal);
  });
  const cleanDeals = Array.from(uniqueDealsMap.values());

  const masterFeed = [];
  const processedBatches = new Set();
  
  // Collections aur Videos ko group karne ka logic (Ab hum deals ki jagah cleanDeals use karenge)
  cleanDeals.forEach(deal => {
      if (!deal.batchId) {
          masterFeed.push({ type: 'single', deal: deal });
      } else if (!processedBatches.has(deal.batchId)) {
          processedBatches.add(deal.batchId);
          const batch = cleanDeals.filter(d => d.batchId === deal.batchId);
          const hasVid = batch.find(d => d.videoUrl);
          masterFeed.push({ type: hasVid ? 'video' : 'collection', batchId: deal.batchId, videoUrl: hasVid?.videoUrl, title: deal.collectionName || hasVid?.title || "Collection", deals: batch });
      }
  });

  // Category grouping
  const categoryGroups = {};
  cleanDeals.forEach(deal => {
      if (deal.source === "creator") {
          const cat = deal.category || "Others";
          if (!categoryGroups[cat]) categoryGroups[cat] = [];
          categoryGroups[cat].push(deal);
      }
  });

  // Masonry arrays (Taki UI kharab na ho)
  const orderedMasterFeed = applyMasonryOrder(masterFeed);
  const orderedDeals = applyMasonryOrder(deals);

  // -------------------------------------------------------------
  // ✨ PAGE SKELETON (Before Creator Loads) & THEME DEFINITION
  // -------------------------------------------------------------
  // 👇 YAHAN NAYA CODE ADD HUA HAI (STEP 3: Bouncer UI)
  if (isEscapingApp) {
      return (
          <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center text-white font-sans">
              <div className="w-14 h-14 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
              <h2 className="text-2xl font-black mb-2">Securing Connection...</h2>
              <p className="text-slate-400 text-sm font-medium">Opening in Browser for best experience</p>
          </div>
      );
  }

  if (showIosGuide) {
      return (
          <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center text-white font-sans relative px-4">
              <div className="fixed top-4 right-5 animate-bounce text-emerald-500 text-5xl drop-shadow-lg">↗</div>
              <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] max-w-sm text-center border border-white/20 shadow-2xl">
                  <div className="text-5xl mb-4">🛒</div>
                  <h2 className="text-2xl font-black mb-3">Almost there!</h2>
                  <p className="text-slate-300 text-sm leading-relaxed font-medium">
                      Instagram blocks shopping apps. To continue seamlessly, tap the <b className="text-white">3 dots (...)</b> at the top right and select <b className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">"Open in Browser"</b>.
                  </p>
              </div>
          </div>
      );
  }

  if (isCreatorLoading) {
      return (
          <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
              <div className="w-full max-w-md p-4 animate-pulse">
                  <div className="w-full h-[22dvh] bg-slate-300/60 rounded-2xl mb-4"></div>
                  <div className="flex gap-4 mb-6 relative z-10">
                      <div className="w-20 h-20 bg-slate-300/60 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-3 mt-2">
                          <div className="h-5 bg-slate-300/60 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-300/60 rounded w-full"></div>
                          <div className="h-3 bg-slate-300/60 rounded w-5/6"></div>
                      </div>
                  </div>
                  <div className="flex justify-center gap-4 mb-6">
                      {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 bg-slate-300/60 rounded-xl"></div>)}
                  </div>
                  <div className="w-full h-12 bg-slate-300/60 rounded-xl mb-6"></div>
                  <div className="grid grid-cols-2 gap-3">
                      {[1,2,3,4].map(i => <div key={i} className="w-full h-48 bg-slate-300/60 rounded-2xl"></div>)}
                  </div>
              </div>
          </div>
      );
  }

  if (!creator) return <div className="text-center mt-20 text-xl text-red-500 font-bold">Creator not found!</div>;
  
  // 🔥 YAHAN DEFINE HOTA HAI THEME
  const currentTheme = THEMES[creator.bioTheme?.toLowerCase()] || THEMES.minimal;

  const renderFeedItem = (item, uniqueKey) => {
      if (item.type === 'single') {
          return (
              <div key={uniqueKey} className="break-inside-avoid">
                  <GridProductCard 
                      deal={item.deal} 
                      onClick={() => handleDealClick(item.deal)} 
                      themeCardClass={currentTheme.card} 
                      onToast={triggerToast} 
                      showTimeAgo={activeTab === 'telegram'} 
                  />
              </div>
          );
      } 
      else if (item.type === 'video') {
          const isInsta = (item.videoUrl || "").toLowerCase().includes('instagram.com');
          const isFB = (item.videoUrl || "").toLowerCase().includes('facebook.com') || (item.videoUrl || "").toLowerCase().includes('fb.watch');
          const thumbUrl = isInsta ? (item.deals[0]?.image || getThumbnail(item.videoUrl)) : getThumbnail(item.videoUrl);

          return (
              <div key={uniqueKey} onClick={() => setTheatreMode({ isOpen: true, videoUrl: item.videoUrl, relatedDeals: item.deals })} className={`break-inside-avoid relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer shadow-sm border group ${currentTheme.card}`}>
                  
                  {/* 👇 YAHAN ZOOM HACK LAGAYA HAI: scale-[1.35] se black sides frame ke bahar chale jayenge */}
                  <img src={thumbUrl} className="w-full h-full object-cover scale-[1.35] group-hover:scale-[1.45] transition-transform duration-500" alt="Video Thumbnail" />

                 {/* VIDEO SOCIAL LOGO (Top-Left) */}
                  <div className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-md rounded-lg shadow-sm z-10">
                      {isInsta ? (
                          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      ) : isFB ? (
                          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                      ) : (
                          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                      )}
                  </div>

                  {/* Shopping Bag SVG + Product Count */}
                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur text-slate-900 text-[10px] font-black px-2 py-1 rounded flex items-center gap-1.5 shadow-md">
                      <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6V4a4 4 0 0 0-8 0v2H3v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6h-5zM10 4a2 2 0 0 1 4 0v2h-4V4z"/></svg>
                      {item.deals?.length || 0} Products
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3">
                      <p className="text-white font-bold text-xs leading-tight line-clamp-2 drop-shadow-md">{item.title}</p>
                  </div>
              </div>
          );
      } 
      else {
          return (
              <div key={uniqueKey} onClick={() => setCollectionMode({ isOpen: true, title: item.title, relatedDeals: item.deals })} className={`break-inside-avoid rounded-2xl p-2.5 shadow-sm cursor-pointer group hover:border-emerald-300 transition-colors border ${currentTheme.card}`}>
                  <div className="grid grid-cols-2 gap-1.5 mb-2 relative">
                      {item.deals.slice(0, 4).map((d, i) => (
                          <div key={i} className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm border border-black/10">
                              <img src={d.image} className="w-full h-full object-cover" alt="Collection Item" />
                          </div>
                      ))}
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="bg-blue-500/20 text-blue-300 text-[8px] font-black px-1.5 py-0.5 rounded flex w-fit items-center gap-1 border border-blue-500/30 uppercase">
                          Collection
                      </span>
                      <span className="text-[10px] font-black opacity-80 flex items-center gap-1">
                          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6V4a4 4 0 0 0-8 0v2H3v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6h-5zM10 4a2 2 0 0 1 4 0v2h-4V4z"/></svg>
                          {item.deals?.length || 0} Products
                      </span>
                  </div>

                  <h3 className="font-extrabold text-xs mt-1.5 line-clamp-1">{item.title}</h3>
              </div>
          );
      }
  };

  // -------------------------------------------------------------
  // ✨ THE MAIN UI RENDER
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black/90 flex justify-center font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* ⚠️ OFFER TAB DISCLAIMER POPUP */}
      {activeTab === 'liveoffer' && isDisclaimerVisible && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md z-[150] pointer-events-none px-4 flex justify-end">
              <div className="bg-[#0f172a] border border-slate-700 p-1.5 pl-3 rounded-full shadow-xl flex items-center gap-2 pointer-events-auto animate-in slide-in-from-right fade-in duration-300 transform-gpu">
                  <div onClick={() => setIsDisclaimerDrawerOpen(true)} className="flex items-center gap-1.5 cursor-pointer">
                      <span className="text-[10px] font-bold text-white flex items-center gap-1">
                          <span className="text-yellow-400">⚠️</span> Price & Stock
                      </span>
                  </div>
                  <div className="w-px h-4 bg-white/20 mx-1"></div>
                  <button onClick={() => setIsDisclaimerVisible(false)} className="text-slate-400 hover:text-white w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 transition">
                      ✕
                  </button>
              </div>
          </div>
      )}

      {/* ⚠️ DISCLAIMER DRAWER */}
      {isDisclaimerDrawerOpen && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-4" onClick={() => setIsDisclaimerDrawerOpen(false)}>
              <div className={`w-full max-w-md ${currentTheme.bg} rounded-[2rem] p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl backdrop-blur-xl border border-white/20`} onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-1.5 bg-slate-400/50 rounded-full mx-auto mb-5"></div>
                  <h3 className={`text-xl font-black mb-4 flex items-center gap-2 ${currentTheme.text}`}><span className="text-yellow-500">⚠️</span> Disclaimer</h3>
                  <div className={`space-y-4 text-sm font-medium opacity-90 ${currentTheme.text}`}>
                      <p className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                          <span className="text-xl">🏷️</span>
                          <span className="leading-snug">Prices displayed are real-time promotional rates and may vary. They might differ from the original store price. Please verify the latest price on the brands website before making a purchase.</span>
                      </p>
                      <p className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                          <span className="text-xl">📦</span>
                          <span className="leading-snug">Product availability is based on merchant data and can change quickly. Some items shown here may be out of stock on the original store. Always check current stock directly on the brands website.</span>
                      </p>
                  </div>
                  <button onClick={() => setIsDisclaimerDrawerOpen(false)} className="w-full mt-6 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-md">Got it!</button>
              </div>
          </div>
      )}

      {/* Live Sale Popup */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md z-[160] pointer-events-none px-4 flex justify-center">
          {liveSale && (
              <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-500 w-full pointer-events-auto">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  </div>
                  <p className="text-[11.5px] font-medium text-slate-200 leading-tight">
                      A follower bought an item worth <span className="font-black text-emerald-400">₹{liveSale.amount}</span> on <span className="font-bold text-white">{liveSale.store}</span> {liveSale.time}! 🎉
                  </p>
              </div>
          )}
      </div>

      {toastMessage && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-black px-6 py-2.5 rounded-full shadow-2xl z-[200] animate-in fade-in slide-in-from-bottom-5 border border-white/20">
              ✅ {toastMessage}
          </div>
      )}

      {/* 📤 MAGIC SHARE DRAWER */}
      {isShareDrawerOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-4" onClick={() => setIsShareDrawerOpen(false)}>
            <div className={`w-full max-w-md ${currentTheme.bg} rounded-[2rem] p-5 animate-in slide-in-from-bottom duration-300 shadow-2xl backdrop-blur-xl border border-white/20`} onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-400/50 rounded-full mx-auto mb-5"></div>
                <h3 className={`text-xl font-black mb-5 pl-1 ${currentTheme.text}`}>Share tab you want visitors to see first</h3>
                <div className="space-y-3">
                    {[
                        { id: 'home', icon: '🛍️', label: 'Shop All Feed' },
                        { id: 'trending', icon: '🔥', label: 'Trending Items' },
                        { id: 'liveoffer', icon: '⚡', label: 'Live Offers & Deals' },
                        { id: 'categories', icon: '📁', label: 'All Categories' },
                    ].map(t => (
                        <div key={t.id} onClick={() => handleTabShare(t)} className={`flex justify-between items-center p-4 rounded-xl cursor-pointer shadow-sm border border-slate-500/10 hover:scale-[1.01] transition-all ${currentTheme.card}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{t.icon}</span>
                                <span className={`font-bold text-sm ${currentTheme.text}`}>{t.label}</span>
                            </div>
                            <button className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg></button>
                        </div>
                    ))}
                </div>
                <button onClick={() => setIsShareDrawerOpen(false)} className={`w-full mt-4 py-3 rounded-xl font-bold opacity-70 ${currentTheme.text}`}>Cancel</button>
            </div>
        </div>
      )}

      <div className={`w-full max-w-md min-h-screen relative pb-20 shadow-xl ${currentTheme.bg} ${currentTheme.text}`}>
      
      {/* 🎥 THEATRE MODE (App-Style Sticky Arrow & Smooth Scroll) */}
      {theatreMode.isOpen && (
        // 🛑 FIX 1: Background click par ab seedha window.history.back() call hoga
        <div className="fixed inset-0 z-[100] flex justify-center bg-black" onClick={() => window.history.back()}>
            <div className="w-full max-w-md relative h-[100dvh] flex flex-col bg-black transform-gpu" onClick={e => e.stopPropagation()}>
                
                {/* 🛑 FIX 2: Sticky Top Bar with Back Arrow (Scroll karne par hide NAHI hoga) */}
                <div className="absolute top-0 left-0 w-full z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    <button onClick={() => window.history.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors pointer-events-auto shadow-md border border-white/10 backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                </div>

                {/* 🛑 FIX 3: Native Smooth Scrolling & transform-gpu (Lag Free) */}
                <div 
                    className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden overscroll-y-contain"
                    style={{ WebkitOverflowScrolling: 'touch', willChange: 'transform' }}
                >
                    {/* Video Container */}
                    <div className="sticky top-0 h-[100dvh] w-full flex items-center justify-center z-0 bg-black">
                        {getYouTubeID(theatreMode.videoUrl) ? (
                           <iframe className="w-full h-full object-cover scale-[1.05]" src={`https://www.youtube.com/embed/${getYouTubeID(theatreMode.videoUrl)}?autoplay=1&controls=1&modestbranding=1&rel=0&playsinline=1&fs=0`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen={true}></iframe>
                        ) : getFacebookEmbedUrl(theatreMode.videoUrl) ? (
                            <iframe className="w-full h-full bg-black object-cover scale-[1.05]" src={getFacebookEmbedUrl(theatreMode.videoUrl)} scrolling="no" frameBorder="0" allowtransparency="true" allowFullScreen={true}></iframe>
                        ) : getInstagramEmbedUrl(theatreMode.videoUrl) ? (
                           <iframe className="w-full h-full bg-black object-cover scale-[1.05]" src={getInstagramEmbedUrl(theatreMode.videoUrl)} frameBorder="0" scrolling="no" allowtransparency="true"></iframe>
                        ) : (
                            <div className="text-white text-center p-8 z-50 relative"><p className="mb-4 text-slate-300 text-sm">Cannot embed this video directly.</p><a href={theatreMode.videoUrl} target="_blank" className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 shadow-lg transition-colors">Watch Original Video ↗</a></div>
                        )}
                    </div>

                    {/* Products Drawer (Video ke upar slide hoga) */}
                    <div className={`relative mt-[-25dvh] ${currentTheme.bg} ${currentTheme.text} rounded-t-3xl p-5 min-h-[50dvh] shadow-[0_-20px_40px_rgba(0,0,0,0.8)] z-20 pb-20 transform-gpu`}>
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4"></div>
                        <h3 className="font-black text-lg mb-4">Shop This Look 👇</h3>
                        <div className="columns-2 gap-3 space-y-3">
                            {applyMasonryOrder(theatreMode.relatedDeals).map((deal, idx) => (
                                <div key={idx} className="break-inside-avoid transform-gpu">
                                    <GridProductCard deal={deal} onClick={() => handleDealClick(deal)} themeCardClass={currentTheme.card} onToast={triggerToast} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 📁 COLLECTION / CATEGORY DRAWER */}
      {(collectionMode.isOpen || categoryDrawer.isOpen) && (
        // 🛑 FIX 1: Background click par ab seedha window.history.back() call hoga
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => window.history.back()}>
            
            {/* 🛑 FIX 2: transform-gpu lagaya taaki drawer makhan ki tarah slide ho */}
            <div className={`w-full max-w-md ${currentTheme.bg} ${currentTheme.text} rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom border-t border-white/10 transform-gpu`} onClick={e => e.stopPropagation()}>
                
                {/* 🛑 FIX 3: Blur hataya, Solid bg lagaya, aur Arrow icon left mein lagaya */}
                <div className="p-3 border-b border-white/10 flex items-center gap-3 rounded-t-3xl sticky top-0 z-10 bg-slate-900 shadow-sm">
                    {/* Back Arrow Button */}
                    <button onClick={() => window.history.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    {/* Title */}
                    <h2 className="font-extrabold text-[16px] flex items-center gap-2 truncate opacity-95 text-white">
                        📁 {collectionMode.isOpen ? collectionMode.title : categoryDrawer.title}
                    </h2>
                </div>

                {/* 🛑 FIX 4: Native Smooth Scrolling (WebkitOverflowScrolling) add kiya lag hatane ke liye */}
                <div 
                    className="p-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden overscroll-y-contain bg-inherit"
                    style={{ WebkitOverflowScrolling: 'touch', willChange: 'transform' }}
                >
                    <div className="columns-2 gap-3 space-y-3">
                        {applyMasonryOrder(collectionMode.isOpen ? collectionMode.relatedDeals : categoryDrawer.relatedDeals).map((deal, idx) => (
                            // transform-gpu har item par bhi lagaya
                            <div key={idx} className="break-inside-avoid transform-gpu">
                                <GridProductCard deal={deal} onClick={() => handleDealClick(deal)} themeCardClass={currentTheme.card} onToast={triggerToast} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ----------------- CLASSIC PROFILE HEADER (Fix: Original Screenshot Look) ----------------- */}
      <div className="p-3 pb-0 relative z-20 overflow-hidden">
          
          <div className="relative w-full aspect-[4/1] mb-5 group">
              {/* Only SVG icon in Add to Home */}
              <button onClick={() => setIsHomeDrawerOpen(true)} className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center w-8 h-8 backdrop-blur-md shadow-md transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              </button>
              {creator.banners?.length > 0 ? (
                  <div ref={bannerScrollRef} className="w-full h-full bg-white/5 rounded-2xl overflow-x-auto flex snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden shadow-lg border border-white/10 relative z-20">
                      {creator.banners.map((item, i) => {
                          // 👇 NAYA: Handle Object {image, link} format
                          const imgSrc = typeof item === 'string' ? item : item.image;
                          const imgLink = typeof item === 'string' ? null : item.link;
                          
                          const BannerImg = <img src={imgSrc} className="w-full h-full object-cover" alt="Banner" />;
                          
                          return (
                              <div key={i} className="min-w-full h-full snap-center flex-shrink-0">
                                  {imgLink ? (
                                      <a href={imgLink} target="_blank" rel="noopener noreferrer" className="w-full h-full block cursor-pointer">
                                          {BannerImg}
                                      </a>
                                  ) : (
                                      BannerImg
                                  )}
                              </div>
                          );
                      })}
                  </div>
              ) : <div className="w-full h-full bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-inner flex items-center justify-center text-white/40 text-xs font-bold">No Banners</div>}
          </div>

          {/* CLASSIC PROFILE LAYOUT: Photo (L) | Name/Bio (C) | Buttons (R) */}
          <div className="flex gap-4 relative z-10 px-1 items-start mt-2">
              
              {/* Avatar Box (Bada kiya aur top se perfectly align kiya) */}
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-full flex-shrink-0 border-2 border-emerald-500 p-[2px] shadow-xl backdrop-blur-sm bg-black">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                      {creator.image ? <img src={creator.image} className="w-full h-full object-cover" alt="Avatar" /> : <span className="text-2xl font-black text-emerald-600">{creator.name?.charAt(0)}</span>}
                  </div>
              </div>
              
              {/* Name & Bio Box */}
              <div className="flex-1 min-w-0 flex flex-col justify-start">
                  <div className="flex items-center gap-1.5 mb-1">
                      <h1 className="text-[19px] md:text-[21px] font-black truncate drop-shadow-sm leading-none tracking-tight">{creator.name}</h1>
                      {/* 👇 BUG FIXED: End se extra 'l' hata diya gaya hai */}
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg>
                  </div>
                  <p className="text-[11.5px] font-semibold opacity-90 leading-snug drop-shadow-sm pr-1 whitespace-pre-wrap break-words">
                      {creator.bio || "Welcome to my official storefront!"}
                  </p>
              </div>

              {/* Classic Side Buttons */}
              <div className="flex flex-col gap-3 flex-shrink-0">
                  <button onClick={() => setIsShareDrawerOpen(true)} className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-500/20 bg-white/10 hover:bg-white/20 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                  </button>
                  <button onClick={() => alert("Notifications Feature coming soon!")} className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm border border-emerald-500/30 bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                  </button>
              </div>
          </div>

          {/* SOCIAL ICONS (Square Rounded) */}
          {creator.socialHandles?.length > 0 && (
              <div className="flex justify-center gap-4 mt-6 mb-2 overflow-visible">
                  {creator.socialHandles.map((social, index) => {
                      const details = getSocialDetails(social);
                      return (
                          <a key={index} href={details.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform">
                              <div className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center border border-black/5 dark:border-white/20">{details.icon}</div>
                              <span className="text-[8px] font-extrabold uppercase mt-1.5 opacity-90 drop-shadow-md">{details.name}</span>
                          </a>
                      );
                  })}
              </div>
          )}
      </div>

      {/* ----------------- STICKY HEADER & TABS BAR ----------------- */}
      <div className={`sticky top-0 z-40 px-3 pt-2 pb-0 ${currentTheme.tabBg} border-b shadow-md`}>
          
          {/* 🛡️ THE FIX: Saari animations aur transitions hata di. Ab ye smoothly bina lag ke direct show/hide hoga */}
          {isScrolled && (
              <div className="flex justify-between items-center px-1 mb-1.5">
                  <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
                          {creator.image ? <img src={creator.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-300"></div>}
                      </div>
                      <h1 className="text-sm font-black truncate">{creator.name}</h1>
                  </div>
                  <button onClick={() => setIsShareDrawerOpen(true)} className="w-6 h-6 rounded-full flex items-center justify-center border border-white/10 bg-white/5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                  </button>
              </div>
          )}

          <div className="flex justify-between items-end w-full px-1">
              <button onClick={() => setActiveTab("home")} className={`pb-2 text-[10px] md:text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'home' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>Shop All</button>
              <button onClick={() => setActiveTab("trending")} className={`pb-2 text-[10px] md:text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'trending' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>Trending</button>
              
              <button onClick={() => setActiveTab("liveoffer")} className={`pb-2 flex items-center gap-1.5 text-[10px] md:text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'liveoffer' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <span className="bg-rose-100/90 text-rose-600 px-1 py-0.5 rounded flex items-center gap-1 shadow-sm border border-rose-200/50">
                      <span className="relative flex h-1.5 w-1.5">
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                       </span>
                      <span className="text-[7.5px] leading-none mt-[1px]">LIVE</span>
                  </span>
                  Deals
              </button>
              
              <button onClick={() => setActiveTab("categories")} className={`pb-2 text-[10px] md:text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'categories' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>Category</button>
          </div>
      </div>

     {/* ----------------- FEED SECTIONS ----------------- */}
      <div className="px-2 pt-2">
        {isDealsLoading ? (
            <div className="columns-2 gap-2 space-y-2 mt-1">
                {[1,2,3,4].map(i => <div key={i} className="w-full h-48 bg-slate-300/30 animate-pulse rounded-2xl border border-white/10"></div>)}
            </div>
        ) : (
            <>
               {activeTab === "home" ? (
                   masterFeed.length === 0 && !isFetchingMore && !hasMore ? (
                       <div className="w-full flex flex-col items-center justify-center p-8 mt-2 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-white/5 mx-1">
                           <svg className="w-12 h-12 text-slate-400 dark:text-white/40 mb-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                           <h4 className="text-[14px] font-black tracking-wide opacity-80">No Posts Yet</h4>
                           <p className="text-[12px] font-medium opacity-50 mt-1 text-center">Creator hasn't added any deals here.</p>
                       </div>
                   ) : (
                       <div className="columns-2 gap-3 space-y-3">
                           {orderedMasterFeed.map((item, idx) => renderFeedItem(item, `${activeTab}-feed-${idx}`))}
                       </div>
                   )
               ) : null}

               {activeTab === "trending" ? (
                   orderedDeals.length === 0 && !isFetchingMore && !hasMore ? (
                       <div className="w-full flex flex-col items-center justify-center p-8 mt-2 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-white/5 mx-1">
                           <svg className="w-12 h-12 text-slate-400 dark:text-white/40 mb-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                           <h4 className="text-[14px] font-black tracking-wide opacity-80">No Trending Deals</h4>
                           <p className="text-[12px] font-medium opacity-50 mt-1 text-center">Check back later for viral offers.</p>
                       </div>
                   ) : (
                       <div className="columns-2 gap-3 space-y-3">
                       {orderedDeals.map((deal, idx) => ( 
                       <div key={`${activeTab}-trending-${deal._id}-${idx}`} className="break-inside-avoid relative transform-gpu"> 
                    {/* 🚀 THE FIX: 'openDetailedModal' ki jagah seedha 'handleDealClick' use kiya gaya hai direct redirect ke liye */}
                         <GridProductCard deal={deal} onClick={() => handleDealClick(deal)} themeCardClass={currentTheme.card} onToast={triggerToast} />
                         </div>
                        ))}
                     </div>
                   )
               ) : null}

               {activeTab === "liveoffer" ? (
                   orderedDeals.length === 0 && !isFetchingMore && !hasMore ? (
                       <div className="w-full flex flex-col items-center justify-center p-8 mt-2 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-white/5 mx-1">
                           <svg className="w-12 h-12 text-slate-400 dark:text-white/40 mb-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                           <h4 className="text-[14px] font-black tracking-wide opacity-80">No Live Deals Right Now</h4>
                           <p className="text-[12px] font-medium opacity-50 mt-1 text-center">We are hunting for new exclusive drops.</p>
                       </div>
                   ) : (
                       <div className="columns-2 gap-3 space-y-3">
                           {orderedDeals.map((deal, idx) => ( 
                               <div key={`${activeTab}-live-${deal._id}-${idx}`} className="break-inside-avoid relative transform-gpu will-change-transform"> 
                                   <GridProductCard deal={deal} onClick={() => openDetailedModal(deal)} themeCardClass={currentTheme.card} onToast={triggerToast} showTimeAgo={true} isLiveOffer={true} />
                               </div>
                           ))}
                       </div>
                   )
               ) : null} 
               
               {activeTab === "categories" ? (
                    <div className="space-y-6 pb-6 mt-2">
                        {/* 🚀 THE MASTER FILTER: Pehle hi "Home Page Deal" ko nikal kar active categories ki list bana li */}
                        {(() => {
                            const activeCategories = Object.keys(categoryGroups).filter(
                                catName => catName.toLowerCase() !== "home page deal"
                            );

                            if (activeCategories.length === 0 && !isFetchingMore && !hasMore) {
                                return (
                                    <div className="w-full flex flex-col items-center justify-center p-8 mt-2 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-white/5 mx-1">
                                        <svg className="w-12 h-12 text-slate-400 dark:text-white/40 mb-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                                        <h4 className="text-[14px] font-black tracking-wide opacity-80">No Categories Found</h4>
                                    </div>
                                );
                            }

                            return activeCategories.sort((a, b) => {
                                if (a.toLowerCase() === "others") return 1;  // Others hamesha end me jayega
                                if (b.toLowerCase() === "others") return -1;
                                return a.localeCompare(b); // Baaki saari categories A-Z sort hongi
                            }).map((catName, idx) => (
                                <div key={idx} className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="font-black text-sm uppercase tracking-wide opacity-90">{catName}</h3>
                                        {categoryGroups[catName].length > 4 && (
                                            <button onClick={() => setCategoryDrawer({ isOpen: true, title: catName, relatedDeals: categoryGroups[catName] })} className="text-[10px] font-bold opacity-70 hover:opacity-100 flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10 shadow-sm">See All ➔</button>
                                        )}
                                    </div>
                                    <div className="flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden snap-x">
                                        {categoryGroups[catName].slice(0, 10).map((deal, idx) => (
                                            <div key={`${deal._id}-${idx}`} className="w-[145px] flex-shrink-0 snap-start">
                                                <GridProductCard deal={deal} onClick={() => handleDealClick(deal)} themeCardClass={currentTheme.card} onToast={triggerToast} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
               ) : null}

                {/* 🌀 NAYA: Scroll Tracker & Loader Spinner */}
                {hasMore && !isDealsLoading && (
                    <div ref={loaderRef} className="w-full flex justify-center py-8 mt-2">
                        <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[11px] font-extrabold opacity-80 uppercase tracking-widest">Loading more...</span>
                        </div>
                    </div>
                )}
                
                {/* Agar saare products khatam ho gaye */}
                {!hasMore && deals.length > 0 && !isDealsLoading && (
                    <div className="w-full text-center py-10 opacity-30">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">End of Results</span>
                    </div>
                )}
            </>
        )}
      </div>
      
      {/* 🏠 ADD TO HOME (Click outside to close) */}
      {isHomeDrawerOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-4" onClick={() => setIsHomeDrawerOpen(false)}>
            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 animate-in slide-in-from-bottom duration-300 text-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>
                <h2 className="text-xl font-black mb-4 flex items-center gap-2">📱 Add to Home Screen</h2>
                <div className="space-y-4 text-sm font-medium text-slate-600">
                    <p className="bg-blue-50 p-3 rounded-xl border border-blue-100"><span className="font-bold text-blue-700">For Android:</span><br/> Tap <span className="font-bold">three dots (⋮)</span> and select <span className="font-bold text-slate-900">"Add to Home screen"</span>.</p>
                    <p className="bg-emerald-50 p-3 rounded-xl border border-emerald-100"><span className="font-bold text-emerald-700">For iOS (iPhone):</span><br/> Tap <span className="font-bold text-slate-900">Share icon (📤)</span> and select <span className="font-bold text-slate-900">"Add to Home Screen"</span>.</p>
                </div>
                <button onClick={() => setIsHomeDrawerOpen(false)} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl mt-8 shadow-xl">Got it!</button>
            </div>
        </div>
      )}

      {/* 🚀 NAYA: FULL PAGE PRODUCT DRAWER (Ultra-Smooth App Style) */}
      <div className={`fixed inset-0 z-[200] flex justify-center pointer-events-none transition-all duration-150 ${activeDeal ? 'opacity-100' : 'opacity-0 delay-100'}`}>
          <div className={`w-full max-w-md h-[100dvh] pointer-events-auto flex flex-col shadow-2xl relative ${currentTheme.bg} transition-transform duration-200 ease-out ${activeDeal ? 'translate-x-0' : 'translate-x-full'}`}>
              
              {activeDeal && (
                  <>
                      {/* Compact Sticky Header (BUG FIXED: Removed backdrop-blur for zero lag) */}
                      <div className="sticky top-0 z-50 flex items-center gap-3 px-3 py-2 bg-slate-900 border-b border-white/10 shadow-sm flex-shrink-0 min-h-[50px]">
                          <button onClick={() => window.history.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                          </button>
                          <span className={`font-black text-base truncate opacity-90 ${currentTheme.text}`}>Deal Details</span>
                      </div>

                      {/* Scrollable Body (BUG FIXED: Native rendering optimized) */}
                      <div 
                          className="flex-1 overflow-y-auto pb-28 [&::-webkit-scrollbar]:hidden overscroll-y-contain bg-inherit"
                          style={{ WebkitOverflowScrolling: 'touch', willChange: 'transform' }}
                      >
                          
                          {/* Compact Square Image Box */}
                          <div className="w-full aspect-square bg-white relative p-2 shadow-inner flex items-center justify-center">
                              <img src={activeDeal.image} className="w-full h-full object-contain mix-blend-multiply pointer-events-none select-none" alt="Product" draggable="false" onContextMenu={(e) => e.preventDefault()} style={{ WebkitTouchCallout: 'none' }} />
                              
                              {/* Bottom Left Store & Timer Overlay */}
                              <div className="absolute bottom-0 left-0 bg-slate-900/90 text-white text-[10px] font-black px-2.5 py-1.5 rounded-tr-2xl z-10 flex items-center gap-2 shadow-lg">
                                  <span>{activeDeal.store || "Exclusive"}</span>
                                  {activeDeal.saleEndTime && (
                                      <span className="flex items-center gap-1 border-l border-white/30 pl-2 opacity-95 [&>div]:w-auto [&>div>div]:mb-0 [&>div]:mb-0">
                                          <LiveTimer targetDate={activeDeal.saleEndTime} />
                                      </span>
                                  )}
                              </div>
                          </div>

                          {/* Product Details Section */}
                          <div className={`p-4 ${currentTheme.text}`}>
                              <h2 className="text-base font-extrabold leading-snug mb-3 opacity-95 line-clamp-3">{activeDeal.title}</h2>
                              
                              {/* Smart Pricing Block (Direct from DB) */}
{(activeDeal.price || activeDeal.discountPercent || activeDeal.mrp) && (
    <div className="bg-white/5 rounded-xl px-3 py-2 mb-4 inline-flex items-end gap-2 border border-white/10 shadow-sm">
        {activeDeal.price && (
            <span className="text-2xl font-black text-emerald-500 leading-none">{formatIndianPrice(activeDeal.price)}</span>
        )}
        
        {/* NAYA: Seedha DB se MRP show kar raha hai */}
        {activeDeal.mrp && (
            <span className="text-sm font-bold text-slate-400 line-through decoration-slate-500 mb-0.5">
                {formatIndianPrice(activeDeal.mrp)}
            </span>
        )}
        
        {activeDeal.discountPercent && (
            <span className={`font-black text-emerald-500 ${activeDeal.price ? 'text-sm mb-0.5 ml-1' : 'text-2xl leading-none'}`}>
                {activeDeal.discountPercent}
            </span>
        )}
    </div>
)}

                              {/* Compact Coupon Block */}
                              {activeDeal.couponCode && (
                                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 border-dashed rounded-lg px-3 py-2 mb-4">
                                      <div className="flex flex-col">
                                          <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest leading-none mb-1">Coupon Code</span>
                                          <span className="text-base font-black text-emerald-500 tracking-wider leading-none">{activeDeal.couponCode}</span>
                                      </div>
                                      <button onClick={() => { navigator.clipboard.writeText(activeDeal.couponCode); triggerToast("Coupon copied!"); }} className="bg-emerald-500 text-white px-4 py-1.5 rounded text-[10px] font-bold shadow-md active:scale-95 transition-all uppercase tracking-wider">Copy</button>
                                  </div>
                              )}

                              {/* Description Box with Smart Formatting */}
                              {activeDeal.description && (
                                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-6 shadow-sm">
                                      <h3 className="font-black text-sm mb-3 flex items-center gap-1.5 opacity-90 border-b border-white/10 pb-2">
                                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                          About this Product
                                      </h3>
                                      
                                      {(() => {
                                          const rawDesc = activeDeal.description;
                                          const parts = rawDesc.split(/Why buy this\??/i);
                                          const mainText = parts[0].trim();
                                          const bulletsText = parts.length > 1 ? parts[1].trim() : "";
                                          
                                          return (
                                              <div className="text-[13px] font-medium leading-relaxed opacity-85 space-y-4">
                                                  {/* BUG FIXED: Paragraphs ko alag-alag line mein split karna aur ** hatana */}
                                                  {mainText && (
                                                      <div className="space-y-2">
                                                          {mainText.split(/\n+/).filter(p => p.trim() !== '').map((para, idx) => (
                                                              <p key={idx}>{para.replace(/\*\*/g, '').replace(/^[-*]/g, '').trim()}</p>
                                                          ))}
                                                      </div>
                                                  )}

                                                  {bulletsText && (
                                                      <div className="bg-emerald-50/50 border border-emerald-500/20 p-3.5 rounded-xl shadow-sm mt-4">
                                                          <span className="font-black text-emerald-700 mb-2 block uppercase tracking-widest text-[11px]">Why buy this? 👇</span>
                                                          <div className="space-y-2.5">
                                                              {bulletsText.split('\n').filter(line => line.trim() !== '').map((point, i) => {
                                                                  // Clean the point from markdown and leading dashes
                                                                  const cleanPoint = point.replace(/\*\*/g, '').replace(/^[-*]/g, '').trim();
                                                                  // Agar point mein coupon likha hai toh usko highlight kar denge
                                                                  const isCouponPoint = cleanPoint.toLowerCase().includes('coupon');
                                                                  
                                                                  return (
                                                                      <p key={i} className="flex items-start gap-2">
                                                                          <span className={`mt-0.5 text-[12px] ${isCouponPoint ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                                              {isCouponPoint ? '🎁' : '❖'}
                                                                          </span>
                                                                          <span className={`text-[13px] opacity-95 ${isCouponPoint ? 'font-black text-rose-700' : 'font-semibold text-slate-700'}`}>
                                                                              {cleanPoint}
                                                                          </span>
                                                                      </p>
                                                                  );
                                                              })}
                                                          </div>
                                                      </div>
                                                  )}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              )}

                            {/* Similar Category Products (BUG FIXED: Loading State & Graceful Hide) */}
                              {activeDeal.category && activeDeal.category !== "Other" && (
                                  <>
                                      {/* Agar Loading chal rahi hai toh spinner dikhao */}
                                      {isSimilarLoading && (
                                          <div className="mt-8 border-t border-white/10 pt-8 flex justify-center">
                                              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                          </div>
                                      )}

                                      {/* Agar loading khatam aur products mil gaye toh list dikhao */}
                                      {!isSimilarLoading && similarDeals.length > 0 && (
                                          <div className="mt-8 border-t border-white/10 pt-6">
                                              <h3 className="font-black text-[15px] mb-4 uppercase tracking-wide opacity-90">
                                                  Similar in {activeDeal.category}
                                              </h3>
                                              <div className="grid grid-cols-2 gap-3">
                                                  {similarDeals.slice(0, 8).map((relatedDeal, idx) => (
                                                      <div key={idx} className="w-full">
                                                          <GridProductCard deal={relatedDeal} onClick={() => openDetailedModal(relatedDeal)} themeCardClass={currentTheme.card} onToast={triggerToast} />
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                  </>
                              )}
                              </div>
                            </div>  

                      {/* Fixed Bottom Action Bar (BUG FIXED: Smart Processing Button Added) */}
                      <div className="absolute bottom-0 left-0 w-full px-4 py-3 bg-slate-900 border-t border-white/10 flex items-center gap-3 pb-6 z-[100]">
                          <button onClick={() => handleShareClick(activeDeal)} disabled={isGeneratingShare} className="w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center text-white shrink-0 transition-all active:scale-95 shadow-md">
                              {isGeneratingShare ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>}
                          </button>
                          
                          {/* 🚀 SMART BUY BUTTON: Click hote hi Processing mode mein jayega */}
                          <button 
                              onClick={async () => {
                                  setIsRedirecting(true); // Spinner ON
                                  await handleDealClick(activeDeal); // API Call
                                  setIsRedirecting(false); // Spinner OFF
                              }} 
                              disabled={isRedirecting}
                              className={`flex-1 h-12 text-white font-black text-[15px] rounded-xl flex items-center justify-center transition-all tracking-wide ${
                                  isRedirecting 
                                  ? "bg-emerald-500/60 opacity-80 cursor-not-allowed" // Processing UI
                                  : "bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_15px_rgba(16,185,129,0.3)] active:scale-95" // Normal UI
                              }`}
                          >
                              {isRedirecting ? (
                                  <span className="flex items-center gap-2">
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                      Go to {activeDeal.store || "Store"}...
                                  </span>
                              ) : (
                                  `Buy on ${activeDeal.store || "Store"}`
                              )}
                          </button>
                      </div>
                  </>
              )}
          </div>
      </div>

      {/* 📤 CUSTOM SHARE MODAL */}
      {customShareModal.isOpen && customShareModal.deal && (
        <div className="fixed inset-0 z-[250] flex items-end justify-center bg-black/60 backdrop-blur-md px-4 pb-4" onClick={() => window.history.back()}>
            <div className={`w-full max-w-md ${currentTheme.bg} rounded-[2rem] p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl backdrop-blur-xl border border-white/20 relative`} onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-400/50 rounded-full mx-auto mb-5"></div>
                
                <h3 className={`text-base font-black mb-3 leading-tight ${currentTheme.text} line-clamp-2`}>{customShareModal.deal.title}</h3>
                
                {/* Link Box */}
                <div className="flex items-center justify-between bg-white/10 border border-white/20 rounded-xl p-2.5 mb-6">
                    <span className={`text-[11px] font-medium truncate opacity-70 ${currentTheme.text} mr-3`}>{customShareModal.generatedUrl}</span>
                    <button onClick={() => { navigator.clipboard.writeText(`🔥 ${customShareModal.deal.title}\n\nGrab the deal here: ${customShareModal.generatedUrl}`); triggerToast("Copied to clipboard!"); window.history.back(); }} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md active:scale-95 flex-shrink-0 uppercase tracking-wider">Copy</button>
                </div>

                {/* Social Icons Grid */}
                <div className="grid grid-cols-5 gap-3 mb-2">
                    {/* WhatsApp */}
                    <a href={`https://wa.me/?text=${encodeURIComponent('🔥 ' + customShareModal.deal.title + '\n\nGrab the deal here: ' + customShareModal.generatedUrl)}`} target="_blank" className="flex flex-col items-center gap-1.5 group">
                        <div className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>
                        <span className={`text-[9px] font-bold ${currentTheme.text} opacity-80`}>WhatsApp</span>
                    </a>
                    {/* Telegram */}
                    <a href={`https://t.me/share/url?url=${encodeURIComponent(customShareModal.generatedUrl)}&text=${encodeURIComponent('🔥 ' + customShareModal.deal.title)}`} target="_blank" className="flex flex-col items-center gap-1.5 group">
                        <div className="w-11 h-11 bg-[#0088cc] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm6.81 7.228-2.333 11.002c-.179.807-.655 1.006-1.328.625l-3.673-2.709-1.77 1.705c-.196.196-.361.36-.74.36l.263-3.743 6.817-6.155c.296-.264-.065-.41-.459-.153l-8.423 5.303-3.633-1.139c-.79-.247-.806-.79.165-1.17l14.218-5.48c.658-.246 1.233.15.895 1.554z"/></svg></div>
                        <span className={`text-[9px] font-bold ${currentTheme.text} opacity-80`}>Telegram</span>
                    </a>
                    {/* Instagram (Copies to clipboard then opens app) */}
                    <button onClick={() => { navigator.clipboard.writeText(`🔥 ${customShareModal.deal.title}\n\nGrab the deal here: ${customShareModal.generatedUrl}`); triggerToast("Copied! Open Insta to paste"); setTimeout(()=>{window.location.href="instagram://"}, 1000); }} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all text-white" style={{background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'}}><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></div>
                        <span className={`text-[9px] font-bold ${currentTheme.text} opacity-80`}>Instagram</span>
                    </button>
                    {/* Facebook */}
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(customShareModal.generatedUrl)}`} target="_blank" className="flex flex-col items-center gap-1.5 group">
                        <div className="w-11 h-11 bg-[#1877F2] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg></div>
                        <span className={`text-[9px] font-bold ${currentTheme.text} opacity-80`}>Facebook</span>
                    </a>
                    {/* More (Native Share) */}
                    <button onClick={() => { if(navigator.share) { navigator.share({ title: customShareModal.deal.title, url: customShareModal.generatedUrl }).catch(()=>{}); } }} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-11 h-11 bg-slate-700 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7"></path></svg></div>
                        <span className={`text-[9px] font-bold ${currentTheme.text} opacity-80`}>More</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      </div> 
    </div> 
  ); 
}

// ----------------- UNIVERSAL PRODUCT CARD -----------------

// ----------------- LIVE TIMER COMPONENT (ULTRA OPTIMIZED) -----------------
function LiveTimer({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!targetDate) return;
        
        const calculateTime = () => {
            const diff = new Date(targetDate) - new Date();
            if (diff <= 0) return null; 
            
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            
            if (d > 0) return `Ends In ${d}d ${h}h ${m}m`;
            return `sale ends in ${h}h ${m}m`;
        };

        const initialTime = calculateTime();
        setTimeLeft(initialTime);
        if (initialTime === null) return;

        // Har 1 minute mein ek baar update hoga
        const timer = setInterval(() => {
            const newTime = calculateTime();
            setTimeLeft(newTime);
            if (newTime === null) clearInterval(timer);
        }, 60000); 

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    return (
        <div className="w-full flex items-center justify-center px-1 mb-1.5">
            {/* 🛡️ THE FIX: Transform-GPU add kiya aur Ping animation hata diya */}
            <div className="flex items-center justify-center gap-1 w-full bg-rose-50/90 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20 py-0.5 rounded-full shadow-sm transform-gpu will-change-transform">
                
                {/* 🛑 THE FIX: animate-ping hata diya gaya hai. Ab sirf ek solid red dot dikhega jo GPU par zero load dega! */}
                <span className="relative flex h-1.5 w-1.5 ml-1">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                </span>
                
                <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 tracking-wider mr-1">
                    {timeLeft}
                </span>
            </div>
        </div>
    );
}

// 👇 NAYA: isLiveOffer add kiya
function GridProductCard({ deal, onClick, themeCardClass, onToast, showTimeAgo, isLiveOffer }) {
    return (
        <div className={`border shadow-sm rounded-xl p-1.5 flex flex-col hover:scale-[1.02] transition-transform cursor-pointer group ${themeCardClass}`} onClick={onClick}>
            
            <div className="w-full aspect-square bg-white rounded-xl mb-2 relative p-1 overflow-hidden shadow-inner border border-black/5 dark:border-white/50">
                <img src={deal.image} loading="lazy" decoding="async" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none" alt="Product" draggable="false" onContextMenu={(e) => e.preventDefault()} style={{ WebkitTouchCallout: 'none' }} />
                {deal.discountPercent && <span className="absolute top-0 left-0 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-br-xl z-10 shadow-md">{deal.discountPercent}</span>}
                <span className="absolute bottom-0 left-0 bg-slate-900/95 text-white text-[9px] font-black px-2.5 py-1 rounded-tr-xl z-10 flex items-center gap-1.5 max-w-[90%] overflow-hidden whitespace-nowrap">
                    <span>{deal.store || "Exclusive"}</span>
                    {showTimeAgo && deal.createdAt && (
                        <span className="flex items-center gap-0.5 border-l border-white/30 pl-1.5 opacity-90">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {timeAgo(deal.createdAt)}
                        </span>
                    )}
                </span>
            </div>
            
            <p className="text-[11px] font-extrabold line-clamp-2 leading-tight flex-1 mb-2 opacity-90 px-1 drop-shadow-sm">{deal.title}</p>
            
            {deal.saleEndTime && <LiveTimer targetDate={deal.saleEndTime} />}

            {deal.couponCode && (
                <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-500/40 border-dashed rounded px-1.5 py-1 mb-2 mx-1 shadow-sm">
                    <span className="text-[10px] font-black text-emerald-700 tracking-wider truncate">{deal.couponCode}</span>
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(deal.couponCode); if(onToast) onToast("Coupon copied!"); if(onClick) onClick(); }} className="text-emerald-600 hover:text-emerald-800 text-[10px] font-bold flex items-center gap-0.5 active:scale-95 transition-all ml-2 flex-shrink-0">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg> COPY
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-500/10 dark:border-white/10 px-1">
                {deal.price ? (
                    <>
                        <span className="text-sm font-black drop-shadow-sm truncate">{formatIndianPrice(deal.price)}</span>
                        {/* 👇 NAYA: isLiveOffer true hai toh Get Deal, warna Shop Now */}
                        <button className="flex-1 bg-emerald-500 text-white text-[11px] font-bold py-1.5 rounded-lg shadow-[0_4px_10px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition-colors text-center">{isLiveOffer ? "Get Deal" : "Shop Now"}</button>
                    </>
                ) : (
                    <button className="w-full bg-emerald-500 text-white text-[11px] font-bold py-1.5 rounded-lg shadow-[0_4px_10px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition-colors text-center">{isLiveOffer ? "Get Deal" : "Shop Now"}</button>
                )}
            </div>
        </div>
    );
}