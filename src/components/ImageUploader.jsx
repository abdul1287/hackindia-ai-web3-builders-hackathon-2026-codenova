import React, { useState, useRef } from "react";
import { Camera, Upload, X, RefreshCw, CheckCircle2, Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "./Button";
import { CameraModal } from "./CameraModal";
import { cn } from "../utils/cn";
import { SAMPLE_CIVIC_ISSUES } from "../utils/aiAnalyzer";
import { compressImage } from "../utils/imageCompressor";

export function ImageUploader({
  image,
  onImageSelected,
  onImageRemoved,
  selectedSampleId,
  onSampleSelected,
  className,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = async (file) => {
    setUploadError(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Image size exceeds 15MB limit. Please choose a smaller photo.");
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file, 1200, 900, 0.78);
      onImageSelected({
        file,
        previewUrl: compressedDataUrl,
        name: file.name,
      });
    } catch (err) {
      console.warn("Compression fallback:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageSelected({
          file,
          previewUrl: e.target.result,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Main Upload Box / Preview */}
      {image ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm group">
          <img
            src={image}
            alt="Civic Issue Preview"
            className="w-full h-64 sm:h-72 object-cover object-center transition-transform duration-300 group-hover:scale-101"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-md shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Photo Loaded
            </span>

            <button
              type="button"
              onClick={onImageRemoved}
              className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md transition-colors shadow-sm cursor-pointer"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <p className="text-xs text-slate-200 font-medium truncate max-w-[200px]">
              Ready for AI Inspection
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsCameraOpen(true)}
                className="bg-white/90 hover:bg-white text-slate-900 border-none backdrop-blur-md shadow-xs"
                leftIcon={<Camera className="w-3.5 h-3.5" />}
              >
                Retake
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/90 hover:bg-white text-slate-900 border-none backdrop-blur-md shadow-xs"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Replace
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative rounded-2xl border-2 border-dashed transition-all duration-200 p-6 sm:p-8 text-center flex flex-col items-center justify-center cursor-pointer group bg-white",
            isDragging
              ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
              : "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3.5 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
            <Camera className="w-7 h-7" />
          </div>

          <h3 className="text-base font-semibold text-slate-900">
            Take or Upload a Civic Issue Photo
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
            Drag and drop an image here, or snap a photo directly from your device camera.
          </p>

          <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Camera className="w-4 h-4" />}
              onClick={() => setIsCameraOpen(true)}
            >
              Take Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Photo
            </Button>
          </div>

          <p className="text-2xs text-slate-400 mt-3">
            Supports JPG, PNG, WEBP up to 12MB
          </p>
        </div>
      )}

      {/* Live Webcam Capture Viewfinder Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={onImageSelected}
      />

      {uploadError && (
        <p className="text-xs text-rose-600 font-medium px-1">
          {uploadError}
        </p>
      )}

      {/* Preset Demo Samples Carousel / Picker */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Or test with a demo civic issue:</span>
          </div>
          <span className="text-2xs text-slate-600 font-medium">1-click demo</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_CIVIC_ISSUES.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSampleSelected(sample)}
                className={cn(
                  "p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all duration-150 cursor-pointer",
                  isSelected
                    ? "border-blue-600 bg-blue-50/70 shadow-2xs ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                )}
              >
                <img
                  src={sample.thumb}
                  alt={sample.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {sample.issueType}
                  </p>
                  <p className="text-2xs text-slate-600 truncate">
                    {sample.category}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
