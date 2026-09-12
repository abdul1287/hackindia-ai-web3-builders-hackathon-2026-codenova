import React, { createContext, useContext, useState } from "react";

export const AUTHORITY_DEPARTMENTS = [
  "Public Works Department",
  "Sanitation Department",
  "Electrical Department",
  "Water Supply Department",
  "Stormwater Drainage Department",
  "Municipal Engineering Department",
  "Horticulture & Parks Department",
  "Animal Welfare & Control Department",
  "Traffic Management Department",
  "Sewerage Department"
];

const AUTH_STORAGE_KEY = "civicai_authority_auth";

/**
 * Checks whether a complaint record belongs to the authorized department.
 * Supports exact names, category mappings, and aliases present in the codebase.
 */
export function matchesDepartment(complaint, departmentName) {
  if (!complaint || !departmentName) return false;
  const target = departmentName.toLowerCase().trim();
  const auth = (typeof complaint.authority === "object" ? complaint.authority?.name : complaint.authority || "").toLowerCase().trim();
  const dept = (complaint.department || "").toLowerCase().trim();
  const cat = (complaint.category || "").toLowerCase().trim();
  const issue = (complaint.issueType || complaint.issue_type || "").toLowerCase().trim();

  // 1. Sanitation Department
  if (target.includes("sanitation")) {
    return (
      cat.includes("sanitation") ||
      cat.includes("waste") ||
      auth.includes("sanitation") ||
      dept.includes("sanitation") ||
      issue.includes("garbage") ||
      issue.includes("waste")
    );
  }

  // 2. Electrical Department
  if (target.includes("electrical") || target.includes("electricity") || target.includes("lighting")) {
    return (
      cat.includes("electrical") ||
      auth.includes("electrical") ||
      auth.includes("electricity") ||
      dept.includes("electrical") ||
      auth.includes("lighting") ||
      issue.includes("streetlight") ||
      issue.includes("wiring")
    );
  }

  // 3. Water Supply Department / Water Department
  if (target.includes("water") && !target.includes("drainage") && !target.includes("stormwater")) {
    return (
      (cat.includes("water") && !cat.includes("drainage") && !cat.includes("stormwater")) ||
      (auth.includes("water") && !auth.includes("drainage") && !auth.includes("stormwater")) ||
      (dept.includes("water") && !dept.includes("drainage") && !dept.includes("stormwater")) ||
      issue.includes("water_leakage") ||
      issue.includes("water leakage") ||
      issue.includes("pipeline")
    );
  }

  // 4. Stormwater Drainage Department
  if (target.includes("drainage") || target.includes("stormwater") || target.includes("flood")) {
    return (
      cat.includes("drainage") ||
      cat.includes("stormwater") ||
      auth.includes("drainage") ||
      dept.includes("drainage") ||
      issue.includes("drainage") ||
      issue.includes("waterlog") ||
      issue.includes("flood")
    );
  }

  // 5. Municipal Engineering Department / Urban Safety
  if (target.includes("engineering") || target.includes("urban safety")) {
    return (
      cat.includes("urban_safety") ||
      cat.includes("urban safety") ||
      cat.includes("engineering") ||
      auth.includes("engineering") ||
      dept.includes("urban safety") ||
      issue.includes("manhole")
    );
  }

  // 6. Public Works Department (Roads, Potholes, PWD)
  if (target.includes("public works") || target.includes("road") || target.includes("pwd")) {
    // If complaint explicitly belongs to another civic domain, do not match PWD
    if (
      cat.includes("sanitation") ||
      cat.includes("electrical") ||
      cat.includes("water") ||
      cat.includes("drainage") ||
      cat.includes("stormwater") ||
      cat.includes("urban_safety") ||
      cat.includes("urban safety") ||
      issue.includes("garbage") ||
      issue.includes("waste") ||
      issue.includes("streetlight") ||
      issue.includes("manhole")
    ) {
      return false;
    }
    return (
      cat.includes("road") ||
      dept.includes("road") ||
      issue.includes("pothole") ||
      auth.includes("public works") ||
      auth.includes("pwd") ||
      dept === target ||
      auth === target
    );
  }

  // 7. Horticulture & Parks
  if (target.includes("horticulture") || target.includes("park")) {
    return (
      cat.includes("horticulture") ||
      cat.includes("park") ||
      auth.includes("horticulture") ||
      dept.includes("horticulture") ||
      auth.includes("parks") ||
      issue.includes("tree")
    );
  }

  // 8. Animal Welfare & Control
  if (target.includes("animal")) {
    return (
      cat.includes("animal") ||
      auth.includes("animal") ||
      dept.includes("animal") ||
      auth.includes("veterinary") ||
      issue.includes("cattle")
    );
  }

  // 9. Traffic Management
  if (target.includes("traffic")) {
    return (
      cat.includes("traffic") ||
      auth.includes("traffic") ||
      dept.includes("traffic") ||
      issue.includes("traffic") ||
      issue.includes("transit")
    );
  }

  // 10. Sewerage Department
  if (target.includes("sewerage")) {
    return (
      cat.includes("sewerage") ||
      auth.includes("sewerage") ||
      dept.includes("sewerage") ||
      issue.includes("sewage") ||
      issue.includes("sewer")
    );
  }

  // Exact fallback
  return auth === target || dept === target;
}

const AuthorityAuthContext = createContext(null);

export function AuthorityAuthProvider({ children }) {
  const [authSession, setAuthSession] = useState(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (departmentId, password, departmentName) => {
    if (!departmentId || !departmentId.trim()) {
      return { success: false, error: "Please enter your Department ID." };
    }
    if (!password || !password.trim()) {
      return { success: false, error: "Please enter your password." };
    }
    if (!departmentName || !departmentName.trim()) {
      return { success: false, error: "Please select your Department Name." };
    }

    const session = {
      departmentId: departmentId.trim(),
      departmentName: departmentName.trim(),
      loginTime: new Date().toISOString()
    };

    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      console.warn("Session storage write failed:", err);
    }

    setAuthSession(session);
    return { success: true };
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.warn("Session storage remove failed:", err);
    }
    setAuthSession(null);
  };

  return (
    <AuthorityAuthContext.Provider
      value={{
        isAuthenticated: Boolean(authSession?.departmentName),
        departmentId: authSession?.departmentId || "",
        departmentName: authSession?.departmentName || "",
        login,
        logout,
        matchesDepartment
      }}
    >
      {children}
    </AuthorityAuthContext.Provider>
  );
}

export function useAuthorityAuth() {
  const context = useContext(AuthorityAuthContext);
  if (!context) {
    throw new Error("useAuthorityAuth must be used within an AuthorityAuthProvider");
  }
  return context;
}
