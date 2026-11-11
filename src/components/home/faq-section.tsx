"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS } from "@/lib/sample-data";

export function FAQSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-3xl">
        <div className="text-center space-y-3 mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            FAQ
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full rounded-xl border bg-card px-6">
          {FAQS.map((item, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`} className="last:border-b-0">
              <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
