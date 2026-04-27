// src/components/DroneSimulationView.tsx
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

interface Detection {
  id: string;
  label: "Crack" | "Dent" | "Corrosion" | "Scratch" | "Missing Rivet" | "Paint Damage";
  severity: "Low" | "Medium" | "High";
  confidence: number;
  zone: string;
  timestamp: string;
}

interface Props {
  telemetry: Telemetry;
  detections: Detection[];
  paused?: boolean;
}

const CANVAS_W = 660;
const CANVAS_H = 360;
const CX = CANVAS_W / 2;  // 330
const CY = CANVAS_H / 2;  // 180

// ─── All zone positions are clamped INSIDE the aircraft body ─────────────────
// Fuselage body: x [212,450], y [165,195]
// Left wing polygon: roughly x[298,372], y[42,165]
// Right wing polygon: roughly x[298,372], y[195,318]
// Left engine ellipse: center (338,95), rx=27, ry=9
// Right engine ellipse: center (338,265), rx=27, ry=9
const ZONE_POS: Record<string, [number, number]> = {
  "forward fuselage":      [420, 180],
  "aft fuselage":          [245, 180],
  "wing root":             [345, 155],
  "wing root (left)":      [330, 130],
  "wing root (right)":     [330, 228],
  "engine cowling":        [335, 95],
  "engine cowling (1)":    [335, 95],
  "engine cowling (2)":    [335, 265],
  "engine cowling (3)":    [335, 95],
  "engine cowling (4)":    [335, 265],
  "nose section":          [435, 180],
  "tail cone":             [222, 180],
  "belly fairing":         [340, 180],
  "horizontal stabilizer": [225, 180],
  "vertical stabilizer":   [225, 180],
  "landing gear bay":      [335, 180],
};

function getZonePos(zone: string): [number, number] {
  const key = zone.toLowerCase();
  // Exact match first
  if (ZONE_POS[key]) return ZONE_POS[key];
  // Partial match — longest key that zone string contains
  const match = Object.keys(ZONE_POS)
    .filter((k) => key.includes(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ZONE_POS[match] : [CX, CY];
}

// Orbit ellipse — drone flies AROUND the aircraft perimeter
function getDroneXY(angle: number): [number, number] {
  const a = 162;
  const b = 120;
  const x = CX + a * Math.cos(angle);
  const y = CY + b * Math.sin(angle);
  return [x, y];
}

// Photo stops: 12 evenly spaced around the orbit, starting at 0.26 rad
// (0.26 ensures we never start at exactly a waypoint)
const NUM_STOPS = 12;
const PHOTO_STOPS: number[] = Array.from(
  { length: NUM_STOPS },
  (_, i) => 0.26 + (i * Math.PI * 2) / NUM_STOPS
);
const CRUISE_SPEED   = 0.040;  // rad/s — full lap ≈ 157 s ≈ 2.6 min
const SLOW_SPEED     = 0.010;  // rad/s — near waypoint
const STOP_THRESHOLD = 0.030;  // rad — snap to stop within this
const APPROACH_ZONE  = 0.12;   // rad — start slowing within this
const PHOTO_HOLD     = 1.4;    // seconds paused at each stop

export default function DroneSimulationView({ telemetry, detections, paused = false }: Props) {
  const canvasRef         = useRef<HTMLCanvasElement>(null);
  const rafRef            = useRef(0);
  const timeRef           = useRef(0);
  const orbitRef          = useRef(0.26);   // start NOT at a waypoint
  const pauseRef          = useRef(0);      // countdown seconds
  const lastStopRef       = useRef(-1);     // index of last triggered stop
  const shutterRef        = useRef(0);      // 0–1 flash brightness
  const photoRef          = useRef(0);      // total photos taken
  const trailRef          = useRef<[number, number][]>([]);
  const telRef            = useRef(telemetry);
  const detRef            = useRef(detections);
  const pausedRef         = useRef(paused);
  // Progressive reveal: only show a detection marker once the drone has
  // orbited past the angular position of that zone on the aircraft.
  const revealedRef       = useRef<Set<string>>(new Set());

  useEffect(() => { telRef.current = telemetry; }, [telemetry]);
  useEffect(() => { detRef.current = detections; }, [detections]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    // ─── Color helpers ───────────────────────────────────────────────────────
    const C  = (a: number) => `rgba(56,189,248,${a})`;   // cyan
    const W  = (a: number) => `rgba(255,255,255,${a})`;  // white
    const sevRGB = (s: string): [number,number,number] =>
      s === "High" ? [255,92,115] : s === "Medium" ? [247,201,72] : [61,220,151];

    // ─── Background ─────────────────────────────────────────────────────────
    function drawBg() {
      ctx.fillStyle = "#020c18";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = C(0.05);
      for (let x = 0; x <= CANVAS_W; x += 30) {
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_H); ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_H; y += 30) {
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CANVAS_W,y); ctx.stroke();
      }

      // Radar rings
      [75,130,182,230].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(CX, CY, r, 0, Math.PI*2);
        ctx.strokeStyle = C(0.048 - i*0.007);
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Center glow
      const g = ctx.createRadialGradient(CX,CY,0,CX,CY,200);
      g.addColorStop(0, C(0.045));
      g.addColorStop(1, C(0));
      ctx.fillStyle = g;
      ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    }

    // ─── Aircraft (top-down blueprint) ──────────────────────────────────────
    function drawAircraft() {
      ctx.save();
      ctx.shadowColor = C(0.50);
      ctx.shadowBlur  = 12;

      const FILL   = C(0.07);
      const STROKE = C(0.82);
      const DIM    = C(0.45);
      const lw = 1.6;

      // Fuselage
      ctx.beginPath();
      ctx.moveTo(CX+120, CY);
      ctx.bezierCurveTo(CX+127,CY-10, CX+116,CY-15, CX+98,CY-15);
      ctx.lineTo(CX-92, CY-15);
      ctx.bezierCurveTo(CX-109,CY-15, CX-118,CY-7, CX-118,CY);
      ctx.bezierCurveTo(CX-118,CY+7,  CX-109,CY+15, CX-92,CY+15);
      ctx.lineTo(CX+98, CY+15);
      ctx.bezierCurveTo(CX+116,CY+15, CX+127,CY+10, CX+120,CY);
      ctx.closePath();
      ctx.fillStyle = FILL;   ctx.fill();
      ctx.strokeStyle = STROKE; ctx.lineWidth = lw; ctx.stroke();

      // Left wing
      ctx.beginPath();
      ctx.moveTo(CX+42, CY-15);
      ctx.lineTo(CX-18, CY-138);
      ctx.lineTo(CX-32, CY-133);
      ctx.lineTo(CX+22, CY-15);
      ctx.closePath();
      ctx.fillStyle = FILL; ctx.fill();
      ctx.strokeStyle = STROKE; ctx.lineWidth = lw; ctx.stroke();

      // Right wing
      ctx.beginPath();
      ctx.moveTo(CX+42, CY+15);
      ctx.lineTo(CX-18, CY+138);
      ctx.lineTo(CX-32, CY+133);
      ctx.lineTo(CX+22, CY+15);
      ctx.closePath();
      ctx.fillStyle = FILL; ctx.fill();
      ctx.strokeStyle = STROKE; ctx.lineWidth = lw; ctx.stroke();

      // Left engine
      ctx.beginPath();
      ctx.ellipse(CX+8, CY-85, 27, 9, -0.38, 0, Math.PI*2);
      ctx.fillStyle = C(0.10); ctx.fill();
      ctx.strokeStyle = DIM; ctx.lineWidth = 1.2; ctx.stroke();

      // Right engine
      ctx.beginPath();
      ctx.ellipse(CX+8, CY+85, 27, 9, 0.38, 0, Math.PI*2);
      ctx.fillStyle = C(0.10); ctx.fill();
      ctx.strokeStyle = DIM; ctx.lineWidth = 1.2; ctx.stroke();

      // Left stabilizer
      ctx.beginPath();
      ctx.moveTo(CX-92,CY-15);
      ctx.lineTo(CX-110,CY-58); ctx.lineTo(CX-118,CY-55);
      ctx.lineTo(CX-102,CY-15);
      ctx.closePath();
      ctx.fillStyle = FILL; ctx.fill();
      ctx.strokeStyle = DIM; ctx.lineWidth = 1.2; ctx.stroke();

      // Right stabilizer
      ctx.beginPath();
      ctx.moveTo(CX-92,CY+15);
      ctx.lineTo(CX-110,CY+58); ctx.lineTo(CX-118,CY+55);
      ctx.lineTo(CX-102,CY+15);
      ctx.closePath();
      ctx.fillStyle = FILL; ctx.fill();
      ctx.strokeStyle = DIM; ctx.lineWidth = 1.2; ctx.stroke();

      // Centerline dash
      ctx.setLineDash([6,5]);
      ctx.beginPath(); ctx.moveTo(CX-118,CY); ctx.lineTo(CX+120,CY);
      ctx.strokeStyle = C(0.22); ctx.lineWidth = 0.9; ctx.stroke();
      ctx.setLineDash([]);

      // Zone labels inside body
      ctx.font = "bold 7px monospace";
      ctx.fillStyle = C(0.42);
      ctx.textAlign = "center";
      [
        ["NOSE",  CX+102, CY-22],
        ["FWD",   CX+66,  CY-22],
        ["AFT",   CX-66,  CY-22],
        ["TAIL",  CX-100, CY-22],
        ["L-ENG", CX+10,  CY-101],
        ["R-ENG", CX+10,  CY+109],
      ].forEach(([label, lx, ly]) =>
        ctx.fillText(String(label), Number(lx), Number(ly))
      );

      ctx.restore();
    }

    // ─── Detection markers — only revealed ones ──────────────────────────────
    function drawMarkers(t: number) {
      detRef.current.filter((d) => revealedRef.current.has(d.id)).slice(0, 5).forEach((d, i) => {
        const [px, py] = getZonePos(d.zone);
        const [r,g,b]  = sevRGB(d.severity);
        const pulse    = Math.sin(t * 3.2 + i * 1.4) * 0.5 + 0.5;

        // Expanding ring
        ctx.beginPath();
        ctx.arc(px, py, 6 + pulse*10, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.5 - pulse*0.3})`;
        ctx.lineWidth = 1.5; ctx.stroke();

        // Inner ring
        ctx.beginPath();
        ctx.arc(px, py, 3 + pulse*3, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.4)`;
        ctx.lineWidth = 1; ctx.stroke();

        // Core dot
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI*2);
        ctx.fillStyle   = `rgba(${r},${g},${b},0.95)`;
        ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
        ctx.shadowBlur  = 8;
        ctx.fill();
        ctx.shadowBlur  = 0;

        // Label — nudge up so it doesn't overlap dot
        ctx.font      = "bold 9px monospace";
        ctx.fillStyle = `rgba(${r},${g},${b},0.90)`;
        ctx.textAlign = "left";
        ctx.fillText(d.label.toUpperCase(), px+7, py-5);
      });
    }

    // ─── Drone trail ────────────────────────────────────────────────────────
    function drawTrail() {
      trailRef.current.forEach((pt, i) => {
        const alpha = (i / trailRef.current.length) * 0.5;
        const size  = 1 + (i / trailRef.current.length) * 1.8;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], size, 0, Math.PI*2);
        ctx.fillStyle = C(alpha);
        ctx.fill();
      });
    }

    // ─── Scan beam ──────────────────────────────────────────────────────────
    function drawBeam(dx: number, dy: number) {
      if (telRef.current.status === "Landed") return;
      const angle  = Math.atan2(CY-dy, CX-dx);
      const beamL  = 52;
      const spread = 0.17;

      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.arc(dx, dy, beamL, angle-spread, angle+spread);
      ctx.closePath();
      ctx.fillStyle = C(0.07);
      ctx.fill();

      ctx.setLineDash([4,6]);
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + Math.cos(angle)*beamL, dy + Math.sin(angle)*beamL);
      ctx.strokeStyle = C(0.50);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ─── Drone body ─────────────────────────────────────────────────────────
    function drawDrone(dx: number, dy: number, t: number) {
      ctx.save();
      ctx.translate(dx, dy);
      const spin    = t * 9;
      const armLen  = 12;
      const rotorR  = 7;

      // Halo
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI*2);
      ctx.strokeStyle = W(0.07);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Arms + rotors
      [-45,45,135,-135].forEach((deg) => {
        const rad = deg * Math.PI / 180;
        const ax  = Math.cos(rad)*armLen;
        const ay  = Math.sin(rad)*armLen;

        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(ax,ay);
        ctx.strokeStyle = W(0.88); ctx.lineWidth = 1.8; ctx.stroke();

        ctx.beginPath();
        ctx.arc(ax, ay, rotorR, 0, Math.PI*2);
        ctx.strokeStyle = C(0.40); ctx.lineWidth = 1; ctx.stroke();

        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(spin+rad);
        ctx.beginPath();
        ctx.moveTo(-rotorR+1, 0); ctx.lineTo(rotorR-1, 0);
        ctx.strokeStyle = W(0.78); ctx.lineWidth = 1.8; ctx.stroke();
        ctx.restore();
      });

      // Body
      ctx.shadowColor = W(0.9); ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2);
      ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ─── Shutter flash ──────────────────────────────────────────────────────
    function drawShutter(dx: number, dy: number) {
      const a = shutterRef.current;
      if (a <= 0) return;

      const r = 32 * (1 - a);
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(255,255,255,${a*0.85})`;
      ctx.lineWidth = 2.5; ctx.stroke();

      ctx.beginPath();
      ctx.arc(dx, dy, 5, 0, Math.PI*2);
      ctx.fillStyle   = `rgba(255,255,255,${a*0.9})`;
      ctx.shadowColor = `rgba(255,255,255,${a})`;
      ctx.shadowBlur  = 16;
      ctx.fill();
      ctx.shadowBlur  = 0;

      if (a > 0.35) {
        ctx.font      = `bold 9px monospace`;
        ctx.fillStyle = `rgba(255,255,255,${a*0.85})`;
        ctx.textAlign = "center";
        ctx.fillText("● CAPTURE", dx, dy-26);
      }
    }

    // ─── HUD overlay ────────────────────────────────────────────────────────
    function drawHUD(t: number, dx: number, dy: number) {
      const tel    = telRef.current;
      const statClr =
        tel.status === "Scanning"  ? [61,220,151] :
        tel.status === "Holding"   ? [56,189,248] :
        tel.status === "Returning" ? [247,201,72] :
        [200,200,200];
      const [sr,sg,sb] = statClr;

      // Status dot + label
      if (tel.status === "Scanning" && Math.sin(t*4) > 0) {
        ctx.beginPath(); ctx.arc(14,14,4.5,0,Math.PI*2);
        ctx.fillStyle   = `rgba(${sr},${sg},${sb},0.9)`;
        ctx.shadowColor = `rgba(${sr},${sg},${sb},0.7)`;
        ctx.shadowBlur  = 8;
        ctx.fill(); ctx.shadowBlur = 0;
      }
      ctx.font = "bold 10px monospace";
      ctx.fillStyle = `rgba(${sr},${sg},${sb},0.90)`;
      ctx.textAlign = "left";
      ctx.fillText(`◈ ${tel.status.toUpperCase()}`, 27, 19);

      // REC + frame counter (top-right)
      if (tel.status === "Scanning" && Math.sin(t*2.5) > 0) {
        ctx.beginPath(); ctx.arc(CANVAS_W-88,14,4,0,Math.PI*2);
        ctx.fillStyle   = "rgba(255,92,115,0.90)";
        ctx.shadowColor = "rgba(255,92,115,0.6)";
        ctx.shadowBlur  = 8;
        ctx.fill(); ctx.shadowBlur = 0;
      }
      if (tel.status === "Scanning") {
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "rgba(255,92,115,0.80)";
        ctx.textAlign = "left";
        ctx.fillText("REC", CANVAS_W-80, 18);
      }
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = W(0.42);
      ctx.textAlign = "right";
      ctx.fillText(`CAM: ${String(photoRef.current).padStart(3,"0")} frames`, CANVAS_W-10, 18);

      // Bottom-left: lat/lng
      ctx.font = "9px monospace";
      ctx.fillStyle = C(0.55);
      ctx.textAlign = "left";
      ctx.fillText(`LAT  ${tel.lat.toFixed(5)}`, 10, CANVAS_H-28);
      ctx.fillText(`LNG  ${tel.lng.toFixed(5)}`, 10, CANVAS_H-15);

      // Bottom-right: alt/speed
      ctx.textAlign = "right";
      ctx.fillText(`ALT  ${tel.altitude} m`, CANVAS_W-10, CANVAS_H-28);
      ctx.fillText(`SPD  ${tel.speed} m/s`, CANVAS_W-10, CANVAS_H-15);

      // Drone crosshair
      const ch = 10;
      ctx.strokeStyle = W(0.28); ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(dx-ch-4,dy); ctx.lineTo(dx-3,dy);
      ctx.moveTo(dx+3,dy);    ctx.lineTo(dx+ch+4,dy);
      ctx.moveTo(dx,dy-ch-4); ctx.lineTo(dx,dy-3);
      ctx.moveTo(dx,dy+3);    ctx.lineTo(dx,dy+ch+4);
      ctx.stroke();

      // Corner brackets
      const bl=16, bm=12;
      ctx.strokeStyle = C(0.26); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(bm,bm+bl); ctx.lineTo(bm,bm); ctx.lineTo(bm+bl,bm); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CANVAS_W-bm-bl,bm); ctx.lineTo(CANVAS_W-bm,bm); ctx.lineTo(CANVAS_W-bm,bm+bl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bm,CANVAS_H-bm-bl); ctx.lineTo(bm,CANVAS_H-bm); ctx.lineTo(bm+bl,CANVAS_H-bm); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CANVAS_W-bm-bl,CANVAS_H-bm); ctx.lineTo(CANVAS_W-bm,CANVAS_H-bm); ctx.lineTo(CANVAS_W-bm,CANVAS_H-bm-bl); ctx.stroke();

      // Aircraft center crosshair
      ctx.strokeStyle = C(0.16); ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(CX-10,CY); ctx.lineTo(CX+10,CY);
      ctx.moveTo(CX,CY-10); ctx.lineTo(CX,CY+10);
      ctx.stroke();
    }

    // ─── Main animation loop ─────────────────────────────────────────────────
    function frame() {
      const tel = telRef.current;
      const dt  = 0.016;
      timeRef.current += dt;
      const t = timeRef.current;

      let dx: number, dy: number;

      if (tel.status === "Holding") {
        [dx, dy] = getDroneXY(orbitRef.current);
        if (trailRef.current.length > 0 && Math.random() < 0.04)
          trailRef.current.shift();

      } else if (tel.status === "Returning") {
        [dx, dy] = getDroneXY(orbitRef.current);
        const homeX = CANVAS_W - 55, homeY = 48;
        dx += (homeX - dx) * 0.025;
        dy += (homeY - dy) * 0.025;
        orbitRef.current += 0.006;

      } else if (tel.status === "Landed") {
        dx = CANVAS_W - 55; dy = 48;

      } else {
        // ── SCANNING: slow orbit + photo stops ──
        // Respect external Hold Position button
        if (pausedRef.current) {
          [dx, dy] = getDroneXY(orbitRef.current);
        } else if (pauseRef.current > 0) {
          // Paused at a stop — count down
          pauseRef.current -= dt;
          shutterRef.current = Math.max(0, pauseRef.current / PHOTO_HOLD);
          [dx, dy] = getDroneXY(orbitRef.current);

        } else {
          // Check distance to each stop
          const angle = ((orbitRef.current % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);

          let nearestIdx = -1;
          let nearestDist = Infinity;
          PHOTO_STOPS.forEach((wp, idx) => {
            const wpNorm = ((wp % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
            let diff = Math.abs(angle - wpNorm);
            if (diff > Math.PI) diff = Math.PI*2 - diff;
            if (diff < nearestDist) { nearestDist = diff; nearestIdx = idx; }
          });

          const approaching = nearestDist < APPROACH_ZONE;
          const speed = approaching ? SLOW_SPEED : CRUISE_SPEED;
          orbitRef.current += speed * dt;

          // Snap & pause — only if this stop wasn't the last one triggered
          if (nearestDist < STOP_THRESHOLD && nearestIdx !== lastStopRef.current) {
            lastStopRef.current   = nearestIdx;
            pauseRef.current      = PHOTO_HOLD;
            shutterRef.current    = 1.0;
            photoRef.current     += 1;
          }

          // Clear last stop once we've moved far enough away from it
          if (lastStopRef.current >= 0 && nearestDist > APPROACH_ZONE * 2) {
            lastStopRef.current = -1;
          }

          // ── Progressive detection reveal ─────────────────────────────────
          // Reveal a detection marker when the drone's orbit angle passes
          // near the angular projection of that zone onto the orbit ellipse.
          const currentNorm = ((orbitRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          detRef.current.forEach((d) => {
            if (!revealedRef.current.has(d.id)) {
              const [zx, zy] = getZonePos(d.zone);
              const zoneAngle = ((Math.atan2((zy - CY) / 120, (zx - CX) / 162)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
              let diff = Math.abs(currentNorm - zoneAngle);
              if (diff > Math.PI) diff = Math.PI * 2 - diff;
              if (diff < 0.35) revealedRef.current.add(d.id);
            }
          });

          [dx, dy] = getDroneXY(orbitRef.current);
        }

        trailRef.current.push([dx, dy]);
        if (trailRef.current.length > 44) trailRef.current.shift();
      }

      drawBg();
      drawAircraft();
      drawMarkers(t);
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
