"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CHART_COLORS = [
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#ec4899",
  "#84cc16",
  "#06b6d4",
  "#f97316",
];

interface ChartColumn {
  name: string;
  type: string;
  data: Array<{ value: number | string; count?: number }>;
  stats?: Record<string, number | string | null>;
  histogram?: Array<{ bin: string; count: number }>;
  topValues?: Array<{ value: string; count: number; percentage: number }>;
}

interface VisualizationStudioProps {
  columns: ChartColumn[];
  correlationMatrix?: Record<string, Record<string, number>>;
  missingData?: Array<{ name: string; value: number }>;
  typeBreakdown?: Record<string, number>;
}

type ChartType =
  | "histogram"
  | "bar"
  | "pie"
  | "donut"
  | "line"
  | "area"
  | "scatter"
  | "box"
  | "heatmap"
  | "distribution"
  | "missing";

const CHART_TYPES: Array<{ id: ChartType; label: string; icon: string }> = [
  { id: "histogram", label: "Histogram", icon: "▐" },
  { id: "bar", label: "Bar Chart", icon: "▊" },
  { id: "pie", label: "Pie Chart", icon: "◕" },
  { id: "donut", label: "Donut", icon: "◎" },
  { id: "line", label: "Line Chart", icon: "╱" },
  { id: "area", label: "Area Chart", icon: "▓" },
  { id: "scatter", label: "Scatter", icon: "⬡" },
  { id: "box", label: "Box Plot", icon: "☐" },
  { id: "heatmap", label: "Heatmap", icon: "▦" },
  { id: "distribution", label: "Distribution", icon: "∿" },
  { id: "missing", label: "Missing", icon: "░" },
];

export default function VisualizationStudio({
  columns,
  correlationMatrix,
  missingData,
  typeBreakdown,
}: VisualizationStudioProps) {
  const [activeChart, setActiveChart] = useState<ChartType>("histogram");
  const [selectedColumn, setSelectedColumn] = useState<string>(
    columns[0]?.name ?? ""
  );
  const [scatterX, setScatterX] = useState<string>("");
  const [scatterY, setScatterY] = useState<string>("");

  const numericColumns = useMemo(
    () => columns.filter((c) => c.type === "numeric"),
    [columns]
  );

  const categoricalColumns = useMemo(
    () =>
      columns.filter(
        (c) => c.type === "categorical" || c.type === "boolean"
      ),
    [columns]
  );

  const selectedCol = useMemo(
    () => columns.find((c) => c.name === selectedColumn),
    [columns, selectedColumn]
  );

  const histogramData = useMemo(() => {
    if (!selectedCol?.histogram) return [];
    return selectedCol.histogram.map((h) => ({
      bin: h.bin,
      count: h.count,
    }));
  }, [selectedCol]);

  const barData = useMemo(() => {
    if (!selectedCol?.topValues) return [];
    return selectedCol.topValues.map((tv) => ({
      name: tv.value.length > 15 ? tv.value.slice(0, 15) + "…" : tv.value,
      fullName: tv.value,
      count: tv.count,
      percentage: Math.round(tv.percentage * 10) / 10,
    }));
  }, [selectedCol]);

  const pieData = useMemo(() => {
    if (!selectedCol?.topValues) return [];
    return selectedCol.topValues.slice(0, 8).map((tv) => ({
      name: tv.value,
      value: tv.count,
    }));
  }, [selectedCol]);

  const typeData = useMemo(() => {
    if (!typeBreakdown) return [];
    return Object.entries(typeBreakdown).map(([name, value]) => ({
      name,
      value,
    }));
  }, [typeBreakdown]);

  const scatterData = useMemo(() => {
    if (!scatterX || !scatterY) return [];
    const colX = columns.find((c) => c.name === scatterX);
    const colY = columns.find((c) => c.name === scatterY);
    if (!colX || !colY) return [];

    const n = Math.min(colX.data.length, colY.data.length, 500);
    const points = [];
    for (let i = 0; i < n; i++) {
      const x = Number(colX.data[i]?.value);
      const y = Number(colY.data[i]?.value);
      if (!isNaN(x) && !isNaN(y)) {
        points.push({ x, y });
      }
    }
    return points;
  }, [scatterX, scatterY, columns]);

  const missingBarData = useMemo(() => {
    if (missingData) return missingData;
    return columns
      .filter((c) => {
        const stats = c.stats;
        return stats && Number(stats.nullPercentage ?? 0) > 0;
      })
      .map((c) => ({
        name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
        fullName: c.name,
        value: Number(c.stats?.nullPercentage ?? 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }, [columns, missingData]);

  const heatmapData = useMemo(() => {
    if (!correlationMatrix) return [];
    const names = Object.keys(correlationMatrix);
    return names.map((a) => ({
      name: a,
      ...Object.fromEntries(names.map((b) => [b, correlationMatrix[a][b] ?? 0])),
    }));
  }, [correlationMatrix]);

  const renderChart = () => {
    switch (activeChart) {
      case "histogram":
        if (histogramData.length === 0) {
          return <EmptyState message="Select a numeric column for histogram" />;
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="bin"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
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
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "bar":
        if (barData.length === 0) {
          return <EmptyState message="Select a categorical column for bar chart" />;
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
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
                formatter={(value, _name, props) => [
                  `${value} (${props.payload?.percentage ?? 0}%)`,
                  props.payload?.fullName ?? "",
                ]}
              />
              <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        if (pieData.length === 0) {
          return <EmptyState message="Select a categorical column for pie chart" />;
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={130}
                dataKey="value"
                label={({ name, percent }) =>
                  `${String(name ?? "").slice(0, 12)}${(name ?? "").toString().length > 12 ? "…" : ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case "donut":
        if (typeData.length === 0 && pieData.length === 0) {
          return <EmptyState message="No data available for donut chart" />;
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={typeData.length > 0 ? typeData : pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                paddingAngle={2}
              >
                {(typeData.length > 0 ? typeData : pieData).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case "line":
        if (!selectedCol?.histogram) {
          return <EmptyState message="Select a numeric column for line chart" />;
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="bin"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
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
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={{ fill: "#14b8a6", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        if (!selectedCol?.histogram) {
          return <EmptyState message="Select a numeric column for area chart" />;
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="bin"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
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
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "scatter":
        if (scatterData.length === 0) {
          return (
            <EmptyState message="Select X and Y numeric columns for scatter plot" />
          );
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number"
                dataKey="x"
                name={scatterX}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={scatterY}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
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
                formatter={(value) => [`${Number(value).toFixed(2)}`]}
              />
              <Scatter data={scatterData} fill="#6366f1" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case "box":
        if (!selectedCol?.stats) {
          return <EmptyState message="Select a numeric column for box plot" />;
        }
        return <BoxPlotVisualization stats={selectedCol.stats as Record<string, number>} />;

      case "heatmap":
        if (heatmapData.length === 0) {
          return <EmptyState message="Correlation matrix not available" />;
        }
        return <HeatmapVisualization data={heatmapData} />;

      case "distribution":
        if (numericColumns.length === 0) {
          return <EmptyState message="No numeric columns for distribution plot" />;
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={
                selectedCol?.histogram?.map((h) => ({
                  bin: h.bin,
                  count: h.count,
                })) ?? []
              }
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="bin"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
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
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#ec4899"
                fill="#ec4899"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "missing":
        if (missingBarData.length === 0) {
          return <EmptyState message="No missing values detected" />;
        }
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={missingBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
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
                formatter={(value) => [`${Number(value).toFixed(1)}%`, "Missing"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                {missingBarData.map((entry, i) => (
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
        );

      default:
        return <EmptyState message="Select a chart type" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 p-1 bg-white/[0.02] rounded-lg border border-white/[0.04]">
        {CHART_TYPES.map((ct) => (
          <button
            key={ct.id}
            onClick={() => setActiveChart(ct.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all font-[family-name:var(--font-instrument-sans)] ${
              activeChart === ct.id
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
            }`}
          >
            <span className="text-sm">{ct.icon}</span>
            {ct.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {(activeChart === "histogram" ||
          activeChart === "bar" ||
          activeChart === "pie" ||
          activeChart === "line" ||
          activeChart === "area" ||
          activeChart === "box" ||
          activeChart === "distribution") && (
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20 font-[family-name:var(--font-instrument-sans)]"
          >
            {columns.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        )}

        {activeChart === "scatter" && (
          <>
            <select
              value={scatterX}
              onChange={(e) => setScatterX(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20 font-[family-name:var(--font-instrument-sans)]"
            >
              <option value="">X Axis</option>
              {numericColumns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={scatterY}
              onChange={(e) => setScatterY(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20 font-[family-name:var(--font-instrument-sans)]"
            >
              <option value="">Y Axis</option>
              {numericColumns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
        {renderChart()}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[350px] text-white/20 text-sm font-[family-name:var(--font-instrument-sans)]">
      {message}
    </div>
  );
}

function BoxPlotVisualization({ stats }: { stats: Record<string, number> }) {
  const min = stats.min ?? 0;
  const q1 = stats.q25 ?? 0;
  const median = stats.q50 ?? 0;
  const q3 = stats.q75 ?? 0;
  const max = stats.max ?? 0;
  const range = max - min || 1;

  const toPercent = (v: number) => ((v - min) / range) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-[350px] gap-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between text-xs text-white/30 mb-2 font-[family-name:var(--font-instrument-sans)]">
          <span>{min.toFixed(2)}</span>
          <span>{max.toFixed(2)}</span>
        </div>
        <div className="relative h-16 w-full">
          <div className="absolute top-0 left-0 right-0 h-full flex items-center">
            <div
              className="absolute h-0.5 bg-white/20"
              style={{
                left: `${toPercent(min)}%`,
                width: `${toPercent(q1) - toPercent(min)}%`,
              }}
            />
            <div
              className="absolute h-12 bg-blue-500/20 border border-blue-500/40 rounded"
              style={{
                left: `${toPercent(q1)}%`,
                width: `${toPercent(q3) - toPercent(q1)}%`,
              }}
            />
            <div
              className="absolute h-0.5 bg-white/20"
              style={{
                left: `${toPercent(q3)}%`,
                width: `${toPercent(max) - toPercent(q3)}%`,
              }}
            />
            <div
              className="absolute h-16 w-0.5 bg-yellow-400"
              style={{ left: `${toPercent(median)}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 text-xs font-[family-name:var(--font-instrument-sans)]">
          <div className="text-center">
            <p className="text-white/30">Min</p>
            <p className="text-white/70">{min.toFixed(3)}</p>
          </div>
          <div className="text-center">
            <p className="text-white/30">Q1</p>
            <p className="text-white/70">{q1.toFixed(3)}</p>
          </div>
          <div className="text-center">
            <p className="text-yellow-400">Median</p>
            <p className="text-white">{median.toFixed(3)}</p>
          </div>
          <div className="text-center">
            <p className="text-white/30">Q3</p>
            <p className="text-white/70">{q3.toFixed(3)}</p>
          </div>
          <div className="text-center">
            <p className="text-white/30">Max</p>
            <p className="text-white/70">{max.toFixed(3)}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">IQR</p>
          <p className="text-sm text-white/70 font-[family-name:var(--font-instrument-sans)]">
            {(q3 - q1).toFixed(3)}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">Range</p>
          <p className="text-sm text-white/70 font-[family-name:var(--font-instrument-sans)]">
            {range.toFixed(3)}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">Median</p>
          <p className="text-sm text-white/70 font-[family-name:var(--font-instrument-sans)]">
            {median.toFixed(3)}
          </p>
        </div>
      </div>
    </div>
  );
}

function HeatmapVisualization({
  data,
}: {
  data: Array<Record<string, string | number>>;
}) {
  if (data.length === 0) return null;

  const keys = Object.keys(data[0]).filter((k) => k !== "name");

  const getColor = (v: number): string => {
    const abs = Math.abs(v);
    if (abs > 0.7) return v > 0 ? "bg-blue-600" : "bg-red-600";
    if (abs > 0.4) return v > 0 ? "bg-blue-500/60" : "bg-red-500/60";
    if (abs > 0.2) return v > 0 ? "bg-blue-500/30" : "bg-red-500/30";
    return "bg-white/5";
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-fit">
        <div className="flex">
          <div className="w-20" />
          {keys.map((k) => (
            <div
              key={k}
              className="w-10 text-center text-[8px] text-white/30 font-[family-name:var(--font-instrument-sans)] truncate px-0.5"
              title={k}
            >
              {k.slice(0, 6)}
            </div>
          ))}
        </div>
        {data.map((row) => (
          <div key={row.name} className="flex">
            <div className="w-20 text-[8px] text-white/40 font-[family-name:var(--font-instrument-sans)] truncate pr-1 flex items-center justify-end">
              {String(row.name).slice(0, 10)}
            </div>
            {keys.map((k) => {
              const v = Number(row[k]);
              return (
                <div
                  key={k}
                  className={`w-10 h-10 flex items-center justify-center text-[7px] text-white/50 border border-white/[0.02] ${getColor(v)}`}
                  title={`${row.name} ↔ ${k}: ${v.toFixed(3)}`}
                >
                  {v.toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
