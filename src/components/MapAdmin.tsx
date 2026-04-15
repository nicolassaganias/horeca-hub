"use client";

import dynamic from "next/dynamic";

const MapWithDUMHs = dynamic(
  () => import("@/components/MapWithDUMHsInner"),
  { ssr: false }
);

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

interface MapAdminProps {
  trucks: TruckPosition[];
  dumhs: DUMH[];
}

export default function MapAdmin(props: MapAdminProps) {
  return <MapWithDUMHs {...props} />;
}
