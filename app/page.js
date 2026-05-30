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

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-blue-500 selection:text-white pb-20">
      
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
        <section id="home" className="bg-[#f1f5f9] pt-10 pb-20 px-4 rounded-b-[2rem]">
          <div className="max-w-5xl mx-auto text-center">
            <RevealOnScroll>
              <h1 className="text-4xl sm:text-6xl font-black text-slate-900 leading-tight mb-5">
                Make your <span className="text-blue-600">Favourite Link</span> Smart & Professional.
              </h1>
              <p className="text-slate-600 text-base sm:text-lg font-medium mb-10 max-w-2xl mx-auto">
                Turn your standard bio link into a beautiful, zero-coding storefront. <span className="font-bold text-blue-600">Auto-Sync Deals</span> from 500+ brands and multiply your earnings while you sleep with smart, easy conversions.
              </p>
            </RevealOnScroll>

            {/* TAB SLIDER */}
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="flex justify-center border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar">
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
        <section id="storefront" className="py-20 px-4 max-w-7xl mx-auto">
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
        {/* 4. ZERO EFFORT INCOME (Clean Image) */}
        {/* ========================================== */}
        <section id="auto-post" className="py-20 bg-slate-900 px-4">
           <div className="max-w-4xl mx-auto text-center">
             <RevealOnScroll>
               <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Zero-Effort Income.</h2>
               <p className="text-slate-400 font-medium text-sm sm:text-base mb-10">
                 Our system fetches the hottest affiliate deals and posts them directly to your storefront. 
                 Setup your niche and watch your earnings grow while you sleep.
               </p>
               {/* Clean Image Area */}
               <div className="w-full aspect-video bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl relative mb-12">
                  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000" className="w-full h-full object-cover opacity-80" />
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
        {/* 5. CLAIM BRANDED LINK BAR (Fixed) */}
        {/* ========================================== */}
        <section className="py-12 px-4 max-w-4xl mx-auto -mt-10 relative z-20">
           <RevealOnScroll>
             <div className="skeleton-bar relative bg-white p-2 rounded-2xl shadow-2xl border border-blue-100 flex items-center overflow-hidden">
                <div className="pl-4 pr-1 text-slate-400 font-bold text-xs sm:text-base hidden sm:block z-10">favylink.com/</div>
                <input 
                  type="text" 
                  placeholder="yourname" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 bg-transparent outline-none font-bold text-sm sm:text-base text-slate-900 px-2 min-w-0 z-10"
                />
                <button 
                  onClick={() => router.push(`/register?username=${username}`)}
                  className="bg-slate-900 text-white px-5 sm:px-8 py-3 rounded-xl font-black text-[10px] sm:text-xs whitespace-nowrap z-10 hover:bg-blue-600 transition-colors"
                >
                  Claim Branded Link
                </button>
             </div>
           </RevealOnScroll>
        </section>


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
        {/* 7. EVERYTHING TO GROW (Horizontal Compact) */}
        {/* ========================================== */}
        <section id="dashboard" className="py-24 px-4 bg-[#f8fafc]">
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
        <section id="redirection" className="py-24 px-4 bg-white border-y border-slate-100">
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
              <RevealOnScroll delay={200}>
                <div className="flex-1 w-full h-[350px] sm:h-[450px] bg-slate-100 rounded-3xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-xl">
                   {/* Clean Image Area for Breakout Illustration */}
                   <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1000" className="w-full h-full object-cover" alt="App Redirection" />
                </div>
              </RevealOnScroll>
           </div>
        </section>

        {/* ========================================== */}
        {/* 9. TESTIMONIALS (Restored horizontal scroll) */}
        {/* ========================================== */}
        <section id="testimonials" className="py-24 bg-[#f8fafc] overflow-hidden">
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
        <section id="pricing" className="py-24 px-4 bg-white">
          <RevealOnScroll>
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-cyan-400 rounded-[3rem] p-8 sm:p-14 text-center text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
              
              <div className="relative z-10">
                <span className="bg-white/20 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 inline-block shadow-sm backdrop-blur-sm">100% FREE FOREVER</span>
                <h2 className="text-4xl sm:text-6xl font-black mb-6 leading-tight">Start Monetizing Today.</h2>
                <p className="text-blue-50 font-medium text-sm sm:text-lg max-w-2xl mx-auto mb-10">We believe creators shouldn't pay to earn. Get all premium storefront features and affiliate tools completely free.</p>
                <button 
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
        <section id="faq" className="py-24 bg-[#f8fafc] px-4">
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
        {/* 12. PREMIUM FOOTER */}
        {/* ========================================== */}
        <footer className="bg-slate-950 pt-20 pb-6 px-4 rounded-t-[3rem]">
           <div className="max-w-7xl mx-auto text-white">
             <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
               <div className="lg:col-span-2">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center p-1 overflow-hidden">
                       <img src="/icon-192x192.png" className="w-full h-full object-contain" alt="FL" />
                    </div>
                    <span className="font-extrabold text-2xl">Favy<span className="text-blue-500">Link</span></span>
                 </div>
                 <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">Built for creators who want to monetize their audience professionally with an all-in-one storefront and automated affiliate deals.</p>
               </div>
               <div>
                  <h4 className="font-black mb-4 text-lg">Company</h4>
                  <ul className="text-slate-400 text-sm space-y-3 font-bold">
                    <li><Link href="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                    <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                    <li><Link href="#" className="hover:text-blue-400 transition-colors">Refund Policy</Link></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-black mb-4 text-lg">Support</h4>
                  <p className="text-sm text-slate-400 mb-4">Need help? We are here for you.</p>
                  <a href="mailto:support@favylink.com" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-600/20">
                    Send Email
                  </a>
               </div>
             </div>
             <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <p>© {new Date().getFullYear()} FAVYLINK. ALL RIGHTS RESERVED.</p>
                <div className="flex gap-4">
                   <a href="#" className="hover:text-white transition-colors">Instagram</a>
                   <a href="#" className="hover:text-white transition-colors">X (Twitter)</a>
                </div>
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