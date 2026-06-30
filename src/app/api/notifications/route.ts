import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = Math.min(50, Number(searchParams.get("limit") || "20"));

    const where: Record<string, unknown> = { userId: session.userId };
    if (unreadOnly) where.read = false;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: session.userId, read: false },
      }),
    ]);

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        entityId: n.entityId,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications error:", error);
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
    const { id, markAll } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: session.userId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ message: "All notifications marked as read." });
    }

    if (id) {
      const notification = await prisma.notification.findFirst({
        where: { id, userId: session.userId },
      });
      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found." },
          { status: 404 }
        );
      }
      await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
      return NextResponse.json({ message: "Notification marked as read." });
    }

    return NextResponse.json(
      { error: "Provide 'id' or 'markAll: true'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
