import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { bulkActionSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

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
    const parsed = bulkActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, datasetIds, tag } = parsed.data;

    const ownedDatasets = await prisma.dataset.findMany({
      where: {
        id: { in: datasetIds },
        userId: session.userId,
      },
      select: { id: true, name: true },
    });

    const ownedIds = ownedDatasets.map((d) => d.id);

    if (ownedIds.length === 0) {
      return NextResponse.json(
        { error: "No matching datasets found." },
        { status: 404 }
      );
    }

    let affected = 0;

    switch (action) {
      case "delete": {
        const result = await prisma.dataset.deleteMany({
          where: { id: { in: ownedIds }, userId: session.userId },
        });
        affected = result.count;
        await logActivity(
          session.userId,
          "dataset.delete",
          "dataset",
          undefined,
          `Bulk deleted ${affected} datasets`
        );
        break;
      }

      case "archive": {
        const result = await prisma.dataset.updateMany({
          where: { id: { in: ownedIds }, userId: session.userId },
          data: { isArchived: true },
        });
        affected = result.count;
        break;
      }

      case "unarchive": {
        const result = await prisma.dataset.updateMany({
          where: { id: { in: ownedIds }, userId: session.userId },
          data: { isArchived: false },
        });
        affected = result.count;
        break;
      }

      case "favorite": {
        const result = await prisma.dataset.updateMany({
          where: { id: { in: ownedIds }, userId: session.userId },
          data: { isFavorite: true },
        });
        affected = result.count;
        break;
      }

      case "unfavorite": {
        const result = await prisma.dataset.updateMany({
          where: { id: { in: ownedIds }, userId: session.userId },
          data: { isFavorite: false },
        });
        affected = result.count;
        break;
      }

      case "tag": {
        if (!tag) {
          return NextResponse.json(
            { error: "Tag is required for tag action." },
            { status: 400 }
          );
        }
        for (const ds of ownedDatasets) {
          const dataset = await prisma.dataset.findUnique({
            where: { id: ds.id },
            select: { tags: true },
          });
          if (dataset) {
            const existingTags: string[] = JSON.parse(dataset.tags);
            if (!existingTags.includes(tag)) {
              existingTags.push(tag);
              await prisma.dataset.update({
                where: { id: ds.id },
                data: { tags: JSON.stringify(existingTags) },
              });
              affected++;
            }
          }
        }
        break;
      }
    }

    return NextResponse.json({
      message: `${action} completed. ${affected} dataset(s) affected.`,
      affected,
    });
  } catch (error) {
    console.error("Bulk action error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
