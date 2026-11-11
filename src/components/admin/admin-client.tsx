"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Layers,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Terminal,
  Trash2,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADMIN_MOCK_USERS } from "@/lib/sample-data";
import { RESUME_TEMPLATES } from "@/lib/templates-data";
import {
  buildPortableUserDataExport,
  loadDataRequests,
  saveDataRequests,
} from "@/lib/storage";
import { downloadInvoicePdf } from "@/lib/payments/invoice-pdf";
import { formatDateRelative } from "@/lib/utils";
import type {
  InvoiceRecord,
  PaymentLogRecord,
  PaymentRecord,
  PaymentStatus,
  SubscriptionRecord,
} from "@/types/payment";
import type {
  AdminUserRecord,
  DataPrivacyRequest,
  ResumeTemplate,
  SubscriptionPlan,
} from "@/types/resume";

interface AdminPaymentAnalytics {
  totalRevenueInr: number;
  refundedAmountInr: number;
  netRevenueInr: number;
  totalTransactions: number;
  successfulCount: number;
  pendingVerificationCount: number;
  failedOrExpiredCount: number;
  activeSubscriptionsCount: number;
}

export function AdminClient() {
  const [users, setUsers] = useState<AdminUserRecord[]>(ADMIN_MOCK_USERS);
  const [templates, setTemplates] = useState<ResumeTemplate[]>(RESUME_TEMPLATES);
  const [privacyRequests, setPrivacyRequests] = useState<DataPrivacyRequest[]>([]);

  const [serverPayments, setServerPayments] = useState<PaymentRecord[]>([]);
  const [serverSubscriptions, setServerSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [serverInvoices, setServerInvoices] = useState<InvoiceRecord[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLogRecord[]>([]);
  const [analytics, setAnalytics] = useState<AdminPaymentAnalytics | null>(null);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "All">("All");
  const [refundReason, setRefundReason] = useState("Customer requested refund");
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const loadAdminPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch("/api/payments/admin");
      if (!res.ok) return;
      const data = await res.json();
      setAnalytics(data.analytics || null);
      setServerPayments(data.payments || []);
      setServerSubscriptions(data.subscriptions || []);
      setServerInvoices(data.invoices || []);
      setPaymentLogs(data.paymentLogs || []);
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    setPrivacyRequests(loadDataRequests());
    void loadAdminPayments();
  }, [loadAdminPayments]);

  const proCount = users.filter((u) => u.plan === "pro").length;
  const premiumCount = users.filter((u) => u.plan === "premium").length;
  const mrr = proCount * 9 + premiumCount * 19 + 4280;

  const updateUserPlan = (id: string, plan: SubscriptionPlan) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, plan } : u)));
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "active" ? "suspended" : "active" }
          : u
      )
    );
  };

  const toggleTemplateActive = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const toggleTemplatePremium = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPremium: !t.isPremium } : t))
    );
  };

  const handleExportUserPackage = (req: DataPrivacyRequest) => {
    const baseData = buildPortableUserDataExport();
    const exportPayload = {
      requestId: req.id,
      subjectEmail: req.email,
      subjectName: req.fullName,
      regulation: req.regulation,
      ...baseData,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-data-export-${req.email.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    const next = privacyRequests.map((r) =>
      r.id === req.id
        ? { ...r, status: "completed" as const, completedAt: new Date().toISOString() }
        : r
    );
    setPrivacyRequests(next);
    saveDataRequests(next);
  };

  const handleFulfillDeletion = (req: DataPrivacyRequest) => {
    // Remove user record from active directory and mark privacy request completed
    setUsers((prev) => prev.filter((u) => u.email.toLowerCase() !== req.email.toLowerCase()));
    const next = privacyRequests.map((r) =>
      r.id === req.id
        ? { ...r, status: "completed" as const, completedAt: new Date().toISOString() }
        : r
    );
    setPrivacyRequests(next);
    saveDataRequests(next);
  };

  const pendingRequestsCount = privacyRequests.filter(
    (r) => r.status !== "completed"
  ).length;

  const reconcileOrder = async (
    orderId: string,
    action: "approve" | "reject"
  ) => {
    setBusyOrderId(orderId);
    try {
      await fetch("/api/payments/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          orderId,
          adminEmail: "admin@resumepro.ai",
        }),
      });
      await loadAdminPayments();
    } finally {
      setBusyOrderId(null);
    }
  };

  const refundOrder = async (orderId: string) => {
    setBusyOrderId(orderId);
    try {
      await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          reason: refundReason,
          adminEmail: "admin@resumepro.ai",
        }),
      });
      await loadAdminPayments();
    } finally {
      setBusyOrderId(null);
    }
  };

  const filteredPayments =
    statusFilter === "All"
      ? serverPayments
      : serverPayments.filter((p) => p.status === statusFilter);

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="accent" className="mb-2">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Admin &amp; Privacy Control Center
          </Badge>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Platform Administration, Payments &amp; Compliance
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor YouPI-PG &amp; fallback transactions, manage refunds and invoices, inspect payment audit logs, and fulfill DPDP/GDPR privacy requests.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadAdminPayments()}
          disabled={loadingPayments}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loadingPayments ? "animate-spin" : ""}`} />
          Sync Gateway Ledger
        </Button>
      </div>

      {/* Analytics KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex justify-between">
              Net Collected Revenue <DollarSign className="h-4 w-4 text-brand-teal" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">
              ₹{(analytics?.netRevenueInr ?? 0).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.successfulCount ?? 0} paid • ₹
              {(analytics?.refundedAmountInr ?? 0).toLocaleString("en-IN")} refunded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex justify-between">
              Active Paid Subscriptions <CreditCard className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">
              {analytics?.activeSubscriptionsCount ?? 0}
            </p>
            <p className="text-xs text-emerald-500 mt-1">
              Est. Catalog MRR: ${mrr.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex justify-between">
              Pending Verification <Users className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">
              {analytics?.pendingVerificationCount ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.totalTransactions ?? 0} total orders tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex justify-between">
              Privacy &amp; Templates <Layers className="h-4 w-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">{pendingRequestsCount} open</p>
            <p className="text-xs text-muted-foreground mt-1">
              {templates.filter((t) => t.isActive).length}/{templates.length} active templates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="payments">
            Transactions &amp; Refunds ({serverPayments.length})
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            Subscriptions ({serverSubscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Invoices ({serverInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="logs">
            Payment Logs ({paymentLogs.length})
          </TabsTrigger>
          <TabsTrigger value="privacy">
            Data Export &amp; Deletion ({pendingRequestsCount} open)
          </TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* PAYMENTS MONITORING, RECONCILIATION & REFUND MANAGEMENT */}
        <TabsContent value="payments" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                ["All", "Pending", "Processing", "Success", "Failed", "Refunded", "Expired"] as const
              ).map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={statusFilter === st ? "default" : "outline"}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Refund Reason:
              </span>
              <Input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="h-8 w-56 text-xs"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Order / Provider</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Amount &amp; UTR</th>
                    <th className="px-4 py-3 text-left">Status / Settlement</th>
                    <th className="px-4 py-3 text-right">Reconciliation &amp; Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPayments.map((pay) => (
                    <tr key={pay.orderId} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold">{pay.orderId}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {pay.provider} • {formatDateRelative(pay.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{pay.customerName}</p>
                        <p className="text-xs text-muted-foreground">{pay.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">
                          ₹{pay.amountInr} ({pay.plan.toUpperCase()})
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          UTR: {pay.utr || "Pending"}
                        </p>
                      </td>
                      <td className="px-4 py-3 space-x-1.5">
                        <Badge
                          variant={
                            pay.status === "Success"
                              ? "success"
                              : pay.status === "Failed" || pay.status === "Expired"
                                ? "destructive"
                                : "warning"
                          }
                        >
                          {pay.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {pay.settlementState}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          {(pay.status === "Pending" || pay.status === "Processing") && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={busyOrderId === pay.orderId}
                                onClick={() => void reconcileOrder(pay.orderId, "approve")}
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                                Reconcile
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-destructive"
                                disabled={busyOrderId === pay.orderId}
                                onClick={() => void reconcileOrder(pay.orderId, "reject")}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {pay.status === "Success" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-amber-700 dark:text-amber-400"
                              disabled={busyOrderId === pay.orderId}
                              onClick={() => void refundOrder(pay.orderId)}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              Issue Refund
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        No transactions matching status filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVOICES TAB */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Invoice #</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Subtotal + GST</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {serverInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold">{inv.invoiceNumber}</p>
                        <p className="text-[11px] text-muted-foreground">{inv.orderId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{inv.customerName}</p>
                        <p className="text-xs text-muted-foreground">{inv.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        ₹{inv.totalInr.toFixed(2)} (GST ₹{inv.taxInr.toFixed(2)})
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            inv.status === "Paid"
                              ? "success"
                              : inv.status === "Refunded"
                                ? "destructive"
                                : "warning"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => downloadInvoicePdf(inv)}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          Download PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENT AUDIT LOGS */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Terminal className="h-4 w-4 text-primary" />
                Webhook &amp; Transaction Security Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b bg-muted/40 uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Timestamp</th>
                    <th className="px-4 py-2.5 text-left">Level</th>
                    <th className="px-4 py-2.5 text-left">Event</th>
                    <th className="px-4 py-2.5 text-left">Order</th>
                    <th className="px-4 py-2.5 text-left">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {paymentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                        {formatDateRelative(log.timestamp)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={
                            log.level === "security" || log.level === "error"
                              ? "destructive"
                              : log.level === "warn"
                                ? "warning"
                                : "outline"
                          }
                          className="text-[10px]"
                        >
                          {log.level}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 font-semibold">{log.event}</td>
                      <td className="px-4 py-2.5">{log.orderId}</td>
                      <td className="px-4 py-2.5 font-sans text-muted-foreground">
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRIVACY & DATA REQUESTS */}
        <TabsContent value="privacy" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Data Principal / Subject</th>
                    <th className="px-4 py-3 text-left">Type &amp; Framework</th>
                    <th className="px-4 py-3 text-left">Submitted</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {privacyRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{req.fullName}</p>
                        <p className="text-xs text-muted-foreground">{req.email}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs truncate">
                          {req.reason}
                        </p>
                      </td>
                      <td className="px-4 py-3 space-y-1">
                        <Badge variant="outline" className="uppercase text-[10px]">
                          {req.requestType}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {req.regulation === "DPDP_2023" ? "DPDP Act 2023" : "GDPR"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateRelative(req.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={req.status === "completed" ? "success" : "warning"}
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs"
                            onClick={() => handleExportUserPackage(req)}
                          >
                            <Download className="h-3.5 w-3.5" /> Export JSON
                          </Button>
                          {req.requestType === "deletion" && req.status !== "completed" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1 text-xs"
                              onClick={() => handleFulfillDeletion(req)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Erase &amp; Complete
                            </Button>
                          )}
                          {req.status === "completed" && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Done
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Resumes</th>
                    <th className="px-4 py-3 text-left">Last Active</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={u.plan}
                          onValueChange={(val) =>
                            updateUserPlan(u.id, val as SubscriptionPlan)
                          }
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="pro">Pro ($9)</SelectItem>
                            <SelectItem value="premium">Premium ($19)</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">{u.resumesCount}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.lastActive}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                        >
                          <Badge
                            variant={
                              u.status === "active" ? "success" : "destructive"
                            }
                          >
                            {u.status}
                          </Badge>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Template</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">ATS Compatibility</th>
                    <th className="px-4 py-3 text-left">Usage</th>
                    <th className="px-4 py-3 text-left">Pro Tier</th>
                    <th className="px-4 py-3 text-left">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {templates.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: t.accentColor }}
                        />
                        {t.name}
                      </td>
                      <td className="px-4 py-3 text-xs">{t.category}</td>
                      <td className="px-4 py-3">
                        <Badge variant="success">{t.atsCompatibility}%</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {t.usageCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={t.isPremium}
                          onCheckedChange={() => toggleTemplatePremium(t.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={t.isActive}
                          onCheckedChange={() => toggleTemplateActive(t.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBSCRIPTIONS TRACKING */}
        <TabsContent value="subscriptions" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Free Tier <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl font-bold">
                  {serverSubscriptions.filter((s) => s.plan === "free").length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tracked free/reverted accounts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Pro Plan ($9 / ₹749) <Badge variant="default">Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl font-bold">
                  {
                    serverSubscriptions.filter(
                      (s) => s.plan === "pro" && s.status === "active"
                    ).length
                  }
                </p>
                <p className="text-xs text-emerald-500 mt-1">
                  Live Firestore / Ledger Pro subscriptions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Premium Plan ($19 / ₹1,599) <Badge variant="accent">Top Tier</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl font-bold">
                  {
                    serverSubscriptions.filter(
                      (s) => s.plan === "premium" && s.status === "active"
                    ).length
                  }
                </p>
                <p className="text-xs text-emerald-500 mt-1">
                  Live Firestore / Ledger Premium subscriptions
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Subscriber</th>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Gateway / Order</th>
                    <th className="px-4 py-3 text-left">Period End</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {serverSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium">{sub.userName}</p>
                        <p className="text-xs text-muted-foreground">{sub.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 uppercase font-semibold text-xs">
                        {sub.plan}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            sub.status === "active"
                              ? "success"
                              : sub.status === "refunded"
                                ? "destructive"
                                : "warning"
                          }
                        >
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {sub.provider} {sub.latestOrderId ? `• ${sub.latestOrderId}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
