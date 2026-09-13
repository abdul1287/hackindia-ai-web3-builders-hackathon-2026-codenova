import { INITIAL_COMPLAINTS } from "../data/mockComplaints";
import { analyzeVisualIssue } from "../utils/aiAnalyzer";
import { generateComplaintId } from "../utils/formatters";

const STORAGE_KEY = "civicai_complaints_db_v1";

let memoryComplaints = null;

// Helper to get complaints from localStorage with initial fallback and memory cache
function getStoredComplaints() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (!memoryComplaints) {
        memoryComplaints = [...INITIAL_COMPLAINTS];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));
        } catch (_) {}
      }
      return memoryComplaints;
    }
    const parsed = JSON.parse(raw);
    memoryComplaints = parsed;
    return parsed;
  } catch (err) {
    console.warn("Error reading from localStorage, using in-memory mock data:", err);
    return memoryComplaints || INITIAL_COMPLAINTS;
  }
}

// Helper to save complaints to localStorage with quota protection and cross-tab sync
function saveComplaints(complaints) {
  memoryComplaints = complaints;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (err) {
    console.warn("Direct localStorage write failed (quota limit), applying fallback compression:", err);
    try {
      // If quota exceeded, clean up any redundant data
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    } catch (retryErr) {
      console.error("Critical: Unable to persist complaints to localStorage:", retryErr);
    }
  }

  // Cross-tab synchronization via BroadcastChannel
  if (typeof BroadcastChannel !== "undefined") {
    try {
      const channel = new BroadcastChannel("civicai_sync");
      channel.postMessage({ type: "COMPLAINTS_UPDATED", detail: complaints });
      channel.close();
    } catch (_) {}
  }

  // Trigger storage event for other open tabs
  try {
    localStorage.setItem("civicai_last_sync", Date.now().toString());
  } catch (_) {}

  // Dispatch window event for current tab
  window.dispatchEvent(new CustomEvent("civicai_complaints_updated", { detail: complaints }));
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

  const updated = [newComplaint, ...complaints];
  saveComplaints(updated);

  return {
    success: true,
    data: newComplaint
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
  await delay(250);
  const list = getStoredComplaints();
  const complaint = list.find((c) => c.id.toUpperCase() === id.toUpperCase());

  if (!complaint) {
    return {
      success: false,
      error: `Complaint with ID ${id} not found.`
    };
  }

  return {
    success: true,
    data: complaint
  };
}

/**
 * Mock: Update complaint status from authority operations
 */
export async function updateComplaintStatus(id, newStatus, note = "", resolutionImage = "") {
  await delay(500);
  const list = getStoredComplaints();
  const index = list.findIndex((c) => c.id.toUpperCase() === id.toUpperCase());

  if (index === -1) {
    return {
      success: false,
      error: `Complaint with ID ${id} not found.`
    };
  }

  const now = new Date().toISOString();
  const complaint = { ...list[index] };
  const oldStatus = complaint.status;
  complaint.status = newStatus;
  complaint.updatedAt = now;
  if (resolutionImage) {
    complaint.resolutionImage = resolutionImage;
    complaint.resolution_image_url = resolutionImage;
  }

  let stageTitle = `Status updated to ${newStatus}`;
  let defaultDesc = `Authority updated case status to ${newStatus}.`;

  if (newStatus === "IN_PROGRESS") {
    stageTitle = "Work Crew Dispatched & Action In Progress";
    defaultDesc = note || "Municipal task force dispatched to ground location for rectifying the issue.";
  } else if (newStatus === "RESOLVED") {
    stageTitle = "Issue Resolved and Inspected";
    defaultDesc = note || "Civil work successfully completed and verified by the sector field supervisor.";
  } else if (newStatus === "REJECTED") {
    stageTitle = "Case Closed / Unactionable";
    defaultDesc = note || "Issue reviewed and determined outside municipal jurisdiction or duplicate.";
  }

  complaint.timeline = [
    ...complaint.timeline,
    {
      stage: newStatus,
      title: stageTitle,
      timestamp: now,
      description: defaultDesc,
      actor: "Municipal Authority Desk"
    }
  ];

  list[index] = complaint;
  saveComplaints(list);

  return {
    success: true,
    data: complaint
  };
}

/**
 * Reset local database to defaults (useful for hackathon demo restart)
 */
export function resetMockDatabase() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));
  window.dispatchEvent(new CustomEvent("civicai_complaints_updated", { detail: INITIAL_COMPLAINTS }));
  return INITIAL_COMPLAINTS;
}
