import { NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await logActivity(session.userId, "auth.logout", "user", session.userId);
    }
    await clearSessionCookie();
    return NextResponse.json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error);
    await clearSessionCookie();
    return NextResponse.json({ message: "Logged out." });
  }
}
