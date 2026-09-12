import React from "react";
import { FolderSearch, PlusCircle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../utils/cn";

export function EmptyState({
  title = "No complaints found",
  description = "There are no complaints matching your current filters or search criteria.",
  icon: Icon = FolderSearch,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = PlusCircle,
  className,
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mb-3.5 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 tracking-tight">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onAction}
            leftIcon={<ActionIcon className="w-4 h-4" />}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
