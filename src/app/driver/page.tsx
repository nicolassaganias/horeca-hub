"use client";

import { useEffect, useState, useRef } from "react";

export default function DriverPage() {
  const [truckId, setTruckId] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [status, setStatus] = useState("Esperando...");
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [sentCount, setSentCount] = useState(0);
  
  const truckIdRef = useRef("");
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{lat: number, lng: number, time: number} | null>(null);

  useEffect(() => {
    truckIdRef.current = truckId;
  }, [truckId]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const sendLocation = async (lat: number, lng: number) => {
    const id = truckIdRef.current.trim();
    if (!id) return;
    
    try {
      const res = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          truckId: id,
          latitude: lat,
          longitude: lng,
          rfidTags: "[]"
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setSentCount(c => c + 1);
        setStatus(`✓ Enviado #${data.id}`);
      }
    } catch (e) {
      console.error("Error sending:", e);
    }
  };

  const startTracking = () => {
    const id = truckId.trim();
    if (!id) {
      setStatus("Ingresa ID de camión");
      return;
    }

    setStatus("Activando GPS...");

    if (!navigator.geolocation) {
      setStatus("GPS no disponible");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({lat, lng});
        
        const now = Date.now();
        const shouldSend = !lastSentRef.current ||
          calculateDistance(lastSentRef.current.lat, lastSentRef.current.lng, lat, lng) >= 50 ||
          (now - lastSentRef.current.time) >= 30000;
        
        if (shouldSend) {
          lastSentRef.current = {lat, lng, time: now};
          sendLocation(lat, lng);
        }
        
        setIsTracking(true);
        setStatus("Ruta activa");
      },
      (err) => {
        console.error("GPS error:", err);
        setStatus(`Error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000
      }
    );

    setIsTracking(true);
    setStatus("Ruta iniciada");
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setStatus("Ruta detenida");
    lastSentRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold text-center">HORECA HUB - Repartidor</h1>
      </header>

      <main className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID de Camión
          </label>
          <input
            type="text"
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            placeholder="Ej: CAMION-001"
            disabled={isTracking}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg disabled:bg-gray-100"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          {!isTracking ? (
            <button
              onClick={startTracking}
              className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold active:scale-95 transition"
            >
              Iniciar Ruta
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="w-full bg-red-600 text-white py-4 rounded-lg text-lg font-semibold active:scale-95 transition"
            >
              Detener Ruta
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Estado</h2>
          <div className={`p-4 rounded-lg ${isTracking ? "bg-green-50" : "bg-gray-50"}`}>
            <p className="font-semibold text-lg">{status}</p>
            {location && (
              <div className="mt-2 text-sm">
                <p>Lat: {location.lat.toFixed(6)}</p>
                <p>Lng: {location.lng.toFixed(6)}</p>
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <span className="text-4xl font-bold text-blue-600">{sentCount}</span>
            <p className="text-sm text-gray-500">Ubicaciones enviadas</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold">Info:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Se envía cada 30s o 50m</li>
            <li>Mantén la pantalla encendida</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
