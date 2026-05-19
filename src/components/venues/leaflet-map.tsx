import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "@tanstack/react-router";
import { formatINR } from "@/lib/format";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export type LeafletVenue = {
  id: string;
  name: string;
  city: string | null;
  lat: number;
  lng: number;
  price_per_hour: number;
  type?: string;
};

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LeafletMap({
  venues,
  center,
  height = 400,
  single = false,
}: {
  venues: LeafletVenue[];
  center?: { lat: number; lng: number };
  height?: number;
  single?: boolean;
}) {
  const navigate = useNavigate();
  // Default to Chennai
  const initialCenter: [number, number] = center
    ? [center.lat, center.lng]
    : venues.length
      ? [venues[0].lat, venues[0].lng]
      : [13.0827, 80.2707];

  return (
    <MapContainer
      center={initialCenter}
      zoom={single ? 14 : 11}
      scrollWheelZoom={!single}
      style={{ height, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {center && <Recenter center={[center.lat, center.lng]} />}
      {venues.map((v) => (
        <Marker key={v.id} position={[v.lat, v.lng]} icon={icon}>
          <Popup>
            <div className="space-y-1.5">
              <div className="font-semibold">{v.name}</div>
              {v.city && (
                <div className="text-xs text-muted-foreground">{v.city}</div>
              )}
              <div className="text-xs">
                <span className="font-medium">
                  {formatINR(v.price_per_hour)}
                </span>{" "}
                / hr
              </div>
              <button
                onClick={() =>
                  navigate({ to: "/venue/$id", params: { id: v.id } })
                }
                className="mt-1 inline-flex w-full items-center justify-center rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                View venue →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
