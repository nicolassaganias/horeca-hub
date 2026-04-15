import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.truckLog.findMany({
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Error fetching logs" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const truckId = searchParams.get("truckId");

    if (!truckId) {
      return NextResponse.json(
        { error: "truckId is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Logs preserved for historical records" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { error: "Error terminating truck" },
      { status: 500 }
    );
  }
}
