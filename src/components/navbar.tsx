"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  FileCheck2,
  Menu,
  Moon,
  Sun,
  X,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { loadDemoUser, saveDemoUser } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/resume";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/templates", label: "Templates" },
  { href: "/builder", label: "Resume Builder" },
  { href: "/ats-checker", label: "ATS Checker" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setMounted(true);
    setUser(loadDemoUser());

    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || "",
            fullName:
              data.user.user_metadata?.full_name ||
              data.user.email?.split("@")[0] ||
              "User",
            plan: "pro",
            role: "user",
            provider: "email",
            createdAt: data.user.created_at,
          });
        }
      });
    }
  }, [pathname]);

  const handleLogout = async () => {
    saveDemoUser(null);
    setUser(null);
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/");
  };

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-heading font-bold text-lg tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-teal text-white shadow-sm">
            <FileCheck2 className="h-5 w-5" />
          </span>
          <span>
            ResumePro <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </Button>
          )}

          <div className="hidden sm:flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand-teal" />
                Admin
              </Button>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-1">
                <span className="hidden md:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {user.fullName}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout} title="Sign Out">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/builder">
                  <Button size="sm" className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Build Resume
                  </Button>
                </Link>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-background px-4 py-4 space-y-2 animate-in fade-in-0 slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
            >
              Admin Panel
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
            >
              Contact
            </Link>
          </div>
          <div className="pt-2 border-t flex gap-2">
            {user ? (
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                Sign Out ({user.fullName})
              </Button>
            ) : (
              <>
                <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/builder" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Build Resume</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
