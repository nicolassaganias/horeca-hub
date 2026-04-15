import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      include: { dumh: true },
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
      include: { dumh: true },
    });

    try {
      await transporter.sendMail({
        from: '"HORECA HUB" <nicosaga@gmail.com>',
        to: "nicosaga@gmail.com",
        subject: `🚨 ALERTA: ${alert.dumh.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">🚨 ALERTA HORECA HUB</h1>
            </div>
            <div style="padding: 20px; background: #f9fafb;">
              <h2 style="color: #dc2626;">${alert.dumh.name}</h2>
              <p style="font-size: 18px; color: #374151;">${message}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">
                <strong>Hora:</strong> ${new Date().toLocaleString("es-ES")}
              </p>
              <a href="https://horeca-hub.vercel.app/admin" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                Ver en Dashboard
              </a>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
    }

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
