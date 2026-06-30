import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export type NotificationType =
  | "dataset.profiled"
  | "dataset.failed"
  | "report.ready"
  | "report.failed"
  | "system.info"
  | "system.warning";

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string;
}

const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  "dataset.profiled": "Dataset Analysis Complete",
  "dataset.failed": "Dataset Analysis Failed",
  "report.ready": "Report Ready",
  "report.failed": "Report Generation Failed",
  "system.info": "Information",
  "system.warning": "Warning",
};

export async function createNotification(
  options: CreateNotificationOptions
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: options.userId,
        type: options.type,
        title: options.title || NOTIFICATION_TITLES[options.type],
        message: options.message,
        entityId: options.entityId ?? null,
      },
    });
  } catch (error) {
    logger.error("Failed to create notification", {
      context: "NOTIFICATIONS",
      error: error instanceof Error ? error : new Error(String(error)),
      data: { userId: options.userId, type: options.type },
    });
  }
}

export async function notifyDatasetProfiled(
  userId: string,
  datasetId: string,
  datasetName: string,
  qualityScore: number
): Promise<void> {
  await createNotification({
    userId,
    type: "dataset.profiled",
    title: "Dataset Analysis Complete",
    message: `"${datasetName}" has been analyzed. Quality score: ${Math.round(qualityScore)}/100.`,
    entityId: datasetId,
  });
}

export async function notifyDatasetFailed(
  userId: string,
  datasetId: string,
  datasetName: string,
  errorMessage: string
): Promise<void> {
  await createNotification({
    userId,
    type: "dataset.failed",
    title: "Dataset Analysis Failed",
    message: `Analysis of "${datasetName}" failed: ${errorMessage}`,
    entityId: datasetId,
  });
}

export async function notifyReportReady(
  userId: string,
  reportId: string,
  datasetName: string,
  format: string
): Promise<void> {
  await createNotification({
    userId,
    type: "report.ready",
    title: "Report Ready",
    message: `Your ${format.toUpperCase()} report for "${datasetName}" is ready to download.`,
    entityId: reportId,
  });
}
