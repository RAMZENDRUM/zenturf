import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  BadgeCent,
  CalendarDays,
  CalendarCheck,
  CircleAlert,
  Settings,
  Star,
  Bell,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  Percent,
  Check,
  X,
  Lock,
  Unlock,
  MapPin,
  Maximize2,
  Clock,
  Sparkles,
  Volume2,
  ThermometerSnowflake,
  Tv,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatTime } from "@/lib/format";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

export const Route = createFileRoute("/owner")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href } as any,
      });
    }

    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.session.user.id);

    if (error || !roles || roles.length === 0) {
      throw redirect({
        to: "/",
        search: { denied: "true" } as any,
      });
    }

    const roleList = roles.map((r) => r.role);
    if (!roleList.includes("owner") && !roleList.includes("admin")) {
      throw redirect({
        to: "/",
        search: { denied: "true" } as any,
      });
    }
  },
  head: () => ({ meta: [{ title: "Owner Portal — ZenTurf" }] }),
  component: OwnerPortalPage,
});

type Venue = {
  id: string;
  name: string;
  type: string;
  sport_tags: string[];
  description: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  amenities: string[];
  photos: string[];
  price_per_hour: number;
  price_per_day: number | null;
  area_sqft: number | null;
  rating: number;
  total_reviews: number;
  is_approved: boolean;
  seating_capacity?: number;
  stage_details?: string;
  has_ac?: boolean;
  sound_system_support?: string;
};

type Booking = {
  id: string;
  user_id: string;
  venue_id: string;
  slot_id: string;
  sport_type: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  payment_status: string;
  payment_id: string | null;
  booking_ref: string;
  status: string;
  created_at: string;
  profiles: { name: string | null; email: string | null } | null;
  zenturf_venues_v2: { name: string } | null;
};

type Review = {
  id: string;
  user_id: string;
  venue_id: string;
  booking_id: string | null;
  rating: number;
  comment: string | null;
  owner_reply: string | null;
  created_at: string;
  profiles: { name: string | null; avatar_url: string | null } | null;
  zenturf_venues_v2: { name: string } | null;
};

type Notification = {
  id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type PricingRule = {
  weekend_markup: number; // percent
  peak_hour_markup: number; // percent
  peak_hours_start: string; // e.g. "17:00:00"
  discount_2h: number; // percent
  discount_3h: number; // percent
  custom_offer_code: string;
  custom_offer_discount: number; // percent
};

function OwnerPortalPage() {
  const { user, role, loading, roleLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Local state for adding/editing venues
  const [isVenueDialogOpen, setIsVenueDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueFormData, setVenueFormData] = useState({
    name: "",
    type: "Football Turf",
    description: "",
    address: "",
    city: "Chennai",
    price_per_hour: 1000,
    price_per_day: 0,
    amenities: [] as string[],
    photos: [] as string[],
    sport_tags: ["Football"],
    seating_capacity: 0,
    stage_details: "",
    has_ac: false,
    sound_system_support: "",
  });

  // Local state for pricing management
  const [pricingRules, setPricingRules] = useState<PricingRule>({
    weekend_markup: 15,
    peak_hour_markup: 20,
    peak_hours_start: "17:00:00",
    discount_2h: 5,
    discount_3h: 10,
    custom_offer_code: "ZENOFFER",
    custom_offer_discount: 10,
  });

  // Local state for Availability Management
  const [selectedVenueForAvailability, setSelectedVenueForAvailability] = useState<string>("");
  const [selectedDateForAvailability, setSelectedDateForAvailability] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [maintenanceMode, setMaintenanceMode] = useState<Record<string, boolean>>({});

  // Local state for slot generation
  const [genStartHour, setGenStartHour] = useState<string>("6");
  const [genEndHour, setGenEndHour] = useState<string>("22");
  const [genHourlyRate, setGenHourlyRate] = useState<number>(1000);

  // Local state for reviews reply
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  // Redirect if unauthorized
  useEffect(() => {
    if (!loading && !roleLoading && (!user || (role !== "owner" && role !== "admin"))) {
      toast.error("Unauthorized: Venue Owner access required.");
    }
  }, [user, role, loading, roleLoading]);

  // Queries
  const { data: venues = [], refetch: refetchVenues } = useQuery({
    queryKey: ["owner-venues", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("zenturf_venues_v2")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Venue[];
    },
    enabled: !!user,
  });

  const { data: bookings = [], refetch: refetchBookings } = useQuery({
    queryKey: ["owner-bookings", user?.id],
    queryFn: async () => {
      if (!user || venues.length === 0) return [];
      const venueIds = venues.map((v) => v.id);
      const { data, error } = await supabase
        .from("zenturf_bookings_v2")
        .select("*, profiles(name, email), zenturf_venues_v2(name)")
        .in("venue_id", venueIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Booking[];
    },
    enabled: !!user && venues.length > 0,
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["owner-reviews", user?.id],
    queryFn: async () => {
      if (!user || venues.length === 0) return [];
      const venueIds = venues.map((v) => v.id);
      const { data, error } = await supabase
        .from("zenturf_reviews_v2")
        .select("*, profiles(name, avatar_url), zenturf_venues_v2(name)")
        .in("venue_id", venueIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Review[];
    },
    enabled: !!user && venues.length > 0,
  });

  const { data: notifications = [], refetch: refetchNotifs } = useQuery({
    queryKey: ["owner-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("zenturf_notifications_v2")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  // Query for calendar slots
  const { data: slots = [], refetch: refetchSlots } = useQuery({
    queryKey: ["owner-slots", selectedVenueForAvailability, selectedDateForAvailability],
    queryFn: async () => {
      if (!selectedVenueForAvailability) return [];
      const { data, error } = await supabase
        .from("zenturf_slots_v2")
        .select("*")
        .eq("venue_id", selectedVenueForAvailability)
        .eq("date", selectedDateForAvailability)
        .order("start_time");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!selectedVenueForAvailability,
  });

  // Set default venue for Availability when venues load
  useEffect(() => {
    if (venues.length > 0 && !selectedVenueForAvailability) {
      setSelectedVenueForAvailability(venues[0].id);
    }
    const selected = venues.find((v) => v.id === selectedVenueForAvailability);
    if (selected) {
      setGenHourlyRate(Number(selected.price_per_hour));
    }
  }, [venues, selectedVenueForAvailability]);

  // Calculations
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
    const pendingActions = bookings.filter((b) => b.status === "pending").length;

    // Occupancy Stats (Simulated based on booked slots count vs total slots)
    const confirmedCount = confirmedBookings.length;
    const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;
    const occupancyRate = totalBookings > 0 ? Math.round((confirmedCount / (totalBookings || 1)) * 100) : 0;

    // Upcoming bookings (date >= today)
    const todayStr = new Date().toISOString().split("T")[0];
    const upcoming = bookings.filter(
      (b) => b.status === "confirmed" && b.booking_date >= todayStr
    );

    return {
      totalBookings,
      totalRevenue,
      occupancyRate,
      pendingActions,
      upcoming,
      cancelledCount,
    };
  }, [bookings]);

  // Chart Data
  const revenueChartData = useMemo(() => {
    // Group bookings by date (past 7 days)
    const map = new Map<string, number>();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    last7Days.forEach((date) => map.set(date, 0));

    bookings.forEach((b) => {
      if (b.status === "confirmed" && map.has(b.booking_date)) {
        map.set(b.booking_date, map.get(b.booking_date)! + Number(b.total_price));
      }
    });

    return last7Days.map((date) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Earnings: map.get(date) || 0,
    }));
  }, [bookings]);

  // Venue Distribution Chart Data
  const venueChartData = useMemo(() => {
    const map = new Map<string, number>();
    venues.forEach((v) => map.set(v.name, 0));
    bookings.forEach((b) => {
      if (b.status === "confirmed") {
        const vName = b.zenturf_venues_v2?.name || "Unknown Venue";
        map.set(vName, (map.get(vName) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [venues, bookings]);

  // Actions
  const handleOpenAddVenue = () => {
    setEditingVenue(null);
    setVenueFormData({
      name: "",
      type: "Football Turf",
      description: "",
      address: "",
      city: "Chennai",
      price_per_hour: 1000,
      price_per_day: 0,
      amenities: ["Parking", "Washrooms", "Floodlights"],
      photos: ["https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800"],
      sport_tags: ["Football"],
      seating_capacity: 0,
      stage_details: "",
      has_ac: false,
      sound_system_support: "",
    });
    setIsVenueDialogOpen(true);
  };

  const handleOpenEditVenue = (venue: Venue) => {
    setEditingVenue(venue);
    setVenueFormData({
      name: venue.name,
      type: venue.type,
      description: venue.description || "",
      address: venue.address || "",
      city: venue.city || "Chennai",
      price_per_hour: Number(venue.price_per_hour),
      price_per_day: venue.price_per_day ? Number(venue.price_per_day) : 0,
      amenities: venue.amenities || [],
      photos: venue.photos || [],
      sport_tags: venue.sport_tags || [],
      seating_capacity: venue.seating_capacity || 0,
      stage_details: venue.stage_details || "",
      has_ac: venue.has_ac || false,
      sound_system_support: venue.sound_system_support || "",
    });
    setIsVenueDialogOpen(true);
  };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      name: venueFormData.name,
      type: venueFormData.type,
      description: venueFormData.description,
      address: venueFormData.address,
      city: venueFormData.city,
      price_per_hour: venueFormData.price_per_hour,
      price_per_day: venueFormData.price_per_day > 0 ? venueFormData.price_per_day : null,
      amenities: venueFormData.amenities,
      photos: venueFormData.photos,
      sport_tags: venueFormData.sport_tags,
      seating_capacity: venueFormData.type === "Auditorium" ? venueFormData.seating_capacity : null,
      stage_details: venueFormData.type === "Auditorium" ? venueFormData.stage_details : null,
      has_ac: venueFormData.type === "Auditorium" ? venueFormData.has_ac : null,
      sound_system_support: venueFormData.type === "Auditorium" ? venueFormData.sound_system_support : null,
      owner_id: user.id,
      is_approved: true, // Auto approved for owner demo purposes
    };

    try {
      if (editingVenue) {
        const { error } = await supabase
          .from("zenturf_venues_v2")
          .update(payload)
          .eq("id", editingVenue.id);
        if (error) throw error;
        toast.success("Venue updated successfully!");
      } else {
        const { error } = await supabase
          .from("zenturf_venues_v2")
          .insert([payload]);
        if (error) throw error;
        toast.success("Venue created successfully!");
      }
      setIsVenueDialogOpen(false);
      refetchVenues();
    } catch (err: any) {
      toast.error(`Error saving venue: ${err.message || err}`);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (!confirm("Are you sure you want to delete this venue? All associated bookings and slots will be permanently removed.")) return;
    try {
      // Cascade delete slots, bookings, reviews first
      await supabase.from("zenturf_reviews_v2").delete().eq("venue_id", venueId);
      await supabase.from("zenturf_bookings_v2").delete().eq("venue_id", venueId);
      await supabase.from("zenturf_slots_v2").delete().eq("venue_id", venueId);
      const { error } = await supabase.from("zenturf_venues_v2").delete().eq("id", venueId);
      if (error) throw error;
      toast.success("Venue deleted successfully!");
      refetchVenues();
    } catch (err: any) {
      toast.error(`Error deleting venue: ${err.message || err}`);
    }
  };

  // Booking Actions
  const handleBookingAction = async (booking: Booking, newStatus: "confirmed" | "rejected") => {
    try {
      // 1. Update Booking status
      const { error: bError } = await supabase
        .from("zenturf_bookings_v2")
        .update({ status: newStatus })
        .eq("id", booking.id);
      if (bError) throw bError;

      // 2. Update Slot booked status accordingly
      const { error: sError } = await supabase
        .from("zenturf_slots_v2")
        .update({
          is_booked: newStatus === "confirmed",
          booked_by: newStatus === "confirmed" ? booking.user_id : null,
        })
        .eq("id", booking.slot_id);
      if (sError) throw sError;

      // 3. Send Notification
      await supabase.from("zenturf_notifications_v2").insert({
        user_id: booking.user_id,
        type: newStatus === "confirmed" ? "booking_confirmed" : "booking_rejected",
        message: `Your booking at ${booking.zenturf_venues_v2?.name || "the venue"} has been ${newStatus} by the owner.`,
      });

      toast.success(`Booking ${newStatus} successfully!`);
      refetchBookings();
    } catch (err: any) {
      toast.error(`Error processing booking: ${err.message || err}`);
    }
  };

  const handleRefundBooking = async (booking: Booking) => {
    try {
      const { error } = await supabase
        .from("zenturf_bookings_v2")
        .update({
          payment_status: "refunded",
          refund_amount: booking.total_price,
        })
        .eq("id", booking.id);
      if (error) throw error;
      toast.success("Refund processed successfully!");
      refetchBookings();
    } catch (err: any) {
      toast.error(`Error processing refund: ${err.message || err}`);
    }
  };

  // Availability / Slot Blocking Actions
  const handleToggleSlotBlock = async (slotId: string, currentBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from("zenturf_slots_v2")
        .update({ is_booked: !currentBlocked })
        .eq("id", slotId);
      if (error) throw error;
      toast.success(currentBlocked ? "Slot unblocked!" : "Slot blocked!");
      refetchSlots();
    } catch (err: any) {
      toast.error(`Error updating slot: ${err.message || err}`);
    }
  };

  const handleBlockAllDay = async (block: boolean) => {
    if (!selectedVenueForAvailability || !selectedDateForAvailability) return;
    try {
      const { error } = await supabase
        .from("zenturf_slots_v2")
        .update({ is_booked: block })
        .eq("venue_id", selectedVenueForAvailability)
        .eq("date", selectedDateForAvailability);
      if (error) throw error;
      toast.success(block ? "Blocked all slots for the day!" : "Unblocked all slots for the day!");
      refetchSlots();
    } catch (err: any) {
      toast.error(`Error updating slots: ${err.message || err}`);
    }
  };

  const handleUpdateSlotPrice = async (slotId: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from("zenturf_slots_v2")
        .update({ price_override: newPrice })
        .eq("id", slotId);
      if (error) throw error;
      toast.success("Slot price updated!");
      refetchSlots();
    } catch (err: any) {
      toast.error(`Error updating slot price: ${err.message || err}`);
    }
  };

  const handleGenerateSlots = async (startHour: number, endHour: number, price: number) => {
    if (!selectedVenueForAvailability || !selectedDateForAvailability) return;
    try {
      const newSlots = [];
      for (let hour = startHour; hour < endHour; hour++) {
        const startStr = `${String(hour).padStart(2, "0")}:00:00`;
        const endStr = `${String(hour + 1).padStart(2, "0")}:00:00`;
        newSlots.push({
          venue_id: selectedVenueForAvailability,
          date: selectedDateForAvailability,
          start_time: startStr,
          end_time: endStr,
          is_booked: false,
          booked_by: null,
          price_override: price,
        });
      }
      
      const { error } = await supabase
        .from("zenturf_slots_v2")
        .insert(newSlots);
        
      if (error) throw error;
      toast.success(`Generated ${newSlots.length} slots for ${selectedDateForAvailability}`);
      refetchSlots();
    } catch (err: any) {
      toast.error(`Error generating slots: ${err.message || err}`);
    }
  };

  // Review Actions
  const handleSaveReply = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text || !text.trim()) {
      toast.error("Reply text cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("zenturf_reviews_v2")
        .update({ owner_reply: text })
        .eq("id", reviewId);
      if (error) throw error;
      toast.success("Reply posted successfully!");
      refetchReviews();
    } catch (err: any) {
      toast.error(`Error saving reply: ${err.message || err}`);
    }
  };

  // Notifications Actions
  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("zenturf_notifications_v2")
        .update({ is_read: true })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("All notifications marked as read!");
      refetchNotifs();
    } catch (err: any) {
      toast.error(`Error: ${err.message || err}`);
    }
  };

  // Render check
  if (loading || roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying credentials…</p>
        </div>
      </div>
    );
  }

  if (!user || (role !== "owner" && role !== "admin")) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-32 text-center">
        <CircleAlert className="h-16 w-16 text-destructive mx-auto mb-6" />
        <h1 className="text-3xl font-extrabold tracking-tight">Access Denied</h1>
        <p className="mt-4 text-muted-foreground">
          You are currently logged in as a normal player. The Owner Portal requires a registered venue owner account.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
          <Button variant="destructive" onClick={() => supabase.auth.signOut()}>
            Sign Out / Change Account
          </Button>
        </div>
      </div>
    );
  }

  // Sidebar Menu Items
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "venues", label: "Venue Management", icon: Building2 },
    { id: "pricing", label: "Pricing Management", icon: BadgeCent },
    { id: "availability", label: "Availability", icon: CalendarDays },
    { id: "bookings", label: "Bookings", icon: CalendarCheck },
    { id: "calendar", label: "Calendar View", icon: CalendarDays },
    { id: "earnings", label: "Earnings Dashboard", icon: DollarSign },
    { id: "reviews", label: "Reviews & Ratings", icon: Star },
    { id: "notifications", label: "Notifications", icon: Bell, count: notifications.filter((n) => !n.is_read).length },
  ];

  return (
    <div className="flex h-[calc(100dvh-128px)] lg:h-[calc(100vh-64px)] bg-background text-foreground overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <div className="p-6 border-b flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Owner Dashboard
          </span>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1.5 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 ${
                    isActive
                      ? "bg-foreground text-background shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.label}</span>
                  </div>
                  {item.count && item.count > 0 ? (
                    <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1 flex items-center justify-center text-[10px]">
                      {item.count}
                    </Badge>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="p-4 border-t border-border/80 flex flex-col gap-2">
          <div className="px-3 py-2 bg-muted/40 rounded-xl">
            <p className="text-[10px] text-muted-foreground font-semibold lowercase">logged in as</p>
            <p className="text-xs font-bold text-foreground truncate mt-0.5">{user.email}</p>
          </div>
          <Button variant="outline" className="w-full gap-2 justify-start rounded-xl" onClick={() => supabase.auth.signOut()}>
            <LogOut className="h-4 w-4 text-destructive" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-16 border-b flex items-center justify-between px-4 sm:px-6 bg-card/80 backdrop-blur shrink-0">
          <span className="font-bold text-base text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            ZenTurf Portal
          </span>
          <div className="flex items-center gap-3">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Menu" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut()} className="h-9 w-9 text-destructive">
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </header>

        {/* Content Container */}
        <ScrollArea className="flex-1 p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 max-w-7xl mx-auto"
            >
              
              {/* TABS IMPLEMENTATION */}
              
              {/* 1. DASHBOARD OVERVIEW */}
              {activeTab === "dashboard" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, Owner</h1>
                    <p className="text-sm text-muted-foreground mt-1">Here is how your venues are performing today.</p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="rounded-2xl shadow-sm border bg-card">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Bookings</CardTitle>
                        <CalendarCheck className="h-4.5 w-4.5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.totalBookings}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Lifetime bookings logged</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm border bg-card">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Revenue Earned</CardTitle>
                        <DollarSign className="h-4.5 w-4.5 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatINR(stats.totalRevenue)}</div>
                        <p className="text-[10px] text-success font-medium mt-1">100% payouts settled</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm border bg-card">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Occupancy Rate</CardTitle>
                        <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.occupancyRate}%</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Confirmed vs total slots</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm border bg-card">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Actions</CardTitle>
                        <CircleAlert className="h-4.5 w-4.5 text-amber-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.pendingActions}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Bookings awaiting review</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 rounded-2xl border bg-card p-5">
                      <h3 className="text-base font-bold text-foreground mb-4">Earnings History (Past 7 Days)</h3>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueChartData}>
                            <defs>
                              <linearGradient id="earningsColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                            <Area type="monotone" dataKey="Earnings" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#earningsColor)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="rounded-2xl border bg-card p-5 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-foreground mb-4">Booking Distribution</h3>
                        <div className="h-[200px] flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={venueChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {venueChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={["hsl(var(--primary))", "#3b82f6", "#a855f7"][index % 3]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        {venueChartData.map((d, i) => (
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ["hsl(var(--primary))", "#3b82f6", "#a855f7"][i % 3] }} />
                              <span className="font-medium truncate max-w-[150px]">{d.name}</span>
                            </span>
                            <span className="font-bold text-muted-foreground">{d.value} bookings</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Upcoming bookings list */}
                  <Card className="rounded-2xl border bg-card overflow-hidden">
                    <div className="p-5 border-b bg-muted/10 flex items-center justify-between">
                      <h3 className="text-base font-bold text-foreground">Upcoming Bookings</h3>
                      <Badge variant="outline" className="px-2 py-0.5">{stats.upcoming.length} scheduled</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.upcoming.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                                No upcoming bookings found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            stats.upcoming.slice(0, 5).map((b) => (
                              <TableRow key={b.id}>
                                <TableCell className="font-bold">{b.booking_ref}</TableCell>
                                <TableCell className="font-semibold text-foreground">{b.zenturf_venues_v2?.name}</TableCell>
                                <TableCell>{b.profiles?.name || "Player"}</TableCell>
                                <TableCell>
                                  {b.booking_date} @ {formatTime(b.start_time)} – {formatTime(b.end_time)}
                                </TableCell>
                                <TableCell className="font-bold">{formatINR(b.total_price)}</TableCell>
                                <TableCell>
                                  <Badge className="bg-success text-success-foreground">Confirmed</Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>
              )}

              {/* 2. VENUE MANAGEMENT */}
              {activeTab === "venues" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Venue Management</h1>
                      <p className="text-sm text-muted-foreground mt-1">View, list, or edit details of your venues.</p>
                    </div>
                    <Button onClick={handleOpenAddVenue} className="gap-2 rounded-xl">
                      <Plus className="w-4 h-4" /> Add Venue
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {venues.map((v) => (
                      <Card key={v.id} className="rounded-2xl border overflow-hidden bg-card shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="h-44 w-full relative">
                            <img src={v.photos[0]} alt={v.name} className="h-full w-full object-cover" />
                            <Badge className="absolute top-3 left-3 bg-foreground text-background uppercase text-[10px]">
                              {v.type}
                            </Badge>
                          </div>
                          <div className="p-5 space-y-3">
                            <h3 className="font-bold text-lg text-foreground">{v.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{v.description}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" /> {v.address}, {v.city}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-border/60">
                              <div>
                                <span className="text-[10px] text-muted-foreground font-semibold lowercase">hourly rate</span>
                                <div className="font-bold text-foreground mt-0.5">{formatINR(v.price_per_hour)}/hr</div>
                              </div>
                              {v.type === "Auditorium" && v.seating_capacity && (
                                <div className="text-right">
                                  <span className="text-[10px] text-muted-foreground font-semibold lowercase">Capacity</span>
                                  <div className="font-bold text-foreground mt-0.5">{v.seating_capacity} seats</div>
                                </div>
                              )}
                            </div>
                            {/* Auditorium features indicators */}
                            {v.type === "Auditorium" && (
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                                  <ThermometerSnowflake className="w-3 h-3 text-sky-400" /> {v.has_ac ? "AC" : "Non-AC"}
                                </Badge>
                                {v.sound_system_support && (
                                  <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                                    <Volume2 className="w-3 h-3 text-indigo-400" /> Sound System
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-5 border-t border-border/80 bg-muted/10 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditVenue(v)} className="flex-1 gap-1.5 rounded-lg">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteVenue(v.id)} className="text-destructive hover:text-destructive border-transparent hover:bg-destructive/10 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Add/Edit Dialog */}
                  <Dialog open={isVenueDialogOpen} onOpenChange={setIsVenueDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingVenue ? "Edit Venue" : "Add New Venue"}</DialogTitle>
                        <DialogDescription>Update details of your sports court or event hall.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSaveVenue} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="vname">Venue Name</Label>
                            <Input id="vname" required value={venueFormData.name} onChange={(e) => setVenueFormData({ ...venueFormData, name: e.target.value })} placeholder="e.g. ZenTurf Arena" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="vtype">Venue Type</Label>
                            <Select value={venueFormData.type} onValueChange={(val) => setVenueFormData({ ...venueFormData, type: val })}>
                              <SelectTrigger id="vtype">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Football Turf">Football Turf</SelectItem>
                                <SelectItem value="Badminton Court">Badminton Court</SelectItem>
                                <SelectItem value="Cricket Nets">Cricket Nets</SelectItem>
                                <SelectItem value="Auditorium">Auditorium</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="vdesc">Description</Label>
                          <Textarea id="vdesc" value={venueFormData.description} onChange={(e) => setVenueFormData({ ...venueFormData, description: e.target.value })} placeholder="Briefly describe facilities, grass type, etc." />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="vaddr">Address</Label>
                            <Input id="vaddr" required value={venueFormData.address} onChange={(e) => setVenueFormData({ ...venueFormData, address: e.target.value })} placeholder="12, OMR Main Road" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="vcity">City</Label>
                            <Input id="vcity" required value={venueFormData.city} onChange={(e) => setVenueFormData({ ...venueFormData, city: e.target.value })} placeholder="Chennai" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="vprice">Base Hourly Price (₹)</Label>
                            <Input id="vprice" type="number" required value={venueFormData.price_per_hour} onChange={(e) => setVenueFormData({ ...venueFormData, price_per_hour: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="vpriceday">Full Day Price (Optional, ₹)</Label>
                            <Input id="vpriceday" type="number" value={venueFormData.price_per_day} onChange={(e) => setVenueFormData({ ...venueFormData, price_per_day: Number(e.target.value) })} />
                          </div>
                        </div>

                        {/* Auditorium-specific details */}
                        {venueFormData.type === "Auditorium" && (
                          <div className="border border-primary/20 rounded-xl p-4 bg-primary/5 space-y-4 animate-in fade-in">
                            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-4.5 h-4.5" /> Auditorium Features
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label htmlFor="capacity">Seating Capacity</Label>
                                <Input id="capacity" type="number" value={venueFormData.seating_capacity} onChange={(e) => setVenueFormData({ ...venueFormData, seating_capacity: Number(e.target.value) })} />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="sound">Sound System Details</Label>
                                <Input id="sound" value={venueFormData.sound_system_support} onChange={(e) => setVenueFormData({ ...venueFormData, sound_system_support: e.target.value })} placeholder="e.g. 5.1 surround sound" />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label htmlFor="stage">Stage Details</Label>
                                <Input id="stage" value={venueFormData.stage_details} onChange={(e) => setVenueFormData({ ...venueFormData, stage_details: e.target.value })} placeholder="e.g. 10m x 5m wooden stage" />
                              </div>
                              <div className="flex items-center gap-3 pt-6">
                                <Switch id="ac" checked={venueFormData.has_ac} onCheckedChange={(checked) => setVenueFormData({ ...venueFormData, has_ac: checked })} />
                                <Label htmlFor="ac">Central AC System Support</Label>
                              </div>
                            </div>
                          </div>
                        )}

                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsVenueDialogOpen(false)}>Cancel</Button>
                          <Button type="submit">Save Venue</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* 3. PRICING MANAGEMENT */}
              {activeTab === "pricing" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pricing Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Configure weekend markups, peak hours, and dynamic combo discounts.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="rounded-2xl border p-6 space-y-6 bg-card">
                      <h3 className="text-base font-bold text-foreground">Peak & Weekend Markup</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="weekend">Weekend Pricing Markup (%)</Label>
                          <Input id="weekend" type="number" value={pricingRules.weekend_markup} onChange={(e) => setPricingRules({ ...pricingRules, weekend_markup: Number(e.target.value) })} />
                          <p className="text-[10px] text-muted-foreground">Applies automatically to Saturday and Sunday slots.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="peak">Peak Hour Markup (%)</Label>
                          <Input id="peak" type="number" value={pricingRules.peak_hour_markup} onChange={(e) => setPricingRules({ ...pricingRules, peak_hour_markup: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="peakstart">Peak Hour Start Time</Label>
                          <Input id="peakstart" value={pricingRules.peak_hours_start} onChange={(e) => setPricingRules({ ...pricingRules, peak_hours_start: e.target.value })} placeholder="e.g. 17:00:00" />
                          <p className="text-[10px] text-muted-foreground">Standard peak hours are typically evening slots after 5 PM.</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="rounded-2xl border p-6 space-y-6 bg-card">
                      <h3 className="text-base font-bold text-foreground">Combo Booking Discounts</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="discount2">2-Hour Booking Discount (%)</Label>
                          <Input id="discount2" type="number" value={pricingRules.discount_2h} onChange={(e) => setPricingRules({ ...pricingRules, discount_2h: Number(e.target.value) })} />
                          <p className="text-[10px] text-muted-foreground">Encourage players to book longer slots with bulk savings.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discount3">3-Hour Booking Discount (%)</Label>
                          <Input id="discount3" type="number" value={pricingRules.discount_3h} onChange={(e) => setPricingRules({ ...pricingRules, discount_3h: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="offercode">Custom Offer Code</Label>
                          <Input id="offercode" value={pricingRules.custom_offer_code} onChange={(e) => setPricingRules({ ...pricingRules, custom_offer_code: e.target.value.toUpperCase() })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="offerdisc">Custom Offer Discount (%)</Label>
                          <Input id="offerdisc" type="number" value={pricingRules.custom_offer_discount} onChange={(e) => setPricingRules({ ...pricingRules, custom_offer_discount: Number(e.target.value) })} />
                        </div>
                      </div>
                    </Card>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => toast.success("Pricing configurations saved successfully!")} className="rounded-xl">
                      Save Pricing Rules
                    </Button>
                  </div>
                </div>
              )}

              {/* 4. AVAILABILITY MANAGEMENT */}
              {activeTab === "availability" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Availability Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Generate slots, set prices per hour, and block/unblock specific times.</p>
                  </div>

                  {/* Venue + Date Selector Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {/* Left Controls Panel */}
                    <div className="space-y-4">
                      {/* Venue + Date */}
                      <Card className="p-5 border bg-card rounded-2xl space-y-4">
                        <h3 className="text-sm font-bold text-foreground">Select Venue & Date</h3>
                        <div className="space-y-1.5">
                          <Label>Venue</Label>
                          <Select value={selectedVenueForAvailability} onValueChange={setSelectedVenueForAvailability}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select venue" />
                            </SelectTrigger>
                            <SelectContent>
                              {venues.map((v) => (
                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={selectedDateForAvailability}
                            onChange={(e) => setSelectedDateForAvailability(e.target.value)}
                          />
                        </div>
                      </Card>

                      {/* Generate Slots Card */}
                      <Card className="p-5 border bg-card rounded-2xl space-y-4">
                        <h3 className="text-sm font-bold text-foreground">Generate Slots</h3>
                        <p className="text-[11px] text-muted-foreground">Create hourly slots for the selected venue & date. Existing slots will be preserved.</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Start Hour (0–23)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="23"
                              value={genStartHour}
                              onChange={(e) => setGenStartHour(e.target.value)}
                              placeholder="6"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">End Hour (0–23)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="24"
                              value={genEndHour}
                              onChange={(e) => setGenEndHour(e.target.value)}
                              placeholder="22"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Price per Slot (₹)</Label>
                          <Input
                            type="number"
                            value={genHourlyRate}
                            onChange={(e) => setGenHourlyRate(Number(e.target.value))}
                            placeholder="1000"
                          />
                        </div>
                        <Button
                          className="w-full rounded-xl"
                          onClick={() =>
                            handleGenerateSlots(Number(genStartHour), Number(genEndHour), genHourlyRate)
                          }
                          disabled={!selectedVenueForAvailability || !selectedDateForAvailability}
                        >
                          Generate Slots
                        </Button>
                      </Card>

                      {/* Bulk Actions */}
                      <Card className="p-5 border bg-card rounded-2xl space-y-4">
                        <h3 className="text-sm font-bold text-foreground">Bulk Actions</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlockAllDay(true)}
                            className="rounded-lg text-destructive border-destructive/40 hover:bg-destructive/10"
                          >
                            Block All Day
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlockAllDay(false)}
                            className="rounded-lg"
                          >
                            Unblock All
                          </Button>
                        </div>
                      </Card>
                    </div>

                    {/* Slots Grid */}
                    <Card className="md:col-span-2 rounded-2xl border overflow-hidden bg-card">
                      <div className="p-5 border-b bg-muted/10 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold">Hourly Slots — {selectedDateForAvailability}</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{slots.length} slots loaded. Click price to edit inline.</p>
                        </div>
                        <Badge variant="outline">{slots.filter((s) => !s.is_booked).length} available</Badge>
                      </div>

                      <div className="p-5">
                        {slots.length === 0 ? (
                          <div className="text-center py-16 text-muted-foreground text-sm space-y-3">
                            <p className="font-medium">No slots found for this date.</p>
                            <p className="text-xs">Use "Generate Slots" on the left to create hourly time slots.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {slots.map((s) => {
                              const isBooked = s.is_booked && s.booked_by;
                              const isBlocked = s.is_booked && !s.booked_by;
                              const slotPrice = s.price_override ?? 0;

                              return (
                                <div
                                  key={s.id}
                                  className={`rounded-xl border flex flex-col gap-2 p-3 transition-all ${
                                    isBooked
                                      ? "bg-muted/30 border-muted/50 text-muted-foreground"
                                      : isBlocked
                                        ? "bg-destructive/10 border-destructive/30 text-destructive"
                                        : "bg-background border-border hover:border-primary/40"
                                  }`}
                                >
                                  {/* Time + Lock Icon */}
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold">{formatTime(s.start_time)}</span>
                                    {isBooked ? (
                                      <Lock className="w-3.5 h-3.5 opacity-40" />
                                    ) : isBlocked ? (
                                      <Lock className="w-3.5 h-3.5 text-destructive" />
                                    ) : (
                                      <Unlock className="w-3.5 h-3.5 opacity-30" />
                                    )}
                                  </div>

                                  {/* Status Label */}
                                  <span className={`text-[10px] font-semibold leading-none ${isBooked ? "text-muted-foreground" : isBlocked ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                                    {isBooked ? "● Booked" : isBlocked ? "⊘ Blocked" : "✓ Available"}
                                  </span>

                                  {/* Price Edit (only for non-booked) */}
                                  {!isBooked && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-muted-foreground">₹</span>
                                      <input
                                        type="number"
                                        defaultValue={slotPrice}
                                        onBlur={(e) => {
                                          const val = Number(e.target.value);
                                          if (!isNaN(val) && val !== slotPrice) {
                                            handleUpdateSlotPrice(s.id, val);
                                          }
                                        }}
                                        className="w-full text-[11px] font-bold bg-transparent border-b border-dashed border-muted-foreground/40 focus:outline-none focus:border-primary pb-0.5"
                                      />
                                    </div>
                                  )}

                                  {/* Block / Unblock Button */}
                                  {!isBooked && (
                                    <button
                                      onClick={() => handleToggleSlotBlock(s.id, isBlocked)}
                                      className={`text-[9px] font-bold leading-none text-left underline ${isBlocked ? "text-primary" : "text-destructive"}`}
                                    >
                                      {isBlocked ? "Unblock" : "Block"}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              )}


              {/* 5. BOOKING MANAGEMENT */}
              {activeTab === "bookings" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Accept, reject, refund, or cancel bookings.</p>
                  </div>

                  <Card className="rounded-2xl border bg-card overflow-hidden">
                    <div className="p-5 border-b bg-muted/10 flex items-center justify-between">
                      <h3 className="text-base font-bold text-foreground">Venue Bookings List</h3>
                      <Badge variant="outline">{bookings.length} total bookings</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-10 text-sm text-muted-foreground">
                                No bookings found for your venues.
                              </TableCell>
                            </TableRow>
                          ) : (
                            bookings.map((b) => (
                              <TableRow key={b.id}>
                                <TableCell className="font-bold">{b.booking_ref}</TableCell>
                                <TableCell className="font-semibold text-foreground">{b.zenturf_venues_v2?.name}</TableCell>
                                <TableCell>
                                  <div className="text-xs">
                                    <div className="font-medium text-foreground">{b.profiles?.name || "Player"}</div>
                                    <div className="text-muted-foreground">{b.profiles?.email}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {b.booking_date} @ {formatTime(b.start_time)} – {formatTime(b.end_time)}
                                </TableCell>
                                <TableCell className="font-bold">{formatINR(b.total_price)}</TableCell>
                                <TableCell>
                                  <Badge variant={b.payment_status === "paid" ? "default" : "secondary"}>
                                    {b.payment_status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      b.status === "confirmed"
                                        ? "bg-success text-success-foreground"
                                        : b.status === "pending"
                                          ? "bg-amber-500 text-amber-950"
                                          : "bg-destructive/10 text-destructive"
                                    }
                                  >
                                    {b.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {b.status === "pending" ? (
                                    <div className="flex gap-2 justify-end">
                                      <Button size="icon" variant="outline" className="h-8 w-8 text-success hover:bg-success/10" onClick={() => handleBookingAction(b, "confirmed")}>
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleBookingAction(b, "rejected")}>
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : b.status === "cancelled" && b.payment_status === "paid" ? (
                                    <Button size="sm" variant="outline" onClick={() => handleRefundBooking(b)}>
                                      Refund
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">None</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>
              )}

              {/* 6. CALENDAR VIEW */}
              {activeTab === "calendar" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Calendar Booking View</h1>
                    <p className="text-sm text-muted-foreground mt-1">Review active booking counts and slot details on a calendar.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <Card className="p-5 border bg-card rounded-2xl space-y-4">
                      <div className="space-y-1.5">
                        <Label>Select Venue</Label>
                        <Select value={selectedVenueForAvailability} onValueChange={setSelectedVenueForAvailability}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select venue" />
                          </SelectTrigger>
                          <SelectContent>
                            {venues.map((v) => (
                              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Choose Date</Label>
                        <Input type="date" value={selectedDateForAvailability} onChange={(e) => setSelectedDateForAvailability(e.target.value)} />
                      </div>
                    </Card>

                    <Card className="md:col-span-2 rounded-2xl border overflow-hidden bg-card">
                      <div className="p-5 border-b bg-muted/10 flex items-center justify-between">
                        <h3 className="text-base font-bold">Slot Status Detail ({selectedDateForAvailability})</h3>
                        <Badge variant="outline">{slots.length} total slots</Badge>
                      </div>
                      <div className="p-5 space-y-4">
                        {slots.length === 0 ? (
                          <div className="text-center py-10 text-muted-foreground text-sm">
                            No slot data found for this date.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {slots.map((s) => {
                              const isBooked = s.is_booked && s.booked_by;
                              const isBlocked = s.is_booked && !s.booked_by;
                              
                              // Find matching confirmed booking to display player name
                              const bookingMatch = bookings.find(
                                (b) => b.slot_id === s.id && b.status === "confirmed"
                              );
                              
                              return (
                                <div
                                  key={s.id}
                                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                                    isBooked
                                      ? "bg-primary/5 border-primary/20 text-foreground"
                                      : isBlocked
                                        ? "bg-destructive/5 border-destructive/10 text-destructive"
                                        : "bg-background border-border text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    <span className="font-mono text-sm font-bold">{formatTime(s.start_time)} – {formatTime(s.end_time)}</span>
                                    {isBooked && (
                                      <span className="text-xs text-muted-foreground">
                                        Booked by <strong className="text-foreground">{bookingMatch?.profiles?.name || "Player"}</strong> (Ref: {bookingMatch?.booking_ref})
                                      </span>
                                    )}
                                    {isBlocked && (
                                      <span className="text-xs text-destructive font-medium">Blocked by Management</span>
                                    )}
                                    {!s.is_booked && (
                                      <span className="text-xs text-success font-semibold">Available</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!isBooked && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 rounded-lg"
                                        onClick={() => handleToggleSlotBlock(s.id, isBlocked)}
                                      >
                                        {isBlocked ? "Unblock" : "Block"}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* 7. EARNINGS DASHBOARD */}
              {activeTab === "earnings" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Earnings Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">Review revenue growth, transaction ledger, and payouts.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-5 border bg-card rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Earnings</span>
                        <div className="text-3xl font-bold text-foreground mt-2">{formatINR(stats.totalRevenue)}</div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-4">Total accumulated during current calendar month.</p>
                    </Card>

                    <Card className="p-5 border bg-card rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Settled Payouts</span>
                        <div className="text-3xl font-bold text-foreground mt-2">{formatINR(stats.totalRevenue)}</div>
                      </div>
                      <p className="text-[10px] text-success font-medium mt-4">Direct bank deposit completed successfully.</p>
                    </Card>

                    <Card className="p-5 border bg-card rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Payouts</span>
                        <div className="text-3xl font-bold text-foreground mt-2">₹0.00</div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-4">Next payout scheduled on Friday.</p>
                    </Card>
                  </div>

                  {/* Transaction history */}
                  <Card className="rounded-2xl border bg-card overflow-hidden">
                    <div className="p-5 border-b bg-muted/10">
                      <h3 className="text-base font-bold">Transaction Ledger</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Booking Ref</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.filter((b) => b.payment_status === "paid" || b.payment_status === "refunded").length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                                No transactions recorded yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            bookings.filter((b) => b.payment_status === "paid" || b.payment_status === "refunded").map((b) => (
                              <TableRow key={b.id}>
                                <TableCell className="font-mono text-xs">{b.payment_id || `ZP-${b.id.substring(0, 8)}`}</TableCell>
                                <TableCell className="font-bold">{b.booking_ref}</TableCell>
                                <TableCell>ZenPay Wallet</TableCell>
                                <TableCell className="font-bold">{formatINR(b.total_price)}</TableCell>
                                <TableCell>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Badge className={b.payment_status === "paid" ? "bg-success text-success-foreground" : "bg-destructive/15 text-destructive"}>
                                    {b.payment_status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>
              )}

              {/* 8. REVIEWS & RATINGS */}
              {activeTab === "reviews" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reviews & Ratings</h1>
                    <p className="text-sm text-muted-foreground mt-1">See customer reviews and write replies to them.</p>
                  </div>

                  <div className="space-y-6">
                    {reviews.length === 0 ? (
                      <Card className="p-10 text-center text-muted-foreground text-sm border rounded-2xl bg-card">
                        No customer reviews logged yet.
                      </Card>
                    ) : (
                      reviews.map((r) => (
                        <Card key={r.id} className="p-6 border bg-card rounded-2xl space-y-4">
                          <div className="flex items-center justify-between border-b pb-3">
                            <div>
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{r.zenturf_venues_v2?.name}</span>
                              <div className="font-bold text-foreground text-sm mt-0.5">{r.profiles?.name || "Anonymous Player"}</div>
                            </div>
                            <div className="flex items-center gap-1 text-warning">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-warning text-warning" : "text-muted/40"}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed italic">"{r.comment || "No comment left."}"</p>

                          {/* Existing Reply */}
                          {r.owner_reply && (
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Your Reply</span>
                              <p className="text-xs text-foreground leading-normal">{r.owner_reply}</p>
                            </div>
                          )}

                          {/* Reply Form */}
                          {!r.owner_reply && (
                            <div className="space-y-2 pt-2">
                              <Label htmlFor={`reply-${r.id}`}>Reply to this review</Label>
                              <div className="flex gap-2">
                                <Input
                                  id={`reply-${r.id}`}
                                  value={replyText[r.id] || ""}
                                  onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })}
                                  placeholder="Thank you for playing at our arena! We hope to see you again soon."
                                />
                                <Button onClick={() => handleSaveReply(r.id)} className="rounded-lg h-10 px-4">
                                  Reply
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 9. NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                      <p className="text-sm text-muted-foreground mt-1">Review alerts regarding bookings, cancellations, and reviews.</p>
                    </div>
                    {notifications.some((n) => !n.is_read) && (
                      <Button variant="outline" onClick={handleMarkAllRead} className="rounded-xl">
                        Mark All Read
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {notifications.length === 0 ? (
                      <Card className="p-10 text-center text-muted-foreground text-sm border rounded-2xl bg-card">
                        No notifications found.
                      </Card>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                            n.is_read
                              ? "bg-background border-border text-muted-foreground"
                              : "bg-primary/5 border-primary/20 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${n.is_read ? "bg-muted/40" : "bg-primary"}`} />
                            <span className="text-sm font-semibold tracking-tight">{n.message}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </main>
    </div>
  );
}
