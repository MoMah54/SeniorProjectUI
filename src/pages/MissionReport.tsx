// src/pages/MissionReport.tsx
// Auto-generated report shown immediately after the drone lands.
// Saves the flight record to localStorage so Analysts can view it later.
import React, { useEffect, useRef, useState } from "react";
import type { Aircraft, LiveDetection } from "../data/fleetStore";
import { generateAccessCode, saveFlightRecord } from "../data/fleetStore";
import type { FlightRecord, HistoricalFinding } from "../data/fleetStore";
import { colors, radius, spacing, typography } from "../ui/tokens";
import Card from "../ui/Card";

interface Props {
  aircraft: Aircraft;
  detections: LiveDetection[];
  missionSeconds: number;
  pilotName: string;
  onViewHistory: () => void;
  onNewMission: () => void;
  /** If provided, updates the record already saved on drone launch instead of creating a new one */
  existingFlightId?: string;
  existingAccessCode?: string;
}

export default function MissionReport({
  aircraft,
  detections,
  missionSeconds,
  pilotName,
  onViewHistory,
  onNewMission,
  existingFlightId,
  existingAccessCode,
}: Props) {
  // Reuse the access code generated on launch so the analyst's copy stays valid
  const accessCode = useRef(existingAccessCode ?? generateAccessCode());
  const [copied, setCopied] = useState(false);

  // Update (or create) the flight record once on mount with the final duration
  useEffect(() => {
    const today    = new Date().toISOString().slice(0, 10);
    const flightId = existingFlightId ?? `fl-live-${Date.now().toString(36).toUpperCase()}`;

    const findings: HistoricalFinding[] = detections.map((d, i) => ({
      id: d.id || `fnd-${flightId}-${i}`,
      flightId,
      aircraftId: aircraft.id,
      type: d.label,
      severity: d.severity,
      confidence: d.confidence,
      zone: d.zone,
      timestamp: d.timestamp,
      notes: `Detected by drone during live inspection. Confidence: ${Math.round(d.confidence * 100)}%.`,
      resolved: false,
      reoccurrence: false,
    }));

    const record: FlightRecord = {
      id: flightId,
      aircraftId: aircraft.id,
      date: today,
      duration: formatDuration(missionSeconds),
      pilotName,
      engineer: pilotName,
      status: "Pending Review",
      findings,
      accessCode: accessCode.current,
    };

    // saveFlightRecord filters by id — same id = update, new id = insert
    saveFlightRecord(record);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const high   = detections.filter((d) => d.severity === "High").length;
  const medium = detections.filter((d) => d.severity === "Medium").length;
  const low    = detections.filter((d) => d.severity === "Low").length;

  function copyCode() {
    void navigator.clipboard.writeText(accessCode.current);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function exportJSON() {
    const data = {
      aircraft: { registration: aircraft.registration, model: aircraft.model },
      pilot: pilotName,
      date: new Date().toISOString().slice(0, 10),
      duration: formatDuration(missionSeconds),
      accessCode: accessCode.current,
      findings: detections,
    };
    download(
      JSON.stringify(data, null, 2),
      `${aircraft.registration}_mission_${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
    );
  }

  function exportCSV() {
    const hdr  = ["ID", "Type", "Zone", "Severity", "Confidence", "Timestamp"];
    const rows = detections.map((d) => [
      d.id,
      d.label,
      d.zone,
      d.severity,
      `${Math.round(d.confidence * 100)}%`,
      d.timestamp,
    ]);
    const csv = [hdr, ...rows].map((r) => r.join(",")).join("\n");
    download(
      csv,
      `${aircraft.registration}_mission_${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv",
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      {/* Header */}
      <div style={headerRow}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={successDot} />
            <h1 style={pageTitle}>Inspection Complete</h1>
            <span style={regBadge}>{aircraft.registration}</span>
          </div>
          <p style={pageSubtitle}>
            {aircraft.model} · {aircraft.airline} · {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <StatPill label="Duration"  value={formatDuration(missionSeconds)} tone="neutral" />
          <StatPill label="Findings"  value={String(detections.length)}      tone={detections.length > 0 ? "warn" : "success"} />
          {high > 0 && <StatPill label="High Severity" value={String(high)} tone="danger" />}
        </div>
      </div>

      <div style={twoCol} className="report-grid">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>

          {/* Access code card */}
          <div style={codeCard}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(59,130,246,0.85)", marginBottom: 8, letterSpacing: "0.5px" }}>
              REPORT ACCESS CODE
            </div>
            <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14, lineHeight: 1.5 }}>
              Share this code with your Inspection Analyst so they can pull up this report and review the findings.
            </div>
            <div style={codeDisplay}>{accessCode.current}</div>
            <button type="button" onClick={copyCode} style={copyBtn}>
              {copied ? "✓ Copied!" : "Copy Code"}
            </button>
          </div>

          {/* Severity summary */}
          <Card>
            <div style={sectionHead}>Findings Summary</div>
            <div style={{ marginTop: spacing.md, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <SevBox count={high}   label="High"   color={colors.danger}  bg="rgba(255,92,115,0.08)"  border="rgba(255,92,115,0.25)" />
              <SevBox count={medium} label="Medium" color={colors.warning} bg="rgba(247,201,72,0.08)"  border="rgba(247,201,72,0.25)" />
              <SevBox count={low}    label="Low"    color={colors.success} bg="rgba(61,220,151,0.08)"  border="rgba(61,220,151,0.25)" />
            </div>
            {detections.length === 0 && (
              <div style={{ marginTop: spacing.md, textAlign: "center", color: colors.success, fontSize: 14, fontWeight: 700 }}>
                No defects detected — aircraft passed inspection
              </div>
            )}
          </Card>

          {/* Export */}
          <Card>
            <div style={sectionHead}>Export Report</div>
            <div style={{ marginTop: spacing.md, display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
              <button type="button" onClick={exportJSON} style={exportBtn}>Export JSON</button>
              <button type="button" onClick={exportCSV}  style={exportBtn}>Export CSV</button>
            </div>
          </Card>

          {/* Navigation */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
            <button type="button" onClick={onNewMission} style={secondaryBtn}>← New Mission</button>
            <button type="button" onClick={onViewHistory} style={primaryBtn}>View History →</button>
          </div>
        </div>

        {/* Right column: findings list */}
        <Card>
          <div style={sectionHead}>
            Detected Findings
            <span style={{ fontWeight: 400, fontSize: 13, color: colors.textSecondary, marginLeft: 8 }}>
              — {detections.length} total
            </span>
          </div>
          <div style={{ marginTop: spacing.md, display: "flex", flexDirection: "column", gap: 10 }}>
            {detections.length === 0 ? (
              <div style={{ padding: spacing.lg, textAlign: "center", color: colors.textSecondary, fontSize: 14 }}>
                No anomalies were detected during this inspection.
              </div>
            ) : (
              detections.map((d) => <FindingRow key={d.id} d={d} />)
            )}
          </div>
        </Card>
      </div>

      <style>{css}</style>
    </div>
  );
}

function FindingRow({ d }: { d: LiveDetection }) {
  const sev = sevStyle(d.severity);
  return (
    <div style={{ padding: 14, borderRadius: radius.md, border: `1px solid ${sev.border}`, background: sev.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, color: colors.textPrimary }}>{d.label}</span>
          <span style={{ ...pill, background: sev.bg, borderColor: sev.border, color: sev.text }}>
            <span style={{ ...dot, background: sev.dot }} />
            {d.severity}
          </span>
        </div>
        <span style={{ fontSize: 12, fontFamily: typography.monoFamily, color: colors.textSecondary }}>{d.id}</span>
      </div>
      <div style={{ fontSize: 12, color: colors.textSecondary }}>
        {d.zone} &nbsp;·&nbsp; {Math.round(d.confidence * 100)}% confidence &nbsp;·&nbsp; {d.timestamp}
      </div>
    </div>
  );
}

function SevBox({ count, label, color, bg, border }: { count: number; label: string; color: string; bg: string; border: string }) {
  return (
    <div style={{ padding: 14, borderRadius: radius.md, background: bg, border: `1px solid ${border}`, textAlign: "center" }}>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: string; tone: "success" | "warn" | "danger" | "info" | "neutral" }) {
  const map = {
    success: { bg: "rgba(61,220,151,0.10)", border: "rgba(61,220,151,0.28)", color: colors.success },
    warn:    { bg: "rgba(247,201,72,0.10)",  border: "rgba(247,201,72,0.28)",  color: colors.warning },
    danger:  { bg: "rgba(255,92,115,0.10)",  border: "rgba(255,92,115,0.28)",  color: colors.danger },
    info:    { bg: "rgba(59,130,246,0.10)",  border: "rgba(59,130,246,0.28)",  color: colors.primary },
    neutral: { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", color: colors.textSecondary },
  } as const;
  const s = map[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: radius.pill, border: `1px solid ${s.border}`, background: s.bg, color: s.color, fontSize: 12, whiteSpace: "nowrap" }}>
      {label}: <strong>{value}</strong>
    </span>
  );
}

function sevStyle(sev: string) {
  if (sev === "High")   return { bg: "rgba(255,92,115,0.07)", border: "rgba(255,92,115,0.25)", text: colors.danger,  dot: colors.danger };
  if (sev === "Medium") return { bg: "rgba(247,201,72,0.07)", border: "rgba(247,201,72,0.25)",  text: colors.warning, dot: colors.warning };
  return                       { bg: "rgba(61,220,151,0.07)", border: "rgba(61,220,151,0.25)",  text: colors.success, dot: colors.success };
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m} min ${sec} s` : `${sec} s`;
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const headerRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: spacing.lg, flexWrap: "wrap" };
const pageTitle: React.CSSProperties = { margin: 0, fontSize: 26, fontWeight: 700, color: colors.textPrimary };
const pageSubtitle: React.CSSProperties = { margin: "4px 0 0", fontSize: 14, color: colors.textSecondary };

const successDot: React.CSSProperties = {
  display: "inline-block",
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: colors.success,
  boxShadow: `0 0 8px ${colors.success}`,
  flexShrink: 0,
};

const regBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 12px",
  borderRadius: 999,
  background: "rgba(61,220,151,0.10)",
  border: "1px solid rgba(61,220,151,0.28)",
  color: colors.success,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.5px",
};

const twoCol: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: spacing.lg, alignItems: "start" };
const sectionHead: React.CSSProperties = { fontWeight: 900, fontSize: 16, color: colors.textPrimary };

const codeCard: React.CSSProperties = {
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: "1px solid rgba(59,130,246,0.35)",
  background: "rgba(59,130,246,0.08)",
};

const codeDisplay: React.CSSProperties = {
  fontFamily: typography.monoFamily,
  fontSize: 32,
  fontWeight: 700,
  letterSpacing: "6px",
  color: colors.textPrimary,
  textAlign: "center",
  padding: "14px 0",
  background: "rgba(0,0,0,0.25)",
  borderRadius: radius.md,
  border: "1px solid rgba(59,130,246,0.25)",
};

const copyBtn: React.CSSProperties = {
  marginTop: 12,
  width: "100%",
  height: 38,
  borderRadius: 10,
  border: "1px solid rgba(59,130,246,0.40)",
  background: "rgba(59,130,246,0.18)",
  color: colors.textPrimary,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: typography.fontFamily,
};

const exportBtn: React.CSSProperties = {
  height: 38,
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.05)",
  color: colors.textPrimary,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: typography.fontFamily,
};

const primaryBtn: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: "1px solid rgba(59,130,246,0.40)",
  background: "rgba(59,130,246,0.22)",
  color: colors.textPrimary,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 700,
  fontFamily: typography.fontFamily,
};

const secondaryBtn: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textSecondary,
  cursor: "pointer",
  fontSize: 14,
  fontFamily: typography.fontFamily,
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "3px 9px",
  borderRadius: radius.pill,
  fontSize: 12,
  fontWeight: 600,
  border: "1px solid",
};

const dot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  display: "inline-block",
  flexShrink: 0,
};

const css = `
  @media (max-width: 1000px) {
    .report-grid { grid-template-columns: 1fr !important; }
  }
`;
