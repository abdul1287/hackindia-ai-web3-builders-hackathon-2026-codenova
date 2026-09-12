import React from "react";
import { cn } from "../utils/cn";
import { Loader2 } from "lucide-react";

export const Button = React.forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl select-none disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 active:scale-[0.98]";

    const variants = {
      primary:
        "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:bg-blue-800",
      secondary:
        "bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200/80 active:bg-slate-200",
      outline:
        "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs hover:border-slate-400 active:bg-slate-100",
      ghost:
        "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200",
      destructive:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:bg-rose-800",
      success:
        "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:bg-emerald-800",
      subtle:
        "bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 border border-blue-200/60",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5 font-medium",
      md: "text-sm px-4 py-2.25 gap-2",
      lg: "text-base px-5 py-2.75 gap-2.5 font-semibold",
      icon: "p-2 aspect-square",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
