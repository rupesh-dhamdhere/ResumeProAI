"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Download,
  FileWarning,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addDataRequest,
  buildPortableUserDataExport,
  eraseAllLocalUserData,
} from "@/lib/storage";
import { generateId } from "@/lib/utils";
import type { DataPrivacyRequest } from "@/types/resume";

export function DataRequestClient() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] =
    useState<DataPrivacyRequest["requestType"]>("deletion");
  const [regulation, setRegulation] =
    useState<DataPrivacyRequest["regulation"]>("DPDP_2023");
  const [reason, setReason] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [wipedLocal, setWipedLocal] = useState(false);

  const handleDownloadExport = () => {
    const payload = buildPortableUserDataExport();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumepro-ai-personal-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleInstantLocalWipe = () => {
    eraseAllLocalUserData();
    setWipedLocal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    const id = generateId("dpr");
    addDataRequest({
      id,
      fullName: fullName.trim(),
      email: email.trim(),
      requestType,
      regulation,
      reason: reason.trim() || "User submitted self-service privacy request",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    setSubmittedId(id);
  };

  return (
    <div className="container max-w-5xl py-12 space-y-8">
      <div className="max-w-3xl space-y-3">
        <Badge variant="accent">
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
          DPDP Act 2023 (India) &amp; GDPR Data Rights Center
        </Badge>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
          Data Export &amp; Deletion Requests
        </h1>
        <p className="text-muted-foreground">
          You own 100% of your resume data. Exercise your statutory right to access, export a portable JSON copy, or permanently erase your personal information.
        </p>
      </div>

      {/* Instant Self-Service Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5 text-primary" />
              Instant Data Portability (JSON Export)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Download a complete machine-readable copy of your resumes, ATS audit history, job match reports, and consent preferences under GDPR Art. 20 &amp; DPDP Sec. 11.
            </p>
            <Button onClick={handleDownloadExport} className="w-full gap-2">
              <Download className="h-4 w-4" /> Download My Data (.json)
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <Trash2 className="h-5 w-5" />
              Instant Local Workspace Erasure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Immediately clear all resumes, ATS logs, job match reports, and session tokens stored in this browser.
            </p>
            {wipedLocal ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Local workspace data has been permanently erased from this browser.
              </div>
            ) : (
              <Button
                variant="destructive"
                onClick={handleInstantLocalWipe}
                className="w-full gap-2"
              >
                <Trash2 className="h-4 w-4" /> Erase Local Browser Data Now
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formal Cloud / Account Data Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileWarning className="h-5 w-5 text-brand-teal" />
            Submit Formal Account Deletion or Data Export Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submittedId ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h2 className="font-heading text-2xl font-bold">
                Privacy Request Logged ({submittedId})
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Your <strong>{requestType.toUpperCase()}</strong> request under{" "}
                <strong>{regulation.replace("_", " ")}</strong> has been queued for our Data Protection &amp; Admin compliance team. Verification and processing complete within 72 hours.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmittedId(null);
                  setReason("");
                }}
              >
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Email Address</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Request Type</Label>
                  <Select
                    value={requestType}
                    onValueChange={(v) =>
                      setRequestType(v as DataPrivacyRequest["requestType"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deletion">
                        Permanent Data Deletion (Right to Erasure)
                      </SelectItem>
                      <SelectItem value="export">
                        Full Data Export (Right to Access / Portability)
                      </SelectItem>
                      <SelectItem value="correction">
                        Personal Data Correction
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Applicable Framework</Label>
                  <Select
                    value={regulation}
                    onValueChange={(v) =>
                      setRegulation(v as DataPrivacyRequest["regulation"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DPDP_2023">
                        DPDP Act (India) 2023
                      </SelectItem>
                      <SelectItem value="GDPR">
                        EU / UK GDPR
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Additional Details (Optional)</Label>
                <Textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Specify scope or verification notes..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Submit Compliance Request
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
