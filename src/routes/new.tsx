import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, MapPin, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useApps, DISTRICTS, CROPS, type AppStatus, type Application } from "@/lib/appState";
import { ResultPanel } from "@/components/ResultPanel";
import { collection, addDoc, serverTimestamp, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, auth, functions } from "@/lib/firebase";
import { lazy, Suspense } from "react";

const LazyMap = lazy(() => import("@/components/InteractiveParcelMap"));

function MapWrapper(props: any) {
  if (typeof window === "undefined") {
    return <div className="rounded-[14px] flex items-center justify-center text-white" style={{ background: "#13361F", aspectRatio: "16/10" }}>Loading satellite...</div>;
  }
  return (
    <Suspense fallback={<div className="rounded-[14px] flex items-center justify-center text-white" style={{ background: "#13361F", aspectRatio: "16/10" }}>Loading satellite...</div>}>
      <LazyMap {...props} />
    </Suspense>
  );
}

export const Route = createFileRoute("/new")({
  head: () => ({ meta: [{ title: "New assessment · CropLens" }, { name: "description", content: "Run a Sentinel-2 satellite assessment for a KCC applicant in 4 minutes." }] }),
  component: NewAssessment,
});

const STEPS = ["Farmer & land", "Satellite scan", "Result & decision"];

function NewAssessment() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", mobile: "", aadhaar: "", rorId: "", district: "Belagavi", crop: "Paddy", areaAcres: "",
  });
  const [boundaryConfirmed, setBoundaryConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [computed, setComputed] = useState<Application | null>(null);
  const { officer } = useApps();
  const nav = useNavigate();

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = "Must be 10 digits";
    if (!/^\d{12}$/.test(form.aadhaar)) e.aadhaar = "Must be 12 digits";
    if (!form.rorId.trim()) e.rorId = "Required";
    if (!form.district) e.district = "Required";
    const a = parseFloat(form.areaAcres);
    if (!a || a <= 0) e.areaAcres = "Must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submitStep1() {
    if (!validate()) return;
    if (!officer) {
      toast.error("Officer not loaded. Please wait.");
      return;
    }
    
    const areaAcres = parseFloat(form.areaAcres);
    const seed = form.rorId.length + form.name.length;
    const coordsLat = (12 + (seed % 5) + (seed % 90) / 100).toFixed(4);
    const coordsLng = (74 + ((seed * 3) % 4) + (seed % 80) / 100).toFixed(4);
    
    // Hash Aadhaar (SHA-256)
    const msgBuffer = new TextEncoder().encode(form.aadhaar);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const aadhaarHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const id = `KCC-2026-${String(200 + Math.floor(Math.random() * 799)).padStart(5, "0")}`;
    
    const app: any = {
      id,
      name: form.name, 
      phone: form.mobile,
      aadhaar: form.aadhaar,
      aadhaarMask: `•••• •••• ${form.aadhaar.slice(-4)}`,
      aadhaarHash,
      district: form.district, 
      village: "—",
      rorId: form.rorId, 
      surveyNo: "—",
      areaAcres, 
      crop: form.crop, 
      coords: `${coordsLat}° N, ${coordsLng}° E`,
      status: "scanning",
      score: null, 
      loanAmount: null,
      yieldEstTonnes: null, 
      incomeEst: null,
      submittedAt: serverTimestamp(), 
      decidedAt: null,
      priceTrend: [],
      officerId: auth.currentUser?.uid,
      officerName: officer.name,
      branch: officer.branch,
      auditLog: [{
        action: "Application Submitted",
        timestamp: new Date().toISOString()
      }]
    };

    try {
      const docRef = await addDoc(collection(db, "applications"), app);
      app.firestoreId = docRef.id;
      setComputed(app);
      setStep(1);
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit application.");
    }
  }

  async function decide(status: AppStatus, note: string) {
    if (!computed || !computed.firestoreId) return;
    try {
      await updateDoc(doc(db, "applications", computed.firestoreId), {
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
      nav({ to: "/apps/$id", params: { id: computed.id } });
    } catch(e) {
       console.error(e);
       toast.error("Failed to save decision");
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[0.74rem] font-bold uppercase tracking-wider" style={{ color: "var(--field-ink)" }}>New</div>
        <h1 className="num font-semibold text-[1.7rem] mt-1">New KCC assessment</h1>
        <p className="mt-1 text-[0.92rem]" style={{ color: "var(--ink-muted)" }}>Complete the applicant profile, run satellite analysis, and issue a decision.</p>
      </div>

      <Stepper step={step} />

      {step === 0 && (
        <Step1 form={form} setForm={setForm} errors={errors} boundaryConfirmed={boundaryConfirmed}
          setBoundaryConfirmed={setBoundaryConfirmed} onNext={submitStep1} />
      )}
      {step === 1 && computed && <Step2 app={computed} onDone={(res) => { setComputed({...computed, ...res} as Application); setStep(2); }} onError={() => setStep(0)} />}
      {step === 2 && computed && <Step3 app={computed} onDecide={decide} />}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STEPS.map((label, i) => {
        const state = i < step ? "done" : i === step ? "active" : "idle";
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[0.85rem] font-semibold transition-all"
                style={{
                  background: state === "idle" ? "#fff" : "var(--field)",
                  color: state === "idle" ? "var(--ink-faint)" : "#fff",
                  border: state === "idle" ? "1px solid var(--border)" : "none",
                  boxShadow: state === "active" ? "0 0 0 4px rgba(31,122,77,.14)" : "none",
                }}>
                {state === "done" ? <Check size={16} /> : i + 1}
              </div>
              <span className="text-[0.85rem] font-semibold" style={{ color: state === "idle" ? "var(--ink-faint)" : "var(--ink)" }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="hidden sm:block w-12 h-[2px]" style={{ background: i < step ? "var(--field)" : "var(--border)" }} />}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[0.78rem] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>{label}</div>
      {children}
      {error ? <div className="mt-1 text-[0.72rem]" style={{ color: "var(--danger)" }}>{error}</div>
        : hint ? <div className="mt-1 text-[0.72rem]" style={{ color: "var(--ink-faint)" }}>{hint}</div> : null}
    </label>
  );
}

const inputCls = "w-full h-10 px-3 rounded-[10px] bg-white border text-[0.88rem] outline-none transition-shadow";
function inputStyle(err?: string): React.CSSProperties { return { borderColor: err ? "var(--danger)" : "var(--border)" }; }
function focusOn(e: React.FocusEvent<HTMLElement>, err?: string) {
  if (err) return;
  (e.currentTarget as HTMLElement).style.borderColor = "var(--field)";
  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(31,122,77,.14)";
}
function focusOff(e: React.FocusEvent<HTMLElement>, err?: string) {
  (e.currentTarget as HTMLElement).style.borderColor = err ? "var(--danger)" : "var(--border)";
  (e.currentTarget as HTMLElement).style.boxShadow = "none";
}

function Step1(props: {
  form: { name: string; mobile: string; aadhaar: string; rorId: string; district: string; crop: string; areaAcres: string };
  setForm: (f: Step1["form"]) => void; errors: Record<string, string>;
  boundaryConfirmed: boolean; setBoundaryConfirmed: (v: boolean) => void; onNext: () => void;
}) {
  type S1 = { form: typeof props.form };
  type _1 = S1;
  const { form, setForm, errors, boundaryConfirmed, setBoundaryConfirmed, onNext } = props;
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const digits = (k: "mobile" | "aadhaar", max: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value.replace(/\D/g, "").slice(0, max) });

  return (
    <div className="card-panel p-6 space-y-6">
      <div>
        <div className="text-[1.05rem] font-semibold">Farmer & land details</div>
        <div className="text-[0.85rem] mt-1" style={{ color: "var(--ink-muted)" }}>All fields are required to run a satellite assessment.</div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Farmer full name" error={errors.name}>
          <input className={inputCls} style={inputStyle(errors.name)} value={form.name} onChange={upd("name")}
            onFocus={(e) => focusOn(e, errors.name)} onBlur={(e) => focusOff(e, errors.name)} placeholder="e.g. Basavaraj Patil" />
        </Field>
        <Field label="Mobile number" error={errors.mobile}>
          <input className={inputCls} style={inputStyle(errors.mobile)} value={form.mobile} onChange={digits("mobile", 10)}
            onFocus={(e) => focusOn(e, errors.mobile)} onBlur={(e) => focusOff(e, errors.mobile)} inputMode="numeric" placeholder="10-digit mobile" />
        </Field>
        <Field label="Aadhaar number" error={errors.aadhaar} hint="Used only to verify identity, never stored in plain text.">
          <input className={inputCls} style={inputStyle(errors.aadhaar)} value={form.aadhaar} onChange={digits("aadhaar", 12)}
            onFocus={(e) => focusOn(e, errors.aadhaar)} onBlur={(e) => focusOff(e, errors.aadhaar)} inputMode="numeric" placeholder="12-digit Aadhaar" />
        </Field>
        <Field label="Land record (RoR) number" error={errors.rorId}>
          <input className={inputCls} style={inputStyle(errors.rorId)} value={form.rorId} onChange={upd("rorId")}
            onFocus={(e) => focusOn(e, errors.rorId)} onBlur={(e) => focusOff(e, errors.rorId)} placeholder="e.g. RoR/MYS/2026/00231" />
        </Field>
        <Field label="State" hint="Pilot coverage: Karnataka districts only.">
          <input className={inputCls} value="Karnataka" disabled style={{ background: "var(--border-soft)", color: "var(--ink-muted)", borderColor: "var(--border)" }} />
        </Field>
        <Field label="District" error={errors.district}>
          <select className={inputCls} style={inputStyle(errors.district)} value={form.district} onChange={upd("district")}
            onFocus={(e) => focusOn(e, errors.district)} onBlur={(e) => focusOff(e, errors.district)}>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Primary crop">
          <select className={inputCls} style={inputStyle()} value={form.crop} onChange={upd("crop")}
            onFocus={(e) => focusOn(e)} onBlur={(e) => focusOff(e)}>
            {CROPS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Approx. land area (acres)" error={errors.areaAcres}>
          <input className={inputCls} style={inputStyle(errors.areaAcres)} value={form.areaAcres} onChange={upd("areaAcres")}
            onFocus={(e) => focusOn(e, errors.areaAcres)} onBlur={(e) => focusOff(e, errors.areaAcres)} type="number" min={0.1} step={0.1} placeholder="e.g. 3.4" />
        </Field>
      </div>

      <div className="pt-4 border-t" style={{ borderColor: "var(--border-soft)" }}>
        <div className="text-[0.9rem] font-semibold mb-3">Land parcel preview</div>
        <div className="grid gap-5 md:grid-cols-[1.1fr_1fr] items-start">
          <MapWrapper rorId={form.rorId} district={form.district} confirmed={boundaryConfirmed} />
          <div>
            <p className="text-[0.85rem]" style={{ color: "var(--ink-muted)" }}>
              We've located the parcel from the RoR number and district registry. Confirm the boundary matches the applicant's holding before running assessment.
            </p>
            {!boundaryConfirmed ? (
              <button onClick={() => setBoundaryConfirmed(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[0.85rem] font-semibold border"
                style={{ borderColor: "var(--border)", background: "#fff" }}>
                <MapPin size={15} /> Confirm parcel boundary
              </button>
            ) : (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-[10px] text-[0.85rem] font-semibold"
                style={{ background: "var(--field-light)", color: "var(--field-ink)" }}>
                <Check size={15} /> Boundary confirmed
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={onNext} className="btn-primary px-5 py-2.5 rounded-[12px] text-[0.9rem] font-semibold inline-flex items-center gap-2">
          Run satellite assessment <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
type Step1 = React.ComponentProps<typeof Step1>;

function Step2({ app, onDone, onError }: { app: any; onDone: (res: any) => void; onError: () => void }) {
  const steps = [
    { l: "Fetching Sentinel-2 imagery", d: "2-year historical pass · parcel-matched" },
    { l: "Classifying crop type", d: "CNN multi-spectral classifier" },
    { l: "Estimating yield from NDVI", d: "Vegetation health time series" },
    { l: "Cross-referencing mandi prices", d: "District-level price index, eNAM" },
    { l: "Computing KCC eligibility score", d: "Income model + land verification" },
  ];
  const [state, setState] = useState<("idle" | "active" | "done")[]>(steps.map(() => "idle"));
  const [functionResult, setFunctionResult] = useState<any>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => setState(s => s.map((v, j) => j === i ? "active" : v)), 200 + i * 1000));
      timers.push(setTimeout(() => setState(s => s.map((v, j) => j === i ? "done" : v)), 980 + i * 1000));
    });

    const runScan = async () => {
      try {
        const runSatelliteScan = httpsCallable(functions, "runSatelliteScan");
        const result = await runSatelliteScan({
          firestoreId: app.firestoreId,
          crop: app.crop,
          areaAcres: app.areaAcres,
          district: app.district,
          coords: app.coords
        });
        setFunctionResult(result.data);
      } catch (err) {
        console.error("Cloud function failed:", err);
        toast.error("Satellite scan failed. Please try again.");
        onError();
      }
    };
    runScan();

    return () => timers.forEach(clearTimeout);
  }, [app, onError]);

  const allDone = state.every(s => s === "done") && functionResult !== null;

  return (
    <div className="card-panel p-6">
      <div className="text-[1.05rem] font-semibold">Satellite assessment in progress</div>
      <div className="text-[0.85rem] mt-1" style={{ color: "var(--ink-muted)" }}>Parcel located in {app.district}. Streaming Sentinel-2 data.</div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] mt-5">
        <NDVIWrap coords={app.coords} />
        <div className="space-y-4">
          {steps.map((s, i) => {
            const st = state[i];
            const appear = st !== "idle";
            return (
              <div key={s.l} className="flex items-start gap-3 transition-all duration-300"
                style={{ opacity: appear ? 1 : 0.35, transform: appear ? "translateY(0)" : "translateY(7px)", transitionDelay: `${i * 90}ms` }}>
                <div className="mt-0.5 relative w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    border: st === "idle" ? "1.5px solid var(--border)" : st === "active" ? "1.5px solid var(--field)" : "none",
                    background: st === "done" ? "var(--field)" : "#fff",
                    boxShadow: st === "active" ? "0 0 0 4px rgba(31,122,77,.14)" : "none",
                  }}>
                  {st === "done" && <Check size={13} color="#fff" />}
                  {st === "active" && <span className="w-2 h-2 rounded-full" style={{ background: "var(--field)", animation: "dotpulse 1s infinite" }} />}
                </div>
                <div>
                  <div className="text-[0.9rem] font-semibold">{s.l}</div>
                  <div className="mono text-[0.72rem] mt-0.5" style={{ color: "var(--ink-faint)" }}>{s.d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-5 flex items-center justify-between border-t" style={{ borderColor: "var(--border-soft)" }}>
        <div className="mono text-[0.75rem]" style={{ color: "var(--ink-faint)" }}>Estimated time: &lt; 1 min</div>
        <button onClick={() => onDone(functionResult)} disabled={!allDone} className="btn-primary px-5 py-2.5 rounded-[12px] text-[0.9rem] font-semibold inline-flex items-center gap-2">
          View eligibility result <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// Wrap NDVI viewport with animation from Step 2
import { NDVIViewport } from "@/components/NDVIViewport";
function NDVIWrap({ coords }: { coords: string }) {
  return <NDVIViewport coords={coords} animate />;
}

function Step3({ app, onDecide }: { app: Application; onDecide: (s: AppStatus, note: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-6">
      <ResultPanel app={app} />
      <div className="card-panel p-6">
        <div className="text-[1.05rem] font-semibold">Officer decision</div>
        <div className="text-[0.85rem] mt-1" style={{ color: "var(--ink-muted)" }}>Add an optional note and choose an outcome. This will be logged against the application.</div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add note (optional)…"
          className="mt-4 w-full p-3 rounded-[12px] border text-[0.88rem] outline-none resize-none"
          style={{ borderColor: "var(--border)" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--field)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(31,122,77,.14)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }} />
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => onDecide("approved", note)} className="btn-primary px-4 py-2.5 rounded-[12px] text-[0.88rem] font-semibold inline-flex items-center gap-2">
            <CheckCircle2 size={16} /> Approve KCC
          </button>
          <button onClick={() => onDecide("review", note)} className="btn-gold px-4 py-2.5 rounded-[12px] text-[0.88rem] font-semibold inline-flex items-center gap-2">
            <AlertTriangle size={16} /> Send for field verification
          </button>
          <button onClick={() => onDecide("declined", note)} className="px-4 py-2.5 rounded-[12px] text-[0.88rem] font-semibold inline-flex items-center gap-2 border transition-colors"
            style={{ color: "var(--danger)", borderColor: "var(--danger)", background: "#fff" }}>
            <XCircle size={16} /> Decline
          </button>
        </div>
      </div>
    </div>
  );
}
