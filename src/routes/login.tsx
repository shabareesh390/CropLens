import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/login")({
  component: LoginScreen,
});

function LoginScreen() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate({ to: "/" });
      } else {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Successfully logged in");
      // The onAuthStateChanged listener will handle the redirect
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to log in with Google");
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    
    setIsEmailLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Successfully logged in");
    } catch (error: any) {
      console.error("Email login error:", error);
      toast.error(error.message || "Failed to log in with email");
      setIsEmailLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div style={{ animation: "bootpulse 1.4s infinite" }}><Logo size={56} /></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B2413] via-[#11311C] to-black opacity-90" />
        <div 
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] mix-blend-screen opacity-40 pointer-events-none" 
          style={{ background: "radial-gradient(circle, #7FD9A1, transparent)", animation: "spin 20s linear infinite" }}
        />
        <div 
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] mix-blend-screen opacity-30 pointer-events-none" 
          style={{ background: "radial-gradient(circle, #2A8B4F, transparent)", animation: "spin 25s linear infinite reverse" }}
        />
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 md:p-12 mx-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40 overflow-hidden" style={{ animation: "slidein .6s cubic-bezier(.16,1,.3,1)" }}>
        
        {/* Shine effect across the card */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        <div className="flex flex-col items-center relative z-20 text-center">
          <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner backdrop-blur-md">
            <Logo size={64} />
          </div>
          
          <h1 className="text-3xl font-bold mb-3 text-white tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Welcome Back
          </h1>
          <p className="text-sm text-gray-400 mb-10 leading-relaxed max-w-[260px]">
            Sign in to access the Satellite & AI farm income assessment engine.
          </p>

          <form onSubmit={handleEmailSignIn} className="w-full mb-6 flex flex-col gap-3">
            <input 
              type="email" 
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7FD9A1] transition-colors"
              required
            />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7FD9A1] transition-colors"
              required
            />
            <button 
              type="submit"
              disabled={isEmailLoading || isLoading}
              className="w-full mt-2 flex items-center justify-center py-3.5 px-6 rounded-xl text-white font-semibold text-[15px] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #1D4A2C, #2A8B4F)" }}
            >
              {isEmailLoading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="w-full flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Or</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            disabled={isLoading || isEmailLoading}
            className="group relative w-full flex items-center justify-center gap-4 py-3.5 px-6 rounded-xl bg-white text-black font-semibold text-[15px] transition-all hover:bg-gray-100 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <img src="/google.png" alt="Google" className="w-5 h-5 object-contain" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="mt-8 text-xs text-gray-500 font-medium tracking-wide uppercase">
            Secured by Firebase
          </div>
        </div>
      </div>
    </div>
  );
}
