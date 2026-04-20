import React, { useState, useEffect } from "react";
import { BLENDER_SESSIONS } from "../data/blenderData";
import { colors, spacing, radius } from "../ui/tokens";
import Card from "../ui/Card";
import type { Aircraft } from "../data/fleetStore";

export default function DetectionView({ aircraft }: { aircraft: Aircraft }) {
  const [index, setIndex] = useState(0);
  const data = BLENDER_SESSIONS[index];

  // Keyboard Navigation (Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((prev) => (prev + 1) % BLENDER_SESSIONS.length);
      else if (e.key === "ArrowLeft") setIndex((prev) => (prev - 1 + BLENDER_SESSIONS.length) % BLENDER_SESSIONS.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      <header style={headerStyle}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ color: colors.textPrimary, margin: 0, fontSize: 26, fontWeight: 700 }}>
              Detection View
            </h1>
            <span style={registrationBadge}>{aircraft.registration}</span>
          </div>
          <p style={{ color: colors.textSecondary, margin: 0, fontSize: 14 }}>
            Frame-by-frame drone feed inspection · {aircraft.model}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: colors.textSecondary, fontSize: 13 }}>
            Frame {index + 1} / {BLENDER_SESSIONS.length}
          </span>
          <div style={badgeStyle}>MANUAL SCAN ACTIVE</div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: spacing.lg }}>

        {/* Visual Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <Card title="Drone Visual Feed" subtitle={`File: ${data.id}.png`}>
            <div style={stageStyle}>
              {/* THE IMAGE: Reverted to 'cover' to fill the frame nicely */}
              <img
                src={`/renders/${data.id}.png`}
                alt="Drone Feed"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/640x640/1e293b/475569?text=Image+Not+Found";
                }}
              />

              {/* THE SCANNING LINE: Now always active and moving */}
              <div className="scan-line" style={scanLineStyle} />
            </div>

            {/* MANUAL CONTROLS */}
            <div style={controlRow}>
              <button style={navBtn} onClick={() => setIndex((i) => (i - 1 + BLENDER_SESSIONS.length) % BLENDER_SESSIONS.length)}>
                ◀ PREVIOUS
              </button>

              <div style={indexIndicator}>
                {String(index + 1).padStart(2, '0')} / {BLENDER_SESSIONS.length}
              </div>

              <button style={{ ...navBtn, background: colors.primary }} onClick={() => setIndex((i) => (i + 1) % BLENDER_SESSIONS.length)}>
                NEXT ▶
              </button>
            </div>
          </Card>
        </div>

        {/* Data Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Card title="Detection Metadata">
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              <DataRow label="Target Object" value={data.object} />
              <DataRow label="Finding" value={data.type} color={colors.danger} />
              <DataRow label="Confidence" value={`${(data.confidence * 100).toFixed(1)}%`} />
              <DataRow label="3D Hit (m)" value={`${data.hit.x.toFixed(2)}, ${data.hit.y.toFixed(2)}`} />
            </div>
          </Card>

          <Card title="Controls Reference">
            <div style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 1.6 }}>
              • Use <b>Right Arrow</b> to advance<br />
              • Use <b>Left Arrow</b> to go back<br />
              • Data refreshes instantly per frame
            </div>
            <button style={resetBtn} onClick={() => setIndex(0)}>Reset Session</button>
          </Card>
        </div>
      </div>

      {/* CSS Animation for the line */}
      <style>{`
                @keyframes scanLoop {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { opacity: 0.8; }
                    100% { top: 100%; opacity: 0; }
                }
                .scan-line {
                    animation: scanLoop 3s linear infinite;
                }
            `}</style>
    </div>
  );
}

// --- Helper Components & Styles ---

function DataRow({ label, value, color }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</span>
      <span style={{ color: color || colors.textPrimary, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

const registrationBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 12px",
  borderRadius: 999,
  background: "rgba(59,130,246,0.12)",
  border: "1px solid rgba(59,130,246,0.30)",
  color: colors.primary,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.5px",
};

const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const stageStyle: React.CSSProperties = { height: 480, background: '#000', position: 'relative', borderRadius: radius.md, overflow: 'hidden', border: `1px solid ${colors.border}` };
const controlRow: React.CSSProperties = { display: 'flex', gap: spacing.md, marginTop: spacing.md, alignItems: 'center' };
const navBtn: React.CSSProperties = { flex: 1, padding: '14px', borderRadius: 8, border: 'none', background: '#334155', color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: 12, letterSpacing: '1px' };
const indexIndicator: React.CSSProperties = { padding: '0 20px', color: colors.textPrimary, fontWeight: 700, fontSize: 18, fontFamily: 'monospace' };
const resetBtn: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.textSecondary, cursor: 'pointer', marginTop: spacing.md, fontSize: 12 };
const badgeStyle: React.CSSProperties = { padding: '6px 12px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid #60a5fa' };

const scanLineStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  width: '100%',
  height: '2px',
  background: colors.primary,
  boxShadow: `0 0 15px ${colors.primary}`,
  zIndex: 5
};