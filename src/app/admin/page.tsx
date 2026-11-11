import type { Metadata } from "next";
import { AdminClient } from "@/components/admin/admin-client";

export const metadata: Metadata = {
  title: "Admin Panel",
  description:
    "ResumePro AI administration dashboard for user management, templates, subscriptions, and analytics.",
};

export default function AdminPage() {
  return <AdminClient />;
}
