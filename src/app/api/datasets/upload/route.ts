import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { profileDataset } from "@/engine/profiler";
import { logActivity } from "@/lib/activity";
import { logger } from "@/lib/logger";
import { AppError, ErrorCode, createErrorResponse } from "@/lib/errors";
import { validateUploadFile, validateDatasetName, saveUploadedFile, handleProfilingError } from "@/lib/uploadHandler";
import { notifyDatasetProfiled, notifyDatasetFailed } from "@/lib/notifications";
import { handleDbError } from "@/lib/dbErrorHandler";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const session = await getSession();
    if (!session) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, undefined, { requestId });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";
    const tagsRaw = (formData.get("tags") as string) || "";
    const category = (formData.get("category") as string) || null;
    const targetColumn = (formData.get("targetColumn") as string) || null;
    const source = (formData.get("source") as string) || null;
    const notes = (formData.get("notes") as string) || null;
    const project = (formData.get("project") as string) || null;

    if (!file) {
      throw new AppError(ErrorCode.MISSING_FIELD, "No file provided.", { requestId });
    }

    validateUploadFile(file);
    const datasetName = validateDatasetName(name || file.name.replace(/\.[^/.]+$/, ""));

    const existingDataset = await prisma.dataset.findFirst({
      where: { userId: session.userId, name: datasetName, isArchived: false },
    });

    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20);
    const datasetId = uuidv4();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { filePath } = saveUploadedFile(buffer, file.name, session.userId, datasetId);

    const ext = path.extname(file.name).toLowerCase();
    const mimeType = file.type || (ext === ".csv" ? "text/csv" : ext === ".xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/vnd.ms-excel");
    const versionNumber = existingDataset ? existingDataset.currentVersion + 1 : 1;

    let dataset;
    try {
      dataset = await prisma.dataset.create({
        data: {
          id: datasetId, userId: session.userId, name: datasetName,
          description: description || null, tags: JSON.stringify(tags),
          category: category || null, fileName: file.name, filePath,
          fileSize: file.size, mimeType, status: "profiling",
          currentVersion: versionNumber, targetColumn: targetColumn || null,
          source: source || null, notes: notes || null, project: project || null,
        },
      });
    } catch (error) {
      handleDbError(error, "create dataset");
    }

    try {
      await prisma.datasetVersion.create({
        data: {
          datasetId: dataset.id, version: versionNumber,
          fileName: file.name, filePath, fileSize: file.size, encoding: "utf-8",
        },
      });
    } catch (error) {
      handleDbError(error, "create dataset version");
    }

    logger.upload("started", {
      userId: session.userId, datasetId: dataset.id,
      fileName: file.name, fileSize: file.size,
    });

    profileDatasetAsync(dataset.id, filePath, mimeType, versionNumber, session.userId, datasetName);

    await logActivity(session.userId, "dataset.upload", "dataset", dataset.id, `${datasetName} (${file.name})`);

    return NextResponse.json(
      {
        dataset: { id: dataset.id, name: dataset.name, status: "profiling", isDuplicate: !!existingDataset },
        message: existingDataset
          ? `Upload complete. New version (${versionNumber}) of "${datasetName}" is being profiled.`
          : "Upload complete. Profiling in progress...",
      },
      { status: 201, headers: { "X-Request-Id": requestId } }
    );
  } catch (error) {
    const { body, status } = createErrorResponse(error, requestId);
    return NextResponse.json(body, { status, headers: { "X-Request-Id": requestId } });
  }
}

async function profileDatasetAsync(
  datasetId: string,
  filePath: string,
  mimeType: string,
  versionNumber: number,
  userId: string,
  datasetName: string
) {
  const startTime = performance.now();
  try {
    const profile = await profileDataset(filePath, mimeType);
    const duration = Math.round(performance.now() - startTime);

    logger.profiling("completed", {
      datasetId, duration,
      rows: profile.totalRows, columns: profile.totalColumns,
    });

    const version = await prisma.datasetVersion.findFirst({
      where: { datasetId, version: versionNumber },
    });
    if (!version) return;

    await prisma.datasetProfile.create({
      data: {
        versionId: version.id,
        totalRows: profile.totalRows,
        totalColumns: profile.totalColumns,
        totalMissingCells: profile.totalMissingCells,
        missingPercentage: profile.missingPercentage,
        duplicateRows: profile.duplicateRows,
        duplicatePercentage: profile.duplicatePercentage,
        memoryUsageBytes: profile.memoryUsageBytes,
        typeBreakdown: JSON.stringify(profile.typeBreakdown),
        qualityScore: profile.qualityScore,
        qualityBreakdown: JSON.stringify(profile.qualityBreakdown),
        correlationMatrix: profile.correlationMatrix ? JSON.stringify(profile.correlationMatrix) : null,
        sheetNames: profile.sheetNames ? JSON.stringify(profile.sheetNames) : null,
      },
    });

    for (const col of profile.columns) {
      await prisma.columnProfile.create({
        data: {
          versionId: version.id,
          columnName: col.columnName,
          columnIndex: col.columnIndex,
          detectedType: col.detectedType,
          nonNullCount: col.nonNullCount,
          nullCount: col.nullCount,
          nullPercentage: col.nullPercentage,
          uniqueCount: col.uniqueCount,
          isConstant: col.isConstant,
          isHighCardinality: col.isHighCardinality,
          isIdentifier: col.isIdentifier ?? false,
          mean: col.mean ?? null,
          median: col.median ?? null,
          mode: col.mode ?? null,
          std: col.std ?? null,
          min: col.min ?? null,
          max: col.max ?? null,
          q25: col.q25 ?? null,
          q50: col.q50 ?? null,
          q75: col.q75 ?? null,
          skewness: col.skewness ?? null,
          kurtosis: col.kurtosis ?? null,
          sum: col.sum ?? null,
          zeroCount: col.zeroCount ?? null,
          negativeCount: col.negativeCount ?? null,
          positiveCount: col.positiveCount ?? null,
          minLength: col.minLength ?? null,
          maxLength: col.maxLength ?? null,
          avgLength: col.avgLength ?? null,
          emptyCount: col.emptyCount ?? null,
          whitespaceCount: col.whitespaceCount ?? null,
          patternSummary: col.patternSummary ?? null,
          dateMin: col.dateMin ?? null,
          dateMax: col.dateMax ?? null,
          dateRangeDays: col.dateRangeDays ?? null,
          topValues: col.topValues ? JSON.stringify(col.topValues) : null,
          histogram: col.histogram ? JSON.stringify(col.histogram) : null,
          outliers: col.outliers ? JSON.stringify(col.outliers) : null,
          valueDistribution: col.valueDistribution ? JSON.stringify(col.valueDistribution) : null,
          analysisData: JSON.stringify({
            numeric: col.numericAnalysis ?? null,
            categorical: col.categoricalAnalysis ?? null,
            datetime: col.datetimeAnalysis ?? null,
            boolean: col.booleanAnalysis ?? null,
            text: col.textAnalysis ?? null,
          }),
        },
      });
    }

    await prisma.datasetVersion.update({
      where: { id: version.id },
      data: { rowCount: profile.totalRows, columnCount: profile.totalColumns, encoding: profile.encoding || "utf-8" },
    });

    await prisma.dataset.update({
      where: { id: datasetId },
      data: {
        status: "profiled",
        rowCount: profile.totalRows,
        columnCount: profile.totalColumns,
        qualityScore: profile.qualityScore,
        encoding: profile.encoding || "utf-8",
        delimiter: profile.delimiter || ",",
      },
    });

    await notifyDatasetProfiled(userId, datasetId, datasetName, profile.qualityScore);
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.profiling("failed", {
      datasetId, duration,
      error: error instanceof Error ? error : new Error(String(error)),
    });

    await prisma.dataset.update({
      where: { id: datasetId },
      data: { status: "failed" },
    });

    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    await notifyDatasetFailed(userId, datasetId, datasetName, errorMsg);
  }
}
