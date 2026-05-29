"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";

function LandingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-redirect if logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/creators");
    }
  }, [status, router]);

  // Smooth Scroll
  const scrollToSection = (id) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* CSS for Smooth Marquee Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: 200%;
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />

      {/* ========================================== */}
      {/* 1. PREMIUM FIXED NAVBAR */}
      {/* ========================================== */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-50 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => scrollToSection("home")}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              FL
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">FavyLink</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/login" className="text-sm font-black text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
              Log in
            </Link>
            <Link href="/register" className="bg-slate-900 hover:bg-indigo-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-slate-900/10 hover:shadow-indigo-600/30">
              Sign Up Free
            </Link>
            
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 -mr-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* FULLSCREEN MENU OVERLAY */}
      <div className={`fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-40 transition-all duration-500 flex flex-col justify-center items-center gap-8 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={() => scrollToSection("home")} className="text-4xl font-black text-white hover:text-indigo-400 transition-colors">Home</button>
        <button onClick={() => scrollToSection("problem-solution")} className="text-4xl font-black text-white hover:text-emerald-400 transition-colors">Why Us?</button>
        <button onClick={() => scrollToSection("storefront")} className="text-4xl font-black text-white hover:text-indigo-400 transition-colors">Premium Store</button>
        <button onClick={() => scrollToSection("auto-post")} className="text-4xl font-black text-white hover:text-emerald-400 transition-colors">Auto-Post</button>
        <button onClick={() => scrollToSection("tech-edge")} className="text-4xl font-black text-white hover:text-indigo-400 transition-colors">Smart Redirect</button>
        <div className="mt-8 flex gap-4">
          <Link href="/login" className="bg-white/10 text-white px-10 py-4 rounded-2xl font-bold border border-white/20 hover:bg-white/20 transition-colors">Log In</Link>
        </div>
      </div>

      <div className="pt-20">
        
        {/* ========================================== */}
        {/* 2. HERO SECTION (The Hook) */}
        {/* ========================================== */}
        <section id="home" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-8">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black text-emerald-700 tracking-widest uppercase">Built-in Affiliate Program</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
              Your Link in Bio.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
                Smarter. Premium.<br/>And Profitable.
              </span>
            </h1>

            <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Turn your standard bio link into a beautiful, zero-coding storefront. We auto-sync deals from <strong className="text-slate-800">500+ premium brands</strong> to multiply your earnings while you sleep.
            </p>

            <div className="w-full max-w-lg bg-white p-2.5 rounded-2xl shadow-2xl shadow-indigo-900/10 border border-slate-200 flex items-center transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 mb-8 mx-auto lg:mx-0 hover:-translate-y-1 duration-300">
              <div className="pl-4 pr-1 text-slate-400 font-bold text-lg hidden sm:block">favylink.com/</div>
              <input 
                type="text" 
                placeholder="yourname" 
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="flex-1 bg-transparent outline-none font-bold text-lg text-slate-900 w-full min-w-0"
              />
              <Link 
                href={`/register?username=${username}`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-black text-sm sm:text-base whitespace-nowrap transition-transform active:scale-95 shadow-lg shadow-indigo-600/30 ml-2"
              >
                Claim Link
              </Link>
            </div>
            
            <div className="flex items-center gap-4 text-sm font-bold text-slate-500 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" src="https://i.pravatar.cc/100?img=1" alt="user" />
                <img className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" src="https://i.pravatar.cc/100?img=5" alt="user" />
                <img className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" src="https://i.pravatar.cc/100?img=9" alt="user" />
              </div>
              <p>Join 10,000+ top creators</p>
            </div>
          </div>

          <div className="flex-1 w-full flex justify-center lg:justify-end relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-indigo-300/40 via-emerald-200/40 to-purple-200/40 blur-3xl rounded-full z-0"></div>
            
            <div className="relative w-[320px] h-[640px] bg-slate-900 border-[12px] border-slate-900 rounded-[3rem] shadow-2xl z-10 overflow-hidden transform lg:-rotate-3 hover:rotate-0 transition-all duration-700 hover:scale-105">
              <div className="absolute top-0 inset-x-0 h-7 bg-slate-900 rounded-b-3xl w-36 mx-auto z-20"></div>
              <div className="w-full h-full bg-[#0a0a0a] pt-14 pb-6 px-5 flex flex-col relative overflow-y-auto [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-16 h-16 rounded-full border-[3px] border-emerald-500 p-0.5">
                    <img src="https://i.pravatar.cc/150?img=47" className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg leading-tight">Priya Styles <span className="text-blue-400">✓</span></h3>
                    <p className="text-white/50 text-xs font-bold">Fashion & Tech Deals</p>
                  </div>
                </div>

                <div className="w-full h-24 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl mb-6 flex items-center justify-center text-white font-black shadow-lg shadow-purple-900/50 relative overflow-hidden">
                   <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                   Mega Sale Live Now!
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-2xl p-3 border border-white/5">
                    <div className="w-full aspect-square bg-white/5 rounded-xl mb-3 flex items-center justify-center text-3xl">👗</div>
                    <div className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded max-w-fit mb-1">MYNTRA</div>
                    <p className="text-white text-xs font-bold truncate">Zara Red Dress</p>
                    <button className="w-full mt-2 bg-emerald-500 text-slate-900 text-xs font-black py-1.5 rounded-lg">Shop Now</button>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3 border border-white/5">
                    <div className="w-full aspect-square bg-white/5 rounded-xl mb-3 flex items-center justify-center text-3xl">📱</div>
                    <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded max-w-fit mb-1">AMAZON</div>
                    <p className="text-white text-xs font-bold truncate">iPhone 15 Pro</p>
                    <button className="w-full mt-2 bg-emerald-500 text-slate-900 text-xs font-black py-1.5 rounded-lg">Shop Now</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 3. BRANDS MARQUEE (The Trust Builder) */}
        {/* ========================================== */}
        <section className="py-10 bg-white border-y border-slate-200 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 text-center mb-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Monetize directly with 500+ Trusted Brands</p>
          </div>
          {/* Sliding Marquee Container */}
          <div className="relative w-full overflow-hidden">
            <div className="animate-marquee flex items-center justify-around gap-12 px-6">
              {/* NOTE: Replace the src with your actual logo URLs */}
              <div className="flex items-center gap-16 md:gap-32 w-1/2 justify-around opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                <h3 className="text-3xl font-black text-slate-800">AMAZON</h3>
                <h3 className="text-3xl font-black text-blue-600">FLIPKART</h3>
                <h3 className="text-3xl font-black text-pink-600">MYNTRA</h3>
                <h3 className="text-3xl font-black text-emerald-600">AJIO</h3>
                <h3 className="text-3xl font-black text-orange-500">SHOPSY</h3>
              </div>
              {/* Duplicate for infinite loop illusion */}
              <div className="flex items-center gap-16 md:gap-32 w-1/2 justify-around opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                <h3 className="text-3xl font-black text-slate-800">AMAZON</h3>
                <h3 className="text-3xl font-black text-blue-600">FLIPKART</h3>
                <h3 className="text-3xl font-black text-pink-600">MYNTRA</h3>
                <h3 className="text-3xl font-black text-emerald-600">AJIO</h3>
                <h3 className="text-3xl font-black text-orange-500">SHOPSY</h3>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 4. PROBLEM VS SOLUTION (The Reality Check) */}
        {/* ========================================== */}
        <section id="problem-solution" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-4">Old Bio Links are Dead.</h2>
              <p className="text-xl text-slate-500 font-medium">Stop sending your followers to a boring list of static buttons.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* The Old Way */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="text-slate-400 font-black tracking-widest uppercase text-sm mb-8">The Boring Way</div>
                <div className="w-64 bg-slate-50 border-8 border-slate-200 rounded-[2.5rem] p-6 shadow-sm flex flex-col gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-2"></div>
                  <div className="w-full h-12 bg-slate-200 rounded-xl"></div>
                  <div className="w-full h-12 bg-slate-200 rounded-xl"></div>
                  <div className="w-full h-12 bg-slate-200 rounded-xl"></div>
                </div>
                <p className="mt-8 text-slate-500 font-bold text-center">Static, Non-monetized, Boring.</p>
              </div>

              {/* The FavyLink Way */}
              <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 flex flex-col items-center shadow-2xl shadow-indigo-900/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[10px] px-4 py-1.5 rounded-bl-xl uppercase tracking-wider shadow-lg">Premium</div>
                <div className="text-indigo-600 font-black tracking-widest uppercase text-sm mb-8">The FavyLink Way</div>
                <div className="w-64 bg-slate-900 border-8 border-slate-800 rounded-[2.5rem] p-6 shadow-2xl flex flex-col gap-3">
                  <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-orange-400 rounded-full mx-auto mb-2 p-1"><div className="w-full h-full bg-slate-800 rounded-full"></div></div>
                  <div className="w-full h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl relative flex items-center justify-center"><span className="text-white font-bold text-xs">Auto Banners</span></div>
                  <div className="flex gap-2">
                    <div className="w-1/2 h-20 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center text-xs text-slate-400">Product</div>
                    <div className="w-1/2 h-20 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center text-xs text-slate-400">Video</div>
                  </div>
                </div>
                <p className="mt-8 text-indigo-900 font-bold text-center">Rich Storefront, Theater Videos & Custom Themes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 5. THE PREMIUM STOREFRONT (Wow Factor) */}
        {/* ========================================== */}
        <section id="storefront" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">A Stunning Storefront.<br/>Zero Coding Required.</h2>
              <p className="text-lg text-slate-500 font-medium">Customize your page in seconds. Give your followers a seamless shopping experience directly from your bio.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-4">🖼️</div>
                  <h3 className="font-bold text-slate-900 mb-2">Auto-Sliding Banners</h3>
                  <p className="text-sm text-slate-500">Showcase fresh deals and brand banners automatically at the top of your page.</p>
               </div>
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-2xl mb-4">🎬</div>
                  <h3 className="font-bold text-slate-900 mb-2">Theater Mode Videos</h3>
                  <p className="text-sm text-slate-500">Embed YouTube/Insta Reels. Display tagged shoppable products right under the video.</p>
               </div>
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-4">🏷️</div>
                  <h3 className="font-bold text-slate-900 mb-2">Rich Product Cards</h3>
                  <p className="text-sm text-slate-500">Add sale timers, coupons, and bold 'Shop Now' buttons to drive urgent sales.</p>
               </div>
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-4">🎨</div>
                  <h3 className="font-bold text-slate-900 mb-2">Premium Themes</h3>
                  <p className="text-sm text-slate-500">One-click theme application. No complex settings, just drop-downs and text boxes.</p>
               </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 6. AUTO-POST DEALS (The Game Changer USP) */}
        {/* ========================================== */}
        <section id="auto-post" className="py-32 bg-slate-900 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-block bg-white/10 border border-white/20 text-emerald-400 font-black text-sm px-4 py-2 rounded-full mb-6 shadow-lg">
              Our Main USP
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Zero-Effort Income.<br/>Meet Auto-Post Deals.</h2>
            <p className="text-xl text-slate-400 font-medium max-w-3xl mx-auto mb-20">
              Stop manually hunting for deals. We push high-converting offers from our built-in affiliate network directly to your page based on your category preference.
            </p>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-slate-800 via-indigo-500 to-slate-800 -translate-y-1/2 z-0"></div>

              <div className="bg-[#111827] p-8 rounded-3xl border border-slate-700 relative z-10 shadow-2xl">
                <div className="w-16 h-16 bg-slate-800 border border-slate-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">⚙️</div>
                <h3 className="text-white font-bold text-xl mb-2">1. Set Your Niche</h3>
                <p className="text-slate-400 text-sm">Select Fashion, Tech, Beauty, etc., in your dashboard settings.</p>
              </div>

              <div className="bg-indigo-900 p-8 rounded-3xl border border-indigo-500 relative z-10 shadow-2xl shadow-indigo-900/50 transform md:-translate-y-4">
                <div className="w-16 h-16 bg-indigo-600 border border-indigo-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 animate-pulse">🤖</div>
                <h3 className="text-white font-bold text-xl mb-2">2. FavyLink Curates</h3>
                <p className="text-indigo-200 text-sm">We find the hottest deals and auto-generate your affiliate links.</p>
              </div>

              <div className="bg-[#111827] p-8 rounded-3xl border border-slate-700 relative z-10 shadow-2xl">
                <div className="w-16 h-16 bg-emerald-900 border border-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 text-emerald-400">💸</div>
                <h3 className="text-white font-bold text-xl mb-2">3. Auto-Published</h3>
                <p className="text-slate-400 text-sm">Deals appear on your page. When followers shop, you get paid. Effortless.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 7. THE TECH EDGE (Smart Redirection) */}
        {/* ========================================== */}
        <section id="tech-edge" className="py-24 bg-indigo-50 border-b border-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1">
                <div className="text-indigo-600 font-black tracking-widest uppercase text-sm mb-4">Sales Booster Tech</div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">No Redirection Annoyance.</h2>
                <p className="text-lg text-slate-600 font-medium mb-8">
                  Instagram's in-app browser kills conversions. We use <strong className="text-slate-900">smart breakout logic</strong>. When a user clicks, we force open their native Chrome/Safari or directly open the Shopping App (Myntra/Amazon).
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 font-bold text-slate-700">
                    <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">✓</span> Flawless User Experience
                  </li>
                  <li className="flex items-center gap-3 font-bold text-slate-700">
                    <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">✓</span> Prevents Login Drops
                  </li>
                  <li className="flex items-center gap-3 font-bold text-slate-700">
                    <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">✓</span> Massively Higher Conversion Rates
                  </li>
                </ul>
              </div>

              <div className="flex-1 w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
                 <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-2xl opacity-60">
                       <span className="font-bold text-rose-800">Standard Link: Stuck in Insta Browser</span>
                       <span className="text-2xl">📉</span>
                    </div>
                    <div className="flex justify-center -my-3 z-10"><span className="bg-white px-2 text-slate-400 font-black text-xs uppercase">VS</span></div>
                    <div className="flex items-center justify-between p-6 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30 transform scale-105">
                       <div>
                         <span className="font-black text-white block text-lg">FavyLink: Native Chrome / App</span>
                         <span className="text-indigo-200 text-xs font-bold">Direct Redirection</span>
                       </div>
                       <span className="text-3xl animate-bounce">🚀</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 8. DASHBOARD FEATURES (Control Center) */}
        {/* ========================================== */}
        <section className="py-24 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-black text-slate-900 mb-6">Everything You Need to Grow.</h2>
            <p className="text-xl text-slate-500 font-medium max-w-3xl mx-auto mb-16">
              A powerful control center built for professional creators.
            </p>

            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-colors">
                <div className="text-4xl mb-4">🔗</div>
                <h3 className="font-black text-slate-900 text-xl mb-2">Easy Link Generator</h3>
                <p className="text-slate-500 font-medium text-sm">Generate or post direct links instantly. Uses Amazon Auto-Tag and supports multiple link generations at once.</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-colors">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="font-black text-slate-900 text-xl mb-2">Transparent Analytics</h3>
                <p className="text-slate-500 font-medium text-sm">Detailed conversion data. Know exactly what's selling, track your AOV, and view estimated earnings in real-time.</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-emerald-400 transition-colors">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="font-black text-slate-900 text-xl mb-2">Transparent Payouts</h3>
                <p className="text-slate-500 font-medium text-sm">Easy withdrawals directly to your Bank Account (NEFT) or UPI. Track your confirmed commissions effortlessly.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 9. FINAL CTA (Footer) */}
        {/* ========================================== */}
        <section className="py-32 bg-slate-900 text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Ready for Effortless Profit?</h2>
            <p className="text-xl text-slate-400 font-medium mb-12">Setup takes less than 2 minutes. Free forever.</p>
            
            <div className="w-full max-w-lg bg-white/10 p-2.5 rounded-2xl border border-white/20 flex items-center mx-auto focus-within:border-emerald-500 transition-all">
              <div className="pl-4 pr-1 text-slate-400 font-bold text-lg hidden sm:block">favylink.com/</div>
              <input 
                type="text" 
                placeholder="yourname" 
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="flex-1 bg-transparent outline-none font-bold text-lg text-white w-full min-w-0 placeholder:text-slate-500"
              />
              <Link 
                href={`/register?username=${username}`}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-xl font-black text-sm sm:text-base whitespace-nowrap transition-transform active:scale-95 shadow-lg shadow-emerald-500/20 ml-2"
              >
                Claim Link Free
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// 2. Parent Component jo SessionProvider add karega
export default function LandingPageWithProvider() {
  return (
    <SessionProvider>
      <LandingContent />
    </SessionProvider>
  );
}