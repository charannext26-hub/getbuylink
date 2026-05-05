"use client";
import { useState, useEffect } from "react";

export default function AdminPayoutsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/payouts");
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch (err) {
      console.error("Error fetching payouts:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleUpdateStatus = async (requestId, status) => {
    const remarks = status === "rejected" ? prompt("Enter rejection reason:") : "";
    if (status === "rejected" && remarks === null) return;

    setProcessingId(requestId);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status, adminRemarks: remarks }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Success: Marked as ${status}`);
        fetchRequests(); // List refresh karo
      }
    } catch (err) {
      alert("Server Error");
    }
    setProcessingId(null);
  };

  if (loading) return <div className="p-10 text-blue-500 font-bold">Loading Financial Records...</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-white">💰 Payout Management</h1>
            <p className="text-slate-400 text-sm mt-1">Review and process creator withdrawal requests.</p>
          </div>
          <div className="text-right">
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Pending</p>
             <p className="text-2xl font-black text-orange-500">₹{requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-700/50 text-slate-400 text-[10px] uppercase tracking-widest">
                <th className="p-4 font-bold">Creator / Date</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Payment Details</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {requests.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold">No payout requests found.</td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white text-sm">@{req.creatorId}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-base font-black text-emerald-400">₹{req.amount}</span>
                    </td>
                    <td className="p-4">
                      <div className="bg-slate-900 p-2 rounded border border-slate-700">
                        <p className="text-[10px] font-black text-blue-400 uppercase">{req.paymentMethod}</p>
                        <p className="text-xs font-mono text-slate-300 mt-1 select-all">{req.paymentDetails}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                        req.status === 'pending' ? 'bg-orange-500/10 text-orange-500' : 
                        req.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {req.status === 'pending' ? (
                        <div className="flex justify-center gap-2">
                          <button 
                            disabled={processingId === req._id}
                            onClick={() => handleUpdateStatus(req._id, "paid")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-[11px] font-black transition-all shadow-lg"
                          >
                            {processingId === req._id ? "..." : "MARK PAID"}
                          </button>
                          <button 
                            disabled={processingId === req._id}
                            onClick={() => handleUpdateStatus(req._id, "rejected")}
                            className="bg-slate-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-black transition-all"
                          >
                            REJECT
                          </button>
                        </div>
                      ) : (
                        <p className="text-center text-[10px] font-bold text-slate-500 italic">
                          {req.status === 'paid' ? `Processed on ${new Date(req.paidAt).toLocaleDateString()}` : req.adminRemarks}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}