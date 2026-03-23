"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface Position {
  truckId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface MapProps {
  positions: Position[];
}

const defaultCenter: [number, number] = [41.3851, 2.1734];

const createTruckIcon = (truckId: string) => {
  return L.divIcon({
    className: "custom-icon",
    html: `
      <div style="
        background-color: #3b82f6;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        white-space: nowrap;
      ">
        ${truckId}
      </div>
    `,
    iconSize: [80, 30],
    iconAnchor: [40, 15],
  });
};

export default function MapInner({ positions }: MapProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES");
  };

  const mapCenter: [number, number] =
    positions.length > 0
      ? [positions[0].latitude, positions[0].longitude]
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
      {positions.map((pos) => (
        <Marker
          key={pos.truckId}
          position={[pos.latitude, pos.longitude]}
          icon={createTruckIcon(pos.truckId)}
        >
          <Popup>
            <div className="text-center">
              <strong className="text-lg">{pos.truckId}</strong>
              <br />
              <span className="text-sm text-gray-600">
                {formatTime(pos.timestamp)}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
