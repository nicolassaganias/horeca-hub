import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    await prisma.truckLog.deleteMany({
      where: { truckId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { error: "Error deleting truck" },
      { status: 500 }
    );
  }
}
