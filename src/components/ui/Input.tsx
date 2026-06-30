"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white/70 font-[family-name:var(--font-instrument-sans)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 transition-colors focus:outline-none focus:border-white/30 font-[family-name:var(--font-instrument-sans)] ${
              error
                ? "border-red-500/50 focus:border-red-500/70"
                : "border-white/10"
            } ${icon ? "pl-10" : ""} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400 font-[family-name:var(--font-instrument-sans)]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-white/30 font-[family-name:var(--font-instrument-sans)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
