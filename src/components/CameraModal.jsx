import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, X, RefreshCw, Check, FlipHorizontal, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../utils/cn";

export function CameraModal({ isOpen, onClose, onCapture }) {
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // back camera preferred for civic hazards
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [isFlashActive, setIsFlashActive] = useState(false);

  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Stop all active tracks to turn off the camera hardware LED
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Start webcam feed
  const startCamera = useCallback(async (deviceId = null, facing = facingMode) => {
    setIsLoading(true);
    setCameraError(null);
    setCapturedImage(null);
    setCapturedBlob(null);

    // Stop previous stream if active
    stopCameraStream();
    setStream(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera capture is not supported by this browser. Please upload a photo instead.");
      setIsLoading(false);
      return;
    }

    try {
      // Find available video devices for multi-camera support
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoInputs);
      } catch {
        // Enumerate devices may fail if permissions not granted yet
      }

      let constraints = {
        audio: false,
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: facing,
              width: { ideal: 1920, max: 2560 },
              height: { ideal: 1080, max: 1440 },
            },
      };

      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback with simpler constraint if exact deviceId or high resolution fails
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      streamRef.current = newStream;
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Please allow camera access in your browser address bar.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No webcam was detected on your system. Please connect a camera and try again.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setCameraError("Webcam is currently in use by another application.");
      } else {
        setCameraError(err.message || "Failed to initialize webcam. Please verify camera permissions.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stopCameraStream]);

  // Initialize camera on open and clean up on close
  useEffect(() => {
    if (isOpen) {
      startCamera(selectedDeviceId, facingMode);
    } else {
      stopCameraStream();
      setStream(null);
      setCapturedImage(null);
      setCapturedBlob(null);
      setCameraError(null);
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, selectedDeviceId, facingMode, startCamera, stopCameraStream]);

  // When videoRef attaches, bind stream
  useEffect(() => {
    if (videoRef.current && stream && !capturedImage) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, capturedImage]);

  // Capture snapshot from the live video element
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    // Trigger flash animation
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const canvas = canvasRef.current || document.createElement("canvas");
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    // Mirror horizontal only if using user/front facing camera
    const isFrontCamera = facingMode === "user";
    if (isFrontCamera) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);

    canvas.toBlob(
      (blob) => {
        setCapturedBlob(blob);
      },
      "image/jpeg",
      0.92
    );
  };

  // Retake photo: discard current snapshot and return to video stream
  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    } else {
      startCamera(selectedDeviceId, facingMode);
    }
  };

  // Confirm photo: convert to File object and invoke onCapture
  const handleConfirm = () => {
    if (!capturedImage) return;

    const fileName = `civic-hazard-${Date.now()}.jpg`;
    let file;

    if (capturedBlob) {
      file = new File([capturedBlob], fileName, { type: "image/jpeg" });
    } else {
      // Fallback: convert dataURL to Blob
      const arr = capturedImage.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      file = new File([blob], fileName, { type: "image/jpeg" });
    }

    stopCameraStream();
    onCapture({
      file,
      previewUrl: capturedImage,
      name: fileName,
    });
    onClose();
  };

  // Toggle front/back camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(null, nextMode);
  };

  // Cycle through detected video devices if multiple exist
  const handleSwitchDevice = () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    setSelectedDeviceId(nextDevice.deviceId);
    startCamera(nextDevice.deviceId, facingMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Hidden Canvas used for frame extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Shutter flash overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 z-30",
            isFlashActive ? "opacity-90" : "opacity-0"
          )}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Capture Civic Issue</h3>
              <p className="text-2xs text-slate-400">Position the civic hazard clearly within the frame</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch Camera Button (if multiple devices exist or mobile) */}
            {!capturedImage && (devices.length > 1 || navigator.maxTouchPoints > 0) && (
              <button
                type="button"
                onClick={devices.length > 1 ? handleSwitchDevice : handleToggleFacingMode}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Switch Camera"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Video Area */}
        <div className="relative w-full aspect-4/3 sm:aspect-16/10 bg-black flex items-center justify-center overflow-hidden select-none">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/90">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs font-medium text-slate-300">Accessing camera...</p>
            </div>
          )}

          {cameraError ? (
            <div className="p-6 text-center max-w-md flex flex-col items-center gap-3 z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Camera Access Error</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cameraError}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startCamera(selectedDeviceId, facingMode)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="mt-2 text-white border-slate-700 bg-slate-800 hover:bg-slate-700"
              >
                Try Again
              </Button>
            </div>
          ) : capturedImage ? (
            /* Review captured photo */
            <div className="relative w-full h-full">
              <img
                src={capturedImage}
                alt="Captured civic hazard"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-3 left-3 bg-emerald-500/90 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5 shadow-md">
                <Check className="w-3.5 h-3.5" />
                Photo Captured
              </div>
            </div>
          ) : (
            /* Live camera stream */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "w-full h-full object-cover",
                  facingMode === "user" && "scale-x-[-1]"
                )}
              />

              {/* Viewfinder Framing Grid & Target Corners */}
              <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-2xl">
                {/* Corner accents */}
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-xl" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-xl" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-xl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-xl" />

                {/* Subtle center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="w-6 h-0.5 bg-white/60" />
                  <div className="h-6 w-0.5 bg-white/60 -ml-3.25" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          {capturedImage ? (
            <div className="w-full flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={handleRetake}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
              >
                Retake
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleConfirm}
                leftIcon={<Check className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25"
              >
                Use This Photo
              </Button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <div className="text-2xs text-slate-400 hidden sm:block">
                Press shutter to capture incident photo
              </div>

              {/* Centered Shutter Button */}
              <div className="flex-1 flex justify-center">
                <button
                  type="button"
                  disabled={isLoading || !!cameraError}
                  onClick={handleCapture}
                  className="group relative w-16 h-16 rounded-full border-4 border-white/80 p-1 flex items-center justify-center hover:border-white transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer active:scale-95 shadow-lg shadow-black/40"
                  title="Capture photo"
                >
                  <div className="w-full h-full rounded-full bg-white group-hover:bg-blue-500 transition-colors duration-150 flex items-center justify-center shadow-inner">
                    <Camera className="w-6 h-6 text-slate-900 group-hover:text-white transition-colors" />
                  </div>
                </button>
              </div>

              <div className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    stopCameraStream();
                    onClose();
                  }}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
