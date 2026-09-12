import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "../utils/cn";

export function PageHeader({
  title,
  description,
  badge,
  backTo,
  backLabel = "Back",
  actions,
  className,
}) {
  const navigate = useNavigate();

  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      {backTo && (
        <button
          type="button"
          onClick={() => (typeof backTo === "string" ? navigate(backTo) : navigate(-1))}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3 group py-1 pr-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-slate-400 group-hover:text-slate-700" />
          <span>{backLabel}</span>
        </button>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="mt-1.5 text-sm sm:text-base text-slate-500 max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
