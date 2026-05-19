import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Building2,
  BadgeCent,
  CalendarCheck,
  CircleAlert,
  Bell,
  LogOut,
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  Check,
  X,
  Megaphone,
  UserCheck,
  Tag,
  Shield,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export const Route = createFileRoute("/admin")({
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
    if (!roleList.includes("admin")) {
      throw redirect({
        to: "/",
        search: { denied: "true" } as any,
      });
    }
  },
  head: () => ({ meta: [{ title: "Admin Portal — ZenTurf" }] }),
  component: AdminPortalPage,
});

type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email?: string;
  role?: string;
};

type Venue = {
  id: string;
  name: string;
  type: string;
  city: string | null;
  price_per_hour: number;
  rating: number;
  is_approved: boolean;
  owner_id: string;
  owner_email?: string;
};

type Booking = {
  id: string;
  user_id: string;
  venue_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  payment_status: string;
  booking_ref: string;
  status: string;
  created_at: string;
  profiles: { name: string | null; email: string | null } | null;
  zenturf_venues_v2: { name: string } | null;
};

type Coupon = {
  id: string;
  code: string;
  discount_percent: number;
  max_discount: number | null;
  min_booking_amount: number | null;
  is_active: boolean;
  created_at: string;
};

function AdminPortalPage() {
  const { user, role, loading, roleLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Local dialog & form states
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [couponFormData, setCouponFormData] = useState({
    code: "",
    discount_percent: 15,
    max_discount: 500,
    min_booking_amount: 1000,
  });

  // Broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState<string>("all");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  // Redirect if unauthorized
  useEffect(() => {
    if (!loading && !roleLoading && (!user || role !== "admin")) {
      toast.error("Unauthorized: Administrator access required.");
    }
  }, [user, role, loading, roleLoading]);

  // Queries
  const { data: usersList = [], refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // 1. Fetch profiles
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*");
      if (pErr) throw pErr;

      // 2. Fetch roles
      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("*");
      if (rErr) throw rErr;

      // 3. Fetch auth users if possible, else map profiles
      const rolesMap = new Map<string, string>();
      roles?.forEach((r) => rolesMap.set(r.user_id, r.role));

      // Map roles
      return (profiles || []).map((p) => ({
        ...p,
        role: rolesMap.get(p.id) || "user",
      })) as Profile[];
    },
  });

  const { data: venues = [], refetch: refetchVenues } = useQuery({
    queryKey: ["admin-venues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zenturf_venues_v2")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Venue[];
    },
  });

  const { data: bookings = [], refetch: refetchBookings } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zenturf_bookings_v2")
        .select("*, profiles(name, email), zenturf_venues_v2(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Booking[];
    },
  });

  const { data: coupons = [], refetch: refetchCoupons } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zenturf_coupons_v2")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  // Calculate platform stats
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    const totalOwners = usersList.filter((u) => u.role === "owner").length;
    const totalVenues = venues.length;
    const totalBookings = bookings.length;
    const totalRevenue = bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + Number(b.total_price), 0);
    // Platform fee is simulated at 10%
    const platformFee = totalRevenue * 0.1;

    const pendingVenues = venues.filter((v) => !v.is_approved);

    return {
      totalUsers,
      totalOwners,
      totalVenues,
      totalBookings,
      totalRevenue,
      platformFee,
      pendingVenues,
    };
  }, [usersList, venues, bookings]);

  // Analytics Chart Data
  const analyticsData = useMemo(() => {
    const map = new Map<string, number>();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    last7Days.forEach((date) => map.set(date, 0));

    bookings.forEach((b) => {
      if (b.status === "confirmed" && map.has(b.booking_date)) {
        map.set(b.booking_date, map.get(b.booking_date)! + Number(b.total_price) * 0.1); // 10% platform fee
      }
    });

    return last7Days.map((date) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      "Platform Fee": map.get(date) || 0,
    }));
  }, [bookings]);

  // Admin Actions
  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "user" ? "owner" : currentRole === "owner" ? "admin" : "user";
    try {
      // Delete existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);
      // Insert new role if not 'user' (user is default empty in DB roles to keep it clean)
      if (newRole !== "user") {
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole }]);
        if (error) throw error;
      }
      toast.success(`Role updated to ${newRole}!`);
      refetchUsers();
    } catch (err: any) {
      toast.error(`Error: ${err.message || err}`);
    }
  };

  const handleApproveVenue = async (venueId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from("zenturf_venues_v2")
        .update({ is_approved: approve })
        .eq("id", venueId);
      if (error) throw error;
      toast.success(approve ? "Venue approved!" : "Venue rejected!");
      refetchVenues();
    } catch (err: any) {
      toast.error(`Error: ${err.message || err}`);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("zenturf_coupons_v2")
        .insert([{
          code: couponFormData.code.toUpperCase(),
          discount_percent: couponFormData.discount_percent,
          max_discount: couponFormData.max_discount,
          min_booking_amount: couponFormData.min_booking_amount,
          is_active: true,
        }]);
      if (error) throw error;
      toast.success("Coupon created successfully!");
      setIsCouponDialogOpen(false);
      refetchCoupons();
    } catch (err: any) {
      toast.error(`Error: ${err.message || err}`);
    }
  };

  const handleToggleCoupon = async (couponId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("zenturf_coupons_v2")
        .update({ is_active: !currentActive })
        .eq("id", couponId);
      if (error) throw error;
      toast.success(currentActive ? "Coupon deactivated!" : "Coupon activated!");
      refetchCoupons();
    } catch (err: any) {
      toast.error(`Error: ${err.message || err}`);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const { error } = await supabase
        .from("zenturf_coupons_v2")
        .delete()
        .eq("id", couponId);
      if (error) throw error;
      toast.success("Coupon deleted!");
      refetchCoupons();
    } catch (err: any) {
      toast.error(`Error: ${err.message || err}`);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast.error("Please enter a broadcast message");
      return;
    }

    try {
      let targets: string[] = [];
      if (broadcastTarget === "all") {
        targets = usersList.map((u) => u.id);
      } else if (broadcastTarget === "owners") {
        targets = usersList.filter((u) => u.role === "owner").map((u) => u.id);
      } else {
        targets = usersList.filter((u) => u.role === "user").map((u) => u.id);
      }

      // Bulk insert notifications
      const notifsToInsert = targets.map((tid) => ({
        user_id: tid,
        type: "announcement",
        message: broadcastMessage,
        is_read: false,
      }));

      const { error } = await supabase
        .from("zenturf_notifications_v2")
        .insert(notifsToInsert);
      if (error) throw error;

      toast.success(`Broadcast sent successfully to ${targets.length} users!`);
      setBroadcastMessage("");
    } catch (err: any) {
      toast.error(`Error sending broadcast: ${err.message || err}`);
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

  if (!user || role !== "admin") {
    return (
      <div className="container mx-auto max-w-xl px-4 py-32 text-center">
        <CircleAlert className="h-16 w-16 text-destructive mx-auto mb-6" />
        <h1 className="text-3xl font-extrabold tracking-tight">Access Denied</h1>
        <p className="mt-4 text-muted-foreground">
          You are currently logged in as a normal player. The Administrator Panel requires an admin role.
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
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "User Management", icon: Users },
    { id: "venues", label: "Venues Approval", icon: Building2, count: stats.pendingVenues.length },
    { id: "bookings", label: "Booking Ledger", icon: CalendarCheck },
    { id: "coupons", label: "Coupon Manager", icon: Tag },
    { id: "broadcast", label: "Broadcast News", icon: Megaphone },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <div className="p-6 border-b flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Admin Panel
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
        <header className="lg:hidden h-16 border-b flex items-center justify-between px-6 bg-card/80 backdrop-blur">
          <span className="font-bold text-base text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            ZenTurf Admin
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
              
              {/* 1. OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
                    <p className="text-sm text-muted-foreground mt-1">Review active booking volumes and platform earnings stats.</p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="rounded-2xl shadow-sm border bg-card">
                      <CardHeader className="pb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Registered Players</span>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm border bg-card">
                      <CardHeader className="pb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Venue Owners</span>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.totalOwners}</div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm border bg-card">
                      <CardHeader className="pb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Listed Venues</span>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.totalVenues}</div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm border bg-card">
                      <CardHeader className="pb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Platform Earnings (10% Fee)</span>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatINR(stats.platformFee)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chart Row */}
                  <Card className="rounded-2xl border bg-card p-5">
                    <h3 className="text-base font-bold text-foreground mb-4">Daily Platform Earnings Trend</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData}>
                          <defs>
                            <linearGradient id="platformColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                          <Area type="monotone" dataKey="Platform Fee" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#platformColor)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              )}

              {/* 2. USER MANAGEMENT */}
              {activeTab === "users" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Role Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Review profiles, promote players, or revoke administrative access.</p>
                  </div>

                  <Card className="rounded-2xl border bg-card overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer Name</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Authorized Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersList.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-semibold text-foreground">
                              {u.name || "Unnamed Player"}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{u.id}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  u.role === "admin"
                                    ? "destructive"
                                    : u.role === "owner"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg gap-1.5"
                                onClick={() => handleToggleUserRole(u.id, u.role || "user")}
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Toggle Role
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}

              {/* 3. VENUES APPROVAL */}
              {activeTab === "venues" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Venues Approval</h1>
                    <p className="text-sm text-muted-foreground mt-1">Approve new venue listings or remove violating posts.</p>
                  </div>

                  <Card className="rounded-2xl border bg-card overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Venue Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Hourly Price</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {venues.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                              No venues registered on the platform.
                            </TableCell>
                          </TableRow>
                        ) : (
                          venues.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell className="font-semibold text-foreground">{v.name}</TableCell>
                              <TableCell>{v.type}</TableCell>
                              <TableCell>{v.city}</TableCell>
                              <TableCell className="font-bold">{formatINR(v.price_per_hour)}</TableCell>
                              <TableCell className="font-bold">{v.rating || "N/A"}</TableCell>
                              <TableCell>
                                <Badge className={v.is_approved ? "bg-success text-success-foreground" : "bg-destructive/15 text-destructive"}>
                                  {v.is_approved ? "Approved" : "Pending Approval"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {!v.is_approved ? (
                                  <Button size="sm" onClick={() => handleApproveVenue(v.id, true)} className="rounded-lg bg-success text-success-foreground hover:bg-success/80">
                                    Approve
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" className="rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleApproveVenue(v.id, false)}>
                                    Reject/Block
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}

              {/* 4. BOOKINGS LEDGER */}
              {activeTab === "bookings" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Platform Booking Ledger</h1>
                    <p className="text-sm text-muted-foreground mt-1">Review complete database of player reservations.</p>
                  </div>

                  <Card className="rounded-2xl border bg-card overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Venue</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                              No bookings found on the platform.
                            </TableCell>
                          </TableRow>
                        ) : (
                          bookings.map((b) => (
                            <TableRow key={b.id}>
                              <TableCell className="font-bold">{b.booking_ref}</TableCell>
                              <TableCell className="font-semibold">{b.zenturf_venues_v2?.name}</TableCell>
                              <TableCell>{b.profiles?.name || "Player"}</TableCell>
                              <TableCell>
                                {b.booking_date} @ {formatTime(b.start_time)}
                              </TableCell>
                              <TableCell className="font-bold">{formatINR(b.total_price)}</TableCell>
                              <TableCell>
                                <Badge className={b.status === "confirmed" ? "bg-success text-success-foreground" : "bg-amber-500 text-amber-950"}>
                                  {b.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}

              {/* 5. COUPON MANAGER */}
              {activeTab === "coupons" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Coupon Management</h1>
                      <p className="text-sm text-muted-foreground mt-1">Create, toggle, or delete promotional codes.</p>
                    </div>
                    <Button onClick={() => setIsCouponDialogOpen(true)} className="rounded-xl gap-2">
                      <Plus className="w-4 h-4" /> Add Coupon
                    </Button>
                  </div>

                  <Card className="rounded-2xl border bg-card overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Promo Code</TableHead>
                          <TableHead>Discount Value</TableHead>
                          <TableHead>Max Cap</TableHead>
                          <TableHead>Min Booking Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coupons.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                              No promo codes created yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          coupons.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-mono font-bold text-primary">{c.code}</TableCell>
                              <TableCell className="font-semibold">{c.discount_percent}% OFF</TableCell>
                              <TableCell>{c.max_discount ? formatINR(c.max_discount) : "No Limit"}</TableCell>
                              <TableCell>{c.min_booking_amount ? formatINR(c.min_booking_amount) : "No Limit"}</TableCell>
                              <TableCell>
                                <Badge className={c.is_active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                                  {c.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="outline" onClick={() => handleToggleCoupon(c.id, c.is_active)}>
                                    {c.is_active ? "Deactivate" : "Activate"}
                                  </Button>
                                  <Button size="icon" variant="ghost" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => handleDeleteCoupon(c.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Card>

                  {/* Add Coupon Dialog */}
                  <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
                    <DialogContent className="max-w-md rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Coupon</DialogTitle>
                        <DialogDescription>Add a new promo code for player checkout discount.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSaveCoupon} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="ccode">Promo Code</Label>
                          <Input id="ccode" required value={couponFormData.code} onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value })} placeholder="e.g. MONSOON20" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cdisc">Discount Percent (%)</Label>
                          <Input id="cdisc" type="number" required value={couponFormData.discount_percent} onChange={(e) => setCouponFormData({ ...couponFormData, discount_percent: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cmax">Max Discount Amount (₹)</Label>
                          <Input id="cmax" type="number" required value={couponFormData.max_discount} onChange={(e) => setCouponFormData({ ...couponFormData, max_discount: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cmin">Min Booking Value (₹)</Label>
                          <Input id="cmin" type="number" required value={couponFormData.min_booking_amount} onChange={(e) => setCouponFormData({ ...couponFormData, min_booking_amount: Number(e.target.value) })} />
                        </div>
                        <DialogFooter className="pt-4">
                          <Button type="button" variant="outline" onClick={() => setIsCouponDialogOpen(false)}>Cancel</Button>
                          <Button type="submit">Create Coupon</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* 6. BROADCAST NEWS */}
              {activeTab === "broadcast" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">System-Wide Broadcast</h1>
                    <p className="text-sm text-muted-foreground mt-1">Send immediate notifications to players and venue owners.</p>
                  </div>

                  <Card className="p-6 border bg-card rounded-2xl space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>Broadcast Target Group</Label>
                        <Select value={broadcastTarget} onValueChange={setBroadcastTarget}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="owners">Venue Owners Only</SelectItem>
                            <SelectItem value="users">Players Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="bmsg">Notification Message</Label>
                        <Input
                          id="bmsg"
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          placeholder="Write announcement text here..."
                          className="h-20"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button onClick={handleSendBroadcast} className="rounded-xl gap-2">
                        <Megaphone className="w-4 h-4" /> Send Announcement
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </main>
    </div>
  );
}
