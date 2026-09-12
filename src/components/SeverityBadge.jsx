import React from "react";
import { cn } from "../utils/cn";
import { AlertTriangle, AlertOctagon, Info, ShieldAlert } from "lucide-react";

export function SeverityBadge({
  severity,
  safetyRisk = false,
  className,
  size = "md",
  showRiskLabel = false,
}) {
  const norm = (severity || "").toLowerCase();

  const configs = {
    low: {
      label: "Low Severity",
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      icon: Info,
    },
    medium: {
      label: "Medium Severity",
      bg: "bg-amber-50 text-amber-700 border-amber-200/80",
      icon: AlertTriangle,
    },
    high: {
      label: "High Severity",
      bg: "bg-orange-50 text-orange-800 border-orange-200/80",
      icon: AlertTriangle,
    },
    critical: {
      label: "Critical Hazard",
      bg: "bg-rose-50 text-rose-800 border-rose-200 font-bold",
      icon: AlertOctagon,
    },
  };

  const current = configs[norm] || configs.medium;
  const Icon = current.icon;

  const sizeStyles = {
    sm: "text-2xs px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5 font-medium",
    lg: "text-sm px-3 py-1.25 gap-2 font-semibold",
  };

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={cn(
          "inline-flex items-center rounded-lg border font-medium",
          current.bg,
          sizeStyles[size],
          className
        )}
      >
        <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5 shrink-0"} />
        <span>{current.label}</span>
      </span>

      {safetyRisk && (
        <span
          className={cn(
            "inline-flex items-center rounded-lg border bg-rose-50 text-rose-700 border-rose-200/90 font-medium",
            sizeStyles[size]
          )}
          title="Safety hazard flagged by AI"
        >
          <ShieldAlert className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5 shrink-0 text-rose-600"} />
          <span>{showRiskLabel ? "Safety Risk Flagged" : "Safety Risk"}</span>
        </span>
      )}
    </div>
  );
}
