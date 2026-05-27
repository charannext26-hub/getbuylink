"use client";
import { useState, useEffect } from "react";

export default function ManageStoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStores, setTotalStores] = useState(0);

  // Search type karte waqt typing rukne ka wait karna (Debounce) taaki API pe load na pade
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStores(1, search);
    }, 500); // 0.5 sec delay
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Page change hone par fetch karna
  useEffect(() => {
    fetchStores(page, search);
  }, [page]);

  const fetchStores = async (pageNum, searchQuery) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/manage-stores?page=${pageNum}&search=${searchQuery}`);
      const data = await res.json();
      if (data.success) {
        setStores(data.stores);
        setTotalPages(data.totalPages);
        setTotalStores(data.totalStores);
        if (pageNum !== data.currentPage) setPage(data.currentPage); // Sync state
      }
    } catch (error) {
      console.error("Failed to fetch stores");
    }
    setLoading(false);
  };

  // Toggle Hide/Show Status
  const handleToggleHide = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    
    // UI mein turant update dikhana (Optimistic Update)
    setStores(stores.map(s => s._id === id ? { ...s, isHidden: newStatus } : s));

    try {
      const res = await fetch('/api/admin/manage-stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, isHidden: newStatus })
      });
      const data = await res.json();
      if (!data.success) {
        alert("Failed to update status!");
        // Agar fail ho jaye toh wapas purana status kar do
        setStores(stores.map(s => s._id === id ? { ...s, isHidden: currentStatus } : s));
      }
    } catch (error) {
      alert("Network Error!");
      setStores(stores.map(s => s._id === id ? { ...s, isHidden: currentStatus } : s));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER & SEARCH */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Master Store Manager</h1>
            <p className="text-slate-500 text-sm mt-1">Total Stores: <span className="font-bold text-blue-600">{totalStores}</span></p>
          </div>
          
          <div className="w-full md:w-96 relative">
            <input 
              type="text" 
              placeholder="Search by Name, Domain or ID..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} // Search par page 1 kar do
              className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <svg className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-slate-900 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-black uppercase tracking-wider text-[10px]">Logo & Name</th>
                  <th className="p-4 font-black uppercase tracking-wider text-[10px]">Campaign ID / Type</th>
                  <th className="p-4 font-black uppercase tracking-wider text-[10px]">Payout</th>
                  <th className="p-4 font-black uppercase tracking-wider text-[10px] text-center">Visibility Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-bold">Loading Stores...</td></tr>
                ) : stores.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-bold">No stores found.</td></tr>
                ) : (
                  stores.map((store) => (
                    <tr key={store._id} className={`hover:bg-slate-50 transition-colors ${store.isHidden ? 'bg-red-50/30' : ''}`}>
                      <td className="p-4 flex items-center gap-3">
                        <img src={store.image || "https://via.placeholder.com/150"} className="w-8 h-8 rounded bg-white border border-slate-200 object-contain p-0.5" />
                        <div>
                          <p className="font-bold text-slate-800 line-clamp-1">{store.name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{store.domain}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-mono text-xs text-slate-600">{store.campaignId}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mt-1 inline-block ${store.isManual ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {store.isManual ? 'Manual / Sankmo' : 'Cuelinks Auto'}
                        </span>
                      </td>
                      <td className="p-4 font-black text-slate-700">
                        {String(store.payout).includes('%') || String(store.payout).includes('₹') || String(store.payout).toLowerCase().includes('rs') 
                          ? store.payout 
                          : (String(store.payout_type).toLowerCase().includes('sale') || String(store.payout_type).includes('%') ? `${store.payout}%` : `₹${store.payout}`)}
                      </td>
                      <td className="p-4 text-center flex flex-col items-center justify-center">
                        {/* TOGGLE SWITCH */}
                        <button 
                          onClick={() => handleToggleHide(store._id, store.isHidden)}
                          className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${store.isHidden ? 'bg-red-500' : 'bg-emerald-500'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${store.isHidden ? 'left-1' : 'translate-x-7'}`}></span>
                        </button>
                        <span className={`text-[9px] font-black uppercase mt-1.5 ${store.isHidden ? 'text-red-500' : 'text-emerald-600'}`}>
                          {store.isHidden ? 'Hidden' : 'Visible'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {!loading && totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              
              <span className="text-xs font-bold text-slate-500">
                Page <span className="text-slate-900">{page}</span> of {totalPages}
              </span>

              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}