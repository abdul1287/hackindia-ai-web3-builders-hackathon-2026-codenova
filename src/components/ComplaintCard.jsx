import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Building2, Calendar, ArrowRight, Camera } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";
import { formatRelativeTime } from "../utils/formatters";
import { cn } from "../utils/cn";

export function ComplaintCard({ complaint, linkPrefix = "/complaints", className }) {
  if (!complaint) return null;

  return (
    <Link
      to={`${linkPrefix}/${complaint.id}`}
      className={cn(
        "group block bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all duration-200 relative overflow-hidden",
        className
      )}
    >
      {/* High severity subtle accent strip */}
      {(complaint.severity === "High" || complaint.severity === "Critical") && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 group-hover:w-1.5 transition-all" />
      )}

      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Thumbnail */}
        {complaint.image && (
          <div className="w-full sm:w-28 h-36 sm:h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/70 relative">
            <img
              src={complaint.image}
              alt={complaint.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <span className="absolute bottom-1.5 left-1.5 text-2xs font-mono font-medium px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white">
              {complaint.issueType}
            </span>
          </div>
        )}

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
          <div>
            {/* Top row: ID + Status + Severity */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                  {complaint.id}
                </span>
                <span className="text-2xs text-slate-400 font-medium hidden sm:inline">&bull;</span>
                <span className="text-xs text-slate-500 font-medium truncate max-w-[140px]">
                  {complaint.category}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {(complaint.status === "RESOLVED" || complaint.resolutionImage) && (
                  <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Camera className="w-3 h-3 text-emerald-600" />
                    <span>Photo Proof</span>
                  </span>
                )}
                <SeverityBadge severity={complaint.severity} safetyRisk={complaint.safetyRisk} size="sm" />
                <StatusBadge status={complaint.status} size="sm" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1.5">
              {complaint.title}
            </h3>

            {/* Description preview */}
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
              {complaint.description}
            </p>
          </div>

          {/* Footer row: Authority, Location, Time */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-2xs text-slate-500 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 text-slate-600">
                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-[180px] font-medium">{complaint.authority}</span>
              </div>

              <div className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-[180px]">{complaint.location?.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{formatRelativeTime(complaint.createdAt)}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
