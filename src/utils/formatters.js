/**
 * Safely parses any date input (string, Date, number).
 * If the date string is naive ISO from a backend/database (e.g., "2026-09-12T09:51:35" or "2026-09-12 09:51:35"),
 * treats it as UTC by appending 'Z', so that the browser correctly converts it to the user's local timezone.
 */
export function parseDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;

  let str = String(dateInput).trim();
  if (!str) return null;

  // If string contains no timezone offset (no 'Z', no '+HH:MM', no '-HH:MM' after the time part)
  // Backend / SQLite stores UTC timestamps, so treat naive datetime as UTC
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(str)) {
    str = str.replace(" ", "T") + "Z";
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats date and time in 12-hour format with AM/PM in user's local timezone
 * Example: "Sep 12, 2026, 3:21 PM"
 */
export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = parseDate(dateString);
  if (!date) return String(dateString);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Formats time only in 12-hour format with AM/PM in user's local timezone
 * Example: "3:21 PM"
 */
export function formatTime12h(dateString) {
  if (!dateString) return "";
  const date = parseDate(dateString);
  if (!date) return "";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Formats date and time cleanly for timeline and audit logs in 12-hour format
 * Example: "Sep 12, 2026 • 3:21 PM"
 */
export function formatTimelineDate(dateString) {
  if (!dateString) return "N/A";
  const date = parseDate(dateString);
  if (!date) return String(dateString);

  const dateStr = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${dateStr} • ${timeStr}`;
}

/**
 * Formats relative time (e.g. "Just now", "5m ago", "2h ago")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = parseDate(dateString);
  if (!date) return "Recently";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(dateString);
}

export function formatCoordinates(lat, lng) {
  if (lat == null || lng == null) return "Unknown Coordinates";
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

export function generateComplaintId() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `CIV-${year}-${randomNum}`;
}
