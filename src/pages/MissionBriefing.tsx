// src/pages/MissionBriefing.tsx
// Pre-flight briefing screen shown to Pilots before launching a drone mission.
// Checklist animates in one by one, then enables the "Launch Mission" button.
import React, { useEffect, useState } from "react";
import type { Aircraft } from "../data/fleetStore";
import { colors, radius, spacing, typography } from "../ui/tokens";
import Card from "../ui/Card";

interface Props {
  aircraft: Aircraft;
  onLaunch: () => void;
  onCancel: () => void;
}

interface CheckItem {
  label: string;
  value: string;
  status: "pending" | "ok" | "warn";
}

const CHECKS: CheckItem[] = [
  { label: "Drone battery level", value: "100% — Full charge", status: "ok" },
  { label: "Camera system", value: "Camera sensor — Ready", status: "ok" },
  { label: "GPS & positioning", value: "12 satellites locked", status: "ok" },
  { label: "SD card storage", value: "64 GB — Available", status: "ok" },
  { label: "Comms link", value: "Encrypted — 28 dBm", status: "ok" },
  { label: "Aircraft documentation", value: "MSN retrieved", status: "ok" },
];

export default function MissionBriefing({ aircraft, onLaunch, onCancel }: Props) {
  const [revealed, setRevealed] = useState(0); // how many checklist items shown
  const allDone = revealed >= CHECKS.length;

  useEffect(() => {
    if (revealed >= CHECKS.length) return;
    const t = window.setTimeout(() => setRevealed((v) => v + 1), 380);
    return () => clearTimeout(t);
  }, [revealed]);

  const statusColor = {
    Active: colors.success,
    "In Maintenance": colors.warning,
    Grounded: colors.danger,
  }[aircraft.status];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h1 style={pageTitle}>Pre-Flight Briefing</h1>
          <span style={{ ...badge, background: `${statusColor}18`, borderColor: `${statusColor}40`, color: statusColor }}>
            {aircraft.registration}
          </span>
        </div>
        <p style={pageSubtitle}>
          Complete the automated pre-flight checks before launching the inspection drone
        </p>
      </div>

      <div style={twoCol} className="briefing-grid">
        {/* Left: aircraft summary */}
        <Card>
          <div style={sectionHead}>Aircraft</div>
          <div style={{ marginTop: spacing.md }}>
            <div style={regDisplay}>{aircraft.registration}</div>
            <div style={modelDisplay}>{aircraft.model}</div>
            <div style={{ marginTop: 6, fontSize: 13, color: colors.textSecondary }}>
              {aircraft.airline} · Mfg. {aircraft.manufactureYear}
            </div>
          </div>

          <div style={{ marginTop: spacing.lg, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InfoBox label="Status" value={aircraft.status} tone={aircraft.status === "Active" ? "ok" : "warn"} />
            <InfoBox label="Model" value={aircraft.shortModel} tone="neutral" />
            <InfoBox label="Flight Hours" value={aircraft.totalFlightHours.toLocaleString()} tone="neutral" />
            <InfoBox label="Mfg. Year" value={String(aircraft.manufactureYear)} tone="neutral" />
          </div>

          <div style={{ marginTop: spacing.lg, padding: "12px 14px", borderRadius: radius.md, background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.18)" }}>
            <div style={{ fontSize: 12, color: "rgba(59,130,246,0.80)", fontWeight: 700, marginBottom: 4 }}>
              Mission Parameters
            </div>
            <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6 }}>
              Drone orbits the aircraft fuselage at 4–6 m altitude, capturing
              high-resolution images at 12 inspection waypoints. After landing,
              images are transferred and analysed offline by YOLOv11 to detect
              cracks, dents, corrosion, and missing rivets. Results are available
              in Detection View once processing is complete.
            </div>
          </div>
        </Card>

        {/* Right: checklist */}
        <Card>
          <div style={sectionHead}>Pre-Flight Checklist</div>
          <div style={{ marginTop: spacing.md, display: "flex", flexDirection: "column", gap: 8 }}>
            {CHECKS.map((check, i) => {
              const visible = i < revealed;
              return (
                <div
                  key={check.label}
                  style={{
                    ...checkRow,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(-10px)",
                  }}
                >
                  <div style={checkIcon}>✓</div>
                  <div style={{ flex: 1, fontSize: 13, color: colors.textPrimary }}>{check.label}</div>
                  <div style={checkValue}>{check.value}</div>
                  <div style={checkBadge}>OK</div>
                </div>
              );
            })}

            {!allDone && (
              <div style={{ padding: "10px 0", display: "flex", alignItems: "center", gap: 10, color: colors.textSecondary, fontSize: 13 }}>
                <span style={spinner} />
                Running checks…
              </div>
            )}
          </div>

          {allDone && (
            <div
              style={{
                marginTop: spacing.md,
                padding: "12px 14px",
                borderRadius: radius.md,
                background: "rgba(61,220,151,0.08)",
                border: "1px solid rgba(61,220,151,0.28)",
                fontSize: 13,
                color: colors.success,
                fontWeight: 700,
              }}
            >
              ✓ All systems nominal - aircraft ready for inspection
            </div>
          )}

          <div style={{ marginTop: spacing.xl, display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
            <button type="button" onClick={onCancel} style={cancelBtn}>
              Cancel
            </button>
            <button type="button" onClick={onLaunch} disabled={!allDone} style={launchBtn}>
              Launch Mission
            </button>
          </div>
        </Card>
      </div>

      <style>{css}</style>
    </div>
  );
}

function InfoBox({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "neutral" }) {
  const color = tone === "ok" ? colors.success : tone === "warn" ? colors.warning : colors.textPrimary;
  return (
    <div style={{ padding: "10px 12px", borderRadius: radius.sm, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
      <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

const pageTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 700,
  color: colors.textPrimary,
};

const pageSubtitle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 14,
  color: colors.textSecondary,
};

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 12px",
  borderRadius: 999,
  border: "1px solid",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.5px",
};

const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1.2fr",
  gap: spacing.lg,
  alignItems: "start",
};

const sectionHead: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 16,
  color: colors.textPrimary,
};

const regDisplay: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: colors.textPrimary,
  letterSpacing: "1px",
  fontFamily: typography.monoFamily,
};

const modelDisplay: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: colors.textSecondary,
  marginTop: 2,
};

const checkRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "9px 12px",
  borderRadius: radius.sm,
  background: "rgba(61,220,151,0.04)",
  border: "1px solid rgba(61,220,151,0.14)",
  transition: "opacity 0.35s ease, transform 0.35s ease",
};

const checkIcon: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "rgba(61,220,151,0.18)",
  border: "1px solid rgba(61,220,151,0.40)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  color: colors.success,
  fontWeight: 700,
  flexShrink: 0,
};

const checkValue: React.CSSProperties = {
  fontSize: 12,
  color: colors.textSecondary,
  fontFamily: typography.monoFamily,
};

const checkBadge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: colors.success,
  background: "rgba(61,220,151,0.12)",
  border: "1px solid rgba(61,220,151,0.25)",
  borderRadius: 4,
  padding: "2px 6px",
  letterSpacing: "0.5px",
};

const spinner: React.CSSProperties = {
  display: "inline-block",
  width: 14,
  height: 14,
  borderRadius: "50%",
  border: "2px solid rgba(255,255,255,0.12)",
  borderTopColor: colors.primary,
};

const cancelBtn: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textSecondary,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  fontFamily: typography.fontFamily,
};

const launchBtn: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: "1px solid rgba(61,220,151,0.40)",
  background: "rgba(61,220,151,0.18)",
  color: colors.textPrimary,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 700,
  fontFamily: typography.fontFamily,
};

const css = `
  @media (max-width: 900px) {
    .briefing-grid { grid-template-columns: 1fr !important; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
