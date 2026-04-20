// src/data/fleetStore.ts
// Central data store: aircraft fleet + full inspection / flight history

export type AircraftStatus = "Active" | "In Maintenance" | "Grounded";
export type FindingType = "Crack" | "Dent" | "Corrosion";
export type Severity = "Low" | "Medium" | "High";
export type FlightStatus = "Completed" | "Pending Review" | "Archived";

export interface Aircraft {
  id: string;
  registration: string;
  model: string;
  manufacturer: string;
  airline: string;
  status: AircraftStatus;
  lastInspection: string;   // ISO date string "YYYY-MM-DD"
  nextInspection: string;
  totalFlights: number;
  manufactureYear: number;
}

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
  reoccurrence: boolean; // same zone+type flagged in a prior flight for this aircraft
}

export interface FlightRecord {
  id: string;
  aircraftId: string;
  date: string;       // "YYYY-MM-DD"
  duration: string;   // "42 min"
  engineer: string;
  status: FlightStatus;
  findings: HistoricalFinding[];
}

export interface ZoneRecurrence {
  zone: string;
  type: FindingType;
  count: number;
  lastSeverity: Severity;
  flightDates: string[];
}

// ─── Fleet ───────────────────────────────────────────────────────────────────

export const FLEET: Aircraft[] = [
  {
    id: "ac-001",
    registration: "A6-EDB",
    model: "Boeing 777-300ER",
    manufacturer: "Boeing",
    airline: "Emirates",
    status: "Active",
    lastInspection: "2026-03-10",
    nextInspection: "2026-06-10",
    totalFlights: 4821,
    manufactureYear: 2008,
  },
  {
    id: "ac-002",
    registration: "A6-EDC",
    model: "Boeing 777-300ER",
    manufacturer: "Boeing",
    airline: "Emirates",
    status: "In Maintenance",
    lastInspection: "2026-04-02",
    nextInspection: "2026-07-02",
    totalFlights: 5103,
    manufactureYear: 2008,
  },
  {
    id: "ac-003",
    registration: "A6-EAF",
    model: "Airbus A380-800",
    manufacturer: "Airbus",
    airline: "Emirates",
    status: "Active",
    lastInspection: "2026-03-28",
    nextInspection: "2026-06-28",
    totalFlights: 3247,
    manufactureYear: 2012,
  },
  {
    id: "ac-004",
    registration: "A6-EUB",
    model: "Boeing 777-200LR",
    manufacturer: "Boeing",
    airline: "Emirates",
    status: "Grounded",
    lastInspection: "2026-01-05",
    nextInspection: "2026-04-05",
    totalFlights: 6701,
    manufactureYear: 2006,
  },
  {
    id: "ac-005",
    registration: "A6-EPC",
    model: "Airbus A380-800",
    manufacturer: "Airbus",
    airline: "Emirates",
    status: "Active",
    lastInspection: "2026-04-01",
    nextInspection: "2026-07-01",
    totalFlights: 2891,
    manufactureYear: 2014,
  },
];

// ─── Flight History ───────────────────────────────────────────────────────────
// Sorted oldest→newest per aircraft so recurrence logic is natural.
// The most recent flight for A6-EDB (fl-0105) mirrors the ResultsReview demo data.

export const FLIGHT_HISTORY: FlightRecord[] = [

  // ── A6-EDB (ac-001) ────────────────────────────────────────────────────────
  {
    id: "fl-0101",
    aircraftId: "ac-001",
    date: "2025-06-12",
    duration: "38 min",
    engineer: "Eng. Ahmed Al-Rashidi",
    status: "Archived",
    findings: [
      {
        id: "fnd-0101-1",
        flightId: "fl-0101",
        aircraftId: "ac-001",
        type: "Crack",
        severity: "High",
        confidence: 0.91,
        zone: "Forward fuselage",
        timestamp: "09:14:22",
        notes: "Crack near panel seam. Marked for structural review and repaired.",
        resolved: true,
        reoccurrence: false,
      },
      {
        id: "fnd-0101-2",
        flightId: "fl-0101",
        aircraftId: "ac-001",
        type: "Dent",
        severity: "Medium",
        confidence: 0.82,
        zone: "Wing root (left)",
        timestamp: "09:21:48",
        notes: "Surface dent, likely from ground handling equipment.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0102",
    aircraftId: "ac-001",
    date: "2025-09-05",
    duration: "44 min",
    engineer: "Eng. Sarah Mitchell",
    status: "Archived",
    findings: [
      {
        id: "fnd-0102-1",
        flightId: "fl-0102",
        aircraftId: "ac-001",
        type: "Crack",
        severity: "High",
        confidence: 0.94,
        zone: "Forward fuselage",
        timestamp: "11:02:33",
        notes: "Crack re-detected near prior repair site. Structural team alerted.",
        resolved: true,
        reoccurrence: true,
      },
      {
        id: "fnd-0102-2",
        flightId: "fl-0102",
        aircraftId: "ac-001",
        type: "Corrosion",
        severity: "Low",
        confidence: 0.74,
        zone: "Aft fuselage",
        timestamp: "11:35:19",
        notes: "Minor surface corrosion. Cleaned and treated on-site.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0103",
    aircraftId: "ac-001",
    date: "2025-11-18",
    duration: "51 min",
    engineer: "Eng. Khalid Hassan",
    status: "Archived",
    findings: [
      {
        id: "fnd-0103-1",
        flightId: "fl-0103",
        aircraftId: "ac-001",
        type: "Crack",
        severity: "Medium",
        confidence: 0.87,
        zone: "Forward fuselage",
        timestamp: "14:18:07",
        notes: "Third occurrence in this zone. Structural panel replacement assessment recommended.",
        resolved: true,
        reoccurrence: true,
      },
      {
        id: "fnd-0103-2",
        flightId: "fl-0103",
        aircraftId: "ac-001",
        type: "Dent",
        severity: "Low",
        confidence: 0.76,
        zone: "Engine cowling (1)",
        timestamp: "14:42:55",
        notes: "Shallow dent on leading edge. Within acceptable limits.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0104",
    aircraftId: "ac-001",
    date: "2026-01-22",
    duration: "47 min",
    engineer: "Eng. Ahmed Al-Rashidi",
    status: "Completed",
    findings: [
      {
        id: "fnd-0104-1",
        flightId: "fl-0104",
        aircraftId: "ac-001",
        type: "Dent",
        severity: "Medium",
        confidence: 0.85,
        zone: "Wing root (left)",
        timestamp: "10:09:41",
        notes: "Dent in same region as previous inspection. Recurring stress point under review.",
        resolved: true,
        reoccurrence: true,
      },
      {
        id: "fnd-0104-2",
        flightId: "fl-0104",
        aircraftId: "ac-001",
        type: "Corrosion",
        severity: "Low",
        confidence: 0.71,
        zone: "Belly fairing",
        timestamp: "10:38:12",
        notes: "Light surface oxidation detected. Treated on-site.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    // Most recent flight — findings match ResultsReview demo data
    id: "fl-0105",
    aircraftId: "ac-001",
    date: "2026-03-10",
    duration: "53 min",
    engineer: "Eng. James Cooper",
    status: "Pending Review",
    findings: [
      {
        id: "D-104",
        flightId: "fl-0105",
        aircraftId: "ac-001",
        type: "Crack",
        severity: "High",
        confidence: 0.91,
        zone: "Forward fuselage",
        timestamp: "10:14:22",
        notes: "Clear crack candidate near panel seam. Fourth detected occurrence in this zone.",
        resolved: false,
        reoccurrence: true,
      },
      {
        id: "D-103",
        flightId: "fl-0105",
        aircraftId: "ac-001",
        type: "Dent",
        severity: "Medium",
        confidence: 0.82,
        zone: "Wing root (left)",
        timestamp: "10:11:48",
        notes: "Needs manual confirmation. Second occurrence at this wing root.",
        resolved: false,
        reoccurrence: true,
      },
      {
        id: "D-102",
        flightId: "fl-0105",
        aircraftId: "ac-001",
        type: "Corrosion",
        severity: "Low",
        confidence: 0.74,
        zone: "Aft fuselage",
        timestamp: "10:08:09",
        notes: "Minor surface degradation.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },

  // ── A6-EDC (ac-002) ────────────────────────────────────────────────────────
  {
    id: "fl-0201",
    aircraftId: "ac-002",
    date: "2025-07-15",
    duration: "40 min",
    engineer: "Eng. Sarah Mitchell",
    status: "Archived",
    findings: [
      {
        id: "fnd-0201-1",
        flightId: "fl-0201",
        aircraftId: "ac-002",
        type: "Dent",
        severity: "Medium",
        confidence: 0.88,
        zone: "Nose section",
        timestamp: "08:30:15",
        notes: "Impact dent on nose radome. Likely bird strike. Repaired.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0202",
    aircraftId: "ac-002",
    date: "2025-10-03",
    duration: "35 min",
    engineer: "Eng. Khalid Hassan",
    status: "Archived",
    findings: [
      {
        id: "fnd-0202-1",
        flightId: "fl-0202",
        aircraftId: "ac-002",
        type: "Corrosion",
        severity: "Medium",
        confidence: 0.79,
        zone: "Horizontal stabilizer",
        timestamp: "13:12:08",
        notes: "Surface corrosion on lower surface. Sanded and recoated.",
        resolved: true,
        reoccurrence: false,
      },
      {
        id: "fnd-0202-2",
        flightId: "fl-0202",
        aircraftId: "ac-002",
        type: "Crack",
        severity: "Low",
        confidence: 0.73,
        zone: "Aft fuselage",
        timestamp: "13:44:50",
        notes: "Hairline fracture in non-structural panel. Sealed.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0203",
    aircraftId: "ac-002",
    date: "2026-02-18",
    duration: "58 min",
    engineer: "Eng. Ahmed Al-Rashidi",
    status: "Completed",
    findings: [
      {
        id: "fnd-0203-1",
        flightId: "fl-0203",
        aircraftId: "ac-002",
        type: "Corrosion",
        severity: "High",
        confidence: 0.93,
        zone: "Horizontal stabilizer",
        timestamp: "09:55:22",
        notes: "Severe corrosion recurrence. Aircraft scheduled for deep maintenance.",
        resolved: false,
        reoccurrence: true,
      },
      {
        id: "fnd-0203-2",
        flightId: "fl-0203",
        aircraftId: "ac-002",
        type: "Dent",
        severity: "Low",
        confidence: 0.68,
        zone: "Landing gear bay",
        timestamp: "10:20:11",
        notes: "Minor dent near bay door hinge.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0204",
    aircraftId: "ac-002",
    date: "2026-04-02",
    duration: "61 min",
    engineer: "Eng. James Cooper",
    status: "Pending Review",
    findings: [
      {
        id: "fnd-0204-1",
        flightId: "fl-0204",
        aircraftId: "ac-002",
        type: "Crack",
        severity: "Medium",
        confidence: 0.81,
        zone: "Wing root (right)",
        timestamp: "11:08:33",
        notes: "Stress crack near wing-body junction. Monitoring required.",
        resolved: false,
        reoccurrence: false,
      },
    ],
  },

  // ── A6-EAF (ac-003) ────────────────────────────────────────────────────────
  {
    id: "fl-0301",
    aircraftId: "ac-003",
    date: "2025-08-20",
    duration: "55 min",
    engineer: "Eng. James Cooper",
    status: "Archived",
    findings: [
      {
        id: "fnd-0301-1",
        flightId: "fl-0301",
        aircraftId: "ac-003",
        type: "Corrosion",
        severity: "Low",
        confidence: 0.77,
        zone: "Engine cowling (3)",
        timestamp: "15:22:44",
        notes: "Surface corrosion on engine nacelle. Treatment applied.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0302",
    aircraftId: "ac-003",
    date: "2025-12-09",
    duration: "48 min",
    engineer: "Eng. Sarah Mitchell",
    status: "Archived",
    findings: [
      {
        id: "fnd-0302-1",
        flightId: "fl-0302",
        aircraftId: "ac-003",
        type: "Dent",
        severity: "Medium",
        confidence: 0.84,
        zone: "Belly fairing",
        timestamp: "10:48:12",
        notes: "Impact dent on lower fuselage fairing. Repaired.",
        resolved: true,
        reoccurrence: false,
      },
      {
        id: "fnd-0302-2",
        flightId: "fl-0302",
        aircraftId: "ac-003",
        type: "Crack",
        severity: "Low",
        confidence: 0.71,
        zone: "Vertical stabilizer",
        timestamp: "11:15:30",
        notes: "Micro-crack in surface coating. Non-structural, sealed.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0303",
    aircraftId: "ac-003",
    date: "2026-03-28",
    duration: "43 min",
    engineer: "Eng. Khalid Hassan",
    status: "Completed",
    findings: [
      {
        id: "fnd-0303-1",
        flightId: "fl-0303",
        aircraftId: "ac-003",
        type: "Corrosion",
        severity: "Medium",
        confidence: 0.86,
        zone: "Engine cowling (3)",
        timestamp: "09:33:05",
        notes: "Corrosion returned to engine cowling 3. More aggressive treatment required.",
        resolved: false,
        reoccurrence: true,
      },
    ],
  },

  // ── A6-EUB (ac-004) ────────────────────────────────────────────────────────
  {
    id: "fl-0401",
    aircraftId: "ac-004",
    date: "2025-09-14",
    duration: "36 min",
    engineer: "Eng. Ahmed Al-Rashidi",
    status: "Archived",
    findings: [
      {
        id: "fnd-0401-1",
        flightId: "fl-0401",
        aircraftId: "ac-004",
        type: "Crack",
        severity: "High",
        confidence: 0.95,
        zone: "Wing root (right)",
        timestamp: "07:45:18",
        notes: "Structural crack detected. Immediate maintenance performed.",
        resolved: true,
        reoccurrence: false,
      },
      {
        id: "fnd-0401-2",
        flightId: "fl-0401",
        aircraftId: "ac-004",
        type: "Dent",
        severity: "Medium",
        confidence: 0.80,
        zone: "Nose section",
        timestamp: "08:02:44",
        notes: "Significant dent on nose cone.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0402",
    aircraftId: "ac-004",
    date: "2026-01-05",
    duration: "62 min",
    engineer: "Eng. James Cooper",
    status: "Completed",
    findings: [
      {
        id: "fnd-0402-1",
        flightId: "fl-0402",
        aircraftId: "ac-004",
        type: "Crack",
        severity: "High",
        confidence: 0.97,
        zone: "Wing root (right)",
        timestamp: "11:30:09",
        notes: "Structural crack recurred at wing root. Aircraft grounded pending engineering assessment.",
        resolved: false,
        reoccurrence: true,
      },
      {
        id: "fnd-0402-2",
        flightId: "fl-0402",
        aircraftId: "ac-004",
        type: "Corrosion",
        severity: "High",
        confidence: 0.89,
        zone: "Tail cone",
        timestamp: "11:55:33",
        notes: "Extensive corrosion at tail cone structure.",
        resolved: false,
        reoccurrence: false,
      },
    ],
  },

  // ── A6-EPC (ac-005) ────────────────────────────────────────────────────────
  {
    id: "fl-0501",
    aircraftId: "ac-005",
    date: "2025-10-22",
    duration: "41 min",
    engineer: "Eng. Sarah Mitchell",
    status: "Archived",
    findings: [
      {
        id: "fnd-0501-1",
        flightId: "fl-0501",
        aircraftId: "ac-005",
        type: "Dent",
        severity: "Low",
        confidence: 0.73,
        zone: "Engine cowling (2)",
        timestamp: "14:10:27",
        notes: "Small dent on engine 2 nacelle inlet. Cosmetic only.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0502",
    aircraftId: "ac-005",
    date: "2026-01-30",
    duration: "44 min",
    engineer: "Eng. Khalid Hassan",
    status: "Archived",
    findings: [
      {
        id: "fnd-0502-1",
        flightId: "fl-0502",
        aircraftId: "ac-005",
        type: "Corrosion",
        severity: "Low",
        confidence: 0.69,
        zone: "Aft fuselage",
        timestamp: "09:28:15",
        notes: "Light surface oxidation. Treated and logged.",
        resolved: true,
        reoccurrence: false,
      },
    ],
  },
  {
    id: "fl-0503",
    aircraftId: "ac-005",
    date: "2026-04-01",
    duration: "39 min",
    engineer: "Eng. Ahmed Al-Rashidi",
    status: "Pending Review",
    findings: [
      {
        id: "fnd-0503-1",
        flightId: "fl-0503",
        aircraftId: "ac-005",
        type: "Crack",
        severity: "Medium",
        confidence: 0.83,
        zone: "Horizontal stabilizer",
        timestamp: "10:52:44",
        notes: "Stress crack on stabilizer trailing edge. Requires monitoring.",
        resolved: false,
        reoccurrence: false,
      },
      {
        id: "fnd-0503-2",
        flightId: "fl-0503",
        aircraftId: "ac-005",
        type: "Dent",
        severity: "Low",
        confidence: 0.71,
        zone: "Engine cowling (2)",
        timestamp: "11:14:08",
        notes: "Repeat dent on engine 2 cowling. Same location as prior inspection.",
        resolved: false,
        reoccurrence: true,
      },
    ],
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Returns flights for an aircraft, newest first. */
export function getAircraftFlights(aircraftId: string): FlightRecord[] {
  return FLIGHT_HISTORY
    .filter((f) => f.aircraftId === aircraftId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** All findings across all flights for an aircraft. */
export function getAllFindings(aircraftId: string): HistoricalFinding[] {
  return getAircraftFlights(aircraftId).flatMap((f) => f.findings);
}

/**
 * Returns zones that have been flagged more than once for the same type,
 * sorted by recurrence count descending.
 */
export function getZoneRecurrences(aircraftId: string): ZoneRecurrence[] {
  const flights = [...getAircraftFlights(aircraftId)].reverse(); // oldest first for chronology
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

/** Count unresolved findings across all history for an aircraft. */
export function getUnresolvedCount(aircraftId: string): number {
  return getAllFindings(aircraftId).filter((f) => !f.resolved).length;
}
