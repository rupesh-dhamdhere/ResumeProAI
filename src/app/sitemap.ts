import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/sample-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://resumepro.ai";

  const staticRoutes = [
    "",
    "/features",
    "/pricing",
    "/templates",
    "/builder",
    "/ats-checker",
    "/dashboard",
    "/blog",
    "/contact",
    "/login",
    "/privacy-policy",
    "/terms",
    "/data-request",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const blogRoutes = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
