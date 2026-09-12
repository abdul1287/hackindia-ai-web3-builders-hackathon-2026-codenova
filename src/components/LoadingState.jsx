import React from "react";
import { Loader2, Sparkles, Cpu, Scan } from "lucide-react";
import { cn } from "../utils/cn";

export function LoadingState({
  variant = "default",
  message = "Loading data...",
  subtext,
  className,
}) {
  if (variant === "ai-scanning") {
    return (
      <div
        className={cn(
          "rounded-3xl border border-blue-200/80 bg-gradient-to-b from-blue-50/50 to-white p-8 sm:p-12 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-sm",
          className
        )}
      >
        {/* Animated radar rings */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
          <span className="absolute inset-2 rounded-full border border-blue-400/30 animate-pulse-ring" />
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 relative z-10">
            <Cpu className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          <span>CivicAI Computer Vision Engine</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {message}
        </h3>
        
        {subtext && (
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            {subtext}
          </p>
        )}

        {/* Real-time scanning progress ticks */}
        <div className="mt-6 flex items-center gap-1.5 text-2xs text-slate-600 font-mono">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span>Analyzing visual tensors &amp; municipal boundary polygons...</span>
        </div>
      </div>
    );
  }

  // Skeleton variant
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4 animate-pulse", className)}>
        <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
        <div className="h-28 bg-slate-200 rounded-2xl w-full" />
        <div className="h-28 bg-slate-200 rounded-2xl w-full" />
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn("py-12 flex flex-col items-center justify-center text-center", className)}>
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
      <p className="text-sm font-medium text-slate-700">{message}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
}
