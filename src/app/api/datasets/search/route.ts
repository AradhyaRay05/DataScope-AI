import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters." },
        { status: 400 }
      );
    }

    const datasets = await prisma.dataset.findMany({
      where: {
        userId: session.userId,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { fileName: { contains: query } },
          { tags: { contains: query } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        description: true,
        tags: true,
        fileName: true,
        fileSize: true,
        rowCount: true,
        columnCount: true,
        status: true,
        qualityScore: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      results: datasets.map((d) => ({
        ...d,
        tags: JSON.parse(d.tags),
        createdAt: d.createdAt.toISOString(),
      })),
      count: datasets.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
