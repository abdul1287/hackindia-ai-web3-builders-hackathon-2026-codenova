import { useState, useEffect, useCallback, useMemo } from "react";
import * as api from "../services/api";

export function useComplaints(initialFilters = {}) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getComplaints(filters);
      if (res.success) {
        setComplaints(res.data);
        setError(null);
      } else {
        setError(res.error || "Failed to load complaints.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchComplaints();

    // Listen for cross-component and cross-page state updates
    const handleUpdate = () => {
      fetchComplaints();
    };

    window.addEventListener("civicai_complaints_updated", handleUpdate);
    return () => {
      window.removeEventListener("civicai_complaints_updated", handleUpdate);
    };
  }, [fetchComplaints]);

  // Derived metrics
  const stats = useMemo(() => {
    const total = complaints.length;
    const submitted = complaints.filter((c) => c.status === "SUBMITTED").length;
    const inProgress = complaints.filter((c) => c.status === "IN_PROGRESS").length;
    const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
    const active = submitted + inProgress;
    const highSeverity = complaints.filter((c) => c.severity === "High" || c.severity === "Critical").length;

    return { total, submitted, inProgress, resolved, active, highSeverity };
  }, [complaints]);

  const updateStatus = useCallback(async (id, newStatus, note = "") => {
    try {
      const res = await api.updateComplaintStatus(id, newStatus, note);
      if (res.success) {
        setComplaints((prev) =>
          prev.map((item) => (item.id === id ? res.data : item))
        );
        return res;
      }
      return res;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    complaints,
    loading,
    error,
    filters,
    setFilters,
    stats,
    refreshComplaints: fetchComplaints,
    updateStatus,
  };
}
