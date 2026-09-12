import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../utils/cn";

export function ErrorState({
  title = "Something went wrong",
  message = "Failed to load data. Please check your connection or try again.",
  onRetry,
  className,
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-rose-200 bg-rose-50/50 p-6 sm:p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6",
        className
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>

      <h3 className="text-base font-semibold text-rose-950">
        {title}
      </h3>

      <p className="text-xs text-rose-700 mt-1 max-w-xs leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="bg-white hover:bg-rose-50 border-rose-200 text-rose-800"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
