import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
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

    const colsASet = new Set(columnsA.map((c) => c.columnName));
    const colsBSet = new Set(columnsB.map((c) => c.columnName));
    const sharedCols = [...colsASet].filter((c) => colsBSet.has(c));

    const onlyInA = [...colsASet].filter((c) => !colsBSet.has(c));
    const onlyInB = [...colsBSet].filter((c) => !colsASet.has(c));

    const colAMap = new Map(columnsA.map((c) => [c.columnName, c]));
    const colBMap = new Map(columnsB.map((c) => [c.columnName, c]));

    const typeMismatches = sharedCols
      .filter((col) => colAMap.get(col)!.detectedType !== colBMap.get(col)!.detectedType)
      .map((col) => ({
        column: col,
        typeA: colAMap.get(col)!.detectedType,
        typeB: colBMap.get(col)!.detectedType,
      }));

    const statisticalDiff = sharedCols
      .filter((col) => colAMap.get(col)!.detectedType === "numeric")
      .map((col) => {
        const a = colAMap.get(col)!;
        const b = colBMap.get(col)!;
        const stats = ["mean", "median", "std"] as const;
        return stats
          .filter((s) => a[s] !== null && b[s] !== null)
          .map((s) => {
            const valA = a[s] as number;
            const valB = b[s] as number;
            const diff = valB - valA;
            const pctChange =
              valA !== 0 ? Math.abs(diff / valA) * 100 : valB !== 0 ? 100 : 0;
            return {
              column: col,
              stat: s,
              valueA: Math.round(valA * 1000) / 1000,
              valueB: Math.round(valB * 1000) / 1000,
              difference: Math.round(diff * 1000) / 1000,
              percentChange: Math.round(pctChange * 10) / 10,
            };
          });
      })
      .flat();

    return NextResponse.json({
      comparison: {
        datasetA: { id: dsA.id, name: dsA.name },
        datasetB: { id: dsB.id, name: dsB.name },
        schemaDiff: { onlyInA, onlyInB, typeMismatches },
        structuralDiff: {
          rowDiff: dsB.rowCount - dsA.rowCount,
          columnDiff: dsB.columnCount - dsA.columnCount,
          missingA: profileA?.missingPercentage ?? 0,
          missingB: profileB?.missingPercentage ?? 0,
        },
        statisticalDiff,
      },
    });
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
