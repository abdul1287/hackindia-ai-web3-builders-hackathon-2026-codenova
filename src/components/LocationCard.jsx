import React, { useState } from "react";
import { MapPin, Navigation, Edit3, Check, Compass, AlertCircle } from "lucide-react";
import { Button } from "./Button";
import { formatCoordinates } from "../utils/formatters";
import { cn } from "../utils/cn";

export function LocationCard({
  location,
  loading = false,
  error = null,
  onDetectLocation,
  onManualAddressChange,
  className,
  readOnly = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempAddress, setTempAddress] = useState(location?.address || "");

  const handleSave = () => {
    if (tempAddress.trim()) {
      onManualAddressChange(tempAddress.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setTempAddress(location?.address || "");
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 leading-tight">
              Incident Location
            </h4>
            <p className="text-2xs text-slate-500">
              {location?.isManual ? "Manual address" : "GPS geocoded"}
            </p>
          </div>
        </div>

        {!readOnly && onDetectLocation && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={loading}
            onClick={onDetectLocation}
            leftIcon={<Navigation className="w-3.5 h-3.5 text-blue-600" />}
            className="text-xs"
          >
            Use My Location
          </Button>
        )}
      </div>

      {/* Address Block */}
      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 mb-3">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={tempAddress}
              onChange={(e) => setTempAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Sector 62, Near Metro Station, Noida"
              className="w-full text-sm bg-white border border-blue-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTempAddress(location?.address || "");
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSave}
                leftIcon={<Check className="w-3 h-3" />}
              >
                Apply
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 leading-relaxed">
                {location?.address || "Location not specified yet"}
              </p>
              <div className="flex items-center gap-2 mt-1 text-2xs text-slate-500 font-mono">
                <Compass className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{formatCoordinates(location?.lat, location?.lng)}</span>
                {location?.accuracy && (
                  <span className="text-slate-400">(&plusmn;{location.accuracy}m)</span>
                )}
              </div>
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  setTempAddress(location?.address || "");
                  setIsEditing(true);
                }}
                className="text-xs text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1 p-1 hover:bg-white rounded-md transition-colors cursor-pointer shrink-0"
                title="Edit address manually"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Styled Mini Map Mockup */}
      <div className="relative h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 flex items-center justify-center">
        {/* Subtle grid lines mimicking a map */}
        <div 
          className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" 
        />
        {/* Decorative road vector paths */}
        <svg className="absolute inset-0 w-full h-full stroke-slate-300 stroke-2 opacity-70" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="40%" x2="100%" y2="40%" strokeWidth="6" stroke="#e2e8f0" />
          <line x1="0" y1="40%" x2="100%" y2="40%" strokeDasharray="6,6" stroke="#94a3b8" />
          <line x1="45%" y1="0" x2="45%" y2="100%" strokeWidth="8" stroke="#e2e8f0" />
          <path d="M 20 80 Q 120 10 280 60 T 450 70" fill="transparent" stroke="#cbd5e1" strokeWidth="4" />
        </svg>

        {/* Civic pin marker with ripple effect */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="absolute -inset-2 rounded-full bg-blue-500/20 animate-ping" />
          <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-2xs font-semibold px-2 py-0.5 mt-1 bg-white/95 backdrop-blur-md rounded shadow-2xs border border-slate-200 text-slate-800">
            GPS Locked
          </span>
        </div>
      </div>
    </div>
  );
}
