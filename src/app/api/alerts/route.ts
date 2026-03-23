import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      include: { hub: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("GET alerts error:", error);
    return NextResponse.json({ error: "Error fetching alerts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hubId, type, message } = body;

    const alert = await prisma.alert.create({
      data: { hubId, type, message },
      include: { hub: true },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("POST alert error:", error);
    return NextResponse.json({ error: "Error creating alert" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, resolved } = body;

    const alert = await prisma.alert.update({
      where: { id },
      data: { resolved },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("PATCH alert error:", error);
    return NextResponse.json({ error: "Error updating alert" }, { status: 500 });
  }
}
