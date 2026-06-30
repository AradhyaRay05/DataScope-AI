import { prisma } from "@/lib/db";
import { cache, CACHE_TTL, cacheKey, cached, invalidateDatasetCaches } from "@/lib/cache";
import { logger } from "@/lib/logger";

export async function getDatasetList(
  userId: string,
  options: {
    sort?: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    favorites?: boolean;
  }
) {
  const { sort = "newest", page = 1, limit = 12 } = options;
  const key = cacheKey("datasets", userId, sort, page, limit, options.search, options.status, options.category, options.favorites ? "fav" : undefined);

  return cached(key, CACHE_TTL.DATASET_LIST, async () => {
    const start = performance.now();

    const where: Record<string, unknown> = {
      userId,
      isArchived: false,
    };

    if (options.status) where.status = options.status;
    if (options.category) where.category = options.category;
    if (options.favorites) where.isFavorite = true;

    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { description: { contains: options.search } },
        { fileName: { contains: options.search } },
        { tags: { contains: options.search } },
      ];
    }

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case "oldest": orderBy.createdAt = "asc"; break;
      case "name_asc": orderBy.name = "asc"; break;
      case "name_desc": orderBy.name = "desc"; break;
      case "quality_high": orderBy.qualityScore = "desc"; break;
      case "quality_low": orderBy.qualityScore = "asc"; break;
      case "size_high": orderBy.fileSize = "desc"; break;
      case "size_low": orderBy.fileSize = "asc"; break;
      default: orderBy.createdAt = "desc";
    }

    const skip = (page - 1) * limit;

    const [datasets, totalCount] = await Promise.all([
      prisma.dataset.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true, name: true, description: true, tags: true,
          category: true, fileName: true, fileSize: true,
          rowCount: true, columnCount: true, status: true,
          qualityScore: true, isFavorite: true, createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.dataset.count({ where }),
    ]);

    const duration = Math.round(performance.now() - start);
    logger.performance("getDatasetList", duration, {
      context: "QUERY",
      data: { userId, count: datasets.length, total: totalCount },
    });

    return {
      datasets: datasets.map((d) => ({
        ...d,
        tags: JSON.parse(d.tags),
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  });
}

export async function getDatasetDetail(userId: string, datasetId: string) {
  const key = cacheKey("dataset", datasetId);

  return cached(key, CACHE_TTL.DATASET_DETAIL, async () => {
    const start = performance.now();

    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId, userId },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          include: {
            profile: true,
            columnProfiles: { orderBy: { columnIndex: "asc" } },
          },
        },
        metadata: true,
      },
    });

    const duration = Math.round(performance.now() - start);
    logger.performance("getDatasetDetail", duration, { context: "QUERY" });

    return dataset;
  });
}

export async function getDashboardStats(userId: string) {
  const key = cacheKey("dashboard", userId);

  return cached(key, CACHE_TTL.DASHBOARD_STATS, async () => {
    const start = performance.now();

    const [
      totalDatasets,
      datasets,
      qualityScores,
      recentActivities,
      recentDatasets,
    ] = await Promise.all([
      prisma.dataset.count({ where: { userId, isArchived: false } }),
      prisma.dataset.findMany({
        where: { userId, isArchived: false },
        select: {
          fileSize: true, rowCount: true, columnCount: true,
          qualityScore: true, createdAt: true,
        },
      }),
      prisma.dataset.findMany({
        where: { userId, qualityScore: { not: null }, isArchived: false },
        select: { qualityScore: true },
      }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.dataset.findMany({
        where: { userId, isArchived: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, name: true, fileName: true, fileSize: true,
          qualityScore: true, status: true, createdAt: true,
        },
      }),
    ]);

    const totalSize = datasets.reduce((sum, d) => sum + d.fileSize, 0);
    const totalRows = datasets.reduce((sum, d) => sum + d.rowCount, 0);
    const totalColumns = datasets.reduce((sum, d) => sum + d.columnCount, 0);

    const scores = qualityScores
      .map((d) => d.qualityScore)
      .filter((s): s is number => s !== null);
    const avgQuality = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const qualityDistribution = {
      excellent: scores.filter((s) => s >= 80).length,
      good: scores.filter((s) => s >= 60 && s < 80).length,
      fair: scores.filter((s) => s >= 40 && s < 60).length,
      poor: scores.filter((s) => s < 40).length,
    };

    const recentUploads = datasets.filter(
      (d) => new Date(d.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    const duration = Math.round(performance.now() - start);
    logger.performance("getDashboardStats", duration, { context: "QUERY" });

    return {
      totalDatasets, totalSize,
      avgQuality: Math.round(avgQuality * 10) / 10,
      totalRows, totalColumns, qualityDistribution, recentUploads,
      recentActivities: recentActivities.map((a) => ({
        id: a.id, action: a.action, entity: a.entity,
        entityId: a.entityId, details: a.details,
        createdAt: a.createdAt.toISOString(),
      })),
      recentDatasets: recentDatasets.map((d) => ({
        id: d.id, name: d.name, fileName: d.fileName,
        fileSize: d.fileSize, qualityScore: d.qualityScore,
        status: d.status, createdAt: d.createdAt.toISOString(),
      })),
    };
  });
}

export { invalidateDatasetCaches };
