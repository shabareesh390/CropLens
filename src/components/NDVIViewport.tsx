export function NDVIViewport({ coords, animate = false, onDone }: { coords: string; animate?: boolean; onDone?: () => void }) {
  return <NDVIInner coords={coords} animate={animate} onDone={onDone} />;
}

import { useEffect, useState } from "react";

function NDVIInner({ coords, animate, onDone }: { coords: string; animate: boolean; onDone?: () => void }) {
  const [revealed, setRevealed] = useState(!animate);
  useEffect(() => {
    if (!animate) return;
    const t1 = setTimeout(() => setRevealed(true), 150);
    const t2 = setTimeout(() => onDone?.(), 5400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [animate, onDone]);

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/10", borderRadius: 18, border: "1px solid #0a1f15", background: "#0c2118" }}>
      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle at 22% 30%, #466b34 0%, transparent 42%),
                     radial-gradient(circle at 68% 22%, #355c2f 0%, transparent 46%),
                     radial-gradient(circle at 40% 68%, #2c4f29 0%, transparent 50%),
                     radial-gradient(circle at 82% 74%, #5c7a3a 0%, transparent 44%),
                     radial-gradient(circle at 12% 84%, #243e22 0%, transparent 50%),
                     linear-gradient(160deg, #1b3320, #274a25 55%, #1a3119)`,
      }} />
      <div className="absolute inset-0" style={{
        opacity: .5,
        backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 13.5px),
                          repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 1px, transparent 1px 12.5px)`,
      }} />
      <div className="absolute inset-0" style={{
        clipPath: revealed ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
        transition: "clip-path 5.2s cubic-bezier(.65,0,.35,1)",
        background: `radial-gradient(circle at 30% 40%, #2E9A57 0%, transparent 38%),
                     radial-gradient(circle at 72% 28%, #1F7A4D 0%, transparent 42%),
                     radial-gradient(circle at 20% 78%, #E8C23A 0%, transparent 38%),
                     radial-gradient(circle at 82% 68%, #D98C2B 0%, transparent 38%),
                     radial-gradient(circle at 55% 55%, #C0392B 0%, transparent 24%),
                     linear-gradient(160deg, #1F7A4D, #2E9A57 55%, #176B41)`,
      }} />
      {animate && (
        <div className="absolute left-0 right-0 h-[3px] pointer-events-none" style={{
          top: revealed ? "100%" : "0%",
          transition: "top 5.2s cubic-bezier(.65,0,.35,1)",
          background: "linear-gradient(90deg, transparent, #EAFFF1 45%, #EAFFF1 55%, transparent)",
          boxShadow: "0 0 18px 3px rgba(140,255,180,.65)",
        }} />
      )}
      <div className="absolute top-3 left-3 mono text-[0.68rem] px-2 py-1 rounded-md text-white" style={tagStyle}>{coords}</div>
      <div className="absolute top-3 right-3 mono text-[0.68rem] px-2 py-1 rounded-md text-white" style={tagStyle}>SENTINEL-2 · NDVI</div>
      <div className="absolute left-3 right-3 bottom-3 flex items-center gap-2 px-3 py-2 rounded-lg mono text-[0.62rem] tracking-wider uppercase text-white"
        style={{ background: "rgba(10,25,15,.55)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.1)" }}>
        <span style={{ opacity: .7 }}>LOW</span>
        <div className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(90deg,#C0392B,#D98C2B,#D9C13E,#5FAE52,#1F7A4D)" }} />
        <span style={{ opacity: .7 }}>HIGH VEGETATION HEALTH</span>
      </div>
    </div>
  );
}

const tagStyle: React.CSSProperties = { background: "rgba(10,25,15,.65)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.12)" };
