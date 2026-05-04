// src/pages/DetectionView.tsx
// Shows drone-captured camera frames with AI bounding boxes for each detection.
// Accessible only after a completed inspection (missionState === "complete").
import React, { useEffect, useRef, useState } from "react";
import type { Aircraft, LiveDetection } from "../data/fleetStore";
import { colors, radius, spacing, typography } from "../ui/tokens";

interface Props {
  aircraft: Aircraft;
  detections: LiveDetection[];
}

const CANVAS_W = 580;
const CANVAS_H = 328;

export default function DetectionView({ aircraft, detections }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => { setSelectedIdx(0); }, [detections]);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (detections.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={pageTitle}>Detection View</h1>
            <span style={regBadge}>{aircraft.registration}</span>
          </div>
          <p style={pageSub}>Drone-captured imagery with AI defect annotations</p>
        </div>
        <div style={emptyCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>
            No detection data available
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.32)", maxWidth: 340, textAlign: "center", lineHeight: 1.6 }}>
            Complete a drone inspection mission to populate this view with captured
            frames and AI-annotated defect detections.
          </div>
        </div>
      </div>
    );
  }

  const selected     = detections[selectedIdx];
  const detId        = selected.id;
  // Other detections captured in the same photo
  const coDetections = selected.imageFile
    ? detections.filter((d) => d.imageFile === selected.imageFile && d.id !== selected.id)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      {/* Header */}
      <div style={headerRow}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={pageTitle}>Detection View</h1>
            <span style={regBadge}>{aircraft.registration}</span>
          </div>
          <p style={pageSub}>
            Drone-captured imagery with AI defect annotations
            · {detections.length} detection{detections.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <span style={countPill}>{selectedIdx + 1} / {detections.length}</span>
          <span style={completeBadge}>INSPECTION COMPLETE</span>
        </div>
      </div>

      <div style={layout} className="dv-grid">
        {/* Left: detection list */}
        <div style={listPanel}>
          <div style={listHeader}>DETECTIONS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {detections.map((d, i) => {
              const id     = d.id;
              const active = i === selectedIdx;
              const sev    = sevColors(d.severity);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedIdx(i)}
                  style={{
                    ...listItemBase,
                    borderColor: active ? "rgba(59,130,246,0.45)" : colors.border,
                    background:  active ? "rgba(59,130,246,0.10)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontFamily: typography.monoFamily, fontSize: 12, fontWeight: 700, color: active ? colors.primary : colors.textSecondary }}>
                      {id}
                    </span>
                    <span style={{ ...sevPill, background: sev.bg, borderColor: sev.border, color: sev.text }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: sev.dot, display: "inline-block", flexShrink: 0 }} />
                      {d.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 2 }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>{d.zone}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: camera frame + metadata */}
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
          {/* Camera frame card */}
          <div style={frameCard}>
            <div style={frameHeader}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: "0.8px" }}>
                CAPTURED FRAME — {detId}
              </span>
              <span style={{ fontSize: 11, color: colors.textSecondary, fontFamily: typography.monoFamily }}>
                {selected.timestamp}
              </span>
            </div>

            <CameraFrame detection={selected} detIdx={selectedIdx} />

            <div style={navRow}>
              <button
                type="button"
                style={{ ...navBtn, opacity: selectedIdx === 0 ? 0.4 : 1, cursor: selectedIdx === 0 ? "not-allowed" : "pointer" }}
                disabled={selectedIdx === 0}
                onClick={() => setSelectedIdx((i) => i - 1)}
              >
                Previous
              </button>
              <span style={{ color: colors.textSecondary, fontSize: 13 }}>
                {selectedIdx + 1} of {detections.length}
              </span>
              <button
                type="button"
                style={{ ...navBtn, opacity: selectedIdx === detections.length - 1 ? 0.4 : 1, cursor: selectedIdx === detections.length - 1 ? "not-allowed" : "pointer" }}
                disabled={selectedIdx === detections.length - 1}
                onClick={() => setSelectedIdx((i) => i + 1)}
              >
                Next
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div style={metaCard}>
            <div style={metaTitle}>Detection Metadata</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: spacing.md }}>
              <MetaBox label="Detection ID" value={detId} mono />
              <MetaBox label="Type"         value={selected.label} />
              <MetaBox label="Severity"     value={selected.severity} tone={selected.severity} />
              <MetaBox label="Confidence"   value={`${Math.round(selected.confidence * 100)}%`} mono />
              <MetaBox label="Zone"         value={selected.zone} />
              <MetaBox label="Timestamp"    value={selected.timestamp} mono />
            </div>

            {/* Co-detections: other findings captured in the same frame */}
            {coDetections.length > 0 && (
              <div style={{ marginTop: spacing.md }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.38)", letterSpacing: "0.8px", marginBottom: 8 }}>
                  ALSO DETECTED IN THIS FRAME
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {coDetections.map((co) => {
                    const sev = sevColors(co.severity);
                    return (
                      <div key={co.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: sev.bg, border: `1px solid ${sev.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: typography.monoFamily, fontSize: 12, fontWeight: 700, color: sev.text }}>{co.id}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>{co.label}</span>
                          <span style={{ fontSize: 12, color: colors.textSecondary }}>{co.zone}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontFamily: typography.monoFamily, color: colors.textSecondary }}>{Math.round(co.confidence * 100)}%</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, border: `1px solid ${sev.border}`, background: "rgba(0,0,0,0.25)", fontSize: 11, fontWeight: 600, color: sev.text }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: sev.dot, display: "inline-block" }} />
                            {co.severity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={linkNote}>
              Detection {detId} is traceable in Results Review and Flight History.
            </div>
          </div>
        </div>
      </div>

      <style>{css}</style>
    </div>
  );
}

// ── Camera frame — real image if available, animated canvas otherwise ─────────

function CameraFrame({ detection, detIdx }: { detection: LiveDetection; detIdx: number }) {
  const [imgError, setImgError] = React.useState(false);

  // Reset error state when detection changes
  React.useEffect(() => { setImgError(false); }, [detection.imageFile]);

  // Show the real prediction image when available and not broken
  if (detection.imageFile && !imgError) {
    const sev = detection.severity;
    const sevColor = sev === "High" ? "#ff5c73" : sev === "Medium" ? "#f7c948" : "#3ddc97";
    const detId = detection.id;
    return (
      <div style={{ position: "relative", width: "100%", lineHeight: 0, maxHeight: 400, overflow: "hidden", background: "#0c1422", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={`/predictions/${detection.imageFile}`}
          alt={`YOLOv11 detection ${detId}`}
          onError={() => setImgError(true)}
          style={{ width: "100%", maxHeight: 400, objectFit: "contain", display: "block" }}
        />
        {/* HUD overlay — detection ID + confidence badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: `${sevColor}dd`,
          color: "#000", fontFamily: "monospace",
          fontSize: 11, fontWeight: 700,
          padding: "3px 9px", borderRadius: 4, letterSpacing: "0.4px",
          pointerEvents: "none",
        }}>
          {detId} &nbsp;·&nbsp; {detection.label.toUpperCase()} &nbsp;·&nbsp; {Math.round(detection.confidence * 100)}%
        </div>
        {/* Severity label top-right */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: "rgba(0,0,0,0.72)",
          color: sevColor, fontFamily: "monospace",
          fontSize: 10, fontWeight: 700,
          padding: "3px 8px", borderRadius: 4, letterSpacing: "0.8px",
          pointerEvents: "none",
        }}>
          {sev.toUpperCase()}
        </div>
        {/* Zone label bottom-left */}
        <div style={{
          position: "absolute", bottom: 10, left: 10,
          color: "rgba(255,255,255,0.55)", fontFamily: "monospace",
          fontSize: 9, letterSpacing: "0.5px",
          background: "rgba(0,0,0,0.55)", padding: "2px 7px", borderRadius: 3,
          pointerEvents: "none",
        }}>
          ZONE: {detection.zone.toUpperCase()}
        </div>
      </div>
    );
  }

  // Fallback: animated canvas simulation (no imageFile, or image failed to load)
  return <CameraCanvas detection={detection} detIdx={detIdx} />;
}

function CameraCanvas({ detection, detIdx }: { detection: LiveDetection; detIdx: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    const W = CANVAS_W, H = CANVAS_H;
    const sev             = detection.severity;
    const [r, g, b]       = sev === "High" ? [255, 92, 115] : sev === "Medium" ? [247, 201, 72] : [61, 220, 151];
    const box             = getBoxForZone(detection.zone, W, H);
    const detId           = detection.id;
    let t                 = 0;

    function draw() {
      t += 0.035;
      ctx.clearRect(0, 0, W, H);

      // ── Aircraft surface background ─────────────────────────────────────
      ctx.fillStyle = "#0c1422";
      ctx.fillRect(0, 0, W, H);

      // Panel grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.055)";
      ctx.lineWidth = 1;
      for (let px = 0; px <= W; px += 56) {
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
      }
      for (let py = 0; py <= H; py += 44) {
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
      }

      // Rivets
      ctx.fillStyle = "rgba(255,255,255,0.09)";
      for (let py = 22; py < H; py += 44) {
        for (let px = 28; px < W; px += 56) {
          ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Wear streaks (consistent per detection)
      ctx.globalAlpha = 0.04;
      for (let k = 0; k < 4; k++) {
        const hx = ((detIdx * 71 + k * 43) % 88 + 6) / 100 * W;
        const hy = ((detIdx * 41 + k * 31) % 78) / 100 * H;
        ctx.fillStyle = "rgba(200,210,220,1)";
        ctx.fillRect(hx, hy, 2, 36 + k * 9);
      }
      ctx.globalAlpha = 1;

      // ── Bounding box ────────────────────────────────────────────────────
      const pulse = Math.sin(t * 2) * 0.16 + 0.84;
      const { bx, by, bw, bh } = box;

      // Radial glow inside box
      const grad = ctx.createRadialGradient(
        bx + bw / 2, by + bh / 2, 0,
        bx + bw / 2, by + bh / 2, Math.max(bw, bh) * 0.60,
      );
      grad.addColorStop(0, `rgba(${r},${g},${b},0.09)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, bw, bh);

      // Box border
      ctx.strokeStyle = `rgba(${r},${g},${b},${pulse})`;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(bx, by, bw, bh);

      // Corner brackets
      const cl = 12;
      ctx.strokeStyle = `rgba(${r},${g},${b},1)`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx, by + cl);        ctx.lineTo(bx, by);            ctx.lineTo(bx + cl, by);        ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw - cl, by);   ctx.lineTo(bx + bw, by);       ctx.lineTo(bx + bw, by + cl);   ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by + bh - cl);   ctx.lineTo(bx, by + bh);       ctx.lineTo(bx + cl, by + bh);   ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke();

      // Label tag above bounding box
      const tag  = `${detId}  ${detection.label.toUpperCase()}  ${Math.round(detection.confidence * 100)}%`;
      ctx.font   = "bold 10px monospace";
      ctx.textAlign = "left";
      const lw   = ctx.measureText(tag).width + 14;
      const tagY = Math.max(by - 22, 2);
      ctx.fillStyle = `rgba(${r},${g},${b},0.92)`;
      ctx.fillRect(bx, tagY, lw, 18);
      ctx.fillStyle = "#000";
      ctx.fillText(tag, bx + 7, tagY + 12);

      // ── HUD overlays ────────────────────────────────────────────────────
      const hm = 8, hl = 14;
      ctx.strokeStyle = "rgba(56,189,248,0.30)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(hm, hm + hl); ctx.lineTo(hm, hm); ctx.lineTo(hm + hl, hm); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - hm - hl, hm); ctx.lineTo(W - hm, hm); ctx.lineTo(W - hm, hm + hl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hm, H - hm - hl); ctx.lineTo(hm, H - hm); ctx.lineTo(hm + hl, H - hm); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - hm - hl, H - hm); ctx.lineTo(W - hm, H - hm); ctx.lineTo(W - hm, H - hm - hl); ctx.stroke();

      ctx.font      = "9px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.36)";
      ctx.textAlign = "left";
      ctx.fillText(`ZONE: ${detection.zone.toUpperCase()}`, 10, H - 8);

      ctx.font      = "bold 10px monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = `rgba(${r},${g},${b},0.90)`;
      ctx.fillText(sev.toUpperCase(), W - 10, 18);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [detection, detIdx]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  );
}

/** Map a zone name to a bounding-box region within the canvas frame */
function getBoxForZone(zone: string, W: number, H: number): { bx: number; by: number; bw: number; bh: number } {
  const z = zone.toLowerCase();
  if (z.includes("forward") || z.includes("nose"))
    return { bx: W * 0.44, by: H * 0.18, bw: W * 0.43, bh: H * 0.56 };
  if (z.includes("aft") || z.includes("tail") || z.includes("cone"))
    return { bx: W * 0.09, by: H * 0.18, bw: W * 0.38, bh: H * 0.56 };
  if (z.includes("left") || (z.includes("wing") && !z.includes("right") && !z.includes("root")))
    return { bx: W * 0.18, by: H * 0.07, bw: W * 0.60, bh: H * 0.37 };
  if (z.includes("right"))
    return { bx: W * 0.18, by: H * 0.54, bw: W * 0.60, bh: H * 0.37 };
  if (z.includes("engine") || z.includes("cowl"))
    return { bx: W * 0.14, by: H * 0.12, bw: W * 0.38, bh: H * 0.40 };
  if (z.includes("belly"))
    return { bx: W * 0.22, by: H * 0.28, bw: W * 0.52, bh: H * 0.40 };
  if (z.includes("stabilizer") || z.includes("horizontal") || z.includes("vertical"))
    return { bx: W * 0.08, by: H * 0.20, bw: W * 0.40, bh: H * 0.52 };
  // default
  return { bx: W * 0.20, by: H * 0.16, bw: W * 0.56, bh: H * 0.58 };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaBox({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: string }) {
  const sev = tone ? sevColors(tone) : null;
  return (
    <div style={{ padding: "10px 12px", borderRadius: radius.sm, background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}` }}>
      <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: sev?.text ?? colors.textPrimary, fontFamily: mono ? typography.monoFamily : "inherit" }}>
        {value}
      </div>
    </div>
  );
}

function sevColors(sev: string) {
  if (sev === "High")   return { bg: "rgba(255,92,115,0.10)", border: "rgba(255,92,115,0.28)", dot: colors.danger,  text: colors.danger };
  if (sev === "Medium") return { bg: "rgba(247,201,72,0.10)", border: "rgba(247,201,72,0.28)", dot: colors.warning, text: colors.warning };
  return                       { bg: "rgba(61,220,151,0.10)", border: "rgba(61,220,151,0.28)", dot: colors.success, text: colors.success };
}

// ── Styles ────────────────────────────────────────────────────────────────────

const headerRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: spacing.lg, flexWrap: "wrap" };
const pageTitle: React.CSSProperties = { margin: 0, fontSize: 26, fontWeight: 700, color: colors.textPrimary };
const pageSub:   React.CSSProperties = { margin: "4px 0 0", fontSize: 14, color: colors.textSecondary };

const regBadge: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: 999,
  background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.28)",
  color: colors.primary, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px",
};

const countPill: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: 999,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
  color: colors.textSecondary, fontSize: 12,
};

const completeBadge: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: 999,
  background: "rgba(61,220,151,0.10)", border: "1px solid rgba(61,220,151,0.28)",
  color: colors.success, fontSize: 10, fontWeight: 700, letterSpacing: "0.8px",
};

const layout: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "220px 1fr", gap: spacing.lg, alignItems: "start",
};

const listPanel: React.CSSProperties = {
  padding: spacing.md, borderRadius: radius.lg, border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.025)",
};

const listHeader: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.38)", letterSpacing: "1px", marginBottom: spacing.md,
};

const listItemBase: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: radius.sm,
  border: "1px solid", cursor: "pointer", textAlign: "left",
  transition: "border-color 0.15s, background 0.15s",
};

const sevPill: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "2px 8px", borderRadius: 999, border: "1px solid", fontSize: 11, fontWeight: 600,
};

const frameCard: React.CSSProperties = {
  borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden",
  background: "#0c1422",
};

const frameHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "10px 14px", borderBottom: `1px solid rgba(255,255,255,0.07)`,
  background: "rgba(255,255,255,0.025)",
};

const navRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "10px 14px", borderTop: `1px solid rgba(255,255,255,0.07)`,
  background: "rgba(255,255,255,0.025)",
};

const navBtn: React.CSSProperties = {
  padding: "6px 16px", borderRadius: 8, border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.05)", color: colors.textSecondary,
  fontSize: 12, fontWeight: 600, fontFamily: typography.fontFamily,
};

const metaCard: React.CSSProperties = {
  padding: spacing.lg, borderRadius: radius.lg, border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.025)",
};

const metaTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: colors.textPrimary };

const linkNote: React.CSSProperties = {
  marginTop: spacing.md, padding: "10px 12px", borderRadius: radius.sm,
  background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.18)",
  fontSize: 12, color: colors.textSecondary, lineHeight: 1.6,
};

const emptyCard: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  minHeight: 300, borderRadius: radius.lg, border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.02)", textAlign: "center", padding: spacing.xl,
};

const css = `
  @media (max-width: 900px) {
    .dv-grid { grid-template-columns: 1fr !important; }
  }
`;
