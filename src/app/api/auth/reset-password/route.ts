import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { generateResetToken } from "@/lib/auth";
import {
  resetPasswordRequestSchema,
  resetPasswordSchema,
} from "@/lib/validation";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "request") {
      const parsed = resetPasswordRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email },
      });

      if (user) {
        const resetToken = generateResetToken();
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.user.update({
          where: { id: user.id },
          data: { resetToken, resetTokenExpiry },
        });

        await logActivity(
          user.id,
          "auth.password_reset_request",
          "user",
          user.id
        );
      }

      return NextResponse.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    if (action === "reset") {
      const parsed = resetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const user = await prisma.user.findFirst({
        where: {
          resetToken: parsed.data.token,
          resetTokenExpiry: { gt: new Date() },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Invalid or expired reset token." },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      await logActivity(
        user.id,
        "auth.password_reset_complete",
        "user",
        user.id
      );

      return NextResponse.json({
        message: "Password has been reset successfully.",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'request' or 'reset'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
