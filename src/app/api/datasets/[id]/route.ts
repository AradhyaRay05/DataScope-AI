import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { id } = await params;

    const dataset = await prisma.dataset.findFirst({
      where: { id, userId: session.userId },
      include: {
        versions: {
          orderBy: { version: "desc" },
          include: {
            profile: true,
            columnProfiles: {
              orderBy: { columnIndex: "asc" },
            },
          },
        },
        metadata: true,
      },
    });

    if (!dataset) {
      return NextResponse.json(
        { error: "Dataset not found." },
        { status: 404 }
      );
    }

    const currentVersion = dataset.versions[0];
    const currentProfile = currentVersion?.profile ?? null;
    const currentColumns = currentVersion?.columnProfiles ?? [];
    const responseData = {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description,
      tags: JSON.parse(dataset.tags),
      fileName: dataset.fileName,
      fileSize: dataset.fileSize,
      rowCount: dataset.rowCount,
      columnCount: dataset.columnCount,
      status: dataset.status,
      qualityScore: dataset.qualityScore,
      currentVersion: dataset.currentVersion,
      encoding: dataset.encoding,
      delimiter: dataset.delimiter,
      category: dataset.category,
      isFavorite: dataset.isFavorite,
      isArchived: dataset.isArchived,
      targetColumn: dataset.targetColumn,
      source: dataset.source,
      notes: dataset.notes,
      project: dataset.project,
      createdAt: dataset.createdAt.toISOString(),
      updatedAt: dataset.updatedAt.toISOString(),
      metadata: dataset.metadata.map((m) => ({
        id: m.id,
        key: m.key,
        value: m.value,
      })),
      versions: dataset.versions.map((v) => ({
        id: v.id,
        version: v.version,
        fileName: v.fileName,
        fileSize: v.fileSize,
        rowCount: v.rowCount,
        columnCount: v.columnCount,
        createdAt: v.createdAt.toISOString(),
        qualityScore: v.profile?.qualityScore ?? null,
      })),
      profile: currentProfile
        ? {
            totalRows: currentProfile.totalRows,
            totalColumns: currentProfile.totalColumns,
            totalMissingCells: currentProfile.totalMissingCells,
            missingPercentage: currentProfile.missingPercentage,
            duplicateRows: currentProfile.duplicateRows,
            duplicatePercentage: currentProfile.duplicatePercentage,
            memoryUsageBytes: currentProfile.memoryUsageBytes,
            typeBreakdown: JSON.parse(currentProfile.typeBreakdown),
            qualityScore: currentProfile.qualityScore,
            qualityBreakdown: JSON.parse(
              currentProfile.qualityBreakdown
            ),
            correlationMatrix: currentProfile.correlationMatrix
              ? JSON.parse(currentProfile.correlationMatrix)
              : null,
            columns: currentColumns.map((col) => ({
              columnName: col.columnName,
              columnIndex: col.columnIndex,
              detectedType: col.detectedType,
              nonNullCount: col.nonNullCount,
              nullCount: col.nullCount,
              nullPercentage: col.nullPercentage,
              uniqueCount: col.uniqueCount,
              isConstant: col.isConstant,
              isHighCardinality: col.isHighCardinality,
              isIdentifier: col.isIdentifier,
              mean: col.mean,
              median: col.median,
              mode: col.mode,
              std: col.std,
              variance: col.std !== null ? Math.round(col.std * col.std * 1000) / 1000 : null,
              min: col.min,
              max: col.max,
              range: col.min && col.max ? Math.round((Number(col.max) - Number(col.min)) * 1000) / 1000 : null,
              q25: col.q25,
              q50: col.q50,
              q75: col.q75,
              iqr: col.q25 && col.q75 ? Math.round((col.q75 - col.q25) * 1000) / 1000 : null,
              skewness: col.skewness,
              kurtosis: col.kurtosis,
              sum: col.sum,
              zeroCount: col.zeroCount,
              negativeCount: col.negativeCount,
              positiveCount: col.positiveCount,
              coefficientOfVariation: col.mean !== null && col.std !== null && col.mean !== 0
                ? Math.round((col.std / Math.abs(col.mean)) * 100 * 100) / 100
                : null,
              cardinalityRatio: currentProfile.totalRows > 0
                ? Math.round((col.uniqueCount / currentProfile.totalRows) * 1000) / 1000
                : 0,
              minLength: col.minLength,
              maxLength: col.maxLength,
              avgLength: col.avgLength,
              emptyCount: col.emptyCount,
              whitespaceCount: col.whitespaceCount,
              patternSummary: col.patternSummary,
              dateMin: col.dateMin,
              dateMax: col.dateMax,
              dateRangeDays: col.dateRangeDays,
              topValues: col.topValues
                ? JSON.parse(col.topValues)
                : null,
              histogram: col.histogram
                ? JSON.parse(col.histogram)
                : null,
              outliers: col.outliers ? JSON.parse(col.outliers) : null,
              valueDistribution: col.valueDistribution
                ? JSON.parse(col.valueDistribution)
                : null,
              analysisData: col.analysisData
                ? JSON.parse(col.analysisData)
                : null,
            })),
          }
        : null,
    };

    return NextResponse.json({ dataset: responseData });
  } catch (error) {
    console.error("Dataset detail error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const dataset = await prisma.dataset.findFirst({
      where: { id, userId: session.userId },
    });

    if (!dataset) {
      return NextResponse.json(
        { error: "Dataset not found." },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.tags !== undefined)
      updateData.tags = JSON.stringify(
        Array.isArray(body.tags) ? body.tags : body.tags.split(",").map((t: string) => t.trim())
      );
    if (body.category !== undefined) updateData.category = body.category;
    if (body.targetColumn !== undefined) updateData.targetColumn = body.targetColumn;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.project !== undefined) updateData.project = body.project;
    if (body.isFavorite !== undefined) updateData.isFavorite = body.isFavorite;
    if (body.isArchived !== undefined) updateData.isArchived = body.isArchived;

    const updated = await prisma.dataset.update({
      where: { id },
      data: updateData,
    });

    await logActivity(
      session.userId,
      "dataset.update",
      "dataset",
      id,
      `Updated: ${Object.keys(updateData).join(", ")}`
    );

    return NextResponse.json({
      dataset: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        tags: JSON.parse(updated.tags),
        category: updated.category,
        targetColumn: updated.targetColumn,
        source: updated.source,
        notes: updated.notes,
        project: updated.project,
        isFavorite: updated.isFavorite,
        isArchived: updated.isArchived,
      },
      message: "Dataset updated successfully.",
    });
  } catch (error) {
    console.error("Dataset update error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { id } = await params;

    const dataset = await prisma.dataset.findFirst({
      where: { id, userId: session.userId },
    });

    if (!dataset) {
      return NextResponse.json(
        { error: "Dataset not found." },
        { status: 404 }
      );
    }

    await prisma.dataset.delete({ where: { id } });

    await logActivity(
      session.userId,
      "dataset.delete",
      "dataset",
      id,
      dataset.name
    );

    return NextResponse.json({ message: "Dataset deleted successfully." });
  } catch (error) {
    console.error("Dataset delete error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
