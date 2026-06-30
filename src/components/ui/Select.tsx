"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white/70 font-[family-name:var(--font-instrument-sans)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white transition-colors focus:outline-none focus:border-white/30 font-[family-name:var(--font-instrument-sans)] ${
            error
              ? "border-red-500/50 focus:border-red-500/70"
              : "border-white/10"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-red-400 font-[family-name:var(--font-instrument-sans)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
