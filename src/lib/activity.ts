import { prisma } from "@/lib/db";

export type ActivityAction =
  | "auth.register"
  | "auth.login"
  | "auth.logout"
  | "auth.password_reset_request"
  | "auth.password_reset_complete"
  | "auth.email_verified"
  | "dataset.upload"
  | "dataset.delete"
  | "dataset.update"
  | "dataset.profile_complete"
  | "dataset.compare"
  | "report.generate"
  | "metadata.update";

export async function logActivity(
  userId: string,
  action: ActivityAction,
  entity: string,
  entityId?: string,
  details?: string
): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ?? null,
        details: details ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export function formatActivityAction(action: string): string {
  const map: Record<string, string> = {
    "auth.register": "Created account",
    "auth.login": "Logged in",
    "auth.logout": "Logged out",
    "auth.password_reset_request": "Requested password reset",
    "auth.password_reset_complete": "Reset password",
    "auth.email_verified": "Verified email",
    "dataset.upload": "Uploaded dataset",
    "dataset.delete": "Deleted dataset",
    "dataset.update": "Updated dataset",
    "dataset.profile_complete": "Profiling completed",
    "dataset.compare": "Compared datasets",
    "report.generate": "Generated report",
    "metadata.update": "Updated metadata",
  };
  return map[action] || action;
}
