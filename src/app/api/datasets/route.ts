import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { searchSchema } from "@/lib/validation";

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
    const parsed = searchSchema.safeParse({
      q: searchParams.get("q") || undefined,
      sort: searchParams.get("sort") || "newest",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "12",
      tags: searchParams.get("tags") || undefined,
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      minQuality: searchParams.get("minQuality") || undefined,
      maxQuality: searchParams.get("maxQuality") || undefined,
      favorites: searchParams.get("favorites") || undefined,
      archived: searchParams.get("archived") || undefined,
      view: searchParams.get("view") || "grid",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      q,
      sort,
      page,
      limit,
      tags,
      category,
      status,
      minQuality,
      maxQuality,
      favorites,
      archived,
    } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: session.userId };

    where.isArchived = archived === true;

    if (favorites === true) {
      where.isFavorite = true;
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { fileName: { contains: q } },
        { tags: { contains: q } },
        { source: { contains: q } },
        { project: { contains: q } },
        { notes: { contains: q } },
      ];
    }

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim());
      where.AND = tagList.map((tag) => ({
        tags: { contains: tag },
      }));
    }

    if (minQuality !== undefined) {
      where.qualityScore = {
        ...(where.qualityScore as object || {}),
        gte: minQuality,
      };
    }
    if (maxQuality !== undefined) {
      where.qualityScore = {
        ...(where.qualityScore as object || {}),
        lte: maxQuality,
      };
    }

    const orderBy: Record<string, string> = {};
    switch (sort) {
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
          status: true,
          qualityScore: true,
          currentVersion: true,
          isFavorite: true,
          isArchived: true,
          targetColumn: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.dataset.count({ where }),
    ]);

    const allCategories = await prisma.dataset.findMany({
      where: { userId: session.userId, isArchived: false, category: { not: null } },
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
        if (Array.isArray(parsed)) parsed.forEach((t: string) => tagSet.add(t));
      } catch {}
    }

    return NextResponse.json({
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
      facets: {
        categories: allCategories
          .map((c) => c.category)
          .filter(Boolean) as string[],
        tags: [...tagSet].sort(),
      },
    });
  } catch (error) {
    console.error("Dataset list error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
