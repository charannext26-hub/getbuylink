"use client";
import { useState, useEffect } from "react";

export default function ManageHomePage() {
  const [configData, setConfigData] = useState({
    topNotice: { isActive: false, text: "", linkUrl: "", bgColor: "bg-indigo-600" },
    globalPopup: { isActive: false, imageUrl: "", linkUrl: "" },
    banners: [],
    storeSales: [],
    topDealSections: [],
    extraSections: [],
    // 🚨 NAYE FIELDS ADD KIYE
    vipStoreRates: { isActive: true },
    youtubeBanners: { isActive: true, videos: [] }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setConfigData(prevState => ({ ...prevState, ...data.data }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading config:", err);
        setLoading(false);
      });
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });
      const data = await res.json();
      if (data.success) showToast("✅ Platform Updated Successfully!");
      else showToast("⚠️ Error saving data.");
    } catch (error) {
      showToast("⚠️ Server error occurred.");
    }
    setSaving(false);
  };

  const addItem = (field, defaultObj) => {
    if (field === "youtubeBanners.videos") {
      setConfigData({
        ...configData,
        youtubeBanners: {
          ...configData.youtubeBanners,
          videos: [...configData.youtubeBanners.videos, defaultObj]
        }
      });
    } else {
      setConfigData({ ...configData, [field]: [...configData[field], defaultObj] });
    }
  };

  const updateItem = (field, index, key, value) => {
    if (field === "youtubeBanners.videos") {
      const updatedArray = [...configData.youtubeBanners.videos];
      updatedArray[index][key] = value;
      setConfigData({ ...configData, youtubeBanners: { ...configData.youtubeBanners, videos: updatedArray } });
    } else {
      const updatedArray = [...configData[field]];
      updatedArray[index][key] = value;
      setConfigData({ ...configData, [field]: updatedArray });
    }
  };

  const removeItem = (field, index) => {
    if (!confirm("Are you sure?")) return;
    if (field === "youtubeBanners.videos") {
      const updatedArray = [...configData.youtubeBanners.videos];
      updatedArray.splice(index, 1);
      setConfigData({ ...configData, youtubeBanners: { ...configData.youtubeBanners, videos: updatedArray } });
    } else {
      const updatedArray = [...configData[field]];
      updatedArray.splice(index, 1);
      setConfigData({ ...configData, [field]: updatedArray });
    }
  };

  const moveItem = (field, index, direction) => {
    let arr = field === "youtubeBanners.videos" ? [...configData.youtubeBanners.videos] : [...configData[field]];
    
    if (direction === 'up' && index > 0) {
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    } else if (direction === 'down' && index < arr.length - 1) {
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
    }

    if (field === "youtubeBanners.videos") {
      setConfigData({ ...configData, youtubeBanners: { ...configData.youtubeBanners, videos: arr } });
    } else {
      setConfigData({ ...configData, [field]: arr });
    }
  };

  const moveProduct = (secIdx, dealIdx, direction) => {
    const updatedSections = [...configData.topDealSections];
    const deals = updatedSections[secIdx].deals;
    if (direction === 'up' && dealIdx > 0) {
      [deals[dealIdx - 1], deals[dealIdx]] = [deals[dealIdx], deals[dealIdx - 1]];
    } else if (direction === 'down' && dealIdx < deals.length - 1) {
      [deals[dealIdx + 1], deals[dealIdx]] = [deals[dealIdx], deals[dealIdx + 1]];
    }
    setConfigData({ ...configData, topDealSections: updatedSections });
  };

  const handleScrapeProduct = async (secIdx) => {
    const urlInput = document.getElementById(`new_url_${secIdx}`);
    const url = urlInput.value;
    if (!url) return showToast("⚠️ Please paste a link first!");

    showToast("⏳ Fetching product details...");
    try {
      const res = await fetch('/api/deals/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const result = await res.json();
      
      if (result.success && result.data) {
        const newDeal = {
          originalUrl: url,
          expandedUrl: result.data.expandedUrl || result.data.finalUrl || url,
          store: result.data.store || "PlatformDeal",
          imageUrl: result.data.image || "https://via.placeholder.com/150",
          title: result.data.title || "New Product",
          price: result.data.price || "",
          discountPercent: result.data.discountPercent || "",
          coupon: "",
          timer: "",
          commissionText: "Earn 10%", 
          linkUrl: "#" 
        };
        const updatedSections = [...configData.topDealSections];
        updatedSections[secIdx].deals.unshift(newDeal);
        setConfigData({ ...configData, topDealSections: updatedSections });
        urlInput.value = ""; 
        showToast("✅ Product Scraped & Added at Top!");
      } else {
        showToast("⚠️ Could not fetch details. API failed.");
      }
    } catch (e) {
      showToast("⚠️ Scraper error occurred.");
    }
  };

  if (loading) return <div className="text-center py-20 text-blue-500 font-bold">Loading System Core...</div>;

  return (
    <div className="space-y-8 pb-24 relative">
      
      {toastMessage && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm z-[100] animate-[bounce_0.3s_ease-in-out]">
          {toastMessage}
        </div>
      )}

      {/* HEADER & SAVE BUTTON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg sticky top-0 z-40">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Platform Core Settings</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Control visibility and content across the entire creator app.</p>
        </div>
        <button onClick={handleSaveConfig} disabled={saving} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-lg transition-all disabled:opacity-50">
          {saving ? "⏳ Publishing..." : "🚀 Publish Live Changes"}
        </button>
      </div>

      {/* 🚨 NAYA: FEATURE TOGGLES ROW (VIP Rates) */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row gap-6 sm:items-center">
        <div className="flex-1 border-r border-slate-700 pr-6">
           <h2 className="text-base font-bold text-white mb-1">💸 Trending VIP Store Rates</h2>
           <p className="text-xs text-slate-400 mb-3">Show the top 10 campaign rates on creator dashboard.</p>
           <label className="relative inline-flex items-center cursor-pointer">
             <input type="checkbox" className="sr-only peer" checked={configData.vipStoreRates?.isActive} onChange={(e) => setConfigData({...configData, vipStoreRates: {isActive: e.target.checked}})} />
             <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
             <span className="ml-3 text-xs font-bold text-white">{configData.vipStoreRates?.isActive ? "ACTIVE" : "HIDDEN"}</span>
           </label>
        </div>
      </div>

      {/* 🚨 NAYA: YOUTUBE TUTORIALS BANNER SETTINGS */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-700 pb-4 gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              YouTube Creator Tutorials
            </h2>
            <p className="text-xs text-slate-400 mt-1">Add video guides to help creators use the platform.</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={configData.youtubeBanners?.isActive} onChange={(e) => setConfigData({...configData, youtubeBanners: {...configData.youtubeBanners, isActive: e.target.checked}})} />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
            <button onClick={() => addItem("youtubeBanners.videos", { title: "New Video", videoUrl: "", thumbnailUrl: "" })} className="text-sm bg-red-600/20 text-red-400 px-4 py-2 rounded-lg font-bold border border-red-500/30 hover:bg-red-600 hover:text-white transition-colors">+ Add Video</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-90">
          {configData.youtubeBanners?.videos?.map((vid, idx) => (
            <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex gap-3 items-center group">
              <div className="flex flex-col gap-1 pr-2 border-r border-slate-700 shrink-0">
                <button onClick={() => moveItem("youtubeBanners.videos", idx, "up")} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-20 text-[10px]">▲</button>
                <button onClick={() => moveItem("youtubeBanners.videos", idx, "down")} disabled={idx === configData.youtubeBanners.videos.length - 1} className="text-slate-500 hover:text-white disabled:opacity-20 text-[10px]">▼</button>
              </div>
              
              <div className="w-16 h-10 bg-slate-800 rounded flex items-center justify-center shrink-0 border border-slate-600 overflow-hidden relative">
                 {vid.thumbnailUrl ? <img src={vid.thumbnailUrl} className="w-full h-full object-cover opacity-60" /> : <span className="text-[8px] text-slate-500 font-bold">IMAGE</span>}
                 <svg className="w-4 h-4 text-white absolute" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>

              <div className="flex-1 space-y-2">
                <input type="text" placeholder="Video Title" value={vid.title} onChange={(e) => updateItem("youtubeBanners.videos", idx, "title", e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs font-bold" />
                <div className="flex gap-2">
                   <input type="text" placeholder="Video URL" value={vid.videoUrl} onChange={(e) => updateItem("youtubeBanners.videos", idx, "videoUrl", e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded p-2 text-white text-[10px]" />
                   <input type="text" placeholder="Thumbnail URL" value={vid.thumbnailUrl} onChange={(e) => updateItem("youtubeBanners.videos", idx, "thumbnailUrl", e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded p-2 text-white text-[10px]" />
                </div>
              </div>
              <button onClick={() => removeItem("youtubeBanners.videos", idx)} className="text-red-500 hover:bg-red-500/20 px-2 py-4 rounded bg-slate-800 font-bold shrink-0">×</button>
            </div>
          ))}
          {configData.youtubeBanners?.videos?.length === 0 && (
             <div className="col-span-2 text-center py-6 text-slate-500 text-sm italic border border-dashed border-slate-600 rounded-xl">No videos added yet. Click 'Add Video' to start.</div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOP NOTICE BAR */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
            <h2 className="text-lg font-bold text-white">📢 Top Notice Bar</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={configData.topNotice.isActive} onChange={(e) => setConfigData({...configData, topNotice: {...configData.topNotice, isActive: e.target.checked}})} />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <div className="space-y-3 opacity-90">
            <input type="text" placeholder="Important Announcement Text..." value={configData.topNotice.text} onChange={(e) => setConfigData({...configData, topNotice: {...configData.topNotice, text: e.target.value}})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm" />
            <input type="text" placeholder="Link URL (Optional)" value={configData.topNotice.linkUrl} onChange={(e) => setConfigData({...configData, topNotice: {...configData.topNotice, linkUrl: e.target.value}})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm" />
          </div>
        </section>

        {/* GLOBAL POPUP */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
            <h2 className="text-lg font-bold text-white">🎇 Entry Pop-up</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={configData.globalPopup.isActive} onChange={(e) => setConfigData({...configData, globalPopup: {...configData.globalPopup, isActive: e.target.checked}})} />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <div className="space-y-3 opacity-90">
            <input type="text" placeholder="Image URL (Square or Portrait)" value={configData.globalPopup.imageUrl} onChange={(e) => setConfigData({...configData, globalPopup: {...configData.globalPopup, imageUrl: e.target.value}})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm" />
            <input type="text" placeholder="Click Destination URL" value={configData.globalPopup.linkUrl} onChange={(e) => setConfigData({...configData, globalPopup: {...configData.globalPopup, linkUrl: e.target.value}})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm" />
          </div>
        </section>
      </div>

      {/* BANNERS CONTROL WITH REORDER */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
          <h2 className="text-lg font-bold text-white">🖼️ Home Banners (Tips)</h2>
          <button onClick={() => addItem("banners", { imageUrl: "", linkUrl: "" })} className="text-sm bg-blue-600/20 text-blue-400 px-3 py-1 rounded-md font-bold">+ Add</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configData.banners.map((item, idx) => (
            <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex gap-3 items-center group">
              <div className="flex flex-col gap-1 pr-2 border-r border-slate-700">
                <button onClick={() => moveItem("banners", idx, "up")} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-20">▲</button>
                <button onClick={() => moveItem("banners", idx, "down")} disabled={idx === configData.banners.length - 1} className="text-slate-500 hover:text-white disabled:opacity-20">▼</button>
              </div>
              <div className="flex-1 space-y-2">
                <input type="text" placeholder="Image URL" value={item.imageUrl} onChange={(e) => updateItem("banners", idx, "imageUrl", e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs" />
                <input type="text" placeholder="Click URL" value={item.linkUrl} onChange={(e) => updateItem("banners", idx, "linkUrl", e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs" />
              </div>
              <button onClick={() => removeItem("banners", idx)} className="text-red-500 hover:bg-red-500/20 px-2 py-4 rounded bg-slate-800 font-bold">×</button>
            </div>
          ))}
        </div>
      </section>

      {/* STORE SALES RADAR */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
          <h2 className="text-lg font-bold text-white">🔥 Store Sales Radar</h2>
          <button onClick={() => addItem("storeSales", { storeCode: "AMZ", storeName: "Sale", statusText: "Live", statusType: "live" })} className="text-sm bg-orange-600/20 text-orange-400 px-3 py-1 rounded-md font-bold">+ Add Sale</button>
        </div>
        <div className="space-y-3">
          {configData.storeSales.map((item, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-2 items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
              <div className="flex flex-col gap-1 pr-2 border-r border-slate-700">
                <button onClick={() => moveItem("storeSales", idx, "up")} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-20 text-[10px]">▲</button>
                <button onClick={() => moveItem("storeSales", idx, "down")} disabled={idx === configData.storeSales.length - 1} className="text-slate-500 hover:text-white disabled:opacity-20 text-[10px]">▼</button>
              </div>
              <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center shrink-0 overflow-hidden">
                 {item.storeCode.startsWith('http') ? <img src={item.storeCode} className="w-full h-full object-contain p-1" /> : <span className="text-[10px] text-white font-bold">{item.storeCode.substring(0,4)}</span>}
              </div>
              <input type="text" placeholder="Logo Link OR Text (AMZ)" value={item.storeCode} onChange={(e) => updateItem("storeSales", idx, "storeCode", e.target.value)} className="w-24 bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs text-center" />
              <input type="text" placeholder="Sale Name" value={item.storeName} onChange={(e) => updateItem("storeSales", idx, "storeName", e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs" />
              <input type="text" placeholder="Status Text" value={item.statusText} onChange={(e) => updateItem("storeSales", idx, "statusText", e.target.value)} className="w-32 bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs" />
              <select value={item.statusType} onChange={(e) => updateItem("storeSales", idx, "statusType", e.target.value)} className="bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs outline-none">
                <option value="live">Live (Green)</option>
                <option value="upcoming">Upcoming (Gray)</option>
              </select>
              <button onClick={() => removeItem("storeSales", idx)} className="text-red-500 hover:bg-red-500/20 px-3 py-1 rounded font-bold">×</button>
            </div>
          ))}
        </div>
      </section>

      {/* TOP DEAL SECTIONS WITH SCRAPER & NAYE FIELDS */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
          <h2 className="text-lg font-bold text-white">🛍️ High Commission Sections</h2>
          <button onClick={() => {
             const newSection = { sectionId: `sec_${Date.now()}`, storeName: "Store", sectionTitle: "Store Deals", isActive: true, deals: [] };
             setConfigData({ ...configData, topDealSections: [newSection, ...configData.topDealSections] });
          }} className="text-sm bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded-md font-bold">+ Add Section</button>
        </div>
        
        <div className="space-y-6">
          {configData.topDealSections.map((section, secIdx) => (
            <div key={secIdx} className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-lg">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="flex flex-col gap-1 pr-3 border-r border-slate-700">
                  <button onClick={() => moveItem("topDealSections", secIdx, "up")} disabled={secIdx === 0} className="text-slate-500 hover:text-white disabled:opacity-20 text-[10px]">▲</button>
                  <button onClick={() => moveItem("topDealSections", secIdx, "down")} disabled={secIdx === configData.topDealSections.length - 1} className="text-slate-500 hover:text-white disabled:opacity-20 text-[10px]">▼</button>
                </div>

                <input type="checkbox" checked={section.isActive} onChange={(e) => updateItem("topDealSections", secIdx, "isActive", e.target.checked)} className="w-5 h-5 accent-emerald-500" title="Toggle Visibility" />
                <input type="text" placeholder="Store Name" value={section.storeName} onChange={(e) => updateItem("topDealSections", secIdx, "storeName", e.target.value)} className="w-32 bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs" />
                <input type="text" placeholder="Section Title" value={section.sectionTitle} onChange={(e) => updateItem("topDealSections", secIdx, "sectionTitle", e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs font-bold" />
                <button onClick={() => removeItem("topDealSections", secIdx)} className="text-red-500 text-xs px-2 hover:underline">Remove Section</button>
              </div>

              <div className="pl-12 border-l-2 border-slate-700 space-y-4">
                
                <div className="flex gap-2 bg-slate-800 p-2 rounded-lg border border-slate-600 shadow-inner">
                  <input type="text" id={`new_url_${secIdx}`} placeholder="Paste Original URL here to Auto-Fetch & Add to Top..." className="flex-1 bg-slate-900 border border-slate-600 rounded p-2.5 text-white text-xs outline-none focus:border-emerald-500" />
                  <button onClick={() => handleScrapeProduct(secIdx)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded text-xs font-extrabold transition-colors">
                    Fetch & Add
                  </button>
                </div>

                <div className="space-y-3">
                  {section.deals.map((deal, dealIdx) => (
                    <div key={dealIdx} className="flex gap-3 items-start bg-slate-800 p-3 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                      
                      <div className="flex flex-col gap-1 mt-1">
                        <button onClick={() => moveProduct(secIdx, dealIdx, 'up')} disabled={dealIdx === 0} className="text-slate-500 hover:text-white disabled:opacity-20 text-[10px]">▲</button>
                        <button onClick={() => moveProduct(secIdx, dealIdx, 'down')} disabled={dealIdx === section.deals.length - 1} className="text-slate-500 hover:text-white disabled:opacity-20 text-[10px]">▼</button>
                      </div>

                      <img src={deal.imageUrl || "https://via.placeholder.com/50"} alt="thumb" className="w-14 h-14 object-contain bg-white rounded border border-slate-200 p-0.5 shrink-0" />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <input type="text" placeholder="Title" value={deal.title} onChange={(e) => {
                              const updated = [...configData.topDealSections];
                              updated[secIdx].deals[dealIdx].title = e.target.value;
                              setConfigData({ ...configData, topDealSections: updated });
                          }} className="flex-1 bg-slate-900 border border-slate-600 rounded p-1.5 text-white text-[11px] font-bold" />
                          <input type="text" placeholder="Image URL" value={deal.imageUrl} onChange={(e) => {
                              const updated = [...configData.topDealSections];
                              updated[secIdx].deals[dealIdx].imageUrl = e.target.value;
                              setConfigData({ ...configData, topDealSections: updated });
                          }} className="flex-1 bg-slate-900 border border-slate-600 rounded p-1.5 text-slate-300 text-[10px]" />
                        </div>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Store (e.g. amazon)" value={deal.store || ""} onChange={(e) => {
                              const updated = [...configData.topDealSections];
                              updated[secIdx].deals[dealIdx].store = e.target.value;
                              setConfigData({ ...configData, topDealSections: updated });
                          }} className="w-24 bg-slate-900 border border-slate-600/50 rounded p-1.5 text-orange-400 text-[10px] font-bold uppercase" title="Detected Store" />

                          <input type="text" placeholder="Expanded URL" value={deal.expandedUrl || ""} onChange={(e) => {
                              const updated = [...configData.topDealSections];
                              updated[secIdx].deals[dealIdx].expandedUrl = e.target.value;
                              setConfigData({ ...configData, topDealSections: updated });
                          }} className="flex-1 bg-slate-900 border border-slate-600/50 rounded p-1.5 text-purple-400 text-[10px] font-mono" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <input type="text" placeholder="Price (e.g. ₹999)" value={deal.price || ""} onChange={(e) => {
                              const updated = [...configData.topDealSections];
                              updated[secIdx].deals[dealIdx].price = e.target.value;
                              setConfigData({ ...configData, topDealSections: updated });
                          }} className="bg-slate-900 border border-slate-600 rounded p-1.5 text-white text-[10px]" />
                          
                          <input type="text" placeholder="Discount (e.g. 50% OFF)" value={deal.discountPercent || ""} onChange={(e) => {
                              const updated = [...configData.topDealSections];
                              updated[secIdx].deals[dealIdx].discountPercent = e.target.value;
                              setConfigData({ ...configData, topDealSections: updated });
                          }} className="bg-slate-900 border border-slate-600 rounded p-1.5 text-orange-400 text-[10px] font-bold" />

                          <input type="text" placeholder="Coupon (SAVE20)" value={deal.coupon || ""} onChange={(e) => {
                              const updated = [...configData.topDealSections];
                              updated[secIdx].deals[dealIdx].coupon = e.target.value;
                              setConfigData({ ...configData, topDealSections: updated });
                          }} className="bg-slate-900 border border-slate-600 rounded p-1.5 text-white text-[10px] uppercase" />
                          
                          <input type="text" placeholder="Earn X%" value={deal.commissionText || ""} onChange={(e) => {
                              const updated = [...configData.topDealSections];
                              updated[secIdx].deals[dealIdx].commissionText = e.target.value;
                              setConfigData({ ...configData, topDealSections: updated });
                          }} className="bg-slate-900 border border-emerald-500/50 rounded p-1.5 text-emerald-400 text-[10px] font-bold" />
                          
                          <input type="datetime-local" value={deal.timer || ""} onChange={(e) => {
                              const updated = [...configData.topDealSections];
                              updated[secIdx].deals[dealIdx].timer = e.target.value;
                              setConfigData({ ...configData, topDealSections: updated });
                          }} className="bg-slate-900 border border-slate-600 rounded p-1.5 text-slate-300 text-[10px] outline-none [color-scheme:dark]" />
                        </div>

                        <div className="text-[9px] text-slate-500 truncate px-1">Original Link: {deal.originalUrl}</div>
                      </div>

                      <button onClick={() => {
                          const updated = [...configData.topDealSections];
                          updated[secIdx].deals.splice(dealIdx, 1);
                          setConfigData({ ...configData, topDealSections: updated });
                      }} className="text-red-500 hover:bg-red-500/20 px-3 py-2 rounded bg-slate-900 font-bold self-start mt-1">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}