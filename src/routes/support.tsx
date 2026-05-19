import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Mail, PhoneCall, HelpCircle, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support & Help — ZenTurf" }] }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-20">
      <div className="space-y-4 text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          We're here to help.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Have questions about your booking, payment gateways, or cancellation? Browse our support resources below.
        </p>
      </div>

      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-primary" /> Frequently Asked Questions
      </h2>

      <Accordion type="single" collapsible className="w-full space-y-4 mb-16">
        <AccordionItem value="item-1" className="border border-border/50 rounded-xl px-4 bg-card shadow-sm">
          <AccordionTrigger className="hover:no-underline font-semibold py-4">
            How do I cancel my turf booking?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-4 leading-normal">
            You can cancel your booking directly from your Dashboard up to 6 hours before your scheduled slot. The slot will automatically unlock on the map, and your payment will be refunded within 3-5 business days.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border border-border/50 rounded-xl px-4 bg-card shadow-sm">
          <AccordionTrigger className="hover:no-underline font-semibold py-4">
            Can I book multiple consecutive hours?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-4 leading-normal">
            Yes! Click your starting slot time, choose a duration (1 to 5 hours) or tap the end slot on the calendar. ZenTurf will automatically group the hours and block out the availability for that consecutive range in a single payment process.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border border-border/50 rounded-xl px-4 bg-card shadow-sm">
          <AccordionTrigger className="hover:no-underline font-semibold py-4">
            What payment methods do you support?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-4 leading-normal">
            We support secure cards (Visa, MasterCard), UPI, Net Banking, and local digital wallets. All transactions are securely completed with instant status updates.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="border-t border-border pt-10">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-primary" /> Contact Support Team
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-sm items-center">
            <Mail className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h4 className="font-bold text-foreground">Email Support</h4>
              <p className="text-xs text-muted-foreground mt-0.5">support@zenturf.com</p>
            </div>
          </div>
          <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-sm items-center">
            <FileText className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h4 className="font-bold text-foreground">Helpdesk Tickets</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Response within 2 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
