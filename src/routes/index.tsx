import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  List,
  Map as MapIcon,
  Locate,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FlowButton } from "@/components/ui/flow-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { VenueMap } from "@/components/venues/venue-map";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZenTurf — Book turfs, courts & event halls in real time" },
      {
        name: "description",
        content:
          "Browse and book sports turfs, badminton courts, auditoriums and event halls with live availability.",
      },
    ],
  }),
  component: HomePage,
});

const SPORTS = [
  "Football",
  "Cricket",
  "Tennis",
  "Badminton",
  "Basketball",
  "Squash",
  "Auditorium",
  "Event Hall",
];

type Venue = {
  id: string;
  name: string;
  type: "turf" | "court" | "auditorium";
  sport_tags: string[];
  city: string | null;
  address: string | null;
  rating: number;
  total_reviews: number;
  price_per_hour: number;
  photos: string[];
  amenities: string[];
  lat: number | null;
  lng: number | null;
  area_sqft: number | null;
};

function HomePage() {
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ["venues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zenturf_venues_v2")
        .select(
          "id,name,type,sport_tags,city,address,rating,total_reviews,price_per_hour,photos,amenities,lat,lng,area_sqft",
        )
        .eq("is_approved", true)
        .order("rating", { ascending: false });
      if (error) throw error;
      return data as Venue[];
    },
  });

  const filtered = useMemo(() => {
    return venues.filter((v) => {
      const q = query.trim().toLowerCase();
      const matchesQ =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.sport_tags.some((s) => s.toLowerCase().includes(q));
      const matchesSport = !sport || v.sport_tags.includes(sport);
      return matchesQ && matchesSport;
    });
  }, [venues, query, sport]);

  const nearMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="w-full max-w-[95%] xl:max-w-[92%] mx-auto relative px-4 py-16 text-primary-foreground sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge
              variant="secondary"
              className="mb-4 bg-white/20 text-white hover:bg-white/30"
            >
              Live availability • Instant confirmation
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Book turfs, courts &amp; halls — in seconds
            </h1>
            <p className="mt-4 text-lg opacity-90 sm:text-xl">
              Real-time slots, QR check-in, transparent pricing. No more phone
              calls or stale calendars.
            </p>

            <div className="mt-8 flex flex-col gap-2 rounded-2xl bg-card p-2 text-foreground shadow-[var(--shadow-elegant)] sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input
                  className="border-0 shadow-none focus-visible:ring-0 text-base"
                  placeholder="Search venue, sport, or city"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0 px-2 sm:px-0">
                <Button 
                  onClick={nearMe} 
                  variant="outline" 
                  className="h-10 sm:h-12 gap-2 px-4 rounded-full font-semibold border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200"
                >
                  <Locate className="h-4 w-4 text-primary animate-pulse" /> Near me
                </Button>
                <FlowButton 
                  text="Search" 
                  className="h-10 sm:h-12" 
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="w-full max-w-[95%] xl:max-w-[92%] mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={!sport ? "default" : "outline"}
            onClick={() => setSport(null)}
            className="rounded-full"
          >
            All
          </Button>
          {SPORTS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={sport === s ? "default" : "outline"}
              onClick={() => setSport(s)}
              className="rounded-full"
            >
              {s}
            </Button>
          ))}
          <div className="ml-auto flex items-center gap-1 rounded-full border p-1">
            <Button
              size="sm"
              variant={view === "list" ? "default" : "ghost"}
              className="rounded-full"
              onClick={() => setView("list")}
            >
              <List className="mr-1 h-4 w-4" /> List
            </Button>
            <Button
              size="sm"
              variant={view === "map" ? "default" : "ghost"}
              className="rounded-full"
              onClick={() => setView("map")}
            >
              <MapIcon className="mr-1 h-4 w-4" /> Map
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {view === "map" ? (
            <div className="overflow-hidden rounded-2xl border">
              <VenueMap
                venues={filtered.filter((v) => v.lat && v.lng) as any}
                center={coords ?? undefined}
                height={500}
              />
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed py-16 text-center">
              <p className="text-2xl">🤷‍♀️</p>
              <p className="mt-2 font-medium">No venues found</p>
              <p className="text-sm text-muted-foreground">
                Try a different search or sport.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <VenueCard v={v} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function VenueCard({ v }: { v: Venue }) {
  return (
    <Link
      to="/venue/$id"
      params={{ id: v.id }}
      className="group block overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {v.photos[0] && (
          <img
            src={v.photos[0]}
            alt={v.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute left-3 top-3 flex gap-1">
          <Badge className="bg-success text-success-foreground capitalize">
            {v.type}
          </Badge>
        </div>
        <Badge className="absolute right-3 top-3 bg-card text-foreground">
          <Star className="mr-1 h-3 w-3 fill-warning text-warning" />
          {v.rating.toFixed(1)}
        </Badge>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 font-semibold">{v.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">{v.city ?? v.address}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {v.sport_tags.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px]">
              {s}
            </Badge>
          ))}
          {v.area_sqft && (
            <Badge
              variant="outline"
              className="text-[10px] border-muted-foreground/30"
            >
              {v.area_sqft.toLocaleString()} sq.ft
            </Badge>
          )}
        </div>
        <div className="flex items-baseline justify-between pt-2">
          <div>
            <span className="text-lg font-bold">
              {formatINR(v.price_per_hour)}
            </span>
            <span className="text-xs text-muted-foreground"> /hr</span>
          </div>
          <span className="text-xs text-success">● Open</span>
        </div>
      </div>
    </Link>
  );
}
