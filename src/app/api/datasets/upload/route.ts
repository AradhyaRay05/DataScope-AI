import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { profileDataset } from "@/engine/profiler";
import { logActivity } from "@/lib/activity";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".csv", ".xlsx", ".xls"]);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "Please select a file to upload." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The uploaded file is empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File exceeds the 100MB size limit. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
        },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file format "${ext}". Please upload a CSV (.csv), Excel (.xlsx), or Excel (.xls) file.`,
        },
        { status: 400 }
      );
    }

    const datasetName = name?.trim() || file.name.replace(/\.[^/.]+$/, "");
    if (datasetName.length === 0) {
      return NextResponse.json(
        { error: "Dataset name is required." },
        { status: 400 }
      );
    }
    if (datasetName.length > 200) {
      return NextResponse.json(
        { error: "Dataset name must be 200 characters or fewer." },
        { status: 400 }
      );
    }

    const existingDataset = await prisma.dataset.findFirst({
      where: {
        userId: session.userId,
        name: datasetName,
        isArchived: false,
      },
    });

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);

    const datasetId = uuidv4();
    const uploadDir = path.join(
      process.cwd(),
      "data",
      "uploads",
      session.userId,
      datasetId
    );
    fs.mkdirSync(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const mimeType =
      file.type ||
      (ext === ".csv"
        ? "text/csv"
        : ext === ".xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/vnd.ms-excel");

    const versionNumber = existingDataset
      ? existingDataset.currentVersion + 1
      : 1;

    const dataset = await prisma.dataset.create({
      data: {
        id: datasetId,
        userId: session.userId,
        name: datasetName,
        description: description || null,
        tags: JSON.stringify(tags),
        category: category || null,
        fileName: file.name,
        filePath,
        fileSize: file.size,
        mimeType,
        status: "profiling",
        currentVersion: versionNumber,
        targetColumn: targetColumn || null,
        source: source || null,
        notes: notes || null,
        project: project || null,
      },
    });

    await prisma.datasetVersion.create({
      data: {
        datasetId: dataset.id,
        version: versionNumber,
        fileName: file.name,
        filePath,
        fileSize: file.size,
        encoding: "utf-8",
      },
    });

    profileDatasetAsync(dataset.id, filePath, mimeType, versionNumber);

    await logActivity(
      session.userId,
      "dataset.upload",
      "dataset",
      dataset.id,
      `${datasetName} (${file.name})`
    );

    return NextResponse.json(
      {
        dataset: {
          id: dataset.id,
          name: dataset.name,
          status: "profiling",
          isDuplicate: !!existingDataset,
        },
        message: existingDataset
          ? `Upload complete. New version (${versionNumber}) of "${datasetName}" is being profiled.`
          : "Upload complete. Profiling in progress...",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

async function profileDatasetAsync(
  datasetId: string,
  filePath: string,
  mimeType: string,
  versionNumber: number
) {
  try {
    const profile = await profileDataset(filePath, mimeType);

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
        correlationMatrix: profile.correlationMatrix
          ? JSON.stringify(profile.correlationMatrix)
          : null,
        sheetNames: profile.sheetNames
          ? JSON.stringify(profile.sheetNames)
          : null,
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
          valueDistribution: col.valueDistribution
            ? JSON.stringify(col.valueDistribution)
            : null,
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
      data: {
        rowCount: profile.totalRows,
        columnCount: profile.totalColumns,
        encoding: profile.encoding || "utf-8",
      },
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
  } catch (error) {
    console.error("Profiling error:", error);
    await prisma.dataset.update({
      where: { id: datasetId },
      data: { status: "failed" },
    });
  }
}
