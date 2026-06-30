"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Database, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Database className="w-8 h-8 text-white" />
            <span className="text-xl font-semibold text-white font-[family-name:var(--font-instrument-sans)]">
              DataScope AI
            </span>
          </Link>
          <h1 className="text-2xl font-semibold text-white font-[family-name:var(--font-instrument-sans)]">
            Welcome back
          </h1>
          <p className="text-white/50 mt-2 text-sm font-[family-name:var(--font-instrument-sans)]">
            Sign in to continue to your datasets
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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors font-[family-name:var(--font-instrument-sans)]"
                placeholder="Enter your password"
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

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/30"
              />
              <span className="text-sm text-white/50 font-[family-name:var(--font-instrument-sans)]">
                Remember me
              </span>
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-white/40 hover:text-white/70 transition-colors font-[family-name:var(--font-instrument-sans)]"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black rounded-lg py-3 font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 font-[family-name:var(--font-instrument-sans)]"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-white/40 text-sm font-[family-name:var(--font-instrument-sans)]">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-white/80 hover:text-white transition-colors underline"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
