"use client";
import { useState, useEffect } from "react";
import { useSession, SessionProvider } from "next-auth/react"; 
import { useRouter } from "next/navigation";

const ALL_CATEGORIES = [
  "Men's Fashion", "Women's Fashion", "Electronics & Mobiles", 
  "Beauty & Grooming", "Home & Kitchen", "Footwear", "Accessories", "Grocery", "Others"
];

function AutoPostContent() {
  const { data: session, status } = useSession(); 
  const router = useRouter();

  const [isActive, setIsActive] = useState(false);
  const [selectedCats, setSelectedCats] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [creatorUsername, setCreatorUsername] = useState("");

  const [activeTab, setActiveTab] = useState("auto_deals"); 
  const [platformDeals, setPlatformDeals] = useState([]);
  const [ownDeals, setOwnDeals] = useState([]);
  
  const [filterTab2, setFilterTab2] = useState("all"); 
  const [filterTab3, setFilterTab3] = useState("all"); 

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState(""); 
  const [selectedGroup, setSelectedGroup] = useState(null); 
  const [newLinkLabel, setNewLinkLabel] = useState(""); 

  const [editTitle, setEditTitle] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editCategory, setEditCategory] = useState("Other");

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => { setToastMessage(null); }, 3000);
  };

  const fetchDeals = async (email) => {
    try {
      const res = await fetch(`/api/deals/get-filtered?email=${email}`);
      const data = await res.json();
      if (data.success) setDeals(data.deals);
    } catch (err) { console.error("Deals fetch error:", err); }
  };

  const fetchManualDeals = async (email) => {
    try {
      const res = await fetch(`/api/deals/get-manual-deals?email=${email}`);
      const data = await res.json();
      if (data.success) {
        setPlatformDeals(data.data.platform);
        setOwnDeals(data.data.own);
      }
    } catch (err) { console.error("Manual Deals fetch error:", err); }
  };

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
            if (!currentUsername || currentUsername === "creator") {
              router.replace("/creators"); 
            } else {
              setCreatorUsername(currentUsername);
              setIsActive(data.user.autodeal_active || false);
              setSelectedCats(data.user.autoDealCategories || []);
              fetchDeals(session.user.email);
              fetchManualDeals(session.user.email);
              setLoading(false); 
            }
          }
        });
    }
  }, [status, session, router]);

  const handleCategoryToggle = (cat) => {
    if (selectedCats.includes(cat)) setSelectedCats(selectedCats.filter(c => c !== cat));
    else setSelectedCats([...selectedCats, cat]);
  };

  const handleSelectAll = () => {
    if (selectedCats.length === ALL_CATEGORIES.length) setSelectedCats([]); 
    else setSelectedCats([...ALL_CATEGORIES]); 
  };

  const saveSettings = async () => {
    if (!session?.user?.email) return showToast("⚠️ User session not found!");
    setLoading(true);
    try {
      const res = await fetch('/api/user/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email, autodeal_active: isActive, autoDealCategories: selectedCats })
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ Settings Saved Successfully!");
        fetchDeals(session.user.email); 
      }
    } catch (err) { showToast("⚠️ Error saving settings!"); }
    setLoading(false);
  };

  const shareAffiliateLink = async (deal) => {
    if (!creatorUsername) return showToast("⚠️ Creator username missing!");
    try {
      const res = await fetch('/api/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal._id, creatorUsername: creatorUsername, triggerSource: "control_room" })
      });
      const data = await res.json();
      if (data.success) {
        const platformShortLink = `${window.location.origin}/go/${data.shortCode}`;
        if (navigator.share) {
          await navigator.share({
            title: deal.title,
            text: `Grab this awesome deal: ${deal.title}`,
            url: platformShortLink
          });
        } else {
          navigator.clipboard.writeText(platformShortLink);
          showToast(`✅ Link Copied to Share!`);
        }
      } else { showToast("⚠️ Link banane mein problem hui!"); }
    } catch (err) { showToast("⚠️ Error generating short link."); }
  };

  const shareManualLink = async (deal, type) => {
    const linkToShare = (type === "platform" && deal.shortCode) 
      ? `${window.location.origin}/go/${deal.shortCode}` 
      : (deal.expandedUrl || deal.originalUrl);
      
    if (navigator.share) {
      try {
        await navigator.share({
          title: deal.title || "Check this out",
          url: linkToShare
        });
      } catch (err) {
        console.log("Sharing cancelled or failed");
      }
    } else {
      navigator.clipboard.writeText(linkToShare);
      showToast(`✅ Link Copied!`);
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/deals/delete?id=${dealId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchManualDeals(session.user.email); 
        showToast("✅ Product Deleted!");
        if (selectedGroup && !selectedGroup.isBatch) closeDrawer(); 
      }
    } catch (err) { showToast("⚠️ Error deleting deal."); }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      let isConverting = !selectedGroup.isBatch && (editVideoUrl.trim() !== "" || editTitle !== selectedGroup.deal.title);
      let finalBatchId = selectedGroup.isBatch ? selectedGroup.batchId : (isConverting ? "batch_" + Date.now() : null);
      let finalIsBatch = selectedGroup.isBatch || isConverting;

      const payload = {
        isBatch: finalIsBatch,
        batchId: finalBatchId,
        dealId: !selectedGroup.isBatch ? selectedGroup.deal._id : null,
        title: editTitle,
        videoUrl: editVideoUrl,
        category: editCategory
      };

      const res = await fetch('/api/deals/update-details', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      });

      const data = await res.json();
      if (data.success) {
         showToast("✅ Details Updated Successfully!");
         fetchManualDeals(session.user.email); 
         closeDrawer();
      } else {
         showToast("⚠️ Error: " + data.message);
      }
    } catch (error) {
      showToast("⚠️ Update karne mein problem aayi.");
    }
    setLoading(false);
  };

  const handleAddNewLinkToCollection = async () => {
    if (!newLinkLabel.trim()) return showToast("⚠️ Pehle link toh dalo bhai!");
    setLoading(true);
    
    let cleanPastedLink = newLinkLabel.trim();
    const urlMatch = cleanPastedLink.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
        cleanPastedLink = urlMatch[1];
    } else if (!cleanPastedLink.startsWith('http')) {
        cleanPastedLink = 'https://' + cleanPastedLink;
    }

    let scrapedTitle = "New Added Product";
    let scrapedImage = "https://via.placeholder.com/150";
    let scrapedStore = "Unknown";
    let scrapedPrice = "";
    let scrapedExpandedUrl = cleanPastedLink; 

    try {
      const response = await fetch('/api/deals/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanPastedLink }) 
      });
      const result = await response.json();
      if (result.success && result.data) {
        scrapedTitle = result.data.title || scrapedTitle;
        scrapedImage = result.data.image || scrapedImage;
        scrapedStore = result.data.store || scrapedStore;
        scrapedPrice = result.data.price || scrapedPrice;
        scrapedExpandedUrl = result.data.expandedUrl || result.data.originalUrl || result.data.url || cleanPastedLink;
      }
    } catch (e) { console.log("Scraper Error:", e); }

    try {
      let currentBatchId = selectedGroup?.isBatch ? selectedGroup.batchId : selectedGroup?.deal?.batchId;
      let currentCollectionName = selectedGroup?.isBatch ? selectedGroup.collectionName : selectedGroup?.deal?.collectionName;

      const isSingleConverting = !selectedGroup.isBatch && !currentBatchId;
      
      if (isSingleConverting) {
        currentBatchId = "batch_" + Date.now();
        currentCollectionName = editTitle || selectedGroup.deal.title;
        
        await fetch('/api/deals/update-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isBatch: true, 
            batchId: currentBatchId,
            dealId: selectedGroup.deal._id,
            title: currentCollectionName,
            videoUrl: editVideoUrl || "",
            category: editCategory || "Other"
          })
        });
      }

      let isPlatform = true;
      if (selectedGroup?.isBatch && selectedGroup.deals && selectedGroup.deals.length > 0) {
          isPlatform = selectedGroup.deals[0].linkType !== "own";
      } else if (selectedGroup?.deal) {
          isPlatform = selectedGroup.deal.linkType !== "own";
      } else if (activeTab === "own_links") {
          isPlatform = false;
      }

      const payload = {
        url: cleanPastedLink,
        expandedUrl: scrapedExpandedUrl, 
        title: scrapedTitle,
        image: scrapedImage,
        store: scrapedStore,
        price: scrapedPrice,
        usePlatformLink: isPlatform, 
        category: editCategory || "Other",
        videoUrl: editVideoUrl || "",
        batchId: currentBatchId,
        collectionName: currentCollectionName,
      };

      const res = await fetch('/api/deals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setNewLinkLabel(""); 
        fetchManualDeals(session.user.email); 
        closeDrawer(); 
        showToast("✅ Link Added Successfully!");
      } else {
        showToast("⚠️ Error: " + (data.message || "Failed to generate link"));
      }
    } catch (err) { 
        showToast("⚠️ Naya link add karne mein error aaya."); 
        console.error(err);
    }
    setLoading(false);
  };

  const openDrawer = (group, mode) => {
    setSelectedGroup(group);
    setDrawerMode(mode);
    setIsDrawerOpen(true);
    if (mode === 'edit') {
        setEditTitle(group.isBatch ? group.collectionName : group.deal.title);
        setEditVideoUrl(group.isBatch ? (group.deals[0]?.videoUrl || "") : (group.deal.videoUrl || ""));
        setEditCategory(group.isBatch ? (group.deals[0]?.category || "Other") : (group.deal.category || "Other"));
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => { setSelectedGroup(null); setDrawerMode(""); }, 300); 
  };

  if (loading || status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!session) return null; 

  const renderGroupedDeals = (groupedArray, type, filterMode) => {
    let filteredArray = groupedArray;
    if (filterMode === "single") filteredArray = groupedArray.filter(g => !g.isBatch);
    if (filterMode === "collection") filteredArray = groupedArray.filter(g => g.isBatch);

    if (filteredArray.length === 0) return <div className="text-center p-6 text-slate-400 font-bold border border-dashed rounded-lg">No deals match this filter.</div>;
    
    return filteredArray.map((group, idx) => (
      <div key={idx} className="flex flex-col p-4 border border-slate-200 rounded-xl bg-white mb-3 shadow-sm hover:shadow-md transition-all">
        {group.isBatch ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden flex-shrink-0 relative">
               <img src={group.deals[0]?.image || "https://via.placeholder.com/150"} alt="preview" className="w-full h-full object-contain p-1" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Collection</span>
              <h3 className="font-bold text-slate-900 mt-1 line-clamp-1">{group.collectionName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500 font-medium">{group.deals.length} Products</p>
                {/* 🚨 Click Count UI for Collections (Only Platform) */}
                {type === "platform" && (
                  <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    {group.totalClicks || 0}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <button onClick={() => openDrawer(group, 'view')} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded hover:bg-slate-200 w-full sm:w-auto">See All</button>
              <button onClick={() => openDrawer(group, 'edit')} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 w-full sm:w-auto flex justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden flex-shrink-0 relative">
               <img src={group.deal.image || "https://via.placeholder.com/150"} alt="preview" className="w-full h-full object-contain p-1" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 line-clamp-1">{group.deal.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500 font-medium">{group.deal.store}</p>
                {/* 🚨 Click Count UI for Single Links (Only Platform) */}
                {type === "platform" && (
                  <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    {group.deal.clicks || 0}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <button onClick={() => shareManualLink(group.deal, type)} className="px-3 py-1.5 bg-blue-100 text-blue-800 font-bold text-xs rounded hover:bg-blue-200 w-full sm:w-auto flex items-center gap-1 justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                Share
              </button>
              <button onClick={() => openDrawer(group, 'edit')} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 w-full sm:w-auto flex justify-center">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans relative pb-24">
      
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm z-[100] flex items-center gap-2 animate-[bounce_0.3s_ease-in-out]">
          {toastMessage}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        
        {/* 🚨 UPDATED TAB STYLES (Analytics Page Style) */}
        <div className="bg-slate-200/70 p-1.5 rounded-2xl flex gap-1 overflow-x-auto hide-scrollbar mb-6 shadow-sm">
          <button onClick={() => setActiveTab("auto_deals")} className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] md:text-xs font-black whitespace-nowrap transition-all ${activeTab === "auto_deals" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>Auto Post</button>
          <button onClick={() => setActiveTab("platform_links")} className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] md:text-xs font-black whitespace-nowrap transition-all ${activeTab === "platform_links" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>Platform Links</button>
          <button onClick={() => setActiveTab("own_links")} className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] md:text-xs font-black whitespace-nowrap transition-all ${activeTab === "own_links" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>Own Affiliate Links</button>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          
          {/* TAB 1: AUTO DEALS */}
          {activeTab === "auto_deals" && (
            <div className="space-y-6">
              
              {/* SETTINGS PREFERENCE BOX */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Auto-Post Preferences</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Control which products automatically post to your channel.</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-600">Status</span>
                      {/* 🚨 FIX: Bigger Toggle with ON/OFF labels */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isActive} onChange={() => setIsActive(!isActive)} />
                        <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                        <span className={`ml-2 text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-emerald-600' : 'text-slate-500'}`}>{isActive ? "ON" : "OFF"}</span>
                      </label>
                    </div>
                    <button onClick={handleSelectAll} className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold whitespace-nowrap bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-100">
                      {selectedCats.length === ALL_CATEGORIES.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {ALL_CATEGORIES.map(cat => (
                    <label key={cat} className={`flex items-center p-1.5 border rounded-lg cursor-pointer transition-colors ${selectedCats.includes(cat) ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <input type="checkbox" className="w-3 h-3 text-blue-600 rounded mr-2" checked={selectedCats.includes(cat)} onChange={() => handleCategoryToggle(cat)} />
                      <span className="text-[10px] font-extrabold text-slate-700 truncate">{cat}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button onClick={saveSettings} disabled={loading} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-extrabold hover:bg-blue-600 transition-colors shadow-md">
                    {loading ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>

              {/* AUTO POST DEALS LIST */}
              <div className="space-y-3">
                {deals.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 font-bold border-2 border-dashed rounded-xl bg-slate-50">No active auto-post deals.</div>
                ) : (
                  deals.map(deal => (
                    <div key={deal._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border border-slate-200 rounded-xl hover:shadow-md transition-shadow bg-white">
                      <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden flex-shrink-0 self-center sm:self-auto">
                         <img src={deal.image || "https://via.placeholder.com/150"} alt="preview" className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="flex flex-col flex-1 w-full min-w-0">
                        
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-extrabold text-blue-600 uppercase">{deal.category || "General"}</span>
                           {/* 🚨 Click Count UI for Auto Post */}
                           <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                             {deal.clicks || 0}
                           </span>
                        </div>
                        
                        <span className="font-bold text-slate-900 line-clamp-1">{deal.title}</span>
                        <div className="text-sm mt-1 flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold text-xs">₹{deal.dealPrice || deal.price || "Deal"}</span>
                          {deal.originalPrice && <span className="text-slate-400 line-through text-xs font-semibold">₹{deal.originalPrice}</span>}
                        </div>
                      </div>
                      <button onClick={() => shareAffiliateLink(deal)} className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white font-extrabold text-sm rounded-xl shadow-md hover:bg-blue-700 whitespace-nowrap flex justify-center items-center gap-2 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                        Share
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2 & 3: WITH FILTERS */}
          {(activeTab === "platform_links" || activeTab === "own_links") && (
            <div>
              <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
                <button 
                  onClick={() => activeTab === "platform_links" ? setFilterTab2("all") : setFilterTab3("all")} 
                  className={`px-4 py-2 rounded-xl font-bold text-xs shrink-0 transition-colors ${((activeTab === "platform_links" ? filterTab2 : filterTab3) === "all") ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  All Items
                </button>
                <button 
                  onClick={() => activeTab === "platform_links" ? setFilterTab2("single") : setFilterTab3("single")} 
                  className={`px-4 py-2 rounded-xl font-bold text-xs shrink-0 transition-colors ${((activeTab === "platform_links" ? filterTab2 : filterTab3) === "single") ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Single Products
                </button>
                <button 
                  onClick={() => activeTab === "platform_links" ? setFilterTab2("collection") : setFilterTab3("collection")} 
                  className={`px-4 py-2 rounded-xl font-bold text-xs shrink-0 transition-colors ${((activeTab === "platform_links" ? filterTab2 : filterTab3) === "collection") ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Collections (Batch)
                </button>
              </div>

              {activeTab === "platform_links" 
                ? renderGroupedDeals(platformDeals, "platform", filterTab2) 
                : renderGroupedDeals(ownDeals, "own", filterTab3)
              }
            </div>
          )}
        </div>
      </div>

      {/* --- THE BOTTOM DRAWER (Slide-Up) --- */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-4xl rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col transform transition-transform duration-300">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="font-extrabold text-xl text-slate-900">
                {drawerMode === 'view' ? 'Collection Products' : 'Edit Configuration'}
              </h2>
              <button onClick={closeDrawer} className="w-8 h-8 bg-slate-200 rounded-full text-slate-600 hover:bg-slate-900 hover:text-white font-extrabold flex items-center justify-center transition-colors">×</button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-white">
              {selectedGroup && (
                <>
                  {/* MODE 1: VIEW */}
                  {drawerMode === 'view' && selectedGroup.isBatch && (
                    <div className="space-y-3">
                      {selectedGroup.deals.map(deal => (
                        <div key={deal._id} className="flex justify-between items-center border border-slate-200 p-3 rounded-xl bg-slate-50 gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <img src={deal.image || "https://via.placeholder.com/50"} alt="thumb" className="w-12 h-12 object-contain border border-slate-200 bg-white rounded-lg p-1 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-sm text-slate-900 truncate">{deal.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-slate-500 font-medium">{deal.store}</p>
                                {/* 🚨 Click Count for items in Collection (Platform only) */}
                                {activeTab === "platform_links" && (
                                  <span className="text-[9px] font-black text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                    {deal.clicks || 0}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => shareManualLink(deal, deal.linkType)} className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-extrabold rounded-lg hover:bg-blue-200 shrink-0 transition-colors flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                            Share
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MODE 2: EDIT */}
                  {drawerMode === 'edit' && (
                    <div className="space-y-6 pb-10">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Title / Collection Name</label>
                          <input 
                            type="text" 
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Enter Name..."
                            className="w-full border-2 border-slate-200 rounded-xl p-3 bg-white text-slate-900 font-bold placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Video Link (YouTube/Insta)</label>
                          <input 
                            type="text" 
                            value={editVideoUrl}
                            onChange={(e) => setEditVideoUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full border-2 border-slate-200 rounded-xl p-3 bg-white text-slate-900 font-bold placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                          <select 
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full border-2 border-slate-200 rounded-xl p-3 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          >
                            <option value="Other">Other</option>
                            {ALL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>

                        <div className="md:col-span-2 flex justify-end pt-2">
                          <button onClick={handleSaveChanges} disabled={loading} className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-blue-600 transition-colors shadow-md">
                            {loading ? "Saving..." : "Save Details & Group"}
                          </button>
                        </div>
                      </div>
                      
                      <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-sm">
                        <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Products in this Deal</h4>
                        {(selectedGroup.isBatch ? selectedGroup.deals : [selectedGroup.deal]).map(d => (
                          <div key={d._id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100 gap-4">
                            <img src={d.image || "https://via.placeholder.com/50"} alt="thumb" className="w-12 h-12 object-contain border border-slate-200 bg-white rounded-lg p-1 shrink-0" />
                            <span className="text-sm truncate pr-2 flex-1 font-bold text-slate-800">{d.title}</span>
                            <button onClick={() => handleDeleteDeal(d._id)} className="text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm font-extrabold hover:bg-red-100 transition-colors shrink-0">
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="p-5 border-2 border-blue-200 bg-blue-50/50 rounded-2xl shadow-inner">
                        <label className="flex items-center text-sm font-extrabold text-blue-900 mb-3">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                          Add New Product Link to this Group
                        </label>
                        <input 
                          type="text" 
                          placeholder="Paste Original Product URL here..." 
                          className="w-full border-2 border-blue-300 rounded-xl p-4 mb-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                          value={newLinkLabel}
                          onChange={(e) => setNewLinkLabel(e.target.value)}
                        />
                        <button onClick={handleAddNewLinkToCollection} disabled={loading} className="w-full py-3.5 bg-blue-600 text-white font-extrabold rounded-xl hover:bg-blue-700 shadow-md disabled:bg-blue-400 transition-colors">
                          {loading ? "Generating Link..." : "Save Link & Add to Group"}
                        </button>
                      </div>

                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AutoPostPage() {
  return (
    <SessionProvider>
      <AutoPostContent />
    </SessionProvider>
  );
}