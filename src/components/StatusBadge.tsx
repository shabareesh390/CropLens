import type { AppStatus } from "@/lib/appState";

const cfg: Record<AppStatus, { label: string; bg: string; fg: string }> = {
  approved: { label: "Approved", bg: "var(--field-light)", fg: "var(--field-ink)" },
  pending: { label: "Pending review", bg: "#FFF7E0", fg: "#7A5C10" },
  review: { label: "Needs verification", bg: "var(--gold-light)", fg: "var(--gold-ink)" },
  declined: { label: "Declined", bg: "var(--danger-light)", fg: "var(--danger)" },
};

export function StatusBadge({ status }: { status: AppStatus }) {
  const c = cfg[status];
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.72rem] font-semibold" style={{ background: c.bg, color: c.fg }}>{c.label}</span>
  );
}
