"use client";
import { useState } from "react";

export default function MeeshoTestPage() {
  const [url, setUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [result, setResult] = useState(null);

  const testScraper = async () => {
    if (!url.trim()) return alert("Link dalo bhai!");
    setIsFetching(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-meesho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Test Failed:", error);
      setResult({ success: false, error: "API Server Crash ya Timeout" });
    }
    setIsFetching(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-black text-slate-900 mb-2">🧪 Meesho Sandbox Scraper</h1>
          <p className="text-xs font-bold text-slate-500 mb-6">Test different scraping methods safely without breaking the main engine.</p>
          
          <input 
            type="text" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)} 
            placeholder="Paste any Meesho Link (Short or Long)..." 
            className="w-full border-2 border-pink-200 rounded-xl p-4 text-sm font-bold focus:border-pink-500 outline-none mb-4 bg-pink-50/30"
          />
          
          <button 
            onClick={testScraper} 
            disabled={isFetching}
            className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl shadow-lg shadow-pink-500/30 disabled:opacity-50 transition-all"
          >
            {isFetching ? "🔍 SCRAPING IN PROGRESS..." : "🚀 RUN TEST SCRAPER"}
          </button>
        </div>

        {/* RESULTS BOX */}
        {result && (
          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 text-white">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Result Output</h2>
            
            {result.success ? (
              <div className="space-y-4">
                <div className="flex gap-4 items-start bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="w-24 h-24 bg-white rounded-lg p-1 shrink-0">
                    <img src={result.data.image || "https://via.placeholder.com/150"} alt="preview" className="w-full h-full object-contain rounded" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Extracted Title</p>
                      <p className="font-bold text-sm text-emerald-400 line-clamp-2">{result.data.title || "Not Found"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Product ID (The Holy Grail)</p>
                      <p className="font-black text-lg text-pink-400 bg-pink-900/30 px-2 py-1 rounded w-max border border-pink-500/30">{result.data.productId || "Not Found"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono bg-black p-4 rounded-xl border border-slate-800 overflow-x-auto">
                  <p><span className="text-blue-400">Method Used:</span> {result.method}</p>
                  <p><span className="text-blue-400">Original URL:</span> {result.data.originalUrl}</p>
                  <p><span className="text-blue-400">Expanded URL:</span> {result.data.expandedUrl}</p>
                  <p><span className="text-blue-400">Image URL:</span> <br/><span className="text-slate-400 break-all">{result.data.image}</span></p>
                </div>
              </div>
            ) : (
              <div className="text-red-400 font-bold text-sm bg-red-950/30 p-4 rounded-xl border border-red-900">
                ❌ Scrape Failed: {result.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}