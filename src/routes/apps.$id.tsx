import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Phone, Fingerprint, MapPin, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useApps, fmtDate, type AppStatus } from "@/lib/appState";
import { StatusBadge } from "@/components/StatusBadge";
import { ResultPanel } from "@/components/ResultPanel";
import { useState } from "react";
import { updateDoc, doc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export const Route = createFileRoute("/apps/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} · CropLens` }, { name: "description", content: "KCC application detail with satellite assessment and officer decision log." }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { apps, loadingApps } = useApps();
  const nav = useNavigate();
  const app = apps.find(a => a.id === id);
  const [note, setNote] = useState("");

  if (loadingApps) return (
    <div className="p-14 text-center">
      <div className="w-8 h-8 border-4 border-[var(--field)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      <div className="mt-4 text-[0.9rem] font-semibold text-gray-500">Loading application...</div>
    </div>
  );

  if (!app) return (
    <div className="card-panel p-14 text-center">
      <div className="text-[1rem] font-semibold">Application not found</div>
      <Link to="/applications" className="mt-4 inline-block text-[0.85rem] font-semibold" style={{ color: "var(--field-ink)" }}>← Back to applications</Link>
    </div>
  );

  async function decide(status: AppStatus) {
    if (!app || !app.firestoreId) return;
    try {
      await updateDoc(doc(db, "applications", app.firestoreId), {
        status,
        decidedAt: serverTimestamp(),
        decidedBy: auth.currentUser?.uid,
        auditLog: arrayUnion({
          action: `Decision: ${status}`,
          note,
          timestamp: new Date().toISOString()
        })
      });
      toast.success(`Application ${status === "approved" ? "approved" : status === "review" ? "sent for field verification" : "declined"}`);
    } catch(e) {
      console.error(e);
      toast.error("Failed to save decision");
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => nav({ to: "/applications" })} className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold" style={{ color: "var(--ink-muted)" }}>
        <ArrowLeft size={14} /> Back to applications
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[0.74rem] font-bold uppercase tracking-wider" style={{ color: "var(--field-ink)" }}>Application</div>
          <h1 className="num font-semibold text-[1.7rem] mt-1">{app.name}</h1>
          <div className="mono text-[0.8rem] mt-1" style={{ color: "var(--ink-muted)" }}>{app.id} · {app.district}, Karnataka · Submitted {fmtDate(app.submittedAt)}</div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="card-panel p-5">
        <div className="grid gap-5 md:grid-cols-3">
          <InfoRow icon={<Phone size={16} />} label="Phone"><span className="mono">{app.phone}</span></InfoRow>
          <InfoRow icon={<Fingerprint size={16} />} label="Aadhaar"><span className="mono">{app.aadhaarMask}</span></InfoRow>
          <InfoRow icon={<MapPin size={16} />} label="Village">{app.village}</InfoRow>
        </div>
      </div>

      <ResultPanel app={app} />

      <div className="card-panel p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[1.05rem] font-semibold">Officer decision</div>
            <div className="text-[0.85rem] mt-1" style={{ color: "var(--ink-muted)" }}>
              {app.decidedAt ? `Last updated ${fmtDate(app.decidedAt)}` : "No decision yet."}
            </div>
          </div>
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add note (optional)…"
          className="mt-4 w-full p-3 rounded-[12px] border text-[0.88rem] outline-none resize-none"
          style={{ borderColor: "var(--border)" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--field)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(31,122,77,.14)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }} />
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => decide("approved")} disabled={app.status === "approved"} className="btn-primary px-4 py-2.5 rounded-[12px] text-[0.88rem] font-semibold inline-flex items-center gap-2">
            <CheckCircle2 size={16} /> Approve KCC
          </button>
          <button onClick={() => decide("review")} disabled={app.status === "review"} className="btn-gold px-4 py-2.5 rounded-[12px] text-[0.88rem] font-semibold inline-flex items-center gap-2 disabled:opacity-50">
            <AlertTriangle size={16} /> Send for field verification
          </button>
          <button onClick={() => decide("declined")} disabled={app.status === "declined"} className="px-4 py-2.5 rounded-[12px] text-[0.88rem] font-semibold inline-flex items-center gap-2 border disabled:opacity-50"
            style={{ color: "var(--danger)", borderColor: "var(--danger)", background: "#fff" }}>
            <XCircle size={16} /> Decline
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "var(--field-light)", color: "var(--field-ink)" }}>{icon}</div>
      <div>
        <div className="text-[0.72rem] uppercase tracking-wider font-semibold" style={{ color: "var(--ink-faint)" }}>{label}</div>
        <div className="text-[0.9rem] font-medium mt-0.5">{children}</div>
      </div>
    </div>
  );
}
