import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import User from "@/lib/models/User";

export default async function AdminLayout({ children }) {
  // 1. Check if logged in
  const session = await getServerSession();
  if (!session) redirect("/login");

  // 2. Check if the user is an Admin
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  const dbUser = await User.findOne({ email: session.user.email });

  // 🚨 STRICT CHECK: Agar role 'admin' NAHI hai, toh Creator page par bhej do
  if (!dbUser || dbUser.role !== "admin") {
    redirect("/creators"); 
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex font-sans">
      
      {/* 🖥️ ADMIN SIDEBAR (Desktop) */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 hidden md:block flex-shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/20">A</div>
          <div>
            <h1 className="font-black text-lg tracking-tight">Admin HQ</h1>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{dbUser.role} ACCESS</p>
          </div>
        </div>

        <nav className="space-y-3">
          <a href="/admin" className="flex items-center gap-3 px-4 py-3 bg-blue-600/20 text-blue-400 font-bold rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Dashboard
          </a>
          <a href="/admin/manage-home" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 font-bold rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>
            Manage Home Page
          </a>
          <a href="/creators" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 font-bold rounded-xl transition-colors mt-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Creator App
          </a>
        </nav>
      </aside>

      {/* 📱 MAIN CONTENT & MOBILE HEADER */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-900">
        <header className="md:hidden p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-black text-sm">A</div>
             <h1 className="font-black text-white">Admin HQ</h1>
           </div>
           <span className="text-[10px] font-bold text-blue-400 uppercase border border-blue-400/30 px-2 py-1 rounded bg-blue-900/20">{dbUser.role}</span>
        </header>
        
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}