"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Database, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
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
            Reset your password
          </h1>
          <p className="text-white/50 mt-2 text-sm font-[family-name:var(--font-instrument-sans)]">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {success ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-medium text-white mb-2 font-[family-name:var(--font-instrument-sans)]">
              Check your email
            </h2>
            <p className="text-white/40 text-sm mb-6 font-[family-name:var(--font-instrument-sans)]">
              If an account exists for {email}, we&apos;ve sent a password
              reset link.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors font-[family-name:var(--font-instrument-sans)]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black rounded-lg py-3 font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 font-[family-name:var(--font-instrument-sans)]"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <p className="text-center text-white/40 text-sm font-[family-name:var(--font-instrument-sans)]">
              <Link
                href="/auth/login"
                className="text-white/80 hover:text-white transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
