import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { compareDatasets } from "@/engine/comparison";
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
    const { datasetA, datasetB } = body;

    if (!datasetA || !datasetB) {
      return NextResponse.json(
        { error: "Both datasetA and datasetB are required." },
        { status: 400 }
      );
    }

    if (datasetA === datasetB) {
      return NextResponse.json(
        { error: "Please select two different datasets." },
        { status: 400 }
      );
    }

    const [dsA, dsB] = await Promise.all([
      prisma.dataset.findFirst({
        where: { id: datasetA, userId: session.userId },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            include: {
              profile: true,
              columnProfiles: true,
            },
          },
        },
      }),
      prisma.dataset.findFirst({
        where: { id: datasetB, userId: session.userId },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            include: {
              profile: true,
              columnProfiles: true,
            },
          },
        },
      }),
    ]);

    if (!dsA || !dsB) {
      return NextResponse.json(
        { error: "One or both datasets not found." },
        { status: 404 }
      );
    }

    const profileA = dsA.versions[0]?.profile;
    const profileB = dsB.versions[0]?.profile;
    const columnsA = dsA.versions[0]?.columnProfiles ?? [];
    const columnsB = dsB.versions[0]?.columnProfiles ?? [];

    if (!profileA || !profileB) {
      return NextResponse.json(
        { error: "Both datasets must be fully profiled before comparison." },
        { status: 400 }
      );
    }

    const comparison = compareDatasets({
      datasetA: {
        id: dsA.id,
        name: dsA.name,
        rowCount: profileA.totalRows,
        columnCount: profileA.totalColumns,
        fileSize: dsA.fileSize,
        encoding: dsA.encoding,
        delimiter: dsA.delimiter,
        qualityScore: profileA.qualityScore,
        missingPercentage: profileA.missingPercentage,
        duplicatePercentage: profileA.duplicatePercentage,
        columns: columnsA.map((c) => ({
          columnName: c.columnName,
          detectedType: c.detectedType,
          nullPercentage: c.nullPercentage,
          mean: c.mean,
          median: c.median,
          std: c.std,
          uniqueCount: c.uniqueCount,
        })),
      },
      datasetB: {
        id: dsB.id,
        name: dsB.name,
        rowCount: profileB.totalRows,
        columnCount: profileB.totalColumns,
        fileSize: dsB.fileSize,
        encoding: dsB.encoding,
        delimiter: dsB.delimiter,
        qualityScore: profileB.qualityScore,
        missingPercentage: profileB.missingPercentage,
        duplicatePercentage: profileB.duplicatePercentage,
        columns: columnsB.map((c) => ({
          columnName: c.columnName,
          detectedType: c.detectedType,
          nullPercentage: c.nullPercentage,
          mean: c.mean,
          median: c.median,
          std: c.std,
          uniqueCount: c.uniqueCount,
        })),
      },
    });

    await logActivity(
      session.userId,
      "dataset.compare",
      "dataset",
      datasetA,
      `Compared ${dsA.name} with ${dsB.name}`
    );

    return NextResponse.json({ comparison });
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
