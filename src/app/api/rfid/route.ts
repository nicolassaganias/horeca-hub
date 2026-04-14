import { NextRequest, NextResponse } from "next/server";

const RFID_PREFIX = "RFID";

function generateRandomRFID(): string {
  const chars = "ABCDEF0123456789";
  let result = RFID_PREFIX;
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  try {
    const rfidTag = generateRandomRFID();

    return NextResponse.json({
      rfidTag,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("RFID Error:", error);
    return NextResponse.json({ error: "Error reading RFID" }, { status: 500 });
  }
}
