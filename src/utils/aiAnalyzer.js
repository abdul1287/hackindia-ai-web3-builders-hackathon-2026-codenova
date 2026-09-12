// Simulated and Live Vision AI models for CivicAI
// Provides instant computer vision classification, hazard level detection, safety risk assessment,
// and municipal jurisdictional routing via Gemini Multimodal Vision with intelligent offline fallback.

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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const DEFAULT_MODEL = import.meta.env.VITE_LLM_MODEL || "gemini-3.5-flash";

const CANDIDATE_MODELS = [
  DEFAULT_MODEL,
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.8-flash"
];

// Helper to convert any image input to base64 inline data
async function imageToBase64(imageInput) {
  if (!imageInput) return null;

  try {
    if (typeof imageInput === "string") {
      if (imageInput.startsWith("data:")) {
        const match = imageInput.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.*)$/);
        if (match) {
          return { mimeType: match[1], base64Data: match[2] };
        }
      }
      // Remote or local URL
      const resp = await fetch(imageInput);
      const blob = await resp.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result;
          const match = typeof res === "string" ? res.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.*)$/) : null;
          if (match) {
            resolve({ mimeType: match[1], base64Data: match[2] });
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } else if (imageInput instanceof Blob || imageInput instanceof File) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result;
          const match = typeof res === "string" ? res.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.*)$/) : null;
          if (match) {
            resolve({ mimeType: match[1], base64Data: match[2] });
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(imageInput);
      });
    }
  } catch (err) {
    console.warn("Could not encode image to base64:", err);
  }
  return null;
}

function mapAuthority(category, issueType) {
  const cat = (category || "").toLowerCase();
  const issue = (issueType || "").toLowerCase();

  if (cat.includes("sanitat") || issue.includes("garbage") || issue.includes("waste") || issue.includes("dump") || issue.includes("debris")) {
    return "Sanitation Department";
  }
  if (cat.includes("electr") || issue.includes("light") || issue.includes("wire") || issue.includes("pole") || issue.includes("cable")) {
    return "City Electricity Board";
  }
  if (cat.includes("water") || issue.includes("leak") || issue.includes("pipeline") || issue.includes("burst")) {
    return "Water Supply Department";
  }
  if (cat.includes("drain") || issue.includes("drain") || issue.includes("flood") || issue.includes("waterlog") || issue.includes("monsoon")) {
    return "Stormwater Drainage Department";
  }
  if (cat.includes("animal") || issue.includes("cattle") || issue.includes("dog") || issue.includes("cow") || issue.includes("stray")) {
    return "Animal Welfare & Control Department";
  }
  if (cat.includes("horticult") || cat.includes("park") || issue.includes("tree") || issue.includes("branch") || issue.includes("vegetation")) {
    return "Horticulture & Parks Department";
  }
  if (cat.includes("urban_safety") || cat.includes("safety") || issue.includes("manhole") || issue.includes("cavity") || issue.includes("collapse")) {
    return "Municipal Engineering Department";
  }
  return "Public Works Department";
}

const VISION_SYSTEM_PROMPT = `You are CivicAI Vision Analyzer, an expert municipal civil engineering and public works AI.
Carefully examine the visual evidence in the photograph and any citizen context.
Identify the EXACT civic hazard or municipal problem shown in the image with high accuracy and specificity.

CRITICAL INSTRUCTIONS:
- Do NOT guess or default to common issues like potholes unless you actually see asphalt road cavity damage in the image.
- If the image shows garbage/waste dumps, stray animals/cattle, streetlights/exposed wiring, broken water pipelines/leaks, uncovered open manholes, fallen tree/branch obstructions, traffic light malfunctions, damaged footpaths/sidewalks, building or construction debris, waterlogging/flooding, illegal dumping, or public infrastructure defects, identify it SPECIFICALLY and ACCURATELY.

Output strict JSON with these keys:
{
  "issueType": "Specific name of hazard (e.g., 'Overflowing Waste Dump', 'Severe Road Pothole', 'Non-Functional Streetlight', 'Pressurized Water Pipeline Rupture', 'Uncovered Open Manhole Chamber', 'Fallen Tree Roadway Obstruction', 'Broken Pedestrian Footpath')",
  "category": "Broad category: 'Sanitation' | 'Road Infrastructure' | 'Electrical & Lighting' | 'Water Supply & Sewage' | 'Urban Safety' | 'Horticulture & Parks' | 'Stormwater Drainage' | 'Animal Control' | 'General Infrastructure'",
  "authority": "Exact municipal authority (e.g. 'Sanitation Department', 'Public Works Department', 'City Electricity Board', 'Water Supply Department', 'Municipal Engineering Department')",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "safetyRisk": true | false,
  "description": "Factual 2-3 sentence visual summary describing the photo and hazard characteristics.",
  "suggestedTitle": "Professional complaint title (max 90 chars)",
  "suggestedDescription": "Formal, actionable complaint request for municipal dispatch.",
  "confidenceScore": 0.95,
  "tags": ["3 to 5 relevant technical/civic tags"]
}`;

/**
 * Intelligent Fallback Heuristic Classifier
 * Used if network is completely unreachable or offline.
 * NEVER defaults blindly to pothole!
 */
function heuristicFallback({ description, location, filename }) {
  const text = `${description || ""} ${filename || ""}`.toLowerCase();

  if (text.includes("animal") || text.includes("cattle") || text.includes("cow") || text.includes("dog") || text.includes("rabies")) {
    return {
      issueType: "Stray Animal & Waste Hazard",
      category: "Animal Control",
      severity: "Medium",
      safetyRisk: true,
      authority: "Animal Welfare & Control Department",
      description: "Stray cattle or animals observed feeding on waste and obstructing transit.",
      suggestedTitle: "Stray Animals Obstructing Thoroughfare",
      suggestedDescription: description || "Stray animals roaming on the public pathway, posing traffic and safety concerns. Requesting animal welfare team response.",
      confidenceScore: 0.91,
      tags: ["Animal Menace", "Public Safety", "Municipal Control"],
      location: location || { address: "Sector 61, Noida, UP", lat: 28.5991, lng: 77.3610 }
    };
  }

  if (text.includes("garbage") || text.includes("trash") || text.includes("waste") || text.includes("dump") || text.includes("litter") || text.includes("debris") || text.includes("rubbish")) {
    return {
      issueType: "Garbage Dump",
      category: "Sanitation",
      severity: "Medium",
      safetyRisk: false,
      authority: "Sanitation Department",
      description: "Accumulated municipal waste and uncollected garbage observed in public vicinity.",
      suggestedTitle: "Sanitation Complaint: Accumulated Waste and Garbage",
      suggestedDescription: description || "Unattended waste accumulation causing environmental hygiene concerns. Requires mechanized pickup and waste disposal.",
      confidenceScore: 0.93,
      tags: ["Sanitation Issue", "Waste Removal Required", "Public Hygiene"],
      location: location || { address: "Sector 61, Noida, UP", lat: 28.5991, lng: 77.3610 }
    };
  }

  if (text.includes("light") || text.includes("electric") || text.includes("wire") || text.includes("pole") || text.includes("lamp") || text.includes("dark")) {
    return {
      issueType: "Broken Streetlight",
      category: "Electrical & Lighting",
      severity: "High",
      safetyRisk: true,
      authority: "City Electricity Board",
      description: "Street illumination failure with possible electrical insulation exposure.",
      suggestedTitle: "Civic Hazard: Non-functional Streetlight / Electrical Unit",
      suggestedDescription: description || "Public luminaire is non-operational, causing dangerous darkness and possible pedestrian hazard.",
      confidenceScore: 0.94,
      tags: ["Electrical", "Public Lighting", "Immediate Action"],
      location: location || { address: "Sector 18, Noida, UP", lat: 28.5708, lng: 77.3260 }
    };
  }

  if (text.includes("water") || text.includes("leak") || text.includes("pipe") || text.includes("sewage") || text.includes("burst")) {
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

  if (text.includes("manhole") || text.includes("drain cover") || text.includes("open pit") || text.includes("grating")) {
    return {
      issueType: "Uncovered Open Manhole Chamber",
      category: "Urban Safety",
      severity: "Critical",
      safetyRisk: true,
      authority: "Municipal Engineering Department",
      description: "Uncovered manhole cavity on active thoroughfare posing immediate fall and vehicle collision hazard.",
      suggestedTitle: "Critical Safety Hazard: Uncovered Open Manhole Chamber",
      suggestedDescription: description || "An open manhole chamber is exposed on the roadway. Immediate barricading and cover installation required.",
      confidenceScore: 0.96,
      tags: ["Fall Hazard", "High Risk Anomaly", "Immediate Barricade Needed"],
      location: location || { address: "Sector 62, Noida, UP", lat: 28.6280, lng: 77.3649 }
    };
  }

  if (text.includes("tree") || text.includes("branch") || text.includes("foliage") || text.includes("fallen")) {
    return {
      issueType: "Fallen Tree Roadway Obstruction",
      category: "Horticulture & Parks",
      severity: "High",
      safetyRisk: true,
      authority: "Horticulture & Parks Department",
      description: "Fallen tree or large severed branch obstructing vehicular and pedestrian passage.",
      suggestedTitle: "Fallen Tree Blocking Roadway & Transit Route",
      suggestedDescription: description || "A fallen tree has obstructed the active road passage. Urgent crew dispatch required.",
      confidenceScore: 0.94,
      tags: ["Transit Obstruction", "Tree Clearance Needed", "Public Safety Hazard"],
      location: location || { address: "Sector 50, Noida, UP", lat: 28.5772, lng: 77.3688 }
    };
  }

  if (text.includes("pothole") || text.includes("crater") || text.includes("asphalt") || text.includes("bitumen") || text.includes("road defect")) {
    return {
      issueType: "Pothole",
      category: "Road Infrastructure",
      severity: "High",
      safetyRisk: true,
      authority: "Public Works Department",
      description: "Road surface cavity with asphalt breakdown on active vehicular lane.",
      suggestedTitle: "Hazardous Road Surface Defect / Pothole",
      suggestedDescription: description || "Deep cavity detected on active lane. Requires asphalt patching and leveling.",
      confidenceScore: 0.95,
      tags: ["Road Surface Anomaly", "Traffic Hazard", "PWD Maintenance"],
      location: location || { address: "Sector 62, Noida, UP", lat: 28.6280, lng: 77.3649 }
    };
  }

  // Balanced civic infrastructure default - NEVER defaults blindly to pothole
  return {
    issueType: "Civic Infrastructure Issue",
    category: "General Infrastructure",
    severity: "Medium",
    safetyRisk: false,
    authority: "Public Works Department",
    description: description?.trim()
      ? `Civic issue reported: "${description.trim()}". Visual evidence awaiting field inspection and assessment.`
      : "Visual evidence uploaded for municipal evaluation. Field assessment requested to categorize hazard.",
    suggestedTitle: description?.trim()
      ? `Civic Complaint: ${description.slice(0, 60)}`
      : "Civic Infrastructure Maintenance & Verification Request",
    suggestedDescription: description?.trim()
      ? `Citizen reported: "${description.trim()}". Field verification and municipal assessment requested.`
      : "A civic problem has been logged with photographic evidence. Field verification and assessment requested by municipal engineering team.",
    confidenceScore: 0.88,
    tags: ["Visual Evidence", "Inspection Needed", "Municipal Verification"],
    location: location || { address: "Sector 62, Noida, UP", lat: 28.6280, lng: 77.3649 }
  };
}

/**
 * Main Vision AI Analysis Entry Point
 * Executes direct Gemini Multimodal Vision API with multi-model waterfall failover
 * and intelligent multi-domain heuristics as offline backup.
 */
export async function analyzeVisualIssue({ image, description, location, sampleId, file }) {
  // 1. If user selected one of our rich sample issues, return it directly:
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

  // 2. Direct Gemini Multimodal Vision Analysis:
  const encodedImage = await imageToBase64(image || file);
  if (encodedImage && GEMINI_API_KEY) {
    // Deduplicate models while keeping order
    const modelsToTry = [];
    for (const m of CANDIDATE_MODELS) {
      if (m && !modelsToTry.includes(m)) modelsToTry.push(m);
    }

    const citizenPrompt = `Citizen remarks: ${description?.trim() || "No citizen text provided."}\n` +
      `Incident Location: ${location?.address || "Noida, UP"}\n` +
      `Carefully inspect the uploaded photograph. Identify the exact civic problem or municipal hazard shown. Output STRICT JSON.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: `${VISION_SYSTEM_PROMPT}\n\n${citizenPrompt}` },
            {
              inline_data: {
                mime_type: encodedImage.mimeType || "image/jpeg",
                data: encodedImage.base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    };

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = JSON.parse(candidateText);

            const rawIssue = (parsed.issueType || parsed.issue_type || "Civic Hazard").trim();
            const cleanIssue = rawIssue.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const rawCat = (parsed.category || "General Infrastructure").trim();
            const cleanCat = rawCat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const rawSev = (parsed.severity || "Medium").toLowerCase().trim();
            const cleanSev = rawSev.charAt(0).toUpperCase() + rawSev.slice(1);
            const resolvedAuthority = parsed.authority || parsed.authority_name || mapAuthority(cleanCat, cleanIssue);

            return {
              issueType: cleanIssue,
              category: cleanCat,
              severity: ["Low", "Medium", "High", "Critical"].includes(cleanSev) ? cleanSev : "Medium",
              safetyRisk: Boolean(parsed.safetyRisk ?? parsed.safety_risk ?? false),
              description: parsed.description || `Visual analysis identified: ${cleanIssue}.`,
              suggestedTitle: (parsed.suggestedTitle || parsed.complaint_title || `Report: ${cleanIssue}`).slice(0, 100),
              suggestedDescription: parsed.suggestedDescription || parsed.complaint_description || `A civic hazard has been documented at this location. Field verification and corrective action requested.`,
              authority: resolvedAuthority,
              confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 0.95,
              tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags : [cleanIssue, cleanCat, "Vision AI Verified"],
              location: location || { address: "Sector 62, Noida, UP", lat: 28.6280, lng: 77.3649 }
            };
          }
        } else if (response.status === 429 || response.status === 503) {
          console.warn(`Gemini model ${model} rate-limited (${response.status}), trying next candidate...`);
          continue;
        } else {
          console.warn(`Gemini model ${model} error status ${response.status}`);
        }
      } catch (callErr) {
        console.warn(`Gemini model ${model} attempt failed:`, callErr);
      }
    }
  }

  // 3. Fallback Heuristic Classifier (e.g. offline, rate-limited, or network issue)
  return heuristicFallback({
    description,
    location,
    filename: file?.name
  });
}
