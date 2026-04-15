import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INITIAL_DUMHS = [
  {
    name: "DUMH Rambla del Raval",
    address: "Rambla del Raval, Barcelona",
    latitude: 41.3828,
    longitude: 2.1688,
    spots: 3,
  },
  {
    name: "DUMH Carrer de Pau Claris",
    address: "Carrer de Pau Claris & Carrer de Casp, Barcelona",
    latitude: 41.3897,
    longitude: 2.1766,
    spots: 4,
  },
];

const INITIAL_DELIVERY_NOTES = [
  {
    number: "ALB-2024-001",
    date: new Date("2024-01-15"),
    supplier: "Fresh Foods S.L.",
    rfidTag: "RFID0001ABCD",
    type: "original",
    weight: 150.5,
    volume: 2.3,
    productType: "refrigerado",
    establishmentType: "restaurante",
    fileName: "albaran_001.pdf",
  },
  {
    number: "ALB-2024-002",
    date: new Date("2024-01-16"),
    supplier: "Bebidas del Sur",
    rfidTag: "RFID0002EFGH",
    type: "original",
    weight: 320.0,
    volume: 5.0,
    productType: "bebidas",
    establishmentType: "hotel",
    fileName: "albaran_002.xlsx",
  },
  {
    number: "ALB-2024-003",
    date: new Date("2024-01-17"),
    supplier: "Congelados del Norte",
    rfidTag: "RFID0003IJKL",
    type: "original",
    weight: 80.0,
    volume: 1.5,
    productType: "congelado",
    establishmentType: "catering",
    fileName: "albaran_003.pdf",
  },
  {
    number: "ALB-2024-004",
    date: new Date("2024-01-18"),
    supplier: "Productos Secos Barcelona",
    rfidTag: "RFID0004MNOP",
    type: "original",
    weight: 200.0,
    volume: 3.0,
    productType: "seco",
    establishmentType: "bar",
    fileName: "albaran_004.xlsx",
  },
];

export async function POST() {
  try {
    const existingDUMHs = await prisma.dUMH.count();
    let dumhsCount = 0;

    if (existingDUMHs === 0) {
      const dumhs = await prisma.dUMH.createMany({
        data: INITIAL_DUMHS,
      });
      dumhsCount = dumhs.count;
    }

    const existingNotes = await prisma.deliveryNote.count();
    let notesCount = 0;

    if (existingNotes === 0) {
      const notes = await prisma.deliveryNote.createMany({
        data: INITIAL_DELIVERY_NOTES,
      });
      notesCount = notes.count;
    }

    return NextResponse.json({
      message: "Seed completed",
      dumhs: dumhsCount,
      notes: notesCount,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Error seeding" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const dumhs = await prisma.dUMH.count();
    const notes = await prisma.deliveryNote.count();
    return NextResponse.json({ dumhs, notes });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
