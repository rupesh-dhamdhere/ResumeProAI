import type {
  ATSHistoryEntry,
  CookieConsentState,
  DataPrivacyRequest,
  JobMatchResult,
  PaymentOrderRecord,
  SavedResume,
  UserProfile,
} from "@/types/resume";
import {
  INITIAL_ATS_HISTORY,
  INITIAL_JOB_MATCHES,
  INITIAL_SAVED_RESUMES,
} from "@/lib/sample-data";
import { createClient } from "@/lib/supabase/client";

const KEYS = {
  RESUMES: "resumepro_resumes_v1",
  ATS_HISTORY: "resumepro_ats_history_v1",
  JOB_MATCHES: "resumepro_job_matches_v1",
  USER: "resumepro_demo_user_v1",
  ACTIVE_RESUME_ID: "resumepro_active_resume_id_v1",
  DATA_REQUESTS: "resumepro_data_requests_v1",
  COOKIE_CONSENT: "resumepro_cookie_consent_v1",
  PAYMENT_ORDERS: "resumepro_payment_orders_v1",
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadLocalResumes(): SavedResume[] {
  if (!isBrowser()) return INITIAL_SAVED_RESUMES;
  try {
    const raw = localStorage.getItem(KEYS.RESUMES);
    if (!raw) {
      localStorage.setItem(KEYS.RESUMES, JSON.stringify(INITIAL_SAVED_RESUMES));
      return INITIAL_SAVED_RESUMES;
    }
    return JSON.parse(raw) as SavedResume[];
  } catch {
    return INITIAL_SAVED_RESUMES;
  }
}

export function saveLocalResumes(resumes: SavedResume[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(KEYS.RESUMES, JSON.stringify(resumes));
  } catch {
    // ignore quota issues
  }
}

export async function syncResumeToSupabase(resume: SavedResume): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("resumes").upsert({
      id: resume.id.startsWith("res-") ? undefined : resume.id,
      user_id: user.id,
      title: resume.title,
      template_id: resume.templateId,
      data: resume.data,
      section_order: resume.data.sectionOrder,
      ats_score: resume.atsScore,
      is_public: resume.isPublic,
      share_slug: resume.shareSlug,
      updated_at: resume.updatedAt,
    });
  } catch {
    // Non-blocking cloud sync
  }
}

export function loadATSHistory(): ATSHistoryEntry[] {
  if (!isBrowser()) return INITIAL_ATS_HISTORY;
  try {
    const raw = localStorage.getItem(KEYS.ATS_HISTORY);
    if (!raw) {
      localStorage.setItem(KEYS.ATS_HISTORY, JSON.stringify(INITIAL_ATS_HISTORY));
      return INITIAL_ATS_HISTORY;
    }
    return JSON.parse(raw) as ATSHistoryEntry[];
  } catch {
    return INITIAL_ATS_HISTORY;
  }
}

export function addATSHistoryEntry(entry: ATSHistoryEntry): ATSHistoryEntry[] {
  const current = loadATSHistory();
  const next = [entry, ...current].slice(0, 25);
  if (isBrowser()) {
    localStorage.setItem(KEYS.ATS_HISTORY, JSON.stringify(next));
  }
  return next;
}

export function loadJobMatches(): JobMatchResult[] {
  if (!isBrowser()) return INITIAL_JOB_MATCHES;
  try {
    const raw = localStorage.getItem(KEYS.JOB_MATCHES);
    if (!raw) {
      localStorage.setItem(KEYS.JOB_MATCHES, JSON.stringify(INITIAL_JOB_MATCHES));
      return INITIAL_JOB_MATCHES;
    }
    return JSON.parse(raw) as JobMatchResult[];
  } catch {
    return INITIAL_JOB_MATCHES;
  }
}

export function addJobMatchEntry(entry: JobMatchResult): JobMatchResult[] {
  const current = loadJobMatches();
  const next = [entry, ...current].slice(0, 25);
  if (isBrowser()) {
    localStorage.setItem(KEYS.JOB_MATCHES, JSON.stringify(next));
  }
  return next;
}

export function loadDemoUser(): UserProfile | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(KEYS.USER);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveDemoUser(user: UserProfile | null): void {
  if (!isBrowser()) return;
  if (!user) {
    localStorage.removeItem(KEYS.USER);
  } else {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  }
}

export function getActiveResumeId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.ACTIVE_RESUME_ID);
}

export function setActiveResumeId(id: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.ACTIVE_RESUME_ID, id);
}

const INITIAL_DATA_REQUESTS: DataPrivacyRequest[] = [
  {
    id: "dpr-101",
    email: "hannah.a@university.edu",
    fullName: "Hannah Abbott",
    requestType: "export",
    regulation: "GDPR",
    reason: "Requesting portable JSON copy of saved resume drafts and ATS logs.",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "dpr-102",
    email: "former.user@example.in",
    fullName: "Rohan Mehta",
    requestType: "deletion",
    regulation: "DPDP_2023",
    reason: "Right to erasure under Digital Personal Data Protection Act 2023.",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export function loadDataRequests(): DataPrivacyRequest[] {
  if (!isBrowser()) return INITIAL_DATA_REQUESTS;
  try {
    const raw = localStorage.getItem(KEYS.DATA_REQUESTS);
    if (!raw) {
      localStorage.setItem(KEYS.DATA_REQUESTS, JSON.stringify(INITIAL_DATA_REQUESTS));
      return INITIAL_DATA_REQUESTS;
    }
    return JSON.parse(raw) as DataPrivacyRequest[];
  } catch {
    return INITIAL_DATA_REQUESTS;
  }
}

export function saveDataRequests(requests: DataPrivacyRequest[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.DATA_REQUESTS, JSON.stringify(requests));
}

export function addDataRequest(req: DataPrivacyRequest): DataPrivacyRequest[] {
  const current = loadDataRequests();
  const next = [req, ...current];
  saveDataRequests(next);
  return next;
}

export function loadCookieConsent(): CookieConsentState | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(KEYS.COOKIE_CONSENT);
    return raw ? (JSON.parse(raw) as CookieConsentState) : null;
  } catch {
    return null;
  }
}

export function saveCookieConsent(consent: CookieConsentState): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.COOKIE_CONSENT, JSON.stringify(consent));
}

export function buildPortableUserDataExport() {
  return {
    exportedAt: new Date().toISOString(),
    ownershipNotice:
      "All resume content and personal records belong 100% to the user (Data Principal / Data Subject).",
    user: loadDemoUser(),
    resumes: loadLocalResumes(),
    atsHistory: loadATSHistory(),
    jobMatches: loadJobMatches(),
    cookieConsent: loadCookieConsent(),
  };
}

export function eraseAllLocalUserData(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(KEYS.RESUMES);
  localStorage.removeItem(KEYS.ATS_HISTORY);
  localStorage.removeItem(KEYS.JOB_MATCHES);
  localStorage.removeItem(KEYS.USER);
  localStorage.removeItem(KEYS.ACTIVE_RESUME_ID);
  localStorage.removeItem(KEYS.PAYMENT_ORDERS);
}

const INITIAL_PAYMENT_ORDERS: PaymentOrderRecord[] = [
  {
    id: "pay-demo-1",
    orderId: "RPA-PRO-DEMO01",
    paymentId: "c7942127-14e3-469a-9e4a-9359a16f903a",
    plan: "pro",
    amountInr: "749.00",
    amountUsd: "$9/mo",
    currency: "INR",
    customerEmail: "alex.rivera@example.com",
    customerName: "Alex Rivera",
    status: "RECONCILED",
    settlementState: "RECONCILED",
    utr: "431298765432",
    verificationLevel: 2,
    mode: "youpi-pg",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    notes: "Verified against bank statement",
  },
];

export function loadPaymentOrders(): PaymentOrderRecord[] {
  if (!isBrowser()) return INITIAL_PAYMENT_ORDERS;
  try {
    const raw = localStorage.getItem(KEYS.PAYMENT_ORDERS);
    if (!raw) {
      localStorage.setItem(
        KEYS.PAYMENT_ORDERS,
        JSON.stringify(INITIAL_PAYMENT_ORDERS)
      );
      return INITIAL_PAYMENT_ORDERS;
    }
    return JSON.parse(raw) as PaymentOrderRecord[];
  } catch {
    return INITIAL_PAYMENT_ORDERS;
  }
}

export function savePaymentOrders(orders: PaymentOrderRecord[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.PAYMENT_ORDERS, JSON.stringify(orders));
}

export function upsertPaymentOrder(
  order: PaymentOrderRecord
): PaymentOrderRecord[] {
  const current = loadPaymentOrders();
  const idx = current.findIndex((o) => o.orderId === order.orderId);
  const next =
    idx >= 0
      ? current.map((o, i) => (i === idx ? order : o))
      : [order, ...current];
  savePaymentOrders(next);
  return next;
}
