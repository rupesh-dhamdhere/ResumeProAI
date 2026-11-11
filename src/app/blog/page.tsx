import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Career & ATS Strategy Blog",
  description:
    "Actionable guides on beating ATS parsers, quantifying resume impact, and matching job descriptions.",
};

export default function BlogPage() {
  return (
    <div className="container py-14 space-y-10">
      <div className="max-w-2xl space-y-3">
        <Badge variant="accent">
          <BookOpen className="mr-1.5 h-3.5 w-3.5" /> ResumePro Career Journal
        </Badge>
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          ATS Strategy & Resume Writing Guides
        </h1>
        <p className="text-muted-foreground">
          Data-backed playbooks from career coaches and hiring engineers to help your resume pass automated screeners.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BLOG_POSTS.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
            <Card className="h-full flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {post.readTime}
                  </span>
                </div>
                <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-3 border-t text-xs">
                  <div>
                    <p className="font-semibold text-foreground">
                      {post.author.name}
                    </p>
                    <p className="text-muted-foreground">{post.publishedAt}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    Read <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
