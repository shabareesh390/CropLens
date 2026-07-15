import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ChevronRight, FileText } from "lucide-react";
import { useApps, fmtINR, fmtDate, type AppStatus } from "@/lib/appState";
import { StatusBadge } from "@/components/StatusBadge";
import { CropTag } from "./index";

export const Route = createFileRoute("/applications")({
  head: () => ({ meta: [{ title: "Applications · CropLens" }, { name: "description", content: "Browse and filter KCC applications assessed by CropLens." }] }),
  component: List,
});

type Filter = "all" | AppStatus;
const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" }, { key: "approved", label: "Approved" }, { key: "pending", label: "Pending review" },
  { key: "review", label: "Needs verification" }, { key: "declined", label: "Declined" },
];

function List() {
  const { apps } = useApps();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 480); return () => clearTimeout(t); }, []);

  const filtered = useMemo(() => apps.filter(a => {
    if (f !== "all" && a.status !== f) return false;
    if (q && !`${a.name} ${a.id} ${a.district} ${a.village}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [apps, q, f]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[0.74rem] font-bold uppercase tracking-wider" style={{ color: "var(--field-ink)" }}>Pipeline</div>
        <h1 className="num font-semibold text-[1.7rem] mt-1">Applications</h1>
        <p className="mt-1 text-[0.92rem]" style={{ color: "var(--ink-muted)" }}>{apps.length} assessments across your branch.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, ID, village…"
            className="w-full h-10 pl-9 pr-3 rounded-[12px] bg-white border text-[0.88rem] outline-none"
            style={{ borderColor: "var(--border)" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--field)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(31,122,77,.12)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((x) => {
            const active = f === x.key;
            return (
              <button key={x.key} onClick={() => setF(x.key)}
                className="px-3 py-1.5 rounded-full text-[0.8rem] font-semibold border transition-colors"
                style={{
                  background: active ? "var(--canopy)" : "#fff",
                  color: active ? "#fff" : "var(--ink-muted)",
                  borderColor: active ? "var(--canopy)" : "var(--border)",
                }}>{x.label}</button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="card-panel overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b" style={{ borderColor: "var(--border-soft)" }}><div className="h-6 shimmer rounded" /></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-panel p-14 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-[14px] flex items-center justify-center" style={{ background: "var(--field-light)", color: "var(--field-ink)" }}><FileText size={22} /></div>
          <div className="mt-4 text-[1rem] font-semibold">No applications match</div>
          <p className="mt-1 text-[0.86rem]" style={{ color: "var(--ink-muted)" }}>Try clearing your filters or search terms.</p>
          <button onClick={() => { setQ(""); setF("all"); }} className="mt-5 px-4 py-2 rounded-lg text-[0.85rem] font-semibold border" style={{ borderColor: "var(--border)" }}>Clear filters</button>
        </div>
      ) : (
        <>
          <div className="hidden md:block card-panel overflow-hidden">
            <table className="w-full text-[0.85rem]">
              <thead>
                <tr className="text-left" style={{ color: "var(--ink-faint)" }}>
                  {["Farmer","District","Crop","Land","Score","Loan","Status","Submitted",""].map(h => (
                    <th key={h} className="px-5 py-3 font-semibold text-[0.72rem] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} onClick={() => nav({ to: "/apps/$id", params: { id: a.id } })}
                    className="border-t cursor-pointer transition-colors hover:bg-[#F3F8F4]" style={{ borderColor: "var(--border-soft)" }}>
                    <td className="px-5 py-4">
                      <div className="font-semibold">{a.name}</div>
                      <div className="mono text-[0.7rem]" style={{ color: "var(--ink-faint)" }}>{a.id}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div style={{ color: "var(--ink)" }}>{a.district}</div>
                      <div className="text-[0.72rem]" style={{ color: "var(--ink-faint)" }}>{a.village}</div>
                    </td>
                    <td className="px-5 py-4"><CropTag crop={a.crop} /></td>
                    <td className="px-5 py-4 num" style={{ fontVariantNumeric: "tabular-nums" }}>{a.areaAcres} ac</td>
                    <td className="px-5 py-4 num font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{a.score}</td>
                    <td className="px-5 py-4 mono">{fmtINR(a.loanAmount)}</td>
                    <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-4 text-[0.8rem]" style={{ color: "var(--ink-muted)" }}>{fmtDate(a.submittedAt)}</td>
                    <td className="px-5 py-4 text-right"><ChevronRight size={16} style={{ color: "var(--ink-faint)" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden grid gap-3">
            {filtered.map(a => (
              <div key={a.id} onClick={() => nav({ to: "/apps/$id", params: { id: a.id } })} className="card-panel p-4 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{a.name}</div><StatusBadge status={a.status} />
                </div>
                <div className="mt-2 flex items-center gap-2"><CropTag crop={a.crop} /><span className="text-[0.78rem]" style={{ color: "var(--ink-muted)" }}>{a.district} · {a.village}</span></div>
                <div className="mt-3 flex items-center justify-between text-[0.85rem]">
                  <span className="mono">{fmtINR(a.loanAmount)}</span>
                  <span className="num font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>Score {a.score}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
