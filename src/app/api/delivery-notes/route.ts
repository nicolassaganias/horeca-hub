import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const number = searchParams.get("number");

    if (number) {
      const notes = await prisma.deliveryNote.findMany({
        where: { number },
        orderBy: { createdAt: "asc" },
        include: {
          correctedNote: {
            select: { number: true },
          },
        },
      });

      if (notes.length === 0) {
        return NextResponse.json({ error: "Delivery note not found" }, { status: 404 });
      }

      return NextResponse.json(notes);
    }

    const notes = await prisma.deliveryNote.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        correctedNote: {
          select: { number: true },
        },
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Error fetching notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      number,
      date,
      supplier,
      rfidTag,
      fileName,
      weight,
      volume,
      productType,
      establishmentType,
      correctedNoteId,
    } = body;

    if (!number || !supplier) {
      return NextResponse.json(
        { error: "number and supplier are required" },
        { status: 400 }
      );
    }

    const note = await prisma.deliveryNote.create({
      data: {
        number,
        date: date ? new Date(date) : new Date(),
        supplier,
        rfidTag: rfidTag || null,
        fileName: fileName || null,
        type: correctedNoteId ? "rectification" : "original",
        correctedNoteId: correctedNoteId || null,
        weight: weight ? parseFloat(weight) : null,
        volume: volume ? parseFloat(volume) : null,
        productType: productType || null,
        establishmentType: establishmentType || null,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Error creating note" }, { status: 500 });
  }
}
