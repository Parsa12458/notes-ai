"use client";

import React from "react";

const variantStyles = {
  purple: "bg-primary-50 text-primary-700 border-primary-200/80",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  amber: "bg-amber-50 text-amber-700 border-amber-200/80",
  rose: "bg-rose-50 text-rose-700 border-rose-200/80",
  neutral: "bg-gray-100/80 text-gray-700 border-gray-200/80",
  blue: "bg-blue-50 text-blue-700 border-blue-200/80",
};

const dotColors = {
  purple: "bg-primary-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  neutral: "bg-gray-400",
  blue: "bg-blue-500",
};

export default function DevignerBadge({
  children,
  variant = "purple",
  size = "md",
  dot = false,
  count,
  className = "",
}) {
  const sizeStyles =
    size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all duration-200 ${variantStyles[variant] || variantStyles.purple} ${sizeStyles} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.purple} animate-pulse`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
      {count !== undefined && count !== null && (
        <span className="font-mono text-[10px] px-1 py-0.2 rounded-full bg-white/70 border border-black/5 opacity-80">
          {count}
        </span>
      )}
    </span>
  );
}
