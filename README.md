# ResumePro AI — ATS-Friendly Resume Maker & Job Match Engine

Modern, full-stack SaaS resume builder built with **Next.js 15**, **React 19**, **TypeScript**, **Tailwind CSS**, **Shadcn UI**, and **Supabase**.

## Core Features

- **User Authentication**: Sign up / Login with Email, Google, and LinkedIn via Supabase Auth (with instant local workspace fallback when Supabase env vars are not yet configured).
- **10-Step Resume Builder**: Personal Information, Professional Summary, Work Experience, Education, Skills, Certifications, Projects, Achievements, Languages, and References.
- **Dynamic Editing & Drag-and-Drop Reordering**: Add, edit, delete, toggle visibility, and reorder sections with `@dnd-kit`.
- **ATS Optimization Engine**: Real-time score out of 100 across completeness, readability, impact metrics, action verbs, and role keywords.
- **AI Features (`/api/ai`)**: AI-generated professional summary, experience bullet points, job-title keyword suggestions, cover letter generator, and resume improvement recommendations.
- **22+ ATS-Friendly Templates**: Modern, Professional, Executive, Fresher, Tech, and Marketing styles with live preview and 1-click switching.
- **Job Description Matching (`/ats-checker` & Builder)**: Paste any job posting to calculate match percentage, highlight missing keywords, and add missing skills in 1 click.
- **Exports & Sharing**: Text-selectable PDF (`jsPDF`), Word (`.docx`), Print CSS (`@media print`), and shareable public links (`/share/[slug]`).
- **User Dashboard (`/dashboard`)**: Saved resumes, version snapshots, ATS history, job match reports, and analytics.
- **Admin Panel (`/admin`)**: User management, template catalog management, subscription metrics, and platform analytics.

## Payment Gateway (YouPI-PG)

The self-hosted **YouPI-PG** (`youpi-pg/YouPI-PG`) UPI payment gateway is installed at `../YouPI-PG` and integrated via server-side Next.js routes:
- `POST /api/payments/create-session` — Creates a YouPI-PG session using `YOUPI_API_URL`, `YOUPI_MERCHANT_ID`, and `YOUPI_MERCHANT_API_KEY` (with a local UPI preview fallback when the gateway daemon is offline).
- `GET /api/payments/status` — Polls payment status from YouPI-PG.
- `POST /api/payments/webhook` — Verifies HMAC-SHA256 webhook signatures with `YOUPI_WEBHOOK_SECRET`.
- `/checkout` — Checkout UI wired to the Pro ($9/mo) and Premium ($19/mo) plans.

To run YouPI-PG locally alongside ResumePro AI:
```bash
cd ../YouPI-PG
npm run dev
```

## Getting Started

1. Copy `.env.example` to `.env.local` and configure your Supabase keys (optional for local mode):
   ```bash
   cp .env.example .env.local
   ```
2. Run the database schema in your Supabase SQL Editor from `supabase/schema.sql`.
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).
