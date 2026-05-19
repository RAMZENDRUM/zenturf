import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlowButton } from "@/components/ui/flow-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  Star,
  Wifi,
  Car,
  Lightbulb,
  Snowflake,
  ShieldCheck,
  Zap,
  Sun,
  Sunset,
  Moon,
  Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatTime, isoDate, formatDateLabel } from "@/lib/format";
import { VenueMap } from "@/components/venues/venue-map";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/venue/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Venue — ZenTurf` },
      {
        name: "description",
        content: `Book this venue with live slot availability.`,
      },
    ],
  }),
  component: VenuePage,
});

type Venue = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  amenities: string[];
  photos: string[];
  sport_tags: string[];
  price_per_hour: number;
  price_per_day: number | null;
  capacity: number | null;
  rating: number;
  total_reviews: number;
  area_sqft: number | null;
};

type Slot = {
  id: string;
  venue_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { name: string | null; avatar_url: string | null } | null;
};

const AMENITY_ICONS: Record<string, any> = {
  Parking: Car,
  Floodlights: Lightbulb,
  AC: Snowflake,
  Washrooms: ShieldCheck,
  Wifi: Wifi,
  Projector: Zap,
};

function VenuePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startSlotId, setStartSlotId] = useState<string | null>(null);
  const [endSlotId, setEndSlotId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  // Reset selection on date change
  useEffect(() => {
    setStartSlotId(null);
    setEndSlotId(null);
    setDuration(null);
  }, [selectedDate]);


  const { data: venue, isLoading } = useQuery({
    queryKey: ["venue", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zenturf_venues_v2")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Venue;
    },
  });

  const { data: slots = [] } = useQuery({
    queryKey: ["slots", id],
    queryFn: async () => {
      const start = isoDate(new Date());
      const end = new Date();
      end.setDate(end.getDate() + 7);
      const { data, error } = await supabase
        .from("zenturf_slots_v2")
        .select("id,venue_id,date,start_time,end_time,is_booked")
        .eq("venue_id", id)
        .gte("date", start)
        .lt("date", isoDate(end))
        .order("date")
        .order("start_time");
      if (error) throw error;
      return data as Slot[];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zenturf_reviews_v2")
        .select("id,rating,comment,created_at,profiles(name,avatar_url)")
        .eq("venue_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as Review[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`slots:venue=${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "slots",
          filter: `venue_id=eq.${id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["slots", id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  // Group slots by date
  const days = useMemo(() => {
    const map = new Map<string, Slot[]>();
    slots.forEach((s) => {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    });
    return Array.from(map.entries()).map(([date, list]) => ({
      date,
      slots: list,
    }));
  }, [slots]);

  // Set default selected date
  useEffect(() => {
    if (days.length > 0 && !selectedDate) {
      setSelectedDate(days[0].date);
    }
  }, [days, selectedDate]);

  const selectedSlots = useMemo(() => {
    if (!selectedDate || !startSlotId) return [];
    const activeDay = days.find((d) => d.date === selectedDate);
    const activeSlots = activeDay?.slots ?? [];
    const sorted = [...activeSlots].sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    const startIndex = sorted.findIndex((s) => s.id === startSlotId);
    if (startIndex === -1) return [];

    if (duration !== null) {
      const numSlots = Math.ceil(duration);
      const range = sorted.slice(startIndex, startIndex + numSlots);
      return range;
    } else if (endSlotId) {
      const endIndex = sorted.findIndex((s) => s.id === endSlotId);
      if (endIndex === -1) return [sorted[startIndex]];
      
      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);
      return sorted.slice(start, end + 1);
    } else {
      return [sorted[startIndex]];
    }
  }, [selectedDate, startSlotId, endSlotId, duration, days]);

  const rangeSummary = useMemo(() => {
    if (selectedSlots.length === 0) return null;
    const startStr = selectedSlots[0].start_time;
    
    let totalHours = selectedSlots.length;
    if (duration !== null) {
      totalHours = duration;
    }
    
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
    const totalPrice = totalHours * venue.price_per_hour;
    
    return {
      formattedRange: `${formattedStart} – ${formattedEnd}`,
      totalHours,
      totalPrice,
    };
  }, [selectedSlots, duration, venue?.price_per_hour]);

  const handleSlotClick = (slot: Slot) => {
    if (slot.is_booked) {
      toast.error("This slot is already booked.");
      return;
    }

    if (!startSlotId) {
      setStartSlotId(slot.id);
      setEndSlotId(null);
      setDuration(null);
    } else if (startSlotId === slot.id) {
      setStartSlotId(null);
      setEndSlotId(null);
      setDuration(null);
    } else {
      const activeDay = days.find((d) => d.date === selectedDate);
      const activeSlots = activeDay?.slots ?? [];
      const sorted = [...activeSlots].sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      const startIndex = sorted.findIndex((s) => s.id === startSlotId);
      const clickIndex = sorted.findIndex((s) => s.id === slot.id);
      
      if (startIndex === -1 || clickIndex === -1) return;
      
      const start = Math.min(startIndex, clickIndex);
      const end = Math.max(startIndex, clickIndex);
      
      const proposedRange = sorted.slice(start, end + 1);
      const hasBooked = proposedRange.some((s) => s.is_booked);
      
      if (hasBooked) {
        toast.error("Invalid range: Contains already booked slots in between.");
        return;
      }
      
      setDuration(null);
      setEndSlotId(slot.id);
      
      if (clickIndex < startIndex) {
        setStartSlotId(slot.id);
        setEndSlotId(sorted[startIndex].id);
      }
    }
  };

  const handleDurationSelect = (hrs: number) => {
    if (!startSlotId) {
      toast.info("Please select a start time first.");
      return;
    }
    
    const activeDay = days.find((d) => d.date === selectedDate);
    const activeSlots = activeDay?.slots ?? [];
    const sorted = [...activeSlots].sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    const startIndex = sorted.findIndex((s) => s.id === startSlotId);
    if (startIndex === -1) return;
    
    const numSlots = Math.ceil(hrs);
    
    if (startIndex + numSlots > sorted.length) {
      toast.error(`Not enough slots remaining in the day for a ${hrs} hour booking.`);
      return;
    }
    
    const proposedRange = sorted.slice(startIndex, startIndex + numSlots);
    const hasBooked = proposedRange.some((s) => s.is_booked);
    
    if (hasBooked) {
      toast.error(`Cannot select ${hrs} hours: One or more slots in the range are booked.`);
      return;
    }
    
    setEndSlotId(null);
    setDuration(hrs);
  };

  const onPickSlot = (slot: Slot) => {
    if (slot.is_booked) {
      if (!startSlotId) {
        if (!user) {
          toast.info("Please log in to join waitlist");
          navigate({ to: "/login" });
          return;
        }
        toast.info("Slot is full — joining waitlist");
        joinWaitlist(slot.id);
      } else {
        toast.error("This slot is already booked and cannot be part of your range.");
      }
      return;
    }
    handleSlotClick(slot);
  };

  const joinWaitlist = async (slotId: string) => {
    if (!user) return;
    const { error } = await supabase.from("zenturf_waitlist_v2").insert({
      user_id: user.id,
      venue_id: id,
      slot_id: slotId,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Added to waitlist — we'll notify you if a spot opens");
  };

  if (isLoading || !venue) {
    return (
      <div className="w-full max-w-[95%] xl:max-w-[92%] mx-auto space-y-6 px-4 py-6">
        <Skeleton className="h-[260px] sm:h-[360px] w-full rounded-2xl" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className={`w-full max-w-[95%] xl:max-w-[92%] mx-auto space-y-8 px-4 py-6 ${rangeSummary ? "pb-28" : ""}`}>
      
      {/* 2-Column Responsive Layout for Details & Compact Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Venue Details, Amenities, choose sport (8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge className="mb-2 bg-success text-success-foreground capitalize">
                {venue.type}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{venue.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {venue.rating.toFixed(1)} · {venue.total_reviews} reviews
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {venue.address}, {venue.city}
                </span>
                {venue.area_sqft && (
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                      {venue.area_sqft.toLocaleString()} sq.ft
                    </Badge>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {venue.description && (
            <p className="text-muted-foreground leading-relaxed text-base max-w-3xl">{venue.description}</p>
          )}

          {/* Amenities */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {venue.amenities.map((a) => {
                const Icon = AMENITY_ICONS[a] ?? ShieldCheck;
                return (
                  <Badge
                    key={a}
                    variant="secondary"
                    className="gap-1.5 px-3 py-1.5"
                  >
                    <Icon className="h-3.5 w-3.5" /> {a}
                  </Badge>
                );
              })}
            </div>
          </section>

          {/* Sport selector */}
          {venue.sport_tags.length > 1 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Choose sport</h2>
              <div className="flex flex-wrap gap-2">
                {venue.sport_tags.map((s) => (
                  <Button
                    key={s}
                    variant={selectedSport === s ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setSelectedSport(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Side: Compact Sticky Image Gallery Sidebar & Pricing Info Card (4 cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
          
          {/* Compact Image Carousel */}
          <div className="overflow-hidden rounded-2xl border border-border/80 shadow-md bg-card">
            <Carousel className="w-full">
              <CarouselContent>
                {venue.photos.map((p, i) => (
                  <CarouselItem key={i} className="h-[200px] sm:h-[260px] md:h-[280px]">
                    <img src={p} alt="" className="h-full w-full object-cover" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>

          {/* Pricing Info Card Widget */}
          <Card className="p-5 flex items-center justify-between shadow-sm border border-border/80 bg-card rounded-2xl">
            <div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Starting at</div>
              <div className="text-2xl font-bold mt-1 text-foreground">
                {formatINR(venue.price_per_hour)}
                <span className="text-sm font-normal text-muted-foreground"> /hr</span>
              </div>
            </div>
            {venue.price_per_day && (
              <div className="text-right border-l pl-4 border-border/80">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Full day</div>
                <div className="text-lg font-bold mt-1 text-primary">
                  {formatINR(venue.price_per_day)}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Live Calendar */}
      <section className="bg-card border shadow-sm rounded-2xl overflow-hidden mt-8">
        <div className="p-5 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Available slots</h2>
            <p className="text-sm text-muted-foreground mt-1">Select a date to view and pick your timings</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 text-xs font-medium text-muted-foreground bg-background px-3 py-1.5 rounded-full border shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live availability
          </span>
        </div>

        {/* Date Selector */}
        <div className="flex gap-3 overflow-x-auto p-5 border-b scrollbar-none snap-x">
          {days.map(({ date }) => {
            const d = new Date(date);
            const isSelected = selectedDate === date;
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = d.getDate();
            const monthName = d.toLocaleDateString("en-US", { month: "short" });
            
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-2 rounded-xl border transition-all duration-200 cursor-pointer flex-shrink-0 snap-start ${
                  isSelected
                    ? "bg-foreground text-background border-foreground font-semibold shadow-md scale-[1.02]"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:bg-muted/50"
                }`}
              >
                <span className="text-[10px] font-medium lowercase opacity-80">{dayName}</span>
                <span className="text-xl font-bold my-0.5">{dayNum}</span>
                <span className="text-[10px] font-medium lowercase opacity-80">{monthName}</span>
              </button>
            );
          })}
        </div>

        {/* Slots for Selected Date */}
        {selectedDate && (
          <div className="p-5 bg-background">
            {(() => {
              const activeDay = days.find((d) => d.date === selectedDate);
              const activeSlots = activeDay?.slots ?? [];
              
              if (activeSlots.length === 0) {
                return (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No slots available for this day.
                  </div>
                );
              }

              // Duration selector shown only when startSlotId is selected
              const renderDurationSelector = () => {
                if (!startSlotId) return null;
                const activeStartSlot = activeSlots.find(s => s.id === startSlotId);
                return (
                  <div className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-8 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground lowercase">start time</span>
                      <Badge variant="secondary" className="font-mono text-sm font-medium bg-background shadow-sm border px-2.5 py-1">
                        {formatTime(activeStartSlot?.start_time || "")}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground mr-1">Duration:</span>
                      {[1, 2, 3, 4, 5].map((hrs) => {
                        const isSelected = duration === hrs;
                        return (
                          <Button
                            key={hrs}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={`h-8 px-3.5 rounded-full text-xs font-bold transition-all ${isSelected ? "shadow-md scale-105" : "bg-background hover:bg-muted"}`}
                            onClick={() => handleDurationSelect(hrs)}
                          >
                            {hrs} {hrs === 1 ? "hr" : "hrs"}
                          </Button>
                        );
                      })}
                      {(duration !== null || endSlotId !== null) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground ml-1"
                          onClick={() => {
                            setEndSlotId(null);
                            setDuration(null);
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                );
              };

              const morningSlots = activeSlots.filter(s => parseInt(s.start_time.split(":")[0]) < 12);
              const afternoonSlots = activeSlots.filter(s => {
                const h = parseInt(s.start_time.split(":")[0]);
                return h >= 12 && h < 16;
              });
              const eveningSlots = activeSlots.filter(s => parseInt(s.start_time.split(":")[0]) >= 16);

              const getSlotHighlightState = (slot: Slot) => {
                if (selectedSlots.length === 0) return "none";
                const firstId = selectedSlots[0].id;
                const lastId = selectedSlots[selectedSlots.length - 1].id;
                
                if (slot.id === firstId) return "start";
                if (slot.id === lastId && selectedSlots.length > 1) return "end";
                if (selectedSlots.some((s) => s.id === slot.id)) return "middle";
                
                return "none";
              };

              const renderSlotButton = (slot: Slot) => {
                const highlight = getSlotHighlightState(slot);
                let btnStyle = "";
                
                if (slot.is_booked) {
                  btnStyle = "bg-muted/40 text-muted-foreground/40 cursor-not-allowed border-transparent";
                } else if (highlight === "start" || highlight === "end") {
                  btnStyle = "border-primary bg-primary text-primary-foreground shadow-md font-bold scale-[1.03] z-10";
                } else if (highlight === "middle") {
                  btnStyle = "border-primary/20 bg-primary/10 text-primary font-bold";
                } else {
                  btnStyle = "bg-background border-border text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary";
                }

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onPickSlot(slot)}
                    className={`relative w-full h-14 rounded-lg border px-2 text-xs transition-all duration-200 text-center flex flex-col items-center justify-center gap-0.5 ${btnStyle}`}
                  >
                    {highlight === "start" && <span className="text-[9px] font-medium lowercase opacity-90 leading-none">start</span>}
                    {highlight === "end" && <span className="text-[9px] font-medium lowercase opacity-90 leading-none">end</span>}
                    <span className="font-medium tracking-tight">{formatTime(slot.start_time)}</span>
                    <span className="text-[9px] opacity-75 font-medium leading-none mt-0.5">{formatINR(venue.price_per_hour)}</span>
                    {slot.is_booked && (
                      <Lock className="absolute top-1.5 right-1.5 w-3 h-3 opacity-30" />
                    )}
                  </button>
                );
              };

              return (
                <div>
                  {renderDurationSelector()}

                  <div className="space-y-8">
                    {morningSlots.length > 0 && (
                      <div>
                        <h3 className="text-[13px] font-bold text-muted-foreground mb-3 flex items-center gap-2">
                          <Sun className="w-4 h-4 text-warning" /> Morning
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                          {morningSlots.map(renderSlotButton)}
                        </div>
                      </div>
                    )}

                    {afternoonSlots.length > 0 && (
                      <div>
                        <h3 className="text-[13px] font-bold text-muted-foreground mb-3 flex items-center gap-2">
                          <Sunset className="w-4 h-4 text-orange-500" /> Afternoon
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                          {afternoonSlots.map(renderSlotButton)}
                        </div>
                      </div>
                    )}

                    {eveningSlots.length > 0 && (
                      <div>
                        <h3 className="text-[13px] font-bold text-muted-foreground mb-3 flex items-center gap-2">
                          <Moon className="w-4 h-4 text-indigo-400" /> Evening & Night
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                          {eveningSlots.map(renderSlotButton)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </section>

      {/* Map */}
      {venue.lat && venue.lng && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Location</h2>
          <div className="overflow-hidden rounded-2xl border">
            <VenueMap
              venues={[
                {
                  id: venue.id,
                  name: venue.name,
                  city: venue.city,
                  lat: venue.lat,
                  lng: venue.lng,
                  price_per_hour: venue.price_per_hour,
                },
              ]}
              center={{ lat: venue.lat, lng: venue.lng }}
              single
              height={320}
            />
          </div>
        </section>
      )}

      {/* Reviews */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Reviews ({venue.total_reviews})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews yet. Be the first after your booking!
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {r.profiles?.name ?? "Guest"}
                  </div>
                  <div className="flex items-center gap-1 text-warning">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-warning" />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.comment}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
      {/* Floating Center Summary Bar */}
      {rangeSummary && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl bg-background/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl z-50 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-in fade-in slide-in-from-bottom-5">
          <div className="flex flex-col flex-1">
            <span className="text-[10px] text-muted-foreground font-medium lowercase opacity-90 mb-1">{venue.name} • {venue.city}</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-foreground leading-tight">
                {rangeSummary.formattedRange}
              </span>
              <Badge variant="secondary" className="px-1.5 py-0 text-xs font-semibold shadow-sm">{rangeSummary.totalHours} {rangeSummary.totalHours === 1 ? "hr" : "hrs"}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-border/40 sm:border-t-0 pt-4 sm:pt-0 mt-1 sm:mt-0">
            <div className="flex flex-col items-start sm:items-end">
               <span className="text-[10px] text-muted-foreground font-medium lowercase opacity-90 mb-0.5">total</span>
              <span className="text-xl sm:text-2xl font-extrabold text-foreground leading-none">
                {formatINR(rangeSummary.totalPrice)}
              </span>
            </div>
            <FlowButton
              type="button"
              text="Book Now"
              className="h-12 border-[#111111]/10 dark:border-white/10 shadow-sm"
              onClick={() => {
                if (!user) {
                  toast.info("Please log in to book");
                  navigate({ to: "/login" });
                  return;
                }
                const idsParam = selectedSlots.map(s => s.id).join(",");
                navigate({
                  to: "/book/$venueId",
                  params: { venueId: id },
                  search: {
                    slotId: startSlotId!,
                    slotIds: idsParam,
                    duration: duration,
                  } as any,
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
