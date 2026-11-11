"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileText,
  History,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  loadATSHistory,
  loadDemoUser,
  loadJobMatches,
  loadLocalResumes,
  saveLocalResumes,
  setActiveResumeId,
} from "@/lib/storage";
import { downloadInvoicePdf } from "@/lib/payments/invoice-pdf";
import { exportResumeToPDF } from "@/lib/export-pdf";
import { getTemplateById } from "@/lib/templates-data";
import { SAMPLE_RESUME_DATA } from "@/lib/sample-data";
import { formatDateRelative, generateId } from "@/lib/utils";
import type {
  InvoiceRecord,
  PaymentRecord,
  SubscriptionRecord,
} from "@/types/payment";
import type {
  ATSHistoryEntry,
  JobMatchResult,
  SavedResume,
  UserProfile,
} from "@/types/resume";

export function DashboardClient() {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [atsHistory, setAtsHistory] = useState<ATSHistoryEntry[]>([]);
  const [jobMatches, setJobMatches] = useState<JobMatchResult[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [activeSub, setActiveSub] = useState<SubscriptionRecord | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setResumes(loadLocalResumes());
    setAtsHistory(loadATSHistory());
    setJobMatches(loadJobMatches());
    const currentUser = loadDemoUser();
    setUser(currentUser);
    const lookupEmail = currentUser?.email || "alex.rivera@example.com";

    fetch(`/api/payments/transactions?email=${encodeURIComponent(lookupEmail)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setPayments(data.payments || []);
        setInvoices(data.invoices || []);
        setActiveSub(data.subscription || null);
      })
      .catch(() => {});
  }, []);

  const totalViews = resumes.reduce((s, r) => s + r.viewsCount, 0);
  const totalDownloads = resumes.reduce((s, r) => s + r.downloadsCount, 0);
  const avgAts =
    resumes.length > 0
      ? Math.round(
          resumes.reduce((s, r) => s + r.atsScore, 0) / resumes.length
        )
      : 0;

  const handleDuplicate = (resume: SavedResume) => {
    const copy: SavedResume = {
      ...resume,
      id: generateId("res"),
      title: `${resume.title} (Copy)`,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      shareSlug: `${resume.shareSlug}-copy-${Math.floor(Math.random() * 900)}`,
      viewsCount: 0,
      downloadsCount: 0,
    };
    const next = [copy, ...resumes];
    setResumes(next);
    saveLocalResumes(next);
  };

  const handleDelete = (id: string) => {
    const next = resumes.filter((r) => r.id !== id);
    setResumes(next);
    saveLocalResumes(next);
  };

  const handleCreateFresh = () => {
    const newItem: SavedResume = {
      id: generateId("res"),
      title: `New ATS Resume ${resumes.length + 1}`,
      templateId: "modern-cobalt",
      data: SAMPLE_RESUME_DATA,
      atsScore: 94,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isPublic: false,
      shareSlug: `resume-${Date.now().toString(36)}`,
      viewsCount: 0,
      downloadsCount: 0,
      versions: [],
    };
    const next = [newItem, ...resumes];
    setResumes(next);
    saveLocalResumes(next);
    setActiveResumeId(newItem.id);
  };

  return (
    <div className="container py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              Career Dashboard
            </h1>
            <Badge variant="accent" className="uppercase">
              {user?.plan || "Pro"} Plan
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage saved resumes, version history, ATS audit trends, and job match reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/ats-checker">
            <Button variant="outline" className="gap-1.5">
              <Target className="h-4 w-4 text-brand-teal" />
              New Job Match
            </Button>
          </Link>
          <Link href="/builder" onClick={handleCreateFresh}>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> Create Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              Saved Resumes <FileText className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">{resumes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Active resume versions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              Avg ATS Score <Sparkles className="h-4 w-4 text-brand-teal" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold text-emerald-500">
              {avgAts}/100
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across all saved drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              Share Link Views <Eye className="h-4 w-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">{totalViews}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Recruiter & public views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              Exports & Downloads <BarChart3 className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">{totalDownloads}</p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF & DOCX exports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="resumes">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="resumes">Saved &amp; Recent Resumes</TabsTrigger>
          <TabsTrigger value="ats">ATS History ({atsHistory.length})</TabsTrigger>
          <TabsTrigger value="matches">Job Match Reports ({jobMatches.length})</TabsTrigger>
          <TabsTrigger value="billing">Billing &amp; YouPI-PG ({payments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="resumes" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((res) => {
              const tpl = getTemplateById(res.templateId);
              return (
                <Card key={res.id} className="flex flex-col justify-between">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-lg font-bold">
                          {res.title}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          Edited {formatDateRelative(res.updatedAt)} • Template:{" "}
                          <span className="text-foreground font-medium">
                            {tpl.name}
                          </span>
                        </p>
                      </div>
                      <Badge
                        variant={res.atsScore >= 85 ? "success" : "warning"}
                      >
                        ATS {res.atsScore}/100
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{res.versions?.length || 1} version(s)</span>
                      <span>•</span>
                      <span>{res.viewsCount} link views</span>
                      <span>•</span>
                      <span>{res.downloadsCount} downloads</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                      <Link href={`/builder?id=${res.id}`}>
                        <Button size="sm">Edit Resume</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() =>
                          exportResumeToPDF(res.data, tpl, res.title)
                        }
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicate(res)}
                      >
                        Duplicate
                      </Button>
                      <Link href={`/share/${res.shareSlug}`}>
                        <Button size="sm" variant="ghost" className="gap-1">
                          <ExternalLink className="h-3.5 w-3.5" /> Share View
                        </Button>
                      </Link>
                      {resumes.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="ml-auto text-destructive"
                          onClick={() => handleDelete(res.id)}
                          aria-label="Delete resume"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="ats" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {atsHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <History className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">
                          {item.resumeTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Analyzed {formatDateRelative(item.createdAt)} • Readability{" "}
                          {item.readabilityScore}% • Keywords {item.keywordScore}%
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={item.overallScore >= 85 ? "success" : "warning"}
                      className="self-start sm:self-center"
                    >
                      Score: {item.overallScore}/100
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobMatches.map((jm) => (
              <Card key={jm.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading font-bold">{jm.jobTitle}</h3>
                      <p className="text-xs text-muted-foreground">
                        {jm.company} • {formatDateRelative(jm.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={jm.matchPercentage >= 75 ? "success" : "warning"}
                    >
                      {jm.matchPercentage}% Match
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Matched:
                      </span>{" "}
                      {jm.matchedKeywords.join(", ") || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Missing:
                      </span>{" "}
                      {jm.missingKeywords.join(", ") || "None"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-bold">
                    Current Plan:{" "}
                    <span className="uppercase">
                      {activeSub?.plan || user?.plan || "Pro"}
                    </span>
                  </h3>
                  {activeSub && (
                    <Badge variant={activeSub.status === "active" ? "success" : "warning"}>
                      {activeSub.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Powered by YouPI-PG UPI Checkout &amp; automatic fallback.
                  {activeSub?.currentPeriodEnd
                    ? ` Period ends ${new Date(activeSub.currentPeriodEnd).toLocaleDateString()}.`
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/checkout?plan=pro">
                  <Button size="sm" variant="outline">Upgrade to Pro ($9/mo)</Button>
                </Link>
                <Link href="/checkout?plan=premium">
                  <Button size="sm">Go Premium ($19/mo)</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Payment Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Order ID</th>
                    <th className="px-4 py-3 text-left">Plan &amp; Amount</th>
                    <th className="px-4 py-3 text-left">Gateway / UTR</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((pay) => (
                    <tr key={pay.orderId}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        {pay.orderId}
                      </td>
                      <td className="px-4 py-3">
                        <span className="uppercase font-medium">{pay.plan}</span> • ₹{pay.amountInr}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {pay.provider} {pay.utr ? `• ${pay.utr}` : ""}
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateRelative(pay.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">
                        No payment transactions yet for {user?.email}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Downloadable GST Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Invoice #</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Total (INR)</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-xs">{inv.description}</td>
                      <td className="px-4 py-3 font-semibold">₹{inv.totalInr.toFixed(2)}</td>
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
                          onClick={() => downloadInvoicePdf(inv)}
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          PDF Invoice
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">
                        Invoices are generated automatically upon subscription payment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
