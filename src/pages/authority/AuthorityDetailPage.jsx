import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Sparkles,
  ArrowLeft,
  FileCheck2,
  Truck,
  RotateCcw,
  Camera,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";
import { LocationCard } from "../../components/LocationCard";
import { ComplaintTimeline } from "../../components/ComplaintTimeline";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { showToast } from "../../components/Toast";
import { formatDate } from "../../utils/formatters";
import { useAuthorityAuth, matchesDepartment } from "../../context/AuthorityAuthContext";
import * as api from "../../services/api";

export function AuthorityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { departmentName } = useAuthorityAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authority action state
  const [selectedStatus, setSelectedStatus] = useState("IN_PROGRESS");
  const [authorityNote, setAuthorityNote] = useState("");
  const [resolutionImage, setResolutionImage] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getComplaintById(id)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setComplaint(res.data);
          if (res.data.resolutionImage || res.data.resolution_image_url) {
            setResolutionImage(res.data.resolutionImage || res.data.resolution_image_url);
          }
          // Suggest next logical status
          if (res.data.status === "SUBMITTED") setSelectedStatus("IN_PROGRESS");
          else if (res.data.status === "IN_PROGRESS") setSelectedStatus("RESOLVED");
          else setSelectedStatus(res.data.status);
        } else {
          setError(res.error || `Complaint with ID "${id}" was not found.`);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to retrieve complaint details.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast({
        title: "Invalid File",
        message: "Please select an image file (JPG, PNG, WEBP).",
        type: "error",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setResolutionImage(event.target.result);
      showToast({
        title: "Proof Photo Ready",
        message: "Ground resolution photograph attached.",
        type: "success",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!complaint) return;

    setUpdating(true);
    try {
      const res = await api.updateComplaintStatus(
        complaint.id,
        selectedStatus,
        authorityNote.trim(),
        resolutionImage
      );

      if (res.success && res.data) {
        setComplaint(res.data);
        setAuthorityNote("");

        showToast({
          title: "Status Updated",
          message: `Ticket ${complaint.id} updated to ${selectedStatus}${resolutionImage ? " with photographic proof" : ""}. Citizen tracker notified.`,
          type: "success",
        });
      } else {
        showToast({
          title: "Update Failed",
          message: res.error || "Could not update ticket status.",
          type: "error",
        });
      }
    } catch (err) {
      showToast({
        title: "Error",
        message: err.message,
        type: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading authority ticket dossier..." />;
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto pt-8">
        <ErrorState
          title="Case Dossier Not Found"
          message={error || `Could not find complaint "${id}".`}
          onRetry={() => navigate("/authority")}
        />
      </div>
    );
  }

  // Department Authorization Check
  if (!matchesDepartment(complaint, departmentName)) {
    return (
      <div className="max-w-2xl mx-auto pt-8">
        <ErrorState
          title="Department Access Restricted"
          message={`Ticket ${complaint.id} is assigned to ${complaint.authority}. You are currently authenticated under ${departmentName}.`}
          actionLabel="Back to Authorized Dashboard"
          onAction={() => navigate("/authority")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title={`Operations Dossier: ${complaint.id}`}
        badge={<StatusBadge status={complaint.status} size="md" />}
        description={`Reported: ${formatDate(complaint.createdAt)} &bull; ${complaint.authority}`}
        backTo="/authority"
        backLabel="Authority Dashboard"
        actions={
          <div className="flex items-center gap-2">
            <Link to={`/complaints/${complaint.id}`}>
              <Button variant="outline" size="sm">
                View Citizen View
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Complaint & AI Diagnostics */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Case Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  {complaint.issueType}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {complaint.category}
                </span>
              </div>

              <SeverityBadge
                severity={complaint.severity}
                safetyRisk={complaint.safetyRisk}
                size="md"
                showRiskLabel
              />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {complaint.title}
              </h2>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                {complaint.description}
              </p>
            </div>

            {complaint.citizenNotes && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs">
                <span className="text-2xs font-bold uppercase tracking-wider text-amber-800 block mb-1">
                  Citizen Context Statement:
                </span>
                <p className="text-amber-900 italic">
                  "{complaint.citizenNotes}"
                </p>
              </div>
            )}
          </div>

          {/* Photographic Evidence & AI Diagnostics */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                AI Vision Evidence Verification
              </h3>
              {complaint.aiMetadata?.confidenceScore && (
                <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Model Confidence: {Math.round(complaint.aiMetadata.confidenceScore * 100)}%
                </span>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video relative group">
              <img
                src={complaint.image}
                alt="Case Evidence"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 text-white text-xs flex items-center justify-between">
                <span className="font-semibold">{complaint.issueType}</span>
                <span className="font-mono text-2xs text-slate-300">
                  {complaint.location?.address}
                </span>
              </div>
            </div>

            {complaint.aiMetadata?.tags && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {complaint.aiMetadata.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-2xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Published Ground Resolution Proof Card */}
          {(complaint.resolutionImage || complaint.resolution_image_url) && (
            <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ground Resolution Proof Published</span>
                </h3>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Citizen-Visible Audit Proof
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video relative group">
                <img
                  src={complaint.resolutionImage || complaint.resolution_image_url}
                  alt="Ground Resolution Proof"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs flex items-center justify-between">
                  <span className="font-semibold text-emerald-400">Remediation Completed</span>
                  <span className="font-mono text-2xs text-slate-300">
                    {formatDate(complaint.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Location Details */}
          <LocationCard location={complaint.location} readOnly={true} />
        </div>

        {/* Right Column: Authority Action Panel & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Update Control Panel */}
          <div className="bg-white rounded-2xl border-2 border-blue-600/30 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Authority Action &amp; Status Control
              </h3>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Update Resolution Stage:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("SUBMITTED")}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      selectedStatus === "SUBMITTED"
                        ? "bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Submitted
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatus("IN_PROGRESS")}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      selectedStatus === "IN_PROGRESS"
                        ? "bg-amber-50 border-amber-600 text-amber-800 ring-1 ring-amber-600"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatus("RESOLVED")}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      selectedStatus === "RESOLVED"
                        ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-1 ring-emerald-600"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Field Officer Dispatch Note (Public Audit Log):
                </label>
                <textarea
                  rows={3}
                  value={authorityNote}
                  onChange={(e) => setAuthorityNote(e.target.value)}
                  placeholder={
                    selectedStatus === "IN_PROGRESS"
                      ? "e.g. Field inspection completed. Asphalt patching team #3 dispatched with road roller."
                      : selectedStatus === "RESOLVED"
                      ? "e.g. Cold-mix patch laid and levelled. Inspected and approved by Ward Supervisor."
                      : "Add internal officer note..."
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Resolution Photographic Proof Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Resolution Proof Photograph</span>
                  </label>
                  {selectedStatus === "RESOLVED" && (
                    <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Citizen Verification Proof
                    </span>
                  )}
                </div>

                {resolutionImage ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950 group">
                    <img
                      src={resolutionImage}
                      alt="Resolution Proof"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setResolutionImage("")}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                      <span className="text-2xs font-semibold px-2.5 py-1 rounded-md bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolution Proof Attached</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition-all text-center group">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 mb-1 transition-colors" />
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-900">
                        Upload Completed Work Photo
                      </span>
                      <span className="text-2xs text-slate-400 mt-0.5">
                        Capture with phone camera or select file (JPG, PNG)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>

                    {/* Quick Demo Presets for Live Hackathon Judging */}
                    <div className="pt-1">
                      <span className="text-2xs text-slate-400 block mb-1">
                        Or select quick demonstration sample proof:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 text-2xs">
                        <button
                          type="button"
                          onClick={() => setResolutionImage("https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=800&q=80")}
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 rounded-lg text-slate-600 font-medium text-center truncate border border-slate-200 transition-colors cursor-pointer"
                          title="Repaved Asphalt Patch"
                        >
                          Fresh Asphalt Patch
                        </button>
                        <button
                          type="button"
                          onClick={() => setResolutionImage("https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80")}
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 rounded-lg text-slate-600 font-medium text-center truncate border border-slate-200 transition-colors cursor-pointer"
                          title="Cleaned Sidewalk"
                        >
                          Cleared Waste Area
                        </button>
                        <button
                          type="button"
                          onClick={() => setResolutionImage("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80")}
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 rounded-lg text-slate-600 font-medium text-center truncate border border-slate-200 transition-colors cursor-pointer"
                          title="Repaired Streetlight"
                        >
                          Fixed Streetlight
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant={selectedStatus === "RESOLVED" ? "success" : "primary"}
                size="md"
                isLoading={updating}
                leftIcon={<Send className="w-4 h-4" />}
                className="w-full font-bold shadow-sm"
              >
                Apply Status Change
              </Button>
            </form>
          </div>

          {/* Audit Trail & Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Action Audit Log
              </h3>
              <StatusBadge status={complaint.status} size="sm" />
            </div>

            <ComplaintTimeline
              timeline={complaint.timeline || []}
              currentStatus={complaint.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
