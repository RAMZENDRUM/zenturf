import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Copy, CalendarPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatINR, formatTime } from "@/lib/format";
import { downloadICS } from "@/lib/calendar";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/book/$venueId")({
  validateSearch: (s: Record<string, unknown>) => ({
    slotId: (s.slotId as string) ?? "",
    slotIds: (s.slotIds as string) ?? "",
    duration: s.duration ? Number(s.duration) : null,
  }),
  head: () => ({ meta: [{ title: "Book — ZenTurf" }] }),
  component: BookPage,
});

function BookPage() {
  const { venueId } = Route.useParams();
  const { slotId, slotIds, duration } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState("");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string>("");

  const ids = slotIds ? slotIds.split(",") : (slotId ? [slotId] : []);

  const { data, isLoading } = useQuery({
    queryKey: ["book-info", venueId, slotId, slotIds],
    queryFn: async () => {
      const [{ data: v }, { data: s }] = await Promise.all([
        supabase
          .from("zenturf_venues_v2")
          .select("id,name,address,city,sport_tags,price_per_hour,photos")
          .eq("id", venueId)
          .single(),
        ids.length > 0
          ? supabase.from("zenturf_slots_v2").select("*").in("id", ids).order("start_time")
          : Promise.resolve({ data: null } as any),
      ]);
      return { venue: v, slots: (s ?? []) as any[] };
    },
    enabled: ids.length > 0,
  });

  if (ids.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-10 text-center">
        <p>No slot selected. Please pick a range from the venue page.</p>
        <Button asChild className="mt-3">
          <Link to="/venue/$id" params={{ id: venueId }}>
            Back to venue
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !data?.venue || !data?.slots || data.slots.length === 0) {
    return <div className="w-full max-w-2xl mx-auto px-4 py-10">Loading…</div>;
  }

  const { venue, slots } = data;
  const slot = slots[0];

  const totalHours = duration !== null ? duration : slots.length;
  const total = slots.reduce((sum, s) => sum + Number(s.price_override || venue.price_per_hour), 0);

  // Format time range
  const startStr = slot.start_time;
  const [h, m] = startStr.split(":").map(Number);
  const startMins = h * 60 + m;
  const endMins = startMins + totalHours * 60;
  
  const formatMinsToTime = (totalMins: number) => {
    const hrs = Math.floor(totalMins / 60) % 24;
    const mins = totalMins % 60;
    const ampm = hrs >= 12 ? "PM" : "AM";
    const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
    const displayMins = mins === 0 ? "" : `:${mins.toString().padStart(2, "0")}`;
    return `${displayHrs}${displayMins} ${ampm}`;
  };

  const formattedStart = formatMinsToTime(startMins);
  const formattedEnd = formatMinsToTime(endMins);

  const confirm = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setPaying(true);

    const loadScript = (src: string) => {
      return new Promise<boolean>((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const amountInPaise = Math.round(total * 100);
    const receiptId = `rcpt-${Date.now()}`;

    let orderId = "";
    try {
      const response = await fetch("https://zenturf-hr3ekhmcz-ramzendrums-projects.vercel.app/api/zenpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: amountInPaise,
          receipt: receiptId
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("ZenPay Order API Error Response:", errorText);
        throw new Error(`Server returned status ${response.status}: ${errorText}`);
      }
      
      const resData = await response.json();
      orderId = resData?.orderId || "";
      if (!orderId) {
        throw new Error("Failed to retrieve order ID from backend response");
      }
    } catch (err: any) {
      toast.error(`Order creation failed: ${err.message || err}`);
      setPaying(false);
      return;
    }

    const bookingsToInsert = slots.map((s) => {
      const pricePerSlot = total / slots.length;
      return {
        user_id: user.id,
        venue_id: venueId,
        slot_id: s.id,
        sport_type: sport || (venue.sport_tags[0] ?? null),
        booking_date: s.date,
        start_time: s.start_time,
        end_time: s.end_time,
        total_price: pricePerSlot,
        payment_status: "pending",
        zenpay_order_id: orderId,
        status: "pending" as any,
      };
    });

    const { data: insertedList, error } = await supabase
      .from("zenturf_bookings_v2")
      .insert(bookingsToInsert)
      .select("id, booking_ref");

    if (error || !insertedList || insertedList.length === 0) {
      toast.error(error?.message ?? "Error saving booking. Please contact support.");
      setPaying(false);
      return;
    }

    const mainRef = insertedList.map((b) => b.booking_ref).join(", ");
    const mainBooking = insertedList[0];

    const loaded = await loadScript("https://zenwalletcore-engine-production.up.railway.app/ZenPay-sdk.js");
    if (!loaded || !(window as any).ZenPay) {
      toast.error("Failed to load ZenPay SDK");
      setPaying(false);
      return;
    }

    const ZenPayClass = (window as any).ZenPay;
    const zenpay = new ZenPayClass({
      key: "pk_live_36110d85cbaa8b021189378d15b3",
      onSuccess: async (paymentResult: any) => {
        toast.success("Payment Successful!");

        await supabase
          .from("zenturf_bookings_v2")
          .update({
            payment_status: "paid",
            status: "confirmed" as any,
            payment_id: paymentResult.payment_id || `ZP-${Date.now()}`
          })
          .eq("zenpay_order_id", orderId);

        setPaying(false);

        const qr = JSON.stringify({ ref: mainBooking.booking_ref, id: mainBooking.id });
        
        await supabase
          .from("zenturf_bookings_v2")
          .update({ qr_code_data: qr })
          .eq("id", mainBooking.id);

        await supabase.from("zenturf_notifications_v2").insert({
          user_id: user.id,
          type: "booking_confirmed",
          message: `Booking ${mainBooking.booking_ref} confirmed at ${venue.name} (${totalHours} hrs)`,
        });

        console.log(
          `[ZenPay] Booking ${mainRef} confirmed at ${venue.name} on ${slot.date} ${formattedStart} – ${formattedEnd}`,
        );

        setBookingRef(mainRef);
        setQrData(qr);
        setStep(4);
      },
      onFailure: (error: any) => {
        toast.error(`Payment failed: ${error?.message || "Transaction aborted."}`);
        setPaying(false);
      }
    });

    zenpay.open({
      order_id: orderId
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Stepper */}
      <div className="mb-8 flex items-center justify-between">
        {["Slot", "Details", "Payment", "Done"].map((label, i) => {
          const idx = i + 1;
          const active = step === idx;
          const done = step > idx;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div
                className={`grid shrink-0 h-8 w-8 place-items-center rounded-full text-xs font-medium ${
                  done
                    ? "bg-success text-success-foreground"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : idx}
              </div>
              <span
                className={`ml-2 text-[11px] sm:text-sm whitespace-nowrap ${active ? "font-bold text-foreground" : "font-medium text-muted-foreground hidden sm:block"}`}
              >
                {label}
              </span>
              {i < 3 && <div className="mx-2 h-px flex-1 bg-border shrink-0 min-w-2" />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm slot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border p-4">
                  <div className="font-medium">{venue.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {venue.address}, {venue.city}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">{slot.date}</span> ·{" "}
                    {formattedStart} – {formattedEnd} ({totalHours} {totalHours === 1 ? "hour" : "hours"})
                  </div>
                  <div className="mt-2 text-lg font-bold">
                    {formatINR(total)}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <strong className="text-foreground">
                    Cancellation policy:
                  </strong>{" "}
                  Free up to 24h before · 50% refund 2–24h · No refund within
                  2h.
                </div>
                <Button className="w-full" onClick={() => setStep(2)}>
                  Continue
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Your details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {venue.sport_tags.length > 1 && (
                  <div>
                    <Label>Sport</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {venue.sport_tags.map((s: string) => (
                        <Button
                          key={s}
                          variant={sport === s ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSport(s)}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="phone">Contact phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91…"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(3)}>
                    Continue to payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <span>Total</span>
                  <span className="text-2xl font-bold">{formatINR(total)}</span>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Demo mode — no real charge. Razorpay integration available
                  later.
                </div>
                <Button className="w-full" onClick={confirm} disabled={paying}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {paying ? "Processing…" : `Pay ${formatINR(total)}`}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 4 && bookingRef && (
            <Card>
              <CardHeader>
                <Badge className="w-fit bg-success text-success-foreground">
                  Confirmed
                </Badge>
                <CardTitle>Booking confirmed!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-xs text-muted-foreground">
                    Booking reference
                  </div>
                  <div className="text-2xl font-bold tracking-wider">
                    {bookingRef}
                  </div>
                </div>
                <div className="flex justify-center rounded-lg border p-4">
                  <QRCodeCanvas value={qrData} size={160} />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Show this QR at the venue to check in
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/venue/${venueId}`,
                      );
                      toast.success("Invite link copied");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy invite
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const endHrs = Math.floor(endMins / 60) % 24;
                      const endMinsVal = endMins % 60;
                      const end24h = `${endHrs.toString().padStart(2, "0")}:${endMinsVal.toString().padStart(2, "0")}:00`;
                      downloadICS({
                        title: `ZenTurf: ${venue.name}`,
                        description: `Booking ref ${bookingRef}`,
                        location: `${venue.address}, ${venue.city}`,
                        date: slot.date,
                        startTime: slots[0].start_time,
                        endTime: end24h,
                      });
                    }}
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" /> Add to calendar
                  </Button>
                </div>
                <Button asChild className="w-full">
                  <Link to="/dashboard">Go to dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
