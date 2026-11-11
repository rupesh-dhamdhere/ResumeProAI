import { Quote, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TESTIMONIALS } from "@/lib/sample-data";

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 border-b">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center space-y-3 mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-teal">
            Proven Interview Lift
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Trusted by Engineers, PMs & Leaders Worldwide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="flex flex-col justify-between">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Quote className="h-6 w-6 text-primary/40" />
                  <Badge variant="success" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    ATS {t.scoreBefore} → {t.scoreAfter}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="pt-2 border-t">
                  <p className="font-heading text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
