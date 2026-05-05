"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16', '#6366f1'];

function AnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Navigation & Filters
  const [activeMainTab, setActiveMainTab] = useState("insights"); 
  const [timeline, setTimeline] = useState("3days"); // 🚨 FIX: Default Last 3 Days set kar diya
  
  // Sub-tabs & Filters
  const [pieTab, setPieTab] = useState("store"); 
  const [linkSourceTab, setLinkSourceTab] = useState("auto"); 
  const [linkStoreFilter, setLinkStoreFilter] = useState("All");
  const [orderStoreFilter, setOrderStoreFilter] = useState("All"); 
  
  // Drawer & Toast State
  const [selectedLink, setSelectedLink] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // --- PAYOUT STATES ---
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentDetails, setPaymentDetails] = useState(""); 
  const [bankAccount, setBankAccount] = useState("");       
  const [ifscCode, setIfscCode] = useState("");             
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatorUsername, setCreatorUsername] = useState(""); 
  
  // MASTER STATE FOR WALLET BALANCE
  const [analyticsSummary, setAnalyticsSummary] = useState({
      totalEarnings: 0,
      approvedEarnings: 0,
      pendingEarnings: 0,
      availableBalance: 0
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 🚨 FIX: Wallet Button URL Catch Logic (Direct Payout Tab Khulna)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "payouts") {
        setActiveMainTab("payouts");
      }
    }
  }, []);

  const fetchAnalyticsAndHistory = useCallback(async (username, timeFilter) => {
    try {
      const statsRes = await fetch(`/api/analytics/get-data?username=${username}&timeline=${timeFilter}`);
      const statsData = await statsRes.json();
      
      const histRes = await fetch(`/api/admin/payouts?username=${username}`);
      const histData = await histRes.json();

      if (statsData.success && histData.success) {
          setStats(statsData.data);
          const history = histData.data;
          setPayoutHistory(history);
          
          const { approvedEarnings, totalEarnings, pendingEarnings } = statsData.data.overall;
          
          const totalProcessedOrPendingPayouts = history.reduce((sum, req) => {
              if (req.status !== 'rejected') return sum + (parseFloat(req.amount) || 0);
              return sum;
          }, 0);

          const finalAvailableBalance = Math.max(0, (approvedEarnings || 0) - totalProcessedOrPendingPayouts);

          setAnalyticsSummary({
              totalEarnings: totalEarnings || 0,
              approvedEarnings: approvedEarnings || 0,
              pendingEarnings: pendingEarnings || 0,
              availableBalance: finalAvailableBalance
          });
      } else {
          showToast("❌ Failed to fetch data.");
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showToast("❌ Server Error.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");

    if (status === "authenticated" && session?.user?.email) {
      setLoading(true);
      fetch(`/api/user/get-by-email?email=${session.user.email}`)
        .then(res => res.json())
        .then(userData => {
          if (userData.success && userData.user) {
            const currentUsername = userData.user.username;
            
            if (!currentUsername || currentUsername === "creator") {
              router.replace("/creators"); 
            } else {
              setCreatorUsername(currentUsername);
              fetchAnalyticsAndHistory(currentUsername, timeline);
            }
          }
        });
    }
  }, [status, session, router, timeline, fetchAnalyticsAndHistory]);

  const handleWithdraw = async () => {
    let finalPaymentDetails = "";
    
    if (paymentMethod === "BANK") {
      if (!bankAccount.trim() || !ifscCode.trim()) {
        return showToast("⚠️ Please enter both Account Number and IFSC Code");
      }
      finalPaymentDetails = `A/C: ${bankAccount.trim()}, IFSC: ${ifscCode.trim().toUpperCase()}`;
    } else {
      if (!paymentDetails.trim()) {
        return showToast("⚠️ Please enter your UPI ID");
      }
      finalPaymentDetails = paymentDetails.trim();
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: creatorUsername, 
          amount: analyticsSummary.availableBalance,
          paymentMethod, 
          paymentDetails: finalPaymentDetails 
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        showToast("🎉 Request Saved! Payment in 1-2 working days.");
        setShowWithdrawModal(false);
        setPaymentDetails("");
        setBankAccount("");
        setIfscCode("");
        
        await fetchAnalyticsAndHistory(creatorUsername, timeline);
      } else {
        showToast("❌ " + data.message);
      }
    } catch (e) {
      console.error("Client Fetch Error:", e);
      showToast("❌ Server Error");
    }
    setIsSubmitting(false);
  };

  if (status === "loading" || loading && !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold text-sm">Fetching Data...</p>
      </div>
    );
  }

  if (!stats) return <div className="text-center p-10 font-bold text-slate-500">No data found.</div>;

  const currentSourceStats = linkSourceTab === "auto" ? stats.autoPostStats : stats.manualPostStats;
  const uniqueStores = ["All", ...new Set(currentSourceStats.links.map(l => l.store || "Unknown"))];
  
  // 🚨 FIX: Filter and SORT by highest commission
  const filteredLinks = currentSourceStats.links
    .filter(l => linkStoreFilter === "All" || (l.store || "Unknown") === linkStoreFilter)
    .sort((a, b) => (b.earnings || 0) - (a.earnings || 0)); // High commission wala upar

  let allTransactions = [];
  const allStoreNames = new Set();
  
  stats.autoPostStats.links.forEach(link => {
      if (link.transactions && link.transactions.length > 0) {
          allStoreNames.add(link.store || "Unknown");
          link.transactions.forEach(txn => {
              allTransactions.push({ ...txn, store: link.store || "Unknown", source: "Auto-Post" });
          });
      }
  });

  stats.manualPostStats.links.forEach(link => {
      if (link.transactions && link.transactions.length > 0) {
          allStoreNames.add(link.store || "Unknown");
          link.transactions.forEach(txn => {
              allTransactions.push({ ...txn, store: link.store || "Unknown", source: "Manual" });
          });
      }
  });
  
  allTransactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
  const uniqueOrderStores = ["All", ...Array.from(allStoreNames)];
  const filteredOrders = allTransactions.filter(o => orderStoreFilter === "All" || o.store === orderStoreFilter);

  const sourcePieData = [
    { name: 'Auto-Post', value: stats.autoPostStats.earnings },
    { name: 'Manual', value: stats.manualPostStats.earnings }
  ].filter(d => d.value > 0);

  const categoryPieData = [...(stats.graphs.categories || [])].sort((a, b) => b.value - a.value).slice(0, 10);

  const { availableBalance } = analyticsSummary;
  const payoutProgress = Math.min((availableBalance / 250) * 100, 100);
  const canWithdraw = availableBalance >= 250;

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6 font-sans pb-24 relative">
      
      {toastMessage && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-2xl font-bold text-xs z-[200] animate-[bounce_0.3s_ease-in-out]">
          {toastMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-5">
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
          <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Analytics & Payouts</h1></div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="bg-slate-200/70 p-1 rounded-xl flex gap-1 overflow-x-auto hide-scrollbar">
               <button onClick={() => setActiveMainTab("insights")} className={`shrink-0 px-3 py-2 rounded-lg text-[11px] font-black transition-all ${activeMainTab === 'insights' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Insights</button>
               <button onClick={() => setActiveMainTab("orders")} className={`shrink-0 px-3 py-2 rounded-lg text-[11px] font-black transition-all ${activeMainTab === 'orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Order Insight</button>
               <button onClick={() => setActiveMainTab("payouts")} className={`shrink-0 px-3 py-2 rounded-lg text-[11px] font-black transition-all ${activeMainTab === 'payouts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Payouts</button>
            </div>
            {/* 🚨 FIX: "Last 3 Days" Added here */}
            <select value={timeline} onChange={(e) => setTimeline(e.target.value)} className="bg-white border border-slate-200 text-slate-700 font-bold text-[11px] py-2 px-3 rounded-xl shadow-sm outline-none focus:border-blue-500 cursor-pointer">
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="3days">Last 3 Days</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* TAB 1: INSIGHTS */}
        {activeMainTab === "insights" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
               <CompactStatBox title="Clicks" value={stats.overall.totalClicks} color="blue" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>} />
               <CompactStatBox title="Orders" value={stats.overall.totalOrders} color="emerald" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>} />
               <CompactStatBox title="Conv Rate" value={`${stats.overall.conversion}%`} color="purple" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>} />
               <CompactStatBox title="Avg Order" value={`₹${stats.overall.aov}`} color="orange" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>} />
               <CompactStatBox title="Sale Amt" value={`₹${stats.overall.totalSaleAmount.toLocaleString('en-IN')}`} color="pink" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>} />
               <div className="bg-blue-600 rounded-xl p-3 shadow-md text-white flex flex-col justify-center">
                 <div className="flex items-center gap-1 mb-0.5 opacity-90">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="text-[9px] font-bold uppercase tracking-wider">Est. Earnings</span>
                 </div>
                 <span className="text-base font-black">₹{stats.overall.totalEarnings.toFixed(2)}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm lg:col-span-2 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Performance Timeline</h3>
                   <div className="flex items-center gap-3 text-[9px] font-bold uppercase text-slate-500">
                     <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Clicks</div>
                     <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Orders</div>
                     <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Earnings</div>
                   </div>
                </div>
                <div className="h-48 w-full">
                  {stats.graphs.daily.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.graphs.daily} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis dataKey="date" tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" hide />
                        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                        <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2.5} dot={{r: 3}} activeDot={{r: 5}} name="Clicks" />
                        <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2.5} dot={{r: 3}} activeDot={{r: 5}} name="Orders" />
                        <Line yAxisId="left" type="monotone" dataKey="earnings" stroke="#a855f7" strokeWidth={2.5} dot={{r: 3}} activeDot={{r: 5}} name="Commission (₹)" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100 p-4 text-center">
                       <p className="text-slate-400 font-bold text-xs">Line graph requires at least 2 days of data.</p>
                       <p className="text-slate-400 font-medium text-[10px] mt-1">Please change the filter to 'Last 7 Days' to view the trend.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col">
                <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                  <button onClick={() => setPieTab("store")} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md transition-colors ${pieTab === 'store' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Store</button>
                  <button onClick={() => setPieTab("category")} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md transition-colors ${pieTab === 'category' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Category</button>
                  <button onClick={() => setPieTab("source")} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md transition-colors ${pieTab === 'source' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Source</button>
                </div>
                <div className="flex-1">
                  {pieTab === "store" && <PieChartBox data={stats.graphs.stores} />}
                  {pieTab === "category" && <PieChartBox data={categoryPieData} limit={10} />}
                  {pieTab === "source" && <PieChartBox data={sourcePieData} />}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
               <div className="flex border-b border-slate-800">
                 <button onClick={() => setLinkSourceTab("auto")} className={`flex-1 py-3 text-center font-black text-xs md:text-sm transition-colors uppercase tracking-wider ${linkSourceTab === 'auto' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/50'}`}>Auto-Post Deals</button>
                 <button onClick={() => setLinkSourceTab("manual")} className={`flex-1 py-3 text-center font-black text-xs md:text-sm transition-colors uppercase tracking-wider ${linkSourceTab === 'manual' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/50'}`}>Manual Links</button>
               </div>
               <div className="p-4 grid grid-cols-3 md:grid-cols-6 gap-3">
                 <DeepDiveBox label="Clicks" value={currentSourceStats.clicks} />
                 <DeepDiveBox label="Orders" value={currentSourceStats.orders} />
                 <DeepDiveBox label="Sale Amt" value={`₹${currentSourceStats.saleAmount.toLocaleString('en-IN')}`} />
                 <DeepDiveBox label="Est. Earnings" value={`₹${currentSourceStats.earnings.toFixed(2)}`} highlight="text-emerald-400" />
                 <DeepDiveBox label="Conv. Rate" value={`${currentSourceStats.conversion}%`} />
                 <DeepDiveBox label="EPC" value={`₹${currentSourceStats.epc}`} highlight="text-blue-400" />
               </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Top Performing Links</h3>
                <select value={linkStoreFilter} onChange={(e) => setLinkStoreFilter(e.target.value)} className="bg-white border border-slate-200 text-slate-600 font-bold text-[10px] uppercase py-1.5 px-3 rounded-lg outline-none cursor-pointer w-full sm:w-auto">
                  {uniqueStores.map(store => <option key={store} value={store}>{store}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                {filteredLinks.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 font-bold text-xs">No active links found.</div>
                ) : (
                  filteredLinks.map((link, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-blue-300 hover:shadow-sm transition-all group">
                       <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <img src={link.imageUrl?.startsWith('http') ? link.imageUrl : 'https://via.placeholder.com/150?text=Product'} alt="product" className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg object-contain shrink-0 p-0.5" />
                          <div className="flex-1 overflow-hidden">
                             <h4 className="font-extrabold text-slate-800 text-[11px] md:text-xs line-clamp-1">{link.title || "Untitled Product"}</h4>
                             <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{link.store || "Store"}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 shrink-0">
                          <div className="hidden sm:block text-right">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Clicks</p>
                             <p className="font-black text-slate-700 text-xs">{link.clicks}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Earnings</p>
                             <p className="font-black text-emerald-600 text-sm">₹{(link.earnings || 0).toFixed(1)}</p>
                          </div>
                          <button onClick={() => setSelectedLink(link)} className="w-7 h-7 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-full flex items-center justify-center transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                          </button>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTUAL ORDERS */}
        {activeMainTab === "orders" && (
          <div className="space-y-5 animate-in fade-in duration-300">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                   <h2 className="text-lg font-black text-slate-900">Actual Order Insight</h2>
                   <p className="text-[10px] font-bold text-slate-500 mt-1">Discover exactly what your audience is buying through your links.</p>
                </div>
                <select value={orderStoreFilter} onChange={(e) => setOrderStoreFilter(e.target.value)} className="bg-white border border-slate-200 text-slate-600 font-bold text-[10px] uppercase py-1.5 px-3 rounded-lg outline-none cursor-pointer w-full sm:w-auto">
                  {uniqueOrderStores.map(store => <option key={store} value={store}>{store}</option>)}
                </select>
             </div>
             <div className="space-y-3">
               {filteredOrders.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="text-3xl mb-2">🛒</div>
                    <p className="text-slate-500 font-bold text-sm">No orders tracked in this period.</p>
                  </div>
               ) : (
                 filteredOrders.map((txn, idx) => (
                   <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-200 transition-colors">
                      <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black uppercase">{txn.store}</span>
                            <span className="text-slate-400 text-[10px] font-bold">ID: {txn.orderId || "N/A"}</span>
                         </div>
                         <h4 className="font-extrabold text-slate-800 text-sm leading-tight line-clamp-2 mb-2">{txn.productName || "Product Name Hidden"}</h4>
                         <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400">
                           <span className="bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{txn.category || "General"}</span>
                           <span>•</span>
                           <span className="uppercase text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{txn.source}</span>
                           <span>•</span>
                           <span>{new Date(txn.transactionDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                         </div>
                      </div>
                      <div className="flex items-center justify-between md:flex-col md:items-end shrink-0 border-t border-slate-100 md:border-t-0 pt-3 md:pt-0">
                         <div className="text-left md:text-right mb-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Commission / Sale</p>
                            <p className="font-black text-sm text-slate-800"><span className="text-emerald-600">₹{txn.commission}</span> <span className="text-slate-300">/</span> ₹{txn.saleAmount}</p>
                         </div>
                         <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${txn.status === 'pending' ? 'bg-orange-100 text-orange-600' : txn.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {txn.status}
                         </span>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}

        {/* TAB 3: PAYOUTS */}
        {activeMainTab === "payouts" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Mined</p>
                  <h2 className="text-3xl font-black text-slate-800">₹{analyticsSummary.totalEarnings.toFixed(2)}</h2>
               </div>
               <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span> Pending Tracked</p>
                  <h2 className="text-3xl font-black text-orange-600">₹{analyticsSummary.pendingEarnings.toFixed(2)}</h2>
               </div>
               <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm text-center relative overflow-hidden">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Available to Withdraw</p>
                  <h2 className="text-3xl font-black text-emerald-700">₹{availableBalance.toFixed(2)}</h2>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8 relative overflow-hidden">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex-1 w-full">
                     <h3 className="font-extrabold text-xl text-slate-800 mb-2">Withdrawal Progress</h3>
                     <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                        <span>Current: ₹{availableBalance.toFixed(2)}</span>
                        <span>Threshold: ₹250</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden border border-slate-200">
                        <div className={`h-full rounded-full transition-all duration-1000 ${canWithdraw ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-blue-500'}`} style={{ width: `${payoutProgress}%` }}></div>
                     </div>
                     {canWithdraw ? (
                        <p className="text-xs font-bold text-emerald-600">🎉 Minimum threshold reached! You can withdraw your earnings.</p>
                     ) : (
                        <p className="text-xs font-bold text-slate-500">Earn ₹{(250 - availableBalance).toFixed(2)} more to unlock withdrawal button.</p>
                     )}
                  </div>
                  <div className="shrink-0 w-full md:w-auto">
                     <button 
                        disabled={!canWithdraw}
                        onClick={() => setShowWithdrawModal(true)}
                        className={`w-full md:w-auto px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${canWithdraw ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30 hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                     >
                        {canWithdraw ? 'Request Payout' : 'Locked 🔒'}
                     </button>
                  </div>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
               <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Recent Withdrawals</h3>
               </div>
               <div className="p-0">
                  {payoutHistory.length === 0 ? (
                     <div className="text-center py-8 text-slate-400 font-bold text-xs">No withdrawal history found.</div>
                  ) : (
                     <div className="divide-y divide-slate-100">
                        {payoutHistory.map((req, idx) => (
                           <div key={idx} className="p-4 md:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div>
                                 <p className="font-black text-slate-800 text-sm">₹{req.amount.toFixed(2)}</p>
                                 <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(req.createdAt).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})} • {req.paymentMethod}</p>
                              </div>
                              <div className="text-right">
                                 <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${req.status === 'pending' ? 'bg-orange-100 text-orange-600' : req.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    {req.status === 'pending' ? 'Processing' : req.status}
                                 </span>
                                 {req.status === 'pending' && <p className="text-[9px] font-bold text-orange-500 mt-1 animate-pulse">Expected in 1-2 days</p>}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 md:p-8 mt-6">
               <h3 className="font-black text-blue-900 text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
                  <span className="text-lg">💡</span> How Tracking & Payouts Work
               </h3>
               <div className="space-y-5">
                  <div className="flex gap-3 items-start">
                     <div className="bg-blue-200 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-xs mt-0.5">1</div>
                     <div>
                        <h4 className="font-extrabold text-blue-900 text-sm">Tracking vs Confirmation Delay</h4>
                        <p className="text-xs font-bold text-slate-600 mt-1.5 leading-relaxed">Clicks and Pending Sales usually reflect within 24-48 hours. However, merchants (like Flipkart/Amazon) take 30-60 days to verify and 'Approve' the earnings after the return period is over.</p>
                     </div>
                  </div>
                  <div className="flex gap-3 items-start">
                     <div className="bg-blue-200 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-xs mt-0.5">2</div>
                     <div>
                        <h4 className="font-extrabold text-blue-900 text-sm">Zero Tracking on 'Own Links'</h4>
                        <p className="text-xs font-bold text-slate-600 mt-1.5 leading-relaxed">We strictly respect your privacy. Links added manually as 'Own Links' (non-platform links) are not tracked by our system. No clicks or sales data will be collected for them.</p>
                     </div>
                  </div>
                  <div className="flex gap-3 items-start">
                     <div className="bg-blue-200 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-xs mt-0.5">3</div>
                     <div>
                        <h4 className="font-extrabold text-blue-900 text-sm">Minimum Payout Threshold</h4>
                        <p className="text-xs font-bold text-slate-600 mt-1.5 leading-relaxed">You can request a withdrawal directly to your UPI or Bank account once your "Available to Withdraw" balance reaches ₹250.</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* DRAWER */}
      {selectedLink && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLink(null)}></div>
          <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-0 sm:px-4">
            <div className="bg-white w-full max-w-2xl rounded-t-[2rem] shadow-2xl flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-full duration-300">
              <div className="p-4 md:p-6 border-b border-slate-100 flex items-start justify-between shrink-0">
                 <div className="flex items-center gap-4 overflow-hidden flex-1 pr-4">
                   <img src={selectedLink.imageUrl?.startsWith('http') ? selectedLink.imageUrl : 'https://via.placeholder.com/150?text=Product'} className="w-14 h-14 rounded-xl object-contain bg-slate-50 border border-slate-200 shrink-0 p-1" />
                   <div className="overflow-hidden">
                     <h2 className="font-black text-base md:text-lg text-slate-900 leading-tight mb-1.5 truncate">{selectedLink.title}</h2>
                     <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/go/${selectedLink.shortCode}`); showToast("✅ Link copied successfully!"); }} className="flex items-center gap-1.5 text-[10px] font-extrabold text-blue-600 hover:text-white hover:bg-blue-600 transition-colors uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md w-max border border-blue-100">
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                       Copy Short Link
                     </button>
                   </div>
                 </div>
                 <button onClick={() => setSelectedLink(null)} className="w-8 h-8 bg-slate-100 rounded-full font-bold text-slate-500 hover:bg-slate-200 transition-colors shrink-0 flex items-center justify-center">✕</button>
              </div>
              <div className="overflow-y-auto p-4 md:p-6 space-y-6 flex-1 hide-scrollbar">
                 <div className="grid grid-cols-3 gap-2 md:gap-3">
                   <DrawerStatBox label="Clicks" value={selectedLink.clicks} />
                   <DrawerStatBox label="Orders" value={selectedLink.orders} />
                   <DrawerStatBox label="Conv. Rate" value={`${selectedLink.conversion}%`} color="text-purple-600" />
                   <DrawerStatBox label="Commission" value={`₹${(selectedLink.earnings || 0).toFixed(2)}`} color="text-emerald-600" />
                   <DrawerStatBox label="Sale Amt" value={`₹${(selectedLink.saleAmount || 0).toLocaleString('en-IN')}`} />
                   <DrawerStatBox label="AOV" value={`₹${selectedLink.aov}`} />
                 </div>
                 <div>
                   <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="bg-slate-100 p-1.5 rounded-lg text-base">🛒</span> Actual Products Bought
                   </h3>
                   {selectedLink.transactions && selectedLink.transactions.length > 0 ? (
                     <div className="space-y-3">
                       {selectedLink.transactions.map((txn, idx) => (
                         <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-200 transition-colors">
                            <div className="flex-1">
                               <p className="font-extrabold text-slate-800 text-sm leading-tight mb-2">{txn.productName || "Product Name Hidden"}</p>
                               <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                 <span className="bg-white text-slate-500 px-1.5 py-0.5 border border-slate-200 rounded">{txn.category || "General"}</span>
                                 <span>•</span>
                                 <span>ID: {txn.orderId || "N/A"}</span>
                                 <span>•</span>
                                 <span>{new Date(txn.transactionDate).toLocaleDateString('en-IN')}</span>
                               </div>
                            </div>
                            <div className="flex items-center justify-between sm:flex-col sm:items-end shrink-0 border-t border-slate-200 sm:border-t-0 pt-3 sm:pt-0">
                               <div className="text-left sm:text-right mb-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Comm. / Sale</p>
                                  <p className="font-black text-sm text-slate-800"><span className="text-emerald-600">₹{txn.commission}</span> <span className="text-slate-300">/</span> ₹{txn.saleAmount}</p>
                               </div>
                               <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${txn.status === 'pending' ? 'bg-orange-100 text-orange-600' : txn.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                  {txn.status}
                               </span>
                            </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                       <p className="text-slate-400 font-bold text-xs">No confirmed orders for this link in the selected period.</p>
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && setShowWithdrawModal(false)}></div>
            
            <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="font-black text-lg text-slate-900">Request Payout</h2>
                  <button disabled={isSubmitting} onClick={() => setShowWithdrawModal(false)} className="w-8 h-8 bg-slate-200 rounded-full font-bold text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors">✕</button>
               </div>
               
               <div className="p-5 md:p-6 space-y-5">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex justify-between items-center">
                     <span className="font-bold text-emerald-700 text-[10px] uppercase tracking-wider">Withdrawing Amount</span>
                     <span className="font-black text-2xl text-emerald-600">₹{availableBalance.toFixed(2)}</span>
                  </div>
                  
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Select Payment Method</label>
                     <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                        <button onClick={() => setPaymentMethod("UPI")} className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-colors ${paymentMethod === "UPI" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>UPI ID</button>
                        <button onClick={() => setPaymentMethod("BANK")} className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-colors ${paymentMethod === "BANK" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Bank Account</button>
                     </div>
                  </div>

                  {paymentMethod === "UPI" ? (
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Enter UPI ID</label>
                        <input 
                           type="text" 
                           value={paymentDetails}
                           onChange={(e) => setPaymentDetails(e.target.value)}
                           placeholder="e.g. yourname@okhdfcbank"
                           className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                     </div>
                  ) : (
                     <div className="space-y-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Bank Account Number</label>
                           <input 
                              type="number" 
                              value={bankAccount}
                              onChange={(e) => setBankAccount(e.target.value)}
                              placeholder="e.g. 123456789012"
                              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">IFSC Code</label>
                           <input 
                              type="text" 
                              value={ifscCode}
                              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                              placeholder="e.g. SBIN0001234"
                              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all uppercase"
                           />
                        </div>
                     </div>
                  )}

                  <button 
                     disabled={isSubmitting || (paymentMethod === 'UPI' ? !paymentDetails.trim() : (!bankAccount.trim() || !ifscCode.trim()))}
                     onClick={handleWithdraw}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                  >
                     {isSubmitting ? "Processing..." : "Confirm & Withdraw"}
                  </button>
                  <p className="text-center text-[9px] font-bold text-slate-400">Payments are securely processed and transferred within 1-2 working days.</p>
               </div>
            </div>
         </div>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

/* --- COMPACT COMPONENTS --- */

function CompactStatBox({ title, value, icon, color }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className={`rounded-xl p-3 shadow-sm flex flex-col justify-center border border-white ${colorMap[color] || 'bg-white'}`}>
      <div className="flex items-center gap-1 mb-0.5 opacity-80">
        {icon}
        <p className="font-bold text-[9px] uppercase tracking-wider truncate">{title}</p>
      </div>
      <h2 className="text-base font-black">{value}</h2>
    </div>
  );
}

function DeepDiveBox({ label, value, highlight }) {
  return (
    <div className="bg-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <h3 className={`text-base font-black ${highlight || 'text-white'}`}>{value}</h3>
    </div>
  );
}

function DrawerStatBox({ label, value, color }) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col items-center justify-center text-center">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <h3 className={`text-sm font-black ${color || 'text-slate-800'}`}>{value}</h3>
    </div>
  );
}

function PieChartBox({ data, limit }) {
  const displayData = limit ? data.slice(0, limit) : data;
  if (!displayData || displayData.length === 0) return <div className="h-32 flex items-center justify-center text-slate-400 font-bold text-[10px] border border-dashed border-slate-200 rounded-xl bg-slate-50">No Data Available</div>;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 h-full">
      <div className="w-28 h-28 shrink-0 mx-auto sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={displayData} innerRadius={25} outerRadius={50} paddingAngle={2} dataKey="value">
              {displayData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: 'bold' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 w-full space-y-1.5 max-h-36 overflow-y-auto hide-scrollbar">
        {displayData.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-[10px]">
             <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="font-bold text-slate-600 truncate">{item.name}</span>
             </div>
             <span className="font-black text-slate-800 shrink-0">₹{item.value.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <SessionProvider>
      <AnalyticsDashboard />
    </SessionProvider>
  );
}