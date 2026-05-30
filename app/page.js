"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";

// --- Custom Component for Scroll "Fade Up" Animation ---
function RevealOnScroll({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}

function LandingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [username, setUsername] = useState("");

  // Auto-redirect if logged in
  useEffect(() => {
    if (status === "authenticated") router.push("/creators");
  }, [status, router]);

  // --- 4 Tabs Logic (Auto-play & Flip Animation) ---
  const tabs = [
    { 
      id: "01", title: "Instagram Bio", 
      bgImg: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600",
      fgImg: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=600",
      text: "Convert your followers into buyers by placing your premium FavyLink in your bio."
    },
    { 
      id: "02", title: "Smart Store", 
      bgImg: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=600", 
      fgImg: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600", 
      text: "A fully automated storefront that organizes your products professionally."
    },
    { 
      id: "03", title: "Auto-Deals", 
      bgImg: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600", 
      fgImg: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600", 
      text: "Our AI fetches the best deals and posts them directly to your link on autopilot."
    },
    { 
      id: "04", title: "Collections", 
      bgImg: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", 
      fgImg: "https://images.unsplash.com/photo-1534452286304-a15f33635201?q=80&w=600", 
      text: "Create beautiful product collections and themes that match your creator vibe."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tabs.length]);

  const scrollToSection = (id) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-blue-500 selection:text-white">
      
      {/* --- Custom Trendy Styles --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flipIn {
          from { transform: perspective(1000px) rotateY(90deg); opacity: 0; }
          to { transform: perspective(1000px) rotateY(0deg); opacity: 1; }
        }
        @keyframes slideRight {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes marqueeRev { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        @keyframes skeleton-run { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }

        .flip-animate { animation: flipIn 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .text-slide-animate { animation: slideRight 0.6s ease-out; }
        .animate-marquee { display: flex; width: 200%; animation: marquee 30s linear infinite; }
        .animate-marquee-rev { display: flex; width: 200%; animation: marqueeRev 30s linear infinite; }
        .skeleton-bar::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
          animation: skeleton-run 2.5s infinite linear;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />

      {/* ========================================== */}
      {/* 1. COMPACT NAVBAR (Blue Trendy Glass) */}
      {/* ========================================== */}
      <nav className="fixed top-0 w-full bg-blue-600/10 backdrop-blur-xl border-b border-blue-500/20 z-[100] transition-all">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => scrollToSection("home")}>
             <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center p-1 overflow-hidden">
                <img src="/icon-192x192.png" alt="FL" className="w-full h-full object-contain" />
             </div>
             <span className="font-extrabold text-lg tracking-tight text-slate-900">
               Favy<span className="text-blue-600">Link</span>
             </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="bg-blue-600 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg shadow-blue-600/30">
              Login / Sign up
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 text-slate-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 bg-blue-900/95 backdrop-blur-2xl z-[90] transition-all duration-500 flex flex-col justify-center items-center gap-6 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {['Home', 'Storefront', 'Auto-Post', 'Dashboard', 'Redirection', 'Testimonials', 'Pricing', 'FAQ'].map((item) => (
          <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="text-xl font-black text-white hover:text-blue-400">
            {item}
          </button>
        ))}
      </div>

      <div className="pt-14">
        
        {/* ========================================== */}
        {/* 2. HERO & FLIP-TAB SLIDER */}
        {/* ========================================== */}
        <section id="home" className="bg-[#f1f5f9] pt-8 pb-10 px-4 rounded-b-[2rem]">
          <div className="max-w-5xl mx-auto text-center">
            <RevealOnScroll>
              <h1 className="text-4xl sm:text-6xl font-black text-slate-900 leading-tight mb-5">
                Make your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600">Favourite Link</span> Professional & Profitable.
              </h1>
              <p className="text-slate-600 text-base sm:text-lg font-medium mb-10 max-w-2xl mx-auto">
                Turn your standard bio link into a beautiful, zero-coding storefront. <span className="font-bold text-blue-600">Auto-Sync Deals</span> from 500+ brands and multiply your earnings while you sleep with smart, easy conversions.
              </p>
            </RevealOnScroll>

            {/* TAB SLIDER */}
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="flex justify-start sm:justify-center border-b border-slate-200 mb-6 overflow-x-auto hide-scrollbar px-2">
                {tabs.map((tab, index) => (
                  <button key={tab.id} onClick={() => setActiveTab(index)} className={`px-5 pb-3 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === index ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
                    {tab.id} {tab.title}
                  </button>
                ))}
              </div>

              <div className="relative h-[450px] sm:h-[550px] w-full flex justify-center items-center perspective-1000">
                {tabs.map((tab, index) => (
                  <div key={tab.id} className={`absolute inset-0 flex justify-center items-center gap-4 transition-all duration-700 ${activeTab === index ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                    <div className={`relative w-[200px] sm:w-[240px] h-[350px] sm:h-[420px] bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-white ${activeTab === index ? 'flip-animate' : ''}`}>
                       <img src={tab.bgImg} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                    <div className={`relative w-[180px] sm:w-[220px] h-[380px] sm:h-[480px] bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white -ml-20 sm:-ml-28 mt-12 z-20 ${activeTab === index ? 'flip-animate' : ''}`} style={{animationDelay: '150ms'}}>
                       <img src={tab.fgImg} className="w-full h-full object-cover" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-16 mt-6">
                 {tabs.map((tab, index) => (
                    <p key={`t-${index}`} className={`text-slate-500 font-bold text-sm sm:text-base ${activeTab === index ? 'text-slide-animate block' : 'hidden'}`}>
                      {tab.text}
                    </p>
                 ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 3. STUNNING STOREFRONT (Horizontal Compact) */}
        {/* ========================================== */}
        <section id="storefront" className="py-17 px-4 max-w-7xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-4">A Stunning Storefront.<br/>Zero Coding Required.</h2>
              <p className="text-slate-500 font-medium">Customize your page in seconds. Seamless shopping directly from your bio.</p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Auto-Sliding Banners", desc: "Top deals rotate automatically.", img: "https://cdn-icons-png.flaticon.com/128/1041/1041888.png" },
              { title: "Theater Mode Reels", desc: "Embed Instagram/YouTube videos.", img: "https://cdn-icons-png.flaticon.com/128/3159/3159066.png" },
              { title: "Category Collections", desc: "Organize products by niche.", img: "https://cdn-icons-png.flaticon.com/128/2906/2906206.png" },
              { title: "Rich Product Cards", desc: "Sale timers & direct buttons.", img: "https://cdn-icons-png.flaticon.com/128/1162/1162456.png" },
              { title: "Premium Themes", desc: "Change looks with one click.", img: "https://cdn-icons-png.flaticon.com/128/679/679904.png" }
            ].map((f, i) => (
              <RevealOnScroll key={i} delay={i * 50}>
                <div className="bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all">
                  <img src={f.img} className="w-10 h-10 object-contain" />
                  <div className="w-[1px] h-10 bg-slate-200"></div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{f.title}</h3>
                    <p className="text-slate-500 text-xs font-medium">{f.desc}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* ========================================== */}
        {/* 5. CLAIM BRANDED LINK BAR (Fixed) */}
        {/* ========================================== */}
        <section className="py-12 px-4 max-w-4xl mx-auto -mt-10 relative z-20">
           <RevealOnScroll>
             <div className="skeleton-bar relative bg-white p-1.5 sm:p-2 rounded-2xl shadow-2xl border border-blue-100 flex items-center overflow-hidden">
   <div className="pl-3 pr-1 text-slate-400 font-bold text-[11px] sm:text-base z-10 whitespace-nowrap flex-shrink-0">favylink.com/</div>
   <input 
     type="text" 
     placeholder="yourname" 
     value={username}
     onChange={(e) => setUsername(e.target.value)}
     className="flex-1 bg-transparent outline-none font-bold text-xs sm:text-base text-slate-900 px-1 min-w-0 z-10"
   />
   <button 
     onClick={() => router.push(`/register?username=${username}`)}
     className="bg-blue-600 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs whitespace-nowrap z-10 hover:bg-blue-700 flex-shrink-0 ml-1"
   >
     Claim Link
   </button>
</div>
           </RevealOnScroll>
        </section>

        {/* ========================================== */}
        {/* 4. ZERO EFFORT INCOME (Clean Image) */}
        {/* ========================================== */}
        <section id="auto-post" className="py-17 bg-slate-900 px-4">
           <div className="max-w-4xl mx-auto text-center">
             <RevealOnScroll>
               <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Zero-Effort Income.<br/>Meet Auto-Post</h2>
               <p className="text-slate-400 font-medium text-sm sm:text-base mb-10">
                 Our system fetches the hottest affiliate deals and posts them directly to your storefront. 
                 Setup your niche and watch your earnings grow while you sleep.
               </p>
               {/* Clean Image Area - Compact Size */}
               <div className="w-full flex justify-center relative my-4 sm:my-8">
                  {/* FIX: Removed extra margins. Added max-h for compact size */}
                  <img src="https://cdn.prod.website-files.com/666285153da630124c201ec0/6668ba66da158049b3d28ed5_1-03-p-500.webp" className="w-full max-w-2xl h-auto max-h-[250px] sm:max-h-[350px] object-contain drop-shadow-2xl" alt="Auto Post Workflow" />
               </div>
             </RevealOnScroll>

             {/* Restored Texts for Auto-Post Steps */}
             <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { title: "Set Your Niche", desc: "Select Fashion, Tech, Beauty in your dashboard." },
                  { title: "We Curate Deals", desc: "We fetch hot deals and auto-generate links." },
                  { title: "Auto-Published", desc: "Deals appear on your page. You earn on autopilot." }
                ].map((step, i) => (
                   <RevealOnScroll key={i} delay={i * 100}>
                     <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl h-full flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg mb-4">{i+1}</div>
                        <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                        <p className="text-slate-400 text-sm">{step.desc}</p>
                     </div>
                   </RevealOnScroll>
                ))}
             </div>
           </div>
        </section>


        {/* ========================================== */}
        {/* 6. AFFILIATE PARTNERS (2-Way Marquee) */}
        {/* ========================================== */}
        <section id="partners" className="py-14 overflow-hidden bg-white">
          <RevealOnScroll>
            <div className="max-w-7xl mx-auto px-4 text-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 mb-4">We Don't Just Build Your Page.<br className="sm:hidden"/> We Monetize It.</h2>
              <p className="text-slate-500 font-medium">Partnered with top global brands to give you the highest commissions in the market.</p>
            </div>
          </RevealOnScroll>

          {/* Marquee CSS Animation (Add this if not already present) */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marqueeLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            @keyframes marqueeRight { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
            .animate-marquee-left { display: flex; width: 200%; animation: marqueeLeft 25s linear infinite; }
            .animate-marquee-right { display: flex; width: 200%; animation: marqueeRight 25s linear infinite; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
          `}} />

          {/* Row 1: Left to Right */}
          <div className="relative w-full overflow-hidden mb-6">
            <div className="animate-marquee-left flex items-center gap-4 sm:gap-6 px-3">
              {[
                "https://sankmo.in/assets/images/sankmo-influencer-mobile.png",
                "https://logo.clearbit.com/flipkart.com",
                "https://logo.clearbit.com/myntra.com",
                "https://logo.clearbit.com/ajio.com",
                "https://logo.clearbit.com/shopsy.in",
                "https://logo.clearbit.com/nike.com"
              ].map((imgLink, index) => (
                <div key={`L-${index}`} className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-white border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow p-2 sm:p-4">
                  {/* FIX: Removed grayscale & opacity. Added mix-blend-multiply for clean look */}
                  <img src={imgLink} alt="Brand Partner" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Right to Left */}
          <div className="relative w-full overflow-hidden">
            <div className="animate-marquee-right flex items-center gap-4 sm:gap-6 px-3">
              {[
                "https://cdn.prod.website-files.com/666285153da630124c201ec0/66bc1719faf12d395160239f_Asset%20489-p-1080.png",
                "https://logo.clearbit.com/adidas.com",
                "https://logo.clearbit.com/apple.com",
                "https://logo.clearbit.com/samsung.com",
                "https://logo.clearbit.com/puma.com",
                "https://logo.clearbit.com/hm.com"
              ].map((imgLink, index) => (
                <div key={`R-${index}`} className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-white border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow p-2 sm:p-4">
                  {/* FIX: Removed grayscale & opacity */}
                  <img src={imgLink} alt="Brand Partner" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* NEW: EARN WITH EASY STEPS (Fixed for Mobile) */}
        {/* ========================================== */}
        <section className="py-15 px-2 sm:px-4 bg-slate-50 relative overflow-hidden">
          
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes popZoomOut {
              0% { transform: scale(1.3); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-pop-zoom {
              animation: popZoomOut 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />

          <div className="max-w-7xl mx-auto">
            <RevealOnScroll>
              <div className="text-center mb-12 sm:mb-20">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Earn with Easy Steps</h2>
                <p className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-widest">Monetize your audience in 3 clicks</p>
              </div>
            </RevealOnScroll>

            <div className="relative max-w-4xl mx-auto px-2">
              {/* Connecting Chain Line (Horizontal for both Mobile & Desktop) */}
              <div className="absolute top-[2rem] sm:top-[3.5rem] left-[15%] right-[15%] h-1 bg-blue-200 z-0 rounded-full"></div>

              {/* FIX: grid-cols-3 forces them side-by-side even on mobile */}
              <div className="grid grid-cols-3 gap-2 sm:gap-6 relative z-10">
                
                {/* Step 1 */}
                <RevealOnScroll delay={100}>
                  <div className="flex flex-col items-center text-center group">
                    {/* FIX: overflow-hidden & object-cover removes gap */}
                    <div className="w-16 h-16 sm:w-28 sm:h-28 bg-white rounded-full border-4 sm:border-[6px] border-slate-50 shadow-xl flex items-center justify-center mb-3 sm:mb-6 animate-pop-zoom shadow-blue-500/10 overflow-hidden relative">
                      <img src="https://sankmo.in/assets/images/sankmo-influencer-mobile.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Explore Deals" />
                    </div>
                    <h3 className="font-black text-slate-900 text-[11px] sm:text-lg mb-1 sm:mb-2 leading-tight">1. Explore Deals</h3>
                    <p className="text-slate-500 text-[9px] sm:text-sm font-medium px-1 sm:px-4 leading-tight">Find deals from top retailers like Ajio, Flipkart, Myntra.</p>
                  </div>
                </RevealOnScroll>

                {/* Step 2 */}
                <RevealOnScroll delay={300}>
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-16 h-16 sm:w-28 sm:h-28 bg-white rounded-full border-4 sm:border-[6px] border-slate-50 shadow-xl flex items-center justify-center mb-3 sm:mb-6 animate-pop-zoom shadow-blue-500/10 overflow-hidden relative" style={{ animationDelay: '200ms' }}>
                      <img src="YOUR_REAL_IMAGE_LINK_HERE" className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Fetch Details" />
                    </div>
                    <h3 className="font-black text-slate-900 text-[11px] sm:text-lg mb-1 sm:mb-2 leading-tight">2. Fetch & Make Link</h3>
                    <p className="text-slate-500 text-[9px] sm:text-sm font-medium px-1 sm:px-4 leading-tight">Convert normal links into earning links instantly.</p>
                  </div>
                </RevealOnScroll>

                {/* Step 3 */}
                <RevealOnScroll delay={500}>
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-16 h-16 sm:w-28 sm:h-28 bg-white rounded-full border-4 sm:border-[6px] border-slate-50 shadow-xl flex items-center justify-center mb-3 sm:mb-6 animate-pop-zoom shadow-blue-500/10 overflow-hidden relative" style={{ animationDelay: '400ms' }}>
                      <img src="YOUR_REAL_IMAGE_LINK_HERE" className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Publish" />
                    </div>
                    <h3 className="font-black text-slate-900 text-[11px] sm:text-lg mb-1 sm:mb-2 leading-tight">3. Publish & Earn</h3>
                    <p className="text-slate-500 text-[9px] sm:text-sm font-medium px-1 sm:px-4 leading-tight">Post to your bio page or share with your audience.</p>
                  </div>
                </RevealOnScroll>

              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 7. EVERYTHING TO GROW (Horizontal Compact) */}
        {/* ========================================== */}
        <section id="dashboard" className="py-15 px-4 bg-[#f8fafc]">
           <div className="max-w-7xl mx-auto">
             <RevealOnScroll>
               <div className="text-center mb-12">
                 <h2 className="text-3xl font-black text-slate-900">Everything You Need to Grow.</h2>
                 <p className="text-slate-500 font-medium">A powerful control center built for professional creators.</p>
               </div>
             </RevealOnScroll>
             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { t: "Link Generator", d: "Generate direct links instantly. Supports multiple link creations at once to save your time.", img: "https://cdn-icons-png.flaticon.com/128/10332/10332309.png" },
                  { t: "Reliable Tracking", d: "Secured click & order tracking.", img: "https://cdn-icons-png.flaticon.com/128/3121/3121538.png" },
                  { t: "Deep Analytics", d: "Track AOV & real-time clicks.", img: "https://cdn-icons-png.flaticon.com/128/2422/2422801.png" },
                  { t: "Fast Payouts", d: "Withdraw via UPI or Bank.", img: "https://cdn-icons-png.flaticon.com/128/10453/10453676.png" }
                ].map((f, i) => (
                  <RevealOnScroll key={i} delay={i * 50}>
                    <div className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-slate-100 shadow-sm hover:shadow-md transition-all h-full">
                      <img src={f.img} className="w-10 h-10 object-contain" alt={f.t} />
                      <div className="w-[1px] h-10 bg-slate-200"></div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm">{f.t}</h3>
                        <p className="text-slate-500 text-xs font-medium">{f.d}</p>
                      </div>
                    </div>
                  </RevealOnScroll>
                ))}
             </div>
           </div>
        </section>

        {/* ========================================== */}
        {/* 8. INSTAGRAM BREAKOUT (Clean Image Space) */}
        {/* ========================================== */}
        <section id="redirection" className="py-13 px-4 bg-white border-y border-slate-100">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                 <RevealOnScroll>
                   <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6">Escape the Instagram Browser Trap.</h2>
                   <p className="text-slate-600 font-medium mb-8">In-app browsers kill conversions. We use <strong className="text-slate-900">smart breakout technology</strong>. When followers click, we force open their native Chrome/Safari or directly open the Shopping App (Myntra/Amazon).</p>
                 </RevealOnScroll>
                 <ul className="space-y-4 mb-8">
                   {["Flawless User Experience", "Prevents Login Drops", "Higher Conversion Rates"].map((t, i) => (
                     <RevealOnScroll key={i} delay={i * 100}>
                       <li className="flex items-center gap-3 font-bold text-slate-700">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>
                          </div>
                          {t}
                       </li>
                     </RevealOnScroll>
                   ))}
                 </ul>
              </div>
              <RevealOnScroll delay={200} className="flex-1 w-full">
                {/* FIX: Removed fixed heights. Added max-h to make it compact and remove top/bottom gaps */}
                <div className="w-full flex items-center justify-center mt-6 md:mt-0">
                   <img 
                     src="https://cdn.prod.website-files.com/666285153da630124c201ec0/6668bcbd672bf1109ddbb93f_1-04%20(1)-p-800.webp" 
                     className="w-full max-w-sm h-auto max-h-[300px] sm:max-h-[400px] object-contain drop-shadow-2xl" 
                     alt="App Redirection" 
                   />
                </div>
              </RevealOnScroll>
           </div>
        </section>

        {/* ========================================== */}
        {/* 9. TESTIMONIALS (Restored horizontal scroll) */}
        {/* ========================================== */}
        <section id="testimonials" className="py-13 bg-[#f8fafc] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-12 items-center">
            
            <RevealOnScroll>
              <div className="w-full md:w-1/3 text-center md:text-left">
                <div className="flex justify-center md:justify-start items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(star => <svg key={star} className="w-6 h-6 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4">Loved by Top Creators.</h2>
                <p className="text-slate-500 font-medium">Join thousands of creators who switched to FavyLink for better conversions.</p>
              </div>
            </RevealOnScroll>

            <div className="w-full md:w-2/3 flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-6 pb-8 pt-4 px-4 -mx-4 md:mx-0">
              {[
                { name: "Rahul Tech", role: "Tech Reviewer", img: "https://i.pravatar.cc/150?img=11", text: "The auto-post feature is magic. I just set my niche and my earnings went up by 40% without doing extra work." },
                { name: "Neha Styles", role: "Fashion Blogger", img: "https://i.pravatar.cc/150?img=5", text: "Finally, a bio link that actually looks like a premium store. My followers love the sliding banners!" },
                { name: "Fit with Amit", role: "Fitness Coach", img: "https://i.pravatar.cc/150?img=12", text: "The app redirection saved my conversions. People were getting stuck in Insta browser before, not anymore." }
              ].map((review, i) => (
                <div key={i} className="min-w-[280px] sm:min-w-[320px] bg-white p-6 rounded-3xl border border-slate-200 snap-center shadow-sm hover:-translate-y-2 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={review.img} className="w-12 h-12 rounded-full object-cover" alt={review.name} />
                    <div>
                      <h4 className="font-bold text-slate-900">{review.name}</h4>
                      <p className="text-xs text-slate-500 font-bold">{review.role}</p>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">"{review.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 10. FREE PLAN SECTION (Restored Blue Box) */}
        {/* ========================================== */}
        <section id="pricing" className="py-11 px-4 bg-white">
          <RevealOnScroll>
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-cyan-400 rounded-[3rem] p-8 sm:p-14 text-center text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
              
              <div className="relative z-10">
                <span className="bg-white/20 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 inline-block shadow-sm backdrop-blur-sm">100% FREE FOREVER</span>
                <h2 className="text-4xl sm:text-6xl font-black mb-6 leading-tight">Start Monetizing Today.</h2>
                <p className="text-blue-50 font-medium text-sm sm:text-lg max-w-2xl mx-auto mb-10">We believe creators shouldn't pay to earn. Get all premium storefront features and affiliate tools completely free.</p>
                <button 
  suppressHydrationWarning
  onClick={() => router.push('/register')}
  className="inline-block bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-sm sm:text-base shadow-xl hover:scale-105 transition-transform"
>
  Start For Free
</button>
              </div>
            </div>
          </RevealOnScroll>
        </section>

        {/* ========================================== */}
        {/* 11. FAQ ACCORDION */}
        {/* ========================================== */}
        <section id="faq" className="py-20 bg-[#f8fafc] px-4">
           <div className="max-w-3xl mx-auto">
             <RevealOnScroll>
               <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-slate-900 mb-3">Frequently Asked Questions</h2>
                  <p className="text-slate-500 font-bold text-sm">Everything you need to know about FavyLink.</p>
               </div>
             </RevealOnScroll>
             <div className="space-y-3">
               {[
                 { q: "Is FavyLink really free?", a: "Yes, it is 100% free to use for all creators. No hidden subscription fees." },
                 { q: "How do I get paid?", a: "Earnings can be withdrawn directly to your UPI or Bank via NEFT once confirmed." },
                 { q: "Can I add custom links?", a: "Yes, you have full freedom to add any affiliate, social, or custom link." }
               ].map((f, i) => (
                 <RevealOnScroll key={i} delay={i * 100}>
                   <details className="group bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer shadow-sm">
                      <summary className="flex items-center justify-between p-6 font-bold text-slate-900 list-none">
                         {f.q}
                         <span className="transition group-open:rotate-180 text-blue-600">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
                         </span>
                      </summary>
                      <p className="px-6 pb-6 text-slate-500 text-sm font-medium leading-relaxed">{f.a}</p>
                   </details>
                 </RevealOnScroll>
               ))}
             </div>
           </div>
        </section>

        {/* ========================================== */}
        {/* 12. PREMIUM BLACK FOOTER */}
        {/* ========================================== */}
        <footer className="bg-[#0a0a0a] pt-18 pb-8 px-4 rounded-t-[3rem] text-white mt-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
              
              {/* Brand Col */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  {/* UPDATE: Image Icon added */}
                  <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center p-1 overflow-hidden">
                    <img src="/icon-192x192.png" className="w-full h-full object-contain" alt="FL" />
                  </div>
                  {/* UPDATE: Link text is now blue */}
                  <span className="font-extrabold text-2xl tracking-tight">
                    Favy<span className="text-blue-500">Link</span>
                  </span>
                </div>
                <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
                  The ultimate hub for professional creators. Build a premium storefront, automate your affiliate deals, and multiply your earnings effortlessly.
                </p>
                {/* Social Icons (SVGs) */}
                <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 bg-white/5 hover:bg-cyan-500 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/5 hover:bg-cyan-500 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                </div>
              </div>

              {/* Links Col */}
              <div>
                <h4 className="font-bold mb-6 text-white">Legal</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Terms & Conditions</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Refund Policy</a></li>
                </ul>
              </div>

              {/* Contact Col */}
              <div>
                <h4 className="font-bold mb-6 text-white">Get in Touch</h4>
                <p className="text-sm text-slate-400 mb-4">Have questions? We're here to help you grow.</p>
                <a href="mailto:support@favylink.com" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Send Email
                </a>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
              <p>© {new Date().getFullYear()} FavyLink. All rights reserved.</p>
              <p>Designed for Professional Creators.</p>
            </div>
          </div>
        </footer>
        </div>
    </div>
  );
}

export default function LandingPageWithProvider() {
  return (
    <SessionProvider>
      <LandingContent />
    </SessionProvider>
  );
}