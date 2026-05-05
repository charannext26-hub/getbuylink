export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Welcome to Admin HQ 🚀</h1>
        <p className="text-slate-400 font-medium mt-2">This is your secure control room. Select an option from the sidebar to manage the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* Manage Home Card */}
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span>🏠</span> Manage Home Page
          </h2>
          <p className="text-slate-400 text-sm mb-6">Update auto-running banners, live store sales timers, and high commission product sections for all creators.</p>
          <a href="/admin/manage-home" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 px-6 rounded-xl transition-colors">
            Go to Editor 
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </a>
        </div>

        {/* Team Management Card (Locked for now) */}
        <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl opacity-70">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span>👥</span> Team Management
          </h2>
          <p className="text-slate-400 text-sm mb-6">Add new moderators or manage existing creator accounts. Give permissions to your team. (Coming Soon)</p>
          <button disabled className="bg-slate-700 text-slate-500 font-extrabold py-3 px-6 rounded-xl cursor-not-allowed flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            Locked Feature
          </button>
        </div>

      </div>
    </div>
  );
}