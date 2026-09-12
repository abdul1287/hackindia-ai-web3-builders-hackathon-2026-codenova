import React from "react";
import { cn } from "../utils/cn";
import { Clock, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export function StatusBadge({ status, className, size = "md", showIcon = true }) {
  const normStatus = (status || "").toUpperCase();

  const configs = {
    SUBMITTED: {
      label: "Submitted",
      bg: "bg-blue-50 text-blue-700 border-blue-200/70",
      dot: "bg-blue-500",
      icon: Clock,
    },
    ASSIGNED: {
      label: "Assigned",
      bg: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
      dot: "bg-indigo-500",
      icon: Clock,
    },
    IN_PROGRESS: {
      label: "In Progress",
      bg: "bg-amber-50 text-amber-700 border-amber-200/80",
      dot: "bg-amber-500 animate-pulse",
      icon: RefreshCw,
    },
    RESOLVED: {
      label: "Resolved",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
    },
    REJECTED: {
      label: "Closed",
      bg: "bg-slate-100 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
      icon: AlertCircle,
    },
  };

  const current = configs[normStatus] || {
    label: status || "Unknown",
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    icon: Clock,
  };

  const Icon = current.icon;

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 gap-1 font-medium",
    md: "text-xs px-2.5 py-1 gap-1.5 font-semibold",
    lg: "text-sm px-3 py-1.5 gap-2 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border transition-colors select-none",
        current.bg,
        sizeStyles[size],
        className
      )}
    >
      {showIcon ? (
        <Icon className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5", normStatus === "IN_PROGRESS" && "animate-spin-slow")} />
      ) : (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", current.dot)} />
      )}
      <span>{current.label}</span>
    </span>
  );
}
