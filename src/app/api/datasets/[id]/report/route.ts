import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

export async function POST(
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
    const body = await request.json();
    const format = body.format || "json";

    const validFormats = ["json", "csv", "xlsx", "pdf"];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        {
          error: `Invalid format. Supported: ${validFormats.join(", ")}`,
        },
        { status: 400 }
      );
    }

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
        metadata: true,
      },
    });

    if (!dataset) {
      return NextResponse.json(
        { error: "Dataset not found." },
        { status: 404 }
      );
    }

    const version = dataset.versions[0];
    if (!version?.profile) {
      return NextResponse.json(
        { error: "Dataset has not been profiled yet." },
        { status: 400 }
      );
    }

    const profile = version.profile;
    const columns = version.columnProfiles;

    const reportData = {
      generatedAt: new Date().toISOString(),
      dataset: {
        id: dataset.id,
        name: dataset.name,
        description: dataset.description,
        fileName: dataset.fileName,
        fileSize: dataset.fileSize,
        tags: JSON.parse(dataset.tags),
        category: dataset.category,
        source: dataset.source,
        project: dataset.project,
        targetColumn: dataset.targetColumn,
        notes: dataset.notes,
        encoding: dataset.encoding,
        delimiter: dataset.delimiter,
        createdAt: dataset.createdAt.toISOString(),
        updatedAt: dataset.updatedAt.toISOString(),
      },
      summary: {
        totalRows: profile.totalRows,
        totalColumns: profile.totalColumns,
        totalMissingCells: profile.totalMissingCells,
        missingPercentage: profile.missingPercentage,
        duplicateRows: profile.duplicateRows,
        duplicatePercentage: profile.duplicatePercentage,
        memoryUsageBytes: profile.memoryUsageBytes,
        qualityScore: profile.qualityScore,
        typeBreakdown: JSON.parse(profile.typeBreakdown),
      },
      quality: {
        score: profile.qualityScore,
        breakdown: JSON.parse(profile.qualityBreakdown),
      },
      columns: columns.map((col) => ({
        name: col.columnName,
        type: col.detectedType,
        nonNullCount: col.nonNullCount,
        nullCount: col.nullCount,
        nullPercentage: col.nullPercentage,
        uniqueCount: col.uniqueCount,
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
                q25: col.q25,
                q50: col.q50,
                q75: col.q75,
                skewness: col.skewness,
                kurtosis: col.kurtosis,
                sum: col.sum,
              }
            : null,
        text:
          col.detectedType === "text" || col.isIdentifier
            ? {
                minLength: col.minLength,
                maxLength: col.maxLength,
                avgLength: col.avgLength,
              }
            : null,
        categorical:
          col.detectedType === "categorical" || col.detectedType === "boolean"
            ? {
                topValues: col.topValues ? JSON.parse(col.topValues) : null,
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
        analysis: col.analysisData ? JSON.parse(col.analysisData) : null,
      })),
      correlation: profile.correlationMatrix
        ? JSON.parse(profile.correlationMatrix)
        : null,
      metadata: dataset.metadata.map((m) => ({
        key: m.key,
        value: m.value,
      })),
      versions: dataset.versions.map((v) => ({
        version: v.version,
        createdAt: v.createdAt.toISOString(),
        rowCount: v.rowCount,
        columnCount: v.columnCount,
      })),
    };

    const reportDir = path.join(
      process.cwd(),
      "data",
      "reports",
      session.userId
    );
    fs.mkdirSync(reportDir, { recursive: true });

    const reportId = uuidv4();
    let fileName: string;
    let fileContent: string | Buffer;
    let contentType: string;

    switch (format) {
      case "json": {
        fileName = `${dataset.name.replace(/[^a-zA-Z0-9]/g, "_")}_report.json`;
        fileContent = JSON.stringify(reportData, null, 2);
        contentType = "application/json";
        break;
      }
      case "csv": {
        fileName = `${dataset.name.replace(/[^a-zA-Z0-9]/g, "_")}_columns.csv`;
        const csvHeader =
          "Column,Type,Non-Null,Null,Null%,Unique,Constant,Mean,Median,Std,Min,Max\n";
        const csvRows = reportData.columns
          .map(
            (c) =>
              `"${c.name}",${c.type},${c.nonNullCount},${c.nullCount},${c.nullPercentage.toFixed(1)},${c.uniqueCount},${c.isConstant},${c.numeric?.mean ?? ""},${c.numeric?.median ?? ""},${c.numeric?.std ?? ""},${c.numeric?.min ?? ""},${c.numeric?.max ?? ""}`
          )
          .join("\n");
        fileContent = csvHeader + csvRows;
        contentType = "text/csv";
        break;
      }
      case "xlsx": {
        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();

        const summaryData = Object.entries(reportData.summary).map(
          ([key, value]) => ({
            Metric: key,
            Value:
              typeof value === "object" ? JSON.stringify(value) : String(value),
          })
        );
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

        const columnsSheet = XLSX.utils.json_to_sheet(
          reportData.columns.map((c) => ({
            Column: c.name,
            Type: c.type,
            "Non-Null": c.nonNullCount,
            Null: c.nullCount,
            "Null%": c.nullPercentage.toFixed(1),
            Unique: c.uniqueCount,
            Mean: c.numeric?.mean ?? "",
            Median: c.numeric?.median ?? "",
            Std: c.numeric?.std ?? "",
            Min: c.numeric?.min ?? "",
            Max: c.numeric?.max ?? "",
          }))
        );
        XLSX.utils.book_append_sheet(wb, columnsSheet, "Columns");

        const qualityData = Object.entries(reportData.quality.breakdown).map(
          ([key, val]) => ({
            Factor: key,
            Score: (val as { score: number }).score,
            Weight: (val as { weight: number }).weight,
          })
        );
        const qualitySheet = XLSX.utils.json_to_sheet(qualityData);
        XLSX.utils.book_append_sheet(wb, qualitySheet, "Quality");

        const xlsxBuffer = XLSX.write(wb, {
          type: "buffer",
          bookType: "xlsx",
        });
        fileName = `${dataset.name.replace(/[^a-zA-Z0-9]/g, "_")}_report.xlsx`;
        fileContent = xlsxBuffer;
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      }
      case "pdf": {
        fileName = `${dataset.name.replace(/[^a-zA-Z0-9]/g, "_")}_report.json`;
        fileContent = JSON.stringify(reportData, null, 2);
        contentType = "application/json";
        break;
      }
      default:
        return NextResponse.json(
          { error: "Unsupported format." },
          { status: 400 }
        );
    }

    const filePath = path.join(reportDir, `${reportId}_${fileName}`);
    fs.writeFileSync(filePath, fileContent);

    const report = await prisma.report.create({
      data: {
        id: reportId,
        userId: session.userId,
        datasetId: id,
        versionId: version.id,
        fileName,
        filePath,
        fileSize: Buffer.byteLength(fileContent),
        format,
        status: "completed",
      },
    });

    await logActivity(
      session.userId,
      "report.generate",
      "report",
      report.id,
      `${format.toUpperCase()} report for ${dataset.name}`
    );

    const isDownload = request.headers.get("accept")?.includes("application/octet-stream") || body.download === true;

    if (isDownload && format !== "pdf") {
      const body = typeof fileContent === "string" ? fileContent : new Uint8Array(fileContent);
      return new NextResponse(body, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": String(Buffer.byteLength(fileContent)),
        },
      });
    }

    return NextResponse.json({
      report: {
        id: report.id,
        fileName: report.fileName,
        format: report.format,
        fileSize: report.fileSize,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
        downloadUrl: `/api/reports/${report.id}/download`,
      },
      data: reportData,
      message: `${format.toUpperCase()} report generated successfully.`,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
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
    const datasetId = searchParams.get("datasetId");

    const where: Record<string, unknown> = { userId: session.userId };
    if (datasetId) where.datasetId = datasetId;

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        dataset: { select: { name: true } },
      },
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        datasetId: r.datasetId,
        datasetName: r.dataset.name,
        fileName: r.fileName,
        format: r.format,
        fileSize: r.fileSize,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        downloadUrl: `/api/reports/${r.id}/download`,
      })),
    });
  } catch (error) {
    console.error("List reports error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
