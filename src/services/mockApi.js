import { INITIAL_COMPLAINTS } from "../data/mockComplaints";
import { analyzeVisualIssue } from "../utils/aiAnalyzer";
import { generateComplaintId } from "../utils/formatters";

const STORAGE_KEY = "civicai_complaints_db_v1";

let memoryComplaints = null;

export function normalizeMockComplaint(c) {
  if (!c) return c;
  const id = c.id || c.complaint_id || "CIV-2026-00000";
  const resImg = c.resolutionImage || c.resolution_image_url || c.resolution_image || "";
  const rawTimeline = Array.isArray(c.timeline) ? c.timeline : (Array.isArray(c.status_history) ? c.status_history : []);

  return {
    ...c,
    id,
    complaint_id: id,
    status: (c.status || "SUBMITTED").toUpperCase().trim(),
    issueType: c.issueType || c.issue_type || "Civic Hazard",
    title: c.title || c.complaint_title || "Civic Grievance",
    description: c.description || c.complaint_description || "",
    category: c.category || "General Municipal",
    severity: c.severity || "Medium",
    safetyRisk: Boolean(c.safetyRisk ?? c.safety_risk),
    authority: typeof c.authority === "object" ? c.authority?.name : (c.authority || "Public Works Department"),
    authority_id: typeof c.authority === "object" ? c.authority?.id : (c.authority_id || 1),
    image: c.image || c.image_url || "",
    resolutionImage: resImg,
    resolution_image_url: resImg,
    createdAt: c.createdAt || c.created_at || new Date().toISOString(),
    updatedAt: c.updatedAt || c.updated_at || new Date().toISOString(),
    timeline: rawTimeline.map((h) => {
      const stage = (h.stage || h.status || "SUBMITTED").toUpperCase().trim();
      return {
        stage,
        status: stage,
        title: h.title || h.note || `Stage: ${stage}`,
        description: h.description || h.note || `Ticket updated to ${stage}.`,
        note: h.note || h.description || `Ticket updated to ${stage}.`,
        timestamp: h.timestamp || h.changed_at || new Date().toISOString(),
        changed_at: h.changed_at || h.timestamp || new Date().toISOString(),
        actor: h.actor || "Municipal Authority Desk"
      };
    }),
    aiMetadata: c.aiMetadata || {
      confidenceScore: 0.95,
      tags: ["Vision AI Verified", "Geo-tagged"]
    },
    location: c.location || {
      address: c.location_text || "Sector 62, Noida, Uttar Pradesh",
      lat: c.latitude ?? 28.6280,
      lng: c.longitude ?? 77.3649
    }
  };
}

// Helper to get complaints from localStorage with initial fallback and memory cache
export function getStoredComplaints() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (!memoryComplaints || memoryComplaints.length === 0) {
        memoryComplaints = INITIAL_COMPLAINTS.map(normalizeMockComplaint);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryComplaints));
        } catch (_) {}
      }
      return memoryComplaints.map(normalizeMockComplaint);
    }
    const parsed = JSON.parse(raw);
    const normalized = Array.isArray(parsed) ? parsed.map(normalizeMockComplaint) : INITIAL_COMPLAINTS.map(normalizeMockComplaint);
    memoryComplaints = normalized;
    return normalized;
  } catch (err) {
    console.warn("Error reading from localStorage, using in-memory mock data:", err);
    if (!memoryComplaints) {
      memoryComplaints = INITIAL_COMPLAINTS.map(normalizeMockComplaint);
    }
    return memoryComplaints.map(normalizeMockComplaint);
  }
}

// Helper to sanitize payload for safe localStorage quota retention
function createPrunedComplaints(complaints, activeId = null) {
  return complaints.map((c, idx) => {
    const isCurrent = activeId ? (c.id === activeId || c.complaint_id === activeId) : idx < 2;
    // For active/current complaints, preserve full resolution proof
    if (isCurrent) return c;

    // For older complaints, if image or resolutionImage is enormous base64 (> 100KB), replace with fallback preview
    let copy = { ...c };
    if (copy.image && copy.image.startsWith("data:image/") && copy.image.length > 80000) {
      copy.image = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=70";
    }
    if (copy.resolutionImage && copy.resolutionImage.startsWith("data:image/") && copy.resolutionImage.length > 80000) {
      copy.resolutionImage = "https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=400&q=70";
      copy.resolution_image_url = copy.resolutionImage;
    }
    return copy;
  });
}

// Helper to save complaints to localStorage with quota protection and cross-tab sync
export function saveComplaints(complaints, singleUpdatedComplaint = null) {
  const normalizedList = (complaints || []).map(normalizeMockComplaint);
  memoryComplaints = normalizedList;

  const targetSingle = singleUpdatedComplaint ? normalizeMockComplaint(singleUpdatedComplaint) : null;

  // 1. Try direct write of normalized data
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedList));
  } catch (quotaErr) {
    console.warn("Direct localStorage write failed (quota limit), pruning older entries to fit:", quotaErr);
    try {
      // 2. Prune older base64 entries to stay well within 5MB limit
      const pruned = createPrunedComplaints(normalizedList, targetSingle?.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    } catch (retryErr) {
      console.warn("Second write failed, keeping top 10 complaints in storage:", retryErr);
      try {
        const top10 = createPrunedComplaints(normalizedList.slice(0, 10), targetSingle?.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(top10));
      } catch (critErr) {
        console.error("Critical: Storage quota exhausted, keeping changes in-memory:", critErr);
      }
    }
  }

  // Cross-tab synchronization via BroadcastChannel
  if (typeof BroadcastChannel !== "undefined") {
    try {
      const channel = new BroadcastChannel("civicai_sync");
      channel.postMessage({
        type: "COMPLAINTS_UPDATED",
        detail: normalizedList,
        single: targetSingle
      });
      channel.close();
    } catch (_) {}
  }

  // Trigger storage event for other open tabs
  try {
    localStorage.setItem("civicai_last_sync", Date.now().toString());
  } catch (_) {}

  // Dispatch window events for current tab
  window.dispatchEvent(new CustomEvent("civicai_complaints_updated", {
    detail: normalizedList,
    single: targetSingle
  }));

  if (targetSingle) {
    window.dispatchEvent(new CustomEvent("civicai_complaint_updated", {
      detail: targetSingle
    }));
  }
}

// Simulated network delay helper
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export async function reverseGeocode(latitude, longitude) {
  if (latitude == null || longitude == null || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
    return { success: false, error: "Latitude and longitude required" };
  }

  const latNum = Number(latitude);
  const lngNum = Number(longitude);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(latNum)}&lon=${encodeURIComponent(lngNum)}&format=jsonv2&addressdetails=1`;
    const resp = await fetch(url, {
      headers: { "Accept-Language": "en" }
    });
    if (resp.ok) {
      const data = await resp.json();
      const addr = data.address || {};
      const components = [];

      const road = addr.road;
      if (road && !road.toLowerCase().includes("unnamed") && !road.toLowerCase().includes("path to")) {
        components.push(road.trim());
      }

      const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.village;
      if (locality && !components.includes(locality.trim())) {
        components.push(locality.trim());
      }

      const city = addr.city || addr.town || addr.municipality || addr.county;
      if (city && !components.includes(city.trim())) {
        components.push(city.trim());
      }

      const state = addr.state;
      if (state && !components.includes(state.trim())) {
        components.push(state.trim());
      }

      const country = addr.country;
      if (country && !components.includes(country.trim())) {
        components.push(country.trim());
      }

      const formatted = components.length > 0 ? components.join(", ") : (data.display_name || "Location detected");
      return {
        success: true,
        data: {
          latitude: latNum,
          longitude: lngNum,
          city: city || null,
          display_name: formatted,
          formatted_address: formatted,
        }
      };
    }
  } catch (err) {
    console.warn("mockApi reverseGeocode network fallback:", err);
  }

  // Graceful fallback without hardcoded names
  return {
    success: true,
    data: {
      latitude: latNum,
      longitude: lngNum,
      city: null,
      display_name: "Location detected",
      formatted_address: "Location detected",
    }
  };
}

/**
 * Mock: Analyze an issue using AI vision
 */
export async function analyzeIssue(data) {
  await delay(1200); // realistic AI vision processing time
  const aiResult = await analyzeVisualIssue(data);
  return {
    success: true,
    data: aiResult
  };
}

/**
 * Mock: Create a new complaint
 */
export async function createComplaint(complaintPayload) {
  await delay(600);
  const complaints = getStoredComplaints();
  
  const id = generateComplaintId();
  const now = new Date().toISOString();

  const newComplaint = {
    id,
    issueType: complaintPayload.issueType || "Civic Hazard",
    title: complaintPayload.title || "Civic Infrastructure Issue",
    category: complaintPayload.category || "General Municipal",
    severity: complaintPayload.severity || "Medium",
    safetyRisk: complaintPayload.safetyRisk ?? false,
    authority: complaintPayload.authority || "Public Works Department",
    location: complaintPayload.location || {
      address: "Identified Location, Noida, UP",
      lat: 28.6280,
      lng: 77.3649
    },
    status: "SUBMITTED",
    description: complaintPayload.description || "",
    citizenNotes: complaintPayload.citizenNotes || "",
    image: complaintPayload.image || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        stage: "SUBMITTED",
        title: "Complaint Lodged & AI Classified",
        timestamp: now,
        description: `Official ticket registered. Routed directly to ${complaintPayload.authority || "Municipal Authority"}.`,
        actor: "CivicAI System"
      }
    ],
    aiMetadata: complaintPayload.aiMetadata || {
      confidenceScore: 0.95,
      tags: ["Vision AI Verified", "Geo-tagged"]
    }
  };

  const normalized = normalizeMockComplaint(newComplaint);
  const updated = [normalized, ...complaints];
  saveComplaints(updated, normalized);

  return {
    success: true,
    data: normalized
  };
}

/**
 * Mock: Get all complaints with optional filters
 */
export async function getComplaints(filters = {}) {
  await delay(300);
  let list = getStoredComplaints();

  if (filters.status && filters.status !== "ALL") {
    list = list.filter((c) => c.status.toLowerCase() === filters.status.toLowerCase());
  }

  if (filters.severity && filters.severity !== "ALL") {
    list = list.filter((c) => c.severity.toLowerCase() === filters.severity.toLowerCase());
  }

  if (filters.category && filters.category !== "ALL") {
    list = list.filter((c) => c.category.toLowerCase() === filters.category.toLowerCase());
  }

  if (filters.authority && filters.authority !== "ALL") {
    list = list.filter((c) => c.authority.toLowerCase().includes(filters.authority.toLowerCase()));
  }

  if (filters.search) {
    const query = filters.search.toLowerCase().trim();
    list = list.filter((c) =>
      c.id.toLowerCase().includes(query) ||
      c.title?.toLowerCase().includes(query) ||
      c.issueType?.toLowerCase().includes(query) ||
      c.location?.address?.toLowerCase().includes(query) ||
      c.authority?.toLowerCase().includes(query)
    );
  }

  return {
    success: true,
    count: list.length,
    data: list
  };
}

/**
 * Mock: Get single complaint by ID
 */
export async function getComplaintById(id) {
  await delay(200);
  const list = getStoredComplaints();
  const searchId = (id || "").toString().trim().toUpperCase();
  const complaint = list.find((c) => (c.id || c.complaint_id || "").toString().trim().toUpperCase() === searchId);

  if (!complaint) {
    return {
      success: false,
      error: `Complaint with ID ${id} not found.`
    };
  }

  const normalized = normalizeMockComplaint(complaint);
  return {
    success: true,
    data: normalized
  };
}

/**
 * Mock: Update complaint status from authority operations
 */
export async function updateComplaintStatus(id, newStatus, note = "", resolutionImage = "") {
  await delay(250);
  const list = getStoredComplaints();
  const searchId = (id || "").toString().trim().toUpperCase();
  const index = list.findIndex((c) => (c.id || c.complaint_id || "").toString().trim().toUpperCase() === searchId);

  if (index === -1) {
    return {
      success: false,
      error: `Complaint with ID ${id} not found.`
    };
  }

  const now = new Date().toISOString();
  const normStatus = (newStatus || "RESOLVED").toUpperCase().trim();
  const rawTarget = list[index];
  const complaint = { ...rawTarget };
  complaint.status = normStatus;
  complaint.updatedAt = now;

  if (resolutionImage) {
    complaint.resolutionImage = resolutionImage;
    complaint.resolution_image_url = resolutionImage;
  }

  let stageTitle = `Status updated to ${normStatus}`;
  let defaultDesc = `Authority updated case status to ${normStatus}.`;

  if (normStatus === "IN_PROGRESS") {
    stageTitle = "Work Crew Dispatched & Action In Progress";
    defaultDesc = note || "Municipal task force dispatched to ground location for rectifying the issue.";
  } else if (normStatus === "RESOLVED") {
    stageTitle = "Issue Resolved and Inspected";
    defaultDesc = note || "Ground remediation verified and closed by the sector field supervisor with photographic proof.";
  } else if (normStatus === "REJECTED") {
    stageTitle = "Case Closed / Unactionable";
    defaultDesc = note || "Issue reviewed and determined outside municipal jurisdiction or duplicate.";
  }

  const existingTimeline = Array.isArray(complaint.timeline)
    ? complaint.timeline
    : (Array.isArray(complaint.status_history) ? complaint.status_history : []);

  complaint.timeline = [
    ...existingTimeline,
    {
      stage: normStatus,
      status: normStatus,
      title: stageTitle,
      timestamp: now,
      changed_at: now,
      description: defaultDesc,
      note: defaultDesc,
      actor: "Municipal Authority Desk"
    }
  ];

  const normalizedComplaint = normalizeMockComplaint(complaint);
  list[index] = normalizedComplaint;
  saveComplaints(list, normalizedComplaint);

  return {
    success: true,
    data: normalizedComplaint
  };
}

/**
 * Reset local database to defaults (useful for hackathon demo restart)
 */
export function resetMockDatabase() {
  const initial = INITIAL_COMPLAINTS.map(normalizeMockComplaint);
  saveComplaints(initial);
  return initial;
}
