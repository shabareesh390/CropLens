import type { AppStatus } from "@/lib/appState";

const cfg: Record<AppStatus, { label: string; bg: string; fg: string; border: string }> = {
  approved: { label: "Approved", bg: "var(--field-light)", fg: "var(--field-ink)", border: "rgba(10,61,34,0.12)" },
  pending: { label: "Pending review", bg: "#FCF8E3", fg: "#7A5C10", border: "rgba(122,92,16,0.12)" },
  review: { label: "Needs verification", bg: "var(--gold-light)", fg: "var(--gold-ink)", border: "rgba(133,88,12,0.12)" },
  declined: { label: "Declined", bg: "var(--danger-light)", fg: "var(--danger)", border: "rgba(186,51,38,0.12)" },
  scanning: { label: "Scanning...", bg: "var(--bg)", fg: "var(--ink-muted)", border: "var(--border)" },
};

export function StatusBadge({ status }: { status: AppStatus | string }) {
  const c = cfg[status as AppStatus] || { label: "Scanning...", bg: "var(--bg)", fg: "var(--ink-muted)", border: "var(--border)" };
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.72rem] font-semibold border" style={{ background: c.bg, color: c.fg, borderColor: c.border }}>{c.label}</span>
  );
}
