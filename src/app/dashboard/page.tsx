import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Manage saved resumes, version history, ATS score history, and job description match reports.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
