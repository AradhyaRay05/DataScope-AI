"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  Database,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  XCircle,
  Tag,
} from "lucide-react";
import {
  formatDate,
  getQualityColor,
  getQualityLabel,
} from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ColumnProfile {
  columnName: string;
  columnIndex: number;
  detectedType: string;
  nonNullCount: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  isConstant: boolean;
  isHighCardinality: boolean;
  mean?: number;
  median?: number;
  mode?: string;
  std?: number;
  min?: string;
  max?: string;
  q25?: number;
  q50?: number;
  q75?: number;
  skewness?: number;
  kurtosis?: number;
  minLength?: number;
  maxLength?: number;
  avgLength?: number;
  dateMin?: string;
  dateMax?: string;
  topValues?: Array<{ value: string; count: number; percentage: number }>;
  histogram?: Array<{ bin: string; count: number }>;
  outliers?: number[];
}

interface Profile {
  totalRows: number;
  totalColumns: number;
  totalMissingCells: number;
  missingPercentage: number;
  duplicateRows: number;
  duplicatePercentage: number;
  memoryUsageBytes: number;
  typeBreakdown: Record<string, number>;
  qualityScore: number;
  qualityBreakdown: Record<
    string,
    { score: number; weight: number; description: string }
  >;
  correlationMatrix?: Record<string, Record<string, number>>;
  columns: ColumnProfile[];
}

interface DatasetDetail {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  status: string;
  qualityScore: number | null;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  metadata: Array<{ id: string; key: string; value: string }>;
  versions: Array<{
    id: string;
    version: number;
    fileName: string;
    fileSize: number;
    rowCount: number;
    columnCount: number;
    createdAt: string;
    qualityScore: number | null;
  }>;
  profile: Profile | null;
}

const TYPE_COLORS: Record<string, string> = {
  numeric: "#3b82f6",
  categorical: "#a855f7",
  text: "#6366f1",
  datetime: "#14b8a6",
  boolean: "#f59e0b",
  empty: "#6b7280",
  mixed: "#ef4444",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  numeric: <Hash className="w-3.5 h-3.5" />,
  categorical: <Tag className="w-3.5 h-3.5" />,
  text: <Type className="w-3.5 h-3.5" />,
  datetime: <Calendar className="w-3.5 h-3.5" />,
  boolean: <ToggleLeft className="w-3.5 h-3.5" />,
  empty: <XCircle className="w-3.5 h-3.5" />,
  mixed: <AlertTriangle className="w-3.5 h-3.5" />,
};

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dataset, setDataset] = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "columns" | "quality" | "missing"
  >("overview");
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchDataset = async () => {
      try {
        const res = await fetch(`/api/datasets/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDataset(data.dataset);
        }
      } catch (err) {
        console.error("Failed to fetch dataset:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDataset();
    const interval = setInterval(fetchDataset, 3000);
    return () => clearInterval(interval);
  }, [user, id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/50 font-[family-name:var(--font-instrument-sans)]">
            Dataset not found
          </p>
          <Link
            href="/dashboard"
            className="text-white/70 hover:text-white text-sm mt-4 inline-block font-[family-name:var(--font-instrument-sans)]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const profile = dataset.profile;
  const typeBreakdownData = profile
    ? Object.entries(profile.typeBreakdown).map(([name, value]) => ({
        name,
        value,
        color: TYPE_COLORS[name] || "#6b7280",
      }))
    : [];

  const missingData = profile
    ? profile.columns
        .filter((c) => c.nullPercentage > 0)
        .sort((a, b) => b.nullPercentage - a.nullPercentage)
        .slice(0, 20)
        .map((c) => ({
          name:
            c.columnName.length > 15
              ? c.columnName.slice(0, 15) + "..."
              : c.columnName,
          fullName: c.columnName,
          value: Math.round(c.nullPercentage * 10) / 10,
        }))
    : [];

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold font-[family-name:var(--font-instrument-sans)]">
                {dataset.name}
              </h1>
              <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                {dataset.fileName} &middot; {formatDate(dataset.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dataset.status === "profiling" && (
              <span className="flex items-center gap-2 text-sm text-blue-400 font-[family-name:var(--font-instrument-sans)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Profiling...
              </span>
            )}
            {dataset.status === "failed" && (
              <span className="flex items-center gap-2 text-sm text-red-400 font-[family-name:var(--font-instrument-sans)]">
                <AlertTriangle className="w-4 h-4" />
                Profiling Failed
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1 font-[family-name:var(--font-instrument-sans)]">
              Rows
            </p>
            <p className="text-xl font-semibold font-[family-name:var(--font-instrument-sans)]">
              {dataset.rowCount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1 font-[family-name:var(--font-instrument-sans)]">
              Columns
            </p>
            <p className="text-xl font-semibold font-[family-name:var(--font-instrument-sans)]">
              {dataset.columnCount}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1 font-[family-name:var(--font-instrument-sans)]">
              Missing Cells
            </p>
            <p className="text-xl font-semibold font-[family-name:var(--font-instrument-sans)]">
              {profile
                ? `${profile.missingPercentage.toFixed(1)}%`
                : "—"}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1 font-[family-name:var(--font-instrument-sans)]">
              Duplicates
            </p>
            <p className="text-xl font-semibold font-[family-name:var(--font-instrument-sans)]">
              {profile
                ? `${profile.duplicatePercentage.toFixed(1)}%`
                : "—"}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1 font-[family-name:var(--font-instrument-sans)]">
              Quality Score
            </p>
            <p
              className={`text-xl font-semibold font-[family-name:var(--font-instrument-sans)] ${
                profile ? getQualityColor(profile.qualityScore) : ""
              }`}
            >
              {profile ? Math.round(profile.qualityScore) : "—"}
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-8 border-b border-white/5 overflow-x-auto">
          {(
            ["overview", "columns", "quality", "missing"] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors font-[family-name:var(--font-instrument-sans)] whitespace-nowrap ${
                activeTab === tab
                  ? "text-white border-b-2 border-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {!profile ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-white/20 animate-spin mx-auto mb-4" />
            <p className="text-white/40 font-[family-name:var(--font-instrument-sans)]">
              Waiting for profiling to complete...
            </p>
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                  <h3 className="text-sm font-medium text-white/60 mb-4 font-[family-name:var(--font-instrument-sans)]">
                    Data Type Distribution
                  </h3>
                  {typeBreakdownData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={typeBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {typeBreakdownData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#1a1a1a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelStyle={{ color: "#fff" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-white/30 text-sm">No data</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {typeBreakdownData.map((t) => (
                      <div
                        key={t.name}
                        className="flex items-center gap-1.5 text-xs text-white/50"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: t.color }}
                        />
                        {t.name} ({t.value})
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                  <h3 className="text-sm font-medium text-white/60 mb-4 font-[family-name:var(--font-instrument-sans)]">
                    Quality Score Breakdown
                  </h3>
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke={
                            profile.qualityScore >= 80
                              ? "#34d399"
                              : profile.qualityScore >= 60
                                ? "#fbbf24"
                                : "#f87171"
                          }
                          strokeWidth="8"
                          strokeDasharray={`${
                            (profile.qualityScore / 100) * 351.86
                          } 351.86`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold font-[family-name:var(--font-instrument-sans)]">
                          {Math.round(profile.qualityScore)}
                        </span>
                        <span className="text-xs text-white/40 font-[family-name:var(--font-instrument-sans)]">
                          {getQualityLabel(profile.qualityScore)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(profile.qualityBreakdown).map(
                      ([key, val]) => (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/50 capitalize font-[family-name:var(--font-instrument-sans)]">
                              {key}
                            </span>
                            <span className="text-white/70 font-[family-name:var(--font-instrument-sans)]">
                              {val.score}
                            </span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{
                                width: `${val.score}%`,
                                background:
                                  val.score >= 80
                                    ? "#34d399"
                                    : val.score >= 60
                                      ? "#fbbf24"
                                      : "#f87171",
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {missingData.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 lg:col-span-2">
                    <h3 className="text-sm font-medium text-white/60 mb-4 font-[family-name:var(--font-instrument-sans)]">
                      Missing Values by Column
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={missingData} layout="vertical">
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1a1a1a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value) => [
                            `${value}%`,
                            "Missing",
                          ]}
                          labelFormatter={(label) => {
                            const item = missingData.find(
                              (d) => d.name === label
                            );
                            return item?.fullName || String(label);
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#ef4444"
                          radius={[0, 4, 4, 0]}
                          barSize={16}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {activeTab === "columns" && (
              <div className="space-y-3">
                {profile.columns.map((col) => (
                  <div
                    key={col.columnName}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedColumn(
                          expandedColumn === col.columnName
                            ? null
                            : col.columnName
                        )
                      }
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: `${
                            TYPE_COLORS[col.detectedType] || "#6b7280"
                          }20`,
                          color: TYPE_COLORS[col.detectedType] || "#6b7280",
                        }}
                      >
                        {TYPE_ICONS[col.detectedType] || (
                          <Hash className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate font-[family-name:var(--font-instrument-sans)]">
                          {col.columnName}
                        </p>
                        <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                          {col.detectedType} &middot; {col.uniqueCount} unique
                          &middot; {col.nullPercentage.toFixed(1)}% missing
                        </p>
                      </div>
                      <div className="w-24">
                        <div className="w-full bg-white/5 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500"
                            style={{
                              width: `${100 - col.nullPercentage}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          TYPE_COLORS[col.detectedType]
                            ? `border-opacity-20`
                            : ""
                        }`}
                        style={{
                          borderColor: `${
                            TYPE_COLORS[col.detectedType] || "#6b7280"
                          }40`,
                          color: TYPE_COLORS[col.detectedType] || "#6b7280",
                          background: `${
                            TYPE_COLORS[col.detectedType] || "#6b7280"
                          }10`,
                        }}
                      >
                        {col.detectedType}
                      </span>
                    </button>

                    {expandedColumn === col.columnName && (
                      <div className="px-4 pb-4 border-t border-white/5 pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                              Non-null
                            </p>
                            <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                              {col.nonNullCount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                              Null
                            </p>
                            <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                              {col.nullCount.toLocaleString()} (
                              {col.nullPercentage.toFixed(1)}%)
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                              Unique
                            </p>
                            <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                              {col.uniqueCount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                              Memory
                            </p>
                            <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                              {col.isConstant ? "Constant" : "Variable"}
                            </p>
                          </div>
                        </div>

                        {col.detectedType === "numeric" && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                                Mean
                              </p>
                              <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                                {col.mean?.toFixed(3)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                                Median
                              </p>
                              <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                                {col.median?.toFixed(3)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                                Std Dev
                              </p>
                              <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                                {col.std?.toFixed(3)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                                Range
                              </p>
                              <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                                {col.min} — {col.max}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                                Q25
                              </p>
                              <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                                {col.q25?.toFixed(3)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                                Q50
                              </p>
                              <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                                {col.q50?.toFixed(3)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                                Q75
                              </p>
                              <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                                {col.q75?.toFixed(3)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                                Skewness
                              </p>
                              <p className="text-sm font-medium font-[family-name:var(--font-instrument-sans)]">
                                {col.skewness?.toFixed(3)}
                              </p>
                            </div>
                          </div>
                        )}

                        {col.histogram && col.histogram.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-white/30 mb-2 font-[family-name:var(--font-instrument-sans)]">
                              Distribution
                            </p>
                            <ResponsiveContainer width="100%" height={150}>
                              <BarChart data={col.histogram}>
                                <XAxis
                                  dataKey="bin"
                                  tick={{
                                    fill: "rgba(255,255,255,0.2)",
                                    fontSize: 9,
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{
                                    fill: "rgba(255,255,255,0.2)",
                                    fontSize: 9,
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <Tooltip
                                  contentStyle={{
                                    background: "#1a1a1a",
                                    border:
                                      "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                  }}
                                />
                                <Bar
                                  dataKey="count"
                                  fill="#3b82f6"
                                  radius={[2, 2, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {col.topValues && col.topValues.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-white/30 mb-2 font-[family-name:var(--font-instrument-sans)]">
                              Top Values
                            </p>
                            <div className="space-y-1.5">
                              {col.topValues.slice(0, 8).map((tv, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3"
                                >
                                  <span className="text-xs text-white/50 w-32 truncate font-[family-name:var(--font-instrument-sans)]">
                                    {tv.value}
                                  </span>
                                  <div className="flex-1 bg-white/5 rounded-full h-2">
                                    <div
                                      className="h-2 rounded-full bg-indigo-500"
                                      style={{
                                        width: `${Math.min(100, tv.percentage)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-white/30 w-16 text-right font-[family-name:var(--font-instrument-sans)]">
                                    {tv.count} ({tv.percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "quality" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(profile.qualityBreakdown).map(
                    ([key, val]) => (
                      <div
                        key={key}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium capitalize font-[family-name:var(--font-instrument-sans)]">
                            {key}
                          </h3>
                          <span
                            className={`text-lg font-bold font-[family-name:var(--font-instrument-sans)] ${getQualityColor(val.score)}`}
                          >
                            {val.score}
                          </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 mb-3">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${val.score}%`,
                              background:
                                val.score >= 80
                                  ? "#34d399"
                                  : val.score >= 60
                                    ? "#fbbf24"
                                    : "#f87171",
                            }}
                          />
                        </div>
                        <p className="text-xs text-white/40 font-[family-name:var(--font-instrument-sans)]">
                          {val.description}
                        </p>
                        <p className="text-xs text-white/20 mt-1 font-[family-name:var(--font-instrument-sans)]">
                          Weight: {(val.weight * 100).toFixed(0)}%
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {activeTab === "missing" && (
              <div className="space-y-6">
                {missingData.length === 0 ? (
                  <div className="text-center py-20">
                    <CheckCircle className="w-16 h-16 text-emerald-500/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white/60 font-[family-name:var(--font-instrument-sans)]">
                      No Missing Values
                    </h3>
                    <p className="text-white/30 text-sm mt-2 font-[family-name:var(--font-instrument-sans)]">
                      This dataset is complete — no missing values detected.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                      <h3 className="text-sm font-medium text-white/60 mb-4 font-[family-name:var(--font-instrument-sans)]">
                        Missing Values by Column
                      </h3>
                      <ResponsiveContainer width="100%" height={Math.max(
                        300,
                        missingData.length * 28
                      )}>
                        <BarChart data={missingData} layout="vertical">
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            tick={{
                              fill: "rgba(255,255,255,0.3)",
                              fontSize: 11,
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={130}
                            tick={{
                              fill: "rgba(255,255,255,0.5)",
                              fontSize: 11,
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#1a1a1a",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value) => [
                              `${value}%`,
                              "Missing",
                            ]}
                          />
                          <Bar
                            dataKey="value"
                            radius={[0, 4, 4, 0]}
                            barSize={16}
                          >
                            {missingData.map((entry, i) => (
                              <Cell
                                key={i}
                                fill={
                                  entry.value > 50
                                    ? "#ef4444"
                                    : entry.value > 20
                                      ? "#f59e0b"
                                      : "#3b82f6"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left text-xs text-white/40 px-4 py-3 font-[family-name:var(--font-instrument-sans)]">
                              Column
                            </th>
                            <th className="text-left text-xs text-white/40 px-4 py-3 font-[family-name:var(--font-instrument-sans)]">
                              Type
                            </th>
                            <th className="text-right text-xs text-white/40 px-4 py-3 font-[family-name:var(--font-instrument-sans)]">
                              Missing
                            </th>
                            <th className="text-right text-xs text-white/40 px-4 py-3 font-[family-name:var(--font-instrument-sans)]">
                              Percentage
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {profile.columns
                            .filter((c) => c.nullPercentage > 0)
                            .sort(
                              (a, b) =>
                                b.nullPercentage - a.nullPercentage
                            )
                            .map((col) => (
                              <tr
                                key={col.columnName}
                                className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                              >
                                <td className="px-4 py-3 text-sm font-[family-name:var(--font-instrument-sans)]">
                                  {col.columnName}
                                </td>
                                <td className="px-4 py-3 text-sm text-white/50 font-[family-name:var(--font-instrument-sans)]">
                                  {col.detectedType}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-[family-name:var(--font-instrument-sans)]">
                                  {col.nullCount.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-[family-name:var(--font-instrument-sans)]">
                                  <span
                                    className={
                                      col.nullPercentage > 50
                                        ? "text-red-400"
                                        : col.nullPercentage > 20
                                          ? "text-yellow-400"
                                          : "text-white/70"
                                    }
                                  >
                                    {col.nullPercentage.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
