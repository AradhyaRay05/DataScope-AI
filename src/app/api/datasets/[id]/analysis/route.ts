import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { analyzeMissingValues } from "@/engine/missingAnalysis";
import { analyzeDuplicates } from "@/engine/duplicateDetection";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get("type") || "all";

    const dataset = await prisma.dataset.findFirst({
      where: { id, userId: session.userId },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          include: {
            profile: true,
            columnProfiles: {
              orderBy: { columnIndex: "asc" },
            },
          },
        },
      },
    });

    if (!dataset) {
      return NextResponse.json(
        { error: "Dataset not found." },
        { status: 404 }
      );
    }

    const version = dataset.versions[0];
    if (!version || !version.profile) {
      return NextResponse.json(
        { error: "Dataset has not been profiled yet." },
        { status: 400 }
      );
    }

    const columnProfiles = version.columnProfiles;
    const profile = version.profile;

    const result: Record<string, unknown> = {};

    if (analysisType === "missing" || analysisType === "all") {
      const missingResult = analyzeMissingValues(
        columnProfiles.map((c) => ({
          columnName: c.columnName,
          columnIndex: c.columnIndex,
          nullCount: c.nullCount,
          nullPercentage: c.nullPercentage,
          detectedType: c.detectedType,
          uniqueCount: c.uniqueCount,
        })),
        [],
        profile.totalRows,
        profile.totalColumns
      );
      result.missing = missingResult;
    }

    if (analysisType === "duplicates" || analysisType === "all") {
      const duplicateResult = analyzeDuplicates(
        [],
        columnProfiles.map((c) => c.columnName),
        profile.totalRows,
        profile.totalColumns
      );
      duplicateResult.summary.duplicateRows = profile.duplicateRows;
      duplicateResult.summary.duplicatePercentage = profile.duplicatePercentage;
      result.duplicates = duplicateResult;
    }

    if (analysisType === "statistics" || analysisType === "all") {
      const stats = columnProfiles.map((col) => ({
        columnName: col.columnName,
        detectedType: col.detectedType,
        uniqueCount: col.uniqueCount,
        cardinalityRatio:
          profile.totalRows > 0
            ? Math.round((col.uniqueCount / profile.totalRows) * 1000) / 1000
            : 0,
        nullPercentage: col.nullPercentage,
        isConstant: col.isConstant,
        isHighCardinality: col.isHighCardinality,
        isIdentifier: col.isIdentifier,
        numeric:
          col.detectedType === "numeric"
            ? {
                mean: col.mean,
                median: col.median,
                mode: col.mode,
                std: col.std,
                min: col.min,
                max: col.max,
                range:
                  col.min && col.max
                    ? Math.round(
                        (Number(col.max) - Number(col.min)) * 1000
                      ) / 1000
                    : null,
                q25: col.q25,
                q50: col.q50,
                q75: col.q75,
                iqr:
                  col.q25 && col.q75
                    ? Math.round((col.q75 - col.q25) * 1000) / 1000
                    : null,
                skewness: col.skewness,
                kurtosis: col.kurtosis,
                sum: col.sum,
                zeroCount: col.zeroCount,
                negativeCount: col.negativeCount,
                positiveCount: col.positiveCount,
                outlierCount: col.outliers
                  ? JSON.parse(col.outliers).length
                  : 0,
              }
            : null,
        text:
          col.detectedType === "text" || col.isIdentifier
            ? {
                minLength: col.minLength,
                maxLength: col.maxLength,
                avgLength: col.avgLength,
                emptyCount: col.emptyCount,
                whitespaceCount: col.whitespaceCount,
                patternSummary: col.patternSummary,
              }
            : null,
        categorical:
          col.detectedType === "categorical" || col.detectedType === "boolean"
            ? {
                topValues: col.topValues
                  ? JSON.parse(col.topValues)
                  : null,
                valueDistribution: col.valueDistribution
                  ? JSON.parse(col.valueDistribution)
                  : null,
              }
            : null,
        datetime:
          col.detectedType === "datetime"
            ? {
                dateMin: col.dateMin,
                dateMax: col.dateMax,
                dateRangeDays: col.dateRangeDays,
              }
            : null,
      }));

      result.statistics = {
        totalColumns: profile.totalColumns,
        totalRows: profile.totalRows,
        typeBreakdown: JSON.parse(profile.typeBreakdown),
        columns: stats,
        correlationMatrix: profile.correlationMatrix
          ? JSON.parse(profile.correlationMatrix)
          : null,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
