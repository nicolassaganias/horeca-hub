"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

interface DeliveryNote {
  id: number;
  number: string;
  date: string;
  supplier: string;
  rfidTag: string | null;
  type: string;
  fileName: string | null;
  weight: number | null;
  volume: number | null;
  productType: string | null;
  establishmentType: string | null;
  correctedNoteId: number | null;
  correctedNote: { number: string } | null;
}

type View = "main" | "new" | "rectify";

export default function DistriPage() {
  const [view, setView] = useState<View>("main");
  const [notes, setNotes] = useState<DeliveryNote[]>([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const res = await fetch("/api/delivery-notes");
    const data = await res.json();
    setNotes(data);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">HORECA HUB</h1>
              <p className="text-orange-200 text-sm">Centro de Distribución</p>
            </div>
            <button
              onClick={() => setView("main")}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition"
            >
              Volver
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {view === "main" && (
          <MainMenu onSelect={setView} notes={notes} />
        )}
        {view === "new" && (
          <NewDeliveryNote onBack={() => setView("main")} onSuccess={() => { fetchNotes(); setView("main"); }} />
        )}
        {view === "rectify" && (
          <RectifyDeliveryNote onBack={() => setView("main")} onSuccess={() => { fetchNotes(); setView("main"); }} />
        )}
      </main>
    </div>
  );
}

function MainMenu({ onSelect, notes }: { onSelect: (v: View) => void; notes: DeliveryNote[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-700">Seleccionar operación</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onSelect("new")}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition hover:bg-orange-50 border-2 border-orange-100"
        >
          <div className="text-4xl mb-3">📄</div>
          <h3 className="text-lg font-semibold text-slate-800">Cargar Nuevo Albarán</h3>
          <p className="text-sm text-slate-500 mt-1">Subir archivo y vincular RFID</p>
        </button>

        <button
          onClick={() => onSelect("rectify")}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition hover:bg-blue-50 border-2 border-blue-100"
        >
          <div className="text-4xl mb-3">✏️</div>
          <h3 className="text-lg font-semibold text-slate-800">Rectificar Albarán</h3>
          <p className="text-sm text-slate-500 mt-1">Corregir un albarán existente</p>
        </button>
      </div>

      {notes.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-700">Albaranes Recientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">N° Albarán</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Proveedor</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">RFID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notes.slice(0, 10).map((note) => (
                  <tr key={note.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{note.number}</td>
                    <td className="px-4 py-3">{new Date(note.date).toLocaleDateString("es-ES")}</td>
                    <td className="px-4 py-3">{note.supplier}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        note.type === "original" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {note.type === "original" ? "Original" : "Rectificación"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{note.rfidTag || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function NewDeliveryNote({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    number: "",
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    weight: "",
    volume: "",
    productType: "",
    establishmentType: "",
    fileName: "",
    rfidTag: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

        if (jsonData.length < 2) {
          setErrorMessage("El archivo está vacío o no tiene datos");
          return;
        }

        const headers = jsonData[0].map(h => h?.toString().toLowerCase().trim() || "");
        const row = jsonData[1];

        const getValue = (colName: string): string | number => {
          const idx = headers.findIndex(h => h.includes(colName));
          return idx >= 0 ? (row[idx] ?? "") : "";
        };

        const parseExcelDate = (value: string | number): string => {
          if (typeof value === "number" && value > 40000 && value < 60000) {
            const date = new Date((value - 25569) * 86400 * 1000);
            return date.toISOString().split("T")[0];
          }
          const parsed = new Date(value);
          return isNaN(parsed.getTime()) ? new Date().toISOString().split("T")[0] : parsed.toISOString().split("T")[0];
        };

        setFormData(prev => ({
          ...prev,
          fileName: file.name,
          number: getValue("número")?.toString() || prev.number,
          date: parseExcelDate(getValue("fecha")),
          supplier: getValue("proveedor")?.toString() || prev.supplier,
          weight: getValue("peso")?.toString() || prev.weight,
          volume: getValue("volumen")?.toString() || prev.volume,
          productType: getValue("tipología producto")?.toString() || prev.productType,
          establishmentType: getValue("tipología establecimiento")?.toString() || prev.establishmentType,
        }));
      } catch (err) {
        setErrorMessage("Error al leer el archivo Excel");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleReadRFID = async () => {
    try {
      const res = await fetch("/api/rfid");
      const data = await res.json();
      setFormData(prev => ({ ...prev, rfidTag: data.rfidTag }));
    } catch {
      setErrorMessage("Error al leer RFID");
    }
  };

  const handleSubmit = async () => {
    if (!formData.number || !formData.supplier) {
      setErrorMessage("Número y proveedor son requeridos");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/delivery-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear");
      }

      setStatus("success");
      setTimeout(onSuccess, 1500);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-slate-700 mb-6">Cargar Nuevo Albarán</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Número de Albarán *</label>
          <input
            type="text"
            value={formData.number}
            onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Ej: ALB-2024-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Fecha</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Proveedor *</label>
          <input
            type="text"
            value={formData.supplier}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Nombre del proveedor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Peso (kg)</label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Volumen (m³)</label>
          <input
            type="number"
            value={formData.volume}
            onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Tipología Producto</label>
          <input
            type="text"
            value={formData.productType}
            onChange={(e) => setFormData(prev => ({ ...prev, productType: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Ej: Electrónica, Perecederos..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Tipología Establecimiento</label>
          <input
            type="text"
            value={formData.establishmentType}
            onChange={(e) => setFormData(prev => ({ ...prev, establishmentType: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Ej: Restaurante, Hotel, Supermercado..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="file-upload"
            accept=".pdf,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="text-3xl mb-2">📎</div>
            <p className="text-sm text-slate-600">
              {formData.fileName || "Subir PDF o Excel"}
            </p>
          </label>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
          <button
            onClick={handleReadRFID}
            className="w-full"
          >
            <div className="text-3xl mb-2">📡</div>
            <p className="text-sm text-slate-600">
              {formData.rfidTag || "Tocar lector RFID"}
            </p>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {status === "success" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Albarán creado exitosamente
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50"
        >
          {status === "loading" ? "Guardando..." : "Aceptar"}
        </button>
        <button
          onClick={onBack}
          className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-300 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function RectifyDeliveryNote({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [noteNumber, setNoteNumber] = useState("");
  const [originalNote, setOriginalNote] = useState<DeliveryNote | null>(null);
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "notfound" | "found">("idle");
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({
    fileName: "",
    weight: "",
    volume: "",
    productType: "",
    establishmentType: "",
    rfidTag: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = async () => {
    if (!noteNumber.trim()) return;

    setSearchStatus("loading");
    try {
      const res = await fetch(`/api/delivery-notes?number=${encodeURIComponent(noteNumber)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setSearchStatus("notfound");
        setOriginalNote(null);
        return;
      }

      setNotes(data);
      setOriginalNote(data[0]);
      setSearchStatus("found");
      setStep(2);
    } catch {
      setSearchStatus("notfound");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, fileName: file.name }));
    }
  };

  const handleReadRFID = async () => {
    try {
      const res = await fetch("/api/rfid");
      const data = await res.json();
      setFormData(prev => ({ ...prev, rfidTag: data.rfidTag }));
    } catch {
      setErrorMessage("Error al leer RFID");
    }
  };

  const handleSubmit = async () => {
    if (!originalNote) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const rectificationNumber = `${originalNote.number}-R${notes.length + 1}`;

      const res = await fetch("/api/delivery-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: rectificationNumber,
          date: new Date().toISOString(),
          supplier: originalNote.supplier,
          rfidTag: formData.rfidTag || originalNote.rfidTag,
          fileName: formData.fileName || originalNote.fileName,
          weight: formData.weight || originalNote.weight,
          volume: formData.volume || originalNote.volume,
          productType: formData.productType || originalNote.productType,
          establishmentType: formData.establishmentType || originalNote.establishmentType,
          correctedNoteId: originalNote.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al rectificar");
      }

      setStatus("success");
      setTimeout(onSuccess, 1500);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-slate-700 mb-6">Rectificar Albarán</h2>

      {step === 1 && (
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Número de Albarán</label>
          <div className="flex gap-4">
            <input
              type="text"
              value={noteNumber}
              onChange={(e) => setNoteNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: ALB-2024-001"
            />
            <button
              onClick={handleSearch}
              disabled={searchStatus === "loading"}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {searchStatus === "loading" ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {searchStatus === "notfound" && (
            <p className="mt-3 text-red-600 text-sm">Albarán no encontrado</p>
          )}
        </div>
      )}

      {step === 2 && originalNote && (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">Albarán Original Encontrado</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
              <p><strong>N°:</strong> {originalNote.number}</p>
              <p><strong>Fecha:</strong> {new Date(originalNote.date).toLocaleDateString("es-ES")}</p>
              <p><strong>Proveedor:</strong> {originalNote.supplier}</p>
              <p><strong>Peso:</strong> {originalNote.weight || "-"} kg</p>
              <p><strong>Volumen:</strong> {originalNote.volume || "-"} m³</p>
              <p><strong>RFID:</strong> {originalNote.rfidTag || "-"}</p>
            </div>
            <button
              onClick={() => { setStep(1); setOriginalNote(null); setSearchStatus("idle"); }}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Buscar otro
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Peso (kg)</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Actual: ${originalNote.weight || "-"}`}
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Volumen (m³)</label>
              <input
                type="number"
                value={formData.volume}
                onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Actual: ${originalNote.volume || "-"}`}
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Tipología Producto</label>
              <input
                type="text"
                value={formData.productType}
                onChange={(e) => setFormData(prev => ({ ...prev, productType: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Actual: ${originalNote.productType || "No definido"}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Tipología Establecimiento</label>
              <input
                type="text"
                value={formData.establishmentType}
                onChange={(e) => setFormData(prev => ({ ...prev, establishmentType: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Actual: ${originalNote.establishmentType || "No definido"}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload-rectify"
                accept=".pdf,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="file-upload-rectify" className="cursor-pointer">
                <div className="text-3xl mb-2">📎</div>
                <p className="text-sm text-slate-600">
                  {formData.fileName || "Subir archivo corregido"}
                </p>
              </label>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <button onClick={handleReadRFID} className="w-full">
                <div className="text-3xl mb-2">📡</div>
                <p className="text-sm text-slate-600">
                  {formData.rfidTag || "Nuevo RFID (opcional)"}
                </p>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          {status === "success" && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Rectificación guardada exitosamente
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={status === "loading"}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {status === "loading" ? "Guardando..." : "Guardar Rectificación"}
            </button>
            <button
              onClick={onBack}
              className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-300 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
