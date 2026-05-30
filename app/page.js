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
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
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

  // Auto-redirect if logged in
  useEffect(() => {
    if (status === "authenticated") router.push("/creators");
  }, [status, router]);

  // Tab Slider Logic (Auto-play)
  const tabs = [
    { 
      id: "01", title: "Services", 
      bgImg: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400&auto=format&fit=crop", // Demo Insta BG
      fgImg: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=400&auto=format&fit=crop", // Demo FavyLink UI
      text: "Turn followers into customers instantly. Let them choose and buy directly from your bio."
    },
    { 
      id: "02", title: "Creators", 
      bgImg: "https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=400&auto=format&fit=crop", 
      fgImg: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=400&auto=format&fit=crop", 
      text: "Showcase your portfolio, latest videos, and top affiliate products in one premium hub."
    },
    { 
      id: "03", title: "Store", 
      bgImg: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop", 
      fgImg: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=400&auto=format&fit=crop", 
      text: "Automate your sales. Curated deals fetch automatically and boost your daily conversions."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 4000); // Changes every 4 seconds
    return () => clearInterval(interval);
  }, [tabs.length]);

  const scrollToSection = (id) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans overflow-x-hidden selection:bg-blue-500 selection:text-white pb-20">
      
      {/* Skeleton Animation CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes skeleton-run {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .skeleton-bar::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent);
          animation: skeleton-run 2s infinite linear;
        }
      `}} />

      {/* ========================================== */}
      {/* 1. COMPACT GLASS BLUE NAVBAR (Mobile First) */}
      {/* ========================================== */}
      <nav className="fixed top-0 w-full bg-blue-900/40 backdrop-blur-lg border-b border-blue-500/20 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo & Name */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection("home")}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md">
              FL
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">FavyLink</span>
          </div>

          {/* Right Side: Login & Menu */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all backdrop-blur-sm">
              Log in / Sign up
            </Link>
            
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* MENU OVERLAY */}
      <div className={`fixed inset-0 bg-blue-950/95 backdrop-blur-2xl z-40 transition-all duration-500 flex flex-col justify-center items-center gap-6 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {['Home', 'Storefront', 'Auto-Post', 'Partners', 'Testimonials', 'Pricing', 'FAQ'].map((item) => (
          <button key={item} onClick={() => scrollToSection(item.toLowerCase().replace(' ', '-'))} className="text-2xl sm:text-3xl font-black text-white hover:text-cyan-400 transition-colors">
            {item}
          </button>
        ))}
      </div>

      <div className="pt-16">
        
        {/* ========================================== */}
        {/* 2. HERO SECTION & INTERACTIVE TAB SLIDER */}
        {/* ========================================== */}
        <section id="home" className="bg-gradient-to-b from-blue-900 to-blue-950 pt-12 pb-24 px-4 overflow-hidden rounded-b-[2.5rem] shadow-2xl">
          <div className="max-w-5xl mx-auto text-center">
            
            <RevealOnScroll>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                Make your <span className="text-cyan-400">Favourite Link</span> a Premium Storefront.
              </h1>
              <p className="text-blue-200 text-lg sm:text-xl font-medium mb-12 max-w-3xl mx-auto">
                Turn your standard bio link into a beautiful, zero-coding storefront. Auto-sync deals from 500+ brands and multiply your earnings while you sleep with smart, easy conversions.
              </p>
            </RevealOnScroll>

            {/* TABBED MOCKUP SLIDER (Taplink Style) */}
            <RevealOnScroll delay={200}>
              <div className="w-full max-w-4xl mx-auto mt-8">
                {/* Tabs */}
                <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden border-b border-blue-500/30 mb-8">
                  {tabs.map((tab, index) => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(index)}
                      className={`flex-1 min-w-[120px] text-left pb-4 px-4 transition-all duration-300 border-b-2 ${activeTab === index ? 'border-cyan-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                    >
                      <span className="block text-cyan-400 font-black text-sm mb-1">{tab.id}</span>
                      <span className="block text-white font-bold text-base sm:text-lg">{tab.title}</span>
                    </button>
                  ))}
                </div>

                {/* Animated Image Section */}
                <div className="relative h-[500px] sm:h-[600px] w-full flex justify-center items-end pb-8">
                  {tabs.map((tab, index) => (
                    <div 
                      key={`img-${tab.id}`} 
                      className={`absolute inset-0 w-full h-full flex justify-center items-end transition-all duration-700 ease-in-out ${activeTab === index ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-12 z-0 pointer-events-none'}`}
                    >
                      {/* Background (Instagram Mockup) */}
                      <div className="absolute top-0 w-[240px] sm:w-[280px] h-[400px] sm:h-[480px] bg-slate-200 rounded-[2rem] shadow-xl overflow-hidden -ml-20 sm:-ml-40 mt-10 opacity-70 transform scale-90">
                        <img src={tab.bgImg} alt="Instagram Layout" className="w-full h-full object-cover" />
                      </div>
                      
                      {/* Foreground (FavyLink Premium Page) */}
                      <div className="relative w-[260px] sm:w-[320px] h-[480px] sm:h-[560px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white ml-20 sm:ml-40 z-20">
                        <img src={tab.fgImg} alt="FavyLink Layout" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black/80 to-transparent"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Changing Text */}
                <div className="h-20 mt-6 relative overflow-hidden">
                   {tabs.map((tab, index) => (
                      <p key={`text-${tab.id}`} className={`absolute w-full text-blue-200 text-sm sm:text-lg font-medium transition-all duration-500 ${activeTab === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {tab.text}
                      </p>
                   ))}
                </div>

              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ========================================== */}
        {/* 3. A STUNNING STOREFRONT */}
        {/* ========================================== */}
        <section id="storefront" className="py-24 px-4 max-w-7xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">A Stunning Storefront.<br/>Zero Coding Required.</h2>
              <p className="text-slate-500 font-medium">Customize your page in seconds. Seamless shopping directly from your bio.</p>
            </div>
          </RevealOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Auto-Sliding Banners", desc: "Showcase fresh deals automatically at the top of your page.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
              { title: "Theater Mode Videos", desc: "Embed YouTube/Reels. Product links show right under the video.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
              { title: "Rich Product Cards", desc: "Add sale timers, coupons, and bold 'Shop Now' buttons.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /> },
              { title: "Premium Themes", desc: "One-click background themes. No complex settings, just drop-downs.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /> }
            ].map((feature, i) => (
              <RevealOnScroll key={i} delay={i * 100}>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow h-full">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{feature.icon}</svg>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* ========================================== */}
        {/* 4. ZERO EFFORT INCOME (Auto Post) */}
        {/* ========================================== */}
        <section id="auto-post" className="py-24 bg-slate-900 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <RevealOnScroll>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Zero-Effort Income.<br/>Meet Auto-Post Deals.</h2>
              
              {/* LARGE DEMO IMAGE PLACEHOLDER */}
              <div className="w-full max-w-4xl mx-auto h-[250px] sm:h-[400px] bg-slate-800 rounded-3xl mt-10 mb-16 border border-slate-700 flex items-center justify-center overflow-hidden relative shadow-2xl">
                {/* Replace src with your actual large PNG link later */}
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop" alt="Auto Post Dashboard" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-left">
                   <p className="text-cyan-400 font-black text-sm tracking-widest uppercase">Automated Workflow</p>
                   <p className="text-white font-bold text-xl">Deals fetch & post while you sleep.</p>
                </div>
              </div>
            </RevealOnScroll>

            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Set Your Niche", desc: "Select Fashion, Tech, Beauty in your dashboard." },
                { step: "2", title: "We Curate Deals", desc: "We fetch hot deals and auto-generate links." },
                { step: "3", title: "Auto-Published", desc: "Deals appear on your page. You earn on autopilot." }
              ].map((item, i) => (
                <RevealOnScroll key={i} delay={i * 100}>
                  <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-lg mb-4 mx-auto">{item.step}</div>
                    <h3 className="text-white font-bold mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 5. CLAIM PREMIUM LINK BAR (Modern Skeleton) */}
        {/* ========================================== */}
        <section className="py-12 px-4 max-w-4xl mx-auto -mt-10 relative z-20">
          <RevealOnScroll>
            <div className="skeleton-bar relative bg-white p-2 rounded-2xl shadow-2xl border border-slate-200 flex items-center overflow-hidden">
              <div className="pl-4 pr-1 text-slate-400 font-bold text-sm sm:text-lg hidden sm:block relative z-10">favylink.com/</div>
              <div className="pl-3 pr-1 text-slate-400 font-bold text-sm sm:text-lg sm:hidden relative z-10">fl.com/</div>
              <input 
                type="text" 
                placeholder="yourname" 
                className="flex-1 bg-transparent outline-none font-bold text-sm sm:text-lg text-slate-900 w-full min-w-0 relative z-10"
              />
              <button className="bg-slate-900 text-white px-4 sm:px-8 py-3 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap relative z-10 hover:bg-blue-600 transition-colors">
                Claim Branded Link
              </button>
            </div>
          </RevealOnScroll>
        </section>

      </div>
      {/* ========================================== */}
        {/* 6. AFFILIATE PARTNERS (2-Way Marquee) */}
        {/* ========================================== */}
        <section id="partners" className="py-16 overflow-hidden bg-white">
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
            <div className="animate-marquee-left flex items-center gap-6 px-3">
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={`L-${i}`} className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* DEMO IMAGE - Replace src later */}
                  <img src={`https://logo.clearbit.com/amazon.com`} alt="Brand" className="w-12 sm:w-16 h-auto opacity-70 grayscale hover:grayscale-0 transition-all" onError={(e) => e.target.style.display='none'} />
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Right to Left */}
          <div className="relative w-full overflow-hidden">
            <div className="animate-marquee-right flex items-center gap-6 px-3">
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={`R-${i}`} className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* DEMO IMAGE - Replace src later */}
                  <img src={`https://logo.clearbit.com/myntra.com`} alt="Brand" className="w-12 sm:w-16 h-auto opacity-70 grayscale hover:grayscale-0 transition-all" onError={(e) => e.target.style.display='none'} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 7. EVERYTHING YOU NEED TO GROW */}
        {/* ========================================== */}
        <section className="py-24 bg-[#f8fafc] px-4 max-w-7xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Everything You Need to Grow.</h2>
              <p className="text-slate-500 font-medium">A powerful control center built for professional creators.</p>
            </div>
          </RevealOnScroll>

          <div className="grid sm:grid-cols-3 gap-6">
            <RevealOnScroll delay={100}>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-blue-300 transition-colors h-full shadow-sm hover:shadow-lg">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                </div>
                <h3 className="font-black text-slate-900 text-xl mb-2">Smart Link Generator</h3>
                <p className="text-slate-500 font-medium text-sm">Generate direct links instantly. Supports multiple link creations at once to save your time.</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={200}>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-cyan-400 transition-colors h-full shadow-sm hover:shadow-lg">
                <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 className="font-black text-slate-900 text-xl mb-2">Detailed Analytics</h3>
                <p className="text-slate-500 font-medium text-sm">Transparent data. Track your clicks, confirmed orders, and estimated earnings in real-time.</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={300}>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-blue-400 transition-colors h-full shadow-sm hover:shadow-lg">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="font-black text-slate-900 text-xl mb-2">Easy Payouts</h3>
                <p className="text-slate-500 font-medium text-sm">Withdraw your earnings directly to your Bank Account (NEFT) or UPI effortlessly.</p>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ========================================== */}
        {/* 8. SMART REDIRECT (Escape Browser) */}
        {/* ========================================== */}
        <section className="py-24 bg-blue-50/50 border-y border-blue-100">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
            <RevealOnScroll>
              <div className="flex-1">
                <div className="inline-block bg-blue-100 text-blue-700 font-black text-xs px-3 py-1 rounded-full mb-4">Sales Booster</div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Escape the Instagram Browser Trap.</h2>
                <p className="text-slate-600 font-medium mb-6">
                  In-app browsers kill conversions. We use <strong className="text-slate-900">smart breakout technology</strong>. When followers click, we force open their native Chrome/Safari or directly open the Shopping App (Myntra/Amazon).
                </p>
                <ul className="space-y-3 mb-8 sm:mb-0">
                  {['Flawless User Experience', 'Prevents Login Drops', 'Higher Conversion Rates'].map((li, i) => (
                    <li key={i} className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                      <div className="w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center text-white"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                      {li}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={200}>
              <div className="flex-1 w-full bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-slate-200">
                 <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                       <span className="font-bold text-slate-500 text-sm">Standard Link: Stuck in Insta</span>
                       <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                    </div>
                    <div className="flex justify-center -my-3 z-10"><span className="bg-white px-3 text-slate-300 font-black text-xs uppercase">VS</span></div>
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/30 transform scale-105">
                       <div>
                         <span className="font-black text-white block">FavyLink: Native App</span>
                         <span className="text-blue-100 text-xs font-bold">Direct Redirection</span>
                       </div>
                       <svg className="w-8 h-8 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                 </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ========================================== */}
        {/* 9. TESTIMONIALS (Trustpilot Style Scroll) */}
        {/* ========================================== */}
        <section id="testimonials" className="py-24 bg-white overflow-hidden">
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

            {/* Horizontal Scroll Cards (Modern Stack) */}
            <div className="w-full md:w-2/3 flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-6 pb-8 pt-4 px-4 -mx-4 md:mx-0">
              {[
                { name: "Rahul Tech", role: "Tech Reviewer", img: "https://i.pravatar.cc/150?img=11", text: "The auto-post feature is magic. I just set my niche and my earnings went up by 40% without doing extra work." },
                { name: "Neha Styles", role: "Fashion Blogger", img: "https://i.pravatar.cc/150?img=5", text: "Finally, a bio link that actually looks like a premium store. My followers love the sliding banners!" },
                { name: "Fit with Amit", role: "Fitness Coach", img: "https://i.pravatar.cc/150?img=12", text: "The app redirection saved my conversions. People were getting stuck in Insta browser before, not anymore." }
              ].map((review, i) => (
                <div key={i} className="min-w-[280px] sm:min-w-[320px] bg-slate-50 p-6 rounded-3xl border border-slate-200 snap-center shadow-sm hover:-translate-y-2 transition-transform duration-300">
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
        {/* 10. FREE PLAN SECTION */}
        {/* ========================================== */}
        <section id="pricing" className="py-20 px-4">
          <RevealOnScroll>
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-cyan-500 rounded-[3rem] p-8 sm:p-12 text-center text-white shadow-2xl shadow-blue-500/30">
              <span className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 inline-block">100% Free Forever</span>
              <h2 className="text-4xl sm:text-5xl font-black mb-6">Start Monetizing Today.</h2>
              <p className="text-blue-100 font-medium max-w-2xl mx-auto mb-10">We believe creators shouldn't pay to earn. Get all premium storefront features and affiliate tools completely free.</p>
              <Link href="/register" className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-black text-lg shadow-lg hover:scale-105 transition-transform">
                Start For Free
              </Link>
            </div>
          </RevealOnScroll>
        </section>

        {/* ========================================== */}
        {/* 11. FAQ ACCORDION */}
        {/* ========================================== */}
        <section id="faq" className="py-24 bg-slate-50 px-4">
          <div className="max-w-3xl mx-auto">
            <RevealOnScroll>
              <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
            </RevealOnScroll>
            
            <div className="space-y-4">
              {[
                { q: "Is FavyLink really free?", a: "Yes, it is 100% free to use. You get access to the premium storefront and all tools without any subscription fees." },
                { q: "How do I get paid?", a: "You can withdraw your confirmed affiliate earnings directly to your Bank Account via NEFT or through UPI. It's fast and transparent." },
                { q: "Can I add my own custom links?", a: "Absolutely! FavyLink gives you complete freedom to add your own custom links alongside the auto-generated affiliate products." }
              ].map((faq, i) => (
                <RevealOnScroll key={i} delay={i * 100}>
                  <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                    <summary className="flex items-center justify-between p-6 font-bold text-slate-900">
                      {faq.q}
                      <span className="transition group-open:rotate-180">
                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                      </span>
                    </summary>
                    <p className="text-slate-500 px-6 pb-6 text-sm">{faq.a}</p>
                  </details>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 12. PREMIUM BLACK FOOTER */}
        {/* ========================================== */}
        <footer className="bg-[#0a0a0a] pt-20 pb-10 px-4 rounded-t-[3rem] text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
              
              {/* Brand Col */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center font-black text-xs">FL</div>
                  <span className="font-extrabold text-2xl tracking-tight">FavyLink</span>
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
  );
}

export default function LandingPageWithProvider() {
  return (
    <SessionProvider>
      <LandingContent />
    </SessionProvider>
  );
}