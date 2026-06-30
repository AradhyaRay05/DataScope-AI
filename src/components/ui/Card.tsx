"use client";

import { forwardRef, type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "active";
  padding?: "none" | "sm" | "md" | "lg";
}

const VARIANTS = {
  default: "bg-white/[0.03] border border-white/[0.06]",
  hover:
    "bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors",
  active:
    "bg-white/[0.05] border border-white/10",
};

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = "default", padding = "md", className = "", children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl ${VARIANTS[variant]} ${PADDING[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
