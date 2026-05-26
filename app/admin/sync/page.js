"use client";
import { useState, useEffect } from "react";

export default function AdminSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  
  // Manual Override States
  const [manualStores, setManualStores] = useState([]);
  const [manualData, setManualData] = useState({ 
    _id: null, name: "", domain: "", payout: "", payout_type: "Sale", image: "",
    cookie_duration: "", payout_categories: "", conversion_flow: "", important_info_html: "", isHidden: false
  });
  const [manualLoading, setManualLoading] = useState(false);

  const TOTAL_PAGES_TO_SYNC = 150;

  // Pehli baar page
  useEffect(() => { 
      fetchManualStores(); 
  }, []);

  const fetchManualStores = async () => {
      try {
          const res = await fetch('/api/admin/manual-rates', { cache: 'no-store' });
          const data = await res.json();
          if(data.success) {
              setManualStores(data.stores);
          }
      } catch (error) {
          console.error("Failed to fetch stores", error);
      }
  };

  const startSync = async () => {
    if (!confirm("Start full database sync?")) return;
    setSyncing(true); setProgress(0); setLogs(["🚀 Starting Sync..."]);
    for (let page = 1; page <= TOTAL_PAGES_TO_SYNC; page++) {
      try {
        const res = await fetch('/api/admin/sync-rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: page, clearFirst: page === 1 })
        });
        
        const data = await res.json();
        if (data.success) {
          setLogs(prev => [`✅ Page ${page} - ${data.message}`, ...prev]);
          setProgress(Math.round((page / TOTAL_PAGES_TO_SYNC) * 100));
          if (!data.hasMoreData) break;
        } else {
          setLogs(prev => [`❌ Page ${page} failed: ${data.message}`, ...prev]);
        }
      } catch (err) { setLogs(prev => [`❌ Page ${page} network error.`, ...prev]); }
    }
    setLogs(prev => ["🎉 SYNC COMPLETE!", ...prev]);
    setSyncing(false);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualLoading(true);
    try {
        const res = await fetch('/api/admin/manual-rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(manualData)
        });
        const data = await res.json();
        if (data.success) {
            alert("✅ " + data.message);
            // Form Reset
            setManualData({ 
                _id: null, name: "", domain: "", payout: "", payout_type: "Sale", image: "", 
                cookie_duration: "", payout_categories: "", conversion_flow: "", important_info_html: "", isHidden: false 
            }); 
            // Table Updated
            fetchManualStores();
        } else {
            alert("❌ " + data.message);
        }
    } catch (err) { alert("Network Error!"); }
    setManualLoading(false);
  };

  const handleEdit = (store) => {
      // Category array ko wapas comma-separated string banake form mein dalna
      let catString = "";
      if(Array.isArray(store.payout_categories)){
          catString = store.payout_categories.map(c => `${c.name}: ${c.payout}`).join(", ");
      }
      
      setManualData({ 
          _id: store._id,
          name: store.name || "",
          domain: store.domain || "",
          payout: store.payout || "",
          payout_type: store.payout_type || "Sale",
          image: store.image || "",
          cookie_duration: store.cookie_duration || "",
          conversion_flow: store.conversion_flow || "",
          important_info_html: store.important_info_html || "",
          isHidden: store.isHidden || false,
          payout_categories: catString 
      });
      // Scroll to (optional UX improvement)
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
      if(!confirm("Are you sure you want to delete this store?")) return;
      await fetch(`/api/admin/manual-rates?id=${id}`, { method: 'DELETE' });
      fetchManualStores(); // Update table
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* ================= AUTO SYNC ================= */}
        <div className="bg-white p-8 rounded-2xl shadow border border-slate-200">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Cuelinks Sync Engine</h1>
          <button onClick={startSync} disabled={syncing} className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg mb-4">
            {syncing ? `Syncing... ${progress}%` : "⚡ START FULL SYNC"}
          </button>
          <div className="bg-slate-900 text-green-400 p-3 rounded-lg h-32 overflow-y-auto font-mono text-xs shadow-inner">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        </div>

        {/* ================= MANAGE STORES LIST (TABLE) ================= */}
        <div className="bg-white p-8 rounded-2xl shadow border border-slate-200">
             <h2 className="text-xl font-black text-slate-900 mb-4">Manage Sankmo / Custom Stores</h2>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-700">
                     <thead className="bg-slate-100 text-slate-900">
                         <tr>
                             <th className="p-3 rounded-l-lg">Store Name</th>
                             <th className="p-3">Payout</th>
                             <th className="p-3">Status</th>
                             <th className="p-3 rounded-r-lg">Actions</th>
                         </tr>
                     </thead>
                     <tbody>
                         {manualStores.length === 0 ? (
                             <tr><td colSpan="4" className="p-4 text-center text-slate-500">No custom stores added yet.</td></tr>
                         ) : (
                             manualStores.map(s => (
                                 <tr key={s._id} className="border-b">
                                     <td className="p-3 font-bold">{s.name}</td>
                                     <td className="p-3">{s.payout}</td>
                                     <td className="p-3">{s.isHidden ? <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">Hidden</span> : <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-xs">Active</span>}</td>
                                     <td className="p-3 space-x-3">
                                         <button onClick={() => handleEdit(s)} className="text-blue-600 font-bold hover:underline">Edit</button>
                                         <button onClick={() => handleDelete(s._id)} className="text-red-600 font-bold hover:underline">Delete</button>
                                     </td>
                                 </tr>
                             ))
                         )}
                     </tbody>
                 </table>
             </div>
        </div>

        {/* ================= MANUAL FORM (FULL FIELDS) ================= */}
        <div className="bg-white p-8 rounded-2xl shadow border border-slate-200">
            <h2 className="text-xl font-black text-slate-900 mb-4">{manualData._id ? "✏️ Edit Custom Store" : "➕ Add Custom Store"}</h2>
            <form onSubmit={handleManualSubmit} className="space-y-4">
                
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Store Name *</label>
                        <input required type="text" placeholder="e.g. Flipkart" value={manualData.name} onChange={e => setManualData({...manualData, name: e.target.value})} className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Domain *</label>
                        <input required type="text" placeholder="e.g. flipkart.com" value={manualData.domain} onChange={e => setManualData({...manualData, domain: e.target.value})} className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
                
                {/* Payout & Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Payout Rate *</label>
                        <input required type="text" placeholder="e.g. Upto 12%" value={manualData.payout} onChange={e => setManualData({...manualData, payout: e.target.value})} className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Payout Type</label>
                        <select value={manualData.payout_type} onChange={e => setManualData({...manualData, payout_type: e.target.value})} className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="Sale">Sale</option>
                            <option value="Lead">Lead</option>
                        </select>
                    </div>
                    <div className="flex items-center mt-6">
                        <label className="flex items-center cursor-pointer space-x-2">
                            <input type="checkbox" checked={manualData.isHidden} onChange={e => setManualData({...manualData, isHidden: e.target.checked})} className="w-5 h-5 text-blue-600 rounded cursor-pointer" />
                            <span className="text-sm font-bold text-slate-700">Hide Store from Users</span>
                        </label>
                    </div>
                </div>

                {/* Additional Info Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Store Logo URL</label>
                        <input type="text" placeholder="https://..." value={manualData.image} onChange={e => setManualData({...manualData, image: e.target.value})} className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Cookie Duration</label>
                        <input type="text" placeholder="e.g. 30 Days" value={manualData.cookie_duration} onChange={e => setManualData({...manualData, cookie_duration: e.target.value})} className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                {/* Additional Info Row 2 (Textareas & Complex inputs) */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Categories (Format -&gt; Name: Rate, Name: Rate)</label>
                    <input type="text" placeholder="Fashion: 5%, Mobiles: 1%" value={manualData.payout_categories} onChange={e => setManualData({...manualData, payout_categories: e.target.value})} className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Conversion Flow</label>
                        <textarea rows="3" placeholder="User clicks link -> Opens App..." value={manualData.conversion_flow} onChange={e => setManualData({...manualData, conversion_flow: e.target.value})} className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Important Info (HTML/Text)</label>
                        <textarea rows="3" placeholder="Rules or details..." value={manualData.important_info_html} onChange={e => setManualData({...manualData, important_info_html: e.target.value})} className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                    </div>
                </div>

                <button disabled={manualLoading} className="w-full py-4 bg-emerald-600 text-white font-extrabold rounded-lg shadow hover:bg-emerald-700 transition-colors disabled:bg-slate-400">
                    {manualLoading ? "Saving..." : (manualData._id ? "💾 Update Rate" : "💾 Save Custom Rate")}
                </button>
            </form>
        </div>

      </div>
    </div>
  );
}