import dynamic from "next/dynamic";

interface Position {
  truckId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface MapProps {
  positions: Position[];
}

const MapWrapper = dynamic(
  () => import("@/components/MapInner"),
  { ssr: false, loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Cargando mapa...</span>
    </div>
  )}
);

export default function MapComponent(props: MapProps) {
  return <MapWrapper {...props} />;
}
