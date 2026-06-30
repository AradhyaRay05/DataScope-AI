"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Database, Eye, EyeOff } from "lucide-react";

const ROLES = [
  { value: "student", label: "Student", desc: "Learning data science or ML" },
  { value: "ml_engineer", label: "ML Engineer", desc: "Building ML systems" },
  { value: "data_scientist", label: "Data Scientist", desc: "Analyzing data for insights" },
  { value: "researcher", label: "Researcher", desc: "Academic or industrial research" },
  { value: "analyst", label: "Analyst", desc: "Business data analysis" },
  { value: "educator", label: "Educator", desc: "Teaching data science courses" },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, name, password, role);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Database className="w-8 h-8 text-white" />
            <span className="text-xl font-semibold text-white font-[family-name:var(--font-instrument-sans)]">
              DataScope AI
            </span>
          </Link>
          <h1 className="text-2xl font-semibold text-white font-[family-name:var(--font-instrument-sans)]">
            Create your account
          </h1>
          <p className="text-white/50 mt-2 text-sm font-[family-name:var(--font-instrument-sans)]">
            Start analyzing datasets in seconds
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 space-y-5"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2 font-[family-name:var(--font-instrument-sans)]">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    role === r.value
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-white/[0.02] border-white/5 text-white/50 hover:border-white/10"
                  }`}
                >
                  <span className="font-medium block font-[family-name:var(--font-instrument-sans)]">
                    {r.label}
                  </span>
                  <span className="text-[10px] text-white/30 font-[family-name:var(--font-instrument-sans)]">
                    {r.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2 font-[family-name:var(--font-instrument-sans)]">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors font-[family-name:var(--font-instrument-sans)]"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2 font-[family-name:var(--font-instrument-sans)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors font-[family-name:var(--font-instrument-sans)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2 font-[family-name:var(--font-instrument-sans)]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors font-[family-name:var(--font-instrument-sans)]"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black rounded-lg py-3 font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 font-[family-name:var(--font-instrument-sans)]"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-white/40 text-sm font-[family-name:var(--font-instrument-sans)]">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-white/80 hover:text-white transition-colors underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
