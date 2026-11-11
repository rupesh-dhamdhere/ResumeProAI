import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRICING_PLANS } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

export function PricingSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30 border-b">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center space-y-3 mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Simple, Transparent Pricing
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Invest Once, Land Your Next Offer Faster
          </h2>
          <p className="text-muted-foreground">
            Start free forever. Upgrade anytime for unlimited AI writing, all 22+ templates, and custom branding removal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => {
            const isPro = plan.id === "pro";
            return (
              <Card
                key={plan.id}
                className={cn(
                  "flex flex-col justify-between relative",
                  isPro &&
                    "border-primary shadow-xl shadow-primary/10 lg:-translate-y-2"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-6">
                    <Badge
                      variant={isPro ? "default" : "accent"}
                      className="shadow-sm"
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 pt-7">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-heading text-4xl font-extrabold">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <ul className="space-y-2.5">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-brand-teal shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4">
                  <Link href={plan.id === "free" ? "/builder" : `/checkout?plan=${plan.id}`} className="w-full">
                    <Button
                      className="w-full"
                      variant={isPro ? "default" : "outline"}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
