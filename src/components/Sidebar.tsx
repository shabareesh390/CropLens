import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileText, PlusCircle, BarChart3, Settings } from "lucide-react";
import { Logo } from "./Logo";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; disabled?: boolean };
const nav: { section: string; items: NavItem[] }[] = [
  { section: "WORKSPACE", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/applications", label: "Applications", icon: FileText },
    { to: "/new", label: "New assessment", icon: PlusCircle },
  ]},
  { section: "MORE", items: [
    { to: "/analytics", label: "Analytics", icon: BarChart3, disabled: true },
    { to: "/settings", label: "Settings", icon: Settings, disabled: true },
  ]},
];

import type { User } from "firebase/auth";
import { useApps } from "@/lib/appState";

export function Sidebar({ onNavigate, user }: { onNavigate?: () => void; user?: User | null }) {
  const { officer } = useApps();
  const name = officer?.name || user?.displayName || user?.email?.split('@')[0] || "User";
  const email = officer?.role || user?.email || "Credit Officer";
  const initials = officer?.initials || name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="h-full w-[264px] flex flex-col text-white" style={{ background: "var(--canopy)" }}>
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Logo size={40} />
        <div>
          <div className="font-serif text-[1.15rem] font-semibold leading-tight">CropLens</div>
          <div className="mono text-[0.68rem] uppercase tracking-wider" style={{ color: "rgba(255,255,255,.55)" }}>SBI Agri Credit</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {nav.map((sec) => (
          <div key={sec.section} className="mb-6">
            <div className="px-3 mb-2 text-[0.68rem] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,.4)" }}>{sec.section}</div>
            <div className="space-y-1">
              {sec.items.map((it) => {
                const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
                const Icon = it.icon;
                if (it.disabled) return (
                  <div key={it.to} className="flex items-center gap-3 px-3 py-2 rounded-[10px] cursor-not-allowed" style={{ color: "rgba(255,255,255,.35)" }}>
                    <Icon size={18} /><span className="text-[0.9rem]">{it.label}</span>
                    <span className="ml-auto mono text-[0.6rem] uppercase" style={{ color: "rgba(255,255,255,.3)" }}>Soon</span>
                  </div>
                );
                return (
                  <Link key={it.to} to={it.to as "/"} onClick={onNavigate}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-colors duration-200 border border-transparent"
                    style={{
                      background: active ? "rgba(255,255,255,0.08)" : "transparent",
                      borderColor: active ? "rgba(255,255,255,0.05)" : "transparent",
                      color: active ? "#fff" : "rgba(255,255,255,.65)",
                    }}>
                    <Icon size={18} color={active ? "#9FE0B8" : "currentColor"} className={active ? "opacity-100" : "opacity-80"} />
                    <span className="text-[0.9rem] font-medium">{it.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-4 pb-4">
        <div className="rounded-[12px] p-4 mb-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="text-[0.78rem] font-semibold mb-1 text-white">Coverage</div>
          <div className="text-[0.75rem] leading-relaxed" style={{ color: "rgba(255,255,255,.65)" }}>Active across your assigned districts.</div>
        </div>
        <div className="pt-3 border-t flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,.08)" }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt={name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[0.78rem] font-semibold" style={{ background: "linear-gradient(135deg,#2F8557,#1A4D2E)" }}>{initials}</div>
          )}
          <div className="min-w-0">
            <div className="text-[0.82rem] font-semibold truncate">{name}</div>
            <div className="text-[0.7rem] truncate" style={{ color: "rgba(255,255,255,.55)" }}>{email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
