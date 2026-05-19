import { lazy, Suspense, useEffect, useState } from "react";

// Lazy-load Leaflet only on the client. Leaflet touches `window` at module
// scope which crashes SSR, so we never import it on the server.
const LeafletMap = lazy(() => import("./leaflet-map"));

type Venue = {
  id: string;
  name: string;
  city: string | null;
  lat: number;
  lng: number;
  price_per_hour: number;
  type?: string;
};

export function VenueMap({
  venues,
  center,
  height = 400,
  single = false,
}: {
  venues: Venue[];
  center?: { lat: number; lng: number };
  height?: number;
  single?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="flex w-full items-center justify-center bg-muted text-xs text-muted-foreground"
        style={{ height }}
      >
        Loading map…
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div
          className="flex w-full items-center justify-center bg-muted text-xs text-muted-foreground"
          style={{ height }}
        >
          Loading map…
        </div>
      }
    >
      <LeafletMap
        venues={venues}
        center={center}
        height={height}
        single={single}
      />
    </Suspense>
  );
}
