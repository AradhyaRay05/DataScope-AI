import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const userId = session.userId;

    const [
      totalDatasets,
      datasets,
      qualityScores,
      recentActivities,
      allDatasets,
    ] = await Promise.all([
      prisma.dataset.count({ where: { userId } }),
      prisma.dataset.findMany({
        where: { userId },
        select: {
          id: true,
          fileSize: true,
          rowCount: true,
          columnCount: true,
          qualityScore: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.dataset.findMany({
        where: { userId, qualityScore: { not: null } },
        select: { qualityScore: true },
      }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.dataset.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          fileName: true,
          fileSize: true,
          qualityScore: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const totalSize = datasets.reduce((sum, d) => sum + d.fileSize, 0);
    const totalRows = datasets.reduce((sum, d) => sum + d.rowCount, 0);
    const totalColumns = datasets.reduce((sum, d) => sum + d.columnCount, 0);

    const scores = qualityScores
      .map((d) => d.qualityScore)
      .filter((s): s is number => s !== null);
    const avgQuality =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

    const qualityDistribution = {
      excellent: scores.filter((s) => s >= 80).length,
      good: scores.filter((s) => s >= 60 && s < 80).length,
      fair: scores.filter((s) => s >= 40 && s < 60).length,
      poor: scores.filter((s) => s < 40).length,
    };

    const recentUploads = datasets.filter(
      (d) =>
        new Date(d.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    const monthMap = new Map<string, number>();
    for (const d of datasets) {
      const key = new Date(d.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }
    const datasetsByMonth = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .slice(-6);

    return NextResponse.json({
      stats: {
        totalDatasets,
        totalSize,
        avgQuality: Math.round(avgQuality * 10) / 10,
        totalRows,
        totalColumns,
        qualityDistribution,
        recentUploads,
        datasetsByMonth,
      },
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        details: a.details,
        createdAt: a.createdAt.toISOString(),
      })),
      recentDatasets: allDatasets.map((d) => ({
        id: d.id,
        name: d.name,
        fileName: d.fileName,
        fileSize: d.fileSize,
        qualityScore: d.qualityScore,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
