import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LocationPayload } from "@/types";
import { TruckLog } from "@prisma/client";

export async function GET() {
  try {
    const logs = await prisma.truckLog.findMany({
      take: 20,
      orderBy: { timestamp: "desc" },
    });

    const lastPositions = await prisma.$queryRaw<
      { truck_id: string; latitude: number; longitude: number; timestamp: Date }[]
    >`
      SELECT DISTINCT ON (truck_id) 
        truck_id, 
        latitude, 
        longitude, 
        timestamp 
      FROM truck_logs 
      ORDER BY truck_id, timestamp DESC
    `;

    const dumhs = await prisma.dUMH.findMany({
      include: {
        reservations: { where: { status: "active" } },
        alerts: { where: { resolved: false }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const alerts = await prisma.alert.findMany({
      where: { resolved: false },
      include: { dumh: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      logs: logs.map((log: TruckLog) => ({
        id: log.id,
        truckId: log.truckId,
        latitude: log.latitude,
        longitude: log.longitude,
        timestamp: log.timestamp.toISOString(),
        rfidTags: log.rfidTags,
      })),
      lastPositions: lastPositions.map((pos) => ({
        truckId: pos.truck_id,
        latitude: pos.latitude,
        longitude: pos.longitude,
        timestamp: pos.timestamp.toISOString(),
      })),
      dumhs,
      alerts,
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Error fetching data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LocationPayload = await request.json();

    if (!body.truckId || body.latitude === undefined || body.longitude === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: truckId, latitude, longitude" },
        { status: 400 }
      );
    }

    const truckLog = await prisma.truckLog.create({
      data: {
        truckId: body.truckId,
        latitude: body.latitude,
        longitude: body.longitude,
        rfidTags: body.rfidTags || "[]",
      },
    });

    return NextResponse.json({
      success: true,
      id: truckLog.id,
      timestamp: truckLog.timestamp.toISOString(),
    });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { error: "Error saving location" },
      { status: 500 }
    );
  }
}
