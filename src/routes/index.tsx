import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileText, ShieldCheck, Clock, IndianRupee, ArrowUpRight, ChevronRight, PlusCircle } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, PieChart, Pie, Cell } from "recharts";
import { useApps, fmtINR, fmtDate } from "@/lib/appState";
import { StatusBadge } from "@/components/StatusBadge";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const { apps, officer } = useApps();
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 550); return () => clearTimeout(t); }, []);
  const nav = useNavigate();

  const user = auth.currentUser;
  const name = officer?.name || user?.displayName || user?.email?.split('@')[0] || "User";

  const approved = apps.filter(a => a.status === "approved").length;
  const rate = apps.length ? Math.round((approved / apps.length) * 100) : 0;
  const pipeline = apps.reduce((s, a) => s + (a.loanAmount || 0), 0);

  const trend = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts: Record<string, number> = {};
    apps.forEach(a => {
      if (a.submittedAt) {
        const m = months[new Date(a.submittedAt).getMonth()];
        counts[m] = (counts[m] || 0) + 1;
      }
    });
    const keys = Object.keys(counts).sort((a, b) => months.indexOf(a) - months.indexOf(b));
    if (keys.length === 0) return [{ m: months[new Date().getMonth()], v: 0 }];
    return keys.map(m => ({ m, v: counts[m] }));
  }, [apps]);
  const donut = useMemo(() => {
    const c: Record<string, number> = { approved: 0, pending: 0, review: 0, declined: 0, scanning: 0 };
    apps.forEach(a => { if (c[a.status] !== undefined) c[a.status]++; });
    return [
      { name: "Approved", value: c.approved, color: "#1F7A4D" },
      { name: "Pending", value: c.pending, color: "#B9C4BD" },
      { name: "Review", value: c.review, color: "#C8932A" },
      { name: "Declined", value: c.declined, color: "#C0392B" },
      ...(c.scanning > 0 ? [{ name: "Scanning", value: c.scanning, color: "#9CA3AF" }] : [])
    ];
  }, [apps]);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[0.74rem] font-bold tracking-wider" style={{ color: "var(--field-ink)" }}>Overview</div>
          <h1 className="num font-semibold text-[1.7rem] mt-1 ">Hello, {name}</h1>
          <p className="mt-1 text-[0.92rem]" style={{ color: "var(--ink-muted)" }}>Here's how the KCC assessment pipeline looks across your branch today.</p>
        </div>
        <button onClick={() => nav({ to: "/new" })} className="btn-primary px-4 py-2.5 rounded-[12px] text-[0.88rem] font-semibold inline-flex items-center gap-2">
          <PlusCircle size={16} /> New assessment
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI loading={loading} icon={<FileText size={18} />} tone="green" label="Total applications" value={apps.length.toString()} delta={{ text: "", up: null }} />
        <KPI loading={loading} icon={<ShieldCheck size={18} />} tone="green" label="Approval rate" value={`${rate}%`} delta={{ text: "", up: null }} />
        <KPI loading={loading} icon={<Clock size={18} />} tone="gold" label="Avg. assessment time" value="< 5 min" delta={{ text: "", up: null }} />
        <KPI loading={loading} icon={<IndianRupee size={18} />} tone="gold" label="Pipeline value" value={fmtINR(pipeline)} delta={{ text: "", up: null }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="card-panel p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[0.95rem] font-semibold">Applications received</div>
              <div className="text-[0.78rem]" style={{ color: "var(--ink-muted)" }}>This year</div>
            </div>
            <div className="mono text-[0.72rem]" style={{ color: "var(--ink-faint)" }}>SBI · KA REGION</div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1F7A4D" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#1F7A4D" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload }) => active && payload?.[0] ? (
                  <div className="bg-white border rounded-lg px-3 py-2 shadow-md text-[0.78rem]" style={{ borderColor: "var(--border)" }}>
                    <div className="mono font-semibold" style={{ color: "var(--field)" }}>{payload[0].value} applications</div>
                  </div>
                ) : null} />
                <Area type="monotone" dataKey="v" stroke="#1F7A4D" strokeWidth={2.4} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-panel p-5">
          <div className="text-[0.95rem] font-semibold mb-4">Status breakdown</div>
          <div className="relative" style={{ height: 180 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={donut} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none">
                  {donut.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="num font-semibold text-[1.6rem] leading-none">{apps.length}</div>
              <div className="text-[0.7rem] uppercase tracking-wider mt-1" style={{ color: "var(--ink-faint)" }}>total</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {donut.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-[0.82rem]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span style={{ color: "var(--ink-muted)" }}>{d.name}</span>
                </div>
                <span className="mono font-bold" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-panel overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border-soft)" }}>
          <div className="text-[0.95rem] font-semibold">Recent applications</div>
          <Link to="/applications" className="text-[0.82rem] font-semibold inline-flex items-center gap-1" style={{ color: "var(--field-ink)" }}>View all <ArrowUpRight size={14} /></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[0.85rem] whitespace-nowrap">
            <thead>
              <tr className="text-left" style={{ color: "var(--ink-faint)" }}>
                {["Farmer", "District", "Crop", "Score", "Amount", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold text-[0.72rem] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--border-soft)" }}>
                  {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 rounded shimmer" /></td>)}
                </tr>
              )) : apps.slice(0, 6).map((a) => (
                <tr key={a.id} onClick={() => nav({ to: "/apps/$id", params: { id: a.id } })}
                  className="border-t cursor-pointer transition-colors hover:bg-[#F3F8F4]" style={{ borderColor: "var(--border-soft)" }}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{a.name}</div>
                    <div className="mono text-[0.72rem]" style={{ color: "var(--ink-faint)" }}>{a.id}</div>
                  </td>
                  <td className="px-5 py-4" style={{ color: "var(--ink-muted)" }}>{a.district}</td>
                  <td className="px-5 py-4"><CropTag crop={a.crop} /></td>
                  <td className="px-5 py-4 num font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{a.score}</td>
                  <td className="px-5 py-4 mono">{fmtINR(a.loanAmount)}</td>
                  <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-4 text-right"><ChevronRight size={16} style={{ color: "var(--ink-faint)" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-[0.72rem]" style={{ color: "var(--ink-faint)" }}>Last synced {fmtDate(new Date().toISOString())}.</div>
    </div>
  );
}

function KPI({ loading, icon, tone, label, value, delta }: { loading: boolean; icon: React.ReactNode; tone: "green" | "gold"; label: string; value: string; delta: { text: string; up: boolean | null } }) {
  const bg = tone === "green" ? "var(--field-light)" : "var(--gold-light)";
  const fg = tone === "green" ? "var(--field-ink)" : "var(--gold-ink)";
  const deltaBg = delta.up === null ? "var(--border-soft)" : delta.up ? "var(--field-light)" : "var(--danger-light)";
  const deltaFg = delta.up === null ? "var(--ink-muted)" : delta.up ? "var(--field-ink)" : "var(--danger)";
  if (loading) return <div className="card-panel p-5"><div className="w-10 h-10 rounded-[10px] shimmer" /><div className="mt-4 h-4 w-24 rounded shimmer" /><div className="mt-2 h-8 w-32 rounded shimmer" /></div>;
  return (
    <div className="card-panel p-5">
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: bg, color: fg }}>{icon}</div>
      <div className="mt-3.5 text-[0.8rem] font-semibold" style={{ color: "var(--ink-muted)" }}>{label}</div>
      <div className="num font-semibold text-[2rem] leading-none mt-2" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.72rem] font-semibold" style={{ background: deltaBg, color: deltaFg }}>
        {delta.up === true && <ArrowUpRight size={12} />}{delta.text}
      </div>
    </div>
  );
}

export function CropTag({ crop }: { crop: string }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.72rem] font-semibold" style={{ background: "var(--field-light)", color: "var(--field-ink)" }}>{crop}</span>;
}
