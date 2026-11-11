import type { Metadata } from "next";
import { DataRequestClient } from "@/components/compliance/data-request-client";

export const metadata: Metadata = {
  title: "Data Deletion & Export Requests (DPDP Act 2023 & GDPR)",
  description:
    "Exercise your right to access, export, or permanently delete your resume and personal data under the DPDP Act (India) 2023 and GDPR.",
};

export default function DataRequestPage() {
  return <DataRequestClient />;
}
