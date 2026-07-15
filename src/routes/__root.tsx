import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { onAuthStateChanged, type User } from "firebase/auth";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/error-reporting";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { AppProvider } from "@/lib/appState";
import { Logo } from "@/components/Logo";
import { auth } from "@/lib/firebase";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="num text-7xl font-semibold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <a href="/" className="mt-6 inline-flex items-center btn-primary px-4 py-2 rounded-lg text-sm font-semibold">Go home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>Try again or head home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold">Try again</button>
          <a href="/" className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: "var(--border)" }}>Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CropLens · SBI KCC Satellite Assessment Console" },
      { name: "description", content: "Satellite + AI farm income assessment engine for SBI Kisan Credit Card underwriting. Assess in 4 minutes." },
      { property: "og:title", content: "CropLens · SBI KCC Satellite Assessment Console" },
      { property: "og:description", content: "Sentinel-2 imagery, NDVI yield estimation, and mandi-price-linked KCC scoring for SBI field officers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/CropLens.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function BootScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[100]" style={{ background: "var(--canopy)" }}>
      <div style={{ animation: "bootpulse 1.4s infinite" }}><Logo size={56} /></div>
      <div className="mt-6 mono text-[0.82rem] uppercase" style={{ color: "rgba(255,255,255,.7)", letterSpacing: "0.06em" }}>Loading CropLens Console…</div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [booting, setBooting] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login";

  // Listen to Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthResolved(true);
    });
    return () => unsubscribe();
  }, []);

  // Artificial boot delay for branding
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 850);
    return () => clearTimeout(t);
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (authResolved) {
      if (!user && !isLoginPage) {
        navigate({ to: "/login", replace: true });
      } else if (user && isLoginPage) {
        navigate({ to: "/", replace: true });
      }
    }
  }, [user, authResolved, isLoginPage, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        {booting && <BootScreen />}
        
        {isLoginPage ? (
          <div className="min-h-screen" style={{ background: "var(--bg)" }}>
            <Outlet />
          </div>
        ) : (
          <div className="min-h-screen" style={{ background: "var(--bg)" }}>
            <div className="hidden md:block fixed inset-y-0 left-0 z-20"><Sidebar user={user} /></div>
            {mobileOpen && (
              <div className="md:hidden fixed inset-0 z-40">
                <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                <div className="absolute inset-y-0 left-0 shadow-2xl" style={{ animation: "slidein .25s cubic-bezier(.4,0,.2,1)" }}>
                  <Sidebar onNavigate={() => setMobileOpen(false)} user={user} />
                </div>
              </div>
            )}
            <div className="md:ml-[264px] flex flex-col min-h-screen">
              <Topbar onMenu={() => setMobileOpen(true)} user={user} />
              <main className="flex-1 px-5 md:px-8 pt-7 pb-14 mx-auto w-full" style={{ maxWidth: 1320 }}>
                <Outlet />
              </main>
            </div>
          </div>
        )}
        <Toaster position="top-right" richColors />
      </AppProvider>
    </QueryClientProvider>
  );
}
