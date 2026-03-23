"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Cargando mapa...</span>
    </div>
  ),
});

interface LastPosition {
  truckId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface LogEntry {
  id: number;
  truckId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export default function AdminPage() {
  const [lastPositions, setLastPositions] = useState<LastPosition[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/location");
      const data = await res.json();
      setLastPositions(data.lastPositions || []);
      setLogs(data.logs || []);
      setLastUpdate(new Date().toLocaleTimeString("es-ES"));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">HORECA HUB - Panel Admin</h1>
          <div className="text-sm">
            <span>Última actualización: {lastUpdate}</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="ml-4 bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              <option value={3000}>3s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Camiones Activos: {lastPositions.length}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
            {lastPositions.map((pos) => (
              <div
                key={pos.truckId}
                className="bg-green-100 border border-green-300 rounded px-3 py-2 text-sm"
              >
                <span className="font-semibold">{pos.truckId}</span>
                <span className="block text-xs text-gray-600">
                  {formatTime(pos.timestamp)}
                </span>
              </div>
            ))}
            {lastPositions.length === 0 && (
              <p className="text-gray-500 col-span-full text-center py-4">
                No hay camiones activos
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="h-[500px]">
            <MapComponent positions={lastPositions} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Historial de Ubicaciones</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    ID Camión
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Latitud
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Longitud
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{log.truckId}</td>
                    <td className="px-4 py-3">{log.latitude.toFixed(6)}</td>
                    <td className="px-4 py-3">{log.longitude.toFixed(6)}</td>
                    <td className="px-4 py-3">{formatTime(log.timestamp)}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No hay registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
