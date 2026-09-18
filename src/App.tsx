import { useState } from "react";
import MobileSimulator from "./components/MobileSimulator";
import AdminDashboard from "./components/AdminDashboard";
import DeveloperDocs from "./components/DeveloperDocs";
import { 
  Droplet, 
  Smartphone, 
  ShieldCheck, 
  Database, 
  Wrench, 
  BookOpen, 
  Monitor, 
  Code2,
  ChevronRight,
  Info
} from "lucide-react";

export default function App() {
  // Sync state across handset and backoffice systems
  const [activeAccountNo, setActiveAccountNo] = useState<string>("NW-889410");
  const [triggerRefreshSignal, setTriggerRefreshSignal] = useState<number>(0);
  
  // Right hand side viewer: "admin" | "docs"
  const [activePortal, setActivePortal] = useState<"admin" | "docs">("admin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0369a1] text-slate-100 flex flex-col font-sans" id="app-root-shell">
      
      {/* GLOBAL ENTERPRISE TOP NAVIGATION */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-50 sticky top-0 shrink-0 shadow-xl shadow-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-cyan-400/10 ring-2 ring-white/20 shrink-0">
            <img src="/src/assets/images/nkana_water_logo_1783960634720.jpg" alt="Nkana Water Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-md font-extrabold tracking-tight font-display text-white">NKANA WATER <span className="text-cyan-400">UTILITY</span></h1>
              <span className="text-[9px] bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 font-bold px-2 py-0.5 rounded-full uppercase">Sandbox Environment</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">Full-Stack Simulation: Customer Mobile App + REST API Server + Web Admin Console</p>
          </div>
        </div>

        {/* Console Switchers */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-md p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActivePortal("admin")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activePortal === "admin" 
                ? "bg-cyan-400 text-slate-950 shadow shadow-cyan-400/30 font-extrabold" 
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Admin Command Deck
          </button>
          <button
            onClick={() => setActivePortal("docs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activePortal === "docs" 
                ? "bg-cyan-400 text-slate-950 shadow shadow-cyan-400/30 font-extrabold" 
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Engineering Reference Docs
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA - SPLIT SCREEN LAYOUT */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-0">
        
        {/* LEFT PANE: HANDSET SIMULATOR (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col justify-start">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  Client Handset Emulator
                </h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Simulating the Flutter (Dart) Mobile client</p>
              </div>

              {/* Connected details */}
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-bold block select-none">● DEVICE CONNECTED</span>
                <span className="text-[9px] text-slate-300 select-all font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">ID: {activeAccountNo}</span>
              </div>
            </div>

            {/* Simulated smartphone */}
            <MobileSimulator 
              activeAccountNo={activeAccountNo}
              setActiveAccountNo={setActiveAccountNo}
              triggerRefreshSignal={triggerRefreshSignal}
              setTriggerRefreshSignal={setTriggerRefreshSignal}
            />

            {/* Sandbox details */}
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-start gap-2 text-[10px] text-slate-300 leading-relaxed">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">How to test full-stack reactivity:</span>
                Report a leak in the phone (Reports tab) with a mock photo and GPS. It will instantly stream to the Admin Ticket Queue! Or dispatch a tech in the Admin console, and watch the Notification bell light up on the phone!
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: WEB PORTALS & CODE DOCUMENTS (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col min-h-0">
          {activePortal === "admin" ? (
            <AdminDashboard 
              activeAccountNo={activeAccountNo}
              setActiveAccountNo={setActiveAccountNo}
              triggerRefreshSignal={triggerRefreshSignal}
              setTriggerRefreshSignal={setTriggerRefreshSignal}
            />
          ) : (
            <DeveloperDocs />
          )}
        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950/60 backdrop-blur-md border-t border-white/10 py-4 px-6 text-center text-slate-400 text-xs shrink-0 flex flex-col md:flex-row items-center justify-between gap-2 max-w-[1700px] w-full mx-auto rounded-t-2xl mt-4">
        <p>© 2026 Smart Water Customer App. Authored for Nkana Water Supply and Sanitation Company.</p>
        <p className="text-[10px] text-slate-400 font-mono">Target Platform: Node.js/Express (API) + React/Vite (Portals) + Flutter/Dart (Mobile Client)</p>
      </footer>

    </div>
  );
}
