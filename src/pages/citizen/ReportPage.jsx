import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Camera, AlertCircle, Info } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { ImageUploader } from "../../components/ImageUploader";
import { LocationCard } from "../../components/LocationCard";
import { useGeolocation } from "../../hooks/useGeolocation";
import { showToast } from "../../components/Toast";

export function ReportPage() {
  const navigate = useNavigate();
  const { location, loading: geoLoading, error: geoError, detectLocation, setManualAddress } =
    useGeolocation();

  // Citizen report input state
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState(null);

  // Restore draft if user navigated back
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem("civicai_report_draft");
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.image) setImage(parsed.image);
        if (parsed.selectedSampleId) setSelectedSampleId(parsed.selectedSampleId);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.location) {
          setManualAddress(parsed.location.address, {
            lat: parsed.location.lat,
            lng: parsed.location.lng,
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }, [setManualAddress]);

  const handleImageSelected = ({ file, previewUrl }) => {
    setImage(previewUrl);
    setImageFile(file);
    setSelectedSampleId(null);
    setValidationError(null);
  };

  const handleImageRemoved = () => {
    setImage(null);
    setImageFile(null);
    setSelectedSampleId(null);
  };

  const handleSampleSelected = (sample) => {
    setImage(sample.image);
    setImageFile(null);
    setSelectedSampleId(sample.id);
    setValidationError(null);
    if (!description) {
      setDescription(sample.description);
    }
    // Also auto-populate location with sample's verified coordinates
    setManualAddress(sample.defaultAddress, { lat: sample.lat, lng: sample.lng });
    showToast({
      title: "Sample Loaded",
      message: `Selected ${sample.issueType}. Coordinates locked.`,
      type: "info",
    });
  };

  const handleProceedToAnalysis = (e) => {
    e.preventDefault();

    if (!image) {
      setValidationError("Please capture or select an image of the civic issue before proceeding.");
      return;
    }

    if (!location?.address) {
      setValidationError("Please provide or detect an incident location.");
      return;
    }

    setValidationError(null);

    const payload = {
      image,
      imageFile,
      selectedSampleId,
      description: description.trim(),
      location: {
        address: location.address,
        lat: location.lat,
        lng: location.lng,
      },
    };

    // Store in session storage for persistence across reloads
    sessionStorage.setItem("civicai_report_draft", JSON.stringify(payload));

    // Navigate to /analyze with state
    navigate("/analyze", { state: payload });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Report a Civic Issue"
        description="Provide a clear photograph and incident location. CivicAI will automatically analyze the hazard and determine responsible departments."
        backTo="/"
        backLabel="Home"
      />

      <form onSubmit={handleProceedToAnalysis} className="space-y-6">
        {/* Step 1: Image Upload */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span>Incident Photograph</span>
            </h2>
            <span className="text-xs text-rose-500 font-medium">* Required</span>
          </div>

          <ImageUploader
            image={image}
            onImageSelected={handleImageSelected}
            onImageRemoved={handleImageRemoved}
            selectedSampleId={selectedSampleId}
            onSampleSelected={handleSampleSelected}
          />
        </div>

        {/* Step 2: Location Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span>Incident Location</span>
            </h2>
            <span className="text-xs text-rose-500 font-medium">* Required</span>
          </div>

          <LocationCard
            location={location}
            loading={geoLoading}
            error={geoError}
            onDetectLocation={detectLocation}
            onManualAddressChange={(addr) => setManualAddress(addr)}
          />
        </div>

        {/* Step 3: Optional Remarks */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span>Citizen Remarks &amp; Context</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Optional</span>
          </div>

          <p className="text-xs text-slate-500 mb-2.5">
            Add any relevant context (e.g. how long it has been there, nearby landmarks, or immediate dangers).
          </p>

          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. The pothole has gotten much worse after yesterday's rain. Multiple two-wheelers nearly crashed into it."
            className="w-full text-sm bg-slate-50/70 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
        </div>

        {/* Validation error if attempted to submit without image */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Bottom CTA Bar */}
        <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-blue-600" />
            <span>AI model classifies hazard severity and jurisdictional department.</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto ml-auto px-6 font-semibold shadow-md shadow-blue-600/20"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            disabled={!image}
          >
            Analyze Issue with CivicAI
          </Button>
        </div>
      </form>
    </div>
  );
}
