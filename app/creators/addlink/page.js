"use client";
import { useState, useEffect } from "react";
import { useSession, SessionProvider } from "next-auth/react"; 
import { useRouter } from "next/navigation";

// 🚨 EXTENDED CATEGORIES LIST
const ALL_CATEGORIES = [
  "Men's Fashion", "Women's Fashion", "Kids & Baby Clothing", "Sarees & Ethnic Wear",
  "Electronics & Mobiles", "Smartphones & Accessories", "Laptops & Computers", 
  "Home Appliances", "Kitchen Appliances", "Beauty & Grooming", "Skincare & Makeup", 
  "Home Decor", "Furniture", "Footwear", "Watches & Wearables", "Jewellery & Accessories", 
  "Health & Personal Care", "Sports & Fitness", "Books & Stationery", "Grocery & Daily Needs", "Others"
];

function AddlinkContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [linkMode, setLinkMode] = useState("platform"); 
  const [rawLinks, setRawLinks] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("");
  const [collectionName, setCollectionName] = useState("");
  
  const [isFetching, setIsFetching] = useState(false);
  const [previewDeals, setPreviewDeals] = useState([]);
  
  // 🚨 NAYA: Gatekeeper Loading State
  const [loading, setLoading] = useState(true);

  // 🚨 INFO MODAL STATE
  const [infoModal, setInfoModal] = useState({ show: false, title: "", desc: "" });
  const [successDrawer, setSuccessDrawer] = useState({ show: false, links: [] });

  // 👇 NAYA: Username aur Auto-DM Modal ke states
  const [username, setUsername] = useState("");
  const [autoDmModal, setAutoDmModal] = useState({ show: false, linkObj: null });
  const [dmTab, setDmTab] = useState("guide"); // 'guide' or 'templates'
  const [playVideo, setPlayVideo] = useState(false);

  // 🚨 THE BULLETPROOF GATEKEEPER 🚨
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated" && session?.user?.email) {
      fetch(`/api/user/get-by-email?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            const currentUsername = data.user.username;
            
            // Check valid username
            if (!currentUsername || currentUsername === "creator") {
              router.replace("/creators"); // ⛔ Block Access & Send to Setup
            } else {
              setUsername(currentUsername); // 👈 NAYA: Username save
              setLoading(false); // ✅ Access Granted
            }
          }
        });
    }
  }, [status, session, router]);

  const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches : [];
  };

  // --- SEQUENTIAL FETCH PREVIEW ---
  const handleFetchPreview = async () => {
    if (!rawLinks.trim()) return alert("Please enter at least one link.");
    
    const linksArray = extractUrls(rawLinks);
    if (linksArray.length === 0) {
      alert("No valid URL found in the text.");
      return;
    }

    setIsFetching(true);
    setPreviewDeals([]); 

    for (let i = 0; i < linksArray.length; i++) {
      try {
        const response = await fetch('/api/deals/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: linksArray[i] })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
          const newDeal = {
            id: i,
            originalUrl: linksArray[i],
            expandedUrl: result.data.expandedUrl || result.data.finalUrl || linksArray[i],
            store: result.data.store || "Unknown",
            title: result.data.title || "Product " + (i + 1),
            price: result.data.price || "", 
            discountPercent: result.data.discountPercent || "", 
            image: result.data.image || "",
            coupon: "", 
            timer: ""  
          };
          
          setPreviewDeals(prevDeals => [...prevDeals, newDeal]);
        }
      } catch (error) {
        console.error("Error fetching link:", linksArray[i]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    setIsFetching(false);
    setRawLinks(""); 
  };

  const handleEditDeal = (index, field, value) => {
    const updatedDeals = [...previewDeals];
    updatedDeals[index][field] = value;
    setPreviewDeals(updatedDeals);
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    
    let uniqueBatchId = "";
    if (videoUrl.trim() !== "" || collectionName.trim() !== "") {
      uniqueBatchId = "batch_" + Date.now(); 
    }

    let successCount = 0;
    let generatedData = []; 

    for (let deal of previewDeals) {
      try {
        const response = await fetch('/api/deals/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: deal.originalUrl,
            expandedUrl: deal.expandedUrl, 
            store: deal.store || "Unknown", 
            title: deal.title,            
            image: deal.image,
            price: deal.price,            
            discountPercent: deal.discountPercent, 
            couponCode: deal.coupon,
            saleEndTime: deal.timer,
            videoUrl: videoUrl || "", 
            category: category || "Others",
            collectionName: collectionName || deal.title, 
            usePlatformLink: linkMode === 'platform', 
            batchId: uniqueBatchId
          })
        });

        const result = await response.json();
        
        if (result.success) {
          successCount++;
          if (result.shortCode) {
            generatedData.push({
              title: deal.title,
              url: `${window.location.origin}/go/${result.shortCode}`
            });
          }
        }
      } catch (error) {
        console.error("Deal save error:", error);
      }
    }

    setIsPublishing(false);

    if (successCount > 0) {
      setSuccessDrawer({ show: true, links: generatedData });
      setPreviewDeals([]);
      setVideoUrl("");
      setCollectionName("");
    } else {
      alert("⚠️ Error: Deals could not be saved.");
    }
  };

  const handleShare = async (title, url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hot Deal!",
          text: `Grab this deal: ${title}`,
          url: url
        });
      } catch (err) { console.log("Share failed", err); }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  // 🚨 GATEKEEPER LOADING SCREEN
  if (loading || status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative pb-20">
      
      {/* INFO MODAL POPUP */}
      {infoModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform animate-in zoom-in duration-200">
            <h3 className="font-extrabold text-lg text-slate-900 mb-2">{infoModal.title}</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">{infoModal.desc}</p>
            <button onClick={() => setInfoModal({ show: false, title: "", desc: "" })} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS BOTTOM DRAWER */}
      {successDrawer.show && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-3xl rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col transform transition-transform duration-300 animate-in slide-in-from-bottom">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div>
                <h2 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Deals Published!
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1">Your links are ready to be shared.</p>
              </div>
              <button onClick={() => setSuccessDrawer({ show: false, links: [] })} className="w-8 h-8 bg-slate-200 rounded-full text-slate-500 hover:text-slate-900 font-extrabold flex items-center justify-center">×</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {successDrawer.links.length > 0 ? (
                successDrawer.links.map((linkObj, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">{linkObj.title}</p>
                      <p className="text-blue-600 text-xs font-medium truncate">{linkObj.url}</p>
                    </div>
                    {/* 👇 NAYA: Split Buttons (70% Share, 30% Auto-DM) */}
                    <div className="flex w-full md:w-auto gap-2 flex-shrink-0 mt-3 md:mt-0">
                      <button onClick={() => handleShare(linkObj.title, linkObj.url)} className="flex-[2] px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                        Share
                      </button>
                      <button onClick={() => { setAutoDmModal({ show: true, linkObj }); setDmTab('guide'); setPlayVideo(false); }} className="flex-[1] px-3 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <span className="text-lg leading-none">🤖</span> Auto-DM
                      </button>
                    </div>
                    </div>
                ))
              ) : (
                <div className="text-center p-6 text-slate-500 font-bold">Deals successfully saved to your profile!</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Links & Collections</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">Generate trackable smart links to monetize your audience.</p>
        </div>

        {/* 1. LINK MODE SELECTION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Monetization Method
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* PREMIUM LINK OPTION */}
            <div 
              onClick={() => setLinkMode("platform")}
              className={`cursor-pointer relative p-5 rounded-xl border-2 transition-all ${linkMode === 'platform' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
            >
              <div className="flex items-center gap-3">
                <input type="radio" checked={linkMode === 'platform'} readOnly className="w-5 h-5 accent-blue-600 pointer-events-none" />
                <div className="font-extrabold text-slate-800">Generate Premium Link</div>
              </div>
              
              <div className="ml-8 mt-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push('/campaign-rates'); }} 
                  className="text-[11px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors w-fit"
                >
                  check store profit rate
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); setInfoModal({ show: true, title: "Premium Link", desc: "Our system automatically converts regular e-commerce product links into trackable, monetized links for you. You don't need your own affiliate account." }); }} 
                className="absolute top-4 right-4 text-slate-400 hover:text-blue-600 z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
            </div>

            {/* OWN LINK OPTION */}
            <div 
              onClick={() => setLinkMode("own")}
              className={`cursor-pointer relative p-5 rounded-xl border-2 transition-all ${linkMode === 'own' ? 'border-purple-600 bg-purple-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
            >
              <div className="flex items-center gap-3">
                <input type="radio" checked={linkMode === 'own'} readOnly className="w-5 h-5 accent-purple-600 pointer-events-none" />
                <div className="font-extrabold text-slate-800">Personal Affiliate Link</div>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setInfoModal({ show: true, title: "Personal Link", desc: "Paste your existing Amazon/Flipkart affiliate link here. We will save it exactly as is to display on your page." }); }} 
                className="absolute top-4 right-4 text-slate-400 hover:text-purple-600 z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
            </div>

          </div>
        </div>

        {/* 2. ADD LINKS BOX */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
             <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
             Paste Shopping Links
           </h2>
           
          {/* 🚨 NAYA: Updated Placeholder */}
          <textarea 
            rows="5" 
            placeholder="Paste your links here. E.g.:&#10;https://amzn.in/d/shortlink&#10;https://www.flipkart.com/long-product-url/p/itm..."
            value={rawLinks}
            onChange={(e) => setRawLinks(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
          ></textarea>
          
          {/* 🚨 NAYA: Magic Button */}
          <button onClick={handleFetchPreview} disabled={isFetching || !rawLinks.trim()} className="mt-4 w-full md:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isFetching ? "Fetching Details..." : (
              <>
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                Fetch Details
              </>
            )}
          </button>
        </div>

        {/* 3. LIVE PREVIEW EDIT CARDS */}
        {(previewDeals.length > 0 || isFetching) && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
               <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
               Enhance Product Cards
             </h2>
            
            <div className="space-y-4">
              {previewDeals.map((deal, index) => (
                <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-5">
                  <div className="relative w-full md:w-28 h-32 bg-white rounded-lg border border-slate-200 flex-shrink-0 group overflow-hidden">
                    <img src={deal.image || "https://via.placeholder.com/150"} alt="Product" className="w-full h-full object-contain p-1" />
                    
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 focus-within:opacity-100">
                      <input 
                        type="text" 
                        placeholder="Paste Image URL" 
                        className="w-full bg-white text-slate-900 text-[10px] font-bold p-1.5 border border-slate-200 rounded outline-none"
                        value={deal.image}
                        onChange={(e) => handleEditDeal(index, "image", e.target.value)}
                      />
                    </div>
                    <div className="absolute top-1 right-1 bg-slate-900/50 p-1 rounded backdrop-blur-sm pointer-events-none group-hover:hidden">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Product Title</label>
                      <input type="text" value={deal.title} onChange={(e) => handleEditDeal(index, "title", e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold text-sm focus:border-blue-500 outline-none" placeholder="Enter Title" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                         <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Price</label>
                         <input type="text" value={deal.price} onChange={(e) => handleEditDeal(index, "price", e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg p-2 text-slate-900 font-bold text-sm focus:border-blue-500 outline-none" placeholder="₹999" />
                      </div>
                      <div>
                         <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Discount</label>
                         <input type="text" value={deal.discountPercent} onChange={(e) => handleEditDeal(index, "discountPercent", e.target.value)} className="w-full bg-orange-50 border-2 border-orange-200 rounded-lg p-2 text-orange-600 font-bold text-sm focus:border-orange-500 outline-none" placeholder="50% OFF" />
                      </div>
                      <div>
                         <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Coupon</label>
                         <input type="text" value={deal.coupon} onChange={(e) => handleEditDeal(index, "coupon", e.target.value)} placeholder="Code" className="w-full bg-white border-2 border-slate-200 rounded-lg p-2 text-slate-900 font-bold text-sm focus:border-blue-500 outline-none uppercase" />
                      </div>
                      <div className="col-span-2">
                         <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Sale Timer</label>
                         <input type="datetime-local" value={deal.timer} onChange={(e) => handleEditDeal(index, "timer", e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg p-2 text-slate-600 font-bold text-sm focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* SEQUENTIAL SKELETON LOADER */}
              {isFetching && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-5 animate-pulse">
                  <div className="w-full md:w-28 h-32 bg-slate-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="h-10 bg-slate-200 rounded"></div>
                      <div className="h-10 bg-slate-200 rounded"></div>
                      <div className="h-10 bg-slate-200 rounded"></div>
                      <div className="h-10 bg-slate-200 rounded col-span-2"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. MEDIA & CATEGORY */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
             <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
               <span className="flex items-center gap-2"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg> Video Link</span>
               <button onClick={(e) => { e.stopPropagation(); setInfoModal({ show: true, title: "Link Video/Reel", desc: "Paste your Instagram Reel or YouTube Short link here. We will display it right above this collection on your bio page!" }); }} className="text-slate-400 hover:text-blue-600 z-10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               </button>
             </h2>
             <input type="text" placeholder="https://instagram.com/reel/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 text-slate-900 font-bold text-sm focus:border-blue-500 outline-none" />
           </div>
           
           <div className="space-y-4">
             <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
               Collection & Category
             </h2>
             <div className="grid grid-cols-2 gap-3">
               <input type="text" placeholder="Collection Name" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 text-slate-900 font-bold text-sm focus:border-blue-500 outline-none" title="Creates a Batch ID to group these links" />
               <div className="relative">
                 <input 
                   type="text" 
                   list="category-list"
                   placeholder="Select Category" 
                   value={category} 
                   onChange={(e) => setCategory(e.target.value)} 
                   className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 text-slate-900 font-bold text-sm focus:border-blue-500 outline-none" 
                 />
                 <datalist id="category-list">
                    {ALL_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
                 </datalist>
               </div>
             </div>
           </div>
        </div>

        {/* 5. PUBLISH BUTTON */}
        {previewDeals.length > 0 && !isFetching && (
          <div className="pt-4">
            <button 
              onClick={handlePublish} 
              disabled={isPublishing}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-lg font-extrabold rounded-2xl shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isPublishing ? "⏳ PUBLISHING TO DASHBOARD..." : "🚀 PUBLISH TO DASHBOARD"}
            </button>
          </div>
        )}

        {/* 👇 NAYA: SCRAPER DATA NOTE */}
        <div className="mt-8 pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
             <span className="text-blue-500 text-xl mt-0.5">ℹ️</span>
             <div>
                <h3 className="text-sm font-extrabold text-blue-900 mb-1">Note: Data Accuracy & Fetching</h3>
                <ul className="text-xs text-blue-700 font-medium space-y-1.5 list-disc pl-4">
                   <li>Our scraper fetches live data, but prices/discounts may occasionally mismatch due to store updates. Please cross-verify with the store before publishing.</li>
                   <li>If a link fails to fetch data, simply enter the Product Title, Image URL, and Price manually to publish it.</li>
                </ul>
             </div>
          </div>
        </div>

        {/* 🚨 NAYA: PRO TIPS BULLET POINTS */}
        <div className="mt-8 pt-8 border-t border-slate-200">
           <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Pro Tips for Conversions</h3>
           <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
             <ul className="space-y-4">
               <li className="flex items-start gap-3">
                 <span className="text-emerald-500 mt-0.5 text-lg">✅</span>
                 <div>
                   <p className="text-sm font-bold text-slate-800">Use Coupons & Sale Timers</p>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed">Adding a coupon code and a live countdown timer creates FOMO (Fear Of Missing Out) and pushes your audience to buy immediately before the offer expires.</p>
                 </div>
               </li>
               <li className="flex items-start gap-3">
                 <span className="text-blue-500 mt-0.5 text-lg">💡</span>
                 <div>
                   <p className="text-sm font-bold text-slate-800">The "Hidden Price" Strategy</p>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed">We strongly recommend <strong>NOT</strong> adding the exact price here. This builds curiosity, forcing users to click your link to check the price, which successfully drops your affiliate cookie in their browser!</p>
                 </div>
               </li>
               <li className="flex items-start gap-3">
                 <span className="text-orange-500 mt-0.5 text-lg">🔥</span>
                 <div>
                   <p className="text-sm font-bold text-slate-800">Custom Amazon Commission</p>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed">Not happy with the standard platform commission for Amazon? Go to your <strong>Account</strong> page and save your personal Amazon Associates Tag to convert any Amazon link into your own direct affiliate link.</p>
                 </div>
               </li>
             </ul>
           </div>
        </div>

      </div>

     {/* 👇 NAYA: SUPER PROFILE AUTOMATION MODAL */}
      {autoDmModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4" onClick={() => setAutoDmModal({ show: false, linkObj: null })}>
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in slide-in-from-bottom-8 duration-300 overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
               <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 relative z-10">
                     <span className="text-2xl animate-bounce">🚀</span> Instagram Auto-DM
                  </h2>
                  <p className="text-xs font-bold text-slate-500 mt-1">Powered by SuperProfile.bio</p>
               </div>
               <button onClick={() => setAutoDmModal({ show: false, linkObj: null })} className="w-8 h-8 bg-slate-100 rounded-full text-slate-600 font-bold flex items-center justify-center hover:bg-slate-200 relative z-10">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2">
               <button onClick={() => setDmTab("guide")} className={`flex-1 py-2.5 text-sm font-extrabold transition-all border-b-2 ${dmTab === "guide" ? "border-purple-600 text-purple-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}>1. Quick Guide</button>
               <button onClick={() => setDmTab("templates")} className={`flex-1 py-2.5 text-sm font-extrabold transition-all border-b-2 ${dmTab === "templates" ? "border-purple-600 text-purple-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}>2. Copy Templates</button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 [&::-webkit-scrollbar]:hidden">
               
               {/* TAB 1: GUIDE */}
               {dmTab === "guide" && (
                 <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                       <h3 className="font-bold text-sm text-slate-900 mb-2">Why use Super Profile?</h3>
                       <ul className="text-xs text-slate-600 space-y-2 font-medium">
                          <li className="flex items-center gap-2"><span className="text-emerald-500">✔️</span> 100% Free Auto-DM feature.</li>
                          <li className="flex items-center gap-2"><span className="text-blue-500">✔️</span> Meta (Instagram) Verified & Safe.</li>
                          <li className="flex items-center gap-2"><span className="text-purple-500">✔️</span> Send link + multiple buttons in DM.</li>
                       </ul>
                    </div>

                    {/* Video Card */}
                    <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-300 group cursor-pointer" onClick={() => setPlayVideo(true)}>
                       {playVideo ? (
                          <iframe className="w-full h-full" src="https://www.youtube.com/embed/Pj15b67K9Dk?autoplay=1" frameBorder="0" allowFullScreen></iframe>
                       ) : (
                          <>
                             <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)] group-hover:scale-110 transition-transform">
                                   <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                                <span className="text-white font-bold mt-2 bg-black/50 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-white/10">How to Setup Tutorial</span>
                             </div>
                          </>
                       )}
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                       <p className="text-xs font-bold text-slate-500 mb-3">Steps to follow:</p>
                       <div className="flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-800">
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">Sign Up</span>
                          <span className="text-slate-300">➔</span>
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Connect IG</span>
                          <span className="text-slate-300">➔</span>
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Setup Auto</span>
                       </div>
                    </div>
                 </div>
               )}

               {/* TAB 2: TEMPLATES */}
               {dmTab === "templates" && (
                 <div className="space-y-4 animate-in fade-in duration-300">
                    
                    {/* DM Content Box */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative group">
                       <label className="text-[10px] font-extrabold text-slate-400 uppercase">DM Content Box</label>
                       <div className="mt-1 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap">
                          Hey there! Thanks for commenting 🙌 As promised, here is the link for you ⬇️{'\n\n'}Grab this awesome deal: {autoDmModal.linkObj?.title}{'\n\n'}Click "Shop Now" below before it expires! 🚀
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(`Hey there! Thanks for commenting 🙌 As promised, here is the link for you ⬇️\n\nGrab this awesome deal: ${autoDmModal.linkObj?.title}\n\nClick "Shop Now" below before it expires! 🚀`); alert("DM Content Copied!"); }} className="absolute top-3 right-3 text-blue-600 bg-blue-50 p-1.5 rounded-md hover:bg-blue-100 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                       </button>
                    </div>

                    {/* Button 1 */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative group">
                       <label className="text-[10px] font-extrabold text-slate-400 uppercase">Button #1 (Product Link)</label>
                       <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 truncate">Shop Now</div>
                          <div className="text-[10px] font-medium text-blue-600 bg-slate-50 p-2 rounded border border-slate-100 truncate">{autoDmModal.linkObj?.url}</div>
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(`Name: Shop Now\nLink: ${autoDmModal.linkObj?.url}`); alert("Button 1 Copied!"); }} className="absolute top-3 right-3 text-blue-600 bg-blue-50 p-1.5 rounded-md hover:bg-blue-100 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                       </button>
                    </div>

                    {/* Button 2 */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative group">
                       <label className="text-[10px] font-extrabold text-slate-400 uppercase">Button #2 (Your Store)</label>
                       <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 truncate">Visit my store 🚀</div>
                          <div className="text-[10px] font-medium text-blue-600 bg-slate-50 p-2 rounded border border-slate-100 truncate">https://getbuylink.vercel.app/{username}</div>
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(`Name: Visit my store 🚀\nLink: https://getbuylink.vercel.app/${username}`); alert("Button 2 Copied!"); }} className="absolute top-3 right-3 text-blue-600 bg-blue-50 p-1.5 rounded-md hover:bg-blue-100 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                       </button>
                    </div>

                    {/* Button 3 */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative group">
                       <label className="text-[10px] font-extrabold text-slate-400 uppercase">Button #3 (Live Offers)</label>
                       <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 truncate">Live Deals ⚡</div>
                          <div className="text-[10px] font-medium text-blue-600 bg-slate-50 p-2 rounded border border-slate-100 truncate">https://getbuylink.vercel.app/{username}?tab=liveoffer</div>
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(`Name: Live Deals ⚡\nLink: https://getbuylink.vercel.app/${username}?tab=liveoffer`); alert("Button 3 Copied!"); }} className="absolute top-3 right-3 text-blue-600 bg-blue-50 p-1.5 rounded-md hover:bg-blue-100 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                       </button>
                    </div>

                    <button onClick={() => { 
                       const fullText = `DM CONTENT:\nHey there! Thanks for commenting 🙌 As promised, here is the link for you ⬇️\n\nGrab this awesome deal: ${autoDmModal.linkObj?.title}\n\nClick "Shop Now" below before it expires! 🚀\n\nBUTTON 1:\nName: Shop Now\nLink: ${autoDmModal.linkObj?.url}\n\nBUTTON 2:\nName: Visit my store 🚀\nLink: https://getbuylink.vercel.app/${username}\n\nBUTTON 3:\nName: Live Deals ⚡\nLink: https://getbuylink.vercel.app/${username}?tab=liveoffer`;
                       navigator.clipboard.writeText(fullText); 
                       alert("All templates copied to clipboard!"); 
                    }} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                       Copy All Templates
                    </button>
                 </div>
               )}
            </div>

            {/* Footer / CTA Actions */}
            <div className="p-4 border-t border-slate-200 bg-white space-y-2">
               {dmTab === "guide" ? (
                  <div className="flex gap-2">
                     <a href="https://superprofile.bio/login" target="_blank" className="flex-1 text-center py-3 bg-purple-100 text-purple-700 font-extrabold rounded-xl text-sm hover:bg-purple-200 transition-colors">1. Sign Up</a>
                     <a href="https://superprofile.bio/dashboard/automations" target="_blank" className="flex-1 text-center py-3 bg-purple-600 text-white font-extrabold rounded-xl text-sm shadow-md shadow-purple-200 hover:bg-purple-700 transition-colors">2. Setup Auto</a>
                  </div>
               ) : (
                  <a href="https://superprofile.bio/dashboard/automations" target="_blank" className="block text-center py-3 bg-purple-600 text-white font-extrabold rounded-xl text-sm shadow-md shadow-purple-200 hover:bg-purple-700 transition-colors">
                     Go to Super Profile Automation ➔
                  </a>
               )}
               <p className="text-[9px] text-slate-400 text-center leading-tight mt-2 px-2">
                  *Disclaimer: Super Profile is a 3rd-party tool. We are not affiliated with them. If you face any account issues, please contact their support. Use automation at your own risk.
               </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AddlinkPage() {
  return (
    <SessionProvider>
      <AddlinkContent />
    </SessionProvider>
  );
}