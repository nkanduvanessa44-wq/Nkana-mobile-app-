export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  phone: string;
  accountNo: string;
  meterNo: string;
  address: string;
  role: "customer" | "admin";
}

export interface Bill {
  id: string;
  accountNo: string;
  billingPeriod: string;
  amount: number;
  consumptionKls: number;
  dueDate: string;
  status: "paid" | "unpaid" | "overdue";
  pdfUrl: string;
}

export interface Payment {
  id: string;
  accountNo: string;
  amount: number;
  provider: "MTN" | "Airtel" | "Zamtel";
  phoneNo: string;
  reference: string;
  timestamp: string;
  status: "pending" | "success" | "failed";
}

export interface PrepaidToken {
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

export interface Complaint {
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

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "maintenance" | "emergency" | "billing" | "general";
  targetAccount?: string;
  createdAt: string;
}

export interface AuditLog {
  timestamp: string;
  action: string;
  details: string;
  user?: string;
}
