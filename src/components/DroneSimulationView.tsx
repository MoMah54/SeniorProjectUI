// src/components/DroneSimulationView.tsx
//
// Canvas-based drone flight simulation that follows the real 4-phase inspection
// path derived from image_coordinates_labeled.csv:
//
//   Phase 1 — Bottom Loop   (z = −0.20 m): orbits lower fuselage underside
//   Phase 2 — Mid Loop      (z = +1.60 m): orbits mid-fuselage
//   Phase 3 — Left Wing Pass (y > 0 side): sweeps left wing root → tip
//   Phase 4 — Right Wing Pass (y < 0 side): sweeps right wing root → tip
//
// The cycle repeats continuously.  Photo stops (shutter flash) match the
// real capture waypoints from the CSV.

import { useEffect, useRef } from "react";

interface Telemetry {
  battery: number;
  altitude: number;
  speed: number;
  lat: number;
  lng: number;
  signal: number;
  status: "Scanning" | "Holding" | "Returning" | "Landed";
}

interface Props {
  telemetry: Telemetry;
  paused?: boolean;
}

// ── Canvas layout ─────────────────────────────────────────────────────────────
const CANVAS_W = 660;
const CANVAS_H = 360;
const CX = CANVAS_W / 2;  // 330
const CY = CANVAS_H / 2;  // 180

// ── Inspection phases ─────────────────────────────────────────────────────────
type Phase = "bottom_loop" | "mid_loop" | "left_wing" | "right_wing";
const PHASE_SEQUENCE: Phase[] = ["bottom_loop", "mid_loop", "left_wing", "right_wing"];

const PHASE_META: Record<Phase, { label: string; color: string }> = {
  bottom_loop: { label: "Lower Fuselage", color: "56,189,248"  },  // cyan
  mid_loop:    { label: "Mid Fuselage",   color: "61,220,151"  },  // green
  left_wing:   { label: "Left Wing",      color: "147,197,253" },  // light-blue
  right_wing:  { label: "Right Wing",     color: "251,146,60"  },  // amber
};

// ── Drone paths ───────────────────────────────────────────────────────────────

/** Elliptical orbit around the fuselage */
function getOrbitXY(angle: number): [number, number] {
  return [CX + 162 * Math.cos(angle), CY + 120 * Math.sin(angle)];
}

/**
 * Left-wing sweep: drone moves from wing root (t=0) to tip (t=1),
 * offset ~15 px outward from the leading edge.
 * Root ≈ (CX+55, CY−22), Tip ≈ (CX−5, CY−145)
 */
function getLeftSweepXY(t: number): [number, number] {
  return [CX + 55 - 60 * t, CY - 22 - 123 * t];
}

/**
 * Right-wing sweep (mirror of left).
 * Root ≈ (CX+55, CY+22), Tip ≈ (CX−5, CY+145)
 */
function getRightSweepXY(t: number): [number, number] {
  return [CX + 55 - 60 * t, CY + 22 + 123 * t];
}

// ── Photo-stop definitions ────────────────────────────────────────────────────

/** 8 evenly-spaced stops for the two orbital phases */
const ORBIT_STOPS: number[] = Array.from(
  { length: 8 },
  (_, i) => 0.30 + (i * Math.PI * 2) / 8,
);

/** 5 positions along the wing sweep (t ∈ [0, 1]) */
const SWEEP_STOPS: number[] = [0.10, 0.28, 0.50, 0.72, 0.90];

// ── Speed constants ───────────────────────────────────────────────────────────
const ORBIT_CRUISE   = 0.040;  // rad/s
const ORBIT_SLOW     = 0.012;  // rad/s — near a waypoint
const ORBIT_SNAP     = 0.030;  // rad — trigger photo within this distance
const ORBIT_APPROACH = 0.12;   // rad — start slowing here
const SWEEP_CRUISE   = 0.20;   // normalised t/s
const SWEEP_SLOW     = 0.05;   // normalised t/s — near a waypoint
const SWEEP_SNAP     = 0.025;  // t — trigger photo within this distance
const SWEEP_APPROACH = 0.06;   // t — start slowing here
const PHOTO_HOLD     = 1.4;    // seconds paused at each capture point

export default function DroneSimulationView({ telemetry, paused = false }: Props) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const rafRef         = useRef(0);
  const timeRef        = useRef(0);

  // Flight state
  const phaseIdxRef    = useRef(0);    // index into PHASE_SEQUENCE (mod 4)
  const orbitRef       = useRef(0.30); // angle (loops) or t (sweeps)
  const phaseOriginRef = useRef(0.30); // orbit angle at start of current loop phase
  const pauseRef       = useRef(0);    // photo-hold countdown (s)
  const lastStopRef    = useRef(-1);   // index of the last stop triggered
  const shutterRef     = useRef(0);    // 0–1 flash brightness
  const photoRef       = useRef(0);    // total captures

  const trailRef  = useRef<[number, number][]>([]);
  const telRef    = useRef(telemetry);
  const pausedRef = useRef(paused);

  useEffect(() => { telRef.current = telemetry; }, [telemetry]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    // ── Helpers ────────────────────────────────────────────────────────────────
    const W = (a: number) => `rgba(255,255,255,${a})`;
    const C = (a: number) => `rgba(56,189,248,${a})`;  // base cyan fallback

    function currentPhase(): Phase {
      return PHASE_SEQUENCE[phaseIdxRef.current % 4];
    }

    function phaseRGB(): string {
      return PHASE_META[currentPhase()].color;
    }

    function phaseColor(alpha: number): string {
      return `rgba(${phaseRGB()},${alpha})`;
    }

    // ── Background ─────────────────────────────────────────────────────────────
    function drawBg() {
      ctx.fillStyle = "#020c18";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.lineWidth = 0.5;
      ctx.strokeStyle = C(0.05);
      for (let x = 0; x <= CANVAS_W; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_H; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
      }

      [75, 130, 182, 230].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(CX, CY, r, 0, Math.PI * 2);
        ctx.strokeStyle = C(0.048 - i * 0.007);
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 200);
      g.addColorStop(0, C(0.045));
      g.addColorStop(1, C(0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // ── Aircraft (top-down blueprint) ──────────────────────────────────────────
    function drawAircraft() {
      ctx.save();
      ctx.shadowColor = C(0.50);
      ctx.shadowBlur  = 12;

      const FILL   = C(0.07);
      const STROKE = C(0.82);
      const DIM    = C(0.45);
      const lw     = 1.6;

      // Fuselage
      ctx.beginPath();
      ctx.moveTo(CX + 120, CY);
      ctx.bezierCurveTo(CX + 127, CY - 10, CX + 116, CY - 15, CX + 98,  CY - 15);
      ctx.lineTo(CX - 92, CY - 15);
      ctx.bezierCurveTo(CX - 109, CY - 15, CX - 118, CY - 7, CX - 118, CY);
      ctx.bezierCurveTo(CX - 118, CY + 7,  CX - 109, CY + 15, CX - 92, CY + 15);
      ctx.lineTo(CX + 98, CY + 15);
      ctx.bezierCurveTo(CX + 116, CY + 15, CX + 127, CY + 10, CX + 120, CY);
      ctx.closePath();
      ctx.fillStyle = FILL; ctx.fill();
      ctx.strokeStyle = STROKE; ctx.lineWidth = lw; ctx.stroke();

      // Left wing
      ctx.beginPath();
      ctx.moveTo(CX + 42, CY - 15);
      ctx.lineTo(CX - 18, CY - 138);
      ctx.lineTo(CX - 32, CY - 133);
      ctx.lineTo(CX + 22, CY - 15);
      ctx.closePath();
      ctx.fillStyle = FILL; ctx.fill();
      ctx.strokeStyle = STROKE; ctx.lineWidth = lw; ctx.stroke();

      // Right wing
      ctx.beginPath();
      ctx.moveTo(CX + 42, CY + 15);
      ctx.lineTo(CX - 18, CY + 138);
      ctx.lineTo(CX - 32, CY + 133);
      ctx.lineTo(CX + 22, CY + 15);
      ctx.closePath();
      ctx.fillStyle = FILL; ctx.fill();
      ctx.strokeStyle = STROKE; ctx.lineWidth = lw; ctx.stroke();

      // Left engine
      ctx.beginPath();
      ctx.ellipse(CX + 8, CY - 85, 27, 9, -0.38, 0, Math.PI * 2);
      ctx.fillStyle = C(0.10); ctx.fill();
      ctx.strokeStyle = DIM; ctx.lineWidth = 1.2; ctx.stroke();

      // Right engine
      ctx.beginPath();
      ctx.ellipse(CX + 8, CY + 85, 27, 9, 0.38, 0, Math.PI * 2);
      ctx.fillStyle = C(0.10); ctx.fill();
      ctx.strokeStyle = DIM; ctx.lineWidth = 1.2; ctx.stroke();

      // Left stabiliser
      ctx.beginPath();
      ctx.moveTo(CX - 92, CY - 15);
      ctx.lineTo(CX - 110, CY - 58); ctx.lineTo(CX - 118, CY - 55);
      ctx.lineTo(CX - 102, CY - 15);
      ctx.closePath();
      ctx.fillStyle = FILL; ctx.fill();
      ctx.strokeStyle = DIM; ctx.lineWidth = 1.2; ctx.stroke();

      // Right stabiliser
      ctx.beginPath();
      ctx.moveTo(CX - 92, CY + 15);
      ctx.lineTo(CX - 110, CY + 58); ctx.lineTo(CX - 118, CY + 55);
      ctx.lineTo(CX - 102, CY + 15);
      ctx.closePath();
      ctx.fillStyle = FILL; ctx.fill();
      ctx.strokeStyle = DIM; ctx.lineWidth = 1.2; ctx.stroke();

      // Centreline dash
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(CX - 118, CY); ctx.lineTo(CX + 120, CY);
      ctx.strokeStyle = C(0.22); ctx.lineWidth = 0.9; ctx.stroke();
      ctx.setLineDash([]);

      // Zone labels
      ctx.font      = "bold 7px monospace";
      ctx.fillStyle = C(0.42);
      ctx.textAlign = "center";
      [
        ["NOSE",  CX + 102, CY - 22],
        ["FWD",   CX + 66,  CY - 22],
        ["AFT",   CX - 66,  CY - 22],
        ["TAIL",  CX - 100, CY - 22],
        ["L-ENG", CX + 10,  CY - 101],
        ["R-ENG", CX + 10,  CY + 109],
      ].forEach(([label, lx, ly]) =>
        ctx.fillText(String(label), Number(lx), Number(ly)),
      );

      ctx.restore();
    }

    // ── Phase path guide (dashed planned-route overlay) ────────────────────────
    function drawPhasePath() {
      const phase = currentPhase();
      ctx.save();
      ctx.setLineDash([4, 9]);
      ctx.lineWidth = 1.2;

      if (phase === "bottom_loop" || phase === "mid_loop") {
        ctx.beginPath();
        ctx.ellipse(CX, CY, 162, 120, 0, 0, Math.PI * 2);
        ctx.strokeStyle = phaseColor(0.14);
        ctx.stroke();
      } else {
        // Wing sweep: draw planned path + stop dots
        const sweepFn = phase === "left_wing" ? getLeftSweepXY : getRightSweepXY;
        const [x0, y0] = sweepFn(0);
        const [x1, y1] = sweepFn(1);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.strokeStyle = phaseColor(0.22);
        ctx.stroke();
        ctx.setLineDash([]);
        SWEEP_STOPS.forEach((t) => {
          const [sx, sy] = sweepFn(t);
          ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fillStyle = phaseColor(0.28); ctx.fill();
        });
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // ── Trail ──────────────────────────────────────────────────────────────────
    function drawTrail() {
      const rgb = phaseRGB();
      trailRef.current.forEach((pt, i) => {
        const alpha = (i / trailRef.current.length) * 0.50;
        const size  = 1 + (i / trailRef.current.length) * 1.8;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${alpha})`;
        ctx.fill();
      });
    }

    // ── Scan beam ──────────────────────────────────────────────────────────────
    function drawBeam(dx: number, dy: number) {
      if (telRef.current.status === "Landed") return;
      const angle  = Math.atan2(CY - dy, CX - dx);
      const beamL  = 52;
      const spread = 0.17;

      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.arc(dx, dy, beamL, angle - spread, angle + spread);
      ctx.closePath();
      ctx.fillStyle = phaseColor(0.07);
      ctx.fill();

      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + Math.cos(angle) * beamL, dy + Math.sin(angle) * beamL);
      ctx.strokeStyle = phaseColor(0.50);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Drone body ─────────────────────────────────────────────────────────────
    function drawDrone(dx: number, dy: number, t: number) {
      ctx.save();
      ctx.translate(dx, dy);
      const spin   = t * 9;
      const armLen = 12;
      const rotorR = 7;

      // Halo
      ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.strokeStyle = W(0.07); ctx.lineWidth = 1; ctx.stroke();

      // Arms + rotors
      [-45, 45, 135, -135].forEach((deg) => {
        const rad = deg * Math.PI / 180;
        const ax  = Math.cos(rad) * armLen;
        const ay  = Math.sin(rad) * armLen;

        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ax, ay);
        ctx.strokeStyle = W(0.88); ctx.lineWidth = 1.8; ctx.stroke();

        ctx.beginPath(); ctx.arc(ax, ay, rotorR, 0, Math.PI * 2);
        ctx.strokeStyle = phaseColor(0.40); ctx.lineWidth = 1; ctx.stroke();

        ctx.save();
        ctx.translate(ax, ay); ctx.rotate(spin + rad);
        ctx.beginPath(); ctx.moveTo(-rotorR + 1, 0); ctx.lineTo(rotorR - 1, 0);
        ctx.strokeStyle = W(0.78); ctx.lineWidth = 1.8; ctx.stroke();
        ctx.restore();
      });

      // Body dot
      ctx.shadowColor = W(0.9); ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ── Shutter flash ──────────────────────────────────────────────────────────
    function drawShutter(dx: number, dy: number) {
      const a = shutterRef.current;
      if (a <= 0) return;

      const r = 32 * (1 - a);
      ctx.beginPath(); ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.85})`;
      ctx.lineWidth = 2.5; ctx.stroke();

      ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2);
      ctx.fillStyle   = `rgba(255,255,255,${a * 0.9})`;
      ctx.shadowColor = `rgba(255,255,255,${a})`;
      ctx.shadowBlur  = 16;
      ctx.fill(); ctx.shadowBlur = 0;

      if (a > 0.35) {
        ctx.font      = "bold 9px monospace";
        ctx.fillStyle = `rgba(255,255,255,${a * 0.85})`;
        ctx.textAlign = "center";
        ctx.fillText("● CAPTURE", dx, dy - 26);
      }
    }

    // ── HUD overlay ────────────────────────────────────────────────────────────
    function drawHUD(t: number, dx: number, dy: number) {
      const tel   = telRef.current;
      const phase = currentPhase();
      const meta  = PHASE_META[phase];
      const [sr, sg, sb] = meta.color.split(",").map(Number);

      // Status dot (blinking)
      if (tel.status === "Scanning" && Math.sin(t * 4) > 0) {
        ctx.beginPath(); ctx.arc(14, 14, 4.5, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(${sr},${sg},${sb},0.90)`;
        ctx.shadowColor = `rgba(${sr},${sg},${sb},0.70)`;
        ctx.shadowBlur  = 8;
        ctx.fill(); ctx.shadowBlur = 0;
      }

      // Zone / status label (top-left)
      ctx.font      = "bold 10px monospace";
      ctx.fillStyle = `rgba(${sr},${sg},${sb},0.90)`;
      ctx.textAlign = "left";
      const topLabel =
        tel.status === "Scanning"  ? `◈ ${meta.label.toUpperCase()}` :
        tel.status === "Holding"   ? "◈ HOLD POSITION" :
        tel.status === "Returning" ? "◈ RETURNING HOME" : "◈ LANDED";
      ctx.fillText(topLabel, 27, 19);

      // REC dot (blinking, top-right)
      if (tel.status === "Scanning" && Math.sin(t * 2.5) > 0) {
        ctx.beginPath(); ctx.arc(CANVAS_W - 88, 14, 4, 0, Math.PI * 2);
        ctx.fillStyle   = "rgba(255,92,115,0.90)";
        ctx.shadowColor = "rgba(255,92,115,0.60)";
        ctx.shadowBlur  = 8;
        ctx.fill(); ctx.shadowBlur = 0;
      }
      if (tel.status === "Scanning") {
        ctx.font      = "bold 9px monospace";
        ctx.fillStyle = "rgba(255,92,115,0.80)";
        ctx.textAlign = "left";
        ctx.fillText("REC", CANVAS_W - 80, 18);
      }

      // Frame counter (top-right)
      ctx.font      = "bold 9px monospace";
      ctx.fillStyle = W(0.42);
      ctx.textAlign = "right";
      ctx.fillText(`CAM: ${String(photoRef.current).padStart(3, "0")} frames`, CANVAS_W - 10, 18);

      // Phase progress strip (bottom centre, above lat/lng)
      if (tel.status === "Scanning" || tel.status === "Holding") {
        const phaseIdx = phaseIdxRef.current % 4;
        PHASE_SEQUENCE.forEach((ph, i) => {
          const active = i === phaseIdx;
          const m      = PHASE_META[ph];
          const px     = CX - 165 + i * 110;
          const py     = CANVAS_H - 42;

          // Active phase box
          if (active) {
            ctx.fillStyle = `rgba(${m.color},0.12)`;
            ctx.beginPath();
            ctx.roundRect(px - 46, py - 10, 92, 18, 4);
            ctx.fill();
          }

          // Dot
          ctx.beginPath(); ctx.arc(px - 32, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = active ? `rgba(${m.color},0.90)` : "rgba(255,255,255,0.20)";
          ctx.fill();

          // Label
          ctx.font      = `${active ? "bold" : ""} 8px monospace`;
          ctx.fillStyle = active ? `rgba(${m.color},0.90)` : "rgba(255,255,255,0.25)";
          ctx.textAlign = "left";
          ctx.fillText(m.label, px - 24, py + 4);
        });
      }

      // Lat / Lng (bottom-left)
      ctx.font      = "9px monospace";
      ctx.fillStyle = C(0.55);
      ctx.textAlign = "left";
      ctx.fillText(`LAT  ${tel.lat.toFixed(5)}`, 10, CANVAS_H - 28);
      ctx.fillText(`LNG  ${tel.lng.toFixed(5)}`, 10, CANVAS_H - 15);

      // Alt / Speed (bottom-right)
      ctx.textAlign = "right";
      ctx.fillText(`ALT  ${tel.altitude} m`,  CANVAS_W - 10, CANVAS_H - 28);
      ctx.fillText(`SPD  ${tel.speed} m/s`,   CANVAS_W - 10, CANVAS_H - 15);

      // Drone crosshair
      const ch = 10;
      ctx.strokeStyle = W(0.28); ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(dx - ch - 4, dy); ctx.lineTo(dx - 3, dy);
      ctx.moveTo(dx + 3,      dy); ctx.lineTo(dx + ch + 4, dy);
      ctx.moveTo(dx, dy - ch - 4); ctx.lineTo(dx, dy - 3);
      ctx.moveTo(dx, dy + 3);      ctx.lineTo(dx, dy + ch + 4);
      ctx.stroke();

      // Corner brackets (phase-coloured)
      const bl = 16, bm = 12;
      ctx.strokeStyle = phaseColor(0.26); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(bm, bm + bl); ctx.lineTo(bm, bm); ctx.lineTo(bm + bl, bm); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CANVAS_W - bm - bl, bm); ctx.lineTo(CANVAS_W - bm, bm); ctx.lineTo(CANVAS_W - bm, bm + bl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bm, CANVAS_H - bm - bl); ctx.lineTo(bm, CANVAS_H - bm); ctx.lineTo(bm + bl, CANVAS_H - bm); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CANVAS_W - bm - bl, CANVAS_H - bm); ctx.lineTo(CANVAS_W - bm, CANVAS_H - bm); ctx.lineTo(CANVAS_W - bm, CANVAS_H - bm - bl); ctx.stroke();

      // Aircraft centre crosshair
      ctx.strokeStyle = C(0.16); ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(CX - 10, CY); ctx.lineTo(CX + 10, CY);
      ctx.moveTo(CX, CY - 10); ctx.lineTo(CX, CY + 10);
      ctx.stroke();
    }

    // ── Position helpers ───────────────────────────────────────────────────────

    function getDronePosition(): [number, number] {
      const phase = currentPhase();
      if (phase === "bottom_loop" || phase === "mid_loop") {
        return getOrbitXY(orbitRef.current);
      } else if (phase === "left_wing") {
        return getLeftSweepXY(Math.min(orbitRef.current, 1));
      } else {
        return getRightSweepXY(Math.min(orbitRef.current, 1));
      }
    }

    /** Advances position, fires photo stops, triggers phase transitions. */
    function advanceDrone(dt: number): [number, number] {
      const phase = currentPhase();

      // ── Orbital phases ─────────────────────────────────────────────────────
      if (phase === "bottom_loop" || phase === "mid_loop") {
        const normalised = ((orbitRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

        // Find nearest stop
        let nearestIdx  = -1;
        let nearestDist = Infinity;
        ORBIT_STOPS.forEach((wp, idx) => {
          const wpNorm = ((wp % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          let diff = Math.abs(normalised - wpNorm);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < nearestDist) { nearestDist = diff; nearestIdx = idx; }
        });

        const speed = nearestDist < ORBIT_APPROACH ? ORBIT_SLOW : ORBIT_CRUISE;
        orbitRef.current += speed * dt;

        // Photo stop
        if (nearestDist < ORBIT_SNAP && nearestIdx !== lastStopRef.current) {
          lastStopRef.current = nearestIdx;
          pauseRef.current    = PHOTO_HOLD;
          shutterRef.current  = 1.0;
          photoRef.current   += 1;
        }
        if (lastStopRef.current >= 0 && nearestDist > ORBIT_APPROACH * 2) {
          lastStopRef.current = -1;
        }

        // Phase advance — one full orbit completed
        if (orbitRef.current - phaseOriginRef.current >= Math.PI * 2) {
          phaseIdxRef.current = (phaseIdxRef.current + 1) % 4;
          const next = currentPhase();
          if (next === "left_wing" || next === "right_wing") {
            // Transition to sweep: reset t-based progress
            orbitRef.current = 0;
          }
          // For loop→loop we keep accumulating the angle; just update origin
          phaseOriginRef.current = orbitRef.current;
          lastStopRef.current = -1;
        }

        return getOrbitXY(orbitRef.current);

      // ── Wing-sweep phases ───────────────────────────────────────────────────
      } else {
        const t = orbitRef.current;

        // Find nearest sweep stop
        let nearestIdx  = -1;
        let nearestDist = Infinity;
        SWEEP_STOPS.forEach((st, idx) => {
          const diff = Math.abs(t - st);
          if (diff < nearestDist) { nearestDist = diff; nearestIdx = idx; }
        });

        const speed = nearestDist < SWEEP_APPROACH ? SWEEP_SLOW : SWEEP_CRUISE;
        orbitRef.current = Math.min(1.0, t + speed * dt);

        // Photo stop
        if (nearestDist < SWEEP_SNAP && nearestIdx !== lastStopRef.current) {
          lastStopRef.current = nearestIdx;
          pauseRef.current    = PHOTO_HOLD;
          shutterRef.current  = 1.0;
          photoRef.current   += 1;
        }
        if (lastStopRef.current >= 0 && nearestDist > SWEEP_APPROACH * 2) {
          lastStopRef.current = -1;
        }

        // Phase advance — sweep complete
        if (orbitRef.current >= 1.0) {
          phaseIdxRef.current = (phaseIdxRef.current + 1) % 4;
          // Reset for next phase
          orbitRef.current    = 0.30;
          phaseOriginRef.current = 0.30;
          lastStopRef.current = -1;
        }

        return phase === "left_wing"
          ? getLeftSweepXY(Math.min(t, 1.0))
          : getRightSweepXY(Math.min(t, 1.0));
      }
    }

    // ── Main animation loop ────────────────────────────────────────────────────
    function frame() {
      const tel = telRef.current;
      const dt  = 0.016;
      timeRef.current += dt;
      const t = timeRef.current;

      let dx: number, dy: number;

      if (tel.status === "Holding") {
        [dx, dy] = getDronePosition();
        if (trailRef.current.length > 0 && Math.random() < 0.04)
          trailRef.current.shift();

      } else if (tel.status === "Returning") {
        [dx, dy] = getDronePosition();
        const homeX = CANVAS_W - 55, homeY = 48;
        dx += (homeX - dx) * 0.025;
        dy += (homeY - dy) * 0.025;
        orbitRef.current += 0.006;

      } else if (tel.status === "Landed") {
        dx = CANVAS_W - 55; dy = 48;

      } else {
        // SCANNING — multi-phase inspection
        if (pausedRef.current) {
          [dx, dy] = getDronePosition();

        } else if (pauseRef.current > 0) {
          pauseRef.current  -= dt;
          shutterRef.current = Math.max(0, pauseRef.current / PHOTO_HOLD);
          [dx, dy] = getDronePosition();

        } else {
          [dx, dy] = advanceDrone(dt);
        }

        trailRef.current.push([dx, dy]);
        if (trailRef.current.length > 44) trailRef.current.shift();
      }

      drawBg();
      drawAircraft();
      drawPhasePath();
      drawTrail();
      drawBeam(dx, dy);
      drawDrone(dx, dy, t);
      drawShutter(dx, dy);
      drawHUD(t, dx, dy);

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ width: "100%", height: "auto", display: "block", borderRadius: 10 }}
    />
  );
}
