"use client";
import { useState, useEffect, useMemo } from "react";
import { useSession, SessionProvider } from "next-auth/react"; 
import { useRouter } from "next/navigation";
import useSWR from "swr"; // 👈 NAYA: SWR Magic

// 👇 NAYA: Caching Fetcher Function
const fetcher = (url) => fetch(url).then((res) => res.json());

const ALL_CATEGORIES = [
  "Men's Fashion", "Women's Fashion", "Electronics & Mobiles", 
  "Beauty & Grooming", "Home & Kitchen", "Footwear", "Accessories", "Grocery", "Kids Product", "Special Deals"
];

function AutoPostContent() {
  const { data: session, status } = useSession(); 
  const router = useRouter();

  const [loading, setLoading] = useState(false); // Sirf buttons disable karne ke liye 
  const [sharingDealId, setSharingDealId] = useState(null); // 👈 NAYA: Share button ke spinner ke liye
  const [creatorUsername, setCreatorUsername] = useState("");
  
  const [activeTab, setActiveTab] = useState("auto_deals"); 
  const [filterTab2, setFilterTab2] = useState("all"); 
  const [filterTab3, setFilterTab3] = useState("all"); 

  const userEmail = session?.user?.email;

  // 👇 NAYA: Search, Filter States aur Time Helper
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterMenu, setFilterMenu] = useState("date"); // 'date' ya 'store'
  const [dateFilter, setDateFilter] = useState("all_time");
  const [customDate, setCustomDate] = useState({ start: "", end: "" });
  const [selectedStore, setSelectedStore] = useState("all");

  const timeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  // 👇 NAYA: SWR Caching
  const { data: userData, isLoading: isUserLoading, mutate: mutateUser } = useSWR(userEmail ? `/api/user/get-by-email?email=${userEmail}` : null, fetcher, { revalidateOnFocus: false });
  const { data: dealsData, mutate: mutateDeals } = useSWR(userEmail ? `/api/deals/get-filtered?email=${userEmail}` : null, fetcher);
  const { data: manualDealsData, mutate: mutateManualDeals } = useSWR(userEmail ? `/api/deals/get-manual-deals?email=${userEmail}` : null, fetcher);

  const isActive = userData?.success ? (userData.user.autodeal_active || false) : false;
  const isAmzShortlinkOn = userData?.success ? (userData.user.isAmazonShortlinkEnabled || false) : false;
  const selectedCats = userData?.success ? (userData.user.autoDealCategories || []) : [];
  
  const deals = dealsData?.success ? dealsData.deals : [];
  const platformDeals = manualDealsData?.success ? manualDealsData.data.platform : [];
  const ownDeals = manualDealsData?.success ? manualDealsData.data.own : [];

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

  // 👇 NAYA: SWR ke mutate functions (Refresh karne ke liye)
  const refreshData = () => {
    mutateDeals();
    mutateManualDeals();
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (userData?.success && userData?.user) {
       const uname = userData.user.username;
       if (!uname || uname === "creator") router.replace("/creators");
       else setCreatorUsername(uname);
    }
  }, [status, router, userData]);

  // 👇 NAYA: Toggle Handlers
  const handleCategoryToggle = (cat) => {
    const newCats = selectedCats.includes(cat) ? selectedCats.filter(c => c !== cat) : [...selectedCats, cat];
    mutateUser({ ...userData, user: { ...userData.user, autoDealCategories: newCats } }, false);
  };

  const handleSelectAll = () => {
    const newCats = selectedCats.length === ALL_CATEGORIES.length ? [] : [...ALL_CATEGORIES];
    mutateUser({ ...userData, user: { ...userData.user, autoDealCategories: newCats } }, false);
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
        refreshData(); 
      }
    } catch (err) { showToast("⚠️ Error saving settings!"); }
    setLoading(false);
  };

  const shareAffiliateLink = async (deal) => {
    if (!creatorUsername) return showToast("⚠️ Creator username missing!");
    
    // 🛑 SMART CACHE: Agar link pehle se generate ho chuka hai (SWR Cache mein hai)
    let linkToShare = "";
    if (deal.finalUrl && deal.isRaw) {
        linkToShare = deal.finalUrl;
    } else if (deal.shortCode) {
        linkToShare = `${window.location.origin}/go/${deal.shortCode}`;
    }

    if (linkToShare) {
        return executeShare(linkToShare, deal.title);
    }

    // 🔄 API CALL: Agar link nahi hai, toh API bulayenge aur Spinner ON karenge
    setSharingDealId(deal._id); // Spinner ON
    try {
      const res = await fetch('/api/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal._id, creatorUsername: creatorUsername, triggerSource: "control_room" })
      });
      const data = await res.json();
      
      if (data.success && (data.finalUrl || data.shortCode)) {
        
        // 🚀 THE FIX: Check karega ki Raw Amazon Link hai ya FavyLink Shortcode
        if (data.isRaw) {
            linkToShare = data.finalUrl;
        } else {
            linkToShare = `${window.location.origin}/go/${data.shortCode}`;
        }

        // Cache update karenge taaki next time API hit na ho
        const updatedDeals = deals.map(d => 
            d._id === deal._id ? { ...d, shortCode: data.shortCode, finalUrl: data.finalUrl, isRaw: data.isRaw } : d
        );
        mutateDeals({ success: true, deals: updatedDeals }, false);

        executeShare(linkToShare, deal.title);

      } else { showToast("⚠️ Link banane mein problem hui!"); }
    } catch (err) { showToast("⚠️ Error generating short link."); }
    
    setSharingDealId(null); // Spinner OFF
  };

  // Helper function taaki code clean rahe
  const executeShare = async (url, title) => {
    if (navigator.share) {
      await navigator.share({
        title: title,
        text: `Grab this awesome deal: ${title}`,
        url: url
      }).catch(()=>{});
    } else {
      navigator.clipboard.writeText(url);
      showToast(`✅ Link Copied to Share!`);
    }
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
        refreshData();
         
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
         refreshData(); 
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
            category: editCategory || "Special Deals"
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
        category: editCategory || "Special Deals",
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
        refreshData();
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

  // 👇 NAYA: PRO Filter & Search Engine (100% Accurate for All Tabs)
  const filterEngine = (dataList, isGroupedMode = false) => {
    if (!dataList) return [];

    // Search words ko alag-alag split karna taaki "shoes amazon" dono words aage-peeche bhi match karein
    const queryWords = searchQuery.toLowerCase().split(" ").filter(w => w.trim() !== "");

    return dataList.filter(item => {
      let titleStr = "";
      let storeStr = "";
      let dateStr = null;

      // 1. Data Extract Karna (Auto Post aur Manual dono ke liye alag logic)
      if (isGroupedMode) {
        if (item.isBatch) {
          titleStr = (item.collectionName || "").toLowerCase();
          storeStr = (item.deals?.[0]?.store || "").toLowerCase();
          dateStr = item.deals?.[0]?.createdAt || item.deals?.[0]?.updatedAt || item.createdAt;
        } else {
          titleStr = (item.deal?.title || "").toLowerCase();
          storeStr = (item.deal?.store || "").toLowerCase();
          dateStr = item.deal?.createdAt || item.deal?.updatedAt || item.createdAt;
        }
      } else {
        // Auto Post mode
        titleStr = (item.title || "").toLowerCase();
        storeStr = (item.store || "").toLowerCase();
        dateStr = item.createdAt || item.updatedAt;
      }

      // 2. Search Keyword Match (Title ya Store dono me se kahin bhi ho toh dikhega)
      if (queryWords.length > 0) {
        const isMatch = queryWords.every(word => titleStr.includes(word) || storeStr.includes(word));
        if (!isMatch) return false;
      }

      // 3. Store Filter Match (Case Insensitive)
      if (selectedStore !== "all" && storeStr !== selectedStore.toLowerCase()) {
        return false;
      }

      // 4. Date Filter Match (Midnight to Midnight Perfect Logic)
      if (dateFilter !== "all_time") {
        if (!dateStr) return false;
        
        const itemDate = new Date(dateStr);
        itemDate.setHours(0, 0, 0, 0); // Raat 12 baje se set karega calculation ke liye
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffDays = Math.round((today - itemDate) / (1000 * 60 * 60 * 24));

        if (dateFilter === "today" && diffDays > 0) return false;
        if (dateFilter === "yesterday" && diffDays !== 1) return false;
        if (dateFilter === "last_3" && diffDays > 3) return false;
        if (dateFilter === "last_7" && diffDays > 7) return false;
        if (dateFilter === "last_30" && diffDays > 30) return false;
        
        if (dateFilter === "custom" && customDate.start && customDate.end) {
          const start = new Date(customDate.start);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customDate.end);
          end.setHours(23, 59, 59, 999);
          
          const realTimeDate = new Date(dateStr);
          if (realTimeDate < start || realTimeDate > end) return false;
        }
      }

      return true; // Agar sab filters pass ho gaye, toh data dikhao
    });
  };

  const filteredAutoDeals = filterEngine(deals, false);
  const filteredPlatformDeals = filterEngine(platformDeals, true);
  const filteredOwnDeals = filterEngine(ownDeals, true);

  const availableStores = useMemo(() => {
    const stores = new Set();
    const activeData = activeTab === "auto_deals" ? deals : (activeTab === "platform_links" ? platformDeals : ownDeals);
    
    if (activeData) {
      activeData.forEach(item => {
        let st = "";
        if (activeTab === "auto_deals") {
          st = item.store;
        } else {
          st = item.isBatch ? item.deals?.[0]?.store : item.deal?.store;
        }
        if (st) stores.add(st.trim());
      });
    }
    return Array.from(stores).sort(); // Alphabetical sort karke return karega
  }, [activeTab, deals, platformDeals, ownDeals]);

  // ==========================================
  // 2️⃣ USKE BAAD: Skeleton Loader (Early Return)
  // ==========================================
  if (isUserLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans">
        <div className="max-w-4xl mx-auto">
          {/* Tabs Skeleton */}
          <div className="w-full h-12 bg-slate-200 rounded-xl animate-pulse mb-6"></div>
          
          {/* Main Box Skeleton */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="w-full h-32 bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="w-full h-24 bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="w-full h-24 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
  if (!session) return null;

  // ==========================================
  // 3️⃣ USKE BAAD: Render Grouped Deals Code
  // ==========================================
  const renderGroupedDeals = (groupedArray, type, filterMode) => {
    let finalArray = groupedArray;
    if (filterMode === "single") finalArray = groupedArray.filter(g => !g.isBatch);
    if (filterMode === "collection") finalArray = groupedArray.filter(g => g.isBatch);

    if (finalArray.length === 0) return <div className="text-center p-6 text-slate-400 font-bold border border-dashed rounded-lg">No deals match this filter.</div>;
    
    return finalArray.map((group, idx) => (
      <div key={idx} className="flex flex-col p-3 border border-slate-200 rounded-xl bg-white mb-2 shadow-sm hover:shadow-md transition-all">
        {group.isBatch ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden flex-shrink-0">
               <img src={group.deals[0]?.image || "https://via.placeholder.com/150"} alt="preview" className="w-full h-full object-contain p-1" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                 <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Collection</span>
                 <span className="text-[9px] font-medium text-slate-400">{timeAgo(group.deals[0]?.createdAt)}</span>
              </div>
              <h3 className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-tight mb-1">{group.collectionName}</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                <span>{group.deals.length} Products</span>
                {/* 🚀 THE FIX: group.deals[0] ke andar check karega */}
{type === "platform" && !(group.deals?.[0]?.store?.toLowerCase().includes("amazon") && !isAmzShortlinkOn) && (
  <>
    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
    <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-1.5 rounded py-0.5 text-[10px]">
      <svg className="w-2.5 h-2.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.303.197-1.591 1.591M21 12h-2.25m-.197 5.303-1.591-1.591M12 21.75V19.5m-5.303-.197 1.591-1.591M3 12h2.25m.197-5.303 1.591 1.591" />
      </svg> 
      {group.totalClicks || 0}
    </span>
  </>
)}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button onClick={() => openDrawer(group, 'view')} className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded hover:bg-slate-200 w-full">See All</button>
              <button onClick={() => openDrawer(group, 'edit')} className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 w-full flex justify-center"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden flex-shrink-0">
               <img src={group.deal.image || "https://via.placeholder.com/150"} alt="preview" className="w-full h-full object-contain p-1" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                 <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{group.deal.store || "Store"}</span>
                 <span className="text-[9px] font-medium text-slate-400">{timeAgo(group.deal.createdAt)}</span>
              </div>
              <h3 className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-tight mb-1">{group.deal.title}</h3>
             {/* 🚀 THE FIX: group.deal ke andar check karega */}
{type === "platform" && !(group.deal?.store?.toLowerCase().includes("amazon") && !isAmzShortlinkOn) && (
  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
    <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-1.5 rounded py-0.5">
      <svg className="w-2.5 h-2.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.303.197-1.591 1.591M21 12h-2.25m-.197 5.303-1.591-1.591M12 21.75V19.5m-5.303-.197 1.591-1.591M3 12h2.25m.197-5.303 1.591 1.591" />
      </svg>
      {group.deal.clicks || 0}
    </span>
  </div>
)}
            </div>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button onClick={() => shareManualLink(group.deal, type)} className="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-extrabold rounded hover:bg-blue-200 w-full flex items-center gap-1 justify-center">Share</button>
              <button onClick={() => openDrawer(group, 'edit')} className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 w-full flex justify-center"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
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
        
        {/* 👇 NAYA: Search Bar & Filter Button */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search products or stores..." 
              className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-700">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            <span className="text-[10px] font-extrabold uppercase">Filter</span>
          </button>
        </div>

        {/* 👇 NAYA: Compact (Patla) Tabs */}
        <div className="bg-slate-200/70 p-1 rounded-xl flex gap-1 overflow-x-auto hide-scrollbar mb-4 shadow-sm">
          <button onClick={() => setActiveTab("auto_deals")} className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black whitespace-nowrap transition-all ${activeTab === "auto_deals" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Auto Post</button>
          <button onClick={() => setActiveTab("platform_links")} className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black whitespace-nowrap transition-all ${activeTab === "platform_links" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Platform Links</button>
          <button onClick={() => setActiveTab("own_links")} className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black whitespace-nowrap transition-all ${activeTab === "own_links" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Own Links</button>
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
                        {/* 👇 NAYA: SWR Toggle Handler */}
                        <input type="checkbox" className="sr-only peer" checked={isActive} onChange={() => mutateUser({ ...userData, user: { ...userData.user, autodeal_active: !isActive } }, false)} />
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

              {/* AUTO POST DEALS */}
              <div className="space-y-3">
                {filteredAutoDeals.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 font-bold border-2 border-dashed rounded-xl bg-slate-50">No active auto-post deals.</div>
                ) : (
                  filteredAutoDeals.map(deal => (
                    <div key={deal._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border border-slate-200 rounded-xl hover:shadow-md transition-shadow bg-white">
                      <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden flex-shrink-0 self-center sm:self-auto">
                         <img src={deal.image || "https://via.placeholder.com/150"} alt="preview" className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="flex flex-col flex-1 w-full min-w-0">
                        
                        {/* 👇 NAYA: Time & Store Added (Cleaned Up) */}
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{deal.category || "General"}</span>
                           <span className="text-[9px] font-bold text-slate-400">{deal.store || "Store"} • {timeAgo(deal.createdAt || deal.updatedAt)}</span>
                        </div>
                        
                        <span className="font-bold text-slate-900 text-xs line-clamp-2 leading-tight">{deal.title}</span>
                        
                        <div className="text-sm mt-1.5 flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold text-xs">
                            {String(deal.dealPrice || deal.price || "Deal").toLowerCase() === 'deal' ? 'Deal' : `₹${String(deal.dealPrice || deal.price).replace(/₹/g, '').trim()}`}
                          </span>
                          {deal.originalPrice && <span className="text-slate-400 line-through text-xs font-semibold">₹{String(deal.originalPrice).replace(/₹/g, '').trim()}</span>}
                          
                       {/* 🚀 THE FIX: Asli Amazon Shortlink variable use kiya */}
{!(deal.store?.toLowerCase().includes("amazon") && !isAmzShortlinkOn) && (
  <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md flex items-center gap-1 ml-auto">
    <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.303.197-1.591 1.591M21 12h-2.25m-.197 5.303-1.591-1.591M12 21.75V19.5m-5.303-.197 1.591-1.591M3 12h2.25m.197-5.303 1.591 1.591" />
    </svg>
    {deal.clicks || 0}
  </span>
)}
                        </div>
                      </div>
                      <button 
                       onClick={() => shareAffiliateLink(deal)} 
                       disabled={sharingDealId === deal._id}
                       className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white font-extrabold text-sm rounded-xl shadow-md hover:bg-blue-700 whitespace-nowrap flex justify-center items-center gap-2 shrink-0 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                     >
                       {sharingDealId === deal._id ? (
                       // SPINNER UI
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                         // NORMAL ICON
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                         )}
                          {sharingDealId === deal._id ? "Generating..." : "Share"}
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
                ? renderGroupedDeals(filteredPlatformDeals, "platform", filterTab2) 
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
                                {/* 🚀 THE FIX: Drawer item ke andar check karega */}
{activeTab === "platform_links" && !(deal.store?.toLowerCase().includes("amazon") && !isAmzShortlinkOn) && (
  <span className="text-[9px] font-black text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
    <svg className="w-2.5 h-2.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.303.197-1.591 1.591M21 12h-2.25m-.197 5.303-1.591-1.591M12 21.75V19.5m-5.303-.197 1.591-1.591M3 12h2.25m.197-5.303 1.591 1.591" />
    </svg>
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

    {/* 👇 NAYA: Filter Popup Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsFilterOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg> Filter Deals</h3>
              <button onClick={() => setIsFilterOpen(false)} className="w-7 h-7 bg-slate-200 rounded-full text-slate-600 hover:bg-slate-800 hover:text-white font-extrabold flex items-center justify-center transition-colors">✕</button>
            </div>
            
            <div className="flex h-[280px]">
              {/* Left Side Tab Menu */}
              <div className="w-[35%] bg-slate-50 border-r border-slate-100 flex flex-col text-[11px] font-black">
                <button className={`p-3 text-left transition-colors ${filterMenu === 'date' ? 'bg-white text-blue-600 border-l-4 border-blue-600' : 'text-slate-500'}`} onClick={() => setFilterMenu('date')}>Day & Date</button>
                <button className={`p-3 text-left transition-colors ${filterMenu === 'store' ? 'bg-white text-blue-600 border-l-4 border-blue-600' : 'text-slate-500'}`} onClick={() => setFilterMenu('store')}>Store</button>
              </div>
              
              {/* Right Side Options */}
              <div className="w-[65%] p-4 overflow-y-auto bg-white text-[11px] font-bold text-slate-700">
                {filterMenu === 'date' && (
                  <div className="space-y-3">
                    {['all_time', 'today', 'yesterday', 'last_3', 'last_7', 'last_30', 'custom'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" checked={dateFilter === opt} onChange={() => setDateFilter(opt)} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500" />
                        <span className="capitalize group-hover:text-blue-600">{opt.replace('_', ' ')}</span>
                      </label>
                    ))}
                    
                    {dateFilter === 'custom' && (
                      <div className="flex flex-col gap-2 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 animate-in fade-in">
                        <input type="date" value={customDate.start} onChange={e => setCustomDate({ ...customDate, start: e.target.value })} className="p-1.5 border border-slate-200 rounded text-[10px] focus:outline-none focus:border-blue-500" />
                        <span className="text-center text-slate-400 text-[9px] uppercase">to</span>
                        <input type="date" value={customDate.end} onChange={e => setCustomDate({ ...customDate, end: e.target.value })} className="p-1.5 border border-slate-200 rounded text-[10px] focus:outline-none focus:border-blue-500" />
                      </div>
                    )}
                  </div>
                )}
                
                {filterMenu === 'store' && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" checked={selectedStore === 'all'} onChange={() => setSelectedStore('all')} className="w-3.5 h-3.5 text-blue-600" />
                      <span className="group-hover:text-blue-600">All Stores</span>
                    </label>
                    {availableStores.length === 0 && <p className="text-[10px] text-slate-400 font-normal italic mt-2">No stores found.</p>}
                    {availableStores.map(st => (
                      <label key={st} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" checked={selectedStore === st} onChange={() => setSelectedStore(st)} className="w-3.5 h-3.5 text-blue-600" />
                        <span className="group-hover:text-blue-600 truncate">{st}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-3 border-t border-slate-100 flex justify-end bg-white">
               <button onClick={() => setIsFilterOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-[11px] font-black transition-colors shadow-sm active:scale-95">Apply Filter</button>
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