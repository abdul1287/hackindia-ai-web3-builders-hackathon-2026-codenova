import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { useComplaints } from "../../hooks/useComplaints";
import { formatDate, formatRelativeTime } from "../../utils/formatters";
import { useAuthorityAuth, matchesDepartment } from "../../context/AuthorityAuthContext";

export function AuthorityDashboardPage() {
  const { departmentName } = useAuthorityAuth();
  const { complaints, loading, refreshComplaints } = useComplaints();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Filter complaints strictly to the authorized department
  const departmentComplaints = useMemo(() => {
    return complaints.filter((c) => matchesDepartment(c, departmentName));
  }, [complaints, departmentName]);

  // Department-specific dashboard statistics
  const stats = useMemo(() => {
    const total = departmentComplaints.length;
    const submitted = departmentComplaints.filter((c) => {
      const s = (c.status || "").toUpperCase().replace(/\s+/g, "_");
      return s === "SUBMITTED";
    }).length;
    const inProgress = departmentComplaints.filter((c) => {
      const s = (c.status || "").toUpperCase().replace(/\s+/g, "_");
      return s === "IN_PROGRESS";
    }).length;
    const resolved = departmentComplaints.filter((c) => {
      const s = (c.status || "").toUpperCase().replace(/\s+/g, "_");
      return s === "RESOLVED";
    }).length;
    const active = submitted + inProgress;
    const highSeverity = departmentComplaints.filter((c) => {
      const sev = (c.severity || "").toLowerCase().trim();
      return sev === "high" || sev === "critical";
    }).length;

    return { total, submitted, inProgress, resolved, active, highSeverity };
  }, [departmentComplaints]);

  // Format category label for dropdown
  const formatCategoryLabel = (cat) => {
    if (!cat || cat === "ALL") return "Category: All";
    return cat
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Get distinct categories belonging to this department
  const categories = useMemo(() => {
    const map = new Map();
    departmentComplaints.forEach((c) => {
      if (c.category) {
        const key = c.category.toLowerCase().replace(/[-_\s]+/g, "");
        if (!map.has(key)) {
          map.set(key, c.category);
        }
      }
    });
    return ["ALL", ...Array.from(map.values())];
  }, [departmentComplaints]);

  // Filter department complaints by search, status, severity, category
  const filtered = useMemo(() => {
    return departmentComplaints.filter((c) => {
      // 1. Status Filter
      if (statusFilter !== "ALL") {
        const cStatus = (c.status || "").toUpperCase().replace(/\s+/g, "_");
        const targetStatus = statusFilter.toUpperCase().replace(/\s+/g, "_");
        if (cStatus !== targetStatus) return false;
      }

      // 2. Severity Filter
      if (severityFilter !== "ALL") {
        const cSev = (c.severity || "").toLowerCase().trim();
        const targetSev = severityFilter.toLowerCase().trim();
        if (targetSev === "high") {
          if (cSev !== "high" && cSev !== "critical") return false;
        } else {
          if (cSev !== targetSev) return false;
        }
      }

      // 3. Category Filter
      if (categoryFilter !== "ALL") {
        const cCat = (c.category || "").toLowerCase().replace(/[-_\s]+/g, "");
        const targetCat = categoryFilter.toLowerCase().replace(/[-_\s]+/g, "");
        if (cCat !== targetCat) return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idStr = String(c.id || c.complaint_id || "").toLowerCase();
        const titleStr = String(c.title || c.complaint_title || "").toLowerCase();
        const issueStr = String(c.issueType || c.issue_type || "").toLowerCase();
        const locStr = String(c.location?.address || c.location_text || "").toLowerCase();
        const catStr = String(c.category || "").toLowerCase();
        const descStr = String(c.description || c.complaint_description || "").toLowerCase();

        const matches =
          idStr.includes(q) ||
          titleStr.includes(q) ||
          issueStr.includes(q) ||
          locStr.includes(q) ||
          catStr.includes(q) ||
          descStr.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [departmentComplaints, statusFilter, severityFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Operations Dashboard Header */}
      <PageHeader
        title="Authority Civic Operations"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            <Building2 className="w-3.5 h-3.5 text-amber-700" />
            {departmentName || "Public Works Department"} &bull; Operations Desk
          </span>
        }
        description="Review AI-classified incidents, prioritize emergency hazards, deploy response crews, and update ticket resolution stages."
      />

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Total Inflow
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {stats.total}
          </p>
          <span className="text-2xs text-slate-500 mt-0.5 block">
            Across all categories
          </span>
        </div>

        {/* New / Submitted */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-blue-600">
              New / Triage
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-700 mt-2">
            {stats.submitted}
          </p>
          <span className="text-2xs text-blue-600/80 mt-0.5 block">
            Awaiting crew assignment
          </span>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-amber-600">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700 mt-2">
            {stats.inProgress}
          </p>
          <span className="text-2xs text-amber-600/80 mt-0.5 block">
            Work crews deployed on-site
          </span>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600">
              Resolved
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2">
            {stats.resolved}
          </p>
          <span className="text-2xs text-emerald-600/80 mt-0.5 block">
            Inspected &amp; closed cases
          </span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, issue, address..."
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Status: All</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="sm:col-span-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Severity: All</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low Severity</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {formatCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Indicators & Count */}
        <div className="flex items-center justify-between text-2xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-slate-800">{filtered.length}</strong> complaints</span>
            {(statusFilter !== "ALL" || severityFilter !== "ALL" || categoryFilter !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("ALL");
                  setSeverityFilter("ALL");
                  setCategoryFilter("ALL");
                  setSearchQuery("");
                }}
                className="text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              High severity highlighted
            </span>
          </div>
        </div>
      </div>

      {/* Main Table View (Desktop) & Cards (Mobile) */}
      {loading ? (
        <LoadingState variant="skeleton" />
      ) : departmentComplaints.length === 0 ? (
        <EmptyState
          title={`No complaints in ${departmentName || "Department"} queue`}
          description="Your department queue is clear. Grievances routed by CivicAI to this department will automatically appear here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No complaints match filters"
          description="Try clearing search parameters or filtering by a different status."
          actionLabel="Clear Filters"
          onAction={() => {
            setStatusFilter("ALL");
            setSeverityFilter("ALL");
            setCategoryFilter("ALL");
            setSearchQuery("");
          }}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Ticket ID</th>
                  <th className="py-3.5 px-4">Issue &amp; Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filtered.map((item) => {
                  const normItemSev = (item.severity || "").toLowerCase().trim();
                  const isHighRisk = normItemSev === "high" || normItemSev === "critical";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${isHighRisk ? "bg-amber-50/20" : ""
                        }`}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                        <Link
                          to={`/authority/complaints/${item.id}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          {isHighRisk && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="High Severity" />
                          )}
                          <span>{item.id}</span>
                        </Link>
                      </td>

                      {/* Issue & Title */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.image}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {item.title}
                            </p>
                            <span className="text-2xs text-slate-400 block truncate">
                              {item.issueType}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {item.category}
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SeverityBadge
                          severity={item.severity}
                          safetyRisk={item.safetyRisk}
                          size="sm"
                        />
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="truncate text-slate-600" title={item.location?.address}>
                          {item.location?.address}
                        </p>
                      </td>

                      {/* Submitted */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatRelativeTime(item.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link to={`/authority/complaints/${item.id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-2xs font-semibold py-1 px-2.5 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                          >
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Fallback */}
          <div className="md:hidden space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {item.id}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <div className="flex items-start gap-3">
                  <img
                    src={item.image}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-2xs text-slate-500 line-clamp-1 mt-0.5">
                      {item.location?.address}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <SeverityBadge severity={item.severity} safetyRisk={item.safetyRisk} size="sm" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-2xs text-slate-400">
                    {formatRelativeTime(item.createdAt)}
                  </span>

                  <Link to={`/authority/complaints/${item.id}`}>
                    <Button variant="secondary" size="sm" className="text-xs">
                      Manage Case
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
