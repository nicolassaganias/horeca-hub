"use client";

import { useEffect, useState, useRef } from "react";

interface DUMH {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  spots: number;
  reservations: Reservation[];
}

interface Reservation {
  id: number;
  hubId: number;
  truckId: string;
  startTime: string;
  endTime: string;
  status: string;
}

type View = "main" | "tracking" | "reservations";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DriverPage() {
  const [view, setView] = useState<View>("main");
  const [dumhs, setDUMHs] = useState<DUMH[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
    fetchDUMHs();
    fetchReservations();
  }, []);

  const fetchDUMHs = async () => {
    try {
      const res = await fetch("/api/hubs");
      const data = await res.json();
      setDUMHs(data);
    } catch (error) {
      console.error("Error fetching DUMHs:", error);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/reservations");
      const data = await res.json();
      setReservations(data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

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

  const isSlotReserved = (dumhId: number, date: Date, hour: number) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return reservations.some(r => {
      if (r.hubId !== dumhId || r.status !== "active") return false;
      const resStart = new Date(r.startTime);
      const resEnd = new Date(r.endTime);
      return resStart < slotEnd && resEnd > slotStart;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">HORECA HUB</h1>
              <p className="text-blue-200 text-sm">Driver App</p>
            </div>
            <nav className="flex gap-2">
              <button
                onClick={() => setView("main")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  view === "main" ? "bg-white text-blue-600" : "text-white hover:bg-blue-500"
                }`}
              >
                Inicio
              </button>
              <button
                onClick={() => setView("tracking")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  view === "tracking" ? "bg-white text-blue-600" : "text-white hover:bg-blue-500"
                }`}
              >
                GPS
              </button>
              <button
                onClick={() => setView("reservations")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  view === "reservations" ? "bg-white text-blue-600" : "text-white hover:bg-blue-500"
                }`}
              >
                Reservas
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {view === "main" && (
          <MainMenu setView={setView} />
        )}
        {view === "tracking" && (
          <TrackingView
            truckId={truckId}
            setTruckId={setTruckId}
            isTracking={isTracking}
            status={status}
            location={location}
            sentCount={sentCount}
            startTracking={startTracking}
            stopTracking={stopTracking}
          />
        )}
        {view === "reservations" && (
          <ReservationsView
            dumhs={dumhs}
            reservations={reservations}
            truckId={truckId}
            isSlotReserved={isSlotReserved}
            onReserve={() => { fetchReservations(); }}
          />
        )}
      </main>
    </div>
  );
}

function MainMenu({ setView }: { setView: (v: View) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-700">Bienvenido</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setView("tracking")}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition hover:bg-blue-50 border-2 border-blue-100"
        >
          <div className="text-4xl mb-3">📍</div>
          <h3 className="text-lg font-semibold text-slate-800">GPS Tracking</h3>
          <p className="text-sm text-slate-500 mt-1">Iniciar/detener seguimiento de ruta</p>
        </button>

        <button
          onClick={() => setView("reservations")}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition hover:bg-green-50 border-2 border-green-100"
        >
          <div className="text-4xl mb-3">🅿️</div>
          <h3 className="text-lg font-semibold text-slate-800">Reservar Plaza</h3>
          <p className="text-sm text-slate-500 mt-1">Reservar espacio en DUMH</p>
        </button>
      </div>
    </div>
  );
}

function TrackingView({
  truckId, setTruckId, isTracking, status, location, sentCount, startTracking, stopTracking
}: {
  truckId: string;
  setTruckId: (v: string) => void;
  isTracking: boolean;
  status: string;
  location: {lat: number, lng: number} | null;
  sentCount: number;
  startTracking: () => void;
  stopTracking: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
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

      <div className="bg-white rounded-xl shadow-md p-6">
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

      <div className="bg-white rounded-xl shadow-md p-6">
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
    </div>
  );
}

function ReservationsView({
  dumhs, reservations, truckId, isSlotReserved, onReserve
}: {
  dumhs: DUMH[];
  reservations: Reservation[];
  truckId: string;
  isSlotReserved: (dumhId: number, date: Date, hour: number) => boolean;
  onReserve: () => void;
}) {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  const [selectedDUMH, setSelectedDUMH] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(1);
  const [reserving, setReserving] = useState(false);

  const handleReserve = async () => {
    if (!selectedDUMH || !selectedHour || !truckId.trim()) {
      alert("Selecciona DUMH, hora y escribe tu ID de camión");
      return;
    }

    setReserving(true);
    try {
      const startTime = new Date(selectedDate);
      startTime.setHours(selectedHour, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration * 30);

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hubId: selectedDUMH,
          truckId: truckId.trim(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      if (res.ok) {
        onReserve();
        setSelectedHour(null);
        alert("Reserva confirmada!");
      } else {
        const data = await res.json();
        alert(data.error || "Error al reservar");
      }
    } catch (error) {
      alert("Error al realizar la reserva");
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Reservar Plaza en DUMH</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">ID de Camión</label>
          <input
            type="text"
            value={truckId}
            onChange={(e) => truckId}
            placeholder="Ej: CAMION-001"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar DUMH</label>
            <div className="space-y-2">
              {dumhs.map((dumh) => (
                <button
                  key={dumh.id}
                  onClick={() => setSelectedDUMH(dumh.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${
                    selectedDUMH === dumh.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <p className="font-medium">{dumh.name}</p>
                  <p className="text-sm text-gray-500">{dumh.spots} plazas</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duración</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${
                    duration === d ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {d * 30} min
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tu ID de Camión (para reservar)</label>
          <input
            type="text"
            value={truckId}
            onChange={(e) => truckId}
            placeholder="Escribe tu ID de camión"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b bg-green-50">
          <h3 className="font-semibold text-green-800">Grilla Semanal</h3>
          <p className="text-sm text-green-600">Selecciona fecha y hora para reservar</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-2 py-3 text-left font-medium text-slate-600 sticky left-0 bg-slate-50">Hora</th>
                {weekDays.map((date, i) => (
                  <th key={i} className="px-2 py-3 text-center font-medium text-slate-600 min-w-[80px]">
                    <div>{date.toLocaleDateString("es-ES", { weekday: "short" })}</div>
                    <div className="text-xs">{date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {HOURS.map((hour) => (
                <tr key={hour}>
                  <td className="px-2 py-2 font-medium text-slate-600 sticky left-0 bg-white">
                    {hour.toString().padStart(2, "0")}:00
                  </td>
                  {weekDays.map((date, i) => {
                    const isReserved = selectedDUMH ? isSlotReserved(selectedDUMH, date, hour) : false;
                    const isSelected = selectedDate.toDateString() === date.toDateString() && selectedHour === hour;
                    const isPast = date.toDateString() === today.toDateString() && hour < today.getHours();

                    return (
                      <td key={i} className="px-1 py-1">
                        <button
                          onClick={() => {
                            if (!isReserved && !isPast) {
                              setSelectedDate(date);
                              setSelectedHour(hour);
                            }
                          }}
                          disabled={isReserved || isPast}
                          className={`w-full h-10 rounded text-xs font-medium transition ${
                            isSelected
                              ? "bg-green-600 text-white"
                              : isReserved
                              ? "bg-red-100 text-red-600 cursor-not-allowed"
                              : isPast
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {isReserved ? "Ocupado" : isPast ? "-" : `${hour}:00`}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDUMH && selectedHour !== null && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-slate-700 mb-3">Confirmar Reserva</h3>
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <p><strong>DUMH:</strong> {dumhs.find(d => d.id === selectedDUMH)?.name}</p>
            <p><strong>Fecha:</strong> {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
            <p><strong>Hora:</strong> {selectedHour.toString().padStart(2, "0")}:00 - {(selectedHour + (duration * 30 / 60)).toString().padStart(2, "0")}:{(duration * 30) % 60}</p>
            <p><strong>Duración:</strong> {duration * 30} minutos</p>
          </div>
          <button
            onClick={handleReserve}
            disabled={reserving || !truckId.trim()}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {reserving ? "Reservando..." : "Confirmar Reserva"}
          </button>
        </div>
      )}
    </div>
  );
}
