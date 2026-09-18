import React, { useState, useEffect } from "react";
import { 
  User, 
  Bill, 
  Payment, 
  Complaint, 
  SystemNotification 
} from "../types";
import { 
  Smartphone, 
  Wifi, 
  Battery, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  User as UserIcon, 
  CreditCard, 
  AlertTriangle, 
  History, 
  FileText, 
  Download, 
  CheckCircle, 
  Bell, 
  ChevronRight, 
  MapPin, 
  Camera, 
  Plus, 
  Send, 
  Lock, 
  DollarSign,
  Droplet,
  SmartphoneNfc,
  Loader2,
  PhoneCall,
  Copy,
  Check,
  Ticket,
  X,
  Settings,
  Accessibility,
  Sliders,
  Trash2,
  Link2,
  Users,
  Map
} from "lucide-react";
import ServiceStatusMap from "./ServiceStatusMap";


interface MobileSimulatorProps {
  activeAccountNo: string;
  setActiveAccountNo: (acc: string) => void;
  triggerRefreshSignal: number;
  setTriggerRefreshSignal: React.Dispatch<React.SetStateAction<number>>;
}

export default function MobileSimulator({ 
  activeAccountNo, 
  setActiveAccountNo,
  triggerRefreshSignal,
  setTriggerRefreshSignal 
}: MobileSimulatorProps) {
  // Mobile UI States
  const [screen, setScreen] = useState<"welcome" | "login" | "register" | "forgot" | "dashboard" | "billing" | "pay" | "report" | "complaints" | "notifications" | "profile" | "prepaid" | "settings">("login");
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem("nkana_high_contrast") === "true";
    } catch {
      return false;
    }
  });
  const [isLargeText, setIsLargeText] = useState<boolean>(() => {
    try {
      return localStorage.getItem("nkana_large_text") === "true";
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Active Logged In Session
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Profile editing state
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");

  // Multi-Account Linking & Toggling State
  const [linkedAccounts, setLinkedAccounts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("nkana_linked_accounts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return ["NW-889410"];
  });

  const [accountLabels, setAccountLabels] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("nkana_account_labels");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      "NW-889410": "Primary Residence (Vanessa)"
    };
  });

  const [newLinkAccountNo, setNewLinkAccountNo] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");
  const [balance, setBalance] = useState<{ outstandingBill: number; lastPayment: number; dueDate: string } | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Prepaid token states
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

  const [prepaidTokens, setPrepaidTokens] = useState<PrepaidToken[]>([]);
  const [prepaidAmount, setPrepaidAmount] = useState("100");
  const [prepaidPhone, setPrepaidPhone] = useState("+260 971 234567");
  const [prepaidProvider, setPrepaidProvider] = useState<"MTN" | "Airtel" | "Zamtel">("MTN");
  const [prepaidSuccessOverlay, setPrepaidSuccessOverlay] = useState(false);
  const [latestBoughtToken, setLatestBoughtToken] = useState<PrepaidToken | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Water Consumption Analytics States
  interface ConsumptionSummary {
    averageDaily: number;
    peakUsage: number;
    estimatedCostZMW: number;
    trend: "up" | "down" | "stable";
    insight: string;
  }
  interface ConsumptionPayload {
    accountNo: string;
    daily: Array<{ date: string; dayName: string; liters: number }>;
    weekly: Array<{ week: string; label: string; liters: number }>;
    monthly: Array<{ month: string; label: string; kiloliters: number }>;
    summary: ConsumptionSummary;
  }
  const [consumptionData, setConsumptionData] = useState<ConsumptionPayload | null>(null);
  const [analyticsTab, setAnalyticsTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [waterGoal, setWaterGoal] = useState<number>(250); // Daily Liters Target
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState("nkanduvanessa44@gmail.com");
  const [loginPassword, setLoginPassword] = useState("password123");
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", address: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payProvider, setPayProvider] = useState<"MTN" | "Airtel" | "Zamtel">("MTN");
  const [payPhone, setPayPhone] = useState("+260 971 234567");
  const [paymentPendingOverlay, setPaymentPendingOverlay] = useState(false);
  const [paymentSuccessOverlay, setPaymentSuccessOverlay] = useState(false);
  
  // Complaint state
  const [complaintCategory, setComplaintCategory] = useState<Complaint["category"]>("leak");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [selectedLeakPhoto, setSelectedLeakPhoto] = useState<string>("");
  const [gpsLocation, setGpsLocation] = useState({ lat: -12.7932, lng: 28.2315, address: "Riverside, Kitwe" });

  const leakPhotoOptions = [
    { name: "Meter Leak", url: "https://images.unsplash.com/photo-1585703901170-cc31df956897?w=500&auto=format&fit=crop&q=60" },
    { name: "Burst Main Pipe", url: "https://images.unsplash.com/photo-1542060748-10c28b629f6f?w=500&auto=format&fit=crop&q=60" },
    { name: "Sewer Overflow", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60" }
  ];

  // Push Notification States
  const [activePushNotification, setActivePushNotification] = useState<SystemNotification | null>(null);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const seenNotificationIdsRef = React.useRef<Set<string>>(new Set());

  // Helper to process loaded/polled notifications and trigger banner for any genuinely new ones
  const processIncomingNotifications = (notifList: SystemNotification[]) => {
    if (!Array.isArray(notifList)) return;
    
    // If we have not loaded any seen IDs yet, initialize the set with the current historic notifications
    if (seenNotificationIdsRef.current.size === 0) {
      notifList.forEach(n => seenNotificationIdsRef.current.add(n.id));
      return;
    }

    // Otherwise, check for any newly-added notifications
    const newNotifs = notifList.filter(n => !seenNotificationIdsRef.current.has(n.id));
    if (newNotifs.length > 0) {
      // Mark them as seen immediately so they don't double trigger
      newNotifs.forEach(n => seenNotificationIdsRef.current.add(n.id));

      // Display the latest new notification
      const newest = newNotifs[0]; // unshifted list has latest at index 0
      setActivePushNotification(newest);
      setShowPushBanner(true);

      // Auto-hide after 7 seconds
      const timer = setTimeout(() => {
        setShowPushBanner(false);
      }, 7000);
    }
  };

  // Poll for customer data (which updates complaints and notifications in real-time)
  useEffect(() => {
    if (!currentUser) {
      seenNotificationIdsRef.current.clear();
      return;
    }

    // Poll every 3 seconds
    const timer = setInterval(() => {
      fetchCustomerData(currentUser.accountNo);
    }, 3000);

    return () => clearInterval(timer);
  }, [currentUser?.accountNo]);

  // Load user data when account number is locked or updated via developer dashboard
  useEffect(() => {
    if (activeAccountNo) {
      fetchCustomerData(activeAccountNo);
    }
  }, [activeAccountNo, triggerRefreshSignal]);

  // Keep local fields in sync with the logged-in user
  useEffect(() => {
    if (currentUser) {
      setProfilePhone(currentUser.phone || "");
      setProfileAddress(currentUser.address || "");
    }
  }, [currentUser?.accountNo, currentUser?.phone, currentUser?.address]);

  // Keep currently active account present in the linkedAccounts pool
  useEffect(() => {
    if (activeAccountNo && !linkedAccounts.includes(activeAccountNo)) {
      const updated = [...linkedAccounts, activeAccountNo];
      setLinkedAccounts(updated);
      try {
        localStorage.setItem("nkana_linked_accounts", JSON.stringify(updated));
      } catch (e) {}
    }
  }, [activeAccountNo, linkedAccounts]);

  const fetchCustomerData = async (accNo: string) => {
    const safeFetch = async (url: string, fallback: any) => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          return fallback;
        }
        return await res.json();
      } catch (err) {
        return fallback;
      }
    };

    try {
      const [userRes, balRes, billsRes, payRes, complaintsRes, notifRes, consumptionRes, prepaidRes] = await Promise.all([
        safeFetch(`/api/customer/profile?accountNo=${accNo}`, {
          id: "user-1",
          email: "nkanduvanessa44@gmail.com",
          name: "Vanessa Nkandu",
          phone: "+260 971 234567",
          accountNo: accNo || "NW-889410",
          meterNo: "MTR-7729-N",
          address: "Plot 42, Riverside, Kitwe",
          role: "customer"
        }),
        safeFetch(`/api/customer/balance?accountNo=${accNo}`, {
          accountNo: accNo || "NW-889410",
          outstandingBill: 420.50,
          lastPayment: 350.00,
          lastPaymentDate: "2026-06-15T14:30:00.000Z",
          dueDate: "2026-07-20"
        }),
        safeFetch(`/api/customer/bills?accountNo=${accNo}`, [
          {
            id: "bill-102",
            accountNo: accNo || "NW-889410",
            billingPeriod: "June 2026",
            amount: 420.50,
            consumptionKls: 28,
            dueDate: "2026-07-20",
            status: "unpaid",
            pdfUrl: "/api/bills/download/bill-102"
          },
          {
            id: "bill-101",
            accountNo: accNo || "NW-889410",
            billingPeriod: "May 2026",
            amount: 350.00,
            consumptionKls: 23.3,
            dueDate: "2026-06-20",
            status: "paid",
            pdfUrl: "/api/bills/download/bill-101"
          }
        ]),
        safeFetch(`/api/customer/payments?accountNo=${accNo}`, [
          {
            id: "pay-1",
            accountNo: accNo || "NW-889410",
            amount: 350.00,
            provider: "MTN",
            phoneNo: "+260 971 234567",
            reference: "MTN-TX-77319401",
            timestamp: "2026-06-15T14:30:00.000Z",
            status: "success"
          }
        ]),
        safeFetch(`/api/issues/status?accountNo=${accNo}`, []),
        safeFetch(`/api/notifications?accountNo=${accNo}`, [
          {
            id: "not-1",
            title: "Scheduled Maintenance - Riverside",
            message: "Nkana Water will conduct scheduled main pipe repairs in Riverside area on Friday, July 17 from 08:00 to 14:00. Water supply may be intermittent.",
            type: "maintenance",
            targetAccount: accNo || "NW-889410",
            createdAt: "2026-07-12T10:00:00.000Z"
          }
        ]),
        safeFetch(`/api/customer/consumption?accountNo=${accNo}`, {
          accountNo: accNo || "NW-889410",
          daily: [
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
          ],
          weekly: [
            { week: "W21", label: "May 18-24", liters: 1420 },
            { week: "W22", label: "May 25-31", liters: 1510 },
            { week: "W23", label: "Jun 01-07", liters: 1680 },
            { week: "W24", label: "Jun 08-14", liters: 1350 },
            { week: "W25", label: "Jun 15-21", liters: 1590 },
            { week: "W26", label: "Jun 22-28", liters: 1720 },
            { week: "W27", label: "Jun 29-Jul 05", liters: 1610 },
            { week: "W28", label: "Jul 06-12", liters: 1850 }
          ],
          monthly: [
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
          ],
          summary: {
            averageDaily: 250,
            peakUsage: 410,
            estimatedCostZMW: 420.50,
            trend: "stable",
            insight: "Your consumption is stable and matching Riverside neighborhood averages."
          }
        }),
        safeFetch(`/api/customer/prepaid-tokens?accountNo=${accNo}`, [])
      ]);

      if (userRes && !userRes.error) {
        setCurrentUser(userRes);
        setBalance(balRes);
        setBills(billsRes);
        setPayments(payRes);
        setComplaints(complaintsRes);
        setNotifications(notifRes);
        setUnreadNotifCount(notifRes.length);
        processIncomingNotifications(notifRes);
        if (consumptionRes && !consumptionRes.error) {
          setConsumptionData(consumptionRes);
        }
        if (prepaidRes && !prepaidRes.error) {
          setPrepaidTokens(prepaidRes);
        }
        if (screen === "login" || screen === "welcome") {
          setScreen("dashboard");
        }
      }
    } catch (e) {
      console.error("Error retrieving user telemetry in mobile screen:", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      }).then(r => r.json());

      if (res.user) {
        setActiveAccountNo(res.user.accountNo);
        await fetchCustomerData(res.user.accountNo);
        setScreen("dashboard");
      } else {
        alert(res.error || "Authentication failed. Try again.");
      }
    } catch (err) {
      alert("Error contacting local REST endpoint.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
          name: registerForm.name,
          phone: registerForm.phone,
          address: registerForm.address
        })
      }).then(r => r.json());

      if (res.user) {
        alert("Registration complete! Utility account opened: " + res.user.accountNo);
        setActiveAccountNo(res.user.accountNo);
        await fetchCustomerData(res.user.accountNo);
        setScreen("dashboard");
      } else {
        alert(res.error || "Could not register customer.");
      }
    } catch (err) {
      alert("Network exception.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`OTP simulation token dispatched to profile contact linked with: ${forgotEmail}. Please verify code '2609' to reset.`);
      setScreen("login");
    }, 1200);
  };

  const handleInitiatePayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      alert("Please specify a valid payment amount.");
      return;
    }
    setPaymentPendingOverlay(true);
    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNo: currentUser?.accountNo,
          amount: parseFloat(payAmount),
          provider: payProvider,
          phoneNo: payPhone
        })
      }).then(r => r.json());

      // Mock mobile wallet pin verification overlay
      setTimeout(() => {
        setPaymentPendingOverlay(false);
        setPaymentSuccessOverlay(true);
        setTriggerRefreshSignal(prev => prev + 1);
        setPayAmount("");
      }, 4000);
    } catch (e) {
      setPaymentPendingOverlay(false);
      alert("Payment gateway timeout.");
    }
  };

  const handleInitiatePrepaidPurchase = async () => {
    if (!prepaidAmount || parseFloat(prepaidAmount) <= 0) {
      alert("Please specify a valid prepaid purchase amount.");
      return;
    }
    setPaymentPendingOverlay(true);
    try {
      const res = await fetch("/api/prepaid/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNo: currentUser?.accountNo,
          amount: parseFloat(prepaidAmount),
          provider: prepaidProvider,
          phoneNo: prepaidPhone
        })
      }).then(r => r.json());

      // Mock mobile wallet pin verification overlay
      setTimeout(async () => {
        setPaymentPendingOverlay(false);
        if (currentUser) {
          // Refresh customer data
          setTriggerRefreshSignal(prev => prev + 1);
          try {
            const resTokens = await fetch(`/api/customer/prepaid-tokens?accountNo=${currentUser.accountNo}`).then(r => r.json());
            if (Array.isArray(resTokens) && resTokens.length > 0) {
              setLatestBoughtToken(resTokens[0]);
            }
          } catch (tokErr) {
            console.error("Failed to query newly bought token", tokErr);
          }
        }
        setPrepaidSuccessOverlay(true);
      }, 4000);
    } catch (e) {
      setPaymentPendingOverlay(false);
      alert("Prepaid gateway timeout.");
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDesc) {
      alert("Please provide details for the leak report.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/issues/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNo: currentUser?.accountNo,
          category: complaintCategory,
          description: complaintDesc,
          imageUrl: selectedLeakPhoto || "https://images.unsplash.com/photo-1585703901170-cc31df956897?w=500",
          gpsLocation
        })
      }).then(r => r.json());

      if (res.complaint) {
        alert("Complaint filed successfully. Ticket ID: " + res.complaint.id);
        setComplaintDesc("");
        setSelectedLeakPhoto("");
        setTriggerRefreshSignal(prev => prev + 1);
        setScreen("complaints");
      }
    } catch (e) {
      alert("Error reporting complaint.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mock downloading PDF
  const handleDownloadPDF = (billId: string) => {
    const link = document.createElement("a");
    link.href = `/api/bills/download/${billId}`;
    link.download = `NkanaWater_Bill_${billId}.pdf`;
    link.click();
  };

  const simulateGpsCapture = () => {
    const sectors = [
      { lat: -12.7912, lng: 28.2305, address: "Chimwemwe Lane, Kitwe" },
      { lat: -12.7950, lng: 28.2250, address: "Parklands West, Kitwe" },
      { lat: -12.8020, lng: 28.2410, address: "Nkana East Main Road, Kitwe" },
      { lat: -12.7885, lng: 28.2190, address: "Chibuluma Rd Industrial, Kitwe" }
    ];
    const picked = sectors[Math.floor(Math.random() * sectors.length)];
    setGpsLocation(picked);
    alert(`GPS Locked: Latitude: ${picked.lat}, Longitude: ${picked.lng} (${picked.address})`);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/customer/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNo: currentUser.accountNo,
          phone: profilePhone,
          address: profileAddress
        })
      }).then(r => r.json());

      if (res.user) {
        alert("Success! Profile details updated on simulated server.");
        setTriggerRefreshSignal(prev => prev + 1);
        setScreen("dashboard");
      } else {
        alert(res.error || "Failed to update profile.");
      }
    } catch (err) {
      alert("Error contacting update profile API endpoint.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError("");
    setLinkSuccess("");
    const formattedAcc = newLinkAccountNo.trim().toUpperCase();
    if (!formattedAcc) {
      setLinkError("Account ID cannot be blank.");
      return;
    }

    if (linkedAccounts.includes(formattedAcc)) {
      setLinkError("This utility account is already linked to your profile.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/customer/profile?accountNo=${formattedAcc}`);
      if (res.ok) {
        const prof = await res.json();
        const customLabel = newLinkLabel.trim() || `${prof.name}'s Account`;
        
        const updatedAccounts = [...linkedAccounts, formattedAcc];
        const updatedLabels = { ...accountLabels, [formattedAcc]: customLabel };
        
        setLinkedAccounts(updatedAccounts);
        setAccountLabels(updatedLabels);
        
        try {
          localStorage.setItem("nkana_linked_accounts", JSON.stringify(updatedAccounts));
          localStorage.setItem("nkana_account_labels", JSON.stringify(updatedLabels));
        } catch (e) {}

        setLinkSuccess(`Linked ${formattedAcc} successfully!`);
        setNewLinkAccountNo("");
        setNewLinkLabel("");
      } else {
        const customLabel = newLinkLabel.trim() || "Simulated Account";
        const updatedAccounts = [...linkedAccounts, formattedAcc];
        const updatedLabels = { ...accountLabels, [formattedAcc]: customLabel };
        
        setLinkedAccounts(updatedAccounts);
        setAccountLabels(updatedLabels);
        
        try {
          localStorage.setItem("nkana_linked_accounts", JSON.stringify(updatedAccounts));
          localStorage.setItem("nkana_account_labels", JSON.stringify(updatedLabels));
        } catch (e) {}

        setLinkSuccess(`Linked simulated account ${formattedAcc} successfully!`);
        setNewLinkAccountNo("");
        setNewLinkLabel("");
      }
    } catch (err) {
      setLinkError("Could not connect to Nkana Water directory.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkAccount = (accNo: string) => {
    if (accNo === activeAccountNo) {
      alert("You cannot unlink your currently active utility account.");
      return;
    }
    if (confirm(`Are you sure you want to unlink ${accNo} (${accountLabels[accNo] || 'Unlabeled'})?`)) {
      const updated = linkedAccounts.filter(a => a !== accNo);
      const updatedLabels = { ...accountLabels };
      delete updatedLabels[accNo];

      setLinkedAccounts(updated);
      setAccountLabels(updatedLabels);

      try {
        localStorage.setItem("nkana_linked_accounts", JSON.stringify(updated));
        localStorage.setItem("nkana_account_labels", JSON.stringify(updatedLabels));
      } catch (e) {}
    }
  };

  const handleSwitchAccount = async (accNo: string) => {
    setActiveAccountNo(accNo);
    await fetchCustomerData(accNo);
    alert(`Active account switched to: ${accNo} (${accountLabels[accNo] || "Unlabeled"})`);
  };

  const handleReportAtLocation = (lat: number, lng: number, address: string) => {
    setGpsLocation({ lat, lng, address });
    setComplaintCategory("leak");
    setScreen("report");
    alert(`GPS coordinate locked on reporting page!\nLocation: ${address}\nLatitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}`);
  };


  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "assigned": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "in-progress": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "resolved": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  return (
    <div className="flex justify-center items-center py-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 relative shadow-inner overflow-hidden font-sans">
      
      {/* Decorative Outer Device Frame Wrapper */}
      <div className="w-[380px] h-[780px] bg-slate-950 border-[10px] border-white/10 rounded-[48px] shadow-2xl relative flex flex-col overflow-hidden ring-4 ring-white/5">
        
        {/* Dynamic Ear Speaker & Camera Notch */}
        <div className="absolute top-0 inset-x-0 h-7 bg-black z-50 flex justify-center items-center">
          <div className="w-24 h-4 bg-black rounded-b-xl flex items-center justify-around px-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
            <div className="w-10 h-1 bg-slate-850 rounded-full"></div>
            <div className="w-2 h-2 rounded-full bg-blue-900/50"></div>
          </div>
        </div>

        {/* SIMULATED PUSH NOTIFICATION BANNER */}
        {showPushBanner && activePushNotification && (
          <div 
            onClick={() => {
              setScreen("notifications");
              setShowPushBanner(false);
            }}
            className="absolute top-12 left-3 right-3 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-2xl shadow-black/60 z-55 cursor-pointer animate-in slide-in-from-top-12 duration-300 hover:bg-slate-800/95 transition-all select-none"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white overflow-hidden flex items-center justify-center shrink-0 shadow border border-slate-700">
                <img src="/src/assets/images/nkana_water_logo_1783960634720.jpg" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-cyan-400 tracking-wider font-display">NKANA WATER SYSTEM</span>
                  <span className="text-[8px] text-slate-400 font-medium font-mono">now</span>
                </div>
                <h5 className="text-[11px] font-extrabold text-white mt-0.5 font-display truncate">
                  {activePushNotification.title}
                </h5>
                <p className="text-[9.5px] text-slate-300 leading-relaxed mt-0.5 line-clamp-2 font-medium">
                  {activePushNotification.message}
                </p>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPushBanner(false);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="h-11 bg-blue-900 text-white text-xs px-6 flex justify-between items-end pb-1.5 font-medium select-none z-45 shrink-0">
          <span>09:41</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[10px]">LTE</span>
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* PHONE CANVAS SCREEN */}
        <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col relative text-slate-800">
          
          {/* WELCOME / REGISTER SCREEN */}
          {screen === "welcome" && (
            <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-blue-900 to-blue-950 text-white text-center">
              <div className="my-auto flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden flex items-center justify-center mb-6 shadow-xl border border-white/10 shrink-0">
                  <img src="/src/assets/images/nkana_water_logo_1783960634720.jpg" alt="Nkana Water Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h1 className="text-2xl font-bold font-display tracking-tight text-white mb-2">NKANA WATER</h1>
                <p className="text-sm text-sky-200/80 max-w-xs leading-relaxed">
                  Smart Customer Application for bill access, MoMo payment, and instant hazard reports.
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-auto">
                <button 
                  onClick={() => setScreen("login")}
                  className="w-full py-3 bg-white text-blue-950 rounded-xl font-semibold text-sm shadow hover:bg-sky-50 active:scale-98 transition-all"
                >
                  Sign In to Account
                </button>
                <button 
                  onClick={() => setScreen("register")}
                  className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl font-medium text-sm active:scale-98 transition-all"
                >
                  Create New Account
                </button>
                <p className="text-[10px] text-sky-300/60 mt-2">Serving Kitwe, Kalulushi and Lufwanyama</p>
              </div>
            </div>
          )}

          {/* LOGIN SCREEN */}
          {screen === "login" && (
            <div className="flex-1 p-6 flex flex-col justify-between bg-white">
              <div className="my-auto">
                <div className="flex items-center gap-2.5 mb-8">
                  <div className="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                    <img src="/src/assets/images/nkana_water_logo_1783960634720.jpg" alt="Nkana Water Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-display">Nkana Water</h2>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Smart Customer</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h3>
                <p className="text-xs text-slate-500 mb-6">Enter your details to manage your water connections</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. name@domain.com"
                      className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">Password</label>
                      <button 
                        type="button"
                        onClick={() => setScreen("forgot")}
                        className="text-[11px] text-blue-600 font-medium hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-4 pr-10 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 transition-colors"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                  </button>
                </form>

                {/* Quick Dev Switchers */}
                <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">Simulate Customer Logs:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setLoginEmail("nkanduvanessa44@gmail.com"); setLoginPassword("password123"); }}
                      className="text-[10px] bg-white border border-slate-200 py-1.5 px-2 rounded-lg text-slate-700 font-medium hover:bg-slate-100"
                    >
                      Vanessa (Client)
                    </button>
                    <button 
                      onClick={() => setScreen("register")}
                      className="text-[10px] bg-slate-200 border border-slate-300 py-1.5 px-2 rounded-lg text-slate-800 font-medium hover:bg-slate-300"
                    >
                      Create Demo Acc
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-center text-[11px] text-slate-500 mt-6">
                Don't have an account?{" "}
                <button onClick={() => setScreen("register")} className="text-blue-600 font-semibold hover:underline">Register</button>
              </p>
            </div>
          )}

          {/* REGISTER SCREEN */}
          {screen === "register" && (
            <div className="flex-1 p-6 bg-white overflow-y-auto">
              <button onClick={() => setScreen("login")} className="mb-6 flex items-center gap-1.5 text-xs text-slate-600 font-medium hover:text-slate-900">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>

              <h3 className="text-xl font-bold text-slate-900 mb-1">Create Account</h3>
              <p className="text-xs text-slate-500 mb-6">Open a digital water meter account with Nkana Water.</p>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    placeholder="e.g. Mwansa Mwape"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Mobile Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="+260 971 XXXXXX"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Home Address</label>
                  <input 
                    type="text" 
                    required
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                    placeholder="Plot Number, Area, Kitwe"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Create Password</label>
                  <input 
                    type="password" 
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-4 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-blue-700 active:scale-98 transition-all flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register & Sign Up"}
                </button>
              </form>
            </div>
          )}

          {/* FORGOT PASSWORD SCREEN */}
          {screen === "forgot" && (
            <div className="flex-1 p-6 bg-white flex flex-col justify-between">
              <div>
                <button onClick={() => setScreen("login")} className="mb-8 flex items-center gap-1.5 text-xs text-slate-600 font-medium hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>

                <h3 className="text-xl font-bold text-slate-900 mb-1">Reset Password</h3>
                <p className="text-xs text-slate-500 mb-6">Enter your registered email address to receive an authentication OTP code.</p>

                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. name@domain.com"
                      className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-blue-700 active:scale-98 transition-all flex items-center justify-center"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification Token"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* AUTHENTICATED SYSTEM SCREENS */}
          {screen !== "welcome" && screen !== "login" && screen !== "register" && screen !== "forgot" && (
            <div className={`flex-1 flex flex-col min-h-0 ${isHighContrast ? "bg-black text-white" : "bg-slate-50 text-slate-800"}`}>
              
              {/* Internal Screen Appbar Header */}
              <div className={`px-5 py-3 flex items-center justify-between sticky top-0 z-30 select-none ${
                isHighContrast 
                  ? "bg-black text-white border-b-4 border-white" 
                  : "bg-blue-600 text-white shadow-md"
              }`}>
                <div className="flex items-center gap-3">
                  {screen !== "dashboard" ? (
                    <button onClick={() => setScreen("dashboard")} className={`p-1 rounded-lg ${isHighContrast ? "hover:bg-white/20 border border-white" : "hover:bg-white/10"}`}>
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm uppercase ${
                      isHighContrast 
                        ? "bg-black border-2 border-white text-white" 
                        : "bg-white/20 border border-white/10 text-sky-200"
                    }`}>
                      {currentUser?.name.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide">
                      {screen === "dashboard" ? `Hi, ${currentUser?.name.split(" ")[0]}` : ""}
                      {screen === "billing" ? "Invoices & Ledger" : ""}
                      {screen === "pay" ? "Mobile Money Pay" : ""}
                      {screen === "report" ? "Report Service Request" : ""}
                      {screen === "complaints" ? "Track Complaint Tickets" : ""}
                      {screen === "profile" ? "Manage Profile" : ""}
                      {screen === "notifications" ? "Emergency Bulletins" : ""}
                      {screen === "prepaid" ? "Prepaid Water Hub" : ""}
                      {screen === "settings" ? "System Settings" : ""}
                      {screen === "status-map" ? "Service Status Map" : ""}
                    </h4>
                    <p className={`text-[9px] ${isHighContrast ? "text-yellow-400 font-bold" : "text-sky-100"}`}>Account: {currentUser?.accountNo}</p>
                  </div>
                </div>
 
                {/* Notifications & Menu quick launch */}
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setScreen("settings")}
                    className={`p-1.5 rounded-lg hover:bg-white/10 relative ${screen === "settings" ? "bg-white/20" : ""}`}
                    title="Accessibility & Theme Settings"
                  >
                    <Settings className="w-4 h-4 text-white" />
                  </button>
                  <button 
                    onClick={() => { setScreen("notifications"); setUnreadNotifCount(0); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 relative"
                  >
                    <Bell className="w-4 h-4 text-white" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-400 border border-blue-600"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* ACTIVE SCREENS ROUTER VIEWPORTS */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
                isHighContrast ? "bg-black text-white" : "bg-slate-50 text-slate-800 font-sans"
              } ${isLargeText ? "text-[13px] leading-relaxed" : "text-xs"}`}>
                
                {/* DASHBOARD SCREEN */}
                {screen === "dashboard" && (
                  <>
                    {/* Bill Card */}
                    <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-5 text-white shadow-lg border border-blue-500/10 flex flex-col justify-between min-h-[170px]">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">OUTSTANDING BALANCE</span>
                          <span className="text-[9px] bg-orange-500 text-white font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            {balance?.outstandingBill && balance.outstandingBill > 0 ? "UNPAID" : "SETTLED"}
                          </span>
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight font-display mb-1">
                          ZMW {(balance?.outstandingBill ?? 0).toFixed(2)}
                        </h2>
                        {balance?.outstandingBill && balance.outstandingBill > 0 ? (
                          <p className="text-[10px] text-sky-100 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                            Due date: <span className="font-semibold">{balance?.dueDate}</span>
                          </p>
                        ) : (
                          <p className="text-[10px] text-sky-100">All current invoices cleared! Thank you.</p>
                        )}
                      </div>

                      <div className="flex gap-2.5 mt-4">
                        <button 
                          onClick={() => { setPayAmount(balance?.outstandingBill ? balance.outstandingBill.toString() : ""); setScreen("pay"); }}
                          className="flex-1 py-2 bg-white text-blue-900 hover:bg-sky-50 rounded-xl text-xs font-bold shadow active:scale-98 transition-all flex items-center justify-center gap-1.5"
                        >
                          <SmartphoneNfc className="w-3.5 h-3.5 text-blue-800" /> Pay Bill Now
                        </button>
                        <button 
                          onClick={() => setScreen("billing")}
                          className="px-3.5 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-white border border-white/10 rounded-xl text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" /> Bills
                        </button>
                      </div>
                    </div>

                    {/* Meta info layout */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Meter Serial</span>
                        <span className="text-xs font-semibold text-slate-800 font-mono">{currentUser?.meterNo}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Last Payment</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {balance?.lastPayment ? `ZMW ${balance.lastPayment.toFixed(2)}` : "None"}
                        </span>
                      </div>
                    </div>

                    {/* Real-time Service Status Map Entrance Card */}
                    <div className={`p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between shadow-sm ${
                      isHighContrast
                        ? "bg-black border-2 border-white text-white"
                        : "bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100"
                    }`}>
                      <div className="space-y-1 pr-2 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider ${isHighContrast ? "text-yellow-400" : "text-blue-600"}`}>
                            GRID MONITOR ACTIVE
                          </span>
                        </div>
                        <h3 className={`text-xs font-black tracking-tight font-display ${isHighContrast ? "text-white" : "text-slate-800"}`}>Grid Status Map</h3>
                        <p className={`text-[9.5px] leading-snug font-medium ${isHighContrast ? "text-white" : "text-slate-500"}`}>
                          View active leaks, maintenance, and outages across Kitwe sectors.
                        </p>
                      </div>
                      <button 
                        onClick={() => setScreen("status-map")}
                        className={`py-1.5 px-3 rounded-xl text-[11px] font-extrabold shadow active:scale-95 transition-all flex items-center gap-1 shrink-0 ${
                          isHighContrast
                            ? "bg-white text-black hover:bg-slate-200 border border-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <Map className="w-3.5 h-3.5" /> View Map
                      </button>
                    </div>

                    {/* Prepaid Meter Top-up Entry */}
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-4 text-white shadow-sm border border-emerald-500/10 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-emerald-200 uppercase tracking-wider block">PREPAID METER MODE</span>
                        <h3 className="text-xs font-black tracking-tight font-display">Prepaid Top-up Hub</h3>
                        <p className="text-[9.5px] text-teal-100">Instantly generate prepaid water meter tokens.</p>
                      </div>
                      <button 
                        onClick={() => setScreen("prepaid")}
                        className="py-1.5 px-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-lg text-[11px] font-bold shadow active:scale-95 transition-all flex items-center gap-1 shrink-0"
                      >
                        <Ticket className="w-3.5 h-3.5 text-emerald-700" /> Buy Token
                      </button>
                    </div>

                    {/* Water Consumption Analytics Module (Real-time API Driven) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3.5">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 font-display">Consumption Hub</h4>
                          <p className="text-[10px] text-slate-400">Live telemetric meter sync (15 min intervals)</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                          {analyticsTab === "daily" ? "Daily (L)" : analyticsTab === "weekly" ? "Weekly (L)" : "Monthly (Kl)"}
                        </span>
                      </div>

                      {/* Period Filter Switchers */}
                      <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        {(["daily", "weekly", "monthly"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => {
                              setAnalyticsTab(tab);
                              setSelectedPointIndex(null);
                            }}
                            className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all uppercase ${
                              analyticsTab === tab
                                ? "bg-white text-blue-700 shadow-sm"
                                : "text-slate-400 hover:text-slate-700"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {/* Interactive responsive dynamic SVG chart */}
                      {consumptionData ? (
                        <>
                          {(() => {
                            const getChartData = () => {
                              if (analyticsTab === "daily") {
                                return consumptionData.daily.map(d => ({
                                  label: d.dayName,
                                  value: d.liters,
                                  unit: "L",
                                  date: d.date
                                }));
                              } else if (analyticsTab === "weekly") {
                                return consumptionData.weekly.map(w => ({
                                  label: w.week,
                                  value: w.liters,
                                  unit: "L",
                                  date: w.label
                                }));
                              } else {
                                return consumptionData.monthly.map(m => ({
                                  label: m.month,
                                  value: m.kiloliters,
                                  unit: "Kl",
                                  date: m.label
                                }));
                              }
                            };

                            const chartData = getChartData();
                            const maxVal = chartData.length > 0 ? Math.max(...chartData.map(d => d.value), 1) : 100;

                            return (
                              <div className="space-y-3">
                                <div className="h-28 flex items-end justify-between gap-1 pt-6 pb-2 relative border-b border-slate-100">
                                  {/* Grid lines */}
                                  <div className="absolute inset-x-0 bottom-[10%] border-b border-dashed border-slate-100/60 text-[7px] text-slate-300 text-right pr-1 select-none pointer-events-none"></div>
                                  <div className="absolute inset-x-0 bottom-[50%] border-b border-dashed border-slate-100/60 text-[7px] text-slate-300 text-right pr-1 select-none pointer-events-none"></div>
                                  <div className="absolute inset-x-0 bottom-[90%] border-b border-dashed border-slate-100/60 text-[7px] text-slate-300 text-right pr-1 select-none pointer-events-none"></div>

                                  {chartData.map((d, index) => {
                                    const heightPercent = Math.round((d.value / maxVal) * 85); // max height 85% to leave room
                                    const isSelected = selectedPointIndex === index;
                                    const isOverLimit = analyticsTab === "daily" && d.value > waterGoal;

                                    return (
                                      <button
                                        key={index}
                                        onClick={() => setSelectedPointIndex(isSelected ? null : index)}
                                        className="flex-1 flex flex-col items-center group cursor-pointer focus:outline-none"
                                        title={`${d.value}${d.unit} on ${d.date}`}
                                      >
                                        <div className="w-full flex justify-center h-20 items-end relative">
                                          {/* Value popover tooltip if selected or hovered */}
                                          {isSelected && (
                                            <div className="absolute -top-7 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow-lg z-20 font-bold whitespace-nowrap animate-bounce border border-slate-800">
                                              {d.value} {d.unit}
                                            </div>
                                          )}
                                          {/* The bar itself */}
                                          <div 
                                            style={{ height: `${heightPercent}%` }} 
                                            className={`w-full rounded-t-sm transition-all duration-300 ${
                                              isSelected 
                                                ? "bg-blue-600 shadow shadow-blue-500/30" 
                                                : isOverLimit 
                                                  ? "bg-amber-400 group-hover:bg-amber-500" 
                                                  : "bg-sky-400 group-hover:bg-sky-500"
                                            }`}
                                          ></div>
                                        </div>
                                        {/* Label under bar */}
                                        <span className={`text-[8px] mt-1 font-bold tracking-tight ${isSelected ? "text-blue-700 font-black" : "text-slate-500"}`}>
                                          {d.label}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Dynamic Details Box */}
                                {selectedPointIndex !== null && chartData[selectedPointIndex] && (
                                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center text-[10px] animate-fadeIn">
                                    <div>
                                      <span className="text-[8px] text-slate-400 uppercase font-bold block">Selected Reading</span>
                                      <span className="font-bold text-slate-800">{chartData[selectedPointIndex].date} ({chartData[selectedPointIndex].label})</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[8px] text-slate-400 uppercase font-bold block">Usage Amount</span>
                                      <span className="font-extrabold text-blue-600">{chartData[selectedPointIndex].value} {chartData[selectedPointIndex].unit}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Goal Tracker (For Daily tab) */}
                                {analyticsTab === "daily" && (
                                  <div className="pt-2 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-1">
                                      <div>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase block">CONSERVATION TARGET</span>
                                        <span className="text-[11px] font-bold text-slate-700">Daily Budget: <span className="text-blue-600 font-extrabold">{waterGoal} Liters</span></span>
                                      </div>
                                      {isUpdatingGoal ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            value={waterGoal}
                                            onChange={(e) => setWaterGoal(Math.max(50, parseInt(e.target.value) || 250))}
                                            className="w-12 px-1 py-0.5 text-[10px] border border-slate-200 rounded text-center focus:outline-none focus:border-blue-500"
                                          />
                                          <button
                                            onClick={() => setIsUpdatingGoal(false)}
                                            className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[8px] font-bold"
                                          >
                                            OK
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setIsUpdatingGoal(true)}
                                          className="text-[9px] text-blue-600 hover:underline font-bold"
                                        >
                                          Adjust Target
                                        </button>
                                      )}
                                    </div>

                                    {/* Progress Meter bar */}
                                    {(() => {
                                      const todayUsage = consumptionData.daily[consumptionData.daily.length - 1]?.liters ?? 0;
                                      const progressPercent = Math.min(100, Math.round((todayUsage / waterGoal) * 100));
                                      const limitExceeded = todayUsage > waterGoal;

                                      return (
                                        <div className="space-y-1">
                                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                              style={{ width: `${progressPercent}%` }} 
                                              className={`h-full rounded-full transition-all duration-500 ${limitExceeded ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                            ></div>
                                          </div>
                                          <div className="flex justify-between text-[8px] font-bold text-slate-500">
                                            <span>Latest: {todayUsage} L</span>
                                            {limitExceeded ? (
                                              <span className="text-amber-500">Exceeded budget by {todayUsage - waterGoal} L</span>
                                            ) : (
                                              <span className="text-emerald-500">Eco-Friendly! {waterGoal - todayUsage} L remaining</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}

                                {/* Summary Telemetry Cards */}
                                <div className="grid grid-cols-3 gap-2 pt-1">
                                  <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100/50 flex flex-col justify-between">
                                    <span className="text-[7.5px] font-extrabold text-blue-600 uppercase block">AV. DAILY</span>
                                    <span className="text-[11px] font-black text-blue-900">{consumptionData.summary.averageDaily} L</span>
                                  </div>
                                  <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100/50 flex flex-col justify-between">
                                    <span className="text-[7.5px] font-extrabold text-amber-600 uppercase block">PEAK DAY</span>
                                    <span className="text-[11px] font-black text-amber-900">{consumptionData.summary.peakUsage} L</span>
                                  </div>
                                  <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50 flex flex-col justify-between">
                                    <span className="text-[7.5px] font-extrabold text-emerald-600 uppercase block">EST. BUDGET</span>
                                    <span className="text-[11px] font-black text-emerald-900">ZMW {consumptionData.summary.estimatedCostZMW}</span>
                                  </div>
                                </div>

                                {/* Dynamic Smart Insight Banner */}
                                <div className="p-2.5 bg-gradient-to-r from-blue-50/70 to-sky-50/70 border border-blue-100/50 rounded-xl flex items-start gap-2 text-[9.5px] text-blue-950 leading-normal">
                                  <Droplet className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-extrabold text-blue-800 uppercase text-[8px] block mb-0.5">Nkana Water Smart AI Insight</span>
                                    {consumptionData.summary.insight}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin mb-2" />
                          <p className="text-[10px] text-slate-400 font-medium">Syncing telemetry logs...</p>
                        </div>
                      )}
                    </div>

                    {/* Menu Navigation Items List */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CUSTOMER SERVICES</h4>
                      
                      <button 
                        onClick={() => setScreen("prepaid")}
                        className="w-full bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Ticket className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <h5 className="text-xs font-bold text-slate-800">Prepaid Meter Top-Up</h5>
                            <p className="text-[10px] text-slate-400">Generate 20-digit prepaid tokens</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button 
                        onClick={() => setScreen("report")}
                        className="w-full bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <h5 className="text-xs font-bold text-slate-800">Report Service Outage</h5>
                            <p className="text-[10px] text-slate-400">File water leaks or sewer overflows</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button 
                        onClick={() => setScreen("complaints")}
                        className="w-full bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <History className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <h5 className="text-xs font-bold text-slate-800">Track Complaint Status</h5>
                            <p className="text-[10px] text-slate-400">Monitor technician assignments</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button 
                        onClick={() => setScreen("profile")}
                        className="w-full bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <h5 className="text-xs font-bold text-slate-800">Account Profile</h5>
                            <p className="text-[10px] text-slate-400">Update contacts or secure password</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    {/* Developer Log Out Quick link */}
                    <div className="pt-2 text-center">
                      <button 
                        onClick={() => { setCurrentUser(null); setScreen("welcome"); }}
                        className="text-xs text-red-500 font-semibold hover:underline"
                      >
                        Sign Out of Session
                      </button>
                    </div>
                  </>
                )}

                {/* BILLING MODULE SCREEN */}
                {screen === "billing" && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-800 font-display mb-3">Billing Invoice Statements</h4>
                      
                      <div className="space-y-2.5">
                        {bills.map((bill) => (
                          <div key={bill.id} className="p-3 bg-slate-50 border border-slate-250/50 rounded-xl flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-xs font-bold text-slate-800">{bill.billingPeriod}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${
                                  bill.status === "paid" 
                                    ? "bg-green-50 text-green-600 border-green-200" 
                                    : "bg-orange-50 text-orange-600 border-orange-200"
                                }`}>
                                  {bill.status}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-400">Usage: {bill.consumptionKls} Kl  •  Due: {bill.dueDate}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-800">ZMW {bill.amount.toFixed(2)}</span>
                              <button 
                                onClick={() => handleDownloadPDF(bill.id)}
                                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-sm active:scale-95 transition-all"
                                title="Download PDF Statement"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-800 font-display mb-3">Recent Transactions</h4>
                      <div className="space-y-2.5">
                        {payments.length === 0 ? (
                          <div className="text-center py-4 text-[10px] text-slate-400">No payment logs found.</div>
                        ) : (
                          payments.map((p) => (
                            <div key={p.id} className="p-2.5 bg-slate-50 border border-slate-250/50 rounded-xl flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center font-bold text-[9px] text-sky-700">
                                  {p.provider}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800">ZMW {p.amount.toFixed(2)}</span>
                                  <p className="text-[9px] text-slate-400 font-mono select-all truncate w-24" title={p.reference}>Ref: {p.reference}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-medium text-slate-500 block">{new Date(p.timestamp).toLocaleDateString()}</span>
                                <span className="text-[9px] font-bold text-green-600">CONFIRMED</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* PAY MODULE SCREEN */}
                {screen === "pay" && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-800 font-display mb-3">Pay Water Invoice</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Choose Payment Provider</label>
                          <div className="grid grid-cols-3 gap-2">
                            {["MTN", "Airtel", "Zamtel"].map((prov) => {
                              const isSelected = payProvider === prov;
                              return (
                                <button
                                  key={prov}
                                  onClick={() => setPayProvider(prov as any)}
                                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                                    isSelected 
                                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10" 
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  {prov === "MTN" ? "MTN MoMo" : prov === "Airtel" ? "Airtel" : "Zamtel"}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile Money Number</label>
                          <input 
                            type="text"
                            value={payPhone}
                            onChange={(e) => setPayPhone(e.target.value)}
                            placeholder="+260 971 234567"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount to Settle (ZMW)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">ZMW</span>
                            <input 
                              type="number"
                              value={payAmount}
                              onChange={(e) => setPayAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-12 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleInitiatePayment}
                          className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                        >
                          <SmartphoneNfc className="w-4 h-4" /> Trigger Handset PIN Request
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-800 leading-relaxed">
                      💡 **Simulated Real-Time Sandbox**: Submitting payment triggers a REST API transaction. A simulated USSD PIN request prompt overlay will appear inside this phone simulator for 4 seconds, representing actual Airtel/MTN gateway handshakes.
                    </div>
                  </div>
                )}

                {/* PREPAID PURCHASE SCREEN */}
                {screen === "prepaid" && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-800 font-display mb-3">Buy Prepaid Water Token</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Choose Payment Provider</label>
                          <div className="grid grid-cols-3 gap-2">
                            {["MTN", "Airtel", "Zamtel"].map((prov) => {
                              const isSelected = prepaidProvider === prov;
                              return (
                                <button
                                  key={prov}
                                  onClick={() => setPrepaidProvider(prov as any)}
                                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                                    isSelected 
                                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10" 
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  {prov === "MTN" ? "MTN MoMo" : prov === "Airtel" ? "Airtel" : "Zamtel"}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile Money Phone Number</label>
                          <input 
                            type="text"
                            value={prepaidPhone}
                            onChange={(e) => setPrepaidPhone(e.target.value)}
                            placeholder="+260 971 234567"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Top-Up Amount (ZMW)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">ZMW</span>
                            <input 
                              type="number"
                              value={prepaidAmount}
                              onChange={(e) => setPrepaidAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-12 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            />
                          </div>
                          
                          {/* Live Water Volume Calculator */}
                          {parseFloat(prepaidAmount) > 0 && (
                            <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] text-emerald-800 flex justify-between items-center">
                              <span>Water Yield:</span>
                              <span className="font-extrabold font-mono">
                                {Math.round((parseFloat(prepaidAmount) / 15.0) * 1000).toLocaleString()} Liters 
                                ({((parseFloat(prepaidAmount) / 15.0)).toFixed(1)} Kl)
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={handleInitiatePrepaidPurchase}
                          className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                        >
                          <Ticket className="w-4 h-4" /> Purchase Prepaid Token
                        </button>
                      </div>
                    </div>

                    {/* Historical Tokens */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-800 font-display mb-3">My Prepaid Water Tokens</h4>
                      <div className="space-y-3">
                        {prepaidTokens.length === 0 ? (
                          <div className="text-center py-6 text-[10px] text-slate-400">No prepaid tokens bought yet.</div>
                        ) : (
                          prepaidTokens.map((t) => (
                            <div key={t.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center font-bold text-[8px] text-emerald-700">
                                    {t.provider}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800">ZMW {t.amount.toFixed(2)}</span>
                                    <p className="text-[8.5px] text-slate-400">{new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10.5px] font-black text-slate-700 block font-mono">{t.liters.toLocaleString()} Liters</span>
                                  <span className="text-[8.5px] text-slate-400">Yield: ~{(t.liters / 1000).toFixed(1)} Kl</span>
                                </div>
                              </div>
                              
                              {/* Token Code Display with Quick Copy */}
                              <div className="flex items-center justify-between gap-1.5 p-2 bg-emerald-950 text-emerald-200 font-mono rounded-lg border border-emerald-900/40">
                                <span className="text-xs tracking-wider font-semibold select-all font-mono">
                                  {t.token}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(t.token);
                                    setCopiedTokenId(t.id);
                                    setTimeout(() => setCopiedTokenId(null), 2000);
                                  }}
                                  className="p-1 text-emerald-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center justify-center"
                                  title="Copy Token Code"
                                >
                                  {copiedTokenId === t.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* REPORT SERVICE REQUEST SCREEN */}
                {screen === "report" && (
                  <form onSubmit={handleSubmitComplaint} className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Issue Category</label>
                        <select 
                          value={complaintCategory}
                          onChange={(e) => setComplaintCategory(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                        >
                          <option value="leak">Water Leak / Burst pipe</option>
                          <option value="no-supply">No Water Supply / Low Pressure</option>
                          <option value="sewer">Sewer Spill / Blockage</option>
                          <option value="meter">Meter Tamper / Damage</option>
                          <option value="other">Other Outage</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Details & Description</label>
                        <textarea
                          required
                          value={complaintDesc}
                          onChange={(e) => setComplaintDesc(e.target.value)}
                          placeholder="Please provide precise details. E.g. Outage duration, specific landmarks, severity of flooding..."
                          className="w-full h-20 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none"
                        />
                      </div>

                      {/* Camera upload simulation */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Attach Photo Evidence</label>
                        <div className="grid grid-cols-3 gap-2">
                          {leakPhotoOptions.map((opt) => {
                            const isSelected = selectedLeakPhoto === opt.url;
                            return (
                              <button
                                key={opt.name}
                                type="button"
                                onClick={() => setSelectedLeakPhoto(opt.url)}
                                className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                  isSelected ? "border-blue-600 scale-98" : "border-slate-200 opacity-60"
                                }`}
                              >
                                <img src={opt.url} alt={opt.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[8px] font-medium text-white text-center truncate">
                                  {opt.name}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* GPS Capture */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GPS Geotag Location</label>
                        <div className="flex gap-2">
                          <div className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-[9px] text-slate-500 flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)} ({gpsLocation.address})
                          </div>
                          <button
                            type="button"
                            onClick={simulateGpsCapture}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-250 p-2 rounded-xl text-slate-700 active:scale-95 transition-all"
                            title="Mock Locate GPS"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow active:scale-98 transition-all flex items-center justify-center gap-2"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket to Nkana Water"}
                      </button>
                    </div>
                  </form>
                )}

                {/* TRACK COMPLAINTS SCREEN */}
                {screen === "complaints" && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-800 font-display mb-3">Service Request Tickets</h4>
                      
                      {complaints.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">You have no active or historical tickets.</div>
                      ) : (
                        <div className="space-y-3.5">
                          {complaints.map((c) => (
                            <div key={c.id} className="p-3 bg-slate-50 border border-slate-250/50 rounded-xl space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 block font-mono">TICKET: {c.id}</span>
                                  <span className="text-xs font-bold text-slate-800 capitalize">{c.category} Report</span>
                                </div>
                                <span className={`text-[8px] font-extrabold border px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusColor(c.status)}`}>
                                  {c.status}
                                </span>
                              </div>

                              <p className="text-[10px] text-slate-500 leading-relaxed">{c.description}</p>

                              {c.imageUrl && (
                                <div className="h-20 rounded-lg overflow-hidden border border-slate-200">
                                  <img src={c.imageUrl} alt="Damage Proof" className="w-full h-full object-cover" />
                                </div>
                              )}

                              <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center text-[9px] text-slate-400">
                                <span>Reported: {new Date(c.createdAt).toLocaleDateString()}</span>
                                {c.assignedTechnician ? (
                                  <span className="text-blue-600 font-bold">Tech: {c.assignedTechnician}</span>
                                ) : (
                                  <span className="text-slate-500 font-medium">Assigning tech...</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SYSTEM BROADCAST OUTAGES & NOTIFICATIONS SCREEN */}
                {screen === "notifications" && (
                  <div className="space-y-3">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-xl border border-slate-200">No active bulletins or reminders.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1.5">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                n.type === "emergency" ? "bg-red-500" : n.type === "maintenance" ? "bg-amber-500" : "bg-blue-500"
                              }`}></span>
                              <span className="text-xs font-bold text-slate-800">{n.title}</span>
                            </div>
                            <span className="text-[9px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* PROFILE CONFIG SCREEN */}
                {screen === "profile" && (
                  <div className="space-y-4">
                    {/* PERSONAL INFORMATION FORM */}
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className={`p-4 rounded-xl border shadow-sm space-y-3.5 transition-all ${
                        isHighContrast 
                          ? "bg-black border-2 border-white text-white" 
                          : "bg-white border-slate-200/80 text-slate-800"
                      }`}>
                        <div className="flex items-center gap-2 border-b pb-2 border-dashed border-slate-200/60">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Personal Information</h4>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer Name</label>
                          <input 
                            type="text"
                            required
                            value={currentUser?.name || ""}
                            className={`w-full px-3.5 py-2.5 text-xs rounded-xl font-medium cursor-not-allowed ${
                              isHighContrast 
                                ? "bg-slate-900 border border-white text-slate-400" 
                                : "bg-slate-50 border border-slate-200 text-slate-500"
                            }`}
                            disabled
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Active Account ID</label>
                          <input 
                            type="text"
                            value={currentUser?.accountNo || ""}
                            className={`w-full px-3.5 py-2.5 text-xs rounded-xl font-mono cursor-not-allowed ${
                              isHighContrast 
                                ? "bg-slate-900 border border-white text-slate-400" 
                                : "bg-slate-50 border border-slate-200 text-slate-500"
                            }`}
                            disabled
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Registered Phone</label>
                          <input 
                            type="tel"
                            required
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className={`w-full px-3.5 py-2.5 text-xs rounded-xl ${
                              isHighContrast 
                                ? "bg-black border-2 border-white text-white" 
                                : "bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Billing Home Address</label>
                          <input 
                            type="text"
                            required
                            value={profileAddress}
                            onChange={(e) => setProfileAddress(e.target.value)}
                            className={`w-full px-3.5 py-2.5 text-xs rounded-xl ${
                              isHighContrast 
                                ? "bg-black border-2 border-white text-white" 
                                : "bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white"
                            }`}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs shadow active:scale-98 transition-all flex items-center justify-center gap-1.5 ${
                            isHighContrast 
                              ? "bg-white text-black hover:bg-slate-200 border-2 border-white" 
                              : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400"
                          }`}
                        >
                          {isLoading ? "Saving..." : "Apply Changes"}
                        </button>
                      </div>
                    </form>

                    {/* MULTI-ACCOUNT CONTROL CENTER */}
                    <div className={`p-4 rounded-xl border shadow-sm space-y-4 transition-all ${
                      isHighContrast 
                        ? "bg-black border-2 border-white text-white" 
                        : "bg-white border-slate-200/80 text-slate-800"
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-dashed border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-500" />
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider">Multi-Account Manager</h4>
                            <p className="text-[8px] text-slate-400 font-medium">For Landlords, Family & Rentals</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold font-mono uppercase border ${
                          isHighContrast ? "border-white" : "bg-cyan-50 border-cyan-200 text-cyan-700"
                        }`}>
                          {linkedAccounts.length} Linked
                        </span>
                      </div>

                      {/* Linked list */}
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {linkedAccounts.map((accNo) => {
                          const isActive = accNo === activeAccountNo;
                          const label = accountLabels[accNo] || "Secondary Property";
                          return (
                            <div 
                              key={accNo} 
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                                isActive 
                                  ? (isHighContrast ? "bg-white/20 border-white" : "bg-blue-50/75 border-blue-200/60") 
                                  : (isHighContrast ? "bg-black border-slate-700 hover:border-white" : "bg-slate-50 border-slate-100 hover:border-slate-200")
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold tracking-tight text-slate-800 font-mono truncate">{accNo}</span>
                                  {isActive && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase ${
                                      isHighContrast ? "bg-white text-black" : "bg-blue-600 text-white"
                                    }`}>
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-500 font-medium truncate">{label}</p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {!isActive ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSwitchAccount(accNo)}
                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all ${
                                      isHighContrast 
                                        ? "bg-white text-black hover:bg-slate-200" 
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    }`}
                                  >
                                    Switch
                                  </button>
                                ) : null}

                                <button
                                  type="button"
                                  onClick={() => handleUnlinkAccount(accNo)}
                                  disabled={isActive}
                                  title={isActive ? "Cannot unlink active account" : "Unlink account"}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    isActive
                                      ? "opacity-30 cursor-not-allowed border-transparent text-slate-400"
                                      : (isHighContrast 
                                          ? "border-red-800 text-red-500 hover:bg-red-950" 
                                          : "border-slate-200 bg-white hover:border-red-100 hover:bg-red-50 text-slate-400 hover:text-red-500")
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* QUICK DEMO PRESETS */}
                      <div className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl space-y-1.5">
                        <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">
                          💡 Quick Sandbox Presets (Try switching!)
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = linkedAccounts.includes("NW-889410") ? linkedAccounts : [...linkedAccounts, "NW-889410"];
                              const updatedLabels = { ...accountLabels, "NW-889410": "Primary Residence (Vanessa)" };
                              setLinkedAccounts(updated);
                              setAccountLabels(updatedLabels);
                              try {
                                localStorage.setItem("nkana_linked_accounts", JSON.stringify(updated));
                                localStorage.setItem("nkana_account_labels", JSON.stringify(updatedLabels));
                              } catch(e){}
                              handleSwitchAccount("NW-889410");
                            }}
                            className={`px-2 py-1.5 text-[9px] font-bold border rounded-lg text-left truncate flex items-center justify-between ${
                              activeAccountNo === "NW-889410" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            <span>Main House</span>
                            <span className="text-[7px] opacity-70">NW-889410</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = linkedAccounts.includes("NW-100200") ? linkedAccounts : [...linkedAccounts, "NW-100200"];
                              const updatedLabels = { ...accountLabels, "NW-100200": "Rental Unit B (Tenant)" };
                              setLinkedAccounts(updated);
                              setAccountLabels(updatedLabels);
                              try {
                                localStorage.setItem("nkana_linked_accounts", JSON.stringify(updated));
                                localStorage.setItem("nkana_account_labels", JSON.stringify(updatedLabels));
                              } catch(e){}
                              handleSwitchAccount("NW-100200");
                            }}
                            className={`px-2 py-1.5 text-[9px] font-bold border rounded-lg text-left truncate flex items-center justify-between ${
                              activeAccountNo === "NW-100200" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            <span>Rental Unit B</span>
                            <span className="text-[7px] opacity-70">NW-100200</span>
                          </button>
                        </div>
                      </div>

                      {/* LINK NEW ACCOUNT FORM */}
                      <form onSubmit={handleLinkAccount} className="space-y-2 border-t pt-3 border-dashed border-slate-200/60">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Link Another Property Account
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <input
                              type="text"
                              placeholder="Account ID (e.g. NW-100200)"
                              required
                              value={newLinkAccountNo}
                              onChange={(e) => setNewLinkAccountNo(e.target.value)}
                              className={`w-full px-2.5 py-2 text-[10px] rounded-lg font-mono ${
                                isHighContrast 
                                  ? "bg-black border-2 border-white text-white" 
                                  : "bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white"
                              }`}
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Custom Label (e.g. Mom's House)"
                              value={newLinkLabel}
                              onChange={(e) => setNewLinkLabel(e.target.value)}
                              className={`w-full px-2.5 py-2 text-[10px] rounded-lg ${
                                isHighContrast 
                                  ? "bg-black border-2 border-white text-white" 
                                  : "bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white"
                              }`}
                            />
                          </div>
                        </div>

                        {linkError && <p className="text-[9px] font-bold text-red-500">{linkError}</p>}
                        {linkSuccess && <p className="text-[9px] font-bold text-green-500">{linkSuccess}</p>}

                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`w-full py-2 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center gap-1.5 ${
                            isHighContrast 
                              ? "bg-white text-black hover:bg-slate-200 border border-white" 
                              : "bg-slate-900 hover:bg-slate-850 text-white"
                          }`}
                        >
                          <Link2 className="w-3 h-3" /> Link New Property
                        </button>
                      </form>
                    </div>

                    {/* SETTINGS AND ACCESSIBILITY TAB */}
                    <div className={`p-4 rounded-xl border shadow-sm transition-all ${
                      isHighContrast 
                        ? "bg-black border-2 border-white" 
                        : "bg-white border-slate-200/80"
                    }`}>
                      <button
                        type="button"
                        onClick={() => setScreen("settings")}
                        className={`w-full py-2.5 flex items-center justify-center gap-2 rounded-xl font-bold text-xs border transition-all ${
                          isHighContrast 
                            ? "bg-black border-2 border-white text-white hover:bg-white/10" 
                            : "bg-slate-50 border-slate-250 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Sliders className="w-4 h-4" /> Accessibility & Theme Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* SYSTEM PREFERENCES & THEME SETTINGS SCREEN */}
                {screen === "settings" && (
                  <div className="space-y-4">
                    <div className={isHighContrast ? "bg-black border-4 border-white p-4 space-y-4" : "bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-4"}>
                      <div className="flex items-center gap-2 border-b pb-2 border-dashed border-slate-350">
                        <Sliders className="w-4 h-4 text-cyan-500" />
                        <h4 className="text-xs font-bold font-display uppercase tracking-wider">System Preferences</h4>
                      </div>

                      {/* Theme Toggle option */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          UI Styling Theme
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsHighContrast(false);
                              try { localStorage.setItem("nkana_high_contrast", "false"); } catch(e){}
                            }}
                            className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                              !isHighContrast
                                ? "bg-blue-50 border-blue-600 text-blue-700 font-bold"
                                : (isHighContrast ? "bg-black border-slate-750 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                            }`}
                          >
                            <span>Frosted Glass</span>
                            <span className="text-[8px] font-medium opacity-80">Modern Gradients</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsHighContrast(true);
                              try { localStorage.setItem("nkana_high_contrast", "true"); } catch(e){}
                            }}
                            className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                              isHighContrast
                                ? "bg-black border-white text-white font-bold ring-2 ring-white"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span>High Contrast</span>
                            <span className="text-[8px] font-medium opacity-80">Accessibility Outlines</span>
                          </button>
                        </div>
                      </div>

                      {/* Text size options */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Display Text Size
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsLargeText(false);
                              try { localStorage.setItem("nkana_large_text", "false"); } catch(e){}
                            }}
                            className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all text-center ${
                              !isLargeText
                                ? (isHighContrast ? "bg-black border-white text-white font-bold ring-2 ring-white" : "bg-blue-50 border-blue-600 text-blue-700 font-bold")
                                : (isHighContrast ? "bg-black border-slate-750 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                            }`}
                          >
                            Normal Text
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsLargeText(true);
                              try { localStorage.setItem("nkana_large_text", "true"); } catch(e){}
                            }}
                            className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all text-center ${
                              isLargeText
                                ? (isHighContrast ? "bg-black border-white text-white font-bold ring-2 ring-white" : "bg-blue-50 border-blue-600 text-blue-700 font-bold")
                                : (isHighContrast ? "bg-black border-slate-750 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                            }`}
                          >
                            Large Text (A11y)
                          </button>
                        </div>
                      </div>

                      {/* Mock accessibility info */}
                      <div className={`p-3 text-[10px] leading-relaxed rounded-xl border ${
                        isHighContrast 
                          ? "bg-black border-white text-white" 
                          : "bg-amber-50/50 border-amber-200/60 text-slate-600"
                      }`}>
                        <div className="flex gap-1.5 items-center font-bold mb-1">
                          <Accessibility className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Accessibility Guidelines</span>
                        </div>
                        High Contrast mode eliminates color-coded gradients, blurs, and translucent backdrops to maximize accessibility and readability for low-vision users.
                      </div>
                    </div>
                  </div>
                )}

                {/* SERVICE STATUS MAP SCREEN */}
                {screen === "status-map" && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                    <ServiceStatusMap
                      isHighContrast={isHighContrast}
                      activeAccountNo={activeAccountNo}
                      triggerRefreshSignal={triggerRefreshSignal}
                      onReportAtLocation={handleReportAtLocation}
                    />
                  </div>
                )}

              </div>

              {/* BOTTOM NAVIGATION TAB BAR */}
              <div className={`h-16 grid grid-cols-5 select-none shrink-0 px-2 transition-all duration-150 ${
                isHighContrast 
                  ? "bg-black border-t-4 border-white" 
                  : "bg-white border-t border-slate-200/80"
              }`}>
                <button 
                  onClick={() => setScreen("dashboard")}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    screen === "dashboard" 
                      ? (isHighContrast ? "text-yellow-400 font-extrabold" : "text-blue-600 font-bold") 
                      : (isHighContrast ? "text-white hover:text-yellow-400" : "text-slate-400 hover:text-slate-600")
                  }`}
                >
                  <Droplet className="w-5 h-5" />
                  <span className="text-[9px]">Utility</span>
                </button>

                <button 
                  onClick={() => setScreen("billing")}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    screen === "billing" 
                      ? (isHighContrast ? "text-yellow-400 font-extrabold" : "text-blue-600 font-bold") 
                      : (isHighContrast ? "text-white hover:text-yellow-400" : "text-slate-400 hover:text-slate-600")
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-[9px]">Statements</span>
                </button>

                <button 
                  onClick={() => setScreen("report")}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    screen === "report" 
                      ? (isHighContrast ? "text-yellow-400 font-extrabold" : "text-blue-600 font-bold") 
                      : (isHighContrast ? "text-white hover:text-yellow-400" : "text-slate-400 hover:text-slate-600")
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-[9px]">Reports</span>
                </button>

                <button 
                  onClick={() => setScreen("status-map")}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    screen === "status-map" 
                      ? (isHighContrast ? "text-yellow-400 font-extrabold" : "text-blue-600 font-bold") 
                      : (isHighContrast ? "text-white hover:text-yellow-400" : "text-slate-400 hover:text-slate-600")
                  }`}
                >
                  <Map className="w-5 h-5" />
                  <span className="text-[9px]">Grid Map</span>
                </button>

                <button 
                  onClick={() => setScreen("profile")}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    screen === "profile" 
                      ? (isHighContrast ? "text-yellow-400 font-extrabold" : "text-blue-600 font-bold") 
                      : (isHighContrast ? "text-white hover:text-yellow-400" : "text-slate-400 hover:text-slate-600")
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="text-[9px]">My Profile</span>
                </button>
              </div>

            </div>
          )}

          {/* SIMULATED USSD MOBILE MONEY PENDING TRANSACTION SCREEN OVERLAY */}
          {paymentPendingOverlay && (
            <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-6 text-center select-none font-sans">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white max-w-xs space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto animate-pulse">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">MoMo Handset PIN prompt</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Check your mobile phone for an automated push screen. Enter your secret **Mobile Money Wallet PIN** to complete payment.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 py-1 text-[10px] text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  Waiting for callback confirm...
                </div>
              </div>
            </div>
          )}

          {/* SIMULATED MoMo TRANSACTION SUCCESS SCREEN OVERLAY */}
          {paymentSuccessOverlay && (
            <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-6 text-center select-none font-sans">
              <div className="bg-white rounded-2xl p-6 text-slate-800 max-w-xs space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-display">Payment Succeeded!</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Transaction processed. Outstanding balance updated. An official PDF statement and payment ledger confirmation log has been created.
                  </p>
                </div>
                <button 
                  onClick={() => { setPaymentSuccessOverlay(false); setScreen("dashboard"); }}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
                >
                  Return to Utility App
                </button>
              </div>
            </div>
          )}

          {/* SIMULATED PREPAID TRANSACTION SUCCESS SCREEN OVERLAY */}
          {prepaidSuccessOverlay && (
            <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-6 text-center select-none font-sans">
              <div className="bg-white rounded-2xl p-5 text-slate-800 max-w-xs space-y-3.5 animate-in fade-in zoom-in duration-200 w-full">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-display">Prepaid Purchase Complete!</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Water Token has been successfully generated. Enter this 20-digit code on your prepaid smart meter keypad.
                  </p>
                </div>

                {latestBoughtToken && (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-emerald-950 text-emerald-200 rounded-xl space-y-1.5 border border-emerald-900 shadow-sm text-left">
                      <span className="text-[8px] font-bold text-emerald-400 block uppercase tracking-wide">METER TOP-UP TOKEN</span>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-mono font-bold tracking-wider select-all font-mono">
                          {latestBoughtToken.token}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(latestBoughtToken.token);
                            setCopiedTokenId(latestBoughtToken.id);
                            setTimeout(() => setCopiedTokenId(null), 2000);
                          }}
                          className="p-1 text-emerald-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center justify-center"
                          title="Copy Token Code"
                        >
                          {copiedTokenId === latestBoughtToken.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[8px] text-slate-400 block uppercase font-bold">Water Volume</span>
                        <span className="text-xs font-black text-slate-800 font-mono">{latestBoughtToken.liters.toLocaleString()} Liters</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[8px] text-slate-400 block uppercase font-bold">Top-Up Amount</span>
                        <span className="text-xs font-black text-slate-800">ZMW {latestBoughtToken.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => { setPrepaidSuccessOverlay(false); setScreen("prepaid"); }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  View My Tokens
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Home Navigation button bar style (iPhone look) */}
        <div className="absolute bottom-1 inset-x-0 h-4 flex justify-center items-center z-50 pointer-events-none select-none">
          <div className="w-32 h-1.5 bg-slate-800 rounded-full"></div>
        </div>

      </div>

    </div>
  );
}
