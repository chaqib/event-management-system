# Manual Payments Implementation Summary

## ✅ What's Been Implemented

### Backend Services

**1. InvoicesService** (`src/modules/payments/invoices.service.ts`)
Core service handling all invoice operations:
- `createInvoice()` - Create new invoices with payment type and amounts
- `sendInvoice()` - Send invoice to tenant email
- `recordPayment()` - Record payment (full or partial)
- `approveSendInvoice()` - Approve invoice before sending
- `cancelInvoice()` - Cancel an invoice
- `refundInvoice()` - Issue full or partial refunds
- `updateOverdueInvoices()` - Mark invoices past due date as overdue
- `getTenantInvoices()` - Get invoices for specific tenant
- `getPendingInvoices()` - Get all pending/overdue invoices (admin)

**2. Invoice Entity** (`src/modules/payments/entities/invoice.entity.ts`)
Database model for invoices with:
- Invoice number (auto-generated: INV-2026-0001)
- Payment types: Bank Transfer, Check, Wire, Cash, Invoice, Other
- Status tracking: Draft → Pending → Paid/Overdue
- Bank details for wire transfers
- Check number tracking
- Due date and payment tracking
- Admin approval workflow
- Metadata for custom data

**3. InvoicesController** (`src/modules/payments/invoices.controller.ts`)
REST API endpoints:
- `POST /api/invoices` - Create invoice (admin)
- `GET /api/invoices/tenant/:id` - Get tenant invoices
- `GET /api/invoices/admin/pending` - Get pending invoices (admin)
- `GET /api/invoices/:id` - Get invoice details
- `GET /api/invoices/:id/payments` - Get payment history
- `POST /api/invoices/:id/send` - Send to email (admin)
- `PUT /api/invoices/:id/approve` - Approve invoice (admin)
- `POST /api/invoices/:id/payment` - Record payment (admin)
- `PUT /api/invoices/:id/cancel` - Cancel invoice (admin)
- `POST /api/invoices/:id/refund` - Issue refund (admin)

### Database

**New Table: invoices**
- 30+ columns tracking all invoice details
- Foreign keys to tenants, users
- JSONB metadata field
- Indexes on: tenantId, status, dueDate
- Complete audit trail (created_at, updated_at)

---

## 🎯 Payment Types Supported

| Type | Use Case | Details |
|------|----------|---------|
| **Invoice** | Pay-later billing | Send invoice, tenant pays by due date |
| **Bank Transfer** | ACH/wire transfers | Show bank account details |
| **Check** | Check payments | Track check number |
| **Wire Transfer** | International/urgent | Wire instructions + SWIFT/IBAN |
| **Cash** | In-person payments | Reference number tracking |
| **Custom** | Custom arrangements | Flexible for special cases |

---

## 📊 Invoice Status Flow

```
DRAFT (new)
  ↓ [Admin approves]
PENDING (ready to send/sent)
  ├─→ PAID (if payment = amount)
  ├─→ PARTIAL (if payment < amount)
  └─→ OVERDUE (if past due date)
  ↓ [Admin records payment]
PAID or PARTIALLY_REFUNDED
  ↓ [Admin issues refund]
REFUNDED or CANCELLED
```

---

## 🔧 Setup Steps

### Step 1: Run Migration
```bash
cd backend
npm run migration:generate -- CreateInvoicesTable
npm run migration:run
```

This creates the `invoices` table with all necessary columns and indexes.

### Step 2: Module Registration
Already updated in `payments.module.ts`:
- ✅ Invoice entity imported
- ✅ InvoicesService provider added
- ✅ InvoicesController added
- ✅ Exports configured

### Step 3: Environment Variables (Optional)
Add to `.env` for email configuration:
```bash
# Email for invoice notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@eventms.com

# Stripe (for webhook payment notifications)
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx
```

---

## 💼 Real-World Examples

### Example 1: Monthly Subscription Invoice

```javascript
// Admin creates invoice for tenant upgrading to PRO
POST /api/invoices
{
  "tenantId": "tenant-123",
  "paymentType": "bank_transfer",
  "amount": 79.00,
  "currency": "USD",
  "dueDate": "2026-06-30",
  "description": "Monthly PRO Subscription",
  "notes": "Auto-renewal on next month",
  "bankDetails": {
    "accountNumber": "1234567890",
    "routingNumber": "021000021",
    "bankName": "Chase Bank",
    "accountHolder": "Event Management Inc"
  }
}

// Returns: INV-2026-0001 (status: DRAFT)

// Admin approves
PUT /api/invoices/INV-2026-0001/approve

// Admin sends
POST /api/invoices/INV-2026-0001/send
{ "email": "accountant@tenant.com" }

// Tenant receives email with:
// - Invoice details
// - Bank account to wire to
// - Due date
// - Reference number to include

// Tenant wires $79.00 with reference

// Admin receives notification, records payment
POST /api/invoices/INV-2026-0001/payment
{
  "amount": 79.00,
  "referenceNumber": "WIRE-TX-12345"
}

// Invoice automatically marked as PAID
// Tenant plan upgraded
```

### Example 2: Payment Plan (Installments)

```javascript
// Large amount split into payments
POST /api/invoices
{
  "tenantId": "big-tenant",
  "paymentType": "bank_transfer",
  "amount": 1000.00,
  "dueDate": "2026-07-31"
}

// First payment (half)
POST /api/invoices/INV-2026-0002/payment
{
  "amount": 500.00,
  "referenceNumber": "WIRE-1"
}
// Status: PARTIAL (50% paid)

// Second payment (remaining)
POST /api/invoices/INV-2026-0002/payment
{
  "amount": 500.00,
  "referenceNumber": "WIRE-2"
}
// Status: PAID (100% paid)
```

### Example 3: Check Payment Tracking

```javascript
// Create invoice expecting check
POST /api/invoices
{
  "paymentType": "check",
  "amount": 500.00,
  "description": "Annual subscription"
}

// Tenant mails check #12345
// Admin receives check in mail

// Admin records check payment
POST /api/invoices/INV-2026-0003/payment
{
  "amount": 500.00,
  "referenceNumber": "CHK-12345"
}

// If need to refund
POST /api/invoices/INV-2026-0003/refund
{
  "amount": 100.00,
  "reason": "Service adjustment"
}
// Status: PARTIALLY_REFUNDED
```

---

## 🔐 Admin Approval Workflow

All manual payments go through admin approval:

```
1. ADMIN Creates Invoice
   - Specifies tenant
   - Sets amount, due date
   - Chooses payment type
   - Status: DRAFT

2. ADMIN Reviews & Approves
   - Reviews details
   - Approves for sending
   - Status: PENDING

3. ADMIN Sends Invoice
   - System sends email
   - Includes payment instructions
   - Tenant receives details

4. TENANT Makes Payment
   - (Outside system - wire, check, etc.)

5. ADMIN Records Payment
   - Enters amount paid
   - Includes reference number
   - System marks PAID
   - Updates tenant plan
   - Sends confirmation email
```

---

## 📈 Admin Dashboard Additions

The admin billing page should display:

1. **Pending Invoices**
   - List of unpaid/overdue invoices
   - Due dates
   - Amount owed
   - Quick action buttons

2. **Invoice Management**
   - Create new invoice
   - Send invoice
   - Record payment
   - Issue refund
   - Cancel invoice

3. **Payment History**
   - All payments received
   - Reference numbers
   - Dates
   - Amounts

---

## 🔄 Integration Points

### With Stripe Integration
- Stripe payments go to regular `payments` table
- Manual payments also go to `payments` table
- Both tracked together in payment history
- Revenue reporting includes both types

### With Tenant Module
- Tenant status updates when invoice paid
- Plan upgrades when payment recorded
- Billing history available to tenants

### With Booking Module
- Can create invoice for booking deposit
- Can charge booking fee manually
- Refunds available for cancelled bookings

---

## 📋 Testing Checklist

- [ ] Create invoice with bank details
- [ ] Create invoice with check type
- [ ] Approve and send invoice
- [ ] Record full payment
- [ ] Record partial payment
- [ ] Record second payment (complete)
- [ ] View tenant invoices
- [ ] View pending invoices (admin)
- [ ] Issue refund
- [ ] Cancel invoice
- [ ] Mark as overdue automatically
- [ ] Get payment history

---

## 🚀 Frontend Development

Admin needs to build:

1. **Invoice Management Page**
   - Create invoice form
   - Invoice list with filters
   - Invoice details view
   - Send invoice button
   - Record payment modal
   - Refund button
   - Cancel button

2. **Pending Invoices Dashboard**
   - Show all unpaid/overdue
   - Sort by due date
   - Quick payment recording
   - Overdue indicator

3. **Payment History**
   - View all payments for invoice
   - Show reference numbers
   - Download receipts

4. **Tenant View**
   - View my invoices
   - Download invoice PDF
   - See payment instructions
   - Track payment status

---

## 💾 Database Queries

```sql
-- Get all pending invoices for a tenant
SELECT * FROM invoices 
WHERE tenant_id = 'uuid' 
AND status = 'pending' 
ORDER BY due_date ASC;

-- Get overdue invoices
SELECT * FROM invoices 
WHERE due_date < NOW() 
AND status IN ('pending', 'partial');

-- Get revenue by payment type
SELECT payment_type, SUM(amount) as total
FROM invoices 
WHERE status IN ('paid', 'partial')
GROUP BY payment_type;

-- Get payment history for invoice
SELECT p.* FROM payments p
WHERE p.metadata->>'invoiceId' = 'invoice-uuid'
ORDER BY p.created_at DESC;
```

---

## 📝 Notes

- Invoice numbers are auto-generated (INV-2026-0001)
- All payments are recorded in the main `payments` table
- Metadata links payments back to invoices
- Status changes are tracked in database history
- Email sending integrated with your email service
- Overdue detection runs automatically
- Full audit trail of all actions

---

## 🔗 Related Files

- `src/modules/payments/invoices.service.ts` - Business logic
- `src/modules/payments/invoices.controller.ts` - API endpoints
- `src/modules/payments/entities/invoice.entity.ts` - Database model
- `src/modules/payments/dto/invoice.dto.ts` - Request/response DTOs
- `src/migrations/1685000000000-CreateInvoicesTable.ts` - Migration

For detailed API documentation, see: [MANUAL_PAYMENTS_SYSTEM.md](./MANUAL_PAYMENTS_SYSTEM.md)
