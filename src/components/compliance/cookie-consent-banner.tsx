"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { loadCookieConsent, saveCookieConsent } from "@/lib/storage";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [preferences, setPreferences] = useState(true);

  useEffect(() => {
    const existing = loadCookieConsent();
    if (!existing) {
      setVisible(true);
    } else {
      setAnalytics(existing.analytics);
      setPreferences(existing.preferences);
    }

    const handleReopen = () => {
      const current = loadCookieConsent();
      if (current) {
        setAnalytics(current.analytics);
        setPreferences(current.preferences);
      }
      setVisible(true);
      setCustomizeOpen(true);
    };

    window.addEventListener("open-cookie-settings", handleReopen);
    return () => window.removeEventListener("open-cookie-settings", handleReopen);
  }, []);

  const persist = (allowAnalytics: boolean, allowPreferences: boolean) => {
    saveCookieConsent({
      necessary: true,
      analytics: allowAnalytics,
      preferences: allowPreferences,
      consentedAt: new Date().toISOString(),
      regulationNotice: "DPDP_2023_AND_GDPR",
    });
    setAnalytics(allowAnalytics);
    setPreferences(allowPreferences);
    setVisible(false);
    setCustomizeOpen(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie Consent Banner"
      className="no-print fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-2xl border bg-card/95 p-5 shadow-2xl backdrop-blur-md animate-in fade-in-0 slide-in-from-bottom-4"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Cookie className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-sm font-bold">
                  Your Privacy & Cookie Preferences
                </h3>
                <Badge variant="accent" className="text-[10px]">
                  <ShieldCheck className="mr-1 h-3 w-3" /> GDPR &amp; DPDP Act 2023
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We use strictly necessary cookies for secure authentication and encrypted session state. Optional analytics or preference cookies are only set with your explicit consent. You retain 100% ownership of your resume data.{" "}
                <Link href="/privacy-policy" className="text-primary underline">
                  Privacy Policy
                </Link>{" "}
                •{" "}
                <Link href="/data-request" className="text-primary underline">
                  Data Rights
                </Link>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => persist(false, false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Reject optional cookies and close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {customizeOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border bg-muted/40 p-3 text-xs">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-background p-2.5 border">
              <div>
                <p className="font-semibold">Strictly Necessary</p>
                <p className="text-[11px] text-muted-foreground">Auth &amp; CSRF security</p>
              </div>
              <Switch checked disabled />
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg bg-background p-2.5 border">
              <div>
                <p className="font-semibold">Preferences</p>
                <p className="text-[11px] text-muted-foreground">Theme &amp; draft settings</p>
              </div>
              <Switch checked={preferences} onCheckedChange={setPreferences} />
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg bg-background p-2.5 border">
              <div>
                <p className="font-semibold">Analytics</p>
                <p className="text-[11px] text-muted-foreground">Aggregated usage metrics</p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={() => setCustomizeOpen((v) => !v)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            {customizeOpen ? "Hide Preferences" : "Customize"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => persist(false, false)}
          >
            Reject Non-Essential
          </Button>
          {customizeOpen && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => persist(analytics, preferences)}
            >
              Save Selection
            </Button>
          )}
          <Button size="sm" onClick={() => persist(true, true)}>
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
