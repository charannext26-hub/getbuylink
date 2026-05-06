"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UsernameForm from "./UsernameForm";
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';

// 🚨 Live Timer Component
const LiveTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    if (!targetDate) return;
    const updateTimer = () => {
      const diff = new Date(targetDate).getTime() - new Date().getTime();
      if (diff <= 0) return setTimeLeft('Ended');
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      
      if (days > 0) setTimeLeft(`Ends in ${days}d ${hours}h`);
      else setTimeLeft(`Ends in ${hours}h ${minutes}m`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;
  return (
    <div className={`text-[8.5px] font-black mt-1 flex items-center gap-1 ${timeLeft === 'Ended' ? 'text-slate-400' : 'text-red-500 animate-pulse'}`}>
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      {timeLeft}
    </div>
  );
};

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // 👇 YAHAN SE QR CODE KA LOGIC PASTE KAREIN 👇
  const [showQRModal, setShowQRModal] = useState(false);
  const qrCardRef = useRef(null);

  const downloadQRCard = async () => {
    if (!qrCardRef.current || !dbUser?.username) return;
    try {
      showToast("⏳ Generating high-quality QR...");
      const dataUrl = await toPng(qrCardRef.current, { 
        cacheBust: true,
        pixelRatio: 4,
        backgroundColor: '#f8fafc' // slate-50 background color
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${dbUser.username}-LinkFav-QR.png`;
      link.click();
      showToast("✅ QR Code Downloaded!");
    } catch (err) {
      console.error("QR Download Error:", err);
      showToast("⚠️ Error downloading QR.");
    }
  };
  
  const [greetingText, setGreetingText] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerScrollRef = useRef(null);

  const storeSalesRef = useRef(null);
  const scrollStoreSales = (direction) => {
    if (storeSalesRef.current) {
      const scrollAmount = 180;
      storeSalesRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const [stats, setStats] = useState({
    ownStats: { total: 0, videoCount: 0, collectionCount: 0 },
    platformStats: { total: 0, videoCount: 0, collectionCount: 0, clicks: 0 },
    autoPostStats: { totalTelegramDeals: 0, linksGenerated: 0, clicks: 0 }
  });

  const [platformConfig, setPlatformConfig] = useState(null);
  const [showGlobalPopup, setShowGlobalPopup] = useState(false);
  const [drawerData, setDrawerData] = useState({ isOpen: false, sectionName: "", products: [] });

  const [topCampaigns, setTopCampaigns] = useState([]);
  const [processingAction, setProcessingAction] = useState(null); 
  const [toastMessage, setToastMessage] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuickAction = async (action, deal, uniqueId) => {
    setProcessingAction(uniqueId); 
    try {
      const res = await fetch('/api/deals/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, deal })
      });
      const data = await res.json();
      
      if (data.success) {
        if (action === "copy") {
          const shortLink = `${window.location.origin}/go/${data.shortCode}`;
          navigator.clipboard.writeText(shortLink);
          showToast(`✅ Link Copied: ${shortLink}`);
        } else {
          showToast(`🚀 Product pushed to your Bio Page!`);
        }
      } else {
        showToast(`⚠️ Error: ${data.message}`);
      }
    } catch (err) {
      showToast(`⚠️ Server Error!`);
    }
    setProcessingAction(null); 
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.email) {
      const userEmail = session.user.email;
      
      Promise.all([
        fetch(`/api/user/get-by-email?email=${userEmail}`).then(res => res.json()),
        fetch(`/api/admin/config`).then(res => res.json())
      ])
      .then(([userData, configData]) => {
        if (userData.success && userData.user) setDbUser(userData.user);
        if (configData.success && configData.data) {
          setPlatformConfig(configData.data);
          if (configData.data.globalPopup?.isActive) setShowGlobalPopup(true);
        }
        setLoading(false); 
      })
      .catch(err => {
        console.error("Fast APIs Error:", err);
        setLoading(false);
      });

      fetch(`/api/dashboard/get-stats?email=${userEmail}`)
        .then(res => res.json())
        .then(statsData => {
          if (statsData.success && statsData.data) setStats(statsData.data);
        })
        .catch(err => console.error("Stats Fetch Error:", err));

      fetch('/api/campaigns')
        .then(res => res.json())
        .then(campaignsData => {
          if (campaignsData.success && campaignsData.campaigns) {
            const vipList = ["flipkart", "myntra", "shopsy", "nykaa", "mamaearth", "boat", "ajio", "meesho", "croma", "swiggy", "zomato"];
            let orderedVips = [];
            
            vipList.forEach(v => {
               const found = campaignsData.campaigns.find(camp => (camp.name || "").toLowerCase().includes(v));
               if(found) orderedVips.push(found);
            });
            
            setTopCampaigns(orderedVips.slice(0, 10));
          }
        })
        .catch(err => console.error("Campaigns Fetch Error:", err));
    }
  }, [status, session?.user?.email, router]);

  useEffect(() => {
    if (session?.user?.name) {
      const hour = new Date().getHours();
      let timeGreeting = "Good Evening";
      if (hour < 12) timeGreeting = "Good Morning";
      else if (hour < 18) timeGreeting = "Good Afternoon";

      const firstName = session.user.name.split(" ")[0];
      setGreetingText(`Hi ${firstName}, ${timeGreeting}!`);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    let interval;
    if (platformConfig?.banners?.length > 1) {
      interval = setInterval(() => {
        if (bannerScrollRef.current) {
          const el = bannerScrollRef.current;
          const maxScroll = el.scrollWidth - el.clientWidth;
          
          if (el.scrollLeft >= maxScroll - 10) {
            el.scrollTo({ left: 0, behavior: 'smooth' }); 
          } else {
            el.scrollBy({ left: el.clientWidth, behavior: 'smooth' }); 
          }
        }
      }, 3500); 
    }
    return () => clearInterval(interval);
  }, [platformConfig?.banners]);

  const copyPublicLink = () => {
    const link = `${window.location.origin}/${dbUser?.username}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleScroll = () => {
    if (bannerScrollRef.current) {
      const scrollPosition = bannerScrollRef.current.scrollLeft;
      const width = bannerScrollRef.current.clientWidth;
      setActiveBanner(Math.round(scrollPosition / width));
    }
  };

  const closeDrawer = () => setDrawerData({ isOpen: false, sectionName: "", products: [] });

  const handleBannerClick = (e, url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      e.preventDefault(); 
      
      let videoId = "";
      if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
      else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
      
      if (videoId) {
        setActiveVideo(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
      } else {
        window.open(url, '_blank'); 
      }
    }
  };

  const waNumber = "919986955416";
  const waMessage = encodeURIComponent(`Hi Support Team,\n\nI need some assistance regarding my creator account.\n\n*Creator Details:*\nName: ${session?.user?.name || 'N/A'}\nEmail: ${session?.user?.email || 'N/A'}\n\n*My Query:* `);
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative pb-24">
      
      {/* 🚨 TOP NOTICE BAR */}
      {platformConfig?.topNotice?.isActive && platformConfig?.topNotice?.text && (
        <a href={platformConfig.topNotice.linkUrl || "#"} target={platformConfig.topNotice.linkUrl ? "_blank" : "_self"} className="block w-full bg-slate-900 text-white text-center py-2 px-4 text-[2px] md:text-xs font-black hover:bg-black transition-colors animate-in slide-in-from-top flex items-center justify-center gap-2 relative z-[100] border-b border-slate-700 shadow-md">
          <span className="animate-pulse text-amber-400">Note</span> {platformConfig.topNotice.text}
        </a>
      )}

      {toastMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl font-bold text-[11px] z-[200] animate-[bounce_0.3s_ease-in-out] whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* YOUTUBE THEATER POPUP */}
      {activeVideo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
            <button onClick={() => setActiveVideo(null)} className="absolute top-2 right-2 sm:top-4 sm:right-4 w-10 h-10 bg-black/50 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-10 font-bold transition-colors">✕</button>
            <iframe 
              src={activeVideo} 
              className="w-full h-full border-0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
          </div>
        </div>
      )}

      {/* GLOBAL POPUP */}
      {showGlobalPopup && platformConfig?.globalPopup?.imageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowGlobalPopup(false)} className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center z-10 backdrop-blur-md font-bold">✕</button>
            <a href={platformConfig.globalPopup.linkUrl || "#"} target={platformConfig.globalPopup.linkUrl ? "_blank" : "_self"}>
              <img src={platformConfig.globalPopup.imageUrl} alt="Announcement" className="w-full h-auto object-cover" />
            </a>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        
        <div className="font-extrabold text-sm md:text-lg text-slate-800 tracking-tight flex-1 text-center min-h-[28px]">
          {greetingText}
        </div>
        
        {/* QUICK SUPPORT BUTTON */}
        <a href={waUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full transition-colors shadow-sm" title="Live Support">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          <span className="text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline">Quick Support</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider sm:hidden">Help</span>
        </a>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {!dbUser?.username ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Setup Your Creator Profile</h2>
            <p className="text-slate-500 font-bold text-sm mb-6">Choose a unique handle to create your bio link:</p>
            <p className="font-mono text-sm bg-slate-100 inline-block px-4 py-2 rounded-lg text-slate-600 font-bold mb-8 border border-slate-200">getbuylink.com/your_name</p>
            <UsernameForm />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            <div className="lg:col-span-2 space-y-6">
              
              {/* BIO LINK BAR */}
            <div className="bg-white border-[0.5px] border-slate-200/70 rounded-xl py-2 px-3 shadow-sm flex items-center justify-between gap-2 overflow-hidden hover:border-slate-300 transition-colors">
  
  <div className="flex flex-col min-w-0 flex-1 pl-1">
    <div className="flex items-center gap-1.5 mb-0.5">
      <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Your Page Link</p>
      <button onClick={copyPublicLink} className="text-slate-400 hover:text-emerald-500 active:scale-95 transition-all" title="Copy Link">
        {isCopied ? (
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        )}
      </button>
    </div>
    <span className="font-black text-[12px] md:text-sm truncate block text-slate-800 leading-tight">linkfav.com/{dbUser.username}</span>
  </div>

  <div className="flex shrink-0 gap-1.5 items-center">
    
    <button 
      onClick={() => setShowQRModal(true)} 
      className="flex items-center justify-center p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors rounded-lg border border-indigo-100 active:scale-95" 
      title="Show QR Code"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-5 md:h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
      </svg>
    </button>

    <a 
      href={`/${dbUser.username}`} 
      target="_blank" 
      rel="noreferrer" 
      className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors px-3 py-2 rounded-lg font-extrabold text-[10px] md:text-xs shadow-md shadow-blue-500/30 active:scale-95"
    >
      View <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
    </a>

  </div>
</div>

              {/* ACTIVITY ANALYTICS */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Today's Activity</h3>
                
                <div className="grid grid-cols-3 gap-2 md:gap-6 divide-x divide-slate-100">
                  <div className="pr-1 md:pr-4">
                    <p className="text-[9px] md:text-[11px] font-extrabold text-slate-800 uppercase mb-2 md:mb-3 flex items-center gap-1 md:gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 shrink-0"></span> Platform
                    </p>
                    <div className="space-y-1 md:space-y-2">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center"><span className="text-[9px] md:text-xs font-bold text-slate-500">Gen:</span><span className="text-[10px] md:text-sm font-black text-slate-800">{stats.platformStats.total}</span></div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center"><span className="text-[9px] md:text-xs font-bold text-slate-500">Vid:</span><span className="text-[10px] md:text-sm font-black text-slate-800">{stats.platformStats.videoCount}</span></div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center"><span className="text-[9px] md:text-xs font-bold text-slate-500">Col:</span><span className="text-[10px] md:text-sm font-black text-slate-800">{stats.platformStats.collectionCount}</span></div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-1.5 pt-1.5 border-t border-slate-50"><span className="text-[9px] md:text-xs font-bold text-emerald-600">Clicks:</span><span className="text-[10px] md:text-sm font-black text-emerald-600">{stats.platformStats.clicks}</span></div>
                    </div>
                  </div>

                  <div className="px-2 md:px-4">
                    <p className="text-[9px] md:text-[11px] font-extrabold text-slate-800 uppercase mb-2 md:mb-3 flex items-center gap-1 md:gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-purple-500 shrink-0"></span> Own Links
                    </p>
                    <div className="space-y-1 md:space-y-2">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center"><span className="text-[9px] md:text-xs font-bold text-slate-500">Add:</span><span className="text-[10px] md:text-sm font-black text-slate-800">{stats.ownStats.total}</span></div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center"><span className="text-[9px] md:text-xs font-bold text-slate-500">Vid:</span><span className="text-[10px] md:text-sm font-black text-slate-800">{stats.ownStats.videoCount}</span></div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center"><span className="text-[9px] md:text-xs font-bold text-slate-500">Col:</span><span className="text-[10px] md:text-sm font-black text-slate-800">{stats.ownStats.collectionCount}</span></div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-1.5 pt-1.5 border-t border-slate-50"><span className="text-[7.5px] md:text-[10px] font-bold text-slate-400 italic mt-1 leading-tight">No Clicks</span></div>
                    </div>
                  </div>

                  <div className="pl-2 md:pl-4">
                    <p className="text-[9px] md:text-[11px] font-extrabold text-slate-800 uppercase mb-2 md:mb-3 flex items-center gap-1 md:gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-orange-500 shrink-0"></span> Auto-Post
                    </p>
                    <div className="space-y-1 md:space-y-2">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center"><span className="text-[9px] md:text-xs font-bold text-slate-500">Live:</span><span className="text-[10px] md:text-sm font-black text-slate-800">{stats.autoPostStats.totalTelegramDeals}</span></div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center"><span className="text-[9px] md:text-xs font-bold text-slate-500">Gen:</span><span className="text-[10px] md:text-sm font-black text-slate-800">{stats.autoPostStats.linksGenerated}</span></div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-1.5 pt-1.5 border-t border-slate-50"><span className="text-[9px] md:text-xs font-bold text-emerald-600">Clicks:</span><span className="text-[10px] md:text-sm font-black text-emerald-600">{stats.autoPostStats.clicks}</span></div>
                    </div>
                  </div>
                </div>

                <Link href="/creators/analytics" className="mt-5 block w-full text-center bg-slate-50 hover:bg-slate-100 text-blue-600 font-extrabold text-xs py-3 rounded-xl transition-colors border border-slate-100">
                  See Detail Insights →
                </Link>
              </div>

              {/* YOUTUBE/TUTORIAL SLIDER */}
              {platformConfig?.youtubeBanners?.isActive && platformConfig?.youtubeBanners?.videos?.length > 0 && (
                <div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 px-1">Creator Tutorials</h3>
                  <div className="flex overflow-x-auto gap-4 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
                    {platformConfig.youtubeBanners.videos.map((vid, idx) => {
                      const isYoutube = vid.videoUrl && (vid.videoUrl.includes('youtube.com') || vid.videoUrl.includes('youtu.be'));
                      
                      return (
                      <a key={idx} href={vid.videoUrl} target={isYoutube ? "_self" : "_blank"} rel="noreferrer" onClick={(e) => handleBannerClick(e, vid.videoUrl)} className="snap-start flex-shrink-0 w-[60%] sm:w-[70%] md:w-[40%] aspect-video rounded-xl overflow-hidden relative group shadow-sm block bg-slate-200 border border-slate-100">
                        <img src={vid.thumbnailUrl} alt={vid.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        
                        {isYoutube && (
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                        )}
                      </a>
                    )})}
                  </div>
                </div>
              )}

              {/* DYNAMIC BANNERS */}
              {platformConfig?.banners?.length > 0 && (
                <div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 px-1">Tips & Updates</h3>
                  <div ref={bannerScrollRef} onScroll={handleScroll} className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
                    {platformConfig.banners.map((banner, idx) => (
                      <a key={idx} href={banner.linkUrl || "#"} className="snap-center shrink-0 w-[90%] md:w-[70%] aspect-[21/9] rounded-2xl overflow-hidden relative shadow-sm block group bg-slate-200">
                        <img src={banner.imageUrl} alt={`Banner ${idx}`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </a>
                    ))}
                  </div>
                  {platformConfig.banners.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-1">
                      {platformConfig.banners.map((_, dot) => (
                        <div key={dot} className={`h-1.5 rounded-full transition-all duration-300 ${activeBanner === dot ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300'}`}></div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              
              {/* STORE SALES RADAR */}
              {platformConfig?.storeSales?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      Store Sales Radar
                    </h3>
                    
                    <div className="flex items-center gap-1.5">
                       <button onClick={() => scrollStoreSales('left')} className="w-7 h-7 bg-slate-50 hover:bg-slate-200 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 transition-colors">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                       </button>
                       <button onClick={() => scrollStoreSales('right')} className="w-7 h-7 bg-slate-50 hover:bg-slate-200 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 transition-colors">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                       </button>
                    </div>
                  </div>
                  
                  <div ref={storeSalesRef} className="flex overflow-x-auto gap-3 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory scroll-smooth">
                    {platformConfig.storeSales.map((sale, idx) => (
                      <a key={idx} href={sale.linkUrl || "#"} className="snap-start flex-shrink-0 w-64 md:w-72 flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 transition-all group shadow-sm">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm shrink-0 overflow-hidden">
                          {sale.storeCode.startsWith('http') ? (
                            <img src={sale.storeCode} alt="logo" className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="font-black text-slate-800 text-[10px] uppercase">{sale.storeCode}</span>
                          )}
                        </div>
                        <div className="flex-1 px-2 text-center overflow-hidden">
                          <p className="font-extrabold text-slate-800 text-xs truncate group-hover:text-blue-600 transition-colors">{sale.storeName}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-sm border ${sale.statusType === 'live' ? 'text-orange-600 bg-white border-orange-100' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                            {sale.statusText}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* POPULAR STORE LIST */}
              {platformConfig?.vipStoreRates?.isActive && topCampaigns.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 truncate pr-2">
                      <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-md flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V10l-1.5-1.5M5 21V10L3.5 8.5M22 6l-2-2H4L2 6v2h20V6zM8 21v-4a2 2 0 014 0v4"></path></svg>
                      </span>
                      Popular Store List
                    </h3>
                    <Link href="/campaign-rates" className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center shrink-0 bg-blue-50 px-2.5 py-1 rounded-md transition-colors">
                      See All <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </Link>
                  </div>
                  
                  <div className="flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
                    {topCampaigns.map((camp, idx) => {
                      const isPercent = (camp.payout_type || "").toLowerCase().includes("%");
                      return (
                      <Link href="/campaign-rates" key={idx} className="snap-start flex-shrink-0 w-[110px] md:w-[120px] border border-slate-100 rounded-xl p-3 flex flex-col items-center hover:border-blue-300 transition-colors group bg-slate-50 hover:bg-white shadow-sm relative overflow-hidden">
                        
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm shrink-0 overflow-hidden mb-2">
                           <img src={camp.image || "https://via.placeholder.com/150?text=Store"} alt="logo" className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="font-extrabold text-slate-800 text-[10px] truncate w-full text-center">{camp.name}</p>
                        <p className="text-blue-600 font-black text-[11px] mt-1">Upto {isPercent ? `${camp.payout}%` : `₹${camp.payout}`}</p>
                      </Link>
                    )})}
                  </div>
                </div>
              )}

              {/* DYNAMIC HIGH COMMISSION SECTIONS */}
              {platformConfig?.topDealSections?.map((section, secIdx) => {
                if (!section.isActive || section.deals.length === 0) return null;
                
                const showSeeAll = section.deals.length > 10;
                const displayDeals = section.deals.slice(0, 10);

                return (
                  <div key={secIdx} className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 truncate pr-2">
                        <span className="bg-emerald-100 text-emerald-600 w-6 h-6 rounded-md flex items-center justify-center text-[12px]">🔥</span>
                        {section.sectionTitle}
                      </h3>
                      {showSeeAll && (
                        <button onClick={() => setDrawerData({ isOpen: true, sectionName: section.sectionTitle, products: section.deals })} className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center shrink-0 bg-blue-50 px-2.5 py-1 rounded-md transition-colors">
                          See All <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
                      {displayDeals.map((deal, dealIdx) => {
                        const displayStore = deal.store || section.storeName || "STORE";
                        return (
                        <div key={dealIdx} className="snap-start flex-shrink-0 w-[125px] md:w-[135px] border border-slate-100 rounded-xl p-1.5 flex flex-col hover:border-slate-300 transition-colors group bg-white shadow-sm hover:shadow-md">
                          
                          <div className="w-full aspect-square bg-slate-50 rounded-lg mb-2 relative p-1 overflow-hidden flex items-center justify-center border border-slate-100">
                            <img src={deal.imageUrl || "https://via.placeholder.com/150?text=No+Image"} alt={deal.title || "Product"} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform pb-4" />
                            {deal.commissionText && <span className="absolute top-0 left-0 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg shadow-sm z-10">{deal.commissionText}</span>}
                            
                            <div className="absolute bottom-1 right-1 bg-slate-900/80 backdrop-blur-sm py-0.5 px-1.5 rounded flex items-center justify-center">
                               <span className="text-[7px] font-black text-white tracking-widest uppercase truncate max-w-[60px]">{displayStore}</span>
                            </div>
                          </div>
                          
                          <div className="px-1 flex-1 flex flex-col">
                            <p className="text-[10px] font-bold text-slate-700 line-clamp-2 leading-tight mb-1">{deal.title || "Untitled Product"}</p>
                            
                        {(deal.price || deal.discountPercent || deal.coupon) && (
                          <div className="flex items-center justify-between mt-1 mb-1">
                            <div className="flex items-center gap-1.5">
                              {deal.price && <span className="text-[11px] font-black text-slate-900">{deal.price}</span>}
                              {deal.discountPercent && <span className="text-[8px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-1 py-0.5 rounded">{deal.discountPercent}</span>}
                            </div>
                            {deal.coupon && <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded uppercase border-dashed">{deal.coupon}</span>}
                          </div>
                        )}

                            {deal.timer && <LiveTimer targetDate={deal.timer} />}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1.5 mt-2">
                            <button onClick={() => handleQuickAction("copy", { ...deal, storeName: displayStore }, `copy_${secIdx}_${dealIdx}`)} className="text-[8px] font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded transition-colors">
                              {processingAction === `copy_${secIdx}_${dealIdx}` ? "⏳" : "Copy Link"}
                            </button>
                            <button onClick={() => handleQuickAction("push", { ...deal, storeName: displayStore }, `push_${secIdx}_${dealIdx}`)} className="text-[8px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 rounded transition-colors">
                              {processingAction === `push_${secIdx}_${dealIdx}` ? "⏳" : "To Page"}
                            </button>
                          </div>

                        </div>
                      )})}
                      
                      {showSeeAll && (
                        <button onClick={() => setDrawerData({ isOpen: true, sectionName: section.sectionTitle, products: section.deals })} className="snap-start flex-shrink-0 w-[110px] border border-slate-100 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 text-blue-600 transition-colors">
                          <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          <span className="text-[11px] font-black">View All</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 🚨 FIX 5: JOIN OUR COMMUNITY SECTION (Centered with Custom Icons) */}
              <div className="mt-8 flex flex-col items-center">
                <h3 className="text-sm font-black text-slate-800 mb-4 px-1 text-center w-full">
                  Join Our Community
                </h3>
                <div className="flex justify-center overflow-x-auto gap-5 pb-2 w-full max-w-lg mx-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-in zoom-in-95 duration-500 px-1">
                  
                  {/* INSTAGRAM BOX */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <a href="https://instagram.com/getbuylink" target="_blank" rel="noreferrer" className="w-[85px] h-[85px] md:w-[100px] md:h-[100px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block bg-slate-200">
                      <img src="https://images.unsplash.com/photo-1611262588024-d12430b98920?q=80&w=200&auto=format&fit=crop" alt="Instagram" className="w-full h-full object-cover" />
                    </a>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Follow Insta</span>
                  </div>
                  
                  {/* TELEGRAM BOX */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <a href="https://t.me/getbuylink" target="_blank" rel="noreferrer" className="w-[85px] h-[85px] md:w-[100px] md:h-[100px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block bg-slate-200">
                      <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop" alt="Telegram" className="w-full h-full object-cover" />
                    </a>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Join Channel</span>
                  </div>
                  
                  {/* YOUTUBE BOX */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <a href="https://youtube.com/@getbuylink" target="_blank" rel="noreferrer" className="w-[85px] h-[85px] md:w-[100px] md:h-[100px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block bg-slate-200">
                      <img src="https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=200&auto=format&fit=crop" alt="YouTube" className="w-full h-full object-cover" />
                    </a>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Subscribe</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* 🚨 ALL OVERLAYS MOVED TO THE BOTTOM FOR Z-INDEX FIX 🚨 */}
      {/* ======================================================== */}

      {/* FULL-PAGE "SEE ALL" DRAWER */}
      {drawerData.isOpen && (
        <div className="fixed inset-0 flex flex-col bg-slate-50 animate-in slide-in-from-bottom duration-300" style={{ zIndex: 2147483647 }}>
          
          {/* HEADER WITH CORNER CLOSE BUTTON */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
            <h2 className="font-black text-lg text-slate-800 flex items-center gap-2 pr-4 truncate">
              <span className="bg-emerald-100 text-emerald-600 w-6 h-6 rounded flex items-center justify-center text-xs shrink-0">🛍️</span>
              <span className="truncate">{drawerData.sectionName}</span>
            </h2>
            <button 
              onClick={closeDrawer} 
              className="w-8 h-8 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-full flex items-center justify-center font-bold text-slate-500 transition-colors shadow-sm shrink-0"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {drawerData.products.map((deal, idx) => {
                const displayStore = deal.store || "STORE";
                return (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex flex-col h-full hover:border-blue-300 transition-colors">
                  <div className="w-full aspect-square bg-slate-50 rounded-lg mb-2 relative p-2 overflow-hidden flex items-center justify-center border border-slate-100">
                    <img src={deal.imageUrl} alt="Product" className="w-full h-full object-contain mix-blend-multiply pb-2" />
                    {deal.commissionText && <span className="absolute top-0 left-0 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg z-10">{deal.commissionText}</span>}
                    
                    <div className="absolute bottom-1 right-1 bg-slate-900/80 backdrop-blur-sm py-0.5 px-1.5 rounded flex items-center justify-center shadow-sm">
                       <span className="text-[7px] font-black text-white tracking-widest uppercase truncate max-w-[60px]">{displayStore}</span>
                    </div>
                  </div>
                  
                  <div className="px-1 flex-1 flex flex-col">
                    <p className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight">{deal.title}</p>
                    
                    {(deal.price || deal.discountPercent || deal.coupon) && (
                      <div className="flex items-center justify-between mt-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          {deal.price && <span className="text-[11px] font-black text-slate-900">{deal.price}</span>}
                          {deal.discountPercent && <span className="text-[8px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-1 py-0.5 rounded">{deal.discountPercent}</span>}
                        </div>
                        {deal.coupon && <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded uppercase border-dashed">{deal.coupon}</span>}
                      </div>
                    )}
                    
                    {deal.timer && <LiveTimer targetDate={deal.timer} />}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <button 
                      onClick={() => handleQuickAction("copy", deal, `drawer-${idx}-copy`)}
                      disabled={processingAction === `drawer-${idx}-copy`}
                      className="text-[9px] font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-md transition-colors disabled:opacity-50">
                      {processingAction === `drawer-${idx}-copy` ? "⏳" : "Copy"}
                    </button>
                    <button 
                      onClick={() => handleQuickAction("push", deal, `drawer-${idx}-push`)}
                      disabled={processingAction === `drawer-${idx}-push`}
                      className="text-[9px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 rounded-md transition-colors disabled:opacity-50">
                      {processingAction === `drawer-${idx}-push` ? "⏳" : "To Page"}
                    </button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🚨 FIX: THE HAMBURGER MENU DRAWER (Moved to Bottom, Max Z-Index) */}
      {/* ======================================================== */}
      {isMenuOpen && (
        <div className="fixed inset-0 flex" style={{ zIndex: 2147483647 }}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
          
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <img src={session?.user?.image} alt="Profile" className="w-16 h-16 rounded-full border-2 border-white shadow-sm mb-3" />
              <h2 className="font-extrabold text-lg text-slate-900">{session?.user?.name}</h2>
              <p className="text-xs font-bold text-slate-500">{session?.user?.email}</p>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
              
              <Link href="/campaign-rates" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V10l-1.5-1.5M5 21V10L3.5 8.5M22 6l-2-2H4L2 6v2h20V6zM8 21v-4a2 2 0 014 0v4"></path></svg>
                 All Campaign Rates
              </Link>
              
              <Link href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold">
                <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                Upcoming Features
                <span className="ml-auto bg-pink-100 text-pink-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Insta Auto DM</span>
              </Link>

              <Link href="/creators/analytics?tab=payouts" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                My Earnings
              </Link>

              <details className="group">
                <summary className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold cursor-pointer list-none outline-none">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  Video Tutorials
                  <svg className="w-4 h-4 ml-auto text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </summary>
                <div className="pl-11 py-2 space-y-3">
                  <Link href="#" className="block text-sm font-bold text-slate-500 hover:text-blue-600">How to add links?</Link>
                  <Link href="#" className="block text-sm font-bold text-slate-500 hover:text-blue-600">Setting up Auto-post</Link>
                  <Link href="#" className="block text-sm font-bold text-slate-500 hover:text-blue-600">Withdraw earnings</Link>
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold cursor-pointer list-none outline-none">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Contact Support
                  <svg className="w-4 h-4 ml-auto text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </summary>
                <div className="pl-11 py-2 space-y-2">
                  <a href="mailto:support@getbuylink.com" className="block text-sm font-bold text-slate-500 hover:text-blue-600">📧 support@getbuylink.com</a>
                  <a href="tel:+919986955416" className="block text-sm font-bold text-slate-500 hover:text-blue-600">📞 +91 9986955416</a>
                </div>
              </details>
            </div>

            <div className="pt-2 pb-4 border-t border-slate-200">
              <div className="flex justify-center gap-3 mb-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                <Link href="#" className="hover:text-blue-600 transition-colors">Terms</Link>
                <span>•</span>
                <Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link>
                <span>•</span>
                <Link href="#" className="hover:text-blue-600 transition-colors">About Us</Link>
              </div>

              <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center justify-center gap-2 w-[90%] mx-auto p-3 rounded-xl hover:bg-red-50 transition-colors text-red-600 font-bold bg-slate-50 border border-slate-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Logout Account
              </button>
            </div>
          </div>
        </div>
      )}
    
    {/* ======================================================== */}
      {/* 🚨 THE PREMIUM QR CODE MODAL 🚨 */}
      {/* ======================================================== */}
      {showQRModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-300" style={{ zIndex: 2147483647 }}>
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowQRModal(false)}></div>
          
          <div className="relative w-full max-w-sm bg-slate-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm z-10">
              <h2 className="font-black text-slate-800 flex items-center gap-2">
                <span className="text-indigo-600">📱</span> Share Your Page
              </h2>
              <button onClick={() => setShowQRModal(false)} className="w-8 h-8 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-full flex items-center justify-center font-bold text-slate-500 transition-colors">✕</button>
            </div>

            {/* THE DOWNLOADABLE CARD AREA */}
            <div className="flex items-center justify-center py-6 bg-slate-50 overflow-x-auto">
              <div 
                ref={qrCardRef}
                className="bg-white flex flex-col items-center justify-center shadow-md relative"
                style={{ width: "280px", height: "350px", padding: "20px", borderRadius: "24px" }} 
              >
                
                {/* 1. MARKETING BRANDING (TOP) */}
                <div className="w-full flex justify-center mb-3">
                  <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    <span className="text-[10px] font-black tracking-widest uppercase">linkfav.com</span>
                  </div>
                </div>

                {/* 2. THE QR CODE WRAPPER */}
                <div className="relative flex items-center justify-center w-full bg-white mb-1">
                  <QRCodeSVG 
                    value={`https://linkfav.com/${dbUser?.username}`}
                    size={210} 
                    bgColor={"#ffffff"}
                    fgColor={"#0f172a"}
                    level={"H"} 
                  />
                  
                  {/* SINGLE CREATOR IMAGE CENTERED WITH BORDER */}
                  <div className="absolute flex items-center justify-center bg-white rounded-full shadow-sm" style={{ width: "56px", height: "56px" }}>
                    <img 
                      src={dbUser?.image || session?.user?.image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                      alt="Creator" 
                      crossOrigin="anonymous" 
                      className="w-12 h-12 rounded-full border-[2.5px] border-slate-200 bg-slate-100 object-cover" 
                    />
                  </div>
                </div>

                {/* 3. USERNAME & TAGLINE */}
                <div className="flex flex-col items-center w-full mt-1">
                  <p className="font-black text-[19px] text-slate-900 tracking-tight truncate w-full text-center">
                    @{dbUser?.username}
                  </p>
                  <p className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-widest mt-0.5">
                    Scan to shop my favs!
                  </p>
                </div>

              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-white border-t border-slate-200 flex gap-3 shadow-sm z-10">
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

export default function CreatorsDashboard() {
  return (
    <SessionProvider>
      <DashboardContent />
    </SessionProvider>
  );
}