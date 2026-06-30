"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  Database,
  Upload,
  Search,
  LogOut,
  Trash2,
  Eye,
  BarChart3,
  Clock,
  FileText,
  Layers,
  Plus,
  Loader2,
  HardDrive,
  TrendingUp,
  Activity,
  ChevronDown,
} from "lucide-react";
import {
  formatBytes,
  formatDate,
  getQualityColor,
  getQualityBg,
} from "@/lib/utils";
import {
  StatCard,
  QualityGauge,
  ActivityFeed,
  MiniBarChart,
} from "@/components/ui/DashboardWidgets";
import type { DashboardStats, ActivityItem } from "@/types";

interface Dataset {
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
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [recentDatasets, setRecentDatasets] = useState<
    Array<{
      id: string;
      name: string;
      fileName: string;
      fileSize: number;
      qualityScore: number | null;
      status: string;
      createdAt: string;
    }>
  >([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const fetchedOnce = useRef(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setActivities(data.recentActivities);
        setRecentDatasets(data.recentDatasets);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const fetchDatasets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ sort: sortBy, limit: "50" });
      if (searchQuery.length >= 2) params.set("q", searchQuery);
      const res = await fetch(`/api/datasets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDatasets(data.datasets);
        setTotalCount(data.pagination.totalCount);
      }
    } catch (err) {
      console.error("Failed to fetch datasets:", err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, searchQuery]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !fetchedOnce.current) {
      fetchedOnce.current = true;
      fetchDatasets();
      fetchStats();
    }
  }, [user, fetchDatasets, fetchStats]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchDatasets();
      fetchStats();
    }, 8000);
    return () => clearInterval(interval);
  }, [user, fetchDatasets, fetchStats]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const nameInput = form.elements.namedItem("dsName") as HTMLInputElement;
    const descInput = form.elements.namedItem(
      "description"
    ) as HTMLTextAreaElement;
    const tagsInput = form.elements.namedItem("tags") as HTMLInputElement;

    const file = fileInput?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress("Uploading...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "name",
      nameInput?.value || file.name.replace(/\.[^/.]+$/, "")
    );
    formData.append("description", descInput?.value || "");
    formData.append("tags", tagsInput?.value || "");

    try {
      const res = await fetch("/api/datasets/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUploadProgress("Profiling in progress...");
      setShowUpload(false);
      fetchDatasets();
      fetchStats();
    } catch (err) {
      setUploadProgress(
        err instanceof Error ? err.message : "Upload failed"
      );
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(""), 3000);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/datasets/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDatasets();
        fetchStats();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const qualityDistData = stats
    ? [
        {
          label: "Exc",
          value: stats.qualityDistribution.excellent,
          color: "#34d399",
        },
        {
          label: "Good",
          value: stats.qualityDistribution.good,
          color: "#3b82f6",
        },
        {
          label: "Fair",
          value: stats.qualityDistribution.fair,
          color: "#fbbf24",
        },
        {
          label: "Poor",
          value: stats.qualityDistribution.poor,
          color: "#ef4444",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Database className="w-6 h-6 text-white" />
            <span className="font-semibold text-white font-[family-name:var(--font-instrument-sans)]">
              DataScope AI
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowUpload(true)}
              className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors font-[family-name:var(--font-instrument-sans)]"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-instrument-sans)]"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{user.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 py-2">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-sm font-medium text-white font-[family-name:var(--font-instrument-sans)]">
                        {user.name}
                      </p>
                      <p className="text-xs text-white/40 font-[family-name:var(--font-instrument-sans)]">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] bg-white/5 text-white/50 px-2 py-0.5 rounded-full capitalize font-[family-name:var(--font-instrument-sans)]">
                        {user.role.replace("_", " ")}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors font-[family-name:var(--font-instrument-sans)]"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold font-[family-name:var(--font-instrument-sans)]">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="text-white/40 text-sm mt-1 font-[family-name:var(--font-instrument-sans)]">
              Here&apos;s an overview of your dataset workspace
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-white text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:bg-white/90 transition-colors font-[family-name:var(--font-instrument-sans)]"
          >
            <Plus className="w-4 h-4" />
            Upload Dataset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Datasets"
            value={stats?.totalDatasets ?? totalCount}
            icon={<Database className="w-5 h-5" />}
            sublabel={`${stats?.recentUploads ?? 0} this week`}
          />
          <StatCard
            label="Storage Used"
            value={formatBytes(stats?.totalSize ?? 0)}
            icon={<HardDrive className="w-5 h-5" />}
            sublabel={`${stats?.totalRows?.toLocaleString() ?? 0} total rows`}
          />
          <StatCard
            label="Avg Quality"
            value={stats ? `${stats.avgQuality}` : "—"}
            icon={<TrendingUp className="w-5 h-5" />}
            color={
              stats
                ? stats.avgQuality >= 80
                  ? "text-emerald-400"
                  : stats.avgQuality >= 60
                    ? "text-yellow-400"
                    : "text-red-400"
                : "text-white"
            }
            sublabel="across all datasets"
          />
          <StatCard
            label="Total Columns"
            value={stats?.totalColumns?.toLocaleString() ?? "0"}
            icon={<BarChart3 className="w-5 h-5" />}
            sublabel="features tracked"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/60 font-[family-name:var(--font-instrument-sans)]">
                Quality Distribution
              </h3>
              <span className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
                {stats
                  ? `${stats.totalDatasets} datasets`
                  : "Loading..."}
              </span>
            </div>
            {stats && stats.totalDatasets > 0 ? (
              <div className="flex items-center gap-8">
                <QualityGauge score={stats.avgQuality} size="lg" />
                <div className="flex-1">
                  <MiniBarChart data={qualityDistData} />
                  <div className="flex justify-between mt-3">
                    {qualityDistData.map((d) => (
                      <div
                        key={d.label}
                        className="flex items-center gap-1.5"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: d.color }}
                        />
                        <span className="text-[10px] text-white/40 font-[family-name:var(--font-instrument-sans)]">
                          {d.label}: {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-white/20 text-sm font-[family-name:var(--font-instrument-sans)]">
                  Upload datasets to see quality metrics
                </p>
              </div>
            )}
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/60 font-[family-name:var(--font-instrument-sans)]">
                Recent Activity
              </h3>
              <Activity className="w-4 h-4 text-white/20" />
            </div>
            <ActivityFeed items={activities.slice(0, 8)} />
          </div>
        </div>

        {recentDatasets.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/60 font-[family-name:var(--font-instrument-sans)]">
                Recently Uploaded
              </h3>
              <Link
                href="#datasets"
                className="text-xs text-white/40 hover:text-white/70 transition-colors font-[family-name:var(--font-instrument-sans)]"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {recentDatasets.slice(0, 5).map((ds) => (
                <Link
                  key={ds.id}
                  href={`/dashboard/${ds.id}`}
                  className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 hover:border-white/10 transition-colors group"
                >
                  <p className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors font-[family-name:var(--font-instrument-sans)]">
                    {ds.name}
                  </p>
                  <p className="text-xs text-white/30 mt-1 font-[family-name:var(--font-instrument-sans)]">
                    {formatBytes(ds.fileSize)}
                  </p>
                  {ds.qualityScore !== null && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex-1 bg-white/5 rounded-full h-1">
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${ds.qualityScore}%`,
                            background:
                              ds.qualityScore >= 80
                                ? "#34d399"
                                : ds.qualityScore >= 60
                                  ? "#fbbf24"
                                  : "#f87171",
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-white/30 font-[family-name:var(--font-instrument-sans)]">
                        {Math.round(ds.qualityScore)}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div id="datasets">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold font-[family-name:var(--font-instrument-sans)]">
              All Datasets
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search datasets..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors font-[family-name:var(--font-instrument-sans)]"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 transition-colors font-[family-name:var(--font-instrument-sans)]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="quality_high">Quality: High</option>
              <option value="quality_low">Quality: Low</option>
            </select>
          </div>

          {uploadProgress && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-blue-400 text-sm">
              {uploadProgress}
            </div>
          )}

          {loading && datasets.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-20">
              <Database className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white/60 font-[family-name:var(--font-instrument-sans)]">
                No datasets yet
              </h3>
              <p className="text-white/30 text-sm mt-2 mb-6 font-[family-name:var(--font-instrument-sans)]">
                Upload your first dataset to get started
              </p>
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 bg-white text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:bg-white/90 transition-colors font-[family-name:var(--font-instrument-sans)]"
              >
                <Upload className="w-4 h-4" />
                Upload Dataset
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate font-[family-name:var(--font-instrument-sans)]">
                        {ds.name}
                      </h3>
                      <p className="text-white/30 text-xs mt-0.5 font-[family-name:var(--font-instrument-sans)]">
                        {ds.fileName}
                      </p>
                    </div>
                    {ds.qualityScore !== null && (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full border ${getQualityBg(ds.qualityScore)} ${getQualityColor(ds.qualityScore)}`}
                      >
                        {Math.round(ds.qualityScore)}
                      </span>
                    )}
                  </div>

                  {ds.description && (
                    <p className="text-white/40 text-sm mb-3 line-clamp-2 font-[family-name:var(--font-instrument-sans)]">
                      {ds.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {ds.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded font-[family-name:var(--font-instrument-sans)]"
                      >
                        {tag}
                      </span>
                    ))}
                    {ds.tags.length > 3 && (
                      <span className="text-xs text-white/30">
                        +{ds.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-white/30 mb-4 font-[family-name:var(--font-instrument-sans)]">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {ds.rowCount.toLocaleString()} rows
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {ds.columnCount} cols
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {formatBytes(ds.fileSize)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-xs text-white/20 flex items-center gap-1 font-[family-name:var(--font-instrument-sans)]">
                      <Clock className="w-3 h-3" />
                      {formatDate(ds.createdAt)}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/dashboard/${ds.id}`}
                        className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(ds.id, ds.name)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-6 font-[family-name:var(--font-instrument-sans)]">
              Upload Dataset
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2 font-[family-name:var(--font-instrument-sans)]">
                  File (CSV, Excel)
                </label>
                <input
                  name="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white/10 file:text-white file:text-sm file:font-medium hover:file:bg-white/20 transition-colors font-[family-name:var(--font-instrument-sans)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2 font-[family-name:var(--font-instrument-sans)]">
                  Name
                </label>
                <input
                  name="dsName"
                  type="text"
                  placeholder="Dataset name"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors font-[family-name:var(--font-instrument-sans)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2 font-[family-name:var(--font-instrument-sans)]">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Brief description..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none font-[family-name:var(--font-instrument-sans)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2 font-[family-name:var(--font-instrument-sans)]">
                  Tags (comma-separated)
                </label>
                <input
                  name="tags"
                  type="text"
                  placeholder="ml, classification, tabular"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors font-[family-name:var(--font-instrument-sans)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors font-[family-name:var(--font-instrument-sans)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-white text-black rounded-lg py-3 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 font-[family-name:var(--font-instrument-sans)]"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
