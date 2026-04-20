// src/pages/FlightHistory.tsx
import React, { useState } from "react";
import {
  getAircraftFlights,
  getZoneRecurrences,
} from "../data/fleetStore";
import type {
  Aircraft,
  FlightRecord,
  HistoricalFinding,
  Severity,
  ZoneRecurrence,
} from "../data/fleetStore";
import { colors, radius, spacing, typography } from "../ui/tokens";

interface Props {
  aircraft: Aircraft;
}

export default function FlightHistory({ aircraft }: Props) {
  const flights = getAircraftFlights(aircraft.id); // newest first
  const recurrences = getZoneRecurrences(aircraft.id);
  const [selectedFlightId, setSelectedFlightId] = useState<string>(flights[0]?.id ?? "");

  const selectedFlight = flights.find((f) => f.id === selectedFlightId) ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>

      {/* ── Header ── */}
      <div style={headerRow}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1 style={pageTitle}>Flight History</h1>
            <AircraftBadge aircraft={aircraft} />
          </div>
          <p style={pageSubtitle}>
            Complete inspection record for {aircraft.registration} · {aircraft.model}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <SummaryPill label="Inspections" value={String(flights.length)} tone="info" />
          <SummaryPill
            label="Recurring Zones"
            value={String(recurrences.length)}
            tone={recurrences.length > 0 ? "danger" : "success"}
          />
        </div>
      </div>

      {/* ── Zone Recurrence Analysis ── */}
      {recurrences.length > 0 && (
        <RecurrencePanel recurrences={recurrences} />
      )}

      {/* ── Two-Panel Layout ── */}
      <div style={twoPanel} className="fh-panels">
        {/* Left: Flight list */}
        <div style={leftPanel}>
          <SectionHeader title="Inspection Log" sub="All drone inspections for this aircraft" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: spacing.md }}>
            {flights.map((flight) => (
              <FlightRow
                key={flight.id}
                flight={flight}
                active={flight.id === selectedFlightId}
                onClick={() => setSelectedFlightId(flight.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: Findings for selected flight */}
        <div style={rightPanel}>
          {selectedFlight ? (
            <FlightDetail flight={selectedFlight} />
          ) : (
            <div style={{ color: colors.textSecondary, padding: spacing.lg }}>
              Select an inspection to view its findings.
            </div>
          )}
        </div>
      </div>

      <style>{`
        .fh-panels { display: grid; grid-template-columns: 1fr 1.4fr; gap: 20px; align-items: start; }
        @media (max-width: 1100px) {
          .fh-panels { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RecurrencePanel({ recurrences }: { recurrences: ZoneRecurrence[] }) {
  return (
    <div
      style={{
        borderRadius: radius.lg,
        border: "1px solid rgba(255,92,115,0.28)",
        background: "rgba(255,92,115,0.06)",
        padding: spacing.lg,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: colors.danger,
            boxShadow: `0 0 8px ${colors.danger}`,
          }}
        />
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.danger }}>
          Zone Recurrence Analysis
        </span>
        <span style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>
          — The following zones have been flagged in multiple inspections
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recurrences.map((r) => (
          <RecurrenceRow key={`${r.zone}::${r.type}`} r={r} />
        ))}
      </div>
    </div>
  );
}

function RecurrenceRow({ r }: { r: ZoneRecurrence }) {
  const sev = severityColors(r.lastSeverity);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: radius.sm,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${colors.border}`,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontWeight: 700, color: colors.textPrimary, minWidth: 100 }}>{r.zone}</span>
      <span
        style={{
          ...pillStyle,
          background: "rgba(255,92,115,0.10)",
          borderColor: "rgba(255,92,115,0.28)",
          color: colors.danger,
        }}
      >
        {r.type}
      </span>
      <span style={{ ...pillStyle, background: sev.bg, borderColor: sev.border, color: sev.text }}>
        {r.lastSeverity}
      </span>
      <span
        style={{
          marginLeft: "auto",
          fontSize: 12,
          fontWeight: 700,
          color: colors.danger,
          background: "rgba(255,92,115,0.12)",
          border: "1px solid rgba(255,92,115,0.28)",
          borderRadius: radius.pill,
          padding: "3px 10px",
        }}
      >
        {r.count}× detected
      </span>
      <span style={{ fontSize: 12, color: colors.textSecondary }}>
        {r.flightDates.map(formatDateShort).join(" · ")}
      </span>
    </div>
  );
}

function FlightRow({
  flight,
  active,
  onClick,
}: {
  flight: FlightRecord;
  active: boolean;
  onClick: () => void;
}) {
  const highCount = flight.findings.filter((f) => f.severity === "High").length;
  const recurrenceCount = flight.findings.filter((f) => f.reoccurrence).length;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "14px 16px",
        borderRadius: radius.md,
        border: active ? "1px solid rgba(59,130,246,0.45)" : `1px solid ${colors.border}`,
        background: active ? "rgba(59,130,246,0.09)" : "rgba(255,255,255,0.03)",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
              {formatDate(flight.date)}
            </span>
            <FlightStatusBadge status={flight.status} />
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>
            {flight.engineer} · {flight.duration}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: colors.textSecondary,
              fontFamily: typography.monoFamily,
            }}
          >
            {flight.findings.length} finding{flight.findings.length !== 1 ? "s" : ""}
          </span>
          {highCount > 0 && (
            <span
              style={{
                fontSize: 11,
                color: colors.danger,
                background: "rgba(255,92,115,0.10)",
                border: "1px solid rgba(255,92,115,0.25)",
                borderRadius: radius.pill,
                padding: "2px 7px",
              }}
            >
              {highCount} High
            </span>
          )}
          {recurrenceCount > 0 && (
            <span
              style={{
                fontSize: 11,
                color: colors.warning,
                background: "rgba(247,201,72,0.10)",
                border: "1px solid rgba(247,201,72,0.25)",
                borderRadius: radius.pill,
                padding: "2px 7px",
              }}
            >
              {recurrenceCount} recur
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function FlightDetail({ flight }: { flight: FlightRecord }) {
  return (
    <div
      style={{
        borderRadius: radius.lg,
        border: `1px solid ${colors.border}`,
        background: "rgba(255,255,255,0.02)",
        overflow: "hidden",
      }}
    >
      {/* Flight header */}
      <div
        style={{
          padding: spacing.lg,
          borderBottom: `1px solid ${colors.border}`,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
              Inspection — {formatDate(flight.date)}
            </div>
            <div style={{ fontSize: 13, color: colors.textSecondary }}>
              {flight.engineer} · Duration: {flight.duration}
            </div>
          </div>
          <FlightStatusBadge status={flight.status} />
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: spacing.md, flexWrap: "wrap" }}>
          <MetaPair label="Flight ID" value={flight.id} mono />
          <MetaPair label="Findings" value={String(flight.findings.length)} />
          <MetaPair
            label="Unresolved"
            value={String(flight.findings.filter((f) => !f.resolved).length)}
            highlight={flight.findings.some((f) => !f.resolved)}
          />
          <MetaPair
            label="Recurrences"
            value={String(flight.findings.filter((f) => f.reoccurrence).length)}
            highlight={flight.findings.some((f) => f.reoccurrence)}
          />
        </div>
      </div>

      {/* Findings list */}
      <div style={{ padding: spacing.lg, display: "flex", flexDirection: "column", gap: 12 }}>
        <SectionHeader
          title="Detected Findings"
          sub="All anomalies logged during this inspection"
        />
        {flight.findings.length === 0 ? (
          <div
            style={{
              padding: spacing.lg,
              color: colors.success,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            No findings detected — aircraft passed inspection.
          </div>
        ) : (
          flight.findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))
        )}
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: HistoricalFinding }) {
  const sev = severityColors(finding.severity);

  return (
    <div
      style={{
        padding: 14,
        borderRadius: radius.md,
        border: finding.reoccurrence
          ? "1px solid rgba(247,201,72,0.32)"
          : `1px solid ${colors.border}`,
        background: finding.reoccurrence
          ? "rgba(247,201,72,0.04)"
          : "rgba(255,255,255,0.03)",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{finding.type}</span>
          <span style={{ ...pillStyle, background: sev.bg, borderColor: sev.border, color: sev.text }}>
            <span style={{ ...dot, background: sev.dot }} />
            {finding.severity}
          </span>
          {finding.reoccurrence && (
            <span
              style={{
                ...pillStyle,
                background: "rgba(247,201,72,0.10)",
                borderColor: "rgba(247,201,72,0.32)",
                color: colors.warning,
                fontWeight: 700,
              }}
            >
              Recurring Zone
            </span>
          )}
          {finding.resolved ? (
            <span
              style={{
                ...pillStyle,
                background: "rgba(61,220,151,0.10)",
                borderColor: "rgba(61,220,151,0.25)",
                color: colors.success,
              }}
            >
              Resolved
            </span>
          ) : (
            <span
              style={{
                ...pillStyle,
                background: "rgba(255,92,115,0.08)",
                borderColor: "rgba(255,92,115,0.25)",
                color: colors.danger,
              }}
            >
              Open
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 12,
            fontFamily: typography.monoFamily,
            color: colors.textSecondary,
          }}
        >
          {finding.id}
        </span>
      </div>

      {/* Detail row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <MiniDetail label="Zone" value={finding.zone} />
        <MiniDetail label="Confidence" value={`${Math.round(finding.confidence * 100)}%`} />
        <MiniDetail label="Time" value={finding.timestamp} />
      </div>

      {/* Notes */}
      <div
        style={{
          padding: "8px 10px",
          borderRadius: radius.sm,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${colors.border}`,
          fontSize: 12,
          color: colors.textSecondary,
          lineHeight: 1.55,
        }}
      >
        {finding.notes}
      </div>
    </div>
  );
}

function MiniDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{value}</div>
    </div>
  );
}

function MetaPair({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: highlight ? colors.warning : colors.textPrimary,
          fontFamily: mono ? typography.monoFamily : typography.fontFamily,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function FlightStatusBadge({ status }: { status: FlightRecord["status"] }) {
  const map = {
    Completed: { bg: "rgba(61,220,151,0.10)", border: "rgba(61,220,151,0.25)", color: colors.success },
    "Pending Review": { bg: "rgba(247,201,72,0.10)", border: "rgba(247,201,72,0.25)", color: colors.warning },
    Archived: { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", color: colors.textSecondary },
  } as const;
  const s = map[status];
  return (
    <span style={{ ...pillStyle, background: s.bg, borderColor: s.border, color: s.color }}>
      {status}
    </span>
  );
}

function AircraftBadge({ aircraft }: { aircraft: Aircraft }) {
  const statusColors = {
    Active: { bg: "rgba(61,220,151,0.10)", border: "rgba(61,220,151,0.25)", dot: colors.success },
    "In Maintenance": { bg: "rgba(247,201,72,0.10)", border: "rgba(247,201,72,0.25)", dot: colors.warning },
    Grounded: { bg: "rgba(255,92,115,0.10)", border: "rgba(255,92,115,0.25)", dot: colors.danger },
  } as const;
  const s = statusColors[aircraft.status];
  return (
    <span style={{ ...pillStyle, background: s.bg, borderColor: s.border, fontSize: 13, padding: "5px 12px" }}>
      <span style={{ ...dot, background: s.dot }} />
      {aircraft.registration}
    </span>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "info" | "danger" | "success";
}) {
  const map = {
    info: { bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.25)", color: colors.primary },
    danger: { bg: "rgba(255,92,115,0.10)", border: "rgba(255,92,115,0.28)", color: colors.danger },
    success: { bg: "rgba(61,220,151,0.10)", border: "rgba(61,220,151,0.25)", color: colors.success },
  } as const;
  const s = map[tone];
  return (
    <div
      style={{
        padding: "6px 14px",
        borderRadius: radius.pill,
        background: s.bg,
        border: `1px solid ${s.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        minWidth: 72,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{value}</div>
      <div style={{ fontSize: 11, color: colors.textSecondary, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: colors.textPrimary }}>{title}</div>
      <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3 }}>{sub}</div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityColors(sev: Severity) {
  if (sev === "High")
    return { bg: "rgba(255,92,115,0.10)", border: "rgba(255,92,115,0.28)", dot: colors.danger, text: colors.danger };
  if (sev === "Medium")
    return { bg: "rgba(247,201,72,0.10)", border: "rgba(247,201,72,0.28)", dot: colors.warning, text: colors.warning };
  return { bg: "rgba(61,220,151,0.10)", border: "rgba(61,220,151,0.28)", dot: colors.success, text: colors.success };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: spacing.lg,
  flexWrap: "wrap",
};

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

const twoPanel: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1.4fr",
  gap: 20,
  alignItems: "start",
};

const leftPanel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const rightPanel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "3px 9px",
  borderRadius: radius.pill,
  fontSize: 12,
  fontWeight: 600,
  border: `1px solid ${colors.border}`,
  whiteSpace: "nowrap",
};

const dot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  display: "inline-block",
  flexShrink: 0,
};
