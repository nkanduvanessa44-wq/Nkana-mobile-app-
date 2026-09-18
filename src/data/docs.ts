// Complete developer references and codebases for the Smart Water Customer App

export const POSTGRES_SCHEMA = `-- PostgreSQL Database Schema for Smart Water Utility Company
-- Target Engine: PostgreSQL 14+
-- Authored by: Senior Enterprise Architect

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Profiles
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'technician');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    account_no VARCHAR(20) UNIQUE,
    meter_no VARCHAR(30) UNIQUE,
    address TEXT,
    role user_role DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookup
CREATE INDEX idx_users_account ON users(account_no);
CREATE INDEX idx_users_email ON users(email);

-- 2. Bills & Accounts
CREATE TYPE bill_status AS ENUM ('paid', 'unpaid', 'overdue');

CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_no VARCHAR(20) REFERENCES users(account_no) ON DELETE RESTRICT,
    billing_period VARCHAR(50) NOT NULL, -- e.g., 'June 2026'
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    consumption_kls DECIMAL(10, 2) NOT NULL CHECK (consumption_kls >= 0),
    due_date DATE NOT NULL,
    status bill_status DEFAULT 'unpaid',
    pdf_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bills_account ON bills(account_no);
CREATE INDEX idx_bills_status ON bills(status);

-- 3. Payments & Gateway Transactions
CREATE TYPE payment_provider AS ENUM ('MTN', 'Airtel', 'Zamtel');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed');

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_no VARCHAR(20) REFERENCES users(account_no) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    provider payment_provider NOT NULL,
    phone_no VARCHAR(20) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL, -- Operator Transaction ID
    status payment_status DEFAULT 'pending',
    raw_callback_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_account ON payments(account_no);

-- 4. Complaints & Service Requests
CREATE TYPE complaint_category AS ENUM ('leak', 'no-supply', 'sewer', 'meter', 'other');
CREATE TYPE complaint_status AS ENUM ('pending', 'assigned', 'in-progress', 'resolved');

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_no VARCHAR(20) REFERENCES users(account_no) ON DELETE SET NULL,
    category complaint_category NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(512),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address_text VARCHAR(255),
    status complaint_status DEFAULT 'pending',
    assigned_technician VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_complaints_account ON complaints(account_no);
CREATE INDEX idx_complaints_status ON complaints(status);

-- 5. Broadcasts & Notifications
CREATE TYPE notification_type AS ENUM ('maintenance', 'emergency', 'billing', 'general');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'general',
    target_account VARCHAR(20) REFERENCES users(account_no) ON DELETE CASCADE, -- NULL means global broadcast
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Logging & Security Triggers
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performed_by VARCHAR(255), -- Email or System ID
    action VARCHAR(100) NOT NULL, -- e.g., 'AUTH_LOGIN', 'PAYMENT_RECEIVE'
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Automated Timestamp Update Trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_bills_modtime BEFORE UPDATE ON bills FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_payments_modtime BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_complaints_modtime BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Add Commenting for Documentation
COMMENT ON TABLE users IS 'Master customer and administrator user registries.';
COMMENT ON TABLE bills IS 'Water meter usage invoices generated monthly.';
COMMENT ON TABLE payments IS 'MTN MoMo, Airtel Money, and Zamtel transaction ledgers.';
COMMENT ON TABLE complaints IS 'Geo-tagged water leak and sewer outage complaints reported by citizens.';
`;

export const FLUTTER_DART_CODE = `// Flutter & Dart - Mobile Application Implementation
// Dependencies in pubspec.yaml: 
//   http: ^1.2.0
//   flutter_secure_storage: ^9.0.0
//   geolocator: ^11.0.0
//   image_picker: ^1.0.7
//   google_maps_flutter: ^2.5.3

import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:geolocator/geolocator.dart';

// 1. SECURE API CLIENT SERVICE
class SmartWaterApiService {
  final String baseUrl = "https://api.nkanawater.co.zm/api";
  final _secureStorage = const FlutterSecureStorage();

  // Header factory supporting Bearer Authorization
  Future<Map<String, String>> _getHeaders() async {
    String? token = await _secureStorage.read(key: "access_token");
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      if (token != null) "Authorization": "Bearer $token"
    };
  }

  // Authentication: Login
  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": email, "password": password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _secureStorage.write(key: "access_token", value: data['tokens']['accessToken']);
        await _secureStorage.write(key: "refresh_token", value: data['tokens']['refreshToken']);
        await _secureStorage.write(key: "account_no", value: data['user']['accountNo']);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("API Error during login: $e");
      return false;
    }
  }

  // Fetch Current Balance & Outstanding Bill info
  Future<Map<String, dynamic>?> getCustomerBalance() async {
    try {
      String? accountNo = await _secureStorage.read(key: "account_no");
      final response = await http.get(
        Uri.parse("$baseUrl/customer/balance?accountNo=$accountNo"),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint("API Error fetching balance: $e");
    }
    return null;
  }

  // Initiate Mobile Money payment (MTN/Airtel/Zamtel)
  Future<Map<String, dynamic>?> initiatePayment(
    double amount, 
    String provider, 
    String phoneNo
  ) async {
    try {
      String? accountNo = await _secureStorage.read(key: "account_no");
      final response = await http.post(
        Uri.parse("$baseUrl/payment/initiate"),
        headers: await _getHeaders(),
        body: jsonEncode({
          "accountNo": accountNo,
          "amount": amount,
          "provider": provider,
          "phoneNo": phoneNo
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint("API Error initiating payment: $e");
    }
    return null;
  }

  // Submit Geo-Tagged Complaint with Mobile Camera Image
  Future<bool> submitComplaint({
    required String category,
    required String description,
    required Position gps,
    File? imageFile,
  }) async {
    try {
      String? accountNo = await _secureStorage.read(key: "account_no");
      
      // Real enterprise builds use Multipart Requests for image uploads
      var request = http.MultipartRequest('POST', Uri.parse("$baseUrl/issues/create"));
      
      String? token = await _secureStorage.read(key: "access_token");
      if (token != null) {
        request.headers["Authorization"] = "Bearer $token";
      }

      request.fields['accountNo'] = accountNo ?? "";
      request.fields['category'] = category;
      request.fields['description'] = description;
      request.fields['gpsLocation'] = jsonEncode({
        "lat": gps.latitude,
        "lng": gps.longitude,
        "address": "GPS Captured"
      });

      if (imageFile != null) {
        request.files.add(await http.MultipartFile.fromPath(
          'image',
          imageFile.path,
        ));
      }

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      return response.statusCode == 201;
    } catch (e) {
      debugPrint("API Error submitting complaint: $e");
      return false;
    }
  }
}

// 2. MOBILE DASHBOARD VIEW (DART STATEFUL COMPONENT)
class WaterDashboardScreen extends StatefulWidget {
  const WaterDashboardScreen({Key? key}) : super(key: key);

  @override
  _WaterDashboardScreenState createState() => _WaterDashboardScreenState();
}

class _WaterDashboardScreenState extends State<WaterDashboardScreen> {
  final SmartWaterApiService _api = SmartWaterApiService();
  bool _isLoading = true;
  double _outstandingBill = 0.0;
  String _dueDate = "N/A";
  String _accountNo = "";

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    final data = await _api.getCustomerBalance();
    if (data != null) {
      setState(() {
        _outstandingBill = (data['outstandingBill'] as num).toDouble();
        _dueDate = data['dueDate'] ?? "N/A";
        _accountNo = data['accountNo'] ?? "";
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Smart Water Utility"),
        backgroundColor: Colors.blue[800],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _loadDashboardData,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Balance Card
                  Card(
                    color: Colors.blue[900],
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("Outstanding Bill Balance", style: TextStyle(color: Colors.white70, fontSize: 14)),
                          const SizedBox(height: 8),
                          Text("ZMW \${_outstandingBill.toStringAsFixed(2)}", style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          Text("Due Date: \$_dueDate", style: const TextStyle(color: Colors.orangeAccent, fontSize: 14, fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Navigation Grid
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    children: [
                      _buildMenuButton(context, Icons.receipt, "Pay Water Bill", Colors.teal, () {
                        // Navigate to payments
                      }),
                      _buildMenuButton(context, Icons.report_problem, "Report Leak / Sewer", Colors.redAccent, () {
                        // Navigate to complaint creation
                      }),
                      _buildMenuButton(context, Icons.history, "Bills & History", Colors.amber[700]!, () {
                        // Navigate to billing
                      }),
                      _buildMenuButton(context, Icons.person, "My Profile", Colors.purple, () {
                        // Navigate to profile
                      }),
                    ],
                  )
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildMenuButton(BuildContext context, IconData icon, String title, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Card(
        elevation: 3,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: color),
            const SizedBox(height: 10),
            Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
`;

export const API_DOCS = `## Smart Water Customer App - API Endpoint Documentation
Base URL: \`https://api.nkanawater.co.zm/api\`
Protocol: HTTPS only
Authentication: JWT via \`Authorization: Bearer <JWT_ACCESS_TOKEN>\`

---

### 1. Authentication Endpoints

#### POST \`/api/auth/register\`
Creates a new customer profile, assigns a unique utility account number, and initializes billing.
* **Payload (JSON)**:
  \`\`\`json
  {
    "email": "customer@gmail.com",
    "password": "SecurePassword123!",
    "name": "Jane Mulenga",
    "phone": "+260971122334",
    "address": "Plot 101, Nkana East, Kitwe"
  }
  \`\`\`
* **Response (201 Created)**:
  \`\`\`json
  {
    "message": "Registration successful",
    "user": {
      "id": "u-9923-a",
      "email": "customer@gmail.com",
      "name": "Jane Mulenga",
      "accountNo": "NW-100293",
      "meterNo": "MTR-8819-N",
      "role": "customer"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
  \`\`s

#### POST \`/api/auth/login\`
Authenticates the user and returns access/refresh JWT tokens.
* **Payload (JSON)**:
  \`\`\`json
  {
    "email": "customer@gmail.com",
    "password": "SecurePassword123!"
  }
  \`\`\`
* **Response (200 OK)**:
  \`\`\`json
  {
    "message": "Login successful",
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
  \`\`\`

---

### 2. Billing & Payments

#### GET \`/api/customer/balance\`
Fetches billing summary and outstanding ledger balance. Requires Bearer Token.
* **Query Parameters**: \`accountNo=NW-889410\`
* **Response (200 OK)**:
  \`\`\`json
  {
    "accountNo": "NW-889410",
    "outstandingBill": 420.50,
    "lastPayment": 380.00,
    "lastPaymentDate": "2026-06-18T14:32:00Z",
    "dueDate": "2026-07-20"
  }
  \`\`\`

#### POST \`/api/payment/initiate\`
Triggers MTN Mobile Money, Airtel Money, or Zamtel push payment on the customer's phone.
* **Payload (JSON)**:
  \`\`\`json
  {
    "accountNo": "NW-889410",
    "amount": 420.50,
    "provider": "MTN",
    "phoneNo": "+260971234567"
  }
  \`\`\`
* **Response (200 OK)**:
  \`\`\`json
  {
    "message": "Payment initiated successfully. Please enter your Mobile Money PIN on your handset when prompted.",
    "reference": "MTN-TX-88390291",
    "status": "pending"
  }
  \`\`\`

---

### 3. Service Requests / Issues

#### POST \`/api/issues/create\`
Files a complaint (water leak, sewer blockage, etc.) with coordinates and optional photo attachment.
* **Payload (JSON)**:
  \`\`\`json
  {
    "accountNo": "NW-889410",
    "category": "leak",
    "description": "Heavy pipe leak pouring clean water onto Chibuluma road.",
    "imageUrl": "https://cdn.example.com/uploads/photo.jpg",
    "gpsLocation": {
      "lat": -12.8015,
      "lng": 28.2105,
      "address": "Chibuluma Road, Kitwe"
    }
  }
  \`\`\`
* **Response (210 Created)**:
  \`\`\`json
  {
    "message": "Complaint submitted successfully",
    "complaint": {
      "id": "cmp-102",
      "status": "pending",
      "createdAt": "2026-07-13T09:12:00Z"
    }
  }
  \`\`\`
`;

export const DEPLOYMENT_INSTRUCTIONS = `## Smart Water Customer App - Deployment Manual

Follow these comprehensive steps to run this application securely in production, including the containerized database, Node.js API, and static dashboards.

---

### 1. Prerequisite Environment Setup
Create a secure configuration environment file named \`.env\` in your server root directory:

\`\`\`env
# Node runtime config
PORT=3000
NODE_ENV=production

# Database Settings
DB_HOST=your-postgres-instance.gcp.net
DB_PORT=5432
DB_USER=nkanawater_db_admin
DB_PASSWORD=SuperComplexRootPassword10293#
DB_NAME=smartwater_db
DB_SSL=true

# Security Secrets (Must be 32+ characters hex)
JWT_SECRET=4fcf6a8a3ee27e8a9fbe9f977c7bcf7a884e601bf1be22fbc455dfda9810
JWT_REFRESH_SECRET=de88b48ef4ff7510d7fe2d590abcf9a3eef99fefb3765103cfde7

# Third-Party Gateway integrations
TELECOM_PAYMENT_WEBHOOK_SECRET=7f5ab120cf9e9613180fa4cb4ef7b539a
FCM_SERVER_KEY=AAAAf2b9-38B:APA91bF... (Firebase Push Credentials)
GOOGLE_MAPS_SERVER_KEY=AIzaSyA8892... (Server-side geocoding API)
\`\`\`

---

### 2. Docker Swarm / Kubernetes Containerization
Create a production orchestration template \`docker-compose.yml\` for the application stack:

\`\`\`yaml
version: '3.8'

services:
  database:
    image: postgres:14-alpine
    container_name: smartwater-postgres
    restart: always
    environment:
      POSTGRES_USER: nkanawater_db_admin
      POSTGRES_PASSWORD: SuperComplexRootPassword10293#
      POSTGRES_DB: smartwater_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nkanawater_db_admin -d smartwater_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  api-backend:
    image: nkanawater/smart-customer-api:v1.0.0
    container_name: smartwater-api-service
    restart: always
    depends_on:
      database:
        condition: service_healthy
    environment:
      - PORT=3000
      - NODE_ENV=production
      - DB_HOST=database
      - DB_PORT=5432
      - DB_USER=nkanawater_db_admin
      - DB_PASSWORD=SuperComplexRootPassword10293#
      - DB_NAME=smartwater_db
      - JWT_SECRET=4fcf6a8a3ee27e8a9fbe9f977c7bcf7a884e601bf1be22fbc455dfda9810
    ports:
      - "3000:3000"

volumes:
  pgdata:
    driver: local
\`\`\`

To boot the whole cluster in background daemon mode:
\`\`\`bash
docker-compose up -d --build
\`\`\`

---

### 3. Nginx Reverse Proxy with TLS 1.3 Encryption
Expose your microservices to the public internet securely behind Nginx:

\`\`\`nginx
# /etc/nginx/sites-available/api.nkanawater.co.zm
server {
    listen 80;
    server_name api.nkanawater.co.zm;
    return 301 https://$host$request_uri; # Force strict TLS redirection
}

server {
    listen 443 ssl http2;
    server_name api.nkanawater.co.zm;

    # SSL hardening protocols
    ssl_certificate /etc/letsencrypt/live/api.nkanawater.co.zm/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.nkanawater.co.zm/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Anti-Clickjacking headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header Content-Security-Policy "default-src 'self';";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
\`\`\`
`;

export const SECURITY_CHECKLIST = `## Smart Water Customer App - Security Testing Checklist

Use this checklist during pre-deployment staging to verify OWASP compliance, secure encryption standards, and threat prevention.

---

### 1. Authentication & Session Audits
- [ ] **Argon2 Password Hashing**: Check that plain-text passwords never touch the database. Verify that salts are random, and parameters match standard limits (\`m=65536, t=3, p=4\`).
- [ ] **JWT Key Rotation**: Verify that \`JWT_SECRET\` is a cryptographically strong 256-bit key. Ensure token expirations are appropriate (\`Access Token: 15 minutes\`, \`Refresh Token: 7 days\`).
- [ ] **Revocation Strategy**: Verify that logout calls blacklist active refresh tokens from initiating new sessions.

### 2. Transport & Infrastructure Hardening
- [ ] **Strict HTTPS redirection**: Test that port 80 traffic automatically forwards to port 443 with HSTS (HTTP Strict Transport Security) enabled.
- [ ] **SQL Injection Prevention**: Ensure all database queries utilize parameterized input binding (e.g., pg-node's \`query('SELECT * FROM users WHERE email = $1', [email])\`). No inline concatenation is permitted.
- [ ] **API Rate Limiting**: Ensure IP-based rate limiting is enabled (\`express-rate-limit\`) to prevent brute-force attacks on login/OTP endpoints (max 5 login attempts per 10 minutes).
- [ ] **XSS and Injection Sanity**: Check that response headers include \`Helmet\` middleware settings to block Cross-Site Scripting (XSS) and Content-Type sniffing.

### 3. Payment Gateway Webhook Audit (MTN, Airtel, Zamtel)
- [ ] **Callback Authenticity Check**: Confirm that callback POST inputs verify the signature/HMAC sent in request headers by the telecom API Gateway before processing account adjustments.
- [ ] **Idempotent Requests**: Confirm that the transaction ledger checks if transaction reference code (\`reference\`) already exists to prevent duplicate balance additions from multiple callback retries.
- [ ] **SSL Client Cert Validation**: Secure Webhook callbacks by validating incoming gateway IP blocks or requiring client certificate handshakes.
`;
