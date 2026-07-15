import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { toast } from "sonner";

export type AppStatus = "approved" | "pending" | "review" | "declined" | "scanning";

export interface Application {
  id: string;
  firestoreId?: string;
  name: string;
  phone: string;
  aadhaar?: string;
  aadhaarMask: string;
  district: string;
  village: string;
  rorId: string;
  surveyNo: string;
  areaAcres: number;
  crop: string;
  coords: string;
  score: number;
  status: AppStatus;
  loanAmount: number;
  yieldEstTonnes: number;
  incomeEst: number;
  submittedAt: string;
  decidedAt: string | null;
  priceTrend: number[];
  note?: string;
}

export const CROP_DATA: Record<string, { yieldPerAcre: number; pricePerQuintal: number }> = {
  Paddy: { yieldPerAcre: 1.1, pricePerQuintal: 2380 },
  Wheat: { yieldPerAcre: 0.9, pricePerQuintal: 2450 },
  Maize: { yieldPerAcre: 1.0, pricePerQuintal: 2120 },
  Sugarcane: { yieldPerAcre: 14, pricePerQuintal: 340 },
  Cotton: { yieldPerAcre: 0.35, pricePerQuintal: 7200 },
  Soybean: { yieldPerAcre: 0.5, pricePerQuintal: 4650 },
  Coffee: { yieldPerAcre: 0.4, pricePerQuintal: 18500 },
  Ragi: { yieldPerAcre: 1.2, pricePerQuintal: 3500 },
  Jowar: { yieldPerAcre: 0.8, pricePerQuintal: 3100 },
  Tur: { yieldPerAcre: 0.4, pricePerQuintal: 7000 },
  Groundnut: { yieldPerAcre: 0.7, pricePerQuintal: 6500 },
  Sunflower: { yieldPerAcre: 0.6, pricePerQuintal: 6000 },
  Arecanut: { yieldPerAcre: 0.8, pricePerQuintal: 40000 },
  Coconut: { yieldPerAcre: 4.0, pricePerQuintal: 3000 },
  Tomato: { yieldPerAcre: 15.0, pricePerQuintal: 1500 },
  Onion: { yieldPerAcre: 10.0, pricePerQuintal: 2000 },
  Chilly: { yieldPerAcre: 1.5, pricePerQuintal: 15000 },
};

export const DISTRICTS = [
  "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", 
  "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", 
  "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", 
  "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", 
  "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", 
  "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir"
];
export const CROPS = Object.keys(CROP_DATA);

export interface Officer {
  name: string;
  role: string;
  branch: string;
  initials: string;
  assignedDistricts: string[];
}

interface Ctx {
  apps: Application[];
  officer: Officer | null;
  loadingApps: boolean;
}
const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<Application[]>([]);
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    let unsubscribeApps: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch officer document
        try {
          const officerDoc = await getDoc(doc(db, "officers", user.uid));
          if (officerDoc.exists()) {
            setOfficer(officerDoc.data() as Officer);
          } else {
            console.warn("Officer document not found for user:", user.uid, "- using default officer profile.");
            setOfficer({
              name: user.displayName || user.email?.split('@')[0] || "User",
              role: "Credit Officer",
              branch: "Main Branch",
              initials: (user.displayName || user.email || "U").substring(0, 2).toUpperCase(),
              assignedDistricts: DISTRICTS,
            });
          }
        } catch (error) {
          console.error("Error fetching officer:", error);
          // Fallback on error too
          setOfficer({
            name: user.displayName || user.email?.split('@')[0] || "User",
            role: "Credit Officer",
            branch: "Main Branch",
            initials: "U",
            assignedDistricts: DISTRICTS,
          });
        }

        // Fetch applications
        const q = query(
          collection(db, "applications"),
          where("officerId", "==", user.uid)
        );

        unsubscribeApps = onSnapshot(q, (snapshot) => {
          const fetchedApps: Application[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            fetchedApps.push({
              ...data,
              firestoreId: docSnap.id,
              submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate().toISOString() : data.submittedAt || new Date().toISOString(),
              decidedAt: data.decidedAt?.toDate ? data.decidedAt.toDate().toISOString() : data.decidedAt,
            } as Application);
          });
          
          fetchedApps.sort((a, b) => {
            if (!a.submittedAt) return 1;
            if (!b.submittedAt) return -1;
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
          });
          
          setApps(fetchedApps);
          setLoadingApps(false);
        }, (error) => {
          console.error("Error fetching applications:", error);
          toast.error("Failed to load applications from server");
          setLoadingApps(false);
        });

      } else {
        setOfficer(null);
        setApps([]);
        if (unsubscribeApps) unsubscribeApps();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeApps) unsubscribeApps();
    };
  }, []);

  return (
    <AppCtx.Provider value={{ apps, officer, loadingApps }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApps() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApps outside provider");
  return c;
}

export function computeAssessment(input: { name: string; rorId: string; areaAcres: number; crop: string }) {
  const cd = CROP_DATA[input.crop] ?? CROP_DATA.Paddy;
  const yieldEstTonnes = input.areaAcres * cd.yieldPerAcre;
  const incomeEst = Math.round(yieldEstTonnes * 10 * cd.pricePerQuintal);
  const recommendedLimit = Math.round((incomeEst * 0.65) / 1000) * 1000;
  // seeded score
  const seed = (input.rorId + input.name).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 22 + (seed % 60);
  const areaBoost = Math.min(14, Math.round(input.areaAcres * 1.6));
  const score = Math.max(22, Math.min(96, base + areaBoost));
  const priceTrend = Array.from({ length: 6 }, (_, i) => {
    const wobble = ((seed + i * 37) % 11) - 5;
    return Math.round(cd.pricePerQuintal * (1 + (i - 5) * 0.006) + wobble * (cd.pricePerQuintal / 500));
  });
  return { yieldEstTonnes, incomeEst, recommendedLimit, score, priceTrend };
}

export function scoreBand(score: number): { label: string; narrative: string; tone: "good" | "ok" | "warn" | "bad" } {
  if (score >= 80) return { label: "Eligible · Low risk", narrative: "Crop health and verified land records support full KCC approval.", tone: "good" };
  if (score >= 65) return { label: "Likely eligible · Standard review", narrative: "Land and crop signals are positive. Recommended for standard officer review before disbursal.", tone: "ok" };
  if (score >= 45) return { label: "Borderline · Needs field verification", narrative: "Satellite signal confidence is moderate. A short field visit is recommended.", tone: "warn" };
  return { label: "Not eligible · High risk", narrative: "Crop health and recent price trends do not currently support the requested loan amount.", tone: "bad" };
}

export const fmtINR = (n: number | null | undefined) => "₹" + (n || 0).toLocaleString("en-IN");
export const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
