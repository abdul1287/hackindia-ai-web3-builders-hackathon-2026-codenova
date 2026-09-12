// Simulated Vision AI models for CivicAI
// Provides instant computer vision classification, hazard level detection, safety risk assessment,
// and municipal jurisdictional routing.

export const SAMPLE_CIVIC_ISSUES = [
  {
    id: "sample-pothole",
    name: "Severe Road Pothole",
    category: "Road Infrastructure",
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=200&q=80",
    issueType: "Pothole",
    severity: "High",
    safetyRisk: true,
    authority: "Public Works Department",
    defaultAddress: "Sector 62, Near Electronic City Metro, Noida, UP",
    lat: 28.6280,
    lng: 77.3649,
    description: "Deep cavity detected on the active vehicular lane with degraded bitumen edges. Poses severe collision and tyre burst risk to two-wheelers and vehicles at night.",
    suggestedTitle: "Hazardous Pothole on Sector 62 Main Roadway",
    suggestedDescription: "A deep asphalt pothole approximately 1.2m wide and 15cm deep has formed on the right lane of the primary carriageway. Multiple two-wheelers have experienced near-accidents. Immediate asphalt cold-mix patching and warning barricades required.",
    confidenceScore: 0.96,
    tags: ["Asphalt Base Failure", "Collision Hazard", "PWD Jurisdiction", "Two-Wheeler Risk"]
  },
  {
    id: "sample-garbage",
    name: "Overflowing Waste Dump",
    category: "Sanitation",
    image: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=200&q=80",
    issueType: "Garbage Dump",
    severity: "Medium",
    safetyRisk: false,
    authority: "Sanitation Department",
    defaultAddress: "Sector 61, Market Complex, Noida, UP",
    lat: 28.5991,
    lng: 77.3610,
    description: "Uncontrolled solid municipal waste spilling beyond community waste container onto pedestrian sidewalk.",
    suggestedTitle: "Uncollected Municipal Solid Waste at Sector 61 Market",
    suggestedDescription: "The public waste compactor has been overflowing for 48+ hours. Waste is obstructing the public sidewalk, creating biohazard odors, and attracting stray animals. Requesting urgent hydraulic dumper clearance and disinfectant spray.",
    confidenceScore: 0.94,
    tags: ["Solid Waste Accumulation", "Pedestrian Obstruction", "Vector Control Needed"]
  },
  {
    id: "sample-streetlight",
    name: "Damaged Streetlight Pole",
    category: "Electrical & Lighting",
    image: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=200&q=80",
    issueType: "Broken Streetlight",
    severity: "High",
    safetyRisk: true,
    authority: "City Electricity Board",
    defaultAddress: "Sector 18, Block B Commercial Area, Noida, UP",
    lat: 28.5708,
    lng: 77.3260,
    description: "Lighting fixture non-functional with exposed base wiring junction box at reachable height for pedestrians.",
    suggestedTitle: "Exposed Electrical Wiring on Streetlight Pole",
    suggestedDescription: "Streetlight unit #SL-402 is dark at night, and the lower panel cover has fallen off, exposing live cable terminal connections within arm's reach of school children and pedestrians. Requires immediate power isolation and rewiring.",
    confidenceScore: 0.98,
    tags: ["Electrocution Risk", "Public Dark Zone", "Urgent Cable Isolation"]
  },
  {
    id: "sample-waterleak",
    name: "Burst Water Main",
    category: "Water Supply & Sewage",
    image: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=200&q=80",
    issueType: "Water Pipeline Burst",
    severity: "High",
    safetyRisk: true,
    authority: "Water Supply Department",
    defaultAddress: "Sector 50, Pocket A Avenue, Noida, UP",
    lat: 28.5772,
    lng: 77.3688,
    description: "Pressurized potable water pipe fracture causing flooding on residential access road and soil erosion.",
    suggestedTitle: "Pressurized Clean Water Pipeline Leak Flooding Roadway",
    suggestedDescription: "Underground main feeder line appears to have ruptured under the curb. Thousands of liters of drinking water are being wasted and flooding neighboring residential gates. Requesting emergency shut-off valve closure and trench excavation.",
    confidenceScore: 0.95,
    tags: ["Water Wastage", "Subgrade Erosion", "Pressure Loss"]
  }
];

export function analyzeVisualIssue({ image, description, location, sampleId }) {
  // If user selected one of our rich sample issues:
  if (sampleId) {
    const found = SAMPLE_CIVIC_ISSUES.find((s) => s.id === sampleId);
    if (found) {
      return {
        issueType: found.issueType,
        category: found.category,
        severity: found.severity,
        safetyRisk: found.safetyRisk,
        description: description?.trim() 
          ? `${found.description} Citizen notes: "${description.trim()}"`
          : found.description,
        authority: found.authority,
        suggestedTitle: found.suggestedTitle,
        suggestedDescription: found.suggestedDescription,
        confidenceScore: found.confidenceScore,
        tags: found.tags,
        location: location || {
          address: found.defaultAddress,
          lat: found.lat,
          lng: found.lng
        }
      };
    }
  }

  // If user uploaded a custom image, intelligently parse any provided description or default to an intelligent detection:
  const text = (description || "").toLowerCase();
  
  if (text.includes("garbage") || text.includes("trash") || text.includes("waste") || text.includes("dump")) {
    return {
      issueType: "Garbage Dump",
      category: "Sanitation",
      severity: "Medium",
      safetyRisk: false,
      authority: "Sanitation Department",
      description: "Accumulated municipal waste and uncollected garbage observed in public vicinity.",
      suggestedTitle: "Sanitation Complaint: Accumulated Waste and Garbage",
      suggestedDescription: description || "Unattended waste accumulation causing environmental hygiene concerns. Requires mechanized pickup and waste disposal.",
      confidenceScore: 0.91,
      tags: ["Sanitation Issue", "Waste Removal Required", "Public Hygiene"],
      location: location || { address: "Sector 61, Noida, UP", lat: 28.5991, lng: 77.3610 }
    };
  }

  if (text.includes("light") || text.includes("electric") || text.includes("wire") || text.includes("pole")) {
    return {
      issueType: "Broken Streetlight",
      category: "Electrical & Lighting",
      severity: "High",
      safetyRisk: true,
      authority: "City Electricity Board",
      description: "Street illumination failure with possible electrical insulation exposure.",
      suggestedTitle: "Civic Hazard: Non-functional Streetlight / Electrical Unit",
      suggestedDescription: description || "Public luminaire is non-operational, causing dangerous darkness and possible pedestrian hazard.",
      confidenceScore: 0.93,
      tags: ["Electrical", "Public Lighting", "Immediate Action"],
      location: location || { address: "Sector 18, Noida, UP", lat: 28.5708, lng: 77.3260 }
    };
  }

  if (text.includes("water") || text.includes("leak") || text.includes("pipe") || text.includes("sewage")) {
    return {
      issueType: "Water Pipeline Leak",
      category: "Water Supply & Sewage",
      severity: "High",
      safetyRisk: true,
      authority: "Water Supply Department",
      description: "Continuous water outflow from municipal distribution channel.",
      suggestedTitle: "Urgent: Municipal Water Pipeline Rupture",
      suggestedDescription: description || "Visible underground pipe leakage inundating public thoroughfare. Urgent valve shutoff and repair requested.",
      confidenceScore: 0.94,
      tags: ["Water Supply", "Pipeline Defect", "Infrastructure"],
      location: location || { address: "Sector 50, Noida, UP", lat: 28.5772, lng: 77.3688 }
    };
  }

  // Default intelligent pothole/road damage detection:
  return {
    issueType: "Pothole",
    category: "Road Infrastructure",
    severity: "High",
    safetyRisk: true,
    authority: "Public Works Department",
    description: "Large pothole detected on the road surface with asphalt degradation and hazard to passing vehicular traffic.",
    suggestedTitle: "Hazardous Road Surface Defect / Pothole",
    suggestedDescription: description 
      ? `Large pothole detected on the road surface. Citizen notes: "${description}". Requires asphalt patching and levelling.`
      : "Large pothole detected on the road surface. Urgent asphalt patching and leveling needed to prevent vehicular accidents.",
    confidenceScore: 0.95,
    tags: ["Road Surface Anomaly", "Traffic Hazard", "PWD Maintenance"],
    location: location || { address: "Sector 62, Noida, UP", lat: 28.6280, lng: 77.3649 }
  };
}
