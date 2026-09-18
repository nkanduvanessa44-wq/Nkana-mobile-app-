import React, { useState, useEffect } from "react";
import { 
  User, 
  Bill, 
  Payment, 
  Complaint, 
  SystemNotification, 
  AuditLog 
} from "../types";
import { 
  Users, 
  AlertCircle, 
  Wrench, 
  DollarSign, 
  BellRing, 
  Database, 
  CheckCircle, 
  Loader2, 
  UserCheck, 
  Plus, 
  MapPin, 
  FileSpreadsheet, 
  TrendingUp,
  Search,
  Check,
  BarChart3,
  Droplets,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  Gauge,
  SlidersHorizontal,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  FileText
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";

interface MonthlyConsumptionRecord {
  month: string;
  label: string;
  kiloliters: number;
  liters: number;
  estimatedCostZMW: number;
  benchmarkTarget: number;
}

interface ConsumptionSummary {
  averageDaily: number;
  peakUsage: number;
  estimatedCostZMW: number;
  trend: "up" | "down" | "stable";
  insight: string;
}

function ConsumptionCustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const record = payload[0]?.payload as MonthlyConsumptionRecord;
  if (!record) return null;

  const kls = record.kiloliters;
  const cost = record.estimatedCostZMW;
  const liters = record.liters.toLocaleString();
  const diffPct = Math.round(((kls - 20) / 20) * 100);

  return (
    <div className="bg-slate-900/95 border border-cyan-400/40 backdrop-blur-xl p-3.5 rounded-xl shadow-2xl text-xs space-y-2 min-w-[220px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <span className="font-extrabold text-white text-[13px]">{record.label}</span>
        <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
          {record.month}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-[11px] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
            Consumption:
          </span>
          <span className="font-extrabold text-white font-mono text-[12px]">{kls} kL <span className="text-[10px] text-slate-400 font-normal">({liters} L)</span></span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-[11px] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
            Est. Tariff Billed:
          </span>
          <span className="font-bold text-emerald-400 font-mono text-[12px]">ZMW {cost.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
          <span className="text-slate-400">NWASCO Baseline:</span>
          <span className={`font-bold ${diffPct > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {diffPct > 0 ? `+${diffPct}% above baseline` : diffPct < 0 ? `${Math.abs(diffPct)}% below baseline` : "Matches baseline"}
          </span>
        </div>

        <div className="text-[9.5px] text-slate-300 bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center justify-between">
          <span>Tariff Category:</span>
          <span className="text-cyan-300 font-semibold">{kls > 30 ? "Tier 3 (>30 kL High)" : kls >= 15 ? "Tier 2 (15-30 kL Standard)" : "Tier 1 (<15 kL Lifeline)"}</span>
        </div>
      </div>
    </div>
  );
}

interface AdminDashboardProps {
  activeAccountNo: string;
  setActiveAccountNo: (acc: string) => void;
  triggerRefreshSignal: number;
  setTriggerRefreshSignal: React.Dispatch<React.SetStateAction<number>>;
}

const DEFAULT_STATS = {
  totalCustomers: 3,
  totalComplaints: 2,
  pendingComplaints: 1,
  assignedComplaints: 1,
  resolvedComplaints: 0,
  revenueZMW: 790.20
};

const DEFAULT_USERS: User[] = [
  {
    id: "user-1",
    email: "nkanduvanessa44@gmail.com",
    passwordHash: "argon2id-mock",
    name: "Vanessa Nkandu",
    phone: "+260 971 234567",
    accountNo: "NW-889410",
    meterNo: "MTR-7729-N",
    address: "Plot 42, Riverside, Kitwe",
    role: "customer"
  },
  {
    id: "user-3",
    email: "kapembwa.chanda@gmail.com",
    passwordHash: "argon2id-mock",
    name: "Kapembwa Chanda",
    phone: "+260 977 445566",
    accountNo: "NW-552109",
    meterNo: "MTR-4410-E",
    address: "Plot 18, Nkana East, Kitwe",
    role: "customer"
  },
  {
    id: "user-4",
    email: "mary.musonda@yahoo.com",
    passwordHash: "argon2id-mock",
    name: "Mary Musonda",
    phone: "+260 955 112233",
    accountNo: "NW-334982",
    meterNo: "MTR-9902-P",
    address: "12 Parklands Crescent, Kitwe",
    role: "customer"
  }
];

const DEFAULT_COMPLAINTS: Complaint[] = [
  {
    id: "cmp-001",
    accountNo: "NW-889410",
    customerName: "Vanessa Nkandu",
    phone: "+260 971 234567",
    category: "leak",
    description: "Water leaking heavily from the main meter pipe connection at the gate.",
    imageUrl: "https://images.unsplash.com/photo-1585703901170-cc31df956897?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    gpsLocation: {
      lat: -12.7932,
      lng: 28.2315,
      address: "Riverside, Kitwe (near CBU Campus)"
    },
    status: "assigned",
    assignedTechnician: "Mwansa Phiri",
    createdAt: "2026-07-10T08:30:00Z",
    updatedAt: "2026-07-11T10:00:00Z"
  },
  {
    id: "cmp-002",
    accountNo: "NW-889410",
    customerName: "Vanessa Nkandu",
    phone: "+260 971 234567",
    category: "sewer",
    description: "Sewer blockage on the service lane behind the property.",
    gpsLocation: {
      lat: -12.7915,
      lng: 28.234,
      address: "Plot 42, Riverside, Kitwe"
    },
    status: "pending",
    createdAt: "2026-07-13T07:15:00Z",
    updatedAt: "2026-07-13T07:15:00Z"
  }
];

const DEFAULT_PAYMENTS: Payment[] = [
  {
    id: "pay-1",
    accountNo: "NW-889410",
    amount: 380.00,
    provider: "MTN",
    phoneNo: "+260 971 234567",
    reference: "MTN-TX-88390291",
    timestamp: "2026-06-18T14:32:00Z",
    status: "success"
  },
  {
    id: "pay-2",
    accountNo: "NW-889410",
    amount: 410.20,
    provider: "Airtel",
    phoneNo: "+260 971 234567",
    reference: "ART-TX-99120938",
    timestamp: "2026-05-15T09:15:00Z",
    status: "success"
  }
];

const DEFAULT_NOTIFICATIONS: SystemNotification[] = [
  {
    id: "not-1",
    title: "Planned Water Interruption",
    message: "Nkana Water will suspend supply to Riverside and Parklands on Wednesday 15th July 2026 from 08:00 to 17:00 for system maintenance and pump repairs.",
    type: "maintenance",
    createdAt: "2026-07-12T10:00:00Z"
  },
  {
    id: "not-2",
    title: "Emergency Pipe Repair",
    message: "A major burst line on Jambo Drive has cut supply to Nkana East. Our technicians are on site. Expected restoration by 18:00 today.",
    type: "emergency",
    createdAt: "2026-07-13T08:00:00Z"
  },
  {
    id: "not-3",
    title: "Bill Invoice Issued",
    message: "Your water bill for June 2026 of ZMW 420.50 has been generated. Due date is 20th July 2026.",
    type: "billing",
    targetAccount: "NW-889410",
    createdAt: "2026-07-01T06:00:00Z"
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    timestamp: "2026-07-13T08:00:00Z",
    action: "SYSTEM_INIT",
    details: "Nkana Water Smart App system backend initialized successfully."
  }
];

const generateDefaultMonthlyConsumption = (accNo: string): MonthlyConsumptionRecord[] => {
  const months = [
    { month: "Aug", kls: 22 },
    { month: "Sep", kls: 24 },
    { month: "Oct", kls: 26 },
    { month: "Nov", kls: 29 },
    { month: "Dec", kls: 31 },
    { month: "Jan", kls: 30 },
    { month: "Feb", kls: 25 },
    { month: "Mar", kls: 23 },
    { month: "Apr", kls: 27 },
    { month: "May", kls: 25 },
    { month: "Jun", kls: 28 },
    { month: "Jul", kls: 10 }
  ];

  const offset = ((accNo || "NW-889410").charCodeAt(accNo?.length ? accNo.length - 1 : 0) % 5) - 2;

  return months.map(m => {
    const kls = Math.max(8, m.kls + offset);
    return {
      month: m.month,
      label: `${m.month} 2026`,
      kiloliters: kls,
      liters: kls * 1000,
      estimatedCostZMW: parseFloat((kls * 15 + 25).toFixed(2)),
      benchmarkTarget: 20
    };
  });
};

export default function AdminDashboard({ 
  activeAccountNo, 
  setActiveAccountNo,
  triggerRefreshSignal,
  setTriggerRefreshSignal 
}: AdminDashboardProps) {
  // Database datasets mapped from backend endpoint telemetry
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [complaints, setComplaints] = useState<Complaint[]>(DEFAULT_COMPLAINTS);
  const [payments, setPayments] = useState<Payment[]>(DEFAULT_PAYMENTS);
  const [notifications, setNotifications] = useState<SystemNotification[]>(DEFAULT_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(DEFAULT_AUDIT_LOGS);

  // Filtering states
  const [complaintFilter, setComplaintFilter] = useState<string>("all");
  const [customerSearch, setCustomerSearch] = useState<string>("");

  // Create Broadcast Notification State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<SystemNotification["type"]>("maintenance");

  // Selection states for complaint dispatch action
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("Mwansa Phiri");

  // Loading indicator for processing operations
  const [isProcessing, setIsProcessing] = useState(false);

  // Available field technicians in Kitwe division
  const techniciansList = [
    "Mwansa Phiri (Senior Leak Specialist)",
    "Mulenga Banda (Sewer Systems Engineer)",
    "Chileshe Mwape (Meter Technologist)",
    "Vanessa Tembo (Water Line Field Crew)"
  ];

  // Active Account Monthly Water Consumption Analytics state
  const [consumptionMonthly, setConsumptionMonthly] = useState<MonthlyConsumptionRecord[]>(() => generateDefaultMonthlyConsumption(activeAccountNo));
  const [consumptionSummary, setConsumptionSummary] = useState<ConsumptionSummary | null>({
    averageDaily: 262,
    peakUsage: 410,
    estimatedCostZMW: 51,
    trend: "up",
    insight: "Consumption profile shows expected seasonal surge during dry months (Oct-Dec) with stabilization in Q1 2026."
  });
  const [isLoadingConsumption, setIsLoadingConsumption] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<"area" | "bar" | "dual">("area");
  const [showBaseline, setShowBaseline] = useState<boolean>(true);

  // Robust fetch helper with retry to smoothly handle cold starts or brief server reloads
  const fetchWithRetry = async (url: string, retries = 3, delayMs = 600): Promise<Response | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url);
        if (res.ok) return res;
      } catch {
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }
    return null;
  };

  // Load telemetry datasets on render/signal change
  useEffect(() => {
    fetchAdminDatasets();
  }, [triggerRefreshSignal]);

  // Fetch consumption telemetry for active account
  useEffect(() => {
    fetchAccountConsumption(activeAccountNo);
  }, [activeAccountNo, triggerRefreshSignal]);

  const fetchAccountConsumption = async (accNo: string) => {
    setIsLoadingConsumption(true);
    try {
      const res = await fetchWithRetry(`/api/customer/consumption?accountNo=${accNo}`);
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.monthly && Array.isArray(data.monthly)) {
          const enriched: MonthlyConsumptionRecord[] = data.monthly.map((m: any) => ({
            month: m.month,
            label: m.label || `${m.month} 2026`,
            kiloliters: Number(m.kiloliters),
            liters: Number(m.kiloliters) * 1000,
            estimatedCostZMW: parseFloat((Number(m.kiloliters) * 15 + 25).toFixed(2)),
            benchmarkTarget: 20
          }));
          setConsumptionMonthly(enriched);
          if (data.summary) {
            setConsumptionSummary(data.summary);
          }
          return;
        }
      }
    } catch {
      // Handled gracefully via default state
    } finally {
      setIsLoadingConsumption(false);
    }

    // Default generator if network is momentarily unavailable
    setConsumptionMonthly(prev => prev.length > 0 ? prev : generateDefaultMonthlyConsumption(accNo));
  };

  const fetchAdminDatasets = async () => {
    try {
      const res = await fetchWithRetry("/api/admin/dashboard");
      if (res && res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          if (data.stats) setStats(data.stats);
          if (Array.isArray(data.users) && data.users.length) setUsers(data.users);
          if (Array.isArray(data.complaints)) setComplaints(data.complaints);
          if (Array.isArray(data.payments)) setPayments(data.payments);
          if (Array.isArray(data.notifications)) setNotifications(data.notifications);
          if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
          return;
        }
      }
    } catch {
      // Handled gracefully via fallback
    }

    // Ensure state preserves default mock data
    setStats(prev => prev.totalCustomers > 0 ? prev : DEFAULT_STATS);
    setUsers(prev => prev.length > 0 ? prev : DEFAULT_USERS);
    setComplaints(prev => prev.length > 0 ? prev : DEFAULT_COMPLAINTS);
    setPayments(prev => prev.length > 0 ? prev : DEFAULT_PAYMENTS);
    setNotifications(prev => prev.length > 0 ? prev : DEFAULT_NOTIFICATIONS);
    setAuditLogs(prev => prev.length > 0 ? prev : DEFAULT_AUDIT_LOGS);
  };

  // Assign Technician Action
  const handleAssignTechnician = async (complaintId: string, techName: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/issues/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId, technicianName: techName })
      }).then(r => r.json());

      if (!res.error) {
        setTriggerRefreshSignal(prev => prev + 1);
        setSelectedComplaintId(null);
      }
    } catch (e) {
      alert("Technician assignment connection failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Update Ticket Status
  const handleUpdateStatus = async (complaintId: string, status: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/issues/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId, status })
      }).then(r => r.json());

      if (!res.error) {
        setTriggerRefreshSignal(prev => prev + 1);
      }
    } catch (e) {
      alert("Ticket status change connection failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Broadcast Notification
  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      alert("Please enter a title and message.");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          type: broadcastType
        })
      }).then(r => r.json());

      if (res.notification) {
        alert("Broadcast announcement dispatched to all connected customers.");
        setBroadcastTitle("");
        setBroadcastMessage("");
        setTriggerRefreshSignal(prev => prev + 1);
      }
    } catch (e) {
      alert("Broadcast alert connection failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateReportExcel = () => {
    alert("Report Engine compilation complete.\nGenerated file: NKANA_WATER_FINANCIAL_Q2_2026.csv\n\nContains details for " + users.length + " customers, " + payments.length + " payments, and " + complaints.length + " service complaints.\nSent audit trail log to security cluster.");
  };

  // Filter complaints based on active filter button
  const filteredComplaints = complaints.filter(c => {
    if (complaintFilter === "all") return true;
    return c.status === complaintFilter;
  });

  // Filter customer management list based on search bar
  const filteredUsers = users.filter(u => {
    if (!customerSearch) return true;
    return u.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
           u.accountNo.toLowerCase().includes(customerSearch.toLowerCase()) ||
           u.phone.includes(customerSearch);
  });

  // Current active account user profile
  const activeCustomer = users.find(u => u.accountNo === activeAccountNo) || {
    id: "usr-fallback",
    name: "Vanessa Nkandu",
    phone: "+260 971 234567",
    accountNo: activeAccountNo,
    meterNo: "MTR-7729-N",
    address: "Plot 42, Riverside, Kitwe",
    role: "customer" as const,
    email: "nkanduvanessa44@gmail.com"
  };

  const totalAnnualKls = consumptionMonthly.reduce((sum, item) => sum + item.kiloliters, 0);
  const avgMonthlyKls = consumptionMonthly.length ? (totalAnnualKls / consumptionMonthly.length).toFixed(1) : "0";
  const peakRecord = consumptionMonthly.length 
    ? [...consumptionMonthly].sort((a, b) => b.kiloliters - a.kiloliters)[0] 
    : { label: "N/A", month: "-", kiloliters: 0 };
  const totalBilledZMW = consumptionMonthly.reduce((sum, item) => sum + item.estimatedCostZMW, 0).toFixed(2);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col font-sans" id="admin-dashboard-container">
      
      {/* Top Banner Header */}
      <div className="bg-white/10 backdrop-blur-xl px-6 py-5 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] bg-cyan-400/20 text-cyan-300 font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border border-cyan-400/30">
            Nkana Water Backoffice Portals
          </span>
          <h2 className="text-xl font-extrabold text-white font-display mt-2 flex items-center gap-2">
            <img src="/src/assets/images/nkana_water_logo_1783960634720.jpg" alt="Nkana Water Logo" className="w-8 h-8 rounded-full bg-white object-cover shadow border border-white/20 shrink-0" referrerPolicy="no-referrer" />
            Smart Water Management Center
          </h2>
          <p className="text-xs text-slate-300">Command system for monitoring complaints, allocating repair resources, and tracking mobile money ledgers</p>
        </div>

        <button 
          onClick={handleSimulateReportExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-emerald-600/10 active:scale-98 transition-all flex items-center gap-2 border border-white/10"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export Operations CSV
        </button>
      </div>

      {/* DASHBOARD GRID CONTAINER */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent">
        
        {/* KPI STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-md flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wide">Total Accounts</span>
              <h3 className="text-xl font-bold text-white mt-0.5">{stats.totalCustomers} Active</h3>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-md flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wide">Pending Issues</span>
              <h3 className="text-xl font-bold text-white mt-0.5">{stats.pendingComplaints} Unassigned</h3>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-md flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-400/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wide">In Progress</span>
              <h3 className="text-xl font-bold text-white mt-0.5">{stats.assignedComplaints + stats.totalComplaints - stats.pendingComplaints - stats.resolvedComplaints} Crew Out</h3>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-md flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wide">Resolved (ZMW)</span>
              <h3 className="text-xl font-bold text-white mt-0.5">ZMW {stats.revenueZMW.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* ACTIVE ACCOUNT MONTHLY WATER CONSUMPTION ANALYTICS (RECHARTS) */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-xl space-y-5" id="consumption-analytics-panel">
          
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] bg-cyan-400/20 text-cyan-300 font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-cyan-400/30 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Monthly Consumption Telemetry
                </span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>

              <h3 className="text-base font-extrabold text-white flex items-center gap-2 mt-1">
                <Droplets className="w-4 h-4 text-cyan-400" />
                Water Consumption Analytics for Account: <span className="text-cyan-300 font-mono underline decoration-cyan-400/40">{activeAccountNo}</span>
              </h3>
              
              <p className="text-xs text-slate-300">
                Tracking monthly kiloliters (kL), tariff billing projections, and baseline variance for <span className="text-white font-semibold">{activeCustomer.name}</span> ({activeCustomer.address} • Meter: <span className="font-mono text-cyan-300">{activeCustomer.meterNo}</span>)
              </p>
            </div>

            {/* Interactive Control Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Account Quick Switcher */}
              <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded-xl px-2.5 py-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Account:</span>
                <select
                  value={activeAccountNo}
                  onChange={(e) => setActiveAccountNo(e.target.value)}
                  className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.accountNo} className="bg-slate-900 text-white">
                      {u.accountNo} ({u.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex items-center bg-black/30 border border-white/10 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setChartMode("area")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    chartMode === "area"
                      ? "bg-cyan-400 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                  title="Area Flow Curve"
                >
                  Area Curve
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("bar")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    chartMode === "bar"
                      ? "bg-cyan-400 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                  title="Bar Histogram"
                >
                  Bar Chart
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("dual")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    chartMode === "dual"
                      ? "bg-cyan-400 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                  title="Dual Metric: Volume (kL) + Cost (ZMW)"
                >
                  Dual Metric
                </button>
              </div>

              {/* Toggle Baseline */}
              <button
                type="button"
                onClick={() => setShowBaseline(!showBaseline)}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  showBaseline
                    ? "bg-sky-500/20 border-sky-400/40 text-sky-300"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
                }`}
                title="Toggle NWASCO 20 kL/mo target line"
              >
                <Layers className="w-3 h-3" />
                Baseline (20 kL)
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => fetchAccountConsumption(activeAccountNo)}
                disabled={isLoadingConsumption}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                title="Refresh Consumption Dataset"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConsumption ? "animate-spin text-cyan-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Metric Highlights Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-black/25 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                12-Month Total
                <Droplets className="w-3 h-3 text-cyan-400" />
              </span>
              <div className="mt-2">
                <span className="text-lg font-extrabold text-white font-mono">{totalAnnualKls} kL</span>
                <p className="text-[9.5px] text-slate-400 mt-0.5">{(totalAnnualKls * 1000).toLocaleString()} Liters consumed</p>
              </div>
            </div>

            <div className="bg-black/25 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                Monthly Average
                <Activity className="w-3 h-3 text-emerald-400" />
              </span>
              <div className="mt-2">
                <span className="text-lg font-extrabold text-white font-mono">{avgMonthlyKls} kL/mo</span>
                <p className={`text-[9.5px] font-semibold mt-0.5 ${parseFloat(avgMonthlyKls) > 20 ? "text-amber-400" : "text-emerald-400"}`}>
                  {parseFloat(avgMonthlyKls) > 20 ? "+ Above 20 kL baseline" : "✓ Within efficiency tier"}
                </p>
              </div>
            </div>

            <div className="bg-black/25 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                Peak Usage Month
                <ArrowUpRight className="w-3 h-3 text-amber-400" />
              </span>
              <div className="mt-2">
                <span className="text-lg font-extrabold text-amber-300 font-mono">{peakRecord.kiloliters} kL</span>
                <p className="text-[9.5px] text-slate-400 mt-0.5">{peakRecord.label} (High usage)</p>
              </div>
            </div>

            <div className="bg-black/25 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                Est. Annual Billed
                <DollarSign className="w-3 h-3 text-emerald-400" />
              </span>
              <div className="mt-2">
                <span className="text-lg font-extrabold text-emerald-300 font-mono">ZMW {totalBilledZMW}</span>
                <p className="text-[9.5px] text-slate-400 mt-0.5">NWASCO Tier 2 Tariff</p>
              </div>
            </div>
          </div>

          {/* THE RECHARTS VISUALIZATION */}
          <div className="bg-black/30 border border-white/10 rounded-xl p-4 relative">
            
            {isLoadingConsumption && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-20 rounded-xl flex items-center justify-center gap-2 text-cyan-300 text-xs font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                Synchronizing consumption telemetry...
              </div>
            )}

            <div className="h-72 w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === "area" ? (
                  <AreaChart data={consumptionMonthly} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cyanWaterGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#ffffff12" strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#94a3b8" 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                      tickLine={{ stroke: "#ffffff20" }} 
                      axisLine={{ stroke: "#ffffff20" }} 
                    />
                    <YAxis 
                      yAxisId="left" 
                      stroke="#94a3b8" 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                      tickLine={false} 
                      axisLine={{ stroke: "#ffffff20" }} 
                      tickFormatter={(val) => `${val} kL`} 
                    />
                    <Tooltip content={<ConsumptionCustomTooltip />} />
                    {showBaseline && (
                      <ReferenceLine 
                        yAxisId="left" 
                        y={20} 
                        stroke="#38bdf8" 
                        strokeDasharray="4 4" 
                        strokeWidth={1.5}
                        label={{ value: "Target: 20 kL", fill: "#38bdf8", fontSize: 10, position: "top" }} 
                      />
                    )}
                    <Area 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="kiloliters" 
                      stroke="#22d3ee" 
                      strokeWidth={3} 
                      fill="url(#cyanWaterGrad)" 
                      name="Water Consumption (kL)"
                      activeDot={{ r: 6, fill: "#22d3ee", stroke: "#083344", strokeWidth: 2 }} 
                    />
                  </AreaChart>
                ) : chartMode === "bar" ? (
                  <BarChart data={consumptionMonthly} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barBlueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#ffffff12" strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#94a3b8" 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                      tickLine={{ stroke: "#ffffff20" }} 
                      axisLine={{ stroke: "#ffffff20" }} 
                    />
                    <YAxis 
                      yAxisId="left" 
                      stroke="#94a3b8" 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                      tickLine={false} 
                      axisLine={{ stroke: "#ffffff20" }} 
                      tickFormatter={(val) => `${val} kL`} 
                    />
                    <Tooltip content={<ConsumptionCustomTooltip />} />
                    {showBaseline && (
                      <ReferenceLine 
                        yAxisId="left" 
                        y={20} 
                        stroke="#38bdf8" 
                        strokeDasharray="4 4" 
                        strokeWidth={1.5}
                        label={{ value: "Target: 20 kL", fill: "#38bdf8", fontSize: 10, position: "top" }} 
                      />
                    )}
                    <Bar 
                      yAxisId="left" 
                      dataKey="kiloliters" 
                      fill="url(#barBlueGrad)" 
                      radius={[6, 6, 0, 0]} 
                      name="Water Consumption (kL)" 
                    />
                  </BarChart>
                ) : (
                  <BarChart data={consumptionMonthly} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dualBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.85}/>
                        <stop offset="100%" stopColor="#0369a1" stopOpacity={0.65}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#ffffff12" strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#94a3b8" 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                      tickLine={{ stroke: "#ffffff20" }} 
                      axisLine={{ stroke: "#ffffff20" }} 
                    />
                    <YAxis 
                      yAxisId="left" 
                      stroke="#38bdf8" 
                      tick={{ fill: "#38bdf8", fontSize: 11 }} 
                      tickLine={false} 
                      axisLine={{ stroke: "#ffffff20" }} 
                      tickFormatter={(val) => `${val} kL`} 
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#10b981" 
                      tick={{ fill: "#10b981", fontSize: 11 }} 
                      tickLine={false} 
                      axisLine={{ stroke: "#ffffff20" }} 
                      tickFormatter={(val) => `K${val}`} 
                    />
                    <Tooltip content={<ConsumptionCustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
                    {showBaseline && (
                      <ReferenceLine 
                        yAxisId="left" 
                        y={20} 
                        stroke="#38bdf8" 
                        strokeDasharray="4 4" 
                        strokeWidth={1.5}
                        label={{ value: "Target: 20 kL", fill: "#38bdf8", fontSize: 10, position: "top" }} 
                      />
                    )}
                    <Bar 
                      yAxisId="left" 
                      dataKey="kiloliters" 
                      fill="url(#dualBarGrad)" 
                      radius={[5, 5, 0, 0]} 
                      name="Volume (kL)" 
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="estimatedCostZMW" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      dot={{ r: 3, fill: "#10b981" }} 
                      activeDot={{ r: 6 }} 
                      name="Billed Cost (ZMW)" 
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Diagnostic & Telemetry Footer Strip */}
          <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-white">Meter Telemetry Status:</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                    Continuous AMR Active
                  </span>
                  <span className="text-[9px] font-mono text-cyan-300">SN: {activeCustomer.meterNo}</span>
                </div>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  {consumptionSummary?.insight || "Consumption profile shows expected seasonal surge during dry months (Oct-Dec) with stabilization in Q1 2026."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  alert(`Water Audit Brief generated for ${activeCustomer.name} (${activeAccountNo}):\n• Total 12-Month Usage: ${totalAnnualKls} kL (${(totalAnnualKls * 1000).toLocaleString()} Liters)\n• Average Monthly Draw: ${avgMonthlyKls} kL/mo\n• Peak Month: ${peakRecord.label} (${peakRecord.kiloliters} kL)\n• Estimated Annual Billed: ZMW ${totalBilledZMW}\n• Registered Meter: ${activeCustomer.meterNo}`);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] rounded-lg transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-300" /> Export Account Brief
              </button>
            </div>
          </div>

        </div>

        {/* WORK BENCH AREA FOR COMPLAINTS */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* COMPLAINTS DISPATCH LIST (2 COLS) */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-xl xl:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Citizen Complaint Queue</h4>
                <p className="text-[11px] text-slate-300">Assign specialists and review geo-tagged leakage uploads</p>
              </div>

              {/* OUTAGE CLUSTER TICKET FILTER */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All Tickets" },
                  { id: "pending", label: "Pending" },
                  { id: "assigned", label: "Assigned" },
                  { id: "resolved", label: "Resolved" }
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setComplaintFilter(btn.id)}
                    className={`px-3 py-1 text-[10px] font-bold border rounded-lg transition-all ${
                      complaintFilter === btn.id 
                        ? "bg-cyan-400 border-cyan-400 text-slate-950 shadow shadow-cyan-400/20" 
                        : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TICKETS LIST VIEW */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-black/20 border border-white/10 rounded-xl">
                  No complaints mapped in this filter sector.
                </div>
              ) : (
                filteredComplaints.map((c) => (
                  <div key={c.id} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-200">
                    
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-cyan-300 font-mono">TICKET_REF: {c.id}</span>
                          <span className={`text-[8px] font-bold border px-2 py-0.5 rounded-full uppercase ${
                            c.status === "pending" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                            c.status === "assigned" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" :
                            "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          }`}>
                            {c.status}
                          </span>
                          <span className="text-[9px] bg-white/10 text-slate-200 font-semibold px-2 py-0.5 rounded-lg uppercase border border-white/10">
                            {c.category}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-100">{c.customerName} (Acct: {c.accountNo}) • {c.phone}</h5>
                      </div>

                      <span className="text-[10px] text-slate-300">{new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed bg-black/25 p-2.5 rounded-lg border border-white/5">{c.description}</p>

                    {/* Geotag and Photo evidence layout */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate max-w-sm">{c.gpsLocation.address} ({c.gpsLocation.lat.toFixed(4)}, {c.gpsLocation.lng.toFixed(4)})</span>
                      </div>

                      {c.imageUrl && (
                        <a 
                          href={c.imageUrl} 
                          target="_blank" 
                          referrerPolicy="no-referrer"
                          className="text-[9px] font-bold text-cyan-300 hover:text-cyan-200 hover:underline flex items-center gap-1"
                        >
                          View Uploaded Photo Evidence
                        </a>
                      )}
                    </div>

                    {/* Interactive Assignment Widget */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                      {c.assignedTechnician ? (
                        <div className="text-xs text-slate-200 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-cyan-300" />
                          Assigned technician: <span className="font-bold text-cyan-300">{c.assignedTechnician}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-amber-300 font-bold">🚨 Needs Dispatch:</span>
                          {selectedComplaintId === c.id ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={selectedTechnician}
                                onChange={(e) => setSelectedTechnician(e.target.value)}
                                className="px-2 py-1 text-[11px] bg-slate-900 border border-white/20 rounded-md text-white focus:outline-none focus:border-cyan-400"
                              >
                                {techniciansList.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssignTechnician(c.id, selectedTechnician)}
                                disabled={isProcessing}
                                className="bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-bold text-[10px] px-2 py-1 rounded transition-colors"
                              >
                                {isProcessing ? "Processing..." : "Confirm"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setSelectedComplaintId(c.id); }}
                              className="text-[10px] font-bold bg-white/5 border border-white/10 text-cyan-300 hover:bg-cyan-400/20 px-3 py-1 rounded-lg"
                            >
                              Dispatch Crew
                            </button>
                          )}
                        </div>
                      )}

                      {/* Action status change */}
                      {c.status !== "resolved" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(c.id, "resolved")}
                            disabled={isProcessing}
                            className="bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 hover:bg-emerald-400/20 text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

          {/* BROADCASTER FOR EMERGENCY NOTIFICATIONS (1 COL) */}
          <div className="space-y-6">
            
            {/* ALERT BROADCAST PANEL */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-orange-400 animate-pulse" /> Outage Broadcaster
                </h4>
                <p className="text-[11px] text-slate-300">Push emergency maintenance notifications to citizen handsets</p>
              </div>

              <form onSubmit={handleBroadcastAlert} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Announcement Type</label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="maintenance">Planned System Maintenance</option>
                    <option value="emergency">Emergency Supply Failure</option>
                    <option value="general">General Outage Bulletin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Alert Title</label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Riverside Emergency Interruption"
                    className="w-full px-3.5 py-2 text-xs bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Detailed Message</label>
                  <textarea
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Provide details about affected sectors, crew activities, and estimated supply resumption hour..."
                    className="w-full h-24 px-3.5 py-2 text-xs bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400 resize-none placeholder-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-500 text-slate-950 rounded-lg font-bold text-xs shadow-lg shadow-cyan-400/10 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transmit Handset Alert"}
                </button>
              </form>
            </div>

            {/* DYNAMIC AUDIT TRAIL LOG */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-xl space-y-3.5">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-300" /> API Audit Log
                </h4>
                <span className="text-[9px] text-cyan-300 uppercase font-mono font-bold">PostgreSQL Sync</span>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="p-2.5 bg-black/25 rounded-xl border border-white/5 font-mono text-[10px] text-slate-300 space-y-1 select-text">
                    <div className="flex justify-between text-slate-400">
                      <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className="text-cyan-300 text-[9px] font-bold">{log.action}</span>
                    </div>
                    <p className="text-white leading-tight">{log.details}</p>
                    {log.user && <div className="text-[9px] text-slate-400">By: {log.user}</div>}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* CUSTOMERS & PAYMENT LEDGER AREA */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* CUSTOMER DIRECTORY (2 COLS) */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-xl xl:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Customer Account Directory</h4>
                <p className="text-[11px] text-slate-300">Review water meter serial registries and trigger remote lockups</p>
              </div>

              {/* OUTAGE CLIENT SEARCH */}
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search account / phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-300 uppercase text-[9px] font-bold">
                    <th className="py-2.5">Customer Name</th>
                    <th>Account No</th>
                    <th>Meter No</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {filteredUsers.map((u) => {
                    const isSelected = activeAccountNo === u.accountNo;
                    return (
                      <tr key={u.id} className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-cyan-400/10' : ''}`}>
                        <td className="py-3 font-semibold text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-white/10 text-[10px] flex items-center justify-center font-bold text-cyan-300 border border-white/5">
                            {u.name.slice(0, 2)}
                          </div>
                          {u.name}
                        </td>
                        <td className="font-mono text-cyan-300">{u.accountNo}</td>
                        <td className="font-mono text-slate-300">{u.meterNo}</td>
                        <td className="truncate max-w-[120px] text-slate-300" title={u.address}>{u.address}</td>
                        <td className="text-slate-300">{u.phone}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { 
                                setActiveAccountNo(u.accountNo); 
                                const elem = document.getElementById("consumption-analytics-panel");
                                if (elem) elem.scrollIntoView({ behavior: "smooth" });
                              }}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                isSelected 
                                  ? "bg-cyan-400 text-slate-950 border border-cyan-400 shadow-sm" 
                                  : "bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              <BarChart3 className="w-3 h-3" />
                              {isSelected ? "Active in Chart" : "Analyze Usage"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* REALTIME PAYMENTS FLOW (1 COL) */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> MoMo Gateway Feed
              </h4>
              <p className="text-[11px] text-slate-300">Airtel, Zamtel and MTN callback ledger notifications</p>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {payments.map((p) => (
                <div key={p.id} className="p-3 bg-black/25 border border-white/5 rounded-xl flex items-center justify-between text-xs font-sans hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center font-bold text-[10px] text-emerald-300 shrink-0">
                      ZMW
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">ZMW {p.amount.toFixed(2)}</span>
                        <span className={`text-[8px] font-bold uppercase px-1 rounded border ${
                          p.status === "success" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono truncate w-32">Ref: {p.reference}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-300 block font-semibold">{p.provider} Wallet</span>
                    <span className="text-[8px] text-slate-400">{new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
