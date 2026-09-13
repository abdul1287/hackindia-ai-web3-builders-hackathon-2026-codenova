// Pre-seeded realistic complaints for CivicAI

export const INITIAL_COMPLAINTS = [
  {
    id: "CIV-2026-10482",
    issueType: "Pothole",
    title: "Hazardous Deep Pothole on Sector 62 Main Roadway",
    category: "Road Infrastructure",
    severity: "High",
    safetyRisk: true,
    authority: "Public Works Department",
    location: {
      address: "Sector 62, Noida, Uttar Pradesh",
      lat: 28.6280,
      lng: 77.3649
    },
    status: "SUBMITTED",
    description: "Large pothole detected on the road surface. Urgent asphalt patching and leveling needed to prevent vehicular accidents.",
    citizenNotes: "Nearly caused a bike skid in the dark last night. Please repair ASAP.",
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    timeline: [
      {
        stage: "SUBMITTED",
        title: "Complaint Filed & AI Classified",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        description: "AI identified Pothole (High severity) and automatically routed ticket to Public Works Department.",
        actor: "CivicAI System"
      }
    ],
    aiMetadata: {
      confidenceScore: 0.96,
      tags: ["Asphalt Base Failure", "Collision Hazard", "PWD Jurisdiction", "Two-Wheeler Risk"]
    }
  },
  {
    id: "CIV-2026-10481",
    issueType: "Garbage Dump",
    title: "Severe Waste Overflow Obstructing Commercial Walkway",
    category: "Sanitation",
    severity: "Medium",
    safetyRisk: false,
    authority: "Sanitation Department",
    location: {
      address: "Sector 61, Noida, Uttar Pradesh",
      lat: 28.5991,
      lng: 77.3610
    },
    status: "IN_PROGRESS",
    description: "Uncontrolled solid municipal waste spilling beyond community waste container onto pedestrian sidewalk.",
    citizenNotes: "Smell is unbearable and blocking pedestrian path to the market.",
    image: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    timeline: [
      {
        stage: "SUBMITTED",
        title: "Complaint Received",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        description: "Complaint logged and routed to Noida Sanitation Department.",
        actor: "CivicAI System"
      },
      {
        stage: "ASSIGNED",
        title: "Dispatched to Sector Sanitation Inspector",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        description: "Assigned to Ward Supervisor M. Verma for fleet deployment.",
        actor: "Central Triage Desk"
      },
      {
        stage: "IN_PROGRESS",
        title: "Compactor Truck Dispatched",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        description: "Sanitation crew #4 deployed with mechanical compactor. Waste clearance underway.",
        actor: "Operations Desk"
      }
    ],
    aiMetadata: {
      confidenceScore: 0.94,
      tags: ["Solid Waste Accumulation", "Pedestrian Obstruction", "Vector Control Needed"]
    }
  },
  {
    id: "CIV-2026-10479",
    issueType: "Broken Streetlight",
    title: "Exposed Electrical Wiring on Municipal Streetlight #SL-402",
    category: "Electrical & Lighting",
    severity: "High",
    safetyRisk: true,
    authority: "City Electricity Board",
    location: {
      address: "Sector 18, Block B Commercial Area, Noida, UP",
      lat: 28.5708,
      lng: 77.3260
    },
    status: "RESOLVED",
    description: "Streetlight fixture non-functional with exposed base wiring junction box at reachable height.",
    citizenNotes: "High risk during monsoon rains. Children play near this pole.",
    image: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    resolutionImage: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
    resolution_image_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    timeline: [
      {
        stage: "SUBMITTED",
        title: "Complaint Received",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        description: "Flagged with Safety Risk = True.",
        actor: "CivicAI System"
      },
      {
        stage: "ASSIGNED",
        title: "Emergency Power Crew Notified",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
        description: "Assigned to Rapid Response Electrical Team.",
        actor: "Authority Dispatch"
      },
      {
        stage: "IN_PROGRESS",
        title: "Power Isolated and Inspection Conducted",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        description: "Junction box secured and new LED luminaire mounted.",
        actor: "Linesman Team 7"
      },
      {
        stage: "RESOLVED",
        title: "Verified and Closed",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        description: "Insulation tests passed. Streetlight fully functional and junction box locked.",
        actor: "Inspector K. Sharma"
      }
    ],
    aiMetadata: {
      confidenceScore: 0.98,
      tags: ["Electrocution Risk", "Public Dark Zone", "Urgent Cable Isolation"]
    }
  },
  {
    id: "CIV-2026-10475",
    issueType: "Water Pipeline Burst",
    title: "Pressurized Clean Water Pipeline Leak Flooding Roadway",
    category: "Water Supply & Sewage",
    severity: "High",
    safetyRisk: true,
    authority: "Water Supply Department",
    location: {
      address: "Sector 50, Pocket A Avenue, Noida, UP",
      lat: 28.5772,
      lng: 77.3688
    },
    status: "IN_PROGRESS",
    description: "Pressurized potable water pipe fracture causing flooding on residential access road.",
    citizenNotes: "Drinking water is gushing out non-stop since 6 AM.",
    image: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    timeline: [
      {
        stage: "SUBMITTED",
        title: "Emergency Water Ticket Created",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        description: "Logged and routed to Water Supply Department emergency desk.",
        actor: "CivicAI System"
      },
      {
        stage: "IN_PROGRESS",
        title: "Line Valve Isolated",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
        description: "Zone feeder valve closed to prevent water loss. Excavator team on site for collar clamp replacement.",
        actor: "Sub-divisional Engineer"
      }
    ],
    aiMetadata: {
      confidenceScore: 0.95,
      tags: ["Water Wastage", "Subgrade Erosion", "Pressure Loss"]
    }
  }
];
