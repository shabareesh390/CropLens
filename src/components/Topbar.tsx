import { Menu, Search, Bell, ChevronDown, LogOut } from "lucide-react";
import type { User } from "firebase/auth";
import { useApps } from "@/lib/appState";
import { useState } from "react";

export function Topbar({ onMenu, user }: { onMenu: () => void; user?: User | null }) {
  const { officer } = useApps();
  const name = officer?.name || user?.displayName || user?.email?.split('@')[0] || "User";
  const initials = officer?.initials || name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-[64px] flex items-center gap-3 px-4 sm:px-5 md:px-8 border-b"
      style={{ background: "rgba(245,248,246,.78)", backdropFilter: "blur(14px)", borderColor: "var(--border)" }}>
      <button onClick={onMenu} className="md:hidden p-2 rounded-lg hover:bg-white/60" aria-label="Menu"><Menu size={20} /></button>
      <div className="relative w-full max-w-[420px] hidden sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
        <input placeholder="Search farmers, IDs, districts…"
          className="w-full h-10 pl-9 pr-16 rounded-[12px] bg-white border text-[0.88rem] outline-none transition-shadow"
          style={{ borderColor: "var(--border)" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--field)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(31,122,77,.12)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
        />
        <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center px-1.5 h-5 rounded mono text-[0.68rem]"
          style={{ background: "var(--border-soft)", color: "var(--ink-muted)" }}>⌘K</kbd>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-white/60" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full border border-white" style={{ background: "var(--gold)" }} />
        </button>
        {showNotifications && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
            <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-lg bg-white border z-50 overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-soft)", background: "var(--bg)" }}>
                <div className="text-[0.85rem] font-semibold">Notifications</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-[0.8rem]" style={{ color: "var(--ink-muted)" }}>You're all caught up!</div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="h-6 w-px" style={{ background: "var(--border)" }} />
      <div className="relative">
        <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/60" title="Account">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[0.72rem] font-semibold" style={{ background: "linear-gradient(135deg,#2F8557,#1A4D2E)" }}>{initials}</div>
          )}
          <ChevronDown size={14} style={{ color: "var(--ink-muted)" }} />
        </button>
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white border py-1 z-50" style={{ borderColor: "var(--border)" }}>
              <div className="px-4 py-2 border-b" style={{ borderColor: "var(--border-soft)" }}>
                <div className="text-[0.8rem] font-semibold truncate">{name}</div>
                <div className="text-[0.7rem] truncate" style={{ color: "var(--ink-muted)" }}>{officer?.branch || user?.email}</div>
              </div>
              <button 
                onClick={() => import("@/lib/firebase").then(m => m.auth.signOut())} 
                className="w-full text-left px-4 py-2 text-[0.85rem] hover:bg-gray-50 flex items-center gap-2 text-red-600 transition-colors"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
