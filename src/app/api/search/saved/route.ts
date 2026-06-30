import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const searches = await prisma.savedSearch.findMany({
      where: { userId: session.userId },
      orderBy: { useCount: "desc" },
      take: 20,
    });

    return NextResponse.json({
      searches: searches.map((s) => ({
        id: s.id,
        name: s.name,
        query: s.query,
        filters: JSON.parse(s.filters),
        sort: s.sort,
        useCount: s.useCount,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Saved searches error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, query, filters, sort } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Search name is required." },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Search name must be 100 characters or fewer." },
        { status: 400 }
      );
    }

    const existing = await prisma.savedSearch.findFirst({
      where: { userId: session.userId, name: name.trim() },
    });

    if (existing) {
      const updated = await prisma.savedSearch.update({
        where: { id: existing.id },
        data: {
          query: query || "",
          filters: JSON.stringify(filters || {}),
          sort: sort || "newest",
        },
      });
      return NextResponse.json({
        search: {
          id: updated.id,
          name: updated.name,
          query: updated.query,
          filters: JSON.parse(updated.filters),
          sort: updated.sort,
        },
        message: "Saved search updated.",
      });
    }

    const search = await prisma.savedSearch.create({
      data: {
        userId: session.userId,
        name: name.trim(),
        query: query || "",
        filters: JSON.stringify(filters || {}),
        sort: sort || "newest",
      },
    });

    return NextResponse.json(
      {
        search: {
          id: search.id,
          name: search.name,
          query: search.query,
          filters: JSON.parse(search.filters),
          sort: search.sort,
        },
        message: "Search saved successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Save search error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Search ID is required." },
        { status: 400 }
      );
    }

    const search = await prisma.savedSearch.findFirst({
      where: { id, userId: session.userId },
    });

    if (!search) {
      return NextResponse.json(
        { error: "Saved search not found." },
        { status: 404 }
      );
    }

    await prisma.savedSearch.delete({ where: { id } });

    return NextResponse.json({ message: "Saved search deleted." });
  } catch (error) {
    console.error("Delete saved search error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
