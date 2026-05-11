# Stripe Integration Guide

Complete Stripe integration for the Event Management System, including one-time bookings payments and recurring subscription billing.

## 📋 Overview

The system supports:
- ✅ One-time booking payments (attendees paying for tickets)
- ✅ Monthly/yearly subscription billing (tenants paying for plans)
- ✅ Automatic webhook handling for payment events
- ✅ Refunds and partial refunds
- ✅ Plan upgrades/downgrades
- ✅ Dunning management (failed payments)

---

## 🔑 Stripe Setup

### Step 1: Create Stripe Account
1. Go to https://stripe.com and create an account
2. Enable the account (it will be in test mode by default - perfect for development)
3. Go to Dashboard → Developers → API Keys
4. Copy your **Secret Key** and **Publishable Key**

### Step 2: Create Products & Prices

For **subscription plans**, create these products in Stripe Dashboard:

```
Dashboard → Products → Create Product
```

**Starter Plan**
- Name: `Starter Plan`
- Price: $29/month
- Billing: Monthly recurring
- Copy the Price ID (looks like: `price_xxxxxxxxxxxxx`)

**Pro Plan**
- Name: `Pro Plan`
- Price: $79/month
- Billing: Monthly recurring
- Copy the Price ID

**Enterprise Plan**
- Name: `Enterprise Plan`
- Price: Custom (setup separately with customers)
- Copy the Price ID

### Step 3: Configure Environment Variables

Update `.env` with your Stripe keys:

```bash
# Backend/.env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx (get this after setting up webhook)

# Optional: Price IDs (after creating products)
STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Setup Webhook

Stripe needs to notify your server of payment events.

1. Go to **Developers → Webhooks**
2. Add Endpoint:
   - URL: `https://yourdomain.com/webhooks/stripe`
   - (For local testing: use ngrok to expose local port)
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `charge.refunded`
4. Copy the **Webhook Secret** and add to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## 💳 Payment Flow for Bookings

### User Books a Ticket

```
1. User selects event and ticket
2. Frontend calls: POST /api/payments/intent
   {
     "bookingId": "uuid",
     "tenantId": "uuid"
   }
3. Backend:
   - Creates Stripe Customer if needed
   - Creates Payment Intent
   - Returns: { paymentId, clientSecret, amount }
4. Frontend collects payment using Stripe Elements/Payment Request
5. Frontend confirms payment:
   POST /api/payments/{paymentId}/confirm
   {
     "stripePaymentIntentId": "pi_xxxxx"
   }
6. Backend verifies payment with Stripe
7. Booking status → CONFIRMED
8. Webhook confirms payment status
```

### API Endpoints

```
POST /api/payments/intent
- Creates Stripe Payment Intent
- Returns: { paymentId, clientSecret, amount }
- Auth: Required (user must be logged in)

POST /api/payments/{id}/confirm
- Confirms payment after Stripe processes it
- Body: { stripePaymentIntentId: "pi_xxxxx" }
- Auth: Required

POST /api/payments/{id}/refund
- Refunds a completed payment
- Body: { amount?: 50.00 } (optional for partial refund)
- Auth: Required (owner only)

GET /api/payments/revenue/stats
- Get total revenue statistics
- Auth: Required (admin only)

GET /api/payments/revenue/by-date?startDate=2026-05-01&endDate=2026-05-31
- Get revenue breakdown by date
- Auth: Required (admin only)
```

---

## 🔄 Subscription Flow for Plan Billing

### Tenant Upgrades to Paid Plan

```
1. Tenant on FREE_TRIAL (14 days)
2. Trial expires or tenant manually upgrades
3. Tenant selects plan: STARTER | PRO | ENTERPRISE
4. Frontend sends: PUT /api/tenants/{id}/subscription
   {
     "newPlan": "starter",
     "paymentMethodId": "pm_xxxxx" (optional)
   }
5. Backend:
   - Creates Stripe Subscription
   - Updates tenant plan & limits
   - Stores subscription ID in tenant.settings
6. Stripe charges subscription fee monthly
7. Webhook notifies of renewal
8. If payment fails → dunning process (retry or suspend)
```

### Subscription Endpoints (To Be Created)

```
PUT /api/tenants/{id}/subscription
- Upgrade to paid plan
- Body: { newPlan: "starter" | "pro" | "enterprise" }
- Returns: { tenant, subscriptionId }

PUT /api/tenants/{id}/subscription/downgrade
- Downgrade plan or cancel subscription
- Body: { newPlan: "free_trial" }

GET /api/tenants/{id}/subscription
- Get current subscription details
- Returns: subscription info + next billing date
```

---

## 🪝 Webhook Handlers

Stripe automatically notifies your server of events.

### Handled Events

```typescript
payment_intent.succeeded
- User paid for booking
- Confirm payment & booking

payment_intent.payment_failed
- Payment declined or failed
- Mark payment as failed
- Notify user

customer.subscription.updated
- Subscription renewed or modified
- Update tenant subscription end date

customer.subscription.deleted
- Subscription cancelled
- Revert tenant to FREE_TRIAL

invoice.payment_succeeded
- Monthly subscription charged successfully
- Update revenue records

invoice.payment_failed
- Subscription payment failed
- Implement dunning (retry or suspend)
```

All webhooks are handled in: `src/modules/payments/webhooks.controller.ts`

---

## 💰 Billing Models

### One-Time Payment (Bookings)
```
Ticket Price: $100
Platform Fee: 3% (for PRO plan)
Stripe Fee: 2.9% + $0.30

Total Charged to Customer: $100.00
Platform Keeps: $100 - $2.90 - $0.30 = $96.80
Tenant Gets: $97 (after platform fee: $100 * 3% = $3)
```

### Recurring Billing (Subscriptions)
```
STARTER: $29/month
- Max 10 events
- Max 500 attendees per event
- Max 3 team members
- Platform fee: 3%

PRO: $79/month
- Max 50 events
- Max 5000 attendees per event
- Max 10 team members
- Platform fee: 2%

ENTERPRISE: Custom pricing
- Unlimited everything
- Platform fee: 1%
```

---

## 🛠️ Testing

### Test Stripe Cards

In **test mode**, use these card numbers to simulate different scenarios:

```
✅ Success: 4242 4242 4242 4242
❌ Fail: 4000 0000 0000 0002
⚠️ Require Auth: 4000 2500 0000 0003
🔄 Declined: 4000 0000 0000 9995
```

Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)

### Local Testing with ngrok

For webhook testing locally:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Go to Stripe Dashboard → Webhooks
# Update URL to: https://abc123.ngrok.io/webhooks/stripe
# Test webhook: Stripe Dashboard → Webhooks → Send Test Event
```

### Manual API Testing

```bash
# Create payment intent
curl -X POST http://localhost:3000/api/payments/intent \
  -H "Authorization: Bearer {token}" \
  -H "x-tenant-id: {tenantId}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "uuid-of-booking"
  }'

# Confirm payment
curl -X POST http://localhost:3000/api/payments/{paymentId}/confirm \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "stripePaymentIntentId": "pi_xxxxx"
  }'

# Get revenue stats
curl -X GET http://localhost:3000/api/payments/revenue/stats \
  -H "Authorization: Bearer {admin-token}"
```

---

## 📊 Database Changes

### New Columns Added

**users table**
```sql
- stripe_customer_id: string (unique, nullable)
```

**payments table** (already had these)
```sql
- stripe_payment_intent_id: string
- stripe_charge_id: string
- receipt_url: string (for invoice links)
```

**tenants table**
```sql
- settings column (jsonb) stores stripeSubscriptionId
```

### Migration

```bash
npm run migration:generate -- AddStripeFields
npm run migration:run
```

---

## 🔒 Security Considerations

1. **API Keys**: Never expose STRIPE_SECRET_KEY in frontend code
2. **Webhook Verification**: Always verify webhook signatures
3. **Idempotency**: Webhook handlers are idempotent (safe to retry)
4. **PCI Compliance**: Never handle raw card data (use Stripe.js)
5. **Rate Limiting**: Implement rate limits on payment endpoints

---

## 📝 Logging

All Stripe operations are logged:
- ✅ `StripeService`: Low-level Stripe API calls
- ✅ `PaymentsService`: Payment creation/confirmation
- ✅ `SubscriptionsService`: Plan upgrades/downgrades
- ✅ `WebhooksController`: Webhook events

Check logs in: `console` or log aggregation service (e.g., DataDog)

---

## 🚀 Deployment Checklist

- [ ] Switch to live Stripe API keys in production
- [ ] Update webhook URL to production domain
- [ ] Enable 3D Secure / SCA for enhanced security
- [ ] Setup email notifications for failed payments
- [ ] Configure dunning strategy (retry logic)
- [ ] Test subscription renewal on live (small amount)
- [ ] Setup monitoring for webhook failures
- [ ] Document refund policy and procedure
- [ ] Enable Stripe radar for fraud detection

---

## ❓ FAQ

**Q: How do I handle failed payments?**
A: The `handleInvoicePaymentFailed` webhook implements dunning. Stripe retries automatically, or you can implement custom retry logic.

**Q: Can I offer discounts?**
A: Yes, create coupon codes in Stripe and apply them when creating subscriptions.

**Q: How do I prevent double-charging?**
A: Use Stripe's idempotency keys (built into SDK) and webhook deduplication.

**Q: What about taxes/VAT?**
A: Use Stripe Tax integration or handle separately in application logic.

**Q: How do I offer free trials?**
A: Use Stripe's trial period feature when creating subscriptions.

---

## 📚 Resources

- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Payment Intents API: https://stripe.com/docs/payments/payment-intents
- Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
- Webhooks: https://stripe.com/docs/webhooks
