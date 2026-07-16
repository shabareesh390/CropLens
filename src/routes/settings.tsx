import { createFileRoute } from "@tanstack/react-router";
import { User as UserIcon, Bell, Shield, LogOut, CheckCircle2 } from "lucide-react";
import { useApps } from "@/lib/appState";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { officer } = useApps();
  const [user, setUser] = useState<User | null>(null);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  const name = officer?.name || user?.displayName || user?.email?.split('@')[0] || "User";
  const initials = officer?.initials || name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const role = officer?.role || "Credit Officer";
  const branch = officer?.branch || "Main Branch";

  const handleSave = () => {
    toast.success("Preferences updated successfully");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-serif font-semibold text-[2.2rem] leading-tight text-gray-900 tracking-tight">Settings</h1>
        <p className="mt-1 text-[0.95rem]" style={{ color: "var(--ink-muted)" }}>Manage your account and preferences.</p>
      </div>

      <div className="card-panel p-6">
        <h2 className="text-[1.1rem] font-semibold mb-6 flex items-center gap-2">
          <UserIcon size={18} style={{ color: "var(--field)" }} /> Profile Information
        </h2>
        
        <div className="flex items-center gap-5">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={name} className="w-16 h-16 rounded-full object-cover border" style={{ borderColor: "var(--border)" }} />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[1.4rem] font-semibold shadow-sm" style={{ background: "linear-gradient(135deg,#23905A,#176B41)" }}>
              {initials}
            </div>
          )}
          <div>
            <div className="font-serif text-[1.4rem] font-semibold">{name}</div>
            <div className="text-[0.9rem]" style={{ color: "var(--ink-muted)" }}>{user?.email}</div>
            <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[0.7rem] font-semibold tracking-wide uppercase" style={{ background: "var(--field-light)", color: "var(--field-ink)" }}>
              {role} · {branch}
            </div>
          </div>
        </div>
      </div>

      <div className="card-panel p-6">
        <h2 className="text-[1.1rem] font-semibold mb-6 flex items-center gap-2">
          <Bell size={18} style={{ color: "var(--field)" }} /> Preferences
        </h2>
        
        <div className="space-y-6">
          <ToggleRow 
            title="Email Notifications" 
            description="Receive daily summaries of new KCC applications in your district." 
            active={emailNotifs} 
            onChange={() => setEmailNotifs(!emailNotifs)} 
          />
          <ToggleRow 
            title="High Contrast Map" 
            description="Enhance satellite imagery contrast for better field visibility." 
            active={highContrast} 
            onChange={() => setHighContrast(!highContrast)} 
          />
        </div>

        <div className="mt-8 pt-6 border-t flex justify-end" style={{ borderColor: "var(--border-soft)" }}>
          <button onClick={handleSave} className="btn-primary px-5 py-2.5 rounded-[10px] text-[0.9rem] font-semibold inline-flex items-center gap-2">
            <CheckCircle2 size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div className="card-panel p-6 border-red-100 bg-red-50/30">
        <h2 className="text-[1.1rem] font-semibold mb-2 flex items-center gap-2 text-red-800">
          <Shield size={18} /> Account Access
        </h2>
        <p className="text-[0.85rem] text-red-600/80 mb-4">Make sure to sign out if you are using a shared computer.</p>
        <button 
          onClick={() => auth.signOut()}
          className="px-4 py-2 rounded-[10px] text-[0.88rem] font-semibold inline-flex items-center gap-2 border bg-white transition-colors hover:bg-red-50 text-red-600 border-red-200"
        >
          <LogOut size={16} /> Sign out safely
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ title, description, active, onChange }: { title: string, description: string, active: boolean, onChange: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-[0.95rem] font-semibold text-gray-900">{title}</div>
        <div className="text-[0.85rem] mt-0.5" style={{ color: "var(--ink-muted)" }}>{description}</div>
      </div>
      <button 
        onClick={onChange}
        className="relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ 
          background: active ? "var(--field)" : "var(--border)",
          boxShadow: active ? "inset 0 1px 2px rgba(10,25,16,0.2)" : "inset 0 1px 2px rgba(0,0,0,0.1)",
          '--tw-ring-color': 'var(--field)'
        } as any}
      >
        <span 
          className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm"
          style={{ transform: active ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}
