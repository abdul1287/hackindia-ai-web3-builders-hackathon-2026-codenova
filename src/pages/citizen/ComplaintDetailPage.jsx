import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Calendar,
  Share2,
  Copy,
  Printer,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Compass,
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";
import { ComplaintTimeline } from "../../components/ComplaintTimeline";
import { LocationCard } from "../../components/LocationCard";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { showToast } from "../../components/Toast";
import { formatDate } from "../../utils/formatters";
import * as api from "../../services/api";

export function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.getComplaintById(id)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setComplaint(res.data);
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

    // Listen to updates from authority actions
    const handleUpdate = () => {
      api.getComplaintById(id).then((res) => {
        if (isMounted && res.success && res.data) {
          setComplaint(res.data);
        }
      });
    };

    window.addEventListener("civicai_complaints_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("civicai_complaints_updated", handleUpdate);
    };
  }, [id]);

  const handleCopyTrackingLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast({
      title: "Link Copied",
      message: `Tracking link for ${complaint?.id} copied to clipboard.`,
      type: "info",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingState message="Fetching official civic ticket details..." />;
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto pt-8">
        <ErrorState
          title="Ticket Not Found"
          message={error || `Could not find complaint "${id}".`}
          onRetry={() => navigate("/complaints")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <PageHeader
        title={complaint.id}
        badge={<StatusBadge status={complaint.status} size="md" />}
        description={`Filed on ${formatDate(complaint.createdAt)} &bull; ${complaint.category}`}
        backTo="/complaints"
        backLabel="All Complaints"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyTrackingLink}
              leftIcon={<Copy className="w-3.5 h-3.5 text-slate-500" />}
            >
              Share Tracker
            </Button>

            {/* Quick link for hackathon judges to jump straight to authority triage view */}
            <Link to={`/authority/complaints/${complaint.id}`}>
              <Button
                variant="subtle"
                size="sm"
                leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
              >
                View as Authority Desk
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Complaint Details, Image, AI Diagnostics */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Title & Description Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                {complaint.issueType}
              </span>
              <SeverityBadge
                severity={complaint.severity}
                safetyRisk={complaint.safetyRisk}
                size="md"
                showRiskLabel
              />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {complaint.title}
            </h2>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Official Incident Description
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {complaint.description}
              </p>
            </div>

            {complaint.citizenNotes && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Citizen Context Submitted:
                </span>
                <p className="text-slate-600 italic">
                  "{complaint.citizenNotes}"
                </p>
              </div>
            )}
          </div>

          {/* Evidence Photo Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Photographic Evidence
              </h3>
              {complaint.aiMetadata?.confidenceScore && (
                <span className="inline-flex items-center gap-1 text-2xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Vision AI Verified ({Math.round(complaint.aiMetadata.confidenceScore * 100)}%)
                </span>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video relative group">
              <img
                src={complaint.image}
                alt={complaint.title}
                className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                <span className="font-semibold">{complaint.issueType}</span>
                <span className="text-2xs text-slate-300 font-mono">
                  {formatDate(complaint.createdAt)}
                </span>
              </div>
            </div>

            {complaint.aiMetadata?.tags && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {complaint.aiMetadata.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-2xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Incident Location Card */}
          <LocationCard
            location={complaint.location}
            readOnly={true}
          />
        </div>

        {/* Right Column: Timeline & Responsible Department */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status & Timeline Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Resolution Progress Timeline
                </h3>
              </div>
              <StatusBadge status={complaint.status} size="sm" />
            </div>

            {/* Vertical Stepper */}
            <ComplaintTimeline
              timeline={complaint.timeline || []}
              currentStatus={complaint.status}
            />
          </div>

          {/* Responsible Department & SLA */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Assigned Authority</span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70">
              <h4 className="text-base font-bold text-slate-900">
                {complaint.authority}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Municipal Operations Division &bull; Sector Ward 62
              </p>
            </div>

            <div className="pt-2 text-xs text-slate-500 space-y-2">
              <div className="flex items-center justify-between">
                <span>Public Ticket ID:</span>
                <span className="font-mono font-semibold text-slate-900">{complaint.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated:</span>
                <span className="font-medium text-slate-900">{formatDate(complaint.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Expected Resolution:</span>
                <span className="font-semibold text-blue-700">Within 48 Hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
