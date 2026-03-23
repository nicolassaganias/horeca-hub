"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

interface TruckPosition {
  truckId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface Hub {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  spots: number;
  reservations: { id: number; truckId: string; endTime: string }[];
  alerts: { id: number; type: string; message: string }[];
}

interface MapWithHubsProps {
  trucks: TruckPosition[];
  hubs: Hub[];
}

const truckColors = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ec4899", "#06b6d4"];

const createTruckIcon = (truckId: string, index: number) => {
  const color = truckColors[index % truckColors.length];
  return L.divIcon({
    className: "custom-icon",
    html: `
      <div style="
        background-color: ${color};
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 11px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        white-space: nowrap;
        border: 2px solid white;
      ">
        ${truckId}
      </div>
    `,
    iconSize: [80, 30],
    iconAnchor: [40, 15],
  });
};

const hubIcon = L.divIcon({
  className: "hub-icon",
  html: `
    <div style="
      background-color: #10b981;
      color: white;
      padding: 6px 10px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      HUB
    </div>
  `,
  iconSize: [50, 25],
  iconAnchor: [25, 12],
});

const intruderIcon = L.divIcon({
  className: "intruder-icon",
  html: `
    <div style="
      background-color: #ef4444;
      color: white;
      padding: 6px 10px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 2px solid white;
      animation: pulse 1s infinite;
    ">
      ⚠️ ALERTA
    </div>
  `,
  iconSize: [70, 25],
  iconAnchor: [35, 12],
});

function MapBoundsUpdater({ trucks, hubs }: { trucks: TruckPosition[]; hubs: Hub[] }) {
  const map = useMap();

  useEffect(() => {
    if (trucks.length === 0 && hubs.length === 0) return;

    const points: [number, number][] = [
      ...trucks.map((t) => [t.latitude, t.longitude] as [number, number]),
      ...hubs.map((h) => [h.latitude, h.longitude] as [number, number]),
    ];

    if (points.length > 0) {
      map.fitBounds(points, { padding: [50, 50], maxZoom: 14 });
    }
  }, [trucks, hubs, map]);

  return null;
}

export default function MapWithHubsInner({ trucks, hubs }: MapWithHubsProps) {
  const defaultCenter: [number, number] = [41.3851, 2.1734];

  const mapCenter: [number, number] =
    trucks.length > 0
      ? [trucks[0].latitude, trucks[0].longitude]
      : hubs.length > 0
      ? [hubs[0].latitude, hubs[0].longitude]
      : defaultCenter;

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsUpdater trucks={trucks} hubs={hubs} />

      {hubs.map((hub) => (
        <div key={`hub-${hub.id}`}>
          <Circle
            center={[hub.latitude, hub.longitude]}
            radius={50}
            pathOptions={{
              color: hub.alerts.length > 0 ? "#ef4444" : "#10b981",
              fillColor: hub.alerts.length > 0 ? "#ef4444" : "#10b981",
              fillOpacity: 0.2,
            }}
          />
          <Marker
            position={[hub.latitude, hub.longitude]}
            icon={hub.alerts.length > 0 ? intruderIcon : hubIcon}
          >
            <Popup>
              <div className="text-center min-w-[150px]">
                <strong className="text-lg block mb-1">{hub.name}</strong>
                <span className="text-sm text-gray-500 block mb-2">
                  {hub.address}
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {hub.spots} plaza{hub.spots > 1 ? "s" : ""}
                </span>
                {hub.reservations.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-600">Reservado:</span>
                    <br />
                    {hub.reservations.map((r) => (
                      <span
                        key={r.id}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mt-1"
                      >
                        {r.truckId}
                      </span>
                    ))}
                  </div>
                )}
                {hub.alerts.length > 0 && (
                  <div className="mt-2 bg-red-100 p-2 rounded">
                    <span className="text-xs text-red-800">
                      ⚠️ {hub.alerts[0].message}
                    </span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        </div>
      ))}

      {trucks.map((truck, index) => (
        <Marker
          key={truck.truckId}
          position={[truck.latitude, truck.longitude]}
          icon={createTruckIcon(truck.truckId, index)}
        >
          <Popup>
            <div className="text-center">
              <strong className="text-lg">{truck.truckId}</strong>
              <br />
              <span className="text-xs text-gray-500">
                {new Date(truck.timestamp).toLocaleString("es-ES")}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
