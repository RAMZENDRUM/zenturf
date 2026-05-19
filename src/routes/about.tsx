import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Compass, Users2, Zap } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About Us — ZenTurf" }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-20">
      <div className="space-y-6 text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          We simplify sports bookings.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          ZenTurf was founded to solve a simple problem: booking a sports slot should be as effortless as order delivery. No more phone tag or obsolete calendars.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
          <Zap className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-foreground">Instant Booking</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-normal">
              Select consecutive hours and confirm in real time. We guarantee zero double bookings.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-foreground">Secure Payments</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-normal">
              Encrypted transaction flow through local gateways keeps your payment details safe.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
          <Compass className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-foreground">Explore Sports</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-normal">
              Discover verified local turfs, court sizes, and detailed venue information instantly.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
          <Users2 className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-foreground">Active Community</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-normal">
              Connect with fellow players, organize matches, and check-in effortlessly using unique QR codes.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center border-t pt-10">
        <h2 className="text-xl font-bold">Ready to get in the game?</h2>
        <div className="mt-4 flex justify-center gap-3">
          <Button asChild>
            <Link to="/">Explore Venues</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/support">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
