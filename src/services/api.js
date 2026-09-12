/**
 * CivicAI API Client Layer
 * 
 * In Demo Mode:
 * Routes all calls to mockApi.js using simulated async latency and localStorage.
 * 
 * In Production / FastAPI Mode:
 * Directs requests to VITE_API_BASE_URL (http://localhost:8000/api).
 */

import * as mockApi from "./mockApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export function formatImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("/uploads/")) {
    return `${BACKEND_ORIGIN}${url}`;
  }
  return url;
}

/**
 * Normalizes complaint objects from FastAPI backend to match frontend component properties
 */
function normalizeComplaint(item) {
  if (!item) return item;
  return {
    ...item,
    id: item.complaint_id || item.id,
    complaint_id: item.complaint_id || item.id,
    issueType: item.issue_type || item.issueType || "Civic Hazard",
    title: item.complaint_title || item.title || "Civic Complaint",
    description: item.complaint_description || item.description || "",
    category: item.category || "General",
    severity: item.severity || "Medium",
    safetyRisk: item.safety_risk ?? item.safetyRisk ?? false,
    image: formatImageUrl(item.image_url || item.image || ""),
    authority: typeof item.authority === "object" ? item.authority?.name : (item.authority || "Municipal Authority"),
    authority_id: typeof item.authority === "object" ? item.authority?.id : (item.authority_id || 1),
    location: {
      address: item.location_text || item.location?.address || "Noida, Uttar Pradesh",
      lat: item.latitude ?? item.location?.lat ?? 28.6280,
      lng: item.longitude ?? item.location?.lng ?? 77.3649,
    },
    createdAt: item.created_at || item.createdAt,
    updatedAt: item.updated_at || item.updatedAt,
    timeline: (item.status_history || item.timeline || []).map((h) => ({
      stage: h.status,
      title: h.note || `Status: ${h.status}`,
      timestamp: h.changed_at || h.timestamp,
      description: h.note || `Stage updated to ${h.status}`,
      actor: "Municipal Authority"
    })),
    aiMetadata: item.aiMetadata || {
      confidenceScore: 0.96,
      tags: [item.issue_type || "Civic", item.category || "Municipal", "Verified"]
    }
  };
}

/**
 * 1. POST /api/analyze
 * Analyzes photo + location metadata with Vision AI
 */
export async function analyzeIssue(data) {
  if (IS_DEMO_MODE) {
    return mockApi.analyzeIssue(data);
  }

  try {
    const formData = new FormData();
    
    // Resolve file from File, Blob, base64 data URL, or remote URL
    let fileToUpload = data.file;
    if (!fileToUpload && data.image) {
      try {
        const response = await fetch(data.image);
        const blob = await response.blob();
        fileToUpload = new File([blob], "evidence.jpg", { type: blob.type || "image/jpeg" });
      } catch (fetchErr) {
        console.warn("Could not convert image URL to Blob, falling back to mock:", fetchErr);
        return mockApi.analyzeIssue(data);
      }
    }

    if (fileToUpload) {
      formData.append("image", fileToUpload);
    }
    if (data.description) formData.append("optional_text", data.description);
    if (data.location?.lat != null) formData.append("latitude", data.location.lat.toString());
    if (data.location?.lng != null) formData.append("longitude", data.location.lng.toString());

    const res = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json();
    
    // Normalize analysis result for React UI
    const normalizedAI = {
      issueType: json.issue_type,
      category: json.category,
      severity: json.severity.charAt(0).toUpperCase() + json.severity.slice(1),
      safetyRisk: json.safety_risk,
      description: json.description,
      suggestedTitle: json.complaint_title,
      suggestedDescription: json.complaint_description,
      authority: json.authority?.name || "Public Works Department",
      authority_id: json.authority?.id || 1,
      image: formatImageUrl(json.image_url),
      confidenceScore: 0.96,
      tags: [json.issue_type, json.category, "AI-Verified"],
      location: data.location || {
        address: "Sector 62, Noida, UP",
        lat: json.location?.latitude || 28.6280,
        lng: json.location?.longitude || 77.3649,
      }
    };

    return { success: true, data: normalizedAI };
  } catch (err) {
    console.warn("Live API /api/analyze failed, falling back to mockApi:", err);
    return mockApi.analyzeIssue(data);
  }
}

/**
 * 2. POST /api/complaints
 * Creates and registers a new official civic complaint
 */
export async function createComplaint(complaintData) {
  if (IS_DEMO_MODE) {
    return mockApi.createComplaint(complaintData);
  }

  try {
    const payload = {
      issue_type: (complaintData.issueType || complaintData.issue_type || "pothole").toLowerCase(),
      category: (complaintData.category || "road_infrastructure").toLowerCase(),
      severity: (complaintData.severity || "medium").toLowerCase(),
      safety_risk: Boolean(complaintData.safetyRisk ?? complaintData.safety_risk),
      complaint_title: complaintData.title || complaintData.complaint_title || "Civic Hazard Report",
      complaint_description: complaintData.description || complaintData.complaint_description || "Issue observed on municipal property.",
      image_url: complaintData.image || complaintData.image_url || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
      latitude: complaintData.location?.lat ?? complaintData.latitude ?? 28.6280,
      longitude: complaintData.location?.lng ?? complaintData.longitude ?? 77.3649,
      location_text: complaintData.location?.address || complaintData.location_text || "Sector 62, Noida",
      authority_id: complaintData.authority_id || (typeof complaintData.authority === "object" ? complaintData.authority?.id : 1),
      ai_description: complaintData.ai_description || complaintData.description,
    };

    const res = await fetch(`${API_BASE_URL}/complaints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json();
    const normalized = normalizeComplaint(json);

    // Notify listeners so UI updates immediately
    window.dispatchEvent(new CustomEvent("civicai_complaints_updated", { detail: normalized }));

    return { success: true, data: normalized };
  } catch (err) {
    console.warn("Live API /api/complaints failed, falling back to mockApi:", err);
    return mockApi.createComplaint(complaintData);
  }
}

/**
 * 3. GET /api/complaints
 * Fetches list of complaints with optional status/severity filters
 */
export async function getComplaints(filters = {}) {
  if (IS_DEMO_MODE) {
    return mockApi.getComplaints(filters);
  }

  try {
    const queryParams = new URLSearchParams();
    if (filters.status && filters.status !== "ALL") queryParams.append("status", filters.status);
    if (filters.severity && filters.severity !== "ALL") queryParams.append("severity", filters.severity);
    if (filters.category && filters.category !== "ALL") queryParams.append("category", filters.category);
    if (filters.search) queryParams.append("search", filters.search);
    queryParams.append("limit", "100");

    const res = await fetch(`${API_BASE_URL}/complaints?${queryParams.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    
    const json = await res.json();
    const rawItems = json.items || (Array.isArray(json) ? json : []);
    const items = rawItems.map(normalizeComplaint);
    const count = json.total ?? items.length;

    return { success: true, count, data: items };
  } catch (err) {
    console.warn("Live API /api/complaints failed, falling back to mockApi:", err);
    return mockApi.getComplaints(filters);
  }
}

/**
 * 4. GET /api/complaints/{id}
 * Retrieves specific complaint with full timeline
 */
export async function getComplaintById(id) {
  if (IS_DEMO_MODE) {
    return mockApi.getComplaintById(id);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/complaints/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    
    const json = await res.json();
    return { success: true, data: normalizeComplaint(json) };
  } catch (err) {
    console.warn("Live API /api/complaints/{id} failed, falling back to mockApi:", err);
    return mockApi.getComplaintById(id);
  }
}

/**
 * 5. PATCH /api/complaints/{id}/status
 * Updates status and appends department audit entry
 */
export async function updateComplaintStatus(id, status, note = "") {
  if (IS_DEMO_MODE) {
    return mockApi.updateComplaintStatus(id, status, note);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/complaints/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    
    const json = await res.json();
    const normalized = normalizeComplaint(json);

    // Notify listeners so UI updates immediately
    window.dispatchEvent(new CustomEvent("civicai_complaints_updated", { detail: normalized }));

    return { success: true, data: normalized };
  } catch (err) {
    console.warn("Live API update failed, falling back to mockApi:", err);
    return mockApi.updateComplaintStatus(id, status, note);
  }
}

export { resetMockDatabase } from "./mockApi";
