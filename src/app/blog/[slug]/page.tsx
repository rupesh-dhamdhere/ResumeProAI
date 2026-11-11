import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { BLOG_POSTS } from "@/lib/sample-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: "Article Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <article className="container max-w-3xl py-14 space-y-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Blog
      </Link>

      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant="accent">{post.category}</Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {post.readTime} • {post.publishedAt}
          </span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          {post.title}
        </h1>
        <p className="text-lg text-muted-foreground">{post.excerpt}</p>
        <div className="pt-2 border-t text-sm">
          <span className="font-semibold">{post.author.name}</span>{" "}
          <span className="text-muted-foreground">— {post.author.role}</span>
        </div>
      </header>

      <div className="space-y-5 text-base leading-relaxed text-foreground/90">
        {post.content.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>

      <div className="rounded-2xl border bg-muted/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-lg">
            Ready to test your own resume against ATS standards?
          </h3>
          <p className="text-sm text-muted-foreground">
            Get a free instant ATS score out of 100 and AI keyword suggestions.
          </p>
        </div>
        <Link href="/ats-checker">
          <Button className="gap-1.5 shrink-0">
            Check ATS Score <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </article>
  );
}
