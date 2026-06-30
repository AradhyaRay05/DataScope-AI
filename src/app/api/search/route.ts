import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface SearchFilters {
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
  tags?: string;
  category?: string;
  status?: string;
  project?: string;
  source?: string;
  fileType?: string;
  minQuality?: number;
  maxQuality?: number;
  minRows?: number;
  maxRows?: number;
  minColumns?: number;
  maxColumns?: number;
  minSize?: number;
  maxSize?: number;
  dateFrom?: string;
  dateTo?: string;
  favorites?: boolean;
  archived?: boolean;
  columns?: string;
}

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

    const filters: SearchFilters = {
      q: searchParams.get("q") || undefined,
      sort: searchParams.get("sort") || "newest",
      page: Number(searchParams.get("page") || "1"),
      limit: Number(searchParams.get("limit") || "12"),
      tags: searchParams.get("tags") || undefined,
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      project: searchParams.get("project") || undefined,
      source: searchParams.get("source") || undefined,
      fileType: searchParams.get("fileType") || undefined,
      minQuality: searchParams.get("minQuality")
        ? Number(searchParams.get("minQuality"))
        : undefined,
      maxQuality: searchParams.get("maxQuality")
        ? Number(searchParams.get("maxQuality"))
        : undefined,
      minRows: searchParams.get("minRows")
        ? Number(searchParams.get("minRows"))
        : undefined,
      maxRows: searchParams.get("maxRows")
        ? Number(searchParams.get("maxRows"))
        : undefined,
      minColumns: searchParams.get("minColumns")
        ? Number(searchParams.get("minColumns"))
        : undefined,
      maxColumns: searchParams.get("maxColumns")
        ? Number(searchParams.get("maxColumns"))
        : undefined,
      minSize: searchParams.get("minSize")
        ? Number(searchParams.get("minSize"))
        : undefined,
      maxSize: searchParams.get("maxSize")
        ? Number(searchParams.get("maxSize"))
        : undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      favorites: searchParams.get("favorites") === "true",
      archived: searchParams.get("archived") === "true",
      columns: searchParams.get("columns") || undefined,
    };

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters.limit ?? 12));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      userId: session.userId,
      isArchived: filters.archived ?? false,
    };

    if (filters.favorites) where.isFavorite = true;
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.project) where.project = { contains: filters.project };
    if (filters.source) where.source = { contains: filters.source };

    if (filters.fileType) {
      const mimeMap: Record<string, string[]> = {
        csv: ["text/csv"],
        xlsx: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        xls: ["application/vnd.ms-excel"],
      };
      const mimes = mimeMap[filters.fileType.toLowerCase()];
      if (mimes) where.mimeType = { in: mimes };
    }

    if (filters.q) {
      const q = filters.q;

      const matchingColumnVersions = await prisma.columnProfile.findMany({
        where: { columnName: { contains: q } },
        select: { versionId: true },
        distinct: ["versionId"],
        take: 100,
      });

      const matchingVersionIds = matchingColumnVersions.map(
        (v) => v.versionId
      );

      const orConditions: Record<string, unknown>[] = [
        { name: { contains: q } },
        { description: { contains: q } },
        { fileName: { contains: q } },
        { tags: { contains: q } },
        { source: { contains: q } },
        { project: { contains: q } },
        { notes: { contains: q } },
        { targetColumn: { contains: q } },
      ];

      if (matchingVersionIds.length > 0) {
        orConditions.push({
          versions: { some: { id: { in: matchingVersionIds } } },
        });
      }

      where.OR = orConditions;
    }

    if (filters.tags) {
      const tagList = filters.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagList.length > 0) {
        where.AND = tagList.map((tag) => ({
          tags: { contains: tag },
        }));
      }
    }

    const qualityFilter: Record<string, number> = {};
    if (filters.minQuality !== undefined) qualityFilter.gte = filters.minQuality;
    if (filters.maxQuality !== undefined) qualityFilter.lte = filters.maxQuality;
    if (Object.keys(qualityFilter).length > 0) where.qualityScore = qualityFilter;

    const rowFilter: Record<string, number> = {};
    if (filters.minRows !== undefined) rowFilter.gte = filters.minRows;
    if (filters.maxRows !== undefined) rowFilter.lte = filters.maxRows;
    if (Object.keys(rowFilter).length > 0) where.rowCount = rowFilter;

    const colFilter: Record<string, number> = {};
    if (filters.minColumns !== undefined) colFilter.gte = filters.minColumns;
    if (filters.maxColumns !== undefined) colFilter.lte = filters.maxColumns;
    if (Object.keys(colFilter).length > 0) where.columnCount = colFilter;

    const sizeFilter: Record<string, number> = {};
    if (filters.minSize !== undefined) sizeFilter.gte = filters.minSize;
    if (filters.maxSize !== undefined) sizeFilter.lte = filters.maxSize;
    if (Object.keys(sizeFilter).length > 0) where.fileSize = sizeFilter;

    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
      where.createdAt = dateFilter;
    }

    if (filters.columns) {
      const searchCols = filters.columns
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      if (searchCols.length > 0) {
        const colVersionIds = await prisma.columnProfile.findMany({
          where: {
            OR: searchCols.map((c) => ({ columnName: { contains: c } })),
          },
          select: { versionId: true },
          distinct: ["versionId"],
          take: 200,
        });
        if (colVersionIds.length > 0) {
          const existingOr = where.OR as Record<string, unknown>[] | undefined;
          const colCondition = {
            versions: {
              some: { id: { in: colVersionIds.map((v) => v.versionId) } },
            },
          };
          if (existingOr) {
            where.AND = [{ OR: existingOr }, colCondition];
            delete where.OR;
          } else {
            where.OR = [colCondition];
          }
        }
      }
    }

    const orderBy: Record<string, string> = {};
    switch (filters.sort) {
      case "oldest":
        orderBy.createdAt = "asc";
        break;
      case "name_asc":
        orderBy.name = "asc";
        break;
      case "name_desc":
        orderBy.name = "desc";
        break;
      case "quality_high":
        orderBy.qualityScore = "desc";
        break;
      case "quality_low":
        orderBy.qualityScore = "asc";
        break;
      case "size_high":
        orderBy.fileSize = "desc";
        break;
      case "size_low":
        orderBy.fileSize = "asc";
        break;
      case "rows_high":
        orderBy.rowCount = "desc";
        break;
      case "rows_low":
        orderBy.rowCount = "asc";
        break;
      case "columns_high":
        orderBy.columnCount = "desc";
        break;
      case "columns_low":
        orderBy.columnCount = "asc";
        break;
      default:
        orderBy.createdAt = "desc";
    }

    const [datasets, totalCount] = await Promise.all([
      prisma.dataset.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          tags: true,
          category: true,
          fileName: true,
          fileSize: true,
          rowCount: true,
          columnCount: true,
          mimeType: true,
          status: true,
          qualityScore: true,
          currentVersion: true,
          isFavorite: true,
          isArchived: true,
          targetColumn: true,
          source: true,
          project: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.dataset.count({ where }),
    ]);

    const allCategories = await prisma.dataset.findMany({
      where: {
        userId: session.userId,
        isArchived: false,
        category: { not: null },
      },
      select: { category: true },
      distinct: ["category"],
    });

    const allTags = await prisma.dataset.findMany({
      where: { userId: session.userId, isArchived: false },
      select: { tags: true },
    });

    const tagSet = new Set<string>();
    for (const d of allTags) {
      try {
        const parsed = JSON.parse(d.tags);
        if (Array.isArray(parsed))
          parsed.forEach((t: string) => tagSet.add(t));
      } catch {
        /* ignore malformed tags */
      }
    }

    const allProjects = await prisma.dataset.findMany({
      where: {
        userId: session.userId,
        isArchived: false,
        project: { not: null },
      },
      select: { project: true },
      distinct: ["project"],
    });

    const allSources = await prisma.dataset.findMany({
      where: {
        userId: session.userId,
        isArchived: false,
        source: { not: null },
      },
      select: { source: true },
      distinct: ["source"],
    });

    const suggestions = await generateSuggestions(session.userId, filters.q);

    return NextResponse.json({
      results: datasets.map((d) => ({
        ...d,
        tags: JSON.parse(d.tags),
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        fileType: d.fileName.split(".").pop()?.toLowerCase() || "unknown",
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1,
      },
      facets: {
        categories: allCategories
          .map((c) => c.category)
          .filter(Boolean) as string[],
        tags: [...tagSet].sort(),
        projects: allProjects
          .map((p) => p.project)
          .filter(Boolean) as string[],
        sources: allSources
          .map((s) => s.source)
          .filter(Boolean) as string[],
        statuses: ["uploaded", "profiling", "profiled", "failed"],
        fileTypes: ["csv", "xlsx", "xls"],
      },
      suggestions,
      appliedFilters: filters,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

async function generateSuggestions(
  userId: string,
  query?: string
): Promise<string[]> {
  if (!query || query.length < 1) return [];

  const q = query.toLowerCase();

  const datasets = await prisma.dataset.findMany({
    where: { userId, isArchived: false },
    select: { name: true, tags: true, project: true, source: true },
    take: 100,
  });

  const suggestions = new Set<string>();

  for (const d of datasets) {
    if (d.name.toLowerCase().includes(q)) suggestions.add(d.name);
    if (d.project?.toLowerCase().includes(q) && d.project)
      suggestions.add(d.project);
    if (d.source?.toLowerCase().includes(q) && d.source)
      suggestions.add(d.source);
    try {
      const tags = JSON.parse(d.tags);
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          if (tag.toLowerCase().includes(q)) suggestions.add(tag);
        }
      }
    } catch {
      /* ignore */
    }
  }

  return [...suggestions].slice(0, 8);
}
