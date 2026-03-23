import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INITIAL_HUBS = [
  {
    name: "Hub Plaça Reial",
    address: "Plaça Reial, Barcelona",
    latitude: 41.3797,
    longitude: 2.1748,
    spots: 3,
  },
  {
    name: "Hub Plaça Catalunya",
    address: "Plaça de Catalunya, Barcelona",
    latitude: 41.387,
    longitude: 2.1701,
    spots: 4,
  },
];

export async function POST() {
  try {
    const existing = await prisma.hub.count();
    if (existing > 0) {
      return NextResponse.json({ message: "Hubs already exist", count: existing });
    }

    const hubs = await prisma.hub.createMany({
      data: INITIAL_HUBS,
    });

    return NextResponse.json({ message: "Hubs created", count: hubs.count });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Error seeding hubs" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const count = await prisma.hub.count();
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
