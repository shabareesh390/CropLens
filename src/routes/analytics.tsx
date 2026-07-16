import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, Users, MapPin, Activity } from "lucide-react";
import { useApps } from "@/lib/appState";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsDashboard,
});

function AnalyticsDashboard() {
  const { apps, loadingApps } = useApps();

  const totalApps = apps.length;
  const approvedApps = apps.filter(a => a.status === "approved").length;
  const reviewApps = apps.filter(a => a.status === "review").length;
  const declinedApps = apps.filter(a => a.status === "declined").length;

  // Mock data for charts and advanced metrics
  const totalDisbursed = (approvedApps * 1.2).toFixed(1); // Mock 1.2L per app average
  const avgAssessmentTime = "3.8";

  if (loadingApps) return (
    <div className="p-14 text-center">
      <div className="w-8 h-8 border-4 border-[var(--field)] border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-serif font-semibold text-[2.2rem] leading-tight text-gray-900 tracking-tight">Portfolio Analytics</h1>
        <p className="mt-1 text-[0.95rem]" style={{ color: "var(--ink-muted)" }}>Overview of KCC assessments and satellite insights.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Disbursed (Est.)" value={`₹${totalDisbursed} Cr`} icon={<TrendingUp size={18} />} trend="+14% this month" />
        <StatCard title="Total Applications" value={totalApps.toString()} icon={<Users size={18} />} />
        <StatCard title="Approved KCCs" value={approvedApps.toString()} icon={<Activity size={18} />} color="var(--field)" />
        <StatCard title="Avg. Assess Time" value={`${avgAssessmentTime} m`} icon={<BarChart3 size={18} />} />
      </div>

      <div className="grid gap-6 md:grid-cols-3 mt-8">
        <div className="md:col-span-2 card-panel p-6">
          <h2 className="text-[1.1rem] font-semibold mb-6">Processing Pipeline</h2>
          
          <div className="space-y-5">
            <PipelineRow label="Approved for Disbursement" count={approvedApps} total={totalApps} color="var(--field)" />
            <PipelineRow label="Sent for Field Verification" count={reviewApps} total={totalApps} color="var(--gold)" />
            <PipelineRow label="Declined / High Risk" count={declinedApps} total={totalApps} color="var(--danger)" />
          </div>
        </div>

        <div className="card-panel p-6">
          <h2 className="text-[1.1rem] font-semibold mb-6">District Density</h2>
          <div className="flex flex-col gap-4">
            <DistrictRow name="Tumakuru" percentage={45} />
            <DistrictRow name="Mandya" percentage={30} />
            <DistrictRow name="Hassan" percentage={15} />
            <DistrictRow name="Other" percentage={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color = "var(--field-ink)" }: { title: string, value: string, icon: React.ReactNode, trend?: string, color?: string }) {
  return (
    <div className="card-panel p-5 transition-all hover:shadow-md cursor-default">
      <div className="flex justify-between items-start mb-2">
        <div className="text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>{title}</div>
        <div className="p-1.5 rounded-lg" style={{ background: "var(--bg)", color }}>{icon}</div>
      </div>
      <div className="font-serif font-semibold text-[1.8rem] text-gray-900 leading-none">{value}</div>
      {trend && <div className="mt-3 text-[0.75rem] font-medium" style={{ color: "var(--field)" }}>{trend}</div>}
    </div>
  );
}

function PipelineRow({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const percentage = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-[0.88rem] font-medium mb-2">
        <span>{label}</span>
        <span className="font-semibold">{count} <span style={{ color: "var(--ink-faint)" }}>({percentage}%)</span></span>
      </div>
      <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, background: color }} />
      </div>
    </div>
  );
}

function DistrictRow({ name, percentage }: { name: string, percentage: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100">
        <MapPin size={14} style={{ color: "var(--ink-muted)" }} />
      </div>
      <div className="flex-1">
        <div className="text-[0.85rem] font-semibold">{name}</div>
        <div className="text-[0.75rem]" style={{ color: "var(--ink-muted)" }}>{percentage}% of apps</div>
      </div>
    </div>
  );
}
