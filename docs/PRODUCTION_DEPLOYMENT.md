# ResumePro AI — Production Architecture & Firebase + YouPI-PG Deployment Guide

## 1. System Integration Architecture

ResumePro AI separates the **Next.js 15 Frontend**, **Next.js Server API / Firebase Admin Backend**, and the **YouPI-PG Open-Source Payment Service**:

```
┌───────────────────────────┐
│   Next.js 15 Frontend     │
│  (/checkout, /dashboard,  │
│   /admin, /success)       │
└─────────────┬─────────────┘
              │ HTTPS JSON (never exposes merchant keys)
              ▼
┌───────────────────────────────────────────┐
│     Next.js Server Routes + Services      │
│  - src/lib/payments/payment-service.ts    │
│  - src/lib/payments/subscription-service  │
│  - src/lib/payments/invoice-service.ts    │
│  - src/lib/payments/email-service.ts      │
│  - src/lib/payments/store.ts              │
└───────┬──────────────────────────┬────────┘
        │                          │ Server-to-Server REST + HMAC-SHA256 Webhooks
        ▼                          ▼
┌───────────────────┐    ┌──────────────────────────┐
│ Firebase Backend  │    │  YouPI-PG Payment Service│
│ - Firestore       │    │  - Payment API (:6100)   │
│ - Firebase Auth   │    │  - Hosted UI (:7000)     │
│ - Firebase Storage│    │  - Admin Portal (:6001)  │
│ - App Hosting     │    └──────────────────────────┘
└───────────────────┘
```

### Automatic Fallback Chain
When YouPI-PG is unreachable or fails health verification (`YOUPI_API_URL`), `/api/payments/create-session` and `/api/payments/status` automatically signal the checkout UI to enable fallback options:
1. **Razorpay Fallback** (`POST /api/payments/fallback` with `razorpay-create` + `razorpay-verify` HMAC verification)
2. **Manual UPI QR Payment** (`POST /api/payments/fallback` with `manual-upi-submit` UTR capture -> `Processing` -> Admin Reconciliation)

---

## 2. Firestore Database Schema & Security

Collections created in Cloud Firestore (with local JSON store fallback at `.data/payments-store.json` when Firebase Admin credentials are omitted in development):

| Collection | Document ID | Key Fields | Client Access |
| :--- | :--- | :--- | :--- |
| `payments` | `<orderId>` | `orderId`, `gatewayPaymentId`, `userId`, `customerEmail`, `plan`, `amountInr`, `provider`, `status` (`Pending`\|`Processing`\|`Success`\|`Failed`\|`Refunded`\|`Expired`), `settlementState`, `utr`, `invoiceId`, `expiresAt` | Owner Read (`userId == auth.uid` or `customerEmail == auth.token.email`), **Server Write Only** |
| `subscriptions` | `sub-<userId>` | `userId`, `userEmail`, `plan` (`free`\|`pro`\|`premium`), `status`, `provider`, `latestOrderId`, `currentPeriodStart`, `currentPeriodEnd`, `removeBrandingEnabled` | Owner Read, **Server Write Only** |
| `invoices` | `inv-<orderId>` | `invoiceNumber`, `orderId`, `paymentId`, `userId`, `subtotalInr`, `taxInr`, `totalInr`, `utr`, `status` (`Paid`\|`Pending Verification`\|`Refunded`), `issuedAt` | Owner Read, **Server Write Only** |
| `payment_logs` | `<logId>` | `orderId`, `paymentId`, `event`, `level` (`info`\|`warn`\|`error`\|`security`), `provider`, `message`, `metadata`, `timestamp` | Admin Read Only, **Server Write Only** |
| `processed_webhook_deliveries` | `<deliveryId>` | `deliveryId`, `processedAt` | No Client Access (**Server Idempotency Store**) |

Rules & indexes are defined in `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.

---

## 3. Webhook & Payment Security Controls

1. **HMAC-SHA256 Webhook Signature Verification** (`src/app/api/payments/webhook/route.ts`):
   - Validates `X-Gateway-Signature-V2` against `HMAC-SHA256(YOUPI_WEBHOOK_SECRET, "<timestamp>.<rawBody>")` using `crypto.timingSafeEqual`.
   - Falls back to `X-Gateway-Signature` over raw request body when V2 is absent.
2. **Replay-Attack Protection**:
   - Rejects webhook deliveries whose `X-Gateway-Timestamp` deviates more than 60 minutes.
   - Deduplicates `X-Gateway-Delivery-Id` inside `processed_webhook_deliveries`.
3. **Amount & Currency Tamper Guard**:
   - Compares webhook / polling `amount` and `currency` strictly against the server-stored `PaymentRecord`. Mismatches log a `security`-level event and halt subscription activation.
4. **Duplicate Order Prevention**:
   - Active non-expired `Pending`/`Processing` sessions for the same email + tier are resumed automatically instead of creating duplicate pending charges.

---

## 4. Environment Configuration Checklist

Populate `.env.local` (or Firebase App Hosting secrets via `apphosting.yaml`):

```bash
# Site & YouPI-PG
NEXT_PUBLIC_SITE_URL=https://your-domain.web.app
YOUPI_API_URL=https://payments-api.your-domain.com
YOUPI_CHECKOUT_URL=https://checkout.your-domain.com
YOUPI_MERCHANT_ID=00000000-0000-0000-0000-000000000001
YOUPI_MERCHANT_API_KEY=<secret>
YOUPI_WEBHOOK_SECRET=<secret>
YOUPI_PAYEE_VPA=merchant@upi

# Firebase Client & Admin SDK
NEXT_PUBLIC_FIREBASE_API_KEY=<key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app_id>
FIREBASE_PROJECT_ID=<project>
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Fallback Payment Gateways & Email
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_MANUAL_UPI_VPA=resumepro@upi
RESEND_API_KEY=
EMAIL_FROM=billing@resumepro.ai
```

---

## 5. Production Deployment Commands

1. **Authenticate & select Firebase project:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use <your-firebase-project-id>
   ```
2. **Deploy Firestore rules, indexes, Storage rules, and Next.js SSR Hosting:**
   ```bash
   firebase experiments:enable webframeworks
   firebase deploy --only firestore,storage,hosting
   ```
3. **Configure YouPI-PG Production Webhook URL:**
   Set your YouPI-PG merchant `webhookUrl` to `https://<your-domain>/api/payments/webhook` and update `CHECKOUT_FRAME_ANCESTORS` and `YOUPI_ALLOWED_RETURN_ORIGINS` to your production domain.

---

## 6. Compliance Disclaimer

The checkout, invoice PDF, and confirmation pages display the required infrastructure disclosure:

> "This payment system uses open-source payment infrastructure. Payments are subject to banking and UPI network availability."
