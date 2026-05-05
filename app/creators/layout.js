"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";

function LayoutContent({ children }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Simple Check: Username set hai ya nahi
  const hasUsername = session?.user?.username && session?.user?.username !== "creator";
  const showNav = hasUsername && pathname !== "/creators"; 

  const isActive = (path) => pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col pb-24">
      <main className="flex-1">{children}</main>

       {/* 🚨 RESPONSIVE & SMART NAVIGATION 🚨 */}
      {hasUsername && (
        // Mobile me no gap (bottom-0), Desktop me thoda gap (sm:pb-6)
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none sm:pb-6">
          
          <div className="w-full sm:max-w-[600px] bg-white/95 backdrop-blur-md sm:rounded-3xl border-t sm:border border-slate-200 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)] transition-all pointer-events-auto">
            
            {/* 🚨 FIX: Perfect Height and items aligned to bottom (items-end) */}
            <div className="flex justify-around items-end h-[65px] px-2 pb-1.5 sm:pb-2">

              {/* Home */}
              <Link href="/creators" className="flex flex-col items-center justify-end flex-1 h-full gap-1 pb-1">
                <svg className={`w-6 h-6 ${isActive('/creators') ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                <span className={`text-[10px] font-bold ${isActive('/creators') ? 'text-blue-600' : 'text-slate-400'}`}>Home</span>
              </Link>

              {/* All Posts (🚨 FIX: New 4-Box Grid Icon) */}
              <Link href="/creators/auto-post" className="flex flex-col items-center justify-end flex-1 h-full gap-1 pb-1">
                <svg className={`w-6 h-6 transition-colors ${isActive('/creators/auto-post') ? 'text-blue-600 drop-shadow-sm' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <rect x="4" y="4" width="6" height="6" rx="1.5" />
                  <rect x="14" y="4" width="6" height="6" rx="1.5" />
                  <rect x="14" y="14" width="6" height="6" rx="1.5" />
                  <rect x="4" y="14" width="6" height="6" rx="1.5" />
                </svg>
                <span className={`text-[10px] font-bold ${isActive('/creators/auto-post') ? 'text-blue-600' : 'text-slate-400'}`}>All Post</span>
              </Link>

              {/* Add Link (+) 🚨 FIX: Compact, perfectly aligned text */}
              <div className="flex flex-col items-center justify-end flex-1 h-full relative pb-1">
                <Link href="/creators/addlink" className={`absolute -top-5 flex items-center justify-center w-[52px] h-[52px] rounded-[18px] border-[4px] border-white shadow-md active:scale-95 transition-all ${isActive('/creators/addlink') ? 'bg-slate-900' : 'bg-blue-600'}`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                </Link>
                <span className={`text-[10px] font-extrabold tracking-wide ${isActive('/creators/addlink') ? 'text-slate-900' : 'text-blue-600'}`}>Add Link</span>
              </div>

              {/* Analytics */}
              <Link href="/creators/analytics" className="flex flex-col items-center justify-end flex-1 h-full gap-1 pb-1">
                <svg className={`w-6 h-6 ${isActive('/creators/analytics') ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                <span className={`text-[10px] font-bold ${isActive('/creators/analytics') ? 'text-blue-600' : 'text-slate-400'}`}>Analytics</span>
              </Link>

              {/* Account */}
              <Link href="/creators/account" className="flex flex-col items-center justify-end flex-1 h-full gap-1 pb-1">
                <svg className={`w-6 h-6 ${isActive('/creators/account') ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                <span className={`text-[10px] font-bold ${isActive('/creators/account') ? 'text-blue-600' : 'text-slate-400'}`}>Account</span>
              </Link>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatorsLayout({ children }) {
  return (
    <SessionProvider>
      <LayoutContent>{children}</LayoutContent>
    </SessionProvider>
  );
}