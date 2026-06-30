-- AlterTable
ALTER TABLE "DatasetProfile" ADD COLUMN "sheetNames" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ColumnProfile" (
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
    "isIdentifier" BOOLEAN NOT NULL DEFAULT false,
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
    "sum" REAL,
    "zeroCount" INTEGER,
    "negativeCount" INTEGER,
    "positiveCount" INTEGER,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "avgLength" REAL,
    "emptyCount" INTEGER,
    "whitespaceCount" INTEGER,
    "patternSummary" TEXT,
    "dateMin" TEXT,
    "dateMax" TEXT,
    "dateRangeDays" INTEGER,
    "topValues" TEXT,
    "histogram" TEXT,
    "outliers" TEXT,
    "valueDistribution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ColumnProfile_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DatasetVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ColumnProfile" ("avgLength", "columnIndex", "columnName", "createdAt", "dateMax", "dateMin", "detectedType", "histogram", "id", "isConstant", "isHighCardinality", "kurtosis", "max", "maxLength", "mean", "median", "min", "minLength", "mode", "nonNullCount", "nullCount", "nullPercentage", "outliers", "q25", "q50", "q75", "skewness", "std", "topValues", "uniqueCount", "versionId") SELECT "avgLength", "columnIndex", "columnName", "createdAt", "dateMax", "dateMin", "detectedType", "histogram", "id", "isConstant", "isHighCardinality", "kurtosis", "max", "maxLength", "mean", "median", "min", "minLength", "mode", "nonNullCount", "nullCount", "nullPercentage", "outliers", "q25", "q50", "q75", "skewness", "std", "topValues", "uniqueCount", "versionId" FROM "ColumnProfile";
DROP TABLE "ColumnProfile";
ALTER TABLE "new_ColumnProfile" RENAME TO "ColumnProfile";
CREATE INDEX "ColumnProfile_versionId_idx" ON "ColumnProfile"("versionId");
CREATE INDEX "ColumnProfile_columnName_idx" ON "ColumnProfile"("columnName");
CREATE TABLE "new_Dataset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "columnCount" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL,
    "encoding" TEXT NOT NULL DEFAULT 'utf-8',
    "delimiter" TEXT NOT NULL DEFAULT ',',
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "qualityScore" REAL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "targetColumn" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "project" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dataset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Dataset" ("columnCount", "createdAt", "currentVersion", "description", "encoding", "fileName", "filePath", "fileSize", "id", "mimeType", "name", "qualityScore", "rowCount", "status", "tags", "updatedAt", "userId") SELECT "columnCount", "createdAt", "currentVersion", "description", "encoding", "fileName", "filePath", "fileSize", "id", "mimeType", "name", "qualityScore", "rowCount", "status", "tags", "updatedAt", "userId" FROM "Dataset";
DROP TABLE "Dataset";
ALTER TABLE "new_Dataset" RENAME TO "Dataset";
CREATE INDEX "Dataset_userId_idx" ON "Dataset"("userId");
CREATE INDEX "Dataset_status_idx" ON "Dataset"("status");
CREATE INDEX "Dataset_createdAt_idx" ON "Dataset"("createdAt");
CREATE INDEX "Dataset_isFavorite_idx" ON "Dataset"("isFavorite");
CREATE INDEX "Dataset_isArchived_idx" ON "Dataset"("isArchived");
CREATE INDEX "Dataset_category_idx" ON "Dataset"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
