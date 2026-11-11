"use client";

import React, { useState } from "react";
import { CheckCircle2, Mail, MapPin, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("General Support");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="container py-14 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <Badge variant="accent">Contact ResumePro AI</Badge>
          <h1 className="font-heading text-4xl font-bold tracking-tight">
            We&apos;d Love to Hear From You
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Have questions about Pro/Premium plans, university partnerships, ATS parsing, or custom enterprise licensing? Reach out and our team will reply within 24 hours.
          </p>

          <div className="space-y-4 pt-2 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Support & Sales</p>
                <p className="text-muted-foreground">support@resumepro.ai</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-brand-teal mt-0.5" />
              <div>
                <p className="font-semibold">Response Time</p>
                <p className="text-muted-foreground">Under 24 hours (Mon–Sat)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="font-semibold">Headquarters</p>
                <p className="text-muted-foreground">548 Market St, San Francisco, CA</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Card>
            <CardContent className="p-6 sm:p-8">
              {submitted ? (
                <div className="py-10 text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                  <h2 className="font-heading text-2xl font-bold">
                    Message Received!
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Thanks, {name}. We have logged your inquiry regarding{" "}
                    <strong>{topic}</strong> and will reply to{" "}
                    <strong>{email}</strong> shortly.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-name">Full Name</Label>
                      <Input
                        id="contact-name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email">Email Address</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-topic">Topic</Label>
                    <Input
                      id="contact-topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message">Message</Label>
                    <Textarea
                      id="contact-message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you today?"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full gap-2">
                    <Send className="h-4 w-4" /> Send Message
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
