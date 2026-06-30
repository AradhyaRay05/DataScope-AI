"use client";

import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  color?: string;
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  trend,
  color = "text-white",
}: StatCardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.08] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider font-[family-name:var(--font-instrument-sans)]">
          {label}
        </p>
        <div className="text-white/20">{icon}</div>
      </div>
      <p
        className={`text-2xl font-bold font-[family-name:var(--font-instrument-sans)] ${color}`}
      >
        {value}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {sublabel && (
          <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
            {sublabel}
          </p>
        )}
        {trend && (
          <span
            className={`text-xs font-medium ${trend.positive ? "text-emerald-400" : "text-red-400"}`}
          >
            {trend.positive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}

interface QualityGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function QualityGauge({ score, size = "md" }: QualityGaugeProps) {
  const dims = size === "lg" ? 160 : size === "md" ? 120 : 80;
  const stroke = size === "lg" ? 10 : size === "md" ? 8 : 6;
  const radius = (dims - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";
  const label =
    score >= 90
      ? "Excellent"
      : score >= 80
        ? "Good"
        : score >= 60
          ? "Fair"
          : score >= 40
            ? "Poor"
            : "Critical";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={dims}
        height={dims}
        className="-rotate-90"
      >
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke}
        />
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${offset} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-bold font-[family-name:var(--font-instrument-sans)] ${
            size === "lg"
              ? "text-4xl"
              : size === "md"
                ? "text-2xl"
                : "text-lg"
          }`}
          style={{ color }}
        >
          {Math.round(score)}
        </span>
        {size !== "sm" && (
          <span className="text-[10px] text-white/40 font-[family-name:var(--font-instrument-sans)]">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

interface ActivityFeedItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

const ACTION_ICONS: Record<string, string> = {
  "auth.register": "👤",
  "auth.login": "🔑",
  "auth.logout": "🚪",
  "auth.password_reset_request": "🔒",
  "auth.password_reset_complete": "✅",
  "dataset.upload": "📤",
  "dataset.delete": "🗑️",
  "dataset.update": "✏️",
  "dataset.profile_complete": "📊",
  "dataset.compare": "⚖️",
  "report.generate": "📄",
  "metadata.update": "🏷️",
};

const ACTION_LABELS: Record<string, string> = {
  "auth.register": "Account created",
  "auth.login": "Logged in",
  "auth.logout": "Logged out",
  "auth.password_reset_request": "Password reset requested",
  "auth.password_reset_complete": "Password reset completed",
  "dataset.upload": "Uploaded",
  "dataset.delete": "Deleted",
  "dataset.update": "Updated",
  "dataset.profile_complete": "Profiling completed for",
  "dataset.compare": "Compared",
  "report.generate": "Generated report for",
  "metadata.update": "Updated metadata for",
};

export function ActivityFeed({ items }: { items: ActivityFeedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/20 text-sm font-[family-name:var(--font-instrument-sans)]">
          No recent activity
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
        >
          <span className="text-sm mt-0.5 shrink-0">
            {ACTION_ICONS[item.action] || "📌"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/70 font-[family-name:var(--font-instrument-sans)]">
              {ACTION_LABELS[item.action] || item.action}
              {item.entity === "dataset" && (
                <span className="text-white/40"> dataset</span>
              )}
            </p>
            {item.details && (
              <p className="text-xs text-white/30 mt-0.5 truncate font-[family-name:var(--font-instrument-sans)]">
                {item.details}
              </p>
            )}
          </div>
          <span className="text-[10px] text-white/20 shrink-0 mt-0.5 font-[family-name:var(--font-instrument-sans)]">
            {formatTimeAgo(item.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function MiniBarChart({
  data,
}: {
  data: Array<{ label: string; value: number; color: string }>;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-1"
        >
          <div className="w-full relative" style={{ height: "60px" }}>
            <div
              className="absolute bottom-0 w-full rounded-t transition-all duration-700"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: d.color,
                minHeight: d.value > 0 ? "4px" : "0",
              }}
            />
          </div>
          <span className="text-[9px] text-white/30 font-[family-name:var(--font-instrument-sans)]">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
