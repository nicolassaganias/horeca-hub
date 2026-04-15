import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dumhs = await prisma.dUMH.findMany({
      include: {
        reservations: {
          where: { status: "active" },
        },
        alerts: {
          where: { resolved: false },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json(dumhs);
  } catch (error) {
    console.error("GET dumhs error:", error);
    return NextResponse.json({ error: "Error fetching dumhs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, latitude, longitude, spots = 1 } = body;

    const dumh = await prisma.dUMH.create({
      data: { name, address, latitude, longitude, spots },
    });

    return NextResponse.json(dumh);
  } catch (error) {
    console.error("POST hub error:", error);
    return NextResponse.json({ error: "Error creating hub" }, { status: 500 });
  }
}
