-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "columnCount" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL,
    "encoding" TEXT NOT NULL DEFAULT 'utf-8',
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "qualityScore" REAL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dataset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datasetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "columnCount" INTEGER NOT NULL DEFAULT 0,
    "encoding" TEXT NOT NULL DEFAULT 'utf-8',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DatasetVersion_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "totalColumns" INTEGER NOT NULL,
    "totalMissingCells" INTEGER NOT NULL DEFAULT 0,
    "missingPercentage" REAL NOT NULL DEFAULT 0,
    "duplicateRows" INTEGER NOT NULL DEFAULT 0,
    "duplicatePercentage" REAL NOT NULL DEFAULT 0,
    "memoryUsageBytes" INTEGER NOT NULL DEFAULT 0,
    "typeBreakdown" TEXT NOT NULL DEFAULT '{}',
    "qualityScore" REAL NOT NULL DEFAULT 0,
    "qualityBreakdown" TEXT NOT NULL DEFAULT '{}',
    "correlationMatrix" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DatasetProfile_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DatasetVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ColumnProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "columnName" TEXT NOT NULL,
    "columnIndex" INTEGER NOT NULL,
    "detectedType" TEXT NOT NULL,
    "nonNullCount" INTEGER NOT NULL,
    "nullCount" INTEGER NOT NULL,
    "nullPercentage" REAL NOT NULL,
    "uniqueCount" INTEGER NOT NULL,
    "isConstant" BOOLEAN NOT NULL DEFAULT false,
    "isHighCardinality" BOOLEAN NOT NULL DEFAULT false,
    "mean" REAL,
    "median" REAL,
    "mode" TEXT,
    "std" REAL,
    "min" TEXT,
    "max" TEXT,
    "q25" REAL,
    "q50" REAL,
    "q75" REAL,
    "skewness" REAL,
    "kurtosis" REAL,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "avgLength" REAL,
    "dateMin" TEXT,
    "dateMax" TEXT,
    "topValues" TEXT,
    "histogram" TEXT,
    "outliers" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ColumnProfile_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DatasetVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "versionId" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MetadataField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datasetId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MetadataField_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Dataset_userId_idx" ON "Dataset"("userId");

-- CreateIndex
CREATE INDEX "Dataset_status_idx" ON "Dataset"("status");

-- CreateIndex
CREATE INDEX "Dataset_createdAt_idx" ON "Dataset"("createdAt");

-- CreateIndex
CREATE INDEX "DatasetVersion_datasetId_idx" ON "DatasetVersion"("datasetId");

-- CreateIndex
CREATE UNIQUE INDEX "DatasetVersion_datasetId_version_key" ON "DatasetVersion"("datasetId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DatasetProfile_versionId_key" ON "DatasetProfile"("versionId");

-- CreateIndex
CREATE INDEX "ColumnProfile_versionId_idx" ON "ColumnProfile"("versionId");

-- CreateIndex
CREATE INDEX "ColumnProfile_columnName_idx" ON "ColumnProfile"("columnName");

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "Report"("userId");

-- CreateIndex
CREATE INDEX "Report_datasetId_idx" ON "Report"("datasetId");

-- CreateIndex
CREATE INDEX "MetadataField_datasetId_idx" ON "MetadataField"("datasetId");

-- CreateIndex
CREATE UNIQUE INDEX "MetadataField_datasetId_key_key" ON "MetadataField"("datasetId", "key");
