# Stripe Integration - Implementation Summary

## ✅ What's Been Implemented

### Backend Services

**1. StripeService** (`src/modules/payments/stripe.service.ts`)
- Payment intent creation for bookings
- Customer management (create/update)
- Subscription creation and management
- Refunds (full and partial)
- Webhook signature verification
- Plan pricing creation

**2. PaymentsService** (Updated)
- `createPaymentIntent()` - Create Stripe payment intent for booking
- `confirmPayment()` - Confirm payment after Stripe processes it
- `failPayment()` - Handle failed payments
- `refundPayment()` - Refund completed payments
- Revenue analytics by date range

**3. SubscriptionsService** (`src/modules/tenants/subscriptions.service.ts`)
- `upgradePlan()` - Upgrade tenant to paid plan
- `downgradePlan()` - Downgrade or cancel subscription
- `handleSubscriptionRenewal()` - Auto-renewal via webhook
- `handleSubscriptionCancellation()` - Handle subscription cancellation
- `checkPlanLimits()` - Validate tenant plan limits

**4. WebhooksController** (`src/modules/payments/webhooks.controller.ts`)
- Handles Stripe webhook events
- Payment intent succeeded/failed
- Subscription events (created, renewed, deleted)
- Invoice payment events
- Charge refunded events

### API Endpoints

```
PAYMENTS:
POST   /api/payments/intent              - Create payment intent
POST   /api/payments/:id/confirm         - Confirm payment
POST   /api/payments/:id/refund          - Refund payment
GET    /api/payments/:id                 - Get payment details
GET    /api/payments/revenue/stats       - Revenue statistics
GET    /api/payments/revenue/by-date     - Revenue by date range

WEBHOOKS:
POST   /webhooks/stripe                  - Stripe webhook handler

SUBSCRIPTIONS (To be added):
PUT    /api/tenants/:id/subscription     - Upgrade plan
PUT    /api/tenants/:id/subscription/downgrade - Downgrade plan
GET    /api/tenants/:id/subscription     - Get subscription details
```

### Database Changes

**Users Table**
- Added: `stripe_customer_id` (unique, nullable)

**Payments Table** (already had these fields)
- `stripe_payment_intent_id`
- `stripe_charge_id`
- `receipt_url`
- `refund_amount`
- `refunded_at`

**Tenants Table**
- Using existing `settings` (jsonb) to store `stripeSubscriptionId`

---

## 🔧 Configuration Required

### 1. Environment Variables

Add to `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Optional: Add after creating products in Stripe
STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxx
```

### 2. Database Migration

```bash
npm run migration:generate -- AddStripeFields
npm run migration:run
```

### 3. Test Stripe Keys

Get from Stripe Dashboard → Developers → API Keys (use test keys first)

---

## 🎯 Frontend Integration Required

### 1. Payment Collection Component (for bookings)

Frontend needs to:
1. Call `POST /api/payments/intent` to get `clientSecret`
2. Use Stripe.js to collect payment details
3. Call `POST /api/payments/{paymentId}/confirm` to confirm

Example flow:
```javascript
// 1. Create payment intent
const response = await fetch('/api/payments/intent', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId },
  body: JSON.stringify({ bookingId })
});
const { paymentId, clientSecret } = await response.json();

// 2. Collect payment using Stripe Elements
const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});

// 3. Confirm payment with backend
await fetch(`/api/payments/${paymentId}/confirm`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ stripePaymentIntentId: paymentIntent.id })
});
```

### 2. Subscription Management (for plans)

Frontend needs to:
1. Show plan comparison table (Starter, Pro, Enterprise)
2. Handle upgrade/downgrade flow
3. Call subscription endpoint

Endpoints to add:
```javascript
// Upgrade to paid plan
PUT /api/tenants/:id/subscription
{ newPlan: "starter" | "pro" | "enterprise" }

// Downgrade to free trial
PUT /api/tenants/:id/subscription/downgrade
{ newPlan: "free_trial" }

// Get current subscription
GET /api/tenants/:id/subscription
```

### 3. Admin Revenue Dashboard

Already has endpoints:
```
GET /api/payments/revenue/stats
GET /api/payments/revenue/by-date?startDate=2026-05-01&endDate=2026-05-31
```

Use existing `/super-admin/billing` page to display this data.

---

## 📋 Step-by-Step Setup

### Step 1: Get Stripe Test Keys
1. Go to https://stripe.com
2. Create account and login
3. Go to Dashboard → Developers → API Keys
4. Copy **Secret Key** and **Publishable Key** (test mode)

### Step 2: Configure Backend
```bash
# Update .env with test keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# For now, leave webhook secret blank (or generate dummy)
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### Step 3: Create Products in Stripe
1. Go to Products → Create Product
2. Create "Starter Plan" - $29/month
3. Create "Pro Plan" - $79/month  
4. Create "Enterprise Plan" - Custom pricing
5. Copy Price IDs to `.env`:
   - STRIPE_PRICE_STARTER=price_...
   - STRIPE_PRICE_PRO=price_...
   - STRIPE_PRICE_ENTERPRISE=price_...

### Step 4: Test Payment Intent
```bash
# Get auth token by logging in
# Then test creating payment intent
curl -X POST http://localhost:3000/api/payments/intent \
  -H "Authorization: Bearer {token}" \
  -H "x-tenant-id: {tenantId}" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "{bookingId}"}'

# Should return: { paymentId, clientSecret, amount }
```

### Step 5: Build Frontend Payment Form
Implement Stripe.js integration in booking checkout flow

### Step 6: Setup Webhook (for production)
1. Use ngrok locally or update domain in production
2. Go to Webhooks → Add Endpoint
3. URL: https://yourdomain.com/webhooks/stripe
4. Select events (see webhook handlers in code)
5. Copy webhook secret to .env

---

## 🧪 Testing

### Test Card Numbers

In Stripe test mode, use:
- ✅ Success: `4242 4242 4242 4242`
- ❌ Fail: `4000 0000 0000 0002`
- 📍 Auth Required: `4000 2500 0000 0003`

Expiry: Any future date (12/25)
CVC: Any 3 digits (123)

### Manual Testing

```bash
# 1. Login to get token
POST /api/auth/login
{ "email": "user@example.com", "password": "..." }

# 2. Create booking
POST /api/bookings
{ "eventId": "...", "ticketTypeId": "...", "quantity": 1 }

# 3. Create payment intent
POST /api/payments/intent
{ "bookingId": "..." }

# 4. Confirm payment
POST /api/payments/{paymentId}/confirm
{ "stripePaymentIntentId": "pi_..." }
```

---

## 📊 Data Flow

### Booking Payment Flow
```
Frontend                    Backend                    Stripe
                        
User clicks "Pay"
    |
    +--POST /payments/intent
                |
                +--Create Stripe Customer (if new)
                |
                +--Create Payment Intent
                |
                +--Return clientSecret
    |
    +<--clientSecret
    |
Collect card details
    |
    +--confirmCardPayment(clientSecret)
                                            |
                                            +--Process payment
                                            |
                                            +--Return paymentIntent
    |
    +<--paymentIntent (succeeded)
    |
    +--POST /payments/:id/confirm
                |
                +--Verify with Stripe
                |
                +--Update booking status
                |
                +--Return success
    |
    +<--success
    |
Show confirmation
```

### Subscription Billing Flow
```
Tenant upgrades plan
    |
    +--PUT /tenants/:id/subscription
                |
                +--Create Stripe Customer (if new)
                |
                +--Create Subscription
                |
                +--Update tenant plan/limits
    |
    +<--subscriptionId
    |
Monthly charge happens automatically
                        (Stripe)
    |
    +<--Webhook: invoice.payment_succeeded
                |
                +--Update tenant subscription dates
```

---

## 🚀 Next Steps

1. **Test payment intents** with test Stripe account
2. **Build frontend** payment collection component
3. **Add subscription endpoints** to tenants controller
4. **Build plan upgrade UI** in tenant dashboard
5. **Setup webhook** for production domain
6. **Create subscription renewal job** (Hangfire) for edge cases
7. **Implement dunning** (failed payment retry logic)
8. **Add email notifications** for payment events

---

## ⚠️ Important Notes

- 🔒 **Never expose STRIPE_SECRET_KEY** in frontend code
- ✅ **Always verify webhook signatures** (done automatically)
- 📍 **Use idempotency keys** to prevent double-charges (Stripe SDK handles this)
- 🔄 **Webhooks are idempotent** - safe to retry on failure
- 💾 **Store subscription ID** in tenant.settings for future operations
- 📧 **Implement email notifications** for payment failures

---

For detailed Stripe documentation, see: [STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md)
