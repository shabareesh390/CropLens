import { ShieldCheck, Satellite } from "lucide-react";
import { NDVIViewport } from "./NDVIViewport";
import { CROP_DATA, fmtINR, scoreBand, type Application } from "@/lib/appState";
import { Leaf, Activity, IndianRupee } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export function ScoreLedger({ app, recommendedLimit }: { app: Application; recommendedLimit: number }) {
  const band = scoreBand(app.score);
  return (
    <div className="relative overflow-hidden rounded-[20px] p-6 text-white h-full flex flex-col"
      style={{ background: "linear-gradient(165deg, #13361F, #1D4A2C 60%, #235D34)" }}>
      <div className="absolute -top-16 -right-16 w-[220px] h-[220px] rounded-full" style={{ background: "rgba(255,255,255,.07)" }} />
      <Satellite size={22} style={{ color: "rgba(255,255,255,.4)" }} className="absolute top-5 right-5" />
      <div className="mono text-[0.72rem] uppercase tracking-wider" style={{ color: "rgba(255,255,255,.6)" }}>KCC Eligibility Score</div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="num font-semibold text-[4rem] leading-none">{app.score}</div>
        <div className="text-[1.3rem]" style={{ color: "rgba(255,255,255,.5)" }}>/ 100</div>
      </div>
      <div className="mt-4 inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full text-[0.78rem] font-semibold"
        style={{ background: "rgba(255,255,255,.14)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.18)" }}>
        <ShieldCheck size={14} /> {band.label}
      </div>
      <p className="mt-5 text-[0.86rem] leading-relaxed" style={{ color: "rgba(255,255,255,.78)" }}>{band.narrative}</p>
      <div className="mt-6 pt-5 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,.15)" }}>
        <div className="text-[0.8rem]" style={{ color: "rgba(255,255,255,.6)" }}>Recommended KCC limit</div>
        <div className="num font-semibold text-[1.15rem]">{fmtINR(recommendedLimit)}</div>
      </div>
    </div>
  );
}

export function ResultPanel({ app }: { app: Application }) {
  const cd = CROP_DATA[app.crop] ?? CROP_DATA.Paddy;
  const score = app.score || 0;
  const confidence = Math.min(98, Math.round(84 + score / 12));
  const incomeEst = app.incomeEst || 0;
  const recommendedLimit = Math.round((incomeEst * 0.65) / 1000) * 1000;
  const yieldEst = app.yieldEstTonnes || 0;
  const priceTrend = app.priceTrend || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1.2fr]">
        <ScoreLedger app={app} recommendedLimit={recommendedLimit} />
        <div className="card-panel p-5">
          <div className="text-[0.78rem] font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>Farm parcel snapshot</div>
          <NDVIViewport coords={app.coords} />
          <div className="mt-4 grid grid-cols-3 gap-3 text-[0.78rem]">
            <div><div style={{ color: "var(--ink-faint)" }}>RoR ID</div><div className="mono mt-1 font-medium truncate">{app.rorId}</div></div>
            <div><div style={{ color: "var(--ink-faint)" }}>Survey no.</div><div className="mono mt-1 font-medium">{app.surveyNo}</div></div>
            <div><div style={{ color: "var(--ink-faint)" }}>Land area</div><div className="num mt-1 font-semibold">{app.areaAcres} ac</div></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard tone="green" icon={<Leaf size={18} />} title="Crop classification" value={app.crop}>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[0.72rem]" style={{ color: "var(--ink-muted)" }}>
              <span>Classifier confidence</span><span className="mono font-semibold" style={{ color: "var(--ink)" }}>{confidence}%</span>
            </div>
            <div className="mt-2 h-[6px] rounded-full" style={{ background: "var(--field-light)" }}>
              <div className="h-full rounded-full" style={{ width: `${confidence}%`, background: "var(--field)" }} />
            </div>
          </div>
        </MetricCard>
        <MetricCard tone="gold" icon={<Activity size={18} />} title="Estimated yield" value={`${yieldEst.toFixed(2)} t`}>
          <p className="mt-2 text-[0.78rem]" style={{ color: "var(--ink-muted)" }}>From NDVI vegetation-health time series across the parcel boundary.</p>
        </MetricCard>
        <MetricCard tone="gold" icon={<IndianRupee size={18} />} title="Estimated annual income" value={fmtINR(incomeEst)}>
          <p className="mt-2 text-[0.78rem]" style={{ color: "var(--ink-muted)" }}>Yield × district-level mandi price, last 6 months.</p>
        </MetricCard>
      </div>

      <div className="card-panel p-5">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-[0.95rem] font-semibold">Mandi price trend — {app.crop}</div>
            <div className="text-[0.78rem]" style={{ color: "var(--ink-muted)" }}>₹ per quintal, last 6 months</div>
          </div>
          <div className="mono text-[0.72rem]" style={{ color: "var(--ink-faint)" }}>{app.district.toUpperCase()} · eNAM</div>
        </div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={priceTrend.map((v, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun"][i], v }))}>
              <CartesianGrid vertical={false} stroke="var(--border-soft)" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} width={48} />
              <Tooltip cursor={{ fill: "rgba(200,147,42,.08)" }} content={({ active, payload }) => active && payload?.[0] ? (
                <div className="bg-white border rounded-lg px-3 py-2 shadow-md text-[0.78rem]" style={{ borderColor: "var(--border)" }}>
                  <div className="mono" style={{ color: "var(--gold-ink)" }}>₹{(payload[0].value as number).toLocaleString("en-IN")}</div>
                </div>
              ) : null} />
              <Bar dataKey="v" fill="#C8932A" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-[0.75rem]" style={{ color: "var(--ink-faint)" }}>Base price ≈ ₹{cd.pricePerQuintal}/qtl · derived from district mandi feeds.</div>
      </div>
    </div>
  );
}

function MetricCard({ tone, icon, title, value, children }: { tone: "green" | "gold"; icon: React.ReactNode; title: string; value: string; children?: React.ReactNode }) {
  const bg = tone === "green" ? "var(--field-light)" : "var(--gold-light)";
  const fg = tone === "green" ? "var(--field-ink)" : "var(--gold-ink)";
  return (
    <div className="card-panel p-5">
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: bg, color: fg }}>{icon}</div>
      <div className="mt-3 text-[0.8rem] font-semibold" style={{ color: "var(--ink-muted)" }}>{title}</div>
      <div className="num font-semibold text-[1.3rem] mt-1 leading-tight">{value}</div>
      {children}
    </div>
  );
}
