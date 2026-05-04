// src/data/fleetStore.ts
// Central data store: Emirates fleet + full inspection history.
// New flight records created during live missions are persisted to localStorage.

export type AircraftStatus = "Active" | "In Maintenance" | "Grounded";
export type FindingType    = "Crack" | "Dent" | "Corrosion" | "Scratch" | "Missing Rivet" | "Paint Damage";
export type Severity       = "Low" | "Medium" | "High";
export type FlightStatus   = "Completed" | "Pending Review" | "Archived";

export interface Aircraft {
  id: string;
  registration: string;    // ICAO registration, e.g. "A6-EDA"
  model: string;           // Full model, e.g. "Airbus A380-861"
  shortModel: string;      // Short label, e.g. "A380"
  manufacturer: string;
  airline: string;
  status: AircraftStatus;
  lastInspection: string;  // ISO "YYYY-MM-DD"
  nextInspection: string;
  totalFlightHours: number;
  manufactureYear: number;
}

// ── LiveDetection ─────────────────────────────────────────────────────────────
// What the drone reports in real-time during a mission.
export interface LiveDetection {
  id: string;
  label: FindingType;
  severity: Severity;
  confidence: number;
  zone: string;
  timestamp: string;
  /** Filename of the YOLOv11 prediction image in public/predictions/ */
  imageFile?: string;
  /** Bounding box [x1, y1, x2, y2] in original image pixels */
  bbox?: [number, number, number, number];
}

// ── Historical types ──────────────────────────────────────────────────────────

export interface HistoricalFinding {
  id: string;
  flightId: string;
  aircraftId: string;
  type: FindingType;
  severity: Severity;
  confidence: number;
  zone: string;
  timestamp: string;
  notes: string;
  resolved: boolean;
  reoccurrence: boolean;
}

export interface FlightRecord {
  id: string;
  aircraftId: string;
  date: string;         // "YYYY-MM-DD"
  duration: string;     // "42 min"
  pilotName: string;    // who flew the mission
  engineer: string;     // legacy alias for pilotName (kept for compatibility)
  status: FlightStatus;
  findings: HistoricalFinding[];
  accessCode: string;   // 6-char uppercase code for sharing this report
}

export interface ZoneRecurrence {
  zone: string;
  type: FindingType;
  count: number;
  lastSeverity: Severity;
  flightDates: string[];
}

// ─── Emirates Fleet ───────────────────────────────────────────────────────────
// Real Emirates registrations and ICAO model designators.
// A380-861 = Rolls-Royce Trent 970 powered.
// 777-31H(ER) = ICAO for Emirates 777-300ER.
// 777-21H(LR) = ICAO for Emirates 777-200LR.

export const FLEET: Aircraft[] = [
  {
    id: "ac-001",
    registration: "A6-EDA",
    model: "Airbus A380-861",
    shortModel: "A380",
    manufacturer: "Airbus",
    airline: "Emirates",
    status: "Active",
    lastInspection: "2026-03-10",
    nextInspection: "2026-06-10",
    totalFlightHours: 38_420,
    manufactureYear: 2008,
  },
  {
    id: "ac-002",
    registration: "A6-ECB",
    model: "Boeing 777-31H(ER)",
    shortModel: "777-300ER",
    manufacturer: "Boeing",
    airline: "Emirates",
    status: "Active",
    lastInspection: "2026-04-02",
    nextInspection: "2026-07-02",
    totalFlightHours: 51_034,
    manufactureYear: 2003,
  },
  {
    // Unreal Engine hangar-scene simulation — drone orbits aircraft at eye-level
    // (Middle loop phase, z = 1.6 m).  Zone mapping derived from
    // image_coordinates_labeled.csv using frame index → aircraft_region.
    id: "ac-003",
    registration: "SIM-002",
    model: "Simulation Research Aircraft (Hangar)",
    shortModel: "SIM-H",
    manufacturer: "AeroScan 3D Lab",
    airline: "Research & Training",
    status: "Active",
    lastInspection: "2026-04-28",
    nextInspection: "2026-07-28",
    totalFlightHours: 0,
    manufactureYear: 2023,
  },
  {
    id: "ac-004",
    registration: "A6-EEF",
    model: "Airbus A380-861",
    shortModel: "A380",
    manufacturer: "Airbus",
    airline: "Emirates",
    status: "Active",
    lastInspection: "2026-03-28",
    nextInspection: "2026-06-28",
    totalFlightHours: 29_615,
    manufactureYear: 2013,
  },
  {
    id: "ac-005",
    registration: "A6-EBA",
    model: "Boeing 777-31H(ER)",
    shortModel: "777-300ER",
    manufacturer: "Boeing",
    airline: "Emirates",
    status: "Grounded",
    lastInspection: "2026-01-05",
    nextInspection: "2026-04-05",
    totalFlightHours: 67_102,
    manufactureYear: 2001,
  },
  {
    // Synthetic 3D simulation model used as the ML training reference aircraft.
    // Zones were computed from image_surface_coordinates.csv × regions.json.
    id: "ac-006",
    registration: "SIM-001",
    model: "Simulation Research Aircraft",
    shortModel: "SIM",
    manufacturer: "AeroScan 3D Lab",
    airline: "Research & Training",
    status: "Active",
    lastInspection: "2026-04-10",
    nextInspection: "2026-07-10",
    totalFlightHours: 0,           // ground-based simulation rig
    manufactureYear: 2023,
  },
];

// ─── Historical Flight Records ────────────────────────────────────────────────

const BASE_HISTORY: FlightRecord[] = [

  // ── A6-EDA (ac-001) ────────────────────────────────────────────────────────
  {
    id: "fl-0101",
    aircraftId: "ac-001",
    date: "2025-06-12",
    duration: "38 min",
    pilotName: "Capt. Ahmed Al-Rashidi",
    engineer: "Capt. Ahmed Al-Rashidi",
    status: "Archived",
    accessCode: "AX7K3M",
    findings: [
      {
        id: "fnd-0101-1", flightId: "fl-0101", aircraftId: "ac-001",
        type: "Crack", severity: "High", confidence: 0.91,
        zone: "Forward fuselage", timestamp: "09:14:22",
        notes: "Crack near panel seam. Marked for structural review and repaired.",
        resolved: true, reoccurrence: false,
      },
      {
        id: "fnd-0101-2", flightId: "fl-0101", aircraftId: "ac-001",
        type: "Dent", severity: "Medium", confidence: 0.82,
        zone: "Wing root (left)", timestamp: "09:21:48",
        notes: "Surface dent, likely from ground handling equipment.",
        resolved: true, reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0102",
    aircraftId: "ac-001",
    date: "2025-09-05",
    duration: "44 min",
    pilotName: "Capt. Sarah Mitchell",
    engineer: "Capt. Sarah Mitchell",
    status: "Archived",
    accessCode: "BN9P2Q",
    findings: [
      {
        id: "fnd-0102-1", flightId: "fl-0102", aircraftId: "ac-001",
        type: "Crack", severity: "High", confidence: 0.94,
        zone: "Forward fuselage", timestamp: "11:02:33",
        notes: "Crack re-detected near prior repair site. Structural team alerted.",
        resolved: true, reoccurrence: true,
      },
      {
        id: "fnd-0102-2", flightId: "fl-0102", aircraftId: "ac-001",
        type: "Corrosion", severity: "Low", confidence: 0.74,
        zone: "Aft fuselage", timestamp: "11:35:19",
        notes: "Minor surface corrosion. Cleaned and treated on-site.",
        resolved: true, reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0103",
    aircraftId: "ac-001",
    date: "2026-01-22",
    duration: "47 min",
    pilotName: "Capt. Khalid Hassan",
    engineer: "Capt. Khalid Hassan",
    status: "Completed",
    accessCode: "CK4R7T",
    findings: [
      {
        id: "fnd-0103-1", flightId: "fl-0103", aircraftId: "ac-001",
        type: "Crack", severity: "Medium", confidence: 0.87,
        zone: "Forward fuselage", timestamp: "14:18:07",
        notes: "Third occurrence in this zone. Panel replacement assessment recommended.",
        resolved: true, reoccurrence: true,
      },
      {
        id: "fnd-0103-2", flightId: "fl-0103", aircraftId: "ac-001",
        type: "Dent", severity: "Low", confidence: 0.76,
        zone: "Wing root (left)", timestamp: "14:42:55",
        notes: "Shallow dent on leading edge. Within acceptable limits.",
        resolved: true, reoccurrence: true,
      },
    ],
  },
  {
    id: "fl-0104",
    aircraftId: "ac-001",
    date: "2026-03-10",
    duration: "53 min",
    pilotName: "Capt. James Cooper",
    engineer: "Capt. James Cooper",
    status: "Pending Review",
    accessCode: "EQ1V5X",
    findings: [
      {
        id: "D-104", flightId: "fl-0104", aircraftId: "ac-001",
        type: "Crack", severity: "High", confidence: 0.91,
        zone: "Forward fuselage", timestamp: "10:14:22",
        notes: "Clear crack candidate near panel seam. Fourth detected occurrence in this zone.",
        resolved: false, reoccurrence: true,
      },
      {
        id: "D-103", flightId: "fl-0104", aircraftId: "ac-001",
        type: "Dent", severity: "Medium", confidence: 0.82,
        zone: "Wing root (left)", timestamp: "10:11:48",
        notes: "Needs manual confirmation. Third occurrence at this wing root.",
        resolved: false, reoccurrence: true,
      },
      {
        id: "D-102", flightId: "fl-0104", aircraftId: "ac-001",
        type: "Corrosion", severity: "Low", confidence: 0.74,
        zone: "Aft fuselage", timestamp: "10:08:09",
        notes: "Minor surface degradation.",
        resolved: true, reoccurrence: false,
      },
    ],
  },

  // ── A6-ECB (ac-002) ────────────────────────────────────────────────────────
  {
    id: "fl-0201",
    aircraftId: "ac-002",
    date: "2025-07-15",
    duration: "40 min",
    pilotName: "Capt. Sarah Mitchell",
    engineer: "Capt. Sarah Mitchell",
    status: "Archived",
    accessCode: "FR6Y9Z",
    findings: [
      {
        id: "fnd-0201-1", flightId: "fl-0201", aircraftId: "ac-002",
        type: "Dent", severity: "Medium", confidence: 0.88,
        zone: "Nose section", timestamp: "08:30:15",
        notes: "Impact dent on nose radome. Likely bird strike. Repaired.",
        resolved: true, reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0202",
    aircraftId: "ac-002",
    date: "2025-10-03",
    duration: "35 min",
    pilotName: "Capt. Khalid Hassan",
    engineer: "Capt. Khalid Hassan",
    status: "Archived",
    accessCode: "GT3B4N",
    findings: [
      {
        id: "fnd-0202-1", flightId: "fl-0202", aircraftId: "ac-002",
        type: "Corrosion", severity: "Medium", confidence: 0.79,
        zone: "Horizontal stabilizer", timestamp: "13:12:08",
        notes: "Surface corrosion on lower surface. Sanded and recoated.",
        resolved: true, reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0203",
    aircraftId: "ac-002",
    date: "2026-04-02",
    duration: "61 min",
    pilotName: "Capt. James Cooper",
    engineer: "Capt. James Cooper",
    status: "Pending Review",
    accessCode: "HV8C1P",
    findings: [
      {
        id: "fnd-0203-1", flightId: "fl-0203", aircraftId: "ac-002",
        type: "Corrosion", severity: "High", confidence: 0.93,
        zone: "Horizontal stabilizer", timestamp: "09:55:22",
        notes: "Severe corrosion recurrence. Aircraft scheduled for deep maintenance.",
        resolved: false, reoccurrence: true,
      },
      {
        id: "fnd-0203-2", flightId: "fl-0203", aircraftId: "ac-002",
        type: "Crack", severity: "Medium", confidence: 0.81,
        zone: "Wing root (right)", timestamp: "11:08:33",
        notes: "Stress crack near wing-body junction. Monitoring required.",
        resolved: false, reoccurrence: false,
      },
    ],
  },

  // ── SIM-002 (ac-003) — Unreal Engine Hangar Simulation ────────────────────
  // Middle loop phase (z = 1.6 m): eye-level orbital pass around the aircraft.
  // Zones derived from image_coordinates_labeled.csv.
  {
    id: "fl-0301",
    aircraftId: "ac-003",
    date: "2025-11-20",
    duration: "18 min",
    pilotName: "Auto-Scan System",
    engineer: "Auto-Scan System",
    status: "Archived",
    accessCode: "HSM3A1",
    findings: [
      {
        id: "fnd-0301-1", flightId: "fl-0301", aircraftId: "ac-003",
        type: "Dent", severity: "High", confidence: 0.810,
        zone: "Mid Fuselage — Nose Left", timestamp: "10:42:18",
        notes: "Dent detected on forward fuselage left side during hangar middle-loop pass. Used as baseline reference.",
        resolved: true, reoccurrence: false,
      },
      {
        id: "fnd-0301-2", flightId: "fl-0301", aircraftId: "ac-003",
        type: "Crack", severity: "Medium", confidence: 0.570,
        zone: "Mid Fuselage — Mid Left", timestamp: "10:44:55",
        notes: "Crack candidate on mid-body left panel. Model classified with moderate confidence.",
        resolved: true, reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0302",
    aircraftId: "ac-003",
    date: "2026-02-10",
    duration: "22 min",
    pilotName: "Auto-Scan System",
    engineer: "Auto-Scan System",
    status: "Completed",
    accessCode: "HSM3B2",
    findings: [
      {
        id: "fnd-0302-1", flightId: "fl-0302", aircraftId: "ac-003",
        type: "Crack", severity: "High", confidence: 0.720,
        zone: "Mid Fuselage — Rear Right", timestamp: "09:31:40",
        notes: "High-confidence crack on rear-right fuselage. Recurring zone flagged for monitoring.",
        resolved: false, reoccurrence: true,
      },
      {
        id: "fnd-0302-2", flightId: "fl-0302", aircraftId: "ac-003",
        type: "Crack", severity: "Medium", confidence: 0.530,
        zone: "Mid Fuselage — Rear Left", timestamp: "09:29:12",
        notes: "Crack pattern on rear-left fuselage panel. Added to training dataset.",
        resolved: true, reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0303",
    aircraftId: "ac-003",
    date: "2026-04-28",
    duration: "25 min",
    pilotName: "Auto-Scan System",
    engineer: "Auto-Scan System",
    status: "Pending Review",
    accessCode: "HSM3C3",
    findings: [
      {
        id: "fnd-0303-1", flightId: "fl-0303", aircraftId: "ac-003",
        type: "Crack", severity: "High", confidence: 0.720,
        zone: "Mid Fuselage — Rear Right", timestamp: "11:15:08",
        notes: "Third detection of crack in rear-right zone. Pattern confirmed — added to recurrence tracker.",
        resolved: false, reoccurrence: true,
      },
      {
        id: "fnd-0303-2", flightId: "fl-0303", aircraftId: "ac-003",
        type: "Dent", severity: "Medium", confidence: 0.660,
        zone: "Mid Fuselage — Nose Right", timestamp: "11:18:33",
        notes: "Dent on forward fuselage right side. Pending manual confirmation.",
        resolved: false, reoccurrence: false,
      },
      {
        id: "fnd-0303-3", flightId: "fl-0303", aircraftId: "ac-003",
        type: "Crack", severity: "Medium", confidence: 0.530,
        zone: "Mid Fuselage — Mid Right", timestamp: "11:21:47",
        notes: "Crack on mid-body right panel. Below structural threshold — flagged for monitoring.",
        resolved: false, reoccurrence: false,
      },
    ],
  },

  // ── A6-EEF (ac-004) ────────────────────────────────────────────────────────
  {
    id: "fl-0401",
    aircraftId: "ac-004",
    date: "2025-10-22",
    duration: "41 min",
    pilotName: "Capt. Khalid Hassan",
    engineer: "Capt. Khalid Hassan",
    status: "Archived",
    accessCode: "MZ7G8Q",
    findings: [
      {
        id: "fnd-0401-1", flightId: "fl-0401", aircraftId: "ac-004",
        type: "Dent", severity: "Low", confidence: 0.73,
        zone: "Belly fairing", timestamp: "14:10:27",
        notes: "Small dent on lower fuselage fairing. Cosmetic only.",
        resolved: true, reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0402",
    aircraftId: "ac-004",
    date: "2026-03-28",
    duration: "43 min",
    pilotName: "Capt. James Cooper",
    engineer: "Capt. James Cooper",
    status: "Completed",
    accessCode: "NA2H5R",
    findings: [
      {
        id: "fnd-0402-1", flightId: "fl-0402", aircraftId: "ac-004",
        type: "Corrosion", severity: "Medium", confidence: 0.86,
        zone: "Engine cowling (2)", timestamp: "09:33:05",
        notes: "Corrosion on engine 2 nacelle. Treated and logged.",
        resolved: false, reoccurrence: false,
      },
    ],
  },

  // ── SIM-001 (ac-006) — Simulation Research Aircraft ───────────────────────
  {
    id: "fl-0601",
    aircraftId: "ac-006",
    date: "2025-11-08",
    duration: "22 min",
    pilotName: "Auto-Scan System",
    engineer: "Auto-Scan System",
    status: "Archived",
    accessCode: "SIM6A1",
    findings: [
      {
        id: "fnd-0601-1", flightId: "fl-0601", aircraftId: "ac-006",
        type: "Crack", severity: "High", confidence: 0.92,
        zone: "Fuselage", timestamp: "10:02:14",
        notes: "Crack detected on fuselage skin panel during initial simulation pass. Used as baseline reference for ML model validation.",
        resolved: true, reoccurrence: false,
      },
      {
        id: "fnd-0601-2", flightId: "fl-0601", aircraftId: "ac-006",
        type: "Crack", severity: "High", confidence: 0.91,
        zone: "Fuselage", timestamp: "10:04:38",
        notes: "Second fuselage crack identified near window row. Model correctly classified with high confidence.",
        resolved: true, reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0602",
    aircraftId: "ac-006",
    date: "2026-02-14",
    duration: "28 min",
    pilotName: "Auto-Scan System",
    engineer: "Auto-Scan System",
    status: "Completed",
    accessCode: "SIM6B2",
    findings: [
      {
        id: "fnd-0602-1", flightId: "fl-0602", aircraftId: "ac-006",
        type: "Crack", severity: "High", confidence: 0.929,
        zone: "Fuselage", timestamp: "09:18:55",
        notes: "Reoccurrence of crack pattern in mid-fuselage region. 3D model texture updated post-detection.",
        resolved: true, reoccurrence: true,
      },
      {
        id: "fnd-0602-2", flightId: "fl-0602", aircraftId: "ac-006",
        type: "Crack", severity: "Medium", confidence: 0.904,
        zone: "Fuselage", timestamp: "09:22:11",
        notes: "Additional crack detected aft of wing box. Added to training dataset for YOLOv11 fine-tuning.",
        resolved: true, reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0603",
    aircraftId: "ac-006",
    date: "2026-04-10",
    duration: "31 min",
    pilotName: "Auto-Scan System",
    engineer: "Auto-Scan System",
    status: "Pending Review",
    accessCode: "SIM6C3",
    findings: [
      {
        id: "fnd-0603-1", flightId: "fl-0603", aircraftId: "ac-006",
        type: "Crack", severity: "High", confidence: 0.912,
        zone: "Fuselage", timestamp: "11:05:42",
        notes: "Forward fuselage crack near door surround. Third occurrence — pattern added to recurrence tracker.",
        resolved: false, reoccurrence: true,
      },
      {
        id: "fnd-0603-2", flightId: "fl-0603", aircraftId: "ac-006",
        type: "Crack", severity: "High", confidence: 0.877,
        zone: "Fuselage", timestamp: "11:08:19",
        notes: "Longitudinal crack along panel seam. Pending manual inspection confirmation.",
        resolved: false, reoccurrence: false,
      },
      {
        id: "fnd-0603-3", flightId: "fl-0603", aircraftId: "ac-006",
        type: "Crack", severity: "Medium", confidence: 0.859,
        zone: "Fuselage", timestamp: "11:11:37",
        notes: "Hairline crack at stringer junction. Below structural threshold but flagged for monitoring.",
        resolved: false, reoccurrence: false,
      },
    ],
  },

  // ── A6-EBA (ac-005) ────────────────────────────────────────────────────────
  {
    id: "fl-0501",
    aircraftId: "ac-005",
    date: "2025-09-14",
    duration: "36 min",
    pilotName: "Capt. Ahmed Al-Rashidi",
    engineer: "Capt. Ahmed Al-Rashidi",
    status: "Archived",
    accessCode: "PB6J1S",
    findings: [
      {
        id: "fnd-0501-1", flightId: "fl-0501", aircraftId: "ac-005",
        type: "Crack", severity: "High", confidence: 0.95,
        zone: "Wing root (right)", timestamp: "07:45:18",
        notes: "Structural crack detected. Immediate maintenance performed.",
        resolved: true, reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0502",
    aircraftId: "ac-005",
    date: "2026-01-05",
    duration: "62 min",
    pilotName: "Capt. James Cooper",
    engineer: "Capt. James Cooper",
    status: "Completed",
    accessCode: "QC9K4T",
    findings: [
      {
        id: "fnd-0502-1", flightId: "fl-0502", aircraftId: "ac-005",
        type: "Crack", severity: "High", confidence: 0.97,
        zone: "Wing root (right)", timestamp: "11:30:09",
        notes: "Structural crack recurred at wing root. Aircraft grounded pending engineering assessment.",
        resolved: false, reoccurrence: true,
      },
      {
        id: "fnd-0502-2", flightId: "fl-0502", aircraftId: "ac-005",
        type: "Corrosion", severity: "High", confidence: 0.89,
        zone: "Tail cone", timestamp: "11:55:33",
        notes: "Extensive corrosion at tail cone structure.",
        resolved: false, reoccurrence: false,
      },
    ],
  },
];

// ─── localStorage persistence for new missions ────────────────────────────────

const LS_FLIGHTS_KEY = "aeroscan_flights";

function loadUserFlights(): FlightRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LS_FLIGHTS_KEY) ?? "[]") as FlightRecord[];
  } catch {
    return [];
  }
}

export function saveFlightRecord(record: FlightRecord): void {
  const existing = loadUserFlights();
  // Prevent duplicates
  const filtered = existing.filter((f) => f.id !== record.id);
  localStorage.setItem(LS_FLIGHTS_KEY, JSON.stringify([record, ...filtered]));
}

export function getFlightByCode(code: string): FlightRecord | null {
  const all = [...BASE_HISTORY, ...loadUserFlights()];
  return all.find((f) => f.accessCode.toUpperCase() === code.toUpperCase().trim()) ?? null;
}

export function getAircraftByCode(code: string): Aircraft | null {
  const flight = getFlightByCode(code);
  if (!flight) return null;
  return FLEET.find((a) => a.id === flight.aircraftId) ?? null;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getAircraftFlights(aircraftId: string): FlightRecord[] {
  const base = BASE_HISTORY.filter((f) => f.aircraftId === aircraftId);
  const user = loadUserFlights().filter((f) => f.aircraftId === aircraftId);
  // Merge, deduplicate by id, sort newest first
  const all = [...user, ...base];
  const seen = new Set<string>();
  return all
    .filter((f) => { if (seen.has(f.id)) return false; seen.add(f.id); return true; })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllFindings(aircraftId: string): HistoricalFinding[] {
  return getAircraftFlights(aircraftId).flatMap((f) => f.findings);
}

export function getZoneRecurrences(aircraftId: string): ZoneRecurrence[] {
  const flights = [...getAircraftFlights(aircraftId)].reverse(); // oldest first
  const map = new Map<string, ZoneRecurrence>();

  for (const flight of flights) {
    for (const finding of flight.findings) {
      const key = `${finding.zone}::${finding.type}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.lastSeverity = finding.severity;
        existing.flightDates.push(flight.date);
      } else {
        map.set(key, {
          zone: finding.zone,
          type: finding.type,
          count: 1,
          lastSeverity: finding.severity,
          flightDates: [flight.date],
        });
      }
    }
  }

  return Array.from(map.values())
    .filter((r) => r.count > 1)
    .sort((a, b) => b.count - a.count);
}

export function getUnresolvedCount(aircraftId: string): number {
  return getAllFindings(aircraftId).filter((f) => !f.resolved).length;
}

// ── BASE_HISTORY-only helpers (no localStorage pollution) ─────────────────────
// Use these in Flight History so repeated demo runs don't inflate counts.

export function getBaseFlights(aircraftId: string): FlightRecord[] {
  return BASE_HISTORY
    .filter((f) => f.aircraftId === aircraftId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBaseZoneRecurrences(aircraftId: string): ZoneRecurrence[] {
  const flights = [...getBaseFlights(aircraftId)].reverse(); // oldest → newest
  const map = new Map<string, ZoneRecurrence>();

  for (const flight of flights) {
    for (const finding of flight.findings) {
      const key = `${finding.zone}::${finding.type}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.lastSeverity = finding.severity;
        existing.flightDates.push(flight.date);
      } else {
        map.set(key, {
          zone:         finding.zone,
          type:         finding.type,
          count:        1,
          lastSeverity: finding.severity,
          flightDates:  [flight.date],
        });
      }
    }
  }

  return Array.from(map.values())
    .filter((r) => r.count > 1)
    .sort((a, b) => b.count - a.count);
}

/** Generate a random 6-char uppercase alphanumeric access code. */
export function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/1/0 to avoid confusion
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
