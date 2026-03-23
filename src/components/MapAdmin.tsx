"use client";

import dynamic from "next/dynamic";

const MapWithHubs = dynamic(
  () => import("@/components/MapWithHubsInner"),
  { ssr: false }
);

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

interface MapAdminProps {
  trucks: TruckPosition[];
  hubs: Hub[];
}

export default function MapAdmin(props: MapAdminProps) {
  return <MapWithHubs {...props} />;
}
