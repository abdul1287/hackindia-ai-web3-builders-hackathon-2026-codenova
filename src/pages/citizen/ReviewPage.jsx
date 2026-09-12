import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Send,
  Building2,
  MapPin,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { SeverityBadge } from "../../components/SeverityBadge";
import { showToast } from "../../components/Toast";
import * as api from "../../services/api";

export function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve payload from location or draft
  const draftData = location.state || (() => {
    try {
      const draft = sessionStorage.getItem("civicai_report_draft");
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  })();

  const ai = draftData?.aiAnalysis;

  // Editable complaint fields
  const [title, setTitle] = useState(ai?.suggestedTitle || "Civic Hazard Report");
  const [description, setDescription] = useState(
    ai?.suggestedDescription || draftData?.description || "Civic issue detected on municipal property."
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!draftData?.image || !ai) {
      navigate("/report", { replace: true });
    }
  }, [draftData, ai, navigate]);

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please provide a title for the complaint.");
      return;
    }

    if (!description.trim()) {
      setError("Please provide a description of the issue.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const complaintPayload = {
        issueType: ai.issueType,
        title: title.trim(),
        category: ai.category,
        severity: ai.severity,
        safetyRisk: ai.safetyRisk,
        authority: ai.authority,
        location: draftData.location,
        description: description.trim(),
        citizenNotes: draftData.description || "",
        image: ai?.image || draftData.image,
        aiMetadata: {
          confidenceScore: ai.confidenceScore || 0.96,
          tags: ai.tags || ["AI-Generated", "Verified"],
        },
      };

      const res = await api.createComplaint(complaintPayload);

      if (res.success && res.data) {
        // Clear active draft from sessionStorage
        sessionStorage.removeItem("civicai_report_draft");

        showToast({
          title: "Complaint Registered",
          message: `Case ${res.data.id} has been submitted to ${ai.authority}.`,
          type: "success",
        });

        // Navigate directly to the complaint details view
        navigate(`/complaints/${res.data.id}`);
      } else {
        setError(res.error || "Failed to submit complaint.");
        setSubmitting(false);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred during submission.");
      setSubmitting(false);
    }
  };

  if (!draftData || !ai) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Review &amp; Submit Complaint"
        description="Verify the AI-generated complaint details. You can customize the title and description before official municipal submission."
        backTo="/analyze"
        backLabel="AI Analysis"
      />

      <form onSubmit={handleSubmitComplaint} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Evidence Photo & Municipal Routing (Read-only metadata) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Image Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 block">
                Evidence Photograph
              </span>
              <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-950">
                <img
                  src={draftData.image}
                  alt="Incident Evidence"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-2xs font-mono font-semibold bg-black/70 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                  {ai.issueType}
                </span>
              </div>
            </div>

            {/* Target Authority Info */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block">
                Jurisdictional Routing
              </span>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {ai.authority}
                  </h4>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Category: {ai.category}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800 leading-snug">
                    {draftData.location?.address}
                  </p>
                  <p className="text-2xs text-slate-400 font-mono mt-0.5">
                    {draftData.location?.lat?.toFixed(4)}, {draftData.location?.lng?.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-500">Evaluated Severity:</span>
                <SeverityBadge severity={ai.severity} safetyRisk={ai.safetyRisk} size="sm" />
              </div>
            </div>
          </div>

          {/* Right Column: Editable Complaint Draft */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Official Complaint Draft
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                <Sparkles className="w-3 h-3" />
                AI Generated &bull; Editable
              </span>
            </div>

            {/* Editable Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Complaint Title</span>
                <span className="text-2xs font-normal text-slate-400">Click to edit</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                className="w-full text-sm font-medium bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            {/* Editable Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Formal Incident Description &amp; Action Required</span>
                <span className="text-2xs font-normal text-slate-400">Click to edit</span>
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed formal complaint text..."
                className="w-full text-sm bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y leading-relaxed"
                required
              />
            </div>

            {/* Citizen Original Notes Preview */}
            {draftData.description && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                <span className="text-2xs font-semibold text-slate-500 uppercase block mb-1">
                  Citizen Context Notes:
                </span>
                <p className="text-slate-700 italic">
                  "{draftData.description}"
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submission notice */}
            <div className="text-2xs text-slate-500 leading-relaxed pt-1">
              By clicking Submit, your complaint will be logged into the public civic registry with tracking ID and dispatched to {ai.authority}.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link to="/analyze">
            <Button variant="ghost" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Analysis
            </Button>
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={submitting}
            leftIcon={<Send className="w-4 h-4" />}
            className="w-full sm:w-auto px-7 font-bold shadow-md shadow-blue-600/25"
          >
            Submit Complaint
          </Button>
        </div>
      </form>
    </div>
  );
}
