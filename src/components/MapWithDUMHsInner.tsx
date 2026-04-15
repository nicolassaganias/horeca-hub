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

interface DUMH {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  spots: number;
  reservations: { id: number; truckId: string; endTime: string }[];
  alerts: { id: number; type: string; message: string }[];
}

interface MapWithDUMHsProps {
  trucks: TruckPosition[];
  dumhs: DUMH[];
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

const dumhIcon = L.divIcon({
  className: "dumh-icon",
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
      DUMH
    </div>
  `,
  iconSize: [60, 25],
  iconAnchor: [30, 12],
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

function MapBoundsUpdater({ trucks, dumhs }: { trucks: TruckPosition[]; dumhs: DUMH[] }) {
  const map = useMap();

  useEffect(() => {
    if (trucks.length === 0 && dumhs.length === 0) return;

    const points: [number, number][] = [
      ...trucks.map((t) => [t.latitude, t.longitude] as [number, number]),
      ...dumhs.map((d) => [d.latitude, d.longitude] as [number, number]),
    ];

    if (points.length > 0) {
      map.fitBounds(points, { padding: [50, 50], maxZoom: 14 });
    }
  }, [trucks, dumhs, map]);

  return null;
}

export default function MapWithDUMHsInner({ trucks, dumhs }: MapWithDUMHsProps) {
  const defaultCenter: [number, number] = [41.3851, 2.1734];

  const mapCenter: [number, number] =
    trucks.length > 0
      ? [trucks[0].latitude, trucks[0].longitude]
      : dumhs.length > 0
      ? [dumhs[0].latitude, dumhs[0].longitude]
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

      <MapBoundsUpdater trucks={trucks} dumhs={dumhs} />

      {dumhs.map((dumh) => (
        <div key={`dumh-${dumh.id}`}>
          <Circle
            center={[dumh.latitude, dumh.longitude]}
            radius={50}
            pathOptions={{
              color: dumh.alerts.length > 0 ? "#ef4444" : "#10b981",
              fillColor: dumh.alerts.length > 0 ? "#ef4444" : "#10b981",
              fillOpacity: 0.2,
            }}
          />
          <Marker
            position={[dumh.latitude, dumh.longitude]}
            icon={dumh.alerts.length > 0 ? intruderIcon : dumhIcon}
          >
            <Popup>
              <div className="text-center min-w-[150px]">
                <strong className="text-lg block mb-1">{dumh.name}</strong>
                <span className="text-sm text-gray-500 block mb-2">
                  {dumh.address}
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {dumh.spots} plaza{dumh.spots > 1 ? "s" : ""}
                </span>
                {dumh.reservations.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-600">Reservado:</span>
                    <br />
                    {dumh.reservations.map((r) => (
                      <span
                        key={r.id}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mt-1"
                      >
                        {r.truckId}
                      </span>
                    ))}
                  </div>
                )}
                {dumh.alerts.length > 0 && (
                  <div className="mt-2 bg-red-100 p-2 rounded">
                    <span className="text-xs text-red-800">
                      ⚠️ {dumh.alerts[0].message}
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
