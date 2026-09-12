import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  PlusCircle,
  FileCheck2,
  Clock,
  CheckCircle2,
  Layers,
  ArrowUpDown,
  Camera,
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { ComplaintCard } from "../../components/ComplaintCard";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { useComplaints } from "../../hooks/useComplaints";

export function MyComplaintsPage() {
  const { complaints, loading, stats } = useComplaints();

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Get distinct categories
  const categories = useMemo(() => {
    const set = new Set(complaints.map((c) => c.category).filter(Boolean));
    return ["ALL", ...Array.from(set)];
  }, [complaints]);

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      // Tab filter
      if (activeTab === "SUBMITTED" && item.status !== "SUBMITTED") return false;
      if (activeTab === "IN_PROGRESS" && item.status !== "IN_PROGRESS") return false;
      if (activeTab === "RESOLVED" && item.status !== "RESOLVED") return false;

      // Category filter
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesIssue = item.issueType?.toLowerCase().includes(q);
        const matchesLoc = item.location?.address?.toLowerCase().includes(q);
        const matchesAuth = item.authority?.toLowerCase().includes(q);
        return matchesId || matchesTitle || matchesIssue || matchesLoc || matchesAuth;
      }

      return true;
    });
  }, [complaints, activeTab, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints &amp; Civic Tracker"
        description="Monitor status updates, municipal crew dispatches, and verified field resolutions for your reported issues."
        actions={
          <Link to="/report">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Camera className="w-4 h-4" />}
              className="shadow-sm shadow-blue-600/20"
            >
              Report New Issue
            </Button>
          </Link>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Total Complaints
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {stats.total}
          </p>
          <p className="text-2xs text-slate-500 mt-1">Logged across municipal wards</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-amber-600">
              Active / In Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2">
            {stats.active}
          </p>
          <p className="text-2xs text-slate-500 mt-1">
            {stats.submitted} pending triage &bull; {stats.inProgress} crew deployed
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600">
              Resolved &amp; Closed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">
            {stats.resolved}
          </p>
          <p className="text-2xs text-slate-500 mt-1">Inspected and verified repaired</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("SUBMITTED")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "SUBMITTED"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Submitted ({stats.submitted})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("IN_PROGRESS")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "IN_PROGRESS"
                  ? "bg-white text-amber-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              In Progress ({stats.inProgress})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("RESOLVED")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "RESOLVED"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Resolved ({stats.resolved})
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-2xs font-semibold text-slate-400 uppercase hidden md:inline">
              Category:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "ALL" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by complaint ID (e.g. CIV-2026-10482), title, location, or authority..."
            className="w-full text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-slate-400 hover:text-slate-700 p-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Complaints List or States */}
      {loading ? (
        <LoadingState variant="skeleton" />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching complaints found" : "No complaints in this category"}
          description={
            searchQuery
              ? `No complaints match "${searchQuery}". Try a different keyword or tracking ID.`
              : "You haven't filed any complaints matching this status yet."
          }
          actionLabel="Report a New Civic Issue"
          onAction={() => (window.location.href = "/report")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              linkPrefix="/complaints"
            />
          ))}
        </div>
      )}
    </div>
  );
}
