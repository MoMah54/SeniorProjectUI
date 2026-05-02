// src/data/demoDetections.ts
//
// Real YOLOv11 detection output, distributed per aircraft.
// Each aircraft has its own subset of findings from the actual model run.
//
// Images with two detections (same imageFile) demonstrate co-detection:
//   - ac-001: IMG_20230512_131503 has two cracks detected
//   - ac-002: IMG_20230511_104930 has two dents detected
//
// imageFile = prediction image filename served from /public/predictions/

import type { LiveDetection } from "./fleetStore";

// ── A6-EDA  (ac-001) — Airbus A380-861 ───────────────────────────────────────
const EDA: LiveDetection[] = [
  {
    id: "EDA-001", label: "Crack",       severity: "High",   confidence: 0.961,
    zone: "Fuselage Skin",     timestamp: "09:14:22",
    imageFile: "IMG_20230512_131503_jpg.rf.77e9232a3a348fc97c8953850f67db9e.jpg",
    bbox: [89.78, 117.61, 347.39, 428.66],
  },
  {
    // Second crack detected in the same photo as EDA-001
    id: "EDA-002", label: "Crack",       severity: "High",   confidence: 0.707,
    zone: "Fuselage Skin",     timestamp: "09:14:22",
    imageFile: "IMG_20230512_131503_jpg.rf.77e9232a3a348fc97c8953850f67db9e.jpg",
    bbox: [107.76, 366.30, 174.27, 473.50],
  },
  {
    id: "EDA-003", label: "Paint Damage", severity: "High",  confidence: 0.914,
    zone: "Left Wing",         timestamp: "09:11:08",
    imageFile: "IMG_20230511_103325_jpg.rf.69aa73ed574c8a24c72d5406e98e48bc.jpg",
    bbox: [246.55, 154.04, 564.58, 504.24],
  },
  {
    id: "EDA-004", label: "Crack",       severity: "High",   confidence: 0.867,
    zone: "Fuselage Skin",     timestamp: "09:15:03",
    imageFile: "IMG_20230512_131421_jpg.rf.476fba18708dac4b46bf02b2393b2a59.jpg",
    bbox: [155.90, 340.45, 263.11, 441.17],
  },
  {
    id: "EDA-005", label: "Dent",        severity: "High",   confidence: 0.848,
    zone: "Aft Fuselage",      timestamp: "09:13:28",
    imageFile: "IMG_20230511_104918_jpg.rf.b526c6d02c73d5c3fa91d1a6b17d2795.jpg",
    bbox: [357.25, 174.53, 453.59, 309.34],
  },
  {
    id: "EDA-006", label: "Scratch",     severity: "High",   confidence: 0.712,
    zone: "Forward Fuselage",  timestamp: "09:09:45",
    imageFile: "IMG_20230413_123711_jpg.rf.9a3ab89d987194c10bc5c650c4672c06.jpg",
    bbox: [66.09, 350.67, 143.04, 427.13],
  },
];

// ── A6-ECB  (ac-002) — Boeing 777-31H(ER) ────────────────────────────────────
const ECB: LiveDetection[] = [
  {
    id: "ECB-001", label: "Missing Rivet", severity: "High", confidence: 0.830,
    zone: "Aft Fuselage",      timestamp: "09:13:49",
    imageFile: "IMG_20230511_104543_jpg.rf.e624a14157ea430050ef14d3115aefe4.jpg",
    bbox: [289.30, 167.60, 402.70, 276.86],
  },
  {
    id: "ECB-002", label: "Dent",          severity: "High", confidence: 0.825,
    zone: "Fuselage Skin",     timestamp: "09:14:37",
    imageFile: "IMG_20230512_131028_jpg.rf.892a9abca155a54f17a1246b9a4872d1.jpg",
    bbox: [87.55, 228.75, 193.87, 329.88],
  },
  {
    id: "ECB-003", label: "Dent",          severity: "High", confidence: 0.819,
    zone: "Aft Fuselage",      timestamp: "09:13:55",
    imageFile: "IMG_20230511_104930_jpg.rf.b402406f5454a0453016ec77bfd42b40.jpg",
    bbox: [300.30, 234.07, 378.93, 335.00],
  },
  {
    // Second dent detected in the same photo as ECB-003
    id: "ECB-004", label: "Dent",          severity: "High", confidence: 0.681,
    zone: "Aft Fuselage",      timestamp: "09:13:55",
    imageFile: "IMG_20230511_104930_jpg.rf.b402406f5454a0453016ec77bfd42b40.jpg",
    bbox: [194.49, 263.60, 276.16, 344.97],
  },
  {
    id: "ECB-005", label: "Dent",          severity: "High", confidence: 0.811,
    zone: "Aft Fuselage",      timestamp: "09:14:05",
    imageFile: "IMG_20230511_104947_jpg.rf.84bbaafb9865fbe4e61fbe594685a271.jpg",
    bbox: [365.61, 334.17, 436.23, 405.17],
  },
];

// ── A6-EWA  (ac-003) — Boeing 777-21H(LR) ────────────────────────────────────
const EWA: LiveDetection[] = [
  {
    id: "EWA-001", label: "Missing Rivet", severity: "High", confidence: 0.827,
    zone: "Left Wing",         timestamp: "09:11:22",
    imageFile: "IMG_20230511_102003_jpg.rf.83de787f16a5e9049de826e592d1fd52.jpg",
    bbox: [271.94, 357.78, 387.89, 473.83],
  },
  {
    id: "EWA-002", label: "Missing Rivet", severity: "High", confidence: 0.819,
    zone: "Left Wing",         timestamp: "09:11:48",
    imageFile: "IMG_20230511_103157_jpg.rf.477b7ad065e1e86c1f8c4fb8fa1f451e.jpg",
    bbox: [498.56, 314.24, 539.21, 354.59],
  },
  {
    id: "EWA-003", label: "Missing Rivet", severity: "High", confidence: 0.794,
    zone: "Left Wing",         timestamp: "09:10:42",
    imageFile: "IMG_20230511_100718_jpg.rf.37db056fb4a92fd4530292e2d49b12b6.jpg",
    bbox: [189.80, 367.57, 335.64, 514.86],
  },
  {
    id: "EWA-004", label: "Dent",          severity: "High", confidence: 0.788,
    zone: "Left Wing",         timestamp: "09:12:02",
    imageFile: "IMG_20230511_103726_jpg.rf.d8bce75a6cddae885ed1bcfd24ebff09.jpg",
    bbox: [334.90, 173.44, 442.85, 294.27],
  },
];

// ── A6-EEF  (ac-004) — Airbus A380-861 ───────────────────────────────────────
const EEF: LiveDetection[] = [
  {
    id: "EEF-001", label: "Paint Damage", severity: "High", confidence: 0.914,
    zone: "Aft Fuselage",      timestamp: "09:13:45",
    imageFile: "IMG_20230511_104501_jpg.rf.d68d84a93da0f6419f0f159703bb6762.jpg",
    bbox: [253.65, 225.89, 502.91, 403.50],
  },
  {
    id: "EEF-002", label: "Paint Damage", severity: "High", confidence: 0.889,
    zone: "Aft Fuselage",      timestamp: "09:13:12",
    imageFile: "IMG_20230511_104230_jpg.rf.3e159e2280245d7e9b80d998361bfdb1.jpg",
    bbox: [197.66, 209.79, 385.51, 392.12],
  },
  {
    id: "EEF-003", label: "Missing Rivet", severity: "High", confidence: 0.813,
    zone: "Fuselage Skin",     timestamp: "09:12:18",
    imageFile: "IMG_20230512_121856_jpg.rf.8b3b7707383c893458b69bc394428f8b.jpg",
    bbox: [251.21, 163.90, 465.86, 378.06],
  },
  {
    id: "EEF-004", label: "Dent",         severity: "High", confidence: 0.802,
    zone: "Fuselage Skin",     timestamp: "09:13:28",
    imageFile: "IMG_20230512_125950_jpg.rf.2e7891b4cf8a2641dd5c33f4eeef2d89.jpg",
    bbox: [292.37, 247.76, 434.69, 402.45],
  },
  {
    id: "EEF-005", label: "Crack",        severity: "High", confidence: 0.735,
    zone: "Fuselage Skin",     timestamp: "09:15:22",
    imageFile: "IMG_20230512_131151_jpg.rf.0b5079be994703b8d6a13e886d1e622a.jpg",
    bbox: [238.05, 198.63, 366.88, 300.84],
  },
];

// ── A6-EBA  (ac-005) — Boeing 777-31H(ER) ────────────────────────────────────
const EBA: LiveDetection[] = [
  {
    id: "EBA-001", label: "Crack",        severity: "High",   confidence: 0.764,
    zone: "Right Wing",        timestamp: "09:16:22",
    imageFile: "IMG_20230513_095207_jpg.rf.ac6003d01d20f5af9ffa6919ffbae26f.jpg",
    bbox: [239.24, 89.22, 428.89, 274.72],
  },
  {
    id: "EBA-002", label: "Paint Damage", severity: "High",   confidence: 0.764,
    zone: "Left Wing",         timestamp: "09:10:55",
    imageFile: "IMG_20230511_100741_jpg.rf.37a463feb28a9df3e5d63d8e5540e013.jpg",
    bbox: [246.79, 216.32, 425.26, 382.79],
  },
  {
    id: "EBA-003", label: "Paint Damage", severity: "Medium", confidence: 0.690,
    zone: "Fuselage Skin",     timestamp: "09:12:48",
    imageFile: "IMG_20230512_120754_jpg.rf.8a6362b90968fbb7195c61a88ac07fa0.jpg",
    bbox: [319.97, 203.64, 468.08, 290.92],
  },
  {
    id: "EBA-004", label: "Missing Rivet", severity: "Medium", confidence: 0.640,
    zone: "Left Wing",         timestamp: "09:10:50",
    imageFile: "IMG_20230511_100733_jpg.rf.67e9484a3ca82793a93067525a98574d.jpg",
    bbox: [296.82, 192.03, 417.44, 301.68],
  },
  {
    id: "EBA-005", label: "Dent",          severity: "Medium", confidence: 0.635,
    zone: "Left Wing",         timestamp: "09:12:08",
    imageFile: "IMG_20230511_103955_jpg.rf.67ce65150e53ff1c67d55ca2894e35b4.jpg",
    bbox: [198.54, 272.44, 293.39, 358.70],
  },
];

// ── SIM-001  (ac-006) — Simulation Research Aircraft ─────────────────────────
//
// Images: synthetic 3D renders (img_0xxxx_png.rf.xxx.jpg) from public/predictions/
//
// Zone mapping methodology (image_coordinates_labeled.csv):
//   Each img_N was captured at frame_{(N+6)×10} of the drone flight path.
//   The labeled CSV records the drone's 3-D position and aircraft_region at every
//   frame, so we read the zone directly from that file:
//
//     img_00000 → frame_00060 (t=6 s)  → Bottom loop → "front/nose-side – left"
//     img_00007 → frame_00130 (t=13 s) → Bottom loop → "mid-body – left"
//     img_00019 → frame_00250 (t=25 s) → Bottom loop → "rear-body – right"
//     img_00025 → frame_00310 (t=31 s) → Bottom loop → "mid-body – right"
//     img_00028 → frame_00340 (t=34 s) → Bottom loop → "front/nose-side – right"
//
//   All five source frames fall within the "Bottom loop" phase (t ∈ [6, 37] s,
//   z = −0.20 m), which covers the lower fuselage / underside of the aircraft.
const SIM: LiveDetection[] = [
  {
    // frame_00060 → "Lower fuselage / underside - front/nose-side - left side"
    id: "SIM-001", label: "Crack", severity: "High", confidence: 0.920,
    zone: "Lower Fuselage — Nose Left", timestamp: "10:02:14",
    imageFile: "img_00000_png.rf.9bd40fe5fd8c2501cf0a34cfc47a2e33.jpg",
    bbox: [213.70, 201.26, 263.86, 246.18],
  },
  {
    // frame_00130 → "Lower fuselage / underside - mid-body - left side"
    id: "SIM-002", label: "Crack", severity: "High", confidence: 0.912,
    zone: "Lower Fuselage — Mid Left", timestamp: "10:04:38",
    imageFile: "img_00007_png.rf.6d56ceb2bdb65b5762f2c57895b5d3b0.jpg",
    bbox: [202.70, 185.84, 247.82, 226.04],
  },
  {
    // Second crack detected in the same frame as SIM-002 — co-detection demo
    id: "SIM-003", label: "Crack", severity: "High", confidence: 0.877,
    zone: "Lower Fuselage — Mid Left", timestamp: "10:04:38",
    imageFile: "img_00007_png.rf.6d56ceb2bdb65b5762f2c57895b5d3b0.jpg",
    bbox: [318.97, 208.58, 359.74, 228.91],
  },
  {
    // frame_00250 → "Lower fuselage / underside - rear-body/tail-side - right side"
    id: "SIM-004", label: "Crack", severity: "High", confidence: 0.929,
    zone: "Lower Fuselage — Rear Right", timestamp: "09:18:55",
    imageFile: "img_00019_png.rf.60c11881b849f1011bbcdbfb8130f6f3.jpg",
    bbox: [286.77, 360.66, 333.60, 412.49],
  },
  {
    // frame_00310 → "Lower fuselage / underside - mid-body - right side"
    id: "SIM-005", label: "Crack", severity: "High", confidence: 0.915,
    zone: "Lower Fuselage — Mid Right", timestamp: "09:22:11",
    imageFile: "img_00025_png.rf.c3ebb97120c1d952e6a879fdb86c2295.jpg",
    bbox: [219.63, 206.20, 294.59, 283.51],
  },
  {
    // frame_00340 → "Lower fuselage / underside - front/nose-side - right side"
    id: "SIM-006", label: "Crack", severity: "Medium", confidence: 0.903,
    zone: "Lower Fuselage — Nose Right", timestamp: "11:05:42",
    imageFile: "img_00028_png.rf.d7348f602add1e282f8e68af57cbb0bb.jpg",
    bbox: [320.76, 226.93, 397.62, 265.31],
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

export const AIRCRAFT_DETECTIONS: Record<string, LiveDetection[]> = {
  "ac-001": EDA,
  "ac-002": ECB,
  "ac-003": EWA,
  "ac-004": EEF,
  "ac-005": EBA,
  "ac-006": SIM,
};

export function getDetectionsForAircraft(aircraftId: string): LiveDetection[] {
  return AIRCRAFT_DETECTIONS[aircraftId] ?? EDA;
}

/** Legacy default used as generic fallback */
export const DEMO_DETECTIONS: LiveDetection[] = EDA;
