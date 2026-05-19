import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatINR, formatTime } from "@/lib/format";
import { calculateRefund } from "@/lib/refund";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ZenTurf" }] }),
  component: Dashboard,
});

type Booking = {
  id: string;
  booking_ref: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  payment_status: string;
  qr_code_data: string | null;
  refund_amount: number;
  venues: { name: string; city: string | null; address: string | null } | null;
};

type Notification = {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: bookings = [] } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zenturf_bookings_v2")
        .select(
          "id,booking_ref,booking_date,start_time,end_time,total_price,status,payment_status,qr_code_data,refund_amount,venues(name,city,address)",
        )
        .eq("user_id", user!.id)
        .order("booking_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Booking[];
    },
    enabled: !!user,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["my-notifs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zenturf_notifications_v2")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("dash-notifs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["my-notifs", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const now = new Date();
  const upcoming = bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      new Date(`${b.booking_date}T${b.start_time}`) >= now,
  );
  const past = bookings.filter(
    (b) =>
      b.status === "cancelled" ||
      new Date(`${b.booking_date}T${b.start_time}`) < now,
  );

  const cancelBooking = async (b: Booking) => {
    const refund = calculateRefund(b.booking_date, b.start_time, b.total_price);
    if (
      !confirm(
        `Cancel this booking? You'll get ${refund.label}: ${formatINR(refund.amount)} added to your wallet.`,
      )
    )
      return;

    const { error } = await supabase
      .from("zenturf_bookings_v2")
      .update({
        status: "cancelled",
        payment_status: (refund.amount > 0 ? "refunded" : b.payment_status) as
          | "paid"
          | "pending"
          | "refunded",
        cancellation_reason: "User cancelled",
        refund_amount: refund.amount,
      })
      .eq("id", b.id);
    if (error) {
      toast.error(error.message);
      return;
    }

    if (refund.amount > 0 && profile) {
      await supabase
        .from("profiles")
        .update({
          wallet_credits: Number(profile.wallet_credits ?? 0) + refund.amount,
        })
        .eq("id", user!.id);
    }
    await supabase.from("zenturf_notifications_v2").insert({
      user_id: user!.id,
      type: "cancellation",
      message: `Booking ${b.booking_ref} cancelled. ${refund.label}: ${formatINR(refund.amount)}`,
    });
    toast.success(`Cancelled — ${refund.label}`);
    qc.invalidateQueries({ queryKey: ["my-bookings", user!.id] });
    qc.invalidateQueries({ queryKey: ["my-profile", user!.id] });
  };

  const markAllRead = async () => {
    await supabase
      .from("zenturf_notifications_v2")
      .update({ is_read: true })
      .eq("user_id", user!.id)
      .eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["my-notifs", user!.id] });
  };

  return (
    <div className="w-full max-w-[95%] xl:max-w-[92%] mx-auto px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {profile?.name ?? user?.email}
          </p>
        </div>
        <Card className="px-4 py-2">
          <div className="text-xs text-muted-foreground">Wallet credits</div>
          <div className="text-xl font-bold">
            {formatINR(Number(profile?.wallet_credits ?? 0))}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications{" "}
            {notifications.filter((n) => !n.is_read).length > 0 && (
              <Badge className="ml-2" variant="destructive">
                {notifications.filter((n) => !n.is_read).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <EmptyState text="No upcoming bookings" cta />
          ) : (
            upcoming.map((b) => (
              <BookingCard
                key={b.id}
                b={b}
                onCancel={() => cancelBooking(b)}
                showQR
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          {past.length === 0 ? (
            <EmptyState text="No past bookings" />
          ) : (
            past.map((b) => <BookingCard key={b.id} b={b} />)
          )}
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-2">
          <div className="flex justify-end">
            {notifications.some((n) => !n.is_read) && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>
          {notifications.length === 0 ? (
            <EmptyState text="No notifications" />
          ) : (
            notifications.map((n) => (
              <Card
                key={n.id}
                className={n.is_read ? "" : "border-primary/40 bg-primary/5"}
              >
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {n.type.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm">{n.message}</div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingCard({
  b,
  onCancel,
  showQR,
}: {
  b: Booking;
  onCancel?: () => void;
  showQR?: boolean;
}) {
  const refund = calculateRefund(b.booking_date, b.start_time, b.total_price);
  const qrString = b.qr_code_data || JSON.stringify({ ref: b.booking_ref });
  
  return (
    <Card className="overflow-hidden border border-border/80 hover:border-primary/30 transition-all duration-300 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] rounded-2xl bg-card">
      <div className="flex flex-col md:flex-row">
        {/* Ticket Left Section: Venue Details & Info */}
        <div className="flex-1 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-dashed border-border/80">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {b.venues?.type || b.sport_type || "Booking"}
              </span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${b.status === "cancelled" ? "bg-red-400" : "bg-emerald-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${b.status === "cancelled" ? "bg-red-500" : "bg-emerald-500"}`}></span>
                </span>
                <span className={`text-xs font-semibold capitalize ${b.status === "cancelled" ? "text-red-500" : "text-emerald-500"}`}>
                  {b.status}
                </span>
              </div>
            </div>
            
            <h3 className="text-xl font-bold tracking-tight text-foreground">{b.venues?.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-accent/20 flex items-center justify-center">📍</span>
              {b.venues?.address || b.venues?.city || "Chennai"}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Reference ID</span>
                <span className="font-mono text-sm font-semibold mt-0.5 inline-flex items-center gap-1 text-foreground">
                  {b.booking_ref}
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(b.booking_ref);
                      toast.success("Reference copied!");
                    }}
                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors border-none"
                    title="Copy reference ID"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Date & Time</span>
                <span className="text-sm font-semibold mt-0.5 text-foreground block">
                  {new Date(b.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  <span className="text-xs font-normal text-muted-foreground block mt-0.5">
                    {formatTime(b.start_time)} – {formatTime(b.end_time)}
                  </span>
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Total Amount</span>
                <span className="text-sm font-bold mt-0.5 text-primary block">
                  {formatINR(b.total_price)}
                  <span className="text-xs font-normal text-muted-foreground block mt-0.5 capitalize">
                    {b.payment_status}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {b.refund_amount > 0 && (
            <div className="mt-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Refunded: {formatINR(b.refund_amount)} (Successfully processed back to wallet)
            </div>
          )}
        </div>

        {/* Ticket Right Section: QR Pass or Action */}
        <div className="w-full md:w-48 bg-muted/20 p-6 flex flex-col items-center justify-center gap-4 text-center">
          {showQR && b.status === "confirmed" ? (
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white p-2.5 rounded-xl border shadow-[var(--shadow-card)] transition-transform hover:scale-105 duration-300">
                <QRCodeCanvas value={qrString} size={96} />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">Scan at entry gate</span>
            </div>
          ) : b.status === "cancelled" ? (
            <div className="text-center py-4">
              <span className="text-3xl filter grayscale opacity-40">🚫</span>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Booking Cancelled</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="text-3xl">✅</span>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Session Completed</p>
            </div>
          )}

          {onCancel && b.status === "confirmed" && (
            <div className="w-full mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCancel}
                className="w-full text-xs font-semibold border-destructive/20 hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer"
              >
                Cancel Booking
              </Button>
              <span className="text-[9px] text-muted-foreground block mt-1">
                Refund: {refund.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ text, cta }: { text: string; cta?: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-dashed py-12 text-center">
      <p className="text-3xl">📭</p>
      <p className="mt-2 font-medium">{text}</p>
      {cta && (
        <Button asChild className="mt-3">
          <Link to="/">Browse venues</Link>
        </Button>
      )}
    </div>
  );
}
