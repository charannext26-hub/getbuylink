"use client";
import { useState } from "react";

export default function AdminSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  
  const TOTAL_PAGES_TO_SYNC = 150;

  const startSync = async () => {
    if (!confirm("Start full database sync? It will take 1-2 minutes.")) return;
    
    setSyncing(true);
    setProgress(0);
    setLogs(["🚀 Starting Sync Process..."]);

    for (let page = 1; page <= TOTAL_PAGES_TO_SYNC; page++) {
      try {
        const isFirstPage = page === 1; // Pehle page par DB saaf karenge
        
        const res = await fetch('/api/admin/sync-rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: page, clearFirst: isFirstPage })
        });
        
        const data = await res.json();
        
        if (data.success) {
          setLogs(prev => [`✅ Page ${page}/${TOTAL_PAGES_TO_SYNC} - ${data.message}`, ...prev]);
          setProgress(Math.round((page / TOTAL_PAGES_TO_SYNC) * 100));
          
          if (!data.hasMoreData) {
             setLogs(prev => ["🛑 No more data found. Sync complete early!", ...prev]);
             break;
          }
        } else {
          setLogs(prev => [`❌ Page ${page} failed: ${data.message}`, ...prev]);
        }
      } catch (err) {
        setLogs(prev => [`❌ Page ${page} network error.`, ...prev]);
      }
    }

    setLogs(prev => ["🎉 SYNC 100% COMPLETE!", ...prev]);
    setSyncing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-10 font-sans">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Database Sync Engine</h1>
        <p className="text-slate-500 text-sm mb-8">Pull the latest campaign rates from Cuelinks securely without Vercel timeouts.</p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-6 mb-6 overflow-hidden relative shadow-inner">
          <div 
            className="bg-blue-600 h-6 transition-all duration-300 ease-out flex items-center justify-center text-xs font-bold text-white" 
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>

        <button 
          onClick={startSync} 
          disabled={syncing}
          className="w-full py-4 bg-slate-900 text-white font-extrabold rounded-xl shadow-md hover:bg-blue-600 disabled:bg-slate-400 transition-colors mb-6"
        >
          {syncing ? "Syncing in Progress..." : "⚡ START FULL SYNC (150 Pages)"}
        </button>

        {/* Live Logs Terminal */}
        <div className="bg-slate-900 text-green-400 p-4 rounded-xl h-64 overflow-y-auto font-mono text-xs shadow-inner">
          {logs.length === 0 ? (
            <span className="text-slate-500">Awaiting command...</span>
          ) : (
            logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
}