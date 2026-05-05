"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const VIP_BRANDS = ["flipkart", "myntra", "ajio", "shopsy", "agaro", "borosil", "milton", "dot & key", "nykaa", "mamaearth", "boat", "meesho", "croma", "swiggy", "zomato", "amazon"];

export default function CampaignRatesPage() {
  const router = useRouter();
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Popular"); 
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState("rates"); // "rates" or "info"

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('/api/campaigns');
        const data = await res.json();
        if (data.success && data.campaigns) {
          // Sirf Indian aur CPS campaigns filter karo
          const indianCPS = data.campaigns.filter(c => {
            const isIndia = c.countries && c.countries.some(country => country.iso === 'IN' || country.name?.toLowerCase().includes('india'));
            const isCPS = c.payout_type && c.payout_type.toLowerCase().includes('sale');
            return isIndia && isCPS;
          });
          setAllCampaigns(indianCPS);
        }
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
      }
      setLoading(false);
    };
    fetchRates();
  }, []);

  const getProcessedCampaigns = () => {
    let filtered = allCampaigns;

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.domain?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeTab === "Popular") {
      filtered = filtered.filter(camp => VIP_BRANDS.some(vip => (camp.name?.toLowerCase() || "").includes(vip)));
      filtered.sort((a, b) => {
        const aIndex = VIP_BRANDS.findIndex(v => a.name?.toLowerCase().includes(v));
        const bIndex = VIP_BRANDS.findIndex(v => b.name?.toLowerCase().includes(v));
        return aIndex - bIndex;
      });
    } else if (activeTab === "A-Z") {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (activeTab === "% Profit") {
      filtered = filtered.filter(c => (c.payout_type || "").includes("%"));
      filtered.sort((a, b) => parseFloat(b.payout || 0) - parseFloat(a.payout || 0)); 
    } else if (activeTab === "Flat Profit") {
      filtered = filtered.filter(c => !(c.payout_type || "").includes("%"));
      filtered.sort((a, b) => parseFloat(b.payout || 0) - parseFloat(a.payout || 0)); 
    }

    return filtered;
  };

  const displayedCampaigns = getProcessedCampaigns();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 pt-8 md:pt-10 relative">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        {/* HEADER SECTION (Non-Sticky) */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">Campaign Rates</h1>
          
          {/* RESTRICTION NOTICE */}
          <div className="bg-red-50 text-red-700 text-xs md:text-sm p-3 rounded-lg border border-red-100 font-medium mb-2">
            <strong>Restriction Notice:</strong> Running Google Ads & doing brand bidding is strictly prohibited with any Stores. Any violation of this will result in a block of your Account and your earnings will be withheld without further notice.
          </div>
        </div>
      </div>

      {/* 🚨 STICKY SECTION: Search & Tabs */}
      <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md pt-4 pb-2 border-b border-slate-200 mb-6 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          
          {/* SEARCH BAR */}
          <div className="relative mb-4 max-w-lg">
            <span className="absolute left-4 top-3.5 text-slate-400">
              {/* Search SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Search for stores..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white shadow-sm"
            />
          </div>

          {/* TABS */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 md:gap-4">
            {["Popular", "500+ Campaign (A-Z)", "% Profit", "Flat Profit"].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 md:px-6 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab 
                    ? "border-emerald-500 text-emerald-600" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {loading ? (
          <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <>
            {displayedCampaigns.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayedCampaigns.map((camp, idx) => (
                  <StoreCard 
                    key={camp.id || idx} 
                    campaign={camp} 
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setActiveDrawerTab("rates"); // Reset tab on open
                    }} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 font-bold">
                No stores found.
              </div>
            )}
          </>
        )}
      </div>

      {/* 🚨 THE SMART DRAWER (MODAL) */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-5 bg-slate-50 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <img src={selectedCampaign.image} alt="logo" className="w-10 h-10 object-contain rounded-lg bg-white p-1 border border-slate-200 shrink-0" />
                <h2 className="font-extrabold text-base md:text-lg text-slate-900 line-clamp-1">{selectedCampaign.name}</h2>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 🚨 GENERATE LINK BUTTON */}
                <button 
                  onClick={() => router.push('/creators/addlink')} 
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  <span className="hidden sm:inline">Generate Link</span>
                  <span className="sm:hidden">Link</span>
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => setSelectedCampaign(null)} 
                  className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full font-bold text-slate-600 hover:bg-slate-800 hover:text-white transition-colors shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 shrink-0 bg-white px-5 pt-3">
              <button 
                onClick={() => setActiveDrawerTab("rates")}
                className={`pb-3 mr-6 font-bold text-sm transition-colors border-b-2 ${activeDrawerTab === "rates" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                Payout Rates
              </button>
              <button 
                onClick={() => setActiveDrawerTab("info")}
                className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeDrawerTab === "info" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                Important Info
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-4 md:p-5 overflow-y-auto bg-slate-50 flex-1 hide-scrollbar">
              
              {/* TAB 1: RATES */}
              {activeDrawerTab === "rates" && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Category-wise Commission</h3>
                  {selectedCampaign.payout_categories && selectedCampaign.payout_categories.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCampaign.payout_categories.map((cat, i) => {
                        const isPercent = (cat.payout_type || "").toLowerCase().includes("%");
                        return (
                          <div key={i} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm">
                            <span className="font-bold text-slate-700 text-sm flex-1 pr-4">{cat.name}</span>
                            <span className="text-emerald-600 font-black text-sm whitespace-nowrap bg-emerald-50 px-2 py-1 rounded">
                              {isPercent ? `${cat.payout}%` : `₹${cat.payout}`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 font-bold bg-white rounded-xl border border-dashed border-slate-200">
                      Flat Payout: {selectedCampaign.payout} {(selectedCampaign.payout_type || "").toLowerCase().includes("%") ? "%" : "₹"}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: IMPORTANT INFO */}
              {activeDrawerTab === "info" && (
                <div className="space-y-4 text-sm text-slate-700">
                  
                  {/* Cookie Duration */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="block text-xs font-black text-slate-400 uppercase mb-1">Cookie Duration</span>
                    <span className="font-bold text-slate-800">{selectedCampaign.cookie_duration || "Not specified"}</span>
                  </div>

                  {/* Conversion Flow */}
                  {selectedCampaign.conversion_flow && selectedCampaign.conversion_flow !== "null" && selectedCampaign.conversion_flow !== "" && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="block text-xs font-black text-slate-400 uppercase mb-2">Conversion Flow</span>
                      <div className="text-slate-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedCampaign.conversion_flow }}></div>
                    </div>
                  )}

                  {/* Important T&C */}
                  {selectedCampaign.important_info_html && selectedCampaign.important_info_html !== "null" && selectedCampaign.important_info_html !== '""' && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="block text-xs font-black text-slate-400 uppercase mb-2">Terms & Conditions</span>
                      <div className="prose prose-sm prose-slate max-w-none text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedCampaign.important_info_html.replace(/^"|"$/g, '') }}></div>
                    </div>
                  )}

                  {(!selectedCampaign.important_info_html || selectedCampaign.important_info_html === "null" || selectedCampaign.important_info_html === '""') && 
                   (!selectedCampaign.conversion_flow || selectedCampaign.conversion_flow === "null" || selectedCampaign.conversion_flow === "") && (
                     <div className="text-center py-6 text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl bg-white">
                        No additional information provided by the store.
                     </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// REUSABLE STORE CARD COMPONENT
function StoreCard({ campaign, onClick }) {
  const pType = (campaign.payout_type || "").toLowerCase();
  const isPercent = pType.includes('%');
  const displayPayout = campaign.payout || "Variable";
  
  const isAmazon = (campaign.name || "").toLowerCase().includes("amazon");

  return (
    <div onClick={onClick} className="bg-white rounded-xl p-4 md:p-5 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center cursor-pointer relative overflow-hidden group">
      
      {isAmazon && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg tracking-wider uppercase z-10">
          Native Tag
        </div>
      )}

      <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mb-3">
        <img 
          src={campaign.image || "https://via.placeholder.com/150?text=Store"} 
          alt={campaign.name} 
          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
          onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Store" }}
        />
      </div>
      
      <h3 className="font-semibold text-slate-500 text-xs md:text-sm line-clamp-1 mb-2">{campaign.name}</h3>
      
      <div className="mt-auto w-full">
        <span className="block text-slate-800 font-black text-sm md:text-base">
          Earn Upto {isPercent ? `${displayPayout}%` : `₹${displayPayout}`}
        </span>
      </div>

      <button className="mt-3 w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-100 font-bold text-[10px] md:text-xs py-2 rounded-lg transition-colors">
        Check Rates
      </button>
    </div>
  );
}