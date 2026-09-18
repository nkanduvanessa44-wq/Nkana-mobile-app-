import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Interfaces & Types
interface User {
  id: string;
  email: string;
  passwordHash: string; // Argon2 / Mock
  name: string;
  phone: string;
  accountNo: string;
  meterNo: string;
  address: string;
  role: "customer" | "admin";
}

interface Bill {
  id: string;
  accountNo: string;
  billingPeriod: string;
  amount: number;
  consumptionKls: number; // Consumption in kiloliters
  dueDate: string;
  status: "paid" | "unpaid" | "overdue";
  pdfUrl: string;
}

interface Payment {
  id: string;
  accountNo: string;
  amount: number;
  provider: "MTN" | "Airtel" | "Zamtel";
  phoneNo: string;
  reference: string;
  timestamp: string;
  status: "pending" | "success" | "failed";
}

interface PrepaidToken {
  id: string;
  accountNo: string;
  amount: number;
  liters: number;
  token: string;
  provider: "MTN" | "Airtel" | "Zamtel";
  phoneNo: string;
  reference: string;
  timestamp: string;
  status: "pending" | "success" | "failed";
}

interface Complaint {
  id: string;
  accountNo: string;
  customerName: string;
  phone: string;
  category: "leak" | "no-supply" | "sewer" | "meter" | "other";
  description: string;
  imageUrl?: string;
  gpsLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  status: "pending" | "assigned" | "in-progress" | "resolved";
  assignedTechnician?: string;
  createdAt: string;
  updatedAt: string;
}

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "maintenance" | "emergency" | "billing" | "general";
  targetAccount?: string; // If specific, otherwise all
  createdAt: string;
}

// In-Memory Database State
const DB_USERS: User[] = [
  {
    id: "user-1",
    email: "nkanduvanessa44@gmail.com",
    passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$m9X... (hashed password)",
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
    passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$m9X...",
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
    passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$m9X...",
    name: "Mary Musonda",
    phone: "+260 955 112233",
    accountNo: "NW-334982",
    meterNo: "MTR-9902-P",
    address: "12 Parklands Crescent, Kitwe",
    role: "customer"
  },
  {
    id: "user-2",
    email: "admin@nkanawater.co.zm",
    passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$m9X... (admin password)",
    name: "Bwalya Chilufya",
    phone: "+260 966 987654",
    accountNo: "NW-ADMIN",
    meterNo: "N/A",
    address: "Headquarters, Nkana Water House, Kitwe",
    role: "admin"
  }
];

const DB_BILLS: Bill[] = [
  {
    id: "bill-101",
    accountNo: "NW-889410",
    billingPeriod: "June 2026",
    amount: 420.50,
    consumptionKls: 28,
    dueDate: "2026-07-20",
    status: "unpaid",
    pdfUrl: "/api/bills/download/bill-101"
  },
  {
    id: "bill-100",
    accountNo: "NW-889410",
    billingPeriod: "May 2026",
    amount: 380.00,
    consumptionKls: 25,
    dueDate: "2026-06-20",
    status: "paid",
    pdfUrl: "/api/bills/download/bill-100"
  },
  {
    id: "bill-99",
    accountNo: "NW-889410",
    billingPeriod: "April 2026",
    amount: 410.20,
    consumptionKls: 27,
    dueDate: "2026-05-20",
    status: "paid",
    pdfUrl: "/api/bills/download/bill-99"
  },
  {
    id: "bill-201",
    accountNo: "NW-552109",
    billingPeriod: "June 2026",
    amount: 315.00,
    consumptionKls: 21,
    dueDate: "2026-07-20",
    status: "paid",
    pdfUrl: "/api/bills/download/bill-201"
  },
  {
    id: "bill-301",
    accountNo: "NW-334982",
    billingPeriod: "June 2026",
    amount: 520.00,
    consumptionKls: 35,
    dueDate: "2026-07-20",
    status: "unpaid",
    pdfUrl: "/api/bills/download/bill-301"
  }
];

const DB_PAYMENTS: Payment[] = [
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

const DB_PREPAID_TOKENS: PrepaidToken[] = [
  {
    id: "tok-1",
    accountNo: "NW-889410",
    amount: 150.00,
    liters: 10000,
    token: "5423-8902-1143-9820-4352",
    provider: "MTN",
    phoneNo: "+260 971 234567",
    reference: "MTN-TX-77382012",
    timestamp: "2026-07-05T10:15:00Z",
    status: "success"
  },
  {
    id: "tok-2",
    accountNo: "NW-889410",
    amount: 75.00,
    liters: 5000,
    token: "8102-3345-9180-2245-0981",
    provider: "Airtel",
    phoneNo: "+260 971 234567",
    reference: "ART-TX-10928452",
    timestamp: "2026-07-11T16:40:00Z",
    status: "success"
  }
];

const DB_COMPLAINTS: Complaint[] = [
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
      lng: 28.2340,
      address: "Plot 42, Riverside, Kitwe"
    },
    status: "pending",
    createdAt: "2026-07-13T07:15:00Z",
    updatedAt: "2026-07-13T07:15:00Z"
  }
];

const DB_NOTIFICATIONS: SystemNotification[] = [
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

// Audit logs
const DB_AUDIT_LOGS: Array<{ timestamp: string; action: string; details: string; user?: string }> = [
  { timestamp: "2026-07-13T08:00:00Z", action: "SYSTEM_INIT", details: "Nkana Water Smart App system backend initialized successfully." }
];

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS & Security Headers Middleware
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Log Request Middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // REST API: Authentication Endpoints
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name, phone, address } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields (email, password, name)" });
    }

    const exists = DB_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "A user with this email already exists" });
    }

    const accountNo = `NW-${Math.floor(100000 + Math.random() * 900000)}`;
    const meterNo = `MTR-${Math.floor(1000 + Math.random() * 9000)}-N`;

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      passwordHash: `$argon2id$v=19$m=65536,t=3,p=4$mock_registered_hash`,
      name,
      phone: phone || "+260 970 000000",
      accountNo,
      meterNo,
      address: address || "Kitwe, Zambia",
      role: "customer"
    };

    DB_USERS.push(newUser);

    // Create default bill for new customer
    DB_BILLS.push({
      id: `bill-${Date.now()}`,
      accountNo: accountNo,
      billingPeriod: "July 2026",
      amount: 150.00,
      consumptionKls: 10,
      dueDate: "2026-07-28",
      status: "unpaid",
      pdfUrl: `/api/bills/download/bill-new`
    });

    DB_AUDIT_LOGS.push({
      timestamp: new Date().toISOString(),
      action: "USER_REGISTER",
      details: `User registered: ${name} (Account: ${accountNo})`,
      user: email
    });

    // Simulated Access and Refresh Tokens
    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        accountNo: newUser.accountNo,
        meterNo: newUser.meterNo,
        address: newUser.address,
        role: newUser.role
      },
      tokens: {
        accessToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.accessTokenMock.${newUser.id}`,
        refreshToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refreshTokenMock.${newUser.id}`
      }
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = DB_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    DB_AUDIT_LOGS.push({
      timestamp: new Date().toISOString(),
      action: "USER_LOGIN",
      details: `User logged in: ${user.name} (${user.role})`,
      user: email
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        accountNo: user.accountNo,
        meterNo: user.meterNo,
        address: user.address,
        role: user.role
      },
      tokens: {
        accessToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.accessTokenMock.${user.id}`,
        refreshToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refreshTokenMock.${user.id}`
      }
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logout successful" });
  });

  app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }
    // Return mock renewed access token
    res.json({
      accessToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.accessTokenMockRenewed.${Date.now()}`
    });
  });

  // REST API: Customers Endpoints
  app.get("/api/customer/profile", (req, res) => {
    const accountNo = req.query.accountNo as string || "NW-889410";
    const user = DB_USERS.find(u => u.accountNo === accountNo);
    if (!user) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(user);
  });

  app.post("/api/customer/update", (req, res) => {
    const { accountNo, phone, address } = req.body;
    if (!accountNo) {
      return res.status(400).json({ error: "accountNo is required" });
    }
    const userIndex = DB_USERS.findIndex(u => u.accountNo === accountNo);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Customer profile not found" });
    }
    if (phone) DB_USERS[userIndex].phone = phone;
    if (address) DB_USERS[userIndex].address = address;

    DB_AUDIT_LOGS.push({
      timestamp: new Date().toISOString(),
      action: "PROFILE_UPDATE",
      details: `Updated profile details for customer account: ${accountNo}`,
      user: DB_USERS[userIndex].email
    });

    res.json({ message: "Profile updated successfully", user: DB_USERS[userIndex] });
  });

  app.get("/api/customer/balance", (req, res) => {
    const accountNo = req.query.accountNo as string || "NW-889410";
    const bills = DB_BILLS.filter(b => b.accountNo === accountNo && b.status !== "paid");
    const outstandingBill = bills.reduce((sum, b) => sum + b.amount, 0);
    
    const lastSuccessPayment = DB_PAYMENTS
      .filter(p => p.accountNo === accountNo && p.status === "success")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const currentBill = DB_BILLS.find(b => b.accountNo === accountNo && b.status === "unpaid");

    res.json({
      accountNo,
      outstandingBill,
      lastPayment: lastSuccessPayment ? lastSuccessPayment.amount : 0,
      lastPaymentDate: lastSuccessPayment ? lastSuccessPayment.timestamp : null,
      dueDate: currentBill ? currentBill.dueDate : "N/A"
    });
  });

  app.get("/api/customer/bills", (req, res) => {
    const accountNo = req.query.accountNo as string || "NW-889410";
    const bills = DB_BILLS.filter(b => b.accountNo === accountNo);
    res.json(bills);
  });

  app.get("/api/customer/payments", (req, res) => {
    const accountNo = req.query.accountNo as string || "NW-889410";
    const payments = DB_PAYMENTS.filter(p => p.accountNo === accountNo);
    res.json(payments);
  });

  app.get("/api/customer/prepaid-tokens", (req, res) => {
    const accountNo = req.query.accountNo as string || "NW-889410";
    const tokens = DB_PREPAID_TOKENS.filter(t => t.accountNo === accountNo);
    res.json(tokens);
  });

  app.get("/api/customer/consumption", (req, res) => {
    const accountNo = req.query.accountNo as string || "NW-889410";
    
    // Seeded-like generation for deterministic demo data
    const isDefault = accountNo === "NW-889410";
    
    // 14 Days Daily Data (in Liters)
    const daily = [
      { date: "2026-07-01", dayName: "Wed", liters: 240 },
      { date: "2026-07-02", dayName: "Thu", liters: 190 },
      { date: "2026-07-03", dayName: "Fri", liters: 280 },
      { date: "2026-07-04", dayName: "Sat", liters: 350 },
      { date: "2026-07-05", dayName: "Sun", liters: 310 },
      { date: "2026-07-06", dayName: "Mon", liters: 180 },
      { date: "2026-07-07", dayName: "Tue", liters: 220 },
      { date: "2026-07-08", dayName: "Wed", liters: 210 },
      { date: "2026-07-09", dayName: "Thu", liters: 205 },
      { date: "2026-07-10", dayName: "Fri", liters: 290 },
      { date: "2026-07-11", dayName: "Sat", liters: 410 },
      { date: "2026-07-12", dayName: "Sun", liters: 320 },
      { date: "2026-07-13", dayName: "Mon", liters: 195 }
    ];

    if (!isDefault) {
      daily.forEach((d, idx) => {
        const offset = (accountNo.charCodeAt(idx % accountNo.length) % 11) * 10 - 50;
        d.liters = Math.max(100, d.liters + offset);
      });
    }

    // 8 Weeks Data (in Liters)
    const weekly = [
      { week: "W21", label: "May 18-24", liters: 1420 },
      { week: "W22", label: "May 25-31", liters: 1510 },
      { week: "W23", label: "Jun 01-07", liters: 1680 },
      { week: "W24", label: "Jun 08-14", liters: 1350 },
      { week: "W25", label: "Jun 15-21", liters: 1590 },
      { week: "W26", label: "Jun 22-28", liters: 1720 },
      { week: "W27", label: "Jun 29-Jul 05", liters: 1610 },
      { week: "W28", label: "Jul 06-12", liters: 1850 }
    ];

    if (!isDefault) {
      weekly.forEach((w, idx) => {
        const offset = (accountNo.charCodeAt(idx % accountNo.length) % 9) * 50 - 200;
        w.liters = Math.max(800, w.liters + offset);
      });
    }

    // 12 Months Data (in Kiloliters)
    const monthly = [
      { month: "Aug", label: "Aug 2025", kiloliters: 22 },
      { month: "Sep", label: "Sep 2025", kiloliters: 24 },
      { month: "Oct", label: "Oct 2025", kiloliters: 26 },
      { month: "Nov", label: "Nov 2025", kiloliters: 29 },
      { month: "Dec", label: "Dec 2025", kiloliters: 31 },
      { month: "Jan", label: "Jan 2026", kiloliters: 30 },
      { month: "Feb", label: "Feb 2026", kiloliters: 25 },
      { month: "Mar", label: "Mar 2026", kiloliters: 23 },
      { month: "Apr", label: "Apr 2026", kiloliters: 27 },
      { month: "May", label: "May 2026", kiloliters: 25 },
      { month: "Jun", label: "Jun 2026", kiloliters: 28 },
      { month: "Jul", label: "Jul 2026", kiloliters: 10 }
    ];

    if (!isDefault) {
      monthly.forEach((m, idx) => {
        const offset = (accountNo.charCodeAt(idx % accountNo.length) % 7) - 3;
        m.kiloliters = Math.max(5, m.kiloliters + offset);
      });
    }

    const totalDays = daily.length;
    const sumDaily = daily.reduce((sum, d) => sum + d.liters, 0);
    const averageDaily = Math.round(sumDaily / totalDays);
    const peakUsage = Math.max(...daily.map(d => d.liters));
    
    const estimatedCostZMW = parseFloat(((sumDaily / 1000) * 15).toFixed(2));
    
    let insight = "Your consumption is stable and matching Riverside neighborhood averages.";
    let trend: "up" | "down" | "stable" = "stable";

    if (peakUsage > 400) {
      insight = "ALERT: High peak of 410L detected on Saturday Jul 11. This may indicate garden watering or a minor leakage.";
      trend = "up";
    } else if (averageDaily < 200) {
      insight = "EXCELLENT: Water usage is 25% below local averages. You are conserving water effectively!";
      trend = "down";
    }

    res.json({
      accountNo,
      daily,
      weekly,
      monthly,
      summary: {
        averageDaily,
        peakUsage,
        estimatedCostZMW,
        trend,
        insight
      }
    });
  });

  // REST API: Service Requests / Complaints Endpoints
  app.post("/api/issues/create", (req, res) => {
    const { accountNo, category, description, gpsLocation, imageUrl } = req.body;

    if (!accountNo || !category || !description) {
      return res.status(400).json({ error: "Missing required fields (accountNo, category, description)" });
    }

    const customer = DB_USERS.find(u => u.accountNo === accountNo) || DB_USERS[0];

    const newComplaint: Complaint = {
      id: `cmp-${Math.floor(100 + Math.random() * 900)}`,
      accountNo,
      customerName: customer.name,
      phone: customer.phone,
      category,
      description,
      imageUrl,
      gpsLocation: gpsLocation || {
        lat: -12.7932,
        lng: 28.2315,
        address: "Riverside, Kitwe"
      },
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    DB_COMPLAINTS.unshift(newComplaint);

    DB_AUDIT_LOGS.push({
      timestamp: new Date().toISOString(),
      action: "COMPLAINT_CREATE",
      details: `New complaint ${newComplaint.id} submitted for ${category} by ${customer.name}`,
      user: customer.email
    });

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint: newComplaint
    });
  });

  app.get("/api/issues/status", (req, res) => {
    const accountNo = req.query.accountNo as string;
    if (accountNo) {
      const filtered = DB_COMPLAINTS.filter(c => c.accountNo === accountNo);
      return res.json(filtered);
    }
    res.json(DB_COMPLAINTS);
  });

  app.get("/api/map/incidents", (req, res) => {
    // Convert active complaints (not resolved) into map incidents
    const complaintsIncidents = DB_COMPLAINTS.filter(c => c.status !== "resolved").map(c => {
      let type: "leak" | "outage" | "maintenance" = "leak";
      let title = "Water Leak / Burst Pipe";
      if (c.category === "no-supply") {
        type = "outage";
        title = "Water Outage / Low Pressure";
      } else if (c.category === "sewer") {
        type = "maintenance";
        title = "Sewer Blockage / Repair";
      } else if (c.category === "meter") {
        type = "maintenance";
        title = "Meter Fault / Inspection";
      }

      return {
        id: c.id,
        type,
        title,
        description: c.description,
        lat: c.gpsLocation.lat,
        lng: c.gpsLocation.lng,
        address: c.gpsLocation.address,
        status: c.status === "pending" ? "active" : c.status,
        reportedAt: c.createdAt,
        severity: (c.category === "no-supply" ? "high" : "medium") as "low" | "medium" | "high" | "critical"
      };
    });

    // Seeded maintenance zones and outages for visual depth
    const seededIncidents = [
      {
        id: "inc-maint-1",
        type: "maintenance" as const,
        title: "Planned Pump Station Overhaul",
        description: "Scheduled pump station upgrades and valve replacements at the Parklands water hub. Low pressure may be experienced.",
        lat: -12.8050,
        lng: 28.2150,
        address: "Parklands Water Hub, Kitwe",
        status: "planned" as const,
        reportedAt: "2026-07-12T10:00:00Z",
        severity: "medium" as const
      },
      {
        id: "inc-outage-1",
        type: "outage" as const,
        title: "Major Main Pipe Burst",
        description: "Emergency repairs ongoing for a 300mm burst transmission line on Jambo Drive. Temporary supply cut in Nkana East.",
        lat: -12.8140,
        lng: 28.2450,
        address: "Jambo Drive, Nkana East, Kitwe",
        status: "active" as const,
        reportedAt: "2026-07-13T08:00:00Z",
        severity: "critical" as const
      },
      {
        id: "inc-leak-1",
        type: "leak" as const,
        title: "Active Roadside Leak",
        description: "Substantial water flowing from chamber near the industrial rail line.",
        lat: -12.7885,
        lng: 28.2190,
        address: "Chibuluma Rd Industrial, Kitwe",
        status: "active" as const,
        reportedAt: "2026-07-13T06:30:00Z",
        severity: "high" as const
      },
      {
        id: "inc-maint-2",
        type: "maintenance" as const,
        title: "Sewer Line Flushing",
        description: "Preventative high-pressure sewer mains cleaning to prevent blockages in Central Chamber business district.",
        lat: -12.8220,
        lng: 28.2040,
        address: "Central Chambers, Kitwe CBD",
        status: "in-progress" as const,
        reportedAt: "2026-07-13T09:00:00Z",
        severity: "low" as const
      }
    ];

    res.json([...complaintsIncidents, ...seededIncidents]);
  });


  // REST API: Payments Integration (MTN/Airtel/Zamtel Mobile Money)
  app.post("/api/payment/initiate", (req, res) => {
    const { accountNo, amount, provider, phoneNo } = req.body;

    if (!accountNo || !amount || !provider || !phoneNo) {
      return res.status(400).json({ error: "Missing required payment fields" });
    }

    const refCode = `${provider.toUpperCase()}-TX-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      accountNo,
      amount: parseFloat(amount),
      provider,
      phoneNo,
      reference: refCode,
      timestamp: new Date().toISOString(),
      status: "pending"
    };

    DB_PAYMENTS.unshift(newPayment);

    // Auto-trigger simulated callback for high fidelity demo!
    // In a live integration, the telecom operator sends a POST to our webhook.
    setTimeout(() => {
      const payRecord = DB_PAYMENTS.find(p => p.reference === refCode);
      if (payRecord) {
        payRecord.status = "success";
        
        // Mark current unpaid bills as paid
        const unpaidBills = DB_BILLS.filter(b => b.accountNo === accountNo && b.status === "unpaid");
        let remainingPayment = payRecord.amount;
        
        for (const b of unpaidBills) {
          if (remainingPayment >= b.amount) {
            b.status = "paid";
            remainingPayment -= b.amount;
          }
        }

        // Push Payment Confirmation Notification
        DB_NOTIFICATIONS.unshift({
          id: `not-${Date.now()}`,
          title: "Payment Received",
          message: `Thank you! Payment of ZMW ${payRecord.amount.toFixed(2)} received via ${provider} Mobile Money. Reference: ${refCode}. Your account balance has been updated.`,
          type: "billing",
          targetAccount: accountNo,
          createdAt: new Date().toISOString()
        });

        DB_AUDIT_LOGS.push({
          timestamp: new Date().toISOString(),
          action: "PAYMENT_CALLBACK_SUCCESS",
          details: `Callback confirmed payment ${refCode} of ZMW ${payRecord.amount.toFixed(2)} for ${accountNo}`,
          user: "telecom-gateway"
        });
      }
    }, 4000); // 4 seconds delay to mimic real mobile wallet PIN prompt & processing!

    res.json({
      message: "Payment initiated successfully. Please enter your Mobile Money PIN on your handset when prompted.",
      reference: refCode,
      status: "pending"
    });
  });

  app.post("/api/payment/callback", (req, res) => {
    const { reference, status } = req.body;
    const payRecord = DB_PAYMENTS.find(p => p.reference === reference);
    if (!payRecord) {
      return res.status(404).json({ error: "Payment reference not found" });
    }
    
    payRecord.status = status || "success";
    res.json({ message: "Callback processed successfully", status: payRecord.status });
  });

  app.post("/api/prepaid/purchase", (req, res) => {
    const { accountNo, amount, provider, phoneNo } = req.body;

    if (!accountNo || !amount || !provider || !phoneNo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const refCode = `${provider.toUpperCase()}-TOK-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const amtFloat = parseFloat(amount);
    if (isNaN(amtFloat) || amtFloat <= 0) {
      return res.status(400).json({ error: "Invalid purchase amount" });
    }
    
    // Rate: 15 ZMW per KL (1000L)
    const litersCalculated = Math.round((amtFloat / 15.0) * 1000);

    const newTokenRecord: PrepaidToken = {
      id: `tok-${Date.now()}`,
      accountNo,
      amount: amtFloat,
      liters: litersCalculated,
      token: "GENERATING...",
      provider,
      phoneNo,
      reference: refCode,
      timestamp: new Date().toISOString(),
      status: "pending"
    };

    DB_PREPAID_TOKENS.unshift(newTokenRecord);

    const newPayment: Payment = {
      id: `pay-tok-${Date.now()}`,
      accountNo,
      amount: amtFloat,
      provider,
      phoneNo,
      reference: refCode,
      timestamp: new Date().toISOString(),
      status: "pending"
    };
    DB_PAYMENTS.unshift(newPayment);

    // Mock telecom gateway callback delay
    setTimeout(() => {
      const tokRecord = DB_PREPAID_TOKENS.find(t => t.reference === refCode);
      const payRecord = DB_PAYMENTS.find(p => p.reference === refCode);
      
      if (tokRecord) {
        const p1 = Math.floor(1000 + Math.random() * 9000);
        const p2 = Math.floor(1000 + Math.random() * 9000);
        const p3 = Math.floor(1000 + Math.random() * 9000);
        const p4 = Math.floor(1000 + Math.random() * 9000);
        const p5 = Math.floor(1000 + Math.random() * 9000);
        const tokenString = `${p1}-${p2}-${p3}-${p4}-${p5}`;

        tokRecord.token = tokenString;
        tokRecord.status = "success";
        
        if (payRecord) {
          payRecord.status = "success";
        }

        // Push instant notification containing token
        DB_NOTIFICATIONS.unshift({
          id: `not-${Date.now()}`,
          title: "Prepaid Water Token Active",
          message: `Success! Token: ${tokenString} (${litersCalculated} L of water bought for ZMW ${amtFloat.toFixed(2)}). Input this token on your prepaid keypad.`,
          type: "billing",
          targetAccount: accountNo,
          createdAt: new Date().toISOString()
        });

        DB_AUDIT_LOGS.push({
          timestamp: new Date().toISOString(),
          action: "PREPAID_TOKEN_GENERATE_SUCCESS",
          details: `Prepaid token ${tokenString} generated successfully for ${accountNo} (${litersCalculated} L)`,
          user: "telecom-gateway"
        });
      }
    }, 4000);

    res.json({
      message: "Prepaid purchase initiated. Enter your PIN on your mobile phone to complete transaction.",
      reference: refCode,
      status: "pending"
    });
  });

  // REST API: Admin Specific Endpoints
  app.get("/api/admin/dashboard", (req, res) => {
    const totalCustomers = DB_USERS.filter(u => u.role === "customer").length;
    const totalComplaints = DB_COMPLAINTS.length;
    const pendingComplaints = DB_COMPLAINTS.filter(c => c.status === "pending").length;
    const assignedComplaints = DB_COMPLAINTS.filter(c => c.status === "assigned").length;
    const resolvedComplaints = DB_COMPLAINTS.filter(c => c.status === "resolved").length;
    
    const successfulPayments = DB_PAYMENTS.filter(p => p.status === "success");
    const revenueSum = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      stats: {
        totalCustomers,
        totalComplaints,
        pendingComplaints,
        assignedComplaints,
        resolvedComplaints,
        revenueZMW: revenueSum
      },
      complaints: DB_COMPLAINTS,
      payments: DB_PAYMENTS,
      users: DB_USERS.filter(u => u.role === "customer"),
      notifications: DB_NOTIFICATIONS,
      auditLogs: DB_AUDIT_LOGS
    });
  });

  // Admin Assign Technician
  app.post("/api/admin/issues/assign", (req, res) => {
    const { complaintId, technicianName } = req.body;
    const issue = DB_COMPLAINTS.find(c => c.id === complaintId);
    if (!issue) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    issue.status = "assigned";
    issue.assignedTechnician = technicianName;
    issue.updatedAt = new Date().toISOString();

    // Trigger notification to customer
    DB_NOTIFICATIONS.unshift({
      id: `not-${Date.now()}`,
      title: "Technician Assigned",
      message: `Your service request ${complaintId} (${issue.category}) has been assigned to technician ${technicianName}. They will contact you shortly.`,
      type: "general",
      targetAccount: issue.accountNo,
      createdAt: new Date().toISOString()
    });

    DB_AUDIT_LOGS.push({
      timestamp: new Date().toISOString(),
      action: "ADMIN_ASSIGN_TECH",
      details: `Assigned technician ${technicianName} to complaint ${complaintId}`,
      user: "admin"
    });

    res.json({ message: "Technician assigned successfully", complaint: issue });
  });

  // Admin Update Complaint Status
  app.post("/api/admin/issues/status", (req, res) => {
    const { complaintId, status } = req.body; // pending, assigned, in-progress, resolved
    const issue = DB_COMPLAINTS.find(c => c.id === complaintId);
    if (!issue) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    issue.status = status;
    issue.updatedAt = new Date().toISOString();

    // Trigger notification to customer
    let title = "Complaint Update";
    let message = `The status of your complaint ${complaintId} has been updated to ${status}.`;
    if (status === "resolved") {
      title = "Complaint Resolved";
      message = `Nkana Water technicians have resolved your complaint ${complaintId} (${issue.category}). Thank you for reaching out to us.`;
    }

    DB_NOTIFICATIONS.unshift({
      id: `not-${Date.now()}`,
      title,
      message,
      type: status === "resolved" ? "general" : "general",
      targetAccount: issue.accountNo,
      createdAt: new Date().toISOString()
    });

    DB_AUDIT_LOGS.push({
      timestamp: new Date().toISOString(),
      action: "ADMIN_UPDATE_ISSUE_STATUS",
      details: `Updated complaint ${complaintId} status to ${status}`,
      user: "admin"
    });

    res.json({ message: "Complaint status updated successfully", complaint: issue });
  });

  // Admin Broadcast Notification
  app.post("/api/admin/notifications/broadcast", (req, res) => {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "Missing notification fields" });
    }

    const newNotif: SystemNotification = {
      id: `not-${Date.now()}`,
      title,
      message,
      type: type || "general",
      createdAt: new Date().toISOString()
    };

    DB_NOTIFICATIONS.unshift(newNotif);

    DB_AUDIT_LOGS.push({
      timestamp: new Date().toISOString(),
      action: "ADMIN_BROADCAST_NOTIFICATION",
      details: `Broadcast alert: "${title}"`,
      user: "admin"
    });

    res.status(201).json({ message: "Broadcast sent successfully", notification: newNotif });
  });

  // Retrieve Notifications for active user
  app.get("/api/notifications", (req, res) => {
    const accountNo = req.query.accountNo as string;
    const filtered = DB_NOTIFICATIONS.filter(n => !n.targetAccount || n.targetAccount === accountNo);
    res.json(filtered);
  });

  // Mock PDF Generation / download route
  app.get("/api/bills/download/:billId", (req, res) => {
    const { billId } = req.params;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=NKANA_WATER_BILL_${billId}.pdf`);
    // Send a simple textual representation of a PDF to satisfy file download triggers!
    res.send(`%PDF-1.4
%NKANA WATER SUPPLY AND SANITATION COMPANY
%BILL INVOICE FOR: ${billId}
1 0 obj < < /Type /Catalog /Pages 2 0 R > > endobj
2 0 obj < < /Type /Pages /Kids [3 0 R] /Count 1 > > endobj
3 0 obj < < /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R > > endobj
4 0 obj < < /Length 120 > > stream
BT /F1 12 Tf 50 700 Td (NKANA WATER & SANITATION BILL INVOICE) Tj
/F1 10 Tf 50 670 Td (Account: NW-889410  Bill Ref: ${billId}) Tj
/F1 10 Tf 50 650 Td (Current Period Amount: ZMW 420.50) Tj
/F1 10 Tf 50 630 Td (DueDate: 2026-07-20) Tj
/F1 10 Tf 50 600 Td (Please pay using MTN, Airtel, or Zamtel Mobile Money Customer App) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000015 00000 n
0000000074 00000 n
0000000139 00000 n
0000000244 00000 n
trailer < < /Size 5 /Root 1 0 R > >
startxref
412
%%EOF`);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Water Customer App API running on port ${PORT}`);
  });
}

const PORT = 3000;
startServer();
