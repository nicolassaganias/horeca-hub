"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/MapAdmin"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-slate-500">Cargando mapa...</span>
    </div>
  ),
});

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

interface Alert {
  id: number;
  hubId: number;
  type: string;
  message: string;
  createdAt: string;
  resolved: boolean;
  dumh: { name: string };
}

interface LogEntry {
  id: number;
  truckId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export default function AdminDashboard() {
  const [trucks, setTrucks] = useState<TruckPosition[]>([]);
  const [dumhs, setDUMHs] = useState<DUMH[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);

  const fetchAllLogs = async () => {
    try {
      const res = await fetch("/api/trucks");
      const data = await res.json();
      setAllLogs(data);
    } catch (error) {
      console.error("Error fetching all logs:", error);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/location");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setTrucks(data.lastPositions || []);
      setDUMHs(data.dumhs || []);
      setAlerts(data.alerts || []);
      setLogs(data.logs || []);
      setLastUpdate(new Date().toLocaleTimeString("es-ES"));
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const simulateIntruder = async (hubId: number, hubName: string) => {
    setSimulating(true);
    try {
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hubId,
          type: "intrusion",
          message: `Vehículo no autorizado detectado en ${hubName}`,
        }),
      });
      fetchData();
    } finally {
      setSimulating(false);
    }
  };

  const resolveAlert = async (alertId: number) => {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: alertId, resolved: true }),
    });
    fetchData();
  };

  const terminateTruck = async (truckId: string) => {
    if (!confirm(`¿Terminar actividad del camión "${truckId}"?`)) return;
    await fetch(`/api/trucks?truckId=${encodeURIComponent(truckId)}`, {
      method: "DELETE",
    });
    fetchData();
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truckColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">HORECA HUB</h1>
            <p className="text-blue-200 text-sm">Barcelona Logistics</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-red-400"
                }`}
              />
              <span className="text-sm">
                {isConnected ? "En línea" : "Desconectado"}
              </span>
            </div>
            <p className="text-sm text-blue-200">Última actualización: {lastUpdate}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold text-slate-700 mb-3">
              Flota Activa
            </h2>
            <div className="text-4xl font-bold text-blue-600">{trucks.length}</div>
            <p className="text-slate-500 text-sm">camiones reportando</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold text-slate-700 mb-3">DUMHs</h2>
            <div className="text-4xl font-bold text-green-600">{dumhs.length}</div>
            <p className="text-slate-500 text-sm">puntos de estacionamiento</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Alertas</h2>
            <div className="text-4xl font-bold text-red-600">{alerts.length}</div>
            <p className="text-slate-500 text-sm">pendientes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-700">
                Mapa en Tiempo Real
              </h2>
              <span className="text-xs text-slate-400">
                Actualiza cada 3 segundos
              </span>
            </div>
            <div className="h-[450px]">
              <MapComponent trucks={trucks} dumhs={dumhs} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b bg-red-50">
                <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Alertas
                </h2>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="p-4 text-slate-500 text-center text-sm">
                    Sin alertas pendientes
                  </p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      className="p-3 border-b border-slate-100 bg-red-50"
                    >
                      <p className="text-sm font-medium text-red-800">
                        {alert.dumh.name}
                      </p>
                      <p className="text-xs text-red-600">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatTime(alert.createdAt)}
                      </p>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="mt-2 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      >
                        Resolver
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b bg-blue-50">
                <h2 className="text-lg font-semibold text-blue-700">
                  Simular Sensor IoT
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {dumhs.map((dumh) => (
                  <button
                    key={dumh.id}
                    onClick={() => simulateIntruder(dumh.id, dumh.name)}
                    disabled={simulating}
                    className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    🚨 Intruso en {dumh.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-700">
              Camiones Activos
            </h2>
            <div className="flex gap-2">
              {trucks.map((truck, i) => (
                <div
                  key={truck.truckId}
                  className={`${truckColors[i % truckColors.length]} text-white px-3 py-1 rounded-full text-sm font-medium`}
                >
                  {truck.truckId}
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Camión
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Latitud
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Longitud
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Última actualización
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trucks.map((truck, i) => (
                  <tr key={truck.truckId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span
                        className={`${truckColors[i % truckColors.length]} text-white px-2 py-1 rounded text-xs font-medium`}
                      >
                        {truck.truckId}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {truck.latitude.toFixed(6)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {truck.longitude.toFixed(6)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatTime(truck.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => terminateTruck(truck.truckId)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded font-medium"
                      >
                        Terminar
                      </button>
                    </td>
                  </tr>
                ))}
                {trucks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No hay camiones activos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-700">
              Historial de Ubicaciones
            </h2>
            <button
              onClick={() => { fetchAllLogs(); setShowLogsModal(true); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Ver Todos los Registros
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Camión
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Latitud
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Longitud
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{log.truckId}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {log.latitude.toFixed(6)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {log.longitude.toFixed(6)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatTime(log.timestamp)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No hay registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showLogsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-semibold text-slate-700">Todos los Registros de Ubicación</h2>
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-80px)]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">ID</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Camión</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Latitud</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Longitud</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500">{log.id}</td>
                        <td className="px-4 py-3 font-medium">{log.truckId}</td>
                        <td className="px-4 py-3 font-mono text-xs">{log.latitude.toFixed(6)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{log.longitude.toFixed(6)}</td>
                        <td className="px-4 py-3 text-slate-500">{formatTime(log.timestamp)}</td>
                      </tr>
                    ))}
                    {allLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No hay registros
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
