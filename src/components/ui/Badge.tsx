"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

const VARIANTS = {
  default: "bg-white/5 text-white/60 border-white/10",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full font-[family-name:var(--font-instrument-sans)] ${
        VARIANTS[variant]
      } ${size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}
    >
      {children}
    </span>
  );
}
