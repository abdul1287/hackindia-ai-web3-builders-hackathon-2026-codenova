import React from "react";
import { Check, Clock, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { formatDate, formatTimelineDate } from "../utils/formatters";
import { cn } from "../utils/cn";

export function ComplaintTimeline({ timeline = [], currentStatus = "SUBMITTED", className }) {
  const STAGES = [
    { key: "SUBMITTED", label: "Submitted", desc: "Citizen complaint registered & AI routed" },
    { key: "ASSIGNED", label: "Assigned", desc: "Jurisdiction confirmed & crew notified" },
    { key: "IN_PROGRESS", label: "In Progress", desc: "Inspection active or repair crew on-site" },
    { key: "RESOLVED", label: "Resolved", desc: "Work completed, inspected and verified" },
  ];

  const statusOrder = {
    SUBMITTED: 0,
    ASSIGNED: 1,
    IN_PROGRESS: 2,
    RESOLVED: 3,
  };

  const currentIndex = statusOrder[currentStatus] ?? 0;

  // Map logged timeline events by stage key if present
  const eventsByStage = {};
  timeline.forEach((item) => {
    const stageKey = (item.stage || "").toUpperCase();
    eventsByStage[stageKey] = item;
  });

  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;
          const stageEvent = eventsByStage[stage.key];

          return (
            <div key={stage.key} className="relative pb-7 last:pb-0 group">
              {/* Marker Indicator */}
              <div
                className={cn(
                  "absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                  isDone && "bg-blue-600 border-blue-600 text-white shadow-2xs",
                  isCurrent && stage.key === "RESOLVED" && "bg-emerald-600 border-emerald-600 text-white ring-4 ring-emerald-100 animate-pulse",
                  isCurrent && stage.key !== "RESOLVED" && "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100",
                  isPending && "bg-white border-slate-300 text-slate-400"
                )}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : isCurrent ? (
                  stage.key === "RESOLVED" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  )
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>

              {/* Content Box */}
              <div
                className={cn(
                  "rounded-xl p-3.5 transition-all border",
                  isCurrent
                    ? "bg-blue-50/50 border-blue-200/80 shadow-2xs"
                    : isDone
                    ? "bg-white border-slate-200/60"
                    : "bg-slate-50/50 border-transparent opacity-60"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isCurrent
                          ? "text-blue-900"
                          : isDone
                          ? "text-slate-900"
                          : "text-slate-500"
                      )}
                    >
                      {stage.label}
                    </span>

                    {isCurrent && (
                      <span className="inline-flex items-center text-2xs px-2 py-0.5 rounded-full font-semibold bg-blue-600 text-white">
                        Current Stage
                      </span>
                    )}
                  </div>

                  {(stageEvent?.timestamp || (isCurrent && timeline[timeline.length - 1]?.timestamp)) && (
                    <div className="flex items-center gap-1 text-2xs text-slate-500 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimelineDate(stageEvent?.timestamp || timeline[timeline.length - 1]?.timestamp)}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {stageEvent?.description || stage.desc}
                </p>

                {stageEvent?.actor && (
                  <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center gap-1.5 text-2xs text-slate-500">
                    <span className="font-medium text-slate-700">Handled by:</span>
                    <span>{stageEvent.actor}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
