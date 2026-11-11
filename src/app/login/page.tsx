"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileCheck2, Linkedin, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { saveDemoUser } from "@/lib/storage";
import type { SubscriptionPlan } from "@/types/resume";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = (searchParams.get("plan") as SubscriptionPlan) || "pro";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabaseReady = isSupabaseConfigured();

  const completeDemoSignIn = (
    provider: "email" | "google" | "linkedin",
    userEmail?: string,
    userName?: string
  ) => {
    saveDemoUser({
      id: `demo-${Date.now()}`,
      email: userEmail || "alex.rivera@example.com",
      fullName: userName || userEmail?.split("@")[0] || "Alex Rivera",
      plan: planParam,
      role: "user",
      provider,
      createdAt: new Date().toISOString(),
    });
    router.push("/dashboard");
    router.refresh();
  };

  const handleOAuth = async (provider: "google" | "linkedin_oidc") => {
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      completeDemoSignIn(provider === "google" ? "google" : "linkedin");
      return;
    }

    setLoading(true);
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    setLoading(false);
    if (oauthErr) setError(oauthErr.message);
  };

  const handleEmailAuth = async (mode: "login" | "register") => {
    setError(null);
    setMessage(null);
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      completeDemoSignIn("email", email.trim(), fullName.trim() || undefined);
      return;
    }

    setLoading(true);
    if (mode === "login") {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (signInErr) {
        setError(signInErr.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || email.split("@")[0] },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      setLoading(false);
      if (signUpErr) {
        setError(signUpErr.message);
      } else {
        setMessage("Check your inbox to verify your email and complete signup.");
      }
    }
  };

  return (
    <div className="container py-14 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-teal text-white">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to ResumePro AI
          </CardTitle>
          <CardDescription>
            Sign in or create an account to save resumes, track ATS history, and sync across devices.
          </CardDescription>
          {!supabaseReady && (
            <Badge variant="accent" className="mx-auto">
              <Sparkles className="mr-1 h-3 w-3" /> Instant Local Workspace Mode Active
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          {/* OAuth Providers */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              Google
            </Button>

            <Button
              variant="outline"
              onClick={() => handleOAuth("linkedin_oidc")}
              disabled={loading}
              className="gap-2"
            >
              <Linkedin className="h-4 w-4 text-blue-600" />
              LinkedIn
            </Button>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t" />
            <span className="mx-3 text-xs uppercase text-muted-foreground">
              or continue with email
            </span>
            <div className="flex-grow border-t" />
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                className="w-full gap-2"
                disabled={loading}
                onClick={() => handleEmailAuth("login")}
              >
                <Mail className="h-4 w-4" />
                {loading ? "Signing in..." : "Sign In with Email"}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                className="w-full gap-2"
                disabled={loading}
                onClick={() => handleEmailAuth("register")}
              >
                Create Account
              </Button>
            </TabsContent>
          </Tabs>

          {error && (
            <p className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              {message}
            </p>
          )}

          <p className="text-[11px] text-center text-muted-foreground leading-relaxed pt-1">
            Secured with encrypted Supabase Auth &amp; TLS. You retain 100% ownership of all uploaded resume data. By signing in, you acknowledge our{" "}
            <a href="/privacy-policy" className="text-primary underline">Privacy Policy</a>{" "}
            and{" "}
            <a href="/terms" className="text-primary underline">Terms &amp; Conditions</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container py-16 text-center">Loading...</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
