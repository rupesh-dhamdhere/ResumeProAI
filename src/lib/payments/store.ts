import fs from "node:fs";
import path from "node:path";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type {
  InvoiceRecord,
  PaymentLogRecord,
  PaymentRecord,
  SubscriptionRecord,
} from "@/types/payment";

interface LocalPaymentStoreState {
  payments: PaymentRecord[];
  subscriptions: SubscriptionRecord[];
  invoices: InvoiceRecord[];
  paymentLogs: PaymentLogRecord[];
  processedDeliveryIds: string[];
}

const STORE_FILE = path.join(process.cwd(), ".data", "payments-store.json");

const SEED_STATE: LocalPaymentStoreState = {
  payments: [
    {
      id: "pay-seed-001",
      orderId: "RPA-PRO-SEED01",
      gatewayPaymentId: "c7942127-14e3-469a-9e4a-9359a16f903a",
      userId: "usr-alex",
      customerName: "Alex Rivera",
      customerEmail: "alex.rivera@example.com",
      customerPhone: "9876543210",
      plan: "pro",
      amountInr: 749,
      amountFormatted: "749.00",
      amountUsd: "$9/mo",
      currency: "INR",
      provider: "youpi-pg",
      status: "Success",
      rawGatewayStatus: "RECONCILED",
      settlementState: "RECONCILED",
      upiUri:
        "upi://pay?pa=merchant@upi&pn=ResumePro%20AI&am=749.00&cu=INR&tn=RPA-PRO-SEED01",
      utr: "431298765432",
      invoiceId: "inv-seed-001",
      emailSent: true,
      reconciledBy: "admin@resumepro.ai",
      reconciledAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ],
  subscriptions: [
    {
      id: "sub-usr-alex",
      userId: "usr-alex",
      userEmail: "alex.rivera@example.com",
      userName: "Alex Rivera",
      plan: "pro",
      status: "active",
      provider: "youpi-pg",
      latestOrderId: "RPA-PRO-SEED01",
      latestPaymentId: "pay-seed-001",
      amountInr: 749,
      currentPeriodStart: new Date(
        Date.now() - 1000 * 60 * 60 * 48
      ).toISOString(),
      currentPeriodEnd: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 28
      ).toISOString(),
      removeBrandingEnabled: true,
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ],
  invoices: [
    {
      id: "inv-seed-001",
      invoiceNumber: "INV-2026-0001",
      orderId: "RPA-PRO-SEED01",
      paymentId: "pay-seed-001",
      userId: "usr-alex",
      customerName: "Alex Rivera",
      customerEmail: "alex.rivera@example.com",
      plan: "pro",
      description: "ResumePro AI — Pro Monthly Subscription",
      subtotalInr: 634.75,
      taxInr: 114.25,
      totalInr: 749,
      currency: "INR",
      utr: "431298765432",
      provider: "youpi-pg",
      status: "Paid",
      issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ],
  paymentLogs: [
    {
      id: "log-seed-001",
      orderId: "RPA-PRO-SEED01",
      paymentId: "pay-seed-001",
      event: "PAYMENT_RECONCILED",
      level: "info",
      provider: "youpi-pg",
      message:
        "Payment verified with UTR 431298765432, Pro subscription activated, and invoice INV-2026-0001 issued.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ],
  processedDeliveryIds: [],
};

function readLocalStore(): LocalPaymentStoreState {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
      fs.writeFileSync(STORE_FILE, JSON.stringify(SEED_STATE, null, 2));
      return JSON.parse(JSON.stringify(SEED_STATE)) as LocalPaymentStoreState;
    }
    return JSON.parse(
      fs.readFileSync(STORE_FILE, "utf8")
    ) as LocalPaymentStoreState;
  } catch {
    return JSON.parse(JSON.stringify(SEED_STATE)) as LocalPaymentStoreState;
  }
}

function writeLocalStore(state: LocalPaymentStoreState): void {
  try {
    fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2));
  } catch {
    // non-fatal on read-only FS
  }
}

export async function savePaymentRecord(record: PaymentRecord): Promise<void> {
  const firestore = getAdminFirestore();
  if (firestore) {
    await firestore
      .collection("payments")
      .doc(record.orderId)
      .set(record, { merge: true });
  }
  const state = readLocalStore();
  const idx = state.payments.findIndex((p) => p.orderId === record.orderId);
  if (idx >= 0) state.payments[idx] = record;
  else state.payments.unshift(record);
  writeLocalStore(state);
}

export async function getPaymentByOrderId(
  orderId: string
): Promise<PaymentRecord | null> {
  const firestore = getAdminFirestore();
  if (firestore) {
    const snap = await firestore.collection("payments").doc(orderId).get();
    if (snap.exists) return snap.data() as PaymentRecord;
  }
  const state = readLocalStore();
  return state.payments.find((p) => p.orderId === orderId) || null;
}

export async function getPaymentByGatewayId(
  gatewayPaymentId: string
): Promise<PaymentRecord | null> {
  const firestore = getAdminFirestore();
  if (firestore) {
    const snap = await firestore
      .collection("payments")
      .where("gatewayPaymentId", "==", gatewayPaymentId)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].data() as PaymentRecord;
  }
  const state = readLocalStore();
  return (
    state.payments.find((p) => p.gatewayPaymentId === gatewayPaymentId) || null
  );
}

export async function listPayments(
  userEmail?: string
): Promise<PaymentRecord[]> {
  const firestore = getAdminFirestore();
  if (firestore) {
    const base = firestore.collection("payments");
    const snap = userEmail
      ? await base
          .where("customerEmail", "==", userEmail)
          .orderBy("createdAt", "desc")
          .limit(50)
          .get()
      : await base.orderBy("createdAt", "desc").limit(100).get();
    return snap.docs.map((d) => d.data() as PaymentRecord);
  }
  const state = readLocalStore();
  return userEmail
    ? state.payments.filter(
        (p) => p.customerEmail.toLowerCase() === userEmail.toLowerCase()
      )
    : state.payments;
}

export async function saveSubscriptionRecord(
  sub: SubscriptionRecord
): Promise<void> {
  const firestore = getAdminFirestore();
  if (firestore) {
    await firestore
      .collection("subscriptions")
      .doc(sub.userId)
      .set(sub, { merge: true });
  }
  const state = readLocalStore();
  const idx = state.subscriptions.findIndex(
    (s) =>
      s.userId === sub.userId ||
      s.userEmail.toLowerCase() === sub.userEmail.toLowerCase()
  );
  if (idx >= 0) state.subscriptions[idx] = sub;
  else state.subscriptions.unshift(sub);
  writeLocalStore(state);
}

export async function listSubscriptions(
  userEmail?: string
): Promise<SubscriptionRecord[]> {
  const firestore = getAdminFirestore();
  if (firestore) {
    const snap = userEmail
      ? await firestore
          .collection("subscriptions")
          .where("userEmail", "==", userEmail)
          .get()
      : await firestore
          .collection("subscriptions")
          .orderBy("updatedAt", "desc")
          .limit(100)
          .get();
    return snap.docs.map((d) => d.data() as SubscriptionRecord);
  }
  const state = readLocalStore();
  return userEmail
    ? state.subscriptions.filter(
        (s) => s.userEmail.toLowerCase() === userEmail.toLowerCase()
      )
    : state.subscriptions;
}

export async function saveInvoiceRecord(inv: InvoiceRecord): Promise<void> {
  const firestore = getAdminFirestore();
  if (firestore) {
    await firestore.collection("invoices").doc(inv.id).set(inv, { merge: true });
  }
  const state = readLocalStore();
  const idx = state.invoices.findIndex((i) => i.orderId === inv.orderId);
  if (idx >= 0) state.invoices[idx] = inv;
  else state.invoices.unshift(inv);
  writeLocalStore(state);
}

export async function listInvoices(
  userEmail?: string
): Promise<InvoiceRecord[]> {
  const firestore = getAdminFirestore();
  if (firestore) {
    const snap = userEmail
      ? await firestore
          .collection("invoices")
          .where("customerEmail", "==", userEmail)
          .orderBy("issuedAt", "desc")
          .limit(50)
          .get()
      : await firestore
          .collection("invoices")
          .orderBy("issuedAt", "desc")
          .limit(100)
          .get();
    return snap.docs.map((d) => d.data() as InvoiceRecord);
  }
  const state = readLocalStore();
  return userEmail
    ? state.invoices.filter(
        (i) => i.customerEmail.toLowerCase() === userEmail.toLowerCase()
      )
    : state.invoices;
}

export async function getInvoiceById(
  invoiceId: string
): Promise<InvoiceRecord | null> {
  const invoices = await listInvoices();
  return (
    invoices.find(
      (i) => i.id === invoiceId || i.orderId === invoiceId || i.invoiceNumber === invoiceId
    ) || null
  );
}

export async function appendPaymentLog(log: PaymentLogRecord): Promise<void> {
  const firestore = getAdminFirestore();
  if (firestore) {
    await firestore.collection("payment_logs").doc(log.id).set(log);
  }
  const state = readLocalStore();
  state.paymentLogs.unshift(log);
  state.paymentLogs = state.paymentLogs.slice(0, 200);
  writeLocalStore(state);
}

export async function listPaymentLogs(): Promise<PaymentLogRecord[]> {
  const firestore = getAdminFirestore();
  if (firestore) {
    const snap = await firestore
      .collection("payment_logs")
      .orderBy("timestamp", "desc")
      .limit(150)
      .get();
    return snap.docs.map((d) => d.data() as PaymentLogRecord);
  }
  return readLocalStore().paymentLogs;
}

export async function hasProcessedDelivery(
  deliveryId: string
): Promise<boolean> {
  const firestore = getAdminFirestore();
  if (firestore) {
    const snap = await firestore
      .collection("payment_logs")
      .doc(`dlv_${deliveryId}`)
      .get();
    if (snap.exists) return true;
  }
  const state = readLocalStore();
  return state.processedDeliveryIds.includes(deliveryId);
}

export async function markProcessedDelivery(deliveryId: string): Promise<void> {
  const state = readLocalStore();
  if (!state.processedDeliveryIds.includes(deliveryId)) {
    state.processedDeliveryIds.push(deliveryId);
    state.processedDeliveryIds = state.processedDeliveryIds.slice(-500);
    writeLocalStore(state);
  }
}
