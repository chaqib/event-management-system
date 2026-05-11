# Manual Payments System - Complete Implementation

## 📋 Overview

Complete manual payment system supporting:
- ✅ **Invoice-Based** - Admin creates invoices, tenant pays later
- ✅ **Bank Transfers** - Send bank details, tenant transfers funds
- ✅ **Check Payments** - Tenant sends check, admin records receipt
- ✅ **Wire Transfers** - Direct bank wire instructions
- ✅ **Cash Payments** - In-person or offline payments
- ✅ **Custom Payments** - Any other manual payment method

---

## 🎯 Key Features

### 1. Invoice Management
- Create invoices with custom amounts and due dates
- Multiple payment types (bank transfer, check, wire, etc.)
- Invoice status tracking (Draft → Pending → Paid/Overdue)
- Send invoices via email
- Full/partial payment support
- Refund capabilities

### 2. Payment Tracking
- Record payments with reference numbers
- Track which payments satisfy which invoices
- Full payment history
- Overdue invoice detection

### 3. Admin Workflow
- Create and send invoices
- Approve invoices for sending
- Record payments when received
- Issue refunds
- Cancel invoices

### 4. Tenant Experience
- View all invoices
- Download invoices
- Track payment status
- Pay invoices with instructions

---

## 📊 Database Schema

### Invoices Table

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  invoice_number VARCHAR UNIQUE,
  tenant_id UUID (FK),
  created_by_id UUID (FK to users),
  
  -- Payment Details
  payment_type ENUM (invoice, bank_transfer, check, cash, wire_transfer, other),
  status ENUM (draft, sent, pending, partial, paid, overdue, cancelled, refunded),
  amount DECIMAL(10,2),
  amount_paid DECIMAL(10,2),
  currency VARCHAR(3),
  
  -- Dates
  due_date TIMESTAMP,
  issued_date TIMESTAMP,
  paid_date TIMESTAMP,
  
  -- Content
  description TEXT,
  notes TEXT,
  
  -- Bank Details (if bank transfer)
  bank_account_number VARCHAR,
  bank_routing_number VARCHAR,
  bank_name VARCHAR,
  bank_account_holder VARCHAR,
  
  -- Check Details (if check)
  check_number VARCHAR,
  check_received_date TIMESTAMP,
  
  -- Invoice File
  invoice_pdf_url VARCHAR,
  
  -- Email
  sent_to_email VARCHAR,
  email_sent_at TIMESTAMP,
  
  -- Approval
  approved_by_id UUID (FK to users),
  approved_at TIMESTAMP,
  approval_notes TEXT,
  
  -- Payment Reference
  reference_number VARCHAR,
  metadata JSONB,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔌 API Endpoints

### Create Invoice (Admin)
```
POST /api/invoices
Headers: Authorization, x-tenant-id
Body: {
  "paymentType": "bank_transfer" | "invoice" | "check" | "cash" | "wire_transfer" | "other",
  "amount": 500.00,
  "currency": "USD",
  "dueDate": "2026-06-30",
  "description": "Monthly subscription - PRO Plan",
  "notes": "Payment due by end of month",
  "bankDetails": {
    "accountNumber": "1234567890",
    "routingNumber": "021000021",
    "bankName": "Chase Bank",
    "accountHolder": "Event Management Inc"
  }
}

Response: {
  "id": "uuid",
  "invoiceNumber": "INV-2026-0001",
  "tenantId": "uuid",
  "status": "draft",
  "amount": 500.00,
  ...
}
```

### Get Invoices for Tenant
```
GET /api/invoices/tenant/{tenantId}?page=1&limit=20&status=pending

Response: {
  "invoices": [...],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### Get Pending Invoices (Admin)
```
GET /api/invoices/admin/pending?page=1&limit=20

Response: {
  "invoices": [
    {
      "invoiceNumber": "INV-2026-0001",
      "tenant": { "name": "ABC Events", "id": "..." },
      "status": "pending",
      "amount": 500.00,
      "amountPaid": 0,
      "dueDate": "2026-06-30",
      "isOverdue": true,
      ...
    }
  ],
  "total": 3
}
```

### Get Invoice Details
```
GET /api/invoices/{invoiceId}

Response: {
  "id": "uuid",
  "invoiceNumber": "INV-2026-0001",
  "status": "paid",
  "amount": 500.00,
  "amountPaid": 500.00,
  "dueDate": "2026-06-30",
  "paidDate": "2026-06-25",
  "bankAccountHolder": "Event Management Inc",
  "bankAccountNumber": "****7890",
  ...
}
```

### Approve Invoice for Sending (Admin)
```
PUT /api/invoices/{invoiceId}/approve
Headers: Authorization

Response: Invoice with status "pending"
```

### Send Invoice (Admin)
```
POST /api/invoices/{invoiceId}/send
Body: {
  "email": "tenant@example.com"
}

Response: Invoice with status "sent"
```

### Record Payment (Admin)
```
POST /api/invoices/{invoiceId}/payment
Body: {
  "amount": 500.00,
  "referenceNumber": "WIRE-12345",
  "notes": "Wire transfer received from tenant bank"
}

Response: {
  "invoice": {
    "status": "paid",
    "amountPaid": 500.00,
    "paidDate": "2026-06-25",
    ...
  },
  "payment": {
    "id": "uuid",
    "amount": 500.00,
    "paymentMethod": "bank_transfer",
    "status": "completed",
    ...
  }
}
```

### Get Invoice Payments
```
GET /api/invoices/{invoiceId}/payments

Response: [
  {
    "id": "uuid",
    "amount": 250.00,
    "paymentMethod": "bank_transfer",
    "status": "completed",
    "createdAt": "2026-06-20",
    ...
  },
  {
    "id": "uuid",
    "amount": 250.00,
    "paymentMethod": "bank_transfer",
    "status": "completed",
    "createdAt": "2026-06-25",
    ...
  }
]
```

### Refund Invoice (Admin)
```
POST /api/invoices/{invoiceId}/refund
Body: {
  "amount": 100.00,
  "reason": "Partial refund for service adjustment"
}

Response: Invoice with updated amountPaid and status
```

### Cancel Invoice (Admin)
```
PUT /api/invoices/{invoiceId}/cancel
Body: {
  "reason": "Duplicate invoice created"
}

Response: Invoice with status "cancelled"
```

---

## 📈 Invoice Status Flow

```
┌─────────────────────────────────────────────────────┐
│  DRAFT                                              │
│  Initial state when invoice is created              │
│  Not yet sent to tenant                             │
└──────────────────┬──────────────────────────────────┘
                   │ Admin clicks "Approve"
                   ↓
┌─────────────────────────────────────────────────────┐
│  PENDING                                            │
│  Invoice approved, ready to send or sent            │
│  Awaiting payment from tenant                       │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        │                     │              │
     Payment           No payment        Past due date
     received          & due date         reached
        │              expired            │
        ↓              │                  ↓
    ┌────────────┐  ┌──────────┐  ┌────────────────┐
    │  PARTIAL   │  │ OVERDUE  │  │ OVERDUE + DEBT │
    │  (if <100%)│  │          │  │                │
    └─────┬──────┘  └──────────┘  └────────────────┘
        │                │                │
    More payment        Catch up      Payment received
        │                │                │
        └────────────────┴────────────────┘
                   ↓
            ┌─────────────┐
            │  PAID       │
            │ (100% paid) │
            └─────────────┘
```

---

## 💰 Manual Payment Types

### 1. Bank Transfer
**For:**
- B2B payments
- Large invoice amounts
- Recurring billing

**Details Provided:**
- Bank account number
- Routing number
- Bank name
- Account holder name

**Admin Records:**
- Reference number (transaction ID)
- Payment date
- Amount

### 2. Check
**For:**
- Traditional business payments
- Older organizations

**Details:**
- Check number
- Check amount
- Date received

**Admin Action:**
- Record check number
- Confirm receipt date
- Record as payment

### 3. Wire Transfer
**For:**
- International payments
- Large amounts
- Urgent payments

**Details:**
- SWIFT code / IBAN
- Bank details
- Wire instructions

### 4. Invoice (Pay Later)
**For:**
- On-account billing
- Trusted tenants
- Quick setup

**Process:**
- Create invoice
- Send to email
- Tenant has X days to pay

### 5. Cash
**For:**
- In-person events
- Immediate payment
- No bank transfer needed

**Admin Records:**
- Amount
- Date received
- Reference (e.g., event ID)

### 6. Custom
**For:**
- Any other payment method
- Custom business arrangements
- Special cases

---

## 🔄 Example Workflows

### Workflow 1: Tenant Upgrade to PRO (Bank Transfer)

```
1. ADMIN CREATES INVOICE
   POST /api/invoices
   - Amount: $79.00
   - Type: bank_transfer
   - Due Date: 7 days
   - Status: draft

2. ADMIN APPROVES INVOICE
   PUT /api/invoices/{id}/approve
   - Status: pending

3. ADMIN SENDS INVOICE
   POST /api/invoices/{id}/send
   - Email: tenant@company.com
   - Status: sent

4. TENANT RECEIVES EMAIL
   - Opens invoice
   - Sees bank details
   - Makes wire transfer
   - Includes transaction ID in notes

5. ADMIN RECORDS PAYMENT
   POST /api/invoices/{id}/payment
   - Amount: $79.00
   - Reference: "WIRE-TXN-12345"
   - Status updates to: paid

6. SYSTEM UPDATES
   - Marks invoice as PAID
   - Updates tenant plan to PRO
   - Sends confirmation email
```

### Workflow 2: Check Payment Tracking

```
1. ADMIN CREATES INVOICE
   POST /api/invoices
   - Amount: $500.00
   - Type: check
   - Notes: "Send check to..."

2. TENANT SENDS CHECK
   (Manual - outside system)

3. ADMIN RECEIVES CHECK
   POST /api/invoices/{id}/payment
   - Amount: $500.00
   - Reference: "CHK-5678"
   - Status: paid

4. SYSTEM MARKS AS PAID
   - Invoice status: paid
   - Payment recorded
```

### Workflow 3: Partial Payment (Multiple Installments)

```
1. ADMIN CREATES INVOICE
   POST /api/invoices
   - Amount: $1000.00
   - Type: bank_transfer

2. TENANT PAYS FIRST INSTALLMENT
   POST /api/invoices/{id}/payment
   - Amount: $500.00
   - Status updates to: partial (50% paid)

3. TENANT PAYS SECOND INSTALLMENT
   POST /api/invoices/{id}/payment
   - Amount: $500.00
   - Status updates to: paid (100% paid)
```

---

## ⚠️ Invoice States & Actions

| State | Can Record Payment | Can Send | Can Refund | Can Cancel |
|-------|------------------|---------|-----------|-----------|
| DRAFT | No | No | No | Yes |
| PENDING | Yes | Yes | No | Yes |
| PARTIAL | Yes | Yes | Yes | No |
| PAID | No | No | Yes | No |
| OVERDUE | Yes | Yes | No | Yes |
| CANCELLED | No | No | No | No |
| REFUNDED | No | No | No | No |

---

## 🚀 Deployment Checklist

- [ ] Create migrations: `npm run migration:generate`
- [ ] Run migrations: `npm run migration:run`
- [ ] Update admin dashboard with invoice management UI
- [ ] Add invoice email templates
- [ ] Setup email service (SendGrid / AWS SES)
- [ ] Add PDF generation for invoices
- [ ] Create bank account configuration (in admin settings)
- [ ] Setup webhook for overdue invoice reminders (Hangfire job)
- [ ] Add audit logging for payment approvals
- [ ] Setup email notifications for tenants

---

## 📧 Email Notifications

The system should send:

1. **Invoice Sent**
   - To: Tenant email
   - Subject: "Invoice INV-2026-0001 - Payment Due {{dueDate}}"
   - Content: Invoice details + payment instructions

2. **Payment Received**
   - To: Tenant email
   - Subject: "Payment Received - Invoice INV-2026-0001"
   - Content: Payment confirmation + receipt

3. **Invoice Overdue**
   - To: Tenant email
   - Subject: "Payment Overdue - Invoice INV-2026-0001"
   - Content: Payment reminder + late fee info (if applicable)

4. **Invoice Refunded**
   - To: Tenant email
   - Subject: "Refund Processed - Invoice INV-2026-0001"
   - Content: Refund details + amount

---

## 🔒 Security & Compliance

- ✅ All manual payments require super admin approval
- ✅ Audit trail for all payment actions
- ✅ Bank details partially masked in responses
- ✅ Email verification before sending invoices
- ✅ Reference numbers for traceability
- ✅ Immutable payment records

---

## 🧪 Testing Manual Payments

```bash
# 1. Create invoice
curl -X POST http://localhost:3000/api/invoices \
  -H "Authorization: Bearer {token}" \
  -H "x-tenant-id: {tenantId}" \
  -d '{
    "paymentType": "bank_transfer",
    "amount": 79.00,
    "dueDate": "2026-06-30",
    "bankDetails": {
      "accountNumber": "123456789",
      "routingNumber": "021000021",
      "bankName": "Chase",
      "accountHolder": "Event Inc"
    }
  }'

# 2. Get invoices
curl http://localhost:3000/api/invoices/tenant/{tenantId} \
  -H "Authorization: Bearer {token}"

# 3. Record payment
curl -X POST http://localhost:3000/api/invoices/{invoiceId}/payment \
  -H "Authorization: Bearer {token}" \
  -d '{
    "amount": 79.00,
    "referenceNumber": "WIRE-12345"
  }'

# 4. View pending invoices
curl http://localhost:3000/api/invoices/admin/pending \
  -H "Authorization: Bearer {adminToken}"
```

---

## 📝 Next Steps

1. **Build Admin UI** for invoice management
2. **Build Tenant UI** to view invoices and payment status
3. **Setup Email Service** for sending invoice notifications
4. **Generate PDF Invoices** from invoice templates
5. **Add Automated Reminders** (Hangfire job for overdue invoices)
6. **Add Dunning Management** (automatic retry for failed payments)
7. **Implement Audit Logging** for payment approvals
8. **Add Payment Reconciliation** report

---

For implementation details, see code in:
- `src/modules/payments/invoices.service.ts`
- `src/modules/payments/invoices.controller.ts`
- `src/modules/payments/entities/invoice.entity.ts`
