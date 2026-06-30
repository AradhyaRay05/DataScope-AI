import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.userId },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: session.userId },
      });
    }

    return NextResponse.json({
      settings: {
        defaultView: settings.defaultView,
        datasetsPerPage: settings.datasetsPerPage,
        defaultSort: settings.defaultSort,
        emailNotifications: settings.emailNotifications,
        theme: settings.theme,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "defaultView",
      "datasetsPerPage",
      "defaultSort",
      "emailNotifications",
      "theme",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    if (
      updateData.datasetsPerPage !== undefined &&
      (Number(updateData.datasetsPerPage) < 1 ||
        Number(updateData.datasetsPerPage) > 50)
    ) {
      return NextResponse.json(
        { error: "datasetsPerPage must be between 1 and 50." },
        { status: 400 }
      );
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, ...updateData },
      update: updateData,
    });

    return NextResponse.json({
      settings: {
        defaultView: settings.defaultView,
        datasetsPerPage: settings.datasetsPerPage,
        defaultSort: settings.defaultSort,
        emailNotifications: settings.emailNotifications,
        theme: settings.theme,
      },
      message: "Settings updated.",
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
