import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { hub: true },
      orderBy: { startTime: "desc" },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    console.error("GET reservations error:", error);
    return NextResponse.json({ error: "Error fetching reservations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hubId, truckId, startTime, endTime } = body;

    const existing = await prisma.reservation.findFirst({
      where: {
        hubId,
        status: "active",
        OR: [
          { startTime: { lte: new Date(endTime) }, endTime: { gte: new Date(startTime) } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Hub already reserved for this time" }, { status: 409 });
    }

    const reservation = await prisma.reservation.create({
      data: {
        hubId,
        truckId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
      include: { hub: true },
    });

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("POST reservation error:", error);
    return NextResponse.json({ error: "Error creating reservation" }, { status: 500 });
  }
}
