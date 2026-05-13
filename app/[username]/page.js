"use client";
import { useState, useEffect, use, useRef } from "react";

// 🎨 THEMES
const THEMES = {
  minimal: { bg: "bg-slate-50", text: "text-slate-900", card: "bg-white border-slate-200 shadow-sm", tab: "bg-slate-900 text-white", tabBg: "bg-white/90 border-slate-200" },
  luxury: { bg: "bg-[#121212] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]", text: "text-white", card: "bg-white/10 border-white/20 backdrop-blur-md", tab: "bg-white text-slate-900", tabBg: "bg-black/60 border-white/10 backdrop-blur-xl" },
  fashion: { bg: "bg-gradient-to-tr from-rose-400 via-fuchsia-500 to-indigo-500", text: "text-white", card: "bg-white/20 border-white/30 backdrop-blur-md shadow-xl", tab: "bg-white text-rose-500", tabBg: "bg-white/20 border-white/10 backdrop-blur-xl" },
  glass: { bg: "bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center bg-fixed", text: "text-white", card: "bg-black/40 border-white/20 backdrop-blur-lg shadow-xl", tab: "bg-white text-slate-900", tabBg: "bg-black/40 border-white/10 backdrop-blur-xl" }
};

// 🛠️ Super Extractors
const getYouTubeID = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
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

// ⏱️ Time Ago Function (For Post Timing)
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

const getSocialDetails = (socialStr) => {
    if (!socialStr) return { name: 'Link', url: '#', icon: SVGS.default };
    let rawUrl = typeof socialStr === 'string' ? socialStr.trim() : (socialStr.url || "");
    let url = rawUrl;
    if (url.startsWith('@')) url = `https://t.me/${url.substring(1)}`;
    let lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('whatsapp') || lowerUrl.includes('wa.me')) return { name: 'WhatsApp', url, icon: SVGS.whatsapp };
    if (lowerUrl.includes('instagram')) return { name: 'Instagram', url, icon: SVGS.instagram };
    if (lowerUrl.includes('youtube')) return { name: 'YouTube', url, icon: SVGS.youtube };
    if (lowerUrl.includes('telegram') || lowerUrl.includes('t.me')) return { name: 'Telegram', url, icon: SVGS.telegram };
    if (lowerUrl.includes('facebook') || lowerUrl.includes('fb.com')) return { name: 'Facebook', url, icon: SVGS.facebook };
    
    let domain = "Link";
    try { domain = new URL(url).hostname.replace('www.', '').split('.')[0]; } catch(e) {}
    return { name: domain, url, icon: SVGS.default };
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

  useEffect(() => {
      const handleScroll = () => {
          setIsScrolled(window.scrollY > 200);
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 👇 YAHAN NAYA CODE ADD HUA HAI (STEP 2: App Escaper Logic)
  useEffect(() => {
      if (typeof window === 'undefined') return;

      const ua = navigator.userAgent || navigator.vendor || window.opera;
      const isInstagram = ua.includes('Instagram');
      const isFacebook = ua.includes('FBAN') || ua.includes('FBAV');
      const isAndroid = /android/i.test(ua);
      const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

      if (isInstagram || isFacebook) {
          if (isAndroid) {
              setIsEscapingApp(true);
              const currentUrl = window.location.href.replace(/^https?:\/\//, '');
              const intentUrl = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
              setTimeout(() => { window.location.replace(intentUrl); }, 300);
          } else if (isIOS) {
              setShowIosGuide(true);
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

  useEffect(() => {
    async function fetchData() {
      try {
        const creatorRes = await fetch(`/api/user/get-by-username?username=${username}`);
        const creatorData = await creatorRes.json();
        
        if (creatorData.success) {
          setCreator(creatorData.user);
          setIsCreatorLoading(false); 

          const dealsRes = await fetch(`/api/deals/get-all?email=${creatorData.user.email}`);
          const dealsData = await dealsRes.json();
          if (dealsData.success) setDeals(dealsData.deals);
        }
      } catch (error) { 
          console.error(error); 
      } finally { 
          setIsCreatorLoading(false);
          setIsDealsLoading(false); 
      }
    }
    if (username) fetchData();
  }, [username]);

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
    if (deal.source === "creator" && deal.shortCode) return window.open(`/go/${deal.shortCode}`, '_blank');
    if (deal.linkType === "own") {
        const urlToOpen = deal.expandedUrl || deal.originalUrl;
        if (urlToOpen) return window.open(urlToOpen, '_blank');
    }

    try {
      const res = await fetch('/api/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal._id, creatorUsername: creator.username, triggerSource: "bio_page" })
      });
      const data = await res.json();
      window.open(data.success && data.shortCode ? `/go/${data.shortCode}` : (deal.expandedUrl || deal.originalUrl), '_blank');
    } catch (err) { 
      window.open(deal.expandedUrl || deal.originalUrl, '_blank'); 
    }
  };

  const creatorDeals = deals.filter(d => d.source === "creator");
  const telegramDeals = deals.filter(d => d.source === "telegram" && creator?.autodeal_active !== false && (!creator?.autoDealCategories?.length || creator.autoDealCategories.includes(d.category)));

  const masterFeed = [];
  const processedBatches = new Set();
  creatorDeals.forEach(deal => {
      if (!deal.batchId) masterFeed.push({ type: 'single', deal: deal });
      else if (!processedBatches.has(deal.batchId)) {
          processedBatches.add(deal.batchId);
          const batch = creatorDeals.filter(d => d.batchId === deal.batchId);
          const hasVid = batch.find(d => d.videoUrl);
          masterFeed.push({ type: hasVid ? 'video' : 'collection', batchId: deal.batchId, videoUrl: hasVid?.videoUrl, title: deal.collectionName || hasVid?.title || "Collection", deals: batch });
      }
  });

  const trendingDeals = [...creatorDeals].sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0));
  const categoryGroups = {};
  creatorDeals.forEach(deal => {
      const cat = deal.category || "Others";
      if (!categoryGroups[cat]) categoryGroups[cat] = [];
      categoryGroups[cat].push(deal);
  });

  const orderedMasterFeed = applyMasonryOrder(masterFeed);
  const orderedTrendingDeals = applyMasonryOrder(trendingDeals);
  const orderedTelegramDeals = applyMasonryOrder(telegramDeals);

  // -------------------------------------------------------------
  // ✨ PAGE SKELETON (Before Creator Loads) & THEME DEFINITION
  // -------------------------------------------------------------
  // 👇 YAHAN NAYA CODE ADD HUA HAI (STEP 3: Bouncer UI)
  if (isEscapingApp) {
      return (
          <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center text-white font-sans">
              <div className="w-14 h-14 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
              <h2 className="text-2xl font-black mb-2">Securing Connection...</h2>
              <p className="text-slate-400 text-sm font-medium">Opening in Chrome for best shopping experience</p>
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
                  <div className="columns-2 gap-3 space-y-3">
                      {[1,2,3,4].map(i => <div key={i} className="w-full h-48 bg-slate-300/60 rounded-2xl"></div>)}
                  </div>
              </div>
          </div>
      );
  }

  if (!creator) return <div className="text-center mt-20 text-xl text-red-500 font-bold">Creator not found!</div>;
  
  // 🔥 YAHAN DEFINE HOTA HAI THEME (Jis se error aa raha tha)
  const currentTheme = THEMES[creator.bioTheme?.toLowerCase()] || THEMES.minimal;

  const renderFeedItem = (item, uniqueKey) => {
      if (item.type === 'single') {
          return <div key={uniqueKey} className="break-inside-avoid"><GridProductCard deal={item.deal} onClick={() => handleDealClick(item.deal)} themeCardClass={currentTheme.card} onToast={triggerToast} showTimeAgo={activeTab === 'telegram'} /></div>;
      } 
      else if (item.type === 'video') {
          const isInsta = (item.videoUrl || "").toLowerCase().includes('instagram.com');
          const isFB = (item.videoUrl || "").toLowerCase().includes('facebook.com') || (item.videoUrl || "").toLowerCase().includes('fb.watch');
          const thumbUrl = isInsta ? (item.deals[0]?.image || getThumbnail(item.videoUrl)) : getThumbnail(item.videoUrl);

          return (
              <div key={uniqueKey} onClick={() => setTheatreMode({ isOpen: true, videoUrl: item.videoUrl, relatedDeals: item.deals })} className={`break-inside-avoid relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer shadow-sm border group ${currentTheme.card}`}>
                  <img src={thumbUrl} className="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-transform duration-500 mix-blend-overlay" />

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

                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur text-slate-900 text-[10px] font-black px-2 py-1 rounded flex items-center gap-1.5 shadow-md">
                      <svg className="w-3 h-3 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      {item.deals.length} Products
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
                      {item.deals.slice(0, 4).map((d, i) => <div key={i} className="aspect-square bg-white/10 rounded-lg overflow-hidden border border-white/5"><img src={d.image} className="w-full h-full object-cover mix-blend-multiply" /></div>)}
                  </div>
                  <span className="bg-blue-500/20 text-blue-300 text-[8px] font-black px-1.5 py-0.5 rounded flex w-fit items-center gap-1 border border-blue-500/30 uppercase">
                      Collection
                  </span>
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
              <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-1.5 pl-3 rounded-full shadow-2xl flex items-center gap-2 pointer-events-auto animate-in slide-in-from-right fade-in duration-300">
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
                          <span className="text-xl">💰</span>
                          <span className="leading-snug">Prices change rapidly. The price shown was accurate at posting time but might have updated on the store.</span>
                      </p>
                      <p className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                          <span className="text-xl">🛒</span>
                          <span className="leading-snug">Stock is limited. High-discount deals sell out fast. Grab them quickly!</span>
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
                <h3 className={`text-xl font-black mb-5 pl-1 ${currentTheme.text}`}>Share Specific Page</h3>
                <div className="space-y-3">
                    {[
                        { id: 'home', icon: '🛍️', label: 'Shop All Feed' },
                        { id: 'trending', icon: '🔥', label: 'Trending Deals' },
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

      <div className={`w-full max-w-md min-h-screen relative pb-20 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${currentTheme.bg} ${currentTheme.text} transition-all duration-500`}>
      
      {/* 🎥 THEATRE MODE */}
      {theatreMode.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/95 backdrop-blur-md">
            <div className="w-full max-w-md relative h-[100dvh] overflow-y-auto overflow-x-hidden scroll-smooth [&::-webkit-scrollbar]:hidden">
                <button onClick={() => setTheatreMode({ isOpen: false, videoUrl: "", relatedDeals: [] })} className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white font-bold backdrop-blur-md transition-all">✕</button>
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
                <div className={`relative mt-[-25dvh] ${currentTheme.bg} ${currentTheme.text} rounded-t-3xl p-5 min-h-[50dvh] shadow-[0_-20px_40px_rgba(0,0,0,0.6)] z-20 pb-20`}>
                    <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4"></div>
                    <h3 className="font-black text-lg mb-4">Shop This Look 👇</h3>
                    <div className="columns-2 gap-3 space-y-3">
                        {applyMasonryOrder(theatreMode.relatedDeals).map((deal, idx) => (
                            <div key={idx} className="break-inside-avoid">
                                <GridProductCard deal={deal} onClick={() => handleDealClick(deal)} themeCardClass={currentTheme.card} onToast={triggerToast} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 📁 COLLECTION / CATEGORY DRAWER */}
      {(collectionMode.isOpen || categoryDrawer.isOpen) && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setCollectionMode({isOpen:false, title:"", relatedDeals:[]}); setCategoryDrawer({isOpen:false, title:"", relatedDeals:[]}); }}>
            <div className={`w-full max-w-md ${currentTheme.bg} ${currentTheme.text} rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom border-t border-white/10`} onClick={e => e.stopPropagation()}>
                <div className={`p-4 border-b border-white/10 flex justify-between items-center rounded-t-3xl sticky top-0 z-10 backdrop-blur-xl ${currentTheme.bg}`}>
                    <h2 className="font-extrabold text-lg flex items-center gap-2">📁 {collectionMode.isOpen ? collectionMode.title : categoryDrawer.title}</h2>
                    <button onClick={() => { setCollectionMode({isOpen:false, title:"", relatedDeals:[]}); setCategoryDrawer({isOpen:false, title:"", relatedDeals:[]}); }} className="w-8 h-8 bg-white/10 rounded-full font-bold flex items-center justify-center hover:bg-white/20">✕</button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden">
                    <div className="columns-2 gap-3 space-y-3">
                        {applyMasonryOrder(collectionMode.isOpen ? collectionMode.relatedDeals : categoryDrawer.relatedDeals).map((deal, idx) => (
                            <div key={idx} className="break-inside-avoid">
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
                  <div ref={bannerScrollRef} className="w-full h-full bg-white/5 rounded-2xl overflow-x-auto flex snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden shadow-lg border border-white/10">
                      {creator.banners.map((img, i) => <div key={i} className="min-w-full h-full snap-center flex-shrink-0"><img src={img} className="w-full h-full object-cover" alt="Banner" /></div>)}
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
              <div className="flex-1 min-w-0 flex flex-col justify-start mt-1">
                  <div className="flex items-center gap-1.5 mb-1">
                      <h1 className="text-[19px] md:text-[21px] font-black truncate drop-shadow-sm leading-none tracking-tight">{creator.name}</h1>
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg>
                  </div>
                  <p className="text-[11.5px] font-semibold opacity-90 leading-snug drop-shadow-sm pr-1 whitespace-pre-wrap break-words">
                      {creator.bio || "Welcome to my official storefront!"}
                  </p>
              </div>

              {/* Classic Side Buttons */}
              <div className="flex flex-col gap-3 flex-shrink-0 mt-1">
                  <button onClick={() => setIsShareDrawerOpen(true)} className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-500/20 bg-white/10 hover:bg-white/20 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                  </button>
                  <button onClick={() => alert("Notifications coming soon!")} className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm border border-emerald-500/30 bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
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

      {/* ----------------- STICKY HEADER & TABS BAR (Reduced Height) ----------------- */}
      <div className={`sticky top-0 z-40 px-3 pt-2 pb-0 ${currentTheme.tabBg} border-b backdrop-blur-xl shadow-sm transition-all duration-300`}>
          
          {/* Twitter Style Sticky Info: Appears on scroll */}
          <div className={`flex justify-between items-center px-1 overflow-hidden transition-all duration-300 ${isScrolled ? 'h-8 opacity-100 mb-1.5' : 'h-0 opacity-0 mb-0 pointer-events-none'}`}>
              <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
                      {creator.image ? <img src={creator.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-300"></div>}
                  </div>
                  <h1 className="text-sm font-black truncate">{creator.name}</h1>
              </div>
              <button onClick={() => setIsShareDrawerOpen(true)} className="w-6 h-6 rounded-full flex items-center justify-center border border-white/10 bg-white/5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg></button>
          </div>

          <div className="flex justify-between items-end w-full px-1">
              <button onClick={() => setActiveTab("home")} className={`pb-2 text-[10px] md:text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'home' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>Shop All</button>
              <button onClick={() => setActiveTab("trending")} className={`pb-2 text-[10px] md:text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'trending' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>Trending</button>
              
              <button onClick={() => setActiveTab("liveoffer")} className={`pb-2 flex items-center gap-1.5 text-[10px] md:text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'liveoffer' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <span className="bg-rose-100/90 text-rose-600 px-1 py-0.5 rounded flex items-center gap-1 shadow-sm border border-rose-200/50">
                      <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                      </span>
                      <span className="text-[7.5px] leading-none mt-[1px]">LIVE</span>
                  </span>
                  Offer/Deal
              </button>
              
              <button onClick={() => setActiveTab("categories")} className={`pb-2 text-[10px] md:text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'categories' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>Category</button>
          </div>
      </div>

      {/* ----------------- FEED SECTIONS ----------------- */}
      <div className="px-3 pt-3">
        {isDealsLoading ? (
            <div className="columns-2 gap-3 space-y-3 mt-1">
                {[1,2,3,4].map(i => <div key={i} className="w-full h-48 bg-slate-300/30 animate-pulse rounded-2xl border border-white/10"></div>)}
            </div>
        ) : (
            <>
                {activeTab === "home" && (
                    <div className="columns-2 gap-3 space-y-3">
                        {masterFeed.length === 0 ? <p className="text-center opacity-60 font-bold p-8 col-span-2">No posts yet.</p> : 
                            orderedMasterFeed.map((item, idx) => renderFeedItem(item, idx))
                        }
                    </div>
                )}

                {activeTab === "trending" && (
                    <div className="columns-2 gap-3 space-y-3">
                        {trendingDeals.length === 0 ? <p className="text-center opacity-60 font-bold p-8 col-span-2">No trending deals yet.</p> : 
                            orderedTrendingDeals.map((deal, idx) => (
                                <div key={idx} className="break-inside-avoid relative">
                                    <GridProductCard deal={deal} onClick={() => handleDealClick(deal)} themeCardClass={currentTheme.card} onToast={triggerToast} />
                                </div>
                            ))
                        }
                    </div>
                )}

                {activeTab === "liveoffer" && (
                    <div className="columns-2 gap-3 space-y-3">
                        {telegramDeals.length === 0 ? <p className="text-center opacity-60 font-bold p-8 col-span-2">No live deals right now.</p> : 
                            orderedTelegramDeals.map((deal, idx) => (
                                <div key={idx} className="break-inside-avoid">
                                    <GridProductCard deal={deal} onClick={() => handleDealClick(deal)} themeCardClass={currentTheme.card} onToast={triggerToast} showTimeAgo={true} />
                                </div>
                            ))
                        }
                    </div>
                )}

                {activeTab === "categories" && (
                    <div className="space-y-6 pb-6 mt-2">
                        {Object.keys(categoryGroups).length === 0 ? <p className="text-center opacity-60 font-bold p-8">No categories found.</p> : 
                            Object.keys(categoryGroups).map((catName, idx) => (
                                <div key={idx} className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="font-black text-sm uppercase tracking-wide opacity-90">{catName}</h3>
                                        {categoryGroups[catName].length > 4 && (
                                            <button onClick={() => setCategoryDrawer({ isOpen: true, title: catName, relatedDeals: categoryGroups[catName] })} className="text-[10px] font-bold opacity-70 hover:opacity-100 flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10 shadow-sm">See All ➔</button>
                                        )}
                                    </div>
                                    <div className="flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden snap-x">
                                        {categoryGroups[catName].slice(0, 10).map(deal => (
                                            <div key={deal._id} className="w-[145px] flex-shrink-0 snap-start">
                                                <GridProductCard deal={deal} onClick={() => handleDealClick(deal)} themeCardClass={currentTheme.card} onToast={triggerToast} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        }
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

      </div>
    </div>
  );
}

// ----------------- UNIVERSAL PRODUCT CARD -----------------

function LiveTimer({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!targetDate) return;
        const calculateTime = () => {
            const diff = new Date(targetDate) - new Date();
            if (diff <= 0) return "Ended";
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            if (d > 0) return `Ends in ${d}d ${h}h`;
            return `Ends in ${h}h ${m}m`;
        };
        setTimeLeft(calculateTime());
        const timer = setInterval(() => setTimeLeft(calculateTime()), 60000); 
        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft || timeLeft === "Ended") return null;

    return (
        <span className="text-[9px] font-extrabold text-orange-700 flex items-center gap-1 bg-orange-100 px-2 py-1.5 rounded border border-orange-300 w-fit mb-2 shadow-sm">
            <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {timeLeft}
        </span>
    );
}

function GridProductCard({ deal, onClick, themeCardClass, onToast, showTimeAgo }) {
    return (
        <div className={`border shadow-sm rounded-2xl p-2 flex flex-col hover:scale-[1.02] transition-transform cursor-pointer group backdrop-blur-sm ${themeCardClass}`} onClick={onClick}>
            
            <div className="w-full aspect-square bg-white rounded-xl mb-2 relative p-1 overflow-hidden shadow-inner border border-black/5 dark:border-white/50">
                <img src={deal.image} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                
                {deal.discountPercent && <span className="absolute top-0 left-0 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-br-xl z-10 shadow-md">{deal.discountPercent}</span>}
                
                <span className="absolute bottom-0 left-0 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-tr-xl z-10 flex items-center gap-1.5">
                    <span>{deal.store || "Exclusive"}</span>
                    {/* 🕒 TIME AGO OVERLAY */}
                    {showTimeAgo && deal.createdAt && (
                        <span className="flex items-center gap-0.5 border-l border-white/30 pl-1.5 opacity-90">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {timeAgo(deal.createdAt)}
                        </span>
                    )}
                </span>
            </div>
            
            <p className="text-[11px] font-extrabold line-clamp-2 leading-tight flex-1 mb-2 opacity-90 px-1 drop-shadow-sm">{deal.title}</p>
            
            {deal.couponCode && (
                <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-500/40 border-dashed rounded px-1.5 py-1 mb-2 mx-1 shadow-sm">
                    <span className="text-[10px] font-black text-emerald-700 tracking-wider truncate">{deal.couponCode}</span>
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            navigator.clipboard.writeText(deal.couponCode); 
                            if(onToast) onToast("Coupon copied!");
                        }} 
                        className="text-emerald-600 hover:text-emerald-800 text-[10px] font-bold flex items-center gap-0.5 active:scale-95 transition-all ml-2 flex-shrink-0"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        COPY
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-500/10 dark:border-white/10 px-1">
                {deal.price ? (
                    <>
                        <span className="text-sm font-black drop-shadow-sm truncate">{deal.price}</span>
                        <button className="flex-1 bg-emerald-500 text-white text-[11px] font-bold py-1.5 rounded-lg shadow-[0_4px_10px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition-colors text-center">Shop Now</button>
                    </>
                ) : (
                    <button className="w-full bg-emerald-500 text-white text-[11px] font-bold py-1.5 rounded-lg shadow-[0_4px_10px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition-colors text-center">Shop Now</button>
                )}
            </div>
        </div>
    );
}